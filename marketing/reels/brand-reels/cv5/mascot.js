// cv5 · the mascot in full body: the same round-head character as cv4, with the reference grid's proportions (the head
// a little wider than the shoulders, a short visible neck, slim arms and legs, a thin dark outline), now in a dark navy
// hoodie with subtle purple details, black casual pants and simple sneakers. The scene code (renderer, materials, text,
// the rooms, the symbols, the grade and the hook) is cv4's.
// window.view(i) draws VIEWS[i] (1080×1920): the turnaround, the poses and two covers.
const { THREE, RoundedBoxGeometry, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, BokehPass, OutputPass, GTAOPass, ShaderPass, MarchingCubes } = window.T3;
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
const glowMat = (c, k = 2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k * 1.3, roughness: 0.4 });
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

const FLOOR = -5.26;   // the floor under the mascot's soles

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
  if (o.desk !== false) {
  // the desk: wood with a clear coat
  const desk = rbox(26, 3.2, 6, 0.12, phys('#6A4A30', 0.3, { map: woodTex(), clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 1.0 }), [0, -5.15, 2.6]); scene.add(desk);
  // a mug and a notebook on the desk, on the trader's side
  scene.add(mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.58, 32), phys('#EDE8E0', 0.3, { clearcoat: 0.6 }), [s * 2.75, -3.26, 2.3])); scene.add(mesh(new THREE.TorusGeometry(0.15, 0.05, 12, 24), phys('#EDE8E0', 0.3), [s * 3.07, -3.26, 2.3], [0, 0, Math.PI / 2]));
  } else scene.add(mesh(new THREE.PlaneGeometry(80, 60), phys('#0A0E14', 0.34, { clearcoat: 1, clearcoatRoughness: 0.2 }), [0, FLOOR, 0], [-Math.PI / 2, 0, 0]));   // no desk: a glossy floor for a standing mascot
  // lights: key, two rims (the cover's tint and violet), fill
  const key = new THREE.DirectionalLight('#FFE7CF', 1.45); key.position.set(-s * 7, 9, 16); key.target.position.set(s * 1.5, -1, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 50 }); key.shadow.bias = -0.0004; key.shadow.radius = 8; scene.add(key, key.target);
  const rim1 = new THREE.SpotLight(tint, 150, 30, 0.5, 0.6, 2); rim1.position.set(s * 5.5, 4.5, -6); rim1.target.position.set(s * 1.75, -0.5, 0); scene.add(rim1, rim1.target);
  const rim2 = new THREE.SpotLight('#8E6BFF', 80, 30, 0.5, 0.7, 2); rim2.position.set(-s * 1.0, 6, -7); rim2.target.position.set(s * 1.75, 0, 0); scene.add(rim2, rim2.target);
  const fill = new THREE.PointLight(tint, 8, 14, 2); fill.position.set(-s * 0.5, -1.5, 5); scene.add(fill);
  scene.add(new THREE.HemisphereLight('#4A5A80', '#050505', 0.16));
  const front = new THREE.DirectionalLight('#FFF4E8', 0.5); front.position.set(0, 2, 22); front.target.position.set(s * 1.75, 0, 0); scene.add(front, front.target);
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
    const q = textPlane('؟', 0.78, { fg: RED, size: 160 }); q.position.z = 0.28; b.add(q); b.position.set(-0.05 * Math.sign(-x), 1.5, 1.2); scene.add(b); },
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

