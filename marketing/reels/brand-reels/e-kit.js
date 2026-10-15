// Shared world for the character reels e2 and e3 (e1's room, generalised): the trader seen from behind at his desk,
// the window with a sky from night through dawn, day and dusk, rain, the laptop (its lid can close), a desk calendar,
// sticky notes on the glass, a camera, and screen panels. Loaded after kit.js; the reel's scenes.js uses it.
const SHOTS = 'shots/';
const SHOT = (k) => IMG['s_' + k];
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c.getContext('2d'); };
const OF = [mkc(W, H), mkc(W, H), mkc(W, H), mkc(W, H), mkc(W, H)];
const SCR = { x: 372, y: 612, w: 600, h: 375 }, SS = 600 / 2880;   // laptop screen in the world; screenshot px → world
const sp = (px, py) => ({ x: SCR.x + px * SS, y: SCR.y + py * SS });
const WIN = { x: 70, y: 150, w: 940, h: 820 };
const hexA = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a, b, k, al = 1) => { const A = hexA(a), B = hexA(b); return `rgba(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(',')},${al})`; };
const mixHex = (a, b, k) => '#' + hexA(a).map((v, i) => Math.round(lerp(v, hexA(b)[i], clamp(k))).toString(16).padStart(2, '0')).join('');
const col = (h, a = 1) => `rgba(${hexA(h).join(',')},${a})`;

// ---------- camera ----------
const camM = (c) => [c.z, 0, 0, c.z, 540 - c.x * c.z, 960 - c.y * c.z];
const apply = (g, c) => g.setTransform(...camM(c));
const reset = (g) => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; };
function dolly(a, b, k) {
  const wa = 1080 / a.z, wb = 1080 / b.z, w = Math.exp(lerp(Math.log(wa), Math.log(wb), k));
  const u = Math.abs(wb - wa) < 1e-6 ? k : (w - wa) / (wb - wa);
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 1080 / w };
}
const shake = (c, a, t) => (a > 0 ? { ...c, x: c.x + Math.sin(t * 83) * a / c.z, y: c.y + Math.cos(t * 71) * a * 0.7 / c.z } : c);

// ---------- palettes: night, dawn, day, dusk ----------
const PAL = {
  night: { wall0: '#06070D', wall1: '#0C0E17', top: '#04060D', mid: '#0B1126', hor: '#22192F', bld: '#0A0F21', lights: 1, bokeh: 1, sun: 0, sunX: 760, sunY: 905, sunCol: '#FFD9A6', frame: '#090A11', frameHi: '#1A1B26', sill: '#10111A', sillHi: '#1D1E2A', desk0: '#15111A', desk1: '#08070B', deskHi: '#2A2433', amb: 0, ambCol: '#FFB27A', rim: '#B9A8FF', dim: 0.42 },
  dawn: { wall0: '#2A2133', wall1: '#3D2D36', top: '#3B3D72', mid: '#C47C7A', hor: '#FFC28A', bld: '#4D3549', lights: 0, bokeh: 0.15, sun: 1, sunX: 760, sunY: 905, sunCol: '#FFD9A6', frame: '#2E2229', frameHi: '#7A5A55', sill: '#55403F', sillHi: '#9A7464', desk0: '#4A3533', desk1: '#20171A', deskHi: '#9C7466', amb: 1, ambCol: '#FFB27A', rim: '#FFC08A', dim: 0 },
  day: { wall0: '#2C3240', wall1: '#3A404E', top: '#4E8FD8', mid: '#8DBDEA', hor: '#D9EAF6', bld: '#6F7E98', lights: 0, bokeh: 0, sun: 0.55, sunX: 820, sunY: 260, sunCol: '#FFFFFF', frame: '#23262F', frameHi: '#7D8698', sill: '#4A505C', sillHi: '#98A0AF', desk0: '#4A3E39', desk1: '#251F1D', deskHi: '#94857A', amb: 0.75, ambCol: '#D8E6FF', rim: '#E4ECFF', dim: 0 },
  dusk: { wall0: '#231B2E', wall1: '#30223A', top: '#2B2A5C', mid: '#9A5A86', hor: '#FF9A6A', bld: '#3B2A45', lights: 0.5, bokeh: 0.5, sun: 0.8, sunX: 300, sunY: 920, sunCol: '#FFB38A', frame: '#241B26', frameHi: '#6A4A55', sill: '#463644', sillHi: '#87657A', desk0: '#3A2A30', desk1: '#1A1217', deskHi: '#86606E', amb: 0.7, ambCol: '#FF9A7A', rim: '#FFB49A', dim: 0.1 },
};
const lerpPal = (a, b, k) => { const o = {}; for (const key in a) o[key] = typeof a[key] === 'number' ? lerp(a[key], b[key], k) : mixHex(a[key], b[key], k); return o; };
const SKYK = ['night', 'dawn', 'day', 'dusk', 'night'];
/** st.sky: 0 night, 1 dawn, 2 day, 3 dusk, 4 night (wraps); otherwise st.dawn mixes night into dawn. */
function palAt(st) {
  if (st.sky === undefined) return lerpPal(PAL.night, PAL.dawn, st.dawn ?? 0);
  const ph = ((st.sky % 4) + 4) % 4, i = Math.floor(ph);
  return lerpPal(PAL[SKYK[i]], PAL[SKYK[i + 1]], E.sine(ph - i));
}

