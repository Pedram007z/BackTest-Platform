import { W, Shape } from './gen.mjs';
const u = W;
export function arc(s, cx, cy, R, r, a0, a1, cls) { s.band(cx, cy, R, r, a0, a1, cls); }
// diagonal stroke along a centreline, ends cut horizontally, perpendicular weight u
function slantU(s, xa, ya, xb, yb, cls, uu = u) {
  const th = Math.atan2(Math.abs(yb - ya), Math.abs(xb - xa)); const hw = (uu / 2) / Math.sin(th);
  s.poly([[xa - hw, ya], [xa + hw, ya], [xb + hw, yb], [xb - hw, yb]], cls);
}
export function latinWordmark(o = {}) {
  const u = o.u ?? W;
  const X = o.X ?? 4.8 * u, A = o.A ?? 7.0 * u, R = X / 2, r = R - u, cut = (o.cut ?? 1) * u;
  const s = new Shape();
  const stem = (x, h, cls) => s.poly([[x, 0], [x + u, 0], [x + u, h], [x, h - cut]], cls); // top cut, high right
  const slant = (s2, xa, ya, xb, yb, cls) => slantU(s2, xa, ya, xb, yb, cls, u);
  const ring = (cx, cls) => arc(s, cx, R, R, r, 0, 360, cls);
  let x = 0; const sb = o.sb ?? 0.5 * u;
  const G = {
    b(cls) { stem(x, A, cls); ring(x + R, cls); x += X; },
    a(cls) { ring(x + R, cls); stem(x + X - u, X, cls); x += X; },
    c(cls) { arc(s, x + R, R, R, r, 42, 318, cls); x += R + R * Math.cos(42 * Math.PI / 180); },
    k(cls) { stem(x, A, cls); slant(s, x + 0.72 * u, X * 0.28, x + 0.62 * X, X, cls); slant(s, x + 1.05 * u, X * 0.62, x + 0.68 * X, 0, cls); x += 0.68 * X + 0.62 * u; },
    t(cls) { x += 0.85 * u; stem(x, A * 0.87, cls); s.rect(x - 0.85 * u, X - u, x + 1.95 * u, X, cls); x += 1.95 * u; },
    e(cls) { arc(s, x + R, R, R, r, 0, 318, cls); s.rect(x + u * 0.5, R - u / 2, x + X, R + u / 2, cls); x += X; },
    s(cls) {
      const ro = (X + u) / 4, ri = ro - u, cx = x + ro;
      arc(s, cx, X - ro, ro, ri, 32, 270, cls); arc(s, cx, ro, ro, ri, 90, -148, cls); x += 2 * ro;
    },
    l(cls) { stem(x, A, cls); x += u; },
  };
  const word = o.word ?? 'backtestlab';
  const kern = o.kern ?? { 'ck': -0.1, 'kt': -0.35, 'te': -0.25, 'st': -0.1, 'tl': 0.1, 'la': 0, 'ta': -0.25, 'et': -0.15 };
  [...word].forEach((ch, i) => {
    if (i) x += sb * 2 + (kern[word[i - 1] + ch] ?? 0) * u;
    G[ch](i >= (o.accFrom ?? 8) ? 'acc' : 'ink');
  });
  return s;
}
