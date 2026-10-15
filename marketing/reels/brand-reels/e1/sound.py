# e1's sound: the user's voice-over (with its own music) on top, and under it rain on the window, room tone, the mouse
# click, replay ticks, the stop-loss hit, the phone's buzzes and chimes, the phone turned face down, a few birds at dawn,
# and a 2.6 s tail after the voice ends (an Eb-major pad and a soft piano, the key of the voice-over's music).
#   python3 sound.py  → mix.wav (48 kHz stereo, −14 LUFS after encode.sh's loudness pass)
import json, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
D = json.load(open('data.json')); T = D['t']; DUR = D['dur']; N = int(DUR * SR)
rng = np.random.default_rng(23)
out = np.zeros((N, 2)); verb = np.zeros((N, 2))
tt = lambda d: np.arange(int(d * SR)) / SR
bp = lambda x, lo, hi, o=2: sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
lp = lambda x, f, o=2: sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f, o=2: sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
db = lambda g: 10 ** (g / 20)

def put(t0, sig, gain=0.0, pan=0.0, rv=0.0):
    i = int(t0 * SR); sig = sig * db(gain)
    if sig.ndim == 1: sig = np.stack([sig * np.sqrt(1 - pan) , sig * np.sqrt(1 + pan)], 1) / np.sqrt(1)
    if i < 0: sig, i = sig[-i:], 0
    n = min(len(sig), N - i)
    if n <= 0: return
    out[i:i + n] += sig[:n]
    if rv: verb[i:i + n] += sig[:n] * rv

def env(n, a, r):  # attack / exponential release, seconds
    x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / r)

# the voice-over: as recorded, faded out before its hard stop at 19.06 s
v = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', 'voice/t1.mp3', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout, np.float32).reshape(-1, 2).astype(float)
fo0, fo1 = 18.72, D['voice_end'] - 0.02
g = np.ones(len(v)); a, b = int(fo0 * SR), min(int(fo1 * SR), len(v)); g[a:b] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b - a)); g[b:] = 0
out[:len(v)] += (v * g[:, None])[:N]

# rain: a soft band of noise plus droplet ticks, quieter in close-ups, gone by dawn
def level(t):
    pts = [(0, 1.0), (T['replay'], 1.0), (T['replay'] + 0.05, 0.55), (T['phone'], 0.5), (T['persist'], 0.45), (T['dawn'], 0.3), (T['dawn'] + 0.8, 0.0), (DUR, 0.0)]
    xs, ys = zip(*pts); return np.interp(t, xs, ys)
tl = np.arange(N) / SR; lv = level(tl)
for ch, seed in ((0, 1), (1, 2)):
    nz = np.random.default_rng(seed).standard_normal(N)
    rain = bp(nz, 500, 7000) * 0.05 + lp(np.random.default_rng(seed + 9).standard_normal(N), 300) * 0.03
    ticks = np.zeros(N); idx = np.random.default_rng(seed + 5).integers(0, N, int(DUR * 140)); ticks[idx] = np.random.default_rng(seed + 6).uniform(0.1, 1, len(idx))
    ticks = hp(fftconvolve(ticks, np.exp(-np.arange(90) / 12) * np.random.default_rng(seed + 7).standard_normal(90))[:N], 2500) * 0.06
    out[:, ch] += (rain + ticks) * lv * db(-12)
# room tone
out += np.stack([lp(rng.standard_normal(N), 160) for _ in range(2)], 1) * 0.02 * db(-6)

def click(dur=0.006, lo=1800, hi=7000):
    n = int(dur * SR); return bp(rng.standard_normal(n), lo, hi) * env(n, 0.0005, dur / 3)
# mouse click
put(T['click'], click(), -14, 0.3); put(T['click'] + 0.07, click(), -17, 0.3)
# replay steps
for k, dt in enumerate([0.28, 0.56, 0.93]): put(T['replay'] + dt - 0.02, click(0.01, 1200, 5000), -22, 0.1)
# the stop: a low hit and a dark swell
n = int(1.4 * SR); x = np.arange(n) / SR
boom = np.sin(2 * np.pi * np.cumsum(np.interp(x, [0, 0.5], [78, 38])) / SR) * env(n, 0.003, 0.45) + lp(rng.standard_normal(n), 220) * env(n, 0.002, 0.08) * 0.8
put(T['stop'], boom, -6, 0, 0.2)
n = int(0.55 * SR); sw = bp(rng.standard_normal(n), 200, 2000) * np.linspace(0, 1, n) ** 2
put(T['stop'] - 0.55, sw, -26, 0)