// ---------- the world ----------
const R = rng(11);
const BOKEH = Array.from({ length: 70 }, () => ({ x: 80 + R() * 920, y: 600 + R() * 360, r: 7 + R() * 22, c: R() < 0.62 ? '#FFB86B' : R() < 0.55 ? '#7FA8FF' : '#FF7A95', a: 0.22 + R() * 0.4, ph: R() * 6 }));
const BLD = []; { let x = 64; while (x < 1012) { const w = 46 + R() * 96; BLD.push({ x, w, top: 640 + R() * 230, seed: Math.floor(R() * 1e6) }); x += w + 3 + R() * 12; } }
const STREAK = Array.from({ length: 160 }, () => ({ x: R() * 1120 - 40, y: R(), v: 1100 + R() * 900, l: 26 + R() * 64, a: 0.05 + R() * 0.13 }));
const DROP = Array.from({ length: 260 }, () => ({ x: 76 + R() * 928, y: 156 + R() * 808, r: 1.2 + R() * R() * 6, a: 0.25 + R() * 0.5 }));
const SLIDE = Array.from({ length: 16 }, () => ({ x: 90 + R() * 900, y0: 150 + R() * 260, v: 16 + R() * 46, r: 3 + R() * 3.5, ph: R() * 10 }));
const HP = [R() * 6, R() * 6, R() * 6];
const hairR = (a) => 0.03 * Math.sin(5 * a + HP[0]) + 0.022 * Math.sin(9 * a + HP[1]) + 0.012 * Math.sin(17 * a + HP[2]);
const GRAINW = Array.from({ length: 34 }, () => ({ y: 1004 + R() * 900, a: 0.015 + R() * 0.03, w: 1 + R() * 3, k: R() * 0.02 - 0.01 }));
const CLOUD = Array.from({ length: 7 }, () => ({ x: R() * 1100, y: 190 + R() * 330, w: 160 + R() * 220, v: 30 + R() * 40 }));
// sticky notes on the glass and the wall (e3): place k-th note
const WNOTE = (() => { const r = rng(5), out = []; for (let i = 0; i < 60; i++) { let x, y; do { x = 90 + r() * 900; y = 170 + r() * 560; } while (x > 330 && x < 1010 && y > 540); out.push({ x, y, rot: (r() - 0.5) * 0.5, c: ['#F6D468', '#F3C84E', '#F8DD7A', '#F2B8C6', '#A9E3C8'][Math.floor(r() * 5)], s: 0.85 + r() * 0.3 }); } return out; })();

function rad(g, x, y, rx, ry, c, a, op) {
  g.save(); if (op) g.globalCompositeOperation = op; g.translate(x, y); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); const cc = hexA(c);
  gr.addColorStop(0, `rgba(${cc},${a})`); gr.addColorStop(0.55, `rgba(${cc},${a * 0.35})`); gr.addColorStop(1, `rgba(${cc},0)`);
  g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore();
}

