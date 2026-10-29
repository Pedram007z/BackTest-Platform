// dg1 · «چالش ۱۰۰ معامله», the user's voice, in the logo's violet: 3D glass objects in the style of the brand's glass
// slides, on a plain dark background. The page has two layers:
//   - #g (WebGL, three.js): one glass hero per step. Each is transmissive glass with violet attenuation and an edge
//     glow, with neon parts inside that bloom. The heroes are:
//       - a trophy (the challenge);
//       - glass stairs (۴ قدم);
//       - a tile with a crosshair and three beads, one kept (one strategy);
//       - three tiles (entry, stop loss, take profit);
//       - a ring that fills 0→100 (the trades);
//       - a shield with a check (no cheating);
//       - a diamond that splits into two tiles (the two outcomes);
//       - the trophy again (both a win);
//       - the BacktestLab icon in glass;
//       - stairs with neon footprints (step by step).
//     Thin orbit rings with glass beads and a warm dot circle each hero; a few sparkles. A glass tube with a neon core
//     (the diagram) links the heroes, draws itself between them and carries flowing light. The camera travels down
//     it step by step, then pulls back over the whole chain.
//   - #c (2D): a top bar (the step count, the brand) and, under the hero, the spoken line as a headline (accent words in
//     violet) with a small subline. Labels sit under the tiles, the counter in the ring, and the end card.
// The background is plain: dark violet, a soft spotlight from the top and a glow under the hero, all carried by the
// camera. 1080×1920, every frame a pure function of t.
const { THREE, RoundedBoxGeometry, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, SVGLoader } = window.T3;
const W = 1080, H = 1920, CX = 540;
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w, ws = (i) => Wd[i][0];
const VIO = '#6C47FF', LILAC = '#B9A6FF', MINT = '#3CF0B4', ROSE = '#FF5C8A', AMB = '#FFC15A', INK = '#FFFFFF', MUT = 'rgba(226,220,255,0.66)';
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3), sio = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
const pop = (dt, w = 12, z = 0.6) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const hdr = (c, k) => new THREE.Color(c).multiplyScalar(k);

// ================= the 3D world =================
const R = new THREE.WebGLRenderer({ canvas: document.getElementById('g'), antialias: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(W, H, false); R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = 1.05;
const SC = new THREE.Scene();
const CAM = new THREE.PerspectiveCamera(35, W / H, 0.1, 400); SC.add(CAM);
// the environment the glass reflects: a white softbox above, violet and lilac panels at the sides
{ const e = new THREE.Scene(); e.background = new THREE.Color('#05030F');
  const panel = (w, h, x, y, z, c, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: hdr(c, k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); e.add(m); };
  panel(12, 2.2, 0, 7, 1, '#FFFFFF', 5); panel(2.4, 9, -7, 0.5, 2, '#7C5CFF', 3.2); panel(2.4, 9, 7, 0.5, 2, '#B48CFF', 3); panel(9, 2, 0, -6, 4, '#3A2AA0', 1.6); panel(7, 7, 0, 0, -8, '#24166E', 1.2);
  SC.environment = new THREE.PMREMGenerator(R).fromScene(e, 0.02).texture; }
// the background, carried by the camera: plain dark violet, a spotlight from the top, a glow under the hero
const BGC = document.createElement('canvas'); BGC.width = 540; BGC.height = 960;
{ const b = BGC.getContext('2d'), g = b.createLinearGradient(0, 0, 0, 960); g.addColorStop(0, '#120B3A'); g.addColorStop(0.55, '#0B0728'); g.addColorStop(1, '#05030F'); b.fillStyle = g; b.fillRect(0, 0, 540, 960);
  b.save(); b.globalCompositeOperation = 'screen'; const beam = b.createLinearGradient(0, 0, 0, 560); beam.addColorStop(0, 'rgba(170,150,255,0.36)'); beam.addColorStop(1, 'rgba(170,150,255,0)');
  b.fillStyle = beam; b.beginPath(); b.moveTo(230, 0); b.lineTo(310, 0); b.lineTo(470, 560); b.lineTo(70, 560); b.closePath(); b.filter = 'blur(18px)'; b.fill(); b.filter = 'none';
  const fl = b.createRadialGradient(270, 560, 10, 270, 560, 230); fl.addColorStop(0, 'rgba(120,90,255,0.42)'); fl.addColorStop(1, 'rgba(120,90,255,0)'); b.save(); b.translate(270, 560); b.scale(1, 0.32); b.translate(-270, -560); b.fillStyle = fl; b.fillRect(0, 300, 540, 520); b.restore();
  const v = b.createRadialGradient(270, 420, 200, 270, 480, 640); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); b.fillStyle = v; b.fillRect(0, 0, 540, 960); b.restore(); }
const BGT = new THREE.CanvasTexture(BGC); BGT.colorSpace = THREE.SRGBColorSpace;
const BGM = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: BGT, depthWrite: false, toneMapped: false })); BGM.renderOrder = -10; CAM.add(BGM);
function fitBg() { const d = 150, h = 2 * d * Math.tan(THREE.MathUtils.degToRad(CAM.fov / 2)); BGM.position.set(0, 0, -d); BGM.scale.set(h * CAM.aspect, h, 1); }
fitBg();
const COMP = new EffectComposer(R); COMP.addPass(new RenderPass(SC, CAM)); const BLOOM = new UnrealBloomPass(new THREE.Vector2(W, H), 0.85, 0.55, 0.8); COMP.addPass(BLOOM); COMP.addPass(new OutputPass());

