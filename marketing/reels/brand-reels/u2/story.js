// u2 · «چرا همیشه درست بعد از اینکه می‌بندی، قیمت راه می‌افته؟», on one real move (data.py): gold on 15-minute candles,
// 15 April 2025, a long at 3227.72 that went up a little, came back to the entry three candles later, and then ran to
// 3317.57 within 12 hours. The nervous close on the pullback, the run it missed, «ضررها کامل، سودها نصفه» (an
// example), the plan before the entry, three exit rules as cards, each rule its own strategy, and the comparison left
// for the viewer's own numbers.
const EX = D.ex, B = EX.bars;
const missed = Math.round(EX.high - EX.exitAt);
function realChart(t, th, n, o = {}) {
  rrect(-450, -340, 900, 640, 40, th.card, th.rule, 2);
  const vis = B.slice(0, Math.max(EX.pull + 4, n));   // the price scale follows the candles shown so far
  const m = candleChart(B, n, [-410, -280, 410, 200], { lo: Math.min(...vis.map((b) => b[2])), hi: Math.max(...vis.map((b) => b[1])) });
  txt(`طلا · ۱۵ دقیقه · ${fa(EX.date.slice(0, 10))} · داده‌ی واقعی`, 0, 245, 30, th.cardMut, { w: 700 });
  return m;
}
// the hook: the trade, the nervous close on the pullback, then the run
function hookArt(t, th) {
  const run0 = ws(9) - 0.1, nUp = EX.pull + 1, n = t < run0 ? Math.min(nUp, Math.floor(t / 0.06) + EX.entry) : Math.min(B.length, nUp + Math.floor((t - run0) / 0.035));
  const m = realChart(t, th, Math.max(EX.entry + 1, n)), xe = m.X(EX.entry), xp = m.X(EX.pull);
  line(xe, m.Y(EX.E), 410, m.Y(EX.E), th.cardMut, 3, [10, 8]); at(xe, m.Y(EX.E) + 44, 1, 1, () => chip('ورود', 0, 0, 28, th.cardInk, th.soft));
  if (n > EX.pull) { at(xp, m.Y(EX.exitAt) - 70, 1, 1, () => { chip('بستی', 0, 0, 32, WHITE, R); }); circle(xp, m.Y(EX.exitAt), 12, R, WHITE, 3); }
  if (t > run0 + 0.3) { const k = cub(k01(t, run0 + 0.3, 0.6)); cv.save(); cv.globalAlpha *= k; at(m.X(EX.top) - 140, m.Y(EX.high) + 10, 1, 1, () => chip(`+${fa(missed)} دلار بعد از خروجت`, 0, 0, 32, INKD, LIME)); cv.restore(); }
}
// «قیمت یه کم برمی‌گرده»: the pullback ringed on the real chart
function pullArt(t, th) {
  const n = Math.min(B.length, EX.entry + 1 + Math.floor((t - T.pullback) / 0.04));
  const m = realChart(t, th, n), k = cub(k01(t, ws(27), 0.35));
  if (k > 0) { const x0 = m.X(EX.peak) - 18, x1 = m.X(EX.pull) + 18, y0 = m.Y(Math.max(...B.slice(EX.peak, EX.pull + 1).map((b) => b[1]))) - 18, y1 = m.Y(Math.min(...B.slice(EX.peak, EX.pull + 1).map((b) => b[2]))) + 18;
    cv.save(); cv.globalAlpha *= k; rrect(x0, y0, x1 - x0, y1 - y0, 16, null, AMB, 5); cv.restore(); at((x0 + x1) / 2, y1 + 40, 1, k, () => chip('برگشت کوچیک', 0, 0, 28, INKD, AMB)); }
}
// «سودم داره می‌ره، ببندم»: the open profit on the real candles shrinking, and the click
function fearArt(t, th) {
  rrect(-420, -300, 840, 600, 40, th.card, th.rule, 2);
  // from the move's real high (+a) down to the real close on the pullback
  const k = cub(cl((t - T.fear) / (ws(40) - T.fear))), top = Math.max(...B.slice(EX.entry + 1, EX.pull + 1).map((b) => b[1])), pnl = lerp(top, EX.exitAt, k) - EX.E;
  txt('سود باز (هر اونس)', 380, -230, 36, th.cardMut, { align: 'right', w: 800 });
  txt(`${pnl >= 0 ? '+' : '−'}${fa(Math.abs(pnl).toFixed(2)).replace('.', '٫')} دلار`, 0, -110, 110, pnl > 2 ? G : AMB, { dir: 'rtl' });
  const b = pop(t - ws(37), 12, 0.6); if (b > 0) at(0, 90, cl(b, 0, 1.1), cl(b), () => { const press = t >= ws(40) && t < ws(40) + 0.15; rrect(-250, -70, 500, 140, 70, press ? '#C7253A' : R); txt(t >= ws(40) ? 'بسته شد' : 'بستن معامله', 0, 4, 56, WHITE); });
  const cm = cub(k01(t, ws(37), ws(40) - ws(37))); if (cm > 0 && t < ws(40) + 0.6) cursor(lerp(380, 60, cm), lerp(320, 120, cm), 1.1);
}
// «ضررها کامل، سودها نصفه»: three full losses, three wins cut short of their plan (an example)
function barsArt(t, th) {
  rrect(-450, -330, 900, 640, 40, th.card, th.rule, 2);
  chip('نمونه', -370, -270, 26, th.cardMut, th.soft);
  const base = 40, U = 110; line(-400, base, 400, base, th.rule, 3);
  const items = [[-1, ws(42)], [0.5, ws(44)], [-1, ws(42) + 0.12], [0.5, ws(44) + 0.12], [-1, ws(42) + 0.24], [0.5, ws(44) + 0.24]];
  items.forEach(([v, st], i) => { const x = 330 - i * 130, k = cub(k01(t, st, 0.3));
    if (v > 0) { cv.save(); cv.setLineDash([10, 8]); rrect(x - 40, base - 2 * U, 80, 2 * U, 10, null, rgba(G, 0.7), 3); cv.restore(); }
    if (k > 0) rrect(x - 40, v > 0 ? base - v * U * k : base, 80, Math.abs(v) * U * k, 10, v > 0 ? G : R);
    txt(v > 0 ? '+۰٫۵R' : '−۱R', x, v > 0 ? base + 40 : base + U + 40, 28, v > 0 ? G : R, { dir: 'ltr', w: 800 }); });
  const kp = cub(k01(t, ws(44) + 0.4, 0.3)); if (kp > 0) at(240, -230, 1, kp, () => chip('هدف: +۲R', 0, 0, 28, WHITE, G));
}
// the plan before the entry: the levels set first
function planArt(t, th) {
  rrect(-420, -260, 840, 520, 40, th.card, th.rule, 2);
  const rows = [['حد سود', '+۲R', G, -150, ws(60)], ['ورود', '', th.cardInk, 20, ws(57)], ['حد ضرر', '−۱R', R, 130, ws(60) + 0.15]];
  rows.forEach(([a, b, col, y, st]) => { const k = cub(k01(t, st, 0.3)); if (k <= 0) return; cv.save(); cv.globalAlpha *= k;
    line(-360, y, lerp(-360, 360, k), y, col, 6, a === 'ورود' ? [12, 10] : null); txt(a, 360, y - 36, 34, col, { align: 'right', w: 800 }); if (b) txt(b, -360, y - 36, 34, col, { align: 'left', dir: 'ltr', w: 800 }); cv.restore(); });
  const kc = pop(t - ws(62), 14, 0.55); if (kc > 0) at(0, 215, cl(kc, 0, 1.2), cl(kc), () => chip('قبل از ورود', 0, 0, 32, WHITE, VIO));
}
// three exit rules, each with its little picture
function optionsArt(t, th) {
  const opts = [['تارگت ثابت', ws(68), 'fixed'], ['حد ضرر متحرک', ws(70), 'trail'], ['نصفش رو ببندی', ws(73), 'half']];
  opts.forEach(([s, st, kind], i) => {
    const k = pop(t - st + 0.05, 14, 0.6); if (k <= 0) return; const y = -250 + i * 250;
    at(0, y, cl(k, 0, 1.08), cl(k), () => {
      rrect(-430, -100, 860, 200, 36, th.card, th.rule, 2);
      txt(s, 380, 0, 52, th.cardInk, { align: 'right' }); circle(-360, 0, 30, VIO); txt(fa(i + 1), -360, 3, 36, WHITE);
      const x0 = -300, x1 = -60;
      if (kind === 'fixed') { trace([[x0, 50], [x0 + 60, 20], [x0 + 110, 35], [x0 + 170, -10], [x1, -50]], 1, MINT, 6); line(x0, -50, x1, -50, G, 5, [10, 8]); }
      if (kind === 'trail') { trace([[x0, 50], [x0 + 60, 10], [x0 + 110, 25], [x0 + 170, -30], [x1, -60]], 1, MINT, 6); trace([[x0, 70], [x0 + 70, 70], [x0 + 70, 40], [x0 + 150, 40], [x0 + 150, 5], [x1, 5]], 1, R, 5); }
      if (kind === 'half') { trace([[x0, 50], [x0 + 80, 0], [x0 + 140, 15], [x1, -50]], 1, MINT, 6); circle(x0 + 80, 0, 12, AMB); txt('½', x0 + 80, -40, 40, AMB, { dir: 'ltr' }); }
    });
  });
}
// each exit rule as its own strategy
function stratsArt(t, th) {
  const rows = [['ستاپ من · تارگت ثابت', ws(90)], ['ستاپ من · حد ضرر متحرک', ws(90) + 0.15], ['ستاپ من · بستن نصف', ws(90) + 0.3]];
  rows.forEach(([s, st], i) => { const k = pop(t - st, 14, 0.6); if (k <= 0) return; const y = -200 + i * 190;
    at(lerp(120, 0, cl(k)), y, 1, cl(k), () => { rrect(-420, -75, 840, 150, 30, th.card, i === 0 ? rgba(LIME, 0.7) : th.rule, 3); txt(s, 370, 0, 44, th.cardInk, { align: 'right', w: 800 }); chip('استراتژی', -300, 0, 28, INKD, LIME); }); });
}
// the comparison waits for the viewer's own test
function compareArt(t, th) {
  rrect(-450, -320, 900, 640, 40, th.card, th.rule, 2);
  txt('آنالیز · به تفکیک استراتژی', 400, -255, 36, th.cardInk, { align: 'right' });
  txt('وین‌ریت', -110, -170, 30, th.cardMut, { w: 800 }); txt('میانگین RR', -310, -170, 30, th.cardMut, { w: 800 });
  ['تارگت ثابت', 'حد ضرر متحرک', 'بستن نصف'].forEach((s, i) => { const y = -80 + i * 120, k = cub(k01(t, ws(103) + i * 0.12, 0.3)); if (k <= 0) return; cv.save(); cv.globalAlpha *= k;
    line(-420, y - 60, 420, y - 60, th.rule, 2); txt(s, 400, y, 40, th.cardInk, { align: 'right', w: 800 });
    const caret = Math.floor(t * 2.5) % 2 ? '_' : ' '; txt('؟' , -110, y, 46, LIME); txt('؟', -310, y, 46, LIME); cv.restore(); });
  const kb = cub(k01(t, ws(107), 0.4)); if (kb > 0) { const y = -80 + (Math.floor(t * 1.5) % 3) * 120; cv.save(); cv.globalAlpha *= 0.5 * kb; rrect(-430, y - 55, 860, 110, 24, null, LIME, 4); cv.restore(); }
  const kc = cub(k01(t, ws(108), 0.4)); if (kc > 0) txt('عددش رو تست خودت می‌گه', 0, 260, 38, LIME, { alpha: kc, w: 800 });
}

