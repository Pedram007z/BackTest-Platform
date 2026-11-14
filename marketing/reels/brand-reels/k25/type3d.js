// k25 · «چند بار باید ضرر کنی تا بفهمی استراتژی‌ات ایراد داره؟», dialog #5 («عدد توقف»), kinetic typography in real 3D
// on the user's take at its normal speed (three.js).
// Every word is solid extruded type: the browser shapes the Persian word on a canvas, its outline is traced (marching
// squares), and the outline is extruded with a bevel. So the letters have true depth, sides and lighting. Each word
// flips out of the dark as it is said; key words stand on a raised coloured plate. The ideas sit at stations on a slow
// spiral round the camera, and the camera whips round from one to the next:
//   - the hook: the whole question on screen from the first frame, each word lighting up and stepping forward as it is
//     said, red loss cubes tumbling into a pile;
//   - «جواب این سؤال باید قبل از اولین معامله نوشته شده باشه، نه وسط ضرر»: a note card writing itself, then a red
//     cross for «نه وسط ضرر»;
//   - «وسط ضرر، یا ترس می‌گه ولش کن، یا امید می‌گه یکی دیگه، جبران می‌شه»: two speech bubbles, red and amber;
//   - «حرفه‌ای‌ها قبل از شروع یه عدد توقف دارن»: a stop sign spinning in;
//   - «مثلاً: اگه افت حسابم از بیشترین افت بک‌تستم بیشتر شد…»: an example equity line drawing in 3D and crossing a red
//     limit plane (labelled «مثال»), then a pause sign and a magnifier;
//   - «حالا از کجا بیارمش؟»: a big «؟»;
//   - «توی بک‌تست‌لب…»: three floating panels, one per step: the strategy card, the real gold replay (k13's screens),
//     the real placed trade;
//   - «بخش آنالیزش…»: a simple analytics panel (drawn, labelled as a sketch) with the two numbers it shows;
//   - «فالو کن…»: a big 3D follow button pressed on the word; the end card.
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

// ---------- kinetic lines in 3D ----------
// a token: [text, word index (or [first, last]), style]; style: c (face colour), plate (a raised plate behind, in that
// colour), size, spin (spins in)
const Ln = (y, size, col, toks, o = {}) => ({ y, size, col, toks, ...o });
function buildLine(ln, group, karaoke) {
  const items = ln.toks.map(([s, wi, st = {}]) => { const size = st.size ?? ln.size, g = word3d(s, size); return { s, st, size, g, t0: ws(Array.isArray(wi) ? wi[0] : wi) - 0.08, m: st.plate ? size * U * 0.26 : 0 }; });
  const gap = ln.size * U * 0.28, total = items.reduce((a, k) => a + k.g.w + 2 * k.m, 0) + gap * (items.length - 1); let xr = total / 2;
  const base = pxw(CX, ln.y);
  return items.map((it, i) => { const x = xr - it.m - it.g.w / 2; xr -= it.g.w + 2 * it.m + gap;
    const holder = new THREE.Group(); holder.position.set(x, base.y, 0); group.add(holder); const pivot = new THREE.Group(); holder.add(pivot);
    const lit = faceSide(it.st.c ?? (it.st.plate ? (it.st.ink ? INK : WHITE) : ln.col)), m = mesh(it.g.geo, karaoke ? DIM : lit); pivot.add(m);
    if (it.st.plate) { const pw = it.g.w + it.m * 2, ph = it.size * U * 1.3; pivot.add(rbox(pw, ph, it.size * U * 0.22, it.size * U * 0.12, faceSide(it.st.plate)[0], [0, 0, -it.size * U * 0.32 - it.size * U * 0.11])); }
    return { it, holder, pivot, m, lit, i, karaoke }; });
}
function animToken(T, t) {
  const { it, pivot, m, lit, i, karaoke } = T, e = t - it.t0;
  if (karaoke) { pivot.visible = true; const on = e >= 0, s = spring(e, 12, 0.45); m.material = on ? lit : DIM; pivot.position.z = on ? 0.35 * Math.sin(Math.PI * k01(e, 0, 0.4)) : 0; pivot.rotation.x = on ? (1 - s) * 0.5 : 0; pivot.scale.setScalar(1); pivot.children.forEach((c, j) => { if (j) c.visible = on; }); return; }
  if (e < 0) { pivot.visible = false; return; } pivot.visible = true; const s = spring(e, it.st.plate || it.st.spin ? 11 : 14, 0.5);
  pivot.position.set(0, lerp(-0.5, 0, s) + Math.sin(t * 1.6 + i) * 0.015, lerp(-2.6, 0, s)); pivot.rotation.set(lerp(-1.5, 0, s), it.st.spin ? lerp(Math.PI * 2, 0, s) : 0, 0); pivot.scale.setScalar(lerp(0.35, 1, cl(s * 1.2)));
}

