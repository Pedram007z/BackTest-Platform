# u2's sound, shared by both cuts (kinetic/ and motion/): an original groove from ../../reelkit/soundgen.py (D minor,
# 120 BPM, Dm–B♭–F–C) under the user's voice: a hit on the first frame and on every scene, ticks as the real gold candles
# draw and a riser as the price runs away after the close, the pullback ringed, the open profit ticking down and the
# click on «بستن», the bars of «ضررها کامل، سودها نصفه», the plan's levels, the three exit-rule cards, the strategies, the
# comparison, and the end card. Everything steps back under the voice (voice/vo.wav).
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
lerp = lambda a, b, k: a + (b - a) * k
CH = {'Dm': [[146.83, 174.61, 220.0, 293.66], 73.42], 'Bb': [[174.61, 233.08, 293.66, 349.23], 58.27],
      'F': [[174.61, 220.0, 261.63, 349.23], 43.65], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
F('impact', 0.02, size=0.8, gain=0.5)
for k in ('notyou', 'pullback', 'fear', 'result', 'rule', 'plan', 'which', 'test', 'brand', 'strat', 'analytics', 'end'): F('whoosh', T[k], gain=0.28)
run(0.1, ws(9) - 0.2, 40, 2600, 3, 0.06); F('tick', ws(7), f=500, level=0.5); F('riser', ws(9) - 0.1, d=1.4, gain=0.35); F('bell', ws(10) + 0.6, f=1567.98, d=1.2, gain=0.28)
run(T['pullback'] + 0.1, 1.8, 30, 2400, 4, 0.06); F('pop', ws(27), f=800, gain=0.3)
run(T['fear'] + 0.2, ws(40) - T['fear'] - 0.3, 20, 1500, -20, 0.07); F('impact', ws(40), size=0.9, gain=0.55); F('tick', ws(40) + 0.01, f=2400, level=0.5)
for k, st in enumerate((ws(42), ws(42) + 0.12, ws(42) + 0.24)): F('pop', st, f=500, gain=0.3)
for k, st in enumerate((ws(44), ws(44) + 0.12, ws(44) + 0.24)): F('pop', st, f=1000, gain=0.25)
F('impact', ws(53), size=1.1, gain=0.6)
F('pop', ws(57), f=800, gain=0.3); F('pop', ws(60), f=1100, gain=0.3); F('pop', ws(60) + 0.15, f=600, gain=0.3)
for k, st in enumerate((ws(68), ws(70), ws(73))): F('pop', st, f=900 + 150 * k, gain=0.35)
F('impact', ws(79), size=1.1, gain=0.6)
F('impact', ws(83) - 0.1, size=1.1, gain=0.6); F('bell', ws(83) + 0.1, f=987.77, d=1.5, gain=0.3)
for k in range(3): F('pop', ws(90) + 0.15 * k, f=900 + 120 * k, gain=0.3)
for k in range(3): F('tick', ws(103) + 0.12 * k, f=2000 + 150 * k, level=0.35)
F('impact', T['end'], size=1.0, gain=0.5); F('pop', ws(110), f=1100, gain=0.4); F('pop', ws(112), f=1300, gain=0.4); F('bell', ws(112) + 0.2, f=1318.5, d=1.6, gain=0.3)
BAR = round(60 / 120 * 4, 4)
spec = {'seed': 73, 'dur': DUR, 'grid0': 0.0, 'bar': BAR, 'fade_from': DUR - 1.3, 'chords': CH, 'prog': ['Dm', 'Bb', 'F', 'C'],
        'groove': [[T['notyou'], T['rule']], [T['brand'], DUR - 0.5]], 'full': [[T['pullback'], T['result']], [T['strat'], T['end']]],
        'clap': [[T['pullback'], T['rule']], [T['brand'], DUR - 0.5]], 'dark': [[T['fear'], T['rule']]],
        'arp': [[0, T['notyou']], [T['rule'], T['brand']], [T['end'], DUR]], 'hats': [[T['notyou'], DUR - 1.0]],
        'outro_bass': [T['fear'], T['rule']], 'rolls': [[T['rule'] - 0.6, T['rule'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
