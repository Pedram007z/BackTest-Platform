// m5 · «درد تریدر»: the stop that gets hit one tick before the price turns. Motion graphics on the user's voice, all
// on gold's real prices of 5 July 2024 (the US jobs report, 16:00 Tehran): one 1-minute candle fell from 2366.09 to
// 2347.52, through the stops under the previous low (2350.36) and the round 2350, and closed back at 2362.58; two
// minutes later gold traded at 2376. Scenes: the hook (the stop hit, then the turn), «آشناست؟» (rewind; your stop is
// one of a crowd), where everyone puts it (previous low, round number, the sweep), the backtest (a further stop with
// half the size, same $800 risk), the 1-pip share prompt, and the link with the 7-day trial.
const T = DATA.t, SAY = DATA.say, TR = DATA.trade, M1 = DATA.m1, M30 = DATA.m30;
const GOLD = '#F5B014', GOLD2 = '#FFD566', RED = C.loss, RED2 = '#FF6B7D', GRN = C.gain, GRN2 = '#5CF2B0', BLUE = '#6E8BFF';
const fp = (v, d = 0) => fa(v, d).replace(/٬/g, '');
const money = (v) => '\u2066' + (v < 0 ? '−' : '+') + '$' + fa(Math.abs(Math.round(v))).replace(/٬/g, ',') + '\u2069';
const teh = (ts) => { const d = new Date((ts + 12600) * 1000); return fa(d.getUTCHours()) + ':' + String(d.getUTCMinutes()).padStart(2, '0').replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]); };
const shake = (t, t0, d = 0.4, a = 16) => { const k = 1 - P(t, t0, d); return k > 0 && t >= t0 ? [Math.sin(t * 93) * a * k, Math.cos(t * 71) * a * k] : [0, 0]; };

// ---------- words: each lands as it is spoken ----------
/** Lay out SAY[key] in centred right-to-left rows; a word blurs in and rises at its spoken time and glows while it is said. */
function say(key, t, y, o = {}) {
  const ws = SAY[key], size = o.size ?? 78, font = o.font ?? 'Rdx', wt = o.weight ?? 700, gap = size * 0.28, maxW = o.maxW ?? 940, lh = size * (o.lh ?? 1.32);
  const wd = ws.map(([s]) => measure(s, size, wt, font)); const rows = [[]]; let rw = 0;
  ws.forEach((_, i) => { if (rw > 0 && rw + gap + wd[i] > maxW) { rows.push([]); rw = 0; } rows[rows.length - 1].push(i); rw += (rw > 0 ? gap : 0) + wd[i]; });
  const out = o.out !== undefined ? 1 - E.in(P(t, o.out, 0.25)) : 1; if (out <= 0) return;
  rows.forEach((row, ri) => {
    const total = row.reduce((a, i) => a + wd[i], 0) + gap * (row.length - 1); let right = 540 + total / 2; const yy = y + ri * lh;
    row.forEach((i) => { const [s, a, b] = ws[i]; const k = o.pre && a < o.pre ? 1 : E.out(P(t, a - 0.1, 0.28)); const col = o.colors?.[i] ?? o.color ?? C.ink;
      const on = t >= a - 0.05 && t <= b + 0.1 ? 1 : 0; const kk = k * out;
      if (kk > 0) { cv.save(); cv.filter = k < 0.995 ? `blur(${((1 - k) * 14).toFixed(1)}px)` : 'none';
        txt(s, right, yy + (1 - k) * 30, { size, font, weight: wt, color: col, align: 'right', alpha: kk * (o.dim && !on && t > b ? 0.92 : 1),
          glow: on ? rgba(o.hi ?? (col === C.ink ? C.accent : col), 0.75) : col !== C.ink ? rgba(col, 0.4) : undefined, glowBlur: on ? 34 : 24 }); cv.restore(); }
      right -= wd[i] + gap; });
  });
}

