// A talking character made from a stylized photo (char/prep.py → CHARS[name]): a WebGL mesh warp of the portrait,
// driven by blend shapes (open, wide, smile, blink, brow) and a head transform (roll, nod, sway), with the mouth's
// inside (teeth, tongue) painted in 2D. The voice drives it through talkState(t, VO), VO from char/voicefeat.py.
//   await charInit('me');  …  drawChar('me', 540, 900, 0.9, talkState(t, DATA.vo));
const CK = {};
function charInit(name) {
  const D = CHARS[name], gc = document.createElement('canvas'); gc.width = D.w; gc.height = D.h;
  const gl = gc.getContext('webgl', { premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: true });
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, `attribute vec2 p; attribute vec2 uv; uniform vec2 sz; varying vec2 v;
    void main() { v = uv; gl_Position = vec4(p.x / sz.x * 2.0 - 1.0, 1.0 - p.y / sz.y * 2.0, 0.0, 1.0); }`));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, `precision mediump float; uniform sampler2D tx; varying vec2 v;
    void main() { gl_FragColor = texture2D(tx, v); }`));
  gl.linkProgram(pr); gl.useProgram(pr);
  const n = D.src.length / 2, uv = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { uv[2 * i] = D.src[2 * i] / D.w; uv[2 * i + 1] = D.src[2 * i + 1] / D.h; }
  const bUV = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bUV); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
  const aUV = gl.getAttribLocation(pr, 'uv'); gl.enableVertexAttribArray(aUV); gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
  const bP = gl.createBuffer(), aP = gl.getAttribLocation(pr, 'p');
  const bI = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(D.tris), gl.STATIC_DRAW);
  gl.uniform2f(gl.getUniformLocation(pr, 'sz'), D.w, D.h);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const K = CK[name] = { D, gc, gl, bP, aP, n, pos: new Float32Array(n * 2) };
  return new Promise((res) => { const im = new Image(); im.onload = () => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    K.ready = true; res(); }; im.onerror = () => res(); im.src = D.img; });
}
/** The deformed vertex positions (portrait pixels) for state st. */
function charPose(K, st) {
  const D = K.D, S = D.shapes, p = K.pos, n = K.n;
  const w = { open: st.open ?? 0, wide: st.wide ?? 0, smile: st.smile ?? 0, blink: st.blink ?? 0, brow: st.brow ?? 0 };
  for (let i = 0; i < 2 * n; i++) p[i] = D.src[i];
  for (const k in w) { const a = w[k]; if (!a) continue; const s = S[k]; for (let i = 0; i < 2 * n; i++) p[i] += s[i] * a; }
  const roll = (st.roll ?? 0) * Math.PI / 180, nod = st.nod ?? 0, sx = st.sway ?? 0, [px, py] = D.pivot;
  if (roll || nod || sx) for (let i = 0; i < n; i++) {
    const h = D.head[i]; if (!h) continue; const a = roll * h, c = Math.cos(a), s = Math.sin(a), x = p[2 * i] - px, y = p[2 * i + 1] - py;
    p[2 * i] = px + c * x - s * y + sx * h; p[2 * i + 1] = py + s * x + c * y + nod * h;
  }
  return p;
}
/** Draw character `name` with its image centre at (cx, cy), scaled by sc, in state st. */
function drawChar(name, cx, cy, sc, st = {}, o = {}) {
  const K = CK[name]; if (!K || !K.ready) return; const { D, gl } = K, p = charPose(K, st);
  gl.viewport(0, 0, D.w, D.h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindBuffer(gl.ARRAY_BUFFER, K.bP); gl.bufferData(gl.ARRAY_BUFFER, p, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(K.aP); gl.vertexAttribPointer(K.aP, 2, gl.FLOAT, false, 0, 0);
  gl.drawElements(gl.TRIANGLES, D.tris.length, gl.UNSIGNED_SHORT, 0);
  cv.save(); cv.globalAlpha *= o.alpha ?? 1; cv.translate(cx, cy); cv.scale(sc, sc); cv.translate(-D.w / 2, -D.h / 2);
  if (o.shadow) { cv.shadowColor = o.shadow; cv.shadowBlur = 60; }
  cv.drawImage(K.gc, 0, 0); cv.shadowColor = 'transparent';
  mouthInside(D, p);
  cv.restore();
}
function mouthInside(D, p) {
  const M = D.mouth, P = (i) => [p[2 * i], p[2 * i + 1]], up = M.up.map(P), lo = M.lo.map(P), mw = M.w;
  let gap = 0; for (let k = 3; k < 8; k++) gap += lo[k][1] - up[k][1]; gap /= 5; if (gap < 1.2) return;
  const curve = (pts, first) => { if (first) cv.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length - 1; k++) cv.quadraticCurveTo(pts[k][0], pts[k][1], (pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2); cv.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); };
  const shape = () => { cv.beginPath(); curve(up, true); curve(lo.slice().reverse(), false); cv.closePath(); };
  const a = Math.min(1, (gap - 1.2) / 4), cx = (up[0][0] + up[10][0]) / 2, top = Math.min(...up.map((q) => q[1])), bot = Math.max(...lo.map((q) => q[1]));
  cv.save(); cv.globalAlpha *= a; shape(); cv.clip();
  const g = cv.createLinearGradient(0, top, 0, bot); g.addColorStop(0, '#1c0709'); g.addColorStop(1, '#3e1418'); cv.fillStyle = g; cv.fillRect(cx - mw, top - 5, mw * 2, bot - top + 10);
  // tongue, low in the mouth
  if (gap > 8) { cv.globalAlpha = a * Math.min(1, (gap - 8) / 10); cv.fillStyle = '#93404a'; cv.beginPath(); cv.ellipse(cx, bot + gap * 0.12, mw * 0.3, gap * 0.42, 0, 0, 7); cv.fill(); }
  // upper teeth under the upper lip, only between the canines, in the portrait's muted palette
  const tH = Math.min(gap * 0.38, mw * 0.07); cv.globalAlpha = a * 0.92;
  const tg = cv.createLinearGradient(cx - mw * 0.32, 0, cx + mw * 0.32, 0); tg.addColorStop(0, 'rgba(214,204,190,0)'); tg.addColorStop(0.25, 'rgba(226,218,205,1)'); tg.addColorStop(0.75, 'rgba(226,218,205,1)'); tg.addColorStop(1, 'rgba(214,204,190,0)');
  cv.fillStyle = tg; cv.beginPath(); curve(up, true); curve(up.slice().reverse().map(([x, y]) => [x, y + tH]), false); cv.closePath(); cv.fill();
  // a soft shadow under the upper lip
  const sg = cv.createLinearGradient(0, top, 0, top + gap * 0.5); sg.addColorStop(0, 'rgba(20,5,6,0.55)'); sg.addColorStop(1, 'rgba(20,5,6,0)'); cv.fillStyle = sg; cv.fillRect(cx - mw, top - 2, mw * 2, gap * 0.5);
  cv.restore();
}
/** Per-frame state from the voice features: mouth from the voice envelope, blinks, small head motion, brows on emphasis.
 * VO = {fps, open: [], wide: []}; o: seed, blinks (extra times), still (0–1 less motion), smile (fn of t or number). */
function talkState(t, VO, o = {}) {
  const f = t * (VO?.fps ?? 30), at = (arr) => { if (!arr || !arr.length) return 0; const i = Math.max(0, Math.min(arr.length - 1, Math.floor(f))), j = Math.min(arr.length - 1, i + 1), u = f - Math.floor(f); return arr[i] * (1 - u) + arr[j] * u; };
  const slow = (arr) => { let s = 0, ws = 0; for (let k = -8; k <= 8; k++) { const w = 1 - Math.abs(k) / 9; const i = Math.max(0, Math.min((arr?.length ?? 1) - 1, Math.round(f) + k)); s += (arr?.[i] ?? 0) * w; ws += w; } return s / ws; };
  const open = f < (VO?.open?.length ?? 0) ? at(VO.open) : 0, wide = f < (VO?.wide?.length ?? 0) ? at(VO.wide) : 0, env = VO ? slow(VO.open) : 0;
  // blinks: every 2.6–5.2 s (deterministic), 0.17 s long, plus any extra times
  const seed = o.seed ?? 7; let blink = 0; const bt = []; let x = 0.9 + (seed % 5) * 0.2, r = seed;
  while (x < t + 1) { bt.push(x); r = (r * 16807) % 2147483647; x += 2.6 + (r / 2147483647) * 2.6; }
  for (const b of [...bt, ...(o.blinks ?? [])]) { const u = t - b; if (u >= 0 && u < 0.17) blink = Math.max(blink, u < 0.06 ? u / 0.06 : 1 - (u - 0.06) / 0.11); }
  const k = 1 - (o.still ?? 0);
  const roll = k * (1.3 * Math.sin(t * 0.61 + seed) + 0.7 * Math.sin(t * 1.37 + 2 * seed)) + (o.roll ?? 0);
  const nod = k * (6 * (env - 0.25) + 2.5 * Math.sin(t * 0.9 + seed)) + (o.nod ?? 0);
  const sway = k * 5 * Math.sin(t * 0.43 + seed * 0.5) + (o.sway ?? 0);
  const brow = Math.max(0, Math.min(1, (env - 0.32) * 1.8)) * 0.7 + (o.brow ?? 0);
  const smile = typeof o.smile === 'function' ? o.smile(t) : (o.smile ?? 0.1);
  return { open, wide, blink: Math.max(blink, o.blinkHold ?? 0), roll, nod, sway, brow, smile };
}
