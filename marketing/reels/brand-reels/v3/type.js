// v3 · the manifesto as a Swiss split-tone poster. The same voice and timing as v1 (../v1/data.json).
// Off-white paper and black Vazirmatn (900 against 200), with fields of the brand's violet that slide across the page.
// Type that crosses a field changes colour on it (black → white, violet → black), so one word is set in two tones.
// A running header and footer, thin rules and a violet progress rule frame every page. Each word is revealed by a mask
// opening from the right as it's spoken; at a page change the whole page is wiped off to the left. In order:
//   - «ترید / حرفه‌ای» across a violet column;  - «حدس» across a field, struck through on «تمام»;
//   - a full violet page with the BacktestLab icon and wordmark;  - a numbered list ۰۱ آزمایش, ۰۲ شبیه‌سازی, ۰۳ تحلیل;
//   - «بک‌تست» split in two halves, دستی on paper and خودکار on violet;  - «ارزیابی» over abstract rules (no data);
//   - «قوانین پراپ‌فرم‌ها» as clauses of a document;  - «سنجش عملکرد» on a ruler in a violet band;
//   - an index of the keywords that collapses into one violet block «یک‌پارچه»;  - a violet page «قرار نیست صرفاً
//     معامله کنید»;  - «آماده» in violet;  - the wordmark and «شروعش رایگانه».
// 1080×1920, every frame a pure function of t (window.seek). Key content inside y 260–1500.
const W = 1080, H = 1920, CX = 540, XR = 980, XL = 100;
const PAPER = '#F2EFE8', INK = '#121016', VIO = '#5B3BF6', RED = '#E8352B', GREY = '#8A857C', LILAC = '#C9BEFF';
// on a violet field: black → paper, violet → black, grey → lilac, red → black
const MAP = { [INK]: PAPER, [VIO]: INK, [GREY]: LILAC, [RED]: INK };
let ON = false; const C = (c) => (ON ? MAP[c] ?? c : c);
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3), io = (x) => { x = cl(x); return x < 0.5 ? 4 * x ** 3 : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const qui = (x) => 1 - Math.pow(1 - cl(x), 5);
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

// ---------- drawing ----------
const FONT = (s, w) => `${w} ${s}px Vazirmatn`;
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = 'rtl'; return cv.measureText(s).width; }
function txt(s, x, y, size, col, o = {}) {
  cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha;
  cv.font = FONT(size, o.w ?? 900); cv.textAlign = o.align ?? 'right'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? 'rtl';
  if (o.out) { cv.strokeStyle = C(col); cv.lineWidth = o.out; cv.lineJoin = 'round'; cv.strokeText(s, x, y); } else { cv.fillStyle = C(col); cv.fillText(s, x, y); }
  cv.restore();
}
function rect(x, y, w, h, col) { cv.fillStyle = C(col); cv.fillRect(x, y, w, h); }
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }
/** The wordmark is black on paper and white on a violet field. */
function logo(key, cx, cy, w) { const im = IMG[key === 'word' && ON ? 'wordW' : key]; if (!im) return; const h = (w * im.height) / im.width; cv.drawImage(im, cx - w / 2, cy - h / 2, w, h); }

