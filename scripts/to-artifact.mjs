// Turns the single-file build into an HTML fragment (no doctype/html/head/body wrappers) for the hosted preview.
// Only the outer wrapper tags are removed, so the inlined bundle is never split.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-artifact/index.html', 'utf8');
const scriptStart = html.indexOf('<script');
const head = html.slice(0, scriptStart);
const rest = html.slice(scriptStart);

const cleanedHead = head
  .replace(/<!doctype html>/i, '')
  .replace(/<html[^>]*>/i, '')
  .replace(/<head>/i, '')
  .replace(/<meta[^>]*>/gi, '');

// wrapper tags only appear after the bundle; strip the last occurrences
const stripLast = (s, tag) => {
  const i = s.lastIndexOf(tag);
  return i === -1 ? s : s.slice(0, i) + s.slice(i + tag.length);
};
let tail = rest;
for (const tag of ['</html>', '</body>', '<body>', '</head>']) tail = stripLast(tail, tag);

const out = (cleanedHead + tail).trim() + '\n';
writeFileSync('dist-artifact/backtest-dashboard.html', out);
console.log(`dist-artifact/backtest-dashboard.html  ${(out.length / 1024).toFixed(0)} KB`);
