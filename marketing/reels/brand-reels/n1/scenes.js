// n1 · «سه تا عدد» on the user's take: «قبل از اینکه حساب پراپ بخری… سه تا عدد رو باید درباره‌ی خودت از حفظ باشی».
// The three numbers are the combination of a vault (the prop account, the real money): three drums spin and lock on
// «یک / دو / سه» (average R, the longest losing streak, the worst drawdown). «پنجمین ضرر» cuts to a heart monitor: five
// «−1R» pile up and the pulse climbs; the trader who doesn't know his numbers goes red and erratic («ریسک ×۲»,
// «اورترید», the strategy thrown away); the one who knows his system had seven in a row in backtest sees «۵ از ۷»,
// breathes, and the line calms. «این آرامش از عدد میاد»: the vault opens, BacktestLab comes out of its light; real gold
// candles (XAUUSD daily, Sep 2025); the three stats under the names the platform's analytics uses; «اول عددهاتو
// بشناس، بعد پول بذار»: the vault, its drums lit, takes the coin. A dark navy "monitor" look, mint and red.
// 1080×1920, every frame a pure function of t (window.seek). Captions type in word by word at the top (y 280–440).
const W = 1080, H = 1920, CX = 540;
const BG = '#070B14', INK = '#EAF0FA', MUT = '#8A97AD', FAINT = '#4C5870', MINT = '#2EE6A8', RED = '#FF4D5E', AMB = '#FFB547', VIO = '#7C5CFF', LILAC = '#B9A6FF';
const STEEL0 = '#3B4659', STEEL1 = '#1B2331', PANEL = '#0D131F';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w, GOLD = D.gold;
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const exIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3);
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** 0 → 1 → 0 window: visible from a (fading in over din) to b (fading out over dout). */
const win = (t, a, b, din = 0.35, dout = 0.35) => Math.min(cub(k01(t, a, din)), 1 - cub(k01(t, b - dout, dout)));

// ---------- drawing ----------
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) {
  cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha;
  cv.font = FONT(size, o.w ?? 900); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl');
  if (o.glow) { cv.shadowColor = o.glow; cv.shadowBlur = o.blur ?? 30; }
  cv.fillText(s, x, y); cv.restore();
}
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function line(x1, y1, x2, y2, col, lw = 3, dash) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; if (dash) cv.setLineDash(dash); cv.beginPath(); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn, rot = 0) { cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
function chip(s, x, y, size, fg, bg, o = {}) { const w = measure(s, size, o.w ?? 800) + size * 1.1, h = size * 1.75; rrect(x - w / 2, y - h / 2, w, h, h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.04, size, fg, { w: o.w ?? 800 }); return w; }
function check(x, y, s, col, k = 1) { cv.save(); cv.strokeStyle = col; cv.lineWidth = s * 0.16; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath();
  const p = [[-0.45, 0.02], [-0.12, 0.34], [0.48, -0.32]], L1 = Math.hypot(0.33, 0.32), L2 = Math.hypot(0.6, 0.66), d = k * (L1 + L2);
  cv.moveTo(x + p[0][0] * s, y + p[0][1] * s); if (d <= L1) cv.lineTo(x + lerp(p[0][0], p[1][0], d / L1) * s, y + lerp(p[0][1], p[1][1], d / L1) * s);
  else { cv.lineTo(x + p[1][0] * s, y + p[1][1] * s); const e = (d - L1) / L2; cv.lineTo(x + lerp(p[1][0], p[2][0], e) * s, y + lerp(p[1][1], p[2][1], e) * s); }
  cv.stroke(); cv.restore(); }
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }

// ---------- background: deep navy, a faint monitor grid, a vignette ----------
function background(t, tint) {
  cv.fillStyle = BG; cv.fillRect(0, 0, W, H);
  if (tint) { const g = cv.createRadialGradient(CX, 980, 100, CX, 980, 1100); g.addColorStop(0, rgba(tint[0], tint[1])); g.addColorStop(1, rgba(tint[0], 0)); cv.fillStyle = g; cv.fillRect(0, 0, W, H); }
  cv.strokeStyle = 'rgba(46,230,168,0.04)'; cv.lineWidth = 2;
  for (let x = 0; x <= W; x += 60) { cv.beginPath(); cv.moveTo(x, 0); cv.lineTo(x, H); cv.stroke(); }
  for (let y = 0; y <= H; y += 60) { cv.beginPath(); cv.moveTo(0, y); cv.lineTo(W, y); cv.stroke(); }
  const v = cv.createRadialGradient(CX, 960, 500, CX, 960, 1300); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H);
}

