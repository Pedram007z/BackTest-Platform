// t1 · «تاحالا بک‌تست‌لب به گوشت خورده؟ … اول بگم چی نیست», a typographic poster reel on the user's voice.
// A different kinetic look:
//   - the type is the picture: giant Vazirmatn set to fill the width, on cream paper, in black ink with one red;
//   - each word slides up through a mask on its spoken word, and slides out the top at the cut;
//   - hard cuts on the beat, with inversions (black pages) for the key lines;
//   - «سیگنال», «پیش‌بینی» and «قول سود» are struck through; «آینده» is redacted; «تصمیم» multiplies across the page;
//   - editorial furniture: a section label, the scene count, a red progress rule (right to left), paper grain.
// The real platform appears as black-and-white inserts (f1's dark-theme captures):
//   - the session window's data range «۱۱ دی ۱۳۹۳ تا ۱۵ مهر ۱۴۰۵»;
//   - its spread and commission fields;
//   - the gold replay.
// This file replaces u-kit's scenes: it calls story() with none, then sets window.seek and window.cover itself.
story({ scenes: [], art: {} });
const CREAM = '#EFE9DD', INK = '#121212', RED = '#E3342F', GREY = '#8C867B';
const M = 80, RX = W - M, LX = M;
const easeO = (t, a, d) => cub(k01(t, a, d)), easeI = (x) => x * x * x;
const fit = (s, maxW, cap, w = 900) => Math.min(cap, (cap * maxW) / Math.max(1, measure(s, cap, w)));

// ---------- type through a mask ----------
/** s slides up into its line box at t0 and out of the top at sc.t1 (the scene's cut). align: 'right' (x is the right edge), 'center', 'left'. */
function reveal(s, x, y, size, col, t0, sc, o = {}) {
  const k = easeO(sc.t, t0, o.dur ?? 0.28); if (k <= 0) return null;
  const ke = o.stay ? 0 : easeI(k01(sc.t, sc.t1 - 0.16, 0.16)), w = measure(s, size, o.w ?? 900), al = o.align ?? 'right';
  const x0 = al === 'right' ? x - w : al === 'center' ? x - w / 2 : x, top = y - size * 0.9, hh = size * 1.55;
  cv.save(); cv.beginPath(); cv.rect(x0 - 40, top, w + 80, hh); cv.clip();
  const dy = (1 - k) * size * 1.15 - ke * size * 1.15;
  txt(s, x0 + w / 2, y + dy, size, col, { w: o.w ?? 900 }); cv.restore();
  return [x0, x0 + w];
}
/** several words on one line, each on its own word time and colour: [[text, wordIndex, colour?], …], right-aligned at x (or centred) */
function line(words, x, y, size0, col, sc, o = {}) {
  const wgt = o.w ?? 900, maxW = o.maxW ?? 920, meas = (z) => { const g = measure(' ', z, wgt) * 1.5, a = words.map(([s]) => measure(s, z, wgt)); return [g, a, a.reduce((p, q) => p + q, 0) + g * (words.length - 1)]; };
  let size = size0, [gap, ws_, total] = meas(size); if (total > maxW) { size = (size * maxW) / total; [gap, ws_, total] = meas(size); }
  let right = o.align === 'center' ? x + total / 2 : x; const spans = [], ow = { ...o, align: 'right' };
  words.forEach(([s, wi, c], j) => { spans.push(reveal(s, right, y, size, c ?? col, ws(Array.isArray(wi) ? wi[0] : wi) - 0.06, sc, ow)); right -= ws_[j] + gap; });
  return spans;
}
function strike(x0, x1, y, k, col = RED, lw = 24) { if (k <= 0) return; cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'butt'; cv.beginPath(); cv.moveTo(x1, y); cv.lineTo(x1 - (x1 - x0) * cl(k), y); cv.stroke(); cv.restore(); }
function redact(x0, x1, y, h, k, col = INK) { if (k <= 0) return; rrect(x1 - (x1 - x0) * cl(k), y - h / 2, (x1 - x0) * cl(k), h, 6, col); }
/** a real screen, black and white, as a newspaper photo: a thin frame and a caption */
function photo(key, r, x, y, w, a, cap, ink) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im || a <= 0) return h; const s = im.width / 1440;
  cv.save(); cv.globalAlpha *= a; cv.filter = 'grayscale(1) contrast(1.15) brightness(1.1)'; cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.filter = 'none';
  cv.strokeStyle = ink; cv.lineWidth = 3; cv.strokeRect(x, y, w, h); if (cap) txt(cap, x + w, y + h + 34, 26, ink, { align: 'right', w: 700 }); cv.restore(); return h; }
