# k33's sound: a dark, pulsing original bed from ../../reelkit/soundgen.py (B minor, 96 BPM, Bm–G–D–A, k30's), kept low
# under the user's voice at its normal speed (../k32/voice/vo.wav, k32's take), with the HUD's own sounds: ticks as the
# scan line prints candles, blips as brackets lock, hits for each alert («BOS نیست», «استاپ خورد»), bells for each ✓, a
# sweep for the violet card, a hit on the flash, flap clicks, replay ticks, and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; END = D['end']
CH = {'Bm': [[246.94, 293.66, 369.99, 493.88], 61.74], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0], 'D': [[220.0, 293.66, 369.99, 440.0], 73.42], 'A': [[220.0, 277.18, 329.63, 440.0], 55.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.12: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
T = lambda i: ws(i) - 0.07
run(0.1, 1.3, 16, 3000, -10, 0.03); F('pop', T(3), f=1500, gain=0.18); F('impact', T(9) - 0.05, size=0.6, gain=0.32)          # the hook
run(T(10) + 0.1, 0.45, 14, 3200, 0, 0.02); F('pop', T(14), f=1600, gain=0.16); F('pop', T(23), f=1200, gain=0.12); F('pop', T(26) + 0.2, f=800, gain=0.14)
for k, i in enumerate([31, 32, 33]): F('pop', T(i), f=600 - 60 * k, gain=0.13)
F('impact', T(33) + 0.25, size=0.7, gain=0.36); F('downlifter', T(33) + 0.3, d=0.6, gain=0.08)                                  # stop hit
F('whoosh', T(34), gain=0.06); F('pop', T(36), f=1500, gain=0.12); F('whoosh', T(38), gain=0.05); F('pop', T(41), f=1800, gain=0.15); F('pop', T(49), f=1100, gain=0.15)
F('whoosh', T(52), gain=0.07); [F('pop', T(52) + 0.35 + 0.45 * k, f=1400 + 150 * k, gain=0.12) for k in range(3)]                # BOS CHECK
F('whoosh', T(58), gain=0.06); run(T(58) + 0.1, 0.35, 7, 3000, 0, 0.018); F('pop', T(60), f=1600, gain=0.15); F('pop', T(69), f=1200, gain=0.1); F('pop', T(74), f=1000, gain=0.1)
F('bell', T(75), f=1760.0, d=0.6, gain=0.11); F('pop', T(81), f=1500, gain=0.11); F('riser', T(84), d=0.6, gain=0.04, f0=400, f1=1200); F('pop', T(87), f=1700, gain=0.13)
run(T(89), T(93) - T(89), 4, 2200, 40, 0.045); F('pop', T(95), f=1800, gain=0.15); F('bell', T(99), f=2093.0, d=0.9, gain=0.15)
F('whoosh', T(103), gain=0.06); [F('pop', T(i), f=1300, gain=0.1) for i in (105, 106, 107)]; F('pop', T(108), f=1700, gain=0.11); F('pop', T(110), f=500, gain=0.14)
F('pop', T(112), f=1400, gain=0.12); F('impact', T(114) - 0.05, size=0.6, gain=0.3); F('riser', T(118), d=0.6, gain=0.04, f0=500, f1=1400); F('pop', T(119), f=1600, gain=0.11)
F('whoosh', T(121), gain=0.06); run(T(121) + 0.1, 0.35, 7, 3000, 0, 0.018); F('pop', T(130), f=1500, gain=0.14); F('bell', T(139), f=1760.0, d=0.6, gain=0.11); F('pop', T(140) + 0.25, f=1100, gain=0.1)
F('whoosh', T(141) - 0.15, gain=0.2); F('impact', T(141) + 0.3, size=0.5, gain=0.24); F('pop', T(144) + 0.2, f=700, gain=0.12); F('bell', T(149), f=2093.0, d=0.8, gain=0.13)   # the card
F('impact', T(151), size=0.8, gain=0.38); F('bell', T(151) + 0.1, f=1174.66, d=1.2, gain=0.14)                                  # the flash
run(T(154) + 0.1, T(157) + 0.4 - T(154), 24, 1800, 0, 0.06)                                                                     # the flap board
F('whoosh', T(160), gain=0.06); run(T(160), T(174) - T(160), 16, 1900, 0, 0.03); F('pop', T(166), f=1700, gain=0.13); F('pop', T(172), f=1300, gain=0.16)
F('pop', T(174), f=1800, gain=0.13); F('pop', T(176), f=1100, gain=0.13)
F('whoosh', T(177), gain=0.06); run(T(177) + 0.2, 0.5, 5, 2400, 30, 0.04)
F('impact', T(184), size=0.6, gain=0.32); F('pop', T(186), f=1500, gain=0.2)
F('impact', END, size=0.6, gain=0.32); F('bell', END + 0.2, f=987.77, d=2.2, gain=0.22)
BAR = round(60 / 96 * 4, 4); G0 = round(ws(10) % BAR, 4)
spec = {'seed': 3333, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['Bm', 'G', 'D', 'A'],
        'groove': [[ws(10), DUR - 0.8]], 'full': [[ws(151), END]], 'clap': [[ws(58), ws(103)], [ws(151), END]], 'dark': [[ws(10), ws(52)], [ws(103), ws(121)]],
        'arp': [[0, ws(10)], [END, DUR]], 'hats': [[ws(10), DUR - 1.2]], 'outro_bass': [ws(177), END], 'rolls': [[ws(151) - 0.5, ws(151) - 0.07]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('../k32/voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
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
