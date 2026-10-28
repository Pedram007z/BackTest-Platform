// k5 · «نظرت چیه باهم یه خودکشی کنیم؟…», a new look: a case file on a dark board. One camera flies over the board:
// a manila folder «پرونده: خودکشی مالی» opens on the plan, typed line by line and ticked in red; «لغو شد» is stamped over
// it; a red string leads from «راه‌حل؟» to BacktestLab; three index cards for three strategies; the platform's real
// screens (light theme) pinned as photos: a strategy's rules, the checklist, each session's chart, the analytics split
// by strategy; then back to the three cards, now with their real results pinned on and stamped; the winner keeps its
// pin, the others fall; a sticky note «شروع رایگان». The spoken words are punched onto black label tape at the top.
// u-kit (loaded first) gives the timing, the fonts, the images and the helpers; this file draws every frame itself.
story({ scenes: [], art: {} });
const RES = (window.DATA.res && window.DATA.res.cards) || [];
const BEST = (window.DATA.res && window.DATA.res.best) || (RES[0] && RES[0].name) || '';
const RR = window.DATA.res || {};
const INK = '#2A2622', PAP = '#F4EFE4', RED = '#C9302C', PINR = '#E0413A', STR = '#B3261E', YEL = '#FFE066', MANILA = '#D8B677', CORK = '#231E1B';
const TC = { R: '#FF5F52', Y: '#FFD84D', G: '#3DDC97', V: '#A792FF' };

// ---------- the board's texture ----------
const TEX = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = CORK; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { const a = rnd(i * 1.37), b = rnd(i * 2.11), s = 1 + rnd(i * 3.3) * 2.6, l = rnd(i * 4.7); x.fillStyle = l > 0.55 ? `rgba(255,236,210,${0.025 + rnd(i) * 0.04})` : `rgba(0,0,0,${0.08 + rnd(i * 5.1) * 0.12})`; x.fillRect(a * 512, b * 512, s, s); }
  return c; })();
let PAT = null;

// ---------- the camera ----------
const P1 = 1150, P2 = 2700, P3 = 4300, P4 = 5900, P5 = 7500, P6 = 9100, CTAX = 1760;
const cardX = [870, 540, 210];               // the three index cards, right to left (۱ is read first)
const NAMES = ['خرید در باز شدن لندن', 'فروش در باز شدن لندن', 'خرید در باز شدن نیویورک'];   // the cards' order (setup.mjs)
const byName = (n) => RES.find((c) => c.name === n);
const winI = Math.max(0, NAMES.indexOf(BEST));
const KEYS = [
  [0, 540, P1 - 30, 1.04], [T.plan - 0.2, 540, P1 + 10, 1.0], [T.but - 0.1, 540, P1 + 30, 1.06], [ws(32) - 0.2, 540, P1 + 260, 0.98],
  [T.brand - 0.35, 540, P2, 1.0], [T.three - 0.3, 540, P3, 0.98], [T.save - 0.3, 540, P4, 0.95], [T.test - 0.3, 540, P5, 0.95],
  [T.analytics - 0.3, 540, P6, 0.95], [T.verdict - 0.45, 540, P3 + 40, 0.98], [T.winner - 0.2, cardX[winI] || 540, P3, 1.3], [T.cta - 0.3, CTAX, P3, 1.0],
  [T.end - 0.1, 1150, 5200, 0.2],
];
const DURS = { def: 0.75 };
function cam(t) {
  let i = 0; while (i + 1 < KEYS.length && t >= KEYS[i + 1][0]) i++;
  const k = KEYS[i], prev = KEYS[i - 1];
  const d = i === KEYS.length - 1 ? 1.2 : Math.hypot(k[1] - (prev ? prev[1] : k[1]), k[2] - (prev ? prev[2] : k[2])) > 2500 ? 1.1 : DURS.def;
  if (!prev) return k.slice(1);
  const e = exIO(k01(t, k[0], d)), far = Math.hypot(k[1] - prev[1], k[2] - prev[2]) > 1800 && i !== KEYS.length - 1;
  let z = lerp(prev[3], k[3], e); if (far) z *= 1 - 0.55 * Math.sin(Math.PI * e);
  return [lerp(prev[1], k[1], e), lerp(prev[2], k[2], e), z];
}

