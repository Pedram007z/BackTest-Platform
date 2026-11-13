// cv1 · a series of reel covers, inspired by the cover grid of a Persian trading page the user shared (ticktrade.fa):
// what works there is kept — a two-line question (white, then red or green), one character with a clear expression,
// one bold glowing symbol, a dark cinematic trading room with depth, everything inside the profile grid's 3:4 crop.
// What's ours: the BacktestLab trader (violet hoodie, lime drawstrings and backpack, the logo on his chest, from k22),
// the symbols, the rooms and the type. window.render(i) draws cover i (1080×1920) and window.N is how many there are.
const W = 1080, H = 1920, CX = 540;
const INK = '#05080C', WHITE = '#FFFFFF', RED = '#FF4D5E', GREEN = '#33E08A', LIME = '#C6F24E', VIO = '#6C47FF', AMB = '#FFB020';
const cv = document.getElementById('c').getContext('2d');
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn, "Noto Color Emoji"`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) { const g = o.g ?? cv; g.save(); g.font = FONT(size, o.w ?? 900); g.fillStyle = col; g.textAlign = o.align ?? 'center'; g.textBaseline = 'middle'; g.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl'); if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.gb ?? 30; } g.fillText(s, x, y); g.restore(); }
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rr(x, y, w, h, r, fill, stroke, lw = 3, g = cv) { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4, g = cv) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
function ell(x, y, rx, ry, fill, stroke, lw = 3, rot = 0) { cv.beginPath(); cv.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function line(pts, col, lw, g = cv) { g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore(); }
function poly(pts, fill, stroke, lw = 3) { cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.closePath(); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.lineJoin = 'round'; cv.stroke(); } }
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
const glow = (col, blur, fn) => { cv.save(); cv.shadowColor = col; cv.shadowBlur = blur; fn(); cv.restore(); };
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }
const mkC = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; };

// ---------- the room: monitors with charts, a city window, a lamp, a glossy desk (drawn sharp, then blurred) ----------
function room(o) {
  const [c, g] = mkC(), tint = o.tint ?? '#0E7A63';
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, o.top ?? '#061019'); gr.addColorStop(1, o.bottom ?? '#05080D'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // a big window with the city at night
  const wx = o.window === 'right' ? 600 : 0; g.fillStyle = '#081627'; g.fillRect(wx, 260, 480, 900);
  for (let i = 0; i < 160; i++) { const x = wx + rnd(i * 3.1 + o.seed) * 480, y = 600 + rnd(i * 5.7 + o.seed) * 560; g.fillStyle = rnd(i) > 0.7 ? 'rgba(255,190,110,0.9)' : 'rgba(140,190,255,0.8)'; g.fillRect(x, y, 4 + rnd(i * 9) * 6, 3 + rnd(i * 4) * 5); }
  g.fillStyle = '#03070C'; for (let k = 0; k <= 3; k++) g.fillRect(wx + k * 160 - 6, 260, 12, 900); g.fillRect(wx, 640, 480, 12); g.fillRect(wx, 255, 480, 14);
  // shelves and plants at the edges
  g.fillStyle = '#0A0F14'; g.fillRect(o.window === 'right' ? 0 : 900, 0, 180, H);
  const plant = (x, y, s) => { for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + (rnd(i * 3 + x) - 0.5) * 2.6, L = (120 + rnd(i * 7 + x) * 180) * s; g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.fillStyle = i % 2 ? '#0F2A1E' : '#13382A'; g.beginPath(); g.ellipse(0, -L / 2, 20 * s, L / 2, 0, 0, Math.PI * 2); g.fill(); g.restore(); } g.fillStyle = '#16120F'; g.fillRect(x - 46 * s, y, 92 * s, 90 * s); };
  plant(o.window === 'right' ? 90 : 990, 1220, 1.2); plant(o.window === 'right' ? 70 : 1010, 620, 0.8);
  // monitors with candles
  const mon = (x, y, w, h, s) => { g.fillStyle = '#05080C'; g.fillRect(x - 10, y - 10, w + 20, h + 20); g.fillStyle = '#071018'; g.fillRect(x, y, w, h);
    let p = y + h * 0.55; for (let i = 0; i < 26; i++) { const up = rnd(s * 50 + i) > 0.45, b = (rnd(s * 70 + i) * 0.5 + 0.2) * h * 0.18, cx2 = x + 14 + i * (w - 28) / 26, col = up ? '#2DE38A' : '#FF4D5E';
      const o2 = p, cl2 = up ? p - b : p + b; g.fillStyle = col; g.fillRect(cx2 - 4, Math.min(o2, cl2), 8, Math.abs(cl2 - o2) + 2); g.fillRect(cx2 - 1, Math.min(o2, cl2) - 10, 2, Math.abs(cl2 - o2) + 22); p = cl2 + (rnd(s * 90 + i) - 0.5) * 10; p = Math.max(y + 20, Math.min(y + h - 20, p)); } };
  const mx = o.window === 'right' ? 160 : 520; mon(mx, 820, 380, 230, o.seed + 1); mon(mx + 120, 1080, 300, 200, o.seed + 2); mon(mx - 300 > 0 ? mx - 280 : mx + 300, 760, 240, 160, o.seed + 3);
  // the lamp's warm pool, the room's tint
  const lx = o.window === 'right' ? 880 : 200; gr = g.createRadialGradient(lx, 1300, 10, lx, 1300, 520); gr.addColorStop(0, 'rgba(255,170,80,0.55)'); gr.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1A140F'; g.beginPath(); g.moveTo(lx - 70, 1260); g.lineTo(lx + 70, 1260); g.lineTo(lx + 30, 1200); g.lineTo(lx - 30, 1200); g.closePath(); g.fill(); g.fillRect(lx - 5, 1260, 10, 200);
  gr = g.createRadialGradient(CX, 900, 100, CX, 900, 1000); gr.addColorStop(0, rgba(tint, 0.35)); gr.addColorStop(1, rgba(tint, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // the desk: glossy, with the glows reflected
  gr = g.createLinearGradient(0, 1430, 0, H); gr.addColorStop(0, '#11161C'); gr.addColorStop(1, '#030507'); g.fillStyle = gr; g.fillRect(0, 1430, W, H - 1430);
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 1430, W, 3);
  gr = g.createRadialGradient(CX, 1440, 20, CX, 1440, 700); gr.addColorStop(0, rgba(tint, 0.25)); gr.addColorStop(1, rgba(tint, 0)); g.fillStyle = gr; g.fillRect(0, 1430, W, 500);
  // blur it all (depth of field), then darken the edges
  const [c2, g2] = mkC(); g2.filter = 'blur(9px)'; g2.drawImage(c, 0, 0); g2.filter = 'none';
  g2.drawImage(c, 0, 1430, W, H - 1430, 0, 1430, W, H - 1430);   // the desk stays sharp
  gr = g2.createRadialGradient(CX, 900, 420, CX, 900, 1250); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.7)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, H);
  return c2;
}

// ---------- the trader (BacktestLab's character, from k22): waist up, behind the desk ----------
const SKIN = '#F2C8A0', SKIN2 = '#DDA67D', HAIR = '#2B1D16', HOOD = '#6C47FF', HOOD2 = '#4B2FCC';
/** The trader with his neck at (x, y). o: face, look [x, y], armL / armR: pose names, hold: a function drawing what he holds, rim: rim light colour, scale. */
function trader(x, y, o) {
  cv.save(); cv.translate(x, y); cv.scale(o.scale ?? 1, o.scale ?? 1);
  const rim = o.rim ?? '#3DF5C5';
  // the body
  const body = () => { cv.beginPath(); cv.moveTo(-90, -6); cv.bezierCurveTo(-190, 0, -255, 50, -275, 150); cv.lineTo(-300, 720); cv.lineTo(300, 720); cv.lineTo(275, 150); cv.bezierCurveTo(255, 50, 190, 0, 90, -6); cv.closePath(); };
  glow(rgba(rim, 0.55), 40, () => { body(); cv.fillStyle = HOOD; cv.fill(); });
  cv.save(); body(); cv.clip(); let gr = cv.createLinearGradient(-300, 0, 300, 0); gr.addColorStop(0, rgba(rim, 0.35)); gr.addColorStop(0.15, 'rgba(0,0,0,0)'); gr.addColorStop(0.75, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0.45)'); cv.fillStyle = gr; cv.fillRect(-310, -20, 620, 760);
  gr = cv.createLinearGradient(0, 0, 0, 500); gr.addColorStop(0, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)'); cv.fillStyle = gr; cv.fillRect(-310, -20, 620, 760); cv.restore();
  // the hood around the neck, the strings, the logo, the backpack strap
  cv.fillStyle = HOOD2; cv.beginPath(); cv.moveTo(-150, -10); cv.bezierCurveTo(-130, 90, 130, 90, 150, -10); cv.bezierCurveTo(100, 30, -100, 30, -150, -10); cv.fill();
  line([[-40, 40], [-46, 230]], LIME, 10); line([[40, 40], [46, 230]], LIME, 10); rr(-54, 222, 16, 34, 6, '#E9FF9E'); rr(38, 222, 16, 34, 6, '#E9FF9E');
  line([[-205, 40], [-160, 300]], LIME, 22); line([[-205, 40], [-160, 300]], 'rgba(0,0,0,0.2)', 6);
  if (IMG.icon) cv.drawImage(IMG.icon, 110, 150, 70, 70);
  // the neck and head
  rr(-48, -70, 96, 80, 30, SKIN2);
  const hy = -190, R = 128;
  [-1, 1].forEach((s) => { ell(s * 124, hy + 10, 26, 36, SKIN2); ell(s * 126, hy + 10, 13, 22, '#C98A63'); });
  glow(rgba(rim, 0.5), 30, () => circle(0, hy, R, SKIN));
  cv.save(); cv.beginPath(); cv.arc(0, hy, R, 0, Math.PI * 2); cv.clip(); gr = cv.createRadialGradient(-50, hy - 60, 20, 0, hy, R * 1.2); gr.addColorStop(0, 'rgba(255,240,225,0.5)'); gr.addColorStop(0.6, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(90,40,20,0.35)'); cv.fillStyle = gr; cv.fillRect(-R, hy - R, 2 * R, 2 * R);
  gr = cv.createLinearGradient(-R, 0, R, 0); gr.addColorStop(0, rgba(rim, 0.35)); gr.addColorStop(0.2, 'rgba(0,0,0,0)'); cv.fillStyle = gr; cv.fillRect(-R, hy - R, 2 * R, 2 * R); cv.restore();
  // hair: a full swept quiff
  cv.fillStyle = HAIR; cv.beginPath(); cv.moveTo(-128, hy - 10); cv.bezierCurveTo(-140, hy - 120, -60, hy - 160, 20, hy - 152); cv.bezierCurveTo(110, hy - 146, 150, hy - 90, 128, hy - 12); cv.bezierCurveTo(118, hy - 60, 96, hy - 80, 60, hy - 86); cv.bezierCurveTo(10, hy - 96, -50, hy - 92, -92, hy - 70); cv.bezierCurveTo(-112, hy - 56, -124, hy - 34, -128, hy - 10); cv.closePath(); cv.fill();
  cv.fillStyle = '#4A3328'; cv.beginPath(); cv.moveTo(-70, hy - 130); cv.bezierCurveTo(-10, hy - 158, 80, hy - 148, 110, hy - 110); cv.bezierCurveTo(60, hy - 128, 0, hy - 132, -70, hy - 130); cv.fill();
  face(0, hy, o.face ?? 'calm', o.look ?? [0, 0]);
  // arms and hands
  arm(-1, o.armL ?? 'down', o); arm(1, o.armR ?? 'down', o);
  cv.restore();
}
function face(x, y, f, look) {
  const [lx, ly] = look, big = f === 'shocked' ? 1.18 : 1;
  [-1, 1].forEach((s) => { const ex = x + s * 46, ey = y + 4; ell(ex, ey, 26 * big, 31 * big, WHITE);
    circle(ex + lx * 9, ey + ly * 9, 16 * big, '#3B2416'); circle(ex + lx * 9, ey + ly * 9, 8 * big, '#0B0705'); circle(ex + lx * 9 - 6, ey + ly * 9 - 7, 5.5, WHITE);
    cv.save(); cv.strokeStyle = '#2A1810'; cv.lineWidth = 6; cv.lineCap = 'round'; cv.beginPath(); cv.ellipse(ex, ey, 27 * big, 32 * big, 0, Math.PI * 1.1, Math.PI * 1.9); cv.stroke(); cv.restore(); });
  ell(x - 74, y + 46, 22, 13, 'rgba(255,120,120,0.22)'); ell(x + 74, y + 46, 22, 13, 'rgba(255,120,120,0.22)');
  const brow = (s, inY, outY) => line([[x + s * 22, y + inY], [x + s * 70, y + outY]], HAIR, 11);
  const my = y + 66;
  if (f === 'worried') { brow(-1, -58, -46); brow(1, -58, -46); line([[x - 26, my + 4], [x - 9, my - 4], [x + 9, my + 4], [x + 26, my - 4]], '#5A2C2C', 7); glow('rgba(120,200,255,0.6)', 10, () => ell(x + 108, y - 30, 11, 18, '#9AD8FF')); }
  else if (f === 'thinking') { brow(-1, -48, -50); brow(1, -64, -58); line([[x - 10, my], [x + 26, my - 6]], '#5A2C2C', 7); }
  else if (f === 'shocked') { brow(-1, -70, -64); brow(1, -70, -64); ell(x, my + 6, 18, 24, '#4A1E1E'); ell(x, my + 16, 10, 8, '#D96B6B'); }
  else if (f === 'sad') { brow(-1, -60, -44); brow(1, -60, -44); cv.save(); cv.strokeStyle = '#5A2C2C'; cv.lineWidth = 7; cv.lineCap = 'round'; cv.beginPath(); cv.arc(x, my + 22, 22, Math.PI * 1.15, Math.PI * 1.85); cv.stroke(); cv.restore(); }
  else if (f === 'smirk') { brow(-1, -50, -52); brow(1, -56, -60); cv.save(); cv.strokeStyle = '#5A2C2C'; cv.lineWidth = 7; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(x - 24, my); cv.quadraticCurveTo(x + 6, my + 12, x + 30, my - 10); cv.stroke(); cv.restore(); }
  else if (f === 'happy') { brow(-1, -54, -56); brow(1, -54, -56); cv.beginPath(); cv.arc(x, my - 6, 30, 0.1, Math.PI - 0.1); cv.closePath(); cv.fillStyle = '#4A1E1E'; cv.fill(); cv.save(); cv.clip(); ell(x, my + 22, 16, 10, '#D96B6B'); cv.restore(); }
  else { brow(-1, -52, -54); brow(1, -52, -54); cv.save(); cv.strokeStyle = '#5A2C2C'; cv.lineWidth = 7; cv.lineCap = 'round'; cv.beginPath(); cv.arc(x, my - 8, 20, 0.35, Math.PI - 0.35); cv.stroke(); cv.restore(); }
}
/** One arm: s = −1 his right (screen left), +1 his left (screen right). Poses: down, chin, palm (presenting, open palm up), point, hold, wave, fist. */
function arm(s, pose, o) {
  const sh = [s * 215, 70]; let el, hd, rot = 0;
  if (pose === 'chin') { el = [s * 210, 330]; hd = [s * 40, -60]; }
  else if (pose === 'palm') { el = [s * 290, 320]; hd = [s * 300, 210]; rot = s * 0.5; }
  else if (pose === 'point') { el = [s * 290, 300]; hd = [s * 330, 130]; rot = s * 0.9; }
  else if (pose === 'hold') { el = [s * 230, 330]; hd = [s * 70, 200]; }
  else if (pose === 'wave') { el = [s * 300, 220]; hd = [s * 330, -40]; }
  else { el = [s * 250, 400]; hd = [s * 230, 640]; }
  cv.save(); cv.lineCap = cv.lineJoin = 'round'; cv.strokeStyle = HOOD2; cv.lineWidth = 92; cv.beginPath(); cv.moveTo(...sh); cv.quadraticCurveTo(...el, ...hd); cv.stroke();
  cv.strokeStyle = HOOD; cv.lineWidth = 82; cv.stroke(); cv.restore();
  if (pose === 'down') return;
  cv.save(); cv.translate(...hd); cv.rotate(rot);
  if (pose === 'palm' || pose === 'wave') { ell(0, -14, 40, 44, SKIN, '#B7835E', 3); for (let i = 0; i < 4; i++) rr(-30 + i * 17, -88, 16, 40, 8, SKIN, '#B7835E', 2.5); ell(-s * 40, 6, 13, 22, SKIN, '#B7835E', 3, -s * 0.5); }
  else if (pose === 'point') { ell(0, 0, 40, 38, SKIN, '#B7835E', 3); rr(-10, -96, 22, 70, 11, SKIN, '#B7835E', 3); }
  else if (pose === 'chin') { ell(0, 0, 42, 34, SKIN, '#B7835E', 3); rr(-6, -60, 18, 46, 9, SKIN, '#B7835E', 2.5); }
  else ell(0, 0, 40, 36, SKIN, '#B7835E', 3);
  cv.restore();
  if (pose === 'hold' && o.hold) { cv.save(); cv.translate(hd[0], hd[1] - 40); o.hold(); cv.restore(); }
}

// ---------- the symbols ----------
function chart(x, y, w, h, up, col) { // a glowing candle chart drawn on glass
  rr(x, y, w, h, 24, 'rgba(10,20,26,0.55)', rgba(col, 0.5), 3);
  let p = y + h * (up ? 0.8 : 0.3); const n = 14;
  for (let i = 0; i < n; i++) { const r = rnd(i * 13 + x), b = (r * 0.5 + 0.4) * h * 0.09, isUp = up ? r > 0.28 : r < 0.25, c = isUp ? '#2DE38A' : '#FF4D5E', cx2 = x + 30 + i * (w - 60) / (n - 1), cl2 = isUp ? p - b : p + b;
    glow(c, 16, () => { rr(cx2 - 9, Math.min(p, cl2), 18, Math.abs(cl2 - p) + 3, 4, c); rr(cx2 - 2, Math.min(p, cl2) - 18, 4, Math.abs(cl2 - p) + 36, 2, c); }); p = cl2; }
}
function gate(x, y) { glow(LIME, 60, () => { rr(x - 160, y - 330, 40, 330, 12, '#2C2357'); rr(x + 120, y - 330, 40, 330, 12, '#2C2357'); }); rr(x - 175, y - 380, 350, 70, 24, VIO, WHITE, 4); txt('بررسی', x, y - 344, 44, WHITE);
  const gr = cv.createLinearGradient(0, y - 310, 0, y); gr.addColorStop(0, rgba(LIME, 0.65)); gr.addColorStop(1, rgba(LIME, 0.05)); cv.fillStyle = gr; cv.fillRect(x - 120, y - 310, 240, 310);
  for (let i = 0; i < 5; i++) glow(LIME, 14, () => line([[x - 115, y - 280 + i * 60], [x + 115, y - 280 + i * 60]], rgba(LIME, 0.9), 4)); }
function die(x, y, s, n, rot) { const P = { 1: [[0, 0]], 3: [[-1, -1], [0, 0], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  cv.save(); cv.translate(x, y); cv.rotate(rot); glow('rgba(255,255,255,0.35)', 40, () => rr(-s / 2, -s / 2 + s * 0.12, s, s, s * 0.22, '#B9B2C8')); rr(-s / 2, -s / 2, s, s, s * 0.22, '#FBF9FF'); P[n].forEach(([a, b]) => circle(a * s * 0.27, b * s * 0.27, s * 0.09, '#1A1424')); cv.restore(); }
function badge(s, x, y, size, bg, fg = WHITE, rot = 0) { cv.save(); cv.translate(x, y); cv.rotate(rot); const w = measure(s, size) + size * 0.9, h = size * 1.5; glow(rgba(bg, 0.8), 34, () => rr(-w / 2, -h / 2, w, h, h * 0.3, bg)); txt(s, 0, size * 0.05, size, fg, { dir: s.startsWith('+') || s.startsWith('−') ? 'ltr' : undefined }); cv.restore(); }
function accountBar(x, y) { glow(rgba(VIO, 0.7), 40, () => rr(x - 110, y - 420, 220, 440, 34, '#1B1533')); rr(x - 96, y - 406, 192, 412, 26, '#2A2245');
  glow(rgba(VIO, 0.9), 30, () => rr(x - 96, y - 200, 192, 206, 0, VIO)); cv.save(); cv.setLineDash([16, 12]); rr(x - 90, y - 400, 180, 196, 22, null, RED, 5); cv.restore(); txt('$۵۰۰', x, y + 56, 46, WHITE);
  badge('−۵۰٪', x - 230, y - 300, 64, RED, WHITE, -0.08); badge('+۱۰۰٪', x - 210, y - 110, 64, GREEN, INK, 0.06); }
function ring(x, y, r, f, col, label) { cv.save(); cv.lineCap = 'round'; cv.strokeStyle = 'rgba(255,255,255,0.12)'; cv.lineWidth = 30; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); cv.stroke(); glow(col, 30, () => { cv.strokeStyle = col; cv.beginPath(); cv.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); cv.stroke(); }); cv.restore(); txt(label, x, y + 6, r * 0.62, WHITE); }
function flames(x, y, w) { for (let i = 0; i < 9; i++) { const fx = x - w / 2 + (i + 0.5) * w / 9, h = 90 + rnd(i * 7) * 120; glow('rgba(255,120,40,0.9)', 30, () => { const gr = cv.createLinearGradient(0, y - h, 0, y); gr.addColorStop(0, 'rgba(255,230,120,0)'); gr.addColorStop(0.4, '#FFB020'); gr.addColorStop(1, '#FF4D2E'); cv.fillStyle = gr; cv.beginPath(); cv.moveTo(fx - 26, y); cv.quadraticCurveTo(fx - 30, y - h * 0.5, fx, y - h); cv.quadraticCurveTo(fx + 30, y - h * 0.5, fx + 26, y); cv.closePath(); cv.fill(); }); } }
function challengeCard(x, y) { cv.save(); cv.translate(x, y); cv.rotate(-0.12); glow('rgba(255,90,40,0.6)', 50, () => rr(-170, -110, 340, 220, 26, '#1D1A2B')); rr(-170, -110, 340, 220, 26, null, 'rgba(255,255,255,0.15)', 3);
  txt('چالش پراپ', 0, -50, 42, WHITE); rr(-130, 6, 260, 26, 13, '#3A2F55'); rr(-130, 6, 150, 26, 13, RED); txt('حساب بسته شد', 0, 74, 32, RED); flames(0, 110, 320); cv.restore(); }
function cheque(x, y) { cv.save(); cv.translate(x, y); cv.rotate(0.06); for (let i = 0; i < 3; i++) { cv.save(); cv.translate(-30 + i * 22, 40 - i * 18); cv.rotate(-0.2 + i * 0.12); glow('rgba(51,224,138,0.5)', 26, () => rr(-150, -70, 300, 140, 16, '#1F8F55')); rr(-136, -56, 272, 112, 10, null, 'rgba(255,255,255,0.5)', 4); circle(0, 0, 34, 'rgba(255,255,255,0.85)'); txt('$', 0, 3, 46, '#1F8F55', { dir: 'ltr' }); cv.restore(); }
  glow(rgba(GREEN, 0.7), 40, () => rr(-200, -260, 400, 170, 30, '#0E2A1F')); rr(-200, -260, 400, 170, 30, null, GREEN, 4); txt('برداشت', 50, -200, 52, WHITE); circle(-120, -176, 44, GREEN); line([[-140, -176], [-124, -158], [-96, -194]], INK, 11); txt('تأیید شد', 50, -136, 34, GREEN); cv.restore(); }
function rocket(x, y) { const pts = [[x - 260, y], [x - 180, y - 40], [x - 120, y - 30], [x - 60, y - 120], [x, y - 100], [x + 40, y - 300], [x + 70, y - 560]];
  glow(GREEN, 40, () => line(pts, GREEN, 16)); circle(x + 70, y - 560, 20, GREEN); badge('۲۰۰٪', x - 90, y - 420, 80, GREEN, INK, -0.08);
  glow('rgba(255,77,94,0.9)', 26, () => line([[x + 10, y - 360], [x + 50, y - 330], [x + 26, y - 290], [x + 70, y - 250]], RED, 9)); badge('؟', x + 170, y - 300, 80, RED, WHITE, 0.12); }
function phone(x, y) { cv.save(); cv.translate(x, y); cv.rotate(-0.1); glow('rgba(108,71,255,0.6)', 50, () => rr(-170, -330, 340, 660, 44, '#0F0C1B')); rr(-150, -300, 300, 600, 30, '#161226');
  rr(-130, -240, 250, 130, 26, '#2A2342'); txt('سیگنال VIP', 0, -205, 34, LIME); txt('۹۰٪ سود ماهانه!', 0, -150, 34, WHITE); rr(-120, -80, 230, 90, 24, '#2A2342'); txt('فقط امروز 🔥', 0, -36, 32, WHITE);
  cv.restore(); cv.save(); cv.translate(x + 120, y + 190); glow('rgba(255,77,94,0.9)', 40, () => poly([[0, -96], [90, 70], [-90, 70]], RED)); txt('!', 0, 18, 110, WHITE); cv.restore(); }
function envelope(x, y) { cv.save(); cv.translate(x, y); cv.rotate(-0.08); glow('rgba(198,242,78,0.6)', 50, () => rr(-200, -130, 400, 260, 22, '#F7F4EE')); poly([[-200, -130], [0, 30], [200, -130]], '#E4DECF', '#C9C0AE', 3);
  cv.save(); cv.translate(110, 70); cv.rotate(0.15); rr(-90, -40, 180, 80, 14, null, VIO, 6); txt('۱ سال بعد', 0, 3, 34, VIO); cv.restore(); cv.restore();
  cv.save(); cv.translate(x - 180, y - 250); glow('rgba(255,190,90,0.6)', 30, () => { poly([[-50, -80], [50, -80], [0, 0]], 'rgba(255,220,150,0.25)', '#D9B26A', 6); poly([[-50, 80], [50, 80], [0, 0]], 'rgba(255,220,150,0.25)', '#D9B26A', 6); }); rr(-60, -92, 120, 14, 6, '#D9B26A'); rr(-60, 78, 120, 14, 6, '#D9B26A');
  [[-10, 30, '#2DE38A'], [12, 50, '#FF4D5E']].forEach(([dx, dy, c]) => rr(dx - 6, dy, 12, 24, 3, c)); cv.restore(); }
function grid100(x, y) { const s = 40, gap = 7, w = 10 * s + 9 * gap; glow('rgba(51,224,138,0.35)', 40, () => rr(x - w / 2 - 30, y - w / 2 - 30, w + 60, w + 60, 34, '#0B1A16')); rr(x - w / 2 - 30, y - w / 2 - 30, w + 60, w + 60, 34, null, rgba(GREEN, 0.5), 3);
  for (let i = 0; i < 100; i++) { const c = i % 10, r = Math.floor(i / 10), on = i < 63, col = on ? (rnd(i * 3.3) > 0.42 ? '#2DE38A' : '#FF4D5E') : 'rgba(255,255,255,0.08)'; const px = x + w / 2 - s - c * (s + gap), py = y - w / 2 + r * (s + gap);
    if (on) glow(col, 12, () => rr(px, py, s, s, 10, col)); else rr(px, py, s, s, 10, col); }
  badge('۱۰۰', x + w / 2 + 10, y - w / 2 - 20, 56, LIME, INK, 0.1); }

// ---------- the covers ----------
const COVERS = [
  { id: 'k22', l1: 'به استراتژیت اعتماد داری؟', l2: 'یا از بررسیش می‌ترسی؟', c2: RED, room: { seed: 1, window: 'left', tint: '#0E7A63' },
    draw: () => { gate(300, 1440); trader(780, 1090, { face: 'worried', look: [-0.8, 0], armL: 'palm', armR: 'down', rim: '#3DF5C5' }); bubble(970, 700, () => txt('؟', 0, 8, 90, RED)); } },
  { id: 'k13', l1: 'سودت از استراتژیه؟', l2: 'یا از شانسه؟', c2: GREEN, room: { seed: 2, window: 'right', tint: '#106B7A', top: '#05101C' },
    draw: () => { chart(500, 860, 520, 400, true, GREEN); die(680, 1350, 150, 5, -0.25); die(850, 1300, 130, 3, 0.2); trader(290, 1100, { face: 'thinking', look: [0.6, -0.6], armL: 'down', armR: 'chin', rim: '#4FD8FF' }); } },
  { id: 'k12', l1: 'نصف حسابت رفت؟', l2: '۵۰٪ سود کافی نیست!', c2: RED, room: { seed: 3, window: 'left', tint: '#5A2A8A', top: '#0A0718' },
    draw: () => { accountBar(360, 1420); trader(810, 1100, { face: 'shocked', look: [-0.9, 0], armL: 'palm', armR: 'down', rim: '#B39CFF' }); } },
  { id: 'k11', l1: 'وین‌ریت ۶۰ درصد،', l2: 'پس چرا چالش سوخت؟', c2: RED, room: { seed: 4, window: 'right', tint: '#7A3A10', top: '#120A06' },
    draw: () => { ring(260, 900, 120, 0.6, GREEN, '۶۰٪'); challengeCard(330, 1280); trader(800, 1100, { face: 'sad', look: [-0.8, 0.3], armL: 'down', armR: 'down', rim: '#FFB070' }); } },
  { id: 'k1', l1: 'پراپ تریدرها', l2: 'چطوری به برداشت رسیدن؟', c2: GREEN, room: { seed: 5, window: 'left', tint: '#0E7A3F' },
    draw: () => { cheque(770, 1330); trader(280, 1100, { face: 'smirk', look: [0.7, 0.2], armL: 'down', armR: 'point', rim: '#3DF59A' }); } },
  { id: 'q2', l1: '۲۰۰٪ سود توی یه ماه؟', l2: 'بیا یه حساب ساده کنیم', c2: RED, room: { seed: 6, window: 'right', tint: '#0E5A7A', top: '#04101A' },
    draw: () => { rocket(360, 1400); trader(810, 1100, { face: 'shocked', look: [-0.8, -0.7], armL: 'down', armR: 'down', rim: '#4FD8FF' }); } },
  { id: 'q3', l1: 'سیگنال ۹۰٪ سود ماهانه؟', l2: 'قبل از خرید اینو ببین', c2: RED, room: { seed: 7, window: 'left', tint: '#4A2A8A', top: '#0A0718' },
    draw: () => { phone(320, 1180); trader(800, 1100, { face: 'thinking', look: [-0.8, -0.2], armR: 'chin', armL: 'down', rim: '#B39CFF' }); } },
  { id: 'k10', l1: 'یه پیام از خودِ', l2: 'یک سال بعدت', c2: GREEN, room: { seed: 8, window: 'right', tint: '#0E6A5A' },
    draw: () => { envelope(800, 1300); trader(270, 1100, { face: 'happy', look: [0.8, 0.2], armL: 'down', armR: 'palm', rim: '#3DF5C5' }); } },
  { id: 'k9', l1: 'چالش ۱۰۰ معامله', l2: 'تا آخرش میری؟', c2: GREEN, room: { seed: 9, window: 'left', tint: '#0E7A3F', top: '#04120C' },
    draw: () => { grid100(300, 1180); trader(810, 1100, { face: 'smirk', look: [-0.8, 0], armL: 'point', armR: 'down', rim: '#3DF59A' }); } },
];
function bubble(x, y, fn) { glow('rgba(255,255,255,0.4)', 30, () => circle(x, y, 70, WHITE)); circle(x - 60, y + 74, 16, WHITE); circle(x - 84, y + 108, 9, WHITE); cv.save(); cv.translate(x, y); fn(); cv.restore(); }
/** The two-line hook: white, then the accent colour; outlined and shadowed so it reads on any room. */
function hook(l1, l2, c2) {
  const fit = (s, size) => Math.min(size, size * 960 / measure(s, size));
  [[l1, 470, fit(l1, 112), WHITE], [l2, 600, fit(l2, 100), c2]].forEach(([s, y, size, col]) => {
    cv.save(); cv.font = FONT(size); cv.textAlign = 'center'; cv.textBaseline = 'middle'; cv.direction = 'rtl'; cv.lineJoin = 'round';
    cv.shadowColor = 'rgba(0,0,0,0.85)'; cv.shadowBlur = 30; cv.shadowOffsetY = 8; cv.strokeStyle = INK; cv.lineWidth = 18; cv.strokeText(s, CX, y); cv.shadowColor = 'transparent';
    if (col !== WHITE) { cv.shadowColor = rgba(col, 0.55); cv.shadowBlur = 26; } cv.fillStyle = col; cv.fillText(s, CX, y); cv.restore(); });
}
window.N = COVERS.length;
window.IDS = COVERS.map((c) => c.id);
window.render = (i) => {
  const C = COVERS[i]; cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.clearRect(0, 0, W, H);
  cv.drawImage(room(C.room), 0, 0); C.draw();
  // a soft fade at the top keeps the hook clean
  const gr = cv.createLinearGradient(0, 300, 0, 760); gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); cv.fillStyle = gr; cv.fillRect(0, 300, W, 460);
  hook(C.l1, C.l2, C.c2);
};
window.addEventListener('load', async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await document.fonts.load('40px "Noto Color Emoji"', '🔥');
  await loadImg('icon', window.LOGO.icon);
  window.render(0); window.ready = true;
});
