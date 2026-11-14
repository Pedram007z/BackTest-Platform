// k28 · «نکنه استراتژی سوددهت فقط توی ذهنت سوددهه؟» (dialog #2), a cinematic 3D chart world on the user's take at its
// normal speed (three.js). No presenter: the camera flies through a landscape of glowing 3D candles (a sample chart,
// labelled «نمودار نمونه»), from a perfect equity line of light «in your head» down to the chart, where hindsight plants
// a buy flag at the low and a sell flag at the high; then a wall of fog swallows the future («اون موقع نمی‌دونستی»),
// lifts to show every strategy looking profitable when the future is visible, and slams down again for the real test.
// BacktestLab rises as a giant screen showing the real gold replay (k13's screens) while the candles come out of the fog
// one by one; twenty trade tokens drop for the week's challenge; the close is extruded 3D type. Word-by-word subtitles
// run on a pill near the bottom, and the key words appear as solid extruded Persian type in the world.
// window.seek(t) draws time t; window.cover() draws the cover.
const { THREE, RoundedBoxGeometry, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, BokehPass, OutputPass, ShaderPass } = window.T3;
const W = 1080, H = 1920, CX = 540, U = 0.0038, DIST = 14, V3 = THREE.Vector3;
const D = window.DATA, ws = (i) => D.w[i][0], we = (i) => D.w[i][1], END = D.end, DUR = D.dur;
const RED = '#FF4D5E', LIME = '#C6F24E', VIO = '#6C47FF', GREEN = '#2FD67B', AMB = '#FFB020', WHITE = '#FFFFFF', INK = '#0B0C10';
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const oCub = (k) => 1 - (1 - cl(k)) ** 3, ioCub = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const spring = (dt, w = 13, z = 0.5) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const pxw = (x, y) => new V3((x - CX) * U, (960 - y) * U, 0);   // a point of the 1080×1920 design to a station's plane

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('g'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const ENV = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#07080D'); scene.fog = new THREE.Fog('#07080D', 16, 44); scene.environment = ENV; scene.environmentIntensity = 0.35;
const camera = new THREE.PerspectiveCamera(32, W / H, 0.5, 200);

// ---------- materials ----------
const MAT = new Map();
const std = (c, r = 0.4, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.05, ...o });
const glow = (c, k = 1.6) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.4 });
function faceSide(face) { if (MAT.has(face)) return MAT.get(face); const c = new THREE.Color(face), s = c.clone().multiplyScalar(0.42); const m = [std(c, 0.3), std(s, 0.5)]; MAT.set(face, m); return m; }
const DIM = [std('#4A4660', 0.5), std('#211E2E', 0.6)];
const mesh = (geo, mat, p = [0, 0, 0], r = [0, 0, 0]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.castShadow = true; m.receiveShadow = true; return m; };
const rbox = (w, h, d, rad, mat, p, r) => mesh(new RoundedBoxGeometry(w, h, d, 4, rad), mat, p, r);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`;

// ---------- extruded Persian type ----------
// the word is drawn on a canvas (so it is shaped like any Persian text), its alpha traced into closed outlines with
// marching squares, the outlines simplified, sorted into shapes and holes by nesting, and extruded with a bevel
const GEO = new Map();
function rdp(pts, eps) { if (pts.length < 3) return pts; const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let md = 0, mi = -1; const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; if (d > md) { md = d; mi = i; } }
    if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return pts.filter((_, i) => keep[i]); }
const area = (p) => { let s = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) s += (p[j][0] - p[i][0]) * (p[j][1] + p[i][1]); return s / 2; };
function inside(pt, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c; } return c; }
function outlines(s, FS) {
  const m = document.createElement('canvas').getContext('2d'); m.font = FONT(FS); m.direction = 'rtl'; m.textAlign = 'center'; const mt = m.measureText(s), pad = 6;
  const L = Math.ceil(mt.actualBoundingBoxLeft), R = Math.ceil(mt.actualBoundingBoxRight), A = Math.ceil(mt.actualBoundingBoxAscent), De = Math.ceil(mt.actualBoundingBoxDescent);
  const w = L + R + 2 * pad, h = A + De + 2 * pad, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.font = FONT(FS); g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#fff'; g.fillText(s, pad + L, pad + A);
  const img = g.getImageData(0, 0, w, h).data, v = new Float32Array(w * h); for (let i = 0; i < w * h; i++) v[i] = img[i * 4 + 3] / 255;
  const nb = new Int32Array(w * h * 4).fill(-1), P = new Float32Array(w * h * 4);   // per edge id: two neighbours, and its point
  const link = (a, b) => { nb[a * 2] < 0 ? (nb[a * 2] = b) : (nb[a * 2 + 1] = b); nb[b * 2] < 0 ? (nb[b * 2] = a) : (nb[b * 2 + 1] = a); };
  const hE = (x, y) => { const id = (y * w + x) * 2, a = v[y * w + x], b = v[y * w + x + 1]; P[id * 2] = x + (0.5 - a) / (b - a); P[id * 2 + 1] = y; return id; };
  const vE = (x, y) => { const id = (y * w + x) * 2 + 1, a = v[y * w + x], b = v[(y + 1) * w + x]; P[id * 2] = x; P[id * 2 + 1] = y + (0.5 - a) / (b - a); return id; };
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const tl = v[y * w + x] >= 0.5, tr = v[y * w + x + 1] >= 0.5, br = v[(y + 1) * w + x + 1] >= 0.5, bl = v[(y + 1) * w + x] >= 0.5, k = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0);
    if (k === 0 || k === 15) continue;
    const T = () => hE(x, y), B = () => hE(x, y + 1), Lf = () => vE(x, y), Rt = () => vE(x + 1, y), mid = (v[y * w + x] + v[y * w + x + 1] + v[(y + 1) * w + x + 1] + v[(y + 1) * w + x]) / 4 >= 0.5;
    switch (k) { case 1: case 14: link(Lf(), B()); break; case 2: case 13: link(B(), Rt()); break; case 3: case 12: link(Lf(), Rt()); break; case 4: case 11: link(T(), Rt()); break;
      case 6: case 9: link(T(), B()); break; case 7: case 8: link(T(), Lf()); break;
      case 5: if (mid) { link(T(), Lf()); link(B(), Rt()); } else { link(T(), Rt()); link(Lf(), B()); } break;
      case 10: if (mid) { link(T(), Rt()); link(Lf(), B()); } else { link(T(), Lf()); link(B(), Rt()); } break; }
  }
  const seen = new Uint8Array(w * h * 2), loops = [];
  for (let s0 = 0; s0 < w * h * 2; s0++) { if (nb[s0 * 2] < 0 || seen[s0]) continue; const loop = []; let prev = -1, cur = s0;
    while (cur >= 0 && !seen[cur]) { seen[cur] = 1; loop.push([P[cur * 2], P[cur * 2 + 1]]); const n0 = nb[cur * 2], n1 = nb[cur * 2 + 1], nx = n0 !== prev ? n0 : n1; prev = cur; cur = nx; }
    if (loop.length > 6) { let far = 0, fd = 0; loop.forEach((q, j) => { const d = Math.hypot(q[0] - loop[0][0], q[1] - loop[0][1]); if (d > fd) { fd = d; far = j; } });   // a closed loop: simplify its two halves
      const sp = rdp(loop.slice(0, far + 1), 0.45).concat(rdp(loop.slice(far).concat([loop[0]]), 0.45).slice(1, -1)); if (sp.length >= 3 && Math.abs(area(sp)) > 6) loops.push(sp); } }
  const depth = loops.map((p, i) => loops.reduce((n, q, j) => n + (j !== i && Math.abs(area(q)) > Math.abs(area(p)) && inside(p[0], q) ? 1 : 0), 0));
  return { loops, depth, w, h, ox: pad + L, oy: pad + A };
}
/** an extruded word: size is its font size in design pixels (1080 wide); returns { geo, w } in world units */
function word3d(s, size, dk = 0.32) {
  const key = s + '|' + size + '|' + dk; if (GEO.has(key)) return GEO.get(key);
  const FS = 180, o = outlines(s, FS), k = (size * U) / FS, X = (p) => (p[0] - o.w / 2) * k, Y = (p) => (o.oy - p[1]) * k - size * U * 0.28;
  const shapes = [];
  o.loops.forEach((p, i) => { if (o.depth[i] % 2) return; const sh = new THREE.Shape(p.map((q) => new THREE.Vector2(X(q), Y(q))));
    o.loops.forEach((hq, j) => { if (o.depth[j] === o.depth[i] + 1 && inside(hq[0], p)) sh.holes.push(new THREE.Path(hq.map((q) => new THREE.Vector2(X(q), Y(q))))); }); shapes.push(sh); });
  const d = size * U * dk, geo = new THREE.ExtrudeGeometry(shapes, { depth: d, bevelEnabled: true, bevelThickness: size * U * 0.035, bevelSize: size * U * 0.016, bevelSegments: 2, curveSegments: 1 });
  geo.translate(0, 0, -d); const r = { geo, w: (o.w - 12) * k, h: size * U }; GEO.set(key, r); return r;
}

const GRADE = { uniforms: { tDiffuse: { value: null }, time: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv;
  void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb; float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * vec3(0.9, 0.98, 1.1), (1.0 - l) * 0.3); col = (col - 0.5) * 1.06 + 0.5; vec2 d = (vUv - 0.5) * vec2(1.0, 1.35); col *= mix(0.6, 1.0, smoothstep(0.95, 0.3, length(d)));
    float n = fract(sin(dot(vUv * vec2(1080.0, 1920.0) + time, vec2(12.9898, 78.233))) * 43758.5453); col += (n - 0.5) * 0.035; gl_FragColor = vec4(col, c.a); }` };


