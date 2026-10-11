"""
Original soundtrack for BacktestLab reel 2 (52.5 s), synthesised from scratch: no samples, no stock music.

D minor, i–VI–III–VII (Dm Bb F C), ~109 BPM. The bar length puts the breakdown (28.2 s), the drop
(32.6 s) and the dashboard (37.0 s) on bar lines. Hits, whooshes, risers and chimes are placed on the video's cuts and reveals
(the cue times, read from the animation, are written out below).

usage: python soundtrack.py out.wav
"""
import sys

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DUR = 52.5
N = int(DUR * SR)
rng = np.random.default_rng(11)

BAR = 2.2                      # 4 beats → 109.1 BPM
BEAT = BAR / 4
GRID0 = 32.6 - 14 * BAR        # 1.8 s: the first bar line

out_path = sys.argv[1]

# ---------- buses (stereo) ----------
buses = {k: np.zeros((N, 2)) for k in ('drums', 'bass', 'pad', 'arp', 'fx', 'verb')}


def place(bus, start, sig, gain=1.0, pan=0.0, verb=0.0):
    """Adds a mono or stereo signal at `start` seconds (pan -1..1, constant power), with a reverb send."""
    i = int(round(start * SR))
    if i >= N:
        return
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * np.sqrt(2), sig * r * np.sqrt(2)], axis=1)
    j0 = max(0, -i)
    sig = sig[j0:]
    i = max(i, 0)
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
    """A low-pass whose cut-off glides from f0 to f1 (exponentially) over the signal."""
    out = np.zeros_like(x)
    edges = np.linspace(0, len(x), steps + 1).astype(int)
    zi = None
    for k in range(steps):
        f = f0 * (f1 / f0) ** (k / (steps - 1))
        sos = butter(2, min(f, SR * 0.45), 'low', fs=SR, output='sos')
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
    f = 46 + 125 * np.exp(-t * 32)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    s += rng.standard_normal(len(t)) * np.exp(-t * 500) * 0.25
    return np.tanh(s * 1.6)


def clap():
    t = tt(0.32)
    env = sum(np.where(t >= d, np.exp(-(t - d) * 320), 0) for d in (0, 0.011, 0.023)) + 0.55 * np.where(t >= 0.023, np.exp(-(t - 0.023) * 17), 0)
    return bp(rng.standard_normal(len(t)), 900, 3200) * env * 1.6


def snare(level=1.0):
    t = tt(0.22)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    noise = bp(rng.standard_normal(len(t)), 1500, 7000) * np.exp(-t * 22)
    return (tone * 0.6 + noise) * level


def hat(open_=False):
    t = tt(0.32 if open_ else 0.07)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t * (11 if open_ else 70)) * 0.55


def bass_note(f, d, cutoff):
    t = tt(d)
    s = 0.7 * saw(f, t) + 0.6 * np.sin(2 * np.pi * f * t)
    s = lp(s, cutoff, 4)
    return np.tanh(s * 1.4) * adsr(len(t), 0.004, 0.04, 1.0) * np.exp(-t * 1.5)


def pad_chord(freqs, d, cutoff):
    t = tt(d)
    out = np.zeros((len(t), 2))
    for ch, det in enumerate(((-0.11, 0.04, 0.13), (-0.13, -0.03, 0.10))):
        s = np.zeros(len(t))
        for f in freqs:
            for c in det:
                s += saw(f * 2 ** (c / 12), t, rng.random())
        out[:, ch] = lp(s / (len(freqs) * 3), cutoff, 2)
    env = adsr(len(t), 0.35, 0.7)
    return out * env[:, None]


def pluck(f, d=0.32):
    t = tt(d)
    s = 0.6 * saw(f, t) + 0.4 * np.sign(np.sin(2 * np.pi * f * t))
    return lp(s, 3200, 2) * np.exp(-t * 13) * adsr(len(t), 0.002, 0.02)


def riser(d, f0=250, f1=9000):
    t = tt(d)
    noise = sweep_lp(rng.standard_normal(len(t)), f0, f1)
    tone = np.sin(2 * np.pi * np.cumsum(180 * (6.5 ** (t / d))) / SR) * 0.25
    return (noise * 0.8 + tone) * (t / d) ** 2.2


