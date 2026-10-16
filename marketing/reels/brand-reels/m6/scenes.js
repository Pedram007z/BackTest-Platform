// m6 · «۵ سال بازار… تو یه آخر هفته؟»: a laptop in a dark room, its screen playing kinetic type that does what the
// voice says the moment it is said (the format of Higgsfield's Katana reel), with the fixed line at the top.
// Screens are drawn in the laptop's own coordinates (1600 × 1000) inside its clipped glass; every beat is timed from
// the spoken words (DATA.w[i] = [start, end] of word i of voice/t1.words.json in the reel). Prices are real gold:
// five years of daily closes, the biggest one-hour fall of those years, and the 5 July 2024 jobs-report replay.
const WT = DATA.w, ws = (i) => WT[i][0], we = (i) => WT[i][1];
const GD = DATA.gold, NF = DATA.nfp;
const GOLD = '#F5B014', GOLD2 = '#FFD566', RED = C.loss, RED2 = '#FF6B7D', GRN = C.gain, GRN2 = '#5CF2B0', VIO = C.accent, VIO2 = '#B5A2FF';
const INK = '#0D0B14', PAPER = '#F3F1F7';
const LW = 1600, LH = 1000, SCR = { x: 46, y: 616, w: 988, h: 618 }, SK = SCR.w / LW;
const fp = (v, d = 0) => fa(v, d).replace(/٬/g, '');
const money = (v) => '⁦' + (v < 0 ? '−' : '+') + '$' + fa(Math.abs(Math.round(v))).replace(/٬/g, ',') + '⁩';
const hit = (t, t0, d = 0.16) => E.out(P(t, t0 - 0.04, d));
const after = (t, t0) => t >= t0 - 0.04;

// ---------- screen helpers (laptop coordinates) ----------
function bgc(col) { cv.fillStyle = col; cv.fillRect(0, 0, LW, LH); }
function bgv(c0, c1) { const g = cv.createRadialGradient(800, 500, 50, 800, 500, 1000); g.addColorStop(0, c0); g.addColorStop(1, c1); cv.fillStyle = g; cv.fillRect(0, 0, LW, LH); }
/** A word that slams in at t0: bigger and blurred → sharp. o: size, color, font, weight, s0, out (time it leaves), glow. */
function pw(s, x, y, t, t0, o = {}) {
  const k = hit(t, t0, o.d ?? 0.16); if (k <= 0) return 0; const out = o.out !== undefined ? 1 - E.in(P(t, o.out, 0.12)) : 1; if (out <= 0) return 0;
  const s0 = o.s0 ?? 1.35; cv.save(); cv.filter = k < 0.99 ? `blur(${((1 - k) * 16).toFixed(1)}px)` : 'none';
  const w = txt(s, x, y + (o.rise ?? 0) * (1 - k), { size: o.size ?? 220, font: o.font ?? 'Vaz', weight: o.weight ?? 900, color: o.color ?? '#fff', alpha: k * out, scale: s0 - (s0 - 1) * k, glow: o.glow, glowBlur: o.glowBlur ?? 60, dir: o.dir, align: o.align, stroke: o.stroke, strokeW: o.strokeW });
  cv.restore(); return w;
}
/** Words that land one by one as they are spoken, in centred rows. items: [[text, word index, colour?], …]; rows: [[item indices], …]. */
function line(items, rows, t, y, o = {}) {
  const size = o.size ?? 150, gap = size * 0.3, lh = size * (o.lh ?? 1.25);
  rows.forEach((row, ri) => { const wd = row.map((k) => measure(items[k][0], size, o.weight ?? 900, 'Vaz')); const total = wd.reduce((a, b) => a + b, 0) + gap * (row.length - 1); let right = 800 + total / 2;
    row.forEach((k, j) => { const [s, wi, col] = items[k]; pw(s, right, y + ri * lh, t, ws(wi), { size, color: col ?? o.color ?? '#fff', align: 'right', s0: 1.25, out: o.out, glow: col ? rgba(col, 0.6) : o.glow }); right -= wd[j] + gap; }); });
}
function burst(t, t0, col, o = {}) { const k = P(t, t0, o.d ?? 0.7); if (k <= 0 || k >= 1) return; const r = rng(o.seed ?? 3); cv.save(); cv.translate(o.x ?? 800, o.y ?? 500); cv.lineCap = 'round';
  for (let i = 0; i < (o.n ?? 40); i++) { const a = r() * 6.283, v = 300 + r() * 700, r0 = v * E.out(k) * 0.55, r1 = v * E.out(k); cv.strokeStyle = rgba(col, (1 - k) * (0.5 + 0.5 * r())); cv.lineWidth = 2 + r() * 5;
    cv.beginPath(); cv.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); cv.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); cv.stroke(); } cv.restore(); }
function glitch(t, tc, cols = [VIO, RED, '#fff']) { const d = Math.abs(t - tc); if (d > 0.09) return; const r = rng(Math.floor(t * 60) + 7); cv.save();
  for (let i = 0; i < 7; i++) { cv.globalAlpha = (1 - d / 0.09) * (0.35 + 0.5 * r()); cv.fillStyle = cols[i % cols.length]; cv.fillRect((r() - 0.5) * 300, r() * LH, LW * (0.4 + r()), 8 + r() * 60); } cv.restore(); }
function flash(t, t0, col, a = 0.6, d = 0.3) { const k = 1 - P(t, t0, d); if (t < t0 || k <= 0) return; cv.save(); cv.globalAlpha = a * k; bgc(col); cv.restore(); }
function shakeAt(t, t0, a = 18, d = 0.35) { const k = 1 - P(t, t0, d); return t >= t0 && k > 0 ? [Math.sin(t * 97) * a * k, Math.cos(t * 83) * a * k] : [0, 0]; }
function qmark(x, y, size, col, rot, k) { if (k <= 0) return; cv.save(); cv.translate(x, y); cv.rotate(rot); cv.scale(E.back(k), E.back(k)); txt('؟', 0, 0, { size, font: 'Vaz', weight: 900, color: col, alpha: clamp(k * 2) }); cv.restore(); }
function playIcon(x, y, s, col, a = 1) { cv.save(); cv.globalAlpha *= a; cv.fillStyle = col; cv.shadowColor = col; cv.shadowBlur = 40; cv.beginPath(); cv.moveTo(x - s * 0.4, y - s * 0.5); cv.lineTo(x + s * 0.55, y); cv.lineTo(x - s * 0.4, y + s * 0.5); cv.closePath(); cv.fill(); cv.restore(); }
function calIcon(x, y, s, col, a = 1) { cv.save(); cv.globalAlpha *= a; cv.strokeStyle = col; cv.lineWidth = s * 0.08; rr(x - s / 2, y - s * 0.4, s, s * 0.85, s * 0.12); cv.stroke(); cv.fillStyle = col; cv.fillRect(x - s / 2, y - s * 0.4, s, s * 0.2);
  [-0.25, 0.25].forEach((u) => cv.fillRect(x + u * s - s * 0.04, y - s * 0.52, s * 0.08, s * 0.2)); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) cv.fillRect(x - s * 0.33 + i * s * 0.25, y - 0.02 * s + j * s * 0.2, s * 0.14, s * 0.12); cv.restore(); }

