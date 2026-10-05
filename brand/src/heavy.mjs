// Heavy display lettering for «بک‌تست‌لب», in the style of the reference: heavy strokes, tops cut at a gentle
// slant (higher on the right), large rounded outer corners on each word's base, slanted dash-shaped dots.
// y is UP while building, baseline 0, x decreasing to the left (RTL).
const f = (n) => +n.toFixed(2);
export const H = { S: 44, B: 46, T: 102, A: 172, d: 10, R: 44, r: 4, ri: 3, gap: 44 };

function roundPoly(pts) {
  const n = pts.length; let d = '';
  for (let i = 0; i < n; i++) {
    const [vx, vy, r] = pts[i], [px, py] = pts[(i - 1 + n) % n], [nx, ny] = pts[(i + 1) % n];
    const lp = Math.hypot(px - vx, py - vy), ln = Math.hypot(nx - vx, ny - vy);
    const rr = Math.min(r, lp / 2, ln / 2);
    const a = [vx + (px - vx) * rr / lp, vy + (py - vy) * rr / lp], c = [vx + (nx - vx) * rr / ln, vy + (ny - vy) * rr / ln];
    const k = 0.5523, c1 = [a[0] + (vx - a[0]) * k, a[1] + (vy - a[1]) * k], c2 = [c[0] + (vx - c[0]) * k, c[1] + (vy - c[1]) * k];
    d.length; d += `${i ? 'L' : 'M'}@${a}C@${c1} @${c2} @${c}`;
  }
  return d + 'Z';
}
function dash(cx, ybottom, w, h, slant, r) {
  return [[cx - w / 2 + slant / 2, ybottom + h, r], [cx + w / 2 + slant / 2, ybottom + h, r], [cx + w / 2 - slant / 2, ybottom, r], [cx - w / 2 - slant / 2, ybottom, r]];
}

export function heavyFa(o = {}) {
  const P = { ...H, ...o }; const { S, B, T, A, d, R, r, ri, gap } = P;
  const shapes = [];   // {pts, cls}
  const add = (pts, cls = 'ink') => shapes.push({ pts, cls });
  const dot1 = (cx, cls) => add(dash(cx, -0.36 * S - 0.82 * S, 1.3 * S, 0.82 * S, 0.42 * S, r), cls);
  const dot2 = (cx, yb, cls) => add(dash(cx, yb, 2.05 * S, 0.82 * S, 0.42 * S, r), cls);

  // ---- بک
  let x0 = 0;
  const c1 = P.c1 ?? 2.45 * S, xk = x0 - S - c1 - S;
  const m = P.kafSlope ?? 0.36, Ls = P.kafLen ?? S + c1 * 0.86, th = 0.8 * S, sl = 0.42 * th;
  const yTL = A - m * Ls, yMeet = A - th - m * (Ls - S);
  add([[x0, T, r], [x0, 0, R], [xk, 0, R], [xk, yTL, r], [xk + Ls, A, r], [xk + Ls - sl, A - th - m * sl, r], [xk + S, yMeet, ri], [xk + S, B, ri], [x0 - S, B, ri], [x0 - S, T - d, r]]);
  dot1(x0 - S - c1 * 0.45);

  // ---- تست
  x0 = xk - gap;
  const St = 0.86 * S, Ts = 0.8 * T, g0 = 0.55 * S, gs = 0.5 * S, c2 = P.c2 ?? 2.3 * S, dt = d * St / S;
  const t1R = x0 - S - g0, t1L = t1R - St, t2R = t1L - gs, t2L = t2R - St, t3R = t2L - gs, t3L = t3R - St;
  const tipR = t3L - c2, xL = tipR - S;
  const tooth = (L, Rr) => [[L, B, ri], [L, Ts - dt, r], [Rr, Ts, r], [Rr, B, ri]];
  add([[x0, T, r], [x0, 0, R], [xL, 0, R], [xL, T - d, r], [tipR, T, r], [tipR, B, ri],
    ...tooth(t3L, t3R), ...tooth(t2L, t2R), ...tooth(t1L, t1R), [x0 - S, B, ri], [x0 - S, T - d, r]]);
  dot2(x0 - S / 2 - 6, T + 0.34 * S);
  dot2((tipR + t3L) / 2, T + 0.34 * S);

  // ---- لب
  x0 = xL - gap;
  const c3 = P.c3 ?? 3.2 * S, xb = x0 - S - c3 - S;
  add([[x0, A, r], [x0, 0, R], [xb, 0, R], [xb, T - d, r], [xb + S, T, r], [xb + S, B, ri], [x0 - S, B, ri], [x0 - S, A - d, r]], 'acc');
  dot1(xb + S + c3 * 0.42, 'acc');
  return shapes;
}

export function heavyRender(shapes, colors, height) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of shapes) for (const [x, y] of s.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const W = x1 - x0, Hh = y1 - y0;
  const by = {};
  for (const s of shapes) {
    const d = roundPoly(s.pts).replace(/@(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => `${f(+x - x0)} ${f(y1 - +y)}`);
    (by[s.cls] ||= []).push(d);
  }
  const body = Object.entries(by).map(([c, ds]) => `<path fill="${colors[c]}" d="${ds.join('')}"/>`).join('');
  const k = height ? height / Hh : 1;
  return { body, vbw: W, vbh: Hh, w: W * k, h: Hh * k, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(Hh)}" width="${f(W * k)}" height="${f(Hh * k)}">${body}</svg>` };
}