// ---------- materials ----------
const glassMat = (o = {}) => new THREE.MeshPhysicalMaterial({ color: o.tint ?? '#EEE8FF', metalness: 0, roughness: o.rough ?? 0.04, transmission: 1, thickness: o.thick ?? 0.9, ior: 1.5,
  attenuationColor: new THREE.Color(o.att ?? '#8A6CFF'), attenuationDistance: (o.ad ?? 2.4) * 1.5, clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 1, envMapIntensity: 1.7, iridescence: 0.2, iridescenceIOR: 1.3, transparent: o.fade !== undefined, opacity: 1 });
const EDGE_V = 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }';
const EDGE_F = 'uniform vec3 c; uniform float k; uniform float o; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.-abs(dot(vN,vV)), 2.4); gl_FragColor = vec4(c*f*k*o, 1.); }';
const edgeMat = (c = '#9C80FF', k = 1.6) => new THREE.ShaderMaterial({ uniforms: { c: { value: new THREE.Color(c) }, k: { value: k }, o: { value: 1 } }, vertexShader: EDGE_V, fragmentShader: EDGE_F, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const neonMat = (c, k = 2.6) => new THREE.MeshBasicMaterial({ color: hdr(c, k) });   // opaque: transmission refracts only opaque objects
/** a glass mesh with its edge glow; returns the group */
function glassy(geo, o = {}) { const g = new THREE.Group(), m = new THREE.Mesh(geo, glassMat(o)), e = new THREE.Mesh(geo, edgeMat(o.edge, o.ek)); e.renderOrder = 2; g.add(m, e); g.userData.glass = m; g.userData.edge = e; return g; }

// ---------- Lucide icons as neon tubes ----------
const LOADER = new SVGLoader();
function iconSvg(name) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' + window.ICONS[name].map(([tag, a]) => '<' + tag + ' ' + Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ') + '/>').join('') + '</svg>'; }
function iconTubes(name, size, r, mat) {
  const g = new THREE.Group(), data = LOADER.parse(iconSvg(name));
  data.paths.forEach((p) => p.subPaths.forEach((sp) => {
    const pts = sp.getPoints(48).map((q) => new THREE.Vector3(((q.x - 12) / 24) * size, (-(q.y - 12) / 24) * size, 0)), v = [pts[0]];
    pts.forEach((q) => { if (q.distanceTo(v[v.length - 1]) > 1e-4) v.push(q); }); if (v.length < 2) return;
    const path = new THREE.CurvePath(); for (let i = 0; i < v.length - 1; i++) path.add(new THREE.LineCurve3(v[i], v[i + 1]));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(8, v.length * 3), r, 10, false), mat));
    [v[0], v[v.length - 1]].forEach((e) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat); s.position.copy(e); g.add(s); });
  }));
  return g;
}
/** an SVG path as an extruded shape, centred, in a size×size box (from a 24- or 1024-unit view box) */
function shapeGeo(d, box, size, depth, bevel = 0.08) {
  const shapes = LOADER.parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}"><path d="${d}"/></svg>`).paths.flatMap((p) => SVGLoader.createShapes(p));
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 5, curveSegments: 32 });
  const s = size / box; geo.scale(s, -s, 1); geo.translate(-size / 2, size / 2, -depth / 2); return geo;
}

