# p1, on the user's take (t1.mp3, 39.2 s): Whisper's word starts are snapped to the voice, pauses longer than MAXG are
# cut to MAXG, short beats are added where the picture needs them (the «ضرر» stamp, the logo, the trade reaching its
# target), and the take keeps its own pace (ATEMPO 1). Each scene starts on the word that names it, and every word's
# reel time goes to ../data.json for the karaoke captions.   python3 ../../transcribe.py t1.mp3 t1.words.json && python3 build.py
import json, re, subprocess, wave, os
import numpy as np
os.chdir(os.path.dirname(os.path.abspath(__file__)))
r = lambda x: round(x, 3)
SR, LEAD, MAXG, ATEMPO, TAIL = 48000, 0.08, 0.22, 1.0, 2.3
w = json.load(open('t1.words.json'))
EXTRA = {7: 0.15, 19: 0.3, 28: 0.15, 40: 0.2, 43: 0.45, 55: 0.15, 66: 0.95, 81: 0.15, 87: 0.15}   # beats after these words (s)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 't1.mp3', '-af', 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2',
                '-ar', str(SR), '-ac', '1', 't1-clean.wav'], check=True)
wv = wave.open('t1-clean.wav'); x = np.frombuffer(wv.readframes(wv.getnframes()), np.int16).astype(np.float32) / 32768; wv.close()
out = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-nostats', '-i', 't1-clean.wav', '-af', 'silencedetect=noise=-38dB:d=0.1', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
sil = list(zip(map(float, re.findall(r'silence_start: ([0-9.]+)', out)), map(float, re.findall(r'silence_end: ([0-9.]+)', out))))
for wd in w:                                              # Whisper often starts a word inside the pause before it
    for a, b in sil:
        if a - 0.02 <= wd[0] < b < wd[1]: wd[0] = b
        if a < wd[1] <= b + 0.02 and a > wd[0]: wd[1] = a
edits = [((a + b) / 2, (b - a) - MAXG) for a, b in sil if b - a > MAXG and a > 0.05]
for i, d in EXTRA.items():
    t = min(w[i][1] + 0.02, w[i + 1][0]) if i + 1 < len(w) else w[i][1] + 0.02
    for a, b in sil:
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
af = f'adelay={int(LEAD * 1000)}' if ATEMPO == 1 else f'atempo={ATEMPO},adelay={int(LEAD * 1000)}'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'cut.wav', '-af', af, '-ar', str(SR), 'vo.wav'], check=True)
def remap(t):
    s = t
    for et, d in edits:
        if d > 0 and et < t: s -= min(d, max(0, t - (et - d / 2)))
        if d < 0 and et <= t: s += -d
    return LEAD + s / ATEMPO
Wd = [[r(remap(a)), r(remap(b))] for a, b, _ in w]
for i in range(1, len(Wd)): Wd[i][0] = max(Wd[i][0], Wd[i - 1][0] + 0.02)
ws = lambda i: Wd[i][0]
# scenes: each on the first word of its line (indices in t1.words.json)
T = dict(hook=0.0, crash=ws(5) - 0.05, weeks=ws(8) - 0.05, ind=ws(13) - 0.05, loss=ws(19) - 0.03, test=ws(20) - 0.05, notest=ws(24) - 0.05,
         feel=ws(29) - 0.05, num=ws(36) - 0.05, brand=ws(41) - 0.05, replay=ws(44) - 0.05, pos=ws(56) - 0.05, sl=ws(59) - 0.03, tp=ws(62) - 0.03,
         norisk=ws(65) - 0.05, journal=ws(67) - 0.05, make=ws(74) - 0.05, burn=ws(78) - 0.05, years=ws(82) - 0.05, hours=ws(85) - 0.05,
         end=ws(88) - 0.05, link=ws(90) - 0.05)
T['hit'] = r(T['journal'] - 0.55)                         # the trade reaches its target in the beat after «بدون ریسک»
T['dur'] = r(Wd[-1][1] + TAIL)
T = {k: r(v) for k, v in T.items()}
order = sorted(T, key=T.get)
json.dump({'T': T, 'w': Wd, 'dur': T['dur']}, open('timing.json', 'w'))
print('reel', T['dur'], 's; voice', round(len(y) / SR / ATEMPO, 2), 's')
print('  '.join(f'{k} {T[k]:.2f}' for k in order))