// ---------- candles in laptop coordinates ----------
function candlesL(R, bars, n, upto, lo, hi, o = {}) {
  const cw = R.w / n, X = (i) => R.x + (i + 0.5) * cw, Y = (v) => R.y + (1 - (v - lo) / (hi - lo)) * R.h;
  cv.save(); cv.globalAlpha *= o.alpha ?? 1; const full = Math.floor(upto);
  for (let i = 0; i <= Math.min(full, bars.length - 1); i++) {
    let [, op, h, l, c] = bars[i]; const u = upto - i;
    if (u < 1) { if (u <= 0) break; const p = partial(bars[i], u, o.wick === i); op = p[0]; h = p[1]; l = p[2]; c = p[3]; }
    const up = c >= op, col = o.color?.(i) ?? (up ? GRN : RED), sc = o.pop ? E.back(clamp(u * 3)) : 1;
    cv.strokeStyle = col; cv.fillStyle = col; cv.lineWidth = Math.max(2, Math.min(5, cw * 0.14));
    cv.beginPath(); cv.moveTo(X(i), Y(h)); cv.lineTo(X(i), Y(l)); cv.stroke();
    const y0 = Y(Math.max(op, c)), hh = Math.max(3, Math.abs(Y(op) - Y(c))); cv.fillRect(X(i) - cw * 0.34 * sc, y0, cw * 0.68 * sc, hh);
  }
  cv.restore(); return { X, Y, cw };
}
function partial(b, u, wick) {
  const [, o, h, l, c] = b; const pts = wick ? [[0, o], [0.45, l], [1, c]] : c >= o ? [[0, o], [0.3, l], [0.7, h], [1, c]] : [[0, o], [0.3, h], [0.7, l], [1, c]];
  let hi = o, lo = o, p = o;
  for (let i = 1; i < pts.length; i++) { const [u0, v0] = pts[i - 1], [u1, v1] = pts[i]; if (u >= u1) { hi = Math.max(hi, v1); lo = Math.min(lo, v1); p = v1; continue; } p = v0 + (v1 - v0) * E.sine(clamp((u - u0) / (u1 - u0))); hi = Math.max(hi, p); lo = Math.min(lo, p); break; }
  return [o, hi, lo, p];
}
function levelL(R, Y, v, col, label, a = 1, o = {}) { if (a <= 0) return; const y = Y(v); cv.save(); cv.globalAlpha *= a; cv.strokeStyle = col; cv.lineWidth = 4; if (o.dash) cv.setLineDash([22, 14]);
  cv.beginPath(); cv.moveTo(o.x0 ?? R.x, y); cv.lineTo(R.x + R.w, y); cv.stroke(); cv.setLineDash([]); cv.restore();
  if (label) { cv.save(); cv.globalAlpha *= a; const w = measure(label, 40, 800, 'Vaz') + 50; rr(R.x + R.w - w, y - 32, w, 64, 32); cv.fillStyle = col; cv.fill(); cv.restore();
    txt(label, R.x + R.w - w / 2, y + 2, { size: 40, weight: 800, color: '#fff', alpha: a, dir: 'rtl' }); } }

