// g1 · «زیر ۳۰ بخر، بالای ۷۰ بفروش»: the RSI 30/70 rule on 11 years of real gold prices, built for reach:
// the rule on screen from the first frame, 11 years fast-forwarded with every trade flashing, a win-rate tease,
// the twist (the account ends −59%), the buy-and-hold comparison, and a comment prompt that opens a series.
// Scenes are written in the music-only cut's times (TB). The voiced cut sets its own scene starts (DATA.t) and
// warp knots [[actual s, base s], …] per scene (DATA.warp); render() maps its time into TB.
const TB = { hook: 0.0, run: 2.2, tease: 6.4, reveal: 8.0, compare: 11.6, cta: 14.2 };
const T = TB, ST = DATA.stats, SUB_AT = DATA.sub_at ?? 0.7;
const GOLD = '#F5B014', GOLD2 = '#FFD566';
const lt = (t, k) => t - T[k];
const shake = (t, t0, d = 0.35, a = 14) => { const k = 1 - P(t, t0, d); return k > 0 && t >= t0 ? [Math.sin(t * 90) * a * k, Math.cos(t * 77) * a * k] : [0, 0]; };

/** Words that land one by one (right to left), blurring in and rising. words: [[text, colour?], …]. */
function kw(words, x, y, t, t0, o = {}) {
  const size = o.size ?? 100, font = o.font ?? 'Rdx', wt = o.weight ?? 700, gap = size * 0.3, st = o.stagger ?? 0.1;
  const ws = words.map(([s]) => measure(s, size, wt, font)); const total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let right = x + total / 2; const out = o.out !== undefined ? 1 - E.in(P(t, o.out, 0.2)) : 1;
  words.forEach(([s, col], i) => { const k = E.out(P(t, t0 + i * st, o.d ?? 0.3)) * out;
    if (k > 0) { cv.save(); cv.filter = k < 0.995 ? `blur(${((1 - k) * 16).toFixed(1)}px)` : 'none';
      txt(s, right, y + (1 - k) * 40, { size, font, weight: wt, color: col ?? o.color ?? C.ink, align: 'right', alpha: k, glow: col ? rgba(col, 0.55) : undefined, glowBlur: 30 }); cv.restore(); }
    right -= ws[i] + gap; });
}
function bg(t, o = {}) {
  cv.fillStyle = '#0A0812'; cv.fillRect(0, 0, W, H);
  glow(760 + 60 * Math.sin(t * 0.5), 200, 900, 640, o.col ?? GOLD, (o.a ?? 0.16));
  glow(200, 1500, 800, 600, C.accent, 0.16);
  if (o.red) glow(540, 900, 1000, 1000, C.loss, 0.22 * o.red);
}
function panel(x, y, w, h, a = 1, o = {}) { card(x, y, w, h, { r: 40, alpha: a, fill: rgba('#120F1C', 0.92), border: o.border ?? rgba(GOLD, 0.35) }); }
function smallPrint(t, a) { if (a > 0) txt('طلا (XAUUSD) · تایم‌فریم ۱ ساعته · RSI ۱۴ · ۲۰۱۵ تا ۲۰۲۶ · بدون کارمزد', 540, 1530, { size: 28, weight: 500, color: C.faint, alpha: a, font: 'Vaz' }); }

