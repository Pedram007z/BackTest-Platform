// k21 · «به استراتژیت اعتماد داری یا از بررسی کردنش می‌ترسی؟», a podcast with two round-head characters, on k16's
// take at its normal speed. Inspired by the two reference reels the user sent:
//   - the minimal whiteboard explainer: short headlines with an accent word, and small outlined icons above the
//     characters (cards, a filling bar, a checklist), in green and red;
//   - the podcast: two simple round-head characters at a round table with microphones in a cozy room, cutting between
//     a wide shot and close-ups.
// Here the host (grey sweater, the BacktestLab logo on his chest) speaks with the user's voice (his mouth follows it,
// vo.json); the guest (glasses, rust sweater) is the trader who's afraid to test his strategy and reacts: worried on
// «می‌ترسی؟», thinking on «سه تا جواب», relieved on «راحت», a big smile on «فهمیدی», nodding on «بهتره». Close-up of
// the laptop for «توی بک‌تست‌لب تست کن» (the real gold replay, k13's screens). The characters and the room are drawn
// here (original, not traced from the references). 1080×1920, every frame a pure function of t (window.seek).
const W = 1080, H = 1920, CX = 540;
const NAVY = '#1F2A2E', GREEN = '#16795C', RED = '#C9453A', AMBER = '#C8801A', VIO = '#6C47FF', LINE = '#262626', HEADW = '#FBFAF6';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w, VO = D.vo;
const ws = (i) => Wd[i][0];

// ---------- helpers ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const pulse = (t, a, d = 0.35) => (t >= a && t < a + d ? Math.sin(((t - a) / d) * Math.PI) : 0);
const win = (t, a, b, d = 0.2) => Math.min(sm(k01(t, a - d, d)), 1 - sm(k01(t, b, d)));
const FONT = (s, w = 800) => `${w} ${s}px Vazirmatn, "Noto Color Emoji"`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) { cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha; cv.font = FONT(size, o.w ?? 800); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = isL(s) ? 'ltr' : 'rtl'; cv.fillText(s, x, y); cv.restore(); }
function measure(s, size, w = 800) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rr(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, r); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function ell(x, y, rx, ry, fill, stroke, lw = 3) { cv.beginPath(); cv.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function path(pts, col, lw, close = false, fill) { cv.save(); cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); if (close) cv.closePath(); if (fill) { cv.fillStyle = fill; cv.fill(); } if (col) { cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = cv.lineJoin = 'round'; cv.stroke(); } cv.restore(); }
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }

// ---------- the shots: a wide shot, a medium two-shot, close-ups of each, and the laptop ----------
const HOST_X = 795, GUEST_X = 285, HEAD_Y = 1000;
const CAMS = { wide: [540, 1190, 1.24], medium: [540, 1140, 1.5], host: [HOST_X, 1090, 2.25], guest: [GUEST_X, 1090, 2.25] };
const SHOTS = () => [[0, 'wide'], [1.7, 'host'], [3.38, 'guest'], [T.see - 0.05, 'host'], [T.three - 0.05, 'medium'], [T.a1 - 0.05, 'wide'], [ws(29) - 0.12, 'guest'], [T.a2 - 0.05, 'host'],
  [ws(42) - 0.1, 'medium'], [T.a3 - 0.05, 'wide'], [ws(59) - 0.1, 'guest'], [T.all - 0.05, 'medium'], [T.week - 0.05, 'host'], [T.lab - 0.06, 'laptop'], [T.cta - 0.06, 'wide']];
function shotAt(t) { const S = SHOTS(); let i = 0; S.forEach((s, j) => { if (t >= s[0]) i = j; }); return { kind: S[i][1], t0: S[i][0], t1: i + 1 < S.length ? S[i + 1][0] : DUR }; }

