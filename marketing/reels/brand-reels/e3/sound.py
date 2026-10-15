# e3's sound: an original track from ../../reelkit/soundgen.py (A minor, 120 BPM; a dark bed, then a pulse that drives
# the time-lapse, cut dead at the freeze, back softly when he opens the laptop) with effects on top: a clock that ticks
# faster as the weeks race by, a page flip for each Saturday, the others' notifications, the phone put down, the lid,
# and a bell on the logo.
#   python3 sound.py  → mix.wav (−14 LUFS, true peak −1.5 dB)
import json, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt

D = json.load(open('data.json')); T = D['t']; DUR = D['dur']; SR = 48000; N = int(DUR * SR); STEPS = [s['t'] for s in D['steps']]
spec = {
    'seed': 29, 'dur': DUR, 'grid0': 0.3, 'bar': 2.0, 'fade_from': DUR - 0.8,
    'chords': {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[220.0, 261.63, 349.23, 440.0], 43.65],
               'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]},
    'prog': ['Am', 'F', 'C', 'G'],
    'groove': [[T['lapse'], T['freeze']]], 'full': [], 'clap': [], 'dark': [[0, T['freeze']]],
    'arp': [[T['room'], T['freeze']], [T['lid'], DUR]], 'hats': [[T['lapse'], T['freeze']]],
    'outro_bass': [T['lid'], DUR], 'rolls': [[T['freeze'] - 1.3, T['freeze'] - 0.05]],
    'fx': [{'type': 'riser', 't': T['freeze'] - 2.6, 'd': 2.55, 'gain': 0.4},
           {'type': 'whoosh', 't': T['lapse'], 'gain': 0.35},
           {'type': 'whoosh', 't': T['lid'] + 0.1, 'gain': 0.35},
           {'type': 'bell', 't': T['lid'] + 0.75, 'f': 659.25, 'gain': 0.3}, {'type': 'bell', 't': T['lid'] + 0.9, 'f': 987.77, 'gain': 0.22},
           {'type': 'bell', 't': T['end'] + 1.4, 'f': 880.0, 'gain': 0.26}],
}
json.dump(spec, open('sound.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'sound.json', 'music.wav'], check=True)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); n = min(N, len(mus)); out[:n] = mus[:n]
tl = np.arange(N) / SR
lev = np.interp(tl, [0, T['lapse'], T['freeze'] - 0.3, T['freeze'], T['freeze'] + 0.02, T['turn'] + 0.4, T['lid'], DUR],
                [0.9, 1.0, 1.35, 1.35, 0.0, 0.0, 1.0, 1.0])
out *= lev[:, None]

rng = np.random.default_rng(9)
bp = lambda x, lo, hi: sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
lp = lambda x, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def put(t0, sig, gain_db, pan=0.0):
    i = int(t0 * SR); s = sig * 10 ** (gain_db / 20)
    if s.ndim == 1: s = np.stack([s * np.sqrt(1 - pan), s * np.sqrt(1 + pan)], 1)
    m = min(len(s), N - i)
    if m > 0 and i >= 0: out[i:i + m] += s[:m]
def env(n, a, r): x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / r)
def tick(f=2600, d=0.03):
    n = int(d * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * x) * 0.5 + bp(rng.standard_normal(n), 2000, 8000) * 0.6) * env(n, 0.0005, 0.006)
def flip(d=0.16):
    n = int(d * SR); x = np.linspace(0, 1, n); return bp(rng.standard_normal(n), 1200, 7000) * np.sin(np.pi * x) ** 1.5 * (0.6 + 0.4 * x)
def ping(fs, d=0.7):
    n = int(d * SR); x = np.arange(n) / SR; return sum(np.sin(2 * np.pi * f * x) * np.exp(-x * 6) for f in fs) * env(n, 0.002, 10)
def knock(f=110, d=0.2):
    n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * f * x) * env(n, 0.001, 0.04) + bp(rng.standard_normal(n), 500, 3000) * env(n, 0.0005, 0.01) * 0.5

# the clock: tick-tock once a second, then faster and faster through the weeks; at the freeze, three slow ticks
t, k = 0.15, 0
while t < T['freeze'] - 0.05:
    put(t, tick(2600 if k % 2 == 0 else 2100), -20 if t < T['lapse'] else -22, 0.25 if k % 2 else -0.25)
    u = max(0.0, (t - T['lapse']) / (T['freeze'] - T['lapse']))
    t += 1.0 if t < T['lapse'] else 0.5 - 0.34 * u ** 0.8; k += 1
for j in range(3): put(T['freeze'] + 0.5 + j * 0.62, tick(2300), -14, 0)
for s in STEPS: put(s, flip(), -17, -0.5)
# under the freeze: a low hum instead of dead silence
n = int((T['turn'] + 0.6 - T['freeze']) * SR); x = np.arange(n) / SR
hum = (np.sin(2 * np.pi * 55 * x) + 0.5 * np.sin(2 * np.pi * 82.4 * x) + 0.15 * lp(rng.standard_normal(n), 300)) * np.minimum(1, x / 0.3) * np.minimum(1, (x[-1] - x) / 0.5)
put(T['freeze'], hum, -26)
for t0 in (6.2, 8.6, 11.0): put(t0, ping([1046.5, 1568.0]), -22, 0.3)
put(T['turn'] + 0.5, knock(), -10, 0.3)
put(T['lid'], knock(80, 0.25), -14, 0.0)

pk = np.abs(out).max(); out = np.tanh(out / pk * 1.6) / np.tanh(1.6)
pcm = (np.clip(out * 0.97, -1, 1) * 32767).astype('<i2')
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