// ---------- background, panel, chart ----------
function bg(t, o = {}) {
  cv.fillStyle = '#0A0812'; cv.fillRect(0, 0, W, H);
  glow(780 + 50 * Math.sin(t * 0.45), 260, 900, 620, o.col ?? C.accent, o.a ?? 0.15);
  glow(220, 1560, 820, 620, o.col2 ?? C.violet, 0.12);
  if (o.red) glow(540, 1000, 1000, 1000, RED, 0.22 * o.red);
  if (o.green) glow(540, 1000, 1000, 1000, GRN, 0.18 * o.green);
}
function panel(x, y, w, h, a = 1, o = {}) { card(x, y, w, h, { r: 36, alpha: a, fill: rgba('#120F1C', 0.94), border: o.border ?? rgba(C.line, 1), glow: o.glow }); }
/** A candle's price path through the minute (or half hour): open → the far side first → the other → close. */
function pathAt(b, u, wick) {
  const [, o, h, l, c] = b; let pts;
  if (wick) pts = [[0, o], [0.45, l], [1, c]]; else pts = c >= o ? [[0, o], [0.3, l], [0.7, h], [1, c]] : [[0, o], [0.3, h], [0.7, l], [1, c]];
  let hi = o, lo = o, p = o;
  for (let i = 1; i < pts.length; i++) { const [u0, v0] = pts[i - 1], [u1, v1] = pts[i]; if (u >= u1) { hi = Math.max(hi, v1); lo = Math.min(lo, v1); p = v1; continue; } const k = (u - u0) / (u1 - u0); p = v0 + (v1 - v0) * E.sine(clamp(k)); hi = Math.max(hi, p); lo = Math.min(lo, p); break; }
  return [b[0], o, hi, lo, p];
}
/** Candles of bars[i0 … i1) in rect R; bars before ⌊f⌋ are whole, bar ⌊f⌋ is drawn as far as f's fraction. Returns mappers and the last price. */
function chart(R, bars, i0, i1, f, lo, hi, o = {}) {
  const n = i1 - i0, cw = R.w / n, X = (i) => R.x + (i - i0 + 0.5) * cw, Y = (v) => R.y + (1 - (v - lo) / (hi - lo)) * R.h;
  cv.save(); cv.globalAlpha *= o.alpha ?? 1;
  const step = o.grid ?? 5; cv.lineWidth = 1;
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) { cv.strokeStyle = rgba(C.line, 0.55); cv.beginPath(); cv.moveTo(R.x, Y(v)); cv.lineTo(R.x + R.w, Y(v)); cv.stroke();
    if (o.labels !== false) txt(fp(v), R.x + R.w + 14, Y(v), { size: 22, weight: 500, color: C.faint, align: 'left', dir: 'ltr', font: 'Rdx' }); }
  let last = null; const head = Math.min(Math.floor(f), i1 - 1);
  for (let i = i0; i <= head && i < bars.length; i++) {
    const b = i < Math.floor(f) ? bars[i] : pathAt(bars[i], f - Math.floor(f), o.wick === i); if (i === Math.floor(f) && f - i <= 0) break;
    const [, op, h, l, c] = b, x = X(i), up = c >= op, col = o.color?.(i) ?? (up ? GRN : RED); last = c;
    cv.strokeStyle = col; cv.fillStyle = col; cv.lineWidth = Math.max(1.5, Math.min(3, cw * 0.16));
    cv.beginPath(); cv.moveTo(x, Y(h)); cv.lineTo(x, Y(l)); cv.stroke();
    cv.fillRect(x - cw * 0.34, Y(Math.max(op, c)), cw * 0.68, Math.max(2, Math.abs(Y(op) - Y(c))));
  }
  cv.restore(); return { X, Y, cw, last };
}
/** A horizontal level across the chart with its label chip on the left and the price on the axis. */
function level(R, Y, v, col, label, a = 1, o = {}) {
  if (a <= 0) return; const y = Y(v); cv.save(); cv.globalAlpha *= a;
  if (o.dash === false) { cv.strokeStyle = col; cv.lineWidth = o.lw ?? 3; cv.beginPath(); cv.moveTo(o.x0 ?? R.x, y); cv.lineTo(R.x + R.w, y); cv.stroke(); }
  else dashLine(o.x0 ?? R.x, y, R.x + R.w, y, col, o.lw ?? 3, [14, 9]);
  cv.restore();
  if (label) pill(o.lx ?? R.x + 10, y + (o.dy ?? -30), label, { size: o.size ?? 24, dot: col, color: C.ink, alpha: a, align: 'left', border: rgba(col, 0.7), fill: rgba('#0E0B16', 0.9) });
  tag(R.x + R.w + 8, y, fp(v, o.dec ?? 0), col, { size: 22, align: 'left', dir: 'ltr', alpha: a });
}
function smallPrint(t, a, s) { if (a > 0) txt(s ?? 'طلا (XAUUSD) · ۱۵ تیر ۱۴۰۳ · ساعت ۱۶:۰۰ تهران، خبر اشتغال آمریکا', 540, 1525, { size: 27, weight: 500, color: C.faint, alpha: a, font: 'Vaz' }); }
function stamp(s, x, y, col, k, o = {}) { if (k <= 0) return; const sc = 1.6 - 0.6 * E.out(clamp(k)); cv.save(); cv.translate(x, y); cv.rotate(o.rot ?? -0.08); cv.scale(sc, sc); cv.globalAlpha *= clamp(k * 3);
  const w = measure(s, o.size ?? 64, 800, 'Rdx') + 60, h = (o.size ?? 64) * 1.6; rr(-w / 2, -h / 2, w, h, 18); cv.fillStyle = rgba(col, 0.16); cv.fill(); cv.lineWidth = 6; cv.strokeStyle = col; cv.shadowColor = col; cv.shadowBlur = 30; cv.stroke(); cv.shadowBlur = 0;
  txt(s, 0, 3, { size: o.size ?? 64, weight: 800, font: 'Rdx', color: col }); cv.restore(); }
/** A small person (head and shoulders): the traders whose stops sit in the same place. */
function person(x, y, s, col, a = 1) { if (a <= 0) return; cv.save(); cv.globalAlpha *= a; cv.fillStyle = col; cv.beginPath(); cv.arc(x, y - s * 0.95, s * 0.42, 0, 7); cv.fill(); cv.beginPath(); cv.ellipse(x, y, s * 0.7, s * 0.48, 0, Math.PI, 0); cv.fill(); cv.restore(); }