story({
  scenes: [
    { k: 'hook', bg: PAPER, wipe: 'none', tag: 'یه معامله‌ی واقعی', tone: AMB, art: 'hook', kpos: [CX, 1250, 0.8], groups: [{ at: 0, lines: [
      { y: 380, size: 108, c: INKP, toks: [['چرا', 0], ['همیشه', 1], ['درست', 2]] },
      { y: 520, size: 104, c: INKP, toks: [['بعد', 3], ['از', 4], ['اینکه', [5, 6]], ['می‌بندی،', 7]] },
      { y: 690, size: 120, c: INKP, toks: [['قیمت', 8], ['راه می‌افته؟', [9, 10], { hl: VIO, ht: WHITE }]] }] }] },
    { k: 'notyou', bg: INKD, wipe: 'right', tag: 'مشکل کجاست؟', tone: R, groups: [{ at: 11, lines: [
      { y: 760, size: 116, c: WHITE, toks: [['بازار', 11], ['تو', 12], ['رو', 13], ['نمی‌بینه؛', 14, { c: MD }]] },
      { y: 950, size: 110, c: WHITE, toks: [['مشکل', 15], ['از', 16], ['جاییه', 17], ['که', 18], ['می‌بندی.', 19, { c: LIME }]] }] }] },
    { k: 'pullback', bg: VIO, wipe: 'iris', tag: 'برگشت قبل از ادامه', tone: AMB, art: 'pull', groups: [{ at: 20, lines: [
      { y: 360, size: 96, c: WHITE, toks: [['خیلی', 20], ['وقت‌ها', 21], ['قبل', 22], ['از', 23]] },
      { y: 480, size: 104, c: LIME, toks: [['ادامه‌ی', 24], ['حرکت،', 25]] },
      { y: 600, size: 96, c: WHITE, toks: [['قیمت', 26], ['یه کم', 27], ['برمی‌گرده.', 28]] }] }] },
    { k: 'fear', bg: PAPER, wipe: 'left', tag: 'ترس', tone: R, art: 'fear', groups: [
      { at: 29, lines: [{ y: 360, size: 100, c: INKP, toks: [['و', 29], ['همون', 30], ['برگشت', 31], ['کوچیک،', 32]] }, { y: 490, size: 104, c: INKP, toks: [['ترس', 33, { c: R }], ['رو', 34], ['فعال', 35], ['می‌کنه:', 36]] }] },
      { at: 37, lines: [{ y: 380, size: 110, c: INKP, toks: [['سودم', 37], ['داره', 38], ['می‌ره…', 39]] }, { y: 540, size: 140, c: INKP, toks: [['ببندم.', 40, { hl: R, ht: WHITE }]] }] }] },
    { k: 'result', bg: INKD, wipe: 'down', tag: 'نتیجه', tone: R, art: 'bars', kpos: [CX, 1200, 0.85], groups: [{ at: 41, lines: [
      { y: 340, size: 96, c: MD, toks: [['نتیجه؟', 41]] },
      { y: 480, size: 130, c: R, toks: [['ضررها', 42], ['کامل،', 43]] },
      { y: 640, size: 130, c: LIME, toks: [['سودها', 44], ['نصفه.', 45]] }] }] },
    { k: 'rule', bg: LIME, wipe: 'iris', tag: 'راه‌حل', tone: MINT, groups: [{ at: 46, lines: [
      { y: 560, size: 110, c: INKD, toks: [['راه‌حل،', [46, 47]]] },
      { y: 720, size: 110, c: INKD, toks: [['دل', 48], ['و', 49], ['جرئت', 50], ['بیشتر', 51], ['نیست؛', 52]] },
      { y: 930, size: 160, c: INKD, toks: [['قانون', 53, { hl: INKD, ht: LIME }], ['خروجه.', 54]] }] }] },
    { k: 'plan', bg: PAPER, wipe: 'right', tag: 'قبل از ورود', tone: VIO, art: 'plan', kpos: [CX, 1180, 0.85], groups: [{ at: 55, lines: [
      { y: 340, size: 92, c: MP, toks: [['قبل', 55], ['از', 56], ['ورود،', 57]] },
      { y: 470, size: 104, c: INKP, toks: [['باید', 58], ['بدونی', 59], ['کجا', 60, { hl: VIO, ht: WHITE }], ['می‌بندی', 61]] },
      { y: 610, size: 110, c: INKP, toks: [['و', 62], ['چرا.', 63, { c: VIO }]] }] }] },
    { k: 'which', bg: INKD, wipe: 'up', tag: 'کدوم قانون؟', tone: SKY, art: 'options', kpos: [CX, 1150, 0.92], groups: [
      { at: 64, lines: [{ y: 400, size: 110, c: WHITE, toks: [['ولی', 64], ['کدوم', 65], ['قانون', 66, { c: LIME }], ['بهتره؟', 67]] }] },
      { at: 68, hideK: true, lines: [{ y: 400, size: 100, c: WHITE, toks: [['تارگت', 68], ['ثابت؟', 69], ['حد', 70], ['ضرر', 71], ['متحرک؟', 72], ['نصفش', 73], ['رو', 74], ['ببندی؟', 75]] }] }] },
    { k: 'test', bg: VIO, wipe: 'iris', tag: 'جواب', tone: LIME, groups: [{ at: 76, lines: [
      { y: 700, size: 110, c: WHITE, toks: [['جوابش', 76], ['رو', 77], ['فقط', 78]] },
      { y: 900, size: 220, c: LIME, toks: [['تست', 79]] },
      { y: 1100, size: 110, c: WHITE, toks: [['بهت', 80], ['می‌ده.', 81]] }] }] },
    { k: 'brand', bg: PAPER, wipe: 'right', art: 'brand', kpos: [CX, 1000, 1], mpos: [CX, 1000, 1], groups: [{ at: 82, lines: [{ y: 600, size: 90, c: MP, toks: [['توی', 82], ['بک‌تست‌لب،', [83, 84], { c: VIO }]] }] }] },
    { k: 'strat', bg: INKD, wipe: 'up', tag: 'هر قانون، یه استراتژی', tone: LIME, art: 'strats', kpos: [CX, 1120, 0.92], groups: [{ at: 85, lines: [
      { y: 350, size: 92, c: WHITE, toks: [['همون', 85], ['ستاپ', 86], ['رو', 87], ['با', 88], ['هر', 89]] },
      { y: 470, size: 110, c: LIME, toks: [['قانون', 90], ['خروج', 91]] },
      { y: 600, size: 92, c: WHITE, toks: [['یه', 92], ['استراتژی', 93], ['جدا', 94], ['تعریف', 95], ['می‌کنی.', 96]] }] }] },
    { k: 'analytics', bg: PAPER, wipe: 'left', tag: 'آنالیز', tone: VIO, art: 'compare', kpos: [CX, 1150, 0.9], groups: [{ at: 97, lines: [
      { y: 340, size: 90, c: INKP, toks: [['روی', 97], ['داده‌ی', 98], ['واقعی', 99], ['تست', 100], ['می‌کنی،', 101]] },
      { y: 460, size: 96, c: INKP, toks: [['و', 102], ['آنالیز', 103, { c: VIO }], ['نشون', 104], ['می‌ده', 105]] },
      { y: 590, size: 104, c: INKP, toks: [['کدوم', 106], ['بهتر', 107, { hl: VIO, ht: WHITE }], ['جواب', 108], ['داده.', 109]] }] }] },
    { k: 'end', bg: VIO, wipe: 'iris', art: 'end', kpos: [CX, 1000, 1], mpos: [CX, 1000, 1], groups: [] },
  ],
  art: {
    hook: hookArt, pull: pullArt, fear: fearArt, bars: barsArt, plan: planArt, options: optionsArt, strats: stratsArt, compare: compareArt,
    brand: (t, th) => brandArt(t, th, ws(83)),
    end: (t, th) => endArt(t, th, { t0: T.end, free: ws(110), link: ws(112) }),
  },
  shakes: [[ws(9) + 0.2, 10], [ws(40), 10], [ws(42), 8]],
  cover: () => {
    if (KIN) { cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H); } else stage(0);
    const ink = KIN ? INKP : WHITE;
    txt('چرا همیشه درست', CX, 380, 108, ink); txt('بعد از اینکه می‌بندی،', CX, 520, 104, ink);
    const s = 'قیمت راه می‌افته؟', size = 124, w = measure(s, size); cv.save(); cv.translate(CX, 700); cv.rotate(-0.025); rrect(-w / 2 - 36, -size * 0.62, w + 72, size * 1.22, 22, VIO); cv.restore(); txt(s, CX, 700, size, WHITE);
    at(CX, 1230, 0.8, 1, () => hookArt(ws(9) + 3, KIN ? THEME.paper : THEME.stage));
  },
});