// ---------- 1 · the rule, on a real RSI ----------
const RW = DATA.rsi_window;   // a real H1 window (12–19 Nov 2024) with one dip under 30 and one push over 70
const MARKS = (() => { const m = []; for (let i = 1; i < RW.length; i++) { if (RW[i][5] > 70 && RW[i - 1][5] <= 70) m.push([i, -1]); if (RW[i][5] < 30 && RW[i - 1][5] >= 30) m.push([i, 1]); } return m; })();
function sHook(t) {
  const l = lt(t, 'hook'); bg(t);
  // fully readable from the first frame (the frame people see while scrolling)
  kw([['زیر'], ['۳۰', C.gain], ['بخر،']], 540, 330, t, -1, { size: 104, stagger: 0.06 });
  kw([['بالای'], ['۷۰', C.loss], ['بفروش']], 540, 470, t, -1, { size: 104, stagger: 0.06 });
  kw([['۱۱'], ['سال'], ['طلا'], ['رو'], ['باهاش'], ['تست'], ['کردم…', GOLD2]], 540, 605, t, SUB_AT, { size: 60, stagger: 0.05, font: 'Vaz' });
  const k = 1; panel(90, 700, 900, 720, k);
  if (k <= 0) return;
  const cr = { x: 130, y: 740, w: 820, h: 360 }, rr_ = { x: 130, y: 1150, w: 820, h: 220 };
  let lo = Infinity, hi = -Infinity; RW.forEach((b) => { lo = Math.min(lo, b[3]); hi = Math.max(hi, b[2]); });
  const n = RW.length, cw = cr.w / n, X = (i) => cr.x + (i + 0.5) * cw, Y = (v) => cr.y + (1 - (v - lo) / (hi - lo)) * cr.h, RY = (v) => rr_.y + (1 - v / 100) * rr_.h;
  cv.save(); cv.globalAlpha = k;
  RW.forEach(([, o, h, lw, c], i) => { const col = c >= o ? C.gain : C.loss; cv.strokeStyle = col; cv.fillStyle = col; cv.lineWidth = 2; cv.beginPath(); cv.moveTo(X(i), Y(h)); cv.lineTo(X(i), Y(lw)); cv.stroke(); cv.fillRect(X(i) - cw * 0.33, Y(Math.max(o, c)), cw * 0.66, Math.max(2, Math.abs(Y(o) - Y(c)))); });
  [[70, C.loss], [30, C.gain]].forEach(([v, col]) => { dashLine(rr_.x, RY(v), rr_.x + rr_.w, RY(v), rgba(col, 0.8), 2.5, [12, 10]); txt(fa(v), rr_.x - 8, RY(v), { size: 26, weight: 700, color: col, align: 'right', font: 'Rdx' }); });
  cv.beginPath(); RW.forEach((b, i) => (i ? cv.lineTo : cv.moveTo).call(cv, X(i), RY(b[5]))); cv.strokeStyle = C.lilac; cv.lineWidth = 4; cv.stroke();
  txt('RSI', rr_.x + rr_.w, rr_.y - 14, { size: 26, weight: 700, color: C.lilac, align: 'right', dir: 'ltr', font: 'Rdx' });
  cv.restore();
  const fk = P(l, 1.3, 0.3); if (fk > 0) { cv.save(); cv.translate(540, 1495); cv.scale(E.back(fk), E.back(fk)); pill(0, 0, 'معروف‌ترین قانون RSI', { size: 40, dot: GOLD, color: C.ink, alpha: clamp(fk * 2), border: rgba(GOLD, 0.8) }); cv.restore(); }
  MARKS.forEach(([i, side], j) => { const pk = E.back(P(l, 0.45 + j * 0.6, 0.35)); if (pk <= 0) return; const x = X(i), y = side > 0 ? Y(RW[i][3]) + 46 : Y(RW[i][2]) - 46;
    cv.save(); cv.translate(x, y); cv.scale(pk, pk); tag(0, 0, side > 0 ? 'خرید' : 'فروش', side > 0 ? C.gain : C.loss, { size: 30, dir: 'rtl' }); cv.restore();
    dot(x, RY(RW[i][5]), side > 0 ? C.gain : C.loss, 10, P(l, 0.45 + j * 0.6, 0.6)); });
}

