# k31's sound: a light, warm original bed from ../../reelkit/soundgen.py (F major, 100 BPM, F–Dm–B♭–C), kept low under
# the user's voice at its normal speed (../k27/voice/vo.wav), with the explainer's own sounds: a swish as each panel
# slides up and a softer one when a headline changes, pops for the chips and the markers, quiet ticks as the candles,
# the bars and the replay move, clicks for the switch, the calendar and the button, ticks for the twenty trades, a
# chime for «سودده؟», and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; END = D['end']
CH = {'F': [[174.61, 220.0, 261.63, 349.23], 43.65], 'Dm': [[220.0, 293.66, 349.23, 440.0], 73.42], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27], 'C': [[261.63, 329.63, 392.0, 523.25], 65.41]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.12: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
T = lambda i: ws(i) - 0.07
for t0 in [T(7), T(24), T(36), T(47), T(54), T(64), T(78), T(91)]: F('whoosh', t0 - 0.02, gain=0.09)        # a panel slides up
for t0 in [T(13), T(32), T(41), T(58), T(69), T(85)]: F('whoosh', t0 - 0.1, gain=0.035)                    # a headline changes
F('whoosh', END - 0.02, gain=0.05)
F('pop', T(5), f=1800, gain=0.14); F('pop', T(6), f=900, gain=0.1)                                            # «توی ذهنت», the untested «؟»
run(T(7) + 0.25, 1.0, 22, 3000, 0, 0.02)                                                                       # the candles
F('pop', T(18), f=1300, gain=0.15); F('pop', T(21), f=1100, gain=0.15)                                        # buy, sell
F('pop', T(29), f=1600, gain=0.08); F('pop', T(32), f=2400, gain=0.15); F('riser', T(32), d=0.9, gain=0.04, f0=300, f1=900)
F('pop', T(39), f=1700, gain=0.1); run(T(41), 0.6, 6, 1500, 60, 0.035)
for i in range(6): F('pop', T(43) + i * 0.09, f=1400 + 90 * i, gain=0.1)                                     # «سودده» on each bar
F('whoosh', T(51) - 0.05, gain=0.07)                                                                           # the future is covered
F('impact', T(54), size=0.4, gain=0.18); F('bell', T(54) + 0.1, f=1396.91, d=1.0, gain=0.12)
F('pop', T(63) + 0.1, f=2400, gain=0.16); F('pop', T(63) + 0.8, f=2200, gain=0.16)                           # the 25th, the button
run(T(66), T(76) - T(66), 16, 2100, 0, 0.02)                                                                   # the replay moves
F('pop', T(76), f=1200, gain=0.18)
run(T(80), 1.4, 20, 2000, 12, 0.05)                                                                            # the twenty trades
F('bell', T(85) + 0.05, f=1760.0, d=0.8, gain=0.12)
F('pop', T(91) + 0.05, f=1000, gain=0.14); F('pop', T(93), f=1500, gain=0.18)
F('bell', END + 0.2, f=1046.5, d=2.2, gain=0.22)
BAR = round(60 / 100 * 4, 4); G0 = round(ws(7) % BAR, 4)
spec = {'seed': 3131, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['F', 'Dm', 'Bb', 'C'],
        'groove': [[0.3, DUR - 0.8]], 'full': [[ws(54), END]], 'clap': [[ws(36), ws(47)], [ws(58), END]], 'dark': [[ws(24), ws(36)], [ws(64), ws(78)]],
        'arp': [[0, DUR]], 'hats': [[ws(7), DUR - 1.2]], 'outro_bass': [ws(78), END], 'rolls': [[ws(54) - 0.5, ws(54) - 0.07]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('../k27/voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
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
