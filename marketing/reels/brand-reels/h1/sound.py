# h1's sound: an original cinematic score from ../../reelkit/soundgen.py under the user's voice (shared with k7: ../k7/voice/
# vo.wav), C minor, 84 BPM, Cm–Ab–Eb–Bb. A rain bed and thunder under the storm, which fade as the sky warms; pads and a
# pluck for the life story; a low pulse for the restless market; the full groove only for the app and for «تو باشی».
# The effects:
#   - a pop for each comforting bubble, a falling tone as they drop;
#   - the umbrella opening, a bell on «درکت»;
#   - a riser along the golden path, a bell and a swell for the sunrise;
#   - ticks as the candle city grows, a falling tone into the fog;
#   - a bell for the lantern, a riser while the constellation draws;
#   - a hit on «بک‌تست‌لب», ticks for the replay, pops for the winners and losers;
#   - a riser along the repeat;
#   - a bell as the lantern comes to you, a hit on «تو»;
#   - the follow click, the year counter's ticks, «نهایت استفاده», the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Cm': [[196.0, 261.63, 311.13, 392.0], 65.41], 'Ab': [[207.65, 261.63, 311.13, 415.3], 51.91],
      'Eb': [[196.0, 233.08, 311.13, 392.0], 77.78], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('markets', 'brand', 'repeat', 'use'): F('whoosh', T[k] - 0.15, gain=0.24)
# thunder
F('impact', ws(4), size=0.6, gain=0.45); F('impact', ws(6), size=1.0, gain=0.6); F('downlifter', ws(6) + 0.1, d=1.6, gain=0.14)
# the comforts, then they fall
for i in range(3): F('pop', T['console'] + i * 0.22, f=900 + 140 * i, gain=0.24)
F('downlifter', T['alone'], d=1.2, gain=0.18)
# the umbrella, being understood, the warmth
F('pop', ws(22), f=520, gain=0.3); F('bell', ws(23), f=1046.5, d=1.8, gain=0.26); F('bell', ws(27), f=1567.98, d=2.0, gain=0.2)
# the golden path to the sunrise
F('riser', ws(31) - 0.1, d=ws(35) - ws(31) + 0.2, gain=0.12, f0=300, f1=2400); F('bell', ws(40), f=2093.0, d=2.2, gain=0.24); F('whoosh', ws(40) - 0.1, gain=0.16)
# the candle city grows, won't sit still, then the fog
F('impact', T['markets'] + 0.05, size=0.5, gain=0.32); run(T['markets'], 1.2, 16, 1700, 12, 0.08)
F('tick', ws(51), f=2600, level=0.4); F('tick', ws(53), f=3000, level=0.4); F('downlifter', ws(57) - 0.1, d=1.2, gain=0.2)
# the lantern, the market's past in the sky
F('bell', ws(69), f=1567.98, d=1.8, gain=0.26); F('riser', T['past'], d=ws(80) - T['past'], gain=0.12, f0=400, f1=2600); F('bell', ws(80), f=2093.0, d=2.0, gain=0.24)
# BacktestLab
F('impact', ws(83), size=0.9, gain=0.5); F('bell', ws(83) + 0.1, f=1567.98, d=1.6, gain=0.24); run(ws(86), ws(91) - ws(86) - 0.1, 10, 1900, 10, 0.08)
F('pop', ws(91), f=1300, gain=0.28); F('pop', ws(92), f=900, gain=0.26)
# the repeat
F('riser', ws(95) - 0.1, d=ws(99) - ws(95) + 0.3, gain=0.12, f0=500, f1=3000); F('tick', ws(98), f=3000, level=0.42)
# the lantern comes to you
F('bell', ws(103) + 0.3, f=1567.98, d=1.6, gain=0.26); F('impact', ws(106), size=0.7, gain=0.42); F('bell', ws(106) + 0.05, f=2093.0, d=2.0, gain=0.24)
# follow
F('pop', ws(109), f=1200, gain=0.26); F('tick', ws(114), f=3400, level=0.6); F('bell', ws(114) + 0.12, f=2093.0, d=1.0, gain=0.2)
# the years of the market
F('pop', ws(121), f=1000, gain=0.24); run(ws(122) - 0.1, ws(125) - ws(122) + 0.6, 11, 2200, 30, 0.14); F('pop', ws(127), f=1400, gain=0.3)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1567.98, d=2.2, gain=0.3)
BAR = round(60 / 84 * 4, 4); G0 = round(T['brand'] % BAR, 4)
spec = {'seed': 97, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Cm', 'Ab', 'Eb', 'Bb'],
        'groove': [[T['markets'], T['seek'] - 0.2], [T['brand'], T['repeat'] - 0.2], [T['you'], DUR - 0.6]],
        'full': [[T['brand'], T['repeat']], [T['you'], T['end']]],
        'clap': [[T['you'], DUR - 0.6]], 'dark': [[T['markets'], T['seek'] - 0.2]],
        'arp': [[0, T['markets']], [T['past'], T['brand']], [T['repeat'], DUR]], 'hats': [[T['markets'], T['seek']], [T['brand'], DUR - 1.0]],
        'outro_bass': [T['seek'], T['brand'] - 0.1], 'rolls': [[T['brand'] - 0.7, T['brand'] - 0.03]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
rng = np.random.default_rng(5); nz = rng.standard_normal((N, 2)); sm_ = lambda x, n: np.apply_along_axis(lambda c: np.convolve(c, np.ones(n) / n, 'same'), 0, x)
rain = sm_(nz, 6) - sm_(nz, 90); tt = np.arange(N) / SR
env = np.clip(tt / 0.4, 0, 1) * np.clip(1 - (tt - Wd[27][0]) / 2.2, 0, 1) * (0.85 + 0.15 * np.sin(tt * 1.7))
out += rain * env[:, None] * 0.2
vw = wave.open('../k7/voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
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
