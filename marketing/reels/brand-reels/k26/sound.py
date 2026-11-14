# k26's sound: an original groove from ../../reelkit/soundgen.py (E minor, 98 BPM, Em–C–G–D), kept low under the user's
# voice at its normal speed (voice/vo.wav): a clock ticking through the countdown and a buzzer when time is up, a thud
# per numbered red candle, a pop for each label, a riser as the pattern is drawn, a stab on «فروش», the stop and target
# boxes, ticks as the replay runs to the target and a bell on the hit, the hundred tiles, and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]; END = D['end']
CH = {'Em': [[196.0, 246.94, 329.63, 392.0], 41.2], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0], 'D': [[220.0, 293.66, 369.99, 440.0], 73.42]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.12: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
T = lambda i: ws(i) - 0.07
F('pop', 0.15, f=900, gain=0.2)
c0, c1 = we(8) + 0.05, ws(9) - 0.05
for k in range(5): F('pop', c0 + k * (c1 - c0) / 5, f=1500, gain=0.16)                                # the countdown
F('impact', c1, size=0.5, gain=0.3); F('fail', c1 + 0.02, gain=0.12)
for i in range(5): F('pop', T(17) + i * 0.12, f=650 - 30 * i, gain=0.15)                              # the numbered red candles
F('downlifter', T(26), d=0.6, gain=0.1); F('pop', T(14), f=800, gain=0.16)
F('pop', T(29), f=1100, gain=0.16); F('whoosh', T(32) - 0.05, gain=0.12); F('pop', T(35), f=1300, gain=0.16)
F('riser', T(47) - 0.4, d=0.4, gain=0.08, f0=300, f1=1400); F('impact', T(48), size=0.6, gain=0.34)
F('pop', T(50), f=700, gain=0.14); F('pop', T(53), f=1000, gain=0.14); F('downlifter', T(59), d=0.6, gain=0.08)
F('pop', T(69), f=1200, gain=0.16); F('impact', T(71), size=0.45, gain=0.28); F('impact', T(73), size=0.7, gain=0.36)
F('pop', T(75), f=600, gain=0.18); F('pop', T(79), f=1200, gain=0.18); F('bell', T(80), f=1567.98, d=0.6, gain=0.12)
run(T(86), ws(91) - ws(86), 12, 1900, -40, 0.06); F('bell', ws(91) - 0.1, f=2093.0, d=1.0, gain=0.2); F('impact', ws(91) - 0.1, size=0.5, gain=0.3)
F('whoosh', T(94), gain=0.14); run(T(106), 1.3, 40, 2200, 10, 0.05); F('pop', T(111), f=1300, gain=0.18)
F('whoosh', T(112) - 0.05, gain=0.16); F('riser', T(124) - 0.3, d=0.3, gain=0.07, f0=400, f1=1600)
F('pop', T(128), f=1100, gain=0.2); F('impact', T(129), size=0.6, gain=0.32); F('pop', T(130), f=1500, gain=0.2)
F('impact', END, size=0.6, gain=0.35); F('bell', END + 0.2, f=987.77, d=2.0, gain=0.24)
BAR = round(60 / 98 * 4, 4); G0 = round(ws(9) % BAR, 4)
spec = {'seed': 2626, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['Em', 'C', 'G', 'D'],
        'groove': [[0.3, DUR - 0.8]], 'full': [[ws(43), ws(63)], [ws(83), ws(92)], [ws(112), END]], 'clap': [[ws(12), ws(100)], [ws(112), END]], 'dark': [[c0, c1]],
        'arp': [[0, c0], [ws(92), ws(112)], [END, DUR]], 'hats': [[ws(9), DUR - 1.2]], 'outro_bass': [ws(112), END], 'rolls': [[ws(73) - 0.5, ws(73) - 0.07]], 'fx': fx, 'ticks': ticks}
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
