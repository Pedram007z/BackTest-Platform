// k18 · «به استراتژیت اعتماد داری یا از بررسی کردنش می‌ترسی؟», the default kinetic look (u-kit), on k16's cut of the
// user's voice (×1.15, 27.3 s), in the language of the reels past 10k views (k1, q2): full-bleed colour blocks that wipe
// on the beat, huge words landing as they are spoken, one bold symbol per idea, the brand only at the end.
//   - the hook: a balance that tips from «اعتماد» to «ترس» (on screen from the first frame);
//   - «بیا ببینیم…»: a magnifier sweeping over question marks;
//   - «سه تا جواب»: three cards (a green check, an amber risk knob, a red cross);
//   - each answer: its card with a number badge (the knob turns down and the lot bars shrink; a bill drops toward the
//     cross and stops short, with a check);
//   - «هر سه تاش از ندونستن بهتره»: the three cards hop, «ندونستن» blurred in the words and a grey «؟» card fading;
//   - «۵۰ تا معامله»: 50 tiles filling;
//   - «توی بک‌تست‌لب تست کن»: the real gold replay (k13's screens) with the planned sell ringed;
//   - the free start, the end card.
function card(x, y, w, h, fill, rule, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, fill); cv.restore(); if (rule) rrect(x, y, w, h, r, null, rule, 2); }
function shadowed(fn, blur = 40, dy = 14, a = 0.25) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };
const note = (s, y, col, a = 1) => txt(s, 0, y, 28, col, { w: 700, alpha: a });
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];
const pulse = (t, a, d = 0.35) => (t >= a && t < a + d ? Math.sin(((t - a) / d) * Math.PI) : 0);
function crop(key, r, x, y, w) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im) return h; const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 16); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
function shot(key, r, x, y, w) { const h = (w * r[3]) / r[2]; cv.save(); cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 12, y - 12, w + 24, h + 24, 26, '#15121F'); cv.restore(); rrect(x - 12, y - 12, w + 24, h + 24, 26, null, 'rgba(255,255,255,0.1)', 2); crop(key, r, x, y, w); return h; }
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.7); cv.shadowBlur = 18;
  rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 14, null, col, 6); cv.restore(); }
function badge(n, x, y, bg = WHITE, fg = INKD) { circle(x, y, 46, bg); txt(fa(n), x, y + 5, 60, fg); }

// ---- the three answer cards ----
function gCheck(s = 1) { cv.save(); cv.scale(s, s); cv.strokeStyle = WHITE; cv.lineWidth = 26; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-52, 4); cv.lineTo(-14, 40); cv.lineTo(56, -42); cv.stroke(); cv.restore(); }
function gCross(s = 1) { cv.save(); cv.scale(s, s); cv.strokeStyle = WHITE; cv.lineWidth = 26; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(-46, -46); cv.lineTo(46, 46); cv.moveTo(46, -46); cv.lineTo(-46, 46); cv.stroke(); cv.restore(); }
function gKnob(ang, s = 1) { cv.save(); cv.scale(s, s); circle(0, 0, 70, WHITE); for (let k = 0; k < 7; k++) { const a = Math.PI * (0.75 + (k / 6) * 1.5); line(Math.cos(a) * 82, Math.sin(a) * 82, Math.cos(a) * 92, Math.sin(a) * 92, '#B26F00', 8); }
  line(0, 0, Math.cos(ang) * 52, Math.sin(ang) * 52, AMB, 15); circle(0, 0, 12, AMB); cv.restore(); }
const knobAt = (t) => lerp(-Math.PI * 0.2, -Math.PI * 1.18, cub(k01(t, ws(40) - 0.05, 0.45)));   // high (upper right) over the top to low (lower left)
const CARDS = [[G, (t, s) => gCheck(s)], [AMB, (t, s) => gKnob(knobAt(t), s)], [R, (t, s) => gCross(s)]];
function answerCard(i, t, x, y, S) { at(x, y, 1, 1, () => { shadowed(() => rrect(-S / 2, -S / 2, S, S, S * 0.22, CARDS[i][0]), 40, 16, 0.3); CARDS[i][1](t, S / 220); }); }