// ---------- 2 · 11 years, every trade ----------
const DL = DATA.daily, T0 = DL[0][0], T1 = DL[DL.length - 1][0];
const GR = { x: 110, y: 620, w: 860, h: 700 };
let GLO = Infinity, GHI = -Infinity; DL.forEach(([, c]) => { GLO = Math.min(GLO, c); GHI = Math.max(GHI, c); });
const GX = (ts) => GR.x + ((ts - T0) / (T1 - T0)) * GR.w, GY = (v) => GR.y + (1 - (v - GLO * 0.92) / (GHI * 1.04 - GLO * 0.92)) * GR.h;
const ENTRY_X = DATA.entries.map(([ts, s]) => [GX(ts), s, ts]);
function goldChart(t, prog, o = {}) {
  const a = o.alpha ?? 1; panel(GR.x - 40, GR.y - 60, GR.w + 80, GR.h + 120, a);
  const head = Math.max(1, Math.floor(DL.length * prog)), hx = GX(DL[Math.min(DL.length - 1, head - 1)][0]);
  cv.save(); cv.globalAlpha = a;
  // the trades: a flash as the line reaches each one, then a faint mark
  ENTRY_X.forEach(([x, s]) => { if (x > hx) return; const age = (hx - x) / 40; const f = Math.max(0.18, 1 - age); const y = s > 0 ? GR.y + GR.h + 18 : GR.y - 18;
    cv.globalAlpha = a * f; cv.fillStyle = s > 0 ? C.gain : C.loss; cv.fillRect(x - 1.5, s > 0 ? y - 14 : y, 3, 14); });
  cv.globalAlpha = a;
  cv.beginPath(); for (let i = 0; i < head; i++) (i ? cv.lineTo : cv.moveTo).call(cv, GX(DL[i][0]), GY(DL[i][1]));
  cv.lineJoin = 'round'; cv.lineWidth = 5; cv.strokeStyle = GOLD; cv.shadowColor = GOLD; cv.shadowBlur = 22; cv.stroke(); cv.shadowBlur = 0;
  if (prog < 1) dot(hx, GY(DL[head - 1][1]), GOLD2, 11, (t * 2) % 1);
  cv.restore();
  txt('$' + Math.round(DL[0][1]).toLocaleString('en-US'), GR.x, GY(DL[0][1]) + 44, { size: 30, weight: 700, color: C.muted, align: 'left', dir: 'ltr', font: 'Rdx', alpha: a });
  if (prog >= 0.98) txt('$' + Math.round(DL[DL.length - 1][1]).toLocaleString('en-US'), GR.x + GR.w, GY(DL[DL.length - 1][1]) - 40, { size: 34, weight: 700, color: GOLD2, align: 'right', dir: 'ltr', font: 'Rdx', alpha: a * P(prog, 0.98, 0.02) });
  return hx;
}
const runProg = (t) => E.inOut(P(t, T.run + 0.25, 3.6));
function sRun(t) {
  const l = lt(t, 'run'); bg(t);
  const prog = runProg(t), hx = goldChart(t, prog, { alpha: E.out(P(l, 0, 0.3)) });
  const n = ENTRY_X.filter(([x]) => x <= hx).length, year = new Date(DL[Math.min(DL.length - 1, Math.floor((DL.length - 1) * prog))][0] * 1000).getUTCFullYear();
  const k = E.out(P(l, 0.05, 0.3));
  txt(fa(Math.min(n, ST.trades)), 540, 330, { size: 150, weight: 700, font: 'Rdx', color: C.ink, alpha: k, glow: rgba(GOLD, 0.5), glowBlur: 40 });
  txt('معامله', 540, 450, { size: 50, weight: 700, color: C.muted, alpha: k, font: 'Vaz' });
  pill(540, 1440, fy(year), { size: 40, dot: GOLD, alpha: k, color: C.ink });
}

// ---------- 3 · the tease ----------
function sTease(t) {
  const l = lt(t, 'tease'); bg(t);
  goldChart(t, 1, { alpha: 1 - 0.55 * E.out(P(l, 0, 0.3)) });
  const sk = E.back(P(l, 0.02, 0.4)); if (sk > 0) { cv.save(); cv.translate(540, 820); cv.scale(sk, sk); cv.globalAlpha = clamp(sk);
    txt('وین‌ریت', 0, -130, { size: 64, weight: 700, color: C.ink, font: 'Vaz' });
    txt(fa(Math.round(ST.win_rate)) + '٪', 0, 20, { size: 220, weight: 700, color: '#5CF2B0', font: 'Rdx', glow: rgba(C.gain, 0.9), glowBlur: 60, dir: 'ltr' });
    txt(fa(ST.trades) + ' معامله', 0, 175, { size: 46, weight: 600, color: C.muted, font: 'Vaz' }); cv.restore(); }
  kw([['ولی…']], 540, 1230, t, T.tease + 0.95, { size: 120 });
}