// ---------- captions: typed in word by word at the top; a block cursor blinks after the last word ----------
// [text, first word index, colour]
const PH = [
  [[['قبل', 0], ['از', 1], ['اینکه', 2], ['حساب', 4], ['پراپ', 5, AMB], ['بخری', 6]], [['یا', 7], ['با', 8], ['پول', 9], ['واقعی', 10, AMB], ['ترید', 11], ['کنی،', 12]]],
  [[['سه', 13, MINT], ['تا', 14, MINT], ['عدد', 15, MINT], ['رو', 16], ['باید', 17]], [['درباره‌ی', 18], ['خودت', 20], ['از', 21], ['حفظ', 22], ['باشی.', 23]]],
  [[['یک:', 24, MINT], ['هر', 25], ['معامله', 26]], [['به‌طور', 27], ['میانگین', 29], ['چند', 30], ['R', 31, MINT], ['برات', 32], ['میاره.', 33]]],
  [[['دو:', 34, MINT], ['بیشترین', 35], ['ضررهای', 36, RED]], [['پشت‌سرهمت', 37], ['چندتا', 39], ['بوده.', 41]]],
  [[['سه:', 42, MINT], ['بدترین', 43], ['افت', 44, RED]], [['حسابت', 45], ['چقدر', 46], ['بوده.', 47]]],
  [[['چرا؟', 48, AMB]], [['چون', 49], ['بالاخره', 50], ['یه', 51], ['روز…', 52]]],
  [[['پنجمین', 53, RED], ['ضرر', 54, RED]], [['پشت‌سرهم', 55], ['میاد…', 57]]],
  [[['تریدری', 58], ['که', 59], ['این', 60], ['عددا', 61], ['رو', 62]], [['نمی‌دونه،', 63, RED]]],
  [[['همون‌جا', 64], ['ریسک', 65, RED], ['رو', 66]], [['دو', 67, RED], ['برابر', 68, RED], ['می‌کنه،', 69]]],
  [[['اورترید', 70, RED], ['می‌کنه،', 71]]],
  [[['یا', 72], ['استراتژی‌ای', 73], ['رو', 74], ['که', 75], ['تا', 76], ['دیروز', 77]], [['سود', 78, MINT], ['می‌داد', 79], ['کنار', 80, RED], ['می‌ذاره.', 81]]],
  [[['ولی', 82, MINT], ['تریدری', 83], ['که', 84], ['می‌دونه', 85]], [['سیستمش', 86], ['تو', 87], ['بک‌تست', 88]]],
  [[['هفت‌تا', 90, AMB], ['ضرر', 91], ['پشت‌سرهم', 92]], [['هم', 93], ['داشته…', 94]]],
  [[['فقط', 95], ['یه', 96], ['نفس', 97, MINT], ['عمیق', 98, MINT], ['می‌کشه', 99]], [['و', 100], ['ادامه', 101, MINT], ['می‌ده.', 102]]],
  [[['این', 103], ['آرامش،', 104, MINT]], [['از', 105], ['عدد', 106, MINT], ['میاد.', 107]]],
  [[['توی', 108], ['بک‌تست‌لب،', 109, LILAC]], [['ستاپت', 112], ['رو', 113], ['روی', 114], ['بازار', 115], ['واقعی', 116], ['تست', 117, MINT], ['می‌کنی،', 118]]],
  [[['و', 119], ['آنالیز', 120, MINT], ['این', 121], ['سه‌تا', 122], ['عدد', 123]], [['رو', 124], ['جلوت', 125], ['می‌ذاره.', 126]]],
  [[['اول', 127], ['عددهاتو', 128, MINT], ['بشناس،', 129]], [['بعد', 130], ['پول', 131, AMB], ['بذار.', 132]]],
];
const phAt = (p) => ws(p[0][0][1]);
function captions(t) {
  if (t >= T.end - 0.05) return;
  let cur = -1; PH.forEach((p, i) => { if (t >= phAt(p) - 0.1) cur = i; });
  if (cur < 0) return;
  const p = PH[cur], next = cur + 1 < PH.length ? phAt(PH[cur + 1]) - 0.1 : T.end - 0.05;
  const g = cv.createLinearGradient(0, 220, 0, 500); g.addColorStop(0, 'rgba(7,11,20,0.85)'); g.addColorStop(1, 'rgba(7,11,20,0)'); cv.fillStyle = g; cv.fillRect(0, 200, W, 300);
  let last = null;
  p.forEach((ln, li) => {
    const size = li === 0 ? 76 : 68, y = 300 + li * 100, gap = measure(' ', size) * 1.3;
    const wds = ln.map(([s]) => measure(s, size)), total = wds.reduce((a, b) => a + b, 0) + gap * (ln.length - 1), sc = Math.min(1, 960 / total);
    let right = CX + (total * sc) / 2;
    ln.forEach(([s, wi, col], j) => {
      const st = cur === 0 && li === 0 ? -1 : ws(wi) - 0.04, wpx = wds[j] * sc;
      if (t >= st) {
        const a = cl((t - st) / 0.06);
        cv.save(); cv.globalAlpha = a * (1 - k01(t, next - 0.06, 0.06)); cv.translate(right - wpx / 2, y); cv.scale(sc, sc); txt(s, 0, 0, size, col ?? INK); cv.restore();
        last = [right - wpx, y, size * sc];
      }
      right -= wpx + gap * sc;
    });
  });
  if (last && Math.floor(t * 2.6) % 2 === 0) rrect(last[0] - 34, last[1] - last[2] * 0.42, 18, last[2] * 0.84, 4, MINT);
}