// ---------- drawing on the board ----------
function shadowed(fn, blur = 30, oy = 12, a = 0.45) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = oy; fn(); cv.restore(); }
function pin(x, y, col = PINR, s = 1) { at(x, y, s, 1, () => { shadowed(() => circle(0, 4, 15, 'rgba(0,0,0,0.0001)'), 10, 8, 0.6); circle(2, 6, 14, 'rgba(0,0,0,0.35)'); circle(0, 0, 15, col); circle(-5, -5, 5, 'rgba(255,255,255,0.55)'); }); }
function paper(x, y, w, h, fill = PAP, lines = false) { shadowed(() => rrect(x, y, w, h, 6, fill)); if (lines) { for (let yy = y + 120; yy < y + h - 30; yy += 62) line(x + 40, yy, x + w - 40, yy, 'rgba(70,110,170,0.18)', 2); line(x + w - 90, y + 20, x + w - 90, y + h - 20, 'rgba(200,60,60,0.25)', 2); } }
/** red string from a to b, sagging, drawn up to k */
function string(ax, ay, bx, by, k, sag = 120) { if (k <= 0) return; const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([lerp(ax, bx, u), lerp(ay, by, u) + Math.sin(Math.PI * u) * sag]); }
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.5)'; cv.shadowBlur = 8; cv.shadowOffsetY = 6; trace(pts, cl(k), STR, 6); cv.restore(); }
/** typed text: the first n characters by time; a caret while typing */
function typed(s, x, y, size, t, t0, dur, col = INK, o = {}) { const n = Math.floor(cl((t - t0) / dur) * s.length); if (n <= 0) return 0; const part = s.slice(0, n); txt(part, x, y, size, col, { align: 'right', w: o.w ?? 600 });
  if (n < s.length && Math.floor(t * 4) % 2 === 0) rrect(x - measure(part, size, o.w ?? 600) - 8, y - size * 0.5, 4, size, 2, col); return n / s.length; }
function redCheck(x, y, s, k) { if (k <= 0) return; const pts = [[x - 26 * s, y], [x - 8 * s, y + 20 * s], [x + 30 * s, y - 26 * s]]; cv.save(); cv.lineCap = 'round'; trace(pts, cl(k), RED, 9 * s); cv.restore(); }
function stampInk(s, x, y, size, col, rot, k, sub = '') { if (k <= 0) return; const sc = lerp(2.2, 1, cub(cl(k * 1.6))), a = cl(k * 3) * 0.9;
  at(x, y, sc, a, () => { cv.save(); cv.globalCompositeOperation = 'multiply'; const w = Math.max(measure(s, size), sub ? measure(sub, size * 0.38) : 0) + size * 0.9, h = size * (sub ? 1.9 : 1.45);
    rrect(-w / 2, -h / 2, w, h, size * 0.14, null, col, size * 0.09); rrect(-w / 2 + size * 0.14, -h / 2 + size * 0.14, w - size * 0.28, h - size * 0.28, size * 0.08, null, col, size * 0.03);
    txt(s, 0, sub ? -size * 0.22 : size * 0.04, size, col); if (sub) txt(sub, 0, size * 0.55, size * 0.38, col, { w: 800 }); cv.restore(); }, rot); }
function sticky(s, x, y, w, rot, k, col = YEL, size = 64) { if (k <= 0) return; const dy = (1 - cub(cl(k))) * -140;
  at(x, y + dy, 1, cl(k * 2), () => { shadowed(() => rrect(-w / 2, -w / 2, w, w, 4, col), 26, 14, 0.4); rrect(-w / 2, -w / 2, w, 46, 4, 'rgba(0,0,0,0.05)'); txt(s, 0, 10, size, INK, { w: 800 }); pin(0, -w / 2 + 26); }, rot); }
