// Shared pieces for the backtesting reels b1–b3 (loaded after kit.js): phone frames for the real app screens,
// touch marks, icons, the 100-trade grid, trade rows, and the link / follow end scenes.
const SH = 1992 / 1170;

/** A phone showing part of a screenshot: source x, y and width (px of the image); returns mappers to screen px. */
function phone(cx, top, w, img, sx, sy, sw, o = {}) {
  const h = o.h ?? w * SH, x = cx - w / 2; cv.save(); cv.globalAlpha *= o.alpha ?? 1;
  cv.shadowColor = rgba(C.accent, 0.35); cv.shadowBlur = 80; rr(x - 14, top - 14, w + 28, h + 28, 62); cv.fillStyle = '#05040a'; cv.fill(); cv.shadowBlur = 0; cv.lineWidth = 3; cv.strokeStyle = C.line; cv.stroke();
  cv.save(); rr(x, top, w, h, 48); cv.clip(); cv.fillStyle = C.bg; cv.fillRect(x, top, w, h); if (img) { const k = w / sw; cv.drawImage(img, sx, sy, sw, h / k, x, top, w, h); } cv.restore(); cv.restore();
  return { X: (px) => x + (px - sx) * (w / sw), Y: (py) => top + (py - sy) * (w / sw), k: w / sw };
}
function tap(x, y, k) { if (k <= 0 || k >= 1) return; cv.save(); cv.globalAlpha *= 1 - k; cv.strokeStyle = '#fff'; cv.lineWidth = 5; cv.beginPath(); cv.arc(x, y, 20 + 50 * k, 0, 7); cv.stroke(); cv.fillStyle = 'rgba(255,255,255,0.5)'; cv.beginPath(); cv.arc(x, y, 18, 0, 7); cv.fill(); cv.restore(); }
function finger(x, y, a = 1, press = 0) { cv.save(); cv.globalAlpha *= a; cv.shadowColor = 'rgba(0,0,0,0.5)'; cv.shadowBlur = 20; cv.fillStyle = 'rgba(255,255,255,0.88)'; cv.beginPath(); cv.arc(x, y, 30 - 6 * press, 0, 7); cv.fill(); cv.shadowBlur = 0; cv.strokeStyle = rgba(C.accent, 0.8); cv.lineWidth = 4; cv.stroke(); cv.restore(); }
function check(x, y, s, col) { cv.save(); cv.strokeStyle = col; cv.lineWidth = s * 0.2; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(x - s * 0.45, y + s * 0.02); cv.lineTo(x - s * 0.12, y + s * 0.34); cv.lineTo(x + s * 0.48, y - s * 0.32); cv.stroke(); cv.restore(); }
function cross(x, y, s, col, lw) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw ?? s * 0.2; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(x - s / 2, y - s / 2); cv.lineTo(x + s / 2, y + s / 2); cv.moveTo(x + s / 2, y - s / 2); cv.lineTo(x - s / 2, y + s / 2); cv.stroke(); cv.restore(); }
function sparkle(x, y, s, col, a = 1) { cv.save(); cv.globalAlpha *= a; cv.fillStyle = col; cv.shadowColor = col; cv.shadowBlur = 20; cv.beginPath(); cv.moveTo(x, y - s); cv.quadraticCurveTo(x, y, x + s, y); cv.quadraticCurveTo(x, y, x, y + s); cv.quadraticCurveTo(x, y, x - s, y); cv.quadraticCurveTo(x, y, x, y - s); cv.fill(); cv.restore(); }
/** A badge circle with a tick (ok) or a cross. */
function badge(x, y, r, ok, a = 1) { cv.save(); cv.globalAlpha *= a; const col = ok ? C.gain : C.loss; cv.fillStyle = rgba(col, 0.18); cv.beginPath(); cv.arc(x, y, r, 0, 7); cv.fill(); cv.strokeStyle = rgba(col, 0.7); cv.lineWidth = 3; cv.stroke(); if (ok) check(x, y, r * 1.05, col); else cross(x, y, r * 0.8, col, r * 0.2); cv.restore(); }
/** An equity curve through control points [u, v] with light deterministic noise. */
function curve(pts, n, seed, amp) { const r = rng(seed), out = []; for (let i = 0; i < n; i++) { const u = i / (n - 1); let j = 0; while (j < pts.length - 2 && pts[j + 1][0] < u) j++; const [u0, v0] = pts[j], [u1, v1] = pts[j + 1]; const k = E.sine(clamp((u - u0) / (u1 - u0))); out.push(lerp(v0, v1, k) + (r() - 0.5) * amp); } return out; }
/** Pop-in scale for something that appears at t0. */
const pop = (t, t0, d = 0.45) => E.back(P(t, t0 - 0.12, d));

