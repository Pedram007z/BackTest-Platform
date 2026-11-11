# k15's sound: an original night-lounge groove from ../../reelkit/soundgen.py under the user's voice (voice/vo.wav),
# F minor, 104 BPM, Fm–D♭–A♭–E♭, with a bar landing on «می‌مونه». The neon room has its own sounds:
#   - an electric hum under everything that cuts out at the blackout («تموم شد») and comes back with the lights;
#   - electric clicks as each scene's signs switch on, crackles as luck's tube dies and as its sign sputters out;
#   - dice clattering, cups dropping and shuffling, chips dealt, the counter rolling, the clock ticking, pages torn;
#   - the monitor switching on, a pop for the planned trade, a bell for the balance and for «راحت»;
#   - a hit and a falling tone at the blackout; the lights back on, the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
CH = {'Fm': [[174.61, 207.65, 261.63, 349.23], 43.65], 'Db': [[174.61, 207.65, 277.18, 349.23], 34.65],
      'Ab': [[207.65, 261.63, 311.13, 415.30], 51.91], 'Eb': [[196.0, 233.08, 311.13, 392.0], 38.89]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
OFF = ws(105) - 0.02
for k in ('hard', 'same', 'green', 'ten', 'tangle', 'diff', 'two', 'live', 'lab', 'ifs', 'ifl', 'late'):   # signs switching on
    F('tick', T[k], f=5200, level=0.22); F('tick', T[k] + 0.045, f=4600, level=0.16); F('impact', T[k], size=0.25, gain=0.16)
# the hook: chips, the dice
run(0.1, 0.45, 6, 3400, -30, 0.1); run(T['luck'] + 0.25, 0.45, 7, 1700, -60, 0.2); F('impact', T['luck'] + 0.5, size=0.4, gain=0.25)
# «سخته»; tags; cups drop and shuffle; «سبزن»
F('impact', ws(12), size=0.7, gain=0.4); F('pop', ws(15), f=900, gain=0.22); F('pop', ws(18), f=1100, gain=0.22)
F('impact', ws(19), size=0.5, gain=0.35); F('impact', ws(19) + 0.06, size=0.4, gain=0.3)
F('whoosh', ws(21) - 0.12, gain=0.2); F('whoosh', ws(22) + 0.1, gain=0.18)
F('whoosh', T['green'], gain=0.2); F('impact', ws(25), size=0.9, gain=0.5); F('bell', ws(25) + 0.04, f=1396.91, d=1.2, gain=0.22)
# ten chips dealt; the «؟»
run(ws(27) - 0.12, 0.75, 10, 3000, 25, 0.16); F('impact', ws(31), size=0.7, gain=0.4); F('fail', ws(32), gain=0.14)
# tangled; 10 → 200
F('riser', ws(34), d=ws(41) - ws(34), gain=0.08, f0=500, f1=1400); F('pop', ws(36), f=900, gain=0.2); F('pop', ws(38), f=1100, gain=0.2)
F('riser', ws(48), d=ws(50) + 0.45 - ws(48), gain=0.13, f0=400, f1=3200); run(ws(48), ws(50) + 0.4 - ws(48), 18, 2600, 40, 0.12); F('impact', ws(50) + 0.4, size=0.6, gain=0.35)
# luck's tube dies; strategy stays
F('riser', T['two'] + 0.15, d=ws(55) - T['two'] - 0.2, gain=0.07, f0=400, f1=1600); F('fail', ws(55), gain=0.16); F('downlifter', ws(55), d=0.8, gain=0.14)
F('impact', ws(59), size=1.0, gain=0.5); F('bell', ws(59) + 0.05, f=1396.91, d=1.4, gain=0.26)
# the live market: the clock, the pages, the money
run(ws(62), ws(67) - ws(62), 5, 1500, 0, 0.12); run(ws(67), 1.3, 16, 1900, 20, 0.12)
for j in range(3): F('whoosh', ws(67) - 0.06 + 0.16 * j, gain=0.12)
F('pop', ws(71), f=700, gain=0.26); F('impact', ws(72), size=0.6, gain=0.35)
# the monitor; the planned trade; the trade to its target; the glass; the balance
F('impact', ws(73), size=0.7, gain=0.4); F('riser', T['lab'] - 0.4, d=0.4, gain=0.1, f0=300, f1=2400); F('pop', ws(74), f=1400, gain=0.26)
run(T['lab'] + 0.15, ws(79) - T['lab'] - 0.2, 6, 1900, 10, 0.07); F('pop', ws(79), f=1200, gain=0.28); F('pop', ws(80), f=1500, gain=0.22); F('tick', ws(83), f=3200, level=0.45)
run(T['norisk'], ws(87) - T['norisk'], 16, 2000, 15, 0.06); F('bell', ws(84), f=2093.0, d=0.8, gain=0.14)
F('pop', ws(88), f=1300, gain=0.3); F('bell', ws(89), f=2093.0, d=1.2, gain=0.24)
# «راحت»; luck's 10 trades, «الان»
F('riser', T['ifs'] + 0.05, d=1.1, gain=0.08, f0=500, f1=2000); F('bell', ws(93), f=1396.91, d=1.2, gain=0.24)
run(ws(97), 0.45, 6, 1700, -50, 0.18); F('downlifter', ws(99), d=1.0, gain=0.1); F('pop', ws(100), f=1400, gain=0.3)
# the blackout; the lights back on; the end card
F('impact', OFF, size=1.2, gain=0.6); F('downlifter', OFF, d=1.0, gain=0.2)
F('impact', T['cta'], size=0.6, gain=0.35); F('tick', T['cta'], f=5200, level=0.3); F('bell', T['cta'] + 0.15, f=1396.91, d=1.6, gain=0.24)
F('pop', ws(108), f=1300, gain=0.28); F('pop', ws(109), f=1500, gain=0.26); F('bell', T['end'] + 0.4, f=1046.5, d=2.0, gain=0.28)
BAR = round(60 / 104 * 4, 4); G0 = round(ws(59) % BAR, 4)
spec = {'seed': 515, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Fm', 'Db', 'Ab', 'Eb'],
        'groove': [[T['hard'] - 0.2, OFF], [T['cta'], DUR - 0.6]],
        'full': [[T['diff'], T['live']], [T['lab'], T['late']]],
        'clap': [[T['same'], T['live']], [T['lab'], T['late']]], 'dark': [[T['live'], T['lab']], [T['late'], T['cta']]],
        'arp': [[0, T['hard']], [T['live'], T['lab']], [T['cta'], DUR]], 'hats': [[T['hard'], OFF]],
        'outro_bass': [T['live'], T['lab']], 'rolls': [[ws(59) - 0.6, ws(59) - 0.03]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
# the room: a mains hum (off in the blackout) and crackles where tubes die
tt = np.arange(N) / SR; rng = np.random.default_rng(7)
hum = sum(a * np.sin(2 * np.pi * f * tt) for f, a in ((100, 1.0), (200, 0.5), (300, 0.3), (400, 0.12))) * (1 + 0.2 * np.sin(2 * np.pi * 0.7 * tt))
on = np.ones(N); i0, i1 = int(OFF * SR), int((T['cta'] - 0.02) * SR); on[i0:i1] = 0
ramp = int(0.03 * SR); on[i1:i1 + ramp] = np.linspace(0, 1, ramp)
hum *= on * np.abs(out).max() * 0.05
def crackle(t0, d, rate, level):
    s = np.zeros(N); n = int(d * rate)
    for _ in range(n):
        i = int((t0 + rng.random() * d) * SR); L = int(SR * (0.002 + 0.006 * rng.random()))
        if 0 <= i < N - L: s[i:i + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 4)) * level * (0.4 + rng.random())
    return s
cr = crackle(ws(55) - 0.03, 0.8, 70, 0.5) + crackle(T['late'] + 0.15, OFF - T['late'] - 0.15, 55, 0.45) + crackle(OFF, 0.25, 220, 0.9)
out += np.stack([hum + cr * np.abs(out).max() * 0.6] * 2, 1)
vw = wave.open('voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
v = np.zeros(N); m_ = min(N, len(vo)); v[:m_] = vo[:m_]
env = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (env > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); out *= (1 - 0.5 * np.clip(act, 0, 1))[:, None]
out /= np.abs(out).max() + 1e-9; out *= 0.4
out += np.stack([v, v], 1) / (np.abs(v).max() + 1e-9) * 0.85
out = np.tanh(out * 1.2) / np.tanh(1.2)
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out * 0.97, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.8:attack=2:release=40:level=0")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