// ---------- the vault: a steel door, three drums (the combination) ----------
const DRUMS = [{ x: 760, word: 24, label: 'میانگین R', sym: 'R' }, { x: 540, word: 34, label: 'باخت‌های پیاپی', sym: 'streak' }, { x: 320, word: 42, label: 'بدترین افت', sym: 'dd' }];
function drumSymbol(sym, x, y, s = 1) {
  if (sym === 'R') txt('R', x, y + 4, 120 * s, MINT, { dir: 'ltr', glow: rgba(MINT, 0.5), blur: 24 });
  if (sym === 'streak') for (let i = 0; i < 5; i++) rrect(x - 62 * s + i * 26 * s, y - 40 * s, 18 * s, 80 * s, 5, RED);
  if (sym === 'dd') { cv.save(); cv.strokeStyle = RED; cv.lineWidth = 10 * s; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(x - 60 * s, y - 40 * s); cv.lineTo(x - 20 * s, y - 10 * s); cv.lineTo(x, y - 25 * s); cv.lineTo(x + 55 * s, y + 42 * s); cv.stroke(); cv.restore(); }
}
/** state: per drum { spin: t0 or null, land: t or null }, lit (0–1), checks (t or null), open (0–1) */
function vault(t, o) {
  const cx = CX, cy = 960, R = 400, open = o.open ?? 0;
  // the light inside, behind the door
  if (open > 0) {
    const g = cv.createRadialGradient(cx, cy, 20, cx, cy, R * 1.4); g.addColorStop(0, rgba(MINT, 0.9 * open)); g.addColorStop(0.35, rgba(MINT, 0.35 * open)); g.addColorStop(1, rgba(MINT, 0)); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
    cv.save(); cv.globalAlpha = 0.25 * open; cv.translate(cx, cy); for (let i = 0; i < 16; i++) { cv.rotate(Math.PI / 8); rrect(-6, -R * 1.6, 12, R * 1.3, 6, '#FFFFFF'); } cv.restore();
  }
  // the frame
  circle(cx, cy, R + 46, '#121927', '#273044', 6);
  for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; circle(cx + Math.cos(a) * (R + 23), cy + Math.sin(a) * (R + 23), 9, '#3A4558'); }
  // the door, swinging on its hinge (left)
  cv.save(); const hx = cx - R; cv.translate(hx, 0); cv.scale(Math.cos(open * 1.35), 1); cv.translate(-hx, 0);
  const g = cv.createRadialGradient(cx - 120, cy - 160, 40, cx, cy, R); g.addColorStop(0, STEEL0); g.addColorStop(1, STEEL1); circle(cx, cy, R, g, '#4A5568', 6);
  [R - 40, R - 80].forEach((r) => circle(cx, cy, r, null, 'rgba(255,255,255,0.06)', 3));
  rrect(hx - 26, cy - 230, 40, 120, 10, '#2A3344'); rrect(hx - 26, cy + 110, 40, 120, 10, '#2A3344');
  // the plaque
  rrect(cx - 240, cy - 330, 480, 84, 20, PANEL, '#2B3549', 3); txt('حساب پراپ · پول واقعی', cx, cy - 286, 40, AMB, { w: 800 });
  // the drum panel
  rrect(cx - 330, cy - 180, 660, 330, 30, PANEL, '#2B3549', 4);
  DRUMS.forEach((d, i) => {
    const st = o.drums?.[i] ?? {}, x = d.x, y = cy - 30, w = 170, h = 220;
    const landed = st.land !== undefined && st.land !== null && t >= st.land, spinning = st.spin !== undefined && st.spin !== null && t >= st.spin && !landed;
    const lit = landed ? 1 : o.lit ?? 0, glow = landed ? Math.exp(-(t - st.land) * 3) : 0;
    cv.save(); rrect(x - w / 2, y - h / 2, w, h, 22, '#060A12', landed ? MINT : lit > 0 ? rgba(AMB, 0.3 + 0.5 * lit) : '#2B3549', landed ? 5 + 6 * glow : 4);
    cv.beginPath(); cv.roundRect(x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12, 18); cv.clip();
    if (spinning) { const p = cl((t - st.spin) / (st.land - st.spin)), v = (1 - cub(p)) * 30 + i * 3, off = (v % 1) * 120;
      for (let j = -2; j <= 2; j++) txt(fa(String((Math.floor(v) + j + 10) % 10)), x, y + off - j * 120, 110, rgba(INK, j === 0 ? 0.95 : 0.35)); }
    else if (landed) drumSymbol(d.sym, x, y, 1);
    else txt('؟', x, y + 6, 120, lit > 0 ? AMB : MUT);
    // cylinder shading
    const cg = cv.createLinearGradient(0, y - h / 2, 0, y + h / 2); cg.addColorStop(0, 'rgba(0,0,0,0.75)'); cg.addColorStop(0.3, 'rgba(0,0,0,0)'); cg.addColorStop(0.7, 'rgba(0,0,0,0)'); cg.addColorStop(1, 'rgba(0,0,0,0.75)'); cv.fillStyle = cg; cv.fillRect(x - w / 2, y - h / 2, w, h);
    cv.restore();
    txt(`${fa(i + 1)} · ${d.label}`, x, y + 145, 28, landed ? INK : MUT, { w: 800 });
    if (o.checks && t >= o.checks + i * 0.12) { const k = cub(k01(t, o.checks + i * 0.12, 0.3)); circle(x + 70, y - 100, 30, MINT); check(x + 70, y - 98, 34, '#062016', k); }
  });
  // the handle wheel; it turns as the door opens
  cv.save(); cv.translate(cx, cy + 270); cv.rotate(open * 2.4 + (o.turn ?? 0)); circle(0, 0, 60, null, '#5A6577', 10); for (let i = 0; i < 6; i++) { cv.rotate(Math.PI / 3); rrect(-5, -82, 10, 60, 5, '#5A6577'); } circle(0, 0, 18, '#5A6577'); cv.restore();
  // the coin slot (for «بعد پول بذار»)
  if (o.slot) { rrect(cx - 90, cy - R - 2, 180, 18, 9, '#05070C', rgba(AMB, 0.6), 3); }
  cv.restore();
}

