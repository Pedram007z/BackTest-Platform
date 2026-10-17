// m8 · «بالا یا پایین؟»: a play-along game. Three real charts stop at a moment that fooled most traders; the viewer
// answers up or down while a countdown runs, then the replay plays the real future. The twist: with a coin, one person
// in eight gets all three right, so three guesses prove nothing; a hundred trades do, and that is what the platform is
// for. 1080×1920, every frame a pure function of t (window.seek), timed from the words of the user's take (data.json).
// Key content stays inside Instagram's safe area (y 230–1480, x ≤ 940 below y 1100).
const W = 1080, H = 1920, CX = 540;
const V = '#7C5CFF', G = '#26C281', R = '#F25466', K = '#09080D', WH = '#F5F3FA', DIM = '#2A2833', MID = '#6E6A7C', PANEL = '#121019';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, Wd = D.w, ws = (i) => Wd[i][0], we = (i) => Wd[i][1], DUR = D.dur;

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const ex = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)), exIn = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, 10 * x - 10));
const exIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const spr = (dt, w = 16) => (dt <= 0 ? 0 : 1 - (1 + w * dt) * Math.exp(-w * dt));
/** A small overshoot for buttons and badges: a damped spring (ζ = 0.55). */
const pop = (dt, w = 18) => { if (dt <= 0) return 0; const z = 0.55, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
function track(t, keys, w = 16) { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) { const [ti, vi] = keys[i]; if (t < ti) break; v = lerp(v, vi, spr(t - ti, w)); } return v; }
const vel = (f, t) => (f(t) - f(t - 1 / 240)) * 240;

// ---------- directional blur ----------
(() => { let s = ''; for (let i = 2; i <= 48; i += 2) s += `<filter id="bx${i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${i} 0"/></filter><filter id="by${i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0 ${i}"/></filter>`; document.getElementById('flt').innerHTML = s; })();
function blurred(vx, vy, fn) { const ax = Math.abs(vx), ay = Math.abs(vy), amt = Math.min(48, Math.round((Math.max(ax, ay) * 0.008) / 2) * 2); cv.save(); cv.filter = amt < 4 ? 'none' : `url(#${ax >= ay ? 'bx' : 'by'}${amt})`; fn(); cv.restore(); }

