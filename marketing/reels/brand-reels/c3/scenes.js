// «از امروز»: launch-day reel. Go back to any day of the market, without seeing the future.
const OH = DATA.ohlc, CR = DATA.crash;
const SUB_ON = [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0].map(Boolean);
const LABEL = 'از امروز · لانچ';
const SH = 1992 / 1170; // screenshot aspect

// ---- device frames with the real screenshots ----
function phone(cx, top, w, img, sx, sy, sw, o = {}) {
  const h = w * SH, x = cx - w / 2; cv.save(); cv.globalAlpha *= o.alpha ?? 1;
  cv.shadowColor = rgba(C.accent, 0.35); cv.shadowBlur = 80; rr(x - 16, top - 16, w + 32, h + 32, 70); cv.fillStyle = '#05040a'; cv.fill(); cv.shadowBlur = 0;
  cv.lineWidth = 3; cv.strokeStyle = C.line; cv.stroke();
  cv.save(); rr(x, top, w, h, 54); cv.clip(); cv.fillStyle = C.bg; cv.fillRect(x, top, w, h);
  if (img) { const k = w / sw; cv.drawImage(img, sx, sy, sw, h / k, x, top, w, h); }
  cv.restore(); cv.restore();
  return { X: (px) => x + (px - sx) * (w / sw), Y: (py) => top + (py - sy) * (w / sw), k: w / sw, x, top, w, h };
}
function ring(x, y, w, h, col, k, label, lp = 'below') {
  if (k <= 0) return; cv.save(); cv.globalAlpha *= clamp(k); const g = 1 + 0.12 * (1 - E.out(clamp(k)));
  cv.translate(x + w / 2, y + h / 2); cv.scale(g, g); cv.shadowColor = col; cv.shadowBlur = 24; rr(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 18); cv.lineWidth = 5; cv.strokeStyle = col; cv.stroke(); cv.restore();
  if (label && lp === 'left') { cv.save(); cv.globalAlpha *= clamp(k); cv.strokeStyle = col; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(215, y + h / 2); cv.lineTo(x - 8, y + h / 2); cv.stroke(); cv.restore(); tag(140, y + h / 2, label, col, { size: 34, dir: 'rtl', alpha: clamp(k) }); }
  else if (label) { const ly = lp === 'below' ? y + h + 50 : y - 46; tag(x + w / 2, ly, label, col, { size: 32, dir: 'rtl', alpha: clamp(k) }); }
}
function tvChart(r, n0, n1, span, o = {}) {
  // the brand chart: real BTC daily candles, the app's colours
  cv.save(); cv.globalAlpha *= o.alpha ?? 1; card(r.x - 40, r.y - 70, r.w + 80, r.h + 130);
  txt('BTCUSD · 1D · BacktestLab', r.x + r.w, r.y - 30, { size: 26, color: C.muted, weight: 500, dir: 'ltr', align: 'right' });
  cv.strokeStyle = rgba(C.line, 0.7); cv.lineWidth = 1.5; for (let i = 1; i < 4; i++) { const y = r.y + (i * r.h) / 4; cv.beginPath(); cv.moveTo(r.x, y); cv.lineTo(r.x + r.w, y); cv.stroke(); }
  const c = candles(r, OH, n0, n1, { span, lo: 3600, hi: 10800 });
  cv.restore(); return c;
}
function frosted(x, y, w, h, k) {
  if (w <= 2 || k <= 0) return; cv.save(); cv.globalAlpha *= k; rr(x, y, w, h, 20); cv.fillStyle = rgba(C.raised, 0.92); cv.fill(); cv.strokeStyle = rgba(C.accentInk, 0.4); cv.lineWidth = 2; cv.stroke();
  cv.clip(); for (let i = -10; i < 30; i++) { cv.strokeStyle = rgba(C.accent, 0.08); cv.lineWidth = 14; cv.beginPath(); cv.moveTo(x + i * 40, y); cv.lineTo(x + i * 40 - 300, y + h); cv.stroke(); } cv.restore();
}
function lockIcon(x, y, s, col) { cv.save(); cv.strokeStyle = col; cv.lineWidth = s * 0.16; cv.beginPath(); cv.arc(x, y - s * 0.25, s * 0.32, Math.PI, 0); cv.stroke(); rr(x - s * 0.5, y - s * 0.25, s, s * 0.78, s * 0.14); cv.fillStyle = col; cv.fill(); cv.restore(); }
function playBar(cx, y, k, prog) {
  if (k <= 0) return; cv.save(); cv.globalAlpha *= k; rr(cx - 360, y - 60, 720, 120, 60); cv.fillStyle = rgba(C.surface, 0.95); cv.fill(); cv.strokeStyle = C.line; cv.lineWidth = 2; cv.stroke();
  rr(cx + 200, y - 44, 130, 88, 30); const g = cv.createLinearGradient(cx + 200, 0, cx + 330, 0); g.addColorStop(0, C.grad0); g.addColorStop(1, C.grad1); cv.fillStyle = g; cv.fill();
  cv.fillStyle = '#fff'; cv.beginPath(); cv.moveTo(cx + 252, y - 20); cv.lineTo(cx + 252, y + 20); cv.lineTo(cx + 284, y); cv.closePath(); cv.fill();
  rr(cx - 300, y - 16, 460, 12, 6); cv.fillStyle = C.raised; cv.fill(); rr(cx - 300, y - 16, 460 * prog, 12, 6); cv.fillStyle = C.accent; cv.fill();
  cv.fillStyle = '#fff'; cv.beginPath(); cv.arc(cx - 300 + 460 * prog, y - 10, 16, 0, 7); cv.fill();
  txt('سرعت: تا ۲۰ کندل در ثانیه', cx - 70, y + 30, { size: 24, color: C.muted, weight: 500 }); cv.restore();
}

