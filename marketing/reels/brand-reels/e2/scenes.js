// e2 · «چند ثانیه تا خبر NFP…»: the same trader on a summer afternoon, leaning into a 1-minute gold chart seconds
// before the US jobs report. He buys; 3, 2, 1; the release candle runs through his target; fists up. A fast replay,
// a second target hit, and the line: the thrill of the real market without risking real money.
const T = DATA.t;
const DAY = 2.35;   // late afternoon light
const ST = (o) => ({ sky: DAY, rain: 0, screenOn: 1, scr: 'clean', pose: 1, arm: 1, deskPhone: true, ...o });
const NCROP = [900, 180, 1480, 1060];   // the 1-minute chart around the release
const FCROP = [600, 380, 1780, 1260];   // the 1-hour replays (9 Apr 2025)
const BEAT = 0.5;
const beatPulse = (t, from) => (t < from ? 0 : Math.exp(-((t - from) % BEAT) * 9));

// A · seconds before the release: leaning in, push towards the screen
function sceneA(t) {
  const u = E.in(P(t, 0, T.order));
  const cam = shake(dolly({ x: 600, y: 985, z: 1.22 }, { x: 672, y: 840, z: 1.85 }, u), 2 * u, t);
  room(t, ST({ lean: 0.9 + 0.1 * Math.sin(t * 2) }), cam, { bgBlur: 2.5 });
}
// B · the order: buy at 2% risk, the target and the stop on the chart
function sceneB(t) {
  room(t, ST({ lean: 1 }), { x: 672, y: 830, z: 1.9 }, { bgBlur: 3, fgBlur: 6 });
  soften(16, 0.5);
  const m = E.out(P(t, T.order + 0.45, 0.15));
  panel('clean', NCROP, 540, 930, 1040, { k2: 'placed', mix: m, scale: lerp(0.97, 1.0, E.out(P(t, T.order, 0.5))), alpha: E.out(P(t, T.order, 0.15)) });
  const a = E.out(P(t, T.order + 0.5, 0.3));
  if (a > 0) { cv.save(); cv.translate(540, 1420); cv.scale(lerp(0.85, 1, E.back(P(t, T.order + 0.5, 0.35))), lerp(0.85, 1, E.back(P(t, T.order + 0.5, 0.35)))); pill(0, 0, 'خرید طلا · ریسک ۲٪', { size: 44, dot: C.gain, color: '#fff', alpha: a, fill: rgba('#0F2A1F', 0.9), border: rgba(C.gain, 0.8) }); cv.restore(); }
}
// C · 3, 2, 1, then a beat of black
function sceneC(t) {
  room(t, ST({ lean: 1 }), { x: 672, y: 830, z: 1.9 }, { bgBlur: 3, fgBlur: 6 });
  soften(16, 0.55 + 0.25 * P(t, T.c3, T.black - T.c3));
  const marks = [[T.c3, '۳'], [T.c2, '۲'], [T.c1, '۱']];
  let s = 1; for (const [tc] of marks) if (t >= tc) s += 0.025 * Math.exp(-(t - tc) * 8);
  const sh = 3 + 8 * P(t, T.c3, T.black - T.c3);
  panel('placed', NCROP, 540 + Math.sin(t * 70) * sh * 0.4, 930 + Math.cos(t * 61) * sh * 0.3, 1040, { scale: s * lerp(1, 1.06, P(t, T.c3, T.black - T.c3)) });
  for (const [tc, n] of marks) {
    const k = t - tc; if (k < 0 || k > 0.6) continue;
    const a = Math.min(E.out(clamp(k / 0.08)), 1 - E.in(clamp((k - 0.42) / 0.16))), sc = lerp(1.5, 1, E.out(clamp(k / 0.22)));
    txt(n, 540, 930, { size: 380, font: 'Rdx', weight: 800, color: '#fff', alpha: a, scale: sc, glow: rgba(C.accent, 0.8), glowBlur: 70, dir: 'ltr' });
  }
  if (t >= T.black) { cv.fillStyle = '#000'; cv.fillRect(0, 0, W, H); txt('۱۶:۰۰', 540, 960, { size: 46, font: 'Rdx', weight: 600, color: C.muted, alpha: 0.8, dir: 'ltr' }); }
}
// D · the release candle: target hit
function sceneD(t) {
  room(t, ST({ lean: 1, screenCol: '#26C281' }), { x: 672, y: 830, z: 1.9 }, { bgBlur: 3, fgBlur: 6 });
  soften(16, 0.45);
  rad(cv, 540, 930, 900, 900, '#26C281', 0.35 * Math.exp(-(t - T.drop) * 2.5), 'lighter');
  const fr = t < T.drop + 0.35 ? 'n1' : t < T.drop + 0.55 ? 'n2' : t < T.drop + 0.72 ? 'n3' : 'n4';
  const sh = Math.exp(-(t - T.drop) * 5) * 30;
  panel(fr, NCROP, 540 + Math.sin(t * 90) * sh, 930 + Math.cos(t * 77) * sh * 0.7, 1040, { scale: lerp(1.12, 1.0, E.out(P(t, T.drop, 0.25))), glowCol: rgba(C.gain, 0.6), border: rgba(C.gain, 0.9) });
  const a = E.out(P(t, T.drop + 0.05, 0.15)), sc = E.back(P(t, T.drop + 0.05, 0.3));
  txt('حد سود خورد!', 540, 360, { size: 92, font: 'Rdx', weight: 800, color: '#7CFFB8', alpha: a, scale: sc, glow: rgba(C.gain, 0.7), glowBlur: 50 });
  txt('+$۳۹۹٫۶۴', 540, 1470, { size: 150, font: 'Rdx', weight: 800, color: '#fff', alpha: E.out(P(t, T.drop + 0.12, 0.15)), scale: E.back(P(t, T.drop + 0.12, 0.3)), dir: 'ltr', glow: rgba(C.gain, 0.8), glowBlur: 60 });
  burst(t, T.drop + 0.04, 540, 1100, { n: 110, v: 1500, seed: 7 });
}
// E · fists up
function sceneE(t) {
  const k = P(t, T.cheer, 0.28), bp = beatPulse(t, T.drop);
  const cam = shake({ x: 560, y: 1000, z: 1.16 + 0.02 * bp }, 10 * Math.exp(-(t - T.cheer) * 3), t);
  room(t, ST({ cheer: k, pump: P(t, T.cheer + 0.25, 0.3), scr: 'n4', screenCol: '#26C281', glow: ['#26C281', 0.10 + 0.08 * bp], rimCol: '#9DFFD0', light: { x: 672, y: 760 } }), cam, { bgBlur: 2.5 });
  burst(t, T.cheer + 0.05, 300, 380, { n: 70, v: 900, spread: 2.2, seed: 11, g: 1200 });
  burst(t, T.cheer + 0.15, 800, 380, { n: 70, v: 900, spread: 2.2, seed: 12, g: 1200 });
  const tg = cv.createLinearGradient(0, 180, 0, 620); tg.addColorStop(0, 'rgba(4,10,8,0.75)'); tg.addColorStop(1, 'rgba(4,10,8,0)'); cv.fillStyle = tg; cv.fillRect(0, 0, W, 620);
  const a = E.out(P(t, T.cheer + 0.15, 0.25));
  txt('۱ دقیقه.', 540, 340, { size: 70, font: 'Rdx', weight: 800, color: '#fff', alpha: a });
  txt('+۲R', 540, 455, { size: 110, font: 'Rdx', weight: 800, color: '#7CFFB8', alpha: E.out(P(t, T.cheer + 0.35, 0.25)), scale: E.back(P(t, T.cheer + 0.35, 0.3)), dir: 'ltr', glow: rgba(C.gain, 0.7), glowBlur: 50 });
}
// F · a fast replay, then another target hit (9 Apr 2025, gold 1h)
const FR = Array.from({ length: 17 }, (_, i) => 'f' + String(i).padStart(2, '0'));
const WR = ['w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9'];
function sceneF(t) {
  room(t, ST({ scr: 'n4' }), { x: 640, y: 900, z: 1.5 }, { bgBlur: 3, fgBlur: 4 });
  soften(16, 0.5);
  let k, label;
  if (t < T.win) { const i = Math.min(16, Math.floor((t - T.mont) / ((T.win - T.mont) / 17))); k = FR[i]; label = 'بازپخش سریع · طلا ۱ ساعته'; }
  else { const i = Math.min(7, Math.floor((t - T.win) / ((T.tp - T.win) / 7))); k = WR[i]; label = '۹ آوریل ۲۰۲۵ · طلا ۱ ساعته'; }
  const bp = beatPulse(t, T.drop), rot = Math.sin(t * 1.3) * 0.015;
  const hit = t >= T.tp;
  panel(k, FCROP, 540, 930, 1040, { scale: 1 + 0.012 * bp + (hit ? 0.05 * Math.exp(-(t - T.tp) * 6) : 0), rot, glowCol: hit ? rgba(C.gain, 0.6) : undefined, border: hit ? rgba(C.gain, 0.9) : undefined });
  if (t < T.win) {   // speed lines
    cv.save(); cv.globalCompositeOperation = 'lighter'; const r = rng(Math.floor(t * 30));
    for (let i = 0; i < 26; i++) { const y = 520 + r() * 820, x = ((r() * 1400 + t * 3000) % 1400) - 200; cv.fillStyle = `rgba(181,162,255,${0.08 + 0.12 * r()})`; cv.fillRect(x, y, 120 + r() * 200, 2); }
    cv.restore();
  }
  pill(540, 420, label, { size: 32, dot: t < T.win ? C.accent : C.gain, color: C.ink, fill: rgba('#0E0C16', 0.8) });
  if (hit) {
    rad(cv, 540, 930, 800, 800, '#26C281', 0.3 * Math.exp(-(t - T.tp) * 3), 'lighter');
    txt('+$۱۹۳', 540, 1440, { size: 130, font: 'Rdx', weight: 800, color: '#fff', alpha: E.out(P(t, T.tp, 0.12)), scale: E.back(P(t, T.tp, 0.3)), dir: 'ltr', glow: rgba(C.gain, 0.8), glowBlur: 60 });
    burst(t, T.tp, 540, 1150, { n: 70, v: 1200, seed: 21 });
  }
}
// G · the line over the room; H · the logo
function sceneG(t) {
  const u = P(t, T.line, DUR - T.line);
  const cam = dolly({ x: 560, y: 1000, z: 1.12 }, { x: 600, y: 960, z: 1.28 }, E.inOut(u));
  room(t, ST({ scr: 'n4', screenCol: '#26C281', glow: ['#26C281', 0.05] }), cam, { bgBlur: 2.5 });
  const g = P(t, T.end - 0.1, 0.8); if (g > 0) soften(16 * E.inOut(g), 0.55 * E.inOut(g));
  if (t < T.end + 0.2) {
    const out = 1 - E.in(P(t, T.end - 0.2, 0.3));
    const tg = cv.createLinearGradient(0, 180, 0, 700); tg.addColorStop(0, `rgba(5,4,10,${0.8 * out})`); tg.addColorStop(1, 'rgba(5,4,10,0)'); cv.fillStyle = tg; cv.fillRect(0, 0, W, 700);
    txt('هیجانِ بازار واقعی،', 540, 360, { size: 72, font: 'Rdx', weight: 800, color: '#fff', alpha: E.out(P(t, T.line + 0.1, 0.35)) * out });
    txt('بدون ریسکِ پول واقعی.', 540, 470, { size: 72, font: 'Rdx', weight: 800, color: '#7CFFB8', alpha: E.out(P(t, T.line + 0.7, 0.35)) * out, glow: rgba(C.gain, 0.45), glowBlur: 40 });
  } else {
    const a1 = E.out(P(t, T.end + 0.2, 0.45)), a2 = E.out(P(t, T.end + 0.8, 0.5));
    txt('هر خبر، هر کندل،', 540, 820, { size: 64, font: 'Rdx', weight: 800, color: '#fff', alpha: a1 });
    txt('از ۲۰۱۵ تا امروز.', 540, 915, { size: 64, font: 'Rdx', weight: 800, color: '#7CFFB8', alpha: a1 * E.out(P(t, T.end + 0.45, 0.4)) });
    if (IMG.logo && a2 > 0) { const h = 70, w = (IMG.logo.width / IMG.logo.height) * h; cv.save(); cv.globalAlpha = a2; cv.drawImage(IMG.logo, 540 - w / 2, 1120 - h / 2, w, h); cv.restore();
      txt('بک‌تست با داده‌ی واقعی بازار', 540, 1205, { size: 30, weight: 500, color: C.muted, alpha: a2 }); }
  }
}
function hook(t) {
  const a = 1 - E.in(P(t, T.order - 0.35, 0.3)); if (a <= 0) return;
  const tg = cv.createLinearGradient(0, 160, 0, 680); tg.addColorStop(0, `rgba(5,4,10,${0.82 * a})`); tg.addColorStop(1, 'rgba(5,4,10,0)'); cv.fillStyle = tg; cv.fillRect(0, 0, W, 680);
  txt('چند ثانیه تا خبر NFP…', 540, 360, { size: 74, font: 'Rdx', weight: 800, color: '#fff', alpha: a });
  txt('گزارش اشتغال آمریکا · طلا · چارت ۱ دقیقه‌ای', 540, 452, { size: 34, weight: 600, color: C.muted, alpha: a });
  const ss = 45 + Math.floor(clamp(t / T.order) * 12);
  pill(540, 545, '\u2066۱۵:۵۹:' + fy(ss) + '\u2069 · ۱۰ مرداد ۱۴۰۴', { size: 32, dot: C.loss, color: '#fff', alpha: a, fill: rgba('#2A0F16', 0.85), border: rgba(C.loss, 0.6) });
}
function render(t) {
  reset(cv);
  if (t < 0) { sceneA(1.2); reset(cv); finish(1.2); hook(1.2); return; }
  if (t < T.order) sceneA(t); else if (t < T.c3) sceneB(t); else if (t < T.drop) sceneC(t); else if (t < T.cheer) sceneD(t);
  else if (t < T.mont) sceneE(t); else if (t < T.line) sceneF(t); else sceneG(t);
  reset(cv); finish(t);
  if (t < T.order) hook(t);
  flashAt(t, T.drop, '#FFFFFF', 0.25, 0.7); flashAt(t, T.drop + 0.08, '#26C281', 0.4, 0.35);
  dipAt(t, [T.order, T.cheer, T.mont, T.line]);
}
boot(render, ['clean', 'placed', 'n0', 'n1', 'n2', 'n3', 'n4', ...FR, ...WR].map((k) => loadImg('s_' + k, SHOTS + k + '.jpg')));