// ---------- the heroes ----------
function orbit(r, tilt, phase, n = 3) {
  const g = new THREE.Group(); g.rotation.set(tilt, 0, 0.18);
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 256), new THREE.MeshBasicMaterial({ color: hdr(LILAC, 0.9), transparent: true, opacity: 0.55 })));
  const beads = []; for (let i = 0; i < n; i++) { const b = glassy(new THREE.SphereGeometry(0.15, 32, 20), { ad: 1.2 }); g.add(b); beads.push([b, phase + (i / n) * Math.PI * 2]); }
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), neonMat(AMB, 3.2)); g.add(dot); beads.push([dot, phase + 0.9]);
  g.userData.tick = (t) => beads.forEach(([b, a0], i) => { const a = a0 + t * (i === n ? 0.5 : 0.22); b.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); });
  return g;
}
function sparkles(n, r, seed) {
  const geo = new THREE.BufferGeometry(), p = []; for (let i = 0; i < n; i++) { const a = rnd(seed + i) * Math.PI * 2, rr = r * (0.4 + 0.6 * rnd(seed + i * 3)); p.push(Math.cos(a) * rr, (rnd(seed + i * 7) - 0.5) * r * 1.4, Math.sin(a) * rr * 0.6 - 0.5); }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: hdr(LILAC, 1.6), size: 0.05, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
}
const PLATE_F = 'uniform vec3 c; varying vec2 vU; void main(){ float r = length(vU - 0.5) * 1.6; gl_FragColor = vec4(c * mix(0.55, 0.12, clamp(r, 0., 1.)), 1.); }';
const plateMat = (c = '#7B5CFF') => new THREE.ShaderMaterial({ uniforms: { c: { value: new THREE.Color(c) } }, vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: PLATE_F });
function plate(s, d, c) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.82, s * 0.82), plateMat(c)); m.position.z = -d / 2 + 0.09; return m; }
function tile(icon, col, o = {}) {
  const s = o.s ?? 2.5, g = glassy(new RoundedBoxGeometry(s, s, o.d ?? 0.7, 6, 0.36), o); g.add(plate(s, o.d ?? 0.7, o.plate ?? '#6C47FF'));
  const ic = iconTubes(icon, s * 0.6, 0.05 * (s / 2.5), neonMat(col, o.k ?? 2.8)); g.add(ic); g.userData.icon = ic; return g;
}
function trophy() {
  const g = new THREE.Group(), prof = [[0, 0], [0.16, 0], [0.16, 0.12], [0.11, 0.2], [0.1, 0.62], [0.2, 0.74], [0.55, 0.95], [0.84, 1.3], [0.98, 1.75], [1.02, 2.12], [0.92, 2.16], [0.6, 2.06], [0, 2.02]];
  const cup = glassy(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 72), { ad: 2.0 }); g.add(cup);
  const base = glassy(new RoundedBoxGeometry(1.5, 0.34, 0.9, 5, 0.12), { ad: 1.6 }); base.position.y = -0.17; g.add(base);
  [-1, 1].forEach((sd) => { const h = glassy(new THREE.TorusGeometry(0.36, 0.075, 16, 48, Math.PI * 1.15), { ad: 1.4 }); h.position.set(sd * 0.98, 1.62, 0); h.rotation.z = sd > 0 ? -Math.PI * 0.55 : Math.PI * 0.55 + Math.PI; g.add(h); });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.028, 12, 120), neonMat(LILAC, 3)); rim.rotation.x = Math.PI / 2; rim.position.y = 2.12; g.add(rim);
  const st = iconTubes('star', 0.9, 0.045, neonMat(AMB, 3)); st.position.set(0, 1.42, 0.1); g.add(st);
  g.position.y = -1.0; const w = new THREE.Group(); w.add(g); return w;
}
function stairs(n, prints) {
  const g = new THREE.Group(), feet = [];
  for (let i = 0; i < n; i++) { const h = 0.42 * (i + 1), s = glassy(new RoundedBoxGeometry(0.95, h, 1.7, 4, 0.1), { ad: 1.8 }); s.position.set(-((n - 1) * 0.95) / 2 + i * 0.95, h / 2 - 1.1, 0); g.add(s);
    if (prints) { const f = iconTubes('footprints', 0.6, 0.03, neonMat(LILAC, 3)); f.rotation.x = -Math.PI / 2; f.position.set(s.position.x, h - 1.1 + 0.04, 0.15); f.visible = false; g.add(f); feet.push(f); } }
  g.rotation.set(0.32, -0.5, 0); g.userData.feet = feet; return g;
}
function ring() {
  const g = new THREE.Group(), gl = glassy(new THREE.TorusGeometry(1.45, 0.34, 40, 160), { ad: 2.2 }); g.add(gl);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.1, 16, 8, 0.01), neonMat(LILAC, 3)); arc.rotation.z = Math.PI / 2; arc.scale.x = -1; g.add(arc); g.userData.arc = arc; g.userData.k = -1;
  g.userData.fill = (k) => { if (Math.abs(k - g.userData.k) < 0.002) return; g.userData.k = k; arc.geometry.dispose(); arc.geometry = new THREE.TorusGeometry(1.45, 0.1, 16, Math.max(8, Math.round(256 * k)), Math.max(0.001, Math.PI * 2 * k)); };
  return g;
}
function shield() {
  const d = window.ICONS.shield.find(([tag]) => tag === 'path')[1].d, g = glassy(shapeGeo(d, 24, 3.0, 0.7, 0.14), { ad: 2.0 });
  const ck = iconTubes('check', 1.5, 0.07, neonMat(LILAC, 3)); ck.position.set(0, 0.05, 0); g.add(ck); return g;
}
function diamond() { const geo = new THREE.OctahedronGeometry(1.35, 0); geo.scale(1, 1.25, 1); const g = glassy(geo, { ad: 1.8 }); const ic = iconTubes('split', 1.0, 0.05, neonMat(LILAC, 3)); g.add(ic); return g; }
function brand() {
  const g = glassy(new RoundedBoxGeometry(2.7, 2.7, 0.8, 6, 0.62), { att: '#5430E6', ad: 1.1, tint: '#D8CCFF' }); g.add(plate(2.7, 0.8, '#7B5CFF'));
  const paths = [...window.APP_SVG.matchAll(/<path[^>]* d="([^"]+)"/g)].map((m) => m[1]);
  paths.forEach((d, i) => { const m = new THREE.Mesh(shapeGeo(d, 1024, 2.7, 0.12, 0.02), neonMat(i === 2 ? '#FFFFFF' : LILAC, i === 2 ? 2.4 : 1.8)); m.position.z = 0.05; g.add(m); });
  return g;
}
// one node per step, down the chain
const GAP = 9;
const STEPS = [
  { k: 'hook', make: trophy }, { k: 'rule', make: () => stairs(4) }, { k: 'pick', make: () => tile('crosshair', LILAC) }, { k: 'write', make: () => new THREE.Group() },
  { k: 'hundred', make: ring }, { k: 'fair', make: shield }, { k: 'outcome', make: diamond }, { k: 'both', make: trophy }, { k: 'start', make: brand }, { k: 'follow', make: () => stairs(5, true) },
];
STEPS.forEach((s, i) => {
  s.y = -GAP * i; s.g = new THREE.Group(); s.g.position.y = s.y; SC.add(s.g);
  s.hero = s.make(); s.g.add(s.hero);
  s.orbit = orbit(2.6 + (i % 2) * 0.2, 1.25 + (i % 3) * 0.06, i * 1.3); s.orbit.position.y = 0.1; s.g.add(s.orbit);
  s.spark = sparkles(36, 3.2, i * 50); s.g.add(s.spark);
});
// step ۱: three beads under the crosshair, only one kept
const PICK = STEPS[2], BEADS = [-1.25, 0, 1.25].map((x, i) => { const b = glassy(new THREE.SphereGeometry(0.34, 40, 24), { ad: 1.2 }), core = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 12), neonMat(LILAC, 2.6)); b.add(core); b.position.set(x, -2.05, 0.3); b.userData.core = core; PICK.g.add(b); return b; });
// step ۲: entry, stop loss, take profit
const WRITE = STEPS[3], RULES = [['log-in', LILAC, 2.15], ['octagon-x', ROSE, 0], ['target', MINT, -2.15]].map(([ic, c, x]) => { const t = tile(ic, c, { s: 1.75, d: 0.55 }); t.position.set(x, 0, 0); WRITE.g.add(t); return t; });
// the decision: two outcomes
const OUT = STEPS[6], BR = [['chart-line', MINT, 2.1], ['piggy-bank', AMB, -2.1]].map(([ic, c, x]) => { const t = tile(ic, c, { s: 1.7, d: 0.55 }); t.position.set(x, -3.0, 0); OUT.g.add(t); return t; });
const BRL = BR.map((t) => { const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -1.6, 0), new THREE.Vector3(t.position.x * 0.5, -1.9, 0.2), new THREE.Vector3(t.position.x, -2.1, 0)]); const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.035, 8, false), neonMat(LILAC, 2.4)); OUT.g.add(m); return m; });
// the diagram: a glass tube with a neon core from step to step, and light flowing down it
const LINKS = STEPS.slice(1).map((s, i) => {
  const a = STEPS[i], ya = a.y - 1.9, yb = s.y + 2.3, sx = (i % 2 ? 1 : -1) * 0.9;
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, ya, -0.6), new THREE.Vector3(sx, lerp(ya, yb, 0.35), -1.2), new THREE.Vector3(-sx, lerp(ya, yb, 0.7), -1.2), new THREE.Vector3(0, yb, -0.6)]);
  const seg = 80, glassT = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, 0.13, 12, false), glassMat({ ad: 1.0 })), core = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, 0.035, 8, false), neonMat(LILAC, 2.2));
  SC.add(glassT, core); const dots = [0, 1, 2].map(() => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), neonMat('#FFFFFF', 3)); SC.add(d); return d; });
  return { curve, glassT, core, dots, seg, to: s };
});

