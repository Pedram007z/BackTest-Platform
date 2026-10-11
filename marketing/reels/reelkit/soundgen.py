"""
Original reel soundtracks, synthesised from scratch (no samples, no stock music), from a JSON spec:
key and chords, bar length, which parts play where, and the sound effects on the video's moments.

usage: python soundgen.py spec.json out.wav
"""
import json
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
spec = json.load(open(sys.argv[1]))
out_path = sys.argv[2]
rng = np.random.default_rng(spec.get('seed', 11))

DUR = spec['dur']
N = int(DUR * SR)
BAR = spec['bar']
BEAT = BAR / 4
GRID0 = spec['grid0']
buses = {k: np.zeros((N, 2)) for k in ('drums', 'bass', 'pad', 'arp', 'fx', 'verb')}


def place(bus, start, sig, gain=1.0, pan=0.0, verb=0.0):
    i = int(round(start * SR))
    if i >= N:
        return
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * np.sqrt(2), sig * r * np.sqrt(2)], axis=1)
    if i < 0:
        sig, i = sig[-i:], 0
    n = min(len(sig), N - i)
    buses[bus][i:i + n] += sig[:n] * gain
    if verb:
        buses['verb'][i:i + n] += sig[:n] * gain * verb


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR * 0.45), 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def sweep_lp(x, f0, f1, steps=60):
    out = np.zeros_like(x)
    edges = np.linspace(0, len(x), steps + 1).astype(int)
    zi = None
    for k in range(steps):
        sos = butter(2, min(f0 * (f1 / f0) ** (k / (steps - 1)), SR * 0.45), 'low', fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[edges[k]:edges[k + 1]], zi = sosfilt(sos, x[edges[k]:edges[k + 1]], zi=zi)
    return out


def saw(f, t, phase=0.0):
    return 2 * ((f * t + phase) % 1.0) - 1


def adsr(n, a=0.005, r=0.03, sustain=1.0):
    env = np.full(n, sustain)
    na, nr = int(a * SR), int(r * SR)
    if na:
        env[:na] = np.linspace(0, sustain, na)
    if nr and nr < n:
        env[-nr:] *= np.linspace(1, 0, nr)
    return env


def in_ranges(t, ranges):
    return any(a <= t < b for a, b in ranges)


# ---------- instruments ----------
def kick():
    t = tt(0.45)
    s = np.sin(2 * np.pi * np.cumsum(46 + 125 * np.exp(-t * 32)) / SR) * np.exp(-t * 6.5)
    s += rng.standard_normal(len(t)) * np.exp(-t * 500) * 0.25
    return np.tanh(s * 1.6)


def clap():
    t = tt(0.32)
    env = sum(np.where(t >= d, np.exp(-(t - d) * 320), 0) for d in (0, 0.011, 0.023)) + 0.55 * np.where(t >= 0.023, np.exp(-(t - 0.023) * 17), 0)
    return bp(rng.standard_normal(len(t)), 900, 3200) * env * 1.6


def snare(level=1.0):
    t = tt(0.22)
    return (np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.6 + bp(rng.standard_normal(len(t)), 1500, 7000) * np.exp(-t * 22)) * level


def hat(open_=False):
    t = tt(0.32 if open_ else 0.07)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t * (11 if open_ else 70)) * 0.55


def bass_note(f, d, cutoff):
    t = tt(d)
    s = lp(0.7 * saw(f, t) + 0.6 * np.sin(2 * np.pi * f * t), cutoff, 4)
    return np.tanh(s * 1.4) * adsr(len(t), 0.004, 0.04) * np.exp(-t * 1.5)


def pad_chord(freqs, d, cutoff):
    t = tt(d)
    out = np.zeros((len(t), 2))
    for ch, det in enumerate(((-0.11, 0.04, 0.13), (-0.13, -0.03, 0.10))):
        s = sum(saw(f * 2 ** (c / 12), t, rng.random()) for f in freqs for c in det)
        out[:, ch] = lp(s / (len(freqs) * 3), cutoff, 2)
    return out * adsr(len(t), 0.35, 0.7)[:, None]


def pluck(f, d=0.32):
    t = tt(d)
    return lp(0.6 * saw(f, t) + 0.4 * np.sign(np.sin(2 * np.pi * f * t)), 3200, 2) * np.exp(-t * 13) * adsr(len(t), 0.002, 0.02)