// ---------- the heart monitor ----------
/** ECG: y offset at time-phase u (seconds along the trace) for a given rate (beats/min) and chaos (0–1). */
function ecgAt(u, bpm, chaos) {
  const per = 60 / bpm, n = Math.floor(u / per), ph = (u - n * per) / per, jit = chaos * (rnd(n) - 0.5) * 0.25;
  const p = ph + jit, amp = 1 + chaos * (rnd(n + 7) - 0.3) * 1.2;
  let y = Math.sin(u * 30 + n) * 3 * chaos;
  if (p > 0.1 && p < 0.16) y -= 18 * Math.sin(((p - 0.1) / 0.06) * Math.PI);                 // P
  if (p > 0.22 && p < 0.25) y += 26 * ((p - 0.22) / 0.03) * amp;                                // Q
  if (p > 0.25 && p < 0.3) y -= 190 * Math.sin(((p - 0.25) / 0.05) * Math.PI) * amp;            // R
  if (p > 0.3 && p < 0.33) y += 50 * Math.sin(((p - 0.3) / 0.03) * Math.PI) * amp;              // S
  if (p > 0.45 && p < 0.6) y -= 34 * Math.sin(((p - 0.45) / 0.15) * Math.PI);                  // T
  return y;
}
/** The heart rate over time: rising through the streak, racing in the panic, settling with the breath. */
function bpm(t) {
  if (t < T.fifth) return lerp(76, 104, k01(t, T.why, T.fifth - T.why));
  if (t < T.panic) return lerp(104, 118, k01(t, T.fifth, T.panic - T.fifth));
  if (t < T.calm) return lerp(118, 148, k01(t, T.panic, 3));
  if (t < T.breath) return lerp(148, 96, cub(k01(t, T.calm, 1.5)));
  return lerp(96, 70, cub(k01(t, T.breath, 2)));
}
function monitor(t, a) {
  if (a <= 0) return;
  cv.save(); cv.globalAlpha = a;
  const panic = win(t, T.panic, T.calm + 0.2, 0.3, 0.5), calm = cub(k01(t, T.calm, 0.5)), chaos = panic;
  // the screen
  rrect(40, 520, 1000, 900, 40, 'rgba(4,8,14,0.92)', panic > 0.5 ? rgba(RED, 0.6) : calm > 0.5 ? rgba(MINT, 0.5) : '#1D2738', 4);
  cv.save(); cv.beginPath(); cv.roundRect(40, 520, 1000, 900, 40); cv.clip();
  cv.strokeStyle = 'rgba(46,230,168,0.06)'; cv.lineWidth = 2; for (let x = 40; x < 1040; x += 50) { cv.beginPath(); cv.moveTo(x, 520); cv.lineTo(x, 1420); cv.stroke(); } for (let y = 520; y < 1420; y += 50) { cv.beginPath(); cv.moveTo(40, y); cv.lineTo(1040, y); cv.stroke(); }
  // header: who, and the pulse
  const who = panic > 0.5 ? ['تریدرِ بی‌عدد', RED] : calm > 0.5 ? ['تریدرِ با عدد', MINT] : ['ضرر پشت‌سرهم', AMB];
  chip(who[0], 820, 580, 34, '#05070C', who[1]);
  const b = bpm(t), beat = (t * b) / 60, hk = Math.exp(-((beat % 1) * 6)), hc = panic > 0.5 ? RED : MINT;
  at(130, 580, 1 + 0.18 * hk, 1, () => { cv.fillStyle = hc; cv.beginPath(); cv.moveTo(0, 18); cv.bezierCurveTo(-34, -6, -22, -34, 0, -16); cv.bezierCurveTo(22, -34, 34, -6, 0, 18); cv.fill(); });
  txt(fa(Math.round(b)), 230, 582, 54, hc, { dir: 'ltr', w: 900 }); txt('ضربان', 330, 584, 26, MUT, { w: 700 });
  // the five losses, one by one up to «پنجمین»
  for (let i = 0; i < 5; i++) {
    const st = i < 4 ? lerp(T.why + 0.3, T.fifth - 0.35, i / 3) : ws(53), k = pop(t - st, 16, 0.55); if (k <= 0) continue;
    const x = 880 - i * 175, big = i === 4 ? 1 + 0.25 * Math.exp(-(t - st) * 4) : 1;
    at(x, 700, cl(k, 0, 1.2) * big, cl(k), () => { rrect(-75, -46, 150, 92, 22, rgba(RED, i === 4 ? 0.95 : 0.25), RED, 3); txt('−1R', 0, 4, 44, i === 4 ? '#FFFFFF' : RED, { dir: 'ltr' }); });
  }
  const k5 = pop(t - ws(53) - 0.1, 12, 0.5); if (k5 > 0 && t < T.panic + 0.3) at(CX, 800, cl(k5, 0, 1.2), cl(k5) * (1 - k01(t, T.panic, 0.3)), () => txt('پنجمین ضرر پشت‌سرهم', 0, 0, 44, RED, { w: 900 }));
  // the trace, scrolling right to left
  const yc = 1020, sp = 2.2;
  cv.lineWidth = 6; cv.lineJoin = 'round'; cv.strokeStyle = hc; cv.shadowColor = hc; cv.shadowBlur = 18; cv.beginPath();
  let u0 = t * sp; for (let x = 1000; x >= 80; x -= 4) { const u = u0 - (1000 - x) / 420, y = yc + ecgAt(Math.max(0, u), b, chaos); x === 1000 ? cv.moveTo(x, y) : cv.lineTo(x, y); } cv.stroke(); cv.shadowBlur = 0;
  circle(1000, yc + ecgAt(u0, b, chaos), 10, '#FFFFFF');
  // the trader without numbers: three moves, stamped as they are said
  if (panic > 0) {
    cv.save(); cv.globalAlpha *= panic;
    const moves = [['ریسک ×۲', ws(65)], ['اورترید', ws(70)], ['استراتژی کنار گذاشته شد', ws(80)]];
    moves.forEach(([s, st], i) => { const k = pop(t - st, 16, 0.5); if (k <= 0) return; const y = 1200 + i * 82, rot = (i % 2 ? 1 : -1) * 0.04;
      at(CX, y, lerp(1.5, 1, cl(k)), cl(k * 1.5), () => { rrect(-300, -36, 600, 72, 16, rgba(RED, 0.18), RED, 4); txt(s, 0, 3, 40, RED, { w: 900 }); }, rot); });
    cv.restore();
  }
  // the trader with numbers: «۵ از ۷», a deep breath, «ادامه»
  if (calm > 0) {
    const k7 = pop(t - ws(90), 14, 0.6);
    if (k7 > 0) at(CX, 1250, cl(k7, 0, 1.1), cl(k7), () => {
      rrect(-430, -110, 860, 220, 30, rgba(MINT, 0.08), rgba(MINT, 0.6), 3);
      txt('بک‌تست: بیشترین باخت‌های پیاپی', 395, -62, 34, INK, { align: 'right', w: 800 }); chip('مثال', -360, -62, 22, MUT, 'transparent', { stroke: rgba(MUT, 0.5), lw: 2 });
      for (let i = 0; i < 7; i++) { const x = 340 - i * 95, f = i < 5; circle(x, 22, 28, f ? RED : 'transparent', f ? null : rgba(INK, 0.5), 4); }
      const kq = cub(k01(t, ws(94), 0.35)); txt('۵ از ۷ · هنوز تو محدوده‌ی عادیه', 0, 82, 32, MINT, { alpha: kq, w: 800 });
    });
    // the breath: a ring that fills and empties
    const kb = win(t, ws(97), T.peace, 0.3, 0.4);
    if (kb > 0) { const br = 0.5 - 0.5 * Math.cos(((t - ws(97)) / 2.4) * Math.PI * 2), r = lerp(70, 150, br); cv.save(); cv.globalAlpha *= kb * 0.9; circle(CX, yc, r, rgba(MINT, 0.12), MINT, 5); txt(br > 0.5 ? 'دم' : 'بازدم', CX, yc, 38, MINT, { alpha: 0.9 }); cv.restore(); }
    const kp = pop(t - ws(101), 14, 0.55);
    if (kp > 0) at(940, yc - 220, cl(kp, 0, 1.2), cl(kp), () => { circle(0, 0, 52, MINT); cv.fillStyle = '#062016'; cv.beginPath(); cv.moveTo(-14, -22); cv.lineTo(24, 0); cv.lineTo(-14, 22); cv.fill(); });
  }
  cv.restore(); cv.restore();
}

