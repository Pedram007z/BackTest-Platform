import { PineError, lex, type Tok } from './lexer';

/**
 * Pine Script parser: tokens → syntax tree.
 *
 * Statements: declarations (`x = 1`, `var float x = na`, `[a, b] = f()`), reassignments (`x := 1`,
 * `x += 1`), functions (`f(a, b = 2) => …`, one line or a block; `method`), user types (`type`),
 * `if` / `else if` / `else`, `for … to … by`, `for … in`, `while`, `switch`, `break`, `continue`.
 * `if` and `switch` are also expressions. Expressions follow Pine's precedence: `?:`, `or`, `and`,
 * `== !=`, `< <= > >=`, `+ -`, `* / %`, unary `+ - not`, then calls, history `[]` and members.
 */

export type Kind =
  | 'num'
  | 'str'
  | 'color'
  | 'bool'
  | 'name'
  | 'member'
  | 'call'
  | 'mcall'
  | 'index'
  | 'unary'
  | 'binary'
  | 'ternary'
  | 'tuple'
  | 'if'
  | 'switch'
  | 'decl'
  | 'tdecl'
  | 'assign'
  | 'func'
  | 'type'
  | 'for'
  | 'forin'
  | 'while'
  | 'break'
  | 'continue'
  | 'expr';

export interface Node {
  k: Kind;
  id: number;
  line: number;
  col: number;
  [key: string]: any;
}

export interface Arg {
  name?: string;
  value: Node;
}

export interface Param {
  name: string;
  type?: string;
  def?: Node;
}

export interface Program {
  body: Node[];
  version?: number;
  /** number of nodes (ids are 0 … count-1) */
  count: number;
}

const ASSIGN_OPS = new Set([':=', '+=', '-=', '*=', '/=', '%=']);
const QUALIFIERS = new Set(['const', 'simple', 'series', 'input']);

class Parser {
  i = 0;
  ids = 0;
  /** the last thing parsed was an indented block (no NL token follows it) */
  blockEnded = false;

  constructor(private toks: Tok[]) {}

  peek(o = 0): Tok {
    return this.toks[Math.min(this.i + o, this.toks.length - 1)];
  }
  next(): Tok {
    return this.toks[this.i++];
  }
  isOp(v: string, o = 0) {
    const t = this.peek(o);
    return t.t === 'op' && t.v === v;
  }
  isKw(v: string, o = 0) {
    const t = this.peek(o);
    return t.t === 'kw' && t.v === v;
  }
  isId(v?: string, o = 0) {
    const t = this.peek(o);
    return t.t === 'id' && (v === undefined || t.v === v);
  }
  eatOp(v: string) {
    if (!this.isOp(v)) return false;
    this.i++;
    return true;
  }
  err(msg: string, tok: Tok = this.peek()) {
    return new PineError(msg, tok.line, tok.col);
  }
  expectOp(v: string, msg?: string) {
    if (!this.isOp(v)) throw this.err(msg ?? `اینجا «${v}» لازم است${this.found()}.`);
    return this.next();
  }
  expectId(msg: string) {
    if (!this.isId()) throw this.err(msg);
    return this.next();
  }
  found() {
    const t = this.peek();
    if (t.t === 'nl') return ' ولی خط تمام شد';
    if (t.t === 'eof') return ' ولی کد تمام شد';
    if (t.t === 'indent' || t.t === 'dedent') return '';
    return ` ولی «${t.v}» آمده است`;
  }
  node(k: Kind, tok: Tok, props: Record<string, unknown> = {}): Node {
    return { k, id: this.ids++, line: tok.line, col: tok.col, ...props };
  }

  // ---------- statements ----------

  program(): Node[] {
    const body: Node[] = [];
    while (this.peek().t !== 'eof') {
      if (this.peek().t === 'nl') {
        this.i++;
        continue;
      }
      if (this.peek().t === 'indent') throw this.err('این خط بی‌دلیل تورفته است؛ تورفتگی فقط برای بدنه‌ی if، for، تابع و … است.');
      if (this.peek().t === 'dedent') {
        this.i++;
        continue;
      }
      body.push(...this.line());
    }
    return body;
  }