function windowLayer(g, t, st, P) {
  const rain = st.rain ?? 0;
  const wg = g.createLinearGradient(0, -300, 0, 1010); wg.addColorStop(0, P.wall0); wg.addColorStop(1, P.wall1);
  g.fillStyle = wg; g.fillRect(-600, -600, W + 1200, 1610);
  g.save(); g.beginPath(); g.rect(WIN.x, WIN.y, WIN.w, WIN.h); g.clip();
  const sky = g.createLinearGradient(0, WIN.y, 0, WIN.y + WIN.h); sky.addColorStop(0, P.top); sky.addColorStop(0.55, P.mid); sky.addColorStop(1, P.hor);
  g.fillStyle = sky; g.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
  if (P.sun > 0.01) { rad(g, P.sunX, P.sunY, 520, 360, P.sunCol, 0.7 * P.sun); rad(g, P.sunX, P.sunY, 150, 110, '#FFF4DE', 0.85 * P.sun * P.sun); }
  const cl = clamp((P.amb - 0.3) * 1.6) * (st.clouds ?? 1);
  if (cl > 0.02) for (const c of CLOUD) { const x = ((c.x + (st.cloudT ?? t) * c.v) % 1400) - 200; g.globalAlpha = 0.35 * cl; g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(x, c.y, c.w / 2, c.w / 7, 0, 0, 7); g.ellipse(x + c.w * 0.2, c.y - c.w * 0.06, c.w / 3, c.w / 8, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
  for (const b of BLD) {
    g.fillStyle = P.bld; g.fillRect(b.x, b.top, b.w, 975 - b.top);
    if (P.lights > 0.02) { const r = rng(b.seed), cols = Math.floor((b.w - 10) / 15), rows = Math.floor((975 - b.top - 12) / 21);
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const lit = r() < 0.3, v = r(); if (!lit) continue; g.fillStyle = `rgba(255,${200 + Math.floor(v * 40)},120,${(0.55 + 0.3 * v) * P.lights})`; g.fillRect(b.x + 7 + j * 15, b.top + 10 + i * 21, 6, 9); } }
  }
  if (P.bokeh > 0.02) for (const k of BOKEH) { const a = k.a * (0.75 + 0.25 * Math.sin(t * 1.4 + k.ph)) * P.bokeh; if (a > 0.01) rad(g, k.x, k.y, k.r * 1.6, k.r * 1.6, k.c, a); }
  if (rain > 0) {
    g.lineCap = 'round'; g.strokeStyle = '#C8D2FF'; g.lineWidth = 1.6;
    for (const s of STREAK) { const y = ((s.y * 1300 + t * s.v) % 1300) - 140 + WIN.y, x = s.x + (y - WIN.y) * 0.07; g.globalAlpha = s.a * rain; g.beginPath(); g.moveTo(x, y); g.lineTo(x + s.l * 0.07, y + s.l); g.stroke(); }
    const dropA = rain;
    for (const q of DROP) { g.globalAlpha = q.a * dropA; g.fillStyle = 'rgba(210,220,255,0.16)'; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(q.x - q.r * 0.3, q.y - q.r * 0.35, q.r * 0.32, 0, 7); g.fill(); }
    for (const s of SLIDE) { const y = s.y0 + ((t * s.v + s.ph * 40) % 640), x = s.x + Math.sin(y * 0.03 + s.ph) * 3;
      g.globalAlpha = 0.14 * dropA; g.strokeStyle = 'rgba(220,230,255,1)'; g.lineWidth = s.r * 0.7; g.beginPath(); g.moveTo(x, y - 70); g.lineTo(x, y); g.stroke();
      g.globalAlpha = 0.5 * dropA; g.fillStyle = 'rgba(220,230,255,0.35)'; g.beginPath(); g.arc(x, y, s.r, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  rad(g, 672, 790, 420, 260, st.screenCol ?? '#8C7CFF', 0.10 * (st.screenOn ?? 1) * (1 - P.amb * 0.6), 'lighter');
  g.restore();
  g.fillStyle = P.frame; g.fillRect(WIN.x - 28, WIN.y - 28, WIN.w + 56, 28); g.fillRect(WIN.x - 28, WIN.y, 28, WIN.h); g.fillRect(WIN.x + WIN.w, WIN.y, 28, WIN.h);
  g.fillRect(538 - 12, WIN.y, 24, WIN.h); g.fillRect(WIN.x, 548, WIN.w, 18);
  g.fillStyle = col(P.frameHi, 0.8); g.fillRect(WIN.x, 548, WIN.w, 2); g.fillRect(538 - 12, WIN.y, 2, WIN.h);
  g.fillStyle = P.sill; g.fillRect(WIN.x - 44, WIN.y + WIN.h, WIN.w + 88, 32);
  g.fillStyle = col(P.sillHi, 0.7); g.fillRect(WIN.x - 44, WIN.y + WIN.h, WIN.w + 88, 3);
  // sticky notes on the glass (e3)
  const n = st.notes ?? 0;
  for (let i = 0; i < Math.min(Math.ceil(n), WNOTE.length); i++) {
    const q = WNOTE[i], pop = i < Math.floor(n) ? 1 : n - Math.floor(n), s = q.s * E.back(clamp(pop));
    if (s <= 0) continue;
    g.save(); g.translate(q.x, q.y); g.rotate(q.rot); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-32, -27, 68, 62); g.fillStyle = q.c; g.fillRect(-34, -31, 68, 62);
    g.fillStyle = 'rgba(120,80,10,0.18)'; g.fillRect(-34, -31, 68, 11);
    g.fillStyle = '#23306E'; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 15px Vaz'; g.fillText('از شنبه', 0, 4);
    if (P.dim > 0) { g.fillStyle = `rgba(8,6,20,${P.dim * 0.8})`; g.fillRect(-34, -31, 68, 62); }
    g.restore();
  }
}

function desk(g, t, st, P) {
  const dg = g.createLinearGradient(0, 1002, 0, 1920); dg.addColorStop(0, P.desk0); dg.addColorStop(1, P.desk1);
  g.fillStyle = dg; g.fillRect(-600, 1002, W + 1200, 1400);
  for (const l of GRAINW) { g.fillStyle = `rgba(255,230,210,${l.a})`; g.save(); g.translate(0, l.y); g.rotate(l.k); g.fillRect(-600, 0, W + 1200, l.w); g.restore(); }
  g.fillStyle = col(P.deskHi, 0.5); g.fillRect(-600, 1002, W + 1200, 3);
  rad(g, 672, 1050, 560, 230, st.screenCol ?? '#8C7CFF', 0.20 * (st.screenOn ?? 1) * (st.lid ?? 1), 'lighter');
  if (P.amb > 0) rad(g, 700, 1010, 900, 360, P.ambCol, 0.16 * P.amb, 'lighter');
}

function mug(g, t, st, P) {
  g.save(); g.translate(150, 1046);
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(6, 44, 52, 13, 0, 0, 7); g.fill();
  g.strokeStyle = mix('#1E1D27', '#5A4440', P.amb); g.lineWidth = 12; g.beginPath(); g.arc(-40, 4, 20, Math.PI * 0.5, Math.PI * 1.5); g.stroke();
  const mg = g.createLinearGradient(-38, 0, 38, 0); mg.addColorStop(0, mix('#121119', '#3C2E30', P.amb)); mg.addColorStop(1, mix('#2B2838', '#8A6A60', P.amb));
  g.fillStyle = mg; g.beginPath(); g.roundRect(-38, -38, 76, 80, [4, 4, 14, 14]); g.fill();
  g.fillStyle = mix('#3A3550', '#C29A86', P.amb, 0.9); g.beginPath(); g.ellipse(0, -38, 38, 10, 0, 0, 7); g.fill();
  g.fillStyle = '#1A0F0A'; g.beginPath(); g.ellipse(0, -37, 32, 7, 0, 0, 7); g.fill();
  g.restore();
  g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(230,225,255,1)';
  for (let i = 0; i < 3; i++) { g.lineWidth = 9 - i * 2; g.globalAlpha = 0.05 * (1 - 0.5 * P.amb); g.beginPath();
    for (let y = 1000; y > 840; y -= 6) { const k = (1000 - y) / 160, x = 150 + (i - 1) * 10 + Math.sin(y * 0.035 + t * 1.6 + i * 2) * 14 * k; y === 1000 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
  g.restore();
}

/** A desk flip calendar (e3). st.cal = { day, month, year, next?: {…}, flip: 0–1 } */
function calendar(g, t, st, P) {
  const c = st.cal; g.save(); g.translate(150, 1040);
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(6, 56, 74, 14, 0, 0, 7); g.fill();
  g.fillStyle = mix('#15151C', '#4A4048', P.amb); g.beginPath(); g.moveTo(-70, 52); g.lineTo(70, 52); g.lineTo(58, -56); g.lineTo(-58, -56); g.closePath(); g.fill();
  const page = (p, a = 1) => {
    g.save(); g.globalAlpha *= a;
    g.fillStyle = mix('#C9C3B8', '#FFF8EC', P.amb * 0.9 + 0.1); g.fillRect(-56, -52, 112, 98);
    g.fillStyle = mix('#7A2430', '#E0465A', P.amb * 0.8 + 0.2); g.fillRect(-56, -52, 112, 26);
    g.fillStyle = '#fff'; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 17px Vaz'; g.fillText(p.wd ?? 'شنبه', 0, -38);
    g.fillStyle = '#26232C'; g.font = '800 44px Rdx'; g.fillText(p.day, 0, 4); g.font = '600 13px Vaz'; g.fillStyle = '#5A5560'; g.fillText(`${p.month} ${p.year}`, 0, 34);
    g.restore();
  };
  if (c.next && c.flip > 0) page(c.next);
  if (!c.next || c.flip < 1) { g.save(); const f = E.in(clamp(c.flip ?? 0)); g.translate(0, -52); g.scale(1, Math.max(0.001, 1 - f * 1.9) * (f > 0.52 ? -1 : 1)); g.translate(0, 52); page(c, 1 - f * 0.3); g.restore(); }
  g.fillStyle = '#8D8A94'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(i * 20, -54, 4, 0, 7); g.fill(); }
  if (P.dim > 0) { g.fillStyle = `rgba(8,6,20,${P.dim * 0.7})`; g.fillRect(-60, -58, 120, 106); }
  g.restore();
}

function mouseAndPhone(g, t, st, P) {
  g.save(); g.translate(852, 1166); g.rotate(-0.2);
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(4, 10, 30, 44, 0, 0, 7); g.fill();
  g.fillStyle = '#17161E'; g.beginPath(); g.ellipse(0, 0, 26, 40, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(180,165,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 26, 40, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  g.restore();
  if (st.deskPhone === false) return;
  g.save(); g.translate(968, 1150); g.rotate(-0.26);
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.roundRect(-38, -72, 84, 156, 14); g.fill();
  g.fillStyle = '#07070A'; g.beginPath(); g.roundRect(-40, -78, 80, 156, 13); g.fill();
  g.fillStyle = (st.phoneOn ?? 0) > 0 ? mix('#0B0B12', '#8E9CFF', st.phoneOn * 0.8) : '#0C0C12'; g.beginPath(); g.roundRect(-35, -73, 70, 146, 10); g.fill();
  g.restore();
}

function screenContent(g, t, st, x0, y0, w, h) {
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  g.fillStyle = '#0D0B14'; g.fillRect(x0, y0, w, h);
  g.imageSmoothingQuality = 'high';
  const put = (k, a) => { const im = SHOT(k); if (!im || a <= 0) return; g.globalAlpha = a; g.drawImage(im, x0, y0, w, h); };
  put(st.scr, 1); if (st.scr2) put(st.scr2, st.mix ?? 0);
  g.globalAlpha = 1;
  if (st.flash) { g.fillStyle = `rgba(255,255,255,${0.18 * st.flash})`; g.fillRect(x0, y0, w, h); }
  if (st.tintScr) { g.fillStyle = st.tintScr; g.fillRect(x0, y0, w, h); }
  const gl = g.createLinearGradient(x0, y0, x0 + w * 0.7, y0 + h); gl.addColorStop(0, 'rgba(255,255,255,0.06)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.fillStyle = gl; g.fillRect(x0, y0, w, h);
  if ((st.screenOn ?? 1) < 1) { g.fillStyle = `rgba(4,4,8,${1 - (st.screenOn ?? 1)})`; g.fillRect(x0, y0, w, h); }
  g.restore();
}

/** The laptop. st.lid: 1 open (default) … 0 closed. */
function laptop(g, t, st, P) {
  g.beginPath(); g.moveTo(352, 1001); g.lineTo(992, 1001); g.lineTo(1046, 1072); g.lineTo(298, 1072); g.closePath();
  const bg = g.createLinearGradient(0, 1001, 0, 1072); bg.addColorStop(0, mix('#26252F', '#5C4848', P.amb)); bg.addColorStop(1, mix('#15141B', '#3A2C2E', P.amb)); g.fillStyle = bg; g.fill();
  const lid = st.lid ?? 1, on = (st.screenOn ?? 1) * clamp((lid - 0.7) / 0.3);
  for (let row = 0; row < 4; row++) {
    const y = 1009 + row * 12, k = (y - 1001) / 71, xl = lerp(352, 298, k) + 52, xr = lerp(992, 1046, k) - 52, n = 15, kw = (xr - xl) / n;
    g.fillStyle = `rgba(190,180,255,${0.05 + 0.05 * on})`; for (let i = 0; i < n; i++) g.fillRect(xl + i * kw + 2, y, kw - 4, 8);
  }
  g.fillStyle = `rgba(190,180,255,${0.04 + 0.03 * on})`; g.fillRect(612, 1058, 120, 10);
  g.fillStyle = '#09090D'; g.beginPath(); g.moveTo(298, 1072); g.lineTo(1046, 1072); g.lineTo(1040, 1081); g.lineTo(304, 1081); g.closePath(); g.fill();
  if (lid >= 0.999) {
    g.fillStyle = '#0D0D12'; g.beginPath(); g.roundRect(356, 596, 632, 407, 18); g.fill();
    g.strokeStyle = mix('#2A2A36', '#8E6E66', P.amb, 0.9); g.lineWidth = 2; g.stroke();
    g.fillStyle = '#1C1C26'; g.beginPath(); g.arc(672, 604, 2.5, 0, 7); g.fill();
    screenContent(g, t, { ...st, screenOn: on }, SCR.x, SCR.y, SCR.w, SCR.h);
    return;
  }
  // the lid between closed (lying on the deck, its back up) and open (upright, screen towards us)
  const a = E.inOut(clamp(lid)), yf = lerp(1074, 596, a), x0 = lerp(296, 356, a), x1 = lerp(1048, 988, a);
  g.beginPath(); g.moveTo(354, 1003); g.lineTo(990, 1003); g.lineTo(x1, yf); g.lineTo(x0, yf); g.closePath();
  if (yf > 1003) {
    const lg = g.createLinearGradient(0, 1003, 0, yf); lg.addColorStop(0, mix('#202029', '#5E5050', P.amb)); lg.addColorStop(1, mix('#2E2D38', '#7A6866', P.amb)); g.fillStyle = lg; g.fill();
    g.strokeStyle = mix('#3A3A48', '#9A8480', P.amb, 0.8); g.lineWidth = 2; g.stroke();
    if (IMG.icon) { g.save(); g.globalAlpha = 0.35; g.translate(672, (1003 + yf) / 2); g.scale(1, Math.max(0.05, (yf - 1003) / 71)); g.drawImage(IMG.icon, -14, -14, 28, 28); g.restore(); }
    if (st.lidNote) lidNote(g, st, P, yf);
  } else {
    g.fillStyle = '#0D0D12'; g.fill(); g.strokeStyle = mix('#2A2A36', '#8E6E66', P.amb, 0.9); g.lineWidth = 2; g.stroke();
    const k = (1003 - yf) / 407, ix0 = lerp(354, 372, k), ix1 = lerp(990, 972, k), iy0 = yf + 16 * k, iy1 = 1003 - 16 * k;
    if (iy1 - iy0 > 2) screenContent(g, t, { ...st, screenOn: on }, ix0, iy0, ix1 - ix0, iy1 - iy0);
  }
}
function lidNote(g, st, P, yf) {
  const sy = (yf - 1003) / 71; if (sy < 0.3) return;
  g.save(); g.translate(560, (1003 + yf) / 2 + 2); g.scale(1, sy); g.rotate(-0.05);
  g.fillStyle = '#F6D468'; g.fillRect(-46, -26, 92, 52); g.fillStyle = '#23306E'; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 13px Vaz'; g.fillText('از شنبه', 0, 0);
  if (P.dim > 0) { g.fillStyle = `rgba(8,6,20,${P.dim * 0.8})`; g.fillRect(-46, -26, 92, 52); }
  g.restore();
}

/** The sticky note on the open lid (e1/e2): «یه روز تریدر حرفه‌ای می‌شم.» */
function note(g, st, P) {
  if ((st.lid ?? 1) < 0.999 || st.note === false) return;
  g.save(); g.translate(1006, 842); g.rotate(0.07);
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.roundRect(-58, -52, 128, 120, 3); g.fill();
  const ng = g.createLinearGradient(-62, -58, 62, 58); ng.addColorStop(0, '#F6D468'); ng.addColorStop(1, '#E7B941'); g.fillStyle = ng; g.fillRect(-62, -58, 124, 116);
  g.fillStyle = 'rgba(150,100,20,0.15)'; g.fillRect(-62, -58, 124, 20);
  g.fillStyle = '#1D2C6E'; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '500 17px Vaz'; g.save(); g.rotate(-0.04); g.fillText('یه روز', 2, -24); g.restore();
  g.font = '700 18.5px Vaz'; g.save(); g.rotate(0.02); g.fillText('تریدر حرفه‌ای', 0, 2); g.restore();
  g.font = '500 17px Vaz'; g.save(); g.rotate(-0.02); g.fillText('می‌شم.', -14, 28); g.restore();
  g.strokeStyle = '#1D2C6E'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-42, 14); g.quadraticCurveTo(0, 18, 46, 12); g.stroke();
  if (P.dim > 0) { g.fillStyle = `rgba(8,6,20,${P.dim})`; g.fillRect(-62, -58, 124, 116); }
  rad(g, -62, -10, 120, 120, '#8C7CFF', 0.16 * (st.screenOn ?? 1), 'lighter');
  g.restore();
}

// ---------- the trader (seen from behind) ----------
// st: pose (0 head in hand … 1 upright), arm (hand to the mouse), lean (towards the screen), cheer (fists up; pump),
// phone (leaning back, phone held up), reach (right hand to reachHd)
function figGeo(t, st) {
  const p = st.pose ?? 1, lean = E.inOut(clamp(st.lean ?? 0)), ch = E.inOut(clamp(st.cheer ?? 0)), ph = E.inOut(clamp(st.phone ?? 0)), re = E.inOut(clamp(st.reach ?? 0));
  const br = Math.sin(t * (1.7 + 3 * lean)) * (1 - 0.4 * p) * (1 - ch);
  const G = { hx: lerp(330, 296, p) + 12 * lean - 10 * ph, hy: lerp(1114, 1046, p) + br * 2 - 52 * lean + 40 * ph + 10 * ch, rot: lerp(0.2, 0.03, p) - 0.1 * ch + 0.04 * ph, s: 1 - 0.08 * lean + 0.06 * ph, rx: 108, ry: 126,
    lsx: lerp(112, 70, p) + 8 * lean, lsy: lerp(1286, 1302, p) + br * 3 - 22 * lean + 26 * ph - 16 * ch, rsx: lerp(548, 588, p) - 6 * lean, rsy: lerp(1292, 1306, p) + br * 3 - 22 * lean + 26 * ph - 16 * ch };
  const k = E.inOut(clamp(st.arm ?? p)), pump = (st.pump ?? 0) * Math.sin(t * 12.6) * 24;
  const bl = (a, b, f) => ({ x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) });
  let el = { x: lerp(652, 724, k), y: lerp(1402, 1352, k) }, hd = { x: lerp(G.hx + 86, 836, k) - 30 * Math.sin(Math.PI * k), y: lerp(G.hy - 14, 1214, k) - 80 * Math.sin(Math.PI * k) };
  el = bl(el, { x: 676, y: 1108 + pump * 0.5 }, ch); hd = bl(hd, { x: 716, y: 868 + pump }, ch);
  el = bl(el, { x: 650, y: 1390 }, ph); hd = bl(hd, { x: G.hx + 128, y: G.hy + 34 }, ph);
  el = bl(el, st.reachEl ?? { x: 716, y: 1262 }, re); hd = bl(hd, st.reachHd ?? { x: 780, y: 1040 }, re);
  G.j0 = { x: G.rsx - 26, y: G.rsy + 46 }; G.el = el; G.hd = hd; G.closed = k > 0.5 || ch > 0.3 || ph > 0.3 || re > 0.3; G.k = Math.max(k, ch, re);
  G.armFirst = false;
  G.left = Math.max(ch, ph);
  G.lj0 = { x: G.lsx + 30, y: G.lsy + 46 };
  G.lel = bl({ x: 70, y: 1500 }, ch >= ph ? { x: 40, y: 1100 - pump * 0.5 } : { x: 20, y: 1440 }, G.left);
  G.lhd = bl({ x: 120, y: 1600 }, ch >= ph ? { x: 128, y: 866 - pump } : { x: G.hx - 70, y: G.hy + 44 }, G.left);
  G.leftFront = ch > 0.5;
  G.phone = ph;
  return G;
}
function armShape(g, j0, el, hd, closed, colf, mirror) {
  const dx = hd.x - el.x, dy = hd.y - el.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const wr = { x: hd.x - ux * 36, y: hd.y - uy * 36 }, nx = -uy, ny = ux, w0 = closed ? 50 : 46, w1 = closed ? 40 : 34;
  g.lineCap = 'round'; g.strokeStyle = colf('#131623'); g.fillStyle = colf('#131623');
  g.lineWidth = 98; g.beginPath(); g.moveTo(j0.x, j0.y); g.lineTo(el.x, el.y); g.stroke();
  g.beginPath(); g.moveTo(el.x + nx * w0, el.y + ny * w0); g.lineTo(wr.x + nx * w1, wr.y + ny * w1); g.lineTo(wr.x - nx * w1, wr.y - ny * w1); g.lineTo(el.x - nx * w0, el.y - ny * w0); g.closePath(); g.fill();
  g.beginPath(); g.arc(el.x, el.y, w0, 0, 7); g.fill();
  g.fillStyle = colf('#191C2B'); g.beginPath(); g.ellipse(wr.x, wr.y, w1 + 2, 13, Math.atan2(ny, nx), 0, 7); g.fill();
  g.fillStyle = colf('#3B2A27'); g.save(); g.translate(hd.x, hd.y); g.rotate(Math.atan2(uy, ux) - Math.PI / 2); if (mirror) g.scale(-1, 1);
  if (!closed) { g.beginPath(); g.ellipse(0, -2, 30, 36, 0, 0, 7); g.fill(); for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(-26 + i * 14, 16, 12, 30 - Math.abs(i - 1.5) * 5, 6); g.fill(); } }
  else { g.beginPath(); g.roundRect(-34, -18, 68, 50, [18, 18, 26, 26]); g.fill(); g.beginPath(); g.ellipse(-34, 6, 10, 18, 0.5, 0, 7); g.fill(); }
  g.restore();
}
function figShape(g, G, mask) {
  const c = (x) => (mask ? '#fff' : x);
  if (G.left > 0.01 && !G.leftFront) armShape(g, G.lj0, G.lel, G.lhd, true, c, true);
  g.fillStyle = c('#10121B');
  g.beginPath(); g.moveTo(-140, 1960); g.lineTo(-120, 1480); g.quadraticCurveTo(-70, G.lsy + 12, G.lsx, G.lsy);
  g.quadraticCurveTo(G.hx - 128, G.hy + 118, G.hx - 56, G.hy + 108); g.lineTo(G.hx + 50, G.hy + 104);
  g.quadraticCurveTo(G.hx + 126, G.hy + 126, G.rsx, G.rsy); g.quadraticCurveTo(G.rsx + 96, G.rsy + 40, G.rsx + 112, 1560); g.lineTo(G.rsx + 160, 1960); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(G.hx - 14, G.hy + 116, 160, 60, -0.04, 0, 7); g.fill();
  if (!mask) {
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(G.hx - 14, G.hy + 116, 132, 40, -0.04, Math.PI * 0.05, Math.PI * 0.95); g.stroke();
    g.beginPath(); g.moveTo(G.lsx + 60, G.lsy + 80); g.quadraticCurveTo(G.hx - 30, G.hy + 260, G.rsx - 60, G.rsy + 110); g.stroke();
  }
  if (G.left > 0.01 && G.leftFront) armShape(g, G.lj0, G.lel, G.lhd, true, c, true);
  if (G.armFirst) armShape(g, G.j0, G.el, G.hd, G.closed, c, false);
  g.save(); g.translate(G.hx, G.hy); g.rotate(G.rot); g.scale(G.s, G.s);
  g.fillStyle = c('#24191A'); g.beginPath(); g.roundRect(-44, G.ry * 0.62, 88, 70, 20); g.fill();
  g.fillStyle = c('#0A0A0F'); g.beginPath();
  for (let i = 0; i <= 96; i++) { const a = Math.PI * 0.6 + (i / 96) * Math.PI * 1.8, top = clamp(-Math.sin(a) + 0.3), s = 0.03 + hairR(a) * (0.35 + top); const x = Math.cos(a) * G.rx * (1 + s), y = Math.sin(a) * G.ry * (1 + s); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath(); g.fill();
  g.fillStyle = c('#2E211F'); g.beginPath(); g.ellipse(G.rx * 0.95, 8, 15, 30, 0.15, 0, 7); g.fill();
  g.restore();
  if (!G.armFirst) armShape(g, G.j0, G.el, G.hd, G.closed, c, false);
  if (G.phone > 0.05) {   // the phone held up beside his face, its back to us, the screen's light spilling round its edges
    g.save(); g.translate(G.hd.x - 6, G.hd.y - 66); g.rotate(0.2); g.scale(G.phone, G.phone);
    g.fillStyle = c('#1A1A22'); g.beginPath(); g.roundRect(-38, -72, 76, 144, 12); g.fill();
    if (!mask) { g.strokeStyle = 'rgba(190,205,255,0.85)'; g.lineWidth = 3; g.beginPath(); g.roundRect(-38, -72, 76, 144, 12); g.stroke();
      g.fillStyle = '#0C0C12'; g.beginPath(); g.roundRect(-28, -62, 26, 30, 7); g.fill(); }
    g.restore();
  }
}
function trader(t, st, cam, P, blur = 0) {
  const G = figGeo(t, st), [m, rim, fig] = OF;
  for (const g of [m, rim, fig]) { reset(g); g.clearRect(0, 0, W, H); }
  apply(m, cam); figShape(m, G, true); reset(m);
  const L = st.light ?? { x: 680, y: 820 }, rc = st.rimCol ?? P.rim, ra = st.rimA ?? Math.max(st.screenOn ?? 1, P.amb);
  const dx = L.x - 330, dy = L.y - 1046, dl = Math.hypot(dx, dy), sh = { x: -dx / dl * 7, y: -dy / dl * 7 };
  rim.drawImage(m.canvas, 0, 0); rim.globalCompositeOperation = 'destination-out'; rim.drawImage(m.canvas, sh.x * cam.z, sh.y * cam.z);
  rim.globalCompositeOperation = 'source-in'; rim.fillStyle = col(rc, 0.9 * ra); rim.fillRect(0, 0, W, H);
  rim.globalCompositeOperation = 'destination-in'; apply(rim, cam);
  const fall = rim.createRadialGradient(L.x, L.y, 120, L.x, L.y, 820); fall.addColorStop(0, 'rgba(0,0,0,1)'); fall.addColorStop(0.55, 'rgba(0,0,0,0.75)'); fall.addColorStop(1, 'rgba(0,0,0,0)');
  rim.fillStyle = fall; rim.fillRect(-600, -600, W + 1200, H + 1200); reset(rim);
  apply(fig, cam); figShape(fig, G, false);
  fig.globalCompositeOperation = 'source-atop'; rad(fig, L.x, L.y, 760, 760, rc, 0.14 * ra);
  if (P.amb > 0.3) rad(fig, 600, 500, 1000, 1000, P.ambCol, 0.10 * P.amb);
  reset(fig); fig.globalCompositeOperation = 'source-atop'; fig.drawImage(rim.canvas, 0, 0); reset(fig);
  reset(cv); if (blur > 0.3) cv.filter = `blur(${blur}px)`; cv.drawImage(fig.canvas, 0, 0);
  cv.globalCompositeOperation = 'lighter'; cv.filter = `blur(${8 + blur}px)`; cv.globalAlpha = 0.55; cv.drawImage(rim.canvas, 0, 0); reset(cv);
  return G;
}

/** The whole room through camera `cam`. o: bgBlur (window), fgBlur (trader). */
function room(t, st, cam, o = {}) {
  const P = palAt(st);
  reset(cv); cv.fillStyle = '#05050A'; cv.fillRect(0, 0, W, H);
  const g = OF[3]; reset(g); g.clearRect(0, 0, W, H); apply(g, cam); windowLayer(g, t, st, P); reset(g);
  if (o.bgBlur > 0.3) cv.filter = `blur(${o.bgBlur}px)`; cv.drawImage(g.canvas, 0, 0); reset(cv);
  apply(cv, cam); desk(cv, t, st, P); if (st.cal) calendar(cv, t, st, P); else mug(cv, t, st, P); mouseAndPhone(cv, t, st, P); laptop(cv, t, st, P); note(cv, st, P);
  const G = figGeo(t, st);
  if (G.k > 0.3 && !(st.cheer > 0.3)) { cv.save(); cv.globalAlpha = 0.5 * clamp((G.k - 0.3) / 0.4); cv.filter = 'blur(10px)'; cv.fillStyle = '#000'; cv.beginPath(); cv.ellipse(G.hd.x + 18, G.hd.y + 34, 48, 26, -0.3, 0, 7); cv.fill(); cv.restore(); }
  reset(cv); trader(t, st, cam, P, o.fgBlur ?? 0);
  apply(cv, cam);
  rad(cv, 672, 800, 520, 420, st.screenCol ?? '#7C5CFF', 0.08 * (st.screenOn ?? 1) * clamp(((st.lid ?? 1) - 0.7) / 0.3), 'lighter');
  if (st.phone > 0.05) { const Gp = figGeo(t, st); rad(cv, Gp.hd.x - 30, Gp.hd.y - 60, 300, 260, '#AFC2FF', 0.30 * st.phone * (st.phoneLit ?? 1), 'lighter'); }
  if (P.amb > 0) rad(cv, 700, 700, 900, 900, P.ambCol, 0.10 * P.amb, 'lighter');
  if (st.glow) rad(cv, 672, 820, 900, 1100, st.glow[0], st.glow[1], 'lighter');
  reset(cv);
}
function soften(blur, dark) {
  const g = OF[4]; reset(g); g.clearRect(0, 0, W, H); g.drawImage(cv.canvas, 0, 0);
  reset(cv); cv.fillStyle = '#05050A'; cv.fillRect(0, 0, W, H); cv.filter = `blur(${blur}px)`; cv.drawImage(g.canvas, -20, -20, W + 40, H + 40); reset(cv);
  if (dark > 0) { cv.fillStyle = `rgba(5,4,10,${dark})`; cv.fillRect(0, 0, W, H); }
}
/** A screenshot crop [sx, sy, sw, sh] as a floating screen panel centred at (cx, cy), w px wide. */
function panel(k, crop, cx, cy, w, o = {}) {
  const im = SHOT(k); if (!im) return; const h = (w * crop[3]) / crop[2];
  cv.save(); cv.globalAlpha *= o.alpha ?? 1; cv.translate(cx, cy); const s = o.scale ?? 1; cv.scale(s, s); if (o.rot) cv.rotate(o.rot);
  cv.shadowColor = o.glowCol ?? 'rgba(0,0,0,0.6)'; cv.shadowBlur = o.glowCol ? 90 : 60; cv.shadowOffsetY = o.glowCol ? 0 : 20; rr(-w / 2, -h / 2, w, h, 26); cv.fillStyle = '#0D0B14'; cv.fill(); cv.shadowColor = 'transparent';
  cv.save(); rr(-w / 2, -h / 2, w, h, 26); cv.clip(); cv.imageSmoothingQuality = 'high'; cv.drawImage(im, ...crop, -w / 2, -h / 2, w, h);
  if (o.k2 && o.mix > 0 && SHOT(o.k2)) { cv.globalAlpha = o.mix; cv.drawImage(SHOT(o.k2), ...(o.crop2 ?? crop), -w / 2, -h / 2, w, h); cv.globalAlpha = 1; }
  if (o.tint) { cv.fillStyle = o.tint; cv.fillRect(-w / 2, -h / 2, w, h); }
  const gl = cv.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); gl.addColorStop(0, 'rgba(255,255,255,0.05)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); cv.fillStyle = gl; cv.fillRect(-w / 2, -h / 2, w, h);
  cv.restore();
  rr(-w / 2, -h / 2, w, h, 26); cv.lineWidth = 2; cv.strokeStyle = o.border ?? rgba(C.line, 0.9); cv.stroke();
  cv.restore(); return h;
}
/** Confetti and sparks (fixed seed per burst). */
function burst(t, t0, x, y, o = {}) {
  const k = t - t0; if (k < 0 || k > (o.life ?? 2.4)) return; const r = rng(o.seed ?? 3), n = o.n ?? 90;
  cv.save();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * (o.spread ?? 2.6), v = (o.v ?? 1300) * (0.4 + r() * 0.8), g = o.g ?? 1500, spin = (r() - 0.5) * 14;
    const px = x + Math.cos(a) * v * k, py = y + Math.sin(a) * v * k + 0.5 * g * k * k, al = clamp(1 - k / (o.life ?? 2.4)) * (o.alpha ?? 1);
    const c = (o.cols ?? ['#26C281', '#7CFFB8', '#F5B014', '#FFFFFF', '#B5A2FF'])[i % (o.cols?.length ?? 5)];
    cv.globalAlpha = al; cv.fillStyle = c; cv.save(); cv.translate(px, py); cv.rotate(spin * k + i); cv.fillRect(-7, -3.5, 14 * (0.5 + 0.5 * Math.abs(Math.cos(spin * k * 2))), 7); cv.restore();
  }
  cv.restore();
}
const dipAt = (t, times, d = 0.09, a = 0.85) => { for (const c of times) { const k = 1 - Math.abs(t - c) / d; if (k > 0) { cv.fillStyle = `rgba(3,2,6,${a * k})`; cv.fillRect(0, 0, W, H); } } };
const flashAt = (t, t0, colr, d = 0.35, a = 0.6) => { const k = t - t0; if (k >= 0 && k < d) { cv.fillStyle = col(colr, a * (1 - k / d) ** 2); cv.fillRect(0, 0, W, H); } };
