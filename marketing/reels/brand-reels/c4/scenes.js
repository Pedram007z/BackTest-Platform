// «فردا چی می‌شه؟»: after-launch quiz reel. Three real Bitcoin charts, guess the next day, then try it in the app.
// No narration: the words on screen carry it, the music and effects keep the beat.
const RD = DATA.rounds, T = DATA.T;
const LABEL = 'چالش · فردا چی می‌شه؟';
const SH = 1992 / 1170;
const RT = [[0, T.r1[0], T.r1[1], T.r1[2]], [T.r2[0], T.r2[1], T.r2[2], T.r2[3]], [T.r3[0], T.r3[1], T.r3[2], T.r3[3]]]; // intro, countdown, reveal, end
const DATES = ['۲۵ اکتبر ۲۰۱۹', '۲۷ ژوئن ۲۰۱۹', '۱۲ مارس ۲۰۲۰'];
const HINTS = [null, ['۳۰ روز، نزدیک ۵۰٪ رشد.', 'فردا؟'], ['این یکی رو دیگه', 'حتماً درست می‌گی.']];

function phone(cx, top, w, img, sx, sy, sw) {
  const h = w * SH, x = cx - w / 2; cv.save(); cv.shadowColor = rgba(C.accent, 0.35); cv.shadowBlur = 80; rr(x - 16, top - 16, w + 32, h + 32, 70); cv.fillStyle = '#05040a'; cv.fill(); cv.shadowBlur = 0; cv.lineWidth = 3; cv.strokeStyle = C.line; cv.stroke();
  cv.save(); rr(x, top, w, h, 54); cv.clip(); if (img) { const k = w / sw; cv.drawImage(img, sx, sy, sw, h / k, x, top, w, h); } cv.restore(); cv.restore();
  return { X: (px) => x + (px - sx) * (w / sw), Y: (py) => top + (py - sy) * (w / sw), k: w / sw };
}
function ring(x, y, w, h, col, k) { if (k <= 0) return; cv.save(); cv.globalAlpha *= clamp(k); cv.shadowColor = col; cv.shadowBlur = 24; rr(x - 8, y - 8, w + 16, h + 16, 18); cv.lineWidth = 5; cv.strokeStyle = col; cv.stroke(); cv.restore(); }

