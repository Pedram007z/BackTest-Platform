# k35's sound: k33's dark, pulsing original bed from ../../reelkit/soundgen.py (B minor, 96 BPM, Bm–G–D–A), kept low under
# the user's voice at its normal speed (voice/vo.wav), with the HUD's own sounds: a rattle of ticks as the bullet holes
# land, pops for the tags, a hit for the rejected armor, a chime as the untouched parts light up, radar pings and low
# blips for the planes that never come back, a hit for «سوگیری بقا», pops as the sample posts and the gaps appear, chimes
# for the right question and for each plane found, a hit on the flash, ticks for every case counted, and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; END = D['end']
CH = {'Bm': [[246.94, 293.66, 369.99, 493.88], 61.74], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0], 'D': [[220.0, 293.66, 369.99, 440.0], 73.42], 'A': [[220.0, 277.18, 329.63, 440.0], 55.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.12: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
T = lambda i: ws(i) - 0.07
F('riser', 0.0, d=1.4, gain=0.04, f0=300, f1=1200); F('pop', T(4), f=1500, gain=0.13)                                          # the blueprint
run(T(9), T(13) + 0.5 - T(9), 46, 1100, -4, 0.05)                                                                                 # the bullet holes
F('whoosh', T(22) - 0.05, gain=0.07); F('pop', T(22) + 0.2, f=1300, gain=0.12); F('pop', T(30), f=1600, gain=0.12)
F('impact', T(33), size=0.45, gain=0.26); F('bell', T(34) + 0.05, f=1567.98, d=1.0, gain=0.13); F('pop', T(35), f=1800, gain=0.12)
F('pop', T(37), f=700, gain=0.14); F('whoosh', T(44), gain=0.07); run(T(45), 0.5, 9, 2400, 20, 0.035)                         # «چرا؟», the phone
F('whoosh', T(51), gain=0.07); [F('bell', T(51) + 0.6 + 1.6 * k, f=2093.0, d=0.4, gain=0.05) for k in range(6)]               # the radar
[F('pop', T(61) + 0.35 * k, f=520 - 30 * k, gain=0.13) for k in range(5)]; F('downlifter', T(61), d=1.6, gain=0.06)            # the planes that never came back
F('impact', T(72), size=0.55, gain=0.3); run(T(80), 0.4, 7, 2600, 30, 0.035)
F('whoosh', T(83) - 0.05, gain=0.07); run(T(83) + 0.15, 0.45, 9, 2200, 15, 0.04); F('pop', T(86), f=1500, gain=0.11); F('pop', T(88), f=1700, gain=0.11); F('pop', T(94), f=1300, gain=0.11)   # the posts
run(T(101), 0.55, 9, 2800, 10, 0.04); F('whoosh', T(104), gain=0.06); run(T(107), 0.6, 7, 900, -10, 0.05); F('pop', T(111), f=1100, gain=0.13); run(T(115), 0.4, 7, 3200, 0, 0.025)
F('whoosh', T(118), gain=0.06); F('pop', T(124), f=1400, gain=0.12); F('pop', T(127) + 0.2, f=600, gain=0.12); F('bell', T(130), f=1760.0, d=0.8, gain=0.12); F('bell', T(137), f=2093.0, d=0.7, gain=0.12)
F('whoosh', T(138), gain=0.06); [F('bell', T(152) + 0.45 * k, f=1318.51 + 120 * k, d=0.5, gain=0.07) for k in range(5)]; F('impact', T(163), size=0.35, gain=0.2); F('pop', T(163) + 0.05, f=900, gain=0.12)
F('impact', T(169), size=0.8, gain=0.38); F('bell', T(169) + 0.1, f=1174.66, d=1.2, gain=0.14)                                  # the flash
F('whoosh', T(172), gain=0.06); F('pop', T(174), f=1600, gain=0.12); run(T(175), T(195) - T(175), 16, 1900, 0, 0.025)
[F('pop', T(180) + (T(195) - T(180)) * k / 9, f=1500 + 40 * k, gain=0.11) for k in range(10)]; F('pop', T(188), f=1800, gain=0.12)   # every case counted
F('impact', T(196), size=0.6, gain=0.32); F('pop', T(198), f=1500, gain=0.2)
F('impact', END, size=0.6, gain=0.32); F('bell', END + 0.2, f=987.77, d=2.2, gain=0.22)
BAR = round(60 / 96 * 4, 4); G0 = round(ws(14) % BAR, 4)
spec = {'seed': 3535, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['Bm', 'G', 'D', 'A'],
        'groove': [[ws(14), DUR - 0.8]], 'full': [[ws(169), END]], 'clap': [[ws(82), ws(138)], [ws(169), END]], 'dark': [[ws(51), ws(82)], [ws(138), ws(169)]],
        'arp': [[0, ws(14)], [END, DUR]], 'hats': [[ws(14), DUR - 1.2]], 'outro_bass': [ws(172), END], 'rolls': [[ws(169) - 0.5, ws(169) - 0.07]], 'fx': fx, 'ticks': ticks}
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