// ---------- the stations ----------
const STATIONS = [], ALL = [];
// the stations stand on a slow spiral around the camera's axis, each facing it: the camera turns from one to the next
// (a whip pan with a pull back), so it never flies through a station
const R = DIST;
function station(i, at, lines, build, o = {}) {
  const a = i * 0.8, y = -i * 1.4, g = new THREE.Group(), P = new V3(Math.sin(a) * R, y, -Math.cos(a) * R);
  g.position.copy(P); g.rotation.y = -a; scene.add(g);
  const toks = lines.flatMap((ln) => buildLine(ln, g, o.karaoke)), upd = build ? build(g) : null;
  const S = { i, at, g, P, a, y, toks, upd, karaoke: o.karaoke, dist: o.dist ?? DIST }; STATIONS.push(S); return S;
}
const params = (S, t) => ({ a: S.a, y: S.y, sw: Math.sin((t - S.at) * 0.45) * 0.07, d: S.dist - 0.6 * oCub(k01(t, S.at, 5)) });
function poseOf({ a, y, sw, d }) { const look = new V3(Math.sin(a) * R, y + 0.05, -Math.cos(a) * R), o = a + sw; return { look, pos: look.clone().add(new V3(-Math.sin(o) * d, 0.2, Math.cos(o) * d)) }; }
const camPose = (S, t) => poseOf(params(S, t));

// small props
const lossCube = (s = 1) => { const g = new THREE.Group(); g.add(rbox(0.5 * s, 0.5 * s, 0.5 * s, 0.09 * s, std(RED, 0.35))); g.add(rbox(0.26 * s, 0.07 * s, 0.04 * s, 0.03 * s, std(WHITE, 0.4), [0, 0, 0.26 * s])); return g; };
function shadowFloor(g, y) { const f = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.ShadowMaterial({ opacity: 0.45 })); f.rotation.x = -Math.PI / 2; f.position.set(0, y, 0); f.receiveShadow = true; g.add(f); return f; }
function textPlane(s, size, col, o = {}) { const c = document.createElement('canvas').getContext('2d'); c.font = FONT(size, o.w ?? 800); const tw = c.measureText(s).width + 40, th = size * 1.5;
  const tex = canvasTex(Math.ceil(tw), Math.ceil(th), (g, w, h) => { if (o.bg) { g.fillStyle = o.bg; g.beginPath(); g.roundRect(0, 0, w, h, h / 2); g.fill(); } g.font = FONT(size, o.w ?? 800); g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(s, w / 2, h / 2 + size * 0.06); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(tw * U, th * U), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false })); return m; }

// 0 · the hook
function hookProps(g) { shadowFloor(g, pxw(0, 1790).y); const cubes = [];
  for (let i = 0; i < 9; i++) { const c = lossCube(1); g.add(c); cubes.push({ c, t0: 0.25 + i * 0.36, x: (rnd(i) - 0.5) * 2.2, z: (rnd(i * 3) - 0.5) * 1.2, ry: rnd(i * 7) * 3 }); }
  return (t) => cubes.forEach((q, i) => { const e = t - q.t0, yF = pxw(0, 1790).y + 0.25 + (i > 4 ? 0.5 : 0); if (e < 0) { q.c.visible = false; return; } q.c.visible = true;
    const k = cl(e / 0.5), y = k < 1 ? lerp(3.5, yF, k * k) : yF + Math.abs(Math.sin((e - 0.5) * 9)) * 0.25 * Math.exp(-(e - 0.5) * 6);
    q.c.position.set(q.x * (i > 4 ? 0.5 : 1), y, q.z); q.c.rotation.set(k < 1 ? e * 6 : 0, q.ry + (k < 1 ? e * 4 : 2), k < 1 ? e * 3 : 0); }); }
