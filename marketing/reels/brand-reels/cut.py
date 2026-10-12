# Split a voice-over take into its script lines.
# usage: python3 cut.py <dir> <take> [atempo] [tight]  (tight: pauses inside a line over 0.25 s become 0.16 s instead of 0.35 → 0.25)
# Aligns the script (lines.json) to the whisper words (<take>.words.json) character by character,
# then cuts each boundary at the real silence nearest the transcript gap.
import json, re, subprocess, sys
d, take = sys.argv[1], sys.argv[2]; tempo = float(sys.argv[3]) if len(sys.argv) > 3 else 1.06
sd, ss = (0.25, 0.16) if len(sys.argv) > 4 and sys.argv[4] == 'tight' else (0.35, 0.25)
lines = json.load(open(f'{d}/lines.json')); words = json.load(open(f'{d}/{take}.words.json'))
def norm(s):
    s = re.sub(r'\[[^\]]*\]', '', s)
    s = re.sub(r'[ً-ْ‌‍.،,؟?!…:«»\-—]', '', s)
    for a, b in [('ي','ی'),('ك','ک'),('ة','ه'),('أ','ا'),('إ','ا'),('آ','ا'),('ؤ','و'),('ئ','ی'),('ٔ','')]: s = s.replace(a, b)
    return re.sub(r'\s+', '', s)
sc, sline = '', []
for k, (v, _) in enumerate(lines):
    n = norm(v); sc += n; sline += [k] * len(n)
wc, wpos = '', []
for i, (_, _, w) in enumerate(words):
    n = norm(w); wc += n; wpos += [i] * len(n)
# Needleman-Wunsch on characters (match 2, mismatch -1, gap -1)
import numpy as np
A, Bs = sc, wc; n, m = len(A), len(Bs)
S = np.zeros((n + 1, m + 1), dtype=np.int32); S[:, 0] = -np.arange(n + 1); S[0, :] = -np.arange(m + 1)
T = np.zeros((n + 1, m + 1), dtype=np.int8)
b_arr = np.frombuffer(Bs.encode('utf-32-le'), dtype=np.uint32)
for i in range(1, n + 1):
    a = ord(A[i - 1]); match = np.where(b_arr == a, 2, -1)
    diag = S[i - 1, :-1] + match; up = S[i - 1, 1:] - 1
    best = np.maximum(diag, up); tb = np.where(diag >= up, 0, 1).astype(np.int8)
    row = S[i]; trow = T[i]
    for j in range(1, m + 1):
        l = row[j - 1] - 1
        if best[j - 1] >= l: row[j] = best[j - 1]; trow[j] = tb[j - 1]
        else: row[j] = l; trow[j] = 2
i, j = n, m; amap = [None] * n
while i > 0 and j > 0:
    t = T[i, j]
    if t == 0: amap[i - 1] = j - 1; i -= 1; j -= 1
    elif t == 1: i -= 1
    else: j -= 1
# first and last whisper word of each line
first, last = {}, {}
for ci, wj in enumerate(amap):
    if wj is None: continue
    k = sline[ci]; wi = wpos[wj]
    first.setdefault(k, wi); last[k] = wi
for k in range(len(lines)):
    print(k + 1, f'{words[first[k]][0]:.2f}-{words[last[k]][1]:.2f}', ' '.join(w[2] for w in words[first[k]:last[k] + 1]))
wav = f'{d}/{take}-48k.wav'
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', f'{d}/{take}.mp3', '-ac', '1', '-ar', '48000', wav], check=True)
out = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-nostats', '-i', wav, '-af', 'silencedetect=noise=-38dB:d=0.12', '-f', 'null', '-'], capture_output=True, text=True).stderr
sil = list(zip([float(x) for x in re.findall(r'silence_start: ([0-9.]+)', out)], [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', out)]))
cuts = []
for k in range(len(lines) - 1):
    e, s = words[last[k]][1], words[first[k + 1]][0]
    lo, hi = min(e, s) - 0.5, max(e, s) + 0.5
    cand = [x for x in sil if x[1] > lo and x[0] < hi]
    if cand: c = max(cand, key=lambda x: x[1] - x[0])
    else: c = ((e + s) / 2 - 0.02, (e + s) / 2 + 0.02); print('  no silence at boundary', k + 1)
    cuts.append(c); print(f'  cut {k+1}|{k+2}: words {e:.2f}/{s:.2f} silence {c[0]:.2f}-{c[1]:.2f}')
lens = []
for k in range(len(lines)):
    a = 0.0 if k == 0 else cuts[k - 1][1] - 0.09
    b = cuts[k][0] + 0.18 if k < len(lines) - 1 else words[last[k]][1] + 0.35
    o = f'{d}/line{k + 1:02d}.wav'
    af = (f'silenceremove=stop_periods=-1:stop_duration={sd}:stop_threshold=-42dB:stop_silence={ss},atempo={tempo},'
          'areverse,silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=0.04,areverse,silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=0.02')
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', f'{a:.3f}', '-to', f'{b:.3f}', '-i', wav, '-af', af, o], check=True)
    lens.append(round(float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', o], capture_output=True, text=True).stdout), 3))
json.dump(lens, open(f'{d}/lens.json', 'w')); print(lens, round(sum(lens), 1))
