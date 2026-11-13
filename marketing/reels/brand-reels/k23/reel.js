// k23 · the 3D mascot reel. Built from cv4's scene code (the renderer, materials, the mascot's face, hands and smooth
// hoodie body, the room and the symbols), followed by the reel itself.
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

// ---------- the trader in 3D ----------
const SKIN = '#E7B48D';
// ---------- the mascot: a big white round head, a slim body in a violet hoodie ----------
// proportions of the reference style: the head about as wide as the shoulders, no hair, ears or nose; black oval eyes
// with a catch-light, thin brows and a small mouth carry the expression; white cartoon hands.
const HR = 1.0;   // the head's radius
function face(g, M, f, look) {
  const [lx, ly] = look, onFace = (x, y, out = 0) => [x, y, Math.sqrt(Math.max(0, HR * HR - x * x - y * y)) * 0.975 + out];
  [-1, 1].forEach((e) => { const ex = e * 0.29 + lx * 0.06, ey = 0.04 + ly * 0.05;
    const sy = { shocked: 1.22, smirk: 0.7, sad: 0.9, thinking: e > 0 ? 0.85 : 1 }[f] ?? 1, sx = f === 'shocked' ? 1.12 : 1;
    if (f === 'happy') g.add(tube([[ex - 0.1, ey - 0.02], [ex, ey + 0.08], [ex + 0.1, ey - 0.02]].map(([x, y]) => onFace(x, y, 0.01)), 0.03, M.eye));
    else { g.add(sphere(0.225, M.eye, onFace(ex, ey, -0.075), [0.6 * sx, 1.0 * sy, 0.42]));
      g.add(mesh(new THREE.SphereGeometry(0.028, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), onFace(ex - 0.035, ey + 0.08 * sy, 0.02), [0, 0, 0], [1, 1, 1], false)); }
    const raise = { worried: 0.06, shocked: 0.11, thinking: e > 0 ? 0.09 : 0, sad: 0.04, smirk: e > 0 ? 0.06 : 0, happy: 0.04 }[f] ?? 0, tilt = { worried: -0.42, sad: -0.48, shocked: -0.05, thinking: e > 0 ? 0.3 : -0.1, smirk: e > 0 ? 0.25 : -0.05, happy: 0.1 }[f] ?? 0.05;
    const [bx, by, bz] = onFace(ex, 0.34 + raise, 0.0); g.add(mesh(new THREE.CapsuleGeometry(0.028, 0.18, 8, 16), M.brow, [bx, by, bz], [0, 0, Math.PI / 2 + e * tilt])); });
  const mouthCurve = (pts) => g.add(tube(pts.map(([x, y]) => onFace(x, y, 0.006)), 0.022, M.brow));
  const disc = (shape, y, mat, z = 0) => { const m = mesh(new THREE.ShapeGeometry(shape, 24), mat, [0, y, 0.93 + z], [-0.36, 0, 0]); m.castShadow = false; g.add(m); };
  if (f === 'happy') { const sh = new THREE.Shape(); sh.moveTo(-0.13, 0); sh.lineTo(0.13, 0); sh.absarc(0, 0, 0.13, 0, -Math.PI, true); disc(sh, -0.3, M.mouthIn); const tg = new THREE.Shape(); tg.absellipse(0, -0.085, 0.065, 0.04, 0, Math.PI * 2); disc(tg, -0.3, M.tongue, 0.003); }
  else if (f === 'shocked') { const sh = new THREE.Shape(); sh.absellipse(0, 0, 0.07, 0.1, 0, Math.PI * 2); disc(sh, -0.36, M.mouthIn); }
  else if (f === 'worried') mouthCurve([[-0.11, -0.34], [-0.055, -0.31], [0, -0.34], [0.055, -0.31], [0.11, -0.34]]);
  else if (f === 'sad') mouthCurve([[-0.1, -0.38], [-0.05, -0.345], [0, -0.335], [0.05, -0.345], [0.1, -0.38]]);
  else if (f === 'smirk') mouthCurve([[-0.1, -0.33], [-0.02, -0.35], [0.06, -0.345], [0.12, -0.3]]);
  else if (f === 'thinking') mouthCurve([[-0.08, -0.35], [0.01, -0.345], [0.09, -0.325]]);
  else mouthCurve([[-0.11, -0.3], [-0.055, -0.345], [0, -0.355], [0.055, -0.345], [0.11, -0.3]]);
  if (f === 'worried') g.add(sphere(0.06, new THREE.MeshPhysicalMaterial({ color: '#A8DCFF', roughness: 0.05, clearcoat: 1, emissive: '#3A8FD0', emissiveIntensity: 0.25 }), [0.8, 0.42, 0.5], [0.8, 1.3, 0.6]));
}
/** A white cartoon hand, fingers along +y: open, point (index out), chin (index up, the rest curled). */
function hand(pose, M) {
  const h = new THREE.Group(); h.add(sphere(0.17, M.skin, [0, 0.15, 0], [1, 1.1, 0.62]));
  const ext = pose === 'point' || pose === 'chin' ? [1, 1, 0, 0, 0] : [1, 1, 1, 1, 1];
  [[-0.11, 0.18, 0.12], [-0.037, 0.21, 0.04], [0.037, 0.2, -0.04], [0.105, 0.16, -0.12]].forEach(([x, L, a], k) => { const len = ext[k + 1] ? L : 0.05; h.add(mesh(new THREE.CapsuleGeometry(0.043, len, 6, 12), M.skin, [x, 0.33 + len / 2, ext[k + 1] ? 0 : 0.06], [ext[k + 1] ? 0 : 0.9, 0, a])); });
  h.add(mesh(new THREE.CapsuleGeometry(0.048, 0.13, 6, 12), M.skin, [0.17, 0.13, 0.04], [0, 0, -0.75]));
  return h;
}
/** The mascot; side = his place (−1 left, +1 right); the symbol is on the other side (d = −side). */
function trader(o) {
  const M = { skin: std('#F8F7F4', 0.72),
    hood: phys('#6346EC', 0.82, { sheen: 1, sheenColor: '#B9A6FF', sheenRoughness: 0.55 }), hood2: phys('#4B30C9', 0.85, { sheen: 1, sheenColor: '#9682FF', sheenRoughness: 0.55 }),
    lime: std(LIME, 0.45, { emissive: LIME, emissiveIntensity: 0.16 }), eye: phys('#111015', 0.15, { clearcoat: 1, clearcoatRoughness: 0.05 }), brow: std('#34333A', 0.6),
    mouthIn: std('#2A1C1E', 0.7), tongue: std('#D9787A', 0.55) };
  const g = new THREE.Group(), d = -o.side;
  // the head
  const hd = new THREE.Group(); hd.add(sphere(HR, M.skin, [0, 0, 0], [1, 1.02, 0.97])); face(hd, M, o.face, o.look ?? [d * 0.8, 0]);
  hd.position.y = -0.12; hd.rotation.set(o.nod ?? 0.05, d * 0.2, d * (o.tilt ?? -0.07)); g.add(hd);
  // a short neck hidden in the hood, the slim hoodie body
  g.add(mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.4, 24), M.skin, [0, -0.92, -0.04]));

  // the hood: a thick collar around the neck and the folded hood on the back
  g.add(mesh(new THREE.TorusGeometry(0.36, 0.15, 20, 48), M.hood2, [0, -1.02, -0.03], [Math.PI / 2 + 0.22, 0, 0], [1.12, 0.86, 1]));
  g.add(sphere(0.6, M.hood2, [0, -1.12, -0.72], [1.15, 0.72, 0.6]));
  // drawstrings and the logo
  [-1, 1].forEach((e) => { const pts = [-1.16, -1.4, -1.65, -1.92].map((y, k) => new V3(e * (0.12 + k * 0.01), y, frontZ(e * 0.13, y) + 0.03)); g.add(tube(pts.map((p) => p.toArray()), 0.024, M.lime)); g.add(mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.12, 12), std('#E9FF9E', 0.4), [e * 0.15, -2.0, frontZ(e * 0.15, -2.0) + 0.04])); });
  if (window.ICON_TEX) { const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshStandardMaterial({ map: window.ICON_TEX, transparent: true, roughness: 0.5, emissive: '#FFFFFF', emissiveMap: window.ICON_TEX, emissiveIntensity: 0.2 })); lg.position.set(-d * 0.48, -1.72, frontZ(0.48, -1.72) + 0.02); lg.rotation.y = -d * Math.asin(Math.min(0.9, 0.48 / torsoR(-1.72))) * 0.9; g.add(lg); }
  // arms: slim sleeves that grow out of the shoulders, white hands
  const pose = { [d]: o.near ?? 'down', [-d]: o.far ?? 'down' };
  const arms = [];
  [-1, 1].forEach((a) => { const p = pose[a], sh = new V3(a * 0.76, -1.45, -0.02); let el, wr, dir;
    if (p === 'palm') { el = new V3(a * 1.5, -2.5, 0.45); wr = new V3(a * 1.75, -1.85, 1.05); }
    else if (p === 'point') { el = new V3(a * 1.48, -2.4, 0.5); wr = new V3(a * 1.88, -1.7, 1.15); dir = new V3(a * 1, 0.35, 0.25).normalize(); }
    else if (p === 'chin') { el = new V3(a * 0.7, -2.65, 0.95); wr = new V3(a * 0.22, -1.25, 0.92); dir = new V3(-a * 0.15, 1, 0.12).normalize(); }
    else if (p === 'desk') { el = new V3(a * 1.2, -2.6, 0.45); wr = new V3(a * 0.75, -2.65, 1.3); }
    else { el = new V3(a * 1.27, -2.7, 0.04); wr = new V3(a * 1.25, -3.85, 0.14); }
    arms.push([sh, el, wr]);
    g.add(mesh(new THREE.TorusGeometry(0.16, 0.045, 12, 32), M.hood2, wr.toArray(), [0, 0, 0]).rotateOnAxis(new V3(1, 0, 0), Math.PI / 2));
    if (p === 'down') return;
    const hnd = hand(p, M); hnd.position.copy(wr); const fd = dir ?? new V3().subVectors(wr, el).normalize(); hnd.quaternion.setFromUnitVectors(new V3(0, 1, 0), fd);
    if (p === 'palm') hnd.rotateY(-a * 1.2), hnd.rotateX(-0.5); if (p === 'point') hnd.rotateY(a * 0.6); if (p === 'desk') hnd.rotateX(-1.2);
    g.add(hnd); });
  g.add(hoodieBody(arms, M.hood));
  g.scale.setScalar(1.3); g.position.set(o.side * 1.7, -0.1, 0); g.rotation.y = d * 0.16;
  return g;
}