# phone: buzzes and a chime
def buzz():
    n = int(0.62 * SR); x = np.arange(n) / SR; on = ((x < 0.2) | ((x > 0.32) & (x < 0.52))).astype(float)
    s = np.sign(np.sin(2 * np.pi * 165 * x)) * on; return lp(s, 420, 4) * 0.5
def bell(f, d=1.2):
    n = int(d * SR); x = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / (d / (1 + m))) for m, a in ((1, 1), (2.01, 0.35), (3.02, 0.12))) * env(n, 0.002, 10)
for k, key in enumerate(('n1', 'n2', 'n3')):
    put(T[key], buzz(), -20 - 2 * k, 0.05)
    put(T[key] + 0.01, bell(932.3) * 0.6, -24 - 2 * k, -0.1, 0.35); put(T[key] + 0.13, bell(1244.5) * 0.6, -25 - 2 * k, -0.1, 0.35)
# turned face down: a whoosh, then the thud on the desk
n = int(0.45 * SR); x = np.linspace(0, 1, n)
wh = bp(rng.standard_normal(n), 300, 3500) * np.sin(np.pi * x) ** 2
put(T['flip'], wh, -20, -0.2)
n = int(0.3 * SR); x = np.arange(n) / SR
thud = np.sin(2 * np.pi * 95 * x) * env(n, 0.001, 0.06) + bp(rng.standard_normal(n), 400, 3000) * env(n, 0.0005, 0.012) * 0.6
put(T['down'], thud, -9, 0.1, 0.1)
# sessions montage: one key per cut
for dt in [0, 0.17, 0.32, 0.47, 0.62, 0.79, 0.97, 1.19]: put(T['persist'] + dt, click(0.012, 900, 4500), -21, rng.uniform(-0.3, 0.3))
# dawn: two small birds
def chirp(f0, f1, d):
    n = int(d * SR); x = np.arange(n) / SR; f = np.interp(x, [0, d], [f0, f1]); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / d) ** 2
for t0, f0, f1 in [(16.6, 3800, 5200), (16.75, 4200, 5600), (17.6, 3600, 4800), (18.1, 4000, 5400), (18.22, 4400, 5800)]:
    put(t0, chirp(f0, f1, 0.07), -33, 0.6, 0.4)

# tail: Eb major add9 pad and a soft piano
def note(f, d, a=0.004):
    n = int(d * SR); x = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * m * (1 + 0.0004 * m * m) * x) * (0.9 ** (m * 2.2)) * np.exp(-x * (1.2 + 0.9 * m)) for m in range(1, 8))
    return (s + bp(rng.standard_normal(n), 1500, 6000) * np.exp(-x * 90) * 0.15) * env(n, a, 10)
hz = lambda name: {'Eb3': 155.56, 'Bb3': 233.08, 'Eb4': 311.13, 'F4': 349.23, 'G4': 392.0, 'Bb4': 466.16, 'Eb5': 622.25, 'G5': 783.99}[name]
p0 = T['end'] - 0.7; n = N - int(p0 * SR); x = np.arange(n) / SR
pad = np.zeros(n)
for nm in ('Eb3', 'Bb3', 'G4', 'F4', 'Bb4'):
    for det in (-0.004, 0.004): pad += np.sin(2 * np.pi * hz(nm) * (1 + det) * x + rng.uniform(0, 6)) * 0.2
pad = lp(pad, 1400) * np.minimum(1, x / 1.0) * np.minimum(1, (x[-1] - x) / 0.9)
put(p0, np.stack([pad, np.roll(pad, 300)], 1), -11, 0, 0.5)
put(T['end'] + 0.85, note(hz('G4'), 2.6) + note(hz('Eb5'), 2.6) * 0.8, -15, -0.1, 0.6)
put(T['end'] + 1.6, note(hz('Bb4'), 2.0) + note(hz('Eb5'), 2.0) * 0.8 + note(hz('G5'), 2.0) * 0.5, -17, 0.1, 0.6)

# reverb
n = int(2.2 * SR); ir = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / SR / 0.55)[:, None]; ir[:int(0.012 * SR)] = 0; ir /= np.abs(ir).sum(0) ** 0.5 * 18
for ch in range(2): out[:, ch] += fftconvolve(lp(verb[:, ch], 6000), ir[:, ch])[:N]
# end: fade the last 0.35 s
out[-int(0.35 * SR):] *= np.linspace(1, 0, int(0.35 * SR))[:, None]
pk = np.abs(out).max(); print('peak', round(20 * np.log10(pk), 1), 'dBFS')
pcm = (np.clip(out / max(pk, 1) * 0.98, -1, 1) * 32767).astype('<i2')
import wave
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
# loudness: two-pass loudnorm to -14 LUFS, true peak -1.5 dB
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