// ---- one round ----
const CR = { x: 120, y: 650, w: 840, h: 560 };
function round(t, k) {
  const [a0, c0, rv, e] = RT[k], r = RD[k], al = k === 0 ? 1 - E.in(P(t, e - 0.3, 0.3)) : win(t, a0, e, 0.3, 0.3); if (al <= 0) return;
  cv.save(); cv.globalAlpha = al;
  const o = r.ohlc, n = o.length - 1, tgt = o[n]; let lo = Infinity, hi = -Infinity; for (let i = 0; i < n; i++) { lo = Math.min(lo, o[i][2]); hi = Math.max(hi, o[i][1]); }
  const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
  const rk = E.inOut(P(t, rv, 0.7)), lo2 = Math.min(lo, tgt[2] - pad * 0.5), hi2 = Math.max(hi, tgt[1] + pad * 0.5);
  const LO = lerp(lo, lo2, rk), HI = lerp(hi, hi2, rk);
  pill(540, 380, `چارت ${fa(k + 1)} از ۳ · بیت‌کوین روزانه`, { size: 30, color: C.ink, dot: C.lilac });
  // the question / the answer
  const ans = E.back(P(t, rv + 0.1, 0.45)), up = r.chg > 0, col = up ? C.gain : C.loss;
  const qa = 1 - P(t, rv, 0.2);
  if (qa > 0) { if (k === 0) runs([['فردا…', C.ink], ['بالا', C.gain], ['یا', C.ink], ['پایین؟', C.loss]], 540, 500, { size: 92, glow: rgba(C.accent, 0.3), reveal: 1 });
    else { cv.save(); cv.globalAlpha *= qa * E.out(P(t, a0 + 0.1, 0.4)); txt(HINTS[k][0], 540, 470, { size: 54, font: 'Rdx', weight: 700, color: C.ink }); txt(HINTS[k][1], 540, 550, { size: 54, font: 'Rdx', weight: 700, color: C.lilac }); cv.restore(); } }
  if (ans > 0) { cv.save(); cv.translate(540, 500); cv.scale(ans, ans); runs([[up ? 'بالا!' : 'پایین!', col], [(up ? '+' : '−') + fa(Math.abs(r.chg), 1) + '٪', col]], 0, 0, { size: 100, glow: rgba(col, 0.6) }); cv.restore(); }
  // the chart
  card(CR.x - 50, CR.y - 60, CR.w + 100, CR.h + 110);
  txt('BTCUSD · 1D', CR.x + CR.w, CR.y - 22, { size: 26, color: C.muted, weight: 500, dir: 'ltr', align: 'right' });
  const c = candles(CR, o, 0, n, { span: n + 3, lo: LO, hi: HI });
  const x = c.X(n), cw = CR.w / (n + 3);
  if (t < rv) { rr(x - cw * 1.2, CR.y + 10, cw * 2.4 + 40, CR.h - 20, 16); cv.fillStyle = rgba(C.accent, 0.12 + 0.06 * Math.sin(t * 6)); cv.fill(); cv.strokeStyle = rgba(C.accentInk, 0.7); cv.lineWidth = 3; cv.setLineDash([10, 8]); cv.stroke(); cv.setLineDash([]);
    txt('؟', x + 20, CR.y + CR.h / 2, { size: 110, font: 'Rdx', weight: 700, color: C.lilac, glow: rgba(C.accent, 0.8) }); }
  else { const g = E.out(P(t, rv, 0.6)), [op, h, l, cl] = tgt, cNow = op + (cl - op) * g, hNow = Math.max(op, cNow, op + (h - op) * g), lNow = Math.min(op, cNow, op + (l - op) * g);
    cv.save(); cv.shadowColor = col; cv.shadowBlur = 30; cv.strokeStyle = col; cv.fillStyle = col; cv.lineWidth = 4; cv.beginPath(); cv.moveTo(x, c.Y(hNow)); cv.lineTo(x, c.Y(lNow)); cv.stroke();
    cv.fillRect(x - cw * 0.45, c.Y(Math.max(op, cNow)), cw * 0.9, Math.max(3, Math.abs(c.Y(op) - c.Y(cNow)))); cv.restore();
    const dk = P(t, rv + 0.6, 0.4); if (dk > 0) tag(x - 30, c.Y(cl) + (up ? -50 : 50), DATES[k], col, { size: 30, dir: 'rtl', align: 'right', alpha: dk }); }
  // the buttons and the countdown
  const pick = P(t, rv, 0.3);
  [[815, '▲ بالا', C.gain, true], [265, '▼ پایین', C.loss, false]].forEach(([bx, s, bc, isUp]) => { const right = isUp === up, dim = pick * (right ? 0 : 0.7), grow = right ? 1 + 0.1 * E.back(clamp(pick)) * (1 - P(t, rv + 0.8, 0.4)) : 1;
    cv.save(); cv.globalAlpha *= 1 - dim; cv.translate(bx, 1390); cv.scale(grow, grow); card(-170, -62, 340, 124, { r: 62, fill: rgba(bc, right && pick > 0 ? 0.35 : 0.14), border: bc, glow: right && pick > 0 ? rgba(bc, 0.6) : undefined }); txt(s, 0, 2, { size: 44, weight: 700, color: C.ink }); cv.restore(); });
  if (t >= c0 && t < rv) { const left = rv - t, num = Math.ceil(left - 1e-6), f = 1 - (left % 1 || 1);
    cv.save(); cv.translate(540, 1390); cv.strokeStyle = C.line; cv.lineWidth = 10; cv.beginPath(); cv.arc(0, 0, 66, 0, 7); cv.stroke();
    cv.strokeStyle = C.lilac; cv.shadowColor = C.accent; cv.shadowBlur = 20; cv.beginPath(); cv.arc(0, 0, 66, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (left / (rv - c0))); cv.stroke(); cv.restore();
    txt(fa(num), 540, 1394, { size: 76, font: 'Rdx', weight: 700, color: C.ink, scale: 1.25 - 0.25 * E.out(clamp(f * 3)) }); }
  else if (t < c0) txt('vs', 540, 1392, { size: 1, alpha: 0 });
  cv.restore();
}