def downlifter(d=1.4):
    t = tt(d)
    noise = sweep_lp(rng.standard_normal(len(t)), 7000, 180)
    tone = np.sin(2 * np.pi * np.cumsum(900 * (0.1 ** (t / d))) / SR) * 0.3
    return (noise * 0.7 + tone) * np.exp(-t * 1.6)


def whoosh(d=0.55):
    t = tt(d)
    noise = rng.standard_normal(len(t))
    up = sweep_lp(noise, 400, 6000)
    return up * np.sin(np.pi * t / d) ** 2 * 0.9


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
    s = np.zeros(len(t))
    for ratio, amp, dec in ((1, 1, 2.2), (2.0, 0.5, 3.0), (3.01, 0.32, 4.0), (4.2, 0.2, 6.0), (5.4, 0.12, 8.0)):
        s += amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t * dec)
    return s * 0.45 * adsr(len(t), 0.002, 0.05)


# ---------- arrangement ----------
CHORDS = {  # pad voicing, bass root
    'Dm': ([146.83, 174.61, 220.0, 293.66], 73.42),
    'Bb': ([174.61, 233.08, 293.66, 349.23], 116.54),
    'F': ([174.61, 220.0, 261.63, 349.23], 87.31),
    'C': ([196.0, 261.63, 329.63, 392.0], 130.81),
}
PROG = ['Dm', 'Bb', 'F', 'C']

GROOVE = [(10.6, 17.6), (19.4, 28.2), (32.6, 45.0)]
FULL = [(32.6, 45.0)]
DARK = [(19.4, 28.2)]
ARP = [(10.6, 17.6), (32.6, 45.0), (45.0, 50.8)]
HATS = [(3.6, 17.6), (19.4, 28.2), (32.6, 45.0)]

kick_times = []
bar_starts = [GRID0 + k * BAR for k in range(-1, int((DUR - GRID0) / BAR) + 2)]
for t0 in bar_starts:
    name = PROG[int(round((t0 - GRID0) / BAR)) % 4]
    voicing, root = CHORDS[name]
    if t0 < DUR:
        cutoff = 650 if in_ranges(t0 + 0.1, DARK) else (2100 if in_ranges(t0 + 0.1, FULL) else 1300)
        level = 0.55 if in_ranges(t0 + 0.1, FULL + [(10.6, 17.6)]) else 0.8
        if t0 + 0.1 < GRID0:
            level, cutoff = 0.45, 600
        place('pad', t0, pad_chord(voicing, BAR + 0.7, cutoff), level, verb=0.35)
    for k in range(4):
        tb = t0 + k * BEAT
        if not (0 <= tb < DUR):
            continue
        if in_ranges(tb, GROOVE):
            place('drums', tb, kick(), 0.95)
            kick_times.append(tb)
            if k in (1, 3) and in_ranges(tb, FULL + [(10.6, 17.6)]):
                place('drums', tb, clap(), 0.55 if in_ranges(tb, FULL) else 0.35, verb=0.25)
        if in_ranges(tb, HATS):
            steps = 4 if in_ranges(tb, FULL) else 2
            for s in range(steps):
                th = tb + s * BEAT / steps
                if steps == 2 and s == 0:
                    continue
                place('drums', th, hat(open_=(steps == 2 and k == 3)), 0.32 if s % 2 else 0.2, pan=0.35 if s % 2 else -0.25)
        if in_ranges(tb, GROOVE):
            dark = in_ranges(tb, DARK)
            for e in range(2):
                f = root * (2 if (e == 1 and in_ranges(tb, FULL)) else 1)
                place('bass', tb + e * BEAT / 2, bass_note(f, BEAT / 2 * 0.92, 420 if dark else 900), 0.5)
        elif 45.0 <= tb < 50.8 and k == 0:
            place('bass', tb, bass_note(root, BAR * 0.95, 500), 0.35)
    if in_ranges(t0 + 0.1, ARP):
        tones = [f * 2 for f in voicing]
        pattern = [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 2, 3, 2, 1]
        soft = not in_ranges(t0 + 0.1, FULL)
        for s, idx in enumerate(pattern):
            ts = t0 + s * BEAT / 4
            if ts < DUR and in_ranges(ts, ARP):
                place('arp', ts, pluck(tones[idx]), 0.15 if soft else 0.24, pan=-0.3 if s % 2 else 0.3, verb=0.3)

