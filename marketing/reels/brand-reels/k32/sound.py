# k32's sound: a light original bed from ../../reelkit/soundgen.py (F major, 98 BPM, F–Dm–B♭–C), darker under the dark
# panels, kept low under the user's voice at its normal speed (voice/vo.wav), with the explainer's own sounds: a swish as
# each panel slides up and a softer one when a headline changes, ticks as candles print, pops for the chips, a hit for
# each «BOS نیست» stamp and for the stop being hit, chimes for each ✓, pops for the replay's marks, and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; END = D['end']
CH = {'F': [[174.61, 220.0, 261.63, 349.23], 43.65], 'Dm': [[220.0, 293.66, 349.23, 440.0], 73.42], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27], 'C': [[261.63, 329.63, 392.0, 523.25], 65.41]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.12: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
T = lambda i: ws(i) - 0.07
for t0 in [T(10), T(34), T(52), T(58), T(103), T(121), T(141), T(151), T(177), T(184)]: F('whoosh', t0 - 0.02, gain=0.09)   # a panel slides up
for t0 in [T(19), T(26), T(42), T(65), T(78), T(83), T(89), T(97), T(111), T(116), T(128), T(146), T(160), T(164), T(174)]: F('whoosh', t0 - 0.1, gain=0.03)
F('whoosh', END - 0.02, gain=0.05)
run(0.2, 1.2, 5, 2600, 0, 0.03); F('pop', T(3), f=1600, gain=0.16); F('impact', T(9) - 0.05, size=0.35, gain=0.2)          # ۰۱
run(T(10) + 0.15, 0.45, 14, 3000, 0, 0.015); F('pop', T(14) + 0.1, f=1700, gain=0.13); F('pop', T(23), f=1300, gain=0.11)     # ۰۲
F('pop', T(26) + 0.2, f=900, gain=0.13); [F('pop', T(i), f=700 - 80 * k, gain=0.12) for k, i in enumerate([31, 32, 33])]; F('impact', T(33) + 0.25, size=0.45, gain=0.24)
F('pop', T(36), f=1500, gain=0.12); F('pop', T(37) + 0.05, f=800, gain=0.1); F('whoosh', T(40), gain=0.04); F('pop', T(41), f=1700, gain=0.13); F('pop', T(49), f=1200, gain=0.14)   # ۰۳
for k in range(3): F('pop', T(52) + 0.4 + 0.5 * k, f=1400 + 150 * k, gain=0.12)                                          # ۰۴
run(T(58) + 0.15, 0.4, 7, 3000, 0, 0.015); F('pop', T(60) + 0.15, f=1600, gain=0.13); F('pop', T(69), f=1200, gain=0.1); F('pop', T(74), f=1000, gain=0.1)   # ۰۵
F('bell', T(75), f=1760.0, d=0.6, gain=0.1); F('pop', T(81), f=1500, gain=0.11); F('pop', T(87), f=1700, gain=0.13); run(T(89), T(93) - T(89), 4, 2200, 40, 0.04)
F('pop', T(95), f=1800, gain=0.13); F('bell', T(99), f=2093.0, d=0.9, gain=0.14)
[F('pop', T(i), f=1300, gain=0.1) for i in (105, 106, 107)]; F('pop', T(108), f=1700, gain=0.1); F('pop', T(110), f=600, gain=0.13)   # ۰۶
F('pop', T(112), f=1400, gain=0.12); F('impact', T(114) - 0.05, size=0.35, gain=0.2); F('riser', T(118), d=0.6, gain=0.04, f0=500, f1=1400); F('pop', T(119), f=1600, gain=0.11)
run(T(121) + 0.15, 0.4, 7, 3000, 0, 0.015); F('pop', T(130) + 0.15, f=1500, gain=0.12); F('bell', T(139), f=1760.0, d=0.6, gain=0.1); F('pop', T(140) + 0.25, f=1100, gain=0.1)   # ۰۷
F('pop', T(142), f=1300, gain=0.12); F('pop', T(145), f=700, gain=0.1); F('pop', T(147), f=1500, gain=0.12); F('bell', T(149), f=2093.0, d=0.8, gain=0.13)   # ۰۸
F('pop', T(157), f=1600, gain=0.12); run(T(160), T(174) - T(160), 16, 2100, 0, 0.02); F('pop', T(166), f=1700, gain=0.12); F('pop', T(172), f=1300, gain=0.14)   # ۰۹
F('pop', T(174), f=1800, gain=0.12); F('pop', T(176), f=1100, gain=0.12)
run(T(177) + 0.2, 0.5, 5, 2400, 30, 0.035)                                                                                 # ۱۰
F('pop', T(184) + 0.05, f=1000, gain=0.14); F('pop', T(186), f=1500, gain=0.18); F('bell', END + 0.2, f=1046.5, d=2.2, gain=0.22)   # ۱۱
BAR = round(60 / 98 * 4, 4); G0 = round(ws(7) % BAR, 4)
spec = {'seed': 3232, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['F', 'Dm', 'Bb', 'C'],
        'groove': [[0.3, DUR - 0.8]], 'full': [[ws(141), END]], 'clap': [[ws(58), ws(103)], [ws(151), END]], 'dark': [[ws(10), ws(34)], [ws(103), ws(121)], [ws(151), ws(177)]],
        'arp': [[0, DUR]], 'hats': [[ws(10), DUR - 1.2]], 'outro_bass': [ws(177), END], 'rolls': [[ws(141) - 0.5, ws(141) - 0.07]], 'fx': fx, 'ticks': ticks}
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