// ---------- the camera path ----------
const DIST = { write: 20, outcome: 19.5, rule: 16, follow: 16.5 };
function camAt(t) {
  let i = 0; STEPS.forEach((s, j) => { if (t >= T[s.k] - 0.55) i = j; });
  const s = STEPS[i], p = STEPS[Math.max(0, i - 1)], e = sio(k01(t, T[s.k] - 0.55, 0.85));
  const dOf = (st) => DIST[st.k] ?? 15.5, yOf = (st) => st.y - dOf(st) * 0.085 - (st.k === 'outcome' ? 1.4 * sio(k01(t, ws(65), 0.8)) : 0);
  let y = lerp(yOf(p), yOf(s), i === 0 ? 1 : e), d = lerp(dOf(p), dOf(s), i === 0 ? 1 : e), x = 0.35 * Math.sin(t * 0.35);
  // the end: back over the whole chain
  const kb = sio(k01(t, T.cta - 0.2, 1.6)), ym = STEPS[STEPS.length - 1].y / 2;
  return { x: lerp(x, 9, kb), y: lerp(y, ym + 4, kb), z: lerp(d, 122, kb), ly: lerp(y, ym - 4, kb) };
}
function project(v) { const p = v.clone().project(CAM); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }

function world(t) {
  const c = camAt(t); CAM.position.set(c.x, c.y, c.z); CAM.lookAt(0, c.ly, 0);
  const far = t >= T.cta - 0.3;
  STEPS.forEach((s, i) => {
    const t0 = i === 0 ? -1 : T[s.k], k = pop(t - t0 + 0.05, 9, 0.62);
    s.g.visible = k > 0.001 && (far || Math.abs(s.y - c.ly) < 16);
    const sc = cl(k, 0, 1.15); s.hero.scale.setScalar(Math.max(0.001, sc));
    s.hero.rotation.y = (s.k === 'rule' || s.k === 'follow' ? 0 : 0.28 * Math.sin(t * 0.55 + i)) + (1 - cl(k)) * 0.8;
    if (s.k !== 'rule' && s.k !== 'follow') s.hero.rotation.x = 0.06 * Math.sin(t * 0.4 + i * 2);
    s.orbit.userData.tick(t + i); s.orbit.scale.setScalar(Math.max(0.001, sio(k01(t, t0 + 0.1, 0.6))));
    s.spark.rotation.y = t * 0.08 + i; s.spark.material.opacity = 0.75 * sio(k01(t, t0, 0.6));
  });
  // step ۱: one bead kept
  const keep = sio(k01(t, ws(23) - 0.05, 0.35));
  BEADS.forEach((b, i) => { const k = pop(t - ws(20) - i * 0.1, 12, 0.6); b.visible = k > 0.001; b.scale.setScalar(Math.max(0.001, cl(k, 0, 1.2) * (i === 1 ? 1 + 0.25 * keep : 1 - 0.35 * keep))); b.userData.core.material.color.copy(hdr(i === 1 ? '#FFFFFF' : LILAC, i === 1 ? 2.6 + keep : 2.6 * (1 - 0.85 * keep))); });
  // step ۲: the three rules, on their words
  RULES.forEach((r, i) => { const k = pop(t - ws([27, 31, 34][i]) + 0.05, 11, 0.6); r.visible = k > 0.001; r.scale.setScalar(Math.max(0.001, cl(k, 0, 1.15))); r.rotation.y = 0.22 * Math.sin(t * 0.6 + i) + (1 - cl(k)) * 0.7; });
  // step ۳: the ring fills to 100
  STEPS[4].hero.userData.fill(sio(k01(t, ws(38), ws(50) + 0.6 - ws(38))));
  // the decision's two outcomes
  BR.forEach((b, i) => { const k = pop(t - ws(i ? 77 : 66) + 0.05, 11, 0.6); b.visible = k > 0.001; b.scale.setScalar(Math.max(0.001, cl(k, 0, 1.15))); b.rotation.y = 0.2 * Math.sin(t * 0.6 + i); BRL[i].visible = k > 0.05; });
  // step by step: the footprints appear up the stairs
  STEPS[9].hero.userData.feet.forEach((f, i) => { f.visible = t >= ws(108) + i * 0.2; });
  // the links draw themselves as the next step comes, then light flows down them
  LINKS.forEach((L, i) => { const k = sio(k01(t, T[L.to.k] - 0.75, 0.6)), n = Math.round(k * L.seg);
    [L.glassT, L.core].forEach((m) => { m.visible = n > 0; m.geometry.setDrawRange(0, n * (m === L.glassT ? 12 : 8) * 6); });
    L.dots.forEach((d, q) => { d.visible = k >= 1; if (k >= 1) d.position.copy(L.curve.getPointAt((t * 0.32 + q / 3 + i * 0.17) % 1)); }); });
  BLOOM.strength = lerp(0.85, 1.05, sio(k01(t, T.cta, 1.2)));
  COMP.render();
}

