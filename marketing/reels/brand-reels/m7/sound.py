# m7's sound: two original tracks from ../../reelkit/soundgen.py, a dark A-minor score for the night flight, the
# crash and the storm, crossfaded into a C-major one (C–G–Am–F) for the climb into daylight and the logo. On top, a
# synthesised sound for every beat of the picture: the engine, the display booting, a heartbeat under the surgeon's
# model, the stall alarm and the dive, the impact and the glass, the ringing silence after it, the reset click and the
# tape rewinding, the logo's shimmer, the radar's pings as the beam crosses each market, rain and thunder on the
# lightning, the black box's thud, latch and hiss, the cards, a thousand tiny crashes, and the wind of the sunrise.
# The voice (vo.wav from build.py) is ducked over all of it.   python3 sound.py  → mix.wav (−14 LUFS, true peak −1.5 dB)
import json, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt

D = json.load(open('data.json')); Wt = D['w']; DUR = D['dur']; SR = 48000; N = int(DUR * SR)
ws = lambda i: Wt[i][0]; we = lambda i: Wt[i][1]
SB = {'a': 0, 'b': ws(13) - 0.15, 'c': ws(19) - 0.08, 'd': ws(25), 'e': we(31) + 0.25, 'f': ws(38) - 0.1, 'g': ws(48) - 0.12, 'h': ws(60) - 0.1, 'i': ws(76) - 0.1, 'j': ws(81) - 0.05, 'k': ws(88) - 0.25}
IMPACT = ws(30); PRESS = SB['e'] + 0.2; REW = (PRESS + 0.08, ws(32) + 0.12)
CH_MIN = {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[220.0, 261.63, 349.23, 440.0], 43.65], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]}
CH_MAJ = {'C': [[261.63, 329.63, 392.0, 523.25], 65.41], 'G': [[246.94, 293.66, 392.0, 493.88], 49.0], 'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[220.0, 261.63, 349.23, 440.0], 43.65]}

def gen(spec, name):
    json.dump(spec, open(name + '.json', 'w'), indent=1); subprocess.run(['python3', '../../reelkit/soundgen.py', name + '.json', name + '.wav'], check=True)
    w = wave.open(name + '.wav'); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close(); o = np.zeros((N, 2)); o[:min(N, len(a))] = a[:N]; return o
dark = gen({'seed': 71, 'dur': DUR, 'grid0': SB['f'] % 2.0, 'bar': 2.0, 'fade_from': DUR - 1.0, 'chords': CH_MIN, 'prog': ['Am', 'F', 'C', 'G'],
            'groove': [[SB['f'], SB['i']]], 'full': [[SB['g'], SB['h']]], 'clap': [[SB['g'], SB['i']]], 'dark': [[0, SB['j']]],
            'arp': [[0.6, SB['d']], [SB['f'], SB['i']]], 'hats': [[SB['c'], SB['d']], [SB['f'], SB['i']]], 'outro_bass': [SB['h'], SB['i']],
            'rolls': [[SB['i'] + 1.0, SB['j'] - 0.02]],
            'fx': [{'type': 'riser', 't': SB['c'], 'd': ws(26) - SB['c'], 'gain': 0.35}, {'type': 'impact', 't': IMPACT, 'size': 1.6, 'gain': 1.0},
                   {'type': 'impact', 't': REW[1], 'size': 1.1, 'gain': 0.6}, {'type': 'whoosh', 't': SB['f'] - 0.1, 'gain': 0.4},
                   {'type': 'whoosh', 't': SB['g'] - 0.1, 'gain': 0.45}, {'type': 'whoosh', 't': SB['h'] - 0.1, 'gain': 0.4}, {'type': 'whoosh', 't': SB['i'] - 0.1, 'gain': 0.4},
                   {'type': 'riser', 't': SB['i'] + 0.2, 'd': SB['j'] - SB['i'] - 0.2, 'gain': 0.55}]}, 'music-dark')
bright = gen({'seed': 72, 'dur': DUR, 'grid0': SB['j'] % 2.0, 'bar': 2.0, 'fade_from': DUR - 1.2, 'chords': CH_MAJ, 'prog': ['C', 'G', 'Am', 'F'],
              'groove': [[SB['k'], DUR]], 'full': [], 'clap': [[SB['k'] + 1.0, DUR]], 'dark': [[SB['j'], DUR]], 'arp': [[SB['j'], DUR]], 'hats': [[SB['k'], DUR]], 'outro_bass': [SB['j'], DUR],
              'rolls': [], 'fx': [{'type': 'impact', 't': SB['j'], 'size': 1.2, 'gain': 0.6}, {'type': 'bell', 't': ws(88) - 0.05, 'f': 1046.5, 'gain': 0.28}, {'type': 'bell', 't': ws(88) + 0.1, 'f': 1568.0, 'gain': 0.2},
                                  {'type': 'bell', 't': ws(93), 'f': 1318.5, 'gain': 0.26}]}, 'music-bright')
tl = np.arange(N) / SR
xf = np.clip((tl - (SB['j'] - 0.1)) / 0.35, 0, 1)
lev = np.interp(tl, [0, SB['d'], IMPACT - 0.02, IMPACT, IMPACT + 0.05, PRESS, REW[1], REW[1] + 0.3, DUR], [0.85, 1.0, 1.15, 1.15, 0.12, 0.12, 0.3, 1.0, 1.0])
out = (dark * (1 - xf)[:, None] + bright * xf[:, None] * 1.05) * lev[:, None]

rng = np.random.default_rng(29)
bp = lambda x, lo, hi: sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
lp = lambda x, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f: sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def put(t0, sig, gain_db, pan=0.0):
    i = int(t0 * SR); s = sig * 10 ** (gain_db / 20)
    if s.ndim == 1: s = np.stack([s * np.sqrt(1 - pan), s * np.sqrt(1 + pan)], 1)
    if i < 0: s = s[-i:]; i = 0
    m = min(len(s), N - i)
    if m > 0: out[i:i + m] += s[:m]
def env(n, a, r): x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / r)
def fade(n, a=0.05, r=0.05): x = np.arange(n) / SR; return np.minimum(1, x / a) * np.minimum(1, (x[-1] - x) / r)
def beep(f, d=0.09): n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * f * x) * env(n, 0.002, d / 3)
def click(f0=2000, d=0.03): n = int(d * SR); return bp(rng.standard_normal(n), f0, min(f0 * 4, 20000)) * env(n, 0.0005, d / 4)
def thump(f=55, d=0.25): n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * f * x * (1 - 0.3 * x / d)) * env(n, 0.003, 0.08)
def pop(f0=900, d=0.08): n = int(d * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * (f0 + 900 * np.exp(-x * 60)) * x) * env(n, 0.001, 0.02)
def whoosh(d=0.5, lo=300, hi=4000, up=True):
    n = int(d * SR); x = np.linspace(0, 1, n); z = rng.standard_normal(n); out_ = np.zeros(n); steps = 24
    for k in range(steps):
        a, b = k * n // steps, (k + 1) * n // steps; u = (k + 0.5) / steps; f = lo * (hi / lo) ** (u if up else 1 - u)
        out_[a:b] = bp(z, f * 0.7, min(f * 1.4, 20000))[a:b]
    return out_ * np.sin(np.pi * x) ** 1.5

