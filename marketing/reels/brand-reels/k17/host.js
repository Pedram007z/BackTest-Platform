// k17 · «به استراتژیت اعتماد داری یا از بررسی کردنش می‌ترسی؟», a talking trader character with motion graphics, on
// k16's cut of the user's voice. The character is original (no real person's likeness): a young trader in a charcoal
// hoodie with lime drawstrings, drawn in flat vector shapes. His mouth follows the voice (vo: loudness → open, bright vs
// dark sounds → wide, from ../char/voicefeat.py). He blinks, nods on the stressed words and tilts his head on the
// questions; his brows rise on «می‌ترسی؟» and frown on «کار نمی‌کنه». His hand counts the three answers (۱، ۲، ۳),
// points up at the screen and down at the bio, and waves at the end. Motion graphics pop up above him:
//   - the hook: «اعتماد داری… یا می‌ترسی؟» and a balance that tips from «اعتماد» to «ترس»;
//   - «بیا ببینیم…»: a magnifier sweeping over question marks;
//   - «سه تا جواب»: a huge «۳» and three cards (a green check, an amber risk knob, a red cross);
//   - each answer: its card in the middle (the knob turns down and the lot bars shrink; a bill drops toward the cross
//     and stops short, with a check);
//   - «هر سه تاش از ندونستن بهتره»: the three cards, and a grey «ندونستن» card struck through;
//   - «۵۰ تا معامله»: a counter and 50 tiles; then the real gold replay (k13's screens) with the planned sell ringed;
//   - the free start, an arrow down to the bio, the end card.
// Word-by-word captions run under him. 1080×1920, every frame a pure function of t (window.seek).
const W = 1080, H = 1920, CX = 540;
const INK = '#1A1430', VIO = '#6C47FF', LIL = '#A58BFF', LIME = '#C6F24E', GRN = '#16B37A', RED = '#F0435B', AMB = '#FFB020', WHITE = '#FFFFFF', MD = '#9C95B8';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w, VO = D.vo;
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const pulse = (t, a, d = 0.35) => (t >= a && t < a + d ? Math.sin(((t - a) / d) * Math.PI) : 0);

// ---------- drawing ----------
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) { cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha; cv.font = FONT(size, o.w ?? 900); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl'); cv.fillText(s, x, y); cv.restore(); }
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function ell(x, y, rx, ry, fill, rot = 0) { cv.beginPath(); cv.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); cv.fillStyle = fill; cv.fill(); }
function seg(x1, y1, x2, y2, col, lw) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn, rot = 0) { cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
function shadowed(fn, blur = 40, dy = 14, a = 0.35) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
function chip(s, x, y, size, fg, bg) { const w = measure(s, size, 800) + size * 1.1, h = size * 1.75; rrect(x - w / 2, y - h / 2, w, h, h / 2, bg); txt(s, x, y + size * 0.04, size, fg, { w: 800 }); return w; }
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];