// ---------- real gold candles, tested ----------
function goldPanel(t, a) {
  if (a <= 0) return;
  cv.save(); cv.globalAlpha = a;
  rrect(40, 560, 1000, 820, 40, 'rgba(4,8,14,0.92)', '#1D2738', 4);
  const B = GOLD.bars, N = B.length, x0 = 100, x1 = 980, y0 = 700, y1 = 1260, step = (x1 - x0) / N, bw = step * 0.6;
  const lo = Math.min(...B.map((b) => b[2])) - 15, hi = Math.max(...B.map((b) => b[1])) + 15, Y = (p) => y1 - ((p - lo) / (hi - lo)) * (y1 - y0);
  const n = Math.min(N, Math.floor((t - T.test - 0.2) / 0.11) + 1);
  for (let i = 0; i < Math.max(0, n); i++) { const [o, h, l, c] = B[i], up = c >= o, col = up ? MINT : RED, x = x0 + step * (i + 0.5); line(x, Y(h), x, Y(l), col, 5); rrect(x - bw / 2, Y(Math.max(o, c)), bw, Math.max(6, Math.abs(Y(o) - Y(c))), 5, col); }
  txt('طلا · روزانه · شهریور ۱۴۰۴ · داده‌ی واقعی', CX, 1330, 32, MUT, { w: 700 });
  chip('تست روی بازار واقعی', 790, 625, 32, '#062016', MINT);
  cv.restore();
}
// the three numbers, under the names the platform's analytics uses
function statsPanel(t, a) {
  if (a <= 0) return;
  cv.save(); cv.globalAlpha = a;
  const rows = [['میانگین RR', 'R', ws(121)], ['بیشترین باخت‌های پیاپی', 'streak', ws(122)], ['افت سرمایه در بدترین ۵٪', 'dd', ws(123)]];
  txt('آنالیز', 960, 600, 46, INK, { align: 'right' });
  rows.forEach(([s, sym, st], i) => {
    const k = pop(t - st + 0.15, 14, 0.6); if (k <= 0) return; const y = 760 + i * 230;
    at(CX, y, cl(k, 0, 1.1), cl(k), () => {
      rrect(-450, -95, 900, 190, 34, 'rgba(13,19,31,0.95)', rgba(MINT, 0.5), 3);
      rrect(260, -70, 160, 140, 24, '#060A12'); drumSymbol(sym, 340, 0, 0.75);
      txt(s, 220, -22, 44, INK, { align: 'right', w: 800 });
      const caret = Math.floor(t * 2.6) % 2 ? '▍' : ''; txt('عدد خودت ' + caret, 220, 40, 34, MINT, { align: 'right', w: 700 });
    });
  });
  cv.restore();
}
// the coin, dropped into the vault on «بعد پول بذار»
function coin(t) {
  const st = ws(131) - 0.1, d = t - st; if (d <= 0) return;
  const y = d < 0.55 ? lerp(330, 560, cub(d / 0.55)) : 560, a = d < 0.55 ? 1 : 1 - cl((d - 0.55) / 0.2), s = d < 0.55 ? 1 : lerp(1, 0.6, cl((d - 0.55) / 0.2));
  if (a <= 0) return;
  at(CX, y, s, a, () => { cv.scale(Math.max(0.15, Math.abs(Math.cos(d * 9))), 1); circle(0, 0, 66, AMB, '#C98A1A', 8); txt('$', 0, 6, 80, '#7A4E00', { dir: 'ltr' }); });
}