# the engine under the flight (A–D), then the wind in daylight
n = int((IMPACT - 0.0) * SR); x = np.arange(n) / SR
eng = lp(rng.standard_normal(n), 380) * 3 + 0.4 * np.sin(2 * np.pi * 92 * x + 0.3 * np.sin(2 * np.pi * 0.4 * x)) + 0.2 * np.sin(2 * np.pi * 184 * x)
eng *= np.minimum(1, x / 0.8) * (1 + 0.8 * np.clip((x - (ws(26))) / (IMPACT - ws(26)), 0, 1))
put(0, eng, -24)
n = int((DUR - SB['j']) * SR); put(SB['j'], bp(rng.standard_normal(n), 250, 1600) * fade(n, 1.0, 1.5) * (0.6 + 0.4 * np.sin(np.arange(n) / SR * 0.7)), -30, 0.1)
# the display boots: beeps; «شبیه‌ساز» chirp
for k, t0 in enumerate([0.15, 0.32, 0.5, 0.75]): put(t0, beep(1800 + 300 * k, 0.06), -24, 0.3)
put(ws(8), beep(2400, 0.08), -20); put(ws(8) + 0.1, beep(3000, 0.08), -22)
# the clock ring ticking on «ساعت‌ها»
for k in range(14): put(ws(6) + k * 0.11, click(3000, 0.02), -27, 0.2 * (-1) ** k)
# a heartbeat under the surgeon's model
for k in range(4): t0 = SB['b'] + 0.25 + k * 0.82; put(t0, thump(50, 0.22), -13); put(t0 + 0.2, thump(46, 0.18), -17)
# LIVE: a two-tone chime; money ticks
put(ws(21) - 0.05, beep(1320, 0.12), -18); put(ws(21) + 0.08, beep(1760, 0.14), -18)
for k in range(16): put(ws(23) + k * 0.07 + rng.random() * 0.03, click(4200, 0.015), -30, rng.uniform(-0.7, 0.7))
# the dive: a falling tone and a stall alarm, then the impact, the glass, the ringing
nd = int((IMPACT - ws(26)) * SR); xd = np.arange(nd) / SR; f = 700 * (150 / 700) ** (xd / xd[-1]); put(ws(26), np.sin(2 * np.pi * np.cumsum(f) / SR) * fade(nd, 0.1, 0.02) * 0.6, -18)
put(ws(26), whoosh(IMPACT - ws(26), 2500, 200, up=True), -14)
t0 = ws(26) + 0.1
while t0 < IMPACT - 0.05:
    for f0 in (880, 660): put(t0, np.sign(np.sin(2 * np.pi * f0 * np.arange(int(0.22 * SR)) / SR)) * 0.25 * fade(int(0.22 * SR), 0.005, 0.02), -24); t0 += 0.25