// ---------- the characters ----------
const voAt = (t) => { const f = t * VO.fps, a = VO.open, i = Math.max(0, Math.min(a.length - 1, Math.floor(f))), j = Math.min(a.length - 1, i + 1), u = f - Math.floor(f); return a[i] * (1 - u) + a[j] * u; };
const voSlow = (t) => { let s = 0, n = 0; for (let k = -8; k <= 8; k++) { s += voAt(t + k / VO.fps) * (1 - Math.abs(k) / 9); n += 1 - Math.abs(k) / 9; } return s / n; };
function blink(t, seed) { let b = 0, x = 0.7 + seed * 0.9, r = seed * 7 + 3; while (x < t + 1) { const u = t - x; if (u >= 0 && u < 0.16) b = Math.max(b, u < 0.06 ? u / 0.06 : 1 - (u - 0.06) / 0.1); r = (r * 16807) % 2147483647; x += 2.2 + (r / 2147483647) * 2.6; } return b; }
const HOST_STRESS = () => [ws(2), ws(9), ws(18), ws(23), ws(29), ws(34), ws(40), ws(49), ws(59), ws(65), ws(69), ws(77), ws(80)];
function hostState(t, shot) {
  const talk = t < T.end + 0.1, env = talk ? voSlow(t) : 0;
  return { open: talk ? cl(voAt(t) * 0.85) : 0, smile: 0.25 + 0.5 * win(t, ws(28), ws(32)) + 0.6 * win(t, ws(65), T.week) + 0.6 * win(t, T.cta, 99), brow: 0.8 * win(t, ws(8), ws(9) + 0.4) + 0.6 * win(t, ws(13), ws(15) + 0.3) + 0.3 * cl((env - 0.45) * 2),
    worry: 0, frown: 0.5 * win(t, ws(50), ws(51) + 0.3), look: shot === 'host' ? -0.15 : -0.85, blink: blink(t, 1), nod: 4 * (env - 0.3) + HOST_STRESS().reduce((a, s) => a + 7 * pulse(t, s, 0.3), 0), tilt: 2 * Math.sin(t * 0.7) };
}
function guestState(t, shot) {
  return { open: 0, smile: 0.1 + 0.7 * win(t, ws(29), ws(32) + 0.6) + 0.95 * win(t, ws(59), T.all + 0.6) + 0.5 * win(t, ws(65), T.week + 0.4) + 0.8 * win(t, T.cta, 99) - 0.3 * win(t, ws(50), ws(58)),
    brow: 0.6 * win(t, T.three, T.a1), worry: 0.95 * win(t, ws(8) - 0.05, T.three - 0.2) + 0.5 * win(t, ws(50), ws(58)), frown: 0, look: shot === 'guest' ? 0.2 : 0.85, blink: blink(t, 4),
    nod: [ws(23), ws(29), ws(44), ws(59), ws(65), ws(69)].reduce((a, s) => a + 8 * pulse(t, s + 0.1, 0.4), 0) + 2 * Math.sin(t * 0.8 + 2), tilt: 6 * win(t, T.three, T.a1) - 5 * win(t, ws(8), T.three - 0.2) + 2 * Math.sin(t * 0.6 + 1),
    open2: 0.6 * pulse(t, ws(59) + 0.05, 0.5) };
}
function head(x, y, st, glasses) {
  cv.save(); cv.translate(x, y + st.nod); cv.rotate((st.tilt * Math.PI) / 180);
  circle(0, 0, 92, HEADW, LINE, 4.5);
  const lx = st.look * 16, b = 1 - st.blink * 0.9;
  [-1, 1].forEach((s) => ell(lx + s * 30, -6, 7.5, 11 * b, LINE));
  // brows: raised, worried (inner ends up) or frowning (inner ends down)
  [-1, 1].forEach((s) => { const inner = -st.worry * 13 + st.frown * 8, up = st.brow * 9; path([[lx + s * 16, -42 - up + inner], [lx + s * 44, -40 - up + st.worry * 3]], LINE, 5); });
  if (glasses) { [-1, 1].forEach((s) => circle(lx + s * 30, -6, 25, null, LINE, 4)); path([[lx - 5, -8], [lx + 5, -8]], LINE, 4); path([[lx - 55, -10], [lx - 84, -18]], LINE, 4); path([[lx + 55, -10], [lx + 84, -18]], LINE, 4); }
  // mouth: talking (from the voice), smiling, worried, or open in surprise
  const mx = lx * 0.8, my = 38, o = Math.max(st.open, st.open2 ?? 0);
  if (o > 0.12) { const w = 16 + o * 5 + st.smile * 4, h = 3 + o * 15; cv.beginPath(); cv.ellipse(mx, my + h * 0.2, w, h, 0, 0, Math.PI * 2); cv.fillStyle = '#3A2626'; cv.fill(); if (h > 9) { cv.save(); cv.clip(); ell(mx, my + h * 0.2 + h * 0.75, w * 0.6, h * 0.45, '#C9575A'); cv.restore(); } cv.strokeStyle = LINE; cv.lineWidth = 3; cv.stroke(); }
  else if (st.worry > 0.4) path([[mx - 18, my + 4], [mx - 6, my - 1], [mx + 6, my + 4], [mx + 18, my - 1]], LINE, 4.5);
  else { const c = st.smile * 18 - 2; cv.save(); cv.strokeStyle = LINE; cv.lineWidth = 4.5; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(mx - 20 - st.smile * 6, my - st.smile * 4); cv.quadraticCurveTo(mx, my + c, mx + 20 + st.smile * 6, my - st.smile * 4); cv.stroke(); cv.restore();
    if (st.smile > 0.75) { cv.save(); cv.beginPath(); cv.moveTo(mx - 24, my - 3); cv.quadraticCurveTo(mx, my + c + 2, mx + 24, my - 3); cv.closePath(); cv.fillStyle = '#3A2626'; cv.fill(); cv.restore(); } }
  cv.restore();
}
function torso(x, col, logo) {
  const p = () => { cv.beginPath(); cv.moveTo(x - 62, 1086); cv.bezierCurveTo(x - 110, 1090, x - 128, 1130, x - 130, 1200); cv.lineTo(x - 134, 1380); cv.lineTo(x + 134, 1380); cv.lineTo(x + 130, 1200); cv.bezierCurveTo(x + 128, 1130, x + 110, 1090, x + 62, 1086); cv.closePath(); };
  p(); cv.fillStyle = col; cv.fill(); cv.save(); p(); cv.clip(); const g = cv.createLinearGradient(x - 130, 0, x + 130, 0); g.addColorStop(0, 'rgba(0,0,0,0.12)'); g.addColorStop(0.35, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.1)'); cv.fillStyle = g; cv.fillRect(x - 140, 1080, 280, 310); cv.restore();
  p(); cv.strokeStyle = 'rgba(0,0,0,0.35)'; cv.lineWidth = 3; cv.stroke();
  cv.beginPath(); cv.ellipse(x, 1088, 54, 14, 0, 0, Math.PI); cv.strokeStyle = 'rgba(0,0,0,0.3)'; cv.lineWidth = 6; cv.stroke();
  if (logo && IMG.icon) cv.drawImage(IMG.icon, x + 38, 1140, 34, 34);
}
function legs(x) { [-1, 1].forEach((s) => { rr(x + s * 40 - 26, 1350, 52, 260, 22, '#1E1E1E'); ell(x + s * 48, 1612, 42, 20, HEADW, LINE, 3); }); }
function arm(sx, sy, hx, hy, col, hand) {
  const ex = lerp(sx, hx, 0.42) + (hx > sx ? -18 : 18), ey = Math.max(sy, hy) + 30;
  cv.save(); cv.lineCap = cv.lineJoin = 'round'; cv.strokeStyle = 'rgba(0,0,0,0.35)'; cv.lineWidth = 50; cv.beginPath(); cv.moveTo(sx, sy); cv.quadraticCurveTo(ex, ey, hx, hy); cv.stroke();
  cv.strokeStyle = col; cv.lineWidth = 44; cv.stroke(); cv.restore();
  if (hand === 'palm') { ell(hx, hy - 6, 22, 26, HEADW, LINE, 3); ell(hx + (hx > sx ? 20 : -20), hy + 2, 8, 13, HEADW, LINE, 3); }
  else if (hand === 'point') { circle(hx, hy, 22, HEADW, LINE, 3); rr(hx - 7, hy + 10, 14, 36, 7, HEADW, LINE, 3); }
  else circle(hx, hy, 22, HEADW, LINE, 3);
}