/** a real screen printed as a photo: a white frame with a wider bottom, the crop, its caption, a pin */
function polaroid(key, r, x, y, w, rot, cap, k, o = {}) { if (k <= 0) return; const h = (w * r[3]) / r[2], pad = 20, bot = cap ? 86 : 26, dy = (1 - cub(cl(k))) * -180;
  at(x, y + dy, lerp(1.08, 1, cub(cl(k))), cl(k * 2), () => {
    shadowed(() => rrect(-w / 2 - pad, -h / 2 - pad, w + 2 * pad, h + pad + bot, 6, '#FBFAF6'), 34, 16, 0.5);
    const im = IMG[key]; if (im) { const s = im.width / 1440; cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, -w / 2, -h / 2, w, h); }
    rrect(-w / 2, -h / 2, w, h, 0, null, 'rgba(0,0,0,0.12)', 2);
    if (cap) txt(cap, 0, h / 2 + bot / 2 - 2, 38, INK, { w: 800 });
    if (o.draw) o.draw(-w / 2, -h / 2, w, h);
    if (!o.noPin) pin(0, -h / 2 - pad + 8);
  }, rot); return h; }
function indexCard(x, y, w, h, rot, num, title, k, fall = 0) { if (k <= 0) return; const dy = (1 - cub(cl(k))) * -160 + fall * fall * 2600, rr = rot + fall * 1.4;
  at(x, y + dy, 1, cl(k * 2) * (1 - cl(fall * 1.4 - 0.4)), () => {
    shadowed(() => rrect(-w / 2, -h / 2, w, h, 6, '#FFFDF7'));
    line(-w / 2 + 20, -h / 2 + 96, w / 2 - 20, -h / 2 + 96, 'rgba(200,60,60,0.45)', 3);
    for (let yy = -h / 2 + 150; yy < h / 2 - 20; yy += 52) line(-w / 2 + 20, yy, w / 2 - 20, yy, 'rgba(70,110,170,0.18)', 2);
    txt(num, w / 2 - 50, -h / 2 + 52, 56, RED); title.forEach((ln, i) => txt(ln, 0, -h / 2 + 140 + i * 56, 40, INK, { w: 800 }));
    if (fall <= 0) pin(0, -h / 2 + 18);
  }, rr); }