// ---------- the page items ----------
// word: set at x (its right edge, centre or left edge by align), revealed from the right at `at`
// rule: a line drawn from x1 (right) to x2 (left), or a vertical one (v)
// fn: anything else, drawn by its own function of t
// field: a violet rectangle that slides in from one side ('r', 'l', 't', 'b'); type over it is redrawn in its tones
const S = [];   // scenes: { k, t0, t1, items, fields, label }
let cur = null;
const scene = (k, label) => { cur = { k, label, t0: T[k], items: [], fields: [] }; S.push(cur); return cur; };
function word(s, at, x, y, size, o = {}) {
  let sz = size; const wt = o.w ?? 900; if (o.fit) sz = Math.min(size, (o.fit / measure(s, 100, wt)) * 100);
  const w = measure(s, sz, wt), al = o.align ?? 'r', xr = al === 'r' ? x : al === 'c' ? x + w / 2 : x + w;
  const it = { t: 'w', s, at, xr, w, y, size: sz, wt, col: o.col ?? INK, out: o.out, dur: o.dur ?? 0.3 }; cur.items.push(it); return it;
}
/** A run of words set from the right on one line; toks = [[text, word index or {t}], …]. Returns the items. */
function line(toks, x, y, size, o = {}) {
  const wt = o.w ?? 900, gap = size * 0.3, ws_ = toks.map(([s]) => measure(s, size, wt)), tot = ws_.reduce((a, b) => a + b, 0) + gap * (toks.length - 1);
  let xr = (o.align ?? 'r') === 'r' ? x : o.align === 'c' ? x + tot / 2 : x + tot;
  return toks.map(([s, i, oo = {}], j) => { const it = word(s, Number.isInteger(i) ? ws(i) - 0.04 : i.t, xr, y, size, { ...o, ...oo, align: 'r' }); xr -= ws_[j] + gap; return it; });
}
function rule(at, x1, x2, y, o = {}) { const it = { t: 'r', at, x1, x2, y, lw: o.lw ?? 3, col: o.col ?? INK, dur: o.dur ?? 0.45, v: o.v }; cur.items.push(it); return it; }
function fn(f) { const it = { t: 'f', f }; cur.items.push(it); return it; }
function field(at, x, y, w, h, from = 'r', dur = 0.45) { cur.fields.push({ at, x, y, w, h, from, dur }); }
function fieldRect(f, t) {
  const k = qui(k01(t, f.at, f.dur)); if (k <= 0) return null;
  return f.from === 'r' ? [f.x + f.w * (1 - k), f.y, f.w * k, f.h] : f.from === 'l' ? [f.x, f.y, f.w * k, f.h] : f.from === 't' ? [f.x, f.y, f.w, f.h * k] : [f.x, f.y + f.h * (1 - k), f.w, f.h * k];
}

function drawWord(it, t) {
  const k = qui(k01(t, it.at, it.dur)); if (k <= 0) return;
  const pad = it.size * 0.12, top = it.y - it.size * 1.05, h = it.size * 2.1;
  cv.save(); cv.beginPath(); cv.rect(it.xr + pad - (it.w + pad * 2) * k, top, (it.w + pad * 2) * k, h); cv.clip();
  txt(it.s, it.xr, it.y + (1 - k) * it.size * 0.18, it.size, it.col, { w: it.wt, out: it.out }); cv.restore();
}
function drawRule(it, t) {
  const k = io(k01(t, it.at, it.dur)); if (k <= 0) return;
  if (it.v) { rect(it.y - it.lw / 2, it.x1, it.lw, (it.x2 - it.x1) * k, it.col); return; }
  const a = lerp(it.x1, it.x2, k); rect(Math.min(a, it.x1), it.y - it.lw / 2, Math.abs(it.x1 - a), it.lw, it.col);
}

