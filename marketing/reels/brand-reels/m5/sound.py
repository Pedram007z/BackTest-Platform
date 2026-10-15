# m5's sound: an original track from ../../reelkit/soundgen.py (A minor; a dark bed under the hook and the crowd,
# the pulse from the backtest on, a lift for the link) ducked under the voice, with effects on the picture's moments:
# a clock before the stop, the hit, the target reached without you, the rewind, the crowd and the swarm appearing,
# the sweep that takes every stop, the stop line sliding and the size halving, A's loss and B's target in the replay,
# the paper plane, the magnifier, «استاپ!», and a bell on «۷ روز رایگان».
#   python3 sound.py  → mix.wav (−14 LUFS, true peak −1.5 dB)
import json, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt

D = json.load(open('data.json')); T = D['t']; DUR = D['dur']; SR = 48000; N = int(DUR * SR); M1 = D['m1']; TR = D['trade']

# the replay times, as scenes.js computes them (pathAt, hookF, btF)
def ein(x): return x ** 3
def eio(x): return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
def sine(x): return 0.5 - 0.5 * np.cos(np.pi * x)
P = lambda t, a, d: min(1, max(0, (t - a) / d))
def path(b, u, wick):
    _, o, h, l, c = b; pts = [[0, o], [0.45, l], [1, c]] if wick else ([[0, o], [0.3, l], [0.7, h], [1, c]] if c >= o else [[0, o], [0.3, h], [0.7, l], [1, c]])
    for (u0, v0), (u1, v1) in zip(pts, pts[1:]):
        if u <= u1: return v0 + (v1 - v0) * sine(min(1, max(0, (u - u0) / (u1 - u0))))
    return c
price = lambda f: path(M1[int(f)], f - int(f), int(f) == 30)
def hookF(l):
    if l < 0.62: return 29 + 0.99 * P(l, 0, 0.62)
    if l < T['hit'] + 0.05: return 30 + 0.45 * ein(P(l, 0.62, T['hit'] + 0.05 - 0.62)) ** 0.7
    if l < T['back']: return 30.45 + 0.02 * P(l, T['hit'], T['back'] - T['hit'])
    if l < T['back'] + 0.6: return 30.47 + 0.53 * eio(P(l, T['back'], 0.6))
    if l < 3.3: return 31 + 0.999 * P(l, T['back'] + 0.6, 3.3 - T['back'] - 0.6)
    if l < 4.05: return 32 + 0.999 * eio(P(l, 3.3, 0.75))
    return 33 + 4 * P(l, 4.05, 0.65)
def btF(t):
    l = t - T['run']
    if l < 0: return 29.6
    if l < 0.35: return 30 + 0.45 * ein(P(l, 0, 0.35)) ** 0.7
    if l < 0.55: return 30.45
    if l < 0.85: return 30.45 + 0.55 * eio(P(l, 0.55, 0.3))
    if l < 1.15: return 31 + 0.999 * P(l, 0.85, 0.3)
    return 32 + 0.999 * eio(P(l, 1.15, 0.35)) + 3 * P(l, 1.5, 0.9)
first = lambda fn, t0, t1, cond: next((t for t in np.arange(t0, t1, 0.005) if cond(price(fn(t)))), t0)
HIT = first(hookF, 0, 3, lambda p: p <= TR['a']['sl']); TPHIT = first(hookF, HIT, 5, lambda p: p >= TR['tp'])
BHIT = first(btF, T['run'], T['run'] + 2, lambda p: p <= TR['a']['sl']); BTP = first(btF, BHIT, T['run'] + 3, lambda p: p >= TR['tp'])
print('hit', round(HIT, 2), 'tp', round(TPHIT, 2), 'bt hit', round(BHIT, 2), 'bt tp', round(BTP, 2))

