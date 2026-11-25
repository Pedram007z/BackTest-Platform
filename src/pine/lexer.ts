/**
 * Pine Script lexer: source text → tokens, with Python-style INDENT / DEDENT / NL tokens.
 *
 * Pine's layout rules: a block is indented by 4 spaces (or a tab) more than the line that opens it.
 * A statement may wrap onto following lines when the wrapped lines are indented by a number of spaces
 * that is not a multiple of 4, when the line ends with an operator or a comma, or (more lenient than
 * TradingView) while a bracket is open.
 */

export class PineError extends Error {
  constructor(
    message: string,
    public line = 0,
    public col = 0,
    /** bar_index where a runtime error happened */
    public bar?: number,
  ) {
    super(message);
  }
}

export type TokType = 'num' | 'str' | 'color' | 'id' | 'kw' | 'op' | 'nl' | 'indent' | 'dedent' | 'eof';

export interface Tok {
  t: TokType;
  v: string;
  line: number;
  col: number;
  /** number literal written without a decimal point or exponent */
  int?: boolean;
}

export const KEYWORDS = new Set(['and', 'or', 'not', 'if', 'else', 'for', 'while', 'switch', 'var', 'varip', 'break', 'continue', 'true', 'false', 'import', 'export']);
const OPS2 = [':=', '+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '=>'];
const OPS1 = '+-*/%<>=?:,()[].';
/** A line ending with one of these continues on the next (more indented) line. */
const CONTINUES = new Set(['+', '-', '*', '/', '%', '<', '>', '<=', '>=', '==', '!=', '?', ':', ',', 'and', 'or', 'not', '=', ':=', '+=', '-=', '*=', '/=', '%=']);

interface PhysLine {
  indent: number;
  toks: Tok[];
}

function lexLine(src: string, line: number): PhysLine {
  let i = 0;
  let indent = 0;
  while (i < src.length && (src[i] === ' ' || src[i] === '\t')) {
    indent += src[i] === '\t' ? 4 : 1;
    i++;
  }
  const toks: Tok[] = [];
  const isIdStart = (c: string) => /[A-Za-z_]/.test(c);
  const isId = (c: string) => /[A-Za-z0-9_]/.test(c);
  while (i < src.length) {
    const c = src[i];
    const col = i + 1;
    if (c === ' ' || c === '\t' || c === '\r') {
      i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') break;
    if (c === '"' || c === "'") {
      let j = i + 1;
      let s = '';
      while (j < src.length && src[j] !== c) {
        if (src[j] === '\\' && j + 1 < src.length) {
          const e = src[j + 1];
          s += e === 'n' ? '\n' : e === 't' ? '\t' : e;
          j += 2;
          continue;
        }
        s += src[j++];
      }
      if (j >= src.length) throw new PineError('رشته‌ی متنی بسته نشده است (علامت نقل‌قول پایانی جا افتاده).', line, col);
      toks.push({ t: 'str', v: s, line, col });
      i = j + 1;
      continue;
    }
    if (c === '#') {
      const m = /^#([0-9a-fA-F]{8}|[0-9a-fA-F]{6})(?![0-9a-zA-Z_])/.exec(src.slice(i));
      if (!m) throw new PineError('رنگ باید به شکل ‎#RRGGBB‎ یا ‎#RRGGBBAA‎ نوشته شود.', line, col);
      toks.push({ t: 'color', v: m[1], line, col });
      i += m[0].length;
      continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i))!;
      toks.push({ t: 'num', v: m[0], line, col, int: !/[.eE]/.test(m[0]) });
      i += m[0].length;
      continue;
    }
    if (isIdStart(c)) {
      let j = i + 1;
      while (j < src.length && isId(src[j])) j++;
      const w = src.slice(i, j);
      toks.push({ t: KEYWORDS.has(w) ? 'kw' : 'id', v: w, line, col });
      i = j;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (OPS2.includes(two)) {
      toks.push({ t: 'op', v: two, line, col });
      i += 2;
      continue;
    }
    if (OPS1.includes(c)) {
      toks.push({ t: 'op', v: c, line, col });
      i++;
      continue;
    }
    throw new PineError(`نویسه‌ی «${c}» در Pine Script معتبر نیست.`, line, col);
  }
  return { indent, toks };
}

export interface LexResult {
  tokens: Tok[];
  version?: number;
}

export function lex(source: string): LexResult {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let version: number | undefined;
  const logical: { indent: number; toks: Tok[]; line: number }[] = [];
  let cur: { indent: number; toks: Tok[]; line: number } | null = null;
  let depth = 0;
  lines.forEach((text, n) => {
    const vm = /^\s*\/\/\s*@version\s*=\s*(\d+)/.exec(text);
    if (vm) version = Number(vm[1]);
    const { indent, toks } = lexLine(text, n + 1);
    if (!toks.length) return;
    const last = cur?.toks[cur.toks.length - 1];
    const continues = cur && (depth > 0 || (indent > cur.indent && (indent % 4 !== 0 || (!!last && (last.t === 'op' || last.t === 'kw') && CONTINUES.has(last.v)))));
    if (continues && cur) cur.toks.push(...toks);
    else {
      if (cur) logical.push(cur);
      cur = { indent, toks: [...toks], line: n + 1 };
      depth = 0;
    }
    for (const t of toks) {
      if (t.t !== 'op') continue;
      if (t.v === '(' || t.v === '[') depth++;
      else if (t.v === ')' || t.v === ']') depth = Math.max(0, depth - 1);
    }
  });
  if (cur) logical.push(cur);

  const out: Tok[] = [];
  const stack = [0];
  for (const l of logical) {
    const first = l.toks[0];
    const top = stack[stack.length - 1];
    if (l.indent > top) {
      stack.push(l.indent);
      out.push({ t: 'indent', v: '', line: first.line, col: 1 });
    } else if (l.indent < top) {
      while (l.indent < stack[stack.length - 1]) {
        stack.pop();
        out.push({ t: 'dedent', v: '', line: first.line, col: 1 });
      }
      if (l.indent !== stack[stack.length - 1])
        throw new PineError('تورفتگی این خط با بلوک‌های بالاتر هم‌خوانی ندارد (بلوک‌ها با ۴ فاصله یا یک Tab تورفته می‌شوند).', first.line, 1);
    }
    out.push(...l.toks);
    const lastTok = l.toks[l.toks.length - 1];
    out.push({ t: 'nl', v: '', line: lastTok.line, col: lastTok.col + lastTok.v.length });
  }
  const endLine = lines.length;
  while (stack.length > 1) {
    stack.pop();
    out.push({ t: 'dedent', v: '', line: endLine, col: 1 });
  }
  out.push({ t: 'eof', v: '', line: endLine, col: 1 });
  return { tokens: out, version };
}
