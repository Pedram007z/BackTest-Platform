# k27's sound: a bright original groove from ../../reelkit/soundgen.py (A major feel over F♯ minor, 102 BPM, F♯m–D–A–E),
# kept low under the user's voice at its normal speed (voice/vo.wav), with a sound for each move: whooshes on the wipes,
# sparkles as the thought cloud's line rises, pops for the buy and the sell, a sweep for the curtain, stamps on «سودده»,
# the eye closing, the calendar flipping back, the replay ticking, the twenty tiles, and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; END = D['end']
CH = {'F#m': [[185.0, 220.0, 277.18, 369.99], 46.25], 'D': [[220.0, 293.66, 369.99, 440.0], 73.42], 'A': [[220.0, 277.18, 329.63, 440.0], 55.0], 'E': [[207.65, 246.94, 329.63, 415.3], 41.2]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.12: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
T = lambda i: ws(i) - 0.07
for wi, kind in [(7, 'slash'), (24, 'cut'), (36, 'iris'), (47, 'slash'), (54, 'iris'), (58, 'up'), (78, 'slash'), (91, 'iris')]:
    F('whoosh', T(wi) - 0.06, gain=0.16)
    if kind == 'cut': F('impact', T(wi), size=0.5, gain=0.3)
F('riser', 0.3, d=2.2, gain=0.05, f0=500, f1=1800); F('bell', 2.55, f=1760.0, d=0.8, gain=0.14)
F('pop', T(18), f=900, gain=0.2); F('pop', T(21), f=700, gain=0.2); F('impact', T(15), size=0.35, gain=0.22)
F('downlifter', T(33), d=0.5, gain=0.12); F('impact', T(34), size=0.6, gain=0.34)
for i in range(3): F('impact', T(43) + 0.02 + i * 0.16, size=0.4, gain=0.24)
F('downlifter', T(51), d=0.4, gain=0.1); F('impact', T(54), size=0.7, gain=0.38); F('bell', T(54) + 0.1, f=1318.51, d=1.0, gain=0.16)
run(T(58), ws(63) - ws(58) + 0.2, 10, 1600, -60, 0.1)
run(ws(64), ws(76) - ws(64), 16, 1900, 0, 0.04); F('pop', T(76), f=1300, gain=0.2)
run(T(80), 1.0, 20, 2000, 20, 0.07); F('pop', T(87), f=1000, gain=0.2)
F('pop', T(91), f=1100, gain=0.2); F('impact', T(92), size=0.6, gain=0.32); F('pop', T(93), f=1500, gain=0.2)
F('impact', END, size=0.6, gain=0.35); F('bell', END + 0.2, f=880.0, d=2.0, gain=0.24)
BAR = round(60 / 102 * 4, 4); G0 = round(ws(7) % BAR, 4)
spec = {'seed': 2727, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['F#m', 'D', 'A', 'E'],
        'groove': [[0.3, DUR - 0.8]], 'full': [[ws(13), ws(36)], [ws(58), END]], 'clap': [[ws(7), ws(47)], [ws(54), END]], 'dark': [[ws(24), ws(36)]],
        'arp': [[0, ws(7)], [ws(47), ws(58)], [END, DUR]], 'hats': [[ws(7), DUR - 1.2]], 'outro_bass': [ws(78), END], 'rolls': [[ws(54) - 0.5, ws(54) - 0.07]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
v = np.zeros(N); m_ = min(N, len(vo)); v[:m_] = vo[:m_]
env = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (env > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); out *= (1 - 0.5 * np.clip(act, 0, 1))[:, None]
out /= np.abs(out).max() + 1e-9; out *= 0.3
out += np.stack([v, v], 1) / (np.abs(v).max() + 1e-9) * 0.85
out = np.tanh(out * 1.2) / np.tanh(1.2)
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out * 0.97, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.8:attack=2:release=40:level=0")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
