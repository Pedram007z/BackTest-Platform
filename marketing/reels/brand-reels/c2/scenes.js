// «راز یک قانون»: pre-launch reel 2. The 50/200 golden cross beat holding Bitcoin over 8 years,
// but its account sat 20% under its starting money on 12 March 2020, 67% below its peak.
const CL = DATA.close, CV = DATA.curve, TR = DATA.trades, N = DATA.n, PK = DATA.peak, TRO = DATA.trough, RU = DATA.rule;
const VREC = (() => { for (let i = TRO; i < CV.length; i++) if (CV[i] >= CV[PK]) return i; return CV.length - 1; })();
const SUB_ON = [0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0].map(Boolean);
const LABEL = 'پرونده‌های بازار · ۰۲';
const YEAR0 = 2018, dayX = (r, i) => r.x + (i / (N - 1)) * r.w;

function lock(x, y, s, col) { cv.save(); cv.strokeStyle = col; cv.lineWidth = s * 0.16; cv.beginPath(); cv.arc(x, y - s * 0.25, s * 0.32, Math.PI, 0); cv.stroke(); rr(x - s * 0.5, y - s * 0.25, s, s * 0.78, s * 0.14); cv.fillStyle = col; cv.fill(); cv.fillStyle = C.surface; cv.beginPath(); cv.arc(x, y + s * 0.1, s * 0.1, 0, 7); cv.fill(); cv.restore(); }

// ---- A · the hook ----
function hook(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  runs([['یه', C.ink], ['قانون', C.ink], ['یک‌خطی،', C.lilac]], 540, 420, { size: 104, glow: rgba(C.accent, 0.7) });
  runs([['۸ سال', C.lilac], ['از', C.ink], ['نگه‌داشتنِ', C.ink], ['بیت‌کوین', C.ink]], 540, 540, { size: 62, weight: 600 });
  runs([['بیشتر', C.gain], ['سود', C.gain], ['داد.', C.ink]], 540, 630, { size: 62, weight: 600 });
  // the hidden rule
  card(80, 720, 920, 170, { r: 24 });
  txt('۱', 950, 805, { size: 34, color: C.faint, weight: 500, font: 'Rdx' }); cv.fillStyle = C.line; cv.fillRect(920, 745, 2, 120);
  const shimmer = (t * 0.6) % 1.6 - 0.3;
  [[880, 220], [640, 150], [470, 250], [200, 90]].forEach(([x, w], i) => { rr(x - w, 782, w, 46, 12); const g = cv.createLinearGradient(x - w, 0, x, 0); const s0 = clamp(shimmer - i * 0.1); g.addColorStop(0, C.raised); g.addColorStop(clamp(s0), rgba(C.accent, 0.45)); g.addColorStop(clamp(s0 + 0.15), C.raised); g.addColorStop(1, C.raised); cv.fillStyle = g; cv.fill(); });
  lock(140, 805, 46, C.lilac);
  txt('قانون', 960, 700, { size: 1, alpha: 0 });
  // the scoreboard, values hidden
  card(80, 940, 920, 330, { r: 24 });
  txt('بیت‌کوین · ۲۰۱۸ تا ۲۰۲۵', 960, 990, { size: 28, color: C.muted, weight: 500, align: 'right' });
  const g1 = 1, g2 = 1;
  [[0, 'این قانون', 1.0, C.accent, g1], [1, 'فقط نگه‌داشتن', 539 / 624, C.faint, g2]].forEach(([i, name, f, col, g]) => { const y = 1070 + i * 110;
    txt(name, 960, y, { size: 38, color: C.ink, weight: 600, align: 'right' });
    const w = 520 * f * g; rr(700 - w, y - 26, w, 52, 14); cv.fillStyle = col; if (i === 0) { cv.shadowColor = C.accent; cv.shadowBlur = 30; } cv.fill(); cv.shadowBlur = 0;
    txt('؟٪', 700 - w - 30, y + 2, { size: 48, font: 'Rdx', weight: 700, color: i === 0 ? C.lilac : C.muted, align: 'right', dir: 'ltr' }); });
  // the secret
  const s1 = E.out(P(t, S(1), 0.5));
  if (s1 > 0) { glow(540, 1400, 500, 160, C.accent, 0.25 * s1);
    runs([['ولی', C.ink], ['یه', C.ink], ['رازی', C.lilac], ['پشتِ', C.ink], ['این', C.ink], ['سوده…', C.ink]], 540, 1380, { size: 58, reveal: s1, glow: rgba(C.accent, 0.7) });
    txt('که کسی دوست نداره ببینه.', 540, 1470, { size: 42, color: C.muted, weight: 500, alpha: E.out(P(t, S(1) + LN[1] * 0.55, 0.5)) }); }
  cv.restore();
}

