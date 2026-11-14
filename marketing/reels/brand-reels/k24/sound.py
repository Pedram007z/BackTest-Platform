# k24's sound: a tight original groove from ../../reelkit/soundgen.py (A minor, 100 BPM, Am–F–C–G), kept low under the
# user's voice at its normal speed (voice/vo.wav), with a sound for each move on screen: whooshes on the wipes, the loss
# chips landing in the hook, a tick per tally mark and a thud per number, the scribble and the stamp, a ding for the
# healthy check, the coin flipping, the grid filling and the streak lighting up, the ruler's chips, the counter spinning
# and stopping on «؟», and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; END = D['end']
CH = {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[174.61, 220.0, 261.63, 349.23], 43.65], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.12: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
SC = [(11, 'slash'), (17, 'cut'), (24, 'iris'), (35, 'slash'), (40, 'up'), (56, 'iris'), (59, 'cut'), (68, 'slash'), (79, 'up'), (88, 'iris')]
for wi, kind in SC:
    t = ws(wi) - 0.07; F('whoosh', t - 0.06, gain=0.16)
    if kind == 'cut': F('impact', t, size=0.5, gain=0.3)
for i in range(9): F('pop', 0.2 + i * 0.36 + 0.34, f=700 + 40 * i, gain=0.13)            # the chips landing
F('impact', ws(3) - 0.04, size=0.35, gain=0.22); F('pop', ws(9) - 0.04, f=1200, gain=0.18)
tt = [ws(11) + i * 0.09 for i in range(3)] + [ws(13) + i * 0.09 for i in range(2)] + [ws(15) + i * 0.07 for i in range(5)]
for t in tt: F('pop', t, f=1900, gain=0.1)                                                 # a tick per tally mark
for wi, s in ((11, 0.45), (13, 0.5), (15, 0.75)): F('impact', ws(wi) - 0.07, size=s, gain=0.32)
run(ws(20) - 0.05, 0.45, 9, 1500, 30, 0.1); F('impact', ws(22) - 0.05, size=0.85, gain=0.42); F('fail', ws(22), gain=0.14)
F('bell', ws(28), f=1567.98, d=0.9, gain=0.18)
for i in range(5): F('pop', ws(31) - 0.05 + i * 0.11, f=650 - 30 * i, gain=0.16)
run(ws(36), ws(40) - ws(36) - 0.1, 16, 2600, 0, 0.07)                                      # the coin flipping
run(ws(41) - 0.1, 1.35, 40, 2000, 15, 0.055)                                               # the grid filling
F('impact', ws(49) - 0.06, size=0.6, gain=0.34); F('downlifter', ws(49), d=0.9, gain=0.1)
F('pop', ws(58) - 0.05, f=1300, gain=0.2)
for i in range(5): F('pop', ws(61) + i * 0.32, f=700 + 50 * i, gain=0.15)
F('pop', ws(67) - 0.08, f=900, gain=0.2)
run(ws(69), ws(78) - ws(69) + 0.1, 34, 2400, 0, 0.05); F('impact', ws(78) + 0.1, size=0.55, gain=0.32); F('bell', ws(78) + 0.12, f=1174.66, d=0.8, gain=0.14)
F('riser', ws(85) - 0.3, d=0.3, gain=0.07, f0=400, f1=1600); F('pop', ws(87) - 0.05, f=1300, gain=0.2)
F('pop', ws(88) - 0.05, f=1100, gain=0.2); F('impact', ws(89) - 0.05, size=0.6, gain=0.32); F('pop', ws(90) - 0.05, f=1500, gain=0.2)
F('impact', END, size=0.6, gain=0.35); F('bell', END + 0.2, f=880.0, d=2.0, gain=0.24)
BAR = round(60 / 100 * 4, 4); G0 = round(ws(11) % BAR, 4)
spec = {'seed': 2424, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['Am', 'F', 'C', 'G'],
        'groove': [[0.3, DUR - 0.8]], 'full': [[ws(11), ws(24)], [ws(40), ws(56)], [ws(79), END]], 'clap': [[ws(11), ws(56)], [ws(68), END]], 'dark': [[ws(17), ws(24)]],
        'arp': [[0, ws(11)], [ws(56), ws(68)], [END, DUR]], 'hats': [[ws(11), DUR - 1.2]], 'outro_bass': [ws(79), END], 'rolls': [[ws(11) - 0.5, ws(11) - 0.05], [ws(49) - 0.5, ws(49) - 0.06]], 'fx': fx, 'ticks': ticks}
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