def riser(d, f0=250, f1=9000):
    t = tt(d)
    tone = np.sin(2 * np.pi * np.cumsum(180 * (6.5 ** (t / d))) / SR) * 0.25
    return (sweep_lp(rng.standard_normal(len(t)), f0, f1) * 0.8 + tone) * (t / d) ** 2.2


def downlifter(d=1.4):
    t = tt(d)
    tone = np.sin(2 * np.pi * np.cumsum(900 * (0.1 ** (t / d))) / SR) * 0.3
    return (sweep_lp(rng.standard_normal(len(t)), 7000, 180) * 0.7 + tone) * np.exp(-t * 1.6)


def whoosh(d=0.55):
    t = tt(d)
    return sweep_lp(rng.standard_normal(len(t)), 400, 6000) * np.sin(np.pi * t / d) ** 2 * 0.9


def impact(size=1.0):
    t = tt(2.2)
    sub = np.sin(2 * np.pi * np.cumsum(30 + 42 * np.exp(-t * 4)) / SR) * np.exp(-t * 2.2)
    crack = lp(rng.standard_normal(len(t)), 3500) * np.exp(-t * 14)
    return np.tanh((sub * 1.3 + crack * 0.8) * size)


def pop(f0=700):
    t = tt(0.09)
    return np.sin(2 * np.pi * np.cumsum(f0 + 900 * t / 0.09) / SR) * np.exp(-t * 45) * 0.8


def tick(f=2600, level=0.25):
    t = tt(0.015)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 400) * level


def bell(f0, d=1.8):
    t = tt(d)
    s = sum(amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t * dec) for ratio, amp, dec in ((1, 1, 2.2), (2.0, 0.5, 3.0), (3.01, 0.32, 4.0), (4.2, 0.2, 6.0), (5.4, 0.12, 8.0)))
    return s * 0.45 * adsr(len(t), 0.002, 0.05)


def fail_tone():
    t = tt(0.55)
    return np.sin(2 * np.pi * np.cumsum(330 * (0.45 ** (t / 0.55))) / SR) * np.exp(-t * 4) * adsr(len(t), 0.005, 0.05)


def inout(x):
    x = min(1.0, max(0.0, x))
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


# ---------- arrangement ----------
CHORDS = {k: (v[0], v[1]) for k, v in spec['chords'].items()}
PROG = spec['prog']
GROOVE, FULL, DARK = spec['groove'], spec['full'], spec['dark']
ARP, HATS, CLAP = spec['arp'], spec['hats'], spec.get('clap', spec['full'])
OUTRO = spec['outro_bass']

kick_times = []
for k_bar in range(-1, int((DUR - GRID0) / BAR) + 2):
    t0 = GRID0 + k_bar * BAR
    voicing, root = CHORDS[PROG[k_bar % len(PROG)]]
    if t0 < DUR:
        cutoff = 650 if in_ranges(t0 + 0.1, DARK) else (2100 if in_ranges(t0 + 0.1, FULL) else 1300)
        level = 0.55 if in_ranges(t0 + 0.1, GROOVE) else 0.8
        if t0 + 0.1 < GRID0:
            level, cutoff = 0.45, 600
        place('pad', t0, pad_chord(voicing, BAR + 0.7, cutoff), level, verb=0.35)
    for b in range(4):
        tb = t0 + b * BEAT
        if not (0 <= tb < DUR):
            continue
        if in_ranges(tb, GROOVE):
            place('drums', tb, kick(), 0.95)
            kick_times.append(tb)
            if b in (1, 3) and in_ranges(tb, CLAP):
                place('drums', tb, clap(), 0.55 if in_ranges(tb, FULL) else 0.35, verb=0.25)
            for e in range(2):
                f = root * (2 if (e == 1 and in_ranges(tb, FULL)) else 1)
                place('bass', tb + e * BEAT / 2, bass_note(f, BEAT / 2 * 0.92, 420 if in_ranges(tb, DARK) else 900), 0.5)
        elif OUTRO[0] <= tb < OUTRO[1] and b == 0:
            place('bass', tb, bass_note(root, BAR * 0.95, 500), 0.35)
        if in_ranges(tb, HATS):
            steps = 4 if in_ranges(tb, FULL) else 2
            for s in range(steps):
                if steps == 2 and s == 0:
                    continue
                place('drums', tb + s * BEAT / steps, hat(open_=(steps == 2 and b == 3)), 0.32 if s % 2 else 0.2, pan=0.35 if s % 2 else -0.25)
    if in_ranges(t0 + 0.1, ARP):
        tones = [f * 2 for f in voicing]
        soft = not in_ranges(t0 + 0.1, FULL)
        for s, idx in enumerate([0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 2, 3, 2, 1]):
            ts = t0 + s * BEAT / 4
            if ts < DUR and in_ranges(ts, ARP):
                place('arp', ts, pluck(tones[idx]), 0.15 if soft else 0.24, pan=-0.3 if s % 2 else 0.3, verb=0.3)