// ---------- the scenes ----------
function layout() {
  // 01 · trading starts
  scene('hook', 'آغاز');
  field(-0.8, 650, 0, 430, H, 't', 0.5);
  word('ترید', -0.2, XR, 470, 330, { dur: 0.28 });
  word('حرفه‌ای', ws(1) - 0.04, XR, 800, 330, { w: 200, fit: 880 });
  rule(ws(2) - 0.1, XR, XL, 1010);
  line([['از', 2], ['جایی', 3], ['شروع', 4], ['می‌شود', 5]], XR, 1110, 78, { w: 700 });
  fn((t) => { const k = cub(k01(t, ws(6), 0.3)); if (k > 0) txt('…', XL, 1110, 78, VIO, { align: 'left', alpha: k, w: 900 }); });

  // 02 · where guessing ends
  scene('guess', 'حدس');
  field(T.guess - 0.1, 0, 0, 470, H, 'b', 0.45);
  word('که', ws(7) - 0.04, XR, 380, 78, { w: 700, col: GREY });
  const g = word('حدس', ws(8) - 0.04, CX, 760, 470, { align: 'c', fit: 860 });
  word('زدن', ws(9) - 0.04, XL, 1060, 210, { w: 200, align: 'l' });
  rule(ws(10) - 0.02, g.xr + 40, g.xr - g.w - 40, 780, { lw: 38, col: RED, dur: 0.22 });
  line([['تمام', 10, { col: VIO }], ['می‌شود.', 11, { col: VIO }]], XR, 1300, 130);

  // 03 · we · the brand on a full violet page
  scene('we', 'بک‌تست‌لب');
  field(T.we - 0.16, 0, 0, W, H, 'r', 0.32);
  word('ما', ws(13) - 0.08, XR, 380, 78, { w: 700, col: GREY });
  fn((t) => { const k = pop(t - ws(13) + 0.05, 16, 0.6); if (k <= 0) return; cv.save(); cv.translate(CX, 700); cv.scale(k, k); logo('icon', 0, 0, 260); cv.restore(); });
  fn((t) => { const k = qui(k01(t, ws(14) - 0.1, 0.4)); if (k <= 0) return; const w = 720; cv.save(); cv.beginPath(); cv.rect(CX + w / 2 + 10 - (w + 20) * k, 880, (w + 20) * k, 230); cv.clip(); logo('word', CX, 995, w); cv.restore(); });
  line([['بستری', 14], ['جامع', 15, { col: VIO }]], CX, 1260, 110, { align: 'c' });

  // 04 · for testing, simulation and analysis
  scene('three', 'آزمایش');
  field(T.three - 0.1, 0, 0, 250, H, 't', 0.45);
  word('برای', ws(16) - 0.04, XR, 330, 70, { w: 700, col: GREY });
  rule(ws(16), XR, 0, 430);
  [['آزمایش', 17, false], ['شبیه‌سازی', 18, true], ['تحلیل', 20, false]].forEach(([s, i, out], j) => {
    const y = 545 + j * 250;
    word(s, ws(i) - 0.04, XR, y, 190, { out: out ? 4 : 0, fit: 700 });
    word(fa('0' + (j + 1)), ws(i) + 0.02, XL, y - 40, 64, { w: 900, align: 'l', dur: 0.25 });
    rule(ws(i) + 0.05, XR, 0, y + 120, { lw: 2 });
  });
  line([['استراتژی‌های', 21], ['معاملاتی', 23]], XR, 1300, 84);
  line([['فراهم', 24], ['کرده‌ایم.', 25]], XR, 1420, 84, { w: 200, col: GREY });

  // 05 · manual (on paper) and automated (on violet)
  scene('manual', 'بک‌تست');
  field(ws(31) - 0.25, 0, 0, CX, H, 'r', 0.4);
  word('از', ws(27) - 0.06, XR, 330, 70, { w: 700, col: GREY });
  word('بک‌تست', ws(28) - 0.04, XR, 490, 190, { col: VIO });
  word('دستی', ws(29) - 0.04, 775, 960, 200, { align: 'c', fit: 360 });
  word(fa('01'), ws(29) + 0.05, 775, 1170, 48, { w: 800, col: GREY, align: 'c' });
  word('و', ws(30) - 0.04, CX + 26, 960, 90, { col: VIO, align: 'r', w: 900 });
  word('خودکار', ws(31) - 0.04, 290, 960, 200, { w: 200, align: 'c', fit: 360 });
  word(fa('02'), ws(31) + 0.05, 290, 1170, 48, { w: 800, col: GREY, align: 'c' });

  // 06 · evaluating trading systems
  scene('evals', 'ارزیابی');
  field(ws(33) + 0.05, 0, 930, W, 520, 'b', 0.45);
  word('تا', ws(32) - 0.06, XR, 330, 70, { w: 700, col: GREY });
  word('ارزیابیِ', ws(33) - 0.04, XR, 560, 250, { fit: 880 });
  line([['سیستم‌های', 34], ['معاملاتی', 36]], XR, 800, 104, { w: 200 });
  [620, 470, 780, 360, 860, 540, 700].forEach((len, j) => rule(ws(33) + 0.3 + j * 0.09, XR, XR - len, 1000 + j * 62, { lw: j === 4 ? 26 : 14, col: j === 4 ? VIO : INK, dur: 0.5 }));

  // 07 · prop-firm rules, as clauses of a document
  scene('prop', 'پراپ');
  field(T.prop - 0.1, 0, 250, W, 440, 't', 0.45);
  line([['و', 37], ['شبیه‌سازیِ', 38]], XR, 330, 70, { w: 700, col: GREY });
  word('قوانین', ws(39) - 0.04, XR, 545, 270);
  word('پراپ‌فرم‌ها', ws(40) - 0.04, XR, 810, 150, { col: VIO, fit: 880 });
  [['حد ضرر روزانه', 40], ['حداکثر افت', 41], ['هدف سود', 42]].forEach(([s, i], j) => {
    const y = 1010 + j * 120, a = ws(i) + 0.16;
    rule(a - 0.05, XR, XL, y - 60, { lw: 2 });
    word('ماده ' + fa(j + 1), a, XR, y, 40, { w: 800, col: VIO });
    word(s, a + 0.06, XR - 170, y, 66, { w: 700 });
  });

  // 08 · every tool to measure and decide
  scene('tools', 'سنجش');
  field(ws(48) - 0.08, 0, 915, W, 170, 'r', 0.45);
  line([['تمامِ', 43], ['ابزارهای', 44]], XR, 380, 116);
  line([['موردِ', 45], ['نیاز', 46]], XR, 520, 116, { w: 200 });
  word('برای', ws(47) - 0.04, XR, 660, 70, { w: 700, col: GREY });
  line([['سنجشِ', 48], ['عملکرد', 49]], XR, 810, 150);
  fn((t) => { // a ruler drawn from right to left, then a marker slides along it
    const k = io(k01(t, ws(48) + 0.1, 0.8)); if (k <= 0) return; const y = 960, x0 = XR, n = 40, step = (XR - XL) / n;
    rect(lerp(x0, XL, k), y - 1.5, (x0 - XL) * k, 3, INK);
    for (let i = 0; i <= n * k; i++) { const x = x0 - i * step, h = i % 10 === 0 ? 46 : i % 5 === 0 ? 30 : 16; rect(x - 1.5, y, 3, h, INK); if (i % 10 === 0) txt(fa(i / 10), x, y + 80, 30, GREY, { align: 'center', w: 700 }); }
    const m = io(k01(t, ws(49), ws(52) - ws(49))), mx = lerp(x0 - step * 4, x0 - step * 31, m), mk = cub(k01(t, ws(49) - 0.1, 0.25));
    if (mk > 0) { cv.fillStyle = C(RED); cv.beginPath(); cv.moveTo(mx, y - 8); cv.lineTo(mx - 20 * mk, y - 44 * mk); cv.lineTo(mx + 20 * mk, y - 44 * mk); cv.closePath(); cv.fill(); }
  });
  word('و', ws(51) - 0.04, XR, 1180, 70, { w: 700, col: GREY });
  word('تصمیم‌گیریِ', ws(52) - 0.04, XR - 70, 1180, 150, { fit: 800 });
  word('آگاهانه', ws(53) - 0.04, XR, 1370, 150, { w: 200, col: VIO });

  // 09 · one environment: an index of the keywords collapses into one violet block
  scene('one', 'یک‌پارچه');
  line([['در', 54], ['یک', 55], ['محیطِ', 56], ['حرفه‌ای', 57]], XR, 360, 96);
  const keys = ['آزمایش', 'شبیه‌سازی', 'تحلیل', 'بک‌تست', 'ارزیابی', 'قوانین', 'سنجش', 'تصمیم'];
  fn((t) => {
    if (ON) return; const c = io(k01(t, ws(59) - 0.06, 0.38));
    keys.forEach((s, i) => {
      const a = ws(54) + 0.08 + i * 0.11, k = qui(k01(t, a, 0.3)); if (k <= 0) return;
      const col = i % 2, row = (i / 2) | 0, x0 = col ? XL : CX, y0 = 520 + row * 190, w = CX - XL;
      const x = lerp(x0, CX - w / 2, c), y = lerp(y0, 940 - 95, c);
      cv.save(); cv.globalAlpha = 1 - c * 0.999; cv.beginPath(); cv.rect(x + w - w * k, y, w * k, 190); cv.clip();
      rect(x, y, w, 2, INK); rect(col ? x + w - 1 : x, y, 2, 190, INK);
      txt(fa((i + 1 + '').padStart(2, '0')), x + w - 26, y + 40, 32, VIO, { w: 800 }); txt(s, x + w - 26, y + 118, 70, INK, { w: col ? 200 : 900 }); cv.restore();
    });
    if (c > 0) { // the block grows out of the collapsed cells
      const bw = lerp(CX - XL, W - 2 * XL, c), bh = lerp(190, 300, c); cv.save(); cv.globalAlpha = cl(c * 1.6); rect(CX - bw / 2, 940 - bh / 2, bw, bh, VIO); cv.restore();
      const k = qui(k01(t, ws(60) - 0.08, 0.35)); if (k > 0) { const s = 'یک‌پارچه', sz = Math.min(200, (740 / measure(s, 100)) * 100), w = measure(s, sz); cv.save(); cv.beginPath(); cv.rect(CX + w / 2 + 20 - (w + 40) * k, 790, (w + 40) * k, 300); cv.clip(); txt(s, CX, 950 + (1 - k) * 30, sz, PAPER, { align: 'center' }); cv.restore(); }
    }
  });
  fn((t) => { const k = cub(k01(t, ws(58) - 0.04, 0.25)); if (k > 0) txt('و', CX, 1220, 70, VIO, { align: 'center', alpha: k * (1 - cub(k01(t, ws(59), 0.2))), w: 700 }); });

  // 10 · a violet page: you're not here just to trade
  scene('not_', 'فقط معامله؟');
  word('اینجا', ws(61) - 0.04, XR, 380, 84, { w: 700, col: LILAC });
  line([['قرار', 62, { col: PAPER }], ['نیست', 63, { col: PAPER }]], XR, 600, 170);
  const sf = word('صرفاً', ws(64) - 0.04, XR, 870, 220, { w: 200, col: PAPER });
  rule(ws(64) + 0.18, sf.xr, sf.xr - sf.w - 10, 1000, { lw: 14, col: INK, dur: 0.3 });
  word('معامله', ws(65) - 0.04, XR, 1150, 230, { col: PAPER, out: 5, fit: 880 });
  word('کنید.', ws(66) - 0.04, XL, 1360, 110, { col: PAPER, align: 'l' });

  // 11 · be ready before you trade
  scene('ready', 'آمادگی');
  field(ws(73) - 0.2, 0, 1110, 600, H - 1110, 'b', 0.4);
  line([['قرار', 67], ['است', 68]], XR, 380, 84, { w: 700, col: GREY });
  line([['پیش', 69], ['از', 70], ['معامله،', 71]], XR, 590, 150);
  word('آماده', ws(72) - 0.05, CX, 930, 420, { col: VIO, align: 'c', fit: 880, dur: 0.26 });
  word('شوید.', ws(73) - 0.04, XL, 1290, 210, { w: 200, align: 'l' });

  // 12 · the end
  scene('end', 'شروع');
  field(T.end - 0.12, 0, 0, W, 990, 't', 0.45);
  fn((t) => { const k = pop(t - T.end - 0.05, 14, 0.6); if (k <= 0) return; cv.save(); cv.translate(CX, 560); cv.scale(k, k); logo('icon', 0, 0, 200); cv.restore(); });
  fn((t) => { const k = qui(k01(t, T.end + 0.2, 0.5)); if (k <= 0) return; const w = 760; cv.save(); cv.beginPath(); cv.rect(CX + w / 2 + 10 - (w + 20) * k, 720, (w + 20) * k, 220); cv.clip(); logo('word', CX, 830, w); cv.restore(); });
  word('شروعش رایگانه', T.end + 0.6, CX, 1140, 120, { align: 'c' });
  word('لینک توی بیو', T.end + 0.9, CX, 1300, 76, { w: 700, col: VIO, align: 'c' });
  fn((t) => { const k = cub(k01(t, T.end + 1.1, 0.4)); if (k <= 0) return; const y = 1395 + Math.sin((t - T.end) * 5) * 8; cv.save(); cv.globalAlpha = k; cv.strokeStyle = C(VIO); cv.lineWidth = 7; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(CX, y); cv.lineTo(CX, y + 60); cv.moveTo(CX - 24, y + 36); cv.lineTo(CX, y + 62); cv.lineTo(CX + 24, y + 36); cv.stroke(); cv.restore(); });

  S.forEach((s, i) => { s.t1 = i + 1 < S.length ? S[i + 1].t0 : 1e9; s.n = i + 1; });
}