// 1 · the note writing itself, then the red cross
function noteProps(g) { const card = new THREE.Group(); card.position.copy(pxw(CX, 1380)); card.rotation.set(-0.12, 0.25, 0.04); g.add(card);
  card.add(rbox(2.6, 1.7, 0.08, 0.08, std('#F4F1EA', 0.6))); for (let r = 0; r < 4; r++) card.add(mesh(new THREE.BoxGeometry(2.2, 0.008, 0.01), std('#C9D6E8', 0.6), [0, 0.45 - r * 0.32, 0.045]));
  const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push(new V3(0.95 - u * 1.9, 0.48 + Math.sin(u * 22) * 0.035, 0.05)); }
  const pts2 = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts2.push(new V3(0.95 - u * 1.3, 0.16 + Math.sin(u * 19 + 1) * 0.03, 0.05)); }
  const ink = std('#2A2FD0', 0.4), l1 = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.018, 6), ink), l2 = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 160, 0.018, 6), ink); card.add(l1, l2);
  const pen = new THREE.Group(); pen.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 16), std(VIO, 0.35), [0, 0.6, 0])); pen.add(mesh(new THREE.ConeGeometry(0.06, 0.16, 16), std('#222', 0.4), [0, 0, 0], [Math.PI, 0, 0])); pen.rotation.z = -0.5; card.add(pen);
  const cross = new THREE.Group(); cross.add(rbox(1.4, 0.26, 0.2, 0.08, std(RED, 0.35), [0, 0, 0], [0, 0, Math.PI / 4])); cross.add(rbox(1.4, 0.26, 0.2, 0.08, std(RED, 0.35), [0, 0, 0], [0, 0, -Math.PI / 4])); cross.position.copy(pxw(CX, 1380)).add(new V3(0, 0, 0.6)); g.add(cross);
  const n1 = l1.geometry.index.count, n2 = l2.geometry.index.count;
  return (t) => { const a = k01(t, ws(18) - 0.1, 0.9), b = k01(t, ws(20) - 0.05, 0.6); l1.geometry.setDrawRange(0, Math.floor(n1 * a / 6) * 6); l2.geometry.setDrawRange(0, Math.floor(n2 * b / 6) * 6);
    const tip = a < 1 ? pts[Math.floor(a * 40)] : pts2[Math.min(30, Math.floor(b * 30))]; pen.position.set(tip.x, tip.y, 0.06); pen.visible = t > ws(17) && t < ws(21);
    card.scale.setScalar(cl(spring(t - ws(10), 10, 0.55))); const s = spring(t - ws(22) + 0.05, 12, 0.45); cross.visible = s > 0; cross.scale.setScalar(lerp(2.4, 1, cl(s))); cross.rotation.z = (1 - cl(s)) * 0.8; }; }
// 2 · fear and hope
function bubble(g, x, y, col, lines, tail) { const b = new THREE.Group(); b.position.copy(pxw(x, y)); g.add(b);
  b.add(rbox(2.6, 1.25, 0.3, 0.32, std(col, 0.35))); const tl = mesh(new THREE.ConeGeometry(0.22, 0.6, 4), std(col, 0.35), [tail * 0.9, -0.82, 0], [0, 0, tail * 0.5 + Math.PI]); b.add(tl);
  lines.forEach(([s, yy, sz], j) => { const w = word3d(s, sz, 0.2), m = mesh(w.geo, faceSide(WHITE)); m.position.set(0, yy, 0.17); b.add(m); }); return b; }
function fearProps(g) { const f = bubble(g, CX + 150, 960, RED, [['ولش کن!', 0, 125]], -1), h = bubble(g, CX - 150, 1600, AMB, [['یکی دیگه،', 0.21, 88], ['جبران می‌شه!', -0.23, 88]], 1);
  return (t) => { const a = spring(t - ws(30) + 0.06, 11, 0.5), b = spring(t - ws(35) + 0.06, 11, 0.5); f.visible = a > 0; h.visible = b > 0; f.scale.setScalar(cl(a, 0, 1.2)); h.scale.setScalar(cl(b, 0, 1.2));
    f.rotation.z = Math.sin(t * 9) * 0.03 * cl(a); h.rotation.set(0, Math.sin(t * 1.4) * 0.15, 0); f.position.z = Math.sin(t * 2) * 0.1; }; }
// 3 · the stop sign
function stopProps(g) { const s = new THREE.Group(); s.position.copy(pxw(CX, 1300)); g.add(s); const oct = (r) => { const sh = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i * Math.PI) / 4; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } return sh; };
  s.add(mesh(new THREE.ExtrudeGeometry(oct(1.35), { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }), [std(WHITE, 0.4), std('#CCCCD6', 0.5)], [0, 0, -0.2]));
  s.add(mesh(new THREE.ExtrudeGeometry(oct(1.2), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }), [std(RED, 0.35), std('#A0202E', 0.5)], [0, 0, -0.06]));
  const w = word3d('توقف', 150, 0.18); s.add(mesh(w.geo, faceSide(WHITE), [0, 0.04, 0.12])); const pole = mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 16), std('#8A8FA0', 0.3, { metalness: 0.6 }), [0, -2.4, -0.3]); s.add(pole);
  return (t) => { const k = spring(t - ws(47) + 0.1, 9, 0.45); s.visible = t > ws(44); s.rotation.y = lerp(Math.PI * 2.5, 0, cl(k)) + Math.sin(t * 1.2) * 0.12; s.position.y = pxw(0, 1300).y + lerp(-3, 0, cl(oCub(k01(t, ws(44), 0.5)))); }; }