// ---- A · rewind (the cover) ----
function shamsiYear(i) { const d = new Date(Date.UTC(2018, 0, 1) + i * 864e5), y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate(); return m > 2 || (m === 2 && day >= 21) ? y - 621 : y - 622; }
function rewind(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['از امروز…', 80, C.ink], [[['می‌تونی', C.ink], ['برگردی', C.ink], ['به', C.ink]], 80], ['گذشته.', 140, C.lilac]], t, -1, S(1) + 0.1, { y: 400, gap: 128, instant: true, hold: true, glowAll: rgba(C.accent, 0.8) });
  const r = { x: 110, y: 900, w: 860, h: 380 }; card(70, 840, 940, 520);
  const bt = DATA.btc, n = bt.length, k = E.inOut(P(t, 0.4, S(1) + LN[1] * 0.4 - 0.4)), ph = Math.round(lerp(n - 1, 0, k));
  const s = series(r, bt, { lo: 3000, hi: 130000, log: true, color: rgba(C.ink, 0.25), lw: 3 });
  series(r, bt, { lo: 3000, hi: 130000, log: true, upto: ph + 1, color: C.accent, fill: C.accent, lw: 5, glow: true });
  const x = s.X(ph); frosted(x + 10, r.y - 20, r.x + r.w + 20 - x - 10, r.h + 40, k);
  cv.strokeStyle = C.lilac; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(x, r.y - 30); cv.lineTo(x, r.y + r.h + 30); cv.stroke();
  tag(x, r.y + r.h + 10, fy(shamsiYear(ph * DATA.btcStep)), C.accent, { size: 40, dir: 'rtl' });
  // rewind glyph
  cv.save(); cv.translate(x, r.y - 70); cv.fillStyle = C.lilac; [0, 1].forEach((j) => { cv.beginPath(); cv.moveTo(-j * 30 + 14, -18); cv.lineTo(-j * 30 + 14, 18); cv.lineTo(-j * 30 - 14, 0); cv.closePath(); cv.fill(); }); cv.restore();
  cv.restore();
}