// the grade: teal shadows, warm highlights, a little contrast, a vignette and grain
const GRADE = { uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
  void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb; float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * vec3(0.88, 1.0, 1.08), (1.0 - l) * 0.3); col = mix(col, col * vec3(1.06, 1.0, 0.93), l * 0.25);
    col = (col - 0.5) * 1.1 + 0.5; vec2 d = (vUv - 0.5) * vec2(1.0, 1.35); float v = smoothstep(0.95, 0.3, length(d)); col *= mix(0.55, 1.0, v);
    float n = fract(sin(dot(vUv * vec2(1080.0, 1920.0), vec2(12.9898, 78.233))) * 43758.5453); col += (n - 0.5) * 0.03; gl_FragColor = vec4(col, c.a); }` };

// ================= cv5 · the mascot =================
const HR = 1.0;                 // the head's radius; the head is a perfect sphere
const HEM = -3.32, ZF5 = 0.66;  // the hoodie's hem, and its depth against its width
// the hoodie's half-width down the body: narrower than the head, as in the reference
const TORSO5 = [[0.22, -1.18], [0.42, -1.24], [0.57, -1.33], [0.67, -1.46], [0.74, -1.65], [0.78, -1.94], [0.795, -2.3], [0.79, -2.8], [0.77, -3.2], [0.755, -3.6]];
// a smooth profile (Catmull-Rom through the points), so the hoodie has no creases: a table of the radius every 0.005 down
const TLUT = (() => { const P = TORSO5, pts = []; for (let i = 0; i < P.length - 1; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
  for (let s = 0; s < 40; s++) { const t = s / 40, cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t); pts.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]); } }
  pts.push(P[P.length - 1]); const out = []; let j = 0; for (let y = P[0][1]; y >= P[P.length - 1][1] - 1e-9; y -= 0.005) { while (j < pts.length - 2 && pts[j + 1][1] > y) j++; const [r0, y0] = pts[j], [r1, y1] = pts[j + 1]; out.push(r0 + (r1 - r0) * (y - y0) / ((y1 - y0) || 1)); } return out; })();
function torsoR5(y) { if (y > TORSO5[0][1]) return 0; const k = (TORSO5[0][1] - y) / 0.005, i = Math.min(TLUT.length - 2, Math.floor(k)), f = Math.min(1, k - i); return TLUT[i] + (TLUT[i + 1] - TLUT[i]) * f; }
const frontZ5 = (x, y) => ZF5 * Math.sqrt(Math.max(0, torsoR5(y) ** 2 - x * x));
const smin = (a, b, k) => { const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (b - a) / k)); return b + (a - b) * h - k * h * (1 - h); };
const smax = (a, b, k) => -smin(-a, -b, k);
/** The distance from p to the segment a–b minus r, and where along the segment (0 at a, 1 at b) the nearest point is. */
function capsuleDT(px, py, pz, a, b, r) { const bx = b.x - a.x, by = b.y - a.y, bz = b.z - a.z, ax = px - a.x, ay = py - a.y, az = pz - a.z; const t = Math.max(0, Math.min(1, (ax * bx + ay * by + az * bz) / (bx * bx + by * by + bz * bz))); const dx = ax - bx * t, dy = ay - by * t, dz = az - bz * t; return [Math.sqrt(dx * dx + dy * dy + dz * dz) - r, t]; }

// ---------- the toon outline: an inverted hull (a copy pushed out along its normals, drawn from the back) ----------
const OUTLINE = new THREE.MeshBasicMaterial({ color: '#0C0E1A', side: THREE.BackSide });
// the painted look: light wraps softly round the forms (half-lambert), so the shading turns in a gentle gradient
const WRAP = THREE.ShaderChunk.lights_physical_pars_fragment.replace('reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );', 'reflectedLight.directDiffuse += saturate( ( dot( geometryNormal, directLight.direction ) + 0.5 ) / 1.5 ) * directLight.color * BRDF_Lambert( material.diffuseColor );');   // the diffuse only: the highlights keep the true angle
function painted(m) { m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', WRAP); }; m.customProgramCacheKey = () => 'painted'; return m; }
renderer.shadowMap.type = THREE.PCFShadowMap;   // with shadow.radius, for soft shadows
function hull(m, w) { const geo = m.geometry.clone(), p = geo.attributes.position, n = geo.attributes.normal, s = m.scale;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * w / Math.abs(s.x), p.getY(i) + n.getY(i) * w / Math.abs(s.y), p.getZ(i) + n.getZ(i) * w / Math.abs(s.z));
  const h = new THREE.Mesh(geo, OUTLINE); h.position.copy(m.position); h.quaternion.copy(m.quaternion); h.scale.copy(m.scale); return h; }
function outlined(parent, m, w = 0.02) { parent.add(m); parent.add(hull(m, w)); return m; }
function cylBetween(a, b, r0, r1, mat) { const d = new V3().subVectors(b, a); const m = mesh(new THREE.CylinderGeometry(r1, r0, d.length(), 32), mat); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); return m; }
/** Point a hand: its fingers (local +y) along F, its palm (local +z) towards P. */
function orient(o, F, P) { const y = F.clone().normalize(), z = P.clone().addScaledVector(y, -P.dot(y)).normalize(), x = new V3().crossVectors(y, z); o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); }

function mats5() { const M = {
  skin: std('#F7F7F5', 0.96, { envMapIntensity: 0.4 }),
  eye: phys('#0B0B0F', 0.22, { clearcoat: 1, clearcoatRoughness: 0.1 }), ink: std('#16161B', 0.6), mouthIn: std('#2A1A1D', 0.7), tongue: std('#D9787A', 0.55),
  hoodie: phys('#FFFFFF', 0.95, { vertexColors: true, sheen: 0.4, sheenColor: '#7C8CC8', sheenRoughness: 0.8, envMapIntensity: 0.6 }),
  lower: std('#FFFFFF', 0.85, { vertexColors: true, envMapIntensity: 0.6 }),
  purple: std('#8A6CFF', 0.6, { emissive: '#8A6CFF', emissiveIntensity: 0.08 }), silver: std('#C9C9D6', 0.4, { metalness: 0.4 }),
}; ['skin', 'hoodie', 'lower', 'purple', 'silver'].forEach((k) => painted(M[k])); return M; }

// ---------- the face: black oval eyes with a catch-light, thin arched brows, a small mouth ----------
function face5(g, M, f, look) {
  const [lx, ly] = look;
  const surf = (x, y, out = 0) => { const v = new V3(x, y, Math.sqrt(Math.max(0, HR * HR - x * x - y * y))); return v.clone().addScaledVector(v.clone().normalize(), out); };
  const curve = (pts, r, mat) => g.add(tube(pts.map(([x, y]) => surf(x, y, 0.004).toArray()), r, mat));
  const onSkin = (shape, mat, out) => { const geo = new THREE.ShapeGeometry(shape, 32), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const v = surf(p.getX(i), p.getY(i), out); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat); g.add(m); };
  const F = { curious: { sy: 1, arch: 0.03, rin: 0.045, rout: -0.01, raise: 0, mouth: 'frown' }, smile: { sy: 1, arch: 0.035, rin: 0, rout: 0, raise: 0.01, mouth: 'smile' },
    happy: { sy: 0.92, arch: 0.04, rin: 0, rout: 0, raise: 0.03, mouth: 'open' }, thinking: { sy: 1, arch: 0.03, rin: 0.0, rout: 0, raise: 0, mouth: 'flat', up: 0.075 },
    surprised: { sy: 1.2, arch: 0.045, rin: 0.01, rout: 0, raise: 0.09, mouth: 'o' } }[f];
  [-1, 1].forEach((e) => { const ex = e * 0.3 + lx * 0.07, ey = -0.02 + ly * 0.06;
    const p = surf(ex, ey, -0.035), eye = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), M.eye); eye.scale.set(0.1, 0.15 * F.sy, 0.06); eye.position.copy(p); eye.quaternion.setFromUnitVectors(new V3(0, 0, 1), p.clone().normalize()); g.add(eye);
    g.add(mesh(new THREE.SphereGeometry(0.027, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), surf(ex - 0.035, ey + 0.068 * F.sy, 0.028).toArray(), [0, 0, 0], [1, 1, 1], false));
    const bx = e * 0.3 + lx * 0.03, by = 0.27 + F.raise + ly * 0.02 + (F.up && e > 0 ? F.up : 0);
    curve([-1, -0.5, 0, 0.5, 1].map((t) => [bx + t * 0.105, by + F.arch * (1 - t * t) + F.rin * (1 - t * e) / 2 + F.rout * (1 + t * e) / 2]), 0.02, M.ink); });
  if (F.mouth === 'frown') curve([[-0.085, -0.405], [-0.042, -0.378], [0, -0.37], [0.042, -0.378], [0.085, -0.405]], 0.018, M.ink);
  else if (F.mouth === 'smile') curve([[-0.1, -0.345], [-0.05, -0.385], [0, -0.395], [0.05, -0.385], [0.1, -0.345]], 0.018, M.ink);
  else if (F.mouth === 'flat') curve([[-0.075, -0.4], [0, -0.39], [0.08, -0.37]], 0.018, M.ink);
  else if (F.mouth === 'open') { const s = new THREE.Shape(); s.moveTo(-0.115, -0.33); s.lineTo(0.115, -0.33); s.absellipse(0, -0.33, 0.115, 0.095, 0, Math.PI, true); onSkin(s, M.mouthIn, 0.003); const t = new THREE.Shape(); t.absellipse(0, -0.395, 0.055, 0.026, 0, Math.PI * 2); onSkin(t, M.tongue, 0.005); }
  else if (F.mouth === 'o') { const s = new THREE.Shape(); s.absellipse(0, -0.39, 0.045, 0.06, 0, Math.PI * 2); onSkin(s, M.mouthIn, 0.003); }
}

// ---------- a white cartoon hand: the right hand, fingers along +y, palm towards +z, thumb on +x (mirror for the left) ----------
function hand5(pose, M, mirror) {
  const h = new THREE.Group(), W = 0.017;
  outlined(h, sphere(0.155, M.skin, [0, 0.14, 0], [1, 1.1, 0.62]), W);
  const curled = { point: [0, 1, 1, 1], chin: [0, 1, 1, 1] }[pose] ?? [0, 0, 0, 0], bend = pose === 'down' ? 0.35 : pose === 'palm' ? -0.15 : 0.05, rest = pose === 'down';
  [[0.1, 0.18, -0.1], [0.033, 0.205, -0.03], [-0.035, 0.19, 0.04], [-0.1, 0.15, 0.12]].forEach(([x, L, a], k) => { if (rest) a *= 0.3;
    const c = curled[k], len = c ? 0.05 : L, f = mesh(new THREE.CapsuleGeometry(0.046, len, 6, 12), M.skin);
    f.position.set(x, 0.3 + (c ? 0.0 : len / 2) - (c ? 0.02 : 0), c ? 0.07 : 0); f.rotation.set(c ? 1.2 : bend, 0, a); outlined(h, f, W); });
  const th = mesh(new THREE.CapsuleGeometry(0.046, 0.13, 6, 12), M.skin, pose === 'point' ? [0.12, 0.17, 0.08] : rest ? [0.13, 0.15, 0.07] : pose === 'chin' ? [0.17, 0.15, 0.03] : [0.165, 0.13, 0.04], pose === 'point' ? [0.5, 0, -0.35] : rest ? [0.35, 0, -0.35] : pose === 'chin' ? [0, 0, -1.25] : [0, 0, -0.75]); outlined(h, th, W);
  if (mirror) h.scale.x = -1;
  return h;
}

/**
 * Soft shapes: a signed distance field meshed with marching cubes, so every join is rounded. Its colour is painted per
 * voxel (vertex colours, so a stripe or a sole is part of the same smooth surface, not a separate ring or slab), and a
 * second mesh of the same field, a little further out and drawn from the back, is its outline.
 */
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function softMesh({ res, C, HALF, sdf, paint, mat, outline = 0.016, polys = 500000 }) {
  const mc = new MarchingCubes(res, mat, false, true, polys); mc.isolation = 0; const f = mc.field, pal = mc.palette, hs = mc.halfsize;
  for (let z = 0; z < res; z++) { const pz = C.z + ((z - hs) / hs) * HALF.z;
    for (let y = 0; y < res; y++) { const py = C.y + ((y - hs) / hs) * HALF.y;
      for (let x = 0; x < res; x++) { const px = C.x + ((x - hs) / hs) * HALF.x, i = x + y * res + z * res * res, d = sdf(px, py, pz);
        f[i] = -d; if (Math.abs(d) < 0.07) { const c = paint(px, py, pz); pal[i * 3] = c[0]; pal[i * 3 + 1] = c[1]; pal[i * 3 + 2] = c[2]; } } } }
  mc.update(); mc.position.copy(C); mc.scale.copy(HALF); mc.castShadow = true; mc.receiveShadow = true;
  const g = new THREE.Group(); g.add(mc);
  if (outline) { const ol = new MarchingCubes(res, OUTLINE, false, false, polys); ol.field.set(f); ol.isolation = -outline; ol.update(); ol.position.copy(C); ol.scale.copy(HALF); g.add(ol); }
  return g;
}
/** The distance from p to a ring of radius R and thickness t round the axis n through c (a rolled cuff or hem), and the height along n. */
function ringD(px, py, pz, c, n, R, t, sq = 1) { const rx = px - c.x, ry = py - c.y, rz = pz - c.z, h = rx * n.x + ry * n.y + rz * n.z, rad = Math.hypot(rx - h * n.x, ry - h * n.y, rz - h * n.z); return [Math.hypot(rad - R, h * sq) - t, h, rad]; }
const ellD = (x, y, z, rx, ry, rz) => (Math.hypot(x / rx, y / ry, z / rz) - 1) * Math.min(rx, ry, rz);

/**
 * The hoodie and both sleeves as one soft surface: the torso (a smooth profile with sloping shoulders, flattened front
 * to back), a rolled hem, a soft collar and the hood folded on the back, and a capsule per arm segment with a rolled
 * cuff. The shoulder blend is wide and fades along the upper arm, so the sleeve grows out of a round shoulder while an
 * arm at rest still hangs free. Painted navy, the ribbed bands a shade darker, a thin purple line above the hem and each
 * cuff, and a purple lining inside the collar.
 */
function hoodieSoft(arms, mat) {
  const A = arms.map(([sh, el, wr]) => { const fd = new V3().subVectors(wr, el).normalize(); return { sh, el, wr, fd, cc: wr.clone().addScaledVector(fd, -0.07) }; });
  const NAVY = lin('#24325F'), RIB = lin('#1C2752'), PURP = lin('#8A6CFF'), TOP = TORSO5[0][1], hemY = HEM + 0.08, hemR = torsoR5(hemY) - 0.015, ca = Math.cos(0.22), sa = Math.sin(0.22);
  const collar = (px, py, pz) => { const cy = py + 1.24, cz = pz + 0.05, yy = cy * ca - cz * sa, zz = cy * sa + cz * ca, ring = Math.hypot(px / 1.15, zz / 0.92) - 0.3; return [Math.hypot(ring, yy) - 0.13, ring, yy]; };
  const torso = (px, py, pz) => { const q = Math.hypot(px, pz / ZF5); let d = py > TOP ? Math.max(q - 0.22, py - TOP) : (q - torsoR5(py)) * 0.8; d = smax(d, HEM - py, 0.12);
    return [smin(d, Math.hypot(q - hemR, py - hemY) * 0.8 - 0.07, 0.05), q]; };
  const sdf = (px, py, pz) => { let [d] = torso(px, py, pz);
    d = smin(d, collar(px, py, pz)[0], 0.06); d = smin(d, ellD(px, py + 1.37, pz + 0.46, 0.6, 0.42, 0.3), 0.1);
    for (const a of A) { const [du, tu] = capsuleDT(px, py, pz, a.sh, a.el, 0.155); d = smin(d, du, 0.22 - 0.2 * tu); d = smin(d, capsuleDT(px, py, pz, a.el, a.wr, 0.14)[0], 0.06); d = smin(d, ringD(px, py, pz, a.cc, a.fd, 0.135, 0.058, 0.85)[0], 0.035); }
    return d; };
  const paint = (px, py, pz) => {
    for (const a of A) { const [, h, rad] = ringD(px, py, pz, a.cc, a.fd, 0.135, 0.058); if (rad < 0.3 && h > -0.16 && h < 0.12) { const t = Math.min(1, Math.max(0, (0.026 - Math.abs(h + 0.092)) / 0.012)); return mixc(h > -0.065 ? RIB : NAVY, PURP, t); } }
    const [, q] = torso(px, py, pz); if (py < HEM + 0.25 && Math.abs(q - torsoR5(py)) < 0.14) { const t = Math.min(1, Math.max(0, (0.024 - Math.abs(py - (HEM + 0.17))) / 0.01)); return mixc(py < HEM + 0.15 ? RIB : NAVY, PURP, t); }
    const [cd, ring, yy] = collar(px, py, pz); if (cd < 0.03 && ring < -0.03 && yy > -0.04) return mixc(NAVY, PURP, 0.8);
    return NAVY; };
  return softMesh({ res: 150, C: new V3(0, -1.92, 0.12), HALF: new V3(2.05, 1.82, 1.0), sdf, paint, mat });
}

/**
 * The pants and both sneakers as one soft surface: the seat, two gently tapered legs with a turned hem, and each shoe
 * (a round toe and heel blended together on a rounded sole). Painted black for the pants, a dark upper, a white sole,
 * a purple side stripe and heel tab, and white laces.
 */
function lowerSoft(mat) {
  const PANTS = lin('#17181F'), SHOE = lin('#1F2334'), SOLE = lin('#EFEEEA'), PURP = lin('#8A6CFF'), LACE = lin('#E8E6F0'), UP = new V3(0, 1, 0);
  const L = [-1, 1].map((a) => ({ hip: new V3(a * 0.33, -3.28, 0), ank: new V3(a * 0.37, FLOOR + 0.44, 0.03), x: a * 0.4 }));
  const seat = (px, py, pz) => ellD(px, py + 3.22, pz, 0.72, 0.42, 0.48);
  const leg = (l, px, py, pz) => { const [d0, t] = capsuleDT(px, py, pz, l.hip, l.ank, 0); return smin(d0 - (0.27 - 0.035 * t), ringD(px, py, pz, new V3(l.ank.x, FLOOR + 0.52, l.ank.z), UP, 0.235, 0.034)[0], 0.02); };
  const shoe = (l, px, py, pz) => { const x = px - l.x, upper = smin(ellD(x, py - FLOOR - 0.22, pz + 0.12, 0.235, 0.2, 0.28), ellD(x, py - FLOOR - 0.17, pz - 0.3, 0.235, 0.155, 0.3), 0.15);
    const zc = Math.max(-0.28, Math.min(0.42, pz)), foot = Math.hypot(x / 1.0, pz - zc) - 0.235, sole = smax(foot, Math.abs(py - FLOOR - 0.06) - 0.06, 0.05);
    return [smin(upper, sole, 0.03), upper, sole, x]; };
  const sdf = (px, py, pz) => { const s0 = seat(px, py, pz); let d = 9; for (const l of L) d = Math.min(d, smin(smin(s0, leg(l, px, py, pz), 0.12), shoe(l, px, py, pz)[0], 0.03)); return d; };
  const paint = (px, py, pz) => { const l = px < 0 ? L[0] : L[1], [s, upper, sole, x] = shoe(l, px, py, pz);
    if (s > Math.min(seat(px, py, pz), leg(l, px, py, pz)) + 0.01 || py > FLOOR + 0.5) return PANTS;
    if (sole < upper) return SOLE;
    if (pz < -0.3 && py > FLOOR + 0.27) return PURP;
    if (Math.abs(py - FLOOR - 0.2) < 0.024 && Math.abs(x) > 0.17 && pz > -0.22 && pz < 0.36) return PURP;
    if (py > FLOOR + 0.28 && pz > 0.03 && pz < 0.37 && Math.abs(x) < 0.09 && (pz - 0.03) % 0.11 < 0.04) return LACE;
    return SHOE; };
  return softMesh({ res: 130, C: new V3(0, (FLOOR - 0.1 - 2.72) / 2, 0.08), HALF: new V3(0.8, (-2.72 - FLOOR + 0.1) / 2, 0.66), sdf, paint, mat });
}
/** A flat picture laid on the hoodie's front (the pocket, the logo), following its curve. */
function frontDecal(tex, cx, cy, w, h) { const geo = new THREE.PlaneGeometry(w, h, 32, 16), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = cx + p.getX(i), y = cy + p.getY(i); p.setXYZ(i, x, y, frontZ5(x, y) + 0.008); } geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); m.receiveShadow = true; return m; }
const POCKET = () => canvasTex(512, 264, (g, w, h) => { const P = (k) => { g.beginPath(); g.moveTo(w * 0.2 + k, h * 0.07 + k); g.lineTo(w * 0.8 - k, h * 0.07 + k); g.quadraticCurveTo(w * 0.86 - k, h * 0.55, w * 0.97 - k, h * 0.93 - k); g.lineTo(w * 0.03 + k, h * 0.93 - k); g.quadraticCurveTo(w * 0.14 + k, h * 0.55, w * 0.2 + k, h * 0.07 + k); g.closePath(); };
  P(0); g.fillStyle = 'rgba(8,12,28,0.28)'; g.fill(); g.lineWidth = 7; g.strokeStyle = 'rgba(4,6,16,0.55)'; g.stroke();
  P(14); g.setLineDash([10, 9]); g.lineWidth = 3; g.strokeStyle = 'rgba(140,155,215,0.45)'; g.stroke(); });

/**
 * The mascot, standing on y = FLOOR, facing +z. o: face (curious, smile, happy, thinking, surprised), look [x, y],
 * left / right (the arm poses: down, palm, point, chin, wave; left is +x), tilt, nod.
 */
function buddy(o = {}) {
  const M = mats5(), g = new THREE.Group(), OW = 0.016;
  // the head on a short neck
  const hd = new THREE.Group(); outlined(hd, sphere(HR, M.skin, [0, 0, 0], [1, 1, 1]), 0.02); face5(hd, M, o.face ?? 'curious', o.look ?? [0, 0]);
  hd.rotation.set(o.nod ?? 0.03, o.turn ?? 0, o.tilt ?? 0); g.add(hd);
  outlined(g, mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.5, 32), M.skin, [0, -1.12, -0.03]), OW);
  // purple drawstrings with silver tips, the kangaroo pocket, the logo on the left chest
  [-1, 1].forEach((e) => { const ys = [-1.36, -1.56, -1.76, -1.97]; g.add(tube(ys.map((y, k) => [e * (0.1 + k * 0.008), y, frontZ5(e * 0.1, y) + 0.025]), 0.02, M.purple));
    g.add(mesh(new THREE.CapsuleGeometry(0.03, 0.06, 6, 12), M.silver, [e * 0.125, -2.02, frontZ5(e * 0.125, -2.02) + 0.03])); });
  g.add(frontDecal(POCKET(), 0, -2.78, 1.18, 0.6));
  if (window.ICON_TEX) g.add(frontDecal(window.ICON_TEX, 0.38, -1.84, 0.24, 0.24));
  // the arms and white hands; the sleeves are part of the hoodie's soft surface
  const pose = { 1: o.left ?? 'down', [-1]: o.right ?? 'down' }, arms = [];
  [-1, 1].forEach((a) => { const p = pose[a], sh = new V3(a * 0.56, -1.61, -0.02); let el, wr, F, P;
    if (p === 'palm') { el = new V3(a * 1.1, -2.4, 0.32); wr = new V3(a * 1.6, -1.95, 0.76); F = new V3(a, 0.6, 0.3); P = new V3(a * 0.1, 0.6, 1); }
    else if (p === 'point') { el = new V3(a * 1.1, -2.3, 0.34); wr = new V3(a * 1.64, -1.76, 0.8); F = new V3(a, 0.4, 0.3); P = new V3(0, -1, 0.2); }
    else if (p === 'chin') { el = new V3(a * 0.72, -2.35, 0.74); wr = new V3(a * 0.36, -1.18, 0.64); F = new V3(-a * 0.1, 1, 0.35); P = new V3(a * 0.15, -0.3, 1); }   // the «hmm» L: the index finger on the cheek, the thumb under the chin
    else if (p === 'wave') { el = new V3(a * 1.2, -1.66, 0.16); wr = new V3(a * 1.4, -0.66, 0.3); F = new V3(a * 0.18, 1, 0.04); P = new V3(0, 0.1, 1); }
    else { el = new V3(a * 1.0, -2.38, -0.03); wr = new V3(a * 1.07, -3.18, 0.05); P = new V3(-a * 0.55, 0, -0.85); }
    arms.push([sh, el, wr]);
    const fd = new V3().subVectors(wr, el).normalize(), h = hand5(p, M, a > 0); h.position.copy(wr).addScaledVector(fd, 0.03); orient(h, F ?? fd, P); h.scale.multiplyScalar(1.12); g.add(h); });
  g.add(hoodieSoft(arms, M.hoodie));
  g.add(lowerSoft(M.lower));
  return g;
}

// ---------- the scenes ----------
function studio(scene) {
  scene.background = new THREE.Color('#0B0B0F');
  scene.add(mesh(new THREE.PlaneGeometry(70, 46), new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(64, 512, (g2, w, h) => { const gr = g2.createRadialGradient(w / 2, h * 0.42, 4, w / 2, h * 0.42, h * 0.62); gr.addColorStop(0, '#34353F'); gr.addColorStop(1, '#0B0B0F'); g2.fillStyle = gr; g2.fillRect(0, 0, w, h); }) }), [0, 0, -14], [0, 0, 0], [1, 1, 1], false));
  scene.add(mesh(new THREE.CircleGeometry(30, 64), std('#1A1A20', 0.82), [0, FLOOR, 0], [-Math.PI / 2, 0, 0]));
  const key = new THREE.DirectionalLight('#FFF0E2', 2.1); key.position.set(-6, 10, 14); key.target.position.set(0, -2.5, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -8, near: 1, far: 50 }); key.shadow.bias = -0.0004; key.shadow.radius = 9; scene.add(key, key.target);
  const rim1 = new THREE.SpotLight('#2CE6C0', 170, 34, 0.6, 0.6, 2); rim1.position.set(6, 4, -7); rim1.target.position.set(0, -2.2, 0); scene.add(rim1, rim1.target);
  const rim2 = new THREE.SpotLight('#8E6BFF', 150, 34, 0.6, 0.7, 2); rim2.position.set(-6, 5, -7); rim2.target.position.set(0, -2.2, 0); scene.add(rim2, rim2.target);
  const front = new THREE.DirectionalLight('#FFF4E8', 0.6); front.position.set(0, 1, 20); scene.add(front); scene.add(new THREE.HemisphereLight('#5A6A90', '#0A0A0A', 0.28));
}
/** A floating glass chart for the standing cover: green candles climbing, then a red drop, and a big «؟». */
function holo(scene, x) { const g = new THREE.Group(), s = Math.sign(x);
  g.add(rbox(3.6, 2.6, 0.06, 0.08, new THREE.MeshPhysicalMaterial({ color: '#0B2A24', roughness: 0.15, transparent: true, opacity: 0.35, clearcoat: 1 }), [0, 0, 0]));
  [[0, 1.3, 3.6, 0.035], [0, -1.3, 3.6, 0.035], [-1.8, 0, 0.035, 2.6], [1.8, 0, 0.035, 2.6]].forEach(([px, py, w, h]) => g.add(mesh(new THREE.BoxGeometry(w, h, 0.035), glowMat(GREEN, 1.4), [px, py, 0.04], [0, 0, 0], [1, 1, 1], false)));
  let p = -0.75; for (let i = 0; i < 13; i++) { const up = i < 9 ? rnd(i * 13 + 2) > 0.28 : false, b = 0.1 + rnd(i * 7) * 0.2, c2 = up ? p + b : p - b * 1.4, col = up ? GREEN : RED;
    g.add(mesh(new THREE.BoxGeometry(0.15, Math.abs(c2 - p) + 0.03, 0.05), glowMat(col, 0.9), [-1.5 + i * 0.22, (p + c2) / 2, 0.06], [0, 0, 0], [1, 1, 1], false)); g.add(mesh(new THREE.BoxGeometry(0.025, Math.abs(c2 - p) + 0.2, 0.03), glowMat(col, 0.9), [-1.5 + i * 0.22, (p + c2) / 2, 0.05], [0, 0, 0], [1, 1, 1], false)); p = c2; }
  const q = textPlane('؟', 1.1, { fg: RED, size: 170 }); q.position.set(1.15, 0.55, 0.12); g.add(q);
  g.position.set(x, -1.5, 0.3); g.rotation.y = -s * 0.22; scene.add(g); const L = new THREE.PointLight(GREEN, 16, 9, 2); L.position.set(x, -1.2, 1.8); scene.add(L); }

const VIEWS = [
  { id: 'front', rot: 0, face: 'smile' },
  { id: 'three-quarter', rot: -0.62, face: 'smile', look: [-0.3, 0] },
  { id: 'side', rot: -Math.PI / 2, face: 'smile' },
  { id: 'back', rot: Math.PI, face: 'smile' },
  { id: 'present', rot: 0.12, face: 'curious', right: 'palm', look: [-0.5, 0.05], tilt: 0.05 },
  { id: 'think', rot: -0.22, face: 'thinking', left: 'chin', look: [-0.45, 0.5], tilt: 0.1 },
  { id: 'wave', rot: 0.15, face: 'happy', right: 'wave', tilt: 0.06 },
  { id: 'cover-standing', cover: true, theme: 'monitors', desk: false, side: 1, tint: '#3DF59A', seed: 2, sym: 'holo', face: 'curious', right: 'palm', look: [-0.6, 0.05], l1: 'به استراتژیت اعتماد داری؟', l2: 'یا از بررسیش می‌ترسی؟', c2: RED },
  { id: 'cover-desk', cover: true, theme: 'city', side: -1, tint: '#2CE6C0', seed: 5, sym: 'payout', face: 'thinking', left: 'chin', look: [0.5, 0.45], tilt: 0.1, scale: 1.3, l1: 'پراپ تریدرها', l2: 'چطوری به برداشت رسیدن؟', c2: GREEN },
];
function dispose(scene) { scene.traverse((m) => { if (m.geometry) m.geometry.dispose(); [].concat(m.material ?? []).forEach((x) => { if (x !== OUTLINE) { x.map?.dispose(); x.bumpMap?.dispose(); x.dispose(); } }); }); }
// the painted finish: a Kuwahara filter (each pixel takes the mean colour of the calmest of the four squares around it),
// which flattens fine noise into soft strokes while keeping the edges, like a painted illustration
const KUWAHARA = { uniforms: { tDiffuse: { value: null }, px: { value: new THREE.Vector2(1 / W, 1 / H) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 px; varying vec2 vUv;
  #define N 4
  void quad(vec2 o, inout vec3 best, inout float bs) { vec3 m = vec3(0.0), s = vec3(0.0);
    for (int j = 0; j <= N; j++) for (int i = 0; i <= N; i++) { vec3 c = texture2D(tDiffuse, vUv + (o * vec2(float(i), float(j))) * px).rgb; m += c; s += c * c; }
    float n = float((N + 1) * (N + 1)); m /= n; vec3 v = abs(s / n - m * m); float sg = v.r + v.g + v.b; if (sg < bs) { bs = sg; best = m; } }
  void main(){ vec3 best = vec3(0.0); float bs = 1e9; quad(vec2(-1.0, -1.0), best, bs); quad(vec2(1.0, -1.0), best, bs); quad(vec2(-1.0, 1.0), best, bs); quad(vec2(1.0, 1.0), best, bs);
    gl_FragColor = vec4(best, 1.0); }` };
