// Outline helper for the Latin lettering. y is UP while building; paths() flips to SVG coordinates.
import fs from 'node:fs';
export const W = 20;
const f = (n) => +n.toFixed(2);
function pointsOf(p) {
  if (!p.arc) return p.pts;
  const { cx, cy, R, r, a0, a1 } = p.arc; const out = [];
  for (let i = 0; i <= 24; i++) { const a = (a0 + (a1 - a0) * i / 24) * Math.PI / 180; out.push([cx + R * Math.cos(a), cy + R * Math.sin(a)], [cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return out;
}

export class Shape {
  constructor() { this.parts = []; }           // {d: [[x,y]...], cls}
  poly(pts, cls = 'ink') {
    // same winding for every outline, so overlaps merge instead of cutting holes (nonzero fill)
    let a = 0; for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0; }
    this.parts.push({ pts: a < 0 ? [...pts].reverse() : pts, cls }); return this;
  }
  // annular band between angles a0..a1 (degrees, y up), drawn with true arcs
  band(cx, cy, R, r, a0, a1, cls = 'ink') {
    if (a1 < a0) [a0, a1] = [a1, a0];
    const n = Math.ceil((a1 - a0) / 179.9);
    for (let i = 0; i < n; i++) this.parts.push({ arc: { cx, cy, R, r, a0: a0 + (a1 - a0) * i / n, a1: a0 + (a1 - a0) * (i + 1) / n }, cls });
    return this;
  }
  rect(x0, y0, x1, y1, cls) { return this.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], cls); }
  diamond(cx, cy, d, cls) { const r = d / 2; return this.poly([[cx, cy + r], [cx + r, cy], [cx, cy - r], [cx - r, cy]], cls); }
  bbox() {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of this.parts) for (const [x, y] of pointsOf(p)) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }
  // path data per class, flipped (y down), offset so bbox starts at 0,0
  paths(pad = 0) {
    const b = this.bbox(); const out = {};
    for (const p of this.parts) {
      const P = ([x, y]) => `${f(x - b.x0 + pad)} ${f(b.y1 - y + pad)}`;
      let d;
      if (p.arc) {
        const { cx, cy, R, r, a0, a1 } = p.arc; const at = (rad, a) => [cx + rad * Math.cos(a * Math.PI / 180), cy + rad * Math.sin(a * Math.PI / 180)];
        d = `M${P(at(R, a0))}A${f(R)} ${f(R)} 0 0 0 ${P(at(R, a1))}L${P(at(r, a1))}A${f(r)} ${f(r)} 0 0 1 ${P(at(r, a0))}Z`;
      } else d = 'M' + p.pts.map(P).join('L') + 'Z';
      (out[p.cls] ||= []).push(d);
    }
    for (const k in out) out[k] = out[k].join('');
    return { d: out, w: b.w + 2 * pad, h: b.h + 2 * pad };
  }
}