// ---- B · every market ----
function markets(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['به هر روزی از بازار', 76, C.ink]], t, S(1), S(2) + 0.2, { y: 440, hold: true });
  const items = [['فارکس', 'EURUSD · GBPJPY', C.sky, 0.25], ['طلا', 'XAUUSD', C.amber, 0.45], ['شاخص‌ها', 'NAS100 · GER40', C.pink, 0.62], ['کریپتو', 'BTCUSD · ETHUSD', C.gain, 0.8]];
  items.forEach(([name, tick, col, f], i) => { const k = E.back(P(t, S(1) + LN[1] * f, 0.45)); if (k <= 0) return; const cx = i % 2 ? 300 : 780, cy = 680 + Math.floor(i / 2) * 330;
    cv.save(); cv.translate(cx, cy); cv.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k); cv.globalAlpha *= clamp(k); card(-220, -130, 440, 260, { glow: rgba(col, 0.3) });
    cv.fillStyle = rgba(col, 0.18); rr(110, -95, 80, 80, 22); cv.fill(); cv.fillStyle = col; cv.beginPath(); cv.arc(150, -55, 14, 0, 7); cv.fill();
    txt(name, 190, 50, { size: 64, font: 'Rdx', weight: 700, color: C.ink, align: 'right' }); txt(tick, -190, -55, { size: 28, color: C.muted, weight: 600, dir: 'ltr', align: 'left' }); cv.restore(); });
  const d = E.out(P(t, S(1) + LN[1] * 0.85, 0.5)); if (d > 0) pill(540, 1400, 'داده‌ی تاریخی از ۲۰۱۵ · تایم‌فریم ۱ ثانیه تا روزانه', { size: 32, color: C.ink, alpha: d });
  cv.restore();
}

// ---- C · the future stays hidden; candle by candle ----
const TR = { x: 120, y: 670, w: 840, h: 600 }, SPAN = OH.length;
function replay(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const shown = t < S(3) ? CR : Math.min(OH.length, CR + Math.floor(E.inOut(P(t, S(3) + 0.3, LN[3] - 0.4)) * (OH.length - CR)));
  const c = tvChart(TR, 0, shown, SPAN);
  const fx = TR.x + (shown / SPAN) * TR.w; frosted(fx + 4, TR.y - 10, TR.x + TR.w - fx + 10, TR.h + 20, 1);
  if (TR.x + TR.w - fx > 160) { lockIcon((fx + TR.x + TR.w) / 2, TR.y + TR.h / 2 - 30, 70, C.lilac); txt('آینده', (fx + TR.x + TR.w) / 2, TR.y + TR.h / 2 + 70, { size: 44, font: 'Rdx', weight: 700, color: C.ink }); }
  cv.strokeStyle = C.lilac; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(fx, TR.y - 20); cv.lineTo(fx, TR.y + TR.h + 20); cv.stroke();
  headline([['ولی یه قانون داره:', 50, C.muted, 600], [[['آینده', C.lilac], ['رو', C.ink], ['نمی‌بینی.', C.ink]], 92]], t, S(2), S(3) + 0.2, { y: 400, gap: 105, stagger: LN[2] * 0.4, hold: true, glow: rgba(C.accent, 0.7) });
  if (t > S(3) + 0.2) { const h2 = E.out(P(t, S(3) + 0.2, 0.4)); txt('کندل به کندل جلو برو', 540, 470, { size: 80, font: 'Rdx', weight: 700, color: C.ink, alpha: h2 }); }
  playBar(540, 1420, E.out(P(t, S(3), 0.4)), shown / OH.length);
  if (shown > CR) { const k = P(t, S(3) + 0.3 + (LN[3] - 0.4) * 0.05, 0.3); tag(c.X(CR) + 40, c.Y(OH[CR][2]) + 40, '−۳۹٫۵٪', C.loss, { size: 30, alpha: k, align: 'left' }); }
  cv.restore();
}

