// s2 · the Instagram story «تخفیف ۲۰ درصدی، فقط به مدت ۴۸ ساعت · کد DISCOUNT20», the kinetic look (u-kit), music only.
// «تخفیف ۲۰ درصدی»: the «۲۰» slams in; a clock ring sweeps through «۴۸ ساعت»; the code is typed onto a coupon; the real billing page (dark
// theme) gets the code typed into «کد تخفیف» (capture/cap.mjs; its plan prices are cropped out); the end card repeats the
// offer and the code, with room under it for Instagram's countdown sticker.
const CODE = 'DISCOUNT20';
function card(x, y, w, h, fill, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.28)'; cv.shadowBlur = 44; cv.shadowOffsetY = 16; rrect(x, y, w, h, r, fill); cv.restore(); }
function crop(key, r, x, y, w, a = 1) { const im = IMG[key]; if (!im || a <= 0) return (w * r[3]) / r[2]; const s = im.width / 1440, h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.roundRect(x, y, w, h, 22); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.8); cv.shadowBlur = 22; rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 18, null, col, 6); cv.restore(); }
/** the code as typed so far: n letters, a caret while typing */
function typed(t, t0, t1) { return CODE.slice(0, Math.max(0, Math.min(CODE.length, Math.floor(((t - t0) / (t1 - t0)) * CODE.length + 0.001)))); }
/** confetti from a point (seeded, so every render is the same) */
function burst(t, t0, x, y, n = 36, spread = 520) { const d = t - t0; if (d <= 0 || d > 1.6) return; for (let i = 0; i < n; i++) { const a = rnd(i * 3.1) * Math.PI * 2, v = spread * (0.45 + rnd(i * 1.7) * 0.7), g = 900;
  const px = x + Math.cos(a) * v * d, py = y + Math.sin(a) * v * d + 0.5 * g * d * d, c = [LIME, VIO, WHITE, AMB, MINT][i % 5];
  cv.save(); cv.globalAlpha *= 1 - cl(d / 1.6); cv.translate(px, py); cv.rotate(d * 8 + i); rrect(-9, -5, 18, 10, 3, c); cv.restore(); } }