// 4 · the example: an equity line crossing the backtest's worst drawdown
function ddProps(g) { const box = new THREE.Group(); box.position.copy(pxw(CX, 1150)); g.add(box);
  const P = [[1.7, 0.7], [1.3, 0.85], [1.0, 0.55], [0.7, 0.75], [0.4, 0.35], [0.1, 0.5], [-0.2, 0.05], [-0.5, -0.1], [-0.8, -0.45], [-1.1, -0.65], [-1.45, -0.95]].map(([x, y]) => new V3(x, y, 0));
  const line = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), 300, 0.05, 10), glow(GREEN, 0.9)); box.add(line); const n = line.geometry.index.count;
  const lim = mesh(new THREE.BoxGeometry(3.8, 0.02, 1.2), new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: 0.6, transparent: true, opacity: 0.35 }), [0, -0.3, 0]); box.add(lim);
  const edge = mesh(new THREE.BoxGeometry(3.8, 0.03, 0.03), glow(RED, 2.2), [0, -0.3, 0.6]); box.add(edge);
  const lab = textPlane('بیشترین افت بک‌تست', 40, '#FFC2C8', { w: 700 }); lab.position.set(1.0, -0.12, 0.62); box.add(lab);
  const ex = textPlane('مثال', 38, INK, { bg: LIME, w: 800 }); ex.position.set(-1.35, 1.0, 0.1); box.add(ex);
  const pause = new THREE.Group(); [-0.2, 0.2].forEach((x) => pause.add(rbox(0.26, 0.9, 0.26, 0.08, std(WHITE, 0.3), [x, 0, 0]))); const pz = rbox(1.25, 1.25, 0.2, 0.3, std(RED, 0.35), [0, 0, -0.2]); pause.add(pz); pause.position.set(-1.0, -0.8, 0.9); pause.scale.setScalar(0.8); box.add(pause);
  const mag = new THREE.Group(); mag.add(mesh(new THREE.TorusGeometry(0.42, 0.09, 16, 48), std(LIME, 0.3))); mag.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 16), std(LIME, 0.3), [0.45, -0.45, 0], [0, 0, Math.PI / 4])); mag.position.set(1.0, -0.8, 0.9); box.add(mag);
  return (t) => { const a = k01(t, ws(51) - 0.1, ws(58) - ws(51) + 0.3); line.geometry.setDrawRange(0, Math.floor(n * a / 6) * 6); const crossed = a > 0.66;
    line.material.color.set(crossed ? RED : GREEN); line.material.emissive.set(crossed ? RED : GREEN); edge.material.emissiveIntensity = 2.2 + (crossed ? Math.sin(t * 18) * 1.5 + 1.5 : 0);
    lim.visible = edge.visible = lab.visible = t > ws(54) - 0.1; const ps = spring(t - ws(59) + 0.06, 12, 0.45), ms = spring(t - ws(61) + 0.06, 12, 0.45); pause.visible = ps > 0; pause.scale.setScalar(0.8 * cl(ps, 0, 1.2)); mag.visible = ms > 0; mag.scale.setScalar(cl(ms, 0, 1.2)); mag.rotation.z = Math.sin(t * 3) * 0.2;
    box.rotation.y = Math.sin(t * 0.5) * 0.12; }; }
// 5 · «؟»
function qProps(g) { const w = word3d('؟', 700, 0.35), m = mesh(w.geo, faceSide(LIME)); const q = new THREE.Group(); q.add(m); q.position.copy(pxw(CX, 1250)); g.add(q);
  return (t) => { const s = spring(t - ws(66) + 0.1, 9, 0.4); q.visible = s > 0; q.scale.setScalar(cl(s, 0, 1.25)); q.rotation.y = (1 - cl(s)) * 3 + Math.sin(t * 1.5) * 0.25; }; }