// ---------- 4 · the twist: the account ----------
const EQ = DATA.equity;
function sReveal(t) {
  const l = lt(t, 'reveal'), [sx, sy] = shake(t, T.reveal + 1.45);
  bg(t, { red: E.out(P(l, 1.4, 0.4)) });
  cv.save(); cv.translate(sx, sy);
  const R = { x: 130, y: 760, w: 820, h: 560 }; panel(R.x - 40, R.y - 60, R.w + 80, R.h + 120, 1, { border: rgba(C.loss, 0.5) });
  let lo = Infinity, hi = -Infinity; EQ.forEach(([, v]) => { lo = Math.min(lo, v); hi = Math.max(hi, v); }); lo = Math.min(lo, 0.35); hi = Math.max(hi, 1.1);
  const X = (i) => R.x + (i / (EQ.length - 1)) * R.w, Y = (v) => R.y + (1 - (v - lo) / (hi - lo)) * R.h;
  dashLine(R.x, Y(1), R.x + R.w, Y(1), rgba(C.ink, 0.45), 2.5, [12, 10]);
  txt('سرمایه‌ی اول', R.x + R.w, Y(1) - 26, { size: 28, weight: 600, color: C.muted, align: 'right', font: 'Vaz' });
  const up = EQ.length * E.inOut(P(l, 0.05, 1.3));
  series(R, EQ.map((e) => e[1]), { upto: up, color: C.loss, lw: 6, glow: true, fill: C.loss, lo, hi });
  const nk = E.back(P(l, 1.4, 0.4));
  if (nk > 0) { cv.save(); cv.translate(540, 420); cv.scale(nk, nk); txt('−' + fa(Math.round(-ST.return_pct)) + '٪', 0, 0, { size: 230, weight: 700, color: '#FF6B7D', font: 'Rdx', glow: rgba(C.loss, 0.95), glowBlur: 60, dir: 'ltr' }); cv.restore(); }
  txt('حساب، بعد از ' + fa(ST.trades) + ' معامله', 540, 590, { size: 50, weight: 700, color: C.ink, alpha: E.out(P(l, 1.7, 0.3)), font: 'Vaz' });
  cv.restore();
  const ck = P(l, 2.2, 0.3); if (ck > 0) { cv.save(); cv.translate(540, 1430); cv.scale(E.back(ck), E.back(ck)); pill(0, 0, 'بیشترین افت حساب: ' + fa(Math.round(ST.max_dd_pct)) + '٪', { size: 40, dot: C.loss, color: C.ink, alpha: clamp(ck * 2) }); cv.restore(); }
  smallPrint(t, E.out(P(l, 1.8, 0.4)));
}

// ---------- 5 · the same 11 years, just holding ----------
function sCompare(t) {
  const l = lt(t, 'compare'); bg(t, { col: C.gain, a: 0.12 });
  kw([['همون'], ['۱۱'], ['سال:']], 540, 330, t, T.compare + 0.05, { size: 92 });
  const base = 1120, gk = E.out(P(l, 0.75, 0.9)), rk = E.out(P(l, 0.3, 0.6)), bw = 300;
  // this rule
  cv.save(); cv.shadowColor = C.loss; cv.shadowBlur = 30; rr(140, base, bw, 150 * rk, 24); cv.fillStyle = rgba(C.loss, 0.85); cv.fill(); cv.restore();
  txt('−' + fa(Math.round(-ST.return_pct)) + '٪', 140 + bw / 2, base + 150 * rk + 60, { size: 84, weight: 700, color: '#FF6B7D', font: 'Rdx', alpha: rk, dir: 'ltr' });
  txt('این قانون', 140 + bw / 2, base - 50, { size: 46, weight: 700, color: C.ink, font: 'Vaz', alpha: rk });
  // buy and hold
  const gh = 560 * gk; cv.save(); cv.shadowColor = C.gain; cv.shadowBlur = 40; rr(640, base - gh, bw, gh, 24); cv.fillStyle = rgba(C.gain, 0.9); cv.fill(); cv.restore();
  txt('+' + fa(Math.round(DATA.buy_hold_pct)) + '٪', 640 + bw / 2, base - gh - 70, { size: 84, weight: 700, color: '#5CF2B0', font: 'Rdx', alpha: gk, dir: 'ltr', glow: rgba(C.gain, 0.8), glowBlur: 40 });
  txt('فقط نگه داشتن طلا', 640 + bw / 2, base + 60, { size: 42, weight: 700, color: C.ink, font: 'Vaz', alpha: gk });
  cv.save(); cv.strokeStyle = rgba(C.ink, 0.35); cv.lineWidth = 3; cv.beginPath(); cv.moveTo(100, base); cv.lineTo(980, base); cv.stroke(); cv.restore();
  smallPrint(t, E.out(P(l, 0.4, 0.4)));
}