// ---------- the chrome: running header, footer, page number, progress ----------
function chrome(t, sc) {
  rect(XL, 236, XR - XL, 2, INK);
  txt('بک‌تست‌لب', XR, 200, 34, INK, { w: 800 }); txt('مانیفست', XL, 200, 34, INK, { w: 300, align: 'left' });
  rect(XL, 1530, XR - XL, 2, INK);
  const p = cl(t / DUR); rect(XR - (XR - XL) * p, 1527, (XR - XL) * p, 8, VIO);
  if (!sc) return; const k = cub(k01(t, sc.t0 - 0.05, 0.3));
  cv.save(); cv.beginPath(); cv.rect(XL, 1545, XR - XL, 60); cv.clip();
  txt(sc.label, XR, 1575 + (1 - k) * 50, 32, INK, { w: 700 }); // «۰۱ از ۱۲», set piece by piece from the left so the numbers can't swap places
  { const y = 1575 + (1 - k) * 50, tot = fa(S.length), of = ' از ', n = fa(String(sc.n).padStart(2, '0')); let x = XL;
    [tot, of, n].forEach((p) => { txt(p, x, y, 32, INK, { w: 300, align: 'left' }); x += measure(p, 32, 300); }); }
  cv.restore();
}
// fine print grain, made once
const GRAIN = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = rnd(i * 0.37) * 255; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; } g.putImageData(d, 0, 0); return c; })();
function grain() { cv.save(); cv.globalAlpha = 0.07; cv.globalCompositeOperation = 'multiply'; cv.fillStyle = cv.createPattern(GRAIN, 'repeat'); cv.fillRect(0, 0, W, H); cv.restore(); }
// the violet page (scene not_): slides in from the right, out to the left
function panel(t) { const a = io(k01(t, T.not_ - 0.16, 0.34)), b = io(k01(t, T.ready - 0.16, 0.34)); return a <= 0 || b >= 1 ? null : [W * (1 - a), W * (1 - b)]; }

