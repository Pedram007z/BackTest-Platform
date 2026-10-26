// k1 · «حتماً تا حالا یه بارم که شده با خودت گفتی، پراپ تریدرها چطوری به برداشت رسیدن؟», the kinetic look (u-kit).
// The symbols: the road to a payout, a «secret strategy» stamped «نیست», a line that never breaks the rule's floor, the
// two rule gauges, a challenge account burning through its floor (an example), the challenge fee waiting for a test,
// the real example's equity curve with its deepest drawdown and its 14-loss streak, that same sequence replayed at four
// risk levels against a «مثلاً ۱۰٪» limit (data.py), the real BacktestLab screens (a session with a challenge-sized
// balance, the replay, the analytics' Monte Carlo drawdown), pass-then-buy, the «پراپ» comment and the DM.
const EX = D.ex, EQK = EX.eq, faD = (s) => fa(s).replace(/\./g, '٫');
const mixC = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], cl(k)))).join(',')})`; };
function card(x, y, w, h, th, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, th.card); cv.restore(); rrect(x, y, w, h, r, null, th.rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }
function stamp(s, x, y, size, col, k, rot = -0.14) { if (k <= 0) return; at(x, y, lerp(1.7, 1, cl(k)), cl(k * 2), () => { const w = measure(s, size) + size * 0.9; rrect(-w / 2, -size * 0.75, w, size * 1.5, size * 0.25, rgba(col, 0.1), col, Math.max(6, size * 0.07)); txt(s, 0, size * 0.04, size, col); }, rot); }
/** A crop (CSS px of the 1440×900 capture) of a real screen, drawn into the box [x, y, w] with rounded corners. */
function crop(key, r, x, y, w, a = 1) { const im = IMG[key]; if (!im || a <= 0) return 0; const s = im.width / 1440, h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.roundRect(x, y, w, h, 18); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }

// ---- the road to a payout ----
function hookArt(t, th) {
  card(-420, -330, 840, 640, th); txt('مسیر یه پراپ تریدر', 0, -265, 40, th.cardMut, { w: 700 });
  const steps = [['چالش · مرحله‌ی ۱', 0.5], ['چالش · مرحله‌ی ۲', 1.3], ['حساب فاند', 2.1], ['برداشت سود', ws(14)]];
  steps.forEach(([s, t0], i) => {
    const y = -170 + i * 125, k = pop(t - t0, 14, 0.55), last = i === 3;
    if (i < 3) { const kl = cub(k01(t, t0 + 0.1, 0.5)); line(300, y + 40, 300, y + 85, th.rule, 6); if (kl > 0) line(300, y + 40, 300, y + 40 + 45 * kl, G, 6); }
    circle(300, y, 38, th.soft); txt(s, 230, y + 2, last ? 54 : 46, last && k > 0 ? (th === THEME.ink ? LIME : G) : th.cardInk, { align: 'right', alpha: k > 0 ? 1 : 0.35 });
    check(300, y, 38, last ? (th === THEME.ink ? LIME : G) : G, k);
  });
  const kc = t - ws(14); if (kc > 0) for (let j = 0; j < 14; j++) { const a = rnd(j) * Math.PI * 2, v = 260 + 320 * rnd(j + 5), x = -260 + Math.cos(a) * v * kc, y = 205 + Math.sin(a) * v * kc - 60 * kc + 420 * kc * kc, al = cl(1 - kc / 1.4);
    if (al > 0) at(x, y, 1, al, () => { circle(0, 0, 26, '#E8C25A'); txt('$', 0, 2, 32, INKD, { dir: 'ltr' }); }, kc * 4 * (rnd(j + 2) - 0.5)); }
}
// ---- the «secret strategy» that isn't ----
function secretArt(t, th) {
  const k = pop(t - T.secret - 0.1, 12, 0.55), ks = pop(t - ws(20) + 0.02, 16, 0.45), dim = ks > 0 ? 0.55 : 1;
  at(0, 20, lerp(0.85, 1, cl(k)), cl(k) * dim, () => {
    const g = cv.createLinearGradient(-230, -170, 230, 230); g.addColorStop(0, '#7B5CFF'); g.addColorStop(1, '#3A1FB8');
    cv.save(); cv.shadowColor = rgba(VIO, 0.5); cv.shadowBlur = 60; rrect(-230, -110, 460, 330, 34, g); cv.restore();
    rrect(-250, -170, 500, 90, 26, '#5634E0'); rrect(-40, -110, 80, 60, 12, '#E8C25A');
    txt('؟', 0, 80, 200, rgba(WHITE, 0.9 + 0.1 * Math.sin(t * 5)));
    for (let j = 0; j < 6; j++) { const a = j + t * 1.2, x = Math.cos(a) * 300, y = Math.sin(a * 1.3) * 200 - 20; at(x, y, 0.6 + 0.4 * rnd(j), 0.7, () => { cv.fillStyle = j % 2 ? '#E8C25A' : VIO; cv.beginPath(); for (let q = 0; q < 8; q++) { const rr = q % 2 ? 9 : 24; cv.lineTo(Math.cos((q * Math.PI) / 4) * rr, Math.sin((q * Math.PI) / 4) * rr); } cv.fill(); }); }
  });
  at(0, -260, 1, cl(k) * dim, () => chip('استراتژی مخفی', 0, 0, 40, th.cardInk, th.card, { stroke: th.rule }));
  stamp('نیست', 0, 40, 150, R, ks);
}
// ---- a line that never breaks the rule ----
function rulesArt(t, th) {
  const fy = 220, k = cub(k01(t, ws(21), ws(28) - ws(21) + 0.3)), pts = [];
  for (let i = 0; i <= 120; i++) { const x = -420 + i * 7, b = Math.abs(Math.sin(i * 0.11)) * 230 + 25 + 40 * Math.sin(i * 0.37); pts.push([x, fy - b - i * 1.1]); }
  line(-440, fy, 440, fy, LIME, 8); txt('قانون چالش', 330, fy + 50, 38, LIME, { w: 800 });
  cv.save(); cv.shadowColor = rgba(WHITE, 0.6); cv.shadowBlur = 16; const end = trace(pts, k, WHITE, 8); cv.restore(); if (k > 0) circle(end[0], end[1], 12, WHITE);
  [26, 34, 77].forEach((i, j) => { const kk = pop(t - (ws(21) + (j + 1) * 0.55), 16, 0.5); if (kk > 0 && k * 120 > i) check(pts[i][0], fy - 4, 22, G, kk); });
  const ks = pop(t - ws(27), 13, 0.5); if (ks > 0) at(0, fy + 140, cl(ks, 0, 1.2), cl(ks), () => chip('هیچ‌وقت شکسته نمی‌شه', 0, 0, 38, INKD, LIME));
}
// ---- the two rules ----
function gauge(x, y, label, t0, t, th, hard) {
  const k = pop(t - t0, 12, 0.55); if (k <= 0) return;
  at(x, y, lerp(0.85, 1, cl(k)), cl(k), () => {
    card(-200, -210, 400, 380, th, 30);
    const zones = [[G, 0, 0.55], [AMB, 0.55, 0.8], [R, 0.8, 1]];
    zones.forEach(([c, a, b]) => { cv.save(); cv.strokeStyle = c; cv.lineWidth = 34; cv.beginPath(); cv.arc(0, 40, 140, Math.PI + a * Math.PI, Math.PI + b * Math.PI); cv.stroke(); cv.restore(); });
    const v = cub(k01(t, t0 + 0.2, 1.1)) * (hard ? 0.9 : 0.78) + 0.03 * Math.sin(t * 9) * cl(t - t0 - 1.3), a = Math.PI + v * Math.PI;
    line(0, 40, Math.cos(a) * 118, 40 + Math.sin(a) * 118, th.cardInk, 10); circle(0, 40, 18, th.cardInk);
    txt(label, 0, 120, 38, th.cardInk);
  });
}
function limitsArt(t, th) { gauge(220, 0, 'حد ضرر روزانه', ws(29), t, th, false); gauge(-220, 0, 'حداکثر افت حساب', ws(32), t, th, true); }
// ---- a bad day burns the challenge (an example) ----
function burnArt(t, th) {
  const kb = pop(t - ws(42), 14, 0.5), burn = cub(k01(t, ws(42), 0.8));
  card(-420, -320, 840, 640, th); txt('حساب چالش · نمونه', 330, -262, 34, th.cardMut, { align: 'right', w: 700 });
  const v = 100000 - 10400 * cub(k01(t, ws(37), ws(42) - ws(37) + 0.2)); txt(`$${Math.round(v).toLocaleString('en-US')}`, -330, -262, 46, v < 90200 ? R : th.cardInk, { align: 'left', dir: 'ltr' });
  const fy = 170; line(-380, fy, 380, fy, R, 5, [16, 12]); txt('حد مجاز (مثلاً ۱۰٪)', 330, fy + 40, 30, R, { align: 'right', w: 800 });
  const pts = []; for (let i = 0; i <= 60; i++) { const x = -380 + i * 12.7, base = i < 34 ? -120 + 30 * Math.sin(i * 0.5) + i * 1.5 : -70 + (i - 34) * 11 + 10 * Math.sin(i); pts.push([x, base]); }
  const k = cub(k01(t, T.burn + 0.1, ws(42) - T.burn)); const e = trace(pts, k, mixC('#FFFFFF', R, k01(t, ws(38), 0.6)), 8); if (k > 0) circle(e[0], e[1], 12, R);
  if (burn > 0) { const g = cv.createLinearGradient(0, 320, 0, -320); g.addColorStop(0, `rgba(255,90,20,${0.55 * burn})`); g.addColorStop(0.5, `rgba(120,20,10,${0.35 * burn})`); g.addColorStop(1, 'rgba(0,0,0,0)'); cv.save(); cv.beginPath(); cv.roundRect(-420, -320, 840, 640, 36); cv.clip(); cv.fillStyle = g; cv.fillRect(-420, -320, 840, 640); cv.restore();
    for (let j = 0; j < 26; j++) { const life = (t * 0.9 + rnd(j)) % 1, x = -400 + 800 * rnd(j + 3) + 30 * Math.sin(t * 3 + j), y = 320 - life * 700; circle(x, y, 4 + 6 * rnd(j + 7), `rgba(255,${120 + 100 * rnd(j)},40,${burn * (1 - life)})`); } }
  stamp('چالش رد شد', 0, -20, 96, R, kb);
}
// ---- the fee waits for a test ----
function thoseArt(t, th) {
  const k = pop(t - T.those - 0.1, 12, 0.55); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    card(-380, -300, 760, 560, th); txt('خرید چالش', 0, -235, 44, th.cardInk);
    txt('هزینه‌ی چالش', 250, -120, 36, th.cardMut, { align: 'right', w: 700 }); txt('$ ؟', -250, -120, 60, th.cardInk, { align: 'left', dir: 'ltr' }); line(-300, -60, 300, -60, th.rule, 2);
    const hover = cub(k01(t, ws(49), ws(53) - ws(49))), held = t > ws(53);
    rrect(-300, 30, 600, 120, 60, held ? mixC('#100C1C', '#6C47FF', 0.5 + 0.5 * Math.sin(t * 6)) : INKD); txt('پرداخت', 0, 92, 54, WHITE);
    cursor(lerp(320, 40, hover), lerp(260, 110, hover), 1.1);
    const kp = pop(t - ws(55), 13, 0.5); if (kp > 0) at(0, 200, cl(kp, 0, 1.2), cl(kp), () => chip('اول تست', 0, 0, 40, LIME, INKD));
  });
}
// ---- the real example: the deepest drawdown and the longest losing streak ----
function knowArt(t, th) {
  card(-440, -340, 880, 700, th); txt(`نمونه: یه قانون ساده روی طلای ۴ ساعته · ${fa(EX.n)} معامله‌ی واقعی`, 0, -290, 28, th.cardMut, { w: 700 });
  const box = [-400, -240, 400, 90], lo = Math.min(...EQK), hi = Math.max(...EQK), X = (i) => lerp(box[0], box[2], i / (EQK.length - 1)), Y = (v) => lerp(box[3], box[1], (v - lo) / (hi - lo));
  const k = cub(k01(t, T.know - 0.1, 0.9)), pts = EQK.map((v, i) => [X(i), Y(v)]);
  trace(pts, k, VIO, 5);
  const kd = cub(k01(t, ws(59), 0.5)); if (kd > 0) { const p0 = Math.round(EX.ddPeak / EX.step), p1 = Math.round(EX.ddTrough / EX.step), x0 = X(p0), x1 = X(p1), y0 = Y(EQK[p0]), y1 = Y(EQK[p1]);
    cv.save(); cv.globalAlpha *= kd; rrect(x0, y0, x1 - x0, y1 - y0, 6, rgba(R, 0.14)); line(x0, y0, x1, y0, R, 4, [10, 8]); line(x1 + 30, y0, x1 + 30, y1, R, 6); line(x1 + 18, y0, x1 + 42, y0, R, 6); line(x1 + 18, y1, x1 + 42, y1, R, 6);
    chip(`بدترین افت: ${faD(EX.dd)}R`, (x0 + x1) / 2, y1 + 50, 30, WHITE, R); cv.restore(); }
  const ks = t - ws(63); if (ks > -0.2) { txt(`${fa(EX.streak)} ضرر پشت سر هم`, 0, 200, 40, R, { alpha: cl((ks + 0.2) / 0.3) });
    for (let j = 0; j < EX.streak; j++) { const st = ws(64) + (j * (ws(71) - ws(64))) / EX.streak, kk = pop(t - st, 18, 0.55), x = 370 - j * 56; if (kk > 0) at(x, 280, cl(kk, 0, 1.2), 1, () => { rrect(-22, -22, 44, 44, 9, R); line(-8, -8, 8, 8, WHITE, 5); line(8, -8, -8, 8, WHITE, 5); }); else rrect(x - 22, 258, 44, 44, 9, null, th.rule, 2); } }
}
// ---- the same trades at four risk levels against a 10% limit ----
function riskArt(t, th) {
  const L = EX.ladder, times = [T.risk, ws(77), ws(81), ws(84)];
  let i = 0; times.forEach((x, j) => { if (t >= x) i = j; });
  const kk = cub(k01(t, times[i], 0.45)), prev = L[Math.max(0, i - 1)][1], dd = i === 0 ? L[0][1] * cub(k01(t, T.risk, 0.6)) : lerp(prev, L[i][1], kk), ok = dd <= 10;
  card(-430, -340, 860, 700, th); txt('ریسک هر معامله', 260, -275, 38, th.cardMut, { w: 700 }); txt(`${faD(L[i][0])}٪`, 260, -195, 110, LIME, { glow: rgba(LIME, 0.4) });
  L.forEach(([r], j) => chip(`${faD(r)}٪`, 330 - j * 110, -100, 30, j === i ? INKD : th.cardMut, j === i ? LIME : th.soft));
  const base = -260, px = 8.2, h = dd * px, fy = base + 10 * px;
  rrect(-330, base, 200, h, 18, ok ? G : R); txt(`افت: ${faD(dd.toFixed(1))}٪`, -230, base + h + 50, 44, ok ? G : R);
  line(-400, fy, 40, fy, AMB, 5, [14, 10]); txt('حد مجاز (مثلاً ۱۰٪)', -400, fy - 30, 28, AMB, { align: 'left', w: 800 });
  if (i === 3) check(-230, base + h + 120, 34, G, pop(t - times[3] - 0.3, 13, 0.5));
  txt(`همون ${fa(EX.n)} معامله، با ریسک‌های مختلف`, 0, 315, 28, th.cardMut, { w: 700 });
}
// ---- BacktestLab: a session with the challenge's balance ----
function brandArtK(t, th) {
  const k = pop(t - T.brand - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.88, 1, cl(k)), cl(k), () => {
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.35)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(-420, -300, 840, 580, 30, '#15121F'); cv.restore();
    crop('k-session', [690, 112, 310, 78], -390, -260, 780);                 // «نام جلسه»: چالش پراپ · ۱۰۰ هزار دلاری
    const kb = cub(k01(t, ws(95) - 0.15, 0.4)), y = lerp(-40, -50, kb), h = crop('k-session', [690, 200, 310, 88], -390, y, 780);   // «موجودی حساب»: 100000
    if (kb > 0) { cv.save(); cv.globalAlpha *= kb; cv.shadowColor = rgba(LIME, 0.8); cv.shadowBlur = 22; rrect(-398, y + h * 0.42, 796, h * 0.6, 16, null, LIME, 6); cv.restore(); }
    if (IMG.icon) cv.drawImage(IMG.icon, 345, -350, 70, 70);
    txt('صفحه‌ی واقعی بک‌تست‌لب', 0, 230, 30, 'rgba(255,255,255,0.7)', { w: 700 });
  });
}
// ---- the replay, the future covered ----
function replayArt(t, th) {
  const keys = []; for (let i = 2; i <= 40; i += 2) keys.push('d-' + String(i).padStart(3, '0'));
  const k = cub(k01(t, T.replay - 0.1, 0.4)), j = Math.min(keys.length - 1, Math.floor(cl((t - T.replay) / (T.analytics - 0.4 - T.replay)) * keys.length));
  cv.save(); cv.globalAlpha *= k; cv.shadowColor = 'rgba(0,0,0,0.5)'; cv.shadowBlur = 50; rrect(-440, -280, 880, 560, 28, '#15121F'); cv.restore();
  cv.save(); cv.globalAlpha *= k; const h = crop(keys[j], [55, 195, 1135, 640], -425, -265, 850);
  const kf = cub(k01(t, ws(103), 0.4)); if (kf > 0) { const x = -425 + ((1081 - 55) / 1135) * 850; cv.globalAlpha *= kf; line(x, -265, x, -265 + h, LIME, 4, [10, 8]); at(x - 70, -150, 1, 1, () => chip('آینده؟', 0, 0, 30, INKD, LIME)); }
  cv.restore();
}
// ---- analytics: the Monte Carlo drawdown ----
function analyticsArt(t, th) {
  const k = pop(t - T.analytics - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.88, 1, cl(k)), cl(k), () => {
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(-430, -300, 860, 620, 30, '#15121F'); cv.restore();
    txt('آنالیز بک‌تست‌لب · شبیه‌سازی مونت‌کارلو', 0, -250, 30, 'rgba(255,255,255,0.75)', { w: 700 });
    const h = crop('k-montecarlo', [328, 617, 264, 72], -380, -170, 760);
    const kr = cub(k01(t, ws(115) - 0.1, 0.35)); if (kr > 0) { cv.save(); cv.globalAlpha *= kr; cv.shadowColor = rgba(VIO, 0.9); cv.shadowBlur = 24; rrect(-392, -182, 784, h + 24, 22, null, '#A48CFF', 5); cv.restore(); }
    txt('از ۴۰۰ مسیر شبیه‌سازی‌شده با معاملات خودت', 0, 150, 34, 'rgba(255,255,255,0.75)', { w: 700 });
    txt('(۱۰ معامله‌ی واقعی توی یه جلسه‌ی آزمایشی)', 0, 205, 28, 'rgba(255,255,255,0.5)', { w: 700 });
  });
}
// ---- pass here, then buy ----
function passArt(t, th) {
  const k1 = pop(t - T.pass_ - 0.1, 12, 0.55), k2 = pop(t - ws(124) - 0.05, 12, 0.55);
  if (k1 > 0) at(210, 0, lerp(0.85, 1, cl(k1)), cl(k1), () => { card(-190, -230, 380, 460, th, 32); txt('۱', 0, -170, 54, th.cardMut); if (IMG.icon) cv.drawImage(IMG.icon, -70, -110, 140, 140); txt('چالش رو', 0, 90, 40, th.cardInk); txt('این‌جا پاس کن', 0, 145, 40, th.cardInk); check(130, -170, 34, G, pop(t - ws(122), 14, 0.5)); });
  if (k2 > 0) { const ka = cub(k01(t, ws(124), 0.4)); cv.save(); cv.globalAlpha *= ka; cv.strokeStyle = INKD; cv.lineWidth = 10; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(10, 0); cv.lineTo(-10 - 20 * ka, 0); cv.moveTo(-10 - 20 * ka + 18, -16); cv.lineTo(-10 - 20 * ka, 0); cv.lineTo(-10 - 20 * ka + 18, 16); cv.stroke(); cv.restore();
    at(-230, 0, lerp(0.85, 1, cl(k2)), cl(k2), () => { card(-190, -230, 380, 460, th, 32); txt('۲', 0, -170, 54, th.cardMut); circle(0, -40, 70, INKD); txt('$', 0, -36, 80, LIME, { dir: 'ltr' }); txt('بعد حساب پراپ', 0, 90, 40, th.cardInk); txt('تهیه کن', 0, 145, 40, th.cardInk); }); }
}
// ---- the comment and the DM ----
function ctaArt(t, th) {
  card(-420, -330, 840, 680, th); txt('کامنت‌ها', 0, -280, 36, th.cardInk); line(-380, -240, 380, -240, th.rule, 2);
  [[-180, 0.7], [-80, 0.5]].forEach(([y, w]) => { circle(350, y, 26, th.soft); rrect(310 - 460 * w, y - 22, 460 * w, 16, 8, th.rule); rrect(310 - 320 * w, y + 8, 320 * w, 14, 7, th.soft); });
  const word = 'پراپ', n = word.length, typed = Math.min(n, Math.floor(cl((t - ws(132) + 0.1) / 0.4) * (n + 0.999))), sent = pop(t - ws(133), 14, 0.5);
  if (sent > 0) at(0, 30, cl(sent, 0, 1.15), cl(sent), () => { rrect(-380, -50, 760, 100, 26, rgba(LIME, 0.14), LIME, 2); circle(330, 0, 30, LIME); txt('تو', 330, 2, 26, INKD); txt(word, 260, 2, 42, LIME, { align: 'right' }); });
  rrect(-380, 230, 760, 90, 45, 'rgba(0,0,0,0.25)', rgba(LIME, typed > 0 && sent <= 0 ? 0.8 : 0.2), 2);
  if (sent <= 0.05) { if (typed > 0) txt(word.slice(0, typed), 330, 277, 42, WHITE, { align: 'right' }); else txt('یه کامنت بنویس…', 330, 277, 32, th.cardMut, { align: 'right' }); }
  circle(-320, 275, 32, typed > 0 ? LIME : th.soft); cv.fillStyle = INKD; cv.beginPath(); cv.moveTo(-308, 275); cv.lineTo(-330, 262); cv.lineTo(-325, 275); cv.lineTo(-330, 288); cv.closePath(); cv.fill();
  const kd = pop(t - ws(139) + 0.1, 12, 0.6); if (kd > 0) at(0, 140 + 40 * (1 - cl(kd)), lerp(0.9, 1, cl(kd)), cl(kd), () => {
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.5)'; cv.shadowBlur = 40; rrect(-360, -95, 720, 190, 30, '#1E1836'); cv.restore();
    if (IMG.icon) cv.drawImage(IMG.icon, 270, -75, 60, 60); txt('دایرکت', 245, -45, 30, WHITE, { align: 'right' });
    rrect(-330, -5, 660, 80, 24, VIO); txt('اینم لینک شروع رایگان', 290, 36, 32, WHITE, { align: 'right' }); if (IMG.word) { const w = 150, h = (w * IMG.word.height) / IMG.word.width; cv.drawImage(IMG.word, -310, 36 - h / 2, w, h); }
  });
}
function endArtK(t, th) {
  const t0 = T.end, ki = pop(t - t0 + 0.05, 12, 0.6); if (ki > 0 && IMG.icon) at(0, -300, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = 70; cv.drawImage(IMG.icon, -150, -150, 300, 300); });
  const kw = cub(k01(t, t0 + 0.2, 0.35)); if (kw > 0 && IMG.word) { const w = 580, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, -w / 2, -100 + (1 - kw) * 24, w, h); cv.restore(); }
  const kc = pop(t - t0 - 0.45, 13, 0.55); if (kc > 0) at(0, 190, cl(kc, 0, 1.2), cl(kc), () => chip('کامنت کن: «پراپ»', 0, 0, 64, INKD, LIME));
  const ks = cub(k01(t, t0 + 0.8, 0.4)); if (ks > 0) txt('لینک شروع رایگان رو دایرکت می‌گیری', 0, 330, 40, MD, { alpha: ks });
}

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1230, 0.95], groups: [
      { at: 0, lines: [L_(330, 92, WHITE, [['حتماً', 0], ['تا', 1], ['حالا', 2], ['یه', 3], ['بارم', 4]]), L_(460, 92, WHITE, [['که', 5], ['شده', 6], ['با', 7], ['خودت', 8], ['گفتی،', 9]])] },
      { at: 10, lines: [L_(330, 150, LIME, [['پراپ', 10], ['تریدرها', 11]]), L_(500, 104, WHITE, [['چطوری', 12], ['به', 13], ['برداشت', 14, { hl: LIME, ht: INKD }], ['رسیدن؟', 15]])] }] },
    { k: 'secret', bg: PAPER, wipe: 'right', art: 'secret', kpos: [CX, 1220, 0.92], groups: [{ at: 16, lines: [L_(380, 110, INKP, [['رازش', 16], ['یه', 17], ['استراتژی', 18]]), L_(550, 130, INKP, [['عجیب', 19], ['نیست.', 20, { hl: R, ht: WHITE }]])] }] },
    { k: 'rules', bg: VIO, wipe: 'iris', art: 'rules', kpos: [CX, 1210, 0.95], groups: [{ at: 21, lines: [L_(330, 100, WHITE, [['رازش', 21], ['اینه', 22], ['که', 23]]), L_(470, 110, LIME, [['قانون‌های', 24], ['چالش', 25], ['رو', 26]]), L_(630, 130, WHITE, [['نمی‌شکنن.', [27, 28], { hl: LIME, ht: INKD }]])] }] },
    { k: 'limits', bg: PAPER, wipe: 'left', art: 'limits', kpos: [CX, 1150, 1], groups: [{ at: 29, lines: [L_(380, 110, INKP, [['حد', 29], ['ضرر', 30, { c: R }], ['روزانه،', 31]]), L_(540, 110, INKP, [['حداکثر', [32, 33]], ['افت', 34, { c: R }], ['حساب،', 35]])] }] },
    { k: 'burn', bg: INKD, wipe: 'up', art: 'burn', kpos: [CX, 1230, 0.95], groups: [{ at: 36, lines: [L_(380, 120, WHITE, [['یه', 36], ['روز', 37], ['بد،', 38, { c: R }]]), L_(550, 110, WHITE, [['و', 39], ['کل', 40], ['چالش', 41], ['می‌سوزه.', [42, 43], { hl: R, ht: WHITE }]])] }] },
    { k: 'those', bg: LIME, wipe: 'right', art: 'those', kpos: [CX, 1210, 0.95], groups: [{ at: 44, lines: [L_(360, 100, INKD, [['اونایی', 44], ['که', 45], ['برداشت', 46, { hl: INKD, ht: LIME }], ['می‌گیرن،', [47, 48]]]), L_(510, 88, INKD, [['قبل', 49], ['از', 50], ['اینکه', [51, 52]], ['پول', 53], ['چالش', 54], ['رو', 55], ['بدن،', 56]])] }] },
    { k: 'know', bg: PAPER, wipe: 'down', art: 'know', kpos: [CX, 1220, 0.95], groups: [
      { at: 57, lines: [L_(350, 104, INKP, [['می‌دونن', [57, 58]], ['بدترین', 59], ['افت', 60, { c: R }]]), L_(500, 104, INKP, [['استراتژیشون', 61], ['چقدره', 62, { hl: VIO, ht: WHITE }]])] },
      { at: 63, lines: [L_(350, 100, INKP, [['و', 63], ['چندتا', [64, 65]], ['ضرر', 66, { c: R }]]), L_(500, 100, INKP, [['پشت', 67], ['سر', 68], ['هم', 69], ['ممکنه', 70], ['بخورن.', 71]])] }] },
    { k: 'risk', bg: INKD, wipe: 'iris', art: 'risk', kpos: [CX, 1230, 0.95], groups: [
      { at: 72, lines: [L_(350, 104, WHITE, [['پس', 72], ['ریسک', 73, { c: LIME }], ['هر', 74], ['معامله', 75], ['رو', 76]]), L_(500, 110, WHITE, [['طوری', 77], ['می‌چینن', [78, 79]]])] },
      { at: 80, lines: [L_(350, 100, WHITE, [['که', 80], ['بدترین', 81], ['روزشون‌هم', 82]]), L_(500, 104, WHITE, [['از', 83], ['قانون', 84, { c: LIME }], ['رد', 85], ['نشه.', 86]])] }] },
    { k: 'brand', bg: VIO, wipe: 'right', art: 'brandK', kpos: [CX, 1180, 0.95], groups: [{ at: 87, lines: [L_(320, 104, WHITE, [['توی', 87], ['بک‌تست‌لب،', [88, 90], { c: LIME }]]), L_(460, 96, WHITE, [['یه', 91], ['حساب', 92], ['با', 93], ['همون', 94]]), L_(600, 104, WHITE, [['موجودی', 95, { hl: LIME, ht: INKD }], ['چالش', 96], ['می‌سازی.', [97, 98]]])] }] },
    { k: 'replay', bg: INKD, wipe: 'up', art: 'replay', kpos: [CX, 1190, 1], groups: [{ at: 99, lines: [L_(330, 104, WHITE, [['بازار', 99], ['واقعی', 100], ['رو', 101]]), L_(470, 104, LIME, [['بدون', 102], ['دیدن', 103], ['آینده', 104, { hl: LIME, ht: INKD }]]), L_(610, 100, WHITE, [['معامله', 105], ['می‌کنی', [106, 107]]])] }] },
    { k: 'analytics', bg: PAPER, wipe: 'left', art: 'analytics', kpos: [CX, 1200, 0.98], groups: [{ at: 108, lines: [L_(350, 104, INKP, [['و', 108], ['آنالیز', 109, { c: VIO }], ['بهت', 110], ['می‌گه', [111, 112]]]), L_(510, 108, INKP, [['حداکثر', [113, 114]], ['افت', 115, { c: R }], ['چند', 116], ['درصده.', 117, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'pass_', bg: LIME, wipe: 'iris', art: 'pass', kpos: [CX, 1200, 1], groups: [
      { at: 118, lines: [L_(350, 110, INKD, [['اول', 118], ['چالش', 119], ['رو', 120]]), L_(510, 120, INKD, [['اینجا', 121], ['پاس', 122, { hl: INKD, ht: LIME }], ['کن،', 123]])] },
      { at: 124, lines: [L_(350, 110, INKD, [['بعد', 124]]), L_(510, 120, INKD, [['حساب', 125], ['تهیه', 126, { hl: INKD, ht: LIME }], ['کن.', 127]])] }] },
    { k: 'cta', bg: VIO, wipe: 'right', art: 'cta', kpos: [CX, 1220, 0.95], groups: [
      { at: 128, lines: [L_(330, 108, WHITE, [['زیر', 128], ['همین', 129], ['ویدیو', 130]]), L_(490, 124, WHITE, [['بنویس', 131], ['«پراپ»', 132, { hl: LIME, ht: INKD }]])] },
      { at: 133, lines: [L_(330, 96, WHITE, [['تا', 133], ['لینک', 134], ['شروع', 135], ['رایگان', 136, { c: LIME }]]), L_(480, 100, WHITE, [['رو', 137], ['برات', 138], ['دایرکت', 139], ['کنم.', 140]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, secret: secretArt, rules: rulesArt, limits: limitsArt, burn: burnArt, those: thoseArt, know: knowArt, risk: riskArt, brandK: brandArtK, replay: replayArt, analytics: analyticsArt, pass: passArt, cta: ctaArt, end: endArtK },
  shakes: [[ws(20), 10], [ws(42), 12]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('پراپ تریدرها', CX, 380, 150, LIME); txt('چطوری به', CX, 560, 110, WHITE);
    const s = 'برداشت رسیدن؟', size = 130, w = measure(s, size); cv.save(); cv.translate(CX, 730); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, LIME); cv.restore(); txt(s, CX, 730, size, INKD);
    at(CX, 1300, 0.85, 1, () => hookArt(ws(14) + 0.3, THEME.ink));
  },
});
