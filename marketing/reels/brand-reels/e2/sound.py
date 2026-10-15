# e2's sound: an original track from ../../reelkit/soundgen.py (120 BPM, A minor; tense intro, a snare roll and a riser
# into the countdown, a beat of silence, the drop on the release candle) with effects on top: a heartbeat that speeds
# up, the clock, the mouse click, countdown beeps, the target-hit chime and the montage hits.
#   python3 sound.py  → mix.wav (−14 LUFS, true peak −1.5 dB)
import json, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

D = json.load(open('data.json')); T = D['t']; DUR = D['dur']; SR = 48000; N = int(DUR * SR)
A, F, Cc, G = 220.0, 174.61, 261.63, 196.0
spec = {
    'seed': 41, 'dur': DUR, 'grid0': 0.0, 'bar': 2.0, 'fade_from': DUR - 0.7,
    'chords': {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[220.0, 261.63, 349.23, 440.0], 43.65],
               'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]},
    'prog': ['Am', 'F', 'C', 'G'],
    'groove': [[T['drop'], T['end']]], 'full': [[T['drop'], T['line']]], 'clap': [[T['drop'], T['end']]],
    'dark': [[0, T['drop']]], 'arp': [[2.0, T['black']], [T['drop'], T['end']]], 'hats': [[2.0, T['black']], [T['drop'], T['end']]],
    'outro_bass': [T['end'], DUR], 'rolls': [[T['c3'] + 0.4, T['black'] - 0.02]],
    'fx': [{'type': 'riser', 't': T['c3'] - 0.2, 'd': T['black'] - T['c3'] + 0.2, 'gain': 0.5},
           {'type': 'impact', 't': T['drop'], 'size': 1.4, 'gain': 0.9},
           {'type': 'whoosh', 't': T['cheer'], 'gain': 0.4}, {'type': 'whoosh', 't': T['mont'], 'gain': 0.45},
           {'type': 'impact', 't': T['tp'], 'size': 0.8, 'gain': 0.55}, {'type': 'downlifter', 't': T['line'], 'd': 1.6, 'gain': 0.4},
           {'type': 'bell', 't': T['end'] + 0.8, 'f': 880.0, 'gain': 0.3}, {'type': 'bell', 't': T['end'] + 0.95, 'f': 1318.5, 'gain': 0.22}],
    'ticks': [{'start': T['mont'], 'dur': T['win'] - T['mont'], 'count': 17, 'f': 1500, 'step': 20, 'level': 0.12}],
}
json.dump(spec, open('sound.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'sound.json', 'music.wav'], check=True)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); n = min(N, len(mus)); out[:n] = mus[:n] * 0.8
# the intro sits lower so the drop lands harder
lift = np.interp(np.arange(N) / SR, [0, T['c3'], T['black'], T['drop'], DUR], [2.0, 1.9, 1.7, 1.9, 1.9]); out *= lift[:, None]
# a beat of silence before the drop
g = np.ones(N); a, b = int((T['black'] - 0.02) * SR), int((T['drop'] - 0.005) * SR); g[a:b] = 0.02
g[a - 480:a] = np.linspace(1, 0.02, 480); out *= g[:, None]

rng = np.random.default_rng(5)
lp = lambda x, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
bp = lambda x, lo, hi: sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def put(t0, sig, gain_db, pan=0.0):
    i = int(t0 * SR); s = sig * 10 ** (gain_db / 20)
    if s.ndim == 1: s = np.stack([s * np.sqrt(1 - pan), s * np.sqrt(1 + pan)], 1)
    m = min(len(s), N - i)
    if m > 0: out[i:i + m] += s[:m]
def env(n, a, r): x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / r)
def thump(f=55, d=0.25): n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * f * x * (1 - 0.3 * x / d)) * env(n, 0.004, 0.07)
def click(d=0.006): n = int(d * SR); return bp(rng.standard_normal(n), 1800, 7000) * env(n, 0.0005, d / 3)
def beep(f, d=0.12): n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * f * x) * env(n, 0.003, 0.05)
def chime(fs, d=1.2):
    n = int(d * SR); x = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * x) * np.exp(-x * 4) * 0.5 + np.sin(4 * np.pi * f * x) * np.exp(-x * 7) * 0.15 for f in fs) * env(n, 0.002, 10)

# heartbeat: faster and louder towards the countdown
t, bpm = 0.15, 72
while t < T['black'] - 0.1:
    k = t / T['black']; put(t, thump(52), -12 + 5 * k); put(t + 0.17, thump(48, 0.2), -16 + 5 * k)
    bpm = 72 + 70 * k ** 1.5; t += 60 / bpm
# the clock: one tick a second up to the release
for s in np.arange(0.0, T["black"], 0.5): put(s, click(0.004), -27, 0.4)
put(T['order'] + 0.45, click(), -12, 0.3); put(T['order'] + 0.52, click(), -15, 0.3)
for key, f in (('c3', 880), ('c2', 880), ('c1', 1320)): put(T[key], beep(f, 0.16), -12)
put(T['drop'] + 0.03, chime([1318.5, 1661.2, 1975.5]), -10)
put(T['tp'] + 0.02, chime([1318.5, 1975.5]), -14)
# the montage steps: a soft key per frame of the 9 Apr trade
for i in range(8): put(T['win'] + i * (T['tp'] - T['win']) / 7, click(0.01), -22, 0.2 * (-1) ** i)

pk = np.abs(out).max(); out = np.tanh(out / pk * 1.8) / np.tanh(1.8)   # soft-limit the hits so the groove can sit louder
pcm = (np.clip(out * 0.97, -1, 1) * 32767).astype('<i2')
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