// ---- B · the rule ----
function rule(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const c1 = E.back(P(t, S(2), 0.5)), c2 = E.back(P(t, S(3), 0.5));
  const chip = (y, parts, col, k) => { if (k <= 0) return; cv.save(); cv.globalAlpha *= clamp(k); cv.translate(540, y); cv.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
    card(-470, -50, 940, 100, { r: 50, border: col, glow: rgba(col, 0.25) }); runs(parts, 0, 2, { size: 38, weight: 600, font: 'Vaz' }); cv.restore(); };
  chip(450, [['میانگین ۵۰ روزه', C.accent], ['از', C.ink], ['میانگین ۲۰۰ روزه', C.amber], ['بالاتر رفت ←', C.ink], ['بخر', C.gain, 800]], C.gain, c1);
  chip(570, [['برگشت زیرش ←', C.ink], ['بفروش', C.loss, 800]], C.loss, c2);
  const r = { x: 110, y: 720, w: 860, h: 440 }; card(70, 660, 940, 600);
  txt('بیت‌کوین · ۲۰۱۹', 970, 700, { size: 28, color: C.muted, weight: 500, align: 'right' });
  const n = RU.close.length; let upto = lerp(2, RU.buy + 1, E.inOut(P(t, S(2) + 0.2, LN[2] * 0.75)));
  if (t > S(3)) upto = lerp(RU.buy + 1, n, E.inOut(P(t, S(3), LN[3] + 0.3)));
  const o = { lo: 3000, hi: 14000, n, upto, log: true };
  series(r, RU.close, { ...o, color: rgba(C.ink, 0.45), lw: 3 });
  series(r, RU.sma200, { ...o, color: C.amber, lw: 5 });
  const s = series(r, RU.sma50, { ...o, color: C.accent, lw: 5, glow: true });
  if (upto > RU.buy + 1) { const x = s.X(RU.buy), y = s.Y(RU.sma50[RU.buy]); dot(x, y, C.gain, 12, (t * 0.9) % 1); tri(x, y + 60, true, C.gain, 18); txt('خرید', x, y + 110, { size: 34, color: C.gain, weight: 700 }); }
  if (upto > RU.sell + 1) { const x = s.X(RU.sell), y = s.Y(RU.sma50[RU.sell]); dot(x, y, C.loss, 12, (t * 0.9) % 1); tri(x, y - 60, false, C.loss, 18); txt('فروش', x, y - 110, { size: 34, color: C.loss, weight: 700 }); }
  // legend
  cv.fillStyle = C.accent; cv.fillRect(900, 1212, 50, 6); txt('میانگین ۵۰ روزه', 885, 1215, { size: 28, color: C.ink, weight: 500, align: 'right' });
  cv.fillStyle = C.amber; cv.fillRect(530, 1212, 50, 6); txt('میانگین ۲۰۰ روزه', 515, 1215, { size: 28, color: C.ink, weight: 500, align: 'right' });
  cv.restore();
}

// ---- C · eight years, eight trades, the result ----
function result(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const r = { x: 110, y: 560, w: 860, h: 470 }; card(70, 470, 940, 620);
  const shown = Math.floor(clamp(P(t, S(4) + 0.3, LN[4] * 0.8)) * TR.length + 0.0001); let wins = 0;
  TR.slice(0, shown).forEach(([i0, i1, ret], j) => { if (ret > 0) wins++; const col = ret > 0 ? C.gain : C.loss, k = E.out(P(t, S(4) + 0.3 + (j / TR.length) * LN[4] * 0.8, 0.3));
    cv.fillStyle = rgba(col, 0.2 * k); cv.fillRect(dayX(r, i0), r.y, dayX(r, i1) - dayX(r, i0), r.h); cv.fillStyle = rgba(col, 0.9 * k); cv.fillRect(dayX(r, i0), r.y + r.h - 8, dayX(r, i1) - dayX(r, i0), 8); });
  series(r, CL, { lo: 3000, hi: 130000, log: true, color: C.ink, lw: 3 });
  for (let yr = 0; yr < 8; yr += 2) txt(fy(YEAR0 + yr), dayX(r, yr * 365.25) + 40, r.y + r.h + 30, { size: 26, color: C.faint, weight: 500 });
  txt(`${fa(shown)} معامله · ${fa(wins)} برد`, 970, 515, { size: 38, color: C.ink, weight: 700, align: 'right', font: 'Rdx' });
  txt('مقیاس لگاریتمی', 110, 515, { size: 26, color: C.faint, weight: 500, align: 'left' });
  // the bars
  const b = P(t, S(5), 0.3); if (b > 0) {
    const rows = [['این قانون', DATA.final - 1, C.accent, S(5) + LN[5] * 0.1], ['فقط نگه‌داشتن', DATA.bh - 1, C.faint, S(5) + LN[5] * 0.55]];
    rows.forEach(([name, v, col, at], i) => { const g = E.out(P(t, at, 1.2)), y = 1170 + i * 120; if (P(t, at - 0.2, 0.2) <= 0) return;
      txt(name, 1000, y, { size: 40, color: C.ink, weight: 700, align: 'right' }); const w = (v / (DATA.final - 1)) * 470 * g;
      rr(720 - w, y - 30, w, 60, 14); cv.fillStyle = col; if (i === 0) { cv.shadowColor = C.accent; cv.shadowBlur = 30; } cv.fill(); cv.shadowBlur = 0;
      txt('+' + fa(Math.round(v * 100 * g)) + '٪', 720 - w - 20, y + 2, { size: 54, font: 'Rdx', weight: 700, color: i === 0 ? C.lilac : C.muted, dir: 'ltr', align: 'right' }); }); }
  cv.restore();
}