// ---------- 1 · «نه… امکان نداره!» ----------
function s1(t) {
  if (t < ws(1) - 0.04) {
    bgc('#05040A'); const k = P(t, 0, ws(0));
    if (t < ws(0)) { const r = rng(11); cv.save(); cv.translate(800, 500); for (let i = 0; i < 50; i++) { const a = r() * 6.283, d = 900 * (1 - E.in(clamp(k + r() * 0.3))); cv.strokeStyle = rgba(VIO2, 0.6 * k); cv.lineWidth = 2; cv.beginPath(); cv.moveTo(Math.cos(a) * d, Math.sin(a) * d); cv.lineTo(Math.cos(a) * (d + 60), Math.sin(a) * (d + 60)); cv.stroke(); } cv.restore();
      glow(800, 500, 40 + 160 * k, 40 + 160 * k, VIO, 0.9); cv.fillStyle = '#fff'; cv.beginPath(); cv.arc(800, 500, 6 + 14 * k, 0, 7); cv.fill(); }
    burst(t, ws(0), VIO2, { n: 60 }); glow(800, 500, 700, 500, VIO, 0.35 * (1 - P(t, ws(0), 0.6)));
    pw('نه', 800, 530, t, ws(0), { size: 620, glow: rgba(VIO, 0.9), s0: 1.6 });
  } else {
    bgc(PAPER); pw('امکان', 800, 330, t, ws(1), { size: 330, color: INK, s0: 1.2 }); pw('نداره!', 800, 700, t, ws(2), { size: 360, color: RED, s0: 1.4, glow: rgba(RED, 0.4) });
  }
  glitch(t, ws(1));
}
// ---------- 2 · «۵ سال بازار طلا… توی یه آخر هفته؟!» ----------
const DL = GD.daily; let DLO = Infinity, DHI = -Infinity; DL.forEach(([, c]) => { DLO = Math.min(DLO, c); DHI = Math.max(DHI, c); });
function race(t, k, a = 1, o = {}) {
  const R = o.R ?? { x: 130, y: 300, w: 1340, h: 560 }, n = DL.length, X = (i) => R.x + (i / (n - 1)) * R.w, Y = (v) => R.y + (1 - (v - DLO * 0.95) / (DHI * 1.03 - DLO * 0.95)) * R.h;
  const m = Math.max(2, Math.floor(n * k)); cv.save(); cv.globalAlpha *= a;
  const yr0 = new Date(DL[0][0] * 1000).getUTCFullYear();
  for (let y = yr0 + 1; y <= 2026; y++) { const i = DL.findIndex(([ts]) => new Date(ts * 1000).getUTCFullYear() === y); if (i < 0) continue; cv.strokeStyle = rgba('#ffffff', 0.08); cv.lineWidth = 2; cv.beginPath(); cv.moveTo(X(i), R.y); cv.lineTo(X(i), R.y + R.h); cv.stroke();
    txt(fy(y), X(i), R.y + R.h + 50, { size: 38, weight: 600, color: rgba('#ffffff', 0.55), font: 'Rdx' }); }
  const g = cv.createLinearGradient(0, R.y, 0, R.y + R.h); g.addColorStop(0, rgba(GOLD, 0.35)); g.addColorStop(1, rgba(GOLD, 0));
  cv.beginPath(); for (let i = 0; i < m; i++) (i ? cv.lineTo : cv.moveTo).call(cv, X(i), Y(DL[i][1])); cv.lineTo(X(m - 1), R.y + R.h); cv.lineTo(X(0), R.y + R.h); cv.closePath(); cv.fillStyle = g; cv.fill();
  cv.beginPath(); for (let i = 0; i < m; i++) (i ? cv.lineTo : cv.moveTo).call(cv, X(i), Y(DL[i][1])); cv.strokeStyle = GOLD; cv.lineWidth = 7; cv.lineJoin = 'round'; cv.shadowColor = GOLD; cv.shadowBlur = 30; cv.stroke(); cv.shadowBlur = 0;
  const hx = X(m - 1), hy = Y(DL[m - 1][1]); cv.fillStyle = '#fff'; cv.beginPath(); cv.arc(hx, hy, 12, 0, 7); cv.fill(); glow(hx, hy, 70, 70, GOLD2, 0.8);
  txt('$' + Math.round(DL[m - 1][1]).toLocaleString('en-US'), Math.min(hx, R.x + R.w - 120), hy - 60, { size: 54, weight: 700, color: GOLD2, dir: 'ltr', font: 'Rdx' });
  txt('$' + Math.round(DL[0][1]).toLocaleString('en-US'), R.x + 10, Y(DL[0][1]) + 60, { size: 40, weight: 600, color: rgba('#ffffff', 0.6), dir: 'ltr', font: 'Rdx', align: 'left' });
  cv.restore();
}
function s2(t) {
  if (t < ws(5) - 0.04) { bgv('#2a1d05', '#05040A'); pw('۵ سال', 800, 520, t, ws(3), { size: 470, color: GOLD2, glow: rgba(GOLD, 0.9), s0: 1.5 }); }
  else if (t < ws(7) - 0.04) { bgc('#07060B'); txt('بازار طلا · ۵ سال', 1470, 130, { size: 64, weight: 800, color: GOLD2, align: 'right' }); race(t, E.inOut(P(t, ws(5) - 0.05, ws(7) - ws(5)))); }
  else { bgv('#6A46FF', '#2A1580'); line([['توی', 7], ['یه', 8], ['آخر', 9], ['هفته؟!', 10, GOLD2]], [[0, 1], [2, 3]], t, 360, { size: 250 }); }
  glitch(t, ws(5)); glitch(t, ws(7));
}
// ---------- 3 · «آره. کندل به کندل؛ با خبرهاش، با سقوط‌هاش… بدون یه دلار ریسک.» ----------
const CB = GD.crash.bars, CI = GD.crash.at; let CLO = Infinity, CHI = -Infinity; CB.forEach((b) => { CLO = Math.min(CLO, b[3]); CHI = Math.max(CHI, b[2]); });
function s3(t) {
  if (t < ws(12) - 0.04) { bgc(PAPER); pw('آره.', 800, 520, t, ws(11), { size: 460, color: INK }); return; }
  if (t < ws(19) - 0.04) {
    const [sx, sy] = shakeAt(t, ws(18), 22); cv.save(); cv.translate(sx, sy); bgc('#07060B');
    const R = { x: 110, y: 250, w: 1380, h: 660 };
    const upto = t < ws(15) ? 18 * P(t, ws(12), ws(15) - ws(12)) : t < ws(17) ? 18 + 10 * P(t, ws(15), ws(17) - ws(15)) : t < ws(18) + 0.05 ? 28 + 2 * P(t, ws(17), ws(18) + 0.05 - ws(17)) : 30 + 1.99 * P(t, ws(18) + 0.05, 0.45);
    const { X, Y } = candlesL(R, CB, CB.length, upto, CLO - 20, CHI + 20, { pop: true });
    [[19, ws(15) + 0.15], [24, ws(16) + 0.1]].forEach(([i, t0]) => { const k = E.back(P(t, t0, 0.35)); if (k <= 0 || i > upto) return; cv.save(); cv.translate(X(i), Y(CB[i][2]) - 70); cv.scale(k, k); rr(-80, -34, 160, 68, 34); cv.fillStyle = GOLD; cv.fill(); txt('⚡ خبر', 0, 2, { size: 36, weight: 800, color: INK }); cv.restore(); });
    if (upto > CI) { flash(t, ws(18) + 0.05, RED, 0.5, 0.4); const k = E.out(P(t, ws(18) + 0.2, 0.3)); cv.save(); cv.globalAlpha = k;
      const ly = R.y + R.h * 0.62; rr(X(CI) - 520, ly - 75, 460, 150, 26); cv.fillStyle = rgba(RED, 0.92); cv.fill(); cv.restore();
      txt(money(GD.crash.drop) + ' در یک ساعت', X(CI) - 290, ly - 22, { size: 46, weight: 900, color: '#fff', alpha: k });
      txt('طلا · ۹ بهمن ۱۴۰۴', X(CI) - 290, ly + 38, { size: 34, weight: 600, color: rgba('#ffffff', 0.85), alpha: k }); }
    const lab = t < ws(15) ? ['کندل به کندل', ws(12), '#fff'] : t < ws(17) ? ['با خبرهاش', ws(15), GOLD2] : ['با سقوط‌هاش', ws(17), RED2];
    pw(lab[0], 800, 130, t, lab[1], { size: 120, color: lab[2], s0: 1.2 });
    cv.restore(); return;
  }
  bgv('#0B3A26', '#03100A'); line([['بدون', 19], ['یه', 20], ['دلار', 21], ['ریسک', 22, GRN2]], [[0, 1, 2, 3]], t, 200, { size: 130 });
  pw('۰ دلار', 800, 600, t, ws(20) + 0.05, { size: 400, color: GRN2, glow: rgba(GRN, 0.8), s0: 1.5 });
}
// ---------- 4 · «و قبل از اینکه بپرسی: نه، این حساب دمو نیست.» ----------
function s4(t) {
  if (t < ws(29) - 0.04) { bgc(PAPER);
    qmark(1350, 330, 520, rgba(VIO, 0.9), 0.25, P(t, ws(24), 0.35)); qmark(250, 720, 400, rgba(RED, 0.9), -0.3, P(t, ws(26), 0.35)); qmark(1250, 820, 300, rgba(GOLD, 0.95), 0.1, P(t, ws(28) + 0.1, 0.35));
    line([['قبل', 24], ['از', 25], ['اینکه', 26]], [[0, 1, 2]], t, 380, { size: 210, color: INK }); pw('بپرسی…', 800, 680, t, ws(28), { size: 270, color: VIO, s0: 1.3 }); return; }
  if (t < ws(30) - 0.04) { bgc(RED); pw('نه،', 800, 520, t, ws(29), { size: 560, s0: 1.6 }); return; }
  bgc('#07060B'); line([['این', 30], ['حساب', 31], ['دمو', 32]], [[0, 1, 2]], t, 400, { size: 230 });
  const k = E.inOut(P(t, ws(33), 0.25)); if (k > 0) { cv.save(); cv.strokeStyle = RED; cv.lineWidth = 26; cv.lineCap = 'round'; cv.shadowColor = RED; cv.shadowBlur = 30; cv.beginPath(); cv.moveTo(260, 420); cv.lineTo(260 + 1080 * k, 380); cv.stroke(); cv.restore(); }
  pw('نیست.', 800, 740, t, ws(33), { size: 280, color: RED2, glow: rgba(RED, 0.7) });
}
// ---------- 5 · «دمو فقط امروزِ بازار رو نشونت می‌ده. این… بک‌تست‌لبه.» ----------
const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'امروز'];
function s5(t) {
  if (t < ws(41) - 0.04) { bgc('#0B0912');
    line([['دمو', 34, VIO2], ['فقط', 35], ['امروزِ', 36, GOLD2], ['بازار', 37], ['رو', 38], ['نشونت', 39], ['می‌ده.', 40]], [[0, 1, 2, 3], [4, 5, 6]], t, 230, { size: 140 });
    DAYS.forEach((d, i) => { const k = E.back(P(t, ws(36) + i * 0.04, 0.3)); if (k <= 0) return; const x = 1430 - i * 205, y = 760, today = i === 6; cv.save(); cv.translate(x, y); cv.scale(k, k);
      card(-90, -100, 180, 200, { r: 24, fill: today ? VIO : '#17141F', border: today ? VIO2 : '#2A2538', shadow: false, glow: today ? rgba(VIO, 0.7) : undefined });
      txt(today ? d : '?', 0, today ? 0 : 10, { size: today ? 44 : 90, weight: 900, color: today ? '#fff' : rgba('#ffffff', 0.25) }); cv.restore(); });
    return; }
  if (t < ws(42) - 0.04) { bgc('#05040A'); pw('این…', 800, 520, t, ws(41), { size: 360, s0: 1.2 }); return; }
  bgv('#3A22B8', '#05040A'); burst(t, ws(42), VIO2, { n: 70, d: 0.9 }); glow(800, 500, 800, 500, VIO, 0.45);
  const k = hit(t, ws(42), 0.3); if (k > 0 && IMG.logo) { const w = 1100, h = (w * IMG.logo.height) / IMG.logo.width; cv.save(); cv.globalAlpha = k; cv.translate(800, 500); const s = 1.3 - 0.3 * k; cv.scale(s, s); cv.shadowColor = rgba(VIO2, 0.9); cv.shadowBlur = 60; cv.drawImage(IMG.logo, -w / 2, -h / 2, w, h); cv.restore(); }
}
// ---------- 6 · «یه روز انتخاب می‌کنی… مثلاً روز خبر NFP.» ----------
function s6(t) {
  bgc('#0D0B14'); line([['یه', 44], ['روز', 45], ['انتخاب', 46], ['می‌کنی…', 47]], [[0, 1, 2, 3]], t, 105, { size: 90, out: ws(48) - 0.1 });
  if (after(t, ws(48))) line([['مثلاً', 48], ['روز', 49], ['خبر', 50, RED2], ['NFP', 51, RED2]], [[0, 1, 2, 3]], t, 105, { size: 90 });
  const k = E.out(P(t, ws(44), 0.35)); cv.save(); cv.globalAlpha = k; cv.translate(0, (1 - k) * 60);
  card(330, 190, 940, 720, { r: 40, fill: '#16121F', border: rgba(VIO, 0.6), shadow: false });
  txt('جلسه‌ی جدید بک‌تست', 1200, 270, { size: 56, weight: 900, align: 'right' });
  const row = (y, label, val, o = {}) => { txt(label, 1200, y, { size: 38, weight: 600, color: C.muted, align: 'right' }); rr(400, y + 30, 800, 90, 22); cv.fillStyle = '#0D0B14'; cv.fill(); cv.strokeStyle = o.on ? VIO : '#2A2538'; cv.lineWidth = o.on ? 4 : 2; cv.stroke(); if (val) txt(val, 1170, y + 77, { size: 46, weight: 800, align: 'right', color: o.col ?? '#fff', dir: o.dir }); };
  row(350, 'نماد', 'طلا · XAUUSD', { col: GOLD2 });
  const typed = '۱۴۰۳/۰۴/۱۵', n = Math.floor(typed.length * P(t, ws(45), we(47) - ws(45)));
  row(520, 'تاریخ', typed.slice(0, n) + (n < typed.length && Math.floor(t * 4) % 2 ? '|' : ''), { on: n < typed.length + 1, dir: 'ltr' });
  // the day's news: the jobs report
  const nk = E.back(P(t, ws(48), 0.35)); if (nk > 0) { cv.save(); cv.translate(800, 800); cv.scale(nk, nk); const pulse = 0.5 + 0.5 * Math.sin(t * 9);
    rr(-400, -60, 800, 120, 30); cv.fillStyle = rgba(RED, 0.15 + 0.15 * (after(t, ws(50)) ? pulse : 0)); cv.fill(); cv.strokeStyle = RED; cv.lineWidth = 4; cv.stroke();
    cv.fillStyle = RED; cv.beginPath(); cv.arc(350, 0, 14, 0, 7); cv.fill();
    txt('۱۶:۰۰ · اشتغال آمریکا (NFP)', 310, 2, { size: 44, weight: 800, align: 'right' }); cv.restore(); }
  cv.restore();
}
// ---------- 7–9 · the replay: «پلی… تند… تندتر… خرید. حد ضرر. حد سود. و حالا… خبر! شوخیت گرفته؟!» ----------
const NB = NF.bars, NI = NF.news, R7 = { x: 90, y: 200, w: 1250, h: 690 }, NLO = 2334, NHI = 2400;
function replayF(t) {
  if (t < ws(52) + 0.2) return 4;
  if (t < ws(60)) { const k = P(t, ws(52) + 0.2, ws(60) - ws(52) - 0.25); return 4 + (NI - 4) * (0.3 * k + 0.7 * k ** 2.2); }
  if (t < ws(67)) return NI;
  if (t < ws(67) + 0.28) return NI + 0.45 * E.in(P(t, ws(67), 0.28)) ** 0.6;
  if (t < ws(67) + 0.6) return NI + 0.45 + 0.55 * E.inOut(P(t, ws(67) + 0.28, 0.32));
  return NI + 1 + (NB.length - NI - 1.001) * E.inOut(P(t, ws(67) + 0.6, ws(68) + 0.75 - ws(67) - 0.6));
}
const TPT = (() => { for (let t = ws(67); t < ws(70); t += 0.005) if (NB[Math.min(NB.length - 1, Math.floor(replayF(t)))][2] >= NF.tp && Math.floor(replayF(t)) >= NF.tp_i) return t; return ws(68) + 0.5; })();
function s7(t) {
  const [sx, sy] = shakeAt(t, ws(67) + 0.12, 26, 0.45); cv.save(); cv.translate(sx, sy);
  bgc('#0B0912'); flash(t, ws(67) + 0.15, RED, 0.45, 0.35); flash(t, TPT, GRN, 0.35, 0.5);
  const f = replayF(t), slots = t < ws(67) + 0.6 ? 34 : lerp(34, NB.length, E.inOut(P(t, ws(67) + 0.6, 0.6)));
  const { X, Y } = candlesL(R7, NB, slots, f, NLO, NHI, { wick: NI });
  // toolbar: play/pause and speed
  const sp = t < ws(58) ? '×۱' : t < ws(59) ? '×۱۰' : t < ws(60) ? '×۶۰' : t >= ws(67) && t < ws(68) + 0.75 ? '×۶۰' : '❚❚';
  const tb = 1 - P(t, ws(68) - 0.15, 0.15); cv.save(); cv.globalAlpha *= tb;
  rr(90, 60, 420, 90, 45); cv.fillStyle = '#17141F'; cv.fill(); cv.strokeStyle = rgba(VIO, 0.6); cv.lineWidth = 3; cv.stroke();
  playIcon(150, 105, 44, VIO2); txt('طلا · ۱۵ تیر ۱۴۰۳', 470, 107, { size: 38, weight: 700, align: 'right', color: C.muted });
  const spk = E.back(P(t, t < ws(59) ? ws(58) : ws(59), 0.3)); cv.save(); cv.translate(1430, 105); cv.scale(after(t, ws(58)) ? spk : 1, after(t, ws(58)) ? spk : 1); rr(-110, -42, 220, 84, 42); cv.fillStyle = after(t, ws(58)) && t < ws(60) ? VIO : '#17141F'; cv.fill(); txt(sp, 0, 3, { size: 46, weight: 900, dir: 'ltr', font: 'Rdx' }); cv.restore(); cv.restore();
  // the trade
  const ek = hit(t, ws(60), 0.25), sk = hit(t, ws(61), 0.25), tk = hit(t, ws(63), 0.25), x0 = X(NI - 0.5);
  if (sk > 0) { cv.save(); cv.globalAlpha = 0.16 * sk; cv.fillStyle = RED; cv.fillRect(x0, Y(NF.entry), R7.x + R7.w - x0, Y(NF.sl) - Y(NF.entry)); cv.restore(); }
  if (tk > 0) { cv.save(); cv.globalAlpha = 0.16 * tk; cv.fillStyle = GRN; cv.fillRect(x0, Y(NF.tp), R7.x + R7.w - x0, Y(NF.entry) - Y(NF.tp)); cv.restore(); }
  levelL(R7, Y, NF.entry, '#8F8AA3', 'خرید ' + fp(NF.entry), ek, { x0 }); levelL(R7, Y, NF.sl, RED, 'حد ضرر ' + fp(NF.sl), sk, { x0 }); levelL(R7, Y, NF.tp, GRN, 'حد سود ' + fp(NF.tp), tk, { x0 });
  if (f >= NI - 0.5 && f < NB.length) { const i = Math.floor(f), p = partial(NB[i], f - i, i === NI)[3]; cv.save(); cv.strokeStyle = rgba(GOLD2, 0.7); cv.lineWidth = 2; cv.setLineDash([8, 8]); cv.beginPath(); cv.moveTo(X(Math.min(i, slots - 1)), Y(p)); cv.lineTo(R7.x + R7.w, Y(p)); cv.stroke(); cv.restore();
    tag(R7.x + R7.w + 10, Y(p), fp(p, 2), GOLD, { size: 30, align: 'left', dir: 'ltr', ink: INK }); }
  if (after(t, ws(65)) && t < ws(67)) { const k = 0.5 + 0.5 * Math.sin((t - ws(65)) * 10); cv.save(); cv.translate(X(NI) - 40, Y(2381)); rr(-120, -36, 240, 72, 36); cv.fillStyle = rgba(RED, 0.25 + 0.45 * k); cv.fill(); txt('۱۶:۰۰ · NFP', 0, 3, { size: 36, weight: 900, dir: 'rtl' }); cv.restore(); }
  cv.restore();
  // big words on top
  if (t >= ws(52) - 0.04 && t < ws(53)) { const k = 1 - P(t, ws(52) + 0.25, 0.3); playIcon(800, 500, 360 * (1.2 - 0.2 * hit(t, ws(52))), '#fff', k * hit(t, ws(52))); }
  if (t >= ws(53) && t < ws(58)) line([['حالا', 53], ['کندل‌ها', 54], ['رو', 56], ['ببین…', 57]], [[0, 1, 2, 3]], t, 960, { size: 64, out: ws(58) - 0.1 });
  pw('تند…', 800, 520, t, ws(58), { size: 300, out: ws(59) - 0.05, glow: rgba(VIO, 0.8) });
  if (after(t, ws(59)) && t < ws(60) + 0.1) { for (let j = 3; j >= 0; j--) pw('تندتر…', 800 + j * 40, 520, t, ws(59), { size: 330, out: ws(60) - 0.08, color: j ? rgba(VIO2, 0.25) : '#fff' }); }
  pw('خرید', 800, 500, t, ws(60), { size: 280, color: GRN2, out: ws(61) - 0.08, glow: rgba(GRN, 0.7) });
  pw('حد ضرر', 800, 500, t, ws(61), { size: 260, color: RED2, out: ws(63) - 0.08, glow: rgba(RED, 0.7) });
  pw('حد سود', 800, 500, t, ws(63), { size: 260, color: GRN2, out: ws(65) - 0.02, glow: rgba(GRN, 0.7) });
  pw('خبر!', 800, 480, t, ws(67), { size: 330, color: '#fff', out: ws(67) + 0.75, stroke: RED, strokeW: 24 });
  if (t >= TPT) { const k = E.back(P(t, TPT, 0.4)); cv.save(); cv.translate(560, 560); cv.scale(k, k); cv.rotate(-0.06); rr(-330, -110, 660, 220, 40); cv.fillStyle = rgba(GRN, 0.95); cv.shadowColor = GRN; cv.shadowBlur = 50; cv.fill(); cv.shadowBlur = 0;
    txt(money((NF.tp - NF.entry) * NF.oz), 0, -18, { size: 120, weight: 900, color: '#fff', font: 'Rdx', dir: 'ltr' }); txt('حد سود خورد · ۱ لات', 0, 70, { size: 40, weight: 700, color: rgba('#ffffff', 0.9) }); cv.restore(); }
  if (after(t, ws(68))) { pw('شوخیت گرفته؟!', 800, 150, t, ws(68), { size: 170, color: '#fff', stroke: INK, strokeW: 26, s0: 1.4 }); }
}
// ---------- 10 · «فکر کن بخوای همینو با پول واقعی یاد بگیری: یه سال وقت… و کلی ضرر.» ----------
const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
function s10(t) {
  if (t < ws(79) - 0.04) { bgc('#07060B'); line([['فکر', 70], ['کن', 71], ['بخوای', 72], ['همینو', 73], ['با', 74], ['پول', 75, GOLD2], ['واقعی', 76, GOLD2], ['یاد', 77], ['بگیری…', 78]], [[0, 1, 2, 3], [4, 5, 6], [7, 8]], t, 260, { size: 150 }); return; }
  if (t < ws(82) - 0.04) { bgc('#0B0912'); line([['یه', 79], ['سال', 80, GOLD2], ['وقت…', 81]], [[0, 1, 2]], t, 160, { size: 140 });
    const k = P(t, ws(79), ws(82) - ws(79)), m = Math.min(11, Math.floor(k * 12)); cv.save(); cv.translate(800, 600);
    card(-260, -230, 520, 460, { r: 36, fill: PAPER, border: PAPER, shadow: false }); cv.fillStyle = RED; rr(-260, -230, 520, 120, [36, 36, 0, 0]); cv.fill();
    txt(MONTHS[m], 0, -170, { size: 64, weight: 900 }); txt(fa(((m * 7) % 28) + 1), 0, 60, { size: 230, weight: 900, color: INK }); cv.restore(); return; }
  bgc(RED); const [sx, sy] = shakeAt(t, ws(83), 16); cv.save(); cv.translate(sx, sy);
  const k = E.inOut(P(t, ws(82), 0.8)); cv.strokeStyle = rgba(INK, 0.6); cv.lineWidth = 14; cv.lineJoin = 'round'; cv.beginPath();
  for (let i = 0; i <= 40 * k; i++) { const x = 100 + i * 35, y = 600 + i * 7 + 40 * Math.sin(i * 1.7); i ? cv.lineTo(x, y) : cv.moveTo(x, y); } cv.stroke();
  line([['و', 82], ['کلی', 83], ['ضرر', 84]], [[0, 1, 2]], t, 420, { size: 290 }); cv.restore();
}
// ---------- 11 · «این‌جا؟ تاریخ. پلی. ترید. آمار.» ----------
function s11(t) {
  if (t < ws(86) - 0.04) { bgc(PAPER); pw('این‌جا؟', 800, 520, t, ws(85), { size: 420, color: INK }); return; }
  if (t < ws(87) - 0.04) { bgc('#07060B'); calIcon(380, 500, 300 * hit(t, ws(86), 0.25), GOLD2); pw('تاریخ', 980, 520, t, ws(86), { size: 330 }); return; }
  if (t < ws(88) - 0.04) { bgv('#6A46FF', '#2A1580'); playIcon(400, 500, 300 * hit(t, ws(87), 0.25), '#fff'); pw('پلی', 1020, 520, t, ws(87), { size: 360 }); return; }
  if (t < ws(89) - 0.04) { bgc(PAPER); pw('ترید', 800, 360, t, ws(88), { size: 340, color: INK });
    const k = E.back(P(t, ws(88) + 0.05, 0.3)); cv.save(); cv.translate(800, 760); cv.scale(k, k); [[-230, 'خرید', GRN], [230, 'فروش', RED]].forEach(([x, s, c]) => { rr(x - 200, -70, 400, 140, 70); cv.fillStyle = c; cv.fill(); txt(s, x, 3, { size: 70, weight: 900 }); }); cv.restore(); return; }
  bgc('#07060B'); pw('آمار', 800, 220, t, ws(89), { size: 260 });
  [['وین‌ریت', GRN], ['بیشترین افت', RED], ['رگبار ضرر', GOLD], ['امید ریاضی', VIO2]].forEach(([s, c], i) => { const k = E.back(P(t, ws(89) - 0.02 + i * 0.05, 0.28)); if (k <= 0) return;
    const x = 1240 - i * 300, y = 680; cv.save(); cv.translate(x, y); cv.scale(k, k); card(-135, -150, 270, 300, { r: 28, fill: '#16121F', border: rgba(c, 0.7), shadow: false });
    for (let j = 0; j < 5; j++) { const h = 30 + ((i * 37 + j * 53) % 90); cv.fillStyle = rgba(c, 0.85); cv.fillRect(-95 + j * 40, 70 - h, 26, h); }
    txt(s, 0, 110, { size: 34, weight: 800 }); cv.restore(); });
}
// ---------- 12 · «و اون ۵ سال؟ آره… یه آخر هفته.» ----------
const WEEK = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
function s12(t) {
  if (t < ws(94) - 0.04) { bgc('#07060B'); race(t, 1, 0.22, { R: { x: 130, y: 380, w: 1340, h: 480 } }); line([['و', 90], ['اون', 91], ['۵', 92, GOLD2], ['سال؟', 93, GOLD2]], [[0, 1, 2, 3]], t, 480, { size: 260 }); return; }
  if (t < ws(95) - 0.04) { bgc(PAPER); pw('آره…', 800, 520, t, ws(94), { size: 440, color: INK }); return; }
  bgv('#3A22B8', '#0B0618');
  pw('۵ سال', 800, 230, t, ws(95), { size: 260, color: GOLD2, glow: rgba(GOLD, 0.8) });
  pw('=', 800, 455, t, ws(96), { size: 170 });
  pw('۱ آخر هفته', 800, 650, t, ws(97), { size: 220, color: '#fff' });
  WEEK.forEach((d, i) => { const k = E.back(P(t, ws(96) + i * 0.04, 0.3)); if (k <= 0) return; const x = 1250 - i * 150, on = i >= 5; cv.save(); cv.translate(x, 860); cv.scale(k, k);
    rr(-55, -55, 110, 110, 24); cv.fillStyle = on ? GOLD : rgba('#ffffff', 0.1); cv.fill(); txt(d, 0, 4, { size: 54, weight: 900, color: on ? INK : rgba('#ffffff', 0.5) }); cv.restore(); });
}
// ---------- 13 · «می‌خوای امتحانش کنی؟ کلمه‌ی «بک‌تست» رو کامنت کن تا لینک رو برات بفرستم؛ هفت روز رایگان.» ----------
function s13(t) {
  if (t < ws(101) - 0.04) { bgv('#6A46FF', '#2A1580'); line([['می‌خوای', 98], ['امتحانش', 99], ['کنی؟', 100, GOLD2]], [[0, 1], [2]], t, 380, { size: 200 }); return; }
  if (t < ws(112) - 0.04) { bgc('#0B0912');
    line([['کلمه‌ی', 101], ['«بک‌تست»', 103, VIO2], ['رو', 104], ['کامنت', 105], ['کن', 106]], [[0, 1, 2, 3, 4]], t, 130, { size: 100, out: ws(107) - 0.1 });
    if (after(t, ws(107))) line([['تا', 107], ['لینک', 108, VIO2], ['رو', 109], ['برات', 110], ['بفرستم', 111]], [[0, 1, 2, 3, 4]], t, 130, { size: 100 });
    // the comment box
    const ck = E.out(P(t, ws(101), 0.35)); cv.save(); cv.globalAlpha = ck; card(260, 300, 1080, 220, { r: 50, fill: '#17141F', border: '#2E2840', shadow: false });
    cv.fillStyle = VIO; cv.beginPath(); cv.arc(1250, 410, 54, 0, 7); cv.fill(); txt('ب', 1250, 414, { size: 54, weight: 900 });
    const word = 'بک‌تست', n = Math.round(word.length * P(t, ws(103) - 0.05, 0.4)); txt(word.slice(0, n) + (n < word.length && Math.floor(t * 5) % 2 ? '|' : ''), 1150, 412, { size: 84, weight: 900, align: 'right', color: n ? '#fff' : C.muted });
    const sendK = hit(t, ws(105), 0.25); cv.fillStyle = sendK > 0 ? VIO : '#2E2840'; cv.beginPath(); cv.arc(360, 410, 56, 0, 7); cv.fill(); playIcon(366, 410, 50, '#fff'); cv.restore();
    // the reply with the link
    const dk = E.back(P(t, ws(108), 0.4)); if (dk > 0) { cv.save(); cv.translate(800, 760); cv.scale(dk, dk); rr(-430, -110, 860, 220, 50); cv.fillStyle = VIO; cv.shadowColor = VIO; cv.shadowBlur = 50; cv.fill(); cv.shadowBlur = 0;
      txt('لینکت 👇', 360, -40, { size: 52, weight: 800, align: 'right' }); txt('backtestlab.ir', 0, 40, { size: 70, weight: 700, font: 'Rdx', dir: 'ltr' }); cv.restore(); }
    return; }
  bgv('#0B3A26', '#03100A'); burst(t, ws(112), GRN2, { n: 50, d: 0.8 });
  const fk = E.back(P(t, ws(112), 0.4)); cv.save(); cv.translate(800, 380); cv.scale(fk, fk); cv.globalAlpha = clamp(fk);
  txt('۷ روز', 0, -90, { size: 170, weight: 900 }); txt('رایگان', 0, 110, { size: 240, weight: 900, color: GRN2, glow: rgba(GRN, 0.8), glowBlur: 60 }); cv.restore();
  const gk = E.out(P(t, ws(113) + 0.3, 0.5)); if (gk > 0 && IMG.logo) { const w = 560, h = (w * IMG.logo.height) / IMG.logo.width; cv.save(); cv.globalAlpha = gk; cv.drawImage(IMG.logo, 800 - w / 2, 760 - h / 2, w, h); cv.restore();
    txt('backtestlab.ir', 800, 880, { size: 56, weight: 600, color: rgba('#ffffff', 0.8), alpha: gk, font: 'Rdx', dir: 'ltr' }); }
}