// ---------- 1 · the hook: the stop is hit, then the price turns ----------
const HR = { x: 100, y: 730, w: 790, h: 640 }, HI0 = 12, HI1 = 46, HLO = 2343, HHI = 2381, WICK = 30;
/** Where the 1-minute replay is at hook time l (fractional bar index from 12:00). */
function hookF(l) {
  if (l < 0.62) return 29 + 0.99 * P(l, 0, 0.62);
  if (l < T.hit + 0.05) return WICK + 0.45 * E.in(P(l, 0.62, T.hit + 0.05 - 0.62)) ** 0.7;
  if (l < T.back) return WICK + 0.45 + 0.02 * P(l, T.hit, T.back - T.hit);
  if (l < T.back + 0.6) return WICK + 0.47 + 0.53 * E.inOut(P(l, T.back, 0.6));
  if (l < 3.3) return 31 + 0.999 * P(l, T.back + 0.6, 3.3 - T.back - 0.6);
  if (l < 4.05) return 32 + 0.999 * E.inOut(P(l, 3.3, 0.75));
  return 33 + 4 * P(l, 4.05, 0.65);
}
const priceAt = (f) => { const i = Math.floor(f); return pathAt(M1[i], f - i, i === WICK)[4]; };
const HIT = (() => { for (let l = 0; l < 3; l += 0.005) if (priceAt(hookF(l)) <= TR.a.sl) return l; return T.hit; })();
const TPHIT = (() => { for (let l = HIT; l < 5; l += 0.005) if (priceAt(hookF(l)) >= TR.tp) return l; return 4; })();
function position(R, Y, x0, sl, a, o = {}) {
  if (a <= 0) return; cv.save(); cv.globalAlpha *= a;
  cv.fillStyle = rgba(GRN, 0.13); cv.fillRect(x0, Y(TR.tp), R.x + R.w - x0, Y(TR.entry) - Y(TR.tp));
  cv.fillStyle = rgba(RED, 0.13); cv.fillRect(x0, Y(TR.entry), R.x + R.w - x0, Y(sl) - Y(TR.entry)); cv.restore();
  level(R, Y, TR.tp, GRN, 'حد سود', a, { x0, lx: x0 + 10 });
  level(R, Y, TR.entry, C.muted, 'ورود', a, { x0, lx: x0 + 10, dy: -28 });
  level(R, Y, sl, RED, 'حد ضرر', a * (o.slA ?? 1), { x0, lx: x0 + 10, dy: 32, dash: false });
}
function sHook(t, cover) {
  const l = t - T.hook, f = cover ? WICK + 0.47 : hookF(l), hit = cover ? 1 : P(l, HIT, 0.25), [sx, sy] = cover ? [0, 0] : shake(t, HIT, 0.45, 18);
  bg(t, { red: hit * (1 - P(l, T.back + 0.6, 1.2)), green: P(l, T.back + 0.8, 0.8) });
  say('hook', cover ? 99 : t, 395, { size: 76, maxW: 990, pre: 1.45, colors: { 1: RED2, 2: RED2, 7: GRN2 } });
  cv.save(); cv.translate(sx, sy);
  panel(HR.x - 50, HR.y - 50, HR.w + 170, HR.h + 100);
  const { X, Y } = chart(HR, M1, HI0, HI1, f, HLO, HHI, { wick: WICK });
  const closed = l >= HIT || cover;
  position(HR, Y, HR.x, TR.a.sl, closed ? 1 - 0.55 * hit : 1);
  const p = priceAt(Math.min(f, M1.length - 0.001));
  if (!cover) { level(HR, Y, p, GOLD, null, 1, { dash: false, lw: 1.5, x0: X(Math.floor(f)), dec: 2 }); }
  // P&L, live until the stop, then the loss
  const pl = closed ? (TR.a.sl - TR.entry) * TR.oz : (p - TR.entry) * TR.oz;
  pill(HR.x - 20, HR.y - 4, (closed ? 'بسته شد: ' : 'سود/ضرر: ') + money(pl), { size: 30, dot: pl >= 0 ? GRN : RED, color: pl >= 0 ? GRN2 : RED2, align: 'left', weight: 700 });
  if (closed) { cross(X(WICK) , Y(TR.a.sl), 34, RED, 7); stamp('حد ضرر خورد', 400, Y(2356.5), RED2, cover ? 1 : P(l, HIT, 0.35), { size: 58 }); }
  // the target is reached two minutes later, without you
  const tk = cover ? 0 : P(l, TPHIT, 0.3); if (tk > 0) { glow(X(32), Y(TR.tp), 160, 90, GRN, 0.5 * (1 - P(l, TPHIT + 0.3, 0.6)) + 0.15);
    const pk = E.back(tk); cv.save(); cv.translate(X(23), Y(TR.tp) - 70); cv.scale(pk, pk); pill(0, 0, 'حد سود هم خورد… بدون تو', { size: 32, dot: GRN, color: GRN2, alpha: clamp(tk * 2), border: rgba(GRN, 0.8), weight: 700 }); cv.restore(); }
  cv.restore();
  [[HI0, 0], [21, 0], [WICK, 1], [40, 0]].forEach(([i, b]) => txt(teh(M1[i][0]), X(i), HR.y + HR.h + 30, { size: 24, weight: b ? 700 : 500, color: b ? GOLD2 : C.faint, font: 'Rdx', dir: 'ltr' }));
  smallPrint(t, 1);
}

