# f1's sound: an original score from ../../reelkit/soundgen.py (E minor, 112 BPM, Em–C–G–D) under the user's voice. The
# hook and the three pains sit on a dark pad with an error tone and three card hits; the good news rises into the logo
# with a bell; then the groove carries the screens: a whoosh on every camera move, a soft click and a pop on every
# callout and ring, ticks for the replay's candles and for the trade running to its target (with a bell on the target),
# the comment typed and sent, the DM, the end card.   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
CH = {'Em': [[196.0, 246.94, 329.63, 392.0], 82.41], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41],
      'G': [[196.0, 246.94, 293.66, 392.0], 98.0], 'D': [[220.0, 293.66, 369.99, 440.0], 73.42]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
LEAD = 0.32
MOVES = {'pains': 0.75, 'good': 0.8, 'fa': 0.7, 'rial': 0.62, 'data': 0.65, 'replay': 0.6, 'future': 0.7, 'tools': 0.75, 'trade': 0.75, 'costs': 0.7,
         'analytics': 0.7, 'streak': 0.65, 'weekend': 1.0, 'cta': 1.0, 'end': 0.7}
for k, md in MOVES.items(): F('whoosh', T[k] - LEAD + md * 0.5, gain=0.26 if k not in ('weekend', 'cta') else 0.34)
F('impact', 0.02, size=0.7, gain=0.4)
F('fail', ws(7), gain=0.35); F('impact', ws(7), size=0.8, gain=0.45)
for w in (10, 15, 22): F('pop', ws(w), f=700, gain=0.3); F('impact', ws(w) + 0.02, size=0.4, gain=0.22)
F('fail', ws(10) + 0.35, gain=0.22); F('tick', ws(18), f=900, level=0.55); F('tick', ws(18) + 0.05, f=600, level=0.4)
F('riser', T['good'] - 0.9, d=0.95, gain=0.25, f0=300, f1=8000); F('impact', T['good'] + 0.15, size=1.0, gain=0.5); F('bell', T['good'] + 0.25, f=1318.51, d=1.8, gain=0.32)
for j in range(3): F('pop', ws(30) + j * 0.12, f=1000 + 200 * j, gain=0.25)
for w in (34, 37, 43, 64, 70, 79, 86):          # the callouts: a click, then the pop as the card grows out
    F('tick', ws(w) - 0.1, f=3200, level=0.5); F('pop', ws(w) + 0.15, f=900, gain=0.28)
F('pop', ws(83), f=1300, gain=0.3); F('pop', ws(88), f=1300, gain=0.3)
run(T['replay'] - 0.25, T['future'] + 0.5 - T['replay'] + 0.25, 20, 2000, 10, 0.12)
F('riser', T['future'], d=1.6, gain=0.16, f0=200, f1=3000)
F('pop', ws(57), f=1100, gain=0.3); F('pop', ws(59), f=1250, gain=0.3)
F('tick', ws(66) - 0.1, f=3000, level=0.5); F('pop', ws(66), f=800, gain=0.3)
run(ws(67) + 0.15, T['costs'] - 0.35 - ws(67) - 0.15, 15, 1800, 20, 0.12); F('bell', T['costs'] - 0.35, f=1567.98, d=1.2, gain=0.25)
F('riser', T['weekend'] - 0.4, d=1.2, gain=0.2, f0=200, f1=6000); F('impact', T['weekend'] + 0.6, size=0.7, gain=0.35)
for j in range(5): F('tick', ws(105) - 0.1 + j * 0.1, f=2600, level=0.45)
F('pop', ws(106), f=1400, gain=0.35); F('pop', ws(112) - 0.1, f=900, gain=0.35); F('bell', ws(112), f=1046.5, d=1.2, gain=0.22)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1318.51, d=2.0, gain=0.3)
BAR = round(60 / 112 * 4, 4)
spec = {'seed': 47, 'dur': DUR, 'grid0': 0.0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Em', 'C', 'G', 'D'],
        'groove': [[T['good'], T['weekend']], [T['cta'], DUR - 0.6]], 'full': [[T['fa'], T['trade']], [T['analytics'], T['weekend']]],
        'clap': [[T['fa'], T['weekend']], [T['cta'], DUR - 0.6]], 'dark': [[0, T['good'] - 0.3]],
        'arp': [[0, T['good']], [T['weekend'], T['cta']], [T['end'], DUR]], 'hats': [[T['fa'], T['weekend']], [T['cta'], DUR - 1.0]],
        'outro_bass': [T['weekend'], T['cta']], 'rolls': [[T['good'] - 0.9, T['good'] - 0.05]], 'fx': fx, 'ticks': ticks}
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