# snare rolls into the drop and the dashboard
for start, end in ((30.5, 32.6), (35.8, 37.0)):
    t, gap = start, BEAT
    while t < end - 0.02:
        place('drums', t, snare(0.25 + 0.65 * (t - start) / (end - start)), 0.5, verb=0.2)
        gap = max(BEAT / 8, gap * 0.8)
        t += gap


def fail_tone():
    """A short falling "wrong" tone for strategy A's result."""
    t = tt(0.55)
    return np.sin(2 * np.pi * np.cumsum(330 * (0.45 ** (t / 0.55))) / SR) * np.exp(-t * 4) * adsr(len(t), 0.005, 0.05)


# ---------- effects on the video's moments ----------
place('fx', 0.0, riser(1.05, 200, 4000), 0.35)
for t, size, g in ((1.05, 1.0, 0.85), (24.0, 0.6, 0.45), (32.6, 1.0, 0.75), (37.0, 0.9, 0.65), (45.0, 0.9, 0.6)):
    place('fx', t, impact(size), g, verb=0.4)
for t in (3.6, 9.2, 19.6, 28.2):
    place('fx', t - 0.22, whoosh(), 0.45, verb=0.2)
place('fx', 17.6, downlifter(1.6), 0.45, verb=0.3)
place('fx', 7.45, riser(1.75, 300, 5000), 0.25)
place('fx', 28.3, riser(4.3, 200, 9000), 0.5)
place('fx', 35.8, riser(1.2, 400, 7000), 0.35)
for t, f in ((3.75, 800), (7.5, 750), (9.8, 700), (10.0, 820), (15.0, 650), (17.65, 600), (24.1, 900), (28.35, 700), (30.55, 760), (33.4, 820), (45.3, 900), (47.4, 800), (48.6, 700), (48.85, 900)):
    place('fx', t, pop(f), 0.33, verb=0.25)
place('fx', 6.4, tick(1800, 0.6), 1.0)
# one tick per trade dot (the same easing as the animation)
inout = lambda x: 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
shown, t = 0, 20.3
while t < 23.8 and shown < 100:
    n = int(inout(min(1, max(0, (t - 20.3) / 3.4))) * 100)
    if n > shown:
        place('fx', t, tick(2000 + 8 * n, 0.18), 1.0, pan=-0.4 + 0.8 * (n % 2))
        shown = n
    t += 0.004
place('fx', 14.4, fail_tone(), 0.35, pan=0.3)              # A: −4R
place('fx', 14.5, bell(1174.7), 0.45, pan=-0.3, verb=0.5)    # B: +40R
place('fx', 14.57, bell(1760.0), 0.3, pan=-0.3, verb=0.5)
place('fx', 40.6, bell(1568.0, 1.4), 0.3, verb=0.5)          # "عادیه ✓"
place('fx', 46.6, bell(1760.0, 1.4), 0.3, verb=0.5)          # the follow bell
place('fx', 50.9, impact(0.5), 0.35, verb=0.6)

# ---------- mix ----------
# the kick ducks the pad, bass and arp (sidechain)
t_all = np.arange(N) / SR
duck = np.ones(N)
for tk in kick_times:
    i = int(tk * SR)
    seg = np.arange(min(int(0.35 * SR), N - i)) / SR
    duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], 1 - 0.6 * np.exp(-seg / 0.08))
for b in ('pad', 'bass', 'arp'):
    buses[b] *= duck[:, None]

# reverb: a short decaying noise tail, different per side
ir_t = tt(2.0)
ir = np.stack([rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.2) for _ in range(2)], axis=1)
ir = np.stack([lp(ir[:, 0], 6000), lp(ir[:, 1], 6000)], axis=1) * 0.05
wet = np.stack([fftconvolve(buses['verb'][:, c], ir[:, c])[:N] for c in range(2)], axis=1)

mix = (buses['drums'] * 0.9 + buses['bass'] * 0.85 + buses['pad'] * 0.55 + buses['arp'] * 0.8 + buses['fx'] * 0.9 + wet * 0.9)
mix = hp(mix.T, 28).T
fade = np.ones(N)
fs = int(51.2 * SR)
fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
fade[: int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
mix *= fade[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.3) / np.tanh(1.3) * 0.89

pcm = (mix * 32767).astype(np.int16)
import wave
with wave.open(out_path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', out_path, f'{DUR:.1f}s')