gl = np.zeros(int(1.2 * SR))
for k in range(60):
    i = int(rng.random() * 0.5 * SR); m = int(0.25 * SR); xx = np.arange(m) / SR; ff = 2200 + rng.random() * 6000
    gl[i:i + m] += np.sin(2 * np.pi * ff * xx) * np.exp(-xx * (25 + rng.random() * 40)) * (0.3 + rng.random() * 0.7)
gl += hp(rng.standard_normal(len(gl)), 3000) * env(len(gl), 0.001, 0.08) * 1.5
put(IMPACT, gl, -12)
nr = int(1.6 * SR); put(IMPACT + 0.1, np.sin(2 * np.pi * 3150 * np.arange(nr) / SR) * np.exp(-np.arange(nr) / SR * 1.8) * 0.5, -30)
# the reset: a click, the tape rewinding (rising, stuttering), the logo's shimmer
put(PRESS, click(1500, 0.05), -10); put(PRESS + 0.02, thump(80, 0.15), -14)
rn = int((REW[1] - REW[0]) * SR); stut = (np.sin(2 * np.pi * 22 * np.arange(rn) / SR) > -0.3).astype(float); put(REW[0], whoosh(REW[1] - REW[0], 200, 5000, up=True) * stut, -10)
for k, f0 in enumerate([2093.0, 2637.0, 3136.0, 4186.0]): put(REW[1] + 0.15 + k * 0.06, beep(f0, 0.6) * 0.6, -24, -0.4 + 0.25 * k)
# the radar: a ping each time the beam crosses a named market
BL = [0.45, 1.25, 2.5, 3.5, 4.35, 5.3]
for an in BL:
    for kk in range(4):
        tp_ = SB['f'] + (an + 1.571 + 2 * np.pi * kk) / 2.6
        if SB['f'] + 0.3 < tp_ < SB['g'] - 0.1:
            s_ = beep(1400, 0.25)
            for e_ in range(3): put(tp_ + e_ * 0.16, s_, -22 - 6 * e_, -0.5 + an / 6)
for t0 in np.arange(ws(41), we(43), 0.09): put(t0, click(3400, 0.012), -32)          # the years ticking by
# the storm: rain, and thunder on each strike
n = int((SB['h'] - SB['g']) * SR); put(SB['g'], hp(rng.standard_normal(n), 2500) * fade(n, 0.4, 0.4), -34)
for t0 in (ws(54) + 0.55, ws(55) + 0.15, ws(50) + 0.1):
    put(t0, hp(rng.standard_normal(int(0.12 * SR)), 1500) * env(int(0.12 * SR), 0.001, 0.03), -14)
    m = int(1.8 * SR); put(t0 + 0.08, lp(rng.standard_normal(m), 160) * env(m, 0.05, 0.5) * 4, -14)
# the black box: in, thud, latch, hiss, cards
put(ws(65) - 0.25, whoosh(0.6, 200, 1500), -18); put(ws(65) + 0.33, thump(48, 0.35), -10)
put(ws(68) - 0.1, click(2600, 0.04), -14); put(ws(68) - 0.05, whoosh(0.6, 3000, 800, up=False), -16)
for i in (70, 72, 74): put(ws(i) - 0.05, pop(1000 + (i - 70) * 120), -16); put(ws(i) - 0.05, whoosh(0.35, 800, 4000), -22)
# a thousand tiny crashes, faster and faster
t0, gap = SB['i'] + 0.1, 0.12
while t0 < SB['j'] - 0.1: put(t0, pop(500 + rng.random() * 700, 0.05), -28, rng.uniform(-0.7, 0.7)); t0 += gap; gap = max(0.025, gap * 0.94)
# daylight: the climb out of the clouds
put(SB['j'] - 0.05, whoosh(1.4, 300, 6000), -14)
put(ws(90) + 0.05, pop(1200), -16)

# duck everything under the voice, then add the voice
vw = wave.open('vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
v = np.zeros(N); m = min(N, len(vo)); v[:m] = vo[:m]
envv = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (envv > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); duck = 1 - 0.5 * np.clip(act, 0, 1)
out *= duck[:, None]
out /= np.abs(out).max() + 1e-9; out *= 0.4
vpk = np.abs(v).max(); out += np.stack([v, v], 1) / vpk * 0.85
out = np.tanh(out * 1.2) / np.tanh(1.2)
pcm = (np.clip(out * 0.97, -1, 1) * 32767).astype('<i2')
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
mm = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(mm[mm.rindex('{'):mm.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