// ================= k28 · the world =================
// ---------- the sample chart: 140 candles along x (time), price on y ----------
const NCH = 140, SP = 0.5, X = (i) => i * SP, Y = (p) => (p - 100) * 0.42, NOW0 = 78;
const CHART = (() => { const out = []; let p = 104; const seg = [[16, -0.15], [12, -0.75], [10, 0.1], [18, 1.15], [8, -0.1], [14, -0.95], [12, 0.6], [16, -0.5], [14, 0.85], [20, -0.2]]; let k = 0;
  seg.forEach(([n, d]) => { for (let i = 0; i < n; i++, k++) { const o = p, c = p + d + (rnd(k * 7 + 3) - 0.5) * 2.0, hi = Math.max(o, c) + 0.3 + rnd(k * 3) * 0.8, lo = Math.min(o, c) - 0.3 - rnd(k * 5) * 0.8; out.push({ o, h: hi, l: lo, c }); p = c; } });
  return out; })();
const LOWI = (() => { let m = 10; for (let i = 10; i < 50; i++) if (CHART[i].l < CHART[m].l) m = i; return m; })(), HIGHI = (() => { let m = 45; for (let i = 45; i < NOW0; i++) if (CHART[i].h > CHART[m].h) m = i; return m; })();
const FLOOR = -7.5;
const yS = (i) => { let s = 0, n = 0; for (let k = Math.max(0, Math.round(i) - 3); k <= Math.min(NCH - 1, Math.round(i) + 3); k++) { s += Y(CHART[k].c); n++; } return s / n; };   // the chart's smoothed height at candle i
const YMAX = Math.max(...CHART.map((c) => Y(c.h)));
// the corrected words, for the subtitles (index = the word they start on)
const TOK = [['نکنه', 0], ['استراتژی', 1], ['سوددهت', 2], ['فقط', 3], ['توی', 4], ['ذهنت', 5], ['سوددهه؟', 6], ['یه', 7], ['چارت', 8], ['گذشته', 9], ['رو', 10], ['باز', 11], ['کن.', 12],
  ['ورودها', 13], ['چقدر', 14], ['واضحن،', 15], ['نه؟', 17], ['اینجا', 18], ['می‌خریدم،', 19], ['اینجا', 21], ['می‌فروختم.', 22], ['ولی', 24], ['تو', 25], ['الان', 26], ['می‌دونی', 27], ['بعدش', 29], ['چی', 30], ['شد.', 31],
  ['اون', 32], ['موقع', 33], ['نمی‌دونستی.', 34], ['روی', 36], ['چارتی', 37], ['که', 38], ['آینده‌ش', 39], ['پیداست،', 40], ['هر', 41], ['استراتژی‌ای', 42], ['سودده', 43], ['به', 44], ['نظر', 45], ['میاد.', 46],
  ['تست', 47], ['واقعی', 48], ['وقتیه', 49], ['که', 50], ['آینده', 51], ['رو', 52], ['نبینی.', 53], ['بک‌تست‌لب', 54], ['دقیقاً', 56], ['همینه.', 57], ['می‌ری', 58], ['به', 59], ['یه', 60], ['روز', 61], ['از', 62], ['گذشته،', 63],
  ['بازار', 64], ['از', 65], ['همون‌جا', 66], ['جلو', 67], ['میاد', 68], ['و', 69], ['تو', 70], ['باید', 71], ['قبل', 72], ['از', 73], ['دیدن', 74], ['ادامه‌ش', 75], ['تصمیم', 76], ['بگیری.', 77],
  ['این', 78], ['هفته', 79], ['۲۰', 80], ['تا', 80], ['معامله', 81], ['این‌طوری', 82], ['بگیر', 83], ['و', 84], ['ببین', 85], ['هنوز', 86], ['سودده', 87], ['هست', 88], ['یا', 89], ['نه.', 90], ['شروعش', 91], ['رایگانه.', 92], ['لینک', 93], ['توی', 94], ['بیو.', 95]];
