# Prepare a stylized portrait for talking-head animation in the reels (char-kit.js).
#   <venv>/python prep.py portrait.png out.js NAME [--keep-bg]
# Finds 478 face landmarks (MediaPipe Face Mesh), cuts the person out (MediaPipe selfie segmentation, edges refined
# with a guided filter), and builds the warp mesh: MediaPipe's face triangles, fills for the eyes and the mouth, and
# rings of vertices around the face out past the image edge. Then it stores the blend shapes as per-vertex offsets
# in pixels: open (jaw and lips), wide (+ee / −oo), smile, blink, brow; and a head weight per vertex for nods and
# tilts. out.js sets CHARS[NAME] = {w, h, img (data URL), src, tris, shapes, head, mouth, pivot, face}.
import sys, json, base64, collections
import numpy as np, cv2, mediapipe as mp
from scipy.spatial import Delaunay

src, out, name = sys.argv[1], sys.argv[2], sys.argv[3]; keep_bg = '--keep-bg' in sys.argv
img = cv2.imread(src, cv2.IMREAD_COLOR); H, W = img.shape[:2]; rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
fmm = mp.solutions.face_mesh
with fmm.FaceMesh(static_image_mode=True, refine_landmarks=True, max_num_faces=1) as fm:
    r = fm.process(rgb)
assert r.multi_face_landmarks, 'no face found'
L = np.array([[p.x * W, p.y * H] for p in r.multi_face_landmarks[0].landmark])          # 478 × 2

# --- the cutout ---
if keep_bg: alpha = np.ones((H, W), np.float32)
else:
    with mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=0) as ss:
        m = ss.process(rgb).segmentation_mask.astype(np.float32)
    def guided(I, p, r, eps):
        bf = lambda x: cv2.boxFilter(x, -1, (2 * r + 1, 2 * r + 1))
        mI, mp_ = bf(I), bf(p); a = (bf(I * p) - mI * mp_) / (bf(I * I) - mI * mI + eps); b = mp_ - a * mI
        return bf(a) * I + bf(b)
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    alpha = np.clip(guided(g, m, 8, 1e-3), 0, 1)
    alpha = np.clip((alpha - 0.15) / 0.7, 0, 1)
    # the face itself is always solid
    hull = cv2.convexHull(L[:468].astype(np.int32)); fm_ = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(fm_, hull, 255)
    alpha = np.maximum(alpha, cv2.GaussianBlur(fm_, (0, 0), 3).astype(np.float32) / 255)
rgba = np.dstack([img, (alpha * 255).astype(np.uint8)])
ok, png = cv2.imencode('.webp', rgba, [cv2.IMWRITE_WEBP_QUALITY, 96]); data_url = 'data:image/webp;base64,' + base64.b64encode(png).decode()
cv2.imwrite(out.rsplit('.', 1)[0] + '-cutout.png', rgba)

# --- the mesh ---
E = fmm.FACEMESH_TESSELATION; adj = collections.defaultdict(set)
for a, b in E: adj[a].add(b); adj[b].add(a)
tris = sorted({tuple(sorted((a, b, c))) for a, b in E for c in adj[a] & adj[b]})
def cycle(edges):
    nb = collections.defaultdict(list)
    for a, b in edges: nb[a].append(b); nb[b].append(a)
    s = min(nb); seq = [s, nb[s][0]]
    while True:
        n = [x for x in nb[seq[-1]] if x != seq[-2]][0]
        if n == s: return seq
        seq.append(n)
oval = cycle(fmm.FACEMESH_FACE_OVAL)
if cv2.contourArea(L[oval].astype(np.float32), oriented=True) < 0: oval = oval[::-1]
def inside(poly, p): return cv2.pointPolygonTest(poly.astype(np.float32), (float(p[0]), float(p[1])), False) > 0
def fill(contour_idx, extra=()):
    ids = list(contour_idx) + list(extra); pts = L[ids]; poly = L[list(contour_idx)]
    out_t = []
    for t in Delaunay(pts + np.random.default_rng(0).normal(0, 1e-3, pts.shape)).simplices:
        if inside(poly, pts[t].mean(0)): out_t.append(tuple(ids[i] for i in t))
    return out_t
