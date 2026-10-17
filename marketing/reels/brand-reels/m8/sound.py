# m8's sound: an original game-show groove from ../../reelkit/soundgen.py (A minor, 120 BPM), and on top a sound for
# every move of the game: a tick per candle as each chart replays (the same easing as the picture), a pop when each
# answer button pulses, a clock for the 3·2·1 with a riser into the reveal, a hit and a two-note «correct» chime on the
# reveal while the future streams in tick by tick, coin pings, a pop per answer card and a bell for the one in eight, a
# hundred accelerating ticks as the trades fill in, the replay's steps and counter, and a pop per comment answer.
# The voice (vo.wav from build.py) is ducked over all of it.   python3 sound.py → mix.wav (−14 LUFS, true peak ≤ −1.5 dB)
import json, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt

D = json.load(open('data.json')); Wt = D['w']; DUR = D['dur']; SR = 48000; N = int(DUR * SR); REV = D['rev']
ws = lambda i: Wt[i][0]; we = lambda i: Wt[i][1]
cl = lambda x, a=0.0, b=1.0: min(b, max(a, x)); k01 = lambda t, a, d: cl((t - a) / d)
ex = lambda x: 0 if x <= 0 else 1 if x >= 1 else 1 - 2 ** (-10 * x)
exIO = lambda x: 0 if x <= 0 else 1 if x >= 1 else (2 ** (20 * x - 10) / 2 if x < 0.5 else (2 - 2 ** (-20 * x + 10)) / 2)
T_TWIST, T_COIN, T_PROOF, T_APP, T_CTA = ws(90) - 0.1, ws(101) - 0.05, ws(118) - 0.05, ws(140) - 0.05, ws(163) - 0.05
START, Q0, QZ, IDW = [13, 37, 63], [20, 44, 69], [22, 46, 71], [30, 56, 82]
CH = {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[220.0, 261.63, 349.23, 440.0], 43.65], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]}

spec = {'seed': 81, 'dur': DUR, 'grid0': REV[0] % 2.0, 'bar': 2.0, 'fade_from': DUR - 0.9, 'chords': CH, 'prog': ['Am', 'F', 'C', 'G'],
        'groove': [[ws(13) - 0.1, T_TWIST], [ws(149) - 0.05, DUR]], 'full': [[ws(63) - 0.1, T_TWIST], [ws(152), T_CTA]],
        'clap': [[ws(37) - 0.1, T_TWIST], [ws(149), DUR - 1]], 'dark': [[T_TWIST, ws(140)]], 'arp': [[0, ws(13)], [T_COIN, T_APP], [T_CTA, DUR]],
        'hats': [[0.3, T_TWIST], [T_APP, DUR]], 'outro_bass': [T_TWIST, ws(149)], 'rolls': [[REV[2] - 1.0, REV[2] - 0.03]],
        'fx': [{'type': 'riser', 't': ws(Q0[i]) - 0.1, 'd': REV[i] - ws(Q0[i]) + 0.08, 'gain': 0.45} for i in range(3)]
            + [{'type': 'impact', 't': REV[i], 'size': 1.0 + 0.25 * i, 'gain': 0.75} for i in range(3)]
            + [{'type': 'downlifter', 't': T_TWIST, 'd': 1.4, 'gain': 0.4}, {'type': 'impact', 't': T_APP, 'size': 1.0, 'gain': 0.5}]}
json.dump(spec, open('music.json', 'w'), indent=1); subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
# the music steps back while the clock runs, and comes back with the answer
tl = np.arange(N) / SR; pts = [(0, 0.9)]
for i in range(3): pts += [(ws(Q0[i]) - 0.05, 1.0), (ws(Q0[i]) + 0.3, 0.45), (REV[i] - 0.02, 0.45), (REV[i] + 0.04, 1.15), (REV[i] + 1.6, 1.0)]
pts += [(T_TWIST, 1.0), (T_TWIST + 0.4, 0.7), (T_APP, 0.7), (T_APP + 0.2, 1.0), (DUR, 1.0)]
out *= np.interp(tl, [p[0] for p in pts], [p[1] for p in pts])[:, None]

rng = np.random.default_rng(83)
bp = lambda x, lo, hi: sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def put(t0, sig, gain_db, pan=0.0):
    i = int(t0 * SR); s = sig * 10 ** (gain_db / 20)
    if s.ndim == 1: s = np.stack([s * np.sqrt(1 - pan), s * np.sqrt(1 + pan)], 1)
    if i < 0: s = s[-i:]; i = 0
    m = min(len(s), N - i)
    if m > 0: out[i:i + m] += s[:m]
def env(n, a, r): x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / r)
def tone(f, d, a=0.003, r=None): n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * f * x) * env(n, a, r or d / 3)
def click(f0=2000, d=0.03): n = int(d * SR); return bp(rng.standard_normal(n), f0, min(f0 * 4, 20000)) * env(n, 0.0005, d / 4)
def pop(f0=900, d=0.08): n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * (f0 + 900 * np.exp(-x * 60)) * x) * env(n, 0.001, 0.02)
def bell(f, d=1.2): return sum(tone(f * m, d, 0.002, d / (2 + 3 * k)) * a for k, (m, a) in enumerate([(1, 1), (2.76, 0.35), (5.4, 0.15)]))
def add(*xs): n = max(len(x) for x in xs); o = np.zeros(n); [o.__setitem__(slice(0, len(x)), o[:len(x)] + x) for x in xs]; return o
def clock(): return add(click(1400, 0.05) * 1.4, tone(980, 0.06, 0.001, 0.015) * 0.6)
def ping(f): return add(tone(f, 0.35, 0.001, 0.08), tone(f * 2.4, 0.2, 0.001, 0.04) * 0.4)
def whoosh(d=0.45, lo=300, hi=4000):
    n = int(d * SR); z = rng.standard_normal(n); o = np.zeros(n); steps = 20
    for k in range(steps):
        a, b = k * n // steps, (k + 1) * n // steps; f = lo * (hi / lo) ** ((k + 0.5) / steps); o[a:b] = bp(z, f * 0.7, min(f * 1.4, 20000))[a:b]
    return o * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