// ---------- 2 · «آشناست؟»: rewind; your stop is one of a crowd ----------
const CROWD = (() => { const r = rng(55), out = []; for (let k = 0; k < 40; k++) out.push([HI0 + 0.5 + r() * 16.5, 2347.75 + r() * 2.45, r()]); return out; })();
function sFam(t) {
  const l = t - T.fam; bg(t, { red: 0.35 });
  const rw = P(l, 0, 0.75), f = rw < 1 ? lerp(36.9, WICK + 0.45, E.inOut(rw)) : WICK + 0.45;
  const zk = E.inOut(P(t, T.crowd - 0.1, 0.8));
  panel(HR.x - 50, HR.y - 50, HR.w + 170, HR.h + 100);
  // zoom towards the bottom of the wick, where the stops sat (inside the panel)
  cv.save(); rr(HR.x - 48, HR.y - 48, HR.w + 166, HR.h + 96, 34); cv.clip();
  const fx = HR.x + ((WICK - 8 - HI0 + 0.5) / (HI1 - HI0)) * HR.w, fy = HR.y + (1 - (2349 - HLO) / (HHI - HLO)) * HR.h;
  const zs = 1 + 1.1 * zk; cv.translate(fx, fy); cv.scale(zs, zs); cv.translate(-fx, -fy - 150 * zk);
  if (rw < 1) cv.filter = `saturate(${(0.35 + 0.65 * rw).toFixed(2)})`;
  const { X, Y } = chart(HR, M1, HI0, HI1, f, HLO, HHI, { wick: WICK, labels: zk < 0.05 });
  cv.filter = 'none';
  level(HR, Y, TR.a.sl, RED, null, 0.9, { dash: false });
  // rewinding: a tape symbol and scan lines
  if (rw < 1) { const a = 1 - P(l, 0.6, 0.2); cv.save(); cv.globalAlpha = a; cv.fillStyle = rgba(C.ink, 0.9); [0, 1].forEach((j) => { cv.beginPath(); const x = 520 - j * 48; cv.moveTo(x, 960); cv.lineTo(x - 48, 990); cv.lineTo(x, 1020); cv.closePath(); cv.fill(); });
    const r = rng(Math.floor(t * 30)); for (let k = 0; k < 7; k++) { cv.fillStyle = rgba(C.ink, 0.05 + r() * 0.07); cv.fillRect(HR.x - 50, HR.y + r() * HR.h, HR.w + 170, 2 + r() * 6); } cv.restore(); }
  // the crowd: everyone's stop in the same few dollars
  CROWD.forEach(([i, v, r], k) => { const a = E.back(P(t, T.crowd + 0.15 + k * 0.025, 0.3)); if (a <= 0) return; person(X(i), Y(v), 11 * a, rgba(RED2, 0.85), clamp(a)); });
  const yk = E.back(P(t, T.crowd + 0.9, 0.4)); if (yk > 0) { const x = X(WICK - 3.5), y = Y(TR.a.sl); person(x, y, 15 * yk, C.lilac, 1); cv.save(); cv.translate(x, y - 46); cv.scale(yk, yk); tag(0, 0, 'تو', C.accent, { size: 24, dir: 'rtl' }); cv.restore(); }
  cv.restore();
  const ck = E.out(P(t, T.crowd + 1.0, 0.4)); if (ck > 0) pill(540, HR.y + HR.h + 90, 'همه‌ی این‌ها حد ضررشون همون‌جا بود', { size: 30, dot: RED, color: C.ink, alpha: ck, border: rgba(RED, 0.7) });
  say('fam1', t, 420, { size: 150, out: T.crowd - 0.25, colors: { 0: GOLD2 } });
  say('fam2', t, 400, { size: 86, colors: { 2: RED2 } });
  smallPrint(t, 1 - zk);
}

