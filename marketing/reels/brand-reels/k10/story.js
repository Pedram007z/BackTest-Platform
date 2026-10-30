// k10 · «سلام، منم، خودِ یک سال بعدت», the default kinetic look (u-kit), on the user's voice.
// A message from your future self runs through the reel: a notification with a calendar counting a year, a typing
// bubble, your «ممنونم» reply, a signed letter. The drawn parts:
//   - a new position with its stop-loss field left empty («بدون حد ضرر»);
//   - a price falling while a dashed hope arrow points back up («برمی‌گرده»), then the fall goes on («برنمی‌گرده»);
//   - an hourglass labelled «بک‌تست» («اتلاف وقته»);
//   - two cards, «قبل» ≠ «الان», that become «=» on «هست»;
//   - fear, greed and a pattern, then the same pattern on a timeline of new dates (labelled «الگوی نمونه»);
//   - a giant «۱», a wallet whose bills fly off («شهریه‌ی گرون»).
// The real platform appears on «روی گذشته‌ی واقعی بازار یاد بگیر»: f1's gold replay (dark theme).
function card(x, y, w, h, fill, rule, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, fill); cv.restore(); if (rule) rrect(x, y, w, h, r, null, rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }
const note = (s, y, col, a = 1) => txt(s, 0, y, 28, col, { w: 700, alpha: a });
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];
function crop(key, r, x, y, w, a = 1) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im || a <= 0) return h; const s = im.width / 1440; cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.roundRect(x, y, w, h, 16); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
function shot(key, r, x, y, w, a = 1) { const h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 12, y - 12, w + 24, h + 24, 26, '#15121F'); cv.restore(); cv.save(); cv.globalAlpha *= a; rrect(x - 12, y - 12, w + 24, h + 24, 26, null, 'rgba(255,255,255,0.1)', 2); cv.restore(); crop(key, r, x, y, w, a); return h; }
function pen(x, y) { at(x, y, 1, 1, () => { cv.fillStyle = LIME; cv.beginPath(); cv.moveTo(0, 0); cv.lineTo(-12, -30); cv.lineTo(12, -30); cv.closePath(); cv.fill(); rrect(-12, -130, 24, 100, 6, LIME); rrect(-12, -130, 24, 22, 6, VIO); cv.save(); cv.strokeStyle = INKD; cv.lineWidth = 3; cv.beginPath(); cv.roundRect(-12, -130, 24, 100, 6); cv.stroke(); cv.restore(); }, -0.5); }
function shadowed(fn, blur = 40, dy = 14, a = 0.25) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }

