# q2's sound: an original groove from ../../reelkit/soundgen.py (D minor, 122 BPM, Dm–B♭–F–C) under the user's voice:
# a hit on the first frame and on every colour cut, the arrow's rise, the calculator's keys, the bills, a tick per
# month that climbs in pitch as the money triples and a big hit when the twelfth bar breaks the chart, the risk gauge's
# sweep, a hit per lost $200 and a heavier one when the account hits zero, ticks as the wall of trades fills and a hit on
# the run of five, the struck-out «حدس», the logo, a tick per year of gold candles, the gauges, the staircase and the
# spike's crash, and the end card.
# Everything steps back under the voice (voice/vo.wav).   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
lerp = lambda a, b, k: a + (b - a) * k
CH = {'Dm': [[146.83, 174.61, 220.0, 293.66], 73.42], 'Bb': [[174.61, 233.08, 293.66, 349.23], 58.27],
      'F': [[174.61, 220.0, 261.63, 349.23], 43.65], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
mon = lambda i: lerp(ws(32), ws(40), (i - 1) / 11)                          # scenes.js mon()
LOSS = lambda i: lerp(ws(65), ws(69) + 0.15, i / 4)                         # scenes.js LOSS()
F('impact', 0.02, size=0.8, gain=0.5); F('pop', ws(5), f=900, gain=0.3)
for k in ('calc', 'triple', 'year', 'nobody', 'risk', 'example', 'everyone', 'right', 'question', 'guess', 'brand', 'years', 'stats', 'small', 'end'): F('whoosh', T[k], gain=0.3)
F('riser', ws(7) - 0.05, d=0.55, gain=0.3); F('pop', ws(8), f=1300, gain=0.35)
for j in range(4): F('tick', ws(11) + j * 0.12, f=2200 + 120 * j, level=0.35)
F('tick', ws(13), f=1600, level=0.45)
F('pop', ws(17), f=800, gain=0.35); F('pop', ws(21), f=950, gain=0.35); F('pop', ws(22), f=1100, gain=0.35); F('bell', ws(23), f=1318.5, d=1.0, gain=0.25)
for i in range(1, 12): F('tick', mon(i), f=900 + 110 * i, level=0.3 + 0.02 * i)
F('riser', mon(9), d=mon(12) - mon(9), gain=0.35); F('impact', mon(12), size=1.3, gain=0.7); F('bell', mon(12) + 0.1, f=1567.98, d=1.4, gain=0.3)
F('impact', ws(46), size=0.9, gain=0.5)
F('impact', ws(53), size=1.1, gain=0.6); F('riser', ws(54), d=0.6, gain=0.3); F('tick', ws(55), f=500, level=0.5)
F('pop', ws(59), f=700, gain=0.3)
for i in range(5): F('impact', LOSS(i), size=0.5 + 0.1 * i, gain=0.4 + 0.04 * i); F('tick', LOSS(i) + 0.02, f=520 - 30 * i, level=0.45)
F('fail', LOSS(4) + 0.1, gain=0.4); F('impact', LOSS(4) + 0.15, size=1.3, gain=0.65)
run(ws(75), ws(80) - 0.1 - ws(75), 70, 2400, 3, 0.09); F('impact', ws(80), size=0.9, gain=0.5)
F('impact', T['right'], size=1.0, gain=0.5); F('pop', ws(97), f=1000, gain=0.3)
F('tick', ws(103) + 0.05, f=520, level=0.55); F('pop', ws(105), f=1100, gain=0.35)
F('impact', ws(110) - 0.1, size=1.1, gain=0.6); F('bell', ws(110) + 0.1, f=987.77, d=1.5, gain=0.3)
for y in range(12): F('tick', ws(116) - 0.1 + (ws(120) + 0.3 - ws(116)) * (y * 12 + 1) / 141, f=1800 + 60 * y, level=0.3)
F('riser', ws(122) - 0.1, d=1.0, gain=0.22); F('riser', ws(125) - 0.1, d=1.0, gain=0.22)
run(ws(130), ws(134) + 0.2 - ws(130), 18, 1500, 40, 0.12)
F('riser', ws(137) - 0.05, d=0.5, gain=0.25); F('downlifter', ws(139), d=0.5, gain=0.35); F('fail', ws(140) + 0.1, gain=0.3)
F('impact', T['end'], size=1.0, gain=0.5); F('pop', ws(144), f=1100, gain=0.4); F('pop', ws(146), f=1300, gain=0.4); F('bell', ws(146) + 0.2, f=1318.5, d=1.6, gain=0.3)
BAR = round(60 / 122 * 4, 4)
spec = {'seed': 61, 'dur': DUR, 'grid0': 0.0, 'bar': BAR, 'fade_from': DUR - 1.3, 'chords': CH, 'prog': ['Dm', 'Bb', 'F', 'C'],
        'groove': [[T['triple'], T['risk']], [T['question'], DUR - 0.5]], 'full': [[T['year'], T['nobody']], [T['brand'], T['small']]],
        'clap': [[T['triple'], T['nobody']], [T['brand'], DUR - 0.5]], 'dark': [[T['risk'], T['right']]],
        'arp': [[0, T['triple']], [T['right'], T['brand']], [T['end'], DUR]], 'hats': [[T['calc'], DUR - 1.0]],
        'outro_bass': [T['risk'], T['right']], 'rolls': [[mon(12) - 0.7, mon(12) - 0.03]], 'fx': fx, 'ticks': ticks}
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