// ---------- 3 · where everyone puts it: under the previous low, on the round number; then the sweep ----------
const ZR = { x: 100, y: 730, w: 790, h: 640 }, ZI0 = 4, ZI1 = 86, ZLO = 2344, ZHI = 2383, ZW = 70, ZPL = 17;
const SWARM = (() => { const r = rng(91), out = []; for (let k = 0; k < 70; k++) out.push([ZW - 0.4 + r() * 15.6, 2347.7 + r() * 2.55]); return out; })();
function sZone(t) {
  const l = t - T.zone, sw = P(t, T.sweep, 0.5);
  bg(t, { col: GOLD, a: 0.12, red: 0.3 * E.out(P(t, T.all, 0.6)) * (1 - sw) });
  say('zone1', t, 380, { size: 70, out: T.low - 1.2, colors: { 6: RED2, 7: RED2 } });
  say('zone2', t, 400, { size: 80, colors: { 2: BLUE, 3: BLUE, 5: GOLD2, 6: GOLD2 } });
  const [sx, sy] = shake(t, T.sweep + 0.2, 0.35, 12); cv.save(); cv.translate(sx, sy);
  panel(ZR.x - 50, ZR.y - 50, ZR.w + 170, ZR.h + 100, E.out(P(l, 0, 0.3)));
  const f = sw <= 0 ? ZW : sw < 1 ? ZW + 0.999 * sw : ZW + 1 + 0.999 * P(t, T.sweep + 0.5, 0.4);
  const { X, Y } = chart(ZR, M30, ZI0, ZI1, f, ZLO, ZHI, { wick: ZW });
  // your stop
  const yk = E.out(P(t, T.zone + 0.2, 0.4)); level(ZR, Y, TR.a.sl, C.lilac, 'حد ضرر تو', yk * (1 - sw), { dash: false, dy: 30, lx: ZR.x + 10 });
  // the previous low
  const lk = E.out(P(t, T.low, 0.4)); if (lk > 0) { const x = X(ZPL), y = Y(M30[ZPL][3]); cv.save(); cv.globalAlpha = lk; cv.strokeStyle = BLUE; cv.lineWidth = 4; cv.beginPath(); cv.arc(x, y, 26 + 20 * (1 - lk), 0, 7); cv.stroke(); cv.restore();
    dashLine(x, y, x + (ZR.x + ZR.w - x) * E.out(P(t, T.low, 0.6)), y, rgba(BLUE, 0.9), 3, [12, 8]);
    pill(x - 10, y - 66, 'کف قبلی ' + fp(DATA.prev_low[1], 2), { size: 28, dot: BLUE, color: C.ink, alpha: lk, align: 'left', border: rgba(BLUE, 0.8), fill: rgba('#0E0B16', 0.92) }); }
  // the round number
  const rk = E.out(P(t, T.round, 0.4)); if (rk > 0) { const y = Y(2350); cv.save(); cv.globalAlpha = rk; cv.shadowColor = GOLD; cv.shadowBlur = 18; cv.strokeStyle = GOLD; cv.lineWidth = 3.5; cv.beginPath(); cv.moveTo(ZR.x, y); cv.lineTo(ZR.x + ZR.w * E.out(P(t, T.round, 0.5)), y); cv.stroke(); cv.restore();
    tag(ZR.x + ZR.w + 8, y, '۲۳۵۰', GOLD, { size: 24, align: 'left', dir: 'ltr', alpha: rk, ink: '#1a1200' });
    pill(X(36), y - 40, 'عدد رُند', { size: 28, dot: GOLD, color: C.ink, alpha: rk, align: 'left', border: rgba(GOLD, 0.8), fill: rgba('#0E0B16', 0.92) }); }
  // everyone's stops, in a band just below; the wick takes them all
  const wickY = sw > 0 && sw < 1 ? Y(pathAt(M30[ZW], sw, true)[3]) : sw >= 1 ? Y(M30[ZW][3]) : -1;
  SWARM.forEach(([i, v], k) => { const a = E.back(P(t, T.all - 0.05 + k * 0.022, 0.3)); if (a <= 0) return; const y = Y(v);
    if (wickY >= y) { const pk = P(t, T.sweep + 0.05 + (v < 2349 ? 0.12 : 0.04), 0.35); if (pk < 1) { cv.save(); cv.globalAlpha = 1 - pk; cv.strokeStyle = RED2; cv.lineWidth = 2; cv.beginPath(); cv.arc(X(i), y, 6 + 26 * pk, 0, 7); cv.stroke(); cv.restore(); } return; }
    person(X(i), y, 10 * a, rgba(RED2, 0.85), clamp(a)); });
  const bk = E.out(P(t, T.all + 0.4, 0.4)) * (1 - sw); if (bk > 0) pill(X(ZW + 8), Y(2347.4) + 44, 'حد ضررِ همه', { size: 28, dot: RED, color: RED2, alpha: bk, border: rgba(RED, 0.8), fill: rgba('#0E0B16', 0.92) });
  cv.restore();
  [[ZI0, 'پنجشنبه'], [52, 'جمعه']].forEach(([i, s]) => txt(s, X(i), ZR.y + ZR.h + 30, { size: 24, weight: 500, color: C.faint, font: 'Vaz' }));
  smallPrint(t, 1, 'طلا (XAUUSD) · نمودار ۳۰ دقیقه‌ای · ۱۴ و ۱۵ تیر ۱۴۰۳');
}

