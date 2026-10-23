# u1's sound, shared by both cuts (kinetic/ and motion/): an original groove from ../../reelkit/soundgen.py (A minor,
# 118 BPM, Am–F–C–G) under the user's voice: a hit on the first frame and on every scene, the coin spinning and landing,
# ticks as the gold candles draw, a tick per random entry, the bracket's two lines, the flat no-cost curve, the two cost
# tags dropping, a falling tone with the cost curve and a hit on −119R, the balance draining to a stamp at $0, the
# settings typed in, and the end card. Everything steps back under the voice (voice/vo.wav).
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
lerp = lambda a, b, k: a + (b - a) * k
CH = {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[220.0, 261.63, 349.23, 440.0], 43.65],
      'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
F('impact', 0.02, size=0.8, gain=0.5)
for k in ('test', 'rand', 'rule', 'free', 'costs', 'result', 'account', 'edge', 'question', 'brand', 'costsui', 'end'): F('whoosh', T[k], gain=0.28)
run(0.1, ws(10) - 0.1, int((ws(10) - 0.1) / 0.17), 3000, 0, 0.08); F('bell', ws(10) + 0.05, f=1567.98, d=1.0, gain=0.3); F('tick', ws(10), f=1200, level=0.5)
run(T['test'] + 0.2, 0.05 * 52, 52, 2600, 4, 0.06)
for k in range(int((T['rule'] - T['rand']) / 0.42)): F('tick', T['rand'] + k * 0.42, f=1800 + 120 * (k % 3), level=0.3)
F('pop', ws(33), f=600, gain=0.3); F('pop', ws(36), f=900, gain=0.3); F('pop', ws(40), f=1100, gain=0.3)
F('riser', T['free'] + 0.1, d=ws(48) - T['free'], gain=0.18); F('pop', ws(49), f=1000, gain=0.3)
F('impact', ws(52), size=0.8, gain=0.5); F('tick', ws(52) + 0.02, f=500, level=0.5); F('impact', ws(54), size=0.9, gain=0.55); F('tick', ws(54) + 0.02, f=450, level=0.5)
F('downlifter', T['result'] + 0.1, d=ws(72) - T['result'], gain=0.35); F('pop', ws(64), f=900, gain=0.3); F('impact', ws(72), size=1.2, gain=0.65); F('fail', ws(73), gain=0.3)
F('downlifter', ws(81), d=ws(90) - ws(81), gain=0.4); F('impact', ws(90) + 0.05, size=1.3, gain=0.7); F('fail', ws(90) + 0.1, gain=0.35)
F('impact', ws(113), size=0.9, gain=0.5)
F('impact', ws(116) - 0.1, size=1.1, gain=0.6); F('bell', ws(116) + 0.1, f=987.77, d=1.5, gain=0.3)
for k, st in enumerate((ws(118) + 0.1, ws(120), ws(121))): F('tick', st, f=2200 + 200 * k, level=0.35)
F('pop', ws(129), f=1200, gain=0.35)
F('impact', T['end'], size=1.0, gain=0.5); F('pop', ws(136), f=1100, gain=0.4); F('pop', ws(138), f=1300, gain=0.4); F('bell', ws(138) + 0.2, f=1318.5, d=1.6, gain=0.3)
BAR = round(60 / 118 * 4, 4)
spec = {'seed': 71, 'dur': DUR, 'grid0': 0.0, 'bar': BAR, 'fade_from': DUR - 1.3, 'chords': CH, 'prog': ['Am', 'F', 'C', 'G'],
        'groove': [[T['test'], T['costs']], [T['brand'], DUR - 0.5]], 'full': [[T['rand'], T['free']], [T['costsui'], T['end']]],
        'clap': [[T['rand'], T['costs']], [T['brand'], DUR - 0.5]], 'dark': [[T['costs'], T['question']]],
        'arp': [[0, T['test']], [T['question'], T['brand']], [T['end'], DUR]], 'hats': [[T['test'], DUR - 1.0]],
        'outro_bass': [T['result'], T['question']], 'rolls': [[T['costs'] - 0.6, T['costs'] - 0.03]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
v = np.zeros(N); m_ = min(N, len(vo)); v[:m_] = vo[:m_]
env = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (env > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); out *= (1 - 0.5 * np.clip(act, 0, 1))[:, None]
out /= np.abs(out).max() + 1e-9; out *= 0.4
out += np.stack([v, v], 1) / (np.abs(v).max() + 1e-9) * 0.85
out = np.tanh(out * 1.2) / np.tanh(1.2)
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out * 0.97, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.8:attack=2:release=40:level=0")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