// ---- the hook: a balance tipping from «اعتماد» to «ترس» (whole from the first frame) ----
function balanceArt(t, th) {
  const tilt = lerp(0, -0.13, cub(k01(t, ws(2) - 0.05, 0.4))) + lerp(0, 0.32, cub(k01(t, ws(9) - 0.1, 0.5)));
  rrect(-14, -150, 28, 330, 10, LIL); rrect(-110, 170, 220, 30, 15, LIL); circle(0, -150, 26, LIME);
  at(0, -150, 1, 1, () => { rrect(-380, -12, 760, 24, 12, LIL);
    [[340, 'اعتماد', G], [-340, 'ترس', R]].forEach(([x, s, col]) => { line(x, 0, x - 90, 170, rgba(LIL, 0.9), 5); line(x, 0, x + 90, 170, rgba(LIL, 0.9), 5);
      at(x, 170, 1, 1, () => { cv.beginPath(); cv.ellipse(0, 0, 130, 36, 0, 0, Math.PI); cv.fillStyle = LIL; cv.fill(); chip(s, 0, -40, 54, WHITE, col); }, -tilt); }); }, tilt);
}
const LIL = '#A58BFF';
// ---- «بیا ببینیم از چی می‌ترسی؟» ----
function magArt(t, th) {
  [[-280, -120, 170, -0.2, WHITE], [260, -170, 220, 0.18, R], [20, 140, 150, 0.05, LIME]].forEach(([x, y, s, r, col], i) => popIn(t, T.see + 0.08 + i * 0.12, () => txt('؟', 0, 0, s, col), x, y, 0.5, r));
  const k = cub(k01(t, T.see + 0.1, T.three - T.see - 0.2)), mx = lerp(-300, 300, k), my = Math.sin(k * Math.PI * 2) * 80;
  at(mx, my, 1.25, 1, () => { cv.save(); cv.lineCap = 'round'; cv.strokeStyle = LIME; cv.lineWidth = 24; cv.beginPath(); cv.arc(0, 0, 96, 0, Math.PI * 2); cv.stroke(); cv.lineWidth = 32; cv.beginPath(); cv.moveTo(68, 68); cv.lineTo(150, 150); cv.stroke(); cv.restore(); circle(0, 0, 84, 'rgba(255,255,255,0.14)'); });
}
// ---- «سه تا جواب» ----
function threeArt(t, th) { [300, 0, -300].forEach((x, i) => popIn(t, ws(18) + i * 0.1, () => answerCard(i, t, 0, 0, 250), x, 20, 0.55)); }
// ---- each answer ----
function a1Art(t, th) {
  popIn(t, T.a1, () => answerCard(0, t, 0, 0, 380), 0, -20, 0.5); popIn(t, T.a1 + 0.08, () => badge(1, 0, 0), 190, -210, 0.5);
  popIn(t, ws(29), () => chip('ادامه بده', 0, 0, 50, INKD, LIME), 0, 260, 0.55);
}
function a2Art(t, th) {
  popIn(t, T.a2, () => answerCard(1, t, 0, 0, 340), -110, -40, 0.5); popIn(t, T.a2 + 0.08, () => badge(2, 0, 0), 60, -210, 0.5);
  [0, 1, 2].forEach((j) => { const hgt = lerp(220 - j * 30, 70 - j * 12, cub(k01(t, ws(44) - 0.05 + j * 0.06, 0.35))); rrect(220 + j * 66 - 26, 130 - hgt, 52, hgt, 14, AMB); });
  popIn(t, ws(44), () => chip('حجم', 0, 0, 44, INKD, AMB), 286, 200, 0.55);
}
function a3Art(t, th) {
  popIn(t, T.a3, () => answerCard(2, t, 0, 0, 340), 0, 60, 0.5); popIn(t, T.a3 + 0.08, () => badge(3, 0, 0), 175, -110, 0.5);
  const kp = pop(t - ws(57) + 0.04, 13, 0.6), drop = cub(k01(t, ws(58), ws(59) - ws(58))) * (1 - cub(k01(t, ws(59), 0.35)));
  if (kp > 0) at(0, -250 + 90 * drop, cl(kp, 0, 1.1), cl(kp), () => { shadowed(() => rrect(-150, -72, 300, 144, 18, '#1F9D63'), 30, 10, 0.3); rrect(-130, -54, 260, 108, 12, null, 'rgba(255,255,255,0.6)', 6); circle(0, 0, 40, 'rgba(255,255,255,0.9)'); txt('$', 0, 4, 56, '#1F9D63', { dir: 'ltr' }); });
  popIn(t, ws(59), () => { circle(0, 0, 64, LIME); cv.save(); cv.strokeStyle = INKD; cv.lineWidth = 16; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-26, 2); cv.lineTo(-8, 22); cv.lineTo(28, -20); cv.stroke(); cv.restore(); }, 250, -250, 0.5);
}
// ---- «هر سه تاش از ندونستن بهتره» ----
function allArt(t, th) {
  const fade = 1 - 0.8 * cub(k01(t, ws(65), 0.4)); popIn(t, T.all + 0.05, () => { cv.save(); cv.globalAlpha *= fade; shadowed(() => rrect(-90, -90, 180, 180, 40, '#5B5475'), 30, 10, 0.3); txt('؟', 0, 10, 150, '#B9B3CC'); cv.restore(); }, 0, -220, 0.55);
  [300, 0, -300].forEach((x, i) => { const hop = 60 * pulse(t, ws(61) + i * 0.1, 0.35); popIn(t, T.all + 0.12 + i * 0.08, () => answerCard(i, t, 0, -hop, 230), x, 110, 0.55); });
}
// ---- «۵۰ تا معامله»: 50 tiles filling ----
function weekArt(t, th) {
  for (let i = 0; i < 50; i++) { const c = i % 10, r = Math.floor(i / 10), k = pop(t - (ws(69) - 0.05 + i * 0.018), 15, 0.6); if (k <= 0) continue;
    at((4.5 - c) * 86, -170 + r * 80, cl(k, 0, 1.2), cl(k), () => shadowed(() => rrect(-34, -28, 68, 56, 14, i % 3 ? VIO : '#8B6CFF'), 12, 5, 0.25)); }
  popIn(t, ws(71), () => chip('معامله‌ی گذشته', 0, 0, 44, INKD, WHITE), 0, 300, 0.55);
}
// ---- «توی بک‌تست‌لب تست کن»: the real gold replay (k13's screens) ----
const RR = [440, 215, 750, 560], QPOS = [800, 340, 328, 284], A_KEYS = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'];
function labArt(t, th) {
  const k = pop(t - T.lab - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const key = t < ws(77) - 0.04 ? FLIP(t, T.lab, ws(77) - 0.04, A_KEYS) : 'cp', w = 880, x = -440, y = -300, h = shot(key, RR, x, y, w);
    if (key === 'cp') ringIn(RR, QPOS, x, y, w, cub(k01(t, ws(77), 0.3)), LIME);
    if (IMG.icon) popIn(t, ws(75), () => { cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 30; cv.drawImage(IMG.icon, -60, -60, 120, 120); }, x + w, y, 0.5);
    note('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', y + h + 54, 'rgba(255,255,255,0.8)');
  });
}
// ---- «شروعش رایگانه؛ لینکش توی بیوئه» ----
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  if (IMG.icon) at(0, -280, cl(k, 0, 1.2), cl(k), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; cv.drawImage(IMG.icon, -130, -130, 260, 260); });
  popIn(t, ws(80), () => chip('شروع رایگان', 0, 0, 68, LIME, INKD), 0, -10, 0.55, -0.03);
  popIn(t, ws(81), () => { shadowed(() => rrect(-270, -72, 540, 144, 72, WHITE)); txt('لینک توی بیو', 0, 4, 62, VIO); }, 0, 190, 0.6);
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'balance', kpos: [CX, 1180, 0.95], groups: [
      { at: 0, lines: [L_(270, 110, WHITE, [['به', 0], ['استراتژیت', 1, { c: LIME }]]), L_(420, 150, WHITE, [['اعتماد', 2, { hl: G, ht: WHITE }], ['داری،', 3]]),
        L_(570, 100, WHITE, [['یا', 4], ['از', 5], ['بررسی', 6, { c: LIL }], ['کردنش', 7]]), L_(730, 160, WHITE, [['می‌ترسی؟', [8, 9], { hl: R, ht: WHITE }]])] }] },
    { k: 'see', bg: VIO, wipe: 'iris', art: 'mag', kpos: [CX, 1260, 1.15], groups: [
      { at: 10, lines: [L_(330, 150, WHITE, [['بیا', 10], ['ببینیم', 11]]), L_(520, 140, WHITE, [['از', 12], ['چی', 13, { c: LIME }], ['می‌ترسی؟', [14, 15], { hl: LIME, ht: INKD }]])] }] },
    { k: 'three', bg: LIME, wipe: 'up', art: 'three', kpos: [CX, 1270, 1.15], groups: [
      { at: 16, lines: [L_(270, 120, INKD, [['بررسیش', 16], ['فقط', 17]]), L_(480, 220, INKD, [['۳', 18, { hl: INKD, ht: LIME }], ['تا', 19], ['جواب', 20, { c: VIO }]]), L_(680, 110, INKD, [['داره.', 21]])] }] },
    { k: 'a1', bg: PAPER, wipe: 'right', art: 'a1', kpos: [CX, 1290, 1.1], groups: [
      { at: 22, lines: [L_(270, 120, INKP, [['یا', 22], ['کار', 23, { c: G }], ['می‌کنه،', [24, 25], { c: G }]]), L_(430, 120, INKP, [['پس', 26], ['با', 27], ['خیال', 28], ['راحت', 29, { hl: G, ht: WHITE }]]), L_(590, 120, INKP, [['ادامه', 30], ['می‌دی.', [31, 32]]])] }] },
    { k: 'a2', bg: INKD, wipe: 'up', art: 'a2', kpos: [CX, 1300, 1.1], groups: [
      { at: 33, lines: [L_(280, 120, WHITE, [['یا', 33], ['کار', 34], ['می‌کنه', [35, 36]]]), L_(450, 130, WHITE, [['ولی', 37], ['با', 38], ['ریسک', 39, { c: AMB }], ['کمتر،', [40, 41], { hl: AMB, ht: INKD }]])] },
      { at: 42, lines: [L_(300, 120, WHITE, [['پس', 42], ['فقط', 43]]), L_(480, 150, WHITE, [['حجمتو', 44, { hl: AMB, ht: INKD }], ['درست', 45], ['می‌کنی.', [46, 47]]])] }] },
    { k: 'a3', bg: R, wipe: 'cut', art: 'a3', kpos: [CX, 1320, 1.1], groups: [
      { at: 48, lines: [L_(270, 120, WHITE, [['یا', 48], ['کار', 49], ['نمی‌کنه،', [50, 51], { hl: INKD, ht: WHITE }]]), L_(430, 110, WHITE, [['پس', 52], ['قبل', 53], ['از', 54], ['اینکه', [55, 56]]]), L_(590, 130, WHITE, [['پولتو', 57, { c: LIME }], ['بگیره،', 58]])] },
      { at: 59, lines: [L_(430, 220, WHITE, [['فهمیدی.', 59, { hl: INKD, ht: LIME }]])] }] },
    { k: 'all', bg: VIO, wipe: 'iris', art: 'all', kpos: [CX, 1300, 1.1], groups: [
      { at: 60, lines: [L_(270, 140, WHITE, [['هر', 60], ['سه', 61, { c: LIME }], ['تاش', 62]]), L_(450, 130, WHITE, [['از', 63], ['ندونستن', 64, { blur: 4 }]]), L_(630, 170, WHITE, [['بهتره.', 65, { hl: LIME, ht: INKD }]])] }] },
    { k: 'week', bg: LIME, wipe: 'up', art: 'week', kpos: [CX, 1300, 1], groups: [
      { at: 66, lines: [L_(270, 120, INKD, [['این', 66], ['هفته', 67], ['فقط', 68]]), L_(470, 200, INKD, [['۵۰', 69, { hl: VIO, ht: WHITE }], ['تا', 70]]), L_(660, 110, INKD, [['معامله‌ی', 71], ['گذشته‌ش', 72, { c: VIO }], ['رو', 73]])] }] },
    { k: 'lab', bg: INKD, wipe: 'right', art: 'lab', kpos: [CX, 1300, 1], groups: [
      { at: 74, lines: [L_(280, 130, WHITE, [['توی', 74], ['بک‌تست‌لب', [75, 76], { c: LIL }]]), L_(450, 160, WHITE, [['تست', 77, { hl: LIME, ht: INKD }], ['کن.', 78]])] }] },
    { k: 'cta', bg: LIME, wipe: 'up', art: 'cta', kpos: [CX, 1250, 1], groups: [
      { at: 79, lines: [L_(320, 130, INKD, [['شروعش', 79], ['رایگانه؛', 80, { hl: VIO, ht: WHITE }]]), L_(470, 110, INKD, [['لینکش', 81], ['توی', 82], ['بیوئه.', 83]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { balance: balanceArt, mag: magArt, three: threeArt, a1: a1Art, a2: a2Art, a3: a3Art, all: allArt, week: weekArt, lab: labArt, cta: ctaArt, end: endArtK },
  shakes: [[ws(9), 10], [ws(18), 8], [ws(51), 8], [ws(59), 12], [ws(65), 10], [ws(69), 8]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('به استراتژیت', CX, 270, 110, WHITE);
    { const a = measure('اعتماد', 150), b = measure('داری؟', 150), gap = measure(' ', 150) * 1.45, right = CX + (a + gap + b) / 2;
      cv.save(); cv.translate(right - a / 2, 430); cv.rotate(-0.025); rrect(-a / 2 - 24, -92, a + 48, 184, 22, G); cv.restore(); txt('اعتماد', right - a / 2, 430, 150, WHITE); txt('داری؟', right - a - gap - b / 2, 430, 150, WHITE); }
    txt('یا از بررسیش', CX, 600, 104, WHITE);
    { const a = measure('می‌ترسی؟', 170); cv.save(); cv.translate(CX, 780); cv.rotate(0.02); rrect(-a / 2 - 26, -104, a + 52, 208, 24, R); cv.restore(); txt('می‌ترسی؟', CX, 780, 170, WHITE); }
    at(CX, 1250, 0.95, 1, () => { const tilt = 0.19; rrect(-14, -150, 28, 330, 10, LIL); rrect(-110, 170, 220, 30, 15, LIL); circle(0, -150, 26, LIME);
      at(0, -150, 1, 1, () => { rrect(-380, -12, 760, 24, 12, LIL); [[340, 'اعتماد', G], [-340, 'ترس', R]].forEach(([x, s, col]) => { line(x, 0, x - 90, 170, LIL, 5); line(x, 0, x + 90, 170, LIL, 5);
        at(x, 170, 1, 1, () => { cv.beginPath(); cv.ellipse(0, 0, 130, 36, 0, 0, Math.PI); cv.fillStyle = LIL; cv.fill(); chip(s, 0, -40, 54, WHITE, col); }, -tilt); }); }, tilt); });
    at(CX, 1680, 1, 1, () => chip('سه تا جواب، هر سه از ندونستن بهتر', 0, 0, 44, INKD, LIME));
  },
});