// ---------- the room ----------
let ROOM;
function buildRoom() {
  // the static back of the room, drawn once in world coordinates (a 1600 × 2600 area from x −260, y −400)
  ROOM = document.createElement('canvas'); ROOM.width = 1600; ROOM.height = 2700; const g = ROOM.getContext('2d'); g.translate(260, 400);
  let gr = g.createLinearGradient(0, -400, 0, 1400); gr.addColorStop(0, '#F1E8DA'); gr.addColorStop(1, '#E2D4BF'); g.fillStyle = gr; g.fillRect(-260, -400, 1600, 1800);
  g.fillStyle = 'rgba(0,0,0,0.03)'; for (let x = -260; x < 1340; x += 120) g.fillRect(x, -400, 2, 1800);
  // the bookshelf (left)
  g.fillStyle = '#6B4A33'; g.fillRect(-170, 380, 410, 1020); g.fillStyle = '#5A3D2A'; g.fillRect(-150, 400, 370, 990);
  const BK = ['#B5502E', '#2F6B6A', '#D9A441', '#E8DCC6', '#2C3E50', '#8C6E4F', '#A33D3D', '#5E7D4E'];
  [470, 680, 890, 1100, 1310].forEach((y, r) => { g.fillStyle = '#7A5638'; g.fillRect(-150, y + 70, 370, 16); let x = -140; for (let i = 0; x < 200; i++) { const w = 18 + rnd(r * 31 + i) * 22, h = 110 + rnd(r * 17 + i * 3) * 70; g.fillStyle = BK[Math.floor(rnd(r * 7 + i * 5) * BK.length)]; g.fillRect(x, y + 70 - h, w, h); x += w + 4; } });
  // the radiator and a window (right)
  g.fillStyle = '#F7F4EE'; g.fillRect(840, 260, 300, 380); g.strokeStyle = '#CFC4B2'; g.lineWidth = 10; g.strokeRect(840, 260, 300, 380); g.fillStyle = 'rgba(180,205,220,0.35)'; g.fillRect(850, 270, 280, 360); g.strokeStyle = '#CFC4B2'; g.lineWidth = 6; g.beginPath(); g.moveTo(990, 270); g.lineTo(990, 630); g.moveTo(850, 450); g.lineTo(1130, 450); g.stroke();
  for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#E9E3D8' : '#DDD5C7'; g.beginPath(); g.roundRect(860 + i * 30, 700, 26, 180, 10); g.fill(); }
  // the floor and the rug
  gr = g.createLinearGradient(0, 1395, 0, 2300); gr.addColorStop(0, '#B48A60'); gr.addColorStop(1, '#7D5B3D'); g.fillStyle = gr; g.fillRect(-260, 1395, 1600, 905);
  g.strokeStyle = 'rgba(60,35,15,0.25)'; g.lineWidth = 3; for (let y = 1430; y < 2300; y += 46) { g.beginPath(); g.moveTo(-260, y); g.lineTo(1340, y); g.stroke(); } for (let i = 0; i < 60; i++) { const y = 1430 + Math.floor(rnd(i) * 19) * 46, x = -260 + rnd(i * 3.3) * 1600; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 46); g.stroke(); }
  g.fillStyle = '#8F7C68'; g.beginPath(); g.ellipse(540, 1640, 560, 150, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 6; g.beginPath(); g.ellipse(540, 1640, 520, 128, 0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-260, 1390, 1600, 10);
  // plants
  const plant = (x, y, s) => { g.fillStyle = '#C9B79C'; g.beginPath(); g.moveTo(x - 50 * s, y); g.lineTo(x + 50 * s, y); g.lineTo(x + 38 * s, y + 90 * s); g.lineTo(x - 38 * s, y + 90 * s); g.closePath(); g.fill();
    for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + (rnd(i * 3 + x) - 0.5) * 2.4, L = (110 + rnd(i * 7 + x) * 160) * s; g.fillStyle = i % 2 ? '#5E8A4E' : '#4C7A40'; g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.beginPath(); g.ellipse(0, -L / 2, 18 * s, L / 2, 0, 0, Math.PI * 2); g.fill(); g.restore(); } };
  plant(1080, 1250, 1.3); plant(30, 1270, 1.0); plant(80, 300, 0.6);
  // the chairs
  [GUEST_X, HOST_X].forEach((x) => { g.fillStyle = '#D6CAB8'; g.beginPath(); g.roundRect(x - 140, 1040, 280, 360, 70); g.fill(); g.fillStyle = '#CBBEAA'; g.beginPath(); g.roundRect(x - 165, 1200, 60, 200, 30); g.fill(); g.beginPath(); g.roundRect(x + 105, 1200, 60, 200, 30); g.fill();
    g.fillStyle = '#7A5A3F'; g.fillRect(x - 130, 1400, 14, 120); g.fillRect(x + 116, 1400, 14, 120); });
  const v = g.createRadialGradient(540, 900, 600, 540, 900, 1500); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,40,20,0.35)'); g.fillStyle = v; g.fillRect(-260, -400, 1600, 2700);
}
function table(t) {
  cv.fillStyle = '#2E2A26'; cv.fillRect(527, 1320, 26, 300); ell(540, 1622, 120, 20, '#2E2A26');
  ell(540, 1308, 345, 58, '#8E5F38'); ell(540, 1292, 345, 56, '#BC8857'); ell(540, 1292, 300, 40, 'rgba(255,255,255,0.08)');
  // the laptop (its back to us), mugs, a little plant
  cv.save(); cv.fillStyle = '#C9CBCF'; cv.beginPath(); cv.moveTo(620, 1296); cv.lineTo(700, 1296); cv.lineTo(712, 1180); cv.lineTo(632, 1180); cv.closePath(); cv.fill(); cv.fillStyle = '#AEB1B6'; cv.fillRect(610, 1294, 112, 10); cv.restore();
  if (IMG.icon) cv.drawImage(IMG.icon, 655, 1222, 24, 24);
  rr(725, 1246, 46, 50, 10, '#F3EFE8', LINE, 2.5); rr(310, 1250, 44, 46, 10, '#3E3A36', LINE, 2.5);
  rr(510, 1250, 44, 44, 6, '#C9B79C'); for (let i = 0; i < 6; i++) { cv.save(); cv.translate(532, 1250); cv.rotate(-1.2 + i * 0.48); ell(0, -24, 7, 22, i % 2 ? '#5E8A4E' : '#4C7A40'); cv.restore(); }
}
function mic(x, side) { const mx = x - side * 128, my = 1100; path([[mx + side * 6, my + 40], [x - side * 120, 1180], [x - side * 128, 1290]], '#2B2B2B', 9); rr(x - side * 140, 1282, 26, 14, 4, '#2B2B2B'); cv.save(); cv.translate(mx, my); cv.rotate(side * 0.35); rr(-18, -40, 36, 80, 16, '#232323'); rr(-18, -40, 36, 34, 14, '#3A3A3A'); cv.restore(); }

