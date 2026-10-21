# i1, voiced: the user's take (t1.mp3, 71.6 s) on the same scenes. Pauses longer than MAXG are cut to MAXG, a few beats
# are added where the picture needs time (the +2R and −1R results, the losing chart building, the logo), and the take
# is sped up by ATEMPO (pitch kept). Every scene starts on the word that names it; the timeline goes to data.json with
# the charts from ../data.json.
#   python3 ../../transcribe.py t1.mp3 t1.words.json && python3 build.py   (then, from i1/: page.py voice, sound.py voice,
#   REEL_DIR=voice node render.cjs video voice/reel-hq.mp4 voice/mix.wav 4, REEL_DIR=voice node render.cjs cover voice/cover.png)
import json, re, subprocess, wave, os
import numpy as np
os.chdir(os.path.dirname(os.path.abspath(__file__)))
r = lambda x: round(x, 3)
SR, LEAD, MAXG, ATEMPO, TAIL = 48000, 0.12, 0.12, 1.3, 1.7
w = json.load(open('t1.words.json'))
EXTRA = {9: 0.1, 29: 0.2, 61: 1.2, 66: 1.3, 68: 1.3, 75: 0.1, 87: 0.9, 159: 0.15}   # beats added after these words (take s)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 't1.mp3', '-af', 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2',
                '-ar', str(SR), '-ac', '1', 't1-clean.wav'], check=True)
wv = wave.open('t1-clean.wav'); x = np.frombuffer(wv.readframes(wv.getnframes()), np.int16).astype(np.float32) / 32768; wv.close()
out = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-nostats', '-i', 't1-clean.wav', '-af', 'silencedetect=noise=-38dB:d=0.1', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
sil = list(zip(map(float, re.findall(r'silence_start: ([0-9.]+)', out)), map(float, re.findall(r'silence_end: ([0-9.]+)', out))))
# Whisper often starts a word inside the pause before it (or ends it inside the pause after): snap to the voice
for wd in w:
    for a, b in sil:
        if a - 0.02 <= wd[0] < b < wd[1]: wd[0] = b
        if a < wd[1] <= b + 0.02 and a > wd[0]: wd[1] = a
edits = [((a + b) / 2, (b - a) - MAXG) for a, b in sil if b - a > MAXG and a > 0.05]          # (time, removed s); <0 inserts
for i, d in EXTRA.items():
    t = min(w[i][1] + 0.02, w[i + 1][0])                   # never after the next word's start
    for a, b in sil:                                       # an insert goes inside the pause after the word, if there is one
        if a - 0.15 <= t <= b: t = a + 0.04; break
    edits.append((t, -d))
edits.sort()
ins = [t for t, d in edits if d < 0]
edits = [(t, d) for t, d in edits if d < 0 or not any(t - d / 2 <= u <= t + d / 2 for u in ins)]
pieces, pos, F = [], 0.0, int(0.006 * SR)
for t, d in edits:
    if d > 0: a, b = t - d / 2, t + d / 2; pieces.append(x[int(pos * SR):int(a * SR)].copy()); pos = b
    else: pieces.append(x[int(pos * SR):int(t * SR)].copy()); pieces.append(np.zeros(int(-d * SR), np.float32)); pos = t
pieces.append(x[int(pos * SR):])
for p in pieces:
    if len(p) > 2 * F: p[:F] *= np.linspace(0, 1, F); p[-F:] *= np.linspace(1, 0, F)
y = np.concatenate(pieces)
wo = wave.open('cut.wav', 'wb'); wo.setnchannels(1); wo.setsampwidth(2); wo.setframerate(SR); wo.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()); wo.close()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'cut.wav', '-af', f'atempo={ATEMPO},adelay={int(LEAD * 1000)}', '-ar', str(SR), 'vo.wav'], check=True)
def remap(t):
    s = t
    for et, d in edits:
        if d > 0 and et < t: s -= min(d, max(0, t - (et - d / 2)))
        if d < 0 and et <= t: s += -d
    return LEAD + s / ATEMPO
Wd = [[r(remap(a)), r(remap(b))] for a, b, _ in w]
for i in range(1, len(Wd)): Wd[i][0] = max(Wd[i][0], Wd[i - 1][0] + 0.02)
ws = lambda i: Wd[i][0]
# the scenes, each on its word (indices in t1.words.json)
T = dict(hook=0.0, q1=ws(10) - 0.05, q2=ws(15) - 0.05, guess=ws(20) - 0.05, dunno=ws(27) - 0.03, chart=ws(30) - 0.1, liq=ws(40) - 0.05,
         sweep=ws(44) - 0.05, fvg=ws(46) - 0.05, entry=ws(52) - 0.05, tp=ws(61) - 0.02, loss=ws(62) - 0.1, sl=ws(68) - 0.02, proof=ws(69) - 0.05,
         grid=ws(76) - 0.05, brand=ws(85) - 0.05, f1=ws(88) - 0.05, f2=ws(100) - 0.05, f3=ws(109) - 0.05, f4=ws(124) - 0.05, f5=ws(134) - 0.05,
         cta=ws(154) - 0.05, end=ws(160) - 0.05)
T['run'] = max(T['entry'] + 1.0, T['tp'] - 1.3)
T['lbuild'] = T['loss'] + 0.65; T['lrun'] = max(T['lbuild'] + 1.1, T['sl'] - 1.0)
T['dur'] = round(Wd[-1][1] + TAIL, 2)
T = {k: r(v) for k, v in T.items()}
order = ['hook', 'q1', 'q2', 'guess', 'dunno', 'chart', 'liq', 'sweep', 'fvg', 'entry', 'run', 'tp', 'loss', 'lbuild', 'lrun', 'sl', 'proof', 'grid', 'brand',
         'f1', 'f2', 'f3', 'f4', 'f5', 'cta', 'end', 'dur']
for a, b in zip(order, order[1:]): assert T[a] < T[b], (a, T[a], b, T[b])
base = json.load(open('../data.json'))
json.dump({'T': T, 'dur': T['dur'], 'charts': base['charts'], 'voiced': True, 'w': Wd}, open('data.json', 'w'), ensure_ascii=False)
print('reel', T['dur'], 's; voice', round(len(y) / SR / ATEMPO, 2), 's after', sum(1 for _, d in edits if d > 0), 'cuts')
for a, b in zip(order, order[1:]): print(f'{a:7s} {T[a]:6.2f}  ({T[b] - T[a]:.2f} s)')
