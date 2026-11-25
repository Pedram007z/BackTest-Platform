import clsx from 'clsx';
import { forwardRef, useImperativeHandle, useMemo, useRef, type KeyboardEvent } from 'react';

/**
 * A Pine Script editor: a plain textarea over a coloured copy of the text, with line numbers and the
 * error line marked. Tab / Shift+Tab indent by 4 spaces, Enter keeps the indent (one more after `=>`,
 * `if`, `for` …), Ctrl+/ comments lines, Ctrl+Enter runs and Ctrl+S saves. Edits go through the
 * browser's own editing, so undo and redo work as usual.
 */

export interface CodeEditorHandle {
  /** put the caret at the start of a line (1-based) and scroll to it */
  jumpTo(line: number, col?: number): void;
  focus(): void;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  errorLine?: number;
  onRun?: () => void;
  onSave?: () => void;
  className?: string;
  label?: string;
}

const LINE_H = 20;
const PAD = 10;
const KEYWORDS = new Set([
  'if',
  'else',
  'for',
  'to',
  'by',
  'in',
  'while',
  'switch',
  'var',
  'varip',
  'and',
  'or',
  'not',
  'true',
  'false',
  'na',
  'break',
  'continue',
  'import',
  'export',
  'method',
  'type',
]);
const TYPES = new Set(['int', 'float', 'bool', 'string', 'color', 'line', 'label', 'box', 'table', 'array', 'map', 'matrix', 'series', 'simple', 'const']);
const VARS = new Set([
  'open',
  'high',
  'low',
  'close',
  'volume',
  'hl2',
  'hlc3',
  'ohlc4',
  'hlcc4',
  'time',
  'time_close',
  'bar_index',
  'last_bar_index',
  'year',
  'month',
  'dayofmonth',
  'dayofweek',
  'hour',
  'minute',
  'second',
]);
const TOKEN =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|(#[0-9a-fA-F]{6,8}\b)|(\b\d+\.?\d*(?:[eE][+-]?\d+)?\b|\.\d+\b)|([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)(\s*\()?|(:=|=>|==|!=|<=|>=|[+\-*/%<>=?:])/g;

const esc = (s: string) => s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));

/** One line of code as coloured HTML. */
function highlight(line: string): string {
  let out = '';
  let last = 0;
  TOKEN.lastIndex = 0;
  for (let m = TOKEN.exec(line); m; m = TOKEN.exec(line)) {
    out += esc(line.slice(last, m.index));
    last = m.index + m[0].length;
    let cls = '';
    let text = m[0];
    if (m[1]) cls = 'pc';
    else if (m[2]) cls = 'ps';
    else if (m[3]) cls = 'pk';
    else if (m[4]) cls = 'pn';
    else if (m[5]) {
      const w = m[5];
      text = w;
      cls = KEYWORDS.has(w) ? 'pw' : TYPES.has(w) ? 'pt' : VARS.has(w) ? 'pv' : m[6] ? 'pf' : w.includes('.') ? 'pv' : '';
      out += cls ? `<span class="${cls}">${esc(text)}</span>` : esc(text);
      if (m[6]) out += esc(m[6]);
      continue;
    } else cls = 'po';
    out += `<span class="${cls}">${esc(text)}</span>`;
    if (m[0].length === 0) TOKEN.lastIndex++;
  }
  return out + esc(line.slice(last));
}

const OPENS_BLOCK = /(=>\s*$)|^\s*(if|else|for|while|switch|type)\b|^\s*\w+\s*=\s*(if|switch)\b/;