// ---- D · the real app: order, risk, lot; the calendar ----
function app(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const im = IMG.replay; let sx = 100, sy = 560, sw = 1070;
  // pan: chart → bottom panel → top buttons
  const p2 = E.inOut(P(t, S(5), 0.8));
  sx = lerp(300, 0, p2); sy = lerp(511, 150, p2); sw = lerp(870, 1170, p2);
  const f = phone(540, 420, 580, im, sx, sy, sw);
  const hl = (x0, y0, x1, y1, col, at, label) => ring(f.X(x0), f.Y(y0), (x1 - x0) * f.k, (y1 - y0) * f.k, col, win(t, at, S(5), 0.25, 0.2), label, 'left');
  if (t < S(5)) {
    hl(490, 1152, 960, 1220, C.accent, S(4) + LN[4] * 0.02, 'ورود');
    hl(300, 1236, 980, 1268, C.loss, S(4) + LN[4] * 0.14, 'حد ضرر');
    hl(725, 686, 962, 748, C.gain, S(4) + LN[4] * 0.26, 'حد سود');
    const kk = win(t, S(4) + LN[4] * 0.55, S(5), 0.25, 0.2);
    ring(f.X(300), f.Y(1785), 370 * f.k, 98 * f.k, C.lilac, kk, null); ring(f.X(860), f.Y(1905), 280 * f.k, 60 * f.k, C.lilac, P(t, S(4) + LN[4] * 0.7, 0.25) * kk, null);
    if (kk > 0) pill(540, 1515, 'ریسک ۱٪ ← حجم خودکار', { size: 36, color: C.ink, dot: C.lilac, alpha: kk });
  } else {
    ring(f.X(330), f.Y(335), 382 * f.k, 104 * f.k, C.amber, P(t, S(5) + 0.6, 0.3), 'تقویم اقتصادی');
    // the event card
    const ek = E.back(P(t, S(5) + LN[5] * 0.3, 0.45)); if (ek > 0) { cv.save(); cv.translate(540, 1080); cv.scale(0.85 + 0.15 * ek, 0.85 + 0.15 * ek); cv.globalAlpha *= clamp(ek);
      card(-430, -170, 860, 340, { border: rgba(C.amber, 0.7), glow: rgba(C.amber, 0.25) });
      txt('۱۷:۰۰', 380, -110, { size: 34, color: C.muted, weight: 600, align: 'right' }); txt('USD', 260, -110, { size: 30, color: C.ink, weight: 700, dir: 'ltr', align: 'right' });
      [0, 1, 2].forEach((j) => { cv.fillStyle = C.loss; rr(160 - j * 26, -128, 18, 36, 5); cv.fill(); });
      txt('خبر پراهمیت آمریکا', -40, -110, { size: 34, color: C.ink, weight: 700, align: 'right' });
      [['پیش‌بینی', '…', 260], ['قبلی', '…', 0], ['واقعی', null, -260]].forEach(([h, v, x]) => { txt(h, x, -10, { size: 30, color: C.muted, weight: 600 });
        if (v) txt(v, x, 70, { size: 44, color: C.ink, weight: 700 }); else { const open = P(t, S(5) + LN[5] * 0.85, 0.3); if (open < 1) lockIcon(x, 74, 46, C.amber); if (open > 0) txt('منتشر شد', x, 70, { size: 34, color: C.gain, weight: 700, alpha: open }); } });
      txt('عدد واقعی تا لحظه‌ی انتشار مخفیه', 0, 140, { size: 30, color: C.amber, weight: 600 }); cv.restore(); }
  }
  txt('تصویر واقعی برنامه · داده‌ی نمونه', 540, 382, { size: 26, color: C.faint, weight: 500 });
  cv.restore();
}
function shots(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const jo = t < S(7) - 0.2; const im = jo ? IMG.journal : IMG.analytics;
  const sy = jo ? lerp(150, 1900, E.inOut(P(t, S(6) + 0.4, LN[6] + 0.2))) : lerp(1750, 6100, E.inOut(P(t, S(7) + 0.3, LN[7] + 0.1)));
  phone(540, 420, 580, im, 0, sy, 1170);
  txt(jo ? 'ژورنال معاملات' : 'آنالیز', 540, 375, { size: 44, font: 'Rdx', weight: 700, color: C.ink });
  cv.restore();
}

