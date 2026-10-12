// «۸۴۷ روز»: pre-launch reel 1. Bitcoin bought at the 2021 top took 847 days to get back to its price.
const CL = DATA.close, TOP = DATA.top, LOW = DATA.low, REC = DATA.rec, BUY = CL[TOP];
const SUB_ON = [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0].map(Boolean);
const LABEL = 'پرونده‌های بازار · ۰۱';

// ---- A · the hook (also the cover) ----
function reel(x, y, w, h, t, spin, k) {
  // one slot-machine digit reel: spins while spin > 0, otherwise shows «؟»
  cv.save(); rr(x, y, w, h, 18); cv.fillStyle = C.raised; cv.fill(); cv.strokeStyle = C.line; cv.lineWidth = 2; cv.stroke(); cv.clip();
  if (spin > 0) {
    const off = (t * (14 + k * 3) + k * 0.37) % 1, d0 = Math.floor(t * (14 + k * 3) + k * 3.7) % 10;
    for (let j = -1; j <= 1; j++) for (let b = 0; b < 3; b++) txt(fa((d0 + j + 10) % 10), x + w / 2, y + h / 2 + (j + off) * h * 0.9 + b * 18, { size: 150, font: 'Rdx', weight: 700, color: C.accentInk, alpha: (0.45 - b * 0.12) * spin });
  }
  const q = 1 - spin; if (q > 0) txt('؟', x + w / 2, y + h / 2 + 6, { size: 150, font: 'Rdx', weight: 700, color: C.lilac, alpha: q, glow: rgba(C.accent, 0.8), scale: 0.9 + 0.1 * q });
  cv.restore();
  const g = cv.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, rgba(C.bg, 0.85)); g.addColorStop(0.3, rgba(C.bg, 0)); g.addColorStop(0.7, rgba(C.bg, 0)); g.addColorStop(1, rgba(C.bg, 0.85)); cv.fillStyle = g; cv.fillRect(x, y, w, h);
}
function hook(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const z = 1 + 0.03 * P(t, 0, S(3)); cv.translate(540, 900); cv.scale(z, z); cv.translate(-540, -900);
  runs([['اگه', C.ink], ['درست', C.ink], ['توی', C.ink], ['سقف', C.lilac]], 540, 440, { size: 92, glow: rgba(C.accent, 0.7) });
  runs([['خریده', C.ink], ['بودی…', C.ink]], 540, 566, { size: 92 });
  // the run-up to the top, the future hidden
  const r = { x: 120, y: 690, w: 760, h: 300 };
  card(80, 650, 920, 380, { alpha: 1 });
  const s = series(r, CL.slice(0, TOP + 1), { lo: 28000, hi: 72000, n: TOP + 1, color: C.accent, fill: C.accent, lw: 5, glow: true });
  const tx = s.X(TOP), ty = s.Y(BUY), pulse = (t * 0.8) % 1; dot(tx, ty, C.lilac, 12, pulse);
  dashLine(tx + 20, ty, 970, ty, rgba(C.lilac, 0.6), 2, [6, 10]);
  txt('؟', 935, 860, { size: 80, font: 'Rdx', weight: 700, color: rgba(C.muted, 0.6) });
  tag(tx - 16, ty - 52, usd(BUY), C.accent, { align: 'right', size: 30 });
  txt('سقف · ۸ نوامبر ۲۰۲۱', 860, 1000, { size: 28, color: C.muted, weight: 500, align: 'right' });
  txt('بیت‌کوین · روزانه', 140, 1000, { size: 28, color: C.faint, weight: 500, align: 'left' });
  // the question and the counter
  const q1 = 1 + 0.6 * win(t, S(1), S(2), 0.2, 0.3);
  txt('چند روز طول می‌کشید', 540, 1112, { size: 46, weight: 600, color: C.ink, alpha: Math.min(1, q1) });
  txt('فقط تا به پولت برگردی؟', 540, 1176, { size: 46, weight: 600, color: C.ink });
  const spin = Math.min(E.out(P(t, S(1) + 0.2, 0.3)), 1 - E.out(P(t, S(2) + 0.5, 0.5)));
  const lock = E.back(P(t, S(2) + 0.6, 0.45));
  for (let k = 0; k < 3; k++) { const bx = 210 + k * 170; cv.save(); if (lock > 0 && lock < 1.2) { cv.translate(bx + 75, 1350); cv.scale(1 + 0.08 * Math.sin(Math.PI * clamp(lock)), 1 + 0.08 * Math.sin(Math.PI * clamp(lock))); cv.translate(-bx - 75, -1350); } reel(bx, 1250, 150, 200, t, spin, k); cv.restore(); }
  txt('روز', 840, 1350, { size: 84, font: 'Rdx', weight: 700, color: C.ink });
  const g = E.out(P(t, S(2), 0.4)); if (g > 0) pill(540, 1540, 'یه عدد حدس بزن · جوابش آخر ویدیو', { size: 34, dot: C.amber, color: C.ink, alpha: g });
  cv.restore();
}