/** One closed trade as an app row: symbol, side, result. ok: win or loss. */
function tradeRow(x, y, w, sym, ok, res, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0) return; const s = o.scale ?? 1;
  cv.save(); cv.translate(x, y); cv.scale(s, s); cv.globalAlpha *= clamp(a);
  card(-w / 2, -64, w, 128, { r: 30, border: rgba(ok ? C.gain : C.loss, 0.55), glow: o.glow ? rgba(ok ? C.gain : C.loss, 0.35) : undefined });
  badge(w / 2 - 70, 0, 34, ok);
  txt(sym, w / 2 - 130, -16, { size: 36, font: 'Rdx', weight: 700, color: C.ink, align: 'right', dir: 'ltr' });
  txt(o.side ?? 'خرید', w / 2 - 130, 26, { size: 26, weight: 600, color: C.muted, align: 'right' });
  txt(res, -w / 2 + 40, 2, { size: 46, font: 'Rdx', weight: 700, color: ok ? C.gain : C.loss, align: 'left', dir: 'ltr' });
  cv.restore();
}

/** 100 trades as a 10×10 grid (right to left, top to bottom). seq: 1 win, 0 loss. fill 0–1 shows them one by one. */
function grid100(cx, y0, seq, o = {}) {
  const gx = o.gx ?? 82, gy = o.gy ?? 66, cw = o.cw ?? 66, ch = o.ch ?? 52, x0 = cx + 4.5 * gx, fill = o.fill ?? 1, run = o.run ?? -1, runK = o.runK ?? 0, dim = o.dim ?? 0;
  for (let i = 0; i < 100; i++) {
    const row = Math.floor(i / 10), col = i % 10, x = x0 - col * gx, y = y0 + row * gy, on = fill * 100 > i;
    if (!on || !seq) { rr(x - cw / 2, y - ch / 2, cw, ch, 12); cv.fillStyle = rgba(C.line, 0.6); cv.fill(); continue; }
    const p = E.back(clamp((fill * 100 - i) / 6)), win_ = seq[i] === 1, inRun = run >= 0 && i >= run && i < run + 5;
    cv.save(); cv.translate(x, y); cv.scale(p, p); rr(-cw / 2, -ch / 2, cw, ch, 12);
    cv.globalAlpha *= inRun || runK <= 0 ? 1 - dim : 1 - 0.6 * runK;
    cv.fillStyle = win_ ? rgba(C.gain, 0.85) : rgba(C.loss, 0.85);
    if (inRun && runK > 0) { cv.shadowColor = C.loss; cv.shadowBlur = 30 * runK; cv.fillStyle = C.loss; }
    cv.fill(); cv.shadowBlur = 0; cv.restore();
  }
  return { x: (i) => x0 - (i % 10) * gx, y: (i) => y0 + Math.floor(i / 10) * gy };
}