function frame(t) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; ON = false;
  rect(0, 0, W, H, PAPER);
  const pn = panel(t); if (pn) rect(pn[0], 0, pn[1] - pn[0], H, VIO);
  const sc = S.reduce((a, s) => (t >= s.t0 - 0.05 ? s : a), S[0]);
  const punch = [ws(10), ws(59), ws(72)].reduce((z, a) => z + (t >= a ? 0.03 * Math.exp(-(t - a) * 8) : 0), 0);
  const jit = [ws(10), ws(59), ws(72)].reduce((z, a) => z + (t >= a ? Math.exp(-(t - a) * 12) : 0), 0);
  const vis = S.filter((s) => t >= s.t0 - 0.9 && t <= s.t1 + 0.5).map((s) => ({ s, e: s.t1 > 1e8 ? 0 : io(k01(t, s.t1 - 0.15, 0.28)), life: 1 + 0.018 * cl((t - s.t0) / Math.max(1, s.t1 - s.t0)) + punch })).filter((v) => v.e < 1);
  // the page's own transform: the old page is wiped off from the right edge leftwards
  const enter = ({ e, life }) => {
    if (e > 0) { cv.beginPath(); cv.rect(-10, 0, (W + 20) * (1 - e), H); cv.clip(); cv.translate(-90 * e, 0); }
    cv.translate(CX + Math.sin(t * 90) * 6 * jit, 880 + Math.cos(t * 77) * 6 * jit); cv.scale(life, life); cv.translate(-CX, -880);
  };
  const items = (s) => s.items.forEach((it) => (it.t === 'w' ? drawWord(it, t) : it.t === 'r' ? drawRule(it, t) : it.f(t)));
  // 1 · ink on paper
  vis.forEach((v) => { cv.save(); enter(v); items(v.s); cv.restore(); });
  chrome(t, sc);
  // 2 · the violet fields, with everything over them redrawn in their tones
  vis.forEach((v) => {
    const rs = v.s.fields.map((f) => fieldRect(f, t)).filter(Boolean); if (!rs.length) return;
    cv.save(); enter(v); cv.beginPath(); rs.forEach((r) => cv.rect(...r)); cv.clip();
    ON = true; cv.fillStyle = VIO; cv.fillRect(-200, -200, W + 400, H + 400); items(v.s);
    cv.setTransform(1, 0, 0, 1, 0, 0); chrome(t, sc); ON = false; cv.restore();
  });
  // the violet page: the header and footer in its tones, a red edge while it moves
  if (pn) { cv.save(); cv.beginPath(); cv.rect(pn[0], 0, pn[1] - pn[0], H); cv.clip(); ON = true; chrome(t, sc); ON = false; cv.restore();
    [pn[0], pn[1]].forEach((x) => { if (x > 2 && x < W - 2) rect(x - 4, 0, 8, H, INK); }); }
  grain();
}

