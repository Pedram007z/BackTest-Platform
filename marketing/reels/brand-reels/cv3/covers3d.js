// cv3 · the 3D covers, closer to the reference grid's look: a clean mascot (a smooth porcelain head with glossy oval eyes,
// simple brows and mouth, BacktestLab's violet hoodie), a different room per cover, ambient occlusion, colour grading,
// a vignette and grain. Built on cv2's scene (the symbols are cv2's).
// cv2 · the reel covers in 3D (three.js): the same nine hooks and symbols as cv1, rendered as a real 3D scene. It keeps
// the reference grid's principles (a two-line question in white then red or green, one expressive character, one bold
// glowing symbol, a dark cinematic room with depth) with BacktestLab's own trader built in 3D: a rounded head with
// glossy eyes, a swept quiff, a violet fabric hoodie with lime drawstrings and the logo on the chest, arms and hands
// posed per cover. The room (a night-city window, monitors with candles, shelves, plants, a warm lamp, a glossy desk)
// is lit by a key light, two coloured rim lights and the symbol's own glow, then put through depth of field and bloom.
// window.render(i) draws cover i (1080×1920); the hook is drawn on the 2D canvas on top.
const { THREE, RoundedBoxGeometry, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, BokehPass, OutputPass, GTAOPass, ShaderPass } = window.T3;
const W = 1080, H = 1920, CX = 540;
const V3 = THREE.Vector3;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const INK = '#05080C', WHITE = '#FFFFFF', RED = '#FF4D5E', GREEN = '#33E08A', LIME = '#C6F24E', VIO = '#6C47FF', AMB = '#FFB020';

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('g'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const pmrem = new THREE.PMREMGenerator(renderer), ENV = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ---------- materials and helpers ----------
const std = (c, r = 0.6, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, envMapIntensity: 1, ...o });
const phys = (c, r = 0.5, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, metalness: 0, envMapIntensity: 1, ...o });
const glowMat = (c, k = 2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.4 });
const mesh = (geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s); m.castShadow = shadow; m.receiveShadow = true; return m; };
const sphere = (r, mat, p, s, rot = [0, 0, 0]) => mesh(new THREE.SphereGeometry(r, 48, 32), mat, p, rot, s);
const rbox = (w, h, d, rad, mat, p, rot = [0, 0, 0]) => mesh(new RoundedBoxGeometry(w, h, d, 4, rad), mat, p, rot);
function capsuleBetween(a, b, r, mat) { const d = new V3().subVectors(b, a), len = d.length(); const m = mesh(new THREE.CapsuleGeometry(r, len, 10, 20), mat); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.clone().normalize()); return m; }
function tube(pts, r, mat, closed = false) { const c = new THREE.CatmullRomCurve3(pts.map((p) => new V3(...p)), closed); return mesh(new THREE.TubeGeometry(c, Math.max(24, pts.length * 12), r, 12, closed), mat); }
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn, "Noto Color Emoji"`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
/** A canvas texture: draw(g, w, h). */
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function textTex(s, o = {}) { const size = o.size ?? 120, pad = o.pad ?? 40; const m = document.createElement('canvas').getContext('2d'); m.font = FONT(size, o.w ?? 900); m.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl'); const tw = m.measureText(s).width;
  const w = Math.ceil(tw + pad * 2), h = Math.ceil(size * 1.5 + (o.padY ?? 0) * 2);
  return { tex: canvasTex(w, h, (g) => { if (o.bg) { g.fillStyle = o.bg; g.beginPath(); g.roundRect(0, 0, w, h, o.radius ?? h * 0.3); g.fill(); } g.font = FONT(size, o.w ?? 900); g.fillStyle = o.fg ?? WHITE; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl'); g.fillText(s, w / 2, h / 2 + size * 0.05); }), aspect: w / h }; }
/** A flat text card facing the camera, height h (world units). */
function textPlane(s, h, o = {}) { const { tex, aspect } = textTex(s, o); const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }); const m = new THREE.Mesh(new THREE.PlaneGeometry(h * aspect, h), mat); m.renderOrder = 2; return m; }
/** A glowing badge: a rounded block in colour col with text on its face. */
function badge(s, h, col, fg = WHITE, o = {}) { const { tex, aspect } = textTex(s, { size: 120, fg, dir: o.dir }); const g = new THREE.Group(); const w = h * aspect * 0.95;
  g.add(rbox(w, h, h * 0.35, h * 0.3, glowMat(col, o.glow ?? 0.22), [0, 0, 0])); const f = new THREE.Mesh(new THREE.PlaneGeometry(h * aspect * 0.86, h * 0.86), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })); f.position.z = h * 0.18 + 0.01; g.add(f); return g; }

// ---------- the trader in 3D ----------
const SKIN = '#E7B48D';
function face(g, M, f, look) {
  const [lx, ly] = look, onFace = (x, y, out = 0.02) => [x, y, Math.sqrt(Math.max(0, 1.1 - x * x - y * y)) * 0.98 + out];
  [-1, 1].forEach((e) => { const ex = e * 0.37 + lx * 0.05, ey = 0.06 + ly * 0.04;
    const sy = { shocked: 1.25, smirk: 0.62, sad: 0.85, worried: 0.95, thinking: e > 0 ? 0.8 : 1 }[f] ?? 1, sx = f === 'shocked' ? 1.15 : 1;
    if (f === 'happy') g.add(tube([[ex - 0.13, ey - 0.02, 0], [ex, ey + 0.1, 0], [ex + 0.13, ey - 0.02, 0]].map(([x, y]) => onFace(x, y, 0.01)), 0.038, M.eye));
    else { g.add(sphere(0.23, M.eye, onFace(ex, ey, -0.08), [0.68 * sx, 1.2 * sy, 0.42]));
      g.add(mesh(new THREE.SphereGeometry(0.032, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), onFace(ex - 0.05, ey + 0.11 * sy, 0.03), [0, 0, 0], [1, 1, 1], false));
      g.add(mesh(new THREE.SphereGeometry(0.016, 12, 8), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), onFace(ex + 0.045, ey - 0.09 * sy, 0.03), [0, 0, 0], [1, 1, 1], false)); }
    const raise = { worried: 0.07, shocked: 0.13, thinking: e > 0 ? 0.11 : 0, sad: 0.05, smirk: e > 0 ? 0.07 : 0, happy: 0.05 }[f] ?? 0, tilt = { worried: -0.45, sad: -0.5, shocked: -0.08, thinking: e > 0 ? 0.28 : -0.12, smirk: e > 0 ? 0.25 : -0.05, happy: 0.08 }[f] ?? 0;
    const [bx, by, bz] = onFace(ex, 0.44 + raise, 0.0); g.add(mesh(new THREE.CapsuleGeometry(0.048, 0.27, 8, 16), M.brow, [bx, by, bz], [0, 0, Math.PI / 2 + e * tilt])); });
  const mouthCurve = (pts) => g.add(tube(pts.map(([x, y]) => onFace(x, y, 0.012)), 0.03, M.brow));
  const disc = (shape, y, mat, z = 0) => { const m = mesh(new THREE.ShapeGeometry(shape, 24), mat, [0, y, 1.0 + z], [-0.38, 0, 0]); m.castShadow = false; g.add(m); };
  if (f === 'happy') { const sh = new THREE.Shape(); sh.moveTo(-0.2, 0); sh.lineTo(0.2, 0); sh.absarc(0, 0, 0.2, 0, -Math.PI, true); disc(sh, -0.32, M.mouthIn); const tg = new THREE.Shape(); tg.absellipse(0, -0.13, 0.1, 0.06, 0, Math.PI * 2); disc(tg, -0.32, M.tongue, 0.004); }
  else if (f === 'shocked') { const sh = new THREE.Shape(); sh.absellipse(0, 0, 0.1, 0.14, 0, Math.PI * 2); disc(sh, -0.42, M.mouthIn); }
  else if (f === 'worried') mouthCurve([[-0.16, -0.4], [-0.08, -0.36], [0, -0.4], [0.08, -0.36], [0.16, -0.4]]);
  else if (f === 'sad') mouthCurve([[-0.15, -0.45], [-0.07, -0.4], [0, -0.385], [0.07, -0.4], [0.15, -0.45]]);
  else if (f === 'smirk') mouthCurve([[-0.15, -0.38], [-0.04, -0.41], [0.07, -0.4], [0.17, -0.33]]);
  else if (f === 'thinking') mouthCurve([[-0.1, -0.41], [0.02, -0.4], [0.12, -0.375]]);
  else mouthCurve([[-0.16, -0.34], [-0.08, -0.4], [0, -0.42], [0.08, -0.4], [0.16, -0.34]]);
  if (f === 'worried') g.add(sphere(0.085, new THREE.MeshPhysicalMaterial({ color: '#A8DCFF', roughness: 0.05, clearcoat: 1, emissive: '#3A8FD0', emissiveIntensity: 0.25 }), [0.86, 0.45, 0.58], [0.8, 1.3, 0.6]));
}
function hand(pose, M) {
  const h = new THREE.Group(); h.add(sphere(0.25, M.skin, [0, 0.22, 0], [1, 1.12, 0.62]));
  const ext = pose === 'point' || pose === 'chin' ? [1, 1, 0, 0, 0] : [1, 1, 1, 1, 1];
  [[-0.16, 0.26, 0.12], [-0.055, 0.3, 0.04], [0.055, 0.29, -0.04], [0.155, 0.24, -0.12]].forEach(([x, L, a], i) => { const len = ext[i + 1] ? L : 0.07; const f = mesh(new THREE.CapsuleGeometry(0.062, len, 6, 12), M.skin, [x, 0.48 + len / 2, ext[i + 1] ? 0 : 0.08], [ext[i + 1] ? 0 : 0.9, 0, a]); h.add(f); });
  const th = mesh(new THREE.CapsuleGeometry(0.07, 0.2, 6, 12), M.skin, [0.25, 0.2, 0.06], [0, 0, -0.75]); h.add(th);
  return h;
}
/** The trader; s = his place (−1 left, +1 right); the symbol is on the other side (d = −s). */
function trader(o) {
  const M = { skin: phys('#FBF9F5', 0.36, { sheen: 0.4, sheenColor: '#FFFFFF', sheenRoughness: 0.6, clearcoat: 0.12, clearcoatRoughness: 0.5 }),
    hood: phys('#6244EA', 0.8, { sheen: 1, sheenColor: '#B9A6FF', sheenRoughness: 0.55 }), hood2: phys('#4329BF', 0.84, { sheen: 1, sheenColor: '#9682FF', sheenRoughness: 0.55 }),
    lime: std(LIME, 0.45, { emissive: LIME, emissiveIntensity: 0.18 }), eye: phys('#0E0D12', 0.12, { clearcoat: 1, clearcoatRoughness: 0.05 }), brow: std('#2F2E33', 0.55),
    mouthIn: std('#2A1C1E', 0.7), tongue: std('#D9787A', 0.55) };
  const g = new THREE.Group(), d = -o.side;
  // the head: one smooth porcelain sphere
  const hd = new THREE.Group(); hd.add(sphere(1.05, M.skin, [0, 0, 0], [1, 1.04, 0.98]));
  face(hd, M, o.face, o.look ?? [d * 0.8, 0]);
  hd.position.y = 0.05; hd.rotation.set(o.nod ?? 0.04, d * 0.2, d * (o.tilt ?? -0.06)); g.add(hd);
  // neck, hoodie, hood, drawstrings, logo
  g.add(mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.7, 32), M.skin, [0, -1.12, -0.05]));
  const prof = [[0.42, -1.12], [0.95, -1.3], [1.55, -1.6], [1.86, -2.05], [1.92, -2.8], [1.9, -4.0], [1.84, -6.2]].map(([r, y]) => new THREE.Vector2(r, y));
  g.add(mesh(new THREE.LatheGeometry(prof, 64), M.hood, [0, 0, 0], [0, 0, 0], [1, 1, 0.64]));
  g.add(mesh(new THREE.TorusGeometry(0.62, 0.23, 24, 64), M.hood2, [0, -1.3, -0.05], [Math.PI / 2 + 0.25, 0, 0], [1.05, 0.82, 1]));
  [-1, 1].forEach((e) => { g.add(capsuleBetween(new V3(e * 0.2, -1.45, 1.0), new V3(e * 0.24, -2.55, 1.18), 0.04, M.lime)); g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 16), std('#E9FF9E', 0.4), [e * 0.24, -2.68, 1.19])); });
  if (window.ICON_TEX) { const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ map: window.ICON_TEX, transparent: true, roughness: 0.5, emissive: '#FFFFFF', emissiveMap: window.ICON_TEX, emissiveIntensity: 0.25 })); lg.position.set(-d * 0.85, -2.45, 1.0); lg.rotation.y = -d * 0.5; g.add(lg); }
  // arms
  const pose = { [d]: o.near ?? 'down', [-d]: o.far ?? 'down' };
  [-1, 1].forEach((a) => { const p = pose[a], sh = new V3(a * (p === 'down' ? 1.62 : 1.35), -1.92, -0.04); let el, wr, dir;
    if (p === 'palm') { el = new V3(a * 2.25, -3.1, 1.0); wr = new V3(a * 2.45, -2.15, 1.95); }
    else if (p === 'point') { el = new V3(a * 2.25, -2.75, 1.0); wr = new V3(a * 2.75, -1.8, 1.9); dir = new V3(a * 1, 0.35, 0.25).normalize(); }
    else if (p === 'chin') { el = new V3(a * 0.95, -3.15, 1.75); wr = new V3(a * 0.34, -1.55, 1.45); dir = new V3(-a * 0.15, 1, 0.1).normalize(); }
    else if (p === 'desk') { el = new V3(a * 1.95, -3.3, 0.6); wr = new V3(a * 1.2, -3.35, 2.0); }
    else { el = new V3(a * 2.02, -3.4, -0.02); wr = new V3(a * 1.98, -4.8, 0.08); }
    // the shoulder: a rounded cap that grows out of the hoodie, so the sleeve is part of the body
    g.add(sphere(0.5, M.hood, [a * 1.55, -2.0, -0.04], [1, 0.8, 0.8]));
    g.add(capsuleBetween(sh, el, 0.39, M.hood)); g.add(sphere(0.37, M.hood, el.toArray(), [1, 1, 1])); g.add(capsuleBetween(el, wr, 0.34, M.hood));
    g.add(mesh(new THREE.TorusGeometry(0.28, 0.07, 12, 32), M.hood2, wr.toArray(), [0, 0, 0]).rotateOnAxis(new V3(1, 0, 0), Math.PI / 2));
    if (p === 'down') return;
    const hnd = hand(p, M); hnd.position.copy(wr); const fd = dir ?? new V3().subVectors(wr, el).normalize(); hnd.quaternion.setFromUnitVectors(new V3(0, 1, 0), fd);
    if (p === 'palm') hnd.rotateY(-a * 1.2), hnd.rotateX(-0.5); if (p === 'point') hnd.rotateY(a * 0.6); if (p === 'desk') hnd.rotateX(-1.2);
    g.add(hnd); });
  g.position.set(o.side * 1.75, 0, 0); g.rotation.y = d * 0.18;
  return g;
}

// ---------- the room ----------
function cityTex(seed, dusk) { return canvasTex(1024, 1024, (g, w, h) => { let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, dusk ? '#2A1A3A' : '#0B1A33'); gr.addColorStop(0.6, dusk ? '#6A3A3A' : '#081429'); gr.addColorStop(1, dusk ? '#C2703A' : '#03070F'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let b = 0; b < 26; b++) { const bx = rnd(b * 3.3 + seed) * w, bw = 40 + rnd(b * 7 + seed) * 110, bh = 200 + rnd(b * 5 + seed) * 560; g.fillStyle = '#050B16'; g.fillRect(bx, h - bh, bw, bh);
    for (let k = 0; k < bw * bh / 900; k++) if (rnd(b * 100 + k) > 0.55) { g.fillStyle = rnd(k * 3 + b) > 0.7 ? '#FFC277' : '#8FC2FF'; g.fillRect(bx + 6 + rnd(k * 9 + b) * (bw - 12), h - bh + 10 + rnd(k * 11 + b) * (bh - 20), 6, 8); } } }); }
function chartTex(seed, w = 640, h = 400) { return canvasTex(w, h, (g) => { g.fillStyle = '#06111B'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,140,200,0.15)'; g.lineWidth = 2; for (let y = 40; y < h; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  let p = h * 0.55; for (let i = 0; i < 30; i++) { const up = rnd(seed * 50 + i) > 0.45, b = (rnd(seed * 70 + i) * 0.5 + 0.2) * 40, x = 20 + i * (w - 40) / 30, c = up ? '#2DE38A' : '#FF4D5E', cl2 = up ? p - b : p + b;
    g.fillStyle = c; g.fillRect(x - 6, Math.min(p, cl2), 12, Math.abs(cl2 - p) + 2); g.fillRect(x - 1.5, Math.min(p, cl2) - 14, 3, Math.abs(cl2 - p) + 28); p = Math.max(40, Math.min(h - 40, cl2 + (rnd(seed * 90 + i) - 0.5) * 16)); } }); }
function wallTex(base, seed) { return canvasTex(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,255,255,${0.01 + 0.02 * rnd(i * 1.3 + seed)})`; g.fillRect(rnd(i * 2.1 + seed) * w, rnd(i * 3.7 + seed) * h, 2, 2); } }); }
function woodTex() { return canvasTex(1024, 256, (g, w, h) => { g.fillStyle = '#2A1B12'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${90 + rnd(i) * 60},${55 + rnd(i * 2) * 30},${30 + rnd(i * 3) * 20},0.35)`; g.lineWidth = 1 + rnd(i * 5) * 3; g.beginPath(); const y = rnd(i * 7) * h; g.moveTo(0, y); for (let x = 0; x <= w; x += 64) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 6); g.stroke(); } }); }
/** The room: a theme per cover. city (a big night window), monitors (a wall of chart screens), neon (violet strips and shelves), warm (wood, a lamp, a window at dusk). */
function room(scene, o) {
  const s = o.side, tint = new THREE.Color(o.tint), T = o.theme;
  scene.background = new THREE.Color('#06090E'); scene.fog = new THREE.Fog('#06090E', 40, 70);
  const back = new THREE.PointLight(tint, 90, 26, 1.6); back.position.set(-s * 2, 3, -10); scene.add(back);
  const wallCol = { city: '#111C2E', monitors: '#0C1A16', neon: '#160F2A', warm: '#24180F' }[T];
  scene.add(mesh(new THREE.PlaneGeometry(70, 44), std(wallCol, 0.92, { map: wallTex(wallCol, o.seed) }), [0, 2, -16]));
  if (T === 'city' || T === 'warm') { const dusk = T === 'warm'; const win = mesh(new THREE.PlaneGeometry(13, 12), new THREE.MeshBasicMaterial({ map: cityTex(o.seed, dusk), toneMapped: false, color: dusk ? '#E0B890' : '#A8C0E8' }), [s * 3.8, 1.8, -15.7]); scene.add(win);
    for (let k = 0; k <= 4; k++) scene.add(rbox(0.22, 12.4, 0.3, 0.05, std('#020407', 0.6), [s * 3.8 - 6.5 + k * 3.25, 1.8, -15.5])); scene.add(rbox(13.3, 0.25, 0.3, 0.05, std('#020407', 0.6), [s * 3.8, 2.6, -15.5])); }
  if (T === 'monitors' || T === 'city') { const n = T === 'monitors' ? [[-5, 2.8], [-1.6, 2.8], [1.8, 2.8], [5.2, 2.8], [-3.3, 0.5], [0.1, 0.5], [3.5, 0.5]] : [[-s * 1.8, -0.4], [-s * 4.8, 0.8]];
    n.forEach(([x, y], k) => { const z = T === 'monitors' ? -11 : -9.5 - k, w = 3.2, h = 2.0; scene.add(rbox(w + 0.2, h + 0.2, 0.15, 0.05, std('#05080C', 0.4), [x, y, z])); const sc = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: chartTex(o.seed * 10 + k), toneMapped: false, color: T === 'monitors' ? '#C8F0DC' : '#D8E2EE' })); sc.position.set(x, y, z + 0.09); scene.add(sc); }); }
  if (T === 'neon') { [[-6, 4.5, 9, 0], [5.5, 3.0, 6, 0.0], [-4, -0.5, 0.18, 7], [6.5, 1.0, 0.18, 6]].forEach(([x, y, w, h], k) => scene.add(mesh(new THREE.BoxGeometry(w || 0.18, h || 0.18, 0.12), glowMat(k % 2 ? '#B39CFF' : '#7C5CFF', 3), [x, y, -15.4], [0, 0, 0], [1, 1, 1], false)));
    scene.add(mesh(new THREE.TorusGeometry(2.2, 0.09, 16, 96), glowMat('#B39CFF', 3), [s * 4.6, 0.4, -15.4], [0, 0, 0], [1, 1, 1], false)); }
  // shelves, plants
  if (T !== 'monitors') { const shx = -s * 7.0; for (let r = 0; r < 4; r++) { scene.add(rbox(3.4, 0.12, 1.0, 0.03, std('#1A1410', 0.7), [shx, -2 + r * 2.0, -8])); let bx = shx - 1.5; for (let i = 0; bx < shx + 1.5; i++) { const bw = 0.16 + rnd(r * 30 + i + o.seed) * 0.16, bh = 0.8 + rnd(r * 17 + i) * 0.7; scene.add(rbox(bw, bh, 0.7, 0.02, std(['#4A2E22', '#24404A', '#5A4A2A', '#2E2A4A', '#6A2A2A'][i % 5], 0.8), [bx + bw / 2, -2 + r * 2.0 + bh / 2 + 0.06, -8])); bx += bw + 0.03; } } }
  const plant = (x, y, z, k) => { scene.add(mesh(new THREE.CylinderGeometry(0.5 * k, 0.38 * k, 0.9 * k, 24), std('#D9D2C6', 0.6), [x, y, z])); for (let i = 0; i < 18; i++) { const a = rnd(i * 3 + x) * Math.PI * 2, t = 0.4 + rnd(i * 7 + x) * 0.9; scene.add(sphere(0.22 * k, phys(i % 2 ? '#2E6B3E' : '#24583A', 0.5, { sheen: 0.5 }), [x + Math.cos(a) * 0.55 * k * t, y + 0.7 * k + t * 1.3 * k, z + Math.sin(a) * 0.45 * k], [1, 3.4, 0.45], [Math.sin(a) * 0.55, a, Math.cos(a) * 0.55])); } };
  plant(s * 6.0, -3.0, -6, 1.4); if (T !== 'neon') plant(-s * 6.4, 2.6, -7.6, 0.7);
  // the warm lamp
  const lampOn = T !== 'neon', lx = s * 5.0; if (lampOn) { const lamp = new THREE.PointLight('#FFB566', T === 'warm' ? 110 : 70, 18, 1.8); lamp.position.set(lx, -1.2, -5.2); scene.add(lamp); scene.add(mesh(new THREE.ConeGeometry(0.75, 0.85, 32, 1, true), std('#2A2018', 0.6, { side: THREE.DoubleSide }), [lx, -0.8, -5.2])); scene.add(sphere(0.2, glowMat('#FFD9A0', 3), [lx, -1.1, -5.2], [1, 1, 1])); scene.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 12), std('#111', 0.4), [lx, -2.4, -5.2])); }
  // the desk: wood with a clear coat
  const desk = rbox(26, 3.2, 6, 0.12, phys('#6A4A30', 0.3, { map: woodTex(), clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 1.0 }), [0, -5.15, 2.6]); scene.add(desk);
  // a mug and a notebook on the desk, on the trader's side
  scene.add(mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.58, 32), phys('#EDE8E0', 0.3, { clearcoat: 0.6 }), [s * 2.75, -3.26, 2.3])); scene.add(mesh(new THREE.TorusGeometry(0.15, 0.05, 12, 24), phys('#EDE8E0', 0.3), [s * 3.07, -3.26, 2.3], [0, 0, Math.PI / 2]));
  // lights: key, two rims (the cover's tint and violet), fill
  const key = new THREE.DirectionalLight('#FFE7CF', 1.7); key.position.set(-s * 7, 9, 16); key.target.position.set(s * 1.5, -1, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 50 }); key.shadow.bias = -0.0004; key.shadow.radius = 8; scene.add(key, key.target);
  const rim1 = new THREE.SpotLight(tint, 320, 30, 0.5, 0.6, 2); rim1.position.set(s * 5.5, 4.5, -6); rim1.target.position.set(s * 1.75, -0.5, 0); scene.add(rim1, rim1.target);
  const rim2 = new THREE.SpotLight('#8E6BFF', 170, 30, 0.5, 0.7, 2); rim2.position.set(-s * 1.0, 6, -7); rim2.target.position.set(s * 1.75, 0, 0); scene.add(rim2, rim2.target);
  const fill = new THREE.PointLight(tint, 8, 14, 2); fill.position.set(-s * 0.5, -1.5, 5); scene.add(fill);
  scene.add(new THREE.HemisphereLight('#4A5A80', '#050505', 0.16));
  const front = new THREE.DirectionalLight('#FFF4E8', 0.75); front.position.set(0, 2, 22); front.target.position.set(s * 1.75, 0, 0); scene.add(front, front.target);
}
// ---------- the symbols (placed at the side opposite the trader; x = −side) ----------
const SYM = {
  gate(scene, x) { const g = new THREE.Group(); const dark = std('#2A2160', 0.4, { metalness: 0.3 });
    g.add(rbox(0.4, 4.0, 0.5, 0.12, dark, [-1.3, -1.4, 0])); g.add(rbox(0.4, 4.0, 0.5, 0.12, dark, [1.3, -1.4, 0])); g.add(rbox(3.4, 0.75, 0.6, 0.2, glowMat(VIO, 0.5), [0, 0.85, 0]));
    const t = textPlane('بررسی', 0.52, { fg: WHITE }); t.position.set(0, 0.86, 0.32); g.add(t);
    const field = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(198,242,78,0.45)'); gr.addColorStop(1, 'rgba(198,242,78,0.02)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); }), transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }));
    field.position.set(0, -1.6, 0); g.add(field); for (let i = 0; i < 6; i++) g.add(mesh(new THREE.BoxGeometry(2.2, 0.035, 0.035), glowMat(LIME, 2.2), [0, -0.1 - i * 0.6, 0.02], [0, 0, 0], [1, 1, 1], false));
    const L = new THREE.PointLight(LIME, 9, 7, 2); L.position.set(0, -1.2, 0.4); g.add(L);
    g.position.set(x, -0.4, 0.6); g.rotation.y = -x * 0.12; scene.add(g);
    // a thought bubble with «؟» over the trader
    const b = new THREE.Group(), wm = phys('#FFFFFF', 0.25, { clearcoat: 0.6 }); b.add(sphere(0.52, wm, [0, 0, 0], [1, 1, 0.5])); b.add(sphere(0.14, wm, [-0.55 * Math.sign(x), -0.55, 0], [1, 1, 0.6])); b.add(sphere(0.08, wm, [-0.8 * Math.sign(x), -0.78, 0], [1, 1, 0.6]));
    const q = textPlane('؟', 0.78, { fg: RED, size: 160 }); q.position.z = 0.28; b.add(q); b.position.set(-x * 0.2, 1.3, 1.2); scene.add(b); },
  chartDice(scene, x) { const g = new THREE.Group(); const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.6), new THREE.MeshStandardMaterial({ color: '#0A1A22', transparent: true, opacity: 0.6, roughness: 0.6 })); g.add(panel);
    g.add(mesh(new THREE.BoxGeometry(3.7, 0.04, 0.04), glowMat(GREEN, 1.5), [0, 1.32, 0])); let p = -0.9; for (let i = 0; i < 12; i++) { const r = rnd(i * 13), up = r > 0.25, b = 0.1 + r * 0.22, cl2 = up ? p + b : p - b, c = up ? '#2DE38A' : '#FF4D5E'; g.add(mesh(new THREE.BoxGeometry(0.14, Math.abs(cl2 - p) + 0.03, 0.08), glowMat(c, 2.2), [-1.55 + i * 0.28, (p + cl2) / 2, 0.06], [0, 0, 0], [1, 1, 1], false)); g.add(mesh(new THREE.BoxGeometry(0.03, Math.abs(cl2 - p) + 0.25, 0.03), glowMat(c, 2.2), [-1.55 + i * 0.28, (p + cl2) / 2, 0.05], [0, 0, 0], [1, 1, 1], false)); p = cl2; }
    g.position.set(x, 0.2, -0.6); g.rotation.y = -x * 0.2; scene.add(g);
    [[x - 0.5 * Math.sign(x), -3.0, 1.6, 5, [0.3, 0.5, 0.2]], [x + 0.6 * Math.sign(x), -2.95, 2.0, 3, [-0.2, -0.7, 0.15]]].forEach(([dx, dy, dz, n, rot]) => scene.add(die(dx, dy, dz, n, rot)));
    const L = new THREE.PointLight(GREEN, 14, 9, 2); L.position.set(x, 0, 1.5); scene.add(L); },
  accountBar(scene, x) { const g = new THREE.Group(); g.add(rbox(1.5, 3.4, 1.0, 0.3, std('#1A1533', 0.5, { transparent: true, opacity: 0.6 }), [0, 0, 0])); g.add(rbox(1.25, 1.55, 0.8, 0.12, glowMat(VIO, 0.7), [0, -0.78, 0]));
    for (let i = 0; i < 6; i++) g.add(mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), glowMat(RED, 3), [-0.55 + i * 0.22, 1.5, 0.52], [0, 0, 0], [1, 1, 1], false));
    [[-0.62, 0.75], [0.62, 0.75]].forEach(([dx]) => { for (let i = 0; i < 6; i++) g.add(mesh(new THREE.BoxGeometry(0.05, 0.14, 0.05), glowMat(RED, 3), [dx, 0.05 + i * 0.25, 0.52], [0, 0, 0], [1, 1, 1], false)); });
    const t = textPlane('$۵۰۰', 0.42); t.position.set(0, -2.05, 0.5); g.add(t);
    const b1 = badge('−۵۰٪', 0.62, RED, WHITE, { dir: 'ltr' }); b1.position.set(-Math.sign(x) * 1.25, 0.95, 0.7); b1.rotation.z = -0.08; g.add(b1);
    const b2 = badge('+۱۰۰٪', 0.62, GREEN, INK, { dir: 'ltr' }); b2.position.set(-Math.sign(x) * 1.25, 0.05, 0.7); b2.rotation.z = 0.06; g.add(b2);
    g.position.set(x, -1.0, 0.6); g.rotation.y = -x * 0.12; scene.add(g); const L = new THREE.PointLight(VIO, 16, 8, 2); L.position.set(x, -0.5, 2); scene.add(L); },
  ringFire(scene, x) { const g = new THREE.Group(); g.add(mesh(new THREE.TorusGeometry(0.9, 0.16, 24, 96), std('#2A2F38', 0.6), [0, 0, 0])); g.add(mesh(new THREE.TorusGeometry(0.9, 0.17, 24, 96, Math.PI * 2 * 0.6), glowMat(GREEN, 0.9), [0, 0, 0.01], [0, 0, Math.PI / 2 - Math.PI * 2 * 0.6]));
    const t = textPlane('۶۰٪', 0.62); t.position.z = 0.2; g.add(t); g.position.set(x - 0.25 * Math.sign(x), 0.55, 0.3); g.scale.setScalar(0.9); scene.add(g);
    const c = new THREE.Group(); c.add(rbox(2.6, 1.7, 0.18, 0.12, std('#1D1A2B', 0.4), [0, 0, 0])); const ct = textPlane('چالش پراپ', 0.36); ct.position.set(0, 0.45, 0.1); c.add(ct);
    c.add(rbox(2.0, 0.18, 0.06, 0.08, std('#3A2F55', 0.5), [0, -0.05, 0.1])); c.add(rbox(1.1, 0.18, 0.08, 0.08, glowMat(RED, 1.5), [-0.45, -0.05, 0.12]));
    const ct2 = textPlane('حساب بسته شد', 0.26, { fg: RED }); ct2.position.set(0, -0.5, 0.1); c.add(ct2);
    const fire = new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (g2, w, h) => { const gr = g2.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,70,30,1)'); gr.addColorStop(0.5, 'rgba(255,170,40,0.9)'); gr.addColorStop(1, 'rgba(255,240,150,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, w, h); }), transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    for (let i = 0; i < 11; i++) { const fh = 0.7 + rnd(i * 7) * 0.9, f = new THREE.Mesh(new THREE.ConeGeometry(0.2, fh, 16, 1, true), fire); f.position.set(-1.1 + i * 0.22, -0.85 + fh / 2, 0.15); c.add(f); }
    c.position.set(x, -1.9, 1.0); c.rotation.set(0, -x * 0.2, -0.1 * Math.sign(x)); scene.add(c); const L = new THREE.PointLight('#FF7A30', 22, 8, 2); L.position.set(x, -1.6, 2.4); scene.add(L); },
  payout(scene, x) { const billTex = canvasTex(512, 240, (g2, w, h) => { g2.fillStyle = '#1F8F55'; g2.fillRect(0, 0, w, h); g2.strokeStyle = 'rgba(255,255,255,0.55)'; g2.lineWidth = 8; g2.strokeRect(16, 16, w - 32, h - 32); g2.fillStyle = 'rgba(255,255,255,0.9)'; g2.beginPath(); g2.arc(w / 2, h / 2, 60, 0, Math.PI * 2); g2.fill(); g2.font = FONT(90); g2.fillStyle = '#1F8F55'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText('$', w / 2, h / 2 + 4); });
    for (let i = 0; i < 5; i++) { const b = mesh(new THREE.BoxGeometry(2.0, 0.94, 0.04), [std('#1F8F55'), std('#1F8F55'), std('#1F8F55'), std('#1F8F55'), new THREE.MeshStandardMaterial({ map: billTex, roughness: 0.6 }), std('#1F8F55')], [x - 0.3 * Math.sign(x) + i * 0.1, -2.9 + i * 0.07, 1.6], [-1.3, 0, -0.25 + i * 0.12]); scene.add(b); }
    const c = new THREE.Group(); c.add(rbox(2.8, 1.25, 0.22, 0.2, std('#0E2A1F', 0.45), [0, 0, 0])); c.add(rbox(2.92, 1.37, 0.1, 0.24, glowMat(GREEN, 0.35), [0, 0, -0.1]));
    const t = textPlane('برداشت', 0.42); t.position.set(0.35, 0.18, 0.13); c.add(t); const t2 = textPlane('تأیید شد', 0.28, { fg: GREEN }); t2.position.set(0.35, -0.3, 0.13); c.add(t2);
    c.add(mesh(new THREE.CircleGeometry(0.36, 48), glowMat(GREEN, 0.45), [-0.9, 0, 0.13])); c.add(tube([[-1.06, 0.0, 0.16], [-0.94, -0.12, 0.16], [-0.72, 0.14, 0.16]], 0.05, std(INK, 0.5)));
    c.position.set(x, -0.6, 1.0); c.rotation.set(0, -x * 0.18, 0.05 * Math.sign(x)); scene.add(c); const L = new THREE.PointLight(GREEN, 12, 8, 2); L.position.set(x, -0.5, 2.5); scene.add(L); },
  rocket(scene, x) { const sx = Math.sign(x), pts = [[-1.6, -3.0, 0], [-1.1, -2.7, 0.1], [-0.7, -2.8, 0.2], [-0.3, -2.1, 0.2], [0.1, -2.2, 0.3], [0.4, -0.8, 0.3], [0.65, 1.6, 0.3]].map(([a, b, c]) => [x + a * sx * -1, b, c + 0.8]);
    scene.add(tube(pts, 0.1, glowMat(GREEN, 1.4))); scene.add(sphere(0.2, glowMat(GREEN, 1.8), pts[pts.length - 1], [1, 1, 1]));
    scene.add(tube([[x - 0.2 * sx, -0.4, 1.2], [x + 0.05 * sx, -0.2, 1.2], [x - 0.15 * sx, 0.1, 1.2], [x + 0.15 * sx, 0.35, 1.2]], 0.05, glowMat(RED, 3)));
    const b = badge('۲۰۰٪', 0.8, GREEN, INK); b.position.set(x + 0.85 * sx, 0.6, 1.1); b.rotation.z = -0.08; scene.add(b); const q = badge('؟', 0.75, RED); q.position.set(x - 0.95 * sx, 0.1, 1.3); q.rotation.z = 0.12; scene.add(q);
    const L = new THREE.PointLight(GREEN, 10, 9, 2); L.position.set(x, -0.5, 2.2); scene.add(L); },
  phone(scene, x) { const g = new THREE.Group(); g.add(rbox(2.0, 3.9, 0.22, 0.3, phys('#0F0C1B', 0.25, { clearcoat: 1 }), [0, 0, 0]));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.6), new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(400, 800, (g2, w, h) => { g2.fillStyle = '#161226'; g2.fillRect(0, 0, w, h);
      const card = (y, hh, lines) => { g2.fillStyle = '#2A2342'; g2.beginPath(); g2.roundRect(30, y, w - 60, hh, 28); g2.fill(); lines.forEach(([s, yy, c, sz]) => { g2.font = FONT(sz); g2.fillStyle = c; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.direction = 'rtl'; g2.fillText(s, w / 2, y + yy); }); };
      card(120, 200, [['سیگنال VIP', 60, '#C6F24E', 44], ['۹۰٪ سود ماهانه!', 135, '#FFFFFF', 42]]); card(360, 120, [['فقط امروز 🔥', 60, '#FFFFFF', 40]]); card(520, 120, [['ظرفیت محدود', 60, '#FF8A9A', 38]]); }) }));
    scr.position.z = 0.12; g.add(scr); g.position.set(x, -0.5, 0.8); g.rotation.set(0, -x * 0.25, -0.1 * Math.sign(x)); scene.add(g);
    const tri = new THREE.Shape(); tri.moveTo(0, 0.75); tri.lineTo(0.7, -0.5); tri.lineTo(-0.7, -0.5); tri.closePath(); const w = mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.2, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 4 }), glowMat(RED, 1.2), [x + 1.0 * Math.sign(x) * -1, -2.4, 1.8]);
    scene.add(w); const ex = textPlane('!', 0.75, { size: 160 }); ex.position.set(w.position.x, -2.45, 2.12); scene.add(ex); const L = new THREE.PointLight('#8E6BFF', 30, 8, 2); L.position.set(x, 0, 2.4); scene.add(L); },
  envelope(scene, x) { const g = new THREE.Group(), paper = std('#F4F0E8', 0.7); g.add(rbox(2.9, 1.9, 0.12, 0.06, paper, [0, 0, 0])); const tri = new THREE.Shape(); tri.moveTo(-1.45, 0.95); tri.lineTo(1.45, 0.95); tri.lineTo(0, -0.2); tri.closePath();
    g.add(mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.04, bevelEnabled: false }), std('#E2DCCD', 0.7), [0, 0, 0.07])); const lb = badge('۱ سال بعد', 0.42, VIO, WHITE, { glow: 0.4 }); lb.position.set(0.75, -0.55, 0.2); lb.rotation.z = 0.12; g.add(lb);
    g.position.set(x, -1.9, 1.4); g.rotation.set(-0.15, -x * 0.2, -0.08 * Math.sign(x)); scene.add(g);
    const hg = new THREE.Group(), gold = std('#D9B26A', 0.3, { metalness: 0.8 }), glass = phys('#FFE9C0', 0.05, { transparent: true, opacity: 0.25, clearcoat: 1 });
    hg.add(mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.12, 32), gold, [0, 1.15, 0])); hg.add(mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.12, 32), gold, [0, -1.15, 0]));
    hg.add(mesh(new THREE.ConeGeometry(0.6, 1.05, 32, 1, true), glass, [0, 0.55, 0], [Math.PI, 0, 0])); hg.add(mesh(new THREE.ConeGeometry(0.6, 1.05, 32, 1, true), glass, [0, -0.55, 0]));
    [[-0.12, -0.75, '#2DE38A'], [0.1, -0.9, '#FF4D5E'], [0.0, 0.62, '#2DE38A']].forEach(([dx, dy, c]) => hg.add(mesh(new THREE.BoxGeometry(0.1, 0.24, 0.1), glowMat(c, 1.8), [dx, dy, 0], [0, 0, 0], [1, 1, 1], false)));
    for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3; hg.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 12), gold, [Math.cos(a) * 0.68, 0, Math.sin(a) * 0.68])); }
    hg.position.set(x - 0.15 * Math.sign(x), 0.0, -0.3); hg.scale.setScalar(0.85); scene.add(hg); const L = new THREE.PointLight('#FFC27A', 12, 8, 2); L.position.set(x, 0, 2.2); scene.add(L); },
  grid100(scene, x) { const g = new THREE.Group(); g.add(rbox(3.8, 3.8, 0.2, 0.2, phys('#0B1A16', 0.3, { clearcoat: 1 }), [0, 0, 0]));
    for (let i = 0; i < 100; i++) { const c = i % 10, r = Math.floor(i / 10), on = i < 63, col = on ? (rnd(i * 3.3) > 0.42 ? '#2DE38A' : '#FF4D5E') : '#1E2A28';
      g.add(rbox(0.28, 0.28, on ? 0.16 : 0.08, 0.06, on ? glowMat(col, 0.55) : std(col, 0.6), [1.5 - c * 0.333, 1.5 - r * 0.333, 0.14])); }
    const b = badge('۱۰۰', 0.6, LIME, INK); b.position.set(-1.4, 2.05, 0.3); b.rotation.z = 0.1; g.add(b);
    g.position.set(x, -0.7, 0.6); g.rotation.set(-0.12, -x * 0.22, 0); scene.add(g); const L = new THREE.PointLight(GREEN, 10, 9, 2); L.position.set(x, -0.5, 2.5); scene.add(L); },
};
function die(x, y, z, n, rot) { const g = new THREE.Group(); g.add(rbox(0.9, 0.9, 0.9, 0.18, phys('#FBF9FF', 0.25, { clearcoat: 1 }), [0, 0, 0])); const P = { 3: [[-1, -1], [0, 0], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]] }, pip = std('#1A1424', 0.4);
  P[n].forEach(([a, b]) => g.add(sphere(0.085, pip, [a * 0.24, b * 0.24, 0.43], [1, 1, 0.4]))); [[0.45, 0, 0], [0, 0.45, 0]].forEach((p, k) => g.add(sphere(0.085, pip, k ? [0, 0.43, 0] : [0.43, 0, 0], k ? [1, 0.4, 1] : [0.4, 1, 1])));
  g.position.set(x, y, z); g.rotation.set(...rot); g.traverse((m) => { m.castShadow = true; }); return g; }

// ---------- the covers ----------
const COVERS = [
  { id: 'k22', theme: 'city', l1: 'به استراتژیت اعتماد داری؟', l2: 'یا از بررسیش می‌ترسی؟', c2: RED, side: 1, tint: '#2CE6C0', seed: 1, sym: 'gate', face: 'worried', near: 'palm' },
  { id: 'k13', theme: 'monitors', l1: 'سودت از استراتژیه؟', l2: 'یا از شانسه؟', c2: GREEN, side: -1, tint: '#46C8FF', seed: 2, sym: 'chartDice', face: 'thinking', far: 'chin', look: [0.7, 0.5] },
  { id: 'k12', theme: 'neon', l1: 'نصف حسابت رفت؟', l2: '۵۰٪ سود کافی نیست!', c2: RED, side: 1, tint: '#A88BFF', seed: 3, sym: 'accountBar', face: 'shocked', near: 'palm' },
  { id: 'k11', theme: 'warm', l1: 'وین‌ریت ۶۰ درصد،', l2: 'پس چرا چالش سوخت؟', c2: RED, side: 1, tint: '#FF9A50', seed: 4, sym: 'ringFire', face: 'sad', look: [-0.6, -0.4] },
  { id: 'k1', theme: 'monitors', l1: 'پراپ تریدرها', l2: 'چطوری به برداشت رسیدن؟', c2: GREEN, side: -1, tint: '#3DF59A', seed: 5, sym: 'payout', face: 'smirk', near: 'point' },
  { id: 'q2', theme: 'city', l1: '۲۰۰٪ سود توی یه ماه؟', l2: 'بیا یه حساب ساده کنیم', c2: RED, side: 1, tint: '#46C8FF', seed: 6, sym: 'rocket', face: 'shocked', look: [-0.6, 0.6] },
  { id: 'q3', theme: 'neon', l1: 'سیگنال ۹۰٪ سود ماهانه؟', l2: 'قبل از خرید اینو ببین', c2: RED, side: 1, tint: '#A88BFF', seed: 7, sym: 'phone', face: 'thinking', far: 'chin', look: [-0.7, 0.2] },
  { id: 'k10', theme: 'warm', l1: 'یه پیام از خودِ', l2: 'یک سال بعدت', c2: GREEN, side: -1, tint: '#2CE6C0', seed: 8, sym: 'envelope', face: 'happy', near: 'palm' },
  { id: 'k9', theme: 'monitors', l1: 'چالش ۱۰۰ معامله', l2: 'تا آخرش میری؟', c2: GREEN, side: 1, tint: '#3DF59A', seed: 9, sym: 'grid100', face: 'smirk', near: 'point' },
];

// ---------- the hook on the 2D canvas ----------
const cv = document.getElementById('c').getContext('2d');
function measure(s, size) { cv.font = FONT(size); cv.direction = 'rtl'; return cv.measureText(s).width; }
function hook(l1, l2, c2) {
  cv.clearRect(0, 0, W, H);
  const gr = cv.createLinearGradient(0, 300, 0, 760); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); cv.fillStyle = gr; cv.fillRect(0, 300, W, 460);
  const fit = (s, size) => Math.min(size, size * 960 / measure(s, size));
  [[l1, 470, fit(l1, 112), WHITE], [l2, 600, fit(l2, 100), c2]].forEach(([s, y, size, col]) => {
    cv.save(); cv.font = FONT(size); cv.textAlign = 'center'; cv.textBaseline = 'middle'; cv.direction = 'rtl'; cv.lineJoin = 'round';
    cv.shadowColor = 'rgba(0,0,0,0.85)'; cv.shadowBlur = 30; cv.shadowOffsetY = 8; cv.strokeStyle = INK; cv.lineWidth = 18; cv.strokeText(s, CX, y); cv.shadowColor = 'transparent';
    if (col !== WHITE) { cv.shadowColor = col + '88'; cv.shadowBlur = 26; } cv.fillStyle = col; cv.fillText(s, CX, y); cv.restore(); });
}

// ---------- render ----------
// the grade: teal shadows, warm highlights, a little contrast, a vignette and grain
const GRADE = { uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
  void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb; float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * vec3(0.88, 1.0, 1.08), (1.0 - l) * 0.3); col = mix(col, col * vec3(1.06, 1.0, 0.93), l * 0.25);
    col = (col - 0.5) * 1.1 + 0.5; vec2 d = (vUv - 0.5) * vec2(1.0, 1.35); float v = smoothstep(0.95, 0.3, length(d)); col *= mix(0.55, 1.0, v);
    float n = fract(sin(dot(vUv * vec2(1080.0, 1920.0), vec2(12.9898, 78.233))) * 43758.5453); col += (n - 0.5) * 0.03; gl_FragColor = vec4(col, c.a); }` };
let composer = null;
function render(i) {
  const C = COVERS[i], scene = new THREE.Scene(); scene.environment = ENV; scene.environmentIntensity = 0.16;
  room(scene, C); scene.add(trader({ side: C.side, face: C.face, near: C.near, far: C.far, look: C.look }));
  SYM[C.sym](scene, -C.side * 1.75);
  const cam = new THREE.PerspectiveCamera(30, W / H, 1, 120); cam.position.set(0, 0.6, 24); cam.lookAt(0, -0.35, 0);
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  composer = new EffectComposer(renderer, rt); composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, cam));
  const ao = new GTAOPass(scene, cam, W, H); ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.5, scale: 1.2 }); ao.blendIntensity = 0.85; composer.addPass(ao);
  composer.addPass(new BokehPass(scene, cam, { focus: 23.5, aperture: 0.006, maxblur: 0.012 }));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.6, 0.9));
  composer.addPass(new OutputPass());
  composer.addPass(new ShaderPass(GRADE));
  composer.render();
  hook(C.l1, C.l2, C.c2);
  composer.dispose(); rt.dispose();
}
window.N = COVERS.length; window.IDS = COVERS.map((c) => c.id); window.render = render;
window.addEventListener('load', async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await document.fonts.load('40px "Noto Color Emoji"', '🔥');
  await new Promise((ok) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d').drawImage(im, 0, 0, 256, 256); window.ICON_TEX = new THREE.CanvasTexture(c); window.ICON_TEX.colorSpace = THREE.SRGBColorSpace; ok(); }; im.onerror = ok; im.src = window.LOGO.icon; });
  render(0); window.ready = true;
});