  block(): Node[] {
    if (this.peek().t !== 'nl') throw this.err(`بعد از این عبارت باید به خط بعد رفت و بدنه را با تورفتگی نوشت${this.found()}.`);
    this.i++;
    if (this.peek().t !== 'indent') throw this.err('بدنه‌ی این بلوک خالی است یا تورفتگی ندارد (۴ فاصله یا یک Tab).');
    this.i++;
    const body: Node[] = [];
    while (this.peek().t !== 'dedent' && this.peek().t !== 'eof') {
      if (this.peek().t === 'nl') {
        this.i++;
        continue;
      }
      if (this.peek().t === 'indent') throw this.err('تورفتگی این خط بیشتر از بلوک خودش است.');
      body.push(...this.line());
    }
    if (this.peek().t === 'dedent') this.i++;
    this.blockEnded = true;
    return body;
  }

  /** One line: statements separated by commas. */
  line(): Node[] {
    const out = [this.statement()];
    while (!this.blockEnded && this.eatOp(',')) out.push(this.statement());
    if (!this.blockEnded) {
      const t = this.peek();
      if (t.t === 'nl') this.i++;
      else if (t.t !== 'eof' && t.t !== 'dedent') throw this.err(`انتظار پایان خط می‌رفت${this.found()}.`);
    }
    return out;
  }

  statement(): Node {
    this.blockEnded = false;
    const t = this.peek();
    if (t.t === 'kw') {
      switch (t.v) {
        case 'if':
          return this.ifNode();
        case 'for':
          return this.forNode();
        case 'while': {
          this.next();
          const cond = this.expr();
          return this.node('while', t, { cond, body: this.block() });
        }
        case 'switch':
          return this.switchNode();
        case 'break':
        case 'continue':
          this.next();
          return this.node(t.v, t);
        case 'import':
          throw this.err('کتابخانه‌ها (import) در این نسخه پشتیبانی نمی‌شوند؛ کد کتابخانه را در خود اسکریپت بنویسید.');
        case 'export':
          this.next();
          return this.statement();
        case 'var':
        case 'varip':
          this.next();
          return this.decl(t.v, t);
      }
    }
    if (t.t === 'id') {
      if (t.v === 'method' && this.isId(undefined, 1) && this.isOp('(', 2)) {
        this.next();
        return this.funcDef(true);
      }
      if (t.v === 'type' && this.isId(undefined, 1) && this.peek(2).t === 'nl') return this.typeDef();
      if (this.isOp('(', 1) && this.isFuncDef()) return this.funcDef(false);
      const save = this.i;
      if (this.typedDeclAhead()) return this.decl('', t);
      this.i = save;
      if (this.isOp('=', 1)) return this.decl('', t);
    }
    if (this.isOp('[') && this.tupleDeclAhead()) return this.tupleDecl();
    const e = this.expr();
    const op = this.peek();
    if (op.t === 'op' && ASSIGN_OPS.has(op.v)) {
      if (e.k !== 'name' && e.k !== 'member') throw this.err('سمت چپ «:=» باید نام یک متغیر باشد.', op);
      this.next();
      return this.node('assign', t, { target: e, op: op.v, value: this.expr() });
    }
    if (this.isOp('=')) throw this.err('برای تغییر مقدار متغیری که قبلاً تعریف شده از «:=» استفاده کنید.');
    return this.node('expr', t, { e });
  }

  /** `name(…) =>` ahead? */
  isFuncDef(): boolean {
    let j = this.i + 1;
    let depth = 0;
    for (; j < this.toks.length; j++) {
      const t = this.toks[j];
      if (t.t === 'nl' || t.t === 'eof') return false;
      if (t.t !== 'op') continue;
      if (t.v === '(' || t.v === '[') depth++;
      else if (t.v === ')' || t.v === ']') {
        depth--;
        if (depth === 0) break;
      }
    }
    const after = this.toks[j + 1];
    return !!after && after.t === 'op' && after.v === '=>';
  }

  /** `[a, b] =` ahead? */
  tupleDeclAhead(): boolean {
    let j = this.i + 1;
    while (j < this.toks.length) {
      const t = this.toks[j];
      if (t.t === 'id') j++;
      else return false;
      const s = this.toks[j];
      if (s.t === 'op' && s.v === ',') {
        j++;
        continue;
      }
      if (s.t === 'op' && s.v === ']') {
        const eq = this.toks[j + 1];
        return eq.t === 'op' && eq.v === '=';
      }
      return false;
    }
    return false;
  }