export const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor({ value, onChange, errorLine, onRun, onSave, className, label = 'کد Pine Script' }, ref) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const pre = useRef<HTMLDivElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => value.split('\n'), [value]);
  const html = useMemo(() => lines.map(highlight), [lines]);

  useImperativeHandle(ref, () => ({
    jumpTo(line, col = 1) {
      const t = ta.current;
      if (!t) return;
      const before = lines.slice(0, Math.max(0, line - 1)).join('\n').length + (line > 1 ? 1 : 0);
      t.focus();
      t.setSelectionRange(before + col - 1, before + col - 1);
      t.scrollTop = Math.max(0, (line - 4) * LINE_H);
      sync();
    },
    focus() {
      ta.current?.focus();
    },
  }));

  function sync() {
    const t = ta.current;
    if (!t) return;
    if (pre.current) {
      pre.current.style.transform = `translate(${-t.scrollLeft}px, ${-t.scrollTop}px)`;
    }
    if (gutter.current) gutter.current.style.transform = `translateY(${-t.scrollTop}px)`;
  }

  /** Replace [start, end) with text, through the browser so undo keeps working. */
  function insert(text: string, start: number, end: number, caretStart?: number, caretEnd?: number) {
    const t = ta.current!;
    t.setSelectionRange(start, end);
    const ok = document.execCommand?.('insertText', false, text);
    if (!ok) {
      t.setRangeText(text, start, end, 'end');
      onChange(t.value);
    }
    if (caretStart !== undefined) t.setSelectionRange(caretStart, caretEnd ?? caretStart);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    const t = e.currentTarget;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'Enter') {
      e.preventDefault();
      onRun?.();
      return;
    }
    if (mod && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      onSave?.();
      return;
    }
    const { selectionStart: s, selectionEnd: en, value: v } = t;
    const lineStart = v.lastIndexOf('\n', s - 1) + 1;
    if (e.key === 'Tab') {
      e.preventDefault();
      if (s === en && !e.shiftKey) {
        insert('    ', s, en);
        return;
      }
      // indent / outdent every selected line
      const blockEnd = v.indexOf('\n', en - (en > s && v[en - 1] === '\n' ? 1 : 0));
      const end = blockEnd < 0 ? v.length : blockEnd;
      const block = v.slice(lineStart, end).split('\n');
      const next = block.map((l) => (e.shiftKey ? l.replace(/^( {1,4}|\t)/, '') : '    ' + l)).join('\n');
      insert(next, lineStart, end, lineStart, lineStart + next.length);
      return;
    }
    if (mod && e.key === '/') {
      e.preventDefault();
      const blockEnd = v.indexOf('\n', en);
      const end = blockEnd < 0 ? v.length : blockEnd;
      const block = v.slice(lineStart, end).split('\n');
      const all = block.every((l) => /^\s*\/\//.test(l) || !l.trim());
      const next = block.map((l) => (all ? l.replace(/^(\s*)\/\/ ?/, '$1') : l.trim() ? `// ${l}` : l)).join('\n');
      insert(next, lineStart, end, lineStart, lineStart + next.length);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !mod && s === en) {
      const line = v.slice(lineStart, s);
      const indent = /^[ \t]*/.exec(line)![0];
      const more = OPENS_BLOCK.test(line) ? '    ' : '';
      e.preventDefault();
      insert('\n' + indent + more, s, en);
    }
  }

  return (
    <div className={clsx('pine-editor relative flex overflow-hidden rounded-xl border border-line bg-[rgb(var(--bg))] font-mono text-[13px]', className)} dir="ltr">
      <div className="relative w-11 shrink-0 select-none overflow-hidden border-e border-line/60 bg-raised/40 text-right text-[11px] text-faint" aria-hidden>
        <div ref={gutter} style={{ paddingTop: PAD }}>
          {lines.map((_, i) => (
            <div key={i} className={clsx('pe-2', errorLine === i + 1 && 'bg-loss/20 font-bold text-loss')} style={{ height: LINE_H, lineHeight: `${LINE_H}px` }}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div ref={pre} className="pointer-events-none absolute left-0 top-0 whitespace-pre" style={{ padding: PAD, tabSize: 4 }} aria-hidden>
          {html.map((h, i) => (
            <div
              key={i}
              className={clsx(errorLine === i + 1 && 'bg-loss/15')}
              style={{ height: LINE_H, lineHeight: `${LINE_H}px`, minWidth: '100%' }}
              dangerouslySetInnerHTML={{ __html: h || ' ' }}
            />
          ))}
        </div>
        <textarea
          ref={ta}
          aria-label={label}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          wrap="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={sync}
          onKeyDown={onKeyDown}
          className="absolute inset-0 h-full w-full resize-none whitespace-pre bg-transparent text-transparent outline-none selection:bg-accent/30"
          style={{ padding: PAD, lineHeight: `${LINE_H}px`, tabSize: 4, caretColor: 'rgb(var(--ink))', fontFamily: 'inherit', fontSize: 'inherit' }}
        />
      </div>
    </div>
  );
});