reye, leye = cycle(fmm.FACEMESH_RIGHT_EYE), cycle(fmm.FACEMESH_LEFT_EYE)
iris_a, iris_b = list(range(468, 473)), list(range(473, 478))
if inside(L[reye], L[468]): iris_r, iris_l = iris_a, iris_b
else: iris_r, iris_l = iris_b, iris_a
UP_IN = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308]; LO_IN = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]
UP_OUT = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291]; LO_OUT = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291]
mouth_poly = UP_IN + LO_IN[-2:0:-1]
fills = fill(reye, iris_r) + fill(leye, iris_l)
mouth_t = []
mp_pts = L[mouth_poly]; dl = Delaunay(mp_pts + np.random.default_rng(1).normal(0, 1e-3, mp_pts.shape))
for t in dl.simplices:   # a closed mouth is a thin sliver; keep triangles that span upper to lower lip
    ids = [mouth_poly[i] for i in t]
    if any(i in UP_IN for i in ids) and any(i in LO_IN[1:-1] for i in ids): mouth_t.append(tuple(ids))

V = [p for p in L]; n0 = len(V)
c = L[oval].mean(0); RINGS = [1.25, 1.6, 2.4, 7.0]; ring_ids = []
for s in RINGS:
    ids = []
    for i in oval: V.append(c + (L[i] - c) * s); ids.append(len(V) - 1)
    ring_ids.append(ids)
ring_t = []; prev = oval; n = len(oval)
for ids in ring_ids:
    for k in range(n):
        a, b, a2, b2 = prev[k], prev[(k + 1) % n], ids[k], ids[(k + 1) % n]
        ring_t += [(a, b, a2), (b, b2, a2)]
    prev = ids
V = np.array(V); NV = len(V)

# --- measurements ---
chin, top = L[152], L[10]; faceH = chin[1] - top[1]
mL, mR = L[61], L[291]; mw = np.linalg.norm(mR - mL); mc = (L[13] + L[14]) / 2
xs = L[oval][:, 0]; halfW = (xs.max() - xs.min()) / 2
ss = lambda e0, e1, x: np.clip((x - e0) / (e1 - e0), 0, 1) ** 2 * (3 - 2 * np.clip((x - e0) / (e1 - e0), 0, 1))
def yline(x):   # the line through the mouth corners
    return mL[1] + (mR[1] - mL[1]) * (x - mL[0]) / (mR[0] - mL[0])
ring_of = np.full(NV, -1)
for k, ids in enumerate(ring_ids): ring_of[ids] = k
in_face = np.zeros(NV, bool); in_face[:n0] = True

# open: the jaw swings down, the lower lip with it, the upper lip lifts a little
D = 0.30 * mw; op = np.zeros((NV, 2))
hl = lambda x: max(0.1, 1 - 0.85 * min(1, abs(x - mc[0]) / (mw / 2)) ** 2)
lower_lips = set(LO_IN[1:-1] + LO_OUT[1:-1]); corners = {61, 291, 78, 308}
for i, (x, y) in enumerate(V):
    if i in corners: op[i, 1] = 0.12 * D; continue
    if i in lower_lips: op[i, 1] = D * hl(x); continue
    if i in UP_IN[1:-1]: op[i, 1] = -0.1 * D * hl(x); continue
    if i in UP_OUT[1:-1]: op[i, 1] = -0.05 * D * hl(x); continue
    if i >= 468 and i < n0: continue
    dy = y - yline(x)
    if dy <= 0: continue
    h = max(0.3, 1 - 0.55 * min(1, abs(x - mc[0]) / halfW) ** 1.5)
    w = ss(0, 0.35, dy / (chin[1] - mc[1])) * h
    if ring_of[i] >= 0: w *= [0.55, 0.15, 0, 0][ring_of[i]]
    op[i, 1] = D * w
# wide (+1 = ee, −1 = oo): lips and nearby cheeks move out or in
wd = np.zeros((NV, 2)); lips = set(UP_IN + LO_IN + UP_OUT + LO_OUT)
for i, (x, y) in enumerate(V):
    rel = (x - mc[0]) / (mw / 2)
    if i in lips: wd[i, 0] = 0.09 * mw * np.clip(rel, -1, 1)
    elif i < n0:
        d = np.hypot(x - mc[0], (y - mc[1]) * 1.4) / mw
        if d < 1.3: wd[i, 0] = 0.05 * mw * np.sign(rel) * (1 - d / 1.3) ** 2 * min(1, abs(rel))
# smile: corners up and out, cheeks lift
sm = np.zeros((NV, 2))
for i, (x, y) in enumerate(V):
    if i >= n0: continue
    rel = (x - mc[0]) / (mw / 2); d = np.hypot(abs(x - mc[0]) - mw / 2, y - mc[1]) / mw
    k = np.exp(-(d / 0.45) ** 2) * min(1, abs(rel)) ** 1.5
    if i in lips or d < 1.2: sm[i] = [0.06 * mw * np.sign(rel) * k, -0.07 * mw * k]