// ---------- the clusters ----------
function folderPlan(t) {
  // the folder's back and the plan inside it
  const open = cub(k01(t, T.plan - 0.15, 0.6));
  at(540, P1, 1, 1, () => {
    shadowed(() => rrect(-440, -540, 880, 1100, 14, '#C7A263'), 40, 18, 0.55);
    rrect(130, -600, 300, 80, 12, '#C7A263');
    if (open > 0.02) {
      paper(-390, -480, 780, 980, PAP);
      txt('نقشه', 300, -400, 70, INK, { align: 'right' }); line(-330, -350, 330, -350, 'rgba(0,0,0,0.25)', 3);
      const items = [['بک‌تست؟ نه!', ws(9)], ['ورود به بازار مالی', ws(14)], ['در کمترین زمان ممکن', ws(19)], ['باختن کل سرمایه', ws(23)]];
      items.forEach(([s, t0], i) => { const y = -260 + i * 120; if (t < t0 - 0.1) return; rrect(270, y - 30, 56, 56, 6, null, INK, 4); txt(`${fa(i + 1)}.`, 362, y, 46, INK);
        const f = typed(s, 240, y, 50, t, t0 - 0.05, 0.55); redCheck(298, y, 1, cub(k01(t, t0 + 0.5, 0.25))); });
      // our account, falling (drawn, no numbers)
      const kp = pop(t - ws(24) + 0.1, 12, 0.6);
      if (kp > 0) at(-170, 300, cl(kp, 0, 1.1), cl(kp), () => { shadowed(() => rrect(-200, -150, 400, 330, 6, '#FBFAF6'), 24, 10, 0.4); rrect(-180, -130, 360, 230, 0, '#F3F0EA');
        const kd = cub(k01(t, ws(24), 1.0)), pts = []; for (let i = 0; i <= 30; i++) pts.push([-170 + i * 11.3, -100 + Math.pow(i / 30, 1.6) * 190 + Math.sin(i * 1.7) * 8 * (1 - i / 30)]);
        trace(pts, kd, RED, 6); if (kd > 0.97) { line(162, 80, 182, 100, RED, 6); line(182, 80, 162, 100, RED, 6); } txt('حساب ما', 0, 140, 34, INK, { w: 800 }); pin(0, -132); }, -0.06);
    }
    // the cover flips open about its top edge
    if (open < 1) { cv.save(); cv.translate(0, -540); cv.scale(1, 1 - 1.12 * open); cv.translate(0, 540);
      shadowed(() => rrect(-440, -540, 880, 1100, 14, MANILA), 30, 14, 0.5);
      if (open < 0.5) { rrect(-300, -380, 600, 120, 10, '#FBF5E6'); txt('پرونده: خودکشی مالی', 0, -320, 52, INK); stampInk('محرمانه', 60, 120, 120, RED, -0.16, pop(t - 1.0, 12, 0.6)); }
      cv.restore(); }
    txt('پرونده', 280, -562, 34, '#5A4520', { w: 800 });
    // «لغو شد» over the plan; «راه‌حل؟»
    stampInk('لغو شد', 0, -40, 170, RED, -0.2, k01(t, T.but - 0.02, 0.22));
    sticky('راه‌حل؟', 250, 560, 280, 0.06, cub(k01(t, ws(32) - 0.1, 0.35)));
  });
}
function brandCluster(t) {
  const k = cub(k01(t, T.brand - 0.1, 0.4)); if (k <= 0 && t < T.brand - 0.5) return;
  at(540, P2, 1, 1, () => {
    indexCard(0, -330, 760, 380, -0.02, '', [], k);
    if (k > 0) at(0, -330 + (1 - cub(cl(k))) * -160, 1, cl(k * 2), () => { if (IMG.icon) cv.drawImage(IMG.icon, 190, -110, 150, 150); if (IMG.wordL) { const w = 400, h = (w * IMG.wordL.height) / IMG.wordL.width; cv.drawImage(IMG.wordL, -250, -h / 2 - 30, w, h); }
      txt('کامل‌ترین پلتفرم بک‌تست ایران', 0, 110, 40, INK, { w: 800 }); }, -0.02);
    polaroid('dash', [180, 40, 1000, 560], 40, 230, 720, 0.035, 'داشبورد بک‌تست‌لب', k01(t, ws(40), 0.45));
  });
}
function threeCards(t, verdict) {
  const lab = ['۱', '۲', '۳'], short = [['خرید در', 'باز شدن لندن'], ['فروش در', 'باز شدن لندن'], ['خرید در', 'باز شدن نیویورک']];
  const fallT = ws(92);
  for (let i = 0; i < 3; i++) {
    const k = pop(t - T.three - 0.1 - i * 0.18, 12, 0.6), lose = i !== winI, fall = lose ? cl((t - fallT - i * 0.12) / 0.9) : 0;
    const x = cardX[i], y = P3, rot = [-0.05, 0.03, -0.035][i];
    indexCard(x, y, 320, 460, rot, lab[i], short[i], k, fall);
    if (fall >= 0.75) continue;
    const dyf = fall * fall * 2600, af = 1 - cl(fall * 1.4 - 0.4);
    cv.save(); cv.globalAlpha *= af;
    // «؟» until the results arrive
    const kr = cub(k01(t, T.verdict - 0.2, 0.4));
    if (kr < 1) sticky('؟', x + 70, y + 120 + dyf, 110, 0.12, cub(k01(t, ws(53) - 0.1 + i * 0.12, 0.3)) * (1 - kr), YEL, 80);
    // the real result, printed from the strategies page, pinned over the card
    const c = byName(NAMES[i]); if (c && kr > 0) polaroid('strats', c.r, x, y + 30 + dyf, 320, rot * 0.6, '', kr);
    if (c && kr > 0) {
      const win = i === winI, up = c.netNum >= 0, sx = x, sy = y + 160 + dyf;
      if (win) stampInk(up ? 'سود داد' : 'کمترین ضرر', sx, sy, 62, '#1E8E4F', -0.18, k01(t, ws(84) - 0.05, 0.22));
      else stampInk('اعصاب‌خردکن', sx, sy, 50, RED, 0.16, k01(t, ws(89) - 0.1 + (i === 2 ? 0.15 : 0), 0.22));
      // its real numbers, on a tag under the card
      const kt = pop(t - (win ? ws(85) : ws(90)) + 0.05, 13, 0.55);
      if (kt > 0) at(x, y + 300 + dyf, cl(kt, 0, 1.15), cl(kt), () => { const l1 = `${up ? 'سود' : 'ضرر'} ${fa(Math.abs(Math.round(c.netNum)))} دلار`, l2 = `وین‌ریت ${c.win.replace('٫۰٪', '٪')} · ${fa(c.total)} معامله`, w = Math.max(measure(l1, 40), measure(l2, 26, 700)) + 50;
        shadowed(() => rrect(-w / 2, -54, w, 108, 8, '#FBFAF6'), 16, 8, 0.45); txt(l1, 0, -14, 40, up ? '#1E8E4F' : RED); txt(l2, 0, 30, 26, INK, { w: 700 }); }, rot);
    }
    cv.restore();
  }
  // the strings between the cards
  const ks = cub(k01(t, ws(55), 0.6)); string(cardX[0], P3 - 180, cardX[1], P3 - 180, ks * (1 - cl((t - fallT) / 0.3)), 60); string(cardX[1], P3 - 180, cardX[2], P3 - 180, ks * (1 - cl((t - fallT) / 0.3)), 60);
  // the winner's ribbon
  const kw = pop(t - T.winner - 0.1, 11, 0.5); if (kw > 0) at(cardX[winI], P3 - 250, cl(kw, 0, 1.2), cl(kw), () => { shadowed(() => { circle(0, 0, 70, '#E8B931'); }, 20, 8, 0.5); circle(0, 0, 54, null, '#FFF3B0', 6); txt('برنده', 0, 4, 34, INK); [-1, 1].forEach((s) => { cv.fillStyle = '#C62828'; cv.beginPath(); cv.moveTo(s * 20, 60); cv.lineTo(s * 50, 150); cv.lineTo(s * 30, 135); cv.lineTo(s * 14, 160); cv.lineTo(s * 4, 64); cv.fill(); }); });
}
function saveCluster(t) {
  at(540, P4, 1, 1, () => {
    const m = RR.modal || [496, 230, 448, 440], c = RR.clist || [793, 208, 361, 193];
    polaroid('smodal', m, 120, -170, 640, -0.04, 'قانون‌های استراتژی', k01(t, ws(61) - 0.2, 0.45));
    polaroid('clist', c, -150, 410, 560, 0.05, 'چک‌لیست ورود', k01(t, ws(63) - 0.2, 0.45));
    stampInk('ذخیره شد', 200, 0, 84, '#2B4C9B', -0.14, k01(t, ws(67) - 0.05, 0.22));
  });
}
function testCluster(t) {
  const caps = ['خرید لندن', 'فروش لندن', 'خرید نیویورک'];
  at(540, P5, 1, 1, () => { ['rA', 'rB', 'rC'].forEach((key, i) => polaroid(key, [40, 150, 1150, 690], [250, 0, -250][i], [-180, 40, 260][i], 600, [0.06, -0.03, 0.05][i], caps[i], k01(t, [ws(70), ws(71), ws(72)][i] - 0.15, 0.45))); });
}
/** a ring on part of a photo, in the photo's own coordinates: r is the crop, q the part (CSS px of the capture) */
function ringLocal(r, q, x0, y0, w, k, col = RED) { if (k <= 0) return; const sc = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; rrect(x0 + (q[0] - r[0]) * sc - m, y0 + (q[1] - r[1]) * sc - m, q[2] * sc + 2 * m, q[3] * sc + 2 * m, 12, null, col, 6); cv.restore(); }
function analyticsCluster(t) {
  const rF = [470, 150, 560, 240], rW = [520, 155, 640, 295];
  at(540, P6, 1, 1, () => {
    polaroid('anF', rF, 0, -250, 860, -0.03, 'آنالیز، استراتژی به استراتژی', k01(t, ws(77) - 0.2, 0.45), { draw: (x0, y0, w) => ringLocal(rF, [598, 218, 270, 156], x0, y0, w, cub(k01(t, ws(79), 0.3))) });
    polaroid('anW', rW, 0, 330, 880, 0.035, 'فقط: ' + BEST, k01(t, ws(81) - 0.15, 0.45), { draw: (x0, y0, w) => { ringLocal(rW, [884, 286, 194, 28], x0, y0, w, cub(k01(t, ws(81) + 0.2, 0.3))); ringLocal(rW, [1036, 396, 108, 48], x0, y0, w, cub(k01(t, ws(82), 0.3)), '#1E8E4F'); } });
  });
}
function ctaCluster(t) {
  at(CTAX, P3, 1, 1, () => {
    sticky('شروع رایگان', 0, -160, 520, -0.05, cub(k01(t, ws(97) - 0.1, 0.35)), YEL, 72);
    const kt = pop(t - ws(99) + 0.1, 13, 0.55); if (kt > 0) at(0, 260, cl(kt, 0, 1.15), cl(kt), () => { const s = 'لینک توی بیو', w = measure(s, 70) + 100; shadowed(() => rrect(-w / 2, -66, w, 132, 66, WHITE), 20, 10, 0.5); txt(s, 0, 4, 70, VIO); pin(w / 2 - 40, -40); }, 0.03);
    if (IMG.icon) { const ki = cub(k01(t, ws(99), 0.35)); if (ki > 0) at(0, 520, 1, ki, () => { shadowed(() => cv.drawImage(IMG.icon, -80, -80, 160, 160), 20, 8, 0.5); pin(0, -70); }); }
  });
}
// the strings that lead from one part of the board to the next, drawn as the camera follows them
function leads(t) {
  string(790, P1 + 560, 540, P2 - 560, cub(k01(t, T.brand - 0.45, 0.8)), 160);
  string(540, P2 + 640, 540, P3 - 300, cub(k01(t, T.three - 0.45, 0.8)), 140);
  string(540, P3 + 260, 540, P4 - 560, cub(k01(t, T.save - 0.45, 0.8)), 140);
  string(540, P4 + 640, 540, P5 - 520, cub(k01(t, T.test - 0.45, 0.8)), 140);
  string(540, P5 + 560, 540, P6 - 520, cub(k01(t, T.analytics - 0.45, 0.8)), 140);
  string(cardX[0] + 160, P3, CTAX - 280, P3 - 160, cub(k01(t, T.cta - 0.4, 0.7)), 100);
}