// ---------- one frame of the room ----------
function room(t, shot) {
  cv.drawImage(ROOM, -260, -400);
  const hs = hostState(t, shot), gs = guestState(t, shot);
  legs(GUEST_X); legs(HOST_X);
  torso(GUEST_X, '#B5502E', false); torso(HOST_X, '#8A8A84', true);
  table(t);
  // arms: the guest's hands rest on the table; the host's near hand talks
  arm(GUEST_X - 100, 1112, GUEST_X - 40, 1294, '#B5502E'); arm(GUEST_X + 100, 1112, GUEST_X + 70 + 10 * Math.sin(t * 0.5), 1290, '#B5502E');
  arm(HOST_X + 100, 1112, HOST_X + 40, 1294, '#8A8A84');
  const gest = hostHand(t); arm(HOST_X - 100, 1112, gest[0], gest[1], '#8A8A84', gest[2]);
  head(GUEST_X, HEAD_Y, gs, true); head(HOST_X, HEAD_Y, hs, false);
  mic(GUEST_X, -1); mic(HOST_X, 1);
  // the end: both wave
  if (t > T.end) { const k = sm(k01(t, T.end, 0.3)); [[GUEST_X + 130, -1, '#B5502E'], [HOST_X + 130, 1, '#8A8A84']].forEach(([x, s, col], i) => { const wav = Math.sin((t - T.end) * 9 + i) * 18; if (k > 0) { cv.save(); cv.globalAlpha = k; arm(i ? HOST_X + 100 : GUEST_X + 100, 1112, x + wav, 980, col, 'palm'); cv.restore(); } }); }
}
/** The host's talking hand: resting, open palm up on the stressed words, pointing down at «لینکش توی بیوئه». */
function hostHand(t) {
  const rest = [HOST_X - 60, 1294], up = [HOST_X - 190, 1160];
  if (t > ws(81) - 0.2 && t < T.end) { const k = sm(k01(t, ws(81) - 0.2, 0.25)); return [lerp(rest[0], HOST_X - 175, k), lerp(rest[1], 1215, k), k > 0.5 ? 'point' : '']; }
  const beats = [[ws(2), ws(4)], [ws(10), ws(15) + 0.2], [ws(16), ws(21) + 0.2], [ws(29), ws(32)], [ws(39), ws(41) + 0.2], [ws(59), ws(59) + 0.6], [ws(64), ws(65) + 0.4], [ws(69), ws(72)], [ws(79), ws(80) + 0.4]];
  let k = 0; beats.forEach(([a, b]) => { k = Math.max(k, win(t, a, b, 0.22)); });
  return [lerp(rest[0], up[0], k) + Math.sin(t * 3) * 6 * k, lerp(rest[1], up[1], k), k > 0.4 ? 'palm' : ''];
}
// the laptop close-up: the real gold replay (a wider crop of k13's capture, 1440×900 coordinates)
const RRW = [330, 230, 860, 500], QPOS = [800, 340, 328, 284], A_KEYS = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'];
function laptop(t, t0) {
  let g = cv.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#E9DFCF'); g.addColorStop(1, '#C7B49A'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  const z = 1 + 0.04 * k01(t, t0, 2.1); cv.save(); cv.translate(CX, 1060); cv.scale(z, z); cv.translate(-CX, -1060);
  ell(CX, 1430, 560, 60, 'rgba(60,40,20,0.25)');
  rr(50, 640, 980, 600, 34, '#2B2D31'); const sw = 920, sh = (sw * RRW[3]) / RRW[2], sx = CX - sw / 2, sy = 640 + (600 - sh) / 2;
  const key = t < ws(77) - 0.04 ? A_KEYS[Math.min(5, Math.floor(cl((t - t0) / (ws(77) - 0.04 - t0)) * 6))] : 'cp', im = IMG[key];
  if (im) { const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(sx, sy, sw, sh, 8); cv.clip(); cv.drawImage(im, RRW[0] * s, RRW[1] * s, RRW[2] * s, RRW[3] * s, sx, sy, sw, sh); cv.restore(); }
  if (key === 'cp') { const kr = cub(k01(t, ws(77), 0.3)), s = sw / RRW[2], m = 10 * (1 - kr) + 6; cv.save(); cv.globalAlpha *= kr; cv.strokeStyle = '#C6F24E'; cv.lineWidth = 6; cv.shadowColor = 'rgba(198,242,78,0.8)'; cv.shadowBlur = 16; cv.beginPath(); cv.roundRect(sx + (QPOS[0] - RRW[0]) * s - m, sy + (QPOS[1] - RRW[1]) * s - m, QPOS[2] * s + 2 * m, QPOS[3] * s + 2 * m, 12); cv.stroke(); cv.restore(); }
  cv.fillStyle = '#B9BCC2'; cv.beginPath(); cv.moveTo(20, 1240); cv.lineTo(1060, 1240); cv.lineTo(1110, 1330); cv.lineTo(-30, 1330); cv.closePath(); cv.fill(); rr(440, 1252, 200, 14, 7, '#A4A7AD');
  if (IMG.icon) cv.drawImage(IMG.icon, 960, 580, 90, 90);
  cv.restore();
  txt('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', CX, 1390, 28, NAVY, { w: 700, alpha: 0.7 });
}