// ---------- frame ----------
window.DURATION = DUR;
window.seek = (t) => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  const panicK = win(t, T.panic, T.calm + 0.2, 0.3, 0.5), calmK = win(t, T.calm, T.peace + 0.2, 0.4, 0.4);
  background(t, panicK > 0.01 ? [RED, 0.22 * panicK] : calmK > 0.01 ? [MINT, 0.12 * calmK] : null);
  const sh = (a, amp) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0);
  cv.save(); cv.translate(sh(ws(53), 12) + sh(ws(65), 7) + sh(ws(70), 7) + sh(ws(80), 7), 0);
  // 1 · the vault: drums spin and lock on «یک / دو / سه»; zooms away into the monitor on «چرا؟»
  const v1 = 1 - cub(k01(t, T.why - 0.05, 0.45));
  if (v1 > 0) {
    const z = 1 + 0.5 * (1 - v1);
    cv.save(); cv.globalAlpha = v1; cv.translate(CX, 960); cv.scale(z, z); cv.translate(-CX, -960);
    vault(t, { lit: cub(k01(t, ws(13), 0.4)), drums: DRUMS.map((d, i) => ({ spin: T[['one', 'two', 'three'][i]] + 0.05, land: T[['one', 'two', 'three'][i]] + 1.1 })) });
    cv.restore();
  }
  // 2 · the monitor: the streak, the panic, the calm
  monitor(t, Math.min(cub(k01(t, T.why, 0.4)), 1 - cub(k01(t, T.peace - 0.1, 0.4))));
  // 3 · the vault again, its drums known; it opens on «عدد», and BacktestLab comes out of the light
  const v2 = Math.min(cub(k01(t, T.peace - 0.1, 0.4)), 1 - cub(k01(t, T.brand + 0.6, 0.5)));
  if (v2 > 0) { cv.save(); cv.globalAlpha = v2; vault(t, { lit: 1, drums: DRUMS.map(() => ({ spin: null, land: 0 })), checks: T.peace + 0.25, open: cub(k01(t, ws(106) - 0.05, 1.1)) }); cv.restore(); }
  const kl = pop(t - T.brand - 0.1, 11, 0.6);
  if (kl > 0 && t < T.test + 0.5 && IMG.icon) { const out = 1 - cub(k01(t, T.test - 0.1, 0.4)); at(CX, 900, cl(kl, 0, 1.25) * lerp(1, 0.6, 1 - out), cl(kl) * out, () => { cv.shadowColor = rgba(MINT, 0.6); cv.shadowBlur = 70; cv.drawImage(IMG.icon, -150, -150, 300, 300); });
    const kw = cub(k01(t, T.brand + 0.35, 0.35)); if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw * out; cv.drawImage(IMG.word, CX - w / 2, 1110, w, h); cv.restore(); } }
  // 4 · real gold candles, then the three stats
  goldPanel(t, win(t, T.test, T.analytics + 0.2, 0.35, 0.35));
  statsPanel(t, win(t, T.analytics, T.know + 0.2, 0.35, 0.35));
  // 5 · «اول عددهاتو بشناس، بعد پول بذار»: the vault, lit and checked, takes the coin
  const v3 = Math.min(cub(k01(t, T.know - 0.05, 0.4)), 1 - cub(k01(t, T.end - 0.05, 0.4)));
  if (v3 > 0) { cv.save(); cv.globalAlpha = v3; vault(t, { lit: 1, drums: DRUMS.map(() => ({ spin: null, land: 0 })), checks: ws(128), slot: true, turn: cub(k01(t, ws(131) + 0.5, 0.6)) * 1.2 }); coin(t); cv.restore(); }
  // 6 · the end card
  if (t >= T.end - 0.05) {
    const ki = pop(t - T.end, 12, 0.6);
    if (ki > 0 && IMG.icon) at(CX, 700, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(MINT, 0.5); cv.shadowBlur = 70; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
    const kw = cub(k01(t, T.end + 0.25, 0.35)); if (kw > 0 && IMG.word) { const w = 540, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.word, CX - w / 2, 880 + (1 - kw) * 24, w, h); cv.restore(); }
    const kb = pop(t - ws(133) - 0.05, 14, 0.6), pulse = 1 + 0.04 * Math.sin((t - ws(133)) * 6) * (t > ws(133) + 1 ? 1 : 0);
    if (kb > 0) at(CX, 1110, cl(kb, 0, 1.2) * pulse, cl(kb), () => { cv.shadowColor = rgba(MINT, 0.5); cv.shadowBlur = 40; rrect(-250, -70, 500, 140, 70, MINT); cv.shadowBlur = 0; txt('لینک توی بیو', 0, 4, 60, '#062016'); });
    const kf = pop(t - ws(136) - 0.05, 14, 0.55); if (kf > 0) at(CX, 1270, cl(kf, 0, 1.25), cl(kf), () => chip('شروعش رایگانه', 0, 0, 50, '#FFFFFF', VIO));
    const ka = cub(k01(t, ws(136) + 0.5, 0.4)); if (ka > 0) { const y = 1410 - ((t * 1.6) % 1) * 30; cv.save(); cv.globalAlpha = ka; cv.strokeStyle = MINT; cv.lineWidth = 10; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(CX - 34, y + 20); cv.lineTo(CX, y - 14); cv.lineTo(CX + 34, y + 20); cv.stroke(); cv.restore(); }
  }
  captions(t);
  cv.restore();
};
/** The cover: the vault with its three «؟» drums and the hook. */
window.cover = () => {
  cv.setTransform(1, 0, 0, 1, 0, 0); background(0);
  cv.save(); cv.translate(CX, 1060); cv.scale(0.8, 0.8); cv.translate(-CX, -960); vault(0, { lit: 1, drums: DRUMS.map(() => ({})) }); cv.restore();
  txt('۳ تا عدد', CX, 400, 150, MINT, { glow: rgba(MINT, 0.5), blur: 40 });
  txt('که قبل از حساب پراپ', CX, 545, 70, INK); txt('باید از حفظ باشی', CX, 640, 70, INK);
};
(async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word)]);
  window.seek(0); window.ready = true;
})();