/** «لینکش توی بیوئه» with a bouncing arrow, and «شروعش رایگانه». */
function linkScene(t, a, tLink, tFree, o = {}) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const fk = pop(t, tFree); if (fk > 0) { cv.save(); cv.translate(540, o.yFree ?? 640); cv.scale(fk, fk); cv.globalAlpha *= clamp(fk);
    card(-400, -150, 800, 300, { r: 44, border: rgba(C.gain, 0.7), glow: rgba(C.gain, 0.35) });
    txt(o.freeTop ?? 'شروعش', 0, -50, { size: 60, font: 'Rdx', weight: 700, color: C.ink });
    txt(o.freeBig ?? 'رایگانه', 0, 48, { size: o.freeSize ?? 104, font: 'Rdx', weight: 700, color: C.gain, glow: rgba(C.gain, 0.5) }); cv.restore();
    pill(540, (o.yFree ?? 640) + 220, 'ثبت‌نام فقط با شماره موبایل', { size: 30, dot: C.gain, alpha: E.out(P(t, tFree + 0.3, 0.4)) }); }
  const lk = pop(t, tLink); if (lk > 0) { const y = o.yLink ?? 1180, bob = Math.sin((t - tLink) * 7) * 9; cv.save(); cv.translate(540, y); cv.scale(lk, lk); button(0, 0, o.linkText ?? 'لینکش توی بیوئه', { size: 50 }); cv.restore();
    cv.save(); cv.globalAlpha *= clamp(lk); cv.translate(540, y - 120 + bob); cv.fillStyle = C.lilac; cv.beginPath(); cv.moveTo(0, -38); cv.lineTo(34, 4); cv.lineTo(12, 4); cv.lineTo(12, 38); cv.lineTo(-12, 38); cv.lineTo(-12, 4); cv.lineTo(-34, 4); cv.closePath(); cv.fill(); cv.restore(); }
  cv.restore();
}

/** The follow card: logo, a «فالو» button pressed at tFollow, then «فالو شد». */
function followScene(t, a, t0, tFollow, line, o = {}) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  if (o.head) headline(o.head, t, t0, DUR + 1, { y: 430, gap: 125, hold: true, glow: rgba(C.accent, 0.6) });
  const pk = pop(t, t0 + 0.35, 0.5); if (pk > 0) { cv.save(); cv.translate(540, 900); cv.scale(pk, pk); cv.globalAlpha *= clamp(pk); card(-420, -190, 840, 380, { r: 44, border: rgba(C.accent, 0.6), glow: rgba(C.accent, 0.3) });
    if (IMG.logo) { const w = 420, h = (w * IMG.logo.height) / IMG.logo.width; cv.drawImage(IMG.logo, -w / 2, -70 - h / 2, w, h); }
    const done = P(t, tFollow + 0.05, 0.2);
    cv.save(); cv.translate(0, 100); const press = Math.sin(Math.PI * P(t, tFollow - 0.1, 0.25)); cv.scale(1 - 0.05 * press, 1 - 0.05 * press);
    if (done <= 0) { cv.shadowColor = rgba(C.accent, 0.6); cv.shadowBlur = 40; rr(-360, -56, 720, 112, 30); const g = cv.createLinearGradient(-360, 0, 360, 0); g.addColorStop(0, C.grad0); g.addColorStop(1, C.grad1); cv.fillStyle = g; cv.fill(); cv.shadowBlur = 0; txt('فالو', 0, 4, { size: 50, weight: 800, color: '#fff' }); }
    else { rr(-360, -56, 720, 112, 30); cv.fillStyle = C.raised; cv.fill(); cv.strokeStyle = C.line; cv.lineWidth = 3; cv.stroke(); txt('فالو شد', 30, 4, { size: 48, weight: 800, color: C.ink }); check(-90, 2, 40, C.gain); }
    cv.restore(); cv.restore(); }
  const fk = E.inOut(P(t, tFollow - 0.9, 0.8)); if (fk > 0 && t < tFollow + 0.8) finger(lerp(860, 600, fk), lerp(1370, 1020, fk), clamp(fk * 3) * (1 - P(t, tFollow + 0.4, 0.4)), Math.sin(Math.PI * P(t, tFollow - 0.1, 0.25)));
  tap(600, 1000, P(t, tFollow - 0.05, 0.6));
  const hk = E.out(P(t, tFollow + 0.35, 0.5)); if (hk > 0 && line) txt(line, 540, 1260, { size: 42, weight: 700, color: C.muted, alpha: hk });
  cv.restore();
}