// ================= the character =================
const SKIN = '#E8B48E', SKIN2 = '#D49A74', SKIN3 = '#B97A57', HAIR = '#1C1513', HAIR2 = '#3A2C26', BEARD = '#2A1D18', HOOD = '#2E2940', HOOD2 = '#3B3552', HOOD3 = '#221E31', LIP = '#B5574B';
// the mouth curves: loudness → open, bright vs dark sounds → wide
const voAt = (arr, t) => { const f = t * VO.fps, i = Math.max(0, Math.min(arr.length - 1, Math.floor(f))), j = Math.min(arr.length - 1, i + 1), u = f - Math.floor(f); return arr[i] * (1 - u) + arr[j] * u; };
const voSlow = (t) => { let s = 0, n = 0; for (let k = -8; k <= 8; k++) { const w = 1 - Math.abs(k) / 9; s += voAt(VO.open, t + k / VO.fps) * w; n += w; } return s / n; };
function blinkAt(t) { let b = 0; const bt = [0.9]; let x = 0.9, r = 7; while (x < t + 1) { r = (r * 16807) % 2147483647; x += 2.4 + (r / 2147483647) * 2.4; bt.push(x); } [...bt, T.three - 0.1, T.all - 0.1, T.cta - 0.1].forEach((b0) => { const u = t - b0; if (u >= 0 && u < 0.17) b = Math.max(b, u < 0.06 ? u / 0.06 : 1 - (u - 0.06) / 0.11); }); return b; }
const win = (t, a, b, d = 0.25) => Math.min(sm(k01(t, a - d, d)), 1 - sm(k01(t, b, d)));
/** Everything the face and head do at t. */
function faceState(t) {
  const end = DUR - 0.9, talking = t < T.end + 0.1, open = talking ? cl(voAt(VO.open, t) * 0.8) : 0, wide = talking ? voAt(VO.wide, t) : 0, env = talking ? voSlow(t) : 0;
  const stress = [ws(2), ws(9), ws(18), ws(23), ws(34), ws(40), ws(49), ws(59), ws(65), ws(69), ws(77), ws(80)];
  const nod = 5 * (env - 0.3) + 2 * Math.sin(t * 0.9) + stress.reduce((a, s) => a + 9 * pulse(t, s - 0.02, 0.3), 0);
  const roll = 1.4 * Math.sin(t * 0.61) + 0.7 * Math.sin(t * 1.37) + 5 * win(t, ws(4), ws(9) + 0.4) - 4 * win(t, T.see, T.three - 0.1) + 3 * win(t, T.end, end);
  const brow = 0.9 * win(t, ws(8) - 0.1, ws(9) + 0.3, 0.15) + 0.8 * win(t, ws(13), ws(15) + 0.3, 0.15) + 0.5 * win(t, ws(17), ws(21), 0.2) - 0.7 * win(t, ws(50), ws(58), 0.2) + 0.25 * cl((env - 0.4) * 2);
  const smile = 0.15 + 0.5 * win(t, ws(28), ws(32) + 0.2) + 0.35 * win(t, ws(42), ws(47)) + 0.6 * win(t, ws(59), ws(59) + 0.8) + 0.55 * win(t, ws(65) - 0.1, T.week + 0.3) + 0.6 * win(t, ws(79), 99) - 0.15 * win(t, ws(50), ws(58));
  const lookY = -0.9 * win(t, ws(69) + 0.1, T.cta - 0.05, 0.2) + 0.6 * win(t, ws(81) + 0.1, T.end, 0.2);
  const lookX = -0.5 * win(t, ws(69) + 0.1, T.cta - 0.05, 0.2) - 0.4 * win(t, ws(81) + 0.1, T.end, 0.2);
  return { open, wide, nod, roll, brow, smile: cl(smile), blink: blinkAt(t), lookX, lookY, sway: 5 * Math.sin(t * 0.43) };
}
// ---- the hand: fingers [thumb, index, middle, ring, pinky], each 0 folded … 1 straight ----
function hand(f, flip = 1) {
  cv.save(); cv.scale(flip, 1);
  const out = SKIN3, len = [0, 74, 80, 74, 58], xs = [0, -30, -10, 10, 30];
  // thumb (on the side toward his body: +x)
  cv.save(); cv.translate(40, -38); cv.rotate(lerp(-1.25, 0.55, f[0])); const tl = lerp(30, 58, f[0]); rrect(-12, -tl, 24, tl + 12, 12, SKIN, out, 3); cv.restore();
  rrect(-48, -100, 96, 104, 30, SKIN, out, 3);
  for (let i = 1; i <= 4; i++) { const l = lerp(16, len[i], f[i]); cv.save(); cv.translate(xs[i], -90); cv.rotate((i - 2.5) * 0.11 * f[i]); rrect(-10, -6 - l, 20, l + 14, 10, SKIN, out, 3); cv.restore(); }
  rrect(-48, -100, 96, 104, 30, SKIN); seg(-36, -98, 36, -98, rgba(SKIN3, 0.0), 2);
  for (let i = 1; i <= 4; i++) if (f[i] < 0.5) ell(xs[i], -96, 9, 6, SKIN2);
  cv.restore();
}
// gesture poses for the hand on screen left (his right): wrist position (from the neck), hand rotation, fingers
const POSE = {
  rest: { w: [-310, 820], r: Math.PI, f: [1, 1, 1, 1, 1] }, palm: { w: [-300, 30], r: -0.12, f: [1, 1, 1, 1, 1] }, shrug: { w: [-350, 120], r: -0.75, f: [1, 1, 1, 1, 1] },
  one: { w: [-300, -30], r: -0.06, f: [0, 1, 0, 0, 0] }, two: { w: [-300, -30], r: -0.06, f: [0, 1, 1, 0, 0] }, three: { w: [-300, -30], r: -0.06, f: [0, 1, 1, 1, 0] },
  jab: { w: [-250, 0], r: 0.35, f: [0, 1, 0, 0, 0] }, open: { w: [-360, 70], r: -0.6, f: [1, 1, 1, 1, 1] }, up: { w: [-270, -150], r: 0.32, f: [0, 1, 0, 0, 0] },
  down: { w: [-250, 90], r: Math.PI - 0.2, f: [0, 1, 0, 0, 0] }, wave: { w: [-310, -60], r: -0.1, f: [1, 1, 1, 1, 1] },
};
// when each pose starts (the hand moves there over 0.28 s)
const GEST_R = () => [[-9, 'palm'], [T.see - 0.05, 'shrug'], [ws(18) - 0.15, 'three'], [ws(22) - 0.1, 'one'], [ws(33) - 0.1, 'two'], [ws(48) - 0.1, 'three'], [ws(59) - 0.12, 'jab'],
  [T.all - 0.05, 'open'], [ws(68), 'up'], [T.cta + 0.05, 'palm'], [ws(81) - 0.15, 'down'], [T.end + 0.05, 'wave']];