// ---- B · the journey on the chart ----
const R = { x: 110, y: 680, w: 780, h: 470 };
const LO = 10000, HI = 76000;
function journey(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  card(60, 600, 960, 630);
  txt('بیت‌کوین · قیمت پایانی روزانه', 980, 648, { size: 28, color: C.muted, weight: 500, align: 'right' });
  txt('۲۰۲۱ ← ۲۰۲۴', 100, 648, { size: 28, color: C.faint, weight: 500, align: 'left' });
  // how far the line has been drawn
  let upto = 1;
  upto = lerp(1, TOP + 1, E.inOut(P(t, S(3) + 0.1, LN[3] * 0.62)));
  if (t > S(4)) upto = lerp(TOP + 1, LOW + 1, E.in(P(t, S(4) + 0.9, LN[4] - 1.0)));
  if (t > S(6)) upto = LOW + 1;
  if (t > S(7)) upto = lerp(LOW + 1, REC - 40, E.inOut(P(t, S(7), LN[7] + 0.2)));
  if (t > S(8)) upto = lerp(REC - 40, REC + 1, E.inOut(P(t, S(8) + 0.4, LN[8] * 0.55)));
  const X = (i) => R.x + (i / (CL.length - 1)) * R.w, Y = (v) => R.y + (1 - (v - LO) / (HI - LO)) * R.h;
  // grid and the buy line
  cv.strokeStyle = rgba(C.line, 0.7); cv.lineWidth = 1.5; [20000, 40000, 60000].forEach((v) => { cv.beginPath(); cv.moveTo(R.x, Y(v)); cv.lineTo(R.x + R.w, Y(v)); cv.stroke(); txt('$' + fa(v / 1000) + 'K', R.x + R.w + 14, Y(v), { size: 24, color: C.faint, weight: 500, dir: 'ltr', align: 'left' }); });
  const buyA = E.out(P(t, S(3) + LN[3] * 0.62, 0.5));
  if (buyA > 0) { cv.save(); cv.globalAlpha *= buyA; dashLine(X(TOP), Y(BUY), X(TOP) + (R.x + R.w - X(TOP)) * E.out(P(t, S(3) + LN[3] * 0.62, 0.9)), Y(BUY), C.lilac, 3, [12, 10]);
    txt('قیمت خرید تو', R.x + R.w - 6, Y(BUY) - 30, { size: 28, color: C.lilac, weight: 600, align: 'right', alpha: 1 - P(t, S(8) + LN[8] * 0.5, 0.3) }); cv.restore(); }
  // underwater area: below the buy price
  const m = Math.floor(upto);
  if (m > TOP + 1) { cv.beginPath(); cv.moveTo(X(TOP), Y(BUY)); for (let i = TOP; i < m; i++) cv.lineTo(X(i), Y(Math.min(CL[i], BUY))); cv.lineTo(X(m - 1), Y(BUY)); cv.closePath(); cv.fillStyle = rgba(C.loss, 0.16); cv.fill(); }
  const col = (i) => (i > TOP ? C.loss : C.accent);
  cv.lineJoin = 'round'; cv.lineWidth = 4.5;
  for (let i = 1; i < m; i++) { cv.strokeStyle = col(i); cv.beginPath(); cv.moveTo(X(i - 1), Y(CL[i - 1])); cv.lineTo(X(i), Y(CL[i])); cv.stroke(); }
  if (m < CL.length && m > 1) dot(X(m - 1), Y(CL[m - 1]), m - 1 > TOP ? C.loss : C.lilac, 9);
  // the top
  const topA = E.back(P(t, S(3) + LN[3] * 0.55, 0.45));
  if (topA > 0) { dot(X(TOP), Y(BUY), C.lilac, 12, (t * 0.8) % 1); cv.save(); cv.globalAlpha *= clamp(topA); tag(X(TOP) - 18, Y(BUY) - 54, usd(BUY), C.accent, { align: 'right', size: 30 }); txt('۸ نوامبر ۲۰۲۱', X(TOP) + 22, Y(BUY) - 30, { size: 28, color: C.ink, weight: 600, align: 'left' }); cv.restore(); }
  // the low
  const lowA = P(t, S(4) + LN[4] - 0.25, 0.3);
  if (lowA > 0) { dot(X(LOW), Y(CL[LOW]), C.loss, 11); cv.save(); cv.globalAlpha *= lowA; tag(X(LOW), Y(CL[LOW]) + 50, usd(CL[LOW]), C.loss, { size: 30 }); cv.restore(); }
  const big = E.back(P(t, S(4) + LN[4] - 0.25, 0.35)) * (1 - P(t, S(6) - 0.2, 0.3));
  if (big > 0) txt('−۷۶٫۶٪', 540, 480, { size: 150, font: 'Rdx', weight: 700, color: C.loss, dir: 'ltr', scale: big, glow: rgba(C.loss, 0.6) });
  // the recovery touch
  const touch = P(t, S(8) + 0.4 + LN[8] * 0.55, 0.2);
  if (touch > 0) { dot(X(REC), Y(CL[REC]), C.gain, 12, (t * 0.9) % 1); cv.save(); cv.globalAlpha *= touch; txt('۴ مارس ۲۰۲۴', X(REC) - 26, Y(BUY) + 44, { size: 32, color: C.gain, weight: 700, align: 'right' }); cv.restore(); }
  // money: $1000 → $234
  const mA = win(t, S(5), S(6) - 0.05, 0.3, 0.25);
  if (mA > 0) { cv.save(); cv.globalAlpha *= mA; const k = E.inOut(P(t, S(5) + LN[5] * 0.45, LN[5] * 0.45)); const v = Math.round(lerp(1000, 234, k));
    card(140, 1255, 800, 130, { r: 26 }); txt('هر', 880, 1320, { size: 40, weight: 600, color: C.muted, align: 'right' });
    txt(usd(1000), 760, 1320, { size: 56, font: 'Rdx', weight: 700, color: C.ink, dir: 'ltr', align: 'right' });
    txt('←', 540, 1322, { size: 54, weight: 700, color: C.faint });
    txt(usd(v), 200, 1320, { size: 64, font: 'Rdx', weight: 700, color: k > 0.02 ? C.loss : C.ink, dir: 'ltr', align: 'left', glow: k > 0.95 ? rgba(C.loss, 0.5) : undefined }); cv.restore(); }
  // the day counter
  const dA = win(t, S(6), S(9) - 0.05, 0.35, 0.2);
  if (dA > 0) { cv.save(); cv.globalAlpha *= dA;
    const day = Math.max(0, Math.round((t < S(7) ? LOW : upto - 1) - TOP)); const hide = E.out(P(t, S(8) - 0.1, 0.5));
    card(140, 1250, 800, 140, { r: 26, border: rgba(C.loss, 0.6) });
    txt('روز', 860, 1320, { size: 48, weight: 700, font: 'Rdx', color: C.muted, align: 'right' });
    if (hide < 1) txt(fa(day), 540, 1322, { size: 110, font: 'Rdx', weight: 700, color: C.ink, alpha: 1 - hide });
    if (hide > 0) txt('؟؟؟', 540, 1326, { size: 110, font: 'Rdx', weight: 700, color: C.lilac, alpha: hide, glow: rgba(C.accent, 0.7) });
    txt('زیر قیمت خرید', 210, 1322, { size: 30, weight: 600, color: C.loss, align: 'left' });
    const half = win(t, S(6) + LN[6] * 0.45, S(7) + 0.4, 0.3, 0.3); if (half > 0) pill(540, 545, 'تازه نصف راه هم نیست', { size: 38, dot: C.loss, color: C.ink, alpha: half });
    cv.restore(); }
  cv.restore();
}

