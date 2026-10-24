# z1's sound: an original score from ../../reelkit/soundgen.py (C minor, 104 BPM, Cm–Ab–Eb–Bb) under the user's voice.
# The camera is the rhythm: every move gets a whoosh, every zoom into something a riser that lands on an impact, the
# rewind back to the crowd a long downlifter. On top: a shimmer as the five turn gold, the «؟», the two myth cards and
# the «نیست» stamp, ticks for the ten trades, the bars and the fourteen losses, five low hits for the five-loss streak,
# a lock, a rise as the curve widens to all trades and a bell on its new high, a run of ticks as the wall fills, the
# replay's candles, the cost chips, your three numbers, you turning gold, the comment typed and sent, the DM, the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
CH = {'Cm': [[196.0, 261.63, 311.13, 392.0], 65.41], 'Ab': [[207.65, 261.63, 311.13, 415.3], 51.91],
      'Eb': [[196.0, 233.08, 311.13, 392.0], 77.78], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
# the camera (lead and move length as in story.js)
LEAD = 0.32
MOVES = {'myths': (0.85, 'pan'), 'know': (1.05, 'in'), 'n1': (0.62, 'pan'), 'n2': (0.55, 'pan'), 'n3': (0.55, 'pan'), 'five': (0.85, 'pan'), 'knew': (0.6, 'pan'),
         'tested': (0.85, 'out'), 'brand': (1.15, 'in'), 'future': (0.6, 'pan'), 'yours': (0.6, 'pan'), 'first': (1.4, 'rewind'), 'cta': (1.0, 'in'), 'end': (0.7, 'pan')}
for k, (md, kind) in MOVES.items():
    go = T[k] - LEAD
    if kind == 'pan': F('whoosh', go + md * 0.5, gain=0.22)
    elif kind == 'in': F('riser', go - 0.25, d=md + 0.2, gain=0.2, f0=300, f1=7000); F('whoosh', go + md * 0.55, gain=0.3); F('impact', go + md, size=0.7, gain=0.42)
    elif kind == 'out': F('whoosh', go + md * 0.45, gain=0.3); F('impact', go + md, size=0.6, gain=0.3)
    else: F('downlifter', go, d=md + 0.2, gain=0.45); F('whoosh', go + md * 0.3, gain=0.3); F('impact', go + md, size=1.0, gain=0.55)
F('impact', 0.02, size=0.8, gain=0.45)
for g in range(5): F('pop', ws(2) + 0.05 + g * 0.07, f=900 + 160 * g, gain=0.25, pan=-0.6 + 0.3 * g)
F('bell', ws(2) + 0.1, f=1567.98, d=1.6, gain=0.28)
F('pop', ws(7) - 0.1, f=1200, gain=0.3)
F('pop', ws(9), f=1000, gain=0.25); F('pop', ws(11), f=700, gain=0.25); F('pop', ws(13), f=800, gain=0.3); F('pop', ws(17), f=1000, gain=0.3)
F('impact', ws(19), size=1.0, gain=0.6); F('fail', ws(19) + 0.05, gain=0.3)
run(ws(36), ws(40) - 0.1 - ws(36), 10, 2200, 30, 0.2); F('pop', ws(39), f=1100, gain=0.35)
F('pop', ws(42), f=900, gain=0.25); F('pop', ws(44), f=600, gain=0.25); F('pop', ws(45), f=1200, gain=0.35)
run(ws(47), ws(52) - ws(47), 14, 900, -20, 0.22); F('impact', ws(52), size=0.8, gain=0.45)
a5, b5 = ws(56), ws(61)
for j in range(5): F('tick', a5 + j * (b5 - a5) / 4, f=420 - 30 * j, level=0.6); F('pop', a5 + j * (b5 - a5) / 4 + 0.01, f=400, gain=0.2)
F('pop', ws(62), f=1300, gain=0.35); F('tick', ws(62) + 0.05, f=3000, level=0.4)
F('riser', T['knew'] + 0.1, d=1.9, gain=0.22, f0=200, f1=5000); F('bell', T['knew'] + 1.2, f=1046.5, d=1.6, gain=0.3); F('pop', ws(69), f=1000, gain=0.3)
run(ws(81), ws(87) - 0.15 - ws(81), 60, 2400, 8, 0.1)
F('bell', ws(88), f=1318.51, d=1.6, gain=0.25)
F('pop', ws(102), f=1000, gain=0.3); F('pop', ws(104), f=1200, gain=0.3)
run(ws(105), 1.2, 3, 1800, 100, 0.25); F('pop', ws(105) + 1.15, f=1500, gain=0.3)
for j in range(3): F('pop', ws(107) + j * 0.12, f=1000 + 150 * j, gain=0.28)
F('fail', ws(113), gain=0.2)
F('bell', ws(116), f=1567.98, d=1.8, gain=0.35); F('pop', ws(116), f=1300, gain=0.3)
for j in range(3): F('tick', ws(124) - 0.1 + j * 0.12, f=2600, level=0.45)
F('pop', ws(125), f=1400, gain=0.35); F('pop', ws(128) - 0.1, f=900, gain=0.35); F('bell', ws(128), f=1046.5, d=1.2, gain=0.22)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1567.98, d=2.0, gain=0.3)
BAR = round(60 / 104 * 4, 4)
spec = {'seed': 29, 'dur': DUR, 'grid0': 0.0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Cm', 'Ab', 'Eb', 'Bb'],
        'groove': [[T['myths'], T['first'] - 0.4], [T['cta'], DUR - 0.6]], 'full': [[T['n1'], T['five']], [T['brand'], T['first'] - 0.4]],
        'clap': [[T['n1'], T['first'] - 0.4], [T['cta'], DUR - 0.6]], 'dark': [[T['five'], T['knew'] + 0.5]],
        'arp': [[0, T['myths']], [T['knew'], T['brand']], [T['first'], T['cta']], [T['end'], DUR]], 'hats': [[T['know'], T['first'] - 0.4], [T['cta'], DUR - 1.0]],
        'outro_bass': [T['first'], T['cta']], 'rolls': [[T['brand'] - 1.0, T['brand'] - 0.32]], 'fx': fx, 'ticks': ticks}
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