// 6–8 · the three steps in BacktestLab: floating panels
function panel(g, tex, w, y, badgeN, label) { const p = new THREE.Group(); p.position.copy(pxw(CX, y)); g.add(p); const h = w * (tex.image.height / tex.image.width);
  p.add(rbox(w + 0.16, h + 0.16, 0.12, 0.08, std('#1B1C24', 0.4), [0, 0, -0.08])); p.add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })));
  const b = new THREE.Group(); b.add(mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.18, 40), std(LIME, 0.35), [0, 0, 0], [Math.PI / 2, 0, 0])); const n = word3d(badgeN, 120, 0.15); b.add(mesh(n.geo, faceSide(INK), [0, 0.02, 0.1])); b.position.set(w / 2 - 0.1, h / 2 + 0.05, 0.2); p.add(b);
  if (label) { const l = textPlane(label, 34, '#C9C6D6', { w: 600 }); l.position.set(0, -h / 2 - 0.22, 0); p.add(l); } return p; }
const STRAT = () => canvasTex(900, 620, (g, w, h) => { g.fillStyle = '#12131A'; g.fillRect(0, 0, w, h); g.direction = 'rtl'; g.textAlign = 'right'; g.fillStyle = '#FFFFFF'; g.font = FONT(54); g.fillText('استراتژی من', w - 50, 90);
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.font = FONT(30, 600); g.fillText('قانون‌های ورود و خروج', w - 50, 145);
  ['روند تایم بالاتر رو چک کن', 'حد ضرر پشت آخرین سقف یا کف', 'ریسک هر معامله ثابت', 'حد سود حداقل دو برابر ریسک'].forEach((s, i) => { const y = 235 + i * 92; g.fillStyle = '#1D1F2A'; g.beginPath(); g.roundRect(50, y - 50, w - 100, 74, 18); g.fill();
    g.fillStyle = '#2FD67B'; g.beginPath(); g.arc(w - 95, y - 13, 18, 0, Math.PI * 2); g.fill(); g.fillStyle = '#FFFFFF'; g.font = FONT(32, 700); g.fillText(s, w - 135, y); }); });