const CHUNKS = []; { let cur = []; TOK.forEach((tk, j) => { cur.push(tk); if (/[،.؟]$/.test(tk[0]) || cur.length >= 5 || j === TOK.length - 1) { CHUNKS.push(cur); cur = []; } }); }

// ---------- building the world ----------
const TEX = {}, W3 = {};
let RIM, bodies, wicks, nowPlane, dream, sparks, flags = [], fog = [], strat = [], screenG, screenM, cal, calPages = [], buttons, tokens = [], qMark, cta, endG, KEY;
const tmp = new THREE.Object3D(), colG = new THREE.Color(GREEN), colR = new THREE.Color(RED);
function noiseTex(seed) { // soft clouds: blobs accumulated on their own canvas, then cut into a violet sheet with a short soft left edge
  const m = document.createElement('canvas'); m.width = 512; m.height = 256; const mg = m.getContext('2d');
  for (let i = 0; i < 160; i++) { const x = rnd(i * 3 + seed) * 512, y = rnd(i * 7 + seed) * 256, r = 30 + rnd(i * 11 + seed) * 80, rg = mg.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(0,0,0,0.5)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); mg.fillStyle = rg; mg.fillRect(x - r, y - r, 2 * r, 2 * r); }
  return canvasTex(512, 256, (g, w, h) => { g.fillStyle = 'rgba(178,164,232,0.96)'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.6; g.drawImage(m, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out'; const holes = document.createElement('canvas'); holes.width = 512; holes.height = 256; const hg = holes.getContext('2d');
    for (let i = 0; i < 40; i++) { const x = rnd(i * 13 + seed + 5) * 512, y = rnd(i * 17 + seed) * 256, r = 20 + rnd(i * 19 + seed) * 60, rg = hg.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(0,0,0,0.45)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); hg.fillStyle = rg; hg.fillRect(x - r, y - r, 2 * r, 2 * r); } g.drawImage(holes, 0, 0); }); }
