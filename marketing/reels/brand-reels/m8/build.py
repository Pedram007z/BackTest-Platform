# m8 · «بالا یا پایین؟»: a play-along game on three real market moments, on the user's take (voice/t1.mp3, 74.6 s).
# The take's pauses are cut to at most MAXG s and it is sped up by ATEMPO (pitch kept) so the reel lands near 50 s;
# after each «بالا یا پایین؟» a beat is added for the countdown, so the viewer has time to answer before the reveal.
# Every word's time in the reel goes to data.json (w); the scenes are timed from it. Charts: charts.json (data.py).
#   python3 ../transcribe.py voice/t1.mp3 voice/t1.words.json && python3 data.py <store> && python3 build.py && python3 page.py && python3 sound.py
import json, re, subprocess, sys, wave
import numpy as np
r = lambda x: round(x, 3)
SR = 48000; LEAD, MAXG, ATEMPO, TAIL = 0.3, 0.08, float(sys.argv[1]) if len(sys.argv) > 1 else 1.35, 1.3
w = json.load(open('voice/t1.words.json'))
Q = [22, 46, 71]                                  # «پایین؟» of each «بالا یا پایین؟»
EXTRA = {22: 0.9, 46: 0.9, 71: 0.9, 36: 0.15, 62: 0.15, 88: 0.25, 117: 0.2}   # extra pause after these words (take seconds)
CUT = [(89, 90)]                                  # take words to drop, [from word, up to the next word): «خب،»

subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'voice/t1.mp3', '-af', 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2', '-ar', str(SR), '-ac', '1', 'voice/t1-clean.wav'], check=True)
wv = wave.open('voice/t1-clean.wav'); x = np.frombuffer(wv.readframes(wv.getnframes()), np.int16).astype(np.float32) / 32768; wv.close()
out = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-nostats', '-i', 'voice/t1-clean.wav', '-af', 'silencedetect=noise=-38dB:d=0.1', '-f', 'null', '-'], capture_output=True, text=True).stderr
sil = list(zip(map(float, re.findall(r'silence_start: ([0-9.]+)', out)), map(float, re.findall(r'silence_end: ([0-9.]+)', out))))
edits = []                                       # (time in take, removed seconds (>0) or inserted seconds (<0))
for a, b in sil:
    if b - a > MAXG: edits.append(((a + b) / 2, (b - a) - MAXG))
for i, d in EXTRA.items(): edits.append((w[i][1] + 0.03, -d))
for i, j in CUT:                                 # a word cut replaces the pause cuts it overlaps
    a, b = w[i][0] - 0.03, w[j][0] - 0.03; edits = [(t, d) for t, d in edits if d < 0 or t + d / 2 < a or t - d / 2 > b]; edits.append(((a + b) / 2, b - a))
edits.sort()
# an insert that falls inside a cut pause would split it oddly: drop cuts that contain an insert point
ins = [t for t, d in edits if d < 0]
edits = [(t, d) for t, d in edits if d < 0 or not any(t - d / 2 <= u <= t + d / 2 for u in ins)]
pieces, pos, F = [], 0.0, int(0.006 * SR)
for t, d in edits:
    if d > 0: a, b = t - d / 2, t + d / 2; pieces.append(x[int(pos * SR):int(a * SR)].copy()); pos = b
    else: pieces.append(x[int(pos * SR):int(t * SR)].copy()); pieces.append(np.zeros(int(-d * SR), np.float32)); pos = t
pieces.append(x[int(pos * SR):])
for p in pieces:                                 # 6 ms fades at every join
    if len(p) > 2 * F: p[:F] *= np.linspace(0, 1, F); p[-F:] *= np.linspace(1, 0, F)
y = np.concatenate(pieces)
wo = wave.open('voice/cut.wav', 'wb'); wo.setnchannels(1); wo.setsampwidth(2); wo.setframerate(SR); wo.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()); wo.close()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'voice/cut.wav', '-af', f'atempo={ATEMPO},adelay={int(LEAD * 1000)}', '-ar', str(SR), 'vo.wav'], check=True)

def remap(t):
    """A time in the take → its time in the reel."""
    s = t
    for et, d in edits:
        if d > 0 and et < t: s -= min(d, max(0, t - (et - d / 2)))
        if d < 0 and et <= t: s += -d
    return LEAD + s / ATEMPO
W = [[r(remap(a)), r(remap(b))] for a, b, _ in w]
for i in range(1, len(W)): W[i][0] = max(W[i][0], W[i - 1][0] + 0.02)
DUR = round(W[-1][1] + TAIL, 2)
# the countdowns: Whisper runs «پایین؟» into the next word, so find each inserted silence in vo.wav itself:
# hush = where the voice stops after the question, rev = where the answer starts
vw = wave.open('vo.wav'); v = np.frombuffer(vw.readframes(vw.getnframes()), np.int16).astype(np.float32) / 32768; vw.close()
hop = int(0.01 * SR); env = np.array([np.sqrt(np.mean(v[k * hop:(k + 1) * hop] ** 2)) for k in range(len(v) // hop)]); quiet = env < 0.012
hush, rev = [], []
for q in Q:
    k = int(W[q][0] / 0.01); best = None
    while k < int((W[q][1] + 2.5) / 0.01):
        if quiet[k]:
            j = k
            while j < len(quiet) and quiet[j]: j += 1
            if (j - k) * 0.01 >= 0.5: best = (k * 0.01, j * 0.01); break
            k = j
        k += 1
    hush.append(r(best[0])); rev.append(r(best[1]))
json.dump({'w': W, 'words': [t for _, _, t in w], 'dur': DUR, 'lead': LEAD, 'q': Q, 'hush': hush, 'rev': rev, 'charts': json.load(open('charts.json'))}, open('data.json', 'w'), ensure_ascii=False)
print('countdowns (voice stops, answer starts):', list(zip(hush, rev)))
print('reel', DUR, 's; voice', round(len(y) / SR / ATEMPO, 2), 's; cuts', sum(1 for _, d in edits if d > 0), 'removed', round(sum(d for _, d in edits if d > 0), 2), 's (take)')
print({i: W[i] for i in (0, 13, 22, 23, 37, 46, 47, 63, 71, 72, 89, 118, 140, 163, 170)})