// ---- D · the secret? ----
function secret(t, a) { if (a <= 0) return; glow(540, 900, 600, 500, C.accent, 0.3 * a);
  txt('خب…', 540, 760, { size: 70, color: C.muted, weight: 600, font: 'Rdx', alpha: a });
  txt('رازش چیه؟', 540, 900, { size: 140, color: C.lilac, weight: 700, font: 'Rdx', alpha: a * E.out(P(t, S(6) + 0.4, 0.4)), glow: rgba(C.accent, 0.8), scale: 0.9 + 0.1 * E.back(P(t, S(6) + 0.4, 0.5)) }); }

// ---- E · 12 March 2020 on the rule's own account ----
const ER = { x: 120, y: 700, w: 840, h: 480 };
function account(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const d = E.back(P(t, S(7), 0.45)); cv.save(); cv.translate(540, 450); cv.scale(d, d); pill(0, 0, '۱۲ مارس ۲۰۲۰', { size: 44, dot: C.loss, color: C.ink, weight: 700 }); cv.restore();
  card(70, 580, 940, 700);
  txt('حساب این قانون', 970, 628, { size: 30, color: C.ink, weight: 700, align: 'right' }); txt('۱ = پول اول', 110, 628, { size: 28, color: C.faint, weight: 500, align: 'left' });
  const n = TRO + 1, X = (i) => ER.x + (i / (n - 1)) * ER.w, Y = (v) => ER.y + (1 - (v - 0.5) / (2.7 - 0.5)) * ER.h;
  const upto = lerp(2, n, E.inOut(P(t, S(7) + 0.1, LN[7] + 0.4)));
  dashLine(ER.x, Y(1), ER.x + ER.w, Y(1), rgba(C.muted, 0.8), 2, [8, 10]); txt('پول اول', ER.x + 6, Y(1) - 24, { size: 26, color: C.muted, weight: 600, align: 'left' });
  [2018, 2019, 2020].forEach((yr) => { const i = Math.round((yr - YEAR0) * 365.25); txt(fy(yr), X(i) + 4, ER.y + ER.h + 52, { size: 26, color: C.faint, weight: 500, align: 'left' }); });
  const m = Math.floor(upto);
  // red where the account is under its starting money
  cv.beginPath(); cv.moveTo(X(0), Y(1)); for (let i = 0; i < m; i++) cv.lineTo(X(i), Y(Math.min(1, CV[i]))); cv.lineTo(X(m - 1), Y(1)); cv.closePath(); cv.fillStyle = rgba(C.loss, 0.3); cv.fill();
  series(ER, CV.slice(0, n), { lo: 0.5, hi: 2.7, n, upto, color: C.accent, fill: C.accent, lw: 5, glow: true });
  const end = E.back(P(t, S(8) + LN[8] * 0.55, 0.45));
  if (m >= n - 1) dot(X(TRO), Y(CV[TRO]), C.loss, 13, (t * 0.9) % 1);
  if (end > 0) { cv.save(); cv.globalAlpha *= clamp(end); tag(X(TRO) - 26, Y(CV[TRO]) + 4, '۰٫۸۰×', C.loss, { align: 'right', size: 34 });
    txt('۲۰٪ زیر پول اول', 540, 1360, { size: 58, font: 'Rdx', weight: 700, color: C.loss, glow: rgba(C.loss, 0.5), scale: 0.9 + 0.1 * end }); cv.restore(); }
  const pk = E.out(P(t, S(9), 0.5));
  if (pk > 0) { cv.save(); cv.globalAlpha *= pk; const xp = X(PK), yp = Y(CV[PK]), yt = Y(CV[TRO]); dot(xp, yp, C.lilac, 11); tag(xp, yp - 46, '۲٫۴۲×', C.accent, { size: 30 });
    const h = (yt - yp) * E.inOut(P(t, S(9) + 0.2, 0.8)); cv.strokeStyle = C.loss; cv.lineWidth = 4; cv.beginPath(); cv.moveTo(xp + 60, yp); cv.lineTo(X(TRO) - 70, yp); cv.stroke();
    dashLine(X(TRO) - 70, yp, X(TRO) - 70, yp + h, C.loss, 4, [10, 8]); tri(X(TRO) - 70, yp + h + 6, false, C.loss, 14);
    txt('−۶۷٪', X(PK) - 50, (yp + yt) / 2 - 20, { size: 84, font: 'Rdx', weight: 700, color: C.loss, dir: 'ltr', align: 'right', alpha: P(t, S(9) + 0.6, 0.3), glow: rgba(C.loss, 0.6) });
    txt('از اوج', X(PK) - 50, (yp + yt) / 2 + 50, { size: 34, color: C.ink, weight: 600, align: 'right', alpha: P(t, S(9) + 0.6, 0.3) }); cv.restore(); }
  cv.restore();
}

