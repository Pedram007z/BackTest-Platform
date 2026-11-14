# k25's sound: a deep original groove from ../../reelkit/soundgen.py (D minor, 96 BPM, Dm–B♭–F–C), kept low under the
# user's voice at its normal speed (voice/vo.wav): a whoosh on every camera swoop, a thud for each word on a plate, the
# loss cubes landing, the pen scratching and the red cross, the bubbles popping, the stop sign spinning in, a riser as
# the example line falls and a stab as it crosses the limit, the pause and the magnifier, the panels, the follow button's
# click, and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; END = D['end']
CH = {'Dm': [[220.0, 293.66, 349.23, 440.0], 73.42], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27], 'F': [[220.0, 261.63, 349.23, 440.0], 43.65], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.12: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for wi in (10, 24, 39, 49, 63, 67, 74, 81, 86, 99): F('whoosh', ws(wi) - 0.2, gain=0.2)                     # the swoops
for wi in (3, 8, 23, 47, 59, 68, 72, 79, 85, 98, 112): F('impact', ws(wi) - 0.05, size=0.35, gain=0.22)      # words on plates
for i in range(9): F('pop', 0.25 + i * 0.36 + 0.5, f=600 + 40 * i, gain=0.13)                                 # the cubes landing
run(ws(18) - 0.1, 1.5, 22, 3200, 0, 0.04)                                                                     # the pen
F('impact', ws(22) - 0.05, size=0.7, gain=0.38); F('fail', ws(22), gain=0.12)
F('pop', ws(30) - 0.06, f=700, gain=0.22); F('pop', ws(35) - 0.06, f=950, gain=0.22)
F('riser', ws(46) - 0.4, d=0.4, gain=0.08, f0=300, f1=1200); F('impact', ws(47) + 0.15, size=0.8, gain=0.4)
F('riser', ws(51), d=ws(57) - ws(51), gain=0.06, f0=900, f1=250); F('impact', ws(57) + 0.1, size=0.6, gain=0.32); F('fail', ws(57) + 0.12, gain=0.12)
F('pop', ws(59) - 0.06, f=600, gain=0.2); F('pop', ws(61) - 0.06, f=1300, gain=0.2)
F('pop', ws(66) - 0.1, f=1100, gain=0.22); F('bell', ws(66) + 0.1, f=1174.66, d=0.8, gain=0.12)
for wi in (70, 74, 82, 86): F('whoosh', ws(wi) - 0.1, gain=0.1)
run(ws(77), we := (Wd[80][1] + 0.6 - ws(77)), 16, 1800, 0, 0.04)                                              # the replay ticking
F('pop', ws(99) - 0.1, f=900, gain=0.2); F('pop', ws(100), f=1600, gain=0.24)
F('impact', END, size=0.6, gain=0.35); F('bell', END + 0.2, f=880.0, d=2.0, gain=0.24)
BAR = round(60 / 96 * 4, 4); G0 = round(ws(10) % BAR, 4)
spec = {'seed': 2525, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['Dm', 'Bb', 'F', 'C'],
        'groove': [[0.3, DUR - 0.8]], 'full': [[ws(24), ws(49)], [ws(67), ws(99)]], 'clap': [[ws(10), ws(63)], [ws(67), END]], 'dark': [[ws(49), ws(63)]],
        'arp': [[0, ws(10)], [ws(63), ws(67)], [ws(99), DUR]], 'hats': [[ws(10), DUR - 1.2]], 'outro_bass': [ws(86), END], 'rolls': [[ws(47) - 0.5, ws(47) + 0.1]], 'fx': fx, 'ticks': ticks}
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