function label3d(s, size, face, plate) { const g = new THREE.Group(), w = word3d(s, size, 0.25); g.add(mesh(w.geo, faceSide(face))); if (plate) { const pw = w.w + size * U * 0.5, ph = size * U * 1.35; g.add(rbox(pw, ph, size * U * 0.22, size * U * 0.14, std(plate, 0.35), [0, 0, -size * U * 0.38])); } g.userData.w = w.w; return g; }
function planeTex(tex, w, h) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })); }
function build() {
  scene.fog = new THREE.Fog('#07080D', 22, 70);
  KEY = new THREE.DirectionalLight('#FFF3E6', 2.6); KEY.position.set(10, 20, 20); scene.add(KEY, KEY.target, new THREE.HemisphereLight('#8A90C0', '#0A0A10', 0.9)); RIM = new THREE.PointLight('#8E6BFF', 80, 30, 1.6); scene.add(RIM);
  // the floor: a dark grid
  const grid = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#0B0C14'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(108,71,255,0.35)'; g.lineWidth = 3; for (let k = 0; k <= 8; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, k * 64); g.lineTo(w, k * 64); g.stroke(); } });
  grid.wrapS = grid.wrapT = THREE.RepeatWrapping; grid.repeat.set(40, 20); const fl = mesh(new THREE.PlaneGeometry(200, 100), std('#FFFFFF', 0.35, { map: grid, metalness: 0.5 }), [60, FLOOR, -10], [-Math.PI / 2, 0, 0]); scene.add(fl);
  // the candles: instanced bodies and wicks, glowing
  bodies = new THREE.InstancedMesh(new RoundedBoxGeometry(0.32, 1, 0.32, 2, 0.04), new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.1, envMapIntensity: 0.8 }), NCH);   // solid lit candles
  wicks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 1, 0.05), new THREE.MeshStandardMaterial({ roughness: 0.5 }), NCH);
  CHART.forEach((c, i) => { const col = c.c >= c.o ? colG : colR; bodies.setColorAt(i, col); wicks.setColorAt(i, col); }); scene.add(bodies, wicks);
  // the «now» slice
  nowPlane = new THREE.Group(); nowPlane.add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 34, 0.035), new THREE.MeshBasicMaterial({ color: '#B8D84A' })).translateY(4));   // a thin «now» line, not bright enough to bloom
  scene.add(nowPlane);
  // the perfect line «in your head»
  const dp = []; for (let i = 0; i <= 60; i++) { const u = i / 60; dp.push(new V3(4 + u * 36, 20 + u * 9 + Math.sin(u * 13) * 0.5, -1)); } dream = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(dp), 400, 0.12, 12), glow(GREEN, 2.0)); dream.userData.n = dream.geometry.index.count; scene.add(dream);
  { const n = 160, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = rnd(i); p[i * 3] = 4 + u * 36 + (rnd(i * 2) - 0.5) * 2; p[i * 3 + 1] = 20 + u * 9 + (rnd(i * 3) - 0.5) * 3; p[i * 3 + 2] = -1 + (rnd(i * 5) - 0.5) * 3; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); sparks = new THREE.Points(g, new THREE.PointsMaterial({ color: LIME, size: 0.12, transparent: true, opacity: 0, depthWrite: false })); scene.add(sparks); }
  W3.q = label3d('سودده؟', 300, WHITE, VIO); W3.q.position.set(38, 30.8, -1); scene.add(W3.q);
  // hindsight: a buy flag at the low, a sell flag at the high
  [[LOWI, 'خرید', GREEN, 1], [HIGHI, 'فروش', RED, 1]].forEach(([i, s, col, side]) => { const g = new THREE.Group(), c = CHART[i], y0 = side < 0 ? Y(c.l) - 0.4 : Y(c.h) + 0.4;
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 12), std('#D8D8E0', 0.3, { metalness: 0.6 }), [0, side * 1.1, 0])); const lb = label3d(s, 150, side < 0 ? INK : WHITE, col); lb.position.set(0.8, side * 2.0, 0.1); g.add(lb);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 30, 24, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.08, toneMapped: false, depthWrite: false, side: THREE.DoubleSide })).translateY(side * 15));
    g.position.set(X(i), y0, 0.3); g.rotation.y = -0.75; scene.add(g); flags.push(g); });
  // the fog over the future: soft layers in front of and behind the candles
  // slices of mist across the chart, facing back along it (the diagonal camera sees them stacked into a wall)
  for (let k = 0; k < 10; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 30), new THREE.MeshBasicMaterial({ map: noiseTex(k * 31), transparent: true, opacity: k < 3 ? 0.9 : 0.8, depthWrite: false, color: '#FFFFFF', side: THREE.DoubleSide })); m.rotation.y = -Math.PI / 2; m.position.set(0, 4, 0); m.renderOrder = 3; scene.add(m); fog.push(m); }
  // every strategy looks profitable when the future is visible: three lines, each ending on a check
  [[VIO, 0.6], [AMB, -0.4], [LIME, 0.1]].forEach(([col, off], j) => { const pts = []; for (let i = 0; i <= 50; i++) { const u = i / 50; pts.push(new V3(2 + u * 64, lerp(yS(2) - 1, YMAX + 2.5, u) + Math.sin(u * 9 + j * 2) * 1.6 + off * 1.5, 1.2 + j * 0.3)); }
    const tb = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, 0.09, 10), glow(col, 1.4)); tb.userData.n = tb.geometry.index.count; scene.add(tb);
    const md = new THREE.Group(); md.add(mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.2, 40), std(col, 0.3), [0, 0, 0], [Math.PI / 2, 0, 0])); md.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new V3(-0.32, 0, 0.12), new V3(-0.08, -0.25, 0.12), new V3(0.34, 0.25, 0.12)]), 30, 0.07, 8), std(INK, 0.4)));
    const lb = label3d('سودده', 140, INK, WHITE); lb.position.set(0, -1.15, 0); md.add(lb); md.position.copy(pts[50]).add(new V3(0.6, 0.9 + j * 0.1, 0)); md.rotation.y = -0.6; scene.add(md); strat.push({ tb, md }); });
  // BacktestLab: a giant screen showing the real replay
  screenG = new THREE.Group(); screenG.scale.setScalar(0.8); screenG.add(rbox(9.3, 5.95, 0.3, 0.25, std('#15151E', 0.4), [0, 0, -0.18])); screenM = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 9.0 * (1000 / 1540)), new THREE.MeshBasicMaterial({ toneMapped: false })); screenG.add(screenM);
  const ft = planeTex(TEX.ftex, 4.6, 0.5); ft.position.set(0, -3.4, 0.05); screenG.add(ft);
  if (TEX.icon) { const ic = planeTex(TEX.icon, 1.3, 1.3); ic.position.set(4.6, 3.0, 0.2); screenG.add(ic); }
  screenG.position.set(48, yS(NOW0) + 5, -3.5); scene.add(screenG);
  // the calendar flipping back
  cal = new THREE.Group(); cal.add(rbox(2.6, 2.4, 0.3, 0.12, std(WHITE, 0.5), [0, -0.15, -0.2])); cal.add(rbox(2.6, 0.6, 0.34, 0.12, std(RED, 0.4), [0, 1.0, -0.18]));
  ['امروز', 'هفته‌ی پیش', 'ماه پیش', '۲۵ فروردین ۱۴۰۴'].forEach((s, i) => { const t = canvasTex(512, 400, (g, w, h) => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121F'; g.font = FONT(i === 3 ? 62 : 84); g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, w / 2, h / 2); });
    const pg = new THREE.Group(), m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.9), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.7 })); m.position.y = -0.95; pg.add(m); pg.position.set(0, 0.7, -0.02 + (3 - i) * 0.004); cal.add(pg); calPages.push(pg); });
  cal.position.set(41, yS(80) + 1.8, 4.5); cal.rotation.y = -0.2; scene.add(cal);
  // the buy and sell buttons
  buttons = new THREE.Group(); [['خرید', GREEN, INK, 1.5], ['فروش', RED, WHITE, -1.5]].forEach(([s, col, fg, x]) => { const b = new THREE.Group(); b.add(rbox(2.6, 1.05, 0.5, 0.3, std(col, 0.35))); const lb = label3d(s, 190, fg); lb.position.z = 0.3; b.add(lb); b.position.x = x; buttons.add(b); }); scene.add(buttons);
  // twenty trade tokens
  for (let i = 0; i < 20; i++) { const face = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#2A2440'; g.fillRect(0, 0, w, h); g.fillStyle = '#FFFFFF'; g.font = FONT(130); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((i + 1).toLocaleString('fa-IR'), w / 2, h / 2 + 8); });
    const m = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 40), [std('#6C47FF', 0.35), std('#2A2440', 0.5), std('#2A2440', 0.5)]); m.rotation.x = Math.PI / 2; const fp = planeTex(face, 0.82, 0.82); fp.position.z = 0.1; const g = new THREE.Group(); g.add(m, fp); scene.add(g); tokens.push(g); }
  qMark = label3d('؟', 600, LIME); scene.add(qMark);
  cta = new THREE.Group(); const c1 = label3d('شروعش', 170, WHITE), c2 = label3d('رایگانه!', 220, INK, LIME); c1.position.y = 1.0; c2.position.y = 0; cta.add(c1, c2); const lk = planeTex(TEX.link, 2.6, 0.58); lk.position.set(0, -1.2, 0.2); cta.add(lk); if (TEX.icon) { const ic = planeTex(TEX.icon, 1.05, 1.05); ic.position.set(0, 2.25, 0); cta.add(ic); } scene.add(cta);
  endG = new THREE.Group(); if (TEX.icon) { const ic = planeTex(TEX.icon, 1.3, 1.3); ic.position.y = 1.05; endG.add(ic); } if (TEX.word) { const a = TEX.word.image.width / TEX.word.image.height, wd = planeTex(TEX.word, 2.3, 2.3 / a); wd.position.y = -0.2; endG.add(wd); }
  const e1 = planeTex(TEX.endc, 3.0, 0.55); e1.position.y = -1.05; endG.add(e1); scene.add(endG);
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }); composer = new EffectComposer(renderer, rt); composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera)); bokeh = new BokehPass(scene, camera, { focus: 14, aperture: 0.0025, maxblur: 0.008 }); composer.addPass(bokeh);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.6, 0.85)); composer.addPass(new OutputPass()); composer.addPass(new ShaderPass(GRADE));
}
let composer = null, bokeh = null;