def run(t0, t1, count, fn, f0, step, gain, curve=ex):
    """A tick each time a counter driven by curve((t − t0)/(t1 − t0)) goes up: the same easing as the picture."""
    shown, t = 0, t0
    while t <= t1 and shown < count:
        n = int(curve(k01(t, t0, t1 - t0)) * count)
        if n > shown: put(t, click(f0 + step * n, 0.02), gain, -0.4 + 0.8 * (n % 2)); shown = n
        t += 0.003

# the hook: three cards, lit on «هر سه‌تاشو», the empty score
put(0.02, whoosh(0.4, 400, 3000), -18)
for k, i in enumerate((7, 8, 10)): put(ws(i) - 0.03, ping(1046.5 * 2 ** (k * 4 / 12)), -18)
put(ws(5) - 0.05, pop(800), -12); put(ws(13) - 0.38, whoosh(0.4, 500, 5000), -14)
C = D['charts']
for i in range(3):
    t0, tQ, tR, nS, nR = ws(START[i]), ws(Q0[i]), REV[i], len(C[i]['setup']), len(C[i]['reveal'])
    run(t0, t0 + max(0.6, tQ - t0 - 0.1), int(nS * 0.82), None, 2200, 6, -27)                      # the setup replaying
    put(ws(Q0[i]) - 0.02, pop(1100, 0.09), -13, 0.3); put(ws(QZ[i]) - 0.02, pop(700, 0.09), -13, -0.3)  # the two buttons
    for k in range(3): put(tQ + k * (tR - tQ) / 3, clock(), -9)                                    # 3 · 2 · 1
    put(tR, tone(1046.5, 0.5, 0.002, 0.15) + tone(1568, 0.5, 0.002, 0.18) * 0.8, -14); put(tR + 0.09, bell(2093, 0.9), -22)   # «correct»
    run(tR, tR + 1.25, nR, None, 1600, 30 if nR < 10 else 12, -24, exIO); put(tR + 0.02, whoosh(0.6, 600, 6000), -18)      # the future
    put(tR + 0.3, pop(1300), -15); put(ws(IDW[i]) - 0.08, pop(950), -16)
    if i < 2: put(ws(START[i + 1]) - 0.45, whoosh(0.45, 300, 5000), -13)
# the twist: three answers merge into 3/3, «دمت گرم»
put(ws(95) - 0.1, whoosh(0.45, 800, 4000), -18); put(ws(95) + 0.3, pop(900), -12); put(ws(99) - 0.05, bell(1318.5, 1.0), -18)
# the coin spins (a ping each time its face turns), then all eight ways to answer, and the one that is right
t, k = T_COIN, 0
while t < ws(107) - 0.25: put(t, ping(2637 if k % 2 else 2349), -22, 0.3 if k % 2 else -0.3); t += np.pi / 14; k += 1
for n in range(8): put(ws(107) - 0.2 + n * 0.05, pop(600 + n * 70, 0.07), -17, -0.5 + n / 7)
put(ws(111) - 0.05, bell(1568, 1.3), -14); put(ws(111) + 0.05, pop(1200), -14)
# proof: three dots, «مهارت؟» «شانس؟», a hundred trades filling in faster and faster, then the three that were guesses
for j in range(3): put(T_PROOF + j * 0.08, pop(700 + 120 * j), -15)
put(ws(126) - 0.05, pop(1000), -14); put(ws(129) - 0.05, pop(760), -14)
g0 = ws(131) - 0.05; run(g0, g0 + ws(136) - ws(131) + 0.3, 97, None, 1500, 9, -25, exIO)
put(ws(137) - 0.05, bell(1760, 0.8), -18)
# the app: the name, the play button, a candle per step, the session counter to 100, the stats
put(ws(141) - 0.05, pop(850), -13); put(ws(149) - 0.05, click(3000, 0.04), -10)
n0 = len(C[0]['setup']) + len(C[0]['reveal']); t = ws(149) - 0.05
while t < T_CTA and 20 + int((t - ws(149) + 0.05) / 0.16) < n0: put(t, click(2400, 0.02), -24); t += 0.16
c0 = ws(152) - 0.05; run(c0, c0 + ws(156) - ws(152) + 0.2, 99, None, 1800, 7, -26, exIO)
for j in range(3): put(ws(158) - 0.1 + j * 0.1, whoosh(0.35, 500, 3500), -20)
# the call to action: the comment box, the four answers, the share line
put(T_CTA + 0.05, pop(800), -12)
for k, i in enumerate((166, 167, 168, 170)): put(ws(i) - 0.05, pop(700 + 140 * k), -12)
put(ws(170) + 0.15, whoosh(0.4, 600, 5000), -18); put(ws(170) + 0.3, bell(1046.5, 1.4), -18)

# duck everything under the voice, then add the voice
vw = wave.open('vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
v = np.zeros(N); m = min(N, len(vo)); v[:m] = vo[:m]
envv = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (envv > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); out *= (1 - 0.45 * np.clip(act, 0, 1))[:, None]
out /= np.abs(out).max() + 1e-9; out *= 0.42
out += np.stack([v, v], 1) / (np.abs(v).max() + 1e-9) * 0.85
out = np.tanh(out * 1.2) / np.tanh(1.2)
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out * 0.97, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
mm = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(mm[mm.rindex('{'):mm.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.8:attack=2:release=40:level=0"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