// ---- E · practice, the reveal, free, devices, the call ----
function practice(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a; const k = E.out(P(t, S(8), LN[8]));
  const n = Math.floor(320 * k), r = rng(7);
  for (let i = 0; i < 320; i++) { const win_ = r() < 0.46, x = 120 + (i % 20) * 42, y = 560 + Math.floor(i / 20) * 42; cv.fillStyle = i < n ? (win_ ? C.gain : C.loss) : rgba(C.line, 0.6); rr(x, y, 34, 34, 8); cv.fill(); }
  txt(fa(n), 540, 1330, { size: 130, font: 'Rdx', weight: 700, color: C.ink }); txt('معامله تمرینی', 540, 1440, { size: 44, weight: 600, color: C.muted });
  const z = E.back(P(t, S(8) + LN[8] * 0.55, 0.45)); if (z > 0) { cv.save(); cv.translate(540, 440); cv.scale(z, z); pill(0, 0, 'ریسک پول واقعی: ۰ ریال', { size: 42, color: C.ink, dot: C.gain, weight: 700 }); cv.restore(); }
  cv.restore();
}
function brand(t, a) {
  if (a <= 0) return; const ic = E.back(P(t, S(9), 0.6)), lg = E.out(P(t, S(9) + 0.5, 0.6)), open = E.back(P(t, S(9) + LN[9] * 0.55, 0.5));
  cv.save(); cv.globalAlpha = a; glow(540, 820, 800, 700, C.accent, 0.4);
  // light rays
  cv.save(); cv.translate(540, 700); cv.rotate(t * 0.15); for (let i = 0; i < 12; i++) { cv.rotate(Math.PI / 6); const g = cv.createLinearGradient(0, 0, 0, -900); g.addColorStop(0, rgba(C.lilac, 0.16 * lg)); g.addColorStop(1, rgba(C.lilac, 0)); cv.fillStyle = g; cv.beginPath(); cv.moveTo(-30, 0); cv.lineTo(30, 0); cv.lineTo(120, -900); cv.lineTo(-120, -900); cv.closePath(); cv.fill(); } cv.restore();
  if (IMG.icon && ic > 0) { const s = 300 * ic; cv.save(); cv.shadowColor = C.accent; cv.shadowBlur = 80; cv.drawImage(IMG.icon, 540 - s / 2, 640 - s / 2, s, s); cv.restore(); }
  if (IMG.logo && lg > 0) { const w = 620, h = (w * IMG.logo.height) / IMG.logo.width; cv.save(); cv.globalAlpha *= lg; cv.drawImage(IMG.logo, 540 - w / 2, 920 - h / 2 + (1 - lg) * 30, w, h); cv.restore(); }
  if (open > 0) { cv.save(); cv.translate(540, 1110); cv.scale(open, open); txt('از امروز، بازه.', 0, 0, { size: 96, font: 'Rdx', weight: 700, color: C.lilac, glow: rgba(C.accent, 0.9) }); cv.restore(); }
  // confetti in brand colours
  if (open > 0) { const r = rng(11); for (let i = 0; i < 70; i++) { const ang = r() * Math.PI * 2, sp = 300 + r() * 700, tt = t - (S(9) + LN[9] * 0.55); if (tt < 0) break; const x = 540 + Math.cos(ang) * sp * Math.min(tt, 1.2), y = 1000 + Math.sin(ang) * sp * Math.min(tt, 1.2) + 260 * tt * tt;
    cv.save(); cv.globalAlpha *= clamp(1 - tt / 3); cv.translate(x, y); cv.rotate(tt * 5 + i); cv.fillStyle = [C.lilac, C.accent, C.gain, C.pink, C.ink][i % 5]; cv.fillRect(-7, -4, 14, 8); cv.restore(); } }
  cv.restore();
}
function free(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['شروعش', C.ink], ['رایگانه.', C.gain]], 104]], t, S(10), S(11) + 0.05, { y: 500, hold: true, glow: rgba(C.gain, 0.5) });
  const c = E.out(P(t, S(10) + LN[10] * 0.45, 0.4)); if (c > 0) { cv.save(); cv.globalAlpha *= c; card(160, 680, 760, 220, { r: 30 });
    txt('شماره موبایل', 860, 735, { size: 32, color: C.muted, weight: 600, align: 'right' });
    rr(200, 770, 680, 96, 22); cv.fillStyle = C.bg; cv.fill(); cv.strokeStyle = C.accent; cv.lineWidth = 3; cv.stroke();
    const typed = '۰۹۱۲ ••• ••••'.slice(0, Math.floor(P(t, S(10) + LN[10] * 0.5, 0.9) * 13)); txt(typed, 240, 820, { size: 48, color: C.ink, weight: 600, dir: 'ltr', align: 'left' }); cv.restore(); }
  const b = E.back(P(t, S(10) + LN[10] * 0.75, 0.45)); if (b > 0) button(540, 1020, 'شروع رایگان', { size: 48, scale: b });
  txt('بدون ایمیل، بدون رمز عبور', 540, 1150, { size: 36, color: C.muted, weight: 500, alpha: E.out(P(t, S(10) + LN[10] * 0.85, 0.4)) });
  cv.restore();
}
function devices(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a; const im = IMG.dash;
  const dev = (x, y, w, h, r, at, label) => { const k = E.back(P(t, at, 0.45)); if (k <= 0) return; cv.save(); cv.translate(x + w / 2, y + h / 2); cv.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k); cv.globalAlpha *= clamp(k);
    rr(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24, r + 10); cv.fillStyle = '#05040a'; cv.fill(); cv.strokeStyle = C.line; cv.lineWidth = 3; cv.stroke();
    cv.save(); rr(-w / 2, -h / 2, w, h, r); cv.clip(); if (im) { const s = w / 1170; cv.drawImage(im, 0, 0, 1170, h / s, -w / 2, -h / 2, w, h); } cv.restore();
    txt(label, 0, h / 2 + 60, { size: 36, weight: 700, color: C.ink }); cv.restore(); };
  dev(640, 560, 300, 520, 40, S(11), 'گوشی');
  dev(120, 640, 430, 440, 26, S(11) + LN[11] * 0.35, 'تبلت');
  // the laptop
  const lk = E.back(P(t, S(11) + LN[11] * 0.7, 0.45)); if (lk > 0) { cv.save(); cv.translate(540, 1300); cv.scale(0.85 + 0.15 * lk, 0.85 + 0.15 * lk); cv.globalAlpha *= clamp(lk);
    rr(-330, -150, 660, 300, 18); cv.fillStyle = '#05040a'; cv.fill(); cv.strokeStyle = C.line; cv.lineWidth = 3; cv.stroke();
    cv.save(); rr(-312, -134, 624, 268, 10); cv.clip(); if (IMG.replay) cv.drawImage(IMG.replay, 0, 560, 1170, 1170 * 268 / 624, -312, -134, 624, 268); cv.restore();
    rr(-400, 150, 800, 26, 10); cv.fillStyle = C.raised; cv.fill(); txt('کامپیوتر', 0, 230, { size: 36, weight: 700, color: C.ink }); cv.restore(); }
  cv.restore();
}
function call(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const up = Math.sin(t * 6) * 12; cv.save(); cv.translate(540, 470 + up); cv.fillStyle = C.lilac; cv.beginPath(); cv.moveTo(0, -60); cv.lineTo(44, -10); cv.lineTo(16, -10); cv.lineTo(16, 50); cv.lineTo(-16, 50); cv.lineTo(-16, -10); cv.lineTo(-44, -10); cv.closePath(); cv.shadowColor = C.accent; cv.shadowBlur = 30; cv.fill(); cv.restore();
  headline([[[['لینک', C.ink], ['توی', C.ink], ['بیوئه', C.lilac]], 104]], t, S(12), DUR + 1, { y: 640, hold: true, glow: rgba(C.accent, 0.7) });
  const q = E.out(P(t, S(12) + LN[12] * 0.3, 0.5)); if (q > 0) { cv.save(); cv.globalAlpha *= q; card(110, 800, 860, 300, { r: 32, border: rgba(C.accent, 0.6), glow: rgba(C.accent, 0.25) });
    txt('اولین روزی که می‌خوای', 540, 890, { size: 54, font: 'Rdx', weight: 700, color: C.ink }); txt('بهش برگردی کدومه؟', 540, 980, { size: 54, font: 'Rdx', weight: 700, color: C.lilac }); cv.restore(); }
  const b = E.back(P(t, S(12) + LN[12] * 0.75, 0.45)); if (b > 0) button(540, 1220, 'کامنت کن', { size: 46, scale: b });
  if (IMG.logo) { const w = 360, h = (w * IMG.logo.height) / IMG.logo.width, e = E.out(P(t, S(12) + 1, 0.6)); cv.save(); cv.globalAlpha *= e; cv.drawImage(IMG.logo, 540 - w / 2, 1400 - h / 2, w, h); cv.restore(); }
  cv.restore();
}