// ---- D · the reveal ----
function reveal(t, a) {
  if (a <= 0) return; const k = E.back(P(t, S(9), 0.5));
  glow(540, 880, 700, 600, C.accent, 0.35 * a);
  txt('۸۴۷', 540, 860, { size: 330, font: 'Rdx', weight: 700, color: C.lilac, alpha: a, scale: 0.6 + 0.4 * k, glow: rgba(C.accent, 0.9), glowBlur: 70 });
  txt('روز', 540, 1080, { size: 110, font: 'Rdx', weight: 700, color: C.ink, alpha: a * E.out(P(t, S(9) + 0.3, 0.4)) });
  txt('از ۸ نوامبر ۲۰۲۱ تا ۴ مارس ۲۰۲۴ · بیش از ۲ سال', 540, 1210, { size: 36, color: C.muted, weight: 500, alpha: a * E.out(P(t, S(9) + 0.7, 0.5)) });
  const q = E.back(P(t, S(10), 0.4)); if (q > 0) { cv.save(); cv.globalAlpha = a; cv.translate(540, 1370); cv.scale(q, q); pill(0, 0, 'حدس تو چند بود؟', { size: 44, dot: C.amber, color: C.ink }); cv.restore(); }
}

// ---- E · the real question ----
function question(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const s1 = E.out(P(t, S(11), 0.5)), s2 = E.out(P(t, S(11) + LN[11] * 0.4, 0.5));
  txt('ولی سؤال اصلی این نیست که برگشت.', 540, 470, { size: 46, color: C.muted, weight: 500, alpha: s1 });
  txt('سؤال اینه:', 540, 600, { size: 46, color: C.muted, weight: 600, alpha: s2 });
  headline([['تو این ۸۴۷ روز رو', 92, C.ink], [[['دووم', C.lilac], ['میاوردی؟', C.lilac]], 104]], t, S(11) + LN[11] * 0.48, S(12) - 0.05, { y: 730, gap: 140, glow: rgba(C.accent, 0.6) });
  // the valley: drop below the buy price, day by day
  const r = { x: 120, y: 1060, w: 840, h: 330 }, n = REC - TOP + 1, k = E.inOut(P(t, S(11) + 0.4, LN[11] - 0.8));
  card(80, 1010, 920, 430, { alpha: 1 });
  const dd = CL.slice(TOP, REC + 1).map((v) => Math.min(0, v / BUY - 1));
  const X = (i) => r.x + (i / (n - 1)) * r.w, Y = (v) => r.y + (-v / 0.95) * r.h;
  cv.beginPath(); cv.moveTo(X(0), Y(0)); const m = Math.max(2, Math.floor(n * k)); for (let i = 0; i < m; i++) cv.lineTo(X(i), Y(dd[i])); cv.lineTo(X(m - 1), Y(0)); cv.closePath();
  const g = cv.createLinearGradient(0, r.y, 0, r.y + r.h); g.addColorStop(0, rgba(C.loss, 0.08)); g.addColorStop(1, rgba(C.loss, 0.45)); cv.fillStyle = g; cv.fill();
  cv.strokeStyle = C.loss; cv.lineWidth = 3; cv.beginPath(); for (let i = 0; i < m; i++) (i ? cv.lineTo : cv.moveTo).call(cv, X(i), Y(dd[i])); cv.stroke();
  dashLine(r.x, Y(0), r.x + r.w, Y(0), rgba(C.muted, 0.6), 2, [6, 8]);
  txt('۰٪ · قیمت خرید', r.x + r.w, Y(0) - 26, { size: 26, color: C.muted, weight: 500, align: 'right' });
  if (k > 0.5) { const lo = LOW - TOP; dot(X(lo), Y(dd[lo]), C.loss, 8); txt('−۷۶٫۶٪', X(lo) + 22, Y(dd[lo]) - 6, { size: 36, font: 'Rdx', weight: 700, color: C.loss, dir: 'ltr', align: 'left', alpha: P(k, 0.5, 0.15) }); }
  txt('۸۴۷ روز تا برگشت به قیمت خرید', 540, 1412, { size: 30, color: C.ink, weight: 600, alpha: P(k, 0.9, 0.1) });
  cv.restore();
}