// ---------- 4 · the backtest: a further stop with half the size ----------
const BR = { x: 100, y: 690, w: 790, h: 470 }, BI0 = 18, BI1 = 42, BLO = 2338, BHI = 2380;
function btF(t) { const l = t - T.run; if (l < 0) return 29.6; if (l < 0.35) return WICK + 0.45 * E.in(P(l, 0, 0.35)) ** 0.7; if (l < 0.55) return WICK + 0.45; if (l < 0.85) return WICK + 0.45 + 0.55 * E.inOut(P(l, 0.55, 0.3)); if (l < 1.15) return 31 + 0.999 * P(l, 0.85, 0.3); return 32 + 0.999 * E.inOut(P(l, 1.15, 0.35)) + 3 * P(l, 1.5, 0.9); }
const BHIT = (() => { for (let t = T.run; t < T.run + 2; t += 0.005) if (priceAt(btF(t)) <= TR.a.sl) return t; return T.run + 0.4; })();
const BTP = (() => { for (let t = BHIT; t < T.run + 3; t += 0.005) if (priceAt(btF(t)) >= TR.tp) return t; return T.run + 1.9; })();
function sBt(t) {
  const l = t - T.bt; bg(t, { col: C.accent, a: 0.2, green: 0.6 * P(t, BTP, 0.5) });
  say('bt', t, 380, { size: 60, maxW: 990, colors: { 6: BLUE, 7: BLUE, 9: BLUE, 10: BLUE } });
  const ak = E.out(P(l, 0, 0.35)); cv.save(); cv.globalAlpha = ak;
  panel(BR.x - 50, BR.y - 110, BR.w + 170, BR.h + 170, 1, { border: rgba(C.accent, 0.5) });
  // the replay panel's header: like the platform's backtest session
  pill(BR.x - 26, BR.y - 62, 'بک‌تست · طلا · ۱ دقیقه', { size: 26, dot: C.accent, color: C.ink, align: 'left' });
  const running = t >= T.run && t < T.run + 3; cv.fillStyle = running ? C.accent : C.muted; cv.beginPath();
  if (running) { cv.fillRect(BR.x + BR.w + 52, BR.y - 76, 9, 28); cv.fillRect(BR.x + BR.w + 68, BR.y - 76, 9, 28); } else { cv.moveTo(BR.x + BR.w + 52, BR.y - 78); cv.lineTo(BR.x + BR.w + 78, BR.y - 62); cv.lineTo(BR.x + BR.w + 52, BR.y - 46); cv.closePath(); cv.fill(); }
  const f = btF(t), { X, Y } = chart(BR, M1, BI0, BI1, f, BLO, BHI, { wick: WICK, grid: 10 });
  const far = E.inOut(P(t, T.far + 0.1, 0.7)), slB = lerp(TR.a.sl, TR.b.sl, far), half = E.inOut(P(t, T.size + 0.1, 0.5));
  const aHit = t >= BHIT, bTp = t >= BTP;
  level(BR, Y, TR.tp, GRN, 'حد سود', 1, { size: 22 });
  level(BR, Y, TR.entry, C.muted, 'ورود', 1, { size: 22, dy: -26 });
  level(BR, Y, TR.a.sl, RED, 'A', aHit ? 0.45 : 1, { size: 22, dash: false, dy: far > 0.3 ? 0 : -26, lx: BR.x + 140 });
  level(BR, Y, slB, BLUE, 'B', 1, { size: 22, dash: false, dy: 0, lx: BR.x + 220 });
  if (aHit) cross(X(WICK), Y(TR.a.sl), 30, RED, 6);
  if (t >= BHIT + 0.2 && !bTp) { const gy0 = Y(DATA.wick[3]), gy1 = Y(TR.b.sl); cv.save(); cv.strokeStyle = BLUE; cv.lineWidth = 2; cv.beginPath(); cv.moveTo(X(WICK) + 22, gy0); cv.lineTo(X(WICK) + 22, gy1); cv.stroke(); cv.restore(); }
  if (bTp) glow(X(32), Y(TR.tp), 140, 80, GRN, 0.45 * (1 - P(t, BTP + 0.3, 0.8)) + 0.12);
  cv.restore();
  // the two setups
  const lotB = lerp(TR.a.lot, TR.b.lot, half), riskB = (TR.entry - slB) * TR.oz * lotB, riskA = (TR.entry - TR.a.sl) * TR.oz * TR.a.lot;
  const cards = [[560, 'A · زیر کف', RED, TR.a.sl, TR.a.lot, riskA, aHit ? (TR.a.sl - TR.entry) * TR.oz * TR.a.lot : null, P(t, BHIT, 0.35)],
                 [100, 'B · یه کم دورتر', BLUE, slB, lotB, riskB, bTp ? (TR.tp - TR.entry) * TR.oz * TR.b.lot : null, P(t, BTP, 0.35)]];
  cards.forEach(([x, name, col, sl, lot, risk, res, rk], j) => { const ck = E.out(P(l, 0.25 + j * 0.15, 0.4)); if (ck <= 0) return; const y = 1230 + (1 - ck) * 40;
    card(x, y, 420, 300, { r: 30, alpha: ck, fill: rgba('#16121F', 0.96), border: rgba(col, res !== null ? 0.95 : 0.6), glow: res !== null ? rgba(res > 0 ? GRN : RED, 0.5) : undefined });
    cv.save(); cv.globalAlpha = ck;
    txt(name, x + 390, y + 48, { size: 34, weight: 700, color: col === RED ? RED2 : '#9DB0FF', align: 'right', font: 'Rdx' });
    const rows = [['حد ضرر', fp(sl, 0)], ['حجم', fp(lot, lot % 1 ? 1 : 0) + ' لات'], ['ریسک', '$' + fa(Math.round(risk)).replace(/٬/g, ',')]];
    rows.forEach(([a, b], i) => { const yy = y + 108 + i * 52; txt(a, x + 390, yy, { size: 30, weight: 500, color: C.muted, align: 'right' });
      const hot = (i === 0 && j === 1 && far > 0 && far < 1) || (i === 1 && j === 1 && half > 0 && half < 1) || (i === 2 && j === 1 && risk > riskA + 1);
      txt(b, x + 30, yy, { size: 32, weight: 700, color: i === 2 && risk > riskA + 1 ? RED2 : hot ? '#9DB0FF' : C.ink, align: 'left', dir: i === 1 ? 'rtl' : 'ltr', font: 'Rdx' }); });
    if (j === 1 && half >= 1 && t < T.run) { const sk = E.back(P(t, T.size + 0.55, 0.35)); if (sk > 0) { cv.save(); cv.translate(x + 210, y + 318); cv.scale(sk, sk); pill(0, 0, 'ریسک همون ۸۰۰ دلار', { size: 24, dot: GRN, color: C.ink }); cv.restore(); } }
    if (res !== null) { cv.fillStyle = rgba('#16121F', 0.97 * clamp(rk * 2)); rr(x + 2, y + 76, 416, 222, 28); cv.fill();
      const pk = E.back(rk); cv.save(); cv.translate(x + 210, y + 180); cv.scale(pk, pk); txt(money(res), 0, -6, { size: 92, weight: 800, font: 'Rdx', dir: 'ltr', color: res > 0 ? GRN2 : RED2, glow: rgba(res > 0 ? GRN : RED, 0.8), glowBlur: 40 });
      txt(res > 0 ? 'به حد سود رسید' : 'حد ضرر خورد', 0, 70, { size: 30, weight: 700, color: C.muted }); cv.restore(); badge(x + 50, y + 48, 24, res > 0, clamp(rk * 2)); }
    cv.restore(); });
  txt('یک نمونه‌ی واقعی؛ نتیجه رو روی صدها معامله‌ی خودت تست کن', 540, 1600, { size: 26, weight: 500, color: C.faint, alpha: E.out(P(t, BTP + 0.2, 0.4)), font: 'Vaz' });
}