function render(t) {
  background(t, { happy: 0.6 * win(t, S(9), S(11), 0.4, 0.4) });
  rewind(t, 1 - E.in(P(t, S(1) - 0.2, 0.3)));
  markets(t, win(t, S(1) - 0.1, S(2) + 0.05, 0.3, 0.3));
  replay(t, win(t, S(2) - 0.05, S(4) + 0.05, 0.3, 0.3));
  app(t, win(t, S(4) - 0.05, S(6) + 0.05, 0.3, 0.3));
  shots(t, win(t, S(6) - 0.05, S(8) + 0.05, 0.3, 0.3));
  practice(t, win(t, S(8) - 0.05, S(9) + 0.05, 0.3, 0.3));
  brand(t, win(t, S(9) - 0.05, S(10) + 0.05, 0.3, 0.3));
  free(t, win(t, S(10) - 0.05, S(11) + 0.05, 0.3, 0.3));
  devices(t, win(t, S(11) - 0.05, S(12) + 0.05, 0.3, 0.3));
  call(t, E.out(P(t, S(12) - 0.05, 0.3)));
  chrome(t, LABEL, { alpha: 1 - win(t, S(9) - 0.1, S(10), 0.3, 0.3), dot: C.gain });
  subs(t, SUB_ON);
  cutFx(t, [S(1) - 0.1, S(2) - 0.05, S(4) - 0.05, S(6) - 0.05, S(7) - 0.2, S(8) - 0.05, S(10) - 0.05, S(11) - 0.05, S(12) - 0.05]);
  { const k = 1 - Math.abs(t - S(9)) / 0.3; if (k > 0) { cv.fillStyle = rgba(C.lilac, 0.3 * k); cv.fillRect(0, 0, W, H); } }
  finish(t);
}
boot(render, [loadImg('replay', 'img/03-replay.png'), loadImg('journal', 'img/full-04-journal.png'), loadImg('analytics', 'img/full-05-analytics.png'), loadImg('dash', 'img/full-01-dashboard.png')]);
