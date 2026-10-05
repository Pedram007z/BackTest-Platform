// Construction drawing for the heavy lettering: letters on a grid with guide lines. Prints guide positions.
import fs from 'node:fs';
import { heavyFa, heavyRender, H } from './heavy.mjs';
import { latinWordmark } from './latin.mjs';
import { EN_OPTS } from './brand.mjs';
const f = (n) => +n.toFixed(1), WIDTH = 1440;
const C = { ink: '#EEEBF6', acc: '#A58BFF' };
function block({ body, vbw, vbh, top }, y0, fitW, guides, step) {
  const k = fitW / vbw, x0 = (WIDTH - fitW) / 2, toY = (yu) => y0 + (top - yu) * k;
  let g = '<g stroke="#2A2440" stroke-width="1">';
  for (let gx = x0 + fitW; gx >= x0 - 1; gx -= step * k) g += `<line x1="${f(gx)}" y1="${f(y0 - 20)}" x2="${f(gx)}" y2="${f(y0 + vbh * k + 20)}"/>`;
  for (let gy = y0 + vbh * k; gy >= y0 - 1; gy -= step * k) g += `<line x1="${f(x0 - 20)}" y1="${f(gy)}" x2="${f(x0 + fitW + 20)}" y2="${f(gy)}"/>`;
  g += '</g>';
  const labels = [];
  for (const [yu, name] of guides) { const y = toY(yu); g += `<line x1="0" y1="${f(y)}" x2="${WIDTH}" y2="${f(y)}" stroke="#7C5CFF" stroke-width="1.5" stroke-dasharray="6 6"/>`; labels.push([name, f(y)]); }
  g += `<g transform="translate(${f(x0)} ${f(y0)}) scale(${+k.toFixed(5)})">${body}</g>`;
  return { g, labels, bottom: y0 + vbh * k };
}
const fr = heavyRender(heavyFa(), C);
const top = H.A; // heavyRender's top edge is the ascender
const fa = block({ ...fr, top }, 60, 1240, [[0, 'baseline'], [H.B, 'base stroke'], [0.8 * H.T, 'س teeth'], [H.T, 'teeth'], [H.A, 'ascender']], H.S / 2);
const sh = latinWordmark(EN_OPTS); const { d, w, h } = sh.paths(0);
const enBody = Object.entries(d).map(([c, v]) => `<path fill="${C[c]}" stroke="${C[c]}" stroke-width="5" stroke-linejoin="round" d="${v}"/>`).join('');
const en = block({ body: enBody, vbw: w, vbh: h, top: h }, fa.bottom + 130, 760, [[0, 'baseline'], [EN_OPTS.X, 'x-height'], [EN_OPTS.A, 'ascender']], EN_OPTS.u / 2);
const Hh = Math.ceil(en.bottom + 40);
fs.writeFileSync(process.argv[2] || '../svg/construction.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${Hh}" width="${WIDTH}" height="${Hh}">${fa.g}${en.g}</svg>`);
console.log(JSON.stringify({ H: Hh, fa: fa.labels, en: en.labels }));