const SCREENS = [[0, s1], [ws(3), s2], [ws(11), s3], [ws(23), s4], [ws(34), s5], [ws(44), s6], [ws(52), s7], [ws(70), s10], [ws(85), s11], [ws(90), s12], [ws(98), s13]];
// the screen's main colour over time, for the light it throws on the room and the keyboard
const TONE = [[0, '#1a1030'], [ws(0), '#3a22b8'], [ws(1), PAPER], [ws(3), '#3a2a08'], [ws(5), '#1a1408'], [ws(7), '#6A46FF'], [ws(11), PAPER], [ws(12), '#14101e'], [ws(18), '#5a1520'], [ws(19), '#0B3A26'],
  [ws(23), PAPER], [ws(29), RED], [ws(30), '#100c18'], [ws(34), '#141020'], [ws(41), '#05040A'], [ws(42), '#3A22B8'], [ws(44), '#16121F'], [ws(52), '#14101e'], [ws(67), '#5a1520'], [ws(67) + 0.6, '#14101e'], [TPT, '#0B3A26'],
  [ws(70), '#07060B'], [ws(79), PAPER], [ws(82), RED], [ws(85), PAPER], [ws(86), '#1a1408'], [ws(87), '#6A46FF'], [ws(88), PAPER], [ws(89), '#100c18'], [ws(90), '#1a1408'], [ws(94), PAPER], [ws(95), '#3A22B8'],
  [ws(98), '#6A46FF'], [ws(101), '#14101e'], [ws(112), '#0B3A26']];