// ---------- 5 · send it to the friend who is always stopped one pip before the turn ----------
function plane(x, y, s, col, a = 1) { cv.save(); cv.globalAlpha *= a; cv.translate(x, y); cv.rotate(-0.42); cv.fillStyle = col; cv.shadowColor = col; cv.shadowBlur = 30;
  cv.beginPath(); cv.moveTo(s, 0); cv.lineTo(-s, -s * 0.62); cv.lineTo(-s * 0.55, 0); cv.lineTo(-s, s * 0.62); cv.closePath(); cv.fill(); cv.shadowBlur = 0;
  cv.fillStyle = rgba('#000', 0.25); cv.beginPath(); cv.moveTo(s, 0); cv.lineTo(-s * 0.55, 0); cv.lineTo(-s, s * 0.62); cv.closePath(); cv.fill(); cv.restore(); }
function sShare(t) {
  const l = t - T.share; bg(t, { col: C.accent, a: 0.2 });
  say('share1', t, 380, { size: 84, colors: { 0: C.lilac } });
  say('share2', t, 490, { size: 70, colors: { 2: GOLD2, 6: RED2, 7: RED2 }, maxW: 900 });
  // the share button, pressed, and the plane flying off
  const bk = E.back(P(l, 0.05, 0.45)), fly = E.in(P(l, 1.05, 0.7));
  if (fly < 1) { cv.save(); cv.translate(540, 900); cv.scale(bk, bk); cv.globalAlpha = clamp(bk) * (1 - P(l, 1.5, 0.3)); card(-110, -110, 220, 220, { r: 60, fill: rgba(C.accent, 0.2), border: rgba(C.accent, 0.9), glow: rgba(C.accent, 0.5) }); cv.restore(); }
  if (bk > 0) plane(540 + 700 * fly, 900 - 520 * fly, 64 * bk * (1 - 0.4 * fly), C.lilac, 1 - P(l, 1.6, 0.2));
  // one pip: a candle's wick reaches just past the stop, then the price turns
  const mk = E.out(P(t, T.pip - 0.6, 0.5)); if (mk <= 0) return;
  const SY = 1320, cx = 430; cv.save(); cv.globalAlpha = mk;
  const down = E.inOut(P(t, T.pip - 0.5, 0.7)), tip = lerp(1060, SY + 7, down);
  dashLine(130, SY, 950, SY, RED, 5, [18, 10]); pill(150, SY + 46, 'حد ضرر', { size: 28, dot: RED, color: RED2, align: 'left', fill: rgba('#0E0B16', 0.92), border: rgba(RED, 0.8) });
  cv.fillStyle = RED; cv.fillRect(cx - 40, 860, 80, 190); cv.strokeStyle = RED; cv.lineWidth = 8; cv.beginPath(); cv.moveTo(cx, 810); cv.lineTo(cx, tip); cv.stroke();
  // the turn: a green candle shooting up
  const up = E.out(P(t, s2('برگشت') - 0.1, 0.5)); if (up > 0) { cv.fillStyle = GRN; const top = lerp(1040, 700, up); cv.fillRect(cx + 130 - 40, top, 80, 1060 - top); cv.strokeStyle = GRN; cv.beginPath(); cv.moveTo(cx + 130, top - 50 * up); cv.lineTo(cx + 130, SY - 40); cv.stroke(); }
  // the magnifier
  const gk = E.back(P(t, T.pip, 0.4)); if (gk > 0) { const gx = 800, gy = SY - 10, gr = 150 * gk; cv.save(); cv.beginPath(); cv.arc(gx, gy, gr, 0, 7); cv.fillStyle = rgba('#0E0B16', 0.96); cv.fill(); cv.clip();
    dashLine(gx - gr, gy + 14, gx + gr, gy + 14, RED, 8, [26, 14]); cv.strokeStyle = RED; cv.lineWidth = 22; cv.beginPath(); cv.moveTo(gx - 20, gy - gr); cv.lineTo(gx - 20, gy + 40); cv.stroke();
    cv.strokeStyle = GOLD2; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(gx + 26, gy + 14); cv.lineTo(gx + 26, gy + 40); cv.moveTo(gx + 18, gy + 14); cv.lineTo(gx + 34, gy + 14); cv.moveTo(gx + 18, gy + 40); cv.lineTo(gx + 34, gy + 40); cv.stroke();
    cv.restore(); cv.save(); cv.translate(gx, gy + gr + 70); cv.scale(clamp(gk), clamp(gk)); pill(0, 0, 'فقط ۱ پیپ', { size: 34, dot: GOLD, color: GOLD2, weight: 800, border: rgba(GOLD, 0.8) }); cv.restore();
    cv.save(); cv.globalAlpha = clamp(gk); cv.strokeStyle = C.ink; cv.lineWidth = 7; cv.beginPath(); cv.arc(gx, gy, gr, 0, 7); cv.stroke(); cv.lineWidth = 16; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(gx + gr * 0.72, gy + gr * 0.72); cv.lineTo(gx + gr * 1.12, gy + gr * 1.12); cv.stroke(); cv.restore();
    cv.strokeStyle = rgba(C.ink, 0.35); cv.lineWidth = 2; cv.beginPath(); cv.moveTo(cx + 8, SY); cv.lineTo(gx - gr, gy); cv.stroke(); }
  stamp('استاپ!', cx - 90, SY + 130, RED2, P(t, s2('استاپ'), 0.3), { size: 54, rot: 0.06 });
  cv.restore();
}
const s2 = (w) => { const x = SAY.share2.find(([s]) => s.startsWith(w)); return x ? x[1] : T.pip; };