// ---------- the infographics on the wall (screen space) ----------
function headline(a, b, colB, t, t0, y = 300) { const k = cl(pop(t - t0, 14, 0.7), 0, 1.05); cv.save(); cv.globalAlpha = cl(k * 1.5); cv.translate(CX, y); cv.scale(lerp(0.92, 1, cl(k)), lerp(0.92, 1, cl(k))); txt(a, 0, 0, 74, NAVY, { w: 900 }); if (b) txt(b, 0, 100, 64, colB, { w: 900 }); cv.restore(); }
const pin = (t, t0, fn) => { const k = pop(t - t0 + 0.04, 14, 0.6); if (k > 0) { cv.save(); cv.globalAlpha *= cl(k * 1.4); fn(cl(k, 0, 1.15)); cv.restore(); } };
function tag(s, x, y, col, mark, k) { cv.save(); cv.translate(x, y); cv.scale(k, k); const w = measure(s, 40) + 110; rr(-w / 2, -40, w, 80, 22, '#FFFFFF', col, 4); txt(s, 20, 3, 40, col, { w: 800 }); if (mark === 'v') path([[-w / 2 + 30, 2], [-w / 2 + 42, 14], [-w / 2 + 64, -12]], col, 6); else if (mark === 'x') { path([[-w / 2 + 32, -12], [-w / 2 + 58, 14]], col, 6); path([[-w / 2 + 58, -12], [-w / 2 + 32, 14]], col, 6); } cv.restore(); }
function card(x, y, n, col, kind, k) { cv.save(); cv.translate(x, y); cv.scale(k, k); rr(-80, -95, 160, 190, 24, '#FFFFFF', NAVY, 4); txt(fa(n), 0, -50, 40, NAVY, { w: 900 });
  if (kind === 'v') path([[-28, 20], [-8, 40], [30, 0]], col, 9); else if (kind === 'x') { path([[-24, 0], [24, 46]], col, 9); path([[24, 0], [-24, 46]], col, 9); } else { path([[0, -2], [0, 46]], col, 9); path([[-18, 26], [0, 46], [18, 26]], col, 9); } cv.restore(); }
