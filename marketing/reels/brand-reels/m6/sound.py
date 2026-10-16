# m6's sound: an original track from ../../reelkit/soundgen.py (A minor, 120 BPM): a dark bed under the opening,
# the groove from «۵ سال», cut to a held breath on «و حالا…» and slammed back on «خبر!», quiet under «فکر کن…»,
# back for «این‌جا؟ تاریخ. پلی. ترید. آمار.» and the end. On top, a hit on every word the screen slams, the crash,
# the strike-through, the logo, the play click, the speed-ups, the news candle, the target's chime, the calendar
# pages, the typing and the send, and a bell on «رایگان». The voice (vo.wav from build.py) is ducked over all of it.
#   python3 sound.py  → mix.wav (−14 LUFS, true peak −1.5 dB)
import json, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt

D = json.load(open('data.json')); Wt = D['w']; DUR = D['dur']; SR = 48000; N = int(DUR * SR); NF = D['nfp']
ws = lambda i: Wt[i][0]
# when the replay reaches the target (as scenes.js: the fast-forward after «خبر!»)
eio = lambda x: 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
P = lambda t, a, d: min(1, max(0, (t - a) / d))
NB, NI = NF['bars'], NF['news']
f_at = lambda t: NI + 1 + (len(NB) - NI - 1.001) * eio(P(t, ws(67) + 0.6, ws(68) + 0.75 - ws(67) - 0.6))
TPT = next((t for t in np.arange(ws(67) + 0.6, ws(70), 0.005) if int(f_at(t)) >= NF['tp_i']), ws(68) + 0.5)
print('target at', round(TPT, 2))

spec = {
    'seed': 61, 'dur': DUR, 'grid0': ws(3) % 2.0, 'bar': 2.0, 'fade_from': DUR - 1.0,
    'chords': {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[220.0, 261.63, 349.23, 440.0], 43.65],
               'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]},
    'prog': ['Am', 'F', 'C', 'G'],
    'groove': [[ws(3), ws(65)], [ws(67), ws(70)], [ws(85), DUR]], 'full': [[ws(67), ws(70)], [ws(112), DUR]],
    'clap': [[ws(52), ws(65)], [ws(85), DUR]], 'dark': [[0, ws(3)], [ws(70), ws(85)]],
    'arp': [[ws(3), ws(65)], [ws(85), DUR]], 'hats': [[ws(11), ws(65)], [ws(67), ws(70)], [ws(85), DUR]], 'outro_bass': [ws(112), DUR],
    'rolls': [[ws(42) - 0.9, ws(42) - 0.02], [ws(66), ws(67) - 0.02]],
    'fx': [{'type': 'riser', 't': 0.0, 'd': ws(0), 'gain': 0.5},
           {'type': 'impact', 't': ws(0), 'size': 1.3, 'gain': 0.85}, {'type': 'impact', 't': ws(2), 'size': 0.8, 'gain': 0.5},
           {'type': 'impact', 't': ws(3), 'size': 1.1, 'gain': 0.65}, {'type': 'whoosh', 't': ws(5) - 0.1, 'gain': 0.4},
           {'type': 'whoosh', 't': ws(7) - 0.1, 'gain': 0.35}, {'type': 'impact', 't': ws(11), 'size': 0.7, 'gain': 0.45},
           {'type': 'impact', 't': ws(18) + 0.05, 'size': 1.2, 'gain': 0.7}, {'type': 'impact', 't': ws(29), 'size': 0.9, 'gain': 0.55},
           {'type': 'riser', 't': ws(41) - 0.2, 'd': ws(42) - ws(41) + 0.2, 'gain': 0.45}, {'type': 'impact', 't': ws(42), 'size': 1.2, 'gain': 0.7},
           {'type': 'bell', 't': ws(42) + 0.05, 'f': 880.0, 'gain': 0.25}, {'type': 'bell', 't': ws(42) + 0.2, 'f': 1318.5, 'gain': 0.18},
           {'type': 'riser', 't': ws(58) - 0.1, 'd': ws(60) - ws(58) + 0.1, 'gain': 0.4},
           {'type': 'riser', 't': ws(65), 'd': ws(67) - ws(65), 'gain': 0.5}, {'type': 'impact', 't': ws(67), 'size': 1.4, 'gain': 0.9},
           {'type': 'whoosh', 't': ws(68) - 0.1, 'gain': 0.45}, {'type': 'downlifter', 't': ws(82), 'd': 1.2, 'gain': 0.45},
           {'type': 'impact', 't': ws(85), 'size': 0.8, 'gain': 0.5}, {'type': 'whoosh', 't': ws(98) - 0.1, 'gain': 0.35},
           {'type': 'impact', 't': ws(112), 'size': 0.9, 'gain': 0.5},
           {'type': 'bell', 't': ws(112) + 0.1, 'f': 880.0, 'gain': 0.28}, {'type': 'bell', 't': ws(112) + 0.25, 'f': 1318.5, 'gain': 0.2}],
}
json.dump(spec, open('sound.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'sound.json', 'music.wav'], check=True)
rd = lambda p: (lambda w: np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, w.getnchannels()) / 32768.0)(wave.open(p))
mus = rd('music.wav'); vo = rd('vo.wav')[:, 0]
out = np.zeros((N, 2)); n = min(N, len(mus)); out[:n] = mus[:n]
tl = np.arange(N) / SR
# the held breath before the news, and the quiet stretch under «فکر کن…»
lev = np.interp(tl, [0, ws(65), ws(65) + 0.15, ws(67) - 0.02, ws(67), ws(70) - 0.2, ws(70) + 0.3, ws(85) - 0.1, ws(85), DUR],
                [1.0, 1.0, 0.25, 0.25, 1.2, 1.2, 0.7, 0.7, 1.0, 1.05])
out *= lev[:, None]

rng = np.random.default_rng(23)
bp = lambda x, lo, hi: sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def put(t0, sig, gain_db, pan=0.0):
    i = int(t0 * SR); s = sig * 10 ** (gain_db / 20)
    if s.ndim == 1: s = np.stack([s * np.sqrt(1 - pan), s * np.sqrt(1 + pan)], 1)
    m = min(len(s), N - i)
    if m > 0 and i >= 0: out[i:i + m] += s[:m]
def env(n, a, r): x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / r)
def click(f0=1800, d=0.03):
    n = int(d * SR); return bp(rng.standard_normal(n), f0, min(f0 * 4, 20000)) * env(n, 0.0005, d / 4)