// ---------- the camera's path ----------
const K_ = (t, x, y, z, lx, ly, lz) => [t, [x, y, z], [lx, ly, lz]];
// along the chart the camera looks diagonally (the candles recede into depth, so a whole swing fits the tall frame);
// the screen, the calendar, the buttons, the tokens and the close are seen face on
const KEYS = () => { const N = X(NOW0), sY = yS(NOW0) + 5, bY = yS(108) - 4, tX = X(112), tY = yS(112);
  const DG = (t, i, dy = 0.4, o = [-7.5, 2.8, 7.5]) => { const x = X(i), y = yS(i) + dy; return K_(t, x + o[0], y + o[1], o[2], x, y, 0); };
  return [
  K_(0, 21, 27, 17, 22, 25, -1), K_(ws(6) + 0.3, 23, 28.5, 14.5, 24, 26.5, -1),
  DG(ws(7) + 0.8, 22, 0.5, [-10, 4.5, 10]), DG(ws(12) + 0.3, 24, 0.5, [-9.5, 4, 9.5]),
  DG(ws(13) + 0.3, LOWI, 1.0), DG(ws(20) + 0.2, LOWI + 3, 1.2), DG(ws(22) + 0.3, HIGHI, 1.7), DG(ws(24), HIGHI + 3, 1.6),
  DG(ws(29), NOW0, 0.5, [-7, 2.6, 7]), DG(ws(36), NOW0 + 1, 0.5, [-8, 3, 8]),
  K_(ws(38) + 0.3, 35 - 24, YMAX * 0.4 + 12, 30, 35, YMAX * 0.4, 0), K_(ws(46) + 0.2, 36 - 24, YMAX * 0.4 + 13, 31, 36, YMAX * 0.4, 0),
  DG(ws(47) + 0.35, NOW0, 0.4, [-6, 2.2, 6.5]), DG(ws(53) + 0.2, NOW0, 0.5, [-5.5, 2.1, 6]),
  K_(ws(54) + 0.45, 48, sY, 20.5, 48, sY, -3.5), K_(ws(58) - 0.1, 48, sY - 0.2, 20, 48, sY - 0.2, -3.5),
  K_(ws(63) + 0.2, 41, yS(80) + 2, 13.5, 41, yS(80) + 1.6, 4.5), K_(ws(64) + 0.5, 48, sY - 1.8, 22, 48, sY - 2.2, -1), K_(ws(76) - 0.2, 48.5, sY - 1.8, 21.5, 48.5, sY - 2.2, -1),
  K_(ws(77) + 0.2, X(108) - 3, bY + 1, 23, X(108) - 3, bY, 5),
  K_(ws(78) + 0.35, tX, tY - 2.5, 21, tX, tY - 3.6, 2), K_(ws(90), tX, tY - 2.2, 20.5, tX, tY - 3.4, 2),
  K_(ws(91) + 0.35, tX, tY + 0.9, 16, tX, tY + 0.9, 2.5), K_(END, tX, tY + 0.9, 15.5, tX, tY + 1.0, 2.5), K_(DUR + 1, tX, tY + 1.0, 15, tX, tY + 1.0, 2.5)]; };
