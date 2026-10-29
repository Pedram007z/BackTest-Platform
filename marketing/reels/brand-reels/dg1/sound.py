# dg1's sound: an original groove from ../../reelkit/soundgen.py under the user's voice (C# minor, 116 BPM,
# C#m–A–E–B, with a bar landing on step ۱). The effects:
#   - a soft pulse as each node lights up and a swish along each connector;
#   - ticks for the three rules;
#   - a tick run with the 0→100 counter, a scratch through «پول واقعی»;
#   - two locks for «بدون تقلب»;
#   - the decision's split;
#   - a bell for each outcome and a hit with sparkle for «هر دوش برده»;
#   - the BacktestLab node, the footsteps;
#   - the pull-back to the map, the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'C#m': [[207.65, 277.18, 329.63, 415.3], 69.3], 'A': [[220.0, 277.18, 329.63, 440.0], 55.0],
      'E': [[207.65, 246.94, 329.63, 415.3], 41.2], 'B': [[246.94, 311.13, 369.99, 493.88], 61.74]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
# the camera moving down the map, a node lighting up at each stop
for x in (T['pick'], T['write'], T['hundred'], T['fair'], T['outcome'], T['both'], T['start'], T['follow']): F('whoosh', x - 0.25, gain=0.2); F('pop', x + 0.02, f=900, gain=0.26)
F('bell', 0.15, f=1108.73, d=1.4, gain=0.22); F('pop', T['rule'], f=1200, gain=0.26)
# one strategy, only one
for i in range(3): F('tick', ws(20) + i * 0.1, f=2400 + 200 * i, level=0.35)
F('bell', ws(23), f=1661.22, d=1.0, gain=0.22)
# the rules: entry, stop loss, take profit
for i in (27, 31, 34): F('pop', ws(i), f=1000 + 10 * i, gain=0.26)
# 100 trades: the counter, not real money, the real past
run(ws(38), ws(50) + 0.6 - ws(38), 30, 1600, 40, 0.14); F('tick', ws(46), f=3800, level=0.5); F('pop', ws(48), f=1400, gain=0.28)
# no cheating
F('tick', ws(53), f=3000, level=0.45); F('tick', ws(59), f=3000, level=0.45)
# the split, the two outcomes, both a win
F('riser', ws(63), d=ws(66) - ws(63), gain=0.12, f0=500, f1=2400); F('bell', ws(72), f=1661.22, d=1.2, gain=0.22); F('pop', ws(77), f=900, gain=0.26)
F('impact', ws(93), size=0.8, gain=0.45); F('bell', ws(95), f=2217.46, d=1.8, gain=0.26)
# BacktestLab, step by step
F('impact', ws(99), size=0.7, gain=0.4); for_steps = [F('tick', ws(108) + i * 0.16, f=2000 + 150 * i, level=0.3) for i in range(5)]
# the whole map, the free start, the link, the end card
F('whoosh', T['cta'] - 0.2, gain=0.3); F('downlifter', T['cta'], d=1.2, gain=0.14); F('pop', ws(113), f=1300, gain=0.3); F('pop', ws(114), f=1500, gain=0.3)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1108.73, d=2.0, gain=0.3)
BAR = round(60 / 116 * 4, 4); G0 = round(ws(19) % BAR, 4)
spec = {'seed': 149, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['C#m', 'A', 'E', 'B'],
        'groove': [[T['pick'] - 0.1, DUR - 0.6]],
        'full': [[T['hundred'], T['outcome']], [T['both'], T['end']]],
        'clap': [[T['write'], DUR - 0.6]], 'dark': [[T['outcome'], T['both'] - 0.1]],
        'arp': [[0, T['pick']], [T['outcome'], T['both']], [T['end'], DUR]], 'hats': [[T['rule'], DUR - 1.0]],
        'outro_bass': [0, T['pick']], 'rolls': [[T['pick'] - 0.6, T['pick'] - 0.03], [T['both'] - 0.6, T['both'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