// ---------- the label-tape captions ----------
const CAPS = [
  [0, [[['نظرت', 0], ['چیه؟', 1]], [['با', 2], ['هم', 3], ['یه', 4], ['خودکشی', 5, 'R'], ['کنیم؟', 6]]]],
  [7, [[['برنامه', 7], ['اینه:', 8]]]],
  [9, [[['بدون', 9], ['اینکه', [10, 11]], ['بک‌تست', 12], ['بگیریم،', 13]], [['وارد', 14], ['بازار', 15], ['مالی', 16], ['بشیم', 17]]]],
  [18, [[['و', 18], ['در', 19], ['کمترین', 20], ['زمان', 21], ['ممکن', 22]], [['کل', 23], ['سرمایه‌مونو', [24, 25], 'R'], ['از', 26], ['دست', 27], ['بدیم.', 28]]]],
  [29, [[['اما', 29], ['اگه', 30], ['نخوایم،', 31]], [['راه‌حل', [32, 33], 'Y'], ['چیه؟', 34]]]],
  [35, [[['اینجاست', 35], ['که', 36], ['بک‌تست‌لب', [37, 38], 'V']], [['کامل‌ترین', [39, 40]], ['پلتفرم', 41], ['بک‌تست', 42], ['ایران', 43]], [['به', 44], ['کمکت', 45], ['میاد.', 46]]]],
  [47, [[['سه', 47], ['تا', 48], ['استراتژی', 49], ['داری', 50]], [['و', 51], ['نمی‌دونی', 52], ['کدومش', 53, 'Y']], [['واقعاً', 54], ['کار', 55], ['می‌کنه؟', 56]]]],
  [57, [[['هر', 57], ['کدوم', 58], ['رو', 59], ['با', 60], ['قانون‌ها', 61, 'Y']], [['و', 62], ['چک‌لیستش', 63, 'Y']], [['توی', 64], ['بک‌تست‌لب', [65, 66], 'V'], ['ذخیره', 67], ['کن،', 68]]]],
  [69, [[['روی', 69], ['بازار', 70], ['واقعی', 71, 'Y'], ['گذشته', 72]], [['تستشون', 73], ['کن', 74]]]],
  [75, [[['و', 75], ['توی', 76], ['آنالیز', 77, 'Y']], [['هر', 78], ['استراتژی', 79], ['رو', 80], ['جدا', 81], ['ببین.', 82]]]],
  [83, [[['کدوم', 83], ['سود', 84, 'G'], ['داده', 85]], [['و', 86], ['کدوم', 87], ['فقط', 88]], [['اعصابتو', 89, 'R'], ['خورده.', 90]]]],
  [91, [[['بعد', 91], ['فقط', 92], ['برنده', 93, 'Y']], [['وارد', 94], ['بازار', 95], ['شو.', 96]]]],
  [97, [[['شروع', 97], ['رایگان،', 98, 'Y']], [['لینکش', 99], ['توی', 100], ['بیوئه.', 101]]]],
];
const wi = (x) => (Array.isArray(x) ? x[0] : x);
function captions(t) {
  if (t > T.end - 0.1) return;
  let gi = -1; CAPS.forEach((g, i) => { if (t >= ws(g[0]) - 0.15) gi = i; }); if (gi < 0) gi = 0;
  const [, lines] = CAPS[gi], nextAt = gi + 1 < CAPS.length ? ws(CAPS[gi + 1][0]) - 0.15 : T.end, out = k01(t, nextAt - 0.08, 0.08);
  const size = 62, lh = 112, y0 = 300 + (3 - lines.length) * 0;
  lines.forEach((ln, li) => {
    const gap = measure(' ', size, 800) * 1.4, ws_ = ln.map(([s]) => measure(s, size, 800)), vis = ln.map(([, w]) => t >= ws(wi(w)) - 0.06);
    const n = vis.filter(Boolean).length; if (!n) return;
    const shown = ws_.filter((_, j) => vis[j]), total = shown.reduce((a, b) => a + b, 0) + gap * (n - 1), pad = 34, h = size * 1.55, y = y0 + li * lh, rot = (li % 2 ? 1 : -1) * 0.012;
    at(CX, y, 1, 1 - out, () => {
      cv.save(); cv.shadowColor = 'rgba(0,0,0,0.55)'; cv.shadowBlur = 16; cv.shadowOffsetY = 8; rrect(-total / 2 - pad, -h / 2, total + 2 * pad, h, 8, '#121212'); cv.restore();
      rrect(-total / 2 - pad, -h / 2, total + 2 * pad, 6, 3, 'rgba(255,255,255,0.06)');
      let right = total / 2;
      ln.forEach(([s, w, c], j) => { if (!vis[j]) return; const d = t - ws(wi(w)) + 0.06, k = pop(d, 24, 0.6), wpx = ws_[j];
        at(right - wpx / 2, 2, lerp(1.25, 1, cl(k)), cl(d / 0.06), () => { txt(s, 0, 2, size, 'rgba(0,0,0,0.6)', { w: 800 }); txt(s, 0, 0, size, c ? TC[c] : '#F4F4F4', { w: 800 }); });
        right -= wpx + gap; });
    }, rot);
  });
}