function ringR(r, q, x, y, w, k, col = RED) { if (k <= 0) return; const s = w / r[2], m = 8 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.strokeStyle = col; cv.lineWidth = 7;
  cv.strokeRect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m); cv.restore(); }
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];

// ---------- the scenes ----------
const RC = [455, 685, 535, 95], RCS = [520, 305, 470, 115], RREP = [40, 130, 1110, 700];
const DK = ['d02', 'd06', 'd10', 'd14', 'd18', 'd22', 'd26', 'd30', 'd34', 'd38'];
const S = [
  { k: 'hook', bg: CREAM, label: 'سؤال', draw(sc) {
    reveal('تاحالا', RX, 500, 120, INK, -1, sc);
    const sz = fit('بک‌تست‌لب', 920, 330); reveal('بک‌تست‌لب', CX, 780, sz, INK, ws(2) - 0.06, sc, { align: 'center' });
    line([['به', 4], ['گوشت', 5]], RX, 1050, 150, INK, sc);
    reveal('خورده؟', RX, 1260, 190, INK, ws(6) - 0.06, sc);
    const kq = pop(sc.t - ws(6) - 0.05, 10, 0.5); if (kq > 0) at(270, 1180, cl(kq, 0, 1.2), cl(kq) * (1 - k01(sc.t, sc.t1 - 0.16, 0.16)), () => txt('؟', 0, 0, 520, RED), -0.12 + 0.04 * Math.sin(sc.t * 3)); } },
  { k: 'intro', bg: CREAM, label: 'معرفی', draw(sc) {
    line([['اگه', 7], ['نه،', 8]], RX, 380, 120, GREY, sc);
    line([['پس', 9], ['بذار', 10], ['بهت', 11], ['بگم', 12]], RX, 580, 130, INK, sc);
    reveal('چیه', RX, 880, 340, RED, ws(13) - 0.06, sc);
    line([['و', 14], ['چه', 15], ['کارایی', 16]], RX, 1180, 140, INK, sc);
    line([['از', 17], ['دستش', 18], ['برمیاد.', 19]], RX, 1380, 140, INK, sc); } },
  { k: 'nots', bg: INK, label: 'چی نیست', draw(sc) {
    line([['اول', 20], ['بگم', 21]], RX, 720, 130, CREAM, sc);
    line([['چی', 22], ['نیست', 23, RED]], CX, 1020, 330, CREAM, sc, { align: 'center', maxW: 900 }); } },
  { k: 'signal', bg: CREAM, label: 'چی نیست', draw(sc) {
    const rows = [[['سیگنال'], 24, 25, 'نمی‌فروشه', 560], [['پیش‌بینی'], 29, 30, 'نمی‌کنه', 960], [['قول سود'], 32, 34, 'نمی‌ده', 1360]];
    const fall = (i) => { const d = Math.max(0, sc.t - (sc.t1 - 0.32 + i * 0.05)); return [d * d * 5200, d * (i % 2 ? 1.2 : -1.2)]; };
    rows.forEach(([[s], wi, wn, tag, y], i) => { const [dy, rot] = fall(i); cv.save(); cv.translate(CX, y + dy); cv.rotate(rot); cv.translate(-CX, -y);
      const size = fit(s, 590, 230), span = reveal(s, RX, y, size, INK, ws(wi) - 0.06, sc, { stay: true });
      if (i === 1) reveal('آینده رو', RX, y - 175, 70, GREY, ws(27) - 0.06, sc, { stay: true });
      if (span) strike(span[0] - 20, span[1] + 20, y - size * 0.05, easeO(sc.t, ws(wn), 0.28), RED, Math.max(18, size * 0.11));
      reveal(tag, LX, y + 10, 56, RED, ws(wn) + 0.05, sc, { align: 'left', stay: true }); cv.restore(); }); } },
  { k: 'one', bg: CREAM, label: 'چی هست', draw(sc) {
    const k1 = pop(sc.t - ws(37) + 0.05, 9, 0.55); if (k1 > 0) at(250, 1000, cl(k1, 0, 1.15), cl(k1) * (1 - easeI(k01(sc.t, sc.t1 - 0.16, 0.16))), () => txt(fa(1), 0, 40, 1150, RED));
    reveal('فقط', RX, 560, 160, INK, ws(36) - 0.06, sc);
    line([['یه', 37], ['کار', 38]], RX, 790, 200, INK, sc);
    reveal('می‌کنه،', RX, 1000, 130, GREY, ws(39) - 0.06, sc);
    reveal('اونم', RX, 1230, 130, INK, ws(41) - 0.06, sc);
    const span = reveal('درست.', RX, 1450, 220, INK, ws(42) - 0.06, sc);
    const kc = easeO(sc.t, ws(42) + 0.15, 0.3); if (span && kc > 0) { const x = span[0] - 110, y = 1440; cv.save(); cv.strokeStyle = RED; cv.lineWidth = 26; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(x - 60, y); cv.lineTo(x - 60 + 40 * cl(kc * 2), y + 40 * cl(kc * 2)); if (kc > 0.5) cv.lineTo(x - 20 + 90 * cl(kc * 2 - 1), y + 40 - 100 * cl(kc * 2 - 1)); cv.stroke(); cv.restore(); } } },
  { k: 'market', bg: CREAM, label: 'بازار واقعی', draw(sc) {
    line([['بازار', 43], ['واقعی', 44, RED], ['رو', 45]], RX, 400, 160, INK, sc);
    reveal('از', RX, 590, 64, GREY, ws(46) - 0.06, sc); reveal('تا', 620, 590, 64, GREY, ws(51) - 0.06, sc);
    reveal(fa(2015), RX, 760, 220, INK, ws(47) - 0.06, sc);
    const kr = easeO(sc.t, ws(50) - 0.1, ws(52) - ws(50) + 0.1); if (kr > 0) { strike(420, 580, 760, kr, INK, 10); }
    reveal('امروز', LX, 760, 135, RED, ws(52) - 0.06, sc, { align: 'left' });
    const kp = easeO(sc.t, ws(48), 0.35); if (kp > 0) { const w = 920, x = CX - w / 2, y = 960, h = photo('c-session', RC, x, y, w, kp * (1 - easeI(k01(sc.t, sc.t1 - 0.16, 0.16))), 'صفحه‌ی واقعی بک‌تست‌لب · ساخت جلسه', INK); ringR(RC, [800, 755, 195, 24], x, y, w, easeO(sc.t, ws(50), 0.3) * (1 - easeI(k01(sc.t, sc.t1 - 0.16, 0.16)))); }
    line([['جلوت', 53], ['می‌ذاره،', [54, 55]]], RX, 1400, 150, INK, sc); } },
  { k: 'blind', bg: CREAM, label: 'بدون آینده', draw(sc) {
    line([['بدون', 56], ['اینکه', [57, 58]], ['بذاره', 59]], RX, 600, 130, INK, sc);
    const sz = fit('آینده', 900, 400), span = reveal('آینده', CX, 960, sz, INK, ws(60) - 0.06, sc, { align: 'center' });
    if (span) { redact(span[0] - 30, span[1] + 30, 960 - sz * 0.1, sz * 1.25, easeO(sc.t, ws(60) + 0.22, 0.3) * (1 - easeI(k01(sc.t, sc.t1 - 0.16, 0.16)))); }
    line([['رو', 61], ['ببینی،', 62]], RX, 1300, 140, INK, sc); } },
  { k: 'you', bg: INK, label: 'تصمیم', draw(sc) {
    line([['و', 63], ['می‌گه:', [64, 65]]], RX, 420, 100, GREY, sc);
    reveal('حالا', RX, 640, 170, CREAM, ws(66) - 0.06, sc);
    const k = pop(sc.t - ws(67) + 0.04, 10, 0.5); if (k > 0) at(CX + 30, 1080, lerp(1.25, 1, cl(k)), cl(k) * (1 - easeI(k01(sc.t, sc.t1 - 0.16, 0.16))), () => txt('تو', 0, 0, 760, RED));
    line([['تصمیم', 68], ['بگیر.', 69]], CX, 1500, 170, CREAM, sc, { align: 'center' }); } },
  { k: 'trade', bg: CREAM, label: 'معامله', draw(sc) {
    line([['وارد', 70], ['می‌شی،', [71, 72]]], RX, 400, 170, INK, sc);
    line([['حد', 73, RED], ['ضرر', 74, RED], ['می‌ذاری،', [75, 76]]], RX, 610, 150, INK, sc);
    line([['با', 77], ['اسپرد', 78], ['و', 79], ['کمیسیون', 80]], RX, 810, 120, INK, sc);
    reveal('واقعی.', RX, 1000, 210, RED, ws(81) - 0.06, sc);
    const kp = easeO(sc.t, ws(77), 0.35); if (kp > 0) { const w = 920, x = CX - w / 2, y = 1180, a = kp * (1 - easeI(k01(sc.t, sc.t1 - 0.16, 0.16))); photo('c-session', RCS, x, y, w, a, 'صفحه‌ی واقعی بک‌تست‌لب · اسپرد و کمیسیون', INK);
      ringR(RCS, [790, 370, 104, 40], x, y, w, easeO(sc.t, ws(78), 0.3) * a); ringR(RCS, [572, 370, 102, 40], x, y, w, easeO(sc.t, ws(80), 0.3) * a); } } },
  { k: 'forward', bg: CREAM, label: 'نتیجه', draw(sc) {
    const kp = easeO(sc.t, sc.t0 - 0.05, 0.35); if (kp > 0) { const w = 920, x = CX - w / 2, y = 250; photo(FLIP(sc.t, ws(82), ws(96), DK), RREP, x, y, w, kp * (1 - easeI(k01(sc.t, sc.t1 - 0.16, 0.16))), 'صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', INK); }
    line([['بازار', 82], ['جلو', 83], ['می‌ره', [84, 85]]], RX, 1010, 150, INK, sc);
    line([['و', 86], ['می‌بینی', [87, 88]], ['اون', 89], ['تصمیم', 90, RED]], RX, 1200, 120, INK, sc);
    line([['چی', 91], ['از', 92], ['آب', 93], ['درمیاد.', [94, 95]]], RX, 1390, 140, INK, sc); } },
  { k: 'again', bg: CREAM, label: 'تکرار', draw(sc) {
    line([['بعد', 97], ['یه', 98], ['تصمیم', 99, RED], ['دیگه،', 100]], RX, 330, 110, INK, sc);
    line([['و', 101], ['یکی', 102], ['دیگه.', 103]], RX, 480, 110, INK, sc);
    // «تصمیم», again and again, faster and faster
    const t0 = ws(99), t1 = ws(103) + 0.3, N = 44;
    for (let i = 0; i < N; i++) { const ti = t0 + (t1 - t0) * Math.sqrt(i / N), k = pop(sc.t - ti, 16, 0.55); if (k <= 0) continue;
      const col = i % 7 === 3 ? RED : INK, size = 46 + rnd(i * 3.1) * 120, x = 120 + rnd(i * 1.7) * 840, y = 640 + (i % 11) * 95 + rnd(i * 5.3) * 40, rot = (rnd(i * 2.3) - 0.5) * 0.5;
      const out = easeI(k01(sc.t, sc.t1 - 0.2, 0.2)); at(lerp(x, CX, out), lerp(y, 1100, out), cl(k, 0, 1.3) * (1 - out), cl(k) * (1 - out), () => txt('تصمیم', 0, 0, size, col), rot); } } },
  { k: 'gift', bg: CREAM, label: 'آخرش', draw(sc) {
    reveal('آخرش', RX, 420, 130, GREY, ws(104) - 0.06, sc);
    line([['یه', 105], ['چیزی', 106], ['دستته', 107]], RX, 620, 160, INK, sc);
    line([['که', 108], ['هیچ', 109]], RX, 830, 120, INK, sc);
    const sz = fit('سیگنال‌فروشی', 920, 240), span = reveal('سیگنال‌فروشی', CX, 1060, sz, INK, ws(110) - 0.06, sc, { align: 'center' });
    if (span) strike(span[0] - 20, span[1] + 20, 1055, easeO(sc.t, ws(113), 0.3), RED, sz * 0.11);
    line([['بهت', 112], ['نمی‌ده:', [113, 114], RED]], RX, 1300, 130, INK, sc); } },
  { k: 'exp', bg: INK, label: 'تجربه', draw(sc) {
    const s1 = fit('تجربه‌ی', 920, 340); reveal('تجربه‌ی', CX, 860, s1, CREAM, ws(115) - 0.06, sc, { align: 'center' });
    const s2 = fit('خودت.', 920, 440); reveal('خودت.', CX, 1220, s2, RED, ws(116) - 0.06, sc, { align: 'center' }); } },
  { k: 'cta', bg: CREAM, label: 'شروع', draw(sc) {
    const ki = pop(sc.t - sc.t0 + 0.05, 11, 0.6); if (ki > 0 && IMG.icon) at(CX, 520, cl(ki, 0, 1.2), cl(ki), () => cv.drawImage(IMG.icon, -120, -120, 240, 240));
    const kw = easeO(sc.t, sc.t0 + 0.15, 0.35); if (kw > 0 && IMG.wordL) { const w = 520, h = (w * IMG.wordL.height) / IMG.wordL.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.wordL, CX - w / 2, 690 + (1 - kw) * 20, w, h); cv.restore(); }
    line([['شروعش', 117], ['رایگانه؛', 118, RED]], CX, 1020, 150, INK, sc, { align: 'center', stay: true });
    line([['لینکش', 119], ['توی', 120], ['بیوئه.', 121]], CX, 1210, 120, INK, sc, { align: 'center', stay: true });
    const kb = pop(sc.t - T.end - 0.1, 12, 0.6); if (kb > 0) at(CX, 1420, cl(kb, 0, 1.2), cl(kb), () => { rrect(-250, -66, 500, 132, 66, INK); txt('لینک توی بیو', 0, 4, 56, CREAM); });
    const ka = easeO(sc.t, T.end + 0.4, 0.4); if (ka > 0) { const y = 1580 - ((sc.t * 1.6) % 1) * 26; cv.save(); cv.globalAlpha *= ka; cv.strokeStyle = RED; cv.lineWidth = 12; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(CX - 36, y + 22); cv.lineTo(CX, y - 14); cv.lineTo(CX + 36, y + 22); cv.stroke(); cv.restore(); } } },
];
S.forEach((s, i) => { s.t0 = T[s.k]; s.t1 = i + 1 < S.length ? T[S[i + 1].k] : DUR + 1; });