// ---- F · the whole road, and the valley in it ----
const FR = { x: 120, y: 700, w: 840, h: 520 };
function valley(t, a, dim = 0) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a * (1 - 0.55 * dim);
  card(70, 600, 940, 720);
  const X = (i) => dayX(FR, i), L = Math.log, lo = 0.5, hi = 9, Y = (v) => FR.y + (1 - (L(v) - L(lo)) / (L(hi) - L(lo))) * FR.h;
  const k = E.inOut(P(t, S(10) - 0.2, 1.6)), upto = lerp(TRO + 1, N, k);
  const band = E.out(P(t, S(10) + 0.6, 0.6));
  if (band > 0) { cv.fillStyle = rgba(C.loss, 0.16 * band); cv.fillRect(X(PK), FR.y, X(VREC) - X(PK), FR.h); cv.strokeStyle = rgba(C.loss, 0.6 * band); cv.lineWidth = 2; cv.strokeRect(X(PK), FR.y, X(VREC) - X(PK), FR.h);
    txt('دره', (X(PK) + X(VREC)) / 2, FR.y + 44, { size: 40, font: 'Rdx', weight: 700, color: C.loss, alpha: band }); txt('۵۲۳ روز', (X(PK) + X(VREC)) / 2, FR.y + 92, { size: 28, color: C.ink, weight: 600, alpha: band }); }
  dashLine(FR.x, Y(1), FR.x + FR.w, Y(1), rgba(C.muted, 0.6), 2, [8, 10]);
  series(FR, CV, { lo, hi, log: true, upto, color: C.accent, fill: C.accent, lw: 5, glow: true });
  for (let yr = 0; yr < 8; yr += 2) txt(fy(YEAR0 + yr), X(yr * 365.25) + 40, FR.y + FR.h + 34, { size: 26, color: C.faint, weight: 500 });
  txt('حساب این قانون · ۲۰۱۸ تا ۲۰۲۵', 970, 648, { size: 30, color: C.ink, weight: 700, align: 'right' });
  const fin = P(t, S(10) + 1.4, 0.4); if (fin > 0) { dot(X(N - 1), Y(CV[N - 1]), C.gain, 12); tag(X(N - 1) - 16, Y(CV[N - 1]) + 52, '+۶۲۴٪', C.gain, { align: 'right', size: 34, alpha: fin }); }
  cv.restore();
}