spec = {
    'seed': 53, 'dur': DUR, 'grid0': T['bt'] % 2.0, 'bar': 2.0, 'fade_from': DUR - 0.9,
    'chords': {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[220.0, 261.63, 349.23, 440.0], 43.65],
               'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]},
    'prog': ['Am', 'F', 'C', 'G'],
    'groove': [[T['bt'], T['share']], [T['cta'], DUR]], 'full': [], 'clap': [[T['cta'] + 1.2, DUR]], 'dark': [[0, T['bt']]],
    'arp': [[T['zone'], DUR]], 'hats': [[T['bt'], DUR]], 'outro_bass': [T['cta'], DUR], 'rolls': [[T['sweep'] - 0.9, T['sweep'] + 0.15]],
    'fx': [{'type': 'impact', 't': HIT - 0.02, 'size': 1.3, 'gain': 0.8},
           {'type': 'riser', 't': T['back'], 'd': TPHIT - T['back'], 'gain': 0.3},
           {'type': 'downlifter', 't': T['fam'], 'd': 0.8, 'gain': 0.45},
           {'type': 'whoosh', 't': T['zone'], 'gain': 0.3},
           {'type': 'impact', 't': T['sweep'] + 0.18, 'size': 1.0, 'gain': 0.6},
           {'type': 'whoosh', 't': T['bt'], 'gain': 0.3},
           {'type': 'impact', 't': BHIT - 0.02, 'size': 0.8, 'gain': 0.5},
           {'type': 'whoosh', 't': T['share'] + 1.0, 'gain': 0.45},
           {'type': 'whoosh', 't': T['cta'], 'gain': 0.3},
           {'type': 'bell', 't': T['free'], 'f': 880.0, 'gain': 0.28}, {'type': 'bell', 't': T['free'] + 0.15, 'f': 1318.5, 'gain': 0.2}],
}
json.dump(spec, open('sound.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'sound.json', 'music.wav'], check=True)
rd = lambda p: (lambda w: np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, w.getnchannels()) / 32768.0)(wave.open(p))
mus = rd('music.wav'); vo = rd('vo.wav')[:, 0]
out = np.zeros((N, 2)); n = min(N, len(mus)); out[:n] = mus[:n]
tl = np.arange(N) / SR
out *= np.interp(tl, [0, T['bt'], T['bt'] + 0.3, T['cta'], DUR], [0.9, 0.9, 1.0, 1.0, 1.1])[:, None]

rng = np.random.default_rng(17)
bp = lambda x, lo, hi: sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def put(t0, sig, gain_db, pan=0.0):
    i = int(t0 * SR); s = sig * 10 ** (gain_db / 20)
    if s.ndim == 1: s = np.stack([s * np.sqrt(1 - pan), s * np.sqrt(1 + pan)], 1)
    m = min(len(s), N - i)
    if m > 0 and i >= 0: out[i:i + m] += s[:m]
def env(n, a, r): x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / r)
def tick(f=2600, d=0.03):
    n = int(d * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * x) * 0.5 + bp(rng.standard_normal(n), 2000, 8000) * 0.6) * env(n, 0.0005, 0.006)
def pop(f0=900, d=0.09):
    n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * (f0 + 900 * np.exp(-x * 60)) * x) * env(n, 0.001, 0.02)
def chime(fs, d=1.1):
    n = int(d * SR); x = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * x) * np.exp(-x * 4) * 0.5 + np.sin(4 * np.pi * f * x) * np.exp(-x * 7) * 0.15 for f in fs) * env(n, 0.002, 10)
def buzz(d=0.35):
    n = int(d * SR); x = np.arange(n) / SR; return np.sign(np.sin(2 * np.pi * 110 * x)) * 0.4 * np.exp(-x * 7) * np.minimum(1, x / 0.004)
def slide(f0, f1, d=0.5):
    n = int(d * SR); x = np.arange(n) / SR; f = f0 + (f1 - f0) * (x / d); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.sin(np.pi * x / d) ** 2 * 0.6
def thud(f=70, d=0.3):
    n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * f * x * (1 - 0.3 * x / d)) * env(n, 0.003, 0.07) + bp(rng.standard_normal(n), 300, 2500) * env(n, 0.001, 0.012) * 0.6

# a clock while the trade sits there, then the hit (a buzz under the impact)
for k, t in enumerate(np.arange(0.12, HIT - 0.1, 0.33)): put(t, tick(2600 if k % 2 == 0 else 2100), -22, 0.3 * (-1) ** k)
put(HIT, buzz(), -20)
put(TPHIT, chime([1318.5, 1975.5]), -22, -0.2)        # the target, reached without you: quiet
# the crowd and the swarm appearing, then the sweep taking them
for k in range(40): put(T['crowd'] + 0.15 + k * 0.025, pop(700 + 400 * rng.random()), -32, rng.uniform(-0.6, 0.6))
for k in range(70): put(T['all'] - 0.05 + k * 0.022, pop(650 + 350 * rng.random()), -34, rng.uniform(-0.6, 0.6))
for k in range(22): put(T['sweep'] + 0.05 + rng.random() * 0.3, pop(1200 + 600 * rng.random(), 0.06), -27, rng.uniform(-0.7, 0.7))
for t0 in (T['low'], T['round']): put(t0, tick(1800, 0.05), -20)
# the backtest: B's stop slides down, its size halves, then the replay: A out, B to target
put(T['far'] + 0.1, slide(900, 420, 0.7), -26); put(T['size'] + 0.1, slide(700, 520, 0.5), -27)
put(T['run'], tick(3000, 0.04), -18)
put(BHIT, buzz(0.3), -22)
put(BTP, chime([1318.5, 1661.2, 1975.5]), -13)
# the share: a tap, the magnifier, «استاپ!»
put(T['share'] + 0.3, tick(2000, 0.04), -18); put(T['pip'] + 0.05, chime([2637.0], 0.5), -24)
stop_t = next((w[1] for w in D['say']['share2'] if w[0].startswith('استاپ')), T['pip'] + 1.5)
put(stop_t, thud(), -12)

# duck everything under the voice, then add the voice
v = np.zeros(N); m = min(N, len(vo)); v[:m] = vo[:m]
envv = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (envv > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); duck = 1 - 0.55 * np.clip(act, 0, 1)
out *= duck[:, None]
out /= np.abs(out).max() + 1e-9; out *= 0.34
vpk = np.abs(v).max(); out += np.stack([v, v], 1) / vpk * 0.85
out = np.tanh(out * 1.2) / np.tanh(1.2)
pcm = (np.clip(out * 0.97, -1, 1) * 32767).astype('<i2')
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
mm = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(mm[mm.rindex('{'):mm.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