def thump(f=60, d=0.25):
    n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * f * x * (1 - 0.35 * x / d)) * env(n, 0.002, 0.07)
def pop(f0=900, d=0.09):
    n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * (f0 + 900 * np.exp(-x * 60)) * x) * env(n, 0.001, 0.02)
def chime(fs, d=1.1):
    n = int(d * SR); x = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * x) * np.exp(-x * 4) * 0.5 + np.sin(4 * np.pi * f * x) * np.exp(-x * 7) * 0.15 for f in fs) * env(n, 0.002, 10)
def buzz(d=0.35):
    n = int(d * SR); x = np.arange(n) / SR; return np.sign(np.sin(2 * np.pi * 110 * x)) * 0.4 * np.exp(-x * 7) * np.minimum(1, x / 0.004)
def scratch(d=0.25):
    n = int(d * SR); x = np.linspace(0, 1, n); return bp(rng.standard_normal(n), 900, 5000) * np.sin(np.pi * x) * 0.8
def flip(d=0.12):
    n = int(d * SR); x = np.linspace(0, 1, n); return bp(rng.standard_normal(n), 1200, 7000) * np.sin(np.pi * x) ** 1.5

# a thump under every slammed word
for i in (1, 12, 14, 16, 18, 19, 21, 22, 24, 26, 28, 30, 31, 32, 33, 34, 36, 41, 70, 75, 76, 79, 80, 86, 87, 88, 89, 90, 92, 93, 94, 95, 96, 97, 98, 99, 100):
    put(ws(i), thump(55 + (i % 4) * 6), -17)
# candle by candle; the news chips
for k in range(18): put(ws(12) + (ws(15) - ws(12)) * k / 18, click(2400, 0.02), -28, 0.3 * (-1) ** k)
for t0 in (ws(15) + 0.15, ws(16) + 0.1): put(t0, pop(1000), -22, 0.2)
put(ws(18) + 0.05, buzz(), -20)
put(ws(33), scratch(), -16)                                # the strike-through
for k in range(7): put(ws(36) + k * 0.04, pop(700 + 60 * k, 0.06), -28, -0.5 + k / 6)
# typing the date, the news row, the play click, the replay's candles and the three trade levels
typed_t = [ws(45) + (Wt[47][1] - ws(45)) * k / 10 for k in range(10)]
for k, t0 in enumerate(typed_t): put(t0, click(2600, 0.025), -22, 0.2 * (-1) ** k)
put(ws(48), pop(800), -20); put(ws(52), click(1500, 0.05), -12); put(ws(52) + 0.02, thump(70, 0.2), -14)
for k in range(30): put(ws(52) + 0.2 + (ws(60) - ws(52) - 0.25) * (k / 30) ** 0.6, click(3000, 0.015), -30, 0.4 * (-1) ** k)
for i in (60, 61, 63): put(ws(i), pop(1200 if i != 61 else 600), -16)
# the news candle: a buzz on the drop, the chime when the target is reached
put(ws(67) + 0.1, buzz(0.4), -18); put(TPT, chime([1318.5, 1661.2, 1975.5]), -11)
# a year of calendar pages, the loss
for k in range(12): put(ws(79) + (ws(82) - ws(79)) * k / 12, flip(), -22, -0.3)
put(ws(83), buzz(0.45), -20)
# the comment: typing «بک‌تست», sending, the link arriving
for k in range(6): put(ws(103) - 0.05 + k * 0.066, click(2600, 0.025), -21, 0.2 * (-1) ** k)
put(ws(105), pop(1100), -16); put(ws(108), chime([1568.0, 2093.0], 0.6), -20)

# duck everything under the voice, then add the voice
v = np.zeros(N); m = min(N, len(vo)); v[:m] = vo[:m]
envv = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (envv > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); duck = 1 - 0.5 * np.clip(act, 0, 1)
out *= duck[:, None]
out /= np.abs(out).max() + 1e-9; out *= 0.36
vpk = np.abs(v).max(); out += np.stack([v, v], 1) / vpk * 0.85
out = np.tanh(out * 1.2) / np.tanh(1.2)
pcm = (np.clip(out * 0.97, -1, 1) * 32767).astype('<i2')
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
mm = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(mm[mm.rindex('{'):mm.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
