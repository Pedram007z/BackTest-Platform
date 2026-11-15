# k34's sound: a light original bed from ../../reelkit/soundgen.py (F major, 98 BPM, F–Dm–B♭–C, k32's), darker under the
# dark panels, kept low under the user's voice at its normal speed (voice/vo.wav), with the explainer's own sounds: a
# swish as each panel slides up and a softer one when a headline changes, ticks as candles print, pops for the chips,
# chimes for each ✓, a soft hit for «برنگشت» and for the move that got away, and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; END = D['end']
CH = {'F': [[174.61, 220.0, 261.63, 349.23], 43.65], 'Dm': [[220.0, 293.66, 349.23, 440.0], 73.42], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27], 'C': [[261.63, 329.63, 392.0, 523.25], 65.41]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.12: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
T = lambda i: ws(i) - 0.07
for t0 in [T(12), T(38), T(56), T(80), T(107), T(114), T(129), T(138), T(159), T(168)]: F('whoosh', t0 - 0.02, gain=0.09)   # a panel slides up
for t0 in [T(16), T(26), T(32), T(45), T(65), T(69), T(90), T(96), T(122), T(144), T(149), T(156)]: F('whoosh', t0 - 0.1, gain=0.03)
F('whoosh', END - 0.02, gain=0.05)
run(0.3, 3.9, 7, 2600, 20, 0.03); F('pop', T(2), f=1200, gain=0.1); F('impact', T(10), size=0.3, gain=0.16)                 # ۰۱
run(T(12) + 0.15, 0.4, 8, 3000, 0, 0.015); [F('pop', t0, f=900, gain=0.09) for t0 in (T(14), T(14) + 0.35, T(15))]; F('bell', T(15) + 0.2, f=1760.0, d=0.5, gain=0.09)   # ۰۲
[F('pop', t0, f=1400 + 100 * k, gain=0.09) for k, t0 in enumerate((T(19), T(20), T(23)))]; F('pop', T(28), f=1700, gain=0.12); F('pop', T(30), f=1500, gain=0.1)
F('pop', T(43), f=1300, gain=0.12); F('pop', T(44), f=1700, gain=0.12); [F('pop', T(i), f=1500 + 120 * k, gain=0.11) for k, i in enumerate((49, 50, 51))]; F('pop', T(52) + 0.2, f=1200, gain=0.1)   # ۰۳
run(T(56) + 0.15, 0.25, 4, 3000, 0, 0.015); F('pop', T(58), f=1100, gain=0.12); F('pop', T(61), f=1500, gain=0.1); F('bell', T(64), f=1760.0, d=0.6, gain=0.1)   # ۰۴
F('pop', T(68), f=1900, gain=0.14); F('riser', T(71), d=0.5, gain=0.03, f0=900, f1=400); [F('pop', T(i), f=900 - 40 * k, gain=0.07) for k, i in enumerate((73, 74, 76, 78))]
run(T(80) + 0.15, 0.25, 4, 3000, 0, 0.015); F('pop', T(85), f=1500, gain=0.1); F('riser', T(86), d=0.8, gain=0.04, f0=400, f1=1300); F('bell', T(88) + 0.1, f=2093.0, d=0.7, gain=0.12)   # ۰۵
F('pop', T(92), f=1600, gain=0.1); F('pop', T(99), f=1900, gain=0.14); [F('pop', T(i), f=1300 + 80 * k, gain=0.07) for k, i in enumerate((102, 103, 104))]; F('pop', T(105), f=1100, gain=0.1)
run(T(107) + 0.15, 0.4, 8, 3000, 0, 0.015); F('pop', T(111), f=1500, gain=0.1); F('pop', T(111) + 0.15, f=1300, gain=0.1)   # ۰۶
run(T(116), T(126) - T(116), 7, 2400, 20, 0.03); F('pop', T(120), f=1200, gain=0.11); F('impact', T(127), size=0.35, gain=0.18)   # ۰۷
F('pop', T(131), f=1500, gain=0.12); F('pop', T(136), f=700, gain=0.1); F('bell', T(137) + 0.2, f=2093.0, d=0.8, gain=0.13)   # ۰۸
F('pop', T(143), f=1600, gain=0.12); run(T(141), T(158) - T(141), 16, 2100, 0, 0.02); F('pop', T(147) + 0.15, f=1700, gain=0.12); F('pop', T(155), f=1300, gain=0.14)   # ۰۹
F('pop', T(156), f=1800, gain=0.12); F('pop', T(158), f=1100, gain=0.12)
run(T(159) + 0.2, 0.5, 5, 2400, 30, 0.035)                                                                               # ۱۰
F('pop', T(168) + 0.05, f=1000, gain=0.14); F('pop', T(170), f=1500, gain=0.18); F('bell', END + 0.2, f=1046.5, d=2.2, gain=0.22)   # ۱۱
BAR = round(60 / 98 * 4, 4); G0 = round(ws(12) % BAR, 4)
spec = {'seed': 3434, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['F', 'Dm', 'Bb', 'C'],
        'groove': [[0.3, DUR - 0.8]], 'full': [[ws(129), END]], 'clap': [[ws(38), ws(80)], [ws(138), END]], 'dark': [[ws(12), ws(38)], [ws(80), ws(107)], [ws(114), ws(129)], [ws(138), ws(159)]],
        'arp': [[0, DUR]], 'hats': [[ws(12), DUR - 1.2]], 'outro_bass': [ws(159), END], 'rolls': [[ws(129) - 0.5, ws(129) - 0.07]], 'fx': fx, 'ticks': ticks}
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