const GEST_L = () => [[-9, 'rest'], [T.see - 0.05, 'shrug'], [T.three - 0.05, 'rest'], [T.all - 0.05, 'open'], [T.week, 'rest']];
function poseAt(t, list) {
  let a = POSE[list[0][1]], b = a, k = 1;
  for (let i = 0; i < list.length; i++) if (t >= list[i][0]) { a = i ? POSE[list[i - 1][1]] : POSE[list[i][1]]; b = POSE[list[i][1]]; k = sm(k01(t, list[i][0], 0.28)); }
  return { w: [lerp(a.w[0], b.w[0], k), lerp(a.w[1], b.w[1], k)], r: lerp(a.r, b.r, k), f: a.f.map((v, i) => lerp(v, b.f[i], k)), name: b === POSE.wave ? 'wave' : '' };
}
/** An arm from shoulder S to wrist W (two bones, elbow bent outward and down), then the hand. */
function arm(S, Wr, rot, f, side, t) {   // side: +1 the arm on screen left, −1 on screen right
  const L1 = 215, L2 = 250, dx = Wr[0] - S[0], dy = Wr[1] - S[1], d = Math.min(L1 + L2 - 1, Math.hypot(dx, dy)), base = Math.atan2(dy, dx), off = Math.acos(cl((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const a = base - off * side, E = [S[0] + Math.cos(a) * L1, S[1] + Math.sin(a) * L1], ang = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]), Wp = [E[0] + Math.cos(ang) * L2, E[1] + Math.sin(ang) * L2];
  cv.save(); cv.lineCap = 'round'; cv.lineJoin = 'round';
  cv.strokeStyle = HOOD3; cv.lineWidth = 104; cv.beginPath(); cv.moveTo(...S); cv.lineTo(...E); cv.stroke();
  cv.strokeStyle = HOOD; cv.lineWidth = 96; cv.beginPath(); cv.moveTo(...S); cv.lineTo(...E); cv.stroke();
  cv.strokeStyle = HOOD3; cv.lineWidth = 90; cv.beginPath(); cv.moveTo(...E); cv.lineTo(...Wp); cv.stroke();
  cv.strokeStyle = HOOD2; cv.lineWidth = 82; cv.beginPath(); cv.moveTo(...E); cv.lineTo(...Wp); cv.stroke();
  const cuff = [Wp[0] - Math.cos(ang) * 22, Wp[1] - Math.sin(ang) * 22]; cv.strokeStyle = HOOD3; cv.lineWidth = 86; cv.beginPath(); cv.moveTo(...cuff); cv.lineTo(...Wp); cv.stroke();
  cv.restore();
  at(Wp[0], Wp[1], 1, 1, () => hand(f, side), rot);
}
function head(st) {
  const chinY = -45 + st.open * 12, lx = st.lookX * 10, ly = st.lookY * 4;
  // ears
  [-1, 1].forEach((s) => { ell(s * 156, -232, 24, 40, SKIN2); ell(s * 158, -232, 13, 26, SKIN3); });
  // face
  const facePath = () => { cv.beginPath(); cv.moveTo(0, -415); cv.bezierCurveTo(98, -415, 156, -362, 156, -272); cv.bezierCurveTo(156, -185, 142, -122, 106, -86 + st.open * 6); cv.bezierCurveTo(76, -56 + st.open * 10, 40, chinY, 0, chinY);
    cv.bezierCurveTo(-40, chinY, -76, -56 + st.open * 10, -106, -86 + st.open * 6); cv.bezierCurveTo(-142, -122, -156, -185, -156, -272); cv.bezierCurveTo(-156, -362, -98, -415, 0, -415); cv.closePath(); };
  facePath(); cv.fillStyle = SKIN; cv.fill();
  cv.save(); facePath(); cv.clip(); let g = cv.createLinearGradient(-160, 0, 160, 0); g.addColorStop(0, rgba(LIL, 0.32)); g.addColorStop(0.22, rgba(LIL, 0)); g.addColorStop(0.7, 'rgba(120,60,30,0)'); g.addColorStop(1, 'rgba(120,60,30,0.2)'); cv.fillStyle = g; cv.fillRect(-170, -430, 340, 400);
  // the beard (short, boxed), the moustache
  cv.filter = 'blur(2.5px)'; cv.fillStyle = rgba(BEARD, 0.72); cv.beginPath(); cv.moveTo(156, -205); cv.bezierCurveTo(152, -150, 130, -96, 100, -70 + st.open * 8); cv.bezierCurveTo(70, -44 + st.open * 10, 36, chinY - 1, 0, chinY - 1);
  cv.bezierCurveTo(-36, chinY - 1, -70, -44 + st.open * 10, -100, -70 + st.open * 8); cv.bezierCurveTo(-130, -96, -152, -150, -156, -205); cv.lineTo(-138, -205);
  cv.bezierCurveTo(-128, -150, -104, -110 + st.open * 4, -64, -100 + st.open * 8); cv.bezierCurveTo(-32, -96 + st.open * 10, 32, -96 + st.open * 10, 60, -104 + st.open * 8); cv.bezierCurveTo(104, -110 + st.open * 4, 128, -150, 138, -205); cv.closePath(); cv.fill(); cv.filter = 'none';
  cv.restore();
  // nose
  cv.save(); cv.strokeStyle = SKIN3; cv.lineWidth = 6; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(lx - 4, -262); cv.quadraticCurveTo(lx - 20, -212, lx - 12, -198); cv.quadraticCurveTo(lx + 2, -190, lx + 18, -198); cv.stroke(); cv.restore();
  ell(lx - 14, -199, 6, 4, SKIN3); ell(lx + 16, -199, 6, 4, SKIN3);
  // eyes
  [-1, 1].forEach((s) => { const ex = s * 64 + lx, ey = -258 + ly * 0.5, h = 17 * (1 - st.blink * 0.92);
    cv.save(); cv.beginPath(); cv.ellipse(ex, ey, 30, Math.max(1.5, h * 1.08), 0, 0, Math.PI * 2); cv.fillStyle = '#FFFFFF'; cv.fill(); cv.clip();
    circle(ex + st.lookX * 7, ey + st.lookY * 5, 14, '#3B2416'); circle(ex + st.lookX * 7, ey + st.lookY * 5, 6.5, '#0D0907'); circle(ex + st.lookX * 7 + 5, ey + st.lookY * 5 - 5, 3.5, '#FFFFFF'); cv.restore();
    cv.save(); cv.strokeStyle = '#1A110D'; cv.lineWidth = 7.5; cv.lineCap = 'round'; cv.beginPath(); cv.ellipse(ex, ey, 31, Math.max(1.5, h) + 1, 0, Math.PI * 1.06, Math.PI * 1.94); cv.stroke(); cv.restore(); });
  // brows: up on the questions, in and down on «کار نمی‌کنه»
  [-1, 1].forEach((s) => { const up = st.brow * 12, inner = st.brow < 0 ? -st.brow * 10 : 0; cv.save(); cv.strokeStyle = HAIR; cv.lineWidth = 15; cv.lineCap = 'round'; cv.beginPath();
    cv.moveTo(s * 34 + lx, -298 - up * 0.8 + inner); cv.quadraticCurveTo(s * 66 + lx, -312 - up, s * 96 + lx, -300 - up * 0.6); cv.stroke(); cv.restore(); });
  // mouth
  const mw = 60 + st.wide * 14 + st.smile * 10 - Math.max(0, -st.wide) * 10, mh = 3 + st.open * 44 * (1 - Math.max(0, st.wide) * 0.3), my = -136 + lx * 0 + st.open * 4, mx = lx * 0.6;
  if (mh < 8) { cv.save(); cv.strokeStyle = '#7A3B2E'; cv.lineWidth = 7; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(mx - mw / 2, my - st.smile * 4); cv.quadraticCurveTo(mx, my + 4 + st.smile * 12, mx + mw / 2, my - st.smile * 4); cv.stroke(); cv.restore(); }
  else { const top = my - mh * 0.35, bot = my + mh * 0.65;
    cv.beginPath(); cv.moveTo(mx - mw / 2, my - st.smile * 4); cv.quadraticCurveTo(mx, top - 4, mx + mw / 2, my - st.smile * 4); cv.quadraticCurveTo(mx, bot + 6, mx - mw / 2, my - st.smile * 4); cv.closePath(); cv.fillStyle = LIP; cv.fill();
    cv.save(); cv.beginPath(); cv.moveTo(mx - mw / 2 + 6, my - st.smile * 4); cv.quadraticCurveTo(mx, top + 2, mx + mw / 2 - 6, my - st.smile * 4); cv.quadraticCurveTo(mx, bot, mx - mw / 2 + 6, my - st.smile * 4); cv.closePath(); cv.fillStyle = '#3A1414'; cv.fill(); cv.clip();
    rrect(mx - mw / 2, top - 4, mw, Math.min(12, mh * 0.32) + 4, 4, '#FFFFFF'); if (st.open > 0.35) ell(mx, bot - 4, mw * 0.28, mh * 0.22, '#D9666B'); cv.restore(); }
  cv.fillStyle = BEARD; cv.beginPath(); cv.moveTo(mx - mw / 2 - 8, my - 18 - st.smile * 3); cv.quadraticCurveTo(mx, my - 34, mx + mw / 2 + 8, my - 18 - st.smile * 3); cv.quadraticCurveTo(mx, my - 20, mx - mw / 2 - 8, my - 18 - st.smile * 3); cv.fill();
  // hair: a full swept-up quiff with a wavy hairline, a lighter swoop, a few strands, sideburns
  cv.fillStyle = HAIR; cv.beginPath(); cv.moveTo(-166, -250); cv.bezierCurveTo(-186, -362, -150, -454, -60, -480); cv.bezierCurveTo(20, -502, 122, -494, 170, -430);
  cv.bezierCurveTo(198, -388, 188, -320, 168, -252); cv.bezierCurveTo(160, -300, 150, -332, 128, -352); cv.bezierCurveTo(90, -338, 40, -352, 0, -368);
  cv.bezierCurveTo(-40, -386, -92, -372, -122, -350); cv.bezierCurveTo(-148, -330, -160, -292, -166, -250); cv.closePath(); cv.fill();
  cv.fillStyle = HAIR2; cv.beginPath(); cv.moveTo(-118, -372); cv.bezierCurveTo(-80, -474, 64, -490, 156, -424); cv.bezierCurveTo(74, -444, -16, -434, -118, -372); cv.closePath(); cv.fill();
  cv.save(); cv.strokeStyle = 'rgba(90,70,60,0.55)'; cv.lineWidth = 5; cv.lineCap = 'round';
  [[-90, -400, 40, -462], [-40, -392, 90, -452], [10, -382, 130, -436], [-130, -360, -40, -452]].forEach(([x1, y1, x2, y2]) => { cv.beginPath(); cv.moveTo(x1, y1); cv.quadraticCurveTo((x1 + x2) / 2 - 10, y2 + 10, x2, y2); cv.stroke(); }); cv.restore();
  [-1, 1].forEach((s) => { cv.fillStyle = HAIR; cv.beginPath(); cv.moveTo(s * 164, -276); cv.lineTo(s * 152, -206); cv.lineTo(s * 141, -206); cv.lineTo(s * 146, -290); cv.closePath(); cv.fill(); });
}
function character(t) {
  const st = faceState(t), breath = Math.sin(t * 1.7) * 3;
  cv.save(); cv.translate(CX + st.sway, 1300 + breath);
  // the body: shoulders, the hood around the neck, the drawstrings, the logo on the chest
  const torso = () => { cv.beginPath(); cv.moveTo(-70, -14); cv.bezierCurveTo(-170, -6, -250, 30, -290, 110); cv.bezierCurveTo(-322, 180, -336, 400, -340, 700); cv.lineTo(340, 700); cv.bezierCurveTo(336, 400, 322, 180, 290, 110); cv.bezierCurveTo(250, 30, 170, -6, 70, -14); cv.closePath(); };
  torso(); let g = cv.createLinearGradient(0, -20, 0, 600); g.addColorStop(0, HOOD2); g.addColorStop(1, HOOD3); cv.fillStyle = g; cv.fill();
  cv.save(); torso(); cv.clip(); g = cv.createLinearGradient(-340, 0, 340, 0); g.addColorStop(0, rgba(LIL, 0.35)); g.addColorStop(0.18, rgba(LIL, 0)); cv.fillStyle = g; cv.fillRect(-340, -20, 680, 720); cv.restore();
  // neck
  cv.fillStyle = SKIN2; cv.beginPath(); cv.moveTo(-52, -110); cv.lineTo(52, -110); cv.lineTo(58, 6); cv.lineTo(-58, 6); cv.closePath(); cv.fill();
  cv.fillStyle = 'rgba(120,60,30,0.25)'; cv.fillRect(-52, -110, 104, 40);
  // the hood folded behind the neck
  cv.fillStyle = HOOD3; cv.beginPath(); cv.moveTo(-140, -20); cv.bezierCurveTo(-120, 70, 120, 70, 140, -20); cv.bezierCurveTo(100, 20, -100, 20, -140, -20); cv.fill();
  cv.strokeStyle = HOOD3; cv.lineWidth = 26; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(-130, -16); cv.bezierCurveTo(-90, 30, 90, 30, 130, -16); cv.stroke();
  [-1, 1].forEach((s) => { seg(s * 38, 30, s * 44 + Math.sin(t * 1.3 + s) * 3, 230, LIME, 9); rrect(s * 44 - 7 + Math.sin(t * 1.3 + s) * 3, 226, 14, 30, 5, '#E9FF9E'); });
  if (IMG.icon) { cv.save(); cv.globalAlpha = 0.9; cv.drawImage(IMG.icon, 150, 150, 70, 70); cv.restore(); }
  // the arm on screen right (his left): mostly at rest
  const pl = poseAt(t, GEST_L()); arm([250, 80], [-pl.w[0], pl.w[1]], -pl.r, pl.f, -1, t);
  // the head
  cv.save(); cv.translate(0, -70 + st.nod); cv.rotate((st.roll * Math.PI) / 180); cv.translate(0, 70); head(st); cv.restore();
  // the arm on screen left (his right): the gestures
  const pr = poseAt(t, GEST_R()), wave = pr.name === 'wave' ? Math.sin((t - T.end) * 9) * 0.28 : 0, jab = pulse(t, ws(59), 0.3);
  arm([-250, 80], [pr.w[0] + jab * 30, pr.w[1] - jab * 20], pr.r + wave, pr.f, 1, t);
  cv.restore();
}

// ================= the motion graphics =================
function card(x, y, w, h, fill, r = 36) { shadowed(() => rrect(x - w / 2, y - h / 2, w, h, r, fill), 40, 16, 0.4); }
function gCheck(s = 1) { cv.save(); cv.scale(s, s); cv.strokeStyle = WHITE; cv.lineWidth = 26; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-52, 4); cv.lineTo(-14, 40); cv.lineTo(56, -42); cv.stroke(); cv.restore(); }
function gCross(s = 1) { cv.save(); cv.scale(s, s); cv.strokeStyle = WHITE; cv.lineWidth = 26; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(-46, -46); cv.lineTo(46, 46); cv.moveTo(46, -46); cv.lineTo(-46, 46); cv.stroke(); cv.restore(); }
function gKnob(ang, s = 1) { cv.save(); cv.scale(s, s); circle(0, 0, 70, WHITE); for (let k = 0; k < 7; k++) { const a = Math.PI * (0.75 + (k / 6) * 1.5); seg(Math.cos(a) * 82, Math.sin(a) * 82, Math.cos(a) * 92, Math.sin(a) * 92, '#B26F00', 8); } seg(0, 0, Math.cos(ang) * 52, Math.sin(ang) * 52, AMB, 15); circle(0, 0, 12, AMB); cv.restore(); }
const CARDS = [[GRN, (t, s) => gCheck(s)], [AMB, (t, s) => gKnob(lerp(-Math.PI * 0.2, -Math.PI * 1.18, cub(k01(t, ws(40) - 0.05, 0.45))), s)], [RED, (t, s) => gCross(s)]];
function answerCard(i, t, x, y, S, a = 1) { at(x, y, 1, a, () => { card(0, 0, S, S, CARDS[i][0], S * 0.22); CARDS[i][1](t, S / 220); }); }
function mgScene(t) {
  // which scene's graphics show, with a short pop in and out
  const sc = (k0, k1) => (t >= k0 - 0.05 && t < k1 + 0.15 ? cub(k01(t, k0 - 0.05, 0.2)) * (1 - cub(k01(t, k1 - 0.05, 0.18))) : 0);
  // ---- the hook: the question and a balance tipping from «اعتماد» to «ترس» ----
  let v = sc(-1, T.see); if (v > 0) at(CX, 0, 1, v, () => {
    txt('اعتماد داری…', 0, 290, 104, WHITE, { alpha: 1 }); txt('یا می‌ترسی؟', 0, 410, 104, RED);
    const tilt = lerp(0, -0.13, sm(k01(t, ws(2) - 0.05, 0.4))) + lerp(0, 0.31, sm(k01(t, ws(9) - 0.1, 0.5)));
    rrect(-10, 520, 20, 200, 8, LIL); rrect(-70, 714, 140, 22, 11, LIL); circle(0, 520, 18, LIME);
    at(0, 520, 1, 1, () => { rrect(-280, -9, 560, 18, 9, LIL);
      [[250, 'اعتماد', GRN], [-250, 'ترس', RED]].forEach(([x, s, col]) => { seg(x, 0, x - 60, 110, rgba(LIL, 0.8), 4); seg(x, 0, x + 60, 110, rgba(LIL, 0.8), 4);
        at(x, 110, 1, 1, () => { cv.beginPath(); cv.ellipse(0, 0, 90, 26, 0, 0, Math.PI); cv.fillStyle = LIL; cv.fill(); chip(s, 0, -24, 40, WHITE, col); }, -tilt); }); }, tilt);
  });
  // ---- «بیا ببینیم از چی می‌ترسی؟»: a magnifier sweeping over question marks ----
  v = sc(T.see, T.three); if (v > 0) at(0, 0, 1, v, () => {
    [[300, 470, 150, -0.2], [780, 430, 190, 0.18], [540, 640, 130, 0.05]].forEach(([x, y, s, r], i) => popIn(t, T.see + 0.1 + i * 0.12, () => txt('؟', 0, 0, s, i === 1 ? RED : WHITE), x, y, 0.5, r));
    const k = sm(k01(t, T.see + 0.1, T.three - T.see - 0.2)), mx = lerp(250, 820, k), my = 540 + Math.sin(k * Math.PI * 2) * 60;
    at(mx, my, 1, 1, () => { cv.save(); cv.lineCap = 'round'; cv.strokeStyle = LIME; cv.lineWidth = 22; cv.beginPath(); cv.arc(0, 0, 90, 0, Math.PI * 2); cv.stroke(); cv.lineWidth = 30; cv.beginPath(); cv.moveTo(64, 64); cv.lineTo(140, 140); cv.stroke(); cv.restore(); circle(0, 0, 80, 'rgba(255,255,255,0.12)'); });
  });
  // ---- «سه تا جواب»: a huge «۳» and three cards ----
  v = sc(T.three, T.a1); if (v > 0) at(0, 0, 1, v, () => {
    popIn(t, ws(18) - 0.05, () => txt('۳', 0, 0, 280, LIME), CX, 360, 0.5);
    popIn(t, ws(20), () => chip('جواب', 0, 0, 44, INK, WHITE), CX, 520, 0.55);
    [780, 540, 300].forEach((x, i) => popIn(t, ws(18) + i * 0.1, () => answerCard(i, t, 0, 0, 190), x, 700, 0.55));
  });
  // ---- each answer: its card in the middle, a number badge ----
  [['a1', 'a2', 0, 'ادامه بده'], ['a2', 'a3', 1, 'حجم کمتر'], ['a3', 'all', 2, 'قبل از ضرر']].forEach(([k0, k1, i, label]) => {
    v = sc(T[k0], T[k1]); if (v <= 0) return; at(0, 0, 1, v, () => {
      popIn(t, T[k0], () => answerCard(i, t, 0, 0, 300), CX, 560, 0.5);
      popIn(t, T[k0] + 0.08, () => { circle(0, 0, 46, WHITE); txt(fa(i + 1), 0, 4, 58, INK); }, CX + 150, 410, 0.5);
      if (i === 1) [0, 1, 2].forEach((j) => { const hgt = lerp(150 - j * 20, 50 - j * 8, cub(k01(t, ws(44) - 0.05 + j * 0.06, 0.35))); rrect(820 + j * 46 - 18, 640 - hgt, 36, hgt, 10, AMB); });
      if (i === 1) popIn(t, ws(44), () => chip('حجم', 0, 0, 34, INK, AMB), 866, 690, 0.55);
      if (i === 2) { const kp = pop(t - ws(57) + 0.04, 13, 0.6), drop = cub(k01(t, ws(58), ws(59) - ws(58))) * (1 - cub(k01(t, ws(59), 0.35)));
        if (kp > 0) at(CX, 262 + 80 * drop, cl(kp, 0, 1.1), cl(kp), () => { card(0, 0, 230, 110, '#1F9D63', 16); rrect(-100, -42, 200, 84, 10, null, 'rgba(255,255,255,0.6)', 5); circle(0, 0, 30, 'rgba(255,255,255,0.9)'); txt('$', 0, 3, 42, '#1F9D63', { dir: 'ltr' }); });
        popIn(t, ws(59), () => { circle(0, 0, 52, LIME); cv.save(); cv.strokeStyle = INK; cv.lineWidth = 14; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-22, 2); cv.lineTo(-6, 18); cv.lineTo(24, -16); cv.stroke(); cv.restore(); }, CX + 190, 262, 0.5); }
      popIn(t, T[k0] + 0.2, () => chip(label, 0, 0, 40, INK, CARDS[i][0] === RED ? WHITE : LIME), CX, 770, 0.55);
    });
  });
  // ---- «هر سه تاش از ندونستن بهتره» ----
  v = sc(T.all, T.week); if (v > 0) at(0, 0, 1, v, () => {
    popIn(t, T.all, () => { card(0, 0, 420, 130, '#4A4460', 30); txt('ندونستن', 0, 4, 64, '#B9B3CC'); const ks = cub(k01(t, ws(64) + 0.1, 0.3)); if (ks > 0) rrect(-190, -7, 380 * ks, 14, 7, RED); }, CX, 330, 0.55);
    [780, 540, 300].forEach((x, i) => { const hop = 40 * pulse(t, ws(61) + i * 0.1, 0.35); popIn(t, T.all + 0.1 + i * 0.08, () => answerCard(i, t, 0, -hop, 180), x, 640, 0.55); });
    popIn(t, ws(65), () => chip('بهتره', 0, 0, 52, INK, LIME), CX, 470, 0.5);
  });
  // ---- «این هفته فقط ۵۰ تا معامله‌ی گذشته‌ش رو»: a counter and 50 tiles ----
  v = sc(T.week, T.lab); if (v > 0) at(0, 0, 1, v, () => {
    const n = Math.round(lerp(0, 50, cub(k01(t, ws(69) - 0.05, 0.9))));
    popIn(t, ws(68), () => { txt(fa(n), 0, 0, 230, LIME); }, CX, 340, 0.5);
    popIn(t, ws(70), () => chip('معامله', 0, 0, 42, INK, WHITE), CX, 490, 0.55);
    for (let i = 0; i < 50; i++) { const c = i % 10, r = Math.floor(i / 10), k = pop(t - (ws(69) - 0.05 + i * 0.018), 15, 0.6); if (k <= 0) continue; at(CX + (4.5 - c) * 70, 590 + r * 52, cl(k, 0, 1.2), cl(k), () => rrect(-26, -20, 52, 40, 10, i % 3 ? VIO : LIL)); }
  });
  // ---- «توی بک‌تست‌لب تست کن»: the real gold replay (k13's screens), the planned sell ringed ----
  v = sc(T.lab, T.cta); if (v > 0) at(0, 0, 1, v, () => {
    const RR = [440, 215, 750, 560], QPOS = [800, 340, 328, 284], key = t < ws(77) - 0.04 ? FLIP(t, T.lab - 0.1, ws(77) - 0.04, ['a0', 'a1', 'a2', 'a3', 'a4', 'a5']) : 'cp';
    const w = 720, h = (w * RR[3]) / RR[2], x = CX - w / 2, y = 196, k = cl(pop(t - T.lab + 0.05, 12, 0.6), 0, 1.1);
    at(CX, y + h / 2, lerp(0.9, 1, cl(k)), cl(k), () => { cv.translate(-CX, -(y + h / 2)); shadowed(() => rrect(x - 14, y - 14, w + 28, h + 28, 26, '#0E0B18'), 50, 18, 0.5);
      const im = IMG[key]; if (im) { const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 12); cv.clip(); cv.drawImage(im, RR[0] * s, RR[1] * s, RR[2] * s, RR[3] * s, x, y, w, h); cv.restore(); }
      if (key === 'cp') { const kr = cub(k01(t, ws(77), 0.3)), s = w / RR[2], m = 10 * (1 - kr) + 6; cv.save(); cv.globalAlpha *= kr; cv.strokeStyle = LIME; cv.lineWidth = 7; cv.shadowColor = rgba(LIME, 0.8); cv.shadowBlur = 16; cv.beginPath(); cv.roundRect(x + (QPOS[0] - RR[0]) * s - m, y + (QPOS[1] - RR[1]) * s - m, QPOS[2] * s + 2 * m, QPOS[3] * s + 2 * m, 14); cv.stroke(); cv.restore(); }
      if (IMG.icon) cv.drawImage(IMG.icon, x + w - 70, y - 40, 110, 110);
      txt('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', CX, y + h + 46, 28, WHITE, { w: 700, alpha: 0.75 }); });
  });
  // ---- the free start, an arrow down to the bio ----
  v = sc(T.cta, T.end); if (v > 0) at(0, 0, 1, v, () => {
    popIn(t, T.cta, () => { shadowed(() => { if (IMG.icon) cv.drawImage(IMG.icon, -110, -110, 220, 220); }, 50, 18, 0.45); }, CX, 380, 0.5);
    popIn(t, ws(80) - 0.05, () => chip('شروعش رایگانه', 0, 0, 60, INK, LIME), CX, 600, 0.55);
    const ka = pop(t - ws(81) + 0.05, 13, 0.6); if (ka > 0) at(840, 700 + ((t * 2) % 1) * 24, cl(ka, 0, 1.2), cl(ka), () => { cv.save(); cv.strokeStyle = LIME; cv.lineWidth = 16; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(0, -70); cv.lineTo(0, 50); cv.moveTo(-40, 12); cv.lineTo(0, 54); cv.lineTo(40, 12); cv.stroke(); cv.restore(); });
  });
  // ---- the end card ----
  if (t > T.end - 0.05) { const k = cub(k01(t, T.end, 0.3));
    if (IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = k; cv.drawImage(IMG.word, CX - w / 2, 330 - h / 2 + (1 - k) * 24, w, h); cv.restore(); }
    popIn(t, T.end + 0.25, () => chip('شروعش رایگانه', 0, 0, 56, INK, LIME), CX, 540, 0.55);
    popIn(t, T.end + 0.45, () => chip('لینک توی بیو', 0, 0, 56, WHITE, VIO), CX, 690, 0.6); }
}