// ---- «۲۰» slams in, «درصدی» under it ----
function introArt(t, th) {
  const k = pop(t - 0.45, 11, 0.42); if (k <= 0) return;
  burst(t, 0.5, 0, 0, 44, 700);
  at(0, 0, lerp(2.4, 1, cl(k, 0, 1.4)), cl(k * 3), () => {
    cv.save(); cv.shadowColor = rgba(LIME, 0.55); cv.shadowBlur = 80; txt('۲۰', 0, 20, 560, LIME); cv.restore();
  }, -0.04);
  const kc = pop(t - 1.0, 13, 0.55); if (kc > 0) at(0, 360, cl(kc, 0, 1.2), cl(kc), () => chip('درصدی', 0, 0, 80, INKD, WHITE));
}
// ---- «فقط به مدت ۴۸ ساعت»: a clock ring sweeping ----
function timeArt(t, th) {
  const k = pop(t - T.time - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.85, 1, cl(k)), cl(k), () => {
    const sw = cub(k01(t, T.time + 0.2, 2.6)), R0 = 330;
    circle(0, 0, R0 + 30, rgba(WHITE, 0.08)); circle(0, 0, R0, null, rgba(WHITE, 0.18), 26);
    cv.save(); cv.strokeStyle = LIME; cv.lineWidth = 26; cv.lineCap = 'round'; cv.shadowColor = rgba(LIME, 0.6); cv.shadowBlur = 30; cv.beginPath(); cv.arc(0, 0, R0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - sw * 0.98)); cv.stroke(); cv.restore();
    for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2 - Math.PI / 2, r1 = R0 - 48, r2 = R0 - (i % 4 ? 62 : 78); line(Math.cos(a) * r1, Math.sin(a) * r1, Math.cos(a) * r2, Math.sin(a) * r2, rgba(WHITE, i % 4 ? 0.25 : 0.6), i % 4 ? 3 : 5); }
    const kn = pop(t - 4.0, 12, 0.5); if (kn > 0) at(0, -30, cl(kn, 0, 1.3), cl(kn), () => txt('۴۸', 0, 0, 250, WHITE));
    const ks = pop(t - 4.5, 13, 0.55); if (ks > 0) at(0, 140, cl(ks, 0, 1.2), cl(ks), () => chip('ساعت', 0, 0, 56, INKD, LIME));
  });
}
// ---- the coupon: DISCOUNT20 typed on ----
function codeArt(t, th) {
  const k = pop(t - T.code - 0.1, 11, 0.55); if (k <= 0) return;
  const s = typed(t, 6.7, 7.9), done = s.length === CODE.length;
  at(0, 0, lerp(0.8, 1, cl(k)), cl(k), () => {
    const w = 900, h = 400, x = -450, y = -200, stub = 230;
    card(x, y, w, h, WHITE, 40);
    // the stub (right side, read first) with the percent
    cv.save(); cv.beginPath(); cv.roundRect(x + w - stub, y, stub, h, [0, 40, 40, 0]); cv.clip(); cv.fillStyle = VIO; cv.fillRect(x + w - stub, y, stub, h); cv.restore();
    txt('۲۰٪', x + w - stub / 2, y + h / 2 - 20, 92, WHITE); txt('تخفیف', x + w - stub / 2, y + h / 2 + 70, 40, LIME, { w: 800 });
    // the tear line and its notches
    cv.save(); cv.setLineDash([14, 12]); line(x + w - stub, y + 30, x + w - stub, y + h - 30, rgba(VIO, 0.5), 4); cv.restore();
    circle(x + w - stub, y, 26, PAPER); circle(x + w - stub, y + h, 26, PAPER);
    txt('کد تخفیف', x + (w - stub) / 2, y + 80, 40, MP, { w: 800 });
    rrect(x + 50, y + 140, w - stub - 100, 130, 24, '#F1EEFA', rgba(VIO, 0.35), 3);
    const tx = x + (w - stub) / 2; txt(s || ' ', tx, y + 208, 76, INKP, { dir: 'ltr', w: 900 });
    if (!done && Math.floor(t * 3) % 2 === 0) { const mw = measure(s || '', 76); rrect(tx + mw / 2 + 8, y + 170, 7, 76, 3, VIO); }
    // copy
    const kc = pop(t - 8.3, 13, 0.55); if (kc > 0) at(tx, y + h - 60, cl(kc, 0, 1.2), cl(kc), () => chip('کپی کن', 0, 0, 34, WHITE, INKP));
  });
  if (done) burst(t, 7.95, 0, -260, 30, 560);
}
// ---- the real billing page: the code typed into «کد تخفیف» ----
const RB = [88, 442, 322, 100];
function howArt(t, th) {
  const k = pop(t - T.how - 0.05, 12, 0.6); if (k <= 0) return;
  const n = Math.max(0, Math.min(10, Math.floor((t - 10.2) / 0.11))), key = t > 11.8 ? 'p11' : 'p' + String(n).padStart(2, '0');
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    const w = 940, x = -470, y = -150;
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 14, y - 14, w + 28, (w * RB[3]) / RB[2] + 28, 30, '#15121F'); cv.restore();
    const h = crop(key, RB, x, y, w);
    ringIn(RB, [165, 480, 234, 46], x, y, w, cub(k01(t, 10.1, 0.3)) * (1 - cub(k01(t, 11.8, 0.2))));
    ringIn(RB, [97, 480, 64, 46], x, y, w, cub(k01(t, 11.9, 0.3)));
    if (t > 11.9) { const s = w / RB[2], cx = x + (129 - RB[0]) * s, cy = y + (503 - RB[1]) * s, p = cub(k01(t, 11.9, 0.4)); cursor(lerp(cx + 160, cx - 4, p), lerp(cy + 120, cy - 4, p), 1.1);
      const d = t - 12.4; if (d > 0 && d < 0.5) circle(cx, cy, 30 + 90 * d, null, rgba(LIME, 1 - d * 2), 6); }
    txt('صفحه‌ی واقعی بک‌تست‌لب · اشتراک و پرداخت', 0, y + h + 70, 30, MD, { w: 700 });
  });
}
// ---- the end card: the offer, the code, the link; room below for the countdown sticker ----
function endArtS(t, th) {
  const t0 = T.end, ki = pop(t - t0 + 0.05, 12, 0.6);
  if (ki > 0 && IMG.icon) at(0, -470, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 50; cv.shadowOffsetY = 20; cv.drawImage(IMG.icon, -110, -110, 220, 220); });
  const kw = cub(k01(t, t0 + 0.2, 0.35)); if (kw > 0 && IMG.word) { const w = 460, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, -w / 2, -320 + (1 - kw) * 24, w, h); cv.restore(); }
  const ko = pop(t - t0 - 0.35, 13, 0.55); if (ko > 0) at(0, -110, cl(ko, 0, 1.25), cl(ko), () => chip('۲۰٪ تخفیف · فقط ۴۸ ساعت', 0, 0, 52, INKD, LIME));
  const kc = pop(t - t0 - 0.6, 13, 0.55); if (kc > 0) at(0, 60, cl(kc, 0, 1.2), cl(kc), () => { cv.save(); cv.setLineDash([14, 10]); rrect(-330, -70, 660, 140, 30, rgba(WHITE, 0.06), LIME, 4); cv.restore(); txt(CODE, 0, 4, 76, WHITE, { dir: 'ltr' }); });
  const kb = pop(t - t0 - 0.9, 14, 0.6); if (kb > 0) at(0, 250, cl(kb, 0, 1.2), cl(kb), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-260, -72, 520, 144, 72, WHITE); cv.shadowColor = 'transparent'; txt('لینک توی بیو', 0, 4, 62, VIO); });
  const ka = cub(k01(t, t0 + 1.4, 0.4)); if (ka > 0) { const y = 400 - ((t * 1.6) % 1) * 30; cv.save(); cv.globalAlpha *= ka; cv.strokeStyle = WHITE; cv.lineWidth = 10; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-34, y + 20); cv.lineTo(0, y - 14); cv.lineTo(34, y + 20); cv.stroke(); cv.restore(); }
}

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'intro', bg: INKD, wipe: 'none', art: 'intro', kpos: [CX, 1010, 1], groups: [
      { at: 0, lines: [L_(420, 140, WHITE, [['تخفیف', 0]])] }] },
    { k: 'time', bg: VIO, wipe: 'iris', art: 'time', kpos: [CX, 1080, 1], groups: [
      { at: 3, lines: [L_(400, 110, WHITE, [['فقط', 3, { hl: LIME, ht: INKD }], ['به', 4], ['مدت', 5]])] }] },
    { k: 'code', bg: PAPER, wipe: 'right', art: 'code', kpos: [CX, 1040, 1], groups: [
      { at: 8, lines: [L_(420, 110, INKP, [['با', 8], ['کد', 9, { c: VIO }], ['تخفیف', 10, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'how', bg: INKD, wipe: 'up', art: 'how', kpos: [CX, 1060, 1], groups: [
      { at: 11, lines: [L_(400, 96, WHITE, [['موقع', 11], ['خرید', 12], ['اشتراک', 13, { c: LIME }]]), L_(540, 110, WHITE, [['وارد', 14, { hl: LIME, ht: INKD }], ['کن', 15]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 1000, 1], groups: [] },
  ],
  art: { intro: introArt, time: timeArt, code: codeArt, how: howArt, end: endArtS },
  shakes: [[0.5, 16], [7.95, 6]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('تخفیف', CX, 480, 140, WHITE);
    cv.save(); cv.shadowColor = rgba(LIME, 0.55); cv.shadowBlur = 80; txt('۲۰٪', CX, 860, 430, LIME); cv.restore();
    at(CX, 1230, 1, 1, () => chip('فقط ۴۸ ساعت', 0, 0, 70, INKD, WHITE));
    at(CX, 1440, 1, 1, () => { cv.save(); cv.setLineDash([14, 10]); rrect(-330, -70, 660, 140, 30, rgba(WHITE, 0.06), LIME, 4); cv.restore(); txt(CODE, 0, 4, 76, WHITE, { dir: 'ltr' }); });
  },
});
