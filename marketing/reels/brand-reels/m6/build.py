# m6 · «۵ سال بازار… تو یه آخر هفته؟»: the Higgsfield-Katana reel format (a laptop in a dark room playing kinetic
# type that does what the voice says, word by word) for BacktestLab, on the user's take (voice/t1.mp3, 55 s).
# The take's pauses are cut to at most MAXG s and it is sped up by ATEMPO (pitch kept); a beat is added after «خبر!»
# for the news candle and after «بک‌تست‌لبه» for the logo. Every word's time in the reel goes to data.json (w), and
# the screens are timed from those. Prices: gold.json (data.py) and the 5 July 2024 jobs-report minutes (nfp.json).
#   python3 ../transcribe.py voice/t1.mp3 voice/t1.words.json && python3 build.py && python3 ../mkpage_b.py m6 && python3 sound.py
import json, re, subprocess, wave
import numpy as np
r = lambda x: round(x, 3)
SR = 48000; LEAD, MAXG, ATEMPO, TAIL = 0.4, 0.26, 1.06, 2.0
w = json.load(open('voice/t1.words.json'))
EXTRA = {67: 0.55, 43: 0.3}            # extra pause after these words (index in t1.words.json), in take seconds

subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'voice/t1.mp3', '-af', 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2', '-ar', str(SR), '-ac', '1', 'voice/t1-clean.wav'], check=True)
wv = wave.open('voice/t1-clean.wav'); x = np.frombuffer(wv.readframes(wv.getnframes()), np.int16).astype(np.float32) / 32768; wv.close()
out = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-nostats', '-i', 'voice/t1-clean.wav', '-af', 'silencedetect=noise=-38dB:d=0.25', '-f', 'null', '-'], capture_output=True, text=True).stderr
sil = list(zip(map(float, re.findall(r'silence_start: ([0-9.]+)', out)), map(float, re.findall(r'silence_end: ([0-9.]+)', out))))
# cuts: the middle of each long pause; inserts: extra silence after the chosen words
edits = []                                       # (time in take, removed seconds (>0) or inserted seconds (<0))
for a, b in sil:
    if b - a > MAXG: edits.append(((a + b) / 2, (b - a) - MAXG))
for i, d in EXTRA.items(): edits.append((w[i][1] + 0.02, -d))
edits.sort()
pieces, pos, F = [], 0.0, int(0.006 * SR)
for t, d in edits:
    if d > 0:
        a, b = t - d / 2, t + d / 2; seg = x[int(pos * SR):int(a * SR)].copy(); pieces.append(seg); pos = b
    else:
        pieces.append(x[int(pos * SR):int(t * SR)].copy()); pieces.append(np.zeros(int(-d * SR), np.float32)); pos = t
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
json.dump({'w': W, 'words': [t for _, _, t in w], 'dur': DUR, 'lead': LEAD, 'gold': json.load(open('gold.json')), 'nfp': json.load(open('nfp.json')),
           'place': [], 'lens': [], 'lines': []}, open('data.json', 'w'), ensure_ascii=False)
print('reel', DUR, 's; voice', round(len(y) / SR / ATEMPO, 2), 's; cuts', sum(1 for _, d in edits if d > 0), 'removed', round(sum(d for _, d in edits if d > 0), 2), 's')
print('checks:', {i: W[i] for i in (0, 3, 42, 52, 67, 68, 98, 114)})