// ================= captions: the sentence being said, word by word =================
const CAP = [
  [['به', 0], ['استراتژیت', 1], ['اعتماد', 2], ['داری', 3]], [['یا', 4], ['از', 5], ['بررسی', 6], ['کردنش', 7], ['می‌ترسی؟', 8]],
  [['بیا', 10], ['ببینیم', 11], ['از', 12], ['چی', 13], ['می‌ترسی؟', 14]], [['بررسیش', 16], ['فقط', 17], ['سه', 18], ['تا', 19], ['جواب', 20], ['داره.', 21]],
  [['یا', 22], ['کار', 23], ['می‌کنه،', 24]], [['پس', 26], ['با', 27], ['خیال', 28], ['راحت', 29], ['ادامه', 30], ['می‌دی.', 31]],
  [['یا', 33], ['کار', 34], ['می‌کنه', 35], ['ولی', 37], ['با', 38], ['ریسک', 39], ['کمتر،', 40]], [['پس', 42], ['فقط', 43], ['حجمتو', 44], ['درست', 45], ['می‌کنی.', 46]],
  [['یا', 48], ['کار', 49], ['نمی‌کنه،', 50]], [['پس', 52], ['قبل', 53], ['از', 54], ['اینکه', 55], ['پولتو', 57], ['بگیره،', 58]], [['فهمیدی.', 59]],
  [['هر', 60], ['سه', 61], ['تاش', 62], ['از', 63], ['ندونستن', 64], ['بهتره.', 65]], [['این', 66], ['هفته', 67], ['فقط', 68], ['۵۰', 69], ['تا', 70], ['معامله‌ی', 71], ['گذشته‌ش', 72], ['رو', 73]],
  [['توی', 74], ['بک‌تست‌لب', 75], ['تست', 77], ['کن.', 78]], [['شروعش', 79], ['رایگانه.', 80]], [['لینکش', 81], ['توی', 82], ['بیوئه.', 83]],
];
function captions(t) {
  if (t >= T.end - 0.05) return;
  let s = CAP[0]; CAP.forEach((c) => { if (t >= ws(c[0][1]) - 0.08) s = c; });
  const next = CAP[CAP.indexOf(s) + 1], out = next ? 1 - k01(t, ws(next[0][1]) - 0.1, 0.06) : 1 - k01(t, T.end - 0.15, 0.1);
  const size = 60, gap = measure(' ', size) * 1.4, wds = s.map(([x]) => measure(x, size)), total = wds.reduce((a, b) => a + b, 0) + gap * (s.length - 1), sc = Math.min(1, 940 / total), y = 1545;
  let cur = -1; s.forEach(([, i], j) => { if (t >= ws(i) - 0.04) cur = j; });
  cv.save(); cv.globalAlpha = out; rrect(CX - (total * sc) / 2 - 34, y - 56, total * sc + 68, 112, 30, 'rgba(14,10,28,0.72)');
  let right = CX + (total * sc) / 2;
  s.forEach(([x, i], j) => { const w = wds[j] * sc, cx = right - w / 2, said = j <= cur, now = j === cur, k = pop(t - ws(i) + 0.04, 18, 0.55);
    if (now) { cv.save(); cv.translate(cx, y); cv.scale(lerp(0.85, 1, cl(k)), lerp(0.85, 1, cl(k))); rrect(-w / 2 - 14, -40, w + 28, 80, 18, LIME); cv.restore(); }
    at(cx, y + 3, sc * (now ? lerp(0.9, 1.04, cl(k, 0, 1.2)) : 1), said ? 1 : 0.45, () => txt(x, 0, 0, size, now ? INK : WHITE));
    right -= w + gap * sc; });
  cv.restore();
}