// ---------- the frame ----------
function endCard(t) {
  const k = cub(k01(t, T.end + 0.1, 0.5)); if (k <= 0) return;
  cv.save(); cv.globalAlpha = k * 0.72; cv.fillStyle = '#0E0B0A'; cv.fillRect(0, 0, W, H); cv.restore();
  const ki = pop(t - T.end - 0.25, 12, 0.6); if (ki > 0 && IMG.icon) at(CX, 640, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 50; cv.drawImage(IMG.icon, -130, -130, 260, 260); });
  const kw = cub(k01(t, T.end + 0.45, 0.35)); if (kw > 0 && IMG.word) { const w = 520, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, CX - w / 2, 820 + (1 - kw) * 24, w, h); cv.restore(); }
  const kf = pop(t - T.end - 0.7, 14, 0.55); if (kf > 0) at(CX, 1080, cl(kf, 0, 1.25), cl(kf), () => { const s = 'اول تست، بعد ترید', w = measure(s, 58) + 90; rrect(-w / 2, -58, w, 116, 12, '#121212'); txt(s, 0, 4, 58, YEL); }, -0.02);
  const kb = pop(t - T.end - 0.95, 14, 0.6); if (kb > 0) at(CX, 1260, cl(kb, 0, 1.2), cl(kb), () => { rrect(-260, -70, 520, 140, 70, WHITE); txt('لینک توی بیو', 0, 4, 60, VIO); });
}
function frame(t) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  const [cx, cy, z] = cam(t), sh = (a, amp) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0);
  const shake = sh(T.but, 18) + sh(ws(84), 6) + sh(T.winner, 6);
  cv.fillStyle = CORK; cv.fillRect(0, 0, W, H);
  cv.save(); cv.translate(W / 2 + shake, H * 0.6); cv.scale(z, z); cv.translate(-cx, -cy);
  if (!PAT) PAT = cv.createPattern(TEX, 'repeat'); cv.fillStyle = PAT; const vw = W / z, vh = H / z; cv.fillRect(cx - vw, cy - vh, vw * 2, vh * 2);
  leads(t);
  folderPlan(t); brandCluster(t); threeCards(t); saveCluster(t); testCluster(t); analyticsCluster(t); ctaCluster(t);
  cv.restore();
  // a desk lamp: warm light from the top, dark corners
  const g = cv.createRadialGradient(CX, 700, 200, CX, 900, 1500); g.addColorStop(0, 'rgba(255,214,150,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  captions(t); endCard(t);
}
window.seek = frame;
window.cover = () => {
  frame(T.but + 0.7);
  cv.setTransform(1, 0, 0, 1, 0, 0); { const g = cv.createLinearGradient(0, 0, 0, 820); g.addColorStop(0, 'rgba(14,11,10,0.75)'); g.addColorStop(0.6, 'rgba(14,11,10,0.45)'); g.addColorStop(1, 'rgba(14,11,10,0)'); cv.fillStyle = g; cv.fillRect(0, 0, W, 820); }
  const s1 = 'نظرت چیه باهم', s2 = 'یه خودکشی کنیم؟';
  [[s1, 330, '#F4F4F4'], [s2, 490, TC.R]].forEach(([s, y, c]) => { const w = measure(s, 100, 800) + 100; at(CX, y, 1, 1, () => { rrect(-w / 2, -85, w, 170, 10, '#121212'); txt(s, 0, 4, 100, c, { w: 800 }); }, y > 400 ? 0.015 : -0.015); });
  at(772, 1470, 1, 1, () => { const s = 'پرونده: خودکشی مالی', w = measure(s, 40) + 56; rrect(-w / 2, -40, w, 80, 8, '#121212'); txt(s, 0, 3, 40, '#FBF5E6'); }, -0.05);
};