// ---- shared symbols ----
/** The future self: a person on a violet disc. */
function avatar(r) {
  cv.save(); cv.beginPath(); cv.arc(0, 0, r, 0, Math.PI * 2); cv.clip();
  const g = cv.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#9A7BFF'); g.addColorStop(1, '#5634E0'); cv.fillStyle = g; cv.fillRect(-r, -r, 2 * r, 2 * r);
  circle(0, -r * 0.2, r * 0.3, WHITE); cv.fillStyle = WHITE; cv.beginPath(); cv.arc(0, r * 0.72, r * 0.56, Math.PI, 0); cv.fill(); cv.restore();
}
/** A chat bubble centred on the origin, its tail on the right (side 1) or the left (side −1). */
function bubble(w, h, fill, side = 1) {
  rrect(-w / 2, -h / 2, w, h, 46, fill); cv.fillStyle = fill; cv.beginPath();
  cv.moveTo(side * (w / 2 - 60), h / 2 - 10); cv.lineTo(side * (w / 2 - 6), h / 2 + 30); cv.lineTo(side * (w / 2 - 120), h / 2 - 10); cv.closePath(); cv.fill();
}
/** A desk calendar: «امروز» until t0, then the months run to «یک سال بعد» at t1. */
function calendar(t, t0, t1) {
  const f = cl((t - t0) / (t1 - t0)), m = Math.min(12, 1 + Math.floor(f * 12));
  shadowed(() => rrect(-150, -150, 300, 300, 34, WHITE), 40, 16, 0.4);
  cv.save(); cv.beginPath(); cv.roundRect(-150, -150, 300, 300, 34); cv.clip(); cv.fillStyle = VIO; cv.fillRect(-150, -150, 300, 84); cv.restore();
  circle(-70, -150, 13, INKD); circle(70, -150, 13, INKD); txt('تقویم', 0, -106, 34, WHITE, { w: 800 });
  const s = t < t0 ? 'امروز' : f < 1 ? `${fa(m)} ماه` : 'یک سال بعد', ks = t < t0 ? 1 : f < 1 ? cub(((f * 12) % 1) * 3) : cub(k01(t, t1, 0.25));
  at(0, 42, lerp(1.18, 1, ks), 1, () => txt(s, 0, 0, s.length > 6 ? 50 : 64, f >= 1 ? VIO : INKP));
}
function heart(r, col) { cv.fillStyle = col; cv.beginPath(); cv.moveTo(0, r * 0.9); cv.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.7, -r * 1.3, 0, -r * 0.45); cv.bezierCurveTo(r * 0.7, -r * 1.3, r * 1.6, -r * 0.2, 0, r * 0.9); cv.closePath(); cv.fill(); }
function wallet(bills = 1) {
  if (bills > 0) { cv.save(); cv.globalAlpha *= bills; at(-30, -112, 1, 1, () => rrect(-150, -50, 300, 100, 12, '#13996A'), -0.14); at(10, -100, 1, 1, () => rrect(-150, -50, 300, 100, 12, G), 0.07); cv.restore(); }
  shadowed(() => rrect(-220, -110, 440, 270, 40, '#5634E0'), 50, 18, 0.45);
  rrect(60, -20, 180, 110, 34, VIO); circle(140, 35, 18, LIME);
}
function dashed(pts, k, col, lw, dash = [18, 14]) { cv.save(); cv.setLineDash(dash); const e = trace(pts, k, col, lw); cv.restore(); return e; }
function arrowHead(p, q, col, s = 30) { const a = Math.atan2(q[1] - p[1], q[0] - p[0]); cv.fillStyle = col; cv.beginPath(); cv.moveTo(q[0] + Math.cos(a) * s * 0.4, q[1] + Math.sin(a) * s * 0.4); cv.lineTo(q[0] + Math.cos(a + 2.5) * s, q[1] + Math.sin(a + 2.5) * s); cv.lineTo(q[0] + Math.cos(a - 2.5) * s, q[1] + Math.sin(a - 2.5) * s); cv.closePath(); cv.fill(); }

