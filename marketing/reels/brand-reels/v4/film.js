// v4 · the manifesto as a cinematic product film. The same voice and timing as v1 (../v1/data.json).
// Real BacktestLab screens float on tilted 3D planes (CSS 3D) in a dark violet space; the camera drifts and pushes in
// slowly, cuts on the words and whip-pans between features. A light sweep crosses each screen; film grain, a vignette
// and soft flashes on the beats. The words run as large subtitles at the bottom, revealed word by word. In order:
//   - a real replay of gold advancing (f1's replay frames, as a flipbook);
//   - the clean replay out of focus while «حدس زدن» is said, pulled sharp on «تمام» (guessing ends);
//   - the BacktestLab icon and wordmark;
//   - New session (آزمایش), the real Monte Carlo simulation (شبیه‌سازی), Analytics (تحلیل);
//   - the chart with drawing tools (بک‌تست دستی); the win/loss and donut panels of Analytics (ارزیابی);
//   - prop-firm rules: no screen (the platform has no rule simulation), only a glass shield and three rule chips;
//   - the dashboard, a scroll down the full Analytics page (سنجش عملکرد), the journal (تصمیم‌گیری);
//   - four screens converge into one stack (یک‌پارچه);
//   - a placed order desaturates on «صرفاً معامله»; a planned position (entry, stop, target) with a check on «آماده»;
//   - the wordmark, «شروعش رایگانه», «لینک توی بیو».
// 1080×1920, every frame a pure function of t (window.seek). Key content inside y 220–1520.
const W = 1080, H = 1920, CX = 540, CY = 740;
const VIO = '#A48DFF', RED = '#FF4D5E', GRN = '#4ADE80';
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3), io = (x) => { x = cl(x); return x < 0.5 ? 4 * x ** 3 : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const sine = (x) => 0.5 - Math.cos(Math.PI * cl(x)) / 2;
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- DOM ----------
const stage = document.getElementById('stage'), persp = document.getElementById('persp'), ov = document.getElementById('ov'), caps = document.getElementById('caps');
const el = (tag, cls, parent, css, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (css) Object.assign(e.style, css); if (html !== undefined) e.innerHTML = html; parent.appendChild(e); return e; };
const svgIcon = (name, size, col, sw) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[name]}</svg>`;

// ---------- the screens: one plane per picture ----------
const SIZE = { tall: [1200, 3960] };   // the full Analytics page is tall; every other screen is 16:10
const P = {};
function plane(key) {
  if (P[key]) return P[key]; const [w, h] = SIZE[key] || [1600, 1000];
  const d = el('div', 'plane', persp, { width: w + 'px', height: h + 'px', left: CX - w / 2 + 'px', top: CY - h / 2 + 'px' });
  const imgs = key === 'flip' ? window.FLIP.map((src) => el('img', '', d, null)).map((im, i) => ((im.src = window.FLIP[i]), im)) : [el('img', '', d, null)];
  if (key !== 'flip') imgs[0].src = window.IMGS[key];
  const gl = el('div', 'gl', d, null);
  return (P[key] = { d, imgs, gl, w, h, on: false });
}
const BASE = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, u: 0.5, v: 0.5, blur: 0, br: 1, sat: 1, op: 1 };
/** Put a plane in a state: the point (u, v) of the screen is the one at the centre of the frame. */
function place(p, st, glare) {
  if (!p.on) { p.d.style.display = 'block'; p.on = true; }
  p.d.style.transform = `translate3d(${st.x}px,${st.y}px,${st.z}px) rotateX(${st.rx}deg) rotateY(${st.ry}deg) rotateZ(${st.rz}deg) scale(${st.s}) translate(${(0.5 - st.u) * p.w}px,${(0.5 - st.v) * p.h}px)`;
  p.d.style.filter = st.blur > 0.05 || st.br !== 1 || st.sat !== 1 ? `blur(${st.blur.toFixed(2)}px) brightness(${st.br.toFixed(3)}) saturate(${st.sat.toFixed(3)})` : 'none';
  p.d.style.opacity = st.op; p.gl.style.backgroundPosition = `${lerp(130, -30, glare)}% 0`;
}
const mix = (a, b, k) => { const o = {}; for (const n in BASE) o[n] = lerp(a[n], b[n], k); return o; };

// shots: [key, t0, t1, from, to, { whip: direction into this shot, mod(t, state) }]
const SH = [];
const shot = (key, t0, t1, a, b, o = {}) => SH.push({ key, t0, t1, a: { ...BASE, ...a }, b: { ...BASE, ...a, ...b }, ...o });
shot('flip', -0.6, T.guess, { u: 0.4, v: 0.43, z: -80, rx: 10, ry: -26, s: 1.06, x: 30 }, { u: 0.47, v: 0.46, z: 250, rx: 6, ry: -15, x: -20 });
shot('clean', T.guess, T.we, { u: 0.36, v: 0.4, z: 300, rx: -6, ry: 18, s: 1.05, x: -40 }, { u: 0.45, v: 0.43, z: 430, rx: -3, ry: 10, x: 20 },
  { mod: (t, s) => { const f = io(k01(t, ws(10) - 0.06, 0.42)); s.blur = lerp(18, 0, f); s.br = lerp(0.5, 1, f); } });
shot('hero', T.we, T.three, { z: -420, s: 1.25, blur: 14, br: 0.32 }, { z: -330 });
shot('session', T.three, ws(18) - 0.06, { u: 0.5, v: 0.42, z: -60, rx: 14, ry: -10, s: 1.1 }, { v: 0.5, z: 200, rx: 9, ry: -5 });
shot('monte', ws(18) - 0.06, ws(20) - 0.06, { u: 0.56, v: 0.76, z: 260, rx: 8, ry: 16, s: 1.1 }, { u: 0.42, z: 340, rx: 6, ry: 11 }, { whip: -1 });
shot('an', ws(20) - 0.06, T.manual, { u: 0.5, v: 0.62, z: 100, rx: 12, ry: -16, s: 1.02 }, { u: 0.4, v: 0.57, z: 400, rx: 5, ry: -6 }, { whip: 1 });
shot('tools', T.manual, T.evals, { u: 0.3, v: 0.38, z: 330, rx: 6, ry: 20, s: 1.05 }, { u: 0.44, v: 0.42, z: 480, rx: 3, ry: 12 });
shot('an2', T.evals, T.prop, { u: 0.36, v: 0.73, z: 200, rx: -8, ry: -16, s: 1.05 }, { u: 0.45, v: 0.75, z: 430, rx: -4, ry: -8 });
shot('dash', T.prop, T.tools, { z: -520, s: 1.3, blur: 12, br: 0.28 }, { z: -430 });
shot('dash', T.tools, ws(48) - 0.06, { u: 0.45, v: 0.4, z: 60, rx: 12, ry: -18, s: 1.05 }, { u: 0.5, v: 0.45, z: 310, rx: 8, ry: -10 });
shot('tall', ws(48) - 0.06, ws(52) - 0.06, { u: 0.42, v: 0.1, z: -120, rx: 26, s: 1.0 }, { v: 0.5 }, { whip: -1, lin: true });
shot('jour', ws(52) - 0.06, T.one, { u: 0.5, v: 0.42, z: 150, rx: 8, ry: 14, s: 1.05 }, { u: 0.56, v: 0.5, z: 380, rx: 4, ry: 8 }, { whip: 1 });
shot('placed', T.not_, T.ready, { u: 0.62, v: 0.38, z: 260, rx: 6, ry: -14, s: 1.05 }, { u: 0.69, v: 0.4, z: 460, rx: 3, ry: -8 },
  { mod: (t, s) => { const f = io(k01(t, ws(64) - 0.05, 0.5)); s.sat = lerp(1, 0, f); s.br = lerp(1, 0.42, f); } });
shot('buy', T.ready, T.end, { u: 0.55, v: 0.53, z: 200, rx: -6, ry: 16, s: 1.05 }, { u: 0.61, v: 0.56, z: 470, rx: -3, ry: 8 });
shot('hero', T.end, DUR + 1, { z: -440, s: 1.25, blur: 14, br: 0.3 }, { z: -320 });
// one: four screens scattered in space converge into one stack on «یک‌پارچه»
const ONE = [['dash', { x: -250, y: -340, z: -280, rx: 10, ry: -22, rz: -4 }], ['jour', { x: 270, y: -120, z: -620, rx: 6, ry: 20, rz: 3 }],
  ['an', { x: -210, y: 190, z: -220, rx: -6, ry: -14, rz: 2 }], ['clean', { x: 250, y: 400, z: -460, rx: 8, ry: 24, rz: -3 }]];

// ---------- the overlays ----------
let BR, BRW, END, ENDW, SHIELD, CHIPS, CHECK;
function overlays() {
  BR = el('img', 'abs', ov, { width: '250px', left: CX - 125 + 'px', top: 560 + 'px' }); BR.src = window.LOGO.icon;
  BRW = el('img', 'abs', ov, { width: '660px', left: CX - 330 + 'px', top: 870 + 'px' }); BRW.src = window.LOGO.word;
  END = el('img', 'abs', ov, { width: '220px', left: CX - 110 + 'px', top: 470 + 'px' }); END.src = window.LOGO.icon;
  ENDW = el('img', 'abs', ov, { width: '680px', left: CX - 340 + 'px', top: 760 + 'px' }); ENDW.src = window.LOGO.word;
  SHIELD = el('div', 'glass', ov, { width: '330px', height: '330px', left: CX - 165 + 'px', top: 470 + 'px', borderRadius: '86px' }, svgIcon('shield-check', 200, '#fff', 1.4));
  const row = el('div', 'chips', ov, { top: 900 + 'px' });
  CHIPS = ['حد ضرر روزانه', 'حداکثر افت', 'هدف سود'].map((s) => el('div', 'chip', row, null, s));
  CHECK = el('div', 'abs', ov, { width: '190px', height: '190px', left: 840 - 95 + 'px', top: 430 - 95 + 'px', borderRadius: '50%', background: GRN, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 90px rgba(74,222,128,.5)' }, svgIcon('check', 120, '#06060C', 3.2));
  [BR, BRW, END, ENDW, SHIELD, CHECK].forEach((e) => (e.style.opacity = 0));
}

// ---------- the subtitles ----------
// a group: { at, lines: [[size 'bg' | 'md' | 'sm', [[text, word index or time, { c, strike, ul }], …]], …] }
const G = [];
const grp = (at, lines) => G.push({ at, lines });
const wt = (i) => (Number.isInteger(i) ? ws(i) - 0.05 : i);
grp(-1, [['bg', [['ترید', -1], ['حرفه‌ای', -1, { c: VIO }]]], ['sm', [['از', 2], ['جایی', 3], ['شروع', 4], ['می‌شود', 5]]]]);
grp(T.guess - 0.05, [['sm', [['که', 7]]], ['bg', [['حدس', 8, { strike: ws(10) }], ['زدن', 9, { strike: ws(10) + 0.08 }]]], ['md', [['تمام', 10], ['می‌شود.', 11]]]]);
grp(T.we - 0.05, [['sm', [['ما', 13]]], ['bg', [['بستری', 14], ['جامع', 15, { c: VIO }]]]]);
grp(T.three - 0.05, [['sm', [['برای', 16]]], ['bg', [['آزمایش،', 17, { c: VIO }]]]]);
grp(ws(18) - 0.06, [['sm', [['برای', ws(18) - 0.06]]], ['bg', [['شبیه‌سازی', 18, { c: VIO }]]]]);
grp(ws(19) - 0.06, [['sm', [['برای', ws(19) - 0.06]]], ['bg', [['و', 19], ['تحلیل', 20, { c: VIO }]]]]);
grp(ws(21) - 0.06, [['bg', [['استراتژی‌های', 21], ['معاملاتی', 23]]], ['sm', [['فراهم', 24], ['کرده‌ایم.', 25]]]]);
grp(T.manual - 0.05, [['sm', [['از', 27], ['بک‌تستِ', 28]]], ['bg', [['دستی', 29], ['و', 30], ['خودکار', 31, { c: VIO }]]]]);
grp(T.evals - 0.05, [['sm', [['تا', 32]]], ['bg', [['ارزیابیِ', 33, { c: VIO }]]], ['sm', [['سیستم‌های', 34], ['معاملاتی', 36]]]]);
grp(T.prop - 0.05, [['sm', [['و', 37], ['شبیه‌سازیِ', 38]]], ['bg', [['قوانین', 39], ['پراپ‌فرم‌ها', 40, { c: VIO }]]]]);
grp(T.tools - 0.05, [['bg', [['تمامِ', 43], ['ابزارهای', 44]]], ['sm', [['موردِ', 45], ['نیاز', 46]]]]);
grp(ws(47) - 0.06, [['sm', [['برای', 47]]], ['bg', [['سنجشِ', 48, { c: VIO }], ['عملکرد', 49]]]]);
grp(ws(51) - 0.06, [['sm', [['و', 51]]], ['bg', [['تصمیم‌گیریِ', 52], ['آگاهانه', 53, { c: VIO }]]]]);
grp(T.one - 0.05, [['sm', [['در', 54], ['یک', 55], ['محیطِ', 56], ['حرفه‌ای', 57]]], ['bg', [['و', 58], ['یک‌پارچه.', 59, { c: VIO }]]]]);
grp(T.not_ - 0.05, [['sm', [['اینجا', 61]]], ['bg', [['قرار', 62], ['نیست', 63]]], ['md', [['صرفاً', 64, { c: RED, ul: ws(64) + 0.1 }], ['معامله', 65], ['کنید.', 66]]]]);
grp(T.ready - 0.05, [['sm', [['قرار', 67], ['است', 68]]], ['md', [['پیش', 69], ['از', 70], ['معامله،', 71]]], ['bg', [['آماده', 72, { c: GRN }], ['شوید.', 73]]]]);
grp(T.end + 0.5, [['bg', [['شروعش', T.end + 0.55], ['رایگانه', T.end + 0.7]]], ['sm', [['لینک', T.end + 1.0, { c: VIO }], ['توی', T.end + 1.05, { c: VIO }], ['بیو', T.end + 1.1, { c: VIO }]]]]);
function subtitles() {
  G.forEach((g, gi) => {
    g.t1 = gi + 1 < G.length ? G[gi + 1].at : 1e9; g.d = el('div', 'grp', caps, null); g.bar = el('div', 'bar', g.d, null); g.words = [];
    g.lines.forEach(([size, toks]) => {
      const ln = el('div', 'ln ' + size, g.d, null);
      toks.forEach(([s, i, o = {}], j) => {
        if (j) ln.appendChild(document.createTextNode(' '));
        const w = el('span', 'wd', ln, o.c ? { color: o.c } : null, s), it = { e: w, at: wt(i) };
        if (o.strike) { it.st = el('i', 'st', w, null); it.sa = o.strike; }
        if (o.ul) { it.ul = el('i', 'ul', w, null); it.ua = o.ul; }
        g.words.push(it);
      });
      const max = 920; if (ln.scrollWidth > max) ln.style.fontSize = parseFloat(getComputedStyle(ln).fontSize) * (max / ln.scrollWidth) + 'px';
    });
    g.d.style.display = 'none';
  });
}

// ---------- grain ----------
const GRAIN = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = rnd(i * 0.37) * 255; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; } g.putImageData(d, 0, 0); return c.toDataURL(); })();

// ---------- a frame ----------
const FLASH = [[T.we, 0.55], [ws(10), 0.3], [ws(59), 0.5], [ws(72), 0.5], [T.end, 0.4]];
const PUNCH = [ws(10), ws(59), ws(72)];
function frame(t, o = {}) {
  Object.values(P).forEach((p) => (p.used = false));
  // the shots on screen now (a whip-pan overlaps the outgoing and the incoming shot)
  SH.forEach((sh, i) => {
    const nx = SH[i + 1], out = nx && nx.whip && Math.abs(nx.t0 - sh.t1) < 0.01 ? nx.whip : 0;
    if (t < sh.t0 - (sh.whip ? 0 : 0) || t >= sh.t1 + (out ? 0.0 : 0)) return;
    const k = (t - sh.t0) / (sh.t1 - sh.t0), st = mix(sh.a, sh.b, sh.lin ? cl(k) : sine(k));
    if (sh.mod) sh.mod(t, st);
    if (sh.whip) { const w = 1 - cub(k01(t, sh.t0, 0.24)); st.x += sh.whip * 900 * w; st.blur += 10 * w; }
    if (out) { const w = io(k01(t, sh.t1 - 0.14, 0.14)); st.x -= out * 900 * w; st.blur += 10 * w; }
    const p = plane(sh.key); place(p, st, k); p.used = true;
    if (sh.key === 'flip') { const n = p.imgs.length, f = Math.min(n - 1, Math.max(0, Math.floor(((t + 0.1) / (T.guess - 0.1)) * n))); p.imgs.forEach((im, j) => (im.style.visibility = j === f ? 'visible' : 'hidden')); }
  });
  if (t >= T.one && t < T.not_) {
    const c = io(k01(t, ws(59) - 0.18, 0.45)), drift = t - T.one;
    ONE.forEach(([key, a], i) => {
      const loose = { ...BASE, ...a, s: 0.56, x: a.x + Math.sin(drift * 0.9 + i) * 14, y: a.y + Math.cos(drift * 0.8 + i * 2) * 12, ry: a.ry + drift * 2 * (i % 2 ? -1 : 1) };
      const tight = { ...BASE, s: 0.6, x: -i * 4, y: 60 - i * 22, z: -i * 40, rx: 8, ry: -8 + i * 0.0, rz: 0 };
      const st = mix(loose, tight, c); st.br = lerp(0.85, i === 0 ? 1 : 0.7, c);
      const p = plane(key); place(p, st, cl(drift / 2.7)); p.d.style.zIndex = 10 - i; p.used = true;
    });
  } else Object.values(P).forEach((p) => (p.d.style.zIndex = ''));
  Object.values(P).forEach((p) => { if (!p.used && p.on) { p.d.style.display = 'none'; p.on = false; } });

  // camera punch on the beats
  const punch = PUNCH.reduce((z, a) => z + (t >= a ? 0.035 * Math.exp(-(t - a) * 7) : 0), 0);
  persp.style.transform = punch > 0.0005 ? `scale(${1 + punch})` : '';

  // overlays
  const vis = (e, k) => { e.style.opacity = cl(k).toFixed(3); };
  const brIn = pop(t - T.we + 0.02, 14, 0.6), brOut = 1 - cub(k01(t, T.three - 0.12, 0.16));
  vis(BR, cl(brIn * 3) * brOut); BR.style.transform = `scale(${0.4 + 0.6 * brIn})`;
  const bw = cub(k01(t, ws(14) - 0.12, 0.45)); vis(BRW, (bw > 0 ? 1 : 0) * brOut); BRW.style.clipPath = `inset(0 0 0 ${(1 - bw) * 100}%)`;
  const ei = pop(t - T.end - 0.02, 14, 0.6); vis(END, cl(ei * 3)); END.style.transform = `scale(${0.4 + 0.6 * ei})`;
  const ew = cub(k01(t, T.end + 0.2, 0.5)); vis(ENDW, ew > 0 ? 1 : 0); ENDW.style.clipPath = `inset(0 0 0 ${(1 - ew) * 100}%)`;
  const sh = pop(t - T.prop - 0.04, 13, 0.55), shOut = 1 - cub(k01(t, T.tools - 0.12, 0.16));
  vis(SHIELD, cl(sh * 3) * shOut); SHIELD.style.transform = `translateY(${Math.sin((t - T.prop) * 2.2) * 8}px) rotate(${(1 - sh) * -12}deg) scale(${0.5 + 0.5 * sh})`;
  CHIPS.forEach((c, i) => { const k = cub(k01(t, ws(39) + 0.05 + i * 0.22, 0.3)); c.style.opacity = (k * shOut).toFixed(3); c.style.transform = `translateY(${(1 - k) * 30}px)`; c.style.filter = `blur(${((1 - k) * 8).toFixed(2)}px)`; });
  const ck = pop(t - ws(72) + 0.04, 15, 0.5), ckOut = 1 - cub(k01(t, T.end - 0.12, 0.16)); vis(CHECK, cl(ck * 3) * ckOut); CHECK.style.transform = `scale(${0.3 + 0.7 * ck})`;

  // subtitles
  G.forEach((g) => {
    if (t < g.at - 0.05 || t > g.t1 + 0.25) { g.d.style.display = 'none'; return; }
    g.d.style.display = 'block'; const e = o.cover ? 0 : cub(k01(t, g.t1 - 0.1, 0.2));
    g.d.style.opacity = (1 - e).toFixed(3); g.d.style.transform = `translateY(${-26 * e}px)`;
    g.bar.style.transform = `scaleX(${cub(k01(t, g.at, 0.45)).toFixed(3)})`;
    g.words.forEach((w) => {
      const k = o.cover ? 1 : cub(k01(t, w.at, 0.32)); w.e.style.opacity = k.toFixed(3); w.e.style.transform = `translateY(${((1 - k) * 34).toFixed(1)}px)`; w.e.style.filter = k < 0.999 ? `blur(${((1 - k) * 12).toFixed(2)}px)` : 'none';
      if (w.st) w.st.style.transform = `scaleX(${io(k01(t, w.sa, 0.22)).toFixed(3)})`;
      if (w.ul) w.ul.style.transform = `scaleX(${io(k01(t, w.ua, 0.3)).toFixed(3)})`;
    });
  });

  // flashes, glow, grain
  const fl = FLASH.reduce((z, [a, s]) => z + (t >= a - 0.05 ? s * (t < a ? (t - a + 0.05) / 0.05 : Math.exp(-(t - a) * 7)) : 0), 0);
  document.getElementById('flash').style.opacity = cl(fl).toFixed(3);
  document.getElementById('glow').style.opacity = (0.75 + 0.25 * Math.sin(t * 1.3)).toFixed(3);
  const f = Math.round(t * 30); document.getElementById('grain').style.backgroundPosition = `${(rnd(f) * 256) | 0}px ${(rnd(f + 0.5) * 256) | 0}px`;
}

window.DURATION = DUR;
window.seek = (t) => frame(t);
/** The cover: the opening replay with the hook subtitle written out. */
window.cover = () => frame(2.3, { cover: true });
(async () => {
  document.getElementById('grain').style.backgroundImage = `url(${GRAIN})`;
  await Promise.all(['500', '700', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  overlays(); subtitles();
  ['flip', 'clean', 'hero', 'session', 'monte', 'an', 'tools', 'an2', 'dash', 'tall', 'jour', 'placed', 'buy'].forEach(plane);
  const all = [...document.querySelectorAll('img')];
  await Promise.all(all.map((im) => im.decode().catch(() => console.error('missing image: ' + im.src.slice(-60)))));
  window.seek(0); window.ready = true;
})();