# blink: upper lids meet the lower lids, irises squash, the lid skin above follows a little
bl = np.zeros((NV, 2))
for eye, iris in ((reye, iris_r), (leye, iris_l)):
    P = L[eye]; i0, i1 = int(np.argmin(P[:, 0])), int(np.argmax(P[:, 0]))
    cA, cB = eye[i0], eye[i1]; k0, k1 = eye.index(cA), eye.index(cB)
    a = eye[k0:k1 + 1] if k0 < k1 else eye[k0:] + eye[:k1 + 1]; b = [e for e in eye if e not in a] + [cA, cB]
    up, lo = (a, b) if L[a][:, 1].mean() < L[b][:, 1].mean() else (b, a)
    lo_s = sorted(lo, key=lambda i: L[i, 0]); lx, ly = L[lo_s, 0], L[lo_s, 1]
    lid = lambda x: np.interp(x, lx, ly)
    eh = L[up][:, 1].min(); ec = L[eye].mean(0); ew = L[cB, 0] - L[cA, 0]; travel = lid(ec[0]) - eh
    for i in up:
        if i in (cA, cB): continue
        bl[i, 1] = (lid(L[i, 0]) - L[i, 1]) * 0.96
    for i in iris: bl[i, 1] = (lid(L[i, 0]) - L[i, 1]) * 0.96
    for i in lo:
        if i not in (cA, cB): bl[i, 1] = -0.08 * travel
    for i in range(n0):
        if i in eye or i in iris: continue
        x, y = L[i]; d = np.hypot((x - ec[0]) / (ew * 0.75), (y - ec[1]) / (ew * 0.55))
        if y < ec[1] and d < 1.6: bl[i, 1] = max(bl[i, 1], 0.3 * travel * (1 - d / 1.6) ** 1.5)
# brow raise
br = np.zeros((NV, 2)); brows = sorted(set().union(*[set(e) for e in fmm.FACEMESH_RIGHT_EYEBROW]) | set().union(*[set(e) for e in fmm.FACEMESH_LEFT_EYEBROW]))
A = 0.035 * faceH; eyes_set = set(reye) | set(leye) | set(iris_r) | set(iris_l); browY = L[brows][:, 1].mean()
for i, (x, y) in enumerate(V):
    if i in eyes_set or (i >= n0 and ring_of[i] > 0): continue
    d = np.min(np.hypot(*(L[brows] - [x, y]).T)) / faceH
    w = 1.0 if i in brows else np.exp(-(d / 0.09) ** 2) * (1 if y < browY else 0.55)
    if i >= n0: w *= 0.4
    br[i, 1] = -A * w
# head weight for nods and tilts: the whole head and hair, fading out down the neck and past the hair
hw = np.ones(NV)
for i, (x, y) in enumerate(V):
    k = ring_of[i]
    base = 1.0 if k < 0 else [1.0, 0.9, 0.25, 0.0][k]
    hw[i] = base * ss(chin[1] + 0.45 * faceH, chin[1] - 0.02 * faceH, y) if y > chin[1] - 0.02 * faceH else base
pivot = [float(chin[0]), float(chin[1] + 0.25 * faceH)]

r2 = lambda a: [round(float(v), 2) for v in a.ravel()]
tri_all = ring_t[::-1] + tris + fills + mouth_t     # outer rings first, face over them
J = {'w': W, 'h': H, 'img': data_url, 'src': r2(V), 'tris': [int(i) for t in tri_all for i in t],
     'shapes': {'open': r2(op), 'wide': r2(wd), 'smile': r2(sm), 'blink': r2(bl), 'brow': r2(br)},
     'head': [round(float(v), 3) for v in hw], 'mouth': {'up': UP_IN, 'lo': LO_IN, 'w': float(mw), 'c': [float(mc[0]), float(mc[1])]},
     'pivot': pivot, 'face': {'h': float(faceH), 'cx': float(c[0]), 'cy': float(c[1]), 'top': float(top[1]), 'chin': float(chin[1])}}
open(out, 'w').write(f'window.CHARS = window.CHARS || {{}}; CHARS[{json.dumps(name)}] = ' + json.dumps(J, separators=(',', ':')) + ';\n')
print('ok', out, 'verts', NV, 'tris', len(tri_all), 'mouth', len(mouth_t), 'faceH', round(faceH), 'mw', round(mw))