  /** `[qualifier] type name =` ahead? Leaves the position unchanged. */
  typedDeclAhead(): boolean {
    const save = this.i;
    try {
      if (this.isId() && QUALIFIERS.has(this.peek().v) && this.isId(undefined, 1)) this.i++;
      if (!this.isId()) return false;
      this.typeName();
      return this.isId() && this.isOp('=', 1);
    } catch {
      return false;
    } finally {
      this.i = save;
    }
  }

  typeName(): string {
    let s = this.expectId('نام نوع لازم است.').v;
    while (this.isOp('.') && this.isId(undefined, 1)) {
      this.i++;
      s += '.' + this.next().v;
    }
    if (this.isOp('<')) {
      this.i++;
      const parts = [this.typeName()];
      while (this.eatOp(',')) parts.push(this.typeName());
      this.expectOp('>');
      s += `<${parts.join(',')}>`;
    }
    if (this.isOp('[') && this.isOp(']', 1)) {
      this.i += 2;
      s += '[]';
    }
    return s;
  }

  decl(mode: string, startTok: Tok): Node {
    let type: string | undefined;
    if (this.isId() && QUALIFIERS.has(this.peek().v) && this.isId(undefined, 1)) this.i++;
    if (this.isId() && !this.isOp('=', 1)) type = this.typeName();
    const nameTok = this.expectId('نام متغیر لازم است.');
    this.expectOp('=', `بعد از نام متغیر «=» لازم است${this.found()}.`);
    return this.node('decl', startTok, { name: nameTok.v, mode, type, value: this.expr() });
  }

  tupleDecl(): Node {
    const t = this.next();
    const names: string[] = [];
    while (!this.isOp(']')) {
      names.push(this.expectId('نام متغیر لازم است.').v);
      if (!this.eatOp(',')) break;
    }
    this.expectOp(']');
    this.expectOp('=');
    return this.node('tdecl', t, { names, value: this.expr() });
  }

  funcDef(isMethod: boolean): Node {
    const nameTok = this.next();
    this.expectOp('(');
    const params: Param[] = [];
    while (!this.isOp(')')) {
      const words: string[] = [];
      while (this.isId()) {
        if (this.isOp('<', 1)) {
          words.push(this.typeName());
          continue;
        }
        words.push(this.next().v);
        if (this.isOp('[') && this.isOp(']', 1)) {
          this.i += 2;
          words[words.length - 1] += '[]';
        }
      }
      if (!words.length) throw this.err(`نام پارامتر لازم است${this.found()}.`);
      const name = words[words.length - 1];
      const type =
        words
          .filter((w) => !QUALIFIERS.has(w))
          .slice(0, -1)
          .join(' ') || undefined;
      let def: Node | undefined;
      if (this.eatOp('=')) def = this.expr();
      params.push({ name, type, def });
      if (!this.eatOp(',')) break;
    }
    this.expectOp(')');
    this.expectOp('=>');
    const body = this.peek().t === 'nl' ? this.block() : this.expr();
    return this.node('func', nameTok, { name: nameTok.v, params, body, isMethod, isBlock: Array.isArray(body) });
  }

  typeDef(): Node {
    const t = this.next();
    const name = this.next().v;
    const fields: { name: string; type: string; def?: Node }[] = [];
    if (this.peek().t !== 'nl') throw this.err('بعد از نام نوع باید به خط بعد رفت.');
    this.i++;
    if (this.peek().t !== 'indent') throw this.err('فیلدهای نوع باید با تورفتگی نوشته شوند.');
    this.i++;
    while (this.peek().t !== 'dedent' && this.peek().t !== 'eof') {
      if (this.peek().t === 'nl') {
        this.i++;
        continue;
      }
      if (this.isKw('varip') || this.isKw('var')) this.i++;
      const type = this.typeName();
      const fname = this.expectId('نام فیلد لازم است.').v;
      let def: Node | undefined;
      if (this.eatOp('=')) def = this.expr();
      fields.push({ name: fname, type, def });
      if (this.peek().t === 'nl') this.i++;
    }
    if (this.peek().t === 'dedent') this.i++;
    this.blockEnded = true;
    return this.node('type', t, { name, fields });
  }