const toneAt = (t) => { let c = TONE[0][1]; for (const [a, col] of TONE) if (t >= a) c = col; return c; };
const PUNCH = [0, 2, 3, 11, 18, 20, 29, 33, 42, 52, 58, 59, 60, 61, 63, 67, 68, 83, 85, 86, 87, 88, 89, 94, 95, 112].map(ws);

// ---------- the room and the laptop ----------
const KEYS = (() => { const rows = [], r = rng(5); for (let j = 0; j < 6; j++) { const n = j === 5 ? 9 : 14; const keys = []; let u = 0; for (let i = 0; i < n; i++) { const wdt = j === 5 && i === 4 ? 4 : j === 4 && (i === 0 || i === n - 1) ? 1.6 : 1; keys.push([u, wdt]); u += wdt; } rows.push(keys.map(([a, b]) => [a / u, b / u])); } return rows; })();
function room(t, tone) {
  const g = cv.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7a5c3c'); g.addColorStop(0.16, '#56402a'); g.addColorStop(0.3, '#2c2014'); g.addColorStop(0.5, '#0e0a07'); g.addColorStop(1, '#030303');
  cv.fillStyle = g; cv.fillRect(0, 0, W, H); glow(540, 60, 900, 420, '#ffd9a0', 0.35); glow(540, 900, 950, 520, tone, 0.22);
}
function laptop(t, tone) {
  // the lid
  rr(SCR.x - 18, SCR.y - 20, SCR.w + 36, SCR.h + 34, 22); cv.fillStyle = '#0a0a0c'; cv.fill(); cv.strokeStyle = 'rgba(255,255,255,0.10)'; cv.lineWidth = 2; cv.stroke();
  cv.save(); rr(SCR.x, SCR.y, SCR.w, SCR.h, 6); cv.clip(); cv.translate(SCR.x, SCR.y); cv.scale(SK, SK);
  let k = 0; SCREENS.forEach(([a], i) => { if (t >= a - 0.04) k = i; }); cv.save(); SCREENS[k][1](t); cv.restore(); cv.filter = 'none'; cv.globalAlpha = 1;
  // menu bar and dock, like a real desktop
  cv.fillStyle = 'rgba(0,0,0,0.35)'; cv.fillRect(0, 0, LW, 30); cv.fillStyle = 'rgba(255,255,255,0.75)'; [30, 70, 130, 190, 250].forEach((x, i) => cv.fillRect(x, 11, i ? 40 : 18, 8)); [1440, 1490, 1540].forEach((x) => cv.fillRect(x, 10, 26, 10));
  rr(500, LH - 62, 600, 52, 16); cv.fillStyle = 'rgba(30,28,36,0.55)'; cv.fill(); ['#4C8DFF', '#3ED07B', '#FF5E57', '#FFC23D', '#9B6BFF', '#2CC4E8', '#FF8A3D', '#E5E5EA', '#6A46FF', '#FF4FA0', '#7CD85E', '#B0B0B8'].forEach((c, i) => { rr(516 + i * 48, LH - 54, 38, 38, 10); cv.fillStyle = c; cv.fill(); });
  cv.restore();
  // glass sheen
  cv.save(); rr(SCR.x, SCR.y, SCR.w, SCR.h, 6); cv.clip(); const sh = cv.createLinearGradient(SCR.x, SCR.y, SCR.x + SCR.w, SCR.y + SCR.h); sh.addColorStop(0, 'rgba(255,255,255,0.06)'); sh.addColorStop(0.4, 'rgba(255,255,255,0)'); cv.fillStyle = sh; cv.fillRect(SCR.x, SCR.y, SCR.w, SCR.h); cv.restore();
  // hinge, deck, keys, trackpad
  const top = SCR.y + SCR.h + 14; cv.fillStyle = '#16161a'; cv.fillRect(SCR.x - 10, top - 4, SCR.w + 20, 12);
  const yA = top + 8, yB = H - 150, xA0 = 16, xA1 = W - 16, xB0 = -60, xB1 = W + 60;
  const dg = cv.createLinearGradient(0, yA, 0, yB); dg.addColorStop(0, '#1b1b20'); dg.addColorStop(1, '#0c0c0f'); cv.fillStyle = dg; cv.beginPath(); cv.moveTo(xA0, yA); cv.lineTo(xA1, yA); cv.lineTo(xB1, yB); cv.lineTo(xB0, yB); cv.closePath(); cv.fill();
  const at = (u, v) => [lerp(lerp(xA0, xA1, u), lerp(xB0, xB1, u), v), lerp(yA, yB, v)];
  const ky0 = 0.08, ky1 = 0.6;
  KEYS.forEach((row, j) => { const v0 = ky0 + (ky1 - ky0) * (j / 6) + 0.006, v1 = ky0 + (ky1 - ky0) * ((j + 1) / 6) - 0.012;
    row.forEach(([u, w]) => { const u0 = 0.1 + 0.8 * u + 0.003, u1 = 0.1 + 0.8 * (u + w) - 0.003; const p = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
      cv.beginPath(); cv.moveTo(...p[0]); p.slice(1).forEach((q) => cv.lineTo(...q)); cv.closePath(); cv.fillStyle = '#101013'; cv.fill(); cv.strokeStyle = 'rgba(255,240,220,0.16)'; cv.lineWidth = 1.5; cv.stroke();
      const c = at((u0 + u1) / 2, (v0 + v1) / 2); cv.fillStyle = 'rgba(255,244,228,0.35)'; cv.fillRect(c[0] - 3, c[1] - 2, 6, 4); }); });
  const tp = [at(0.36, 0.67), at(0.64, 0.67), at(0.65, 0.95), at(0.35, 0.95)]; cv.beginPath(); cv.moveTo(...tp[0]); tp.slice(1).forEach((q) => cv.lineTo(...q)); cv.closePath(); cv.fillStyle = '#141418'; cv.fill(); cv.strokeStyle = 'rgba(255,255,255,0.08)'; cv.stroke();
  // the screen's light on the deck
  const sg = cv.createRadialGradient(540, yA, 20, 540, yA, 520); sg.addColorStop(0, rgba(tone, 0.3)); sg.addColorStop(1, rgba(tone, 0)); cv.fillStyle = sg; cv.beginPath(); cv.moveTo(xA0, yA); cv.lineTo(xA1, yA); cv.lineTo(xB1, yB); cv.lineTo(xB0, yB); cv.closePath(); cv.fill();
  const fg = cv.createLinearGradient(0, yB - 40, 0, H); fg.addColorStop(0, 'rgba(3,3,3,0)'); fg.addColorStop(0.3, 'rgba(3,3,3,1)'); cv.fillStyle = fg; cv.fillRect(0, yB - 40, W, H - yB + 40);
}
function render(t) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  const cover = t < 0; if (cover) t = ws(98) - 0.1;     // the cover: «۵ سال = ۱ آخر هفته»
  const tone = toneAt(t); room(t, tone);
  // a hand-held camera, with a push on the strong beats
  let pk = 0; if (!cover) PUNCH.forEach((p) => { const d = t - p; if (d >= 0 && d < 0.5) pk = Math.max(pk, Math.exp(-d * 7)); });
  const sc = 1 + 0.035 * pk + 0.01 * Math.sin(t * 0.3), dx = cover ? 0 : 3 * Math.sin(t * 0.9) + 2 * Math.sin(t * 2.1), dy = cover ? 0 : 3 * Math.sin(t * 0.7 + 1) + 1.5 * Math.sin(t * 1.9);
  cv.translate(540 + dx, 930 + dy); cv.rotate(cover ? 0 : 0.003 * Math.sin(t * 0.5)); cv.scale(sc, sc); cv.translate(-540, -930);
  laptop(t, tone);
  cv.setTransform(1, 0, 0, 1, 0, 0);
  txt('۵ سال بازار… تو یه آخر هفته؟ 🤯', 540, 360, { size: 50, weight: 800, color: '#fff', glow: 'rgba(0,0,0,0.6)', glowBlur: 18 });
  finish(t);
}
boot(render, [document.fonts.load('900 60px Vaz', 'آبپ۱'), document.fonts.load('900 60px Rdx', 'A1')]);