// ---- G … J · the question, the lesson, the poll, coming soon ----
function words(t) {
  headline([['اون ۶۰۰٪ سود،', 70, C.ink], [[['فقط', C.ink], ['مالِ', C.ink], ['کسی', C.ink], ['بود', C.ink], ['که…', C.ink]], 56]], t, S(10), S(11) - 0.05, { y: 410, gap: 90, stagger: 0.5 });
  headline([['تو اونجا،', 80, C.ink], [[['به', C.ink], ['قانونت', C.lilac], ['وفادار', C.ink], ['می‌موندی؟', C.lilac]], 66]], t, S(11), S(12) - 0.05, { y: 410, gap: 105, stagger: 0.35, glow: rgba(C.accent, 0.6) });
  headline([['بک‌تست فقط سود رو نشون نمی‌ده.', 58, C.muted, 600], [[['دره‌ها', C.lilac], ['رو', C.ink], ['نشونت', C.ink], ['می‌ده،', C.ink]], 96], ['قبل از اینکه توش باشی.', 80, C.ink]], t, S(12), S(13) - 0.05, { y: 700, gap: 160, stagger: LN[12] * 0.3, glow: rgba(C.accent, 0.7) });
  const pa = win(t, S(13) - 0.05, S(14) + 0.05, 0.25, 0.25);
  if (pa > 0) { cv.save(); cv.globalAlpha = pa;
    headline([['تو اون دره', 96, C.ink], ['ادامه می‌دادی؟', 104, C.lilac]], t, S(13), S(14) + 0.3, { y: 560, gap: 140, glowAll: rgba(C.accent, 0.5) });
    const b1 = E.back(P(t, S(13) + 0.6, 0.4)), b2 = E.back(P(t, S(13) + 0.8, 0.4));
    [[700, 'آره، ادامه می‌دادم', C.gain, b1], [380, 'نه، می‌بستم', C.loss, b2]].forEach(([x, s, col, k]) => { if (k <= 0) return; cv.save(); cv.translate(x, 900); cv.scale(k, k); card(-170, -60, 340, 120, { r: 60, border: col, glow: rgba(col, 0.3) }); txt(s, 0, 2, { size: 32, color: C.ink, weight: 700 }); cv.restore(); });
    const c = E.out(P(t, S(13) + 1.4, 0.4)); if (c > 0) button(540, 1100, 'کامنت کن', { size: 42, alpha: c });
    cv.restore(); }
  const e = E.out(P(t, S(14) - 0.1, 0.7)); if (e > 0) { glow(540, 820, 700, 500, C.accent, 0.3 * e);
    if (IMG.logo) { const w = 660, h = (w * IMG.logo.height) / IMG.logo.width; cv.save(); cv.globalAlpha = e; cv.drawImage(IMG.logo, 540 - w / 2, 800 - h / 2 + (1 - e) * 24, w, h); cv.restore(); }
    const b = E.back(P(t, S(14) + 0.5, 0.5)); if (b > 0) button(540, 1010, 'به‌زودی', { size: 46, scale: b });
    txt('فالو کن تا روز لانچ رو از دست ندی', 540, 1150, { size: 40, color: C.muted, weight: 500, alpha: E.out(P(t, S(14) + 1.0, 0.6)) }); }
}

function render(t) {
  const shake = (t > S(9) + 0.6 && t < S(9) + 1.4) ? (1 - P(t, S(9) + 0.6, 0.8)) * 9 : 0;
  background(t, { tense: 0.9 * win(t, S(7), S(10) + 0.5, 0.6, 0.6) + 0.5 * win(t, S(11), S(12), 0.4, 0.4), happy: 0.8 * win(t, S(5), S(6), 0.4, 0.3) });
  cv.save(); cv.translate(Math.sin(t * 70) * shake, Math.cos(t * 61) * shake);
  hook(t, 1 - E.in(P(t, S(2) - 0.35, 0.3)));
  rule(t, win(t, S(2) - 0.1, S(4) + 0.05, 0.35, 0.3));
  result(t, win(t, S(4) - 0.1, S(6) + 0.05, 0.35, 0.3));
  secret(t, win(t, S(6) - 0.05, S(7) + 0.05, 0.2, 0.25));
  account(t, win(t, S(7) - 0.05, S(10) + 0.05, 0.3, 0.3));
  valley(t, win(t, S(10) - 0.05, S(12) + 0.05, 0.3, 0.3), 0);
  words(t);
  cv.restore();
  chrome(t, LABEL, { alpha: 1 - P(t, S(14) - 0.3, 0.3), dot: C.amber });
  subs(t, SUB_ON);
  cutFx(t, [S(2) - 0.15, S(4) - 0.1, S(6) - 0.05, S(7) - 0.05, S(10) - 0.05, S(12) - 0.05, S(13) - 0.05, S(14) - 0.1]);
  { const k = 1 - Math.abs(t - (S(8) + LN[8] * 0.55)) / 0.25; if (k > 0) { cv.fillStyle = rgba(C.loss, 0.18 * k); cv.fillRect(0, 0, W, H); } }
  finish(t);
}
boot(render);