// ---- «سلام، منم، خودِ یک سال بعدت»: a message arrives, a calendar counts a year ----
function hookArt(t, th) {
  // the calendar: «امروز», then the months run to a year
  const kc = pop(t + 0.1, 12, 0.6); if (kc > 0) at(0, -330, 1.3 * cl(kc, 0, 1.15), cl(kc), () => calendar(t, ws(2) - 0.05, ws(5) + 0.15));
  // the notification
  const kn = pop(t - 0.02, 11, 0.62); if (kn <= 0) return;
  at(0, 170 + (1 - cl(kn)) * 220, 1, cl(kn), () => {
    card(-430, -112, 860, 224, PLATE, 'rgba(255,255,255,0.14)', 48);
    at(330, 0, 1, 1, () => avatar(64));
    const kname = cub(k01(t, ws(2) - 0.1, 0.3));
    txt('خودِ یک سال بعدت', 236, -42, 42, WHITE, { align: 'right', alpha: kname }); if (kname < 1) txt('ناشناس', 236, -42, 42, MD, { align: 'right', alpha: 1 - kname });
    txt('الان', -392, -42, 28, MD, { align: 'left', w: 700 });
    const msg = 'سلام، منم.', km = cub(k01(t, 0.1, ws(1) + 0.3)), mw = measure(msg, 40, 700);
    cv.save(); cv.beginPath(); cv.rect(236 - mw * km - 4, 0, mw * km + 8, 70); cv.clip(); txt(msg, 236, 34, 40, MD, { align: 'right', w: 700 }); cv.restore();
    circle(-380, 34, 12, R);
  });
}
// ---- «می‌دونم امشب داری اون پوزیشن رو بدون حد ضرر باز می‌کنی» ----
const ROWS = [['ورود', -70, 0], ['حجم', 40, 0], ['حد ضرر', 150, 1]];
function tonightArt(t, th) {
  popIn(t, ws(8), () => { shadowed(() => circle(0, 0, 58, '#FFC94D'), 40, 0, 0.2); circle(30, -20, 50, PAPER); [[-90, -40, 10], [-60, 50, 7], [80, 70, 8]].forEach(([x, y, r]) => { cv.save(); cv.translate(x, y); cv.rotate(Math.PI / 4); rrect(-r / 2, -r / 2, r, r, 2, VIO); cv.restore(); }); }, 330, -400, 0.5);
  const k = pop(t - T.tonight - 0.05, 12, 0.6); if (k <= 0) return;
  const press = t >= ws(16) && t < ws(16) + 0.16;
  at(0, (1 - cl(k)) * 60, 1, cl(k), () => {
    card(-400, -290, 800, 600, WHITE, 'rgba(26,20,48,0.1)', 40);
    txt('پوزیشن جدید', 340, -205, 46, INKP, { align: 'right' }); chip('خرید', -290, -205, 36, WHITE, G);
    line(370, -140, -370, -140, 'rgba(26,20,48,0.08)', 2);
    ROWS.forEach(([name, y, sl], i) => {
      const kr = pop(t - T.tonight - 0.2 - i * 0.15, 13, 0.6); if (kr <= 0) return;
      at(0, y, 1, cl(kr), () => {
        txt(name, 340, 2, 40, sl ? R : INKP, { align: 'right' });
        if (!sl) { rrect(-250, -36, 400, 72, 20, '#ECE7FA'); rrect(-220, -8, 170 + i * 50, 16, 8, '#CFC6EE'); check(-320, 0, 30, G, pop(t - T.tonight - 0.35 - i * 0.15, 14, 0.5)); }
        else { const blink = t > ws(13) ? 0.55 + 0.45 * Math.cos((t - ws(13)) * 14) : 0; cv.save(); cv.setLineDash([14, 10]); rrect(-250, -36, 400, 72, 20, rgba(R, 0.06 + 0.1 * blink), t > ws(13) ? R : 'rgba(26,20,48,0.25)', 4); cv.restore();
          txt('—', -50, 0, 48, t > ws(13) ? R : MP); cross(-320, 0, 30, R, pop(t - ws(15), 14, 0.5)); }
      });
    });
    at(0, 240, press ? 0.95 : 1, 1, () => { shadowed(() => rrect(-360, -45, 720, 90, 30, G), 24, 8, 0.2); txt('باز کن', 0, 3, 44, WHITE); });
    if (t >= ws(16) + 0.1) { const kr = cub(k01(t, ws(16) + 0.1, 0.4)); rrect(-360 - 30 * kr, 195 - 30 * kr, 720 + 60 * kr, 90 + 60 * kr, 40, null, rgba(G, 0.6 * (1 - kr)), 6); }
  });
  const ka = cub(k01(t, ws(15) - 0.3, 0.3)), kc = cub(k01(t, ws(15) - 0.1, ws(16) - ws(15) + 0.05));
  if (ka > 0) { cv.save(); cv.globalAlpha *= ka; cursor(lerp(260, 40, kc), lerp(470, 250, kc), 1.0); cv.restore(); }
}
// ---- «چون مطمئنی این بار برمی‌گرده» / «برنمی‌گرده»: the fall, the hope arrow ----
const FALL = [[-380, -190], [-320, -150], [-260, -175], [-190, -90], [-130, -115], [-60, -20], [0, -45], [70, 40], [130, 20], [180, 90]];
const FALL2 = [[180, 90], [235, 60], [285, 170], [330, 150], [385, 285]];
const HOPE = Array.from({ length: 25 }, (_, i) => { const u = i / 24; return [lerp(180, 360, u), 90 - Math.sin(u * Math.PI * 0.5) * 300 + (1 - u) * u * 80]; });
function fallChart(t, th, s) {
  const noP = s.k === 'no', k = noP ? 1 : pop(t - T.sure - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-430, -300, 860, 600, noP ? INKD : PLATE, 'rgba(255,255,255,0.12)', 36);
    for (let i = 1; i < 5; i++) line(-400, -300 + i * 120, 400, -300 + i * 120, 'rgba(255,255,255,0.05)', 2);
    line(-400, -190, 400, -190, rgba(SKY, 0.6), 4, [12, 10]); chip('ورود', 330, -230, 24, WHITE, SKY);
    trace(FALL, noP ? 1 : cub(k01(t, T.sure + 0.05, 1.0)), R, 10);
    if (!noP) {
      const kh = cub(k01(t, ws(23) - 0.05, ws(25) - ws(23) + 0.2));
      if (kh > 0) { const e = dashed(HOPE, kh, LIME, 9); if (kh > 0.9) arrowHead(HOPE[22], HOPE[24], LIME, 34); popIn(t, ws(25), () => { circle(0, 0, 26, rgba(LIME, 0.3)); circle(0, 0, 12, LIME); }, e[0], e[1]); }
    } else {
      const kd = cub(k01(t, ws(26) - 0.05, 0.7)), e = trace(FALL2, kd, R, 12); circle(e[0], e[1], 14, R);
      const kf = k01(t, ws(27), 0.6);   // the hope arrow falls away
      if (kf < 1) at(180, 90 + 420 * kf * kf, 1, 1 - kf, () => { at(-180, -90, 1, 1, () => { dashed(HOPE, 1, kf > 0 ? MD : LIME, 9); arrowHead(HOPE[22], HOPE[24], kf > 0 ? MD : LIME, 34); }); }, kf * 0.9);
    }
  });
}
// ---- «می‌دونم فکر می‌کنی بک‌تست اتلاف وقته»: an hourglass ----
function wasteArt(t, th) {
  const k = pop(t - T.waste - 0.05, 12, 0.6); if (k <= 0) return;
  const f = cl((t - T.waste) / (T.changed - T.waste + 0.3)), hw = (y) => 120 * Math.abs(y) / 230;
  at(0, -20, cl(k, 0, 1.15), cl(k), () => {
    const yt = lerp(-190, -14, f); cv.fillStyle = VIO; cv.beginPath(); cv.moveTo(-hw(yt), yt); cv.lineTo(hw(yt), yt); cv.lineTo(0, -6); cv.closePath(); if (f < 1) cv.fill();
    const hb = 160 * f; cv.beginPath(); cv.moveTo(-112, 226); cv.lineTo(112, 226); cv.lineTo(0, 226 - hb); cv.closePath(); cv.fill();
    if (f < 1) line(0, -6, 0, 226 - hb, VIO, 6);
    cv.save(); cv.strokeStyle = INKD; cv.lineWidth = 10; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-124, -232); cv.lineTo(124, -232); cv.lineTo(14, 0); cv.lineTo(124, 232); cv.lineTo(-124, 232); cv.lineTo(-14, 0); cv.closePath(); cv.stroke(); cv.restore();
    rrect(-160, -270, 320, 40, 14, INKD); rrect(-160, 230, 320, 40, 14, INKD);
  }, 0.06 * Math.sin(t * 2.2));
  popIn(t, ws(34), () => chip('بک‌تست', 0, 0, 46, LIME, INKD), 0, 360, 0.55, -0.03);
  popIn(t, ws(36), () => { shadowed(() => circle(0, 0, 76, VIO), 30, 10, 0.25); txt('؟', 0, 8, 100, WHITE); }, 250, -230, 0.5, 0.12);
}
// ---- «چون بازار دیگه مثل قبل نیست» / «هست»: before and now ----
const PAT = [[-130, 70], [-95, 10], [-60, 40], [-25, -60], [10, 0], [45, -70], [80, 10], [130, -30]];
function twoCards(t, th, s) {
  const still = s.k === 'still', mv = still ? cub(k01(t, T.still, 0.4)) : 0;
  [['قبل', 210], ['الان', -210]].forEach(([lab, x], i) => {
    const k = still ? 1 : pop(t - T.changed - 0.05 - i * 0.14, 12, 0.6); if (k <= 0) return;
    at(lerp(x, x * 0.9, mv), 0, lerp(0.85, 1, cl(k)), cl(k), () => {
      card(-180, -220, 360, 440, still ? INKD : PLATE, 'rgba(255,255,255,0.12)', 34);
      chip(lab, 0, -150, 34, i ? INKD : WHITE, i ? LIME : 'rgba(255,255,255,0.16)');
      at(0, 60, 1, 1, () => trace(PAT, 1, i || still ? LIME : 'rgba(255,255,255,0.5)', 9));
    });
  });
  if (!still) popIn(t, ws(43), () => { shadowed(() => circle(0, 0, 72, R), 30, 10, 0.4); line(-30, -14, 30, -14, WHITE, 11); line(-30, 16, 30, 16, WHITE, 11); line(18, -40, -18, 42, WHITE, 9); }, 0, 0, 0.5);
  else { popIn(t, ws(44), () => { shadowed(() => circle(0, 0, 80, VIO), 30, 10, 0.4); line(-32, -15, 32, -15, WHITE, 12); line(-32, 17, 32, 17, WHITE, 12); }, 0, 0, 0.45); check(0, 300, 56, INKD, pop(t - ws(44) - 0.2, 13, 0.5)); }
}
// ---- «همون ترس‌ها، همون طمع‌ها، همون الگوها، فقط با تاریخ‌های جدید» ----
const AMBD = '#D98E00', MSH = [[-60, 0], [-35, -55], [-12, -20], [12, -58], [36, -18], [60, 10]];
const TILES = [['ترس', 46, R, 'fear'], ['طمع', 48, AMBD, 'greed'], ['الگو', 50, VIO, 'pat']];
function sameArt(t, th) {
  const up = cub(k01(t, ws(51) - 0.1, 0.5));
  TILES.forEach(([name, wi, col, ic], i) => {
    const k = pop(t - ws(wi) + 0.05, 12, 0.6); if (k <= 0) return;
    at(300 - i * 300, lerp(-60, -290, up), lerp(1, 0.78, up) * lerp(0.85, 1, cl(k)), cl(k), () => {
      card(-130, -160, 260, 320, WHITE, 'rgba(26,20,48,0.1)', 32); rrect(-100, -130, 200, 170, 24, rgba(col, 0.12));
      at(0, -45, 1, 1, () => {
        if (ic === 'fear') { line(-10, -70, -10, 70, R, 6); rrect(-34, -50, 48, 100, 8, R); cv.save(); cv.strokeStyle = R; cv.lineWidth = 8; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(40, -40); cv.lineTo(40, 40); cv.stroke(); cv.restore(); arrowHead([40, 0], [40, 50], R, 26); }
        if (ic === 'greed') { line(-20, -70, -20, 70, G, 6); rrect(-44, -50, 48, 100, 8, G); [[45, 40], [45, 18], [45, -4]].forEach(([x, y]) => { cv.save(); cv.fillStyle = AMB; cv.beginPath(); cv.ellipse(x, y, 30, 11, 0, 0, Math.PI * 2); cv.fill(); cv.strokeStyle = AMBD; cv.lineWidth = 3; cv.stroke(); cv.restore(); }); }
        if (ic === 'pat') at(0, 25, 1.2, 1, () => trace(MSH, 1, VIO, 9));
      });
      txt(name, 0, 102, 54, col);
    });
  });
  const kt = cub(k01(t, ws(51), 0.4)); if (kt <= 0) return;
  at(0, 230, 1, kt, () => {
    line(420, 0, 420 - 840 * kt, 0, rgba(INKP, 0.22), 6);
    [[2017, 280], [2021, 0], [2025, -280]].forEach(([yr, x], i) => {
      const kk = pop(t - ws(53) - i * 0.15 + 0.05, 13, 0.55); if (kk <= 0) return;
      at(x, 0, cl(kk, 0, 1.2), cl(kk), () => { at(0, -24, 1.1, 1, () => trace(MSH, 1, VIO, 8)); circle(0, 0, 11, VIO); chip(fa(yr), 0, 62, 30, WHITE, VIO); });
    });
    note('الگوی نمونه', 140, MP);
  });
}
// ---- «اگه فقط یه کار از دستم بربیاد، اینه که بهت بگم» ----
function oneArt(t, th) {
  const k = pop(t - ws(57) + 0.05, 11, 0.55), mv = cub(k01(t, ws(63) - 0.1, 0.45));
  if (k > 0) at(0, lerp(0, -290, mv), lerp(1, 0.5, mv) * cl(k, 0, 1.2), cl(k), () => { shadowed(() => circle(0, 0, 230, INKD), 50, 18, 0.35); txt(fa(1), 0, 30, 340, LIME); });
  const kb = pop(t - ws(63) - 0.05, 12, 0.6);
  if (kb > 0) at(0, 150, cl(kb, 0, 1.15), cl(kb), () => {
    txt('خودِ آینده‌ت داره می‌نویسه…', 0, -150, 32, 'rgba(255,255,255,0.8)', { w: 700 });
    shadowed(() => bubble(440, 170, WHITE, -1), 40, 14, 0.3);
    for (let i = 0; i < 3; i++) circle(80 - i * 80, -Math.max(0, Math.sin(t * 9 - i * 0.9)) * 18, 24, VIO);
  });
}
// ---- «قبل از اینکه با پول واقعیت یاد بگیری»: the bills fly off ----
function moneyArt(t, th) {
  const k = pop(t - T.money - 0.05, 12, 0.6); if (k <= 0) return;
  const t0 = ws(72);
  at(0, 80, cl(k, 0, 1.15), cl(k), () => wallet(1 - cub(k01(t, t0, 0.2))));
  for (let i = 0; i < 9; i++) { const d = t - t0 - i * 0.1; if (d <= 0) continue; const a = cl(1 - (d - 1.0) / 0.5); if (a <= 0) continue;
    const x = (rnd(i * 3.1) - 0.5) * 900 * d, y = -40 - (520 + rnd(i * 1.7) * 380) * d + 160 * d * d;
    at(x, y, 1, a, () => { rrect(-90, -45, 180, 90, 12, i % 2 ? G : '#13996A'); circle(0, 0, 22, null, WHITE, 5); }, d * (rnd(i) * 5 - 2.5)); }
  popIn(t, ws(75), () => chip('شهریه‌ی گرون', 0, 0, 54, WHITE, R), 0, 420, 0.55, -0.03);
}
// ---- «روی گذشته‌ی واقعی بازار یاد بگیر» (f1: the gold replay) ----
const RR = [520, 200, 560, 620], DK = Array.from({ length: 20 }, (_, i) => 'd' + String(2 + i * 2).padStart(2, '0'));
function pastArt(t, th) {
  const k = pop(t - T.past - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 600, x = -300, y = -330, h = shot(FLIP(t, T.past, T.thanks + 0.3, DK), RR, x, y, w);
    popIn(t, ws(77), () => { const cw = chip('بازپخش', 0, 0, 38, LIME, INKD); cv.fillStyle = LIME; cv.beginPath(); cv.moveTo(cw / 2 - 52, -14); cv.lineTo(cw / 2 - 52, 14); cv.lineTo(cw / 2 - 30, 0); cv.closePath(); cv.fill(); }, 0, y - 80, 0.55);
    check(x + w - 4, y + 4, 54, G, pop(t - ws(81) - 0.05, 13, 0.5));
    note('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', y + h + 52, '#3E4D12');
  });
}
// ---- «یه سال دیگه از خودت ممنون می‌شی»: your reply ----
function thanksArt(t, th) {
  const kc = pop(t - T.thanks - 0.05, 12, 0.6); if (kc > 0) at(0, -230, 1.1 * cl(kc, 0, 1.15), cl(kc), () => calendar(t, -2, -1));
  const kb = pop(t - ws(86) + 0.05, 12, 0.6);
  if (kb > 0) at(60, 190, cl(kb, 0, 1.15), cl(kb), () => { shadowed(() => bubble(560, 170, VIO, 1), 40, 14, 0.3); txt('ممنونم ازت', 0, 4, 64, WHITE); });
  const kh = pop(t - ws(87) - 0.1, 12, 0.45);
  if (kh > 0) {
    at(-250, 330, cl(kh, 0, 1.3), cl(kh), () => shadowed(() => heart(70, R), 30, 10, 0.3), -0.12);
    for (let i = 0; i < 6; i++) { const d = t - ws(87) - 0.2 - i * 0.12; if (d <= 0) continue; const a = cl(1 - d / 1.4); if (a <= 0) continue;
      at(-250 + (rnd(i * 2.3) - 0.5) * 300 + Math.sin(d * 4 + i) * 20, 290 - d * 260, 1, a, () => heart(18 + rnd(i) * 14, i % 2 ? R : VIO)); }
  }
}
// ---- «خودِ آینده‌ت»: the letter, signed ----
const SIG = Array.from({ length: 81 }, (_, i) => { const u = i / 80; return [210 - u * 420 + 34 * Math.sin(u * 16), 30 * Math.sin(u * 10) - 40 * Math.cos(u * 16) * (1 - u) * 0.6]; });
function signArt(t, th) {
  const k = pop(t - T.sign - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    card(-380, -300, 760, 600, WHITE, null, 30);
    for (let i = 0; i < 5; i++) { const w = 620 - rnd(i * 5.3) * 200 - (i === 4 ? 240 : 0); rrect(320 - w, -230 + i * 56, w, 16, 8, '#E4DFF3'); }
    const ks = cub(k01(t, ws(90), ws(91) + 0.5 - ws(90))), e = at2(0, 150, () => trace(SIG, ks, VIO, 7));
    line(260, 210, -260, 210, 'rgba(26,20,48,0.12)', 3);
    txt('خودِ آینده‌ت', 0, 250, 30, MP, { w: 700, alpha: cub(k01(t, ws(91), 0.3)) });
    if (ks > 0 && ks < 1) pen(e[0], e[1] + 150);
  });
}
function at2(x, y, fn) { cv.save(); cv.translate(x, y); const r = fn(); cv.restore(); return r; }
// ---- «بک‌تست‌لب» ----
function brandK(t, th) { brandArt(t, th, ws(92)); }
// ---- «شروعش رایگانه، لینکش توی بیوئه» ----
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  if (IMG.icon) at(0, -300, cl(k, 0, 1.2), cl(k), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; cv.drawImage(IMG.icon, -120, -120, 240, 240); });
  popIn(t, ws(96), () => chip('شروع رایگان', 0, 0, 68, LIME, INKD), 0, -20, 0.55, -0.03);
  popIn(t, ws(97), () => { shadowed(() => rrect(-270, -72, 540, 144, 72, WHITE)); txt('لینک توی بیو', 0, 4, 62, VIO); }, 0, 190, 0.6);
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1250, 1], groups: [
      { at: 0, lines: [L_(280, 120, WHITE, [['سلام،', 0]]), L_(420, 120, WHITE, [['منم،', 1, { c: LIME }]]), L_(565, 100, WHITE, [['خودِ', 2], ['یک', 3], ['سال', 4], ['بعدت.', 5, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'tonight', bg: PAPER, wipe: 'up', art: 'tonight', kpos: [CX, 1310, 1], groups: [
      { at: 6, lines: [L_(240, 92, INKP, [['می‌دونم', [6, 7]], ['امشب', 8, { c: VIO }]]), L_(355, 92, INKP, [['داری', 9], ['اون', 10], ['پوزیشن', 11, { hl: VIO, ht: WHITE }]]), L_(470, 92, INKP, [['رو', 12], ['بدون', 13], ['حد', 14, { c: R }], ['ضرر', 15, { c: R }]]), L_(585, 92, INKP, [['باز', 16], ['می‌کنی،', [17, 18]]])] }] },
    { k: 'sure', bg: INKD, wipe: 'right', art: 'fall', kpos: [CX, 1250, 1], groups: [
      { at: 19, lines: [L_(280, 110, WHITE, [['چون', 19], ['مطمئنی', 20, { c: LIME }]]), L_(420, 120, WHITE, [['این', 21], ['بار', 22, { hl: LIME, ht: INKD }]]), L_(565, 110, WHITE, [['برمی‌گرده.', [23, 25]]])] }] },
    { k: 'no', bg: R, wipe: 'cut', art: 'fall', kpos: [CX, 1250, 1], groups: [
      { at: 26, lines: [L_(440, 170, WHITE, [['برنمی‌گرده.', [26, 28]]])] }] },
    { k: 'waste', bg: LIME, wipe: 'up', art: 'waste', kpos: [CX, 1230, 1], groups: [
      { at: 29, lines: [L_(260, 92, INKD, [['می‌دونم', [29, 30]], ['فکر', 31], ['می‌کنی', [32, 33]]]), L_(400, 120, INKD, [['بک‌تست', [34, 35], { hl: INKD, ht: LIME }]]), L_(550, 110, INKD, [['اتلاف', 36], ['وقته،', 37, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'changed', bg: INKD, wipe: 'left', art: 'two', kpos: [CX, 1230, 1], groups: [
      { at: 38, lines: [L_(270, 104, WHITE, [['چون', 38], ['بازار', 39, { c: LIME }]]), L_(400, 104, WHITE, [['دیگه', 40], ['مثل', 41], ['قبل', 42]]), L_(550, 130, WHITE, [['نیست.', 43, { hl: R, ht: WHITE }]])] }] },
    { k: 'still', bg: LIME, wipe: 'iris', art: 'two', kpos: [CX, 1230, 1], groups: [
      { at: 44, lines: [L_(440, 210, INKD, [['هست.', 44, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'same', bg: PAPER, wipe: 'up', art: 'same', kpos: [CX, 1240, 1.1], groups: [
      { at: 45, lines: [L_(250, 104, INKP, [['همون', 45], ['ترس‌ها،', 46, { c: R }]]), L_(375, 104, INKP, [['همون', 47], ['طمع‌ها،', 48, { c: AMBD }]]), L_(500, 104, INKP, [['همون', 49], ['الگوها،', 50, { c: VIO }]])] },
      { at: 51, lines: [L_(300, 110, INKP, [['فقط', 51], ['با', 52]]), L_(440, 120, INKP, [['تاریخ‌های', 53], ['جدید.', 54, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'one', bg: VIO, wipe: 'right', art: 'one', kpos: [CX, 1260, 1], groups: [
      { at: 55, lines: [L_(270, 100, WHITE, [['اگه', 55], ['فقط', 56], ['یه', 57, { hl: LIME, ht: INKD }], ['کار', 58]]), L_(400, 100, WHITE, [['از', 59], ['دستم', 60], ['بربیاد،', [61, 62]]])] },
      { at: 63, lines: [L_(320, 110, WHITE, [['اینه', 63], ['که', 64]]), L_(460, 120, WHITE, [['بهت', 65], ['بگم:', 66, { hl: LIME, ht: INKD }]])] }] },
    { k: 'money', bg: INKD, wipe: 'up', art: 'money', kpos: [CX, 1230, 1], groups: [
      { at: 67, lines: [L_(270, 100, WHITE, [['قبل', 67], ['از', 68], ['اینکه', [69, 70]]]), L_(400, 110, WHITE, [['با', 71], ['پول', 72], ['واقعیت', 73, { c: R }]]), L_(545, 110, WHITE, [['یاد', 74], ['بگیری،', 75, { hl: R, ht: WHITE }]])] }] },
    { k: 'past', bg: LIME, wipe: 'iris', art: 'past', kpos: [CX, 1270, 1], groups: [
      { at: 76, lines: [L_(250, 100, INKD, [['روی', 76], ['گذشته‌ی', 77, { hl: INKD, ht: LIME }]]), L_(375, 100, INKD, [['واقعی', 78], ['بازار', 79]]), L_(505, 110, INKD, [['یاد', 80], ['بگیر.', 81, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'thanks', bg: PAPER, wipe: 'left', art: 'thanks', kpos: [CX, 1250, 1], groups: [
      { at: 82, lines: [L_(270, 100, INKP, [['یه', 82], ['سال', 83], ['دیگه', 84, { c: VIO }]]), L_(400, 100, INKP, [['از', 85], ['خودت', 86]]), L_(545, 120, INKP, [['ممنون', 87, { hl: VIO, ht: WHITE }], ['می‌شی.', [88, 89]]])] }] },
    { k: 'sign', bg: INKD, wipe: 'iris', art: 'sign', kpos: [CX, 1230, 1], groups: [
      { at: 90, lines: [L_(400, 150, WHITE, [['خودِ', 90], ['آینده‌ت.', 91, { hl: LIME, ht: INKD }]])] }] },
    { k: 'brand', bg: VIO, wipe: 'right', art: 'brand', kpos: [CX, 1150, 1], groups: [
      { at: 92, lines: [L_(400, 150, WHITE, [['بک‌تست‌لب.', [92, 94], { c: LIME }]])] }] },
    { k: 'cta', bg: LIME, wipe: 'up', art: 'cta', kpos: [CX, 1250, 1], groups: [
      { at: 95, lines: [L_(320, 130, INKD, [['شروعش', 95], ['رایگانه.', 96, { hl: VIO, ht: WHITE }]]), L_(470, 100, INKD, [['لینکش', 97], ['توی', 98], ['بیوئه.', 99]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, tonight: tonightArt, fall: fallChart, waste: wasteArt, two: twoCards, same: sameArt, one: oneArt, money: moneyArt, past: pastArt,
    thanks: thanksArt, sign: signArt, brand: brandK, cta: ctaArt, end: endArtK },
  shakes: [[ws(27), 14], [ws(43), 8], [ws(44), 12], [ws(57), 8], [ws(92), 6]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('سلام، منم', CX, 380, 150, LIME);
    const s = 'خودِ یک سال بعدت', size = 100, w = measure(s, size); cv.save(); cv.translate(CX, 560); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, VIO); cv.restore(); txt(s, CX, 560, size, WHITE);
    at(CX, 1240, 1, 1, () => hookArt(10, THEME.ink));
    at(CX, 1660, 1, 1, () => chip('یه پیام از آینده‌ت', 0, 0, 50, INKD, LIME));
  },
});