// ---------- drawing ----------
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`;
function txt(s, x, y, size, col, o = {}) { cv.font = FONT(size, o.w ?? 900); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? 'rtl'; cv.fillText(s, x, y); }
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = 'rtl'; return cv.measureText(s).width; }
function rect(x, y, w, h, col) { cv.fillStyle = col; cv.fillRect(x, y, w, h); }
function rrect(x, y, w, h, r, col, stroke, lw = 4) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); if (col) { cv.fillStyle = col; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function clip(x, y, w, h) { cv.beginPath(); cv.rect(x, y, w, h); cv.clip(); }
function poly(pts, col) { cv.fillStyle = col; cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.closePath(); cv.fill(); }
function circle(x, y, r, col, stroke, lw = 4) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (col) { cv.fillStyle = col; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]).replace('.', '٫');
/** ▲ or ▼ centred on (x, y). */
function arrow(x, y, s, up, col) { poly(up ? [[x, y - s * 0.55], [x + s * 0.6, y + s * 0.45], [x - s * 0.6, y + s * 0.45]] : [[x, y + s * 0.55], [x + s * 0.6, y - s * 0.45], [x - s * 0.6, y - s * 0.45]], col); }
function scaleAt(x, y, s, fn) { cv.save(); cv.translate(x, y); cv.scale(s, s); cv.translate(-x, -y); fn(); cv.restore(); }

// ---------- captions: the script's words, each appearing as it is spoken (the take's word indices give the times) ----------
const CAP = [
  [['سه', 0], ['تا', 1], ['چارت', 2], ['واقعی.', 3]], [['اگه', 4], ['تریدری،', 5], ['باید', 6], ['هر', 7], ['سه‌تاشو', 8, 10], ['درست', 11], ['بگی.', 12]],
  [['اولی:', 13], ['قشنگ', 14], ['داره', 15], ['میره', 16], ['بالا.', 17]], [['از', 18], ['اینجا…', 19], ['بالا', 20], ['یا', 21], ['پایین؟', 22]],
  [['پایین!', 23], ['نزدیک', 24], ['پونزده', 25], ['درصد،', 26]], [['تو', 27], ['هشت', 28], ['روز.', 29]], [['طلا،', 30], ['اسفند', 31], ['۹۸،', 32, 34], ['وسط', 35], ['کرونا.', 36]],
  [['دومی:', 37], ['داره', 38], ['می‌ریزه…', 39]], [['یه', 40], ['کم', 40], ['برگشت،', 41], ['باز', 42], ['ریخت.', 43]], [['بالا', 44], ['یا', 45], ['پایین؟', 46]],
  [['بالا!', 47], ['بیشتر', 48], ['از', 49], ['دوازده', 50], ['درصد،', 51]], [['فقط', 52], ['تو', 53], ['یه', 54], ['روز.', 55]], [['نزدک،', 56], ['فروردین', 57], ['۱۴۰۴.', 58, 62]],
  [['سومی:', 63], ['سقفشو', 64], ['زده،', 65], ['داره', 66], ['برمی‌گرده.', 67, 68]], [['بالا', 69], ['یا', 70], ['پایین؟', 71]],
  [['بالا!', 72], ['بیشتر', 73], ['از', 74], ['چهل', 75], ['درصد،', 76]], [['تو', 77], ['کمتر', 78], ['از', 79], ['سه', 80], ['هفته.', 81]], [['بیت‌کوین،', 82], ['آبان', 83], ['۱۴۰۳.', 84, 88]],
  [['چندتاشو', 90, 92], ['درست', 93], ['گفتی؟', 94]], [['اگه', 95], ['سه', 96], ['از', 97], ['سه…', 98], ['دمت', 99], ['گرم.', 100]],
  [['ولی', 101], ['با', 102], ['شیر', 103], ['یا', 104], ['خط', 105], ['هم،', 106]], [['از', 107], ['هر', 108], ['هشت', 109], ['نفر', 110], ['یکی', 111]], [['هر', 112], ['سه‌تا', 113, 114], ['رو', 115], ['درست', 116], ['می‌گه.', 117]],
  [['سه', 118], ['تا', 119], ['حدس', 120], ['هیچی', 121], ['رو', 122], ['ثابت', 123], ['نمی‌کنه.', 124, 125]], [['بلدی', 126], ['یا', 127], ['فقط', 128], ['شانس', 129], ['آوردی؟', 130]],
  [['اینو', 131], ['صدتا', 132, 133], ['معامله', 134], ['نشون', 135], ['می‌ده،', 136]], [['نه', 137], ['سه‌تا.', 138, 139]],
  [['توی', 140], ['بک‌تست‌لب', 141, 142], ['همین', 143], ['بازی', 144], ['رو', 145]], [['روی', 146], ['بازار', 147], ['واقعی،', 148]], [['کندل', 149], ['به', 150], ['کندل،', 151]],
  [['صد', 152], ['بار', 153], ['بازی', 154], ['می‌کنی…', 155, 156]], [['و', 157], ['آمار', 158], ['واقعی', 159], ['خودتو', 160], ['می‌بینی.', 161, 162]],
  [['امتیازتو', 163], ['کامنت', 164], ['کن:', 165]], [['صفر،', 166], ['یک،', 167], ['دو', 168], ['یا', 169], ['سه؟', 170]]];
const REV = D.rev, HUSH = D.hush;
/** A word's spoken time; the answer words of each round start where the voice really comes back after the countdown. */
const wStart = (i) => (i === 23 ? REV[0] : i === 47 ? REV[1] : i === 72 ? REV[2] : ws(i));
function captions(t) {
  let cur = -1; CAP.forEach((ph, k) => { if (t >= wStart(ph[0][1]) - 0.05) cur = k; });
  if (cur < 0) return; const ph = CAP[cur], next = CAP[cur + 1], end = next ? wStart(next[0][1]) - 0.05 : DUR; if (t > end) return;
  const size = 62, gap = 18, ws_ = ph.map(([s]) => measure(s, size, 800)), total = ws_.reduce((a, b) => a + b, 0) + gap * (ph.length - 1);
  let x = CX + total / 2; const y = 1405;
  ph.forEach(([s, i], k) => { const t0 = wStart(i) - 0.04, kk = pop(t - t0, 22); if (t >= t0) scaleAt(x - ws_[k] / 2, y, lerp(0.6, 1, cl(kk, 0, 1.2)), () => txt(s, x, y + (1 - cl(kk)) * 18, size, WH, { align: 'right', w: 800 })); x -= ws_[k] + gap; });
}

// ---------- the game frame ----------
const ROUNDS = D.charts.map((c, i) => ({ ...c, up: [false, true, true][i], q0: [20, 44, 69][i], qz: [22, 46, 71][i], start: [13, 37, 63][i], label: ['طلا', 'نزدک', 'بیت‌کوین'][i], when: ['اسفند ۹۸', 'فروردین ۱۴۰۴', 'آبان ۱۴۰۳'][i], idw: [30, 56, 82][i], end: [37, 63, 90][i] }));
const PANEL_R = { x: 60, y: 520, w: 960, h: 600 };
function roundOf(t) { for (let i = 2; i >= 0; i--) if (t >= ws(ROUNDS[i].start) - 0.1) return i; return -1; }
/** The three round pills at the top: the current one ringed violet, played ones filled with the real answer. */
function progress(t, alpha = 1, y = 300) {
  const cur = roundOf(t); [0, 1, 2].forEach((i) => { const x = CX + (1 - i) * 130, rd = ROUNDS[i], done = t >= REV[i] + 0.2, k = pop(t - REV[i] - 0.2, 16);
    if (done) { circle(x, y, 44 * cl(0.7 + 0.3 * k, 0, 1.15), rd.up ? G : R); arrow(x, y, 34, rd.up, WH); }
    else { circle(x, y, 44, PANEL, i === cur ? V : DIM, 5); txt(fa(i + 1), x, y + 2, 40, i === cur ? WH : MID, { dir: 'ltr' }); } });
}
/** The two answer buttons: «بالا» on the right, «پایین» on the left; they pulse as each word is spoken, and on the
 *  reveal the right one fills and the wrong one goes dim. */
function buttons(t, i, yOff = 0) {
  const rd = ROUNDS[i], y = 1185 + yOff, h = 112, bw = 360;
  [['بالا', true, 580], ['پایین', false, 140]].forEach(([s, up, x]) => { const col = up ? G : R, word = up ? rd.q0 : rd.qz, pk = pop(t - ws(word), 20), pulse = 1 + 0.08 * Math.sin(Math.PI * cl(pk, 0, 1)) * (t < REV[i] ? 1 : 0);
    const rv = t >= REV[i], right = rv && up === rd.up, wrong = rv && !right, fk = spr(t - REV[i], 18);
    scaleAt(x + bw / 2, y + h / 2, pulse * (right ? 1 + 0.06 * Math.sin(Math.PI * cl((t - REV[i]) / 0.35)) : 1), () => {
      rrect(x, y, bw, h, h / 2, right ? col : PANEL, wrong ? DIM : col, 5);
      if (right && fk < 1) rrect(x, y, bw, h, h / 2, PANEL); if (right) { cv.save(); cv.beginPath(); cv.roundRect(x, y, bw, h, h / 2); cv.clip(); circle(x + bw / 2, y + h / 2, bw * 0.75 * fk, col); cv.restore(); }
      const tc = right ? WH : wrong ? MID : col; arrow(x + bw - 70, y + h / 2, 34, up, tc); txt(s, x + bw / 2 - 20, y + h / 2 + 2, 52, tc, { w: 900 }); }); });
}
// ---------- the chart: replays its setup, stops at «now», asks, then plays the real future while the scales follow ----------
function chartFrame(t, i, P) {
  const rd = ROUNDS[i], S = rd.setup, Rv = rd.reveal, nS = S.length, nR = Rv.length, t0 = ws(rd.start), tQ = ws(rd.q0), tR = REV[i], tRe = tR + 1.25;
  // how many candles are on screen: the setup streams in from the round's first word to the question; the future after the countdown
  const sh = (tt) => (tt < tR ? nS * (0.18 + 0.82 * ex(k01(tt, t0, Math.max(0.6, tQ - t0 - 0.1)))) : nS + nR * exIO(k01(tt, tR, tRe - tR)));
  const shown = sh(t), all = [...S, ...Rv];
  // the scales spring to the candles on screen; keyframes at every step keep it a pure function of t
  const range = (n) => { let lo = 1e18, hi = -1e18; for (let k = 0; k < Math.max(1, Math.ceil(n)); k++) { lo = Math.min(lo, all[k][2]); hi = Math.max(hi, all[k][1]); } return [lo, hi]; };
  const keys = []; for (let k = 0; k <= 40; k++) { const tt = t0 + (k / 40) * (tRe + 0.3 - t0); if (tt > t) break; keys.push([tt, range(sh(tt))]); }
  const lo = track(t, [[0, range(nS * 0.18)[0]], ...keys.map(([tt, r]) => [tt, r[0]])], 12), hi = track(t, [[0, range(nS * 0.18)[1]], ...keys.map(([tt, r]) => [tt, r[1]])], 12);
  const span = track(t, [[0, nS * 1.36], [tR, nS + nR + 1.5]], 9), A = { x: P.x + 30, y: P.y + 70, w: P.w - 60, h: P.h - 110 };
  const pad = (hi - lo) * 0.08, Y = (v) => A.y + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * A.h, X = (k) => A.x + ((k + 0.5) / span) * A.w, cw = A.w / span;
  rrect(P.x, P.y, P.w, P.h, 36, PANEL);
  cv.save(); clip(P.x, P.y, P.w, P.h);
  for (let g = 1; g < 5; g++) rect(A.x, A.y + (g / 5) * A.h, A.w, 2, '#1B1924');
  // «now»: a dashed line at the last setup candle, the future greyed with a question mark until the reveal
  const nowX = X(nS - 0.5) + cw * 0.5;
  if (t < tRe) { const fk = 1 - ex(k01(t, tR, 0.4)); if (fk > 0) { cv.save(); cv.globalAlpha = fk; rect(nowX, P.y, P.x + P.w - nowX, P.h, '#171521'); cv.restore(); }
    cv.save(); cv.setLineDash([14, 12]); cv.strokeStyle = V; cv.lineWidth = 4; cv.beginPath(); cv.moveTo(nowX, A.y - 30); cv.lineTo(nowX, A.y + A.h + 20); cv.stroke(); cv.restore(); }
  for (let k = 0; k < Math.min(all.length, Math.ceil(shown)); k++) { const [o, h, l, c] = all[k], gk = cl(shown - k), x = X(k), col = c >= o ? G : R, mid = (Y(o) + Y(c)) / 2;
    rect(x - Math.max(1.5, cw * 0.06), lerp(mid, Y(h), gk), Math.max(3, cw * 0.12), lerp(mid, Y(l), gk) - lerp(mid, Y(h), gk), col);
    const top = lerp(mid, Y(Math.max(o, c)), gk), bot = lerp(mid, Y(Math.min(o, c)), gk); rect(x - cw * 0.34, top, cw * 0.68, Math.max(3, bot - top), col); }
  // the countdown, in the future's corner: 3 · 2 · 1 around a draining ring
  if (t >= tQ - 0.05 && t < tR + 0.15) { const cx = lerp(nowX, P.x + P.w, 0.5), cy = P.y + P.h * 0.46, prog = k01(t, tQ, tR - tQ), n = Math.min(3, 3 - Math.floor(prog * 3)), k = pop(t - (tQ + ((3 - n) * (tR - tQ)) / 3), 22), out = 1 - ex(k01(t, tR, 0.12));
    scaleAt(cx, cy, out, () => { circle(cx, cy, 92, K, DIM, 10); cv.strokeStyle = V; cv.lineWidth = 10; cv.lineCap = 'round'; cv.beginPath(); cv.arc(cx, cy, 92, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - prog)); cv.stroke();
      scaleAt(cx, cy, lerp(0.5, 1, cl(k, 0, 1.2)), () => txt(fa(Math.max(1, n)), cx, cy + 6, 110, WH, { dir: 'ltr' })); }); }
  else if (t < tQ) { const cx = lerp(nowX, P.x + P.w, 0.5), cy = P.y + P.h * 0.46, k = pop(t - (t0 + 0.4), 14); if (k > 0) scaleAt(cx, cy, cl(k, 0, 1.2), () => txt('؟', cx, cy, 170, V)); }
  // the real move, counted up as the future plays, then who and when
  if (t >= tR + 0.3) { const kk = exIO(k01(t, tR + 0.1, 1.1)), mv = rd.move * kk, s = (mv >= 0 ? '+' : '−') + fa(Math.abs(mv).toFixed(1)) + '٪', last = all[Math.min(all.length - 1, Math.max(0, Math.ceil(shown) - 1))];
    const lx = Math.min(P.x + P.w - 190, X(Math.ceil(shown) - 1) - 10), ly = cl(rd.up ? Y(last[1]) - 70 : Y(last[2]) + 70, P.y + 70, P.y + P.h - 60);
    scaleAt(lx, ly, cl(pop(t - tR - 0.3, 16), 0, 1.2), () => { rrect(lx - 170, ly - 50, 340, 100, 50, rd.up ? G : R); txt(s, lx, ly + 3, 64, WH, { dir: 'ltr' }); }); }
  cv.restore();
}
// ---------- sections ----------
const T_TWIST = ws(90) - 0.1, T_COIN = ws(101) - 0.05, T_PROOF = ws(118) - 0.05, T_APP = ws(140) - 0.05, T_CTA = ws(163) - 0.05;
function hook(t) {
  // three face-down cards: «سه تا چارت واقعی»; they light up on «هر سه‌تاشو»; the first one becomes the chart panel
  const cards = [0, 1, 2].map((i) => ({ x: CX + (1 - i) * 300 - 130, y: 640, w: 260, h: 360 })), zk = exIO(k01(t, ws(13) - 0.35, 0.35));
  const title = (s, i, y, size, col) => { const k = pop(t + 0.4, 18); if (k > 0) scaleAt(CX, y, cl(k, 0, 1.15), () => txt(s, CX, y, size, col)); };
  if (zk < 1) { title('۳ چارت واقعی', 0, 450, 96, WH);
    cards.forEach((c, i) => { const ap = pop(t + 0.5 - i * 0.04, 16), lit = t >= ws(7 + Math.min(i, 1) + (i === 2 ? 2 : 0)) - 0.03, cy = c.y + (1 - cl(ap)) * 500;
      if (i > 0) { const ox = zk * (i === 1 ? -700 : -900); cv.save(); cv.translate(ox, 0); rrect(c.x, cy, c.w, c.h, 30, PANEL, lit ? V : DIM, 6); txt('؟', c.x + c.w / 2, cy + c.h / 2, 150, lit ? V : MID); cv.restore(); }
      else if (zk <= 0) { rrect(c.x, cy, c.w, c.h, 30, PANEL, lit ? V : DIM, 6); txt('؟', c.x + c.w / 2, cy + c.h / 2, 150, lit ? V : MID); } });
    if (t >= ws(5) - 0.05) { const k = pop(t - ws(5) + 0.05, 16) * (1 - zk); scaleAt(CX, 1150, cl(k, 0, 1.15), () => { rrect(CX - 150, 1100, 300, 100, 50, V); txt('۰ از ۳', CX, 1152, 56, WH); }); } }
  if (zk > 0) { const c = cards[0], P = PANEL_R, r = { x: lerp(c.x, P.x, zk), y: lerp(c.y, P.y, zk), w: lerp(c.w, P.w, zk), h: lerp(c.h, P.h, zk) }; rrect(r.x, r.y, r.w, r.h, 30, PANEL, zk < 1 ? V : null, 6); }
}
function rounds(t, i) {
  const rd = ROUNDS[i], tIn = ws(rd.start) - 0.1, tOut = i < 2 ? ws(ROUNDS[i + 1].start) - 0.1 : T_TWIST;
  // round change: the old chart leaves to the right and the next comes in from the left (forward, in reading order)
  const inX = (tt) => -1100 * (1 - spr(tt - tIn, 14)) * (i > 0 ? 1 : 0), outX = (tt) => (i < 2 ? 1150 * exIn(k01(tt, tOut - 0.3, 0.3)) : 0), dx = inX(t) + outX(t);
  progress(t);
  // the round's title, then the big question as it is asked
  const qk = pop(t - ws(rd.q0) + 0.05, 16), title = ['اول', 'دوم', 'سوم'][i];
  blurred(vel((tt) => inX(tt) + outX(tt), t), 0, () => {
    cv.save(); cv.translate(dx, 0);
    if (t < ws(rd.q0) - 0.05) { const k = pop(t - tIn - 0.05, 16); scaleAt(CX, 430, cl(k, 0, 1.15), () => txt('چارت ' + title, CX, 430, 80, WH)); }
    else if (t < REV[i] + 0.05) scaleAt(CX, 430, cl(qk, 0, 1.2), () => txt('بالا یا پایین؟', CX, 430, 92, WH));
    else if (t < ws(rd.idw) - 0.08) { const ok = pop(t - REV[i], 18); scaleAt(CX, 430, cl(ok, 0, 1.2), () => txt(rd.up ? 'بالا!' : 'پایین!', CX, 430, 110, rd.up ? G : R)); }
    else { const ik = pop(t - ws(rd.idw) + 0.08, 16); scaleAt(CX, 430, cl(ik, 0, 1.15), () => txt(rd.label + ' · ' + rd.when, CX, 430, 76, WH)); }
    chartFrame(t, i, PANEL_R); buttons(t, i); cv.restore(); });
  captions(t);
}
function twist(t) {
  // «چندتاشو درست گفتی؟»: the three real answers, big; «اگه سه از سه… دمت گرم»: they merge into a 3/3 badge
  const k = spr(t - T_TWIST, 12), mk = exIO(k01(t, ws(95) - 0.1, 0.45));
  const pos = [0, 1, 2].map((i) => [lerp(CX + (1 - i) * 130, CX + (1 - i) * 250, k), lerp(300, 760, k), lerp(44, 100, k)]);
  if (t < ws(101) - 0.05) {
    { const qk = pop(t - T_TWIST - 0.28, 16); scaleAt(CX, 520, cl(qk, 0, 1.15), () => txt('چندتاشو درست گفتی؟', CX, 520, 76, WH)); }
    pos.forEach(([x, y, r], i) => { const x2 = lerp(x, CX, mk), r2 = lerp(r, 150, mk); circle(x2, y, r2, ROUNDS[i].up ? G : R); if (mk < 0.5) arrow(x2, y, r2 * 0.75, ROUNDS[i].up, WH); });
    if (mk > 0.3) { circle(CX, 760, 150 * cl(mk), V); txt('۳/۳', CX, 768, 120 * cl((mk - 0.3) / 0.5), WH, { dir: 'ltr' }); }
    if (t >= ws(99) - 0.05) { const kk = pop(t - ws(99) + 0.05, 16); scaleAt(CX, 1010, cl(kk, 0, 1.2), () => txt('دمت گرم!', CX, 1010, 84, V)); }
  }
  captions(t);
}
function coins(t) {
  // «ولی با شیر یا خط هم»: the badge turns into a coin with ▲ on one face and ▼ on the other and spins;
  // «از هر هشت نفر یکی هر سه‌تا رو درست می‌گه»: all eight ways to answer three rounds, and only one is right
  const u = t - T_COIN, spin = u * 14, face = Math.cos(spin), up = face >= 0, coinOut = exIO(k01(t, ws(107) - 0.25, 0.3));
  if (coinOut < 1) { const cy = 760, s = 1 - coinOut; cv.save(); cv.translate(CX, cy); cv.scale(Math.max(0.04, Math.abs(face)) * s, s); circle(0, 0, 150, up ? G : R, WH, 8); arrow(0, 0, 120, up, WH); cv.restore();
    if (t >= ws(103) - 0.05) { const kk = pop(t - ws(103) + 0.05, 18); scaleAt(CX, 1010, cl(kk, 0, 1.2) * (1 - coinOut), () => txt('شیر یا خط؟', CX, 1010, 84, WH)); } }
  if (t >= ws(107) - 0.2) {
    const combos = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => [!!(n & 4), !!(n & 2), !!(n & 1)]), truth = ROUNDS.map((r) => r.up), win = (c) => c.every((v, j) => v === truth[j]);
    const hl = t >= ws(111) - 0.05, hk = pop(t - ws(111) + 0.05, 16);
    combos.forEach((c, n) => { const col = n % 2, row = Math.floor(n / 2), x = CX + (col ? -230 : 230), y = 600 + row * 165, k = pop(t - (ws(107) - 0.2) - n * 0.05, 18);
      if (k <= 0) return; const ok = win(c);
      scaleAt(x, y, cl(k, 0, 1.15) * (hl && ok ? 1 + 0.08 * cl(hk, 0, 1.3) : 1), () => {
        rrect(x - 200, y - 70, 400, 140, 34, hl && ok ? V : PANEL, hl && !ok ? DIM : hl && ok ? V : '#2F2C3B', 5);
        // a person, then their three answers
        circle(x + 150, y - 22, 20, hl && !ok ? MID : WH); rrect(x + 122, y + 4, 56, 44, 22, hl && !ok ? MID : WH);
        c.forEach((v, j) => { const ax = x + 60 - j * 92; circle(ax, y, 34, hl && !ok ? DIM : v ? G : R); arrow(ax, y, 30, v, hl && !ok ? MID : WH); }); }); });
    if (hl) { const kk = pop(t - ws(111) + 0.05, 14); scaleAt(CX, 1300, cl(kk, 0, 1.2), () => { rrect(CX - 170, 1250, 340, 100, 50, V); txt('۱ از ۸', CX, 1302, 60, WH); }); }
    txt('۸ نفر، ۸ جور جواب', CX, 470, 64, WH);
  }
  captions(t);
}
function proof(t) {
  // «سه تا حدس هیچی رو ثابت نمی‌کنه»: three dots; «بلدی یا فقط شانس آوردی؟»: two words; «صدتا معامله»: a hundred dots fill in
  const gridK = k01(t, ws(131) - 0.05, ws(136) - ws(131) + 0.3), cell = 66, gx = CX + 4.5 * cell, gy = 600;
  const dotAt = (n) => [gx - (n % 10) * cell, gy + Math.floor(n / 10) * cell];
  const three = t < ws(131) - 0.05;
  if (three) { [0, 1, 2].forEach((j) => { const k = pop(t - T_PROOF - j * 0.08, 18); circle(CX + (1 - j) * 140, 760, 50 * cl(k, 0, 1.2), V); });
    if (t >= ws(126) - 0.05) { const a = pop(t - ws(126) + 0.05, 16), b = pop(t - ws(129) + 0.05, 16); scaleAt(CX + 220, 1000, cl(a, 0, 1.2), () => txt('مهارت؟', CX + 220, 1000, 84, G)); scaleAt(CX - 220, 1000, cl(b, 0, 1.2), () => txt('شانس؟', CX - 220, 1000, 84, R)); }
    else { const k = ex(k01(t, ws(121) - 0.05, 0.3)); cv.save(); clip(CX - 340, 900, 680 * k, 140); txt('۳ حدس = هیچی', CX, 970, 76, WH); cv.restore(); }
  } else {
    const n = Math.floor(3 + 97 * exIO(gridK));
    for (let j = 0; j < 100; j++) { const [x, y] = dotAt(j), first = j < 3, k = j < n ? 1 : 0; if (j < 3) { const [x0, y0] = [CX + (1 - j) * 140, 760], m = ex(k01(t, ws(131) - 0.05, 0.35)); circle(lerp(x0, x, m), lerp(y0, y, m), lerp(50, 24, m), first && t >= ws(137) - 0.05 ? V : WH); continue; }
      circle(x, y, 24 * k, WH); circle(x, y, 24 * (1 - k) * 0.35, DIM); }
    const c = Math.floor(lerp(3, 100, exIO(gridK))); scaleAt(CX, 470, 1, () => txt(fa(c) + ' معامله', CX, 470, 92, WH));
  }
  captions(t);
}
function app(t) {
  // «توی بک‌تست‌لب همین بازی رو روی بازار واقعی»: the replay screen; «کندل به کندل»: it steps a candle at a time;
  // «صد بار بازی می‌کنی»: the session counter runs to 100; «آمار واقعی خودتو»: the stats cards rise
  const k = spr(t - T_APP, 12), rd = ROUNDS[0], S = [...rd.setup, ...rd.reveal], P = { x: 60, y: lerp(560, 520, k), w: 960, h: 560 };
  const nameK = pop(t - ws(141) + 0.05, 16); scaleAt(CX, 400, cl(nameK, 0, 1.15), () => txt('بک‌تست‌لب', CX, 400, 110, WH));
  scaleAt(CX, P.y + P.h / 2, lerp(0.7, 1, k), () => {
    rrect(P.x, P.y, P.w, P.h, 36, PANEL);
    const step = t < ws(149) - 0.05 ? 20 : 20 + Math.floor((t - ws(149) + 0.05) / 0.16), n = Math.min(S.length, step), A = { x: P.x + 30, y: P.y + 100, w: P.w - 60, h: P.h - 140 };
    let lo = 1e9, hi = -1e9; S.slice(0, n).forEach((c) => { lo = Math.min(lo, c[2]); hi = Math.max(hi, c[1]); }); const Y = (v) => A.y + (1 - (v - lo) / (hi - lo)) * A.h, cw = A.w / 48;
    S.slice(Math.max(0, n - 46), n).forEach((c, j) => { const x = A.x + (j + 0.5) * cw, col = c[3] >= c[0] ? G : R; rect(x - 1.5, Y(c[1]), 3, Y(c[2]) - Y(c[1]), col); rect(x - cw * 0.32, Y(Math.max(c[0], c[3])), cw * 0.64, Math.max(3, Y(Math.min(c[0], c[3])) - Y(Math.max(c[0], c[3]))), col); });
    // the replay controls: ◀◀ ▶ ▶▶, the play button pressed on «کندل به کندل»
    const pk = pop(t - ws(149) + 0.05, 20), bx = P.x + 90, by = P.y + 52; [0, 22].forEach((o) => poly([[bx + 8 + o, by], [bx + 30 + o, by - 14], [bx + 30 + o, by + 14]], WH));
    scaleAt(bx + 90, by, 1 + 0.15 * Math.sin(Math.PI * cl(pk)), () => { circle(bx + 90, by, 30, V); poly([[bx + 80, by - 14], [bx + 104, by], [bx + 80, by + 14]], WH); });
    const cnt = t < ws(152) - 0.05 ? 1 : Math.min(100, 1 + Math.floor(99 * exIO(k01(t, ws(152) - 0.05, ws(156) - ws(152) + 0.2))));
    txt('معامله‌ی ' + fa(cnt) + ' از ۱۰۰', P.x + P.w - 40, by, 50, WH, { align: 'right', w: 800 });
  });
  // the stats: labels and bars only (no invented numbers)
  if (t >= ws(158) - 0.1) [['وین‌ریت', 0.62, G], ['میانگین R', 0.48, V], ['بیشترین افت', 0.35, R]].forEach(([s, f, col], j) => { const kk = spr(t - ws(158) + 0.1 - j * 0.1, 15), y = 1150 + j * 0, x = CX + (1 - j) * 320;
    cv.save(); cv.translate(0, (1 - kk) * 400); rrect(x - 150, 1150, 300, 160, 28, PANEL, DIM, 3); txt(s, x, 1195, 40, WH, { w: 800 }); rrect(x - 110, 1250, 220, 18, 9, DIM); rrect(x - 110, 1250, 220 * f * ex(k01(t, ws(159), 0.6)), 18, 9, col); cv.restore(); });
  captions(t);
}
function cta(t) {
  // «امتیازتو کامنت کن: صفر، یک، دو یا سه؟»: a comment box, then the four answers pop in on each word
  const k = spr(t - T_CTA, 13), bk = pop(t - T_CTA - 0.05, 14);
  scaleAt(CX, 560, cl(bk, 0, 1.15), () => { rrect(CX - 380, 470, 760, 180, 50, WH); poly([[CX + 220, 640], [CX + 300, 640], [CX + 330, 710]], WH); txt('امتیاز تو چند شد؟', CX, 560, 66, K); });
  [166, 167, 168, 170].forEach((wi, j) => { const kk = pop(t - ws(wi) + 0.05, 18), x = CX + (1.5 - j) * 220, y = 900; if (kk <= 0) return;
    scaleAt(x, y, cl(kk, 0, 1.2), () => { circle(x, y, 92, PANEL, V, 6); txt(fa(j), x, y + 8, 110, WH, { dir: 'ltr' }); }); });
  if (t >= ws(170) + 0.15) { const kk = ex(k01(t, ws(170) + 0.15, 0.3)); cv.save(); clip(CX - 460 * kk, 1060, 920 * kk, 120); txt('بفرستش برای رفیقی که فکر می‌کنه آینده رو می‌بینه', CX, 1120, 44, WH, { w: 700 }); cv.restore(); }
  const lk = ex(k01(t, T_CTA, 0.4)); txt('بک‌تست‌لب', CX, 1250, 64 * lk, V);
  captions(t);
}
window.seek = (t) => {
  t = cl(t, 0, DUR); cv.setTransform(1, 0, 0, 1, 0, 0); cv.filter = 'none'; cv.globalAlpha = 1; rect(0, 0, W, H, K);
  if (t < ws(13) - 0.1) { hook(t); captions(t); }
  else if (t < T_TWIST) rounds(t, roundOf(t));
  else if (t < T_COIN) twist(t);
  else if (t < T_PROOF) coins(t);
  else if (t < T_APP) proof(t);
  else if (t < T_CTA) app(t);
  else cta(t);
};
window.DURATION = DUR;
(async () => { await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A'))); window.seek(0); window.ready = true; })();