// ================= the stage =================
const TINT = () => [[-1, VIO], [T.see, RED], [T.three, LIME], [T.a1, GRN], [T.a2, AMB], [T.a3, RED], [T.all, VIO], [T.week, LIME], [T.lab, VIO], [T.cta, LIME], [T.end, VIO]];
function stage(t) {
  let g = cv.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120D24'); g.addColorStop(1, '#251B4D'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  cv.strokeStyle = 'rgba(255,255,255,0.04)'; cv.lineWidth = 2; for (let x = 0; x <= W; x += 60) { cv.beginPath(); cv.moveTo(x, 0); cv.lineTo(x, H); cv.stroke(); } for (let y = 0; y <= H; y += 60) { cv.beginPath(); cv.moveTo(0, y); cv.lineTo(W, y); cv.stroke(); }
  // faint candles drifting behind
  for (let i = 0; i < 18; i++) { const x = rnd(i * 3.3) * W, y = ((rnd(i * 5.1) * H - t * (12 + rnd(i) * 18)) % H + H) % H, up = rnd(i * 7.7) > 0.45, h = 60 + rnd(i * 2.2) * 120;
    cv.save(); cv.globalAlpha = 0.1; seg(x, y - h * 0.7, x, y + h * 0.7, up ? GRN : RED, 4); rrect(x - 14, y - h / 2, 28, h, 6, up ? GRN : RED); cv.restore(); }
  // the scene's colour behind him
  TINT().forEach(([t0, col], i, a) => { const t1 = i + 1 < a.length ? a[i + 1][0] : 99, k = cl(k01(t, t0 - 0.2, 0.4)) * (1 - k01(t, t1 - 0.2, 0.4)); if (k <= 0) return;
    const r = cv.createRadialGradient(CX, 1050, 60, CX, 1050, 720); r.addColorStop(0, rgba(col, 0.42 * k)); r.addColorStop(1, rgba(col, 0)); cv.fillStyle = r; cv.fillRect(0, 0, W, H); });
  g = cv.createRadialGradient(CX, 960, 600, CX, 960, 1400); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
}
const PUNCH = () => [ws(9), ws(18), ws(59), ws(65), ws(69), ws(80)];
function frame(t, o = {}) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1;
  stage(t);
  const z = 1 + 0.02 * cl(t / DUR) + PUNCH().reduce((a, p) => a + 0.025 * pulse(t, p - 0.02, 0.4), 0);
  cv.save(); cv.translate(CX, 1150); cv.scale(z, z); cv.translate(-CX, -1150); character(t); cv.restore();
  mgScene(t); captions(t);
  if (!o.cover) { const k = cl(t / T.end); cv.fillStyle = 'rgba(255,255,255,0.1)'; cv.fillRect(0, 0, W, 9); cv.fillStyle = LIME; cv.fillRect(W * (1 - k), 0, W * k, 9); }
}
window.DURATION = DUR;
window.seek = (t) => frame(t);
// the cover: the hook's question with the balance tipped to «ترس»
window.cover = () => frame(ws(9) + 0.6, { cover: true });
window.addEventListener('load', async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), ...Object.entries(window.IMGS || {}).map(([k, src]) => loadImg(k, src))]);
  const miss = Object.keys(window.IMGS || {}).filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  window.seek(0); window.ready = true;
});