// ================= the 2D layer: bars, headlines, labels, the end card =================
const cv = document.getElementById('c').getContext('2d');
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`, isL = (s) => /^[\x20-\x7E−@_]+$/.test(s);
function txt(s, x, y, size, col, o = {}) { cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha; cv.font = FONT(size, o.w ?? 900); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl'); if (o.glow) { cv.shadowColor = o.glow; cv.shadowBlur = o.blur ?? 30; } cv.fillText(s, x, y); cv.restore(); }
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
const rgba = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
function rr(x, y, w, h, r) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); }
function at(x, y, s, a, fn) { cv.save(); cv.translate(x, y); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
const IMG = {}; const loadImg = (k, src) => new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; });
function pill(s, x, y, size, o = {}) { const w = measure(s, size, 800) + size * 1.6, h = size * 1.9; cv.save();
  rr(x - w / 2, y - h / 2, w, h, h / 2);
  if (o.solid) { const g = cv.createLinearGradient(x - w / 2, y, x + w / 2, y); g.addColorStop(0, '#8E6CFF'); g.addColorStop(1, '#5430E6'); cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = 40; cv.fillStyle = g; cv.fill(); cv.shadowBlur = 0; }
  else { cv.fillStyle = 'rgba(30,20,80,0.45)'; cv.fill(); }
  cv.strokeStyle = o.solid ? 'rgba(255,255,255,0.45)' : 'rgba(185,166,255,0.55)'; cv.lineWidth = 2; cv.stroke(); cv.restore();
  txt(s, x, y + size * 0.05, size, o.fg ?? INK, { w: 800 }); return w; }

// the spoken lines, a headline at a time: [text, word index, accent?]
const PH = [
  [[['یه', 0], ['چالش', 1, 1], ['دارم', 2]], [['که', 3], ['اگه', 4], ['تا', 5], ['آخرش', 6], ['بری،', 7]]],
  [[['دیگه', 8], ['هیچ‌وقت', [9, 10]], ['مثل', 11], ['قبل', 12]], [['ترید', 13, 1], ['نمی‌کنی.', [14, 15], 1]]],
  [[['قانونش', 16]], [['ساده‌ست.', [17, 18], 1]]],
  [[['یه', 19], ['استراتژی', 20, 1], ['انتخاب', 21], ['کن.', 22]], [['فقط', 23, 1], ['یکی.', 24, 1]]],
  [[['قانون‌هاشو', 25, 1], ['بنویس:', 26]], [['کجا', 27], ['وارد', 28], ['می‌شی؟', [29, 30]]]],
  [[['حد', 31], ['ضررت', 32], ['کجاست؟', 33]], [['حد', 34, 1], ['سودت', 35, 1], ['کجا؟', 36, 1]]],
  [[['حالا', 37], ['صد', 38, 1], ['تا', 39, 1], ['معامله', 40, 1]], [['باهاش', 41], ['بزن،', 42]]],
  [[['نه', 43], ['با', 44], ['پول', 45], ['واقعی،', 46]], [['روی', 47], ['بازار', 48, 1], ['واقعی', 49, 1], ['گذشته.', 50, 1]]],
  [[['بدون', 51], ['تقلب:', 52, 1]], [['آینده', 53], ['رو', 54], ['نمی‌بینی', [55, 56]]]],
  [[['و', 57], ['از', 58], ['قانون‌هات', 59, 1]], [['تخطی', 60], ['نمی‌کنی.', [61, 62]]]],
  [[['آخر', 63], ['صد', 64, 1], ['معامله،', 65, 1]]],
  [[['یا', 66], ['یه', 67], ['استراتژی', 68, 1], ['داری', 69]], [['که', 70], ['می‌دونی', [71, 72]], ['چطور', 73], ['کار', 74], ['می‌کنه،', [75, 76]]]],
  [[['یا', 77], ['صد', 78], ['تا', 79], ['معامله‌ی', 80], ['بد', 81]], [['رو', 82], ['مجانی', 83, 1], ['زدی،', 84]]],
  [[['به', 85], ['جای', 86], ['اینکه', [87, 88]]], [['با', 89], ['پول', 90, 1], ['واقعیت', 91, 1], ['بزنی.', 92]]],
  [[['هر', 93], ['دوش', 94]], [['برده.', 95, 1]]],
  [[['چالش', 96], ['رو', 97], ['توی', 98]], [['بک‌تست‌لب', [99, 100], 1], ['شروع', 101], ['کن.', 102]]],
  [[['ما', 103], ['هم', 104], ['توی', 105], ['همین', 106], ['پیج', 107]], [['قدم', 108, 1], ['به', 109, 1], ['قدم', 110, 1], ['همراهتیم.', 111]]],
  [[['شروعش', 112], ['رایگانه؛', 113, 1]], [['لینکش', 114], ['توی', 115], ['بیوئه.', 116]]],
];
const SUB = { hook: 'چالشی که ترید تو رو عوض می‌کنه', rule: 'فقط ۴ قدم', pick: 'قدم ۱ از ۴', write: 'قدم ۲ از ۴', hundred: 'قدم ۳ از ۴', fair: 'قدم ۴ از ۴',
  outcome: 'آخر چالش', both: 'هر دو حالت، برد', start: 'چالش رو اینجا شروع کن', follow: 'قدم‌به‌قدم، توی همین پیج', cta: 'شروع رایگان' };
const wi = (x) => (Array.isArray(x) ? x[0] : x), phAt = (p) => ws(wi(p[0][0][1]));
function headline(t) {
  if (t > T.end - 0.1) return;
  let cur = 0; PH.forEach((p, i) => { if (t >= phAt(p) - 0.12) cur = i; });
  const p = PH[cur], next = cur + 1 < PH.length ? phAt(PH[cur + 1]) - 0.12 : T.end - 0.1, out = k01(t, next - 0.08, 0.08);
  p.forEach((ln, li) => {
    const size = li === 0 ? 88 : 100, y = 1300 + li * 128, gap = measure(' ', size) * 1.3, wds = ln.map(([s]) => measure(s, size)), total = wds.reduce((a, b) => a + b, 0) + gap * (ln.length - 1), sc = Math.min(1, 940 / total);
    let right = CX + (total * sc) / 2;
    ln.forEach(([s, w, acc], j) => { const st = cur === 0 && li === 0 ? -1 : ws(wi(w)) - 0.05, d = t - st, wpx = wds[j] * sc;
      if (d >= 0) { const a = cl(d / 0.1) * (1 - out), rise = (1 - cub(k01(t, st, 0.3))) * 22; cv.save(); cv.globalAlpha = a; cv.translate(right - wpx / 2, y + rise); cv.scale(sc, sc);
        txt(s, 0, 0, size, acc ? '#A68BFF' : INK, { glow: acc ? rgba(VIO, 0.7) : 'rgba(0,0,0,0.6)', blur: acc ? 34 : 18 }); cv.restore(); }
      right -= wpx + gap * sc; });
  });
  let key = 'hook'; ['hook', 'rule', 'pick', 'write', 'hundred', 'fair', 'outcome', 'both', 'start', 'follow', 'cta'].forEach((k) => { if (t >= T[k] - 0.1) key = k; });
  const ka = cub(k01(t, T[key] - 0.1, 0.4)); txt(SUB[key], CX, 1300 + p.length * 128 + 10, 38, MUT, { w: 700, alpha: ka * (1 - out * 0) });
}
function bars(t, a) {
  cv.save(); cv.globalAlpha = a;
  let i = 0; STEPS.forEach((s, j) => { if (t >= T[s.k] - 0.1) i = j; }); const n = STEPS.length;
  const s = `${fa(String(i + 1).padStart(2, '0'))} / ${fa(n)}`, w = measure(s, 32, 700) + 48; rr(70, 108, w, 60, 30); cv.fillStyle = 'rgba(30,20,80,0.4)'; cv.fill(); cv.strokeStyle = 'rgba(185,166,255,0.5)'; cv.lineWidth = 2; cv.stroke(); txt(s, 70 + w / 2, 140, 32, '#D9CFFF', { w: 700, dir: 'ltr' });
  if (IMG.icon) cv.drawImage(IMG.icon, 960, 108, 56, 56); if (IMG.word) { const ww = 170, hh = (ww * IMG.word.height) / IMG.word.width; cv.drawImage(IMG.word, 960 - 18 - ww, 136 - hh / 2, ww, hh); }
  const g = cv.createLinearGradient(70, 0, 1010, 0); g.addColorStop(0, 'rgba(185,166,255,0.05)'); g.addColorStop(0.5, 'rgba(185,166,255,0.45)'); g.addColorStop(1, 'rgba(185,166,255,0.05)'); cv.fillStyle = g; cv.fillRect(70, 200, 940, 2);
  cv.restore();
}
function labels(t) {
  // under the three rules
  [['ورود', 27], ['حد ضرر', 31], ['حد سود', 34]].forEach(([s, w], i) => { const k = pop(t - ws(w) - 0.1, 12, 0.6); if (k <= 0 || t > T.hundred - 0.4) return; const [x, y] = project(new THREE.Vector3(RULES[i].position.x, STEPS[3].y - 1.35, 0)); at(x, y, cl(k, 0, 1.2), cl(k), () => pill(s, 0, 0, 34)); });
  // the counter in the ring
  if (t > ws(37) - 0.2 && t < T.fair - 0.3) { const kc = sio(k01(t, ws(38), ws(50) + 0.6 - ws(38))), [x, y] = project(new THREE.Vector3(0, STEPS[4].y, 0.3)), a = cub(k01(t, ws(37), 0.4)) * (1 - k01(t, T.fair - 0.6, 0.3));
    txt(fa(Math.round(100 * kc)), x, y + 4, 120, INK, { glow: rgba(VIO, 0.9), blur: 40, alpha: a }); txt('معامله', x, y + 86, 34, MUT, { w: 700, alpha: a }); }
  // under the two outcomes
  [['یه استراتژی که می‌شناسیش', 66], ['۱۰۰ معامله‌ی بد، مجانی', 77]].forEach(([s, w], i) => { const k = pop(t - ws(w) - 0.15, 12, 0.6); if (k <= 0 || t > T.both - 0.4) return; const [x, y] = project(new THREE.Vector3(BR[i].position.x, STEPS[6].y - 4.25, 0)); at(x, y, cl(k, 0, 1.2), cl(k), () => pill(s, 0, 0, 28, i === 0 ? { fg: '#BFFFE9' } : { fg: '#FFE2B0' })); });
}
function endCard(t) {
  const kf = pop(t - ws(113) + 0.05, 13, 0.55); if (kf > 0 && t < T.end + 0.2) at(CX, 1660, cl(kf, 0, 1.2), cl(kf) * (1 - k01(t, T.end - 0.1, 0.3)), () => pill('شروعش رایگانه', 0, 0, 48, { solid: true }));
  if (t < T.end - 0.05) return;
  const kc = cub(k01(t, T.end - 0.05, 0.45)); cv.save(); cv.globalAlpha = kc * 0.62; cv.fillStyle = '#07051A'; cv.fillRect(0, 0, W, H); cv.restore();
  const ki = pop(t - T.end, 11, 0.6); if (ki > 0 && IMG.icon) at(CX, 780, cl(ki, 0, 1.25), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.85); cv.shadowBlur = 80; cv.drawImage(IMG.icon, -150, -150, 300, 300); });
  const kw = cub(k01(t, T.end + 0.25, 0.35)); if (kw > 0 && IMG.word) { const w = 540, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.word, CX - w / 2, 980 + (1 - kw) * 24, w, h); cv.restore(); }
  const kb = pop(t - T.end - 0.45, 13, 0.6); if (kb > 0) at(CX, 1230, cl(kb, 0, 1.2), cl(kb), () => pill('چالش ۱۰۰ معامله', 0, 0, 48, { solid: true }));
  const kg = pop(t - T.end - 0.7, 13, 0.55); if (kg > 0) at(CX, 1380, cl(kg, 0, 1.2), cl(kg), () => pill('لینک توی بیو', 0, 0, 44));
}
function overlay(t) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.clearRect(0, 0, W, H);
  bars(t, 1); labels(t); headline(t); endCard(t);
}

// ================= the frame =================
window.DURATION = DUR;
window.seek = (t) => { world(t); overlay(t); };
window.cover = () => {
  world(1.6); cv.setTransform(1, 0, 0, 1, 0, 0); cv.clearRect(0, 0, W, H); bars(1.6, 1);
  txt('چالش', CX, 1290, 130, INK, { glow: 'rgba(0,0,0,0.6)', blur: 20 }); txt('۱۰۰ معامله', CX, 1440, 140, '#A68BFF', { glow: rgba(VIO, 0.8), blur: 40 });
  txt('اگه تا آخرش بری، دیگه مثل قبل ترید نمی‌کنی', CX, 1570, 40, MUT, { w: 700 });
};
(async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word)]);
  window.seek(0); window.ready = true;
})();
