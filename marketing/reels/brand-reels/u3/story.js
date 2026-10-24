// u3 · «ستاپی که تو اینستاگرام دیدی، بعد از اتفاق کشیده شده», on a real test of the setup (data.py): on daily gold
// 2015–2026, the return to a confirmed swing low (buy, stop under it, target 2R) triggered 106 times: 33 reached the
// target, 73 the stop. The «Instagram» chart is one of the 33 (June 2026): perfect, once the right side is known.
// Symbols: a social post with the clean chart, the line drawn after the bounce, the known right side, the curtain at the
// entry, the 106 real outcomes, the replay with the future hidden, a count to a hundred.
const SET = D.setup, EXB = SET.example, B = EXB.bars;
function chart(t, th, n, o = {}) {
  const box = o.box ?? [-410, -270, 410, 190];
  if (!o.bare) rrect(-450, -330, 900, 620, 40, th.card, th.rule, 2);
  const m = candleChart(B, n, box, { lo: Math.min(...B.map((b) => b[2])), hi: Math.max(...B.map((b) => b[1])) });
  if (!o.bare) txt(`طلا · روزانه · ${fa(EXB.from.slice(0, 7))} تا ${fa(EXB.to.slice(0, 7))} · داده‌ی واقعی`, 0, 240, 28, th.cardMut, { w: 700 });
  return m;
}
const levelLine = (m, k, col = SKY) => { const x0 = m.X(EXB.swing) - 10, x1 = lerp(x0, m.X(B.length - 1) + 10, k); line(x0, m.Y(EXB.L), x1, m.Y(EXB.L), col, 6); };
function arrowUp(x, y, k, col = G) { if (k <= 0) return; const h = 170 * k; cv.save(); cv.strokeStyle = col; cv.fillStyle = col; cv.lineWidth = 14; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(x, y); cv.lineTo(x, y - h); cv.stroke();
  cv.beginPath(); cv.moveTo(x - 34, y - h + 10); cv.lineTo(x, y - h - 36); cv.lineTo(x + 34, y - h + 10); cv.closePath(); cv.fill(); cv.restore(); }
