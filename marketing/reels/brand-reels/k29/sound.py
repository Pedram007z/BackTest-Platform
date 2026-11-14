# k29's sound: a soft, airy original bed from ../../reelkit/soundgen.py (D major, 90 BPM, D–Bm–G–A), kept low under the
# user's voice at its normal speed (../k27/voice/vo.wav), with the UI's own sounds: keys for the typed question, a soft
# swish on every morph, a click for each press of the cursor, ticks for the twenty trades, a chime for the tick on the
# button, and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; END = D['end']
CH = {'D': [[220.0, 293.66, 369.99, 440.0], 73.42], 'Bm': [[246.94, 293.66, 369.99, 493.88], 61.74], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0], 'A': [[220.0, 277.18, 329.63, 440.0], 55.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.12: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
T = lambda i: ws(i) - 0.07
run(0.25, 1.6, 20, 3400, 0, 0.035)                                                                     # typing the question
for t0 in [T(4), T(7), T(11) + 0.18, T(24), T(36), T(47), T(54), T(58), T(64), T(76), T(78), T(91), T(92) + 0.1, T(93), END]:
    F('whoosh', t0 - 0.02, gain=0.06)                                                                  # a soft swish per morph
for t0 in [T(11), T(33), T(53), T(61), T(67), T(92)]:
    F('pop', t0, f=2400, gain=0.16)                                                                    # the cursor's clicks
F('pop', T(18), f=1300, gain=0.12); F('pop', T(21), f=1100, gain=0.12)
for i in range(3): F('pop', T(43) + i * 0.16, f=1500 + 120 * i, gain=0.12)
run(T(80), 1.4, 20, 2000, 12, 0.05)                                                                    # the twenty trades
F('bell', T(92) + 0.75, f=1567.98, d=0.9, gain=0.16); F('bell', T(54) + 0.1, f=1174.66, d=1.0, gain=0.12)
F('bell', END + 0.2, f=880.0, d=2.2, gain=0.22)
BAR = round(60 / 90 * 4, 4); G0 = round(ws(7) % BAR, 4)
spec = {'seed': 2929, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['D', 'Bm', 'G', 'A'],
        'groove': [[0.3, DUR - 0.8]], 'full': [[ws(54), END]], 'clap': [[ws(58), END]], 'dark': [[ws(24), ws(36)]],
        'arp': [[0, DUR]], 'hats': [[ws(7), DUR - 1.2]], 'outro_bass': [ws(78), END], 'rolls': [], 'fx': fx, 'ticks': ticks}
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