  ifNode(): Node {
    const t = this.next();
    const cond = this.expr();
    const then = this.block();
    let els: Node[] | null = null;
    if (this.isKw('else')) {
      this.next();
      els = this.isKw('if') ? [this.ifNode()] : this.block();
    }
    this.blockEnded = true;
    return this.node('if', t, { cond, then, els });
  }

  forNode(): Node {
    const t = this.next();
    if (this.isOp('[')) {
      this.next();
      const a = this.expectId('نام متغیر لازم است.').v;
      this.expectOp(',');
      const b = this.expectId('نام متغیر لازم است.').v;
      this.expectOp(']');
      if (!this.isId('in')) throw this.err('اینجا «in» لازم است.');
      this.next();
      const arr = this.expr();
      return this.node('forin', t, { index: a, item: b, arr, body: this.block() });
    }
    const v = this.expectId('نام متغیر حلقه لازم است.').v;
    if (this.isId('in')) {
      this.next();
      const arr = this.expr();
      return this.node('forin', t, { item: v, arr, body: this.block() });
    }
    this.expectOp('=', 'در حلقه‌ی for بعد از نام متغیر «=» لازم است.');
    const from = this.expr();
    if (!this.isId('to')) throw this.err(`در حلقه‌ی for کلمه‌ی «to» لازم است${this.found()}.`);
    this.next();
    const to = this.expr();
    let by: Node | null = null;
    if (this.isId('by')) {
      this.next();
      by = this.expr();
    }
    return this.node('for', t, { name: v, from, to, by, body: this.block() });
  }

  switchNode(): Node {
    const t = this.next();
    const subject = this.peek().t === 'nl' ? null : this.expr();
    if (this.peek().t !== 'nl') throw this.err('بعد از switch باید به خط بعد رفت.');
    this.i++;
    if (this.peek().t !== 'indent') throw this.err('حالت‌های switch باید با تورفتگی نوشته شوند.');
    this.i++;
    const cases: { cond: Node | null; body: Node[] }[] = [];
    while (this.peek().t !== 'dedent' && this.peek().t !== 'eof') {
      if (this.peek().t === 'nl') {
        this.i++;
        continue;
      }
      let cond: Node | null = null;
      if (!this.isOp('=>')) cond = this.expr();
      const arrow = this.expectOp('=>', `در switch بعد از هر حالت «=>» لازم است${this.found()}.`);
      let body: Node[];
      this.blockEnded = false;
      if (this.peek().t === 'nl') body = this.block();
      else {
        const e = this.expr();
        body = [this.node('expr', arrow, { e })];
        if (!this.blockEnded && this.peek().t === 'nl') this.i++;
      }
      cases.push({ cond, body });
    }
    if (this.peek().t === 'dedent') this.i++;
    this.blockEnded = true;
    return this.node('switch', t, { subject, cases });
  }

  // ---------- expressions ----------

  expr(): Node {
    const c = this.or();
    if (this.isOp('?')) {
      const t = this.next();
      const a = this.expr();
      this.expectOp(':', `در عبارت شرطی سه‌تایی بعد از مقدار اول «:» لازم است${this.found()}.`);
      const b = this.expr();
      return this.node('ternary', t, { c, a, b });
    }
    return c;
  }

  or(): Node {
    let l = this.and();
    while (this.isKw('or')) {
      const t = this.next();
      l = this.node('binary', t, { op: 'or', l, r: this.and() });
    }
    return l;
  }

  and(): Node {
    let l = this.eq();
    while (this.isKw('and')) {
      const t = this.next();
      l = this.node('binary', t, { op: 'and', l, r: this.eq() });
    }
    return l;
  }

  eq(): Node {
    let l = this.cmp();
    while (this.isOp('==') || this.isOp('!=')) {
      const t = this.next();
      l = this.node('binary', t, { op: t.v, l, r: this.cmp() });
    }
    return l;
  }

  cmp(): Node {
    let l = this.add();
    while (this.isOp('<') || this.isOp('>') || this.isOp('<=') || this.isOp('>=')) {
      const t = this.next();
      l = this.node('binary', t, { op: t.v, l, r: this.add() });
    }
    return l;
  }