// ---------- furniture, grain ----------
const GRAIN = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = 110 + Math.floor(rnd(i * 0.37) * 145); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; })();
function furniture(t, sc, i) {
  const ink = sc.bg === INK ? CREAM : INK;
  txt('بک‌تست‌لب', RX, 118, 30, ink, { align: 'right', w: 800 });
  txt(`${fa(String(i + 1).padStart(2, '0'))} / ${fa(S.length)}`, LX, 118, 28, ink, { align: 'left', w: 700, dir: 'ltr' });
  txt(sc.label, CX, 118, 28, sc.bg === INK ? '#9A948A' : GREY, { w: 700 });
  line_(LX, 158, RX, 158, ink, 2);
  line_(LX, 1772, RX, 1772, rgba(ink === INK ? '#121212' : '#EFE9DD', 0.18), 4); line_(RX - (RX - LX) * cl(t / DUR), 1772, RX, 1772, RED, 4);
}
function line_(x1, y1, x2, y2, col, lw) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.beginPath(); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.stroke(); cv.restore(); }

// ---------- the frame ----------
function frame(t, nofurn) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none'; cv.globalCompositeOperation = 'source-over';
  let i = 0; S.forEach((s, j) => { if (t >= s.t0 - 0.02) i = j; }); const sc = S[i]; sc.t = t;
  cv.fillStyle = sc.bg; cv.fillRect(0, 0, W, H);
  // a hard cut, with a one-frame jolt
  const j = t - sc.t0 < 0.05 && i > 0 ? 8 : 0; cv.save(); cv.translate(0, j);
  sc.draw(sc); cv.restore();
  if (!nofurn) furniture(t, sc, i);
  cv.save(); cv.globalCompositeOperation = sc.bg === INK ? 'screen' : 'multiply'; cv.globalAlpha = sc.bg === INK ? 0.05 : 0.12;
  const ox = Math.floor(rnd(Math.floor(t * 12)) * 256), oy = Math.floor(rnd(Math.floor(t * 12) + 5) * 256); for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) cv.drawImage(GRAIN, x, y); cv.restore();
}
window.seek = (t) => frame(t);
window.cover = () => {
  const sc = { t: 99, t0: 0, t1: 999, bg: CREAM };
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.fillStyle = CREAM; cv.fillRect(0, 0, W, H);
  txt('بک‌تست‌لب', RX, 118, 30, INK, { align: 'right', w: 800 }); line_(LX, 158, RX, 158, INK, 2);
  txt('اول بگم', RX, 430, 130, INK, { align: 'right' });
  const rows = [['سیگنال', 690], ['پیش‌بینی', 960], ['قول سود', 1230]];
  rows.forEach(([s, y]) => { const size = fit(s, 820, 240), w = measure(s, size); txt(s, RX - w / 2, y, size, INK); strike(RX - w - 20, RX + 20, y - size * 0.05, 1, RED, size * 0.11); });
  const sz = fit('چی نیست', 940, 300); txt('چی', CX + measure('نیست', sz) / 2 + 20, 1530, sz, INK); txt('نیست', CX - measure('چی', sz) / 2 - 20, 1530, sz, RED);
  cv.save(); cv.globalCompositeOperation = 'multiply'; cv.globalAlpha = 0.12; for (let x = 0; x < W; x += 256) for (let y = 0; y < H; y += 256) cv.drawImage(GRAIN, x, y); cv.restore();
};