// the hook: a generic social post with the clean, perfect chart
function instaArt(t, th) {
  rrect(-430, -400, 860, 800, 40, th.card, th.rule, 2);
  circle(370, -340, 28, VIO); rrect(140, -356, 190, 18, 9, th.rule); rrect(200, -326, 130, 14, 7, th.rule);
  const m = chart(t, th, B.length, { bare: true, box: [-390, -270, 390, 210] });
  levelLine(m, 1); arrowUp(m.X(EXB.entry), m.Y(EXB.L) + 40, 1);
  at(m.X(EXB.entry) - 10, m.Y(EXB.L) + 80, 1, 1, () => chip('ورود عالی!', 0, 0, 30, WHITE, G));
  const hk = pop(t - ws(4), 14, 0.5); at(-350, 320, 1 + 0.25 * Math.exp(-Math.max(0, t - ws(4)) * 4) * cl(hk), 1, () => { cv.fillStyle = R; cv.beginPath(); cv.moveTo(0, 14); cv.bezierCurveTo(-28, -6, -18, -30, 0, -14); cv.bezierCurveTo(18, -30, 28, -6, 0, 14); cv.fill(); });
  txt(fa('۱۲٬۴۰۰'), -270, 322, 30, th.cardMut, { w: 800 });
  const k = pop(t - ws(7), 14, 0.5); if (k > 0) at(250, 320, cl(k, 0, 1.2), cl(k), () => chip('بعد از اتفاق', 0, 0, 32, WHITE, VIO));
}
// «یه چارت تمیز، یه خط، یه فلش… و قیمت دقیقاً همون‌جا برگشته»
function buildArt(t, th) {
  const m = chart(t, th, B.length);
  levelLine(m, cub(k01(t, ws(14) - 0.1, 0.5)));
  arrowUp(m.X(EXB.entry), m.Y(EXB.L) + 40, cub(k01(t, ws(16), 0.35)));
  const kb = pop(t - ws(21), 14, 0.5); if (kb > 0) { circle(m.X(EXB.entry), m.Y(B[EXB.entry][2]), 30 * cl(kb, 0, 1.2), null, AMB, 6); }
  const ka = pop(t - ws(23), 14, 0.5); if (ka > 0) at(250, -240, cl(ka, 0, 1.2), cl(ka), () => chip('عالیه!', 0, 0, 36, INKD, LIME));
}
// «ولی اون خط بعد از برگشت قیمت کشیده شده»: a pen draws the line at the end of the chart, after the bounce
function afterArt(t, th) {
  const m = chart(t, th, B.length), k = cub(k01(t, ws(26), ws(33) - ws(26)));
  const x1 = m.X(B.length - 1) + 10, x0 = m.X(EXB.swing) - 10, xp = lerp(x1, x0, k);
  line(xp, m.Y(EXB.L), x1, m.Y(EXB.L), SKY, 6);
  cursor(xp - 6, m.Y(EXB.L) - 4, 0.8);
  const today = m.X(B.length - 1); line(today, -270, today, 190, AMB, 3, [8, 8]); at(today - 70, -240, 1, 1, () => chip('امروز', 0, 0, 28, INKD, AMB));
}
// «وقتی سمت راست چارت معلومه»: the right side, lit
function rightArt(t, th) {
  const m = chart(t, th, B.length), k = cub(k01(t, ws(35), 0.5)), xe = m.X(EXB.entry) + m.step / 2;
  levelLine(m, 1);
  cv.save(); cv.globalAlpha *= 0.22 * k; rrect(xe, -275, 415 - xe, 470, 10, LIME); cv.restore();
  if (k > 0) at((xe + 410) / 2, -235, 1, k, () => chip('آینده، معلوم', 0, 0, 30, INKD, LIME));
}
// «لحظه‌ی ورود، سمت راست چارت خالیه»: the curtain at the entry
function curtainArt(t, th) {
  const m = chart(t, th, EXB.entry + 1), xe = m.X(EXB.entry) + m.step / 2 + 4;
  levelLine(m, (xe - m.X(EXB.swing)) / (m.X(B.length - 1) - m.X(EXB.swing)));
  const k = cub(k01(t, T.empty, 0.5)), w = (420 - xe) * k;
  rrect(xe, -300, w, 520, 20, PLATE);
  cv.save(); cv.beginPath(); cv.rect(xe, -300, w, 520); cv.clip(); cv.strokeStyle = 'rgba(255,255,255,0.06)'; cv.lineWidth = 6; for (let q = -900; q < 900; q += 34) { cv.beginPath(); cv.moveTo(xe + q, 240); cv.lineTo(xe + q + 700, -460); cv.stroke(); } cv.restore();
  if (w > 200) txt('؟', xe + w / 2, -40, 150, AMB);
}
// «بارها جواب نداده»: the 106 real outcomes of the same setup
function tallyArt(t, th) {
  rrect(-450, -360, 900, 720, 40, th.card, th.rule, 2);
  const res = SET.results, n = Math.round(cl((t - T.failed - 0.1) / (ws(58) - T.failed)) * res.length), cols = 12, p = 62, x0 = ((cols - 1) * p) / 2;
  for (let i = 0; i < res.length; i++) { const r = Math.floor(i / cols), c = i % cols, x = x0 - c * p, y = -250 + r * p;
    if (i >= n) { rrect(x - 24, y - 24, 48, 48, 12, th.soft); continue; }
    const lost = res[i] < 0, fade = lost && t > ws(59) ? 0.35 + 0.65 * (1 - cub(k01(t, ws(59), 0.6))) : 1;
    cv.save(); cv.globalAlpha *= fade; rrect(x - 24, y - 24, 48, 48, 12, lost ? R : G); cv.restore(); }
  const wins = SET.wins, losses = SET.n - SET.wins, kc = cub(k01(t, ws(57), 0.4));
  if (kc > 0) { cv.save(); cv.globalAlpha *= kc; chip(`${fa(wins)} بار جواب داد`, 200, 300, 32, WHITE, G); chip(`${fa(losses)} بار نه`, -230, 300, 32, WHITE, R); cv.restore(); }
  txt(`همین ستاپ · طلا روزانه · ${fa(2015)} تا ${fa(2026)} · ${fa(SET.n)} بار`, 0, -320, 28, th.cardMut, { w: 800 });
  const ks = pop(t - ws(61), 14, 0.5); if (ks > 0) at(-120, 120, lerp(1.7, 1, cl(ks)), cl(ks), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 24; rrect(-260, -58, 520, 116, 20, th.card); cv.shadowColor = 'transparent'; rrect(-260, -58, 520, 116, 20, null, R, 8); txt('بدون اسکرین‌شات', 0, 4, 48, R); }, -0.08);
}
// the replay: the same chart, the future hidden, played day by day with a player bar
function replayArt(t, th) {
  const n = Math.min(B.length, 20 + Math.max(0, Math.floor((t - ws(89)) / 0.08)));
  const m = chart(t, th, n), xe = m.X(n - 1) + m.step / 2 + 4;
  if (n < B.length) { rrect(xe, -300, 420 - xe, 520, 20, PLATE); txt('آینده', (xe + 420) / 2, -40, 46, AMB); }
  if (n > EXB.swing + 5) levelLine(m, cl((m.X(n - 1) - m.X(EXB.swing)) / (m.X(B.length - 1) - m.X(EXB.swing))));
  rrect(-300, 300, 600, 90, 45, th.soft);
  circle(-230, 345, 30, VIO); cv.fillStyle = WHITE; cv.beginPath(); cv.moveTo(-240, 328); cv.lineTo(-216, 345); cv.lineTo(-240, 362); cv.fill();
  rrect(-170, 338, 400, 14, 7, th.rule); rrect(-170, 338, 400 * (n / B.length), 14, 7, LIME);
  txt('بدون دیدن آینده', 250, 345, 26, th.cardMut, { w: 800, align: 'right' });
}
// «صد بار تست کن»: a counter to a hundred
function counterArt(t, th) {
  const k = cub(k01(t, ws(100), ws(103) - ws(100))), n = Math.max(1, Math.round(k * 100));
  rrect(-400, -120, 800, 240, 40, th.card, th.rule, 2);
  txt(`تست ${fa(n)} از ${fa(100)}`, 0, -30, 70, th.cardInk);
  rrect(-340, 50, 680, 26, 13, th.soft); rrect(-340, 50, 680 * (n / 100), 26, 13, LIME);
}