  add(): Node {
    let l = this.mul();
    while (this.isOp('+') || this.isOp('-')) {
      const t = this.next();
      l = this.node('binary', t, { op: t.v, l, r: this.mul() });
    }
    return l;
  }

  mul(): Node {
    let l = this.unary();
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) {
      const t = this.next();
      l = this.node('binary', t, { op: t.v, l, r: this.unary() });
    }
    return l;
  }

  unary(): Node {
    if (this.isOp('-') || this.isOp('+') || this.isKw('not')) {
      const t = this.next();
      return this.node('unary', t, { op: t.v, e: this.unary() });
    }
    return this.postfix();
  }

  args(): Arg[] {
    this.expectOp('(');
    const out: Arg[] = [];
    while (!this.isOp(')')) {
      if (this.isId() && this.isOp('=', 1)) {
        const name = this.next().v;
        this.next();
        out.push({ name, value: this.expr() });
      } else out.push({ value: this.expr() });
      if (!this.eatOp(',')) break;
    }
    this.expectOp(')', `آرگومان‌های تابع با «)» بسته نشده‌اند${this.found()}.`);
    return out;
  }

  postfix(): Node {
    let e = this.primary();
    for (;;) {
      if (this.isOp('[')) {
        const t = this.next();
        const index = this.expr();
        this.expectOp(']');
        e = this.node('index', t, { target: e, index });
        continue;
      }
      if (this.isOp('(')) {
        const t = this.peek();
        if (e.k !== 'name') throw this.err('فقط تابع‌ها را می‌توان صدا زد.', t);
        const callee = e;
        e = this.node('call', t, { callee: callee.name, args: this.args(), typeArgs: callee.typeArgs });
        e.line = callee.line;
        e.col = callee.col;
        continue;
      }
      if (this.isOp('.') && this.isId(undefined, 1)) {
        const t = this.next();
        const name = this.next().v;
        if (this.isOp('(')) e = this.node('mcall', t, { obj: e, name, args: this.args() });
        else e = this.node('member', t, { obj: e, name });
        continue;
      }
      return e;
    }
  }

  primary(): Node {
    const t = this.peek();
    switch (t.t) {
      case 'num':
        this.next();
        return this.node('num', t, { v: Number(t.v), int: t.int });
      case 'str':
        this.next();
        return this.node('str', t, { v: t.v });
      case 'color':
        this.next();
        return this.node('color', t, { v: t.v });
      case 'kw':
        if (t.v === 'true' || t.v === 'false') {
          this.next();
          return this.node('bool', t, { v: t.v === 'true' });
        }
        if (t.v === 'if') return this.ifNode();
        if (t.v === 'switch') return this.switchNode();
        break;
      case 'id': {
        this.next();
        let name = t.v;
        while (this.isOp('.') && this.isId(undefined, 1)) {
          this.next();
          name += '.' + this.next().v;
        }
        const n = this.node('name', t, { name });
        // generic call: array.new<float>(…)
        if (this.isOp('<')) {
          const save = this.i;
          try {
            this.next();
            const types = [this.typeName()];
            while (this.eatOp(',')) types.push(this.typeName());
            this.expectOp('>');
            if (this.isOp('(')) {
              n.typeArgs = types;
              return n;
            }
          } catch {
            /* not a generic call */
          }
          this.i = save;
        }
        return n;
      }
      case 'op':
        if (t.v === '(') {
          this.next();
          const e = this.expr();
          this.expectOp(')', `پرانتز بسته نشده است${this.found()}.`);
          return e;
        }
        if (t.v === '[') {
          this.next();
          const items: Node[] = [];
          while (!this.isOp(']')) {
            items.push(this.expr());
            if (!this.eatOp(',')) break;
          }
          this.expectOp(']');
          return this.node('tuple', t, { items });
        }
        break;
    }
    if (t.t === 'nl' || t.t === 'eof') throw this.err('عبارت ناقص است: خط پیش از کامل شدن تمام شد.');
    if (t.t === 'indent') throw this.err('تورفتگی بی‌جا: این خط ادامه‌ی خط قبل نیست.');
    throw this.err(`«${t.v}» اینجا معنا ندارد.`);
  }
}

export function parse(source: string): Program {
  const { tokens, version } = lex(source);
  const p = new Parser(tokens);
  const body = p.program();
  return { body, version, count: p.ids };
}