// ---- F · the lesson ----
function lesson(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  txt('قبل از هر ورود، باید بدونی:', 540, 470, { size: 54, font: 'Rdx', weight: 700, color: C.ink, reveal: E.out(P(t, S(12), 0.6)) });
  const c1 = E.back(P(t, S(12) + LN[12] * 0.22, 0.45)), c2 = E.back(P(t, S(12) + LN[12] * 0.5, 0.45));
  const statCard = (x, title, val, col, k) => { if (k <= 0) return; cv.save(); cv.translate(x + 210, 720); cv.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k); cv.globalAlpha *= clamp(k); card(-210, -150, 420, 300, { glow: rgba(col, 0.25) });
    txt(title, 170, -88, { size: 34, color: C.muted, weight: 600, align: 'right' }); txt(val, 0, 30, { size: 92, font: 'Rdx', weight: 700, color: col, dir: val.includes('٪') ? 'ltr' : 'rtl', glow: rgba(col, 0.4) }); cv.restore(); };
  statCard(560, 'بدترین افت', '−۷۶٫۶٪', C.loss, c1);
  statCard(100, 'زمان برگشت', '۸۴۷ روز', C.lilac, c2);
  headline([[[['این،', C.ink], ['کار', C.ink], ['بک‌تسته.', C.lilac]], 104]], t, S(12) + LN[12] * 0.8, S(13) - 0.05, { y: 1080, glow: rgba(C.accent, 0.7) });
  cv.restore();
}

