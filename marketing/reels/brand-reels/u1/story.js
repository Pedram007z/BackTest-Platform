// u1 · «اگه سکه بندازی و ترید کنی، بعد از هزار معامله چی می‌شه؟», the coin-flip test on real gold (data.py):
// 1,000 random entries, a coin for the side, $3 stop and target; with no costs it ends about even (502 wins, +4R), with
// a 0.30 spread and $7 a lot commission 452 wins and −119R, and a $10,000 account at $100 a trade is gone at trade 743.
// Symbols: a flipping coin, the real gold minutes it trades on, a playhead that jumps to random moments, the $3 bracket,
// the no-cost curve hugging zero, the costs, both curves, the account draining to $0, the session's cost settings.
const SIM = D.sim, SAMPLE = SIM.sample;
const FREE = SIM.free, COST = SIM.cost;
const pct = (w) => fa((w / SIM.n * 100).toFixed(1)).replace('.', '٫');

// a coin: «خرید» (an up arrow) on one face, «فروش» on the other; it spins while flip > 0 and lands on side
function coin(t, x, y, r, spin, side) {
  const ang = spin, face = Math.cos(ang) >= 0 ? side : -side, sx = Math.max(0.06, Math.abs(Math.cos(ang)));
  at(x, y, 1, 1, () => { cv.scale(sx, 1);
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 40; cv.shadowOffsetY = 18;
    const g = cv.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r); g.addColorStop(0, '#FFE9A8'); g.addColorStop(0.55, AMB); g.addColorStop(1, '#D9891A'); circle(0, 0, r, g); cv.restore();
    circle(0, 0, r * 0.82, null, 'rgba(122,74,0,0.35)', r * 0.04);
    const c = face > 0 ? G : R; cv.fillStyle = c; cv.beginPath();
    if (face > 0) { cv.moveTo(0, -r * 0.5); cv.lineTo(r * 0.38, -r * 0.05); cv.lineTo(r * 0.14, -r * 0.05); cv.lineTo(r * 0.14, r * 0.42); cv.lineTo(-r * 0.14, r * 0.42); cv.lineTo(-r * 0.14, -r * 0.05); cv.lineTo(-r * 0.38, -r * 0.05); }
    else { cv.moveTo(0, r * 0.5); cv.lineTo(r * 0.38, r * 0.05); cv.lineTo(r * 0.14, r * 0.05); cv.lineTo(r * 0.14, -r * 0.42); cv.lineTo(-r * 0.14, -r * 0.42); cv.lineTo(-r * 0.14, r * 0.05); cv.lineTo(-r * 0.38, r * 0.05); }
    cv.closePath(); cv.fill();
  });
  return face;
}
function hookArt(t, th) {
  const land = ws(10), sl = 9 * land, tgt = Math.ceil(sl / Math.PI) * Math.PI, spin = t < land ? t * 9 : lerp(sl, tgt, cub(k01(t, land, 0.35)));
  const bob = t < land ? Math.sin(t * 3) * 20 : 0;
  const face = coin(t, 0, -20 + bob, 170, spin, 1);
  const k = cub(k01(t, land, 0.3)); if (k > 0) at(0, 250, 1, k, () => chip(face > 0 ? 'خرید' : 'فروش', 0, 0, 48, WHITE, face > 0 ? G : R));
}
// the real gold minutes behind the test (the first entry's 5-minute candles)
function sampleChart(t, th, n, o = {}) {
  rrect(-450, -330, 900, 600, 40, th.card, th.rule, 2);
  const m = candleChart(SAMPLE.bars, n, [-410, -270, 410, 200], {});
  txt(`طلا · ۵ دقیقه · ${fa(SAMPLE.date.slice(0, 10))} · داده‌ی واقعی`, 0, 235, 30, th.cardMut, { w: 700 });
  return m;
}
function testArt(t, th) { const n = Math.min(SAMPLE.bars.length, Math.floor((t - T.test - 0.2) / 0.05) + 1); sampleChart(t, th, Math.max(0, n)); }
// «یه لحظه‌ی تصادفی، با شیر یا خط»: a playhead jumps to random moments, the coin picks a side each time
function randArt(t, th) {
  const m = sampleChart(t, th, SAMPLE.bars.length);
  const k = Math.floor((t - T.rand) / 0.42); if (k < 0) return;
  const i = Math.floor(rnd(k + 3) * (SAMPLE.bars.length - 4)) + 2, side = rnd(k + 17) < 0.5 ? 1 : -1, d = (t - T.rand) % 0.42;
  const x = m.X(i); line(x, -280, x, 210, th.ink, 4, [10, 8]);
  at(x, -300, cl(pop(d, 18, 0.5), 0, 1.2), 1, () => chip(side > 0 ? 'خرید' : 'فروش', 0, 0, 34, WHITE, side > 0 ? G : R));
  at(380, 300, 1, 1, () => chip(`ورود ${fa(Math.min(1000, 1 + k * 137))}`, 0, 0, 30, th.ink, th.soft));
}
// the bracket: $3 above and below the entry, and the first trade replayed into it
function ruleArt(t, th) {
  const n = Math.min(SAMPLE.bars.length, SAMPLE.at + 1 + Math.max(0, Math.floor((t - ws(38)) / 0.12)));
  const m = sampleChart(t, th, n), E = SAMPLE.entry, s = SAMPLE.side, xe = m.X(SAMPLE.at);
  const kb = cub(k01(t, ws(33), 0.4)); if (kb <= 0) return;
  const yT = m.Y(E + s * 3), yS = m.Y(E - s * 3), yE = m.Y(E);
  cv.save(); cv.globalAlpha *= kb;
  rrect(xe, Math.min(yE, yT), 410 - xe, Math.abs(yT - yE), 0, rgba(G, 0.14)); rrect(xe, Math.min(yE, yS), 410 - xe, Math.abs(yS - yE), 0, rgba(R, 0.14));
  line(xe, yT, 410, yT, G, 4); line(xe, yS, 410, yS, R, 4); line(xe, yE, 410, yE, th.cardInk, 3, [10, 8]);
  chip('حد سود ۳ دلار', -250, yT, 30, WHITE, G); chip('حد ضرر ۳ دلار', -250, yS, 30, WHITE, R);
  cv.restore();
  if (n >= SAMPLE.bars.length - 6) { const q = pop(t - ws(38) - 0.12 * (SAMPLE.bars.length - 6 - SAMPLE.at), 14, 0.55); if (q > 0) at(250, SAMPLE.won === (s > 0) ? yT - 60 : yS + 60, cl(q, 0, 1.2), cl(q), () => chip(SAMPLE.won ? 'سود: +۱R' : 'ضرر: −۱R', 0, 0, 34, WHITE, SAMPLE.won ? G : R)); }
}
// the equity curve(s), in R, over the 1,000 trades
function curves(t, th, which, t0, d) {
  rrect(-450, -340, 900, 640, 40, th.card, th.rule, 2);
  const lo = -170, hi = 60, Y = (v) => 180 - ((v - lo) / (hi - lo)) * 440, X = (i) => -400 + (i / 199) * 800;
  line(-400, Y(0), 400, Y(0), th.rule, 3, [10, 10]); txt('۰', 425, Y(0), 28, th.cardMut, { w: 700 });
  txt('معامله‌ها →', 330, 225, 28, th.cardMut, { w: 700 }); txt(fa(1000), 400, 255, 26, th.cardMut, { w: 700 }); txt(fa(1), -400, 255, 26, th.cardMut, { w: 700 });
  const k = cub(k01(t, t0, d)), n = Math.max(1, Math.round(k * 199));
  which.forEach(([cur, col, dash]) => { cv.save(); cv.strokeStyle = col; cv.lineWidth = 7; cv.lineJoin = 'round'; if (dash) cv.setLineDash(dash); cv.beginPath();
    for (let i = 0; i <= n; i++) { const x = X(i), y = Y(cur.curve[i]); i ? cv.lineTo(x, y) : cv.moveTo(x, y); } cv.stroke(); cv.restore();
    circle(X(n), Y(cur.curve[n]), 11, col); });
  return { k, X, Y, n };
}
function freeArt(t, th) {
  const c = curves(t, th, [[FREE, MINT]], T.free + 0.1, ws(48) - T.free);
  if (c.k > 0.98) { at(250, c.Y(FREE.R) - 70, 1, 1, () => chip(`${fa(FREE.R > 0 ? '+' + FREE.R : FREE.R)}R`.replace('+', '+'), 0, 0, 40, INKD, MINT));
    at(-250, -280, 1, 1, () => chip(`${fa(FREE.wins)} برد از ${fa(1000)} · ${pct(FREE.wins)}٪`, 0, 0, 34, th.cardInk, th.soft)); }
}
// the costs: two tags drop onto the trade
function costsArt(t, th) {
  [['اسپرد ۰٫۳۰ دلار', ws(52), -200], ['کمیسیون ۷ دلار هر لات', ws(54), 200]].forEach(([s, st, y]) => {
    const k = pop(t - st, 14, 0.5); if (k <= 0) return;
    at(0, y * 0.6 + 60, lerp(1.6, 1, cl(k)), cl(k), () => { rrect(-330, -70, 660, 140, 32, INKD); txt(s, 0, 4, 52, LIME); }, (y > 0 ? 1 : -1) * 0.03);
  });
}
function resultArt(t, th) {
  const c = curves(t, th, [[FREE, rgba(MINT, 0.55), [12, 10]], [COST, R]], T.result + 0.1, ws(72) - T.result);
  const kw = cub(k01(t, ws(64), 0.3)); if (kw > 0) at(-230, -280, 1, kw, () => chip(`${fa(COST.wins)} برد از ${fa(1000)} · ${pct(COST.wins)}٪`, 0, 0, 34, th.cardInk, th.soft));
  if (c.k > 0.98) { at(300, c.Y(COST.R) - 60, 1, 1, () => chip(`${fa(Math.round(COST.R))}R`.replace('-', '−'), 0, 0, 44, WHITE, R)); at(300, c.Y(FREE.R) - 60, 1, 1, () => chip('بدون هزینه', 0, 0, 28, INKD, MINT)); }
}
// the account: $10,000, $100 a trade; it meets zero at trade SIM.zero
function accountArt(t, th) {
  rrect(-450, -330, 900, 620, 40, th.card, th.rule, 2);
  const k = cub(k01(t, ws(81), ws(90) - ws(81))), z = SIM.zero ?? 1000, trade = Math.round(k * z), cur = trade > 0 ? COST.full[trade - 1] : 0;
  const bal = trade >= z ? 0 : Math.max(0, 10000 + 100 * cur);
  txt('موجودی', 380, -260, 36, th.cardMut, { align: 'right', w: 800 }); chip('ریسک هر معامله: ۱۰۰ دلار', -240, -260, 30, th.cardInk, th.soft);
  txt(`${money(bal)} دلار`, 0, -150, 104, bal <= 0 ? R : th.cardInk);
  rrect(-390, -40, 780, 54, 27, th.soft); rrect(-390, -40, 780 * cl(bal / 10000), 54, 27, bal / 10000 > 0.35 ? G : bal > 0 ? AMB : R);
  txt(`معامله‌ی ${fa(Math.max(1, trade))}`, 0, 80, 46, th.cardMut, { w: 800 });
  const st = pop(t - ws(90) - 0.05, 14, 0.5); if (st > 0) at(0, 190, lerp(1.8, 1, cl(st)), cl(st), () => { rrect(-300, -62, 600, 124, 22, rgba(R, 0.1), R, 9); txt(`صفر · معامله‌ی ${fa(z)}`, 0, 5, 56, R); }, -0.05);
}
// the session's costs, set per symbol
function settingsArt(t, th) {
  rrect(-430, -300, 860, 600, 40, th.card, th.rule, 2);
  txt('جلسه‌ی بک‌تست', 390, -240, 40, th.cardInk, { align: 'right' });
  const rows = [['نماد', 'XAUUSD', ws(121)], ['اسپرد', '۰٫۳۰', ws(118) + 0.1], ['کمیسیون هر لات', '۷ دلار', ws(120)]];
  rows.forEach(([a, b, st], i) => { const y = -120 + i * 120, k = cub(k01(t, st, 0.3));
    txt(a, 390, y, 40, th.cardMut, { align: 'right', w: 800 }); rrect(-390, y - 40, 420, 80, 20, th.soft, k > 0 ? (i ? LIME : th.rule) : th.rule, 3);
    if (k > 0) { const typed = b.slice(0, Math.ceil(b.length * k)); txt(typed, -360, y + 2, 40, th.cardInk, { align: 'left', dir: 'ltr' }); } });
  const kr = pop(t - ws(129), 14, 0.55); if (kr > 0) at(0, 230, cl(kr, 0, 1.2), cl(kr), () => chip('نتیجه، با هزینه‌ی واقعی', 0, 0, 38, INKD, LIME));
}