function stepProps(kind) { return (g) => {
  let p, upd = () => {};
  if (kind === 'strategy') p = panel(g, STRAT(), 3.1, 1200, '۱', 'نمونه‌ی یه استراتژی ثبت‌شده');
  else if (kind === 'replay') { const keys = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`), texs = keys.map((k) => TEX[k]); p = panel(g, texs[0], 3.5, 1180, '۲', 'صفحه‌ی واقعی بک‌تست‌لب، بازپخش طلا'); const scr = p.children[1];
    upd = (t) => { const f = cl((t - ws(77)) / (we(80) + 0.6 - ws(77))); scr.material.map = texs[Math.min(15, Math.floor(f * 16))]; }; }
  else p = panel(g, TEX.cl, 3.5, 1180, '۳', 'صفحه‌ی واقعی بک‌تست‌لب، معامله با حد ضرر و حد سود');
  const t0 = { strategy: ws(70), replay: ws(74), trade: ws(82) }[kind];
  return (t) => { const s = spring(t - t0 + 0.1, 9, 0.6); p.visible = s > 0; p.scale.setScalar(lerp(0.6, 1, cl(s))); p.rotation.set(lerp(0.9, 0, cl(s)) - 0.05, Math.sin(t * 0.6) * 0.1, 0); upd(t); }; }; }
// 9 · the analytics: a simple sketch of the two numbers
const ANA = () => canvasTex(900, 700, (g, w, h) => { g.fillStyle = '#12131A'; g.fillRect(0, 0, w, h); g.direction = 'rtl'; g.textAlign = 'right'; g.fillStyle = '#FFF'; g.font = FONT(50); g.fillText('آنالیز', w - 50, 85);
  const card = (x, y, cw, title, col) => { g.fillStyle = '#1D1F2A'; g.beginPath(); g.roundRect(x, y, cw, 230, 26); g.fill(); g.fillStyle = col; g.fillRect(x + cw - 12, y + 30, 6, 170); g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = FONT(32, 700); g.fillText(title, x + cw - 40, y + 70); g.fillStyle = col; g.font = FONT(96); g.fillText('؟', x + cw - 40, y + 190); };
  card(470, 140, 380, 'بیشترین افت', '#FF4D5E'); card(50, 140, 380, 'طولانی‌ترین ضرر پشت‌سرهم', '#FFB020');
  g.strokeStyle = '#2FD67B'; g.lineWidth = 6; g.beginPath(); const pts = [0.62, 0.58, 0.66, 0.6, 0.52, 0.56, 0.47, 0.5, 0.42, 0.47, 0.55, 0.6, 0.66]; pts.forEach((v, i) => { const x = 60 + i * ((w - 120) / (pts.length - 1)), y = 430 + (1 - v) * 380; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  g.fillStyle = 'rgba(255,77,94,0.18)'; g.fillRect(60 + 4 * 65, 430, 5 * 65, 260); });
function anaProps(g) { const p = panel(g, ANA(), 3.0, 1130, '؟', 'طرح ساده از بخش آنالیز'); p.children[2].visible = false;
  return (t) => { const s = spring(t - ws(86) + 0.1, 9, 0.6); p.visible = s > 0; p.scale.setScalar(lerp(0.6, 1, cl(s))); p.rotation.set(lerp(-0.9, 0, cl(s)), Math.sin(t * 0.6) * 0.12, 0); }; }
// 10 · the follow button
function followProps(g) { const b = new THREE.Group(); b.position.copy(pxw(CX, 620)); g.add(b); b.add(rbox(3.4, 1.15, 0.5, 0.5, std(VIO, 0.3), [0, 0, -0.25])); b.add(rbox(3.6, 1.35, 0.3, 0.6, std('#2B1F6E', 0.5), [0, 0, -0.55]));
  const w = word3d('فالو کن', 150, 0.16); b.add(mesh(w.geo, faceSide(WHITE), [0, 0.0, 0.02]));
  if (TEX.icon) { const ic = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: TEX.icon, transparent: true, toneMapped: false })); ic.position.copy(pxw(CX, 300)); g.add(ic); b.userData.ic = ic; }
  return (t) => { const s = spring(t - ws(99) + 0.12, 10, 0.5), press = Math.sin(Math.PI * k01(t, ws(100), 0.25)); b.visible = s > 0; b.scale.set(cl(s, 0, 1.2), cl(s, 0, 1.2), cl(s, 0, 1.2) * (1 - 0.5 * press)); b.rotation.y = Math.sin(t * 1.2) * 0.12;
    if (b.userData.ic) { b.userData.ic.visible = s > 0; b.userData.ic.scale.setScalar(cl(s, 0, 1.15)); } }; }
// 11 · the end card
function endProps(g) { const grp = new THREE.Group(); g.add(grp); let ic, wd;
  if (TEX.icon) { ic = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: TEX.icon, transparent: true, toneMapped: false })); ic.position.copy(pxw(CX, 760)); grp.add(ic); }
  if (TEX.word) { const a = TEX.word.image.width / TEX.word.image.height; wd = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4 / a), new THREE.MeshBasicMaterial({ map: TEX.word, transparent: true, toneMapped: false })); wd.position.copy(pxw(CX, 1010)); grp.add(wd); }
  const f = textPlane('فالو کن؛ عددهای استراتژیتو پیدا کن', 46, INK, { bg: LIME, w: 800 }); f.position.copy(pxw(CX, 1190)); grp.add(f); const l = textPlane('لینک توی بیو', 44, '#E8E6F0', { w: 700 }); l.position.copy(pxw(CX, 1320)); grp.add(l);
  return (t) => { const s = spring(t - END, 10, 0.55); grp.visible = s > 0; if (ic) ic.scale.setScalar(cl(s, 0, 1.15)); if (wd) { wd.material.opacity = cl((t - END - 0.15) * 4); } f.scale.setScalar(cl(spring(t - END - 0.4, 11, 0.5), 0, 1.1)); l.material.opacity = cl((t - END - 0.7) * 4); }; }

// ---------- dust ----------
let DUST = null;
function dust() { const n = 1200, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const an = rnd(i) * Math.PI * 2, r = 6 + rnd(i * 2) * 30; p[i * 3] = Math.sin(an) * r; p[i * 3 + 1] = 6 - rnd(i * 3) * 30; p[i * 3 + 2] = -Math.cos(an) * r; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); DUST = new THREE.Points(g, new THREE.PointsMaterial({ color: '#B9A8FF', size: 0.05, transparent: true, opacity: 0.55, depthWrite: false })); scene.add(DUST); }

// ---------- build ----------
const TEX = {};
let composer = null, bokeh = null, KEY = null, RIM1 = null, RIM2 = null;
function build() {
  dust();
  KEY = new THREE.DirectionalLight('#FFF3E6', 2.4); KEY.castShadow = true; KEY.shadow.mapSize.set(2048, 2048); Object.assign(KEY.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 }); KEY.shadow.bias = -0.0005; scene.add(KEY, KEY.target);
  RIM1 = new THREE.PointLight(VIO, 60, 22, 1.6); RIM2 = new THREE.PointLight('#2CE6C0', 40, 22, 1.6); scene.add(RIM1, RIM2, new THREE.HemisphereLight('#8A90B8', '#0A0A10', 0.5));
  station(0, 0, [Ln(300, 190, WHITE, [['چند', 0], ['بار', 1]]), Ln(510, 130, WHITE, [['باید', 2], ['ضرر', 3, { plate: RED }], ['کنی', 4]]), Ln(680, 110, WHITE, [['تا', 5], ['بفهمی', 6]]),
    Ln(860, 150, LIME, [['استراتژیت', 7]]), Ln(1050, 150, WHITE, [['ایراد', 8, { plate: LIME, ink: true }], ['داره؟', 9]])], hookProps, { karaoke: true });
  station(1, ws(10) - 0.08, [Ln(330, 115, WHITE, [['جواب', 10], ['این', 11], ['سؤال', 12]]), Ln(490, 94, WHITE, [['باید', 13], ['قبل', 14], ['از', 15], ['اولین', 16], ['معامله', 17, { c: LIME }]]),
    Ln(650, 110, WHITE, [['نوشته', 18], ['شده', 19], ['باشه،', 20]]), Ln(860, 140, WHITE, [['نه', 21], ['وسط', 22], ['ضرر.', 23, { plate: RED }]])], noteProps);
  station(2, ws(24) - 0.08, [Ln(300, 120, WHITE, [['چون', 24], ['وسط', 25], ['ضرر', 26, { c: RED }]]), Ln(560, 100, WHITE, [['یا', 27], ['ترس', 28, { c: RED }], ['می‌گه', 29]]), Ln(1330, 100, WHITE, [['یا', 32], ['امید', 33, { c: AMB }], ['می‌گه', 34]])], fearProps);
  station(3, ws(39) - 0.08, [Ln(320, 160, WHITE, [['حرفه‌ای‌ها', [39, 41], { c: LIME }]]), Ln(520, 115, WHITE, [['قبل', 42], ['از', 43], ['شروع', 44]]), Ln(700, 120, WHITE, [['یه', 45], ['عدد', 46], ['توقف', 47, { plate: RED }], ['دارن.', 48]])], stopProps);
  station(4, ws(49) - 0.08, [Ln(280, 100, WHITE, [['اگه', 50], ['افت', 51, { c: RED }], ['حسابم', 52]]), Ln(420, 92, WHITE, [['از', 53], ['بیشترین', 54], ['افت', 55, { c: RED }], ['بک‌تستم', 56]]), Ln(560, 110, WHITE, [['بیشتر', 57], ['شد،', 58]]),
    Ln(1620, 90, WHITE, [['می‌ایستم', 59, { plate: RED }], ['و', 60], ['بررسی', 61, { c: LIME }], ['می‌کنم.', 62]])], ddProps);
  station(5, ws(63) - 0.08, [Ln(500, 130, WHITE, [['حالا', 63], ['از', 64], ['کجا', 65, { c: LIME }]]), Ln(690, 170, WHITE, [['بیارمش؟', 66, { spin: true }]])], qProps);
  station(6, ws(67) - 0.08, [Ln(330, 130, WHITE, [['توی', 67], ['بک‌تست‌لب', [68, 69], { plate: VIO }]]), Ln(560, 110, WHITE, [['استراتژیت', 70, { c: LIME }], ['رو', 71]]), Ln(720, 120, WHITE, [['ثبت', 72, { plate: LIME, ink: true }], ['می‌کنی،', 73]])], stepProps('strategy'));
  station(7, ws(74) - 0.08, [Ln(340, 98, WHITE, [['یه', 74], ['بازه', 75], ['از', 76], ['گذشته', 77, { c: LIME }], ['رو', 78]]), Ln(530, 140, WHITE, [['بازپخش', 79, { plate: VIO }], ['می‌کنی', 80]])], stepProps('replay'));
  station(8, ws(81) - 0.08, [Ln(360, 115, WHITE, [['و', 81], ['معامله‌هات', [82, 83], { c: LIME }], ['رو', 84]]), Ln(550, 140, WHITE, [['می‌گیری.', 85, { plate: VIO }]])], stepProps('trade'));
  station(9, ws(86) - 0.08, [Ln(300, 120, WHITE, [['بخش', 86], ['آنالیزش', 87, { c: LIME }]]), Ln(460, 105, WHITE, [['بیشترین', 88], ['افت', 89, { c: RED }]]), Ln(600, 80, WHITE, [['و', 90], ['طولانی‌ترین', [91, 92]], ['ضرر', 93, { c: AMB }], ['پشت‌سرهمت', [94, 95]]]),
    Ln(1610, 105, WHITE, [['رو', 96], ['جلوت', 97], ['می‌ذاره.', 98, { plate: LIME, ink: true }]])], anaProps);
  station(10, ws(99) - 0.08, [Ln(1000, 110, WHITE, [['اینجا', 101], ['یاد', 102], ['می‌گیری', 103]]), Ln(1160, 110, WHITE, [['عددهای', 104, { c: LIME }], ['استراتژیت', 105], ['رو', 106]]),
    Ln(1320, 100, WHITE, [['قبل', 107], ['از', 108], ['پول', 109, { c: RED }], ['واقعی', 110, { c: RED }]]), Ln(1500, 140, WHITE, [['پیدا', 111], ['کنی.', 112, { plate: VIO }]])], followProps);
  station(11, END, [], endProps, { dist: 13 });
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }); composer = new EffectComposer(renderer, rt); composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera)); bokeh = new BokehPass(scene, camera, { focus: DIST, aperture: 0.0035, maxblur: 0.008 }); composer.addPass(bokeh);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.32, 0.5, 0.97)); composer.addPass(new OutputPass()); composer.addPass(new ShaderPass(GRADE));
}
const GRADE = { uniforms: { tDiffuse: { value: null }, time: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv;
  void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb; float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * vec3(0.9, 0.98, 1.1), (1.0 - l) * 0.3); col = (col - 0.5) * 1.06 + 0.5; vec2 d = (vUv - 0.5) * vec2(1.0, 1.35); col *= mix(0.6, 1.0, smoothstep(0.95, 0.3, length(d)));
    float n = fract(sin(dot(vUv * vec2(1080.0, 1920.0) + time, vec2(12.9898, 78.233))) * 43758.5453); col += (n - 0.5) * 0.035; gl_FragColor = vec4(col, c.a); }` };

// ---------- frame ----------
const SWOOP = 0.7;
function frame(t) {
  let i = 0; STATIONS.forEach((S, k) => { if (t >= S.at) i = k; }); const S = STATIONS[i];
  STATIONS.forEach((Q, k) => { Q.g.visible = k >= i - 1 && k <= i + 1; if (Q.g.visible) { Q.toks.forEach((T) => animToken(T, t)); if (Q.upd) Q.upd(t); } });
  let pose = camPose(S, t);
  if (i > 0 && t - S.at < SWOOP) { const A = params(STATIONS[i - 1], t), B = params(S, t), k = ioCub((t - S.at) / SWOOP); pose = poseOf({ a: lerp(A.a, B.a, k), y: lerp(A.y, B.y, k), sw: lerp(A.sw, B.sw, k), d: lerp(A.d, B.d, k) + Math.sin(Math.PI * k) * 3 }); }
  camera.position.copy(pose.pos); camera.lookAt(pose.look); bokeh.uniforms.focus.value = camera.position.distanceTo(pose.look);
  KEY.position.copy(pose.pos).add(new V3(-5, 8, 2)); KEY.target.position.copy(pose.look); RIM1.position.copy(pose.look).add(new V3(4, 3, -3)); RIM2.position.copy(pose.look).add(new V3(-4, -2, -2));
  if (DUST) DUST.rotation.y = t * 0.01;
  composer.passes[composer.passes.length - 1].uniforms.time.value = (t * 30) % 100;
  composer.render();
  // the progress line
  const c = document.getElementById('c').getContext('2d'); c.clearRect(0, 0, W, H); const pk = cl(t / END); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, 0, W, 8); c.fillStyle = LIME; c.fillRect(W * (1 - pk), 0, W * pk, 8);
}
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(9) + 0.6); document.getElementById('c').getContext('2d').clearRect(0, 0, W, 10); };
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A؟')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  const toTex = (im) => { if (!im) return null; const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; };
  const svgTex = async (src, size) => { const im = await load(src); if (!im) return null; const c = document.createElement('canvas'); const a = (im.width || 1) / (im.height || 1); c.width = size; c.height = Math.round(size / a); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  await Promise.all(Object.entries(window.IMGS).map(async ([k, s]) => { TEX[k] = toTex(await load(s)); }));
  TEX.icon = await svgTex(window.LOGO.icon, 512); TEX.word = await svgTex(window.LOGO.word, 1024);
  build(); frame(0); window.ready = true;
});