window.DURATION = DUR;
window.seek = (t) => frame(t);
/** The cover: the opening sentence set as a poster, «حدس» across a violet field and struck through. */
window.cover = () => {
  cv.setTransform(1, 0, 0, 1, 0, 0); ON = false; rect(0, 0, W, H, PAPER);
  const sz = Math.min(470, (860 / measure('حدس', 100)) * 100), w = measure('حدس', sz);
  const body = () => {
    rect(XL, 236, XR - XL, 2, INK); txt('بک‌تست‌لب', XR, 200, 34, INK, { w: 800 }); txt('مانیفست', XL, 200, 34, INK, { w: 300, align: 'left' });
    txt('ترید حرفه‌ای', XR, 400, 150, INK);
    txt('از جایی شروع می‌شود که', XR, 590, 74, GREY, { w: 700 });
    txt('حدس', CX, 870, sz, INK, { align: 'center' }); rect(CX - w / 2 - 40, 871, w + 80, 40, RED);
    txt('زدن', XL, 1150, 200, INK, { w: 200, align: 'left' });
    txt('تمام می‌شود.', XR, 1380, 130, VIO);
  };
  body(); cv.save(); cv.beginPath(); cv.rect(0, 0, 470, H); cv.clip(); ON = true; cv.fillStyle = VIO; cv.fillRect(0, 0, W, H); body(); ON = false; cv.restore();
  grain();
};
(async () => {
  await Promise.all(['200', '300', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), loadImg('wordW', window.LOGO.wordW)]);
  const miss = ['icon', 'word', 'wordW'].filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  layout(); window.seek(0); window.ready = true;
})();
