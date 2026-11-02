// v1 · the manifesto «ترید حرفه‌ای، از جایی شروع می‌شود که حدس زدن تمام می‌شود…», the default kinetic look (u-kit), on
// the user's voice. The drawn parts:
//   - a crosshair locking onto a candle («ترید حرفه‌ای»);
//   - a die crossed out («حدس زدن تمام می‌شود»);
//   - the brand («ما»);
//   - three tiles for «آزمایش، شبیه‌سازی و تحلیل»;
//   - a small «خودکار» tile beside the real manual screen;
//   - a card of prop rules («قوانین پراپ‌فرم‌ها»);
//   - four real screens that come together into one («یکپارچه»);
//   - Buy and Sell struck through («صرفاً معامله»);
//   - a checklist ticked («آماده شوید»).
// The real platform (dark theme):
//   - the replay with the drawing tools (launch);
//   - the Analytics header (f1);
//   - the dashboard (launch);
//   - the journal (launch);
//   - the four-chart layout (launch).
// The automated backtest and the prop-rule simulation have no screen in the platform yet, so they're drawn, not shown.
function card(x, y, w, h, fill, rule, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, fill); cv.restore(); if (rule) rrect(x, y, w, h, r, null, rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
const note = (s, y, col, a = 1) => txt(s, 0, y, 28, col, { w: 700, alpha: a });
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];
function crop(key, r, x, y, w) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im) return h; const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 16); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
function shot(key, r, x, y, w) { const h = (w * r[3]) / r[2]; cv.save(); cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 12, y - 12, w + 24, h + 24, 26, '#15121F'); cv.restore(); rrect(x - 12, y - 12, w + 24, h + 24, 26, null, 'rgba(255,255,255,0.1)', 2); crop(key, r, x, y, w); return h; }
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.7); cv.shadowBlur = 18;
  rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 14, null, col, 6); cv.restore(); }
function shadowed(fn, blur = 40, dy = 14, a = 0.25) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
// the screens (1440-wide crops)
const RT = [0, 90, 1190, 720], RA = [40, 300, 1120, 420], QA = [560, 340, 600, 66], RD = [0, 60, 1180, 700], RJ = [0, 60, 1180, 700], RL = [0, 60, 1180, 800], RR = [520, 200, 560, 620];
const DK = ['d02', 'd06', 'd10', 'd14', 'd18', 'd22', 'd26', 'd30', 'd34', 'd38'];

// ---- the line icons, drawn in a 120-unit box ----
function icon(kind, col, lw = 9) {
  cv.save(); cv.strokeStyle = col; cv.fillStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.lineJoin = 'round';
  if (kind === 'flask') { cv.beginPath(); cv.moveTo(-18, -50); cv.lineTo(-18, -10); cv.lineTo(-48, 46); cv.quadraticCurveTo(-52, 54, -42, 54); cv.lineTo(42, 54); cv.quadraticCurveTo(52, 54, 48, 46); cv.lineTo(18, -10); cv.lineTo(18, -50); cv.stroke(); line(-28, -50, 28, -50, col, lw); line(-32, 22, 32, 22, col, lw * 0.7); }
  if (kind === 'play') { cv.beginPath(); cv.arc(0, 0, 52, 0, Math.PI * 2); cv.stroke(); cv.beginPath(); cv.moveTo(-14, -26); cv.lineTo(26, 0); cv.lineTo(-14, 26); cv.closePath(); cv.fill(); }
  if (kind === 'chart') { cv.beginPath(); cv.moveTo(-50, -50); cv.lineTo(-50, 50); cv.lineTo(54, 50); cv.stroke(); cv.beginPath(); cv.moveTo(-34, 24); cv.lineTo(-8, -4); cv.lineTo(14, 14); cv.lineTo(46, -34); cv.stroke(); }
  if (kind === 'gear') { cv.beginPath(); for (let i = 0; i < 16; i++) { const a0 = (i / 16) * Math.PI * 2; cv.arc(0, 0, i % 2 ? 40 : 54, a0, a0 + Math.PI / 8); } cv.closePath(); cv.stroke(); cv.beginPath(); cv.arc(0, 0, 16, 0, Math.PI * 2); cv.stroke(); }
  if (kind === 'shield') { cv.beginPath(); cv.moveTo(0, -56); cv.quadraticCurveTo(26, -40, 50, -42); cv.lineTo(48, 4); cv.quadraticCurveTo(44, 38, 0, 58); cv.quadraticCurveTo(-44, 38, -48, 4); cv.lineTo(-50, -42); cv.quadraticCurveTo(-26, -40, 0, -56); cv.closePath(); cv.stroke();
    cv.beginPath(); cv.moveTo(-20, 2); cv.lineTo(-4, 18); cv.lineTo(24, -14); cv.stroke(); }
  cv.restore();
}
function iconTile(kind, label, col, bg, fg) { card(-150, -170, 300, 340, bg, 'rgba(26,20,48,0.08)', 40); at(0, -40, 1, 1, () => icon(kind, col)); txt(label, 0, 105, label.length > 6 ? 42 : 48, fg); }

