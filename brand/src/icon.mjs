// Refined BacktestLab icon: the original idea (two bars + play) on one baseline, rising into the play triangle.
// Coordinates are fractions of the tile size, y down.
const f = (n) => +n.toFixed(2);
export const GEOM = { b: 0.092, g: 0.046, h1: 0.235, h2: 0.335, th: 0.43, tw: 0.37, r: 0.032 };
export function glyph(S, { ox = 0, oy = 0, c1, c2, c3, o1 = 1, o2 = 1, o3 = 1 } = {}) {
  const { b, g, h1, h2, th, tw, r } = GEOM;
  const total = b + g + b + g + tw;
  const x0 = (1 - total) / 2 + 0.01, yb = (1 + th) / 2 - 0.004;
  const P = (x, y) => `${f(ox + x * S)} ${f(oy + y * S)}`;
  // bars: top cut at the lettering's gentle slant, high on the right
  const bar = (x, h) => `M${P(x, yb)}L${P(x + b, yb)}L${P(x + b, yb - h)}L${P(x, yb - h + b * 0.23)}Z`;
  const xa = x0, xb = x0 + b + g, xt = x0 + 2 * (b + g);
  // play triangle with rounded corners
  const V = [[xt, yb - th], [xt + tw, yb - th / 2], [xt, yb]];
  let d = '';
  for (let i = 0; i < 3; i++) {
    const p = V[(i + 2) % 3], v = V[i], n = V[(i + 1) % 3];
    const l1 = Math.hypot(p[0] - v[0], p[1] - v[1]), l2 = Math.hypot(n[0] - v[0], n[1] - v[1]);
    const k = r * 1.7;
    const a = [v[0] + (p[0] - v[0]) * k / l1, v[1] + (p[1] - v[1]) * k / l1];
    const c = [v[0] + (n[0] - v[0]) * k / l2, v[1] + (n[1] - v[1]) * k / l2];
    d += `${i ? 'L' : 'M'}${P(...a)}Q${P(...v)} ${P(...c)}`;
  }
  d += 'Z';
  const op = (o) => (o < 1 ? ` fill-opacity="${o}"` : '');
  return `<path fill="${c1}"${op(o1)} d="${bar(xa, h1)}"/><path fill="${c2}"${op(o2)} d="${bar(xb, h2)}"/><path fill="${c3}"${op(o3)} d="${d}"/>`;
}
let n = 0;
export function iconTile(S, { mono = null, x = 0, y = 0 } = {}) {
  const id = 'bi' + (n++);
  if (mono) {
    return { defs: '', g: `<g transform="translate(${f(x)} ${f(y)})"><rect width="${S}" height="${S}" rx="${f(S * 0.235)}" fill="${mono.bg}"/>${glyph(S, { c1: mono.fg, c2: mono.fg, c3: mono.fg, o1: 0.5, o2: 0.75 })}</g>` };
  }
  const defs = `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9273FF"/><stop offset="1" stop-color="#5430E6"/></linearGradient><radialGradient id="${id}h" cx="0.22" cy="0.12" r="0.75"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`;
  return {
    defs,
    g: `<g transform="translate(${f(x)} ${f(y)})"><rect width="${S}" height="${S}" rx="${f(S * 0.235)}" fill="url(#${id})"/><rect width="${S}" height="${S}" rx="${f(S * 0.235)}" fill="url(#${id}h)"/>${glyph(S, { c1: '#FFFFFF', c2: '#FFFFFF', c3: '#FFFFFF', o1: 0.55, o2: 0.8 })}</g>`,
  };
}
