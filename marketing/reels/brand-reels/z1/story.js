// z1 · «میخوای جزو ۵ درصد باشی، ولی نمی‌دونی چطوری؟», one camera take through one world (z-kit).
// The world, as the camera meets it:
//   A  a crowd of 100: 95 fade, 5 turn gold; one grey figure with a «؟» is you
//   B  one of them beside one of the rest; «اندیکاتور مخفی» and «استراتژی جادویی» get stamped «نیست»
//   C1–C3  inside a badge on the gold figure's chest: the three numbers, from a real example (data.py): a plain breakout
//      rule on gold 4-hour candles, 755 trades 2015–2026 with costs: 3.7 of 10 win, wins 1.9× losses, 14 losses in a row
//   D  that rule's equity curve, zoomed on a real five-loss streak it rode through to a new high
//   E  the wall of all 755 trades, one tile each, around the curve
//   F  inside one real tile (trade 715, 27 Feb 2026): the replay, the future covered, the costs, and «عدد تو»
//   back to A: you turn gold; H inside you: the comment «عدد» and the DM; I the end card
const S = D.strat, RR = S.R, RP = S.replay, BR = RP.bars;
const EQ = [0]; RR.forEach((r) => EQ.push(EQ[EQ.length - 1] + r));
const mixC = (a, b, k) => { const p = (h) => (h[0] === '#' ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : h.match(/\d+/g).slice(0, 3).map(Number)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], cl(k)))).join(',')})`; };
const LIGHT = '#CFC9E2';
const ins = (par, lx, ly, s) => [par.at[0] + (lx - CX) * par.at[2], par.at[1] + (ly - CY) * par.at[2], par.at[2] * s];
/** A person: head and shoulders, origin at the chest. */
function person(x, y, s, col, glow) {
  at(x, y, s, 1, () => { if (glow) { cv.shadowColor = rgba(GOLD, 0.75 * glow); cv.shadowBlur = sb(34); }
    circle(0, -40, 17, col); cv.beginPath(); cv.roundRect(-25, -16, 50, 50, [22, 22, 8, 8]); cv.fillStyle = col; cv.fill(); });
}

// ================= A · the crowd =================
const GOLDS = [12, 27, 44, 71, 88], YOU = 55, crowdXY = (i) => [108 + (i % 10) * 96, 920 + Math.floor(i / 10) * 92];
const A = { id: 'A', at: [540, 960, 1], pad: 1.1, fadeAt: 10 };
A.draw = (t) => {
  const youGold = pop(t - ws(116) + 0.05, 13, 0.5);
  for (let i = 0; i < 100; i++) {
    const [x, y0] = crowdXY(i), y = y0 + Math.sin(t * 2.2 + i * 0.7) * 2.5, gi = GOLDS.indexOf(i);
    if (gi >= 0) { const k = pop(t - ws(2) - 0.05 - gi * 0.07, 14, 0.5); person(x, y - 8 * cl(k), 1 + 0.22 * cl(k, 0, 1.3), k > 0.02 ? mixC(LIGHT, GOLD, k * 1.5) : LIGHT, cl(k)); continue; }
    if (i === YOU) continue;
    const kd = cub(k01(t, ws(2) + 0.08 + rnd(i) * 0.6, 0.35)); person(x, y + 6 * kd, 1, mixC(LIGHT, DIM, kd));
  }
  // you: lit when the doubt is spoken, a «؟» above; gold once you know your numbers
  const [x, y] = crowdXY(YOU), lit = cub(k01(t, ws(5), 0.3));
  if (lit > 0) { const g = cv.createRadialGradient(x, y - 20, 0, x, y - 20, 90); g.addColorStop(0, rgba(youGold > 0.02 ? GOLD : WHITE, 0.22 * lit)); g.addColorStop(1, rgba(WHITE, 0)); cv.fillStyle = g; cv.fillRect(x - 90, y - 110, 180, 180); }
  person(x, y - 6 * cl(youGold), 1 + 0.25 * cl(youGold, 0, 1.3), youGold > 0.02 ? mixC(WHITE, GOLD, youGold * 1.4) : mixC(mixC(LIGHT, DIM, cub(k01(t, ws(2) + 0.3, 0.35))), WHITE, lit), cl(youGold));
  const kq = pop(t - ws(7) + 0.1, 14, 0.5) * (1 - cub(k01(t, ws(116) - 0.1, 0.2)));
  if (kq > 0.01) at(x, y - 100, cl(kq, 0, 1.25), cl(kq), () => { rrect(-30, -34, 60, 64, 22, WHITE); cv.beginPath(); cv.moveTo(-8, 28); cv.lineTo(0, 44); cv.lineTo(8, 28); cv.fillStyle = WHITE; cv.fill(); txt('؟', 0, 0, 44, INK); });
  if (youGold > 0.01) { at(x, y - 104, cl(youGold, 0, 1.25), cl(youGold), () => chip('تو', 0, 0, 34, INK, GOLD)); circle(x, y - 14, 58 + 6 * Math.sin(t * 5), null, rgba(GOLD, 0.6 * cl(youGold)), 3); }
  // the badge on your chest that H sits in
  const kb = cub(k01(t, ws(118), 0.3)); if (kb > 0) rrect(x - 19, y - 2, 38, 28, 7, rgba('#0B0912', kb), rgba(GOLD, 0.8 * kb), 1.5);
};

// ================= B · them and the rest =================
const B = { id: 'B', at: [540 + 1500, 960, 1], fadeAt: 8 };
const myths = (t, x, y, title, k, kn, draw) => {
  if (k <= 0) return; const fall = cub(k01(t, ws(19), 0.5));
  at(x, y + 40 * fall, lerp(0.85, 1, cl(k)), cl(k) * (1 - 0.5 * fall), () => { card(-215, -310, 430, 620, 40); txt(title, 0, -240, 46, WHITE); draw(); }, (x < CX ? -1 : 1) * 0.07 * fall);
};
B.draw = (t) => {
  const kg = pop(t - ws(9) + 0.05, 13, 0.5), kr = pop(t - ws(11) + 0.05, 13, 0.5);
  person(300, 640, 3.3, mixC(LIGHT, '#77718C', 0.6)); person(780, 640, 3.3, GOLD, 1);
  rrect(780 - 50, 640 - 16, 100, 74, 14, '#0B0912', GOLD, 3);                 // the badge: the three numbers live inside
  if (kg > 0) at(780, 830, cl(kg, 0, 1.2), cl(kg), () => chip('اونا', 0, 0, 44, INK, GOLD));
  if (kr > 0) at(300, 830, cl(kr, 0, 1.2), cl(kr), () => chip('بقیه', 0, 0, 44, WHITE, 'rgba(255,255,255,0.12)'));
  myths(t, 300, 1310, 'اندیکاتور مخفی', pop(t - ws(13) + 0.05, 13, 0.55), 0, () => {
    const m = candleChart(BR.slice(0, 26), 26, [-170, -150, 170, 120], { bw: 0.55 });
    const pts = []; for (let i = 0; i <= 40; i++) pts.push([-170 + i * 8.5, -20 + Math.sin(i * 0.55 + t * 3) * 60 + Math.sin(i * 1.7) * 20]); trace(pts, 1, VIOL, 6);
    at(0, 200, 1, 1, () => { rrect(-34, -10, 68, 54, 10, GOLD); cv.strokeStyle = GOLD; cv.lineWidth = 9; cv.beginPath(); cv.arc(0, -10, 22, Math.PI, 0); cv.stroke(); circle(0, 16, 8, INK); });
  });
  myths(t, 780, 1310, 'استراتژی جادویی', pop(t - ws(17) + 0.05, 13, 0.55), 0, () => {
    at(0, 20, 1, 1, () => { cv.save(); cv.rotate(-0.6); rrect(-12, -150, 24, 300, 12, '#2A2340'); rrect(-12, -150, 24, 60, 12, WHITE); cv.restore(); });
    for (let j = 0; j < 7; j++) { const a = j * 0.9 + t * 1.5, r = 70 + 60 * rnd(j), s = 10 + 14 * rnd(j + 3), x = Math.cos(a) * r + 70, y = Math.sin(a) * r - 80;
      cv.save(); cv.translate(x, y); cv.rotate(t * 2 + j); cv.fillStyle = j % 2 ? GOLD : VIOL; cv.beginPath(); for (let q = 0; q < 8; q++) { const rr = q % 2 ? s * 0.38 : s; cv.lineTo(Math.cos((q * Math.PI) / 4) * rr, Math.sin((q * Math.PI) / 4) * rr); } cv.fill(); cv.restore(); }
  });
  const ks = pop(t - ws(19) + 0.02, 16, 0.45);
  if (ks > 0) at(540, 1310, lerp(1.6, 1, cl(ks)), cl(ks * 2), () => { rrect(-230, -110, 460, 220, 34, 'rgba(240,67,91,0.12)', R, 10); txt('نیست', 0, 6, 150, R); }, -0.12);
};

// ================= C1–C3 · the three numbers, inside B's badge =================
const CS = 0.0118, Pw = ins(B, 800, 661, 1), GAPX = 1140 * CS;   // the nest spans −59…+19 px around Pw: inside the 100 px badge
const C2 = { id: 'C2', at: [Pw[0], Pw[1] - (1260 - 960) * CS, CS] }, C1 = { id: 'C1', at: [C2.at[0] + GAPX, C2.at[1], CS] }, C3 = { id: 'C3', at: [C2.at[0] - GAPX, C2.at[1], CS] };
const NOTE = `نمونه: یه قانون ساده روی طلای ۴ ساعته · ${fa(S.n)} معامله · ۲۰۱۵ تا ۲۰۲۶`;
function panel(t, title, t0, body) {
  card(60, 760, 960, 1000, 54); txt(title, CX, 860, 58, WHITE); txt(NOTE, CX, 1712, 28, MUT, { w: 700 });
  const kq = 1 - cub(k01(t, t0 - 0.15, 0.25)); if (kq > 0) txt('؟', CX, 1270, 520, rgba(GOLD, 0.92 * kq), { glow: rgba(GOLD, 0.4 * kq), gb: 60 });
  if (t >= t0 - 0.15) body();
}
C1.draw = (t) => panel(t, 'از هر ۱۰ معامله، چندتا برد؟', ws(36), () => {
  const n = 10, a = ws(36), b = ws(40) - 0.1, wins = S.winrate * 10;
  for (let j = 0; j < n; j++) { const x = 880 - (j % 5) * 170, y = 1080 + Math.floor(j / 5) * 180, k = pop(t - (a + (j * (b - a)) / n), 16, 0.55); if (k <= 0) { circle(x, y, 64, null, RULE, 3); continue; }
    at(x, y, cl(k, 0, 1.15), 1, () => { const f = cl(wins - j);
      if (f >= 1) { circle(0, 0, 64, G); cv.save(); cv.strokeStyle = INK; cv.lineWidth = 12; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-24, 2); cv.lineTo(-6, 20); cv.lineTo(26, -16); cv.stroke(); cv.restore(); }
      else if (f > 0) { circle(0, 0, 64, rgba(R, 0.85)); cv.beginPath(); cv.moveTo(0, 0); cv.arc(0, 0, 64, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); cv.closePath(); cv.fillStyle = G; cv.fill(); }
      else circle(0, 0, 64, rgba(R, 0.85)); }); }
  const kr = pop(t - ws(39), 12, 0.55); if (kr > 0) at(CX, 1490, cl(kr, 0, 1.2), cl(kr), () => txt(`${fa((S.winrate * 10).toFixed(1))} از ${fa(10)}`, 0, 0, 130, GOLD, { glow: rgba(GOLD, 0.45) }));
  if (kr > 0) txt(`وین‌ریت: ${fa((S.winrate * 100).toFixed(1))}٪`, CX, 1612, 44, MUT, { alpha: cl(kr) });
});
C2.draw = (t) => panel(t, 'میانگین سود به ضرر', ws(42), () => {
  const base = 1430, u = 230, kw = cub(k01(t, ws(42), 0.5)), kl = cub(k01(t, ws(44), 0.5));
  const bar = (x, v, k, col, lab, val) => { if (k <= 0) return; const h = v * u * k; rrect(x - 95, base - h, 190, h, 18, col); txt(val, x, base - h - 50, 56, col, { dir: 'ltr', alpha: cl(k * 2) }); txt(lab, x, base + 52, 40, MUT, { alpha: cl(k * 2) }); };
  line(140, base, 940, base, RULE, 3);
  bar(700, S.avgW, kw, G, 'میانگین سود', `${fa(S.avgW.toFixed(2))}R`); bar(380, S.avgL, kl, R, 'میانگین ضرر', `${fa(S.avgL.toFixed(2))}R`);
  const kr = pop(t - ws(45), 12, 0.55); if (kr > 0) at(CX, 1610, cl(kr, 0, 1.2), cl(kr), () => txt(`${fa(S.ratio.toFixed(1))} به ${fa(1)}`, 0, 0, 92, GOLD, { glow: rgba(GOLD, 0.45) }));
});
C3.draw = (t) => panel(t, 'بدترین ضررهای پشت سر هم', ws(47), () => {
  const n = S.maxL, a = ws(47), b = ws(52), per = 7;
  for (let j = 0; j < n; j++) { const x = 894 - (j % per) * 118, y = 1060 + Math.floor(j / per) * 132, k = pop(t - (a + (j * (b - a)) / n), 18, 0.55); if (k <= 0) { rrect(x - 48, y - 48, 96, 96, 18, null, RULE, 3); continue; }
    at(x, y, cl(k, 0, 1.2), 1, () => { rrect(-48, -48, 96, 96, 18, R); line(-18, -18, 18, 18, INK, 9); line(18, -18, -18, 18, INK, 9); }); }
  const kr = pop(t - b + 0.05, 12, 0.5); if (kr > 0) at(CX, 1440, cl(kr, 0, 1.2), cl(kr), () => txt(fa(n), 0, 0, 250, GOLD, { glow: rgba(GOLD, 0.5) }));
  if (kr > 0) txt(`ضرر پشت سر هم، توی ${fa(S.n)} معامله`, CX, 1600, 44, MUT, { alpha: cl(kr) });
});

// ================= D · the equity curve =================
const DX = { id: 'D', at: [C3.at[0] - GAPX * 2.05, C3.at[1], CS] };
const CB = [130, 960, 950, 1490];
const F5 = S.five, newHi = (() => { const hi = Math.max(...EQ.slice(0, F5 + 1)); for (let j = F5 + 6; j < EQ.length; j++) if (EQ[j] > hi) return j; return EQ.length - 1; })();
DX.draw = (t) => {
  card(60, 760, 960, 1000, 54);
  txt(`منحنی سرمایه · ${fa(S.n)} معامله`, CX, 830, 46, WHITE);
  txt('قانون: شکست سقف یا کف ۲۰ کندل · حد ضرر ۱٫۵ ATR · تارگت ۲R', CX, 892, 28, MUT, { w: 700 });
  for (let q = 0; q <= 4; q++) line(CB[0], lerp(CB[1], CB[3], q / 4), CB[2], lerp(CB[1], CB[3], q / 4), 'rgba(255,255,255,0.05)', 2);
  // the data in view: the trades around the streak, then (once «they knew» is said) all of them
  const kz = inOut(k01(t, T.knew + 0.1, 1.9)), j0 = lerp(F5 - 24, 0, kz), j1 = lerp(F5 + 12, EQ.length - 1, kz);
  const nEnd = t < T.knew ? F5 : Math.round(lerp(F5 + 5, EQ.length - 1, inOut(k01(t, T.knew + 0.1, 2.1))));
  const lo0 = Math.max(0, Math.floor(j0)), vis = EQ.slice(lo0, Math.min(Math.ceil(j1), Math.max(nEnd, F5 + 5)) + 1), vlo = Math.min(...vis), vhi = Math.max(...vis), pad = (vhi - vlo) * 0.12 + 0.5;
  const ex = (j) => CB[0] + ((j - j0) / (j1 - j0)) * (CB[2] - CB[0]), ey = (v) => CB[3] - ((v - vlo + pad) / (vhi - vlo + 2 * pad)) * (CB[3] - CB[1]);
  if (vlo < 0 && vhi > 0) line(CB[0], ey(0), CB[2], ey(0), 'rgba(255,255,255,0.18)', 2, [8, 10]);
  cv.save(); cv.beginPath(); cv.rect(CB[0] - 20, CB[1] - 60, CB[2] - CB[0] + 40, CB[3] - CB[1] + 100); cv.clip();
  const step = Math.max(1, Math.floor((j1 - j0) / 300)), pre = [], post = [];
  for (let j = lo0; j <= F5; j += j < F5 - 3 * step ? step : 1) pre.push([ex(j), ey(EQ[j])]);
  for (let j = F5 + 5; j <= nEnd; j += j < nEnd - step ? step : 1) post.push([ex(j), ey(EQ[j])]);
  cv.save(); cv.shadowColor = rgba(GOLD, 0.5); cv.shadowBlur = sb(16); trace(pre, 1, GOLD, 6); if (post.length > 1) trace(post, 1, GOLD, 6); cv.restore();
  const dots = cl(1 - kz * 3); if (dots > 0) pre.forEach(([x, y]) => circle(x, y, 7 * dots, GOLD));
  // the five losses, one by one
  const a5 = ws(56), b5 = ws(61);
  for (let j = 0; j < 5; j++) { const st = a5 + (j * (b5 - a5)) / 4, k = cub(k01(t, st, 0.25)); if (k <= 0) break;
    const x0 = ex(F5 + j), y0 = ey(EQ[F5 + j]), x1 = ex(F5 + j + 1), y1 = ey(EQ[F5 + j + 1]);
    line(x0, y0, lerp(x0, x1, k), lerp(y0, y1, k), R, 7); circle(x1, y1, 10 * k * (1 - kz) + 4 * kz, R);
    const kc = pop(t - st, 16, 0.5) * (1 - cub(k01(t, T.knew + 0.1, 0.4))); if (kc > 0) at(x1 + 34, y1 + 6, cl(kc, 0, 1.2), cl(kc), () => chip(fa(j + 1), 0, 0, 30, WHITE, R)); }
  cv.restore();
  const kl = pop(t - ws(62) + 0.05, 13, 0.5); if (kl > 0) at(CX, 1040, cl(kl, 0, 1.2), cl(kl) * (1 - k01(t, T.knew + 0.1, 0.35)), () => {
    rrect(-190, -42, 380, 84, 42, CARD2, GOLD, 3); at(130, -2, 0.8, 1, () => { rrect(-26, -6, 52, 40, 8, GOLD); cv.strokeStyle = GOLD; cv.lineWidth = 8; cv.beginPath(); cv.arc(0, -6, 17, Math.PI, 0); cv.stroke(); }); txt('قانون ثابت', -30, 2, 40, GOLD); });
  if (nEnd >= newHi) { const k = pop(t - (T.knew + 0.1 + 2.1 * ((newHi - F5 - 5) / (EQ.length - F5 - 6))), 12, 0.5); if (k > 0) { circle(ex(newHi), ey(EQ[newHi]), 10, GOLD); at(ex(newHi) - 90, ey(EQ[newHi]) - 44, cl(k, 0, 1.2), cl(k), () => chip('سقف جدید', 0, 0, 28, INK, GOLD)); } }
  // the gauge: five, inside the fourteen the test already showed
  const kg = cub(k01(t, ws(69), 0.4)); if (kg > 0) { cv.save(); cv.globalAlpha *= kg; const gx0 = 860, gx1 = 220, gy = 1610, gx = (v) => lerp(gx0, gx1, v / S.maxL);
    rrect(gx1, gy - 13, gx0 - gx1, 26, 13, 'rgba(255,255,255,0.08)'); rrect(gx(5), gy - 13, gx0 - gx(5), 26, 13, R);
    txt(`بدترین توی تست: ${fa(S.maxL)}`, gx1 + 10, gy - 48, 30, MUT, { align: 'left' }); at(gx(5), gy, 1, 1, () => chip(fa(5), 0, 0, 30, WHITE, R));
    txt('همون محدوده‌ای که از تست معلوم بود', CX, gy + 62, 32, GOLDL); cv.restore(); }
};

// ================= E · the wall of all trades =================
const SE = CS * 3.2, Dcard = ins(DX, 540, 1260, 1), EW = { id: 'E', at: [Dcard[0], Dcard[1] - (1300 - 960) * SE, SE], pad: 1.1, fadeAt: 30 };
EW.alpha = (t) => (t < T.first - 0.5 ? 1 - cub(k01(t, T.brand + 0.15, 0.45)) : cub(k01(t, T.first - 0.45, 0.3)));   // gone while we are inside the replay
const CELL = 33, TILE = 27, cells = [];
for (let r = 0; r < 30; r++) for (let c = 29; c >= 0; c--) { const x = 540 + (c - 14.5) * CELL, y = 1300 + (r - 14.5) * CELL; if (x > 375 && x < 705 && y > 1128 && y < 1472) continue; cells.push([x, y]); }
EW.draw = (t) => {
  const a = ws(81), b = ws(87) - 0.15, faint = cub(k01(t, T.tested - 0.3, 0.6));
  for (let j = 0; j < cells.length; j++) { const [x, y] = cells[j], st = a + (b - a) * (j / RR.length), k = j < RR.length ? cub(k01(t, st, 0.18)) : 0;
    if (j === RP.idx && t > T.brand - 0.35) continue;                       // this one has become the replay
    if (k <= 0) { rrect(x - TILE / 2, y - TILE / 2, TILE, TILE, 6, null, rgba(WHITE, 0.1 * faint), 2); continue; }
    rrect(x - TILE / 2, y - TILE / 2, TILE, TILE, 6, RR[j] > 0 ? G : rgba(R, 0.9)); }
  const kn = cub(k01(t, b - 0.1, 0.4)); if (kn > 0) txt(`${fa(S.n)} معامله · هر خونه یه معامله‌ی واقعی`, CX, 1832, 36, MUT, { alpha: kn });
  const j = RP.idx, [x, y] = cells[j], kp = cub(k01(t, T.brand - 0.9, 0.3)) * (1 - k01(t, T.brand - 0.35, 0.2)); if (kp > 0) rrect(x - TILE / 2 - 5, y - TILE / 2 - 5, TILE + 10, TILE + 10, 9, null, rgba(GOLD, kp * (0.6 + 0.4 * Math.sin(t * 12))), 3);
};

// ================= F · inside one tile: the replay =================
const tileW = ins(EW, cells[RP.idx][0], cells[RP.idx][1], 1), SF = (TILE * SE) / 985;
const FP = { id: 'F', at: [tileW[0], tileW[1] - (1270 - 960) * SF, SF], from: T.brand - 0.7 };
FP.alpha = (t) => cub(k01(t, T.brand - 0.7, 0.3));
const FB = [110, 930, 970, 1400];
FP.draw = (t) => {
  card(60, 780, 960, 980, 54, { stroke: rgba(G, 0.6 * (1 - k01(t, T.brand, 0.6))) });
  if (IMG.icon) cv.drawImage(IMG.icon, 920, 812, 64, 64); if (IMG.word) { const w = 190, h = (w * IMG.word.height) / IMG.word.width; cv.drawImage(IMG.word, 908 - w, 844 - h / 2, w, h); }
  chip('بازپخش', 270, 844, 28, WHITE, 'rgba(255,255,255,0.08)'); cv.fillStyle = GOLD; cv.beginPath(); cv.moveTo(338, 844); cv.lineTo(324, 834); cv.lineTo(324, 854); cv.fill(); txt('طلا · ۴ ساعته', 120, 844, 26, MUT, { align: 'left' });
  const lo = Math.min(...BR.map((b) => b[2]), RP.S), hi = Math.max(...BR.map((b) => b[1]), RP.TP);
  const n = t < T.future ? Math.round(lerp(10, RP.entry + 1, inOut(k01(t, T.brand + 0.3, ws(97) - T.brand - 0.3)))) : t < ws(105) ? RP.entry + 1 : Math.round(lerp(RP.entry + 1, BR.length, cub(k01(t, ws(105), 1.2))));
  for (let q = 0; q <= 4; q++) line(FB[0], lerp(FB[1], FB[3], q / 4), FB[2], lerp(FB[1], FB[3], q / 4), 'rgba(255,255,255,0.05)', 2);
  const m = candleChart(BR, n, FB, { lo, hi, N: 54 });
  if (n > RP.entry) { const x0 = m.X(RP.entry) - m.step / 2, ke = cub(k01(t, ws(97) - 0.1, 0.4));
    cv.save(); cv.globalAlpha *= ke; line(x0, m.Y(RP.TP), FB[2], m.Y(RP.TP), G, 3, [10, 8]); line(x0, m.Y(RP.S), FB[2], m.Y(RP.S), R, 3, [10, 8]); line(x0, m.Y(RP.E), FB[2], m.Y(RP.E), WHITE, 2);
    txt('حد سود', FB[2] - 8, m.Y(RP.TP) - 22, 24, G, { align: 'right', w: 800 }); txt('حد ضرر', FB[2] - 8, m.Y(RP.S) + 24, 24, R, { align: 'right', w: 800 });
    at(m.X(RP.entry), m.Y(BR[RP.entry][2]) + 40, 1, 1, () => chip('خرید', 0, 0, 24, WHITE, G)); cv.restore(); }
  // the future: covered until it is played
  const xn = m.X(n - 1) + m.step / 2; if (xn < FB[2] - 4) {
    cv.save(); cv.beginPath(); cv.rect(xn, FB[1] - 10, FB[2] - xn + 10, FB[3] - FB[1] + 20); cv.clip(); cv.fillStyle = 'rgba(11,9,18,0.94)'; cv.fillRect(xn, FB[1] - 10, FB[2] - xn + 10, FB[3] - FB[1] + 20);
    for (let k = -20; k < 40; k++) line(xn + k * 26, FB[3] + 10, xn + k * 26 + 300, FB[1] - 10, 'rgba(255,255,255,0.05)', 3); cv.restore();
    line(xn, FB[1] - 10, xn, FB[3] + 10, GOLD, 3); if (FB[2] - xn > 150) txt('آینده', (xn + FB[2]) / 2, (FB[1] + FB[3]) / 2, 44, rgba(WHITE, 0.55)); }
  if (n >= BR.length) { const k = pop(t - ws(105) - 1.1, 12, 0.5); if (k > 0) at(m.X(RP.exit), m.Y(RP.TP) - 36, cl(k, 0, 1.2), cl(k), () => chip('+۲R', 0, 0, 26, INK, G)); }
  // the costs
  [['اسپرد ۰٫۳۰', 830, ws(102)], ['کمیسیون ۷ دلار هر لات', 545, ws(104)]].forEach(([s, x, st]) => { const k = pop(t - st, 14, 0.5); if (k > 0) at(x, 1460 - 30 * (1 - cl(k)), cl(k, 0, 1.15), cl(k), () => chip(s, 0, 0, 30, WHITE, CARD2, { stroke: rgba(GOLD, 0.6), lw: 2 })); });
  // your three numbers
  [['وین‌ریت', 840], ['میانگین RR', 540], ['بیشترین ضرر پیاپی', 240]].forEach(([lab, x], j) => {
    const k = cub(k01(t, ws(106) - 0.2 + j * 0.08, 0.35)); if (k <= 0) return; cv.save(); cv.globalAlpha *= k;
    rrect(x - 135, 1530 + 20 * (1 - k), 270, 190, 30, CARD2, RULE, 2); txt(lab, x, 1580 + 20 * (1 - k), 28, MUT);
    const kv = pop(t - ws(107) - j * 0.12, 14, 0.5); txt(kv > 0.05 ? 'عدد تو' : '؟', x, 1660 + 20 * (1 - k), 46, GOLD, { glow: rgba(GOLD, 0.35) }); cv.restore(); });
};

// ================= H · inside you: the comment and the DM =================
const youW = ins(A, crowdXY(YOU)[0], crowdXY(YOU)[1] + 12, 1), SH = 26 / 930;
const HP = { id: 'H', at: [youW[0], youW[1] - (1240 - 960) * SH, SH], from: T.first };
HP.alpha = (t) => cub(k01(t, ws(118) + 0.1, 0.3));
HP.draw = (t) => {
  card(70, 780, 940, 920, 54); txt('کامنت‌ها', CX, 845, 40, WHITE); line(110, 895, 970, 895, RULE, 2);
  [[960, 0.7], [1080, 0.5]].forEach(([y, w]) => { circle(920, y, 30, '#2A2340'); rrect(870 - 520 * w, y - 26, 520 * w, 18, 9, 'rgba(255,255,255,0.12)'); rrect(870 - 360 * w, y + 8, 360 * w, 16, 8, 'rgba(255,255,255,0.07)'); });
  const typed = Math.min(3, Math.floor(cl((t - ws(124) + 0.1) / 0.36) * 3.999)), sent = pop(t - ws(125), 14, 0.5);
  if (sent > 0) at(CX, 1200, cl(sent, 0, 1.15), cl(sent), () => { rrect(-430, -60, 860, 120, 30, rgba(GOLD, 0.1), rgba(GOLD, 0.6), 2); circle(380, 0, 34, GOLD); txt('تو', 380, 2, 28, INK); txt('عدد', 300, 2, 46, GOLD, { align: 'right' }); });
  rrect(110, 1580, 860, 100, 50, '#0F0D17', rgba(GOLD, typed > 0 && sent <= 0 ? 0.7 : 0.15), 2);
  if (sent <= 0.05) { if (typed > 0) txt('عدد'.slice(0, typed), 900, 1632, 44, WHITE, { align: 'right' }); else txt('یه کامنت بنویس…', 900, 1632, 34, DIM, { align: 'right' });
    if (Math.floor(t * 3) % 2 === 0) rrect(typed > 0 ? 900 - measure('عدد'.slice(0, typed), 44) - 14 : 902, 1608, 4, 48, 2, GOLD); }
  const kp = pop(t - ws(125) + 0.12, 18, 0.45); at(175, 1630, 1 + 0.15 * Math.sin(Math.PI * cl(kp)) * (kp < 1 ? 1 : 0), 1, () => { circle(0, 0, 38, typed > 0 ? GOLD : '#2A2340'); cv.fillStyle = INK; cv.beginPath(); cv.moveTo(14, 0); cv.lineTo(-12, -16); cv.lineTo(-6, 0); cv.lineTo(-12, 16); cv.closePath(); cv.fill(); });
  // the DM
  const kd = pop(t - ws(128) + 0.1, 12, 0.6); if (kd > 0) at(CX, 1390 + 60 * (1 - cl(kd)), lerp(0.9, 1, cl(kd)), cl(kd), () => {
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.6)'; cv.shadowBlur = sb(50); rrect(-400, -150, 800, 300, 40, '#1E1836'); cv.restore(); rrect(-400, -150, 800, 300, 40, null, rgba(VIOL, 0.5), 2);
    if (IMG.icon) cv.drawImage(IMG.icon, 300, -126, 72, 72); txt('دایرکت', 270, -90, 34, WHITE, { align: 'right' }); txt('همین الان', -360, -90, 26, MUT, { align: 'left' });
    rrect(-370, -30, 740, 150, 30, VIO); txt('اینم لینک شروع رایگان:', 330, 12, 34, WHITE, { align: 'right' });
    rrect(-340, 44, 680, 56, 28, 'rgba(255,255,255,0.16)'); if (IMG.word) { const w = 170, h = (w * IMG.word.height) / IMG.word.width; cv.drawImage(IMG.word, 80, 72 - h / 2, w, h); } txt('باز کن', -300, 74, 28, WHITE, { align: 'left' });
  });
};
// ================= I · the end card =================
const IP = { id: 'I', at: [HP.at[0] - 1200 * SH, HP.at[1], SH], from: T.cta };
IP.draw = (t) => {
  const t0 = T.end, ki = pop(t - t0 + 0.05, 12, 0.6); if (ki > 0 && IMG.icon) at(CX, 760, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = sb(70); cv.drawImage(IMG.icon, -150, -150, 300, 300); });
  const kw = cub(k01(t, t0 + 0.2, 0.35)); if (kw > 0 && IMG.word) { const w = 580, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, CX - w / 2, 960 + (1 - kw) * 24, w, h); cv.restore(); }
  const kc = pop(t - t0 - 0.45, 13, 0.55); if (kc > 0) at(CX, 1250, cl(kc, 0, 1.2), cl(kc), () => chip('کامنت کن: «عدد»', 0, 0, 66, INK, GOLD));
  const ks = cub(k01(t, t0 + 0.8, 0.4)); if (ks > 0) txt('لینک شروع رایگان رو دایرکت می‌گیری', CX, 1400, 40, MUT, { alpha: ks });
};

// ================= the take =================
const L = (y, size, toks, o = {}) => ({ y, size, toks, ...o });
world({
  plates: [A, B, C1, C2, C3, DX, EW, FP, HP, IP],
  shots: [
    { k: 'hook', cam: A.at, tone: GOLD, push: 0.05, groups: [
      { at: 0, lines: [L(330, 112, [['میخوای', 0], ['جزو', 1]]), L(540, 250, [['۵ درصد', [2, 3], { gold: true }]]), L(745, 112, [['باشی،', 4]])] },
      { at: 5, lines: [L(420, 124, [['ولی', 5], ['نمی‌دونی', 6]]), L(600, 170, [['چطوری؟', 7, { gold: true }]])] }] },
    { k: 'myths', cam: B.at, tone: VIO, md: 0.85, groups: [{ at: 8, lines: [L(320, 108, [['فرق', 8], ['اونا', 9, { gold: true }], ['با', 10], ['بقیه،', 11]])] }] },
    { k: 'know', cam: frame(C2, 540, 1160, 3.4), tone: GOLD, md: 1.05, roll: 0.05, push: 0.03, groups: [
      { at: 20, lines: [L(330, 100, [['فرقشون', 20], ['اینه', 21], ['که', 22]]), L(470, 92, [['قبل', 23], ['از', 24], ['اینکه', [25, 26]], ['پول', 27], ['واقعی', 28], ['بذارن،', 29]])] },
      { at: 30, lines: [L(360, 104, [['عددهای', 30], ['استراتژیشون', 31], ['رو', 32]]), L(520, 140, [['می‌دونن.', 33, { gold: true, u: true }]])] }] },
    { k: 'n1', cam: C1.at, tone: G, md: 0.62, groups: [{ at: 34, lines: [L(340, 100, [['از', 34], ['هر', 35], ['ده', 36], ['تا', 37], ['معامله،', 38]]), L(500, 116, [['چندتاش‌رو', 39], ['می‌برن؛', 40, { gold: true }]])] }] },
    { k: 'n2', cam: C2.at, tone: G, md: 0.55, groups: [{ at: 41, lines: [L(340, 110, [['میانگین', 41], ['سود', 42, { c: G }]]), L(500, 110, [['به', 43], ['ضررشون', 44, { c: R }], ['چنده؛', 45, { gold: true }]])] }] },
    { k: 'n3', cam: C3.at, tone: R, md: 0.55, groups: [{ at: 46, lines: [L(340, 104, [['و', 46], ['بدترین', 47], ['ضررهای', 48, { c: R }]]), L(500, 104, [['پشت', 49], ['سر', 50], ['همشون', 51], ['چندتاست.', 52, { gold: true }]])] }] },
    { k: 'five', cam: DX.at, tone: R, md: 0.85, push: 0.04, groups: [
      { at: 53, lines: [L(320, 100, [['برای', 53], ['همین،', 54], ['وقتی', 55]]), L(470, 108, [['پنج', 56, { c: R }], ['تا', 57, { c: R }], ['ضرر', 58, { c: R }], ['پشت', 59], ['هم', 60], ['می‌خورن،', 61]])] },
      { at: 62, lines: [L(330, 112, [['قانونشون', 62], ['رو', 63]]), L(490, 132, [['عوض', 64, { gold: true }], ['نمی‌کنن؛', [65, 66], { gold: true }]])] }] },
    { k: 'knew', cam: frame(DX, 540, 990, 1.07), tone: GOLD, md: 0.6, push: 0.02, groups: [{ at: 67, lines: [L(320, 104, [['چون', 67], ['از', 68], ['قبل', 69]]), L(470, 132, [['می‌دونستن', 70, { gold: true, u: true }]]), L(620, 100, [['این', 71], ['اتفاق', 72], ['می‌افته.', 73]])] }] },
    { k: 'tested', cam: EW.at, tone: G, md: 0.85, groups: [
      { at: 74, lines: [L(340, 110, [['این', 74], ['عددها', 75]]), L(500, 110, [['از', 76], ['حس', 77, { c: MUT }], ['و', 78, { c: MUT }], ['حال', 79, { c: MUT }], ['نمیاد؛', 80]])] },
      { at: 81, lines: [L(340, 120, [['از', 81], ['صدها', [82, 83], { gold: true }]]), L(510, 104, [['معامله‌ی', 84], ['تست‌شده', [85, 86], { gold: true, u: true }], ['میاد.', 87]])] }] },
    { k: 'brand', cam: FP.at, tone: VIO, md: 1.15, roll: -0.05, ease: (x) => inOut(x), groups: [{ at: 88, lines: [L(320, 104, [['بک‌تست‌لب', [88, 90], { c: VIOL }], ['یعنی', 91]]), L(470, 110, [['صدها', [92, 93], { gold: true }], ['معامله', 94]]), L(615, 96, [['روی', 95], ['داده‌ی', 96], ['واقعی،', 97]])] }] },
    { k: 'future', cam: frame(FP, 640, 1150, 0.64), tone: GOLD, md: 0.6, scrimB: 1380, groups: [{ at: 98, lines: [L(1560, 108, [['بدون', 98], ['دیدن', 99], ['آینده', 100, { gold: true }]]), L(1710, 96, [['و', 101], ['با', 102], ['هزینه‌های', [103, 104]], ['واقعی،', 105, { gold: true }]])] }] },
    { k: 'yours', cam: frame(FP, 540, 940, 0.93), tone: GOLD, md: 0.6, groups: [{ at: 106, lines: [L(330, 90, [['تا', 106], ['عددهای', 107], ['خودت', 108, { gold: true }], ['رو', 109], ['داشته', 110], ['باشی،', 111]]), L(490, 130, [['نه', 112], ['حدس.', 113, { c: R }]])] }] },
    { k: 'first', cam: A.at, tone: GOLD, md: 1.4, push: 0.03, groups: [{ at: 114, lines: [L(330, 112, [['اول', 114], ['عددهاتو', 115], ['بشناس،', 116, { gold: true, u: true }]]), L(500, 112, [['بعد', 117], ['پول', 118], ['بذار.', 119]])] }] },
    { k: 'cta', cam: HP.at, tone: VIO, md: 1.0, roll: 0.04, groups: [
      { at: 120, lines: [L(320, 108, [['زیر', 120], ['همین', 121], ['ویدیو', 122]]), L(490, 124, [['بنویس', 123], ['«عدد»', 124, { hl: GOLD }]])] },
      { at: 125, lines: [L(320, 108, [['تا', 125], ['لینکش‌رو', 126]]), L(480, 108, [['برات', 127], ['دایرکت', 128, { gold: true }], ['کنم.', 129]])] }] },
    { k: 'end', cam: IP.at, tone: VIO, md: 0.7, groups: [] },
  ],
  shakes: [[ws(19), 10], [ws(52) + 0.1, 6]],
  cover: () => {
    cv.fillStyle = BG; cv.fillRect(0, 0, W, H);
    const g = cv.createRadialGradient(CX, 1250, 0, CX, 1250, 1000); g.addColorStop(0, rgba(GOLD, 0.2)); g.addColorStop(1, rgba(GOLD, 0)); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
    cv.save(); cv.translate(0, 120); A.draw(ws(4) + 0.6); cv.restore();
    txt('میخوای جزو', CX, 330, 112, WHITE); txt('۵ درصد', CX, 545, 250, GOLD, { glow: rgba(GOLD, 0.55), gb: 50 }); txt('باشی؟', CX, 760, 112, WHITE);
    finish(0);
  },
});