let composer = null;
function view(i) {
  const V = VIEWS[i], scene = new THREE.Scene(); scene.environment = ENV; scene.environmentIntensity = V.cover ? 0.16 : 0.22;
  const b = buddy({ face: V.face, look: V.look, left: V.left, right: V.right, tilt: V.tilt }); let cam;
  if (V.cover) { room(scene, V); const d = -V.side; b.scale.setScalar(V.scale ?? 1); b.position.set(V.side * 1.75, V.scale ? -0.26 : 0, 0); b.rotation.y = d * 0.3;
    if (V.sym === 'holo') holo(scene, -V.side * 1.9); else SYM[V.sym](scene, -V.side * 1.75);
    cam = new THREE.PerspectiveCamera(30, W / H, 1, 120); cam.position.set(0, 0.6, 24); cam.lookAt(0, -0.35, 0); }
  else { studio(scene); b.rotation.y = V.rot; cam = new THREE.PerspectiveCamera(30, W / H, 1, 120); cam.position.set(0, -0.9, 16.6); cam.lookAt(0, -2.13, 0); }
  scene.add(b);
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }); composer = new EffectComposer(renderer, rt); composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, cam)); const ao = new GTAOPass(scene, cam, W, H); ao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.5, thickness: 1.2, scale: 1.1 }); ao.blendIntensity = 0.8; composer.addPass(ao);
  if (V.cover) composer.addPass(new BokehPass(scene, cam, { focus: 23.5, aperture: 0.005, maxblur: 0.01 }));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), V.cover ? 0.5 : 0.15, 0.6, 0.98)); composer.addPass(new OutputPass()); composer.addPass(new ShaderPass(KUWAHARA)); composer.addPass(new ShaderPass(GRADE));
  composer.render(); if (V.cover) hook(V.l1, V.l2, V.c2); else cv.clearRect(0, 0, W, H);
  composer.dispose(); rt.dispose(); dispose(scene);
}
window.N = VIEWS.length; window.IDS = VIEWS.map((v) => v.id); window.view = view;
window.addEventListener('load', async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await new Promise((ok) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d').drawImage(im, 0, 0, 256, 256); window.ICON_TEX = new THREE.CanvasTexture(c); window.ICON_TEX.colorSpace = THREE.SRGBColorSpace; ok(); }; im.onerror = ok; im.src = window.LOGO.icon; });
  window.ready = true;
});