let PATH = null;
function camAt(t) { const K = PATH; let k = 0; while (k < K.length - 2 && t >= K[k + 1][0]) k++; const [t0, p0, l0] = K[k], [t1, p1, l1] = K[k + 1], e = ioCub(cl((t - t0) / (t1 - t0)));
  return { pos: new V3(...p0).lerp(new V3(...p1), e), look: new V3(...l0).lerp(new V3(...l1), e) }; }

// ---------- the timeline ----------
const nowIdx = (t) => (t < ws(64) ? NOW0 : lerp(NOW0, 108, cl((t - ws(64)) / (ws(76) - ws(64)))));
function fogX(t) { const N = X(NOW0) + 0.2, F = 140;
  if (t < ws(33) - 0.1) return F; if (t < ws(38)) return lerp(F, N, oCub(k01(t, ws(33) - 0.1, 0.7))); if (t < ws(51) - 0.12) return lerp(N, F, oCub(k01(t, ws(38), 0.8)));
  if (t < ws(64)) return lerp(F, N, oCub(k01(t, ws(51) - 0.12, 0.35))); return X(nowIdx(t)) + 0.2; }
function frame(t) {
  // the candles: rising from the floor in a wave, the future only up to «now» once the replay runs
  const rise = ws(7) - 0.1, ni = nowIdx(t);
  const fxa = fogX(t);
  for (let i = 0; i < NCH; i++) { const c = CHART[i]; let g = oCub(k01(t, rise + i * 0.007, 0.45)); if (i >= NOW0 && t < ws(64)) g *= 1 - oCub(cl((X(i) + 1.0 - fxa) / 1.5));   // a candle sinks as the fog's front passes it if (t >= ws(64) && i >= ni) g = 0; if (t >= ws(64) && i < ni && i >= NOW0) g = oCub(cl((ni - i) * 1.5));
    const yo = Y(c.o), yc = Y(c.c), mid = (yo + yc) / 2, h = Math.max(0.06, Math.abs(yc - yo)), wm = (Y(c.h) + Y(c.l)) / 2, wh = Y(c.h) - Y(c.l);
    tmp.position.set(X(i), lerp(FLOOR, mid, g), 0); tmp.scale.set(g > 0 ? 1 : 0, Math.max(0.001, h * g), g > 0 ? 1 : 0); tmp.updateMatrix(); bodies.setMatrixAt(i, tmp.matrix);
    tmp.position.set(X(i), lerp(FLOOR, wm, g), 0); tmp.scale.set(g > 0 ? 1 : 0, Math.max(0.001, wh * g), g > 0 ? 1 : 0); tmp.updateMatrix(); wicks.setMatrixAt(i, tmp.matrix); }
  bodies.instanceMatrix.needsUpdate = wicks.instanceMatrix.needsUpdate = true;
  // the line in your head
  dream.visible = t < ws(13); dream.geometry.setDrawRange(0, Math.floor(dream.userData.n * k01(t, 0.25, 2.7) / 6) * 6); sparks.material.opacity = cl((t - 2.6) * 2) * (1 - k01(t, ws(7), 0.6)) * 0.9; sparks.rotation.y = Math.sin(t) * 0.02;
  { const s = spring(t - ws(6) + 0.15, 10, 0.5) * (1 - k01(t, ws(8), 0.4)); W3.q.visible = s > 0.01; W3.q.scale.setScalar(cl(s, 0, 1.2)); W3.q.rotation.y = Math.sin(t * 1.5) * 0.2; }
  // hindsight flags
  flags.forEach((f, j) => { const s = spring(t - [ws(18), ws(21)][j] + 0.1, 10, 0.5) * (1 - k01(t, ws(54), 0.4)); f.visible = s > 0.01; f.scale.setScalar(cl(s, 0, 1.15)); });
  // the fog
  const fx = fogX(t); fog.forEach((m, k) => { m.visible = fx < 130 && t >= rise; m.position.x = fx + 0.3 + k * 1.1; m.material.map.offset.x = -t * 0.01 * (k + 1); });
  { const on = fx < 100 && t < ws(54); W3.fut.visible = on; W3.fut.position.set(fx + 2.6, yS(NOW0) + 1.8, 3.4); W3.fut.rotation.y = -0.7; W3.fut.scale.setScalar(on ? 1 : 0.001); }
  // the «now» slice
  nowPlane.visible = (t >= ws(24) - 0.07 && t < ws(38)) || (t >= ws(47) - 0.07 && t < ws(78)); nowPlane.position.set(X(t >= ws(64) ? ni : NOW0) - 0.25, 0, 0.6);
  // every strategy looks profitable
  strat.forEach(({ tb, md }, j) => { const on = t >= ws(41) - 0.1 && t < ws(47) + 0.2, a = k01(t, ws(41) - 0.1 + j * 0.15, 1.3); tb.visible = on; tb.geometry.setDrawRange(0, Math.floor(tb.userData.n * a / 6) * 6); const s = spring(t - ws(43) - j * 0.15, 11, 0.45); md.visible = on && s > 0.01; md.scale.setScalar(cl(s, 0, 1.2)); });
  // the giant screen
  { const s = spring(t - ws(54) + 0.1, 7, 0.65); screenG.visible = s > 0.01 && t < ws(78); screenG.position.y = lerp(-14, yS(NOW0) + 5, cl(s, 0, 1.05)); const keys = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`), f = cl((t - ws(64)) / (ws(77) - ws(64))); screenM.material.map = TEX[keys[Math.min(15, Math.floor(f * 16))]]; }
  // the calendar flipping back
  { const s = spring(t - ws(58) + 0.1, 11, 0.55); cal.visible = s > 0.01 && t < ws(66); cal.scale.setScalar(cl(s, 0, 1.15)); const span = ws(63) - ws(58); calPages.forEach((pg, i) => { pg.rotation.x = i < 3 ? -Math.PI * oCub(k01(t, ws(58) + 0.15 + i * span / 3, 0.35)) : 0; pg.visible = pg.rotation.x > -Math.PI / 2; }); cal.scale.multiplyScalar(0.85); }
  // the buttons
  { const s = spring(t - ws(76) + 0.12, 10, 0.5); buttons.visible = s > 0.01 && t < ws(79); buttons.position.set(X(108) - 3, lerp(yS(108) - 10, yS(108) - 4, cl(s, 0, 1.1)), 5); buttons.children.forEach((b, j) => { b.scale.setScalar(1 + 0.04 * Math.sin(t * 8 + j)); }); }
  // twenty tokens and «؟»
  tokens.forEach((g, i) => { const c = i % 5, r = Math.floor(i / 5), t0 = ws(80) - 0.05 + i * 0.05, e = t - t0, y0 = yS(112) - 2.0 - r * 1.15; g.visible = e > 0 && t < ws(91) + 0.4;
    const drop = cl(e / 0.35), y = drop < 1 ? lerp(y0 + 8, y0, drop * drop) : y0 + Math.abs(Math.sin((e - 0.35) * 10)) * 0.3 * Math.exp(-(e - 0.35) * 6); g.position.set(X(112) + (2 - c) * 1.15, y - 6 * oCub(k01(t, ws(91), 0.4)), 2); g.rotation.y = Math.sin(t * 2 + i) * 0.2; });
  { const s = spring(t - ws(87) + 0.08, 10, 0.45); qMark.visible = s > 0.01 && t < ws(91) + 0.2; qMark.scale.setScalar(cl(s, 0, 1.2)); qMark.position.set(X(112), yS(112) - 0.3, 2); qMark.rotation.y = Math.sin(t * 2) * 0.3; }
  // the close and the end card
  { const s = spring(t - ws(91) + 0.1, 9, 0.5); cta.visible = s > 0.01 && t < END; cta.scale.setScalar(cl(s, 0, 1.1)); cta.position.set(X(112), yS(112) + 0.6, 2.5); cta.rotation.y = Math.sin(t * 1.2) * 0.08; }
  { const s = spring(t - END, 9, 0.55); endG.visible = s > 0.01; endG.scale.setScalar(cl(s, 0, 1.1)); endG.position.set(X(112), yS(112) + 1.0, 2.5); }
  // the camera
  const cam = camAt(t); camera.position.copy(cam.pos); camera.lookAt(cam.look); bokeh.uniforms.focus.value = cam.pos.distanceTo(cam.look);
  KEY.position.copy(cam.pos).add(new V3(-6, 10, 4)); KEY.target.position.copy(cam.look); RIM.position.copy(cam.look).add(new V3(5, 4, -6));
  composer.passes[composer.passes.length - 1].uniforms.time.value = (t * 30) % 100; composer.render();
  overlay(t);
}
// ---------- the 2D overlay: subtitles, the sample label, the progress line ----------
const c2 = document.getElementById('c').getContext('2d');
function overlay(t) {
  c2.clearRect(0, 0, W, H);
  if (t >= ws(7) - 0.1 && t < ws(91)) { c2.save(); c2.font = FONT(26, 700); c2.direction = 'rtl'; c2.textAlign = 'right'; c2.fillStyle = 'rgba(255,255,255,0.5)'; c2.fillText('نمودار نمونه', W - 40, 80); c2.restore(); }
  if (t < ws(7)) { const fade = 1 - k01(t, ws(7) - 0.3, 0.25), lines = [[[['نکنه', 0, LIME], ['استراتژی', 1], ['سوددهت', 2, GREEN]], 330, 104], [[['فقط', 3], ['توی', 4], ['ذهنت', 5, '#B9A8FF']], 480, 120], [[['سوددهه؟', 6]], 650, 150]];
    c2.save(); c2.globalAlpha = fade; lines.forEach(([toks, y, size]) => { c2.font = FONT(size, 900); c2.direction = 'rtl'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; const gap = size * 0.28, wsz = toks.map(([s]) => c2.measureText(s).width), total = wsz.reduce((x, z) => x + z, 0) + gap * (toks.length - 1); let xr = CX + total / 2;
      toks.forEach(([s, wi, col], k) => { const on = t >= ws(wi) - 0.07, x = xr - wsz[k] / 2; xr -= wsz[k] + gap; c2.save(); c2.translate(x, y); const pk = on ? 1 + 0.12 * Math.sin(Math.PI * k01(t, ws(wi) - 0.07, 0.25)) : 1; c2.scale(pk, pk);
        c2.shadowColor = 'rgba(0,0,0,0.8)'; c2.shadowBlur = 30; c2.fillStyle = on ? (col ?? WHITE) : 'rgba(255,255,255,0.35)'; c2.fillText(s, 0, 0); c2.restore(); }); }); c2.restore(); }
  if (t >= ws(7) - 0.1 && t < END) { let ci = -1; CHUNKS.forEach((ch, k) => { if (t >= ws(ch[0][1]) - 0.1) ci = k; });
    if (ci >= 0) { const ch = CHUNKS[ci], next = CHUNKS[ci + 1], endT = next ? ws(next[0][1]) - 0.1 : END, a = Math.min(cl((t - ws(ch[0][1]) + 0.1) * 6), cl((endT - t) * 6 + 0.2));
      c2.save(); c2.globalAlpha = a; c2.font = FONT(58, 800); c2.direction = 'rtl'; const gap = 20, ws_ = ch.map(([s]) => c2.measureText(s).width), total = ws_.reduce((x, y) => x + y, 0) + gap * (ch.length - 1), y = 1480;
        c2.fillStyle = 'rgba(8,8,14,0.72)'; c2.beginPath(); c2.roundRect(CX - total / 2 - 36, y - 56, total + 72, 112, 56); c2.fill();
        let xr = CX + total / 2; ch.forEach(([s, wi], k) => { const on = t >= ws(wi) - 0.05; c2.fillStyle = on ? (TOK.findIndex((q) => q[1] === wi) >= 0 && t < (ch[k + 1] ? ws(ch[k + 1][1]) : endT) ? LIME : WHITE) : 'rgba(255,255,255,0.45)'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(s, xr - ws_[k] / 2, y + 4); xr -= ws_[k] + gap; }); c2.restore(); } }
  const pk = cl(t / END); c2.fillStyle = 'rgba(255,255,255,0.12)'; c2.fillRect(0, 0, W, 8); c2.fillStyle = LIME; c2.fillRect(W * (1 - pk), 0, W * pk, 8);
}
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(6) + 0.9); c2.clearRect(0, 0, W, 10); };
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A؟')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  const toTex = (im) => { if (!im) return null; const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; };
  const svgTex = async (src, size) => { const im = await load(src); if (!im) return null; const c = document.createElement('canvas'); const a = (im.width || 1) / (im.height || 1); c.width = size; c.height = Math.round(size / a); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  await Promise.all(Object.entries(window.IMGS).map(async ([k, s]) => { TEX[k] = toTex(await load(s)); }));
  TEX.icon = await svgTex(window.LOGO.icon, 512); TEX.word = await svgTex(window.LOGO.word, 1024);
  const pill = (s, size, bg, fg, w = 900, h = 200) => canvasTex(w, h, (g, W_, H_) => { if (bg) { g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, W_ - 8, H_ - 8, (H_ - 8) / 2); g.fill(); } g.fillStyle = fg; g.font = FONT(size, 800); g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, W_ / 2, H_ / 2 + size * 0.06); });
  TEX.ftex = pill('صفحه‌ی واقعی بک‌تست‌لب، بازپخش طلا', 52, null, 'rgba(255,255,255,0.75)', 1200, 130); TEX.link = pill('لینک توی بیو', 100, '#FFFFFF', '#6C47FF'); TEX.endc = pill('آینده رو نبین، تست کن', 96, '#C6F24E', '#0B0C10', 1100, 200);
  PATH = KEYS(); build(); W3.fut = label3d('آینده؟', 220, '#B9A8FF'); scene.add(W3.fut); frame(0); window.ready = true;
});