// ---- the rest ----
function score(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['چند تا رو', 96, C.ink], ['درست گفتی؟', 110, C.lilac]], t, T.score[0], T.score[1] + 0.3, { y: 520, gap: 140, glowAll: rgba(C.accent, 0.5) });
  RD.forEach((r, i) => { const k = E.back(P(t, T.score[0] + 0.5 + i * 0.35, 0.4)); if (k <= 0) return; const up = r.chg > 0, col = up ? C.gain : C.loss, y = 850 + i * 170;
    cv.save(); cv.translate(540, y); cv.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k); cv.globalAlpha *= clamp(k); card(-400, -65, 800, 130, { r: 30, border: rgba(col, 0.7) });
    txt(`چارت ${fa(i + 1)}`, 360, 0, { size: 40, weight: 700, color: C.ink, align: 'right' }); txt(DATES[i], 120, 0, { size: 30, weight: 500, color: C.muted });
    txt((up ? '▲ +' : '▼ −') + fa(Math.abs(r.chg), 1) + '٪', -360, 0, { size: 44, font: 'Rdx', weight: 700, color: col, align: 'left', dir: 'ltr' }); cv.restore(); });
  cv.restore();
}
function lessons(t) {
  headline([[[['فردا', C.lilac], ['رو', C.ink], ['هیچ‌کس', C.ink]], 100], ['نمی‌دونه.', 110, C.ink]], t, T.l1[0], T.l1[1], { y: 840, gap: 140, glow: rgba(C.accent, 0.7) });
  headline([['ولی می‌شه تمرین کرد', 84, C.ink], ['که با هر فردایی', 84, C.ink], ['چی کار کنی.', 104, C.lilac]], t, T.l2[0], T.l2[1], { y: 760, gap: 140, stagger: 0.5, glowAll: rgba(C.accent, 0.4) });
}
function app(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a; const [a0, a1] = T.app;
  txt('توی بک‌تست‌لب:', 540, 380, { size: 50, font: 'Rdx', weight: 700, color: C.ink });
  const p = E.inOut(P(t, a0 + 2.2, 0.8)); const f = phone(540, 450, 560, IMG.replay, lerp(0, 300, p), lerp(160, 520, p), lerp(1170, 870, p));
  ring(f.X(733), f.Y(335), 237 * f.k, 105 * f.k, C.lilac, win(t, a0 + 0.4, a0 + 2.2, 0.3, 0.3));
  ring(f.X(310), f.Y(1785), 360 * f.k, 98 * f.k, C.lilac, win(t, a0 + 4.2, a1, 0.3, 0.3));
  const chips = [['برو به هر روزی از گذشته', a0 + 0.3], ['آینده رو نمی‌بینی، تصمیم می‌گیری', a0 + 2.2], ['با حد ضرر و حجم درست · بدون ریسک پول واقعی', a0 + 4.2]];
  chips.forEach(([s, at], i) => { const k = win(t, at, i < 2 ? chips[i + 1][1] : a1, 0.3, 0.25); if (k > 0) pill(540, 1500, s, { size: 36, color: C.ink, dot: C.lilac, weight: 700, alpha: k }); });
  txt('تصویر واقعی برنامه · داده‌ی نمونه', 540, 1440, { size: 24, color: C.faint, weight: 500 });
  cv.restore();
}
function cta(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a; const c0 = T.cta[0];
  headline([['امتیازت از ۳', 104, C.ink], ['چند شد؟', 120, C.lilac]], t, c0, DUR + 1, { y: 560, gap: 150, hold: true, glowAll: rgba(C.accent, 0.5) });
  const b = E.back(P(t, c0 + 0.6, 0.45)); if (b > 0) button(540, 860, 'کامنت کن', { size: 48, scale: b });
  const l = E.out(P(t, c0 + 1.3, 0.5)); if (l > 0) { const up = Math.sin(t * 6) * 10; cv.save(); cv.globalAlpha *= l; cv.translate(540, 1030 + up); cv.fillStyle = C.lilac; cv.beginPath(); cv.moveTo(0, -40); cv.lineTo(30, -6); cv.lineTo(11, -6); cv.lineTo(11, 34); cv.lineTo(-11, 34); cv.lineTo(-11, -6); cv.lineTo(-30, -6); cv.closePath(); cv.fill(); cv.restore();
    txt('خودت امتحان کن · لینک توی بیو', 540, 1120, { size: 44, weight: 700, color: C.ink, alpha: l }); }
  if (IMG.logo) { const w = 420, h = (w * IMG.logo.height) / IMG.logo.width, e = E.out(P(t, c0 + 1.8, 0.6)); cv.save(); cv.globalAlpha *= e; cv.drawImage(IMG.logo, 540 - w / 2, 1330 - h / 2, w, h); cv.restore(); }
  cv.restore();
}

function render(t) {
  const crash = RT[2][2], shake = t > crash && t < crash + 0.9 ? (1 - P(t, crash, 0.9)) * 14 : 0;
  background(t, { tense: 0.9 * win(t, crash, RT[2][3], 0.2, 0.4), happy: 0.7 * win(t, RT[0][2], RT[0][3], 0.2, 0.3) });
  cv.save(); cv.translate(Math.sin(t * 70) * shake, Math.cos(t * 61) * shake);
  [0, 1, 2].forEach((k) => round(t, k));
  score(t, win(t, T.score[0] - 0.05, T.score[1] + 0.1, 0.3, 0.3));
  lessons(t);
  app(t, win(t, T.app[0] - 0.05, T.app[1] + 0.1, 0.3, 0.3));
  cta(t, E.out(P(t, T.cta[0] - 0.05, 0.3)));
  cv.restore();
  chrome(t, LABEL, { dot: C.amber });
  cutFx(t, [T.r2[0], T.r3[0], T.score[0], T.l1[0], T.l2[0], T.app[0], T.cta[0]]);
  RT.forEach(([, , rv], k) => { const q = 1 - Math.abs(t - rv - 0.05) / 0.25; if (q > 0) { cv.fillStyle = rgba(RD[k].chg > 0 ? C.gain : C.loss, (k === 2 ? 0.35 : 0.2) * q); cv.fillRect(0, 0, W, H); } });
  finish(t);
}
boot(render, [loadImg('replay', 'img/03-replay.png')]);