// ---------- 6 · link in bio, 7 days free ----------
function sCta(t) {
  const l = t - T.cta; bg(t, { col: C.accent, a: 0.28, green: 0.3 * P(t, T.free, 0.5) });
  say('cta', t, 400, { size: 84, colors: { 3: GRN2, 4: GRN2, 5: GRN2 } });
  const lk = pop(t, T.cta + 0.15); if (lk > 0) { const y = 790, bob = Math.sin((t - T.cta) * 7) * 9; cv.save(); cv.translate(540, y); cv.scale(lk, lk); button(0, 0, 'لینک توی بیو', { size: 50 }); cv.restore();
    cv.save(); cv.globalAlpha = clamp(lk); cv.translate(540, y - 120 + bob); cv.fillStyle = C.lilac; cv.beginPath(); cv.moveTo(0, -38); cv.lineTo(34, 4); cv.lineTo(12, 4); cv.lineTo(12, 38); cv.lineTo(-12, 38); cv.lineTo(-12, 4); cv.lineTo(-34, 4); cv.closePath(); cv.fill(); cv.restore(); }
  const fk = pop(t, T.free); if (fk > 0) { cv.save(); cv.translate(540, 1080); cv.scale(fk, fk); cv.globalAlpha = clamp(fk);
    card(-400, -150, 800, 300, { r: 44, border: rgba(C.gain, 0.75), glow: rgba(C.gain, 0.35), fill: rgba('#16121F', 0.96) });
    txt('۷ روز', 0, -48, { size: 76, font: 'Rdx', weight: 700, color: C.ink });
    txt('رایگان', 0, 50, { size: 104, font: 'Rdx', weight: 700, color: GRN2, glow: rgba(C.gain, 0.5) }); cv.restore(); }
  const gk = E.out(P(t, T.free + 0.5, 0.5)); if (gk > 0 && IMG.logo) { const w = 330, h = (w * IMG.logo.height) / IMG.logo.width; cv.save(); cv.globalAlpha = gk; cv.drawImage(IMG.logo, 540 - w / 2, 1350 - h / 2, w, h); cv.restore();
    txt('backtestlab.ir', 540, 1435, { size: 38, weight: 600, color: C.muted, alpha: gk, dir: 'ltr', font: 'Rdx' }); }
  const qk = E.out(P(t, T.free + 0.9, 0.5)); if (qk > 0) pill(540, 1545, 'تو حد ضررت رو کجا می‌ذاری؟ کامنت کن', { size: 32, dot: GOLD, color: C.ink, alpha: qk, border: rgba(GOLD, 0.7) });
}

const SCENES = [['hook', sHook], ['fam', sFam], ['zone', sZone], ['bt', sBt], ['share', sShare], ['cta', sCta]];
const LABEL = 'درد تریدر';
function render(t) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  if (t < 0) { sHook(2.2, true); chrome(0, LABEL); finish(0); return; }
  let k = 0; SCENES.forEach(([n], i) => { if (t >= T[n]) k = i; });
  SCENES[k][1](t);
  // a short cut flash between scenes
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  SCENES.slice(1).forEach(([n]) => { const d = Math.abs(t - T[n]); if (d < 0.12) { cv.fillStyle = rgba('#0A0812', 0.7 * (1 - d / 0.12)); cv.fillRect(0, 0, W, H); } });
  if (k < 5) chrome(t, LABEL);
  finish(t);
}
boot(render);
