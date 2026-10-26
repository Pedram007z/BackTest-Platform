// Composes the BacktestLab logo system into standalone SVGs.
import fs from 'node:fs';
import { heavyFa, heavyRender, H as HV } from './heavy.mjs';
import { latinWordmark } from './latin.mjs';
export const EN_OPTS = { u: 30, X: 100, A: 150, cut: 0.25, sb: 12, kern: { ck: 0.05, kt: -0.05, te: -0.1, st: 0, tl: 0.1, ta: -0.1, et: 0 } };
const f = (n) => +n.toFixed(2);

export const THEMES = {
  dark: { ink: '#EEEBF6', acc: '#A58BFF', bg: '#0D0B14' },
  light: { ink: '#17131F', acc: '#6A46FF', bg: '#FFFFFF' },
  white: { ink: '#FFFFFF', acc: '#FFFFFF', bg: '#6A46FF' },
  black: { ink: '#000000', acc: '#000000', bg: '#FFFFFF' },
};
// Persian heavy lettering placed at a given height
function placeFa(colors, height) {
  const r = heavyRender(heavyFa(), colors, height); const k = height / r.vbh;
  return { w: r.w, h: height, vbh0: r.vbh, g: (x, y) => `<g transform="translate(${f(x)} ${f(y)}) scale(${+k.toFixed(5)})">${r.body}</g>` };
}
// Latin lettering (filled outlines, corners softened with a thin same-colour round-join stroke)
function placeEn(colors, height) {
  const { d, w, h } = latinWordmark(EN_OPTS).paths(0); const k = height / h;
  const body = Object.entries(d).map(([c, v]) => `<path fill="${colors[c]}" stroke="${colors[c]}" stroke-width="5" stroke-linejoin="round" d="${v}"/>`).join('');
  return { w: w * k, h: height, g: (x, y) => `<g transform="translate(${f(x)} ${f(y)}) scale(${+k.toFixed(5)})">${body}</g>` };
}
import { iconTile, glyph } from './icon.mjs';
export function tile(size, { mono = null } = {}) {
  const t = iconTile(size, { mono });
  return { w: size, h: size, defs: t.defs, g: (ox, oy) => `<g transform="translate(${f(ox)} ${f(oy)})">${t.g}</g>` };
}
function doc(w, h, defs, body, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}" height="${f(h)}">${defs ? `<defs>${defs}</defs>` : ''}${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}</svg>`;
}
export const files = {};
for (const [tn, th] of Object.entries(THEMES)) {
  const mono = tn === 'white' ? { fg: '#6A46FF', bg: '#FFFFFF' } : tn === 'black' ? { fg: '#FFFFFF', bg: '#000000' } : null;
  // horizontal Persian lockup: wordmark on the left, tile on the right (RTL)
  {
    const fa = placeFa(th, 120); const band = 120 * HV.A / fa.vbh0; const t = tile(Math.round(band), { mono });
    const gap = 30, W2 = fa.w + gap + t.w, H2 = 120;
    files[`logo-fa-${tn}.svg`] = doc(W2, H2, t.defs, fa.g(0, 0) + t.g(fa.w + gap, 0), null);
  }
  // English lockup: tile on the left
  {
    const en = placeEn(th, 72); const t = tile(72, { mono });
    const gap = 22, W2 = t.w + gap + en.w, H2 = 72;
    files[`logo-en-${tn}.svg`] = doc(W2, H2, t.defs, t.g(0, 0) + en.g(t.w + gap, 0), null);
  }
  // stacked: tile, Persian, English
  {
    const t = tile(150, { mono }); const fa = placeFa(th, 118); const en = placeEn(th, 34);
    const Wd = Math.max(fa.w, en.w) + 40, gy1 = 34, gy2 = 26;
    const H2 = t.h + gy1 + fa.h + gy2 + en.h;
    files[`logo-stacked-${tn}.svg`] = doc(Wd, H2, t.defs, t.g((Wd - t.w) / 2, 0) + fa.g((Wd - fa.w) / 2, t.h + gy1) + en.g((Wd - en.w) / 2, t.h + gy1 + fa.h + gy2), null);
  }
  files[`wordmark-fa-${tn}.svg`] = (() => { const p = placeFa(th, 160); return doc(p.w, p.h, '', p.g(0, 0), null); })();
  files[`wordmark-en-${tn}.svg`] = (() => { const p = placeEn(th, 100); return doc(p.w, p.h, '', p.g(0, 0), null); })();
}
files['app-icon.svg'] = (() => { const t = tile(1024); return doc(1024, 1024, t.defs, t.g(0, 0), null); })();
files['instagram-profile.svg'] = (() => {
  const g = `<linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9273FF"/><stop offset="1" stop-color="#5430E6"/></linearGradient>`;
  return doc(1080, 1080, g, `<rect width="1080" height="1080" fill="url(#ig)"/>` + glyph(1080 * 0.8, { ox: 108, oy: 108, c1: '#FFFFFF', c2: '#FFFFFF', c3: '#FFFFFF', o1: 0.55, o2: 0.8 }), null);
})();
files['favicon.svg'] = (() => { const t = tile(64); return doc(64, 64, t.defs, t.g(0, 0), null); })();

if (process.argv[1].endsWith('brand.mjs')) {
  const out = process.argv[2] || 'out';
  fs.mkdirSync(out, { recursive: true });
  for (const [n, s] of Object.entries(files)) fs.writeFileSync(`${out}/${n}`, s);
}