function bar(x, y, w, f, col, label) { txt(label, x + w, y - 34, 30, NAVY, { align: 'right', w: 700 }); rr(x, y, w, 30, 15, '#E7E1D6'); rr(x + w * (1 - f), y, w * f, 30, 15, col); }
function overlays(t) {
  const sc = (k0, k1) => t >= k0 - 0.05 && t < k1 - 0.06;
  if (sc(-1, T.see)) { headline('به استراتژیت اعتماد داری؟', 'یا از بررسیش می‌ترسی؟', RED, t, -1); pin(t, ws(2), (k) => tag('اعتماد', 690, 520, GREEN, 'v', k)); pin(t, ws(8), (k) => tag('ترس', 390, 520, RED, 'x', k)); }
  else if (sc(T.see, T.three)) { headline('بیا ببینیم', 'از چی می‌ترسی؟', RED, t, T.see); pin(t, ws(13), (k) => { cv.save(); cv.translate(CX, 540); cv.scale(k, k); circle(-10, -10, 44, '#FFFFFF', NAVY, 7); path([[22, 22], [56, 56]], NAVY, 12); txt('؟', -10, -6, 50, RED, { w: 900 }); cv.restore(); }); }
  else if (sc(T.three, T.a1)) { headline('بررسی کردنش', 'فقط ۳ تا جواب داره', GREEN, t, T.three); [['v', GREEN], ['d', AMBER], ['x', RED]].forEach(([kind, col], i) => pin(t, ws(18) + i * 0.12, (k) => card(CX + (1 - i) * 200, 590, i + 1, col, kind, k))); }
  else if (sc(T.a1, T.a2)) { headline('۱. کار می‌کنه', 'با خیال راحت ادامه بده', GREEN, t, T.a1); pin(t, ws(29), (k) => { cv.save(); cv.translate(CX, 560); cv.scale(k, k); circle(0, 0, 58, GREEN); path([[-24, 2], [-6, 22], [28, -18]], '#FFFFFF', 11); cv.restore(); }); }
  else if (sc(T.a2, T.a3)) { headline('۲. کار می‌کنه، با ریسک کمتر', 'حجمتو درست کن', AMBER, t, T.a2); pin(t, ws(39), (k) => { cv.save(); cv.globalAlpha *= k; bar(290, 540, 500, lerp(1, 0.42, cub(k01(t, ws(44) - 0.05, 0.6))), t > ws(44) ? GREEN : AMBER, 'حجم معامله'); cv.restore(); }); }
  else if (sc(T.a3, T.all)) { headline('۳. کار نمی‌کنه', 'قبل از ضرر فهمیدی', RED, t, T.a3); pin(t, ws(57), (k) => { cv.save(); cv.translate(CX - 40, 560); cv.scale(k, k); rr(-90, -46, 180, 92, 12, '#FFFFFF', GREEN, 5); circle(0, 0, 24, null, GREEN, 5); txt('$', 0, 3, 32, GREEN, { w: 900, }); cv.restore(); });
    pin(t, ws(59), (k) => { cv.save(); cv.translate(CX + 110, 545); cv.scale(k, k); circle(0, 0, 40, GREEN); path([[-16, 1], [-4, 14], [18, -12]], '#FFFFFF', 8); cv.restore(); }); }
  else if (sc(T.all, T.week)) { headline('هر ۳ تاش', null, NAVY, t, T.all, 290);
    [['کار می‌کنه', GREEN], ['ریسک کمتر', AMBER], ['کار نمی‌کنه', RED]].forEach(([s, col], i) => pin(t, ws(61) + i * 0.1, (k) => { cv.save(); cv.globalAlpha *= k; txt(s, 660, 400 + i * 70, 50, NAVY, { align: 'right', w: 800 }); path([[700, 400 + i * 70], [716, 416 + i * 70], [744, 386 + i * 70]], col, 8); cv.restore(); }));
    pin(t, ws(64) - 0.05, (k) => { cv.save(); cv.globalAlpha *= k; txt('ندونستن', 660, 610, 50, '#8A8A8A', { align: 'right', w: 800 }); const ks = cub(k01(t, ws(65) - 0.05, 0.3)); if (ks > 0) path([[664, 612], [664 - 230 * ks, 612]], RED, 7); cv.restore(); });
    pin(t, ws(65), (k) => { cv.save(); cv.translate(CX, 712); cv.scale(k, k); txt('از ندونستن بهتره', 0, 0, 56, GREEN, { w: 900 }); cv.restore(); }); }
  else if (sc(T.week, T.lab)) { headline('این هفته', '۵۰ معامله‌ی گذشته', GREEN, t, T.week); pin(t, ws(69), () => { const n = Math.round(50 * cub(k01(t, ws(69), 1.1))); for (let i = 0; i < 50; i++) { const c = i % 25, r = Math.floor(i / 25); rr(CX + (12 - c) * 32 - 12, 540 + r * 40, 24, 30, 6, i < n ? GREEN : '#E3DCD0'); } }); }
  else if (sc(T.lab, T.cta)) { headline('توی بک‌تست‌لب', 'تست کن', VIO, t, T.lab, 300); }
  else if (sc(T.cta, T.end)) { headline('شروعش رایگانه', 'لینکش توی بیوئه 👇', GREEN, t, T.cta); }
  else if (t >= T.end - 0.05) { const k = cub(k01(t, T.end, 0.3)); cv.save(); cv.globalAlpha = k; if (IMG.icon) cv.drawImage(IMG.icon, CX - 80, 220, 160, 160);
    if (IMG.word) { const w = 460, h = (w * IMG.word.height) / IMG.word.width; cv.drawImage(IMG.word, CX - w / 2, 410, w, h); } cv.restore();
    pin(t, T.end + 0.3, (k2) => { cv.save(); cv.translate(CX, 610); cv.scale(k2, k2); const w = measure('شروعش رایگانه', 46) + 70; rr(-w / 2, -42, w, 84, 42, GREEN); txt('شروعش رایگانه', 0, 3, 46, '#FFFFFF', { w: 800 }); cv.restore(); });
    pin(t, T.end + 0.5, (k2) => { cv.save(); cv.translate(CX, 720); cv.scale(k2, k2); txt('لینک توی بیو 👇', 0, 0, 44, NAVY, { w: 800 }); cv.restore(); }); }
}