// ---- G · comment ----
function comment(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['حدست رو', 112, C.ink], ['کامنت کن', 124, C.lilac]], t, S(13), S(14) - 0.05, { y: 640, gap: 150, glowAll: rgba(C.accent, 0.5) });
  card(110, 960, 860, 150, { r: 75 });
  const g = cv.createLinearGradient(870, 990, 950, 1080); g.addColorStop(0, C.grad0); g.addColorStop(1, C.grad1); cv.fillStyle = g; cv.beginPath(); cv.arc(900, 1035, 42, 0, 7); cv.fill();
  const typed = 'حدس من: ' + fa(Math.min(999, Math.floor(P(t, S(13) + 0.3, 0.9) * 365))) + ' روز';
  const tw = txt(typed, 830, 1036, { size: 40, color: C.ink, weight: 500, align: 'right', reveal: E.out(P(t, S(13) + 0.1, 0.6)) });
  if (Math.floor(t * 2.5) % 2 === 0) { cv.fillStyle = C.lilac; cv.fillRect(830 - tw - 10, 1012, 4, 48); }
  cv.restore();
}

// ---- H · coming soon ----
function outro(t) {
  const e = E.out(P(t, S(14) - 0.1, 0.7)); if (e <= 0) return;
  glow(540, 820, 700, 500, C.accent, 0.3 * e);
  if (IMG.logo) { const w = 660, h = (w * IMG.logo.height) / IMG.logo.width; cv.save(); cv.globalAlpha = e; cv.drawImage(IMG.logo, 540 - w / 2, 800 - h / 2 + (1 - e) * 24, w, h); cv.restore(); }
  const b = E.back(P(t, S(14) + 0.5, 0.5)); if (b > 0) button(540, 1010, 'به‌زودی', { size: 46, scale: b });
  txt('فالو کن تا روز لانچ رو از دست ندی', 540, 1150, { size: 40, color: C.muted, weight: 500, alpha: E.out(P(t, S(14) + 1.0, 0.6)) });
}

function render(t) {
  const shake = (t > S(4) + LN[4] - 0.3 && t < S(4) + LN[4] + 0.6) ? (1 - P(t, S(4) + LN[4] - 0.3, 0.9)) * 10 : 0;
  const tense = clamp(win(t, S(4) + 1, S(9), 0.8, 0.5)) * 0.9 + 0.6 * win(t, S(11), S(12), 0.5, 0.5);
  background(t, { tense });
  cv.save(); cv.translate(Math.sin(t * 70) * shake, Math.cos(t * 61) * shake);
  hook(t, 1 - E.in(P(t, S(3) - 0.35, 0.3)));
  journey(t, win(t, S(3) - 0.1, S(9) + 0.05, 0.35, 0.3));
  reveal(t, win(t, S(9) - 0.05, S(11) + 0.05, 0.2, 0.3));
  question(t, win(t, S(11) - 0.05, S(12) + 0.05, 0.3, 0.3));
  lesson(t, win(t, S(12) - 0.05, S(13) + 0.05, 0.3, 0.3));
  comment(t, win(t, S(13) - 0.05, S(14) + 0.05, 0.25, 0.25));
  outro(t);
  cv.restore();
  chrome(t, LABEL, { alpha: 1 - P(t, S(14) - 0.3, 0.3), dot: C.loss });
  subs(t, SUB_ON);
  cutFx(t, [S(3) - 0.15, S(9) - 0.05, S(11) - 0.05, S(12) - 0.05, S(13) - 0.05, S(14) - 0.1]);
  // flash on the recovery touch and on the reveal
  [S(8) + 0.4 + LN[8] * 0.55, S(9)].forEach((c, i) => { const k = 1 - Math.abs(t - c) / 0.25; if (k > 0) { cv.fillStyle = rgba(i ? C.lilac : C.gain, 0.22 * k); cv.fillRect(0, 0, W, H); } });
  finish(t);
}
boot(render);