story({
  scenes: [
    { k: 'hook', bg: PAPER, wipe: 'none', tag: 'یه پست آشنا', tone: VIO, art: 'insta', kpos: [CX, 1300, 0.74], groups: [{ at: 0, lines: [
      { y: 400, size: 104, c: INKP, toks: [['ستاپی', 0], ['که', 1], ['تو', 2], ['اینستاگرام', 3], ['دیدی،', 4]] },
      { y: 560, size: 130, c: INKP, toks: [['بعد از اتفاق', [5, 7], { hl: VIO, ht: WHITE }]] },
      { y: 720, size: 116, c: INKP, toks: [['کشیده', 8], ['شده.', 9]] }] }] },
    { k: 'clean', bg: INKD, wipe: 'right', tag: 'چارت تمیز', tone: SKY, art: 'build', groups: [
      { at: 10, lines: [{ y: 360, size: 104, c: WHITE, toks: [['یه', 10], ['چارت', 11], ['تمیز،', 12]] }, { y: 490, size: 104, c: WHITE, toks: [['یه', 13], ['خط،', 14, { c: SKY }], ['یه', 15], ['فلش…', 16, { c: G }]] }] },
      { at: 17, lines: [{ y: 360, size: 100, c: WHITE, toks: [['و', 17], ['قیمت', 18], ['دقیقاً', 19]] }, { y: 490, size: 110, c: LIME, toks: [['همون‌جا', [20, 21]], ['برگشته.', 22]] }] },
      { at: 23, lines: [{ y: 430, size: 140, c: WHITE, toks: [['عالیه،', 23, { c: LIME }], ['نه؟', 24]] }] }] },
    { k: 'after', bg: VIO, wipe: 'iris', tag: 'بعد از اتفاق', tone: VIO, art: 'after', groups: [{ at: 25, lines: [
      { y: 360, size: 104, c: WHITE, toks: [['ولی', 25], ['اون', 26], ['خط', 27]] },
      { y: 490, size: 104, c: LIME, toks: [['بعد', 28], ['از', 29], ['برگشت', 30], ['قیمت', 31]] },
      { y: 620, size: 104, c: WHITE, toks: [['کشیده', 32], ['شده.', 33]] }] }] },
    { k: 'everyone', bg: PAPER, wipe: 'left', tag: 'سمت راست چارت', tone: LIME, art: 'right', groups: [{ at: 34, lines: [
      { y: 380, size: 96, c: INKP, toks: [['وقتی', 34], ['سمت', 35], ['راست', 36], ['چارت', 37], ['معلومه،', 38]] },
      { y: 530, size: 104, c: INKP, toks: [['همه', 39], ['تحلیلگر خوبی‌ان.', [40, 42], { hl: VIO, ht: WHITE }]] }] }] },
    { k: 'empty', bg: INKD, wipe: 'up', tag: 'لحظه‌ی ورود', tone: AMB, art: 'curtain', groups: [{ at: 43, lines: [
      { y: 340, size: 92, c: WHITE, toks: [['مشکل', 43], ['اینه', 44], ['که', 45], ['لحظه‌ی', 46], ['ورود،', 47]] },
      { y: 470, size: 100, c: WHITE, toks: [['سمت', 48], ['راست', 49], ['چارت', 50]] },
      { y: 620, size: 140, c: LIME, toks: [['خالیه.', 51]] }] }] },
    { k: 'failed', bg: PAPER, wipe: 'right', tag: '۱۰۶ بار، روی داده‌ی واقعی', tone: R, art: 'tally', kpos: [CX, 1150, 0.88], groups: [
      { at: 52, lines: [{ y: 360, size: 96, c: INKP, toks: [['و', 52], ['احتمالاً', 53], ['همون', 54], ['ستاپ', 55]] }, { y: 490, size: 110, c: R, toks: [['بارها', 56], ['جواب', 57], ['نداده؛', 58]] }] },
      { at: 59, lines: [{ y: 360, size: 96, c: INKP, toks: [['فقط', 59], ['کسی', 60], ['اسکرین‌شاتش‌رو', 61]] }, { y: 500, size: 130, c: INKP, toks: [['نذاشته.', 62, { hl: R, ht: WHITE }]] }] }] },
    { k: 'only', bg: INKD, wipe: 'down', tag: 'تنها راه', tone: LIME, groups: [{ at: 63, lines: [
      { y: 560, size: 92, c: MD, toks: [['تنها', 63], ['راه', 64], ['فهمیدنِ', 65], ['اینکه', [66, 67]]] },
      { y: 690, size: 100, c: WHITE, toks: [['یه', 68], ['ستاپ', 69], ['واقعاً', 70], ['کار', 71], ['می‌کنه،', 72]] },
      { y: 830, size: 100, c: WHITE, toks: [['اینه', 73], ['که', 74]] },
      { y: 990, size: 130, c: LIME, toks: [['بدون', 75], ['دیدن', 76], ['آینده', 77]] },
      { y: 1150, size: 120, c: WHITE, toks: [['تستش', 78], ['کنی.', 79]] }] }] },
    { k: 'brand', bg: PAPER, wipe: 'right', art: 'brand', kpos: [CX, 1000, 1], mpos: [CX, 1000, 1], groups: [{ at: 80, lines: [{ y: 600, size: 90, c: MP, toks: [['توی', 80], ['بک‌تست‌لب،', [81, 82], { c: VIO }]] }] }] },
    { k: 'replay', bg: INKD, wipe: 'up', tag: 'بازپخش بدون آینده', tone: AMB, art: 'replay', groups: [
      { at: 83, lines: [{ y: 360, size: 96, c: WHITE, toks: [['بازار', 83], ['واقعی', 84], ['رو', 85]] }, { y: 490, size: 110, c: LIME, toks: [['بدون', 86], ['دیدن', 87], ['آینده', 88]] }, { y: 620, size: 96, c: WHITE, toks: [['پخش', 89], ['می‌کنی؛', 90]] }] },
      { at: 91, lines: [{ y: 380, size: 96, c: WHITE, toks: [['دقیقاً', 91], ['مثل', 92], ['وقتی', 93], ['که', 94]] }, { y: 520, size: 110, c: WHITE, toks: [['داری', 95], ['ترید', 96, { c: LIME }], ['می‌کنی.', 97]] }] }] },
    { k: 'hundred', bg: VIO, wipe: 'iris', tag: 'صد بار', tone: LIME, art: 'counter', kpos: [CX, 1320, 0.85], mpos: [CX, 1040, 1.3], groups: [
      { at: 98, lines: [{ y: 400, size: 104, c: WHITE, toks: [['ستاپت', 98], ['رو', 99]] }, { y: 580, size: 180, c: LIME, toks: [['صد', 100], ['بار', 101]] }, { y: 760, size: 110, c: WHITE, toks: [['تست', 102], ['کن،', 103]] }] },
      { at: 104, lines: [{ y: 560, size: 110, c: WHITE, toks: [['بعد', 104], ['بهش', 105]] }, { y: 730, size: 140, c: LIME, toks: [['اعتماد', 106], ['کن.', 107]] }] }] },
    { k: 'end', bg: VIO, wipe: 'iris', art: 'end', kpos: [CX, 1000, 1], mpos: [CX, 1000, 1], groups: [] },
  ],
  art: {
    insta: instaArt, build: buildArt, after: afterArt, right: rightArt, curtain: curtainArt, tally: tallyArt, replay: replayArt, counter: counterArt,
    brand: (t, th) => brandArt(t, th, ws(81)),
    end: (t, th) => endArt(t, th, { t0: T.end, free: ws(108), link: ws(110) }),
  },
  shakes: [[ws(51), 8], [ws(58), 10], [ws(62), 8]],
  cover: () => {
    if (KIN) { cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H); } else stage(0);
    const ink = KIN ? INKP : WHITE;
    const fit = (str, size) => Math.min(size, size * 940 / measure(str, size));   // keep every line inside the frame
    txt('ستاپی که', CX, 350, 108, ink); txt('تو اینستاگرام دیدی،', CX, 490, fit('تو اینستاگرام دیدی،', 104), ink);
    const s = 'بعد از اتفاق', size = 140, w = measure(s, size); cv.save(); cv.translate(CX, 670); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, VIO); cv.restore(); txt(s, CX, 670, size, WHITE);
    txt('کشیده شده.', CX, 845, 112, ink);
    at(CX, 1320, 0.78, 1, () => instaArt(ws(9) + 1, KIN ? THEME.paper : THEME.stage));
  },
});