// ---------- 6 · the lesson and the comment prompt ----------
function sCta(t) {
  const l = lt(t, 'cta'); bg(t, { col: C.accent, a: 0.22 });
  kw([['وین‌ریت'], ['بالا']], 540, 470, t, T.cta + 0.05, { size: 110 });
  kw([['یعنی'], ['سود؟'], ['نه!', '#FF6B7D']], 540, 620, t, T.cta + 0.45, { size: 110 });
  const ck = E.back(P(l, 1.25, 0.45)); if (ck > 0) { cv.save(); cv.translate(540, 980); cv.scale(ck, ck); cv.globalAlpha = clamp(ck);
    card(-430, -150, 860, 300, { r: 48, border: rgba(GOLD, 0.8), glow: rgba(GOLD, 0.35), fill: rgba('#16121F', 0.96) });
    txt('استراتژی بعدی رو کامنت کن', 0, -45, { size: 58, weight: 700, color: C.ink, font: 'Rdx' });
    txt('تا روی داده‌ی واقعی تستش کنم', 0, 55, { size: 46, weight: 600, color: GOLD2, font: 'Vaz' }); cv.restore();
    const bob = Math.sin((l - 1.25) * 6) * 10; cv.save(); cv.globalAlpha = clamp(ck); cv.translate(540, 1200 + bob); cv.fillStyle = GOLD; cv.beginPath(); cv.moveTo(0, 34); cv.lineTo(30, 0); cv.lineTo(10, 0); cv.lineTo(10, -32); cv.lineTo(-10, -32); cv.lineTo(-10, 0); cv.lineTo(-30, 0); cv.closePath(); cv.fill(); cv.restore(); }
  const sk2 = P(l, 2.0, 0.35); if (sk2 > 0) { cv.save(); cv.translate(540, 1300); cv.scale(E.back(sk2), E.back(sk2)); pill(0, 0, 'بفرست برای رفیقی که با RSI ترید می‌کنه', { size: 38, dot: C.accent, color: C.ink, alpha: clamp(sk2 * 2), border: rgba(C.accent, 0.8) }); cv.restore(); }
  const fk = E.out(P(l, 2.3, 0.4)); if (fk > 0 && IMG.logo) { const w = 300, h = (w * IMG.logo.height) / IMG.logo.width; cv.save(); cv.globalAlpha = fk * 0.9; cv.drawImage(IMG.logo, 540 - w / 2, 1440 - h / 2, w, h); cv.restore();
    txt('تست با داده‌ی واقعی بازار', 540, 1515, { size: 30, weight: 500, color: C.muted, alpha: fk, font: 'Vaz' }); }
}

const SCENES = { hook: sHook, run: sRun, tease: sTease, reveal: sReveal, compare: sCompare, cta: sCta };
const ACT = DATA.t, ORDER = Object.keys(SCENES).filter((k) => ACT[k] !== undefined).sort((a, b) => ACT[a] - ACT[b]);
function toBase(t) {
  let k = ORDER[0]; for (const s of ORDER) if (t >= ACT[s]) k = s;
  const la = t - ACT[k], kn = DATA.warp?.[k]; let lb = la;
  if (kn && kn.length) {
    if (la <= kn[0][0]) lb = kn[0][1] + (la - kn[0][0]);
    else if (la >= kn[kn.length - 1][0]) lb = kn[kn.length - 1][1] + (la - kn[kn.length - 1][0]);
    else for (let i = 1; i < kn.length; i++) if (la <= kn[i][0]) { const [a0, b0] = kn[i - 1], [a1, b1] = kn[i]; lb = b0 + ((la - a0) / (a1 - a0)) * (b1 - b0); break; }
  }
  return [k, TB[k] + lb];
}
function render(t) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  const [k, tb] = toBase(t);
  SCENES[k](tb); cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none'; finish(t);
}
boot(render);