// ---------- frame ----------
function frame(t, o = {}) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1;
  const s = shotAt(t);
  if (s.kind === 'laptop') laptop(t, s.t0);
  else { const [cx, cy, z0] = CAMS[s.kind], z = z0 * (1 + 0.035 * sm(k01(t, s.t0, Math.max(1, s.t1 - s.t0)))); cv.setTransform(z, 0, 0, z, CX - cx * z, 1150 - cy * z); room(t, s.kind); cv.setTransform(1, 0, 0, 1, 0, 0); }
  // a soft light band behind the headlines keeps them readable in the close-ups
  const g = cv.createLinearGradient(0, 160, 0, 780); g.addColorStop(0, 'rgba(244,238,228,0.0)'); g.addColorStop(0.2, 'rgba(244,238,228,0.55)'); g.addColorStop(0.8, 'rgba(244,238,228,0.55)'); g.addColorStop(1, 'rgba(244,238,228,0)'); cv.fillStyle = g; cv.fillRect(0, 160, W, 620);
  overlays(t);
  if (!o.cover) { const k = cl(t / T.end); cv.fillStyle = 'rgba(31,42,46,0.08)'; cv.fillRect(0, 0, W, 8); cv.fillStyle = GREEN; cv.fillRect(W * (1 - k), 0, W * k, 8); }
}
window.DURATION = DUR;
window.seek = (t) => frame(t);
// the cover: the wide shot with the hook's question and both tags
window.cover = () => frame(1.5, { cover: true }) || (cv.setTransform(1, 0, 0, 1, 0, 0), headline('به استراتژیت اعتماد داری؟', 'یا از بررسیش می‌ترسی؟', RED, 9, 0), tag('اعتماد', 690, 520, GREEN, 'v', 1), tag('ترس', 390, 520, RED, 'x', 1));
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await document.fonts.load('40px "Noto Color Emoji"', '👇');
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), ...Object.entries(window.IMGS || {}).map(([k, src]) => loadImg(k, src))]);
  const miss = Object.keys(window.IMGS || {}).filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  buildRoom(); window.seek(0); window.ready = true;
});