for start, end in spec.get('rolls', []):
    t, gap = start, BEAT
    while t < end - 0.02:
        place('drums', t, snare(0.25 + 0.65 * (t - start) / (end - start)), 0.5, verb=0.2)
        gap = max(BEAT / 8, gap * 0.8)
        t += gap

# ---------- effects ----------
for fx in spec['fx']:
    kind, t = fx['type'], fx['t']
    g, pan, verb = fx.get('gain', 0.35), fx.get('pan', 0.0), fx.get('verb', 0.25)
    if kind == 'impact':
        place('fx', t, impact(fx.get('size', 1.0)), fx.get('gain', 0.7), verb=0.4)
    elif kind == 'whoosh':
        place('fx', t - 0.22, whoosh(), fx.get('gain', 0.45), verb=0.2)
    elif kind == 'riser':
        place('fx', t, riser(fx['d'], fx.get('f0', 250), fx.get('f1', 9000)), fx.get('gain', 0.45))
    elif kind == 'downlifter':
        place('fx', t, downlifter(fx.get('d', 1.6)), fx.get('gain', 0.45), verb=0.3)
    elif kind == 'pop':
        place('fx', t, pop(fx.get('f', 750)), g, pan=pan, verb=verb)
    elif kind == 'tick':
        place('fx', t, tick(fx.get('f', 1800), fx.get('level', 0.6)), 1.0, pan=pan)
    elif kind == 'bell':
        place('fx', t, bell(fx['f'], fx.get('d', 1.6)), fx.get('gain', 0.35), pan=pan, verb=0.5)
    elif kind == 'fail':
        place('fx', t, fail_tone(), fx.get('gain', 0.35), pan=pan)
# runs of ticks that follow a counter or items appearing (same easing as the animation)
for run in spec.get('ticks', []):
    shown, t = 0, run['start']
    while t < run['start'] + run['dur'] + 0.01 and shown < run['count']:
        n = int(inout((t - run['start']) / run['dur']) * run['count'])
        if n > shown:
            place('fx', t, tick(run.get('f', 2000) + run.get('step', 8) * n, run.get('level', 0.18)), 1.0, pan=-0.4 + 0.8 * (n % 2))
            shown = n
        t += 0.004

# ---------- mix ----------
duck = np.ones(N)
for tk in kick_times:
    i = int(tk * SR)
    seg = np.arange(min(int(0.35 * SR), N - i)) / SR
    duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], 1 - 0.6 * np.exp(-seg / 0.08))
for b in ('pad', 'bass', 'arp'):
    buses[b] *= duck[:, None]
ir_t = tt(2.0)
ir = np.stack([lp(rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.2), 6000) for _ in range(2)], axis=1) * 0.05
wet = np.stack([fftconvolve(buses['verb'][:, c], ir[:, c])[:N] for c in range(2)], axis=1)
mix = buses['drums'] * 0.9 + buses['bass'] * 0.85 + buses['pad'] * 0.55 + buses['arp'] * 0.8 + buses['fx'] * 0.9 + wet * 0.9
mix = hp(mix.T, 28).T
fade = np.ones(N)
fs = int(spec['fade_from'] * SR)
fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
fade[: int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
mix *= fade[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.3) / np.tanh(1.3) * 0.89
with wave.open(out_path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('wrote', out_path, f'{DUR:.1f}s')
