// k8 · «تاحالا بک‌تست‌لب به گوشت خورده؟ … اول بگم چی نیست», the default kinetic look (u-kit), on the user's voice
// (t1's cut, shared with the typographic t1).
// The drawn parts:
//   - a mystery tile with sound rings («به گوشت خورده؟»);
//   - the three things it isn't (a signal on a phone, a crystal ball, a «سود تضمینی» badge), each crossed out;
//   - a giant «۱» with a check;
//   - the Buy/Sell buttons with a cursor («حالا تو تصمیم بگیر»);
//   - a wall of decisions, ✓ and ✕;
//   - a gift box that opens on «تجربه‌ی خودت».
// The real platform appears from «بازار واقعی» on (f1's dark-theme captures):
//   - the session window's data range «۱۱ دی ۱۳۹۳ تا ۱۵ مهر ۱۴۰۵»;
//   - the gold replay with the future covered;
//   - a placed buy-stop with its stop loss;
//   - the spread and commission fields;
//   - the trade playing out.
const mixC = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], cl(k)))).join(',')})`; };
function card(x, y, w, h, fill, rule, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, fill); cv.restore(); if (rule) rrect(x, y, w, h, r, null, rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }
function crop(key, r, x, y, w, a = 1) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im || a <= 0) return h; const s = im.width / 1440; cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.roundRect(x, y, w, h, 16); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
function shot(key, r, x, y, w, a = 1) { const h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 12, y - 12, w + 24, h + 24, 26, '#15121F'); cv.restore(); cv.save(); cv.globalAlpha *= a; rrect(x - 12, y - 12, w + 24, h + 24, 26, null, 'rgba(255,255,255,0.1)', 2); cv.restore(); crop(key, r, x, y, w, a); return h; }
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.7); cv.shadowBlur = 18;
  rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 14, null, col, 6); cv.restore(); }
const note = (s, y, col, a = 1) => txt(s, 0, y, 28, col, { w: 700, alpha: a });
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];

// ---- «تاحالا بک‌تست‌لب به گوشت خورده؟»: a mystery tile, sound rings ----
function hookArt(t, th) {
  const k = pop(t + 0.3, 12, 0.6); if (k <= 0) return;
  for (let i = 0; i < 4; i++) { const p = ((t * 0.7 + i / 4) % 1), r = 200 + p * 320; circle(0, 0, r, null, rgba(LIME, 0.5 * (1 - p)), 6); }
  at(0, 0, cl(k, 0, 1.1), cl(k), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 50; rrect(-170, -170, 340, 340, 80, PLATE); cv.restore(); rrect(-170, -170, 340, 340, 80, null, 'rgba(255,255,255,0.12)', 3);
    txt('؟', 0, 22, 260, LIME); }, 0.06 * Math.sin(t * 4));
}
// ---- «اگه نه، پس بذار بهت بگم چیه و چه کارایی از دستش برمیاد»: the reveal ----
function introArt(t, th) {
  brandArt(t, th, ws(9));
  popIn(t, ws(13), () => chip('چیه؟', 0, 0, 44, INKD, LIME), -200, 330);
  popIn(t, ws(16), () => chip('چه کارایی؟', 0, 0, 44, VIO, WHITE), 170, 330);
}
// ---- «اول بگم چی نیست» ----
function notsArt(t, th) {
  [-180, 0, 180].forEach((y, i) => { const k = pop(t - T.nots - 0.1 - i * 0.12, 12, 0.6); if (k > 0) at(0, y, 1, cl(k), () => { rrect(-400, -64, 800, 128, 30, null, 'rgba(255,255,255,0.25)', 4); cv.save(); cv.setLineDash([14, 14]); rrect(-340, -6, 420, 12, 6, 'rgba(255,255,255,0.12)'); cv.restore(); }); });
  popIn(t, ws(23), () => { circle(0, 0, 150, R); line(-60, -60, 60, 60, WHITE, 30); line(60, -60, -60, 60, WHITE, 30); }, 0, 0, 0.45, -0.1);
}
// ---- what it isn't: a signal, a prediction, a promise of profit ----
const NOTS = [['سیگنال', 24, 25, 'phone'], ['پیش‌بینی آینده', 27, 30, 'ball'], ['سود تضمینی', 32, 34, 'badge']];
function listArt(t, th) {
  NOTS.forEach(([s, t0w, xw, ic], i) => { const k = pop(t - ws(t0w) + 0.1, 12, 0.6); if (k <= 0) return; const y = -300 + i * 300;
    at(0, y, lerp(0.85, 1, cl(k)), cl(k), () => {
      card(-420, -110, 840, 220, WHITE, 'rgba(26,20,48,0.1)', 34);
      at(290, 0, 1, 1, () => {
        if (ic === 'phone') { rrect(-48, -80, 96, 160, 18, INKD); rrect(-38, -62, 76, 118, 8, '#2A2340'); rrect(-30, -40, 58, 34, 10, G); txt('خرید!', -1, -22, 20, WHITE, { w: 800 }); }
        if (ic === 'ball') { rrect(-56, 46, 112, 30, 10, INKP); circle(0, -6, 64, VIO); circle(-22, -30, 16, 'rgba(255,255,255,0.45)'); }
        if (ic === 'badge') { cv.fillStyle = AMB; cv.beginPath(); for (let q = 0; q < 16; q++) { const a = (q / 16) * Math.PI * 2, r = q % 2 ? 58 : 72; cv.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cv.closePath(); cv.fill(); txt('٪', 0, 6, 64, WHITE); }
      });
      txt(s, 170, 4, s.length > 8 ? 52 : 60, INKP, { align: 'right' });
      const kx = cub(k01(t, ws(xw), 0.3)); if (kx > 0) { const w = measure(s, s.length > 8 ? 52 : 60) + 40; line(190, 4, 190 - w * kx, 4, R, 12); }
      cross(-320, 0, 52, R, pop(t - ws(xw) - 0.15, 14, 0.5));
    });
  });
}
// ---- «فقط یه کار می‌کنه، اونم درست» ----
function oneArt(t, th) {
  const k = pop(t - ws(37) + 0.1, 11, 0.55); if (k <= 0) return;
  at(0, 0, cl(k, 0, 1.2), cl(k), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 50; circle(0, 0, 260, INKD); cv.restore(); txt(fa(1), 0, 30, 380, LIME); });
  check(190, -190, 72, G, pop(t - ws(42) - 0.05, 13, 0.5));
}
// ---- «بازار واقعی رو از ۲۰۱۵ تا امروز جلوت می‌ذاره» (f1: the session window's data range) ----
const RC = [455, 685, 535, 95];
function marketArt(t, th) {
  const k = pop(t - T.market - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 980, x = -490, y = -140, h = shot('c-session', RC, x, y, w);
    ringIn(RC, [800, 755, 195, 24], x, y, w, cub(k01(t, ws(48), 0.3)));
    popIn(t, ws(47), () => chip(fa(2015), 0, 0, 52, INKD, LIME), 260, y - 150);
    const ka = cub(k01(t, ws(50), ws(52) - ws(50))); if (ka > 0) { line(120, y - 150, 120 - 240 * ka, y - 150, LIME, 8); }
    popIn(t, ws(52), () => chip('امروز', 0, 0, 52, WHITE, VIO), -260, y - 150);
    note('صفحه‌ی واقعی بک‌تست‌لب · ساخت جلسه', y + h + 60, MD);
  });
}
// ---- «بدون اینکه بذاره آینده رو ببینی» (f1: the gold replay, the future covered) ----
const RR = [520, 200, 560, 620], DK = ['d02', 'd06', 'd10', 'd14', 'd18', 'd22', 'd26', 'd30', 'd34', 'd38'];
function blindArt(t, th) {
  const k = pop(t - T.blind - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 620, fw = 260, x = -440, y = -360, h = (w * RR[3]) / RR[2], xl = x + w + 8, fwi = fw - 8;
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 14, y - 14, w + fw + 28, h + 28, 30, '#15121F'); cv.restore();
    crop(FLIP(t, T.blind, T.you, DK), RR, x, y, w); rrect(xl, y, fwi, h, 18, '#0E0B17');
    const kf = cub(k01(t, ws(60) - 0.1, 0.4));
    if (kf > 0) { cv.save(); cv.globalAlpha *= kf; cv.beginPath(); cv.roundRect(xl, y, fwi, h, 18); cv.clip(); for (let q = -30; q < 20; q++) line(xl + q * 26, y + h, xl + q * 26 + 200, y, rgba(LIME, 0.22), 3); cv.restore();
      line(xl - 4, y, xl - 4, y + h, LIME, 4, [12, 9]); at(xl + fwi / 2, y + h / 2 - 30, lerp(1.4, 1, kf), kf, () => { circle(0, 0, 64, LIME); txt('؟', 0, 6, 84, INKD); });
      at(xl + fwi / 2, y + h / 2 + 80, 1, kf, () => chip('آینده', 0, 0, 34, INKD, LIME)); }
    note('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', y + h + 60, 'rgba(255,255,255,0.75)');
  });
}
// ---- «حالا تو تصمیم بگیر»: Buy or Sell ----
function youArt(t, th) {
  const k = pop(t - T.you - 0.05, 12, 0.6); if (k <= 0) return;
  const press = t >= ws(69) && t < ws(69) + 0.14;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    at(200, 60, press ? 0.94 : 1, 1, () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-170, -90, 340, 180, 40, G); cv.restore(); txt('خرید', 0, 6, 72, WHITE); });
    at(-200, 60, 1, 1, () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-170, -90, 340, 180, 40, R); cv.restore(); txt('فروش', 0, 6, 72, WHITE); });
    // the cursor wavers, then picks
    const wav = Math.sin((t - T.you) * 3.2), kc = cub(k01(t, ws(68), ws(69) - ws(68) + 0.05)); const cx = lerp(160 * wav, 200, kc), cy = lerp(170, 90, kc);
    cursor(cx, cy, 1.1);
    popIn(t, ws(67), () => chip('تو', 0, 0, 70, LIME, INKD), 0, -230, 0.5);
    if (t >= ws(69) + 0.1) { const kr = cub(k01(t, ws(69) + 0.1, 0.4)); circle(200, 60, 190 + kr * 120, null, rgba(G, 0.6 * (1 - kr)), 8); }
  });
}
// ---- «وارد می‌شی، حد ضرر می‌ذاری، با اسپرد و کمیسیون واقعی» (f1: a placed buy-stop, the spread and commission fields) ----
const RP = [0, 190, 1200, 400], RCS = [520, 305, 470, 115];
function tradeArt(t, th) {
  const k = pop(t - T.trade - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 980, x = -490, y = -480, h = shot('f-placed', RP, x, y, w);
    ringIn(RP, [968, 396, 118, 32], x, y, w, cub(k01(t, ws(70), 0.3)), SKY);
    ringIn(RP, [968, 458, 118, 32], x, y, w, cub(k01(t, ws(73), 0.3)), R);
    popIn(t, ws(70) + 0.05, () => chip('ورود', 0, 0, 34, WHITE, SKY), 300, y + h + 70);
    popIn(t, ws(73) + 0.05, () => chip('حد ضرر', 0, 0, 34, WHITE, R), 80, y + h + 70);
    const kc = pop(t - ws(77) + 0.1, 12, 0.6); if (kc > 0) at(0, (1 - cl(kc)) * 60, 1, cl(kc), () => { const w2 = 900, y2 = y + h + 170, h2 = shot('c-session', RCS, -450, y2, w2);
      ringIn(RCS, [790, 370, 104, 40], -450, y2, w2, cub(k01(t, ws(78), 0.3)), VIO); ringIn(RCS, [572, 370, 102, 40], -450, y2, w2, cub(k01(t, ws(80), 0.3)), VIO);
      note('صفحه‌ی واقعی بک‌تست‌لب · اسپرد ۳ پیپ، کمیسیون ۷ دلار', y2 + h2 + 50, MP); });
  });
}
// ---- «بازار جلو می‌ره و می‌بینی اون تصمیم چی از آب درمیاد» (f1: the trade playing out) ----
const RG = [0, 190, 1200, 560], GK = ['g02', 'g04', 'g06', 'g08', 'g10', 'g12', 'g14', 'g16', 'g18', 'g20', 'g22', 'g24', 'g26', 'g28', 'g30'];
function forwardArt(t, th) {
  const k = pop(t - T.forward - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 1000, x = -500, y = -300, h = shot(FLIP(t, T.forward, ws(96), GK), RG, x, y, w);
    popIn(t, ws(91), () => chip('نتیجه‌ی تصمیمت', 0, 0, 40, INKD, LIME), 0, y + h + 90);
    note('صفحه‌ی واقعی بک‌تست‌لب · بازپخش، معامله‌ی ثبت‌شده', y - 60, 'rgba(255,255,255,0.75)');
  });
}
// ---- «بعد یه تصمیم دیگه، و یکی دیگه»: a wall of decisions ----
function againArt(t, th) {
  const t0 = ws(99) - 0.1, t1 = ws(103) + 0.4, N = 30;
  for (let i = 0; i < N; i++) { const ti = t0 + (t1 - t0) * Math.sqrt(i / N), k = pop(t - ti, 15, 0.55); if (k <= 0) continue;
    const c = i % 6, r = Math.floor(i / 6), x = 375 - c * 150, y = -330 + r * 160, ok = rnd(i * 3.7) > 0.45;
    at(x, y, cl(k, 0, 1.25), cl(k), () => { rrect(-62, -62, 124, 124, 28, WHITE); if (ok) { cv.save(); cv.strokeStyle = G; cv.lineWidth = 14; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-26, 2); cv.lineTo(-6, 22); cv.lineTo(28, -20); cv.stroke(); cv.restore(); } else { line(-22, -22, 22, 22, R, 14); line(22, -22, -22, 22, R, 14); } }); }
}
// ---- «آخرش یه چیزی دستته که هیچ سیگنال‌فروشی بهت نمی‌ده»: a gift ----
function giftBox(t, open) {
  const lid = cub(cl(open)), wob = open > 0 ? 0 : 0.05 * Math.sin(t * 9) * (Math.sin(t * 2.3) > 0.3 ? 1 : 0);
  at(0, 0, 1, 1, () => {
    if (open > 0) { cv.save(); cv.globalAlpha *= lid; cv.save(); cv.rotate(t * 0.5); for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; line(Math.cos(a) * 200, -120 + Math.sin(a) * 200, Math.cos(a) * 420, -120 + Math.sin(a) * 420, 'rgba(255,255,255,0.75)', 14); } cv.restore(); cv.restore(); }
    rrect(-200, -40, 400, 260, 24, VIO); rrect(-26, -40, 52, 260, 0, LIME);
    at(0, -40 - lid * 260, 1, 1 - lid * 0.9, () => { rrect(-224, -70, 448, 80, 20, '#5634E0'); rrect(-26, -70, 52, 80, 0, LIME); cv.fillStyle = LIME; cv.beginPath(); cv.ellipse(-40, -78, 44, 24, -0.4, 0, Math.PI * 2); cv.ellipse(40, -78, 44, 24, 0.4, 0, Math.PI * 2); cv.fill(); }, lid * 0.5 + wob);
  });
}
function giftArt(t, th) {
  const k = pop(t - T.gift - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, -40, cl(k, 0, 1.15), cl(k), () => giftBox(t, 0));
  const kc = pop(t - ws(110) + 0.05, 13, 0.55); if (kc > 0) at(0, 380, cl(kc, 0, 1.2), cl(kc), () => { const s = 'سیگنال‌فروشی', w = chip(s, 0, 0, 44, WHITE, INKD); const kx = cub(k01(t, ws(113), 0.3)); if (kx > 0) line(w / 2 - 20, 2, w / 2 - 20 - (w - 40) * kx, 2, R, 10); });
}
// ---- «تجربه‌ی خودت»: the gift opens ----
function expArt(t, th) {
  const open = k01(t, ws(115) - 0.05, 0.45);
  at(0, 40, 1, 1, () => giftBox(t, open));
  const km = pop(t - ws(115) - 0.15, 10, 0.5); if (km > 0) at(0, -280 - cl(km) * 40, cl(km, 0, 1.2), cl(km), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 40; circle(0, 0, 150, INKD); cv.restore(); circle(0, 0, 124, null, LIME, 8); txt('تجربه', 0, 8, 64, LIME); });
  popIn(t, ws(116), () => chip('مال خودت', 0, 0, 46, WHITE, VIO), 0, 400, 0.5);
}
// ---- «شروعش رایگانه، لینکش توی بیوئه» ----
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  if (IMG.icon) at(0, -300, cl(k, 0, 1.2), cl(k), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; cv.drawImage(IMG.icon, -120, -120, 240, 240); });
  popIn(t, ws(118), () => chip('شروع رایگان', 0, 0, 68, INKD, LIME), 0, -20, 0.55, -0.03);
  popIn(t, ws(119), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-270, -72, 540, 144, 72, WHITE); cv.restore(); txt('لینک توی بیو', 0, 4, 62, VIO); }, 0, 190, 0.6);
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1250, 1], groups: [
      { at: 0, lines: [L_(300, 110, WHITE, [['تاحالا', [0, 1]]]), L_(460, 150, LIME, [['بک‌تست‌لب', [2, 3]]]), L_(620, 110, WHITE, [['به', 4], ['گوشت', 5], ['خورده؟', 6, { hl: R, ht: WHITE }]])] }] },
    { k: 'intro', bg: VIO, wipe: 'iris', art: 'intro', kpos: [CX, 1230, 1], groups: [
      { at: 7, lines: [L_(260, 92, WHITE, [['اگه', 7], ['نه،', 8]]), L_(380, 96, WHITE, [['پس', 9], ['بذار', 10], ['بهت', 11], ['بگم', 12]]), L_(510, 110, WHITE, [['چیه', 13, { hl: LIME, ht: INKD }]])] },
      { at: 14, lines: [L_(300, 104, WHITE, [['و', 14], ['چه', 15], ['کارایی', 16, { c: LIME }]]), L_(440, 104, WHITE, [['از', 17], ['دستش', 18], ['برمیاد.', 19]])] }] },
    { k: 'nots', bg: INKD, wipe: 'right', art: 'nots', kpos: [CX, 1230, 1], groups: [
      { at: 20, lines: [L_(320, 120, WHITE, [['اول', 20], ['بگم', 21]]), L_(480, 150, WHITE, [['چی', 22], ['نیست', 23, { hl: R, ht: WHITE }]])] }] },
    { k: 'signal', bg: PAPER, wipe: 'up', art: 'list', kpos: [CX, 1210, 1.14], groups: [
      { at: 24, lines: [L_(360, 130, INKP, [['سیگنال', 24, { c: VIO }], ['نمی‌فروشه،', [25, 26], { hl: R, ht: WHITE }]])] },
      { at: 27, lines: [L_(300, 110, INKP, [['آینده', 27, { c: VIO }], ['رو', 28]]), L_(440, 110, INKP, [['پیش‌بینی', 29], ['نمی‌کنه،', [30, 31], { hl: R, ht: WHITE }]])] },
      { at: 32, lines: [L_(300, 116, INKP, [['قول', 32], ['سود', 33, { c: VIO }], ['هم', 33]]), L_(450, 120, INKP, [['نمی‌ده.', [34, 35], { hl: R, ht: WHITE }]])] }] },
    { k: 'one', bg: LIME, wipe: 'right', art: 'one', kpos: [CX, 1250, 1], groups: [
      { at: 36, lines: [L_(300, 120, INKD, [['فقط', 36], ['یه', 37, { hl: INKD, ht: LIME }], ['کار', 38]]), L_(440, 104, INKD, [['می‌کنه،', [39, 40]]])] },
      { at: 41, lines: [L_(380, 140, INKD, [['اونم', 41], ['درست.', 42, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'market', bg: INKD, wipe: 'up', art: 'market', kpos: [CX, 1260, 1], groups: [
      { at: 43, lines: [L_(250, 100, WHITE, [['بازار', 43], ['واقعی', 44, { hl: LIME, ht: INKD }], ['رو', 45]]), L_(380, 104, WHITE, [['از', 46], [fa(2015), [47, 50], { c: LIME }], ['تا', 51], ['امروز', 52, { hl: VIO, ht: WHITE }]]), L_(510, 96, WHITE, [['جلوت', 53], ['می‌ذاره،', [54, 55]]])] }] },
    { k: 'blind', bg: VIO, wipe: 'left', art: 'blind', kpos: [CX, 1290, 1], groups: [
      { at: 56, lines: [L_(270, 100, WHITE, [['بدون', 56], ['اینکه', [57, 58]], ['بذاره', 59]]), L_(410, 116, WHITE, [['آینده', 60, { hl: LIME, ht: INKD }], ['رو', 61], ['ببینی،', 62]])] }] },
    { k: 'you', bg: LIME, wipe: 'iris', art: 'you', kpos: [CX, 1260, 1], groups: [
      { at: 63, lines: [L_(250, 92, INKD, [['و', 63], ['می‌گه:', [64, 65]]]), L_(390, 130, INKD, [['حالا', 66], ['تو', 67, { hl: INKD, ht: LIME }]]), L_(540, 110, INKD, [['تصمیم', 68, { hl: VIO, ht: WHITE }], ['بگیر.', 69]])] }] },
    { k: 'trade', bg: PAPER, wipe: 'up', art: 'trade', kpos: [CX, 1330, 1], groups: [
      { at: 70, lines: [L_(240, 92, INKP, [['وارد', 70, { c: SKY }], ['می‌شی،', [71, 72]]]), L_(355, 92, INKP, [['حد', 73, { c: R }], ['ضرر', 74, { c: R }], ['می‌ذاری،', [75, 76]]]), L_(470, 92, INKP, [['با', 77], ['اسپرد', 78, { c: VIO }], ['و', 79], ['کمیسیون', 80, { c: VIO }]]), L_(590, 104, INKP, [['واقعی.', 81, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'forward', bg: INKD, wipe: 'right', art: 'forward', kpos: [CX, 1250, 1], groups: [
      { at: 82, lines: [L_(250, 100, WHITE, [['بازار', 82], ['جلو', 83, { c: LIME }], ['می‌ره', [84, 85]]]), L_(380, 92, WHITE, [['و', 86], ['می‌بینی', [87, 88]], ['اون', 89], ['تصمیم', 90, { hl: LIME, ht: INKD }]]), L_(510, 96, WHITE, [['چی', 91], ['از', 92], ['آب', 93], ['درمیاد.', [94, 96]]])] }] },
    { k: 'again', bg: VIO, wipe: 'left', art: 'again', kpos: [CX, 1250, 1], groups: [
      { at: 97, lines: [L_(280, 104, WHITE, [['بعد', 97], ['یه', 98], ['تصمیم', 99, { hl: LIME, ht: INKD }], ['دیگه،', 100]]), L_(430, 110, WHITE, [['و', 101], ['یکی', 102], ['دیگه.', 103, { c: LIME }]])] }] },
    { k: 'gift', bg: PAPER, wipe: 'up', art: 'gift', kpos: [CX, 1230, 1], groups: [
      { at: 104, lines: [L_(240, 96, INKP, [['آخرش', 104], ['یه', 105], ['چیزی', 106]]), L_(360, 110, INKP, [['دستته', 107, { hl: VIO, ht: WHITE }]]), L_(490, 86, INKP, [['که', 108], ['هیچ', 109], ['سیگنال‌فروشی', [110, 111], { c: R }], ['بهت', 112], ['نمی‌ده:', [113, 114]]])] }] },
    { k: 'exp', bg: LIME, wipe: 'iris', art: 'exp', kpos: [CX, 1250, 1], groups: [
      { at: 115, lines: [L_(330, 150, INKD, [['تجربه‌ی', 115]]), L_(500, 160, INKD, [['خودت.', 116, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'cta', bg: VIO, wipe: 'right', art: 'cta', kpos: [CX, 1250, 1], groups: [
      { at: 117, lines: [L_(320, 130, WHITE, [['شروعش', 117], ['رایگانه؛', 118, { hl: LIME, ht: INKD }]]), L_(470, 100, WHITE, [['لینکش', 119], ['توی', 120], ['بیوئه.', 121]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, intro: introArt, nots: notsArt, list: listArt, one: oneArt, market: marketArt, blind: blindArt, you: youArt, trade: tradeArt,
    forward: forwardArt, again: againArt, gift: giftArt, exp: expArt, cta: ctaArt, end: endArtK },
  shakes: [[ws(23), 12], [ws(37), 10], [ws(115), 8]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('تاحالا', CX, 290, 110, WHITE); txt('بک‌تست‌لب', CX, 450, 160, LIME);
    const s = 'به گوشت خورده؟', size = 110, w = measure(s, size); cv.save(); cv.translate(CX, 620); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, R); cv.restore(); txt(s, CX, 620, size, WHITE);
    at(CX, 1180, 1, 1, () => hookArt(1.2, THEME.ink));
    at(CX, 1720, 1, 1, () => chip('اول بگم چی نیست…', 0, 0, 52, INKD, LIME));
  },
});