// ---- «ترید حرفه‌ای»: a crosshair locks onto a candle ----
const CANDLES = [[0, 30, -20, 20], [20, 50, 10, 40], [40, 46, 4, 10], [10, 34, -10, 28], [28, 70, 22, 64], [64, 92, 56, 84]];
function hookArt(t, th) {
  const k = pop(t + 0.3, 12, 0.6); if (k <= 0) return;
  at(0, 0, cl(k, 0, 1.1), cl(k), () => {
    CANDLES.forEach(([o, h, l, c], i) => { const x = -300 + i * 120, Y = (p) => 140 - p * 3.4, col = c >= o ? G : R; line(x, Y(h), x, Y(l), col, 8); rrect(x - 34, Y(Math.max(o, c)), 68, Math.max(8, Math.abs(Y(o) - Y(c))), 8, col); });
    const lk = cub(k01(t, 0.1, Math.max(0.3, ws(1) + 0.3))), x = lerp(-120, 300, lk), y = lerp(-220, 140 - 74 * 3.4, lk), r = lerp(190, 90, lk), rot = (1 - lk) * 1.4;
    at(x, y, 1, 1, () => { cv.save(); cv.shadowColor = rgba(LIME, 0.7); cv.shadowBlur = 24 * lk; circle(0, 0, r, null, LIME, 7); [0, 1, 2, 3].forEach((q) => { const a = q * Math.PI / 2; line(Math.cos(a) * (r - 30), Math.sin(a) * (r - 30), Math.cos(a) * (r + 40), Math.sin(a) * (r + 40), LIME, 7); }); cv.restore(); circle(0, 0, 10, LIME); }, rot);
  });
}
// ---- «که حدس زدن تمام می‌شود»: the die, crossed ----
function guessArt(t, th) {
  const k = pop(t - T.guess - 0.05, 12, 0.6); if (k <= 0) return; const roll = t < ws(10);
  at(0, 0, cl(k, 0, 1.15), cl(k), () => {
    const face = roll ? 1 + Math.floor(rnd(Math.floor(t * 12)) * 6) : 5, P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    at(0, 0, 1, 1, () => { shadowed(() => rrect(-170, -170, 340, 340, 64, WHITE), 40, 14, 0.25); rrect(-170, -170, 340, 340, 64, null, 'rgba(26,20,48,0.1)', 3); P[face].forEach(([x, y]) => circle(x * 88, y * 88, 30, INKP)); }, roll ? Math.sin(t * 9) * 0.3 : 0.12);
    const kx = pop(t - ws(10) + 0.02, 15, 0.5); if (kx > 0) at(0, 0, lerp(1.6, 1, cl(kx)), cl(kx * 3), () => { line(-230, -230, 230, 230, R, 34); line(230, -230, -230, 230, R, 34); });
  });
}
// ---- «ما بستری جامع» ----
function weArt(t, th) { brandArt(t, th, ws(14)); }
// ---- «برای آزمایش، شبیه‌سازی و تحلیل» ----
function threeArt(t, th) {
  [['flask', 'آزمایش', 17], ['play', 'شبیه‌سازی', 18], ['chart', 'تحلیل', 20]].forEach(([k, s, wi], i) => popIn(t, ws(wi), () => iconTile(k, s, VIO, WHITE, INKP), 330 - i * 330, 0, 0.55, (i - 1) * -0.04));
}
// ---- «از بک‌تست دستی و خودکار» (launch: the replay with the drawing tools) ----
function manualArt(t, th) {
  const k = pop(t - T.manual - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => { const w = 900, x = -450, y = -330, h = shot('tools', RT, x, y, w); popIn(t, ws(29), () => chip('بک‌تست دستی، روی چارت', 0, 0, 34, INKD, LIME), 120, y + h + 70); note('صفحه‌ی واقعی بک‌تست‌لب · ابزار رسم روی بازپخش', y + h + 150, MD); });
  popIn(t, ws(31), () => { shadowed(() => rrect(-120, -120, 240, 240, 44, VIO), 40, 14, 0.4); at(0, -18, 0.95, 1, () => icon('gear', WHITE, 9)); txt('خودکار', 0, 78, 40, WHITE); }, -300, -380, 0.5, 0.06);
}
// ---- «تا ارزیابی سیستم‌های معاملاتی» (f1: the Analytics header) ----
function evalsArt(t, th) {
  const k = pop(t - T.evals - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => { const w = 920, x = -460, y = -220, h = shot('an', RA, x, y, w); ringIn(RA, QA, x, y, w, cub(k01(t, ws(34), 0.35)), VIO); note('صفحه‌ی واقعی بک‌تست‌لب · آنالیز', y + h + 60, '#3E4D12'); });
}
// ---- «و شبیه‌سازی قوانین پراپ‌فرم‌ها» (drawn) ----
function propArt(t, th) {
  const k = pop(t - T.prop - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    card(-410, -300, 820, 600, WHITE, 'rgba(26,20,48,0.08)', 40);
    at(300, -200, 0.9, 1, () => icon('shield', VIO, 9)); txt('قوانین چالش', 180, -200, 48, INKP, { align: 'right' });
    line(380, -120, -380, -120, 'rgba(26,20,48,0.08)', 2);
    [['حد ضرر روزانه', 39], ['حداکثر افت', 40], ['هدف سود', 42]].forEach(([s, wi], i) => { const y = -30 + i * 110, kr = pop(t - ws(wi) + 0.05, 13, 0.6); if (kr <= 0) return;
      at(0, y, 1, cl(kr), () => { circle(360, 0, 10, VIO); txt(s, 330, 3, 44, INKP, { align: 'right' }); rrect(-320, -20, 200, 40, 20, '#ECE7FA'); check(-350, 0, 32, G, pop(t - ws(wi) - 0.25, 14, 0.5)); }); });
  });
}
// ---- «تمام ابزارهای موردنیاز برای سنجش عملکرد و تصمیم‌گیری آگاهانه» (launch: the dashboard) ----
function toolsArt(t, th) {
  const k = pop(t - T.tools - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => { const w = 920, x = -460, y = -330, h = shot('dash', RD, x, y, w);
    popIn(t, ws(48), () => chip('سنجش عملکرد', 0, 0, 38, WHITE, VIO), 200, y + h + 70, 0.55, -0.03);
    popIn(t, ws(52), () => chip('تصمیم‌گیری آگاهانه', 0, 0, 38, INKD, LIME), -180, y + h + 70, 0.55, 0.03);
    note('صفحه‌ی واقعی بک‌تست‌لب · داشبورد', y + h + 160, MP); });
}
// ---- «در یک محیط حرفه‌ای و یکپارچه»: four real screens come together ----
const FOUR = [['d', RR, 230, -300], ['an', RA, -230, -300], ['jour', RJ, 230, 60], ['dash', RD, -230, 60]];
function oneArt(t, th) {
  const kc = cub(k01(t, ws(59) - 0.15, 0.5));
  FOUR.forEach(([key, r, x, y], i) => { const k = pop(t - ws(54) - i * 0.1, 12, 0.6); if (k <= 0 || kc >= 1) return; const w = 400, h = (w * r[3]) / r[2], kk = key === 'd' ? FLIP(t, T.one, T.not_, DK) : key;
    at(lerp(x, 0, kc), lerp(y, -60, kc), lerp(1, 0.5, kc) * cl(k, 0, 1.1), cl(k) * (1 - kc), () => shot(kk, r, -w / 2, -Math.min(h, 300) / 2, w)); });
  const kb = pop(t - ws(59) + 0.1, 11, 0.6);
  if (kb > 0) at(0, -40, cl(kb, 0, 1.08), cl(kb), () => { const w = 960, x = -480, h = (w * RL[3]) / RL[2]; cv.save(); cv.shadowColor = rgba(LIME, 0.5); cv.shadowBlur = 60; rrect(x - 14, -h / 2 - 14, w + 28, h + 28, 28, '#15121F'); cv.restore(); crop('lay4', RL, x, -h / 2, w); note('صفحه‌ی واقعی بک‌تست‌لب · چهار چارت کنار هم', h / 2 + 60, MD); });
}
// ---- «اینجا قرار نیست صرفاً معامله کنید» ----
function notArt(t, th) {
  const k = pop(t - T.not_ - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, cl(k, 0, 1.1), cl(k), () => {
    shadowed(() => rrect(-400, -110, 380, 220, 50, G), 40, 14, 0.3); txt('خرید', -210, 6, 80, WHITE);
    shadowed(() => rrect(20, -110, 380, 220, 50, INKD), 40, 14, 0.3); txt('فروش', 210, 6, 80, WHITE);
    const ks = cub(k01(t, ws(64), 0.4)); if (ks > 0) line(440, -10, 440 - 880 * ks, 10, WHITE, 18);
  });
}
// ---- «قرار است پیش از معامله، آماده شوید»: a checklist ticked ----
function readyArt(t, th) {
  const k = pop(t - T.ready - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    card(-420, -270, 840, 540, INKD, null, 40);
    txt('قبل از معامله', 360, -190, 44, LIME, { align: 'right' }); line(380, -130, -380, -130, 'rgba(255,255,255,0.1)', 2);
    [['استراتژی تست‌شده', 69], ['عملکرد سنجیده‌شده', 71], ['تصمیم آگاهانه', 72]].forEach(([s, wi], i) => { const y = -50 + i * 110, kr = pop(t - ws(wi) + 0.05, 13, 0.6); if (kr <= 0) return;
      at(0, y, 1, cl(kr), () => { txt(s, 340, 3, 46, WHITE, { align: 'right' }); check(-340, 0, 36, G, pop(t - ws(wi) - 0.2, 14, 0.5)); }); });
  });
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1230, 1], groups: [
      { at: 0, lines: [L_(400, 170, WHITE, [['ترید', 0], ['حرفه‌ای', 1, { c: LIME }]])] },
      { at: 2, lines: [L_(320, 110, WHITE, [['از', 2], ['جایی', 3]]), L_(460, 120, WHITE, [['شروع', 4], ['می‌شود', [5, 6]]])] }] },
    { k: 'guess', bg: PAPER, wipe: 'up', art: 'guess', kpos: [CX, 1240, 1], groups: [
      { at: 7, lines: [L_(300, 120, INKP, [['که', 7], ['حدس', 8, { c: R }], ['زدن', 9]]), L_(460, 140, INKP, [['تمام', 10, { hl: VIO, ht: WHITE }], ['می‌شود.', [11, 12]]])] }] },
    { k: 'we', bg: VIO, wipe: 'iris', art: 'we', kpos: [CX, 1150, 1], groups: [
      { at: 13, lines: [L_(340, 130, WHITE, [['ما', 13], ['بستری', 14], ['جامع', 15, { hl: LIME, ht: INKD }]])] }] },
    { k: 'three', bg: PAPER, wipe: 'right', art: 'three', kpos: [CX, 1300, 1], groups: [
      { at: 16, lines: [L_(240, 96, INKP, [['برای', 16]]), L_(370, 104, INKP, [['آزمایش،', 17, { c: VIO }], ['شبیه‌سازی', 18, { c: VIO }], ['و', 19], ['تحلیل', 20, { c: VIO }]]), L_(500, 96, INKP, [['استراتژی‌های', [21, 22]], ['معاملاتی', 23]]), L_(620, 96, INKP, [['فراهم', 24], ['کرده‌ایم.', [25, 26]]])] }] },
    { k: 'manual', bg: INKD, wipe: 'up', art: 'manual', kpos: [CX, 1300, 1], groups: [
      { at: 27, lines: [L_(250, 104, WHITE, [['از', 27], ['بک‌تست', 28, { c: LIME }], ['دستی', 29, { hl: LIME, ht: INKD }]]), L_(380, 110, WHITE, [['و', 30], ['خودکار', 31, { c: LIME }]])] }] },
    { k: 'evals', bg: LIME, wipe: 'iris', art: 'evals', kpos: [CX, 1240, 1], groups: [
      { at: 32, lines: [L_(290, 120, INKD, [['تا', 32], ['ارزیابی', 33, { hl: INKD, ht: LIME }]]), L_(440, 110, INKD, [['سیستم‌های', [34, 35]], ['معاملاتی', 36]])] }] },
    { k: 'prop', bg: VIO, wipe: 'right', art: 'prop', kpos: [CX, 1280, 1], groups: [
      { at: 37, lines: [L_(260, 104, WHITE, [['و', 37], ['شبیه‌سازی', 38]]), L_(400, 110, WHITE, [['قوانین', 39, { c: LIME }], ['پراپ‌فرم‌ها؛', [40, 42], { hl: LIME, ht: INKD }]])] }] },
    { k: 'tools', bg: PAPER, wipe: 'up', art: 'tools', kpos: [CX, 1330, 1], groups: [
      { at: 43, lines: [L_(240, 92, INKP, [['تمام', 43], ['ابزارهای', 44], ['موردنیاز', [45, 46]]]), L_(360, 96, INKP, [['برای', 47], ['سنجش', 48, { c: VIO }], ['عملکرد', [49, 50], { c: VIO }]]), L_(485, 96, INKP, [['و', 51], ['تصمیم‌گیری', 52, { hl: VIO, ht: WHITE }], ['آگاهانه،', 53]])] }] },
    { k: 'one', bg: INKD, wipe: 'iris', art: 'one', kpos: [CX, 1280, 1], groups: [
      { at: 54, lines: [L_(270, 110, WHITE, [['در', 54], ['یک', 55, { c: LIME }], ['محیط', 56]]), L_(410, 120, WHITE, [['حرفه‌ای', 57], ['و', 58], ['یکپارچه.', [59, 60], { hl: LIME, ht: INKD }]])] }] },
    { k: 'not_', bg: R, wipe: 'cut', art: 'not', kpos: [CX, 1250, 1], groups: [
      { at: 61, lines: [L_(280, 110, WHITE, [['اینجا', 61]]), L_(420, 120, WHITE, [['قرار', 62], ['نیست', 63, { hl: INKD, ht: WHITE }]]), L_(560, 110, WHITE, [['صرفاً', 64], ['معامله', 65], ['کنید؛', 66]])] }] },
    { k: 'ready', bg: LIME, wipe: 'iris', art: 'ready', kpos: [CX, 1300, 1], groups: [
      { at: 67, lines: [L_(250, 104, INKD, [['قرار', 67], ['است', 68]]), L_(380, 110, INKD, [['پیش', 69], ['از', 70], ['معامله،', 71]]), L_(530, 150, INKD, [['آماده', 72, { hl: VIO, ht: WHITE }], ['شوید.', 73]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, guess: guessArt, we: weArt, three: threeArt, manual: manualArt, evals: evalsArt, prop: propArt, tools: toolsArt, one: oneArt, not: notArt, ready: readyArt, end: endArtK },
  shakes: [[ws(10), 10], [ws(59), 10], [ws(72), 8]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('ترید', CX, 420, 170, WHITE); txt('حرفه‌ای', CX, 610, 190, LIME);
    txt('از جایی شروع می‌شود که', CX, 800, 70, WHITE, { w: 800 });
    { const s = 'حدس زدن', size = 120, w = measure(s, size); txt(s, CX, 950, size, MD); line(CX + w / 2 + 20, 950, CX - w / 2 - 20, 950, R, 16); }
    txt('تمام می‌شود.', CX, 1110, 110, WHITE);
    if (IMG.icon) { cv.save(); cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = 60; cv.drawImage(IMG.icon, CX - 110, 1300, 220, 220); cv.restore(); }
  },
});