story({
  scenes: [
    { k: 'hook', bg: PAPER, wipe: 'none', tag: 'آزمایش سکه', tone: AMB, art: 'hook', kpos: [CX, 1270, 0.8], groups: [{ at: 0, lines: [
      { y: 400, size: 116, c: INKP, toks: [['اگه', 0], ['سکه', 1, { hl: AMB, ht: INKD }], ['بندازی', [2, 3]]] },
      { y: 550, size: 108, c: INKP, toks: [['و', 4], ['ترید', 5], ['کنی،', 6]] },
      { y: 720, size: 116, c: INKP, toks: [['بعد', 7], ['از', 8], ['هزار', 9, { hl: VIO, ht: WHITE }], ['معامله', 10]] },
      { y: 880, size: 130, c: INKP, toks: [['چی', 11], ['می‌شه؟', [12, 13]]] }] }] },
    { k: 'test', bg: INKD, wipe: 'right', tag: 'داده‌ی واقعی طلا', tone: AMB, art: 'test', groups: [{ at: 14, lines: [
      { y: 400, size: 104, c: WHITE, toks: [['بیا', 14], ['روی', 15], ['داده‌ی', 16, { c: LIME }], ['واقعی', 17, { c: LIME }], ['طلا', 18, { c: AMB }]] },
      { y: 540, size: 110, c: WHITE, toks: [['تستش', 19], ['کنیم.', 20]] }] }] },
    { k: 'rand', bg: VIO, wipe: 'iris', tag: 'هزار ورود تصادفی', tone: VIO, art: 'rand', groups: [
      { at: 21, lines: [{ y: 380, size: 130, c: LIME, toks: [['هزار', 21], ['بار،', 22]] }, { y: 530, size: 100, c: WHITE, toks: [['یه', 23], ['لحظه‌ی', 24], ['تصادفی؛', 25]] }] },
      { at: 26, lines: [{ y: 380, size: 104, c: WHITE, toks: [['با', 26], ['شیر', 27, { c: LIME }], ['یا', 28], ['خط،', 29, { c: LIME }]] }, { y: 520, size: 104, c: WHITE, toks: [['خرید', 30], ['یا', 31], ['فروش.', 32]] }] }] },
    { k: 'rule', bg: PAPER, wipe: 'left', tag: 'قانون معامله', tone: SKY, art: 'rule', groups: [{ at: 33, lines: [
      { y: 400, size: 104, c: INKP, toks: [['حد', 33, { c: R }], ['ضرر', 34, { c: R }], ['و', 35], ['حد', 36, { c: G }], ['سود،', 37, { c: G }]] },
      { y: 550, size: 110, c: INKP, toks: [['هر', 38], ['دو', 39], ['سه دلار.', [40, 41], { hl: VIO, ht: WHITE }]] }] }] },
    { k: 'free', bg: INKD, wipe: 'up', tag: 'بدون هزینه', tone: MINT, art: 'free', groups: [
      { at: 42, lines: [{ y: 360, size: 96, c: MD, toks: [['بدون', 42], ['هزینه،', 43]] }, { y: 500, size: 104, c: WHITE, toks: [['نتیجه', 44], ['تقریباً', 45], ['صفر', 46, { c: LIME }], ['به', 47, { c: LIME }], ['صفره؛', 48, { c: LIME }]] }] },
      { at: 49, lines: [{ y: 440, size: 160, c: LIME, toks: [['پنجاه،', 49], ['پنجاه.', 50]] }] }] },
    { k: 'costs', bg: LIME, wipe: 'iris', tag: 'هزینه‌ها', tone: R, art: 'costs', kpos: [CX, 1180, 0.95], groups: [{ at: 51, lines: [
      { y: 560, size: 120, c: INKD, toks: [['ولی', 51], ['اسپرد', 52], ['و', 53], ['کمیسیون', 54]] },
      { y: 730, size: 120, c: INKD, toks: [['رو', 54], ['که', 55], ['اضافه', 56], ['کنی…', 57]] }] }] },
    { k: 'result', bg: INKD, wipe: 'down', tag: 'با هزینه', tone: R, art: 'result', groups: [
      { at: 58, lines: [{ y: 370, size: 96, c: WHITE, toks: [['وین‌ریت', [58, 59]], ['می‌رسه', [60, 61]], ['به', 62]] }, { y: 520, size: 130, c: LIME, toks: [['حدود', 63], ['۴۵', 64], ['درصد،', 65]] }] },
      { at: 66, lines: [{ y: 370, size: 96, c: WHITE, toks: [['و', 66], ['نتیجه', 67], ['می‌شه', [68, 69]]] }, { y: 520, size: 130, c: R, toks: [['حدود', 70], ['منفی', 71], ['۱۲۰', 72], ['R', 73]] }] }] },
    { k: 'account', bg: PAPER, wipe: 'right', tag: 'حساب ۱۰ هزار دلاری', tone: R, art: 'account', groups: [
      { at: 74, lines: [{ y: 360, size: 100, c: INKP, toks: [['با', 74], ['ریسک', 75], ['۱۰۰', 76], ['دلار', 77]] }, { y: 490, size: 100, c: INKP, toks: [['روی', 78], ['هر', 79], ['معامله،', 80]] }] },
      { at: 81, lines: [{ y: 340, size: 92, c: INKP, toks: [['یه', 81], ['حساب', 82], ['۱۰', 83], ['هزار', 84], ['دلاری', 85]] }, { y: 460, size: 92, c: INKP, toks: [['قبل', 86], ['از', 87], ['معامله‌ی', 88], ['هزارم', 89]] },
        { y: 590, size: 120, c: INKP, toks: [['صفر شده.', [90, 91], { hl: R, ht: WHITE }]] }] }] },
    { k: 'edge', bg: VIO, wipe: 'iris', tag: 'برتری', tone: AMB, groups: [
      { at: 92, lines: [{ y: 600, size: 110, c: WHITE, toks: [['پس', 92], ['ترید', 93], ['بدون', 94, { c: LIME }], ['برتری،', 95, { c: LIME }]] }, { y: 760, size: 110, c: WHITE, toks: [['حتی', 96], ['شانسی', 97], ['هم', 98], ['نیست؛', 99]] }] },
      { at: 100, lines: [{ y: 700, size: 170, c: LIME, toks: [['آروم', 100], ['آروم', 101]] }, { y: 920, size: 120, c: WHITE, toks: [['حسابت‌رو', 102], ['می‌خوره.', [103, 104]]] }] }] },
    { k: 'question', bg: PAPER, wipe: 'left', tag: 'سؤال درست', tone: VIO, groups: [{ at: 105, lines: [
      { y: 460, size: 110, c: VIO, toks: [['سؤال', 105], ['اینه:', 106]] },
      { y: 650, size: 140, c: INKP, toks: [['استراتژی', 107], ['تو', 108]] },
      { y: 830, size: 110, c: INKP, toks: [['بعد', 109], ['از', 110], ['هزینه‌ها', [111, 112]]] },
      { y: 1010, size: 150, c: INKP, toks: [['برتری', 113, { hl: VIO, ht: WHITE }], ['داره؟', 114]] }] }] },
    { k: 'brand', bg: PAPER, wipe: 'right', art: 'brand', kpos: [CX, 1000, 1], mpos: [CX, 1000, 1], groups: [{ at: 115, lines: [{ y: 600, size: 90, c: MP, toks: [['توی', 115], ['بک‌تست‌لب،', [116, 117], { c: VIO }]] }] }] },
    { k: 'costsui', bg: INKD, wipe: 'up', tag: 'تنظیمات جلسه', tone: MINT, art: 'settings', groups: [
      { at: 118, lines: [{ y: 360, size: 92, c: WHITE, toks: [['اسپرد', 118], ['و', 119], ['کمیسیون', 120], ['هر', 121], ['نماد', 122], ['رو', 123]] }, { y: 490, size: 104, c: WHITE, toks: [['خودت', 124, { c: LIME }], ['تعیین', 125], ['می‌کنی،', [126, 127]]] }] },
      { at: 128, lines: [{ y: 360, size: 92, c: WHITE, toks: [['و', 128], ['نتیجه', 129], ['رو', 130], ['با', 131]] }, { y: 500, size: 110, c: LIME, toks: [['هزینه‌ی', 132], ['واقعی', 133], ['می‌بینی.', [134, 135]]] }] }] },
    { k: 'end', bg: VIO, wipe: 'iris', art: 'end', kpos: [CX, 1000, 1], mpos: [CX, 1000, 1], groups: [] },
  ],
  art: {
    hook: hookArt, test: testArt, rand: randArt, rule: ruleArt, free: freeArt, costs: costsArt, result: resultArt, account: accountArt, settings: settingsArt,
    brand: (t, th) => brandArt(t, th, ws(116)),
    end: (t, th) => endArt(t, th, { t0: T.end, free: ws(136), link: ws(138) }),
  },
  shakes: [[ws(54), 8], [ws(72), 10], [ws(90), 12]],
  cover: () => {
    if (KIN) { cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H); } else stage(0);
    const ink = KIN ? INKP : WHITE;
    txt('اگه سکه بندازی', CX, 400, 116, ink); txt('و ترید کنی…', CX, 550, 108, ink);
    const s = 'هزار معامله', size = 150, w = measure(s, size); cv.save(); cv.translate(CX, 760); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, VIO); cv.restore(); txt(s, CX, 760, size, WHITE);
    txt('بعد چی می‌شه؟', CX, 960, 120, ink);
    coin(0, CX, 1290, 190, 0.5, 1);
    rrect(CX - 330, 1560, 660, 100, 50, KIN ? INKD : VIO); txt('تست واقعی روی داده‌ی طلا', CX, 1612, 48, WHITE);
  },
});