/**
 * The hoodie's body and both sleeves as one smooth surface: a signed distance field (the torso's profile, flattened
 * front to back, and a capsule per arm segment), joined with a smooth minimum, so each sleeve grows out of the shoulder
 * like a set-in sleeve. The upper arms blend into the shoulders; the forearms only join at the elbow.
 */
const TORSO = [[0.26, -0.98], [0.56, -1.05], [0.8, -1.18], [0.95, -1.4], [1.03, -1.72], [1.04, -2.2], [1.0, -3.0], [0.96, -4.0], [0.93, -5.5]];
const ZF = 0.74;   // the torso's depth against its width
const frontZ = (x, y) => ZF * Math.sqrt(Math.max(0, torsoR(y) ** 2 - x * x));
function torsoR(y) { if (y > TORSO[0][1]) return 0; for (let i = 1; i < TORSO.length; i++) if (y >= TORSO[i][1]) { const [r0, y0] = TORSO[i - 1], [r1, y1] = TORSO[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return TORSO[TORSO.length - 1][0]; }
const smin = (a, b, k) => { const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (b - a) / k)); return b + (a - b) * h - k * h * (1 - h); };
function capsuleD(px, py, pz, a, b, r) { const bx = b.x - a.x, by = b.y - a.y, bz = b.z - a.z, ax = px - a.x, ay = py - a.y, az = pz - a.z; const t = Math.max(0, Math.min(1, (ax * bx + ay * by + az * bz) / (bx * bx + by * by + bz * bz))); const dx = ax - bx * t, dy = ay - by * t, dz = az - bz * t; return Math.sqrt(dx * dx + dy * dy + dz * dz) - r; }
function hoodieBody(arms, mat, res = 160) {
  const RES = res, C = new V3(0, -2.72, 0.22), HALF = new V3(2.3, 1.9, 1.38);
  const mc = new MarchingCubes(RES, mat, false, false, 700000); mc.isolation = 0;
  const f = mc.field, hs = mc.halfsize;
  for (let z = 0; z < RES; z++) { const pz = C.z + ((z - hs) / hs) * HALF.z;
    for (let y = 0; y < RES; y++) { const py = C.y + ((y - hs) / hs) * HALF.y, r = torsoR(py);
      for (let x = 0; x < RES; x++) { const px = C.x + ((x - hs) / hs) * HALF.x;
        const q = Math.sqrt(px * px + (pz / ZF) * (pz / ZF)); let d = py > TORSO[0][1] ? Math.max(q - 0.28, py - TORSO[0][1]) : (q - r) * 0.82;
        for (const [sh, el, wr] of arms) { d = smin(d, capsuleD(px, py, pz, sh, el, 0.2), 0.17); d = smin(d, capsuleD(px, py, pz, el, wr, 0.18), 0.03); }
        f[x + y * RES + z * RES * RES] = -d; } } }
  mc.update(); mc.position.copy(C); mc.scale.copy(HALF); mc.castShadow = true; mc.receiveShadow = true; return mc;
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


// the grade: teal shadows, warm highlights, a little contrast, a vignette and grain
const GRADE = { uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
  void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb; float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * vec3(0.88, 1.0, 1.08), (1.0 - l) * 0.3); col = mix(col, col * vec3(1.06, 1.0, 0.93), l * 0.25);
    col = (col - 0.5) * 1.1 + 0.5; vec2 d = (vUv - 0.5) * vec2(1.0, 1.35); float v = smoothstep(0.95, 0.3, length(d)); col *= mix(0.55, 1.0, v);
    float n = fract(sin(dot(vUv * vec2(1080.0, 1920.0), vec2(12.9898, 78.233))) * 43758.5453); col += (n - 0.5) * 0.03; gl_FragColor = vec4(col, c.a); }` };
let composer = null;

// ================= k23 · «پراپ تریدرها چطوری به برداشت رسیدن؟», the 3D mascot reel =================
// The mascot (cv4's) talks with the user's voice at its normal speed: his mouth follows the voice (vo.json), he blinks,
// nods on the stressed words and changes expression with each line; his arms move between gestures (the hoodie and
// sleeves stay one smooth surface: cached per pose, rebuilt while an arm moves). A 3D prop for each line pops up beside
// him; the real BacktestLab replay plays on a monitor. A two-line headline at the top, the spoken words at the bottom.
const D = window.DATA, DUR = D.dur, Wd = D.w, VO = D.vo;
const ws = (i) => Wd[i][0];
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
const spring = (dt, w = 13, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const pulse = (t, a, d = 0.35) => (t >= a && t < a + d ? Math.sin(((t - a) / d) * Math.PI) : 0);

// ---------- the beats: [start word, headline 1, headline 2, accent, face, poses (near, far), prop] ----------
const B = [
  [0, 'پراپ تریدرها', 'چطوری به برداشت رسیدن؟', GREEN, 'thinking', ['down', 'chin'], 'payout'],
  [16, 'رازش یه استراتژی', 'عجیب نیست!', RED, 'smirk', ['point', 'down'], 'secret'],
  [21, 'رازش اینه که', 'قانون‌های چالش رو نمی‌شکنن', GREEN, 'calm', ['palm', 'down'], 'rules'],
  [29, 'حد ضرر روزانه', 'حداکثر افت حساب', RED, 'calm', ['point', 'down'], 'limits'],
  [36, 'یه روز بد…', 'کل چالش می‌سوزه', RED, 'shocked', ['down', 'down'], 'fire'],
  [44, 'قبل از پول دادن', 'بدترین افتشون رو می‌دونن', GREEN, 'smirk', ['palm', 'down'], 'know'],
  [72, 'ریسک هر معامله رو', 'طوری می‌چینن که رد نشه', GREEN, 'calm', ['point', 'down'], 'risk'],
  [87, 'توی بک‌تست‌لب', 'یه حساب با موجودی چالش', VIO, 'happy', ['palm', 'down'], 'lab'],
  [99, 'بازار واقعی', 'بدون دیدن آینده', GREEN, 'calm', ['down', 'chin'], 'market'],
  [108, 'آنالیز بهت می‌گه', 'حداکثر افت چند درصده', RED, 'thinking', ['point', 'down'], 'analysis'],
  [118, 'اول اینجا پاس کن', 'بعد حساب بخر', GREEN, 'happy', ['point', 'down'], 'pass'],
  [128, 'زیر همین ویدیو بنویس', 'PROP', LIME, 'happy', ['wave', 'down'], 'cta'],
];
const BT = B.map(([wi], i) => (i ? ws(wi) - 0.12 : 0));
const END = D.end + 0.25;
const beatAt = (t) => { let i = 0; BT.forEach((b, j) => { if (t >= b) i = j; }); return i; };
const beatEnd = (i) => (i + 1 < B.length ? BT[i + 1] : END);

// ---------- the mascot, animated ----------
const SIDE = 1, DIR = -SIDE;
const voAt = (t) => { const f = t * VO.fps, a = VO.open, i = Math.max(0, Math.min(a.length - 1, Math.floor(f))), j = Math.min(a.length - 1, i + 1), u = f - Math.floor(f); return a[i] * (1 - u) + a[j] * u; };
const voSlow = (t) => { let s = 0, n = 0; for (let k = -8; k <= 8; k++) { s += voAt(t + k / VO.fps) * (1 - Math.abs(k) / 9); n += 1 - Math.abs(k) / 9; } return s / n; };
function blinkAt(t) { let b = 0, x = 0.9, r = 11; while (x < t + 1) { const u = t - x; if (u >= 0 && u < 0.16) b = Math.max(b, u < 0.06 ? u / 0.06 : 1 - (u - 0.06) / 0.1); r = (r * 16807) % 2147483647; x += 2.3 + (r / 2147483647) * 2.5; } return b; }
const STRESS = [10, 14, 20, 24, 28, 30, 34, 38, 43, 46, 59, 66, 73, 85, 89, 95, 104, 109, 115, 122, 126, 132, 135];
function armPts(p, a) {
  const sh = new V3(a * 0.76, -1.45, -0.02); let el, wr, dir;
  if (p === 'palm') { el = new V3(a * 1.5, -2.5, 0.45); wr = new V3(a * 1.75, -1.85, 1.05); }
  else if (p === 'point') { el = new V3(a * 1.48, -2.4, 0.5); wr = new V3(a * 1.88, -1.7, 1.15); dir = new V3(a * 1, 0.35, 0.25).normalize(); }
  else if (p === 'chin') { el = new V3(a * 0.7, -2.65, 0.95); wr = new V3(a * 0.22, -1.25, 0.92); dir = new V3(-a * 0.15, 1, 0.12).normalize(); }
  else if (p === 'wave') { el = new V3(a * 1.42, -2.05, 0.45); wr = new V3(a * 1.55, -0.95, 0.75); dir = new V3(a * 0.15, 1, 0.1).normalize(); }
  else { el = new V3(a * 1.27, -2.7, 0.04); wr = new V3(a * 1.25, -3.85, 0.14); }
  return { sh, el, wr, dir };
}
const lerpPts = (A, Bp, k) => ({ sh: A.sh.clone().lerp(Bp.sh, k), el: A.el.clone().lerp(Bp.el, k), wr: A.wr.clone().lerp(Bp.wr, k), dir: (Bp.dir ?? new V3().subVectors(Bp.wr, Bp.el).normalize()).clone() });
function makeMascot() {
  const M = { skin: std('#F8F7F4', 0.72), hood: phys('#6346EC', 0.82, { sheen: 1, sheenColor: '#B9A6FF', sheenRoughness: 0.55 }), hood2: phys('#4B30C9', 0.85, { sheen: 1, sheenColor: '#9682FF', sheenRoughness: 0.55 }),
    lime: std(LIME, 0.45, { emissive: LIME, emissiveIntensity: 0.16 }), eye: phys('#111015', 0.15, { clearcoat: 1, clearcoatRoughness: 0.05 }), brow: std('#34333A', 0.6), mouthIn: std('#2A1C1E', 0.7), tongue: std('#D9787A', 0.55) };
  const root = new THREE.Group(), g = new THREE.Group(); root.add(g);
  // the head: one face per expression (shown one at a time), and a talking mouth
  const hd = new THREE.Group(); hd.add(sphere(HR, M.skin, [0, 0, 0], [1, 1.02, 0.97])); const faces = {};
  ['calm', 'thinking', 'smirk', 'worried', 'shocked', 'happy'].forEach((f) => { const fg = new THREE.Group(); face(fg, M, f, f === 'happy' ? [DIR * 0.4, 0] : [DIR * 0.8, 0]); fg.visible = false; hd.add(fg); faces[f] = fg;
    fg.children.forEach((m) => { if (!m.geometry) return; m.geometry.computeBoundingBox(); const c = new V3(); m.geometry.boundingBox.getCenter(c); c.add(m.position);
      if (m.material === M.mouthIn || m.material === M.tongue || (m.material === M.brow && c.y < -0.1)) m.userData.mouth = true;
      if (m.material === M.eye && m.geometry.type === 'SphereGeometry') m.userData.eye = m.scale.y;
      if (m.material && m.material.type === 'MeshBasicMaterial') m.userData.glint = true; }); });
  const mz = Math.sqrt(1 - 0.335 * 0.335) * 0.975 + 0.004, talk = new THREE.Group(); talk.position.set(DIR * 0.04, -0.335, mz); talk.rotation.x = -0.35;
  const lip = new THREE.Mesh(new THREE.CircleGeometry(1, 40), M.mouthIn); const tg = new THREE.Mesh(new THREE.CircleGeometry(1, 32), M.tongue); tg.position.z = 0.003; talk.add(lip, tg); hd.add(talk);
  hd.position.y = -0.12; g.add(hd);
  // the neck, the collar, the folded hood, drawstrings, the logo
  g.add(mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.4, 24), M.skin, [0, -0.92, -0.04]));
  g.add(mesh(new THREE.TorusGeometry(0.36, 0.15, 20, 48), M.hood2, [0, -1.02, -0.03], [Math.PI / 2 + 0.22, 0, 0], [1.12, 0.86, 1]));
  g.add(sphere(0.6, M.hood2, [0, -1.12, -0.72], [1.15, 0.72, 0.6]));
  [-1, 1].forEach((e) => { const pts = [-1.16, -1.4, -1.65, -1.92].map((y, k) => [e * (0.12 + k * 0.01), y, frontZ(e * 0.13, y) + 0.03]); g.add(tube(pts, 0.024, M.lime)); g.add(mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.12, 12), std('#E9FF9E', 0.4), [e * 0.15, -2.0, frontZ(e * 0.15, -2.0) + 0.04])); });
  if (window.ICON_TEX) { const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshStandardMaterial({ map: window.ICON_TEX, transparent: true, roughness: 0.5, emissive: '#FFFFFF', emissiveMap: window.ICON_TEX, emissiveIntensity: 0.2 })); lg.position.set(-DIR * 0.48, -1.72, frontZ(0.48, -1.72) + 0.02); lg.rotation.y = -DIR * 0.75; g.add(lg); }
  // arms: the body mesh per pose pair (cached), hands, cuffs
  const cache = {}; let bodyMesh = null, handMeshes = [];
  function setArms(pa, pb, k, fa, fb) {   // pa → pb with progress k (near and far arms)
    const key = `${pa.join()}>${pb.join()}`, done = k >= 1, hold = done ? pb : null; const id = done ? `H:${pb.join()}` : `${key}:${Math.round(k * 8)}`;
    if (bodyMesh && bodyMesh.userData.id === id) return; if (bodyMesh) { g.remove(bodyMesh); if (!bodyMesh.userData.cached) bodyMesh.geometry.dispose(); } handMeshes.forEach((h) => g.remove(h)); handMeshes = [];
    const arms = [], q = done ? 1 : sm(Math.round(k * 8) / 8);
    [[DIR, 0], [-DIR, 1]].forEach(([a, j]) => { const A = armPts(pa[j], a), Bp = armPts(pb[j], a), P = lerpPts(A, Bp, q); arms.push([P.sh, P.el, P.wr]);
      const cuff = mesh(new THREE.TorusGeometry(0.16, 0.045, 12, 32), M.hood2, P.wr.toArray()); cuff.rotateOnAxis(new V3(1, 0, 0), Math.PI / 2); g.add(cuff); handMeshes.push(cuff);
      const hp = q < 0.5 ? pa[j] : pb[j]; if (hp === 'down') return; const hnd = hand(hp === 'wave' ? 'palm' : hp, M); hnd.position.copy(P.wr); hnd.quaternion.setFromUnitVectors(new V3(0, 1, 0), (armPts(hp, a).dir ?? new V3().subVectors(P.wr, P.el).normalize()));
      if (hp === 'palm') hnd.rotateY(-a * 1.2), hnd.rotateX(-0.5); if (hp === 'point') hnd.rotateY(a * 0.6); if (hp === 'wave') hnd.rotateZ(a * 0.25 * Math.sin((fa ?? 0) * 9));
      g.add(hnd); handMeshes.push(hnd); });
    if (done && cache[id]) bodyMesh = cache[id]; else { bodyMesh = hoodieBody(arms, M.hood, done ? 150 : 104); bodyMesh.userData.id = id; if (done) { bodyMesh.userData.cached = true; cache[id] = bodyMesh; } }
    bodyMesh.userData.id = id; g.add(bodyMesh);
  }
  root.scale.setScalar(1.3); root.position.set(SIDE * 1.7, -0.1, 0); root.rotation.y = DIR * 0.16;
  root.userData.update = (t) => {
    const i = beatAt(t), b = B[i], f = t > ws(39) && i === 4 ? 'shocked' : i === 4 ? 'worried' : i === 6 && t > ws(85) ? 'happy' : b[4];
    Object.entries(faces).forEach(([k, fg]) => { fg.visible = k === f; });
    const talking = t < D.end + 0.05, open = talking ? cl(voAt(t) * 0.9) : 0, bl = blinkAt(t);
    faces[f].children.forEach((m) => { if (m.userData.mouth) m.visible = open < 0.14; if (m.userData.eye !== undefined) m.scale.y = m.userData.eye * (1 - bl * 0.92); if (m.userData.glint) m.visible = bl < 0.5; });
    talk.visible = open >= 0.14; lip.scale.set(0.085 + open * 0.02, 0.02 + open * 0.12, 1); tg.scale.set(0.05, 0.012 + open * 0.05, 1); tg.position.y = -open * 0.06;
    const env = talking ? voSlow(t) : 0, nod = 0.04 + 0.06 * (env - 0.3) + STRESS.reduce((s, w) => s + 0.09 * pulse(t, ws(w) - 0.02, 0.32), 0) + 0.02 * Math.sin(t * 0.9);
    hd.rotation.set(nod, DIR * 0.2 + 0.05 * Math.sin(t * 0.43), DIR * -0.07 + 0.04 * Math.sin(t * 0.61) + (i === 0 ? DIR * -0.08 : 0) + (i === 9 ? DIR * 0.06 : 0));
    g.position.y = 0.025 * Math.sin(t * 1.7);
    // arms: the pose eases in over 0.4 s at each beat
    const prev = i ? B[i - 1][5] : b[5], k = i ? k01(t, BT[i], 0.4) : 1; setArms(prev, b[5], k, t - BT[i]);
  };
  return root;
}

// ---------- the props (left of the mascot, x = −1.75) ----------
const PX = -2.05;
function propPayout() { const g = new THREE.Group(); SYM.payout(g, PX); return g; }
function propSecret() { const g = new THREE.Group(), box = new THREE.Group(); box.add(rbox(2.0, 1.6, 1.6, 0.18, phys('#2A2148', 0.35, { clearcoat: 0.6 }), [0, 0, 0])); box.add(rbox(2.15, 0.36, 1.75, 0.12, phys('#4A3A8A', 0.3, { clearcoat: 0.8 }), [0, 0.95, 0]));
  const q = textPlane('؟', 1.0, { fg: LIME, size: 180 }); q.position.set(0, 0.05, 0.82); box.add(q); const t = textPlane('استراتژی مخفی', 0.32, { fg: WHITE }); t.position.set(0, -0.62, 0.82); box.add(t);
  box.position.set(PX, -2.15, 0.9); box.rotation.y = 0.25; box.scale.setScalar(0.9); g.add(box);
  const x = new THREE.Group(); x.add(rbox(2.2, 0.32, 0.2, 0.12, glowMat(RED, 0.8), [0, 0, 0], [0, 0, 0.75])); x.add(rbox(2.2, 0.32, 0.2, 0.12, glowMat(RED, 0.8), [0, 0, 0], [0, 0, -0.75])); x.position.set(PX, -2.0, 2.0); x.userData.at = ws(20) - 0.05; g.add(x); g.userData.x = x;
  const L = new THREE.PointLight('#8E6BFF', 14, 8, 2); L.position.set(PX, -1, 2.5); g.add(L); return g; }
function propRules() { const g = new THREE.Group(), sh = new THREE.Shape(); sh.moveTo(0, 1.3); sh.bezierCurveTo(0.7, 1.1, 1.1, 1.1, 1.1, 1.1); sh.lineTo(1.05, 0.0); sh.bezierCurveTo(1.0, -0.7, 0.5, -1.1, 0, -1.4); sh.bezierCurveTo(-0.5, -1.1, -1.0, -0.7, -1.05, 0.0); sh.lineTo(-1.1, 1.1); sh.bezierCurveTo(-1.1, 1.1, -0.7, 1.1, 0, 1.3);
  const shield = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 5 }), phys('#1C3A2E', 0.35, { clearcoat: 0.7 }), [PX, -1.3, 0.8]); g.add(shield);
  const rim = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }), glowMat(GREEN, 0.5), [PX, -1.3, 0.72], [0, 0, 0], [1.06, 1.06, 1]); g.add(rim);
  g.add(tube([[PX - 0.45, -1.25, 1.2], [PX - 0.1, -1.65, 1.2], [PX + 0.5, -0.85, 1.2]], 0.1, glowMat(GREEN, 1.4)));
  const t = textPlane('قانون‌های چالش', 0.34); t.position.set(PX, -2.95, 1.3); g.add(t); const L = new THREE.PointLight(GREEN, 12, 8, 2); L.position.set(PX, -1.2, 2.6); g.add(L); return g; }
function gauge(label, col, f) { const g = new THREE.Group(); g.add(mesh(new THREE.TorusGeometry(0.75, 0.13, 20, 80, Math.PI), std('#2A2F38', 0.6), [0, 0, 0])); const arc = mesh(new THREE.TorusGeometry(0.75, 0.14, 20, 80, Math.PI * f), glowMat(col, 0.9), [0, 0, 0.01], [0, 0, Math.PI * (1 - f)]); g.add(arc);
  const n = mesh(new THREE.BoxGeometry(0.06, 0.62, 0.06), std('#F2F2F2', 0.4), [0, 0.31, 0.08]); const piv = new THREE.Group(); piv.add(n); piv.rotation.z = Math.PI / 2 - Math.PI * f; piv.position.z = 0.05; g.add(piv); g.add(sphere(0.1, std('#F2F2F2', 0.3), [0, 0, 0.1], [1, 1, 1]));
  const t = textPlane(label, 0.3); t.position.set(0, -0.42, 0.1); g.add(t); g.userData.piv = piv; g.userData.f = f; return g; }
function propLimits() { const g = new THREE.Group(); const a = gauge('حد ضرر روزانه', AMB, 0.82), b = gauge('حداکثر افت', RED, 0.9); a.position.set(PX, 0.1, 0.6); b.position.set(PX, -1.95, 0.9); a.userData.at = ws(29); b.userData.at = ws(32); g.add(a, b); g.userData.gauges = [a, b]; const L = new THREE.PointLight(RED, 12, 8, 2); L.position.set(PX, -1, 2.6); g.add(L); return g; }
function propFire() { const g = new THREE.Group(), c = new THREE.Group(); c.add(rbox(2.7, 1.8, 0.18, 0.12, std('#1D1A2B', 0.4), [0, 0, 0])); const ct = textPlane('چالش پراپ', 0.38); ct.position.set(0, 0.5, 0.1); c.add(ct);
  c.add(rbox(2.1, 0.18, 0.06, 0.08, std('#3A2F55', 0.5), [0, -0.05, 0.1])); const bar = rbox(1.6, 0.18, 0.08, 0.08, glowMat(RED, 1.0), [-0.25, -0.05, 0.12]); c.add(bar); const ct2 = textPlane('حساب بسته شد', 0.28, { fg: RED }); ct2.position.set(0, -0.55, 0.1); c.add(ct2);
  const fire = new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (g2, w, h) => { const gr = g2.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,70,30,1)'); gr.addColorStop(0.5, 'rgba(255,170,40,0.9)'); gr.addColorStop(1, 'rgba(255,240,150,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, w, h); }), transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const flames = []; for (let i = 0; i < 12; i++) { const fh = 0.7 + rnd(i * 7) * 1.0, f = new THREE.Mesh(new THREE.ConeGeometry(0.2, fh, 16, 1, true), fire); f.position.set(-1.15 + i * 0.21, -0.9 + fh / 2, 0.15); f.userData.h = fh; c.add(f); flames.push(f); }
  c.position.set(PX, -1.6, 1.0); c.rotation.set(0, 0.25, -0.08); g.add(c); g.userData.flames = flames; const L = new THREE.PointLight('#FF7A30', 24, 8, 2); L.position.set(PX, -1.6, 2.4); g.add(L); g.userData.L = L; return g; }
function propKnow() { const g = new THREE.Group(), p = new THREE.Group(); p.add(rbox(3.0, 2.2, 0.15, 0.15, std('#0D1620', 0.5), [0, 0, 0]));
  const pts = [[-1.3, 0.5], [-1.0, 0.65], [-0.75, 0.35], [-0.5, 0.45], [-0.25, -0.05], [0.0, -0.45], [0.2, -0.7], [0.45, -0.35], [0.7, -0.05], [1.0, 0.3], [1.3, 0.6]].map(([x, y]) => [x, y, 0.12]);
  p.add(tube(pts, 0.045, glowMat(GREEN, 1.2))); const dip = sphere(0.1, glowMat(RED, 2), [0.2, -0.7, 0.14], [1, 1, 1]); p.add(dip); p.add(mesh(new THREE.BoxGeometry(0.03, 1.2, 0.03), glowMat(RED, 1.5), [0.2, -0.1, 0.12]));
  const t = textPlane('بدترین افت', 0.26, { fg: RED }); t.position.set(0.2, 0.68, 0.13); p.add(t); p.position.set(PX, 0.2, 0.4); p.rotation.y = 0.18; g.add(p); p.userData.at = ws(59) - 0.05; g.userData.panel = p;
  const chips = []; for (let i = 0; i < 6; i++) { const c = rbox(0.38, 0.38, 0.38, 0.08, glowMat(RED, 0.45), [PX - 1.05 + i * 0.42, -2.7, 1.5]); c.userData.at = ws(64) + i * 0.12; g.add(c); chips.push(c); } const t2 = textPlane('ضرر پشت‌سرهم', 0.3, { fg: RED }); t2.position.set(PX, -2.15, 1.6); t2.userData.at = ws(66); g.add(t2); chips.push(t2); g.userData.chips = chips;
  const L = new THREE.PointLight(GREEN, 12, 8, 2); L.position.set(PX, -0.3, 2.5); g.add(L); return g; }
function propRisk() { const g = new THREE.Group(), k = new THREE.Group(); k.add(mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.35, 48), phys('#2A2440', 0.35, { clearcoat: 0.5 }), [0, 0, 0], [Math.PI / 2, 0, 0])); const ind = mesh(new THREE.BoxGeometry(0.1, 0.42, 0.08), glowMat(AMB, 1.4), [0, 0.42, 0.2]); const piv = new THREE.Group(); piv.add(ind); piv.position.z = 0.0; k.add(piv);
  for (let i = 0; i < 9; i++) { const a = Math.PI * (1.25 - i * 0.3125), m = mesh(new THREE.BoxGeometry(0.05, 0.16, 0.04), std('#C9C2DA', 0.5), [Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0.05], [0, 0, a - Math.PI / 2]); k.add(m); }
  const t = textPlane('ریسک هر معامله', 0.28); t.position.set(0, -1.15, 0.05); k.add(t); k.position.set(PX, 0.25, 0.6); g.add(k); g.userData.piv = piv;
  const fl = new THREE.Group(); fl.add(rbox(3.0, 0.07, 0.07, 0.03, glowMat(RED, 1.6), [0, 0, 0])); const ft = textPlane('حد قانون', 0.24, { fg: RED }); ft.position.set(-1.0, -0.22, 0.05); fl.add(ft);
  fl.add(tube([[-1.4, 0.75, 0], [-0.9, 0.55, 0], [-0.5, 0.65, 0], [-0.1, 0.32, 0], [0.3, 0.42, 0], [0.7, 0.2, 0], [1.1, 0.55, 0], [1.4, 0.7, 0]], 0.04, glowMat(GREEN, 1.3))); fl.position.set(PX, -2.55, 1.4); g.add(fl);
  const ok = new THREE.Group(); ok.add(mesh(new THREE.CircleGeometry(0.32, 40), glowMat(GREEN, 0.7), [0, 0, 0])); ok.add(tube([[-0.14, 0.0, 0.03], [-0.03, -0.11, 0.03], [0.16, 0.1, 0.03]], 0.04, std('#06100C', 0.5))); ok.position.set(PX + 1.3, -1.9, 1.5); ok.userData.at = ws(86); g.add(ok); g.userData.ok = ok;
  return g; }
const RRW = [330, 230, 860, 500], A_KEYS = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'], C_KEYS = Array.from({ length: 16 }, (_, i) => 'c' + String(i).padStart(2, '0')), TEX = {};
function screenMat(key) { const im = window.IMGT[key]; if (!im) return std('#111', 0.5); if (!TEX[key]) { const c = document.createElement('canvas'); c.width = 1032; c.height = 600; c.getContext('2d').drawImage(im, RRW[0] * im.width / 1440, RRW[1] * im.width / 1440, RRW[2] * im.width / 1440, RRW[3] * im.width / 1440, 0, 0, 1032, 600); TEX[key] = new THREE.CanvasTexture(c); TEX[key].colorSpace = THREE.SRGBColorSpace; } return TEX[key]; }
function monitor() { const g = new THREE.Group(); g.add(rbox(3.35, 2.05, 0.14, 0.08, std('#0B0B10', 0.35), [0, 0, 0])); const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 1.83), new THREE.MeshBasicMaterial({ toneMapped: false, color: '#E8E8E8' })); scr.position.z = 0.08; g.add(scr);
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 16), std('#15151C', 0.4), [0, -1.5, -0.05])); g.add(rbox(1.2, 0.08, 0.6, 0.04, std('#15151C', 0.4), [0, -2.0, 0])); if (window.ICON_TEX) { const ic = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: window.ICON_TEX, transparent: true, toneMapped: false })); ic.position.set(1.45, 0.85, 0.1); g.add(ic); }
  g.userData.scr = scr; return g; }
function propLab() { const g = new THREE.Group(), m = monitor(); m.position.set(PX - 0.1, -0.35, 0.3); m.rotation.y = 0.2; g.add(m); g.userData.mon = m;
  const c = new THREE.Group(); c.add(rbox(2.4, 0.9, 0.16, 0.16, phys('#1B1533', 0.4), [0, 0, 0])); c.add(rbox(2.46, 0.96, 0.08, 0.18, glowMat(VIO, 0.5), [0, 0, -0.06])); const t = textPlane('حساب چالش', 0.3); t.position.set(0, 0.17, 0.1); c.add(t); const t2 = textPlane('همون موجودی', 0.24, { fg: LIME }); t2.position.set(0, -0.2, 0.1); c.add(t2);
  c.position.set(PX + 0.1, -2.65, 1.6); c.rotation.set(-0.15, 0.2, 0); c.userData.at = ws(92); g.add(c); g.userData.card = c; return g; }
function propMarket() { const g = new THREE.Group(), m = monitor(); m.position.set(PX - 0.1, -0.35, 0.3); m.rotation.y = 0.2; g.add(m); g.userData.mon = m;
  const cur = new THREE.Group(); cur.add(rbox(1.1, 1.85, 0.06, 0.04, phys('#14101F', 0.6, { transparent: true, opacity: 0.94 }), [0, 0, 0])); const t = textPlane('آینده', 0.3, { fg: '#B39CFF' }); t.position.z = 0.05; cur.add(t); const q = textPlane('؟', 0.6, { fg: LIME, size: 160 }); q.position.set(0, -0.5, 0.05); cur.add(q);
  cur.position.set(1.0, 0, 0.12); m.add(cur); return g; }
function propAnalysis() { const g = new THREE.Group(), a = gauge('حداکثر افت', RED, 0.55); a.scale.setScalar(1.35); a.position.set(PX, -0.6, 0.8); g.add(a); const b = badge('؟٪', 0.6, RED, WHITE, { dir: 'ltr' }); b.position.set(PX, -2.25, 1.3); g.add(b); g.userData.gauge = a; const L = new THREE.PointLight(RED, 12, 8, 2); L.position.set(PX, -1, 2.6); g.add(L); return g; }
function stepCard(n, s, col) { const c = new THREE.Group(); c.add(rbox(2.9, 0.95, 0.18, 0.2, phys('#14121F', 0.4), [0, 0, 0])); c.add(rbox(2.96, 1.01, 0.08, 0.22, glowMat(col, 0.45), [0, 0, -0.07])); const b = badge(n, 0.55, col, col === LIME ? INK : WHITE); b.position.set(1.05, 0, 0.12); c.add(b); const t = textPlane(s, 0.3); t.position.set(-0.3, 0, 0.11); c.add(t); return c; }
function propPass() { const g = new THREE.Group(); const a = stepCard('۱', 'پاس توی بک‌تست‌لب', GREEN), b = stepCard('۲', 'بعد خرید چالش', VIO); a.position.set(PX, -0.4, 0.9); b.position.set(PX, -1.75, 1.2); a.userData.at = ws(118); b.userData.at = ws(124); g.add(a, b);
  const ok = new THREE.Group(); ok.add(mesh(new THREE.CircleGeometry(0.3, 40), glowMat(GREEN, 0.8), [0, 0, 0])); ok.add(tube([[-0.13, 0.0, 0.03], [-0.03, -0.1, 0.03], [0.15, 0.09, 0.03]], 0.04, std('#06100C', 0.5))); ok.position.set(PX - 1.55, -0.4, 1.1); ok.userData.at = ws(122); g.add(ok); g.userData.items = [a, b, ok]; return g; }
function propCta() { const g = new THREE.Group(), c = new THREE.Group(); c.add(rbox(3.1, 1.1, 0.16, 0.3, phys('#F4F2EE', 0.45), [0, 0, 0])); const ph = textPlane('بنویس…', 0.3, { fg: '#8A8496' }); ph.position.set(0.5, 0, 0.1); c.add(ph); g.userData.ph = ph;
  c.position.set(PX, -0.3, 0.9); c.rotation.y = 0.15; g.add(c); g.userData.box = c;
  const dm = new THREE.Group(); dm.add(rbox(2.7, 0.95, 0.16, 0.3, glowMat(VIO, 0.35), [0, 0, 0])); const t = textPlane('لینک شروع رایگان', 0.3); t.position.set(-0.2, 0, 0.1); dm.add(t); const pl = new THREE.Shape(); pl.moveTo(-0.18, -0.16); pl.lineTo(0.22, 0); pl.lineTo(-0.18, 0.16); pl.lineTo(-0.1, 0); pl.closePath(); const pm = mesh(new THREE.ShapeGeometry(pl), std(WHITE, 0.4), [1.0, 0, 0.1]); dm.add(pm);
  dm.position.set(PX, -1.75, 1.2); dm.rotation.y = 0.15; dm.userData.at = ws(134); g.add(dm); g.userData.dm = dm; return g; }
const PROPS = { payout: propPayout, secret: propSecret, rules: propRules, limits: propLimits, fire: propFire, know: propKnow, risk: propRisk, lab: propLab, market: propMarket, analysis: propAnalysis, pass: propPass, cta: propCta };
const popK = (t, at) => cl(spring(t - at + 0.02, 13, 0.55), 0, 1.15);
function animateProp(name, g, t, i) {
  const t0 = BT[i], t1 = beatEnd(i), kin = popK(t, t0 + 0.05), kout = 1 - cub(k01(t, t1 - 0.22, 0.2)); g.visible = t >= t0 - 0.05 && t < t1;
  g.scale.setScalar(Math.max(0.001, kin * kout)); const pivot = new V3(PX, -1.2, 0.8); g.position.set(pivot.x * (1 - g.scale.x), pivot.y * (1 - g.scale.y), pivot.z * (1 - g.scale.z));
  const U = g.userData;
  if (name === 'secret') { const k = popK(t, U.x.userData.at); U.x.visible = k > 0.01; U.x.scale.setScalar(Math.max(0.001, lerp(1.6, 1, cl(k)) * cl(k * 2))); }
  if (name === 'limits') U.gauges.forEach((a) => { const k = popK(t, a.userData.at); a.visible = k > 0.01; a.scale.setScalar(Math.max(0.001, k)); a.userData.piv.rotation.z = Math.PI / 2 - Math.PI * a.userData.f * cub(k01(t, a.userData.at, 0.9)) + Math.sin(t * 9) * 0.02; });
  if (name === 'fire') { const k = cub(k01(t, ws(40) - 0.1, 0.4)); U.flames.forEach((f, j) => { f.scale.set(1, Math.max(0.01, k * (0.85 + 0.25 * Math.sin(t * 13 + j * 1.7))), 1); f.visible = k > 0.01; }); U.L.intensity = 4 + 24 * k; }
  if (name === 'know') { const kp = popK(t, U.panel.userData.at); U.panel.scale.setScalar(Math.max(0.001, kp)); U.chips.forEach((c) => { const k = popK(t, c.userData.at); c.visible = k > 0.01; c.scale.setScalar(Math.max(0.001, k)); }); }
  if (name === 'risk') { U.piv.rotation.z = lerp(-1.1, 1.0, cub(k01(t, ws(73), 0.8))); const k = popK(t, U.ok.userData.at); U.ok.visible = k > 0.01; U.ok.scale.setScalar(Math.max(0.001, k)); }
  if (name === 'lab' || name === 'market') { const key = name === 'lab' ? A_KEYS[Math.min(5, Math.floor(cl((t - t0) / (t1 - t0)) * 6))] : C_KEYS[Math.min(15, Math.floor(cl((t - t0) / (t1 - t0 - 0.3)) * 16))]; const mt = screenMat(key); if (U.mon.userData.scr.material.map !== mt) { U.mon.userData.scr.material.map = mt; U.mon.userData.scr.material.needsUpdate = true; }
    if (name === 'lab') { const k = popK(t, U.card.userData.at); U.card.visible = k > 0.01; U.card.scale.setScalar(Math.max(0.001, k)); } }
  if (name === 'analysis') U.gauge.userData.piv.rotation.z = Math.PI / 2 - Math.PI * lerp(0.1, 0.55, cub(k01(t, ws(113), 1.0))) + Math.sin(t * 7) * 0.05 * (t < ws(117) ? 1 : 0);
  if (name === 'pass') U.items.forEach((c) => { const k = popK(t, c.userData.at); c.visible = k > 0.01; c.scale.setScalar(Math.max(0.001, k)); });
  if (name === 'cta') { const n = Math.max(0, Math.min(4, Math.floor((t - ws(132) + 0.1) / 0.09))), s = 'PROP'.slice(0, n); if (U.typed !== n) { U.box.remove(U.ph); U.ph = textPlane(n ? s + (n < 4 ? '|' : '') : 'بنویس…', 0.42, { fg: n ? INK : '#8A8496', w: 900 }); U.ph.position.set(n ? 0 : 0.5, 0, 0.1); U.box.add(U.ph); U.typed = n; }
    const k = popK(t, U.dm.userData.at); U.dm.visible = k > 0.01; U.dm.scale.setScalar(Math.max(0.001, k)); }
}

// ---------- the 2D layer: the headline, the spoken words, the end card ----------
const cv = document.getElementById('c').getContext('2d');
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function stroked(s, x, y, size, col, o = {}) { cv.save(); cv.font = FONT(size, o.w ?? 900); cv.textAlign = 'center'; cv.textBaseline = 'middle'; cv.direction = isL(s) ? 'ltr' : 'rtl'; cv.lineJoin = 'round';
  cv.shadowColor = 'rgba(0,0,0,0.85)'; cv.shadowBlur = 26; cv.shadowOffsetY = 8; cv.strokeStyle = INK; cv.lineWidth = o.lw ?? 16; cv.strokeText(s, x, y); cv.shadowColor = 'transparent';
  if (col !== WHITE && !o.flat) { cv.shadowColor = col + '88'; cv.shadowBlur = 24; } cv.fillStyle = col; cv.fillText(s, x, y); cv.restore(); }
// the subtitles: whisper's words, corrected and joined where Persian joins them
const FIX = { 'پروپ': 'پراپ', 'استراتیجی': 'استراتژی', 'استراتیجیشون': 'استراتژیشون', 'قانونهای': 'قانون‌های', 'زرر': 'ضرر', 'تحیه': 'تهیه', 'رائیگان': 'رایگان', 'برای': 'برات', 'حتماً': 'حتماً' };
const TOK = []; { const w = D.words; for (let i = 0; i < w.length; i++) { let s = FIX[w[i]] ?? w[i];
  if ((s === 'می' || s === 'نمی') && i + 1 < w.length) { s = s + '‌' + (FIX[w[i + 1]] ?? w[i + 1]); TOK.push([s, i]); i++; continue; }
  if (s === 'حد' && w[i + 1] === 'اکثر') { TOK.push(['حداکثر', i]); i++; continue; }
  if (s === 'بک' && w[i + 1] === 'تست') { TOK.push(['بک‌تست‌لب،', i]); i += 2; continue; }
  if (s === 'پشت' && w[i + 1] === 'سره') { TOK.push(['پشت‌سرهم', i]); i += 2; continue; }
  TOK.push([s, i]); } }
const CHUNKS = []; { let cur = []; TOK.forEach((tk, j) => { cur.push(tk); const end = /[،.؟!]$/.test(tk[0]) || cur.length >= 6; if (end || j === TOK.length - 1) { CHUNKS.push(cur); cur = []; } }); }
function subtitles(t) {
  if (t > D.end + 0.2) return; let ch = CHUNKS[0]; CHUNKS.forEach((c) => { if (t >= ws(c[0][1]) - 0.08) ch = c; });
  const size = 52, gap = measure(' ', size, 800) * 1.4, wd = ch.map(([s]) => measure(s, size, 800)), total = wd.reduce((a, b) => a + b, 0) + gap * (ch.length - 1), sc = Math.min(1, 960 / total), y = 1560;
  cv.save(); cv.fillStyle = 'rgba(8,6,16,0.6)'; cv.beginPath(); cv.roundRect(CX - (total * sc) / 2 - 30, y - 50, total * sc + 60, 100, 28); cv.fill(); cv.restore();
  let right = CX + (total * sc) / 2; ch.forEach(([s, wi], j) => { const w = wd[j] * sc, said = t >= ws(wi) - 0.04, now = said && (j === ch.length - 1 || t < ws(ch[j + 1][1]) - 0.04);
    cv.save(); cv.font = FONT(size * sc, 800); cv.textAlign = 'center'; cv.textBaseline = 'middle'; cv.direction = isL(s) ? 'ltr' : 'rtl'; cv.fillStyle = now ? LIME : said ? WHITE : 'rgba(255,255,255,0.45)'; cv.fillText(s, right - w / 2, y + 3); cv.restore(); right -= w + gap * sc; });
}
function headline(t) {
  const i = beatAt(t), b = B[i], t0 = BT[i], t1 = beatEnd(i), out = 1 - cub(k01(t, t1 - 0.18, 0.16));
  const fit = (s, size) => Math.min(size, size * 960 / measure(s, size));
  const g = cv.createLinearGradient(0, 260, 0, 760); g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); cv.fillStyle = g; cv.fillRect(0, 260, W, 500);
  [[b[1], 470, fit(b[1], 108), WHITE, 0], [b[2], 598, fit(b[2], b[2] === 'PROP' ? 130 : 98), b[3], 0.1]].forEach(([s, y, size, col, dl]) => { const k = i === 0 && t < 0.3 ? 1 : cl(spring(t - t0 - dl, 14, 0.6), 0, 1.1); if (k <= 0) return;
    cv.save(); cv.globalAlpha = cl(k * 1.5) * out; cv.translate(CX, y); cv.scale(lerp(0.85, 1, cl(k)), lerp(0.85, 1, cl(k))); stroked(s, 0, 0, size, col); cv.restore(); });
}
function endCard(t) { const k = cub(k01(t, END, 0.35)); if (k <= 0) return; cv.save(); cv.globalAlpha = k; cv.fillStyle = 'rgba(6,5,14,0.82)'; cv.fillRect(0, 0, W, H);
  if (window.ICON_IMG) cv.drawImage(window.ICON_IMG, CX - 110, 560, 220, 220); if (window.WORD_IMG) { const w = 560, h = (w * window.WORD_IMG.height) / window.WORD_IMG.width; cv.drawImage(window.WORD_IMG, CX - w / 2, 830, w, h); }
  stroked('شروعش رایگانه', CX, 1080, 70, LIME); stroked('بنویس PROP 👇', CX, 1210, 60, WHITE, { flat: true }); cv.restore(); }

// ---------- the scene ----------
let scene, cam, mascot, propG = {}, rimL;
const CAMZ = [24, 23.4, 23.6, 23.2, 21.8, 23.6, 23.4, 23.0, 23.2, 23.4, 23.4, 23.0];
const TINTS = ['#3DF59A', '#A88BFF', '#3DF59A', '#FF8A5A', '#FF6A3A', '#2CE6C0', '#3DF59A', '#A88BFF', '#46C8FF', '#FF6A7A', '#3DF59A', '#C6F24E'];
function build() {
  scene = new THREE.Scene(); scene.environment = ENV; scene.environmentIntensity = 0.16;
  room(scene, { side: SIDE, tint: '#3DF59A', seed: 23, theme: 'city' });
  scene.traverse((o) => { if (o.isSpotLight && !rimL) rimL = o; });
  mascot = makeMascot(); scene.add(mascot);
  Object.entries(PROPS).forEach(([k, fn]) => { const g = fn(); g.visible = false; scene.add(g); propG[k] = g; });
  cam = new THREE.PerspectiveCamera(30, W / H, 1, 120);
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }); composer = new EffectComposer(renderer, rt); composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, cam)); composer.addPass(new BokehPass(scene, cam, { focus: 23.5, aperture: 0.006, maxblur: 0.012 }));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.6, 0.98)); composer.addPass(new OutputPass()); composer.addPass(new ShaderPass(GRADE));
}
function frame(t) {
  const i = beatAt(t), t0 = BT[i], k = sm(k01(t, t0, 0.8)), zPrev = i ? CAMZ[i - 1] : CAMZ[0], z = lerp(zPrev, CAMZ[i], k) - 0.25 * k01(t, t0, beatEnd(i) - t0);
  cam.position.set(0.08 * Math.sin(t * 0.37), 0.6 + 0.05 * Math.sin(t * 0.29), z); cam.lookAt(0, -0.35, 0);
  if (rimL) rimL.color.set(TINTS[i]);
  mascot.userData.update(t);
  Object.entries(propG).forEach(([name, g]) => { const j = B.findIndex((b) => b[6] === name); animateProp(name, g, t, j); });
  composer.render();
  cv.clearRect(0, 0, W, H); headline(t); if (COVER) return; subtitles(t); endCard(t);
  const pk = cl(t / END); cv.fillStyle = 'rgba(255,255,255,0.08)'; cv.fillRect(0, 0, W, 8); cv.fillStyle = LIME; cv.fillRect(W * (1 - pk), 0, W * pk, 8);
}
window.DURATION = DUR; window.seek = (t) => frame(t);
let COVER = false; // the cover shows the hook headline alone: no subtitle, no progress bar
window.cover = () => { COVER = true; frame(4.6); };
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A'))); await document.fonts.load('40px "Noto Color Emoji"', '👇');
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  window.ICON_IMG = await load(window.LOGO.icon); window.WORD_IMG = await load(window.LOGO.word);
  { const c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d').drawImage(window.ICON_IMG, 0, 0, 256, 256); window.ICON_TEX = new THREE.CanvasTexture(c); window.ICON_TEX.colorSpace = THREE.SRGBColorSpace; }
  window.IMGT = {}; await Promise.all(Object.entries(window.IMGS || {}).map(async ([k, src]) => { window.IMGT[k] = await load(src); }));
  const miss = Object.keys(window.IMGS || {}).filter((k) => !window.IMGT[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  build(); frame(0); window.ready = true;
});
