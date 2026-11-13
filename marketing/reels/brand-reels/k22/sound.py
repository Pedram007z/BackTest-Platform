# k22's sound: a light, playful original groove from ../../reelkit/soundgen.py (C major, 100 BPM, C–G–Am–F), kept low
# under the user's voice at its normal speed (../k21/voice/vo.wav), and the world's own sounds: footsteps as he walks,
# the gate opening, a chime as he splits in three, the flag and the confetti, the backpack shrinking, the barrier
# dropping, the fog and the red ✕, fifty ticks as the tiles land, the billboard, the thumbs-up, the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
CH = {'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0],
      'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[174.61, 220.0, 261.63, 349.23], 43.65]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
steps = lambda t0, t1: run(t0, t1 - t0, max(2, int((t1 - t0) * 3.6)), 900, 0, 0.11)
# camera glides
for t in (T['see'], T['three'] - 0.1, T['a1'], T['a2'], T['a3'], T['all'], T['week'], T['lab'] - 0.05, T['cta']): F('whoosh', t, gain=0.1)
# the scared trader, the gate, the walk to the hub
F('pop', 0.1, f=900, gain=0.16); F('riser', ws(10), d=0.5, gain=0.07, f0=500, f1=1800); F('pop', ws(10) + 0.5, f=1300, gain=0.2)
steps(ws(10) + 0.15, T['three'] - 0.1)
# the split, the three walks, the signs
F('bell', ws(18) - 0.05, f=1567.98, d=1.2, gain=0.22); F('riser', ws(18) - 0.3, d=0.3, gain=0.08, f0=800, f1=3000)
for j in range(3): F('pop', ws(18) + 0.12 * j, f=900 + 200 * j, gain=0.18)
steps(ws(18) + 0.1, T['a1'] + 0.4)
# green: the flag, the confetti
F('whoosh', ws(23) - 0.1, gain=0.12); F('bell', ws(23) + 0.6, f=2093.0, d=0.8, gain=0.16); run(ws(29), 0.5, 10, 2600, 30, 0.08); F('pop', ws(29), f=1500, gain=0.2)
# amber: the backpack shrinks
F('downlifter', ws(44) - 0.05, d=0.5, gain=0.12); F('pop', ws(44) + 0.45, f=1100, gain=0.2)
# red: he walks to the edge, the barrier drops, the check
steps(T['a3'] + 0.3, ws(57)); F('impact', ws(57) + 0.05, size=0.6, gain=0.4); F('bell', ws(59), f=2093.0, d=1.0, gain=0.2)
# the fog, the ✕
steps(T['all'] + 0.1, ws(64) + 0.1); F('whoosh', ws(64), gain=0.12); F('impact', ws(65), size=0.7, gain=0.4); F('fail', ws(65) + 0.05, gain=0.1)
# fifty tiles, the walk to the lab, the billboard, the ring
run(ws(69) - 0.05, 1.5, 50, 2000, 6, 0.08); steps(ws(69) + 0.45, T['lab'] + 0.5); F('pop', T['lab'] + 0.2, f=1000, gain=0.2); F('pop', ws(77), f=1500, gain=0.22)
# the thumbs-up, the end card
F('bell', ws(80), f=1567.98, d=1.0, gain=0.2); F('pop', T['end'], f=1200, gain=0.2); F('bell', T['end'] + 0.35, f=1046.5, d=2.0, gain=0.24)
BAR = round(60 / 100 * 4, 4); G0 = round(ws(65) % BAR, 4)
spec = {'seed': 2222, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['C', 'G', 'Am', 'F'],
        'groove': [[T['see'] - 0.2, DUR - 0.8]], 'full': [[T['three'], T['all']], [T['week'], T['end']]], 'clap': [[T['a1'], T['all']], [T['week'], DUR - 0.8]], 'dark': [[0, T['see']]],
        'arp': [[0, DUR]], 'hats': [[T['three'], DUR - 1.2]], 'outro_bass': [T['all'], T['week']], 'rolls': [[ws(65) - 0.6, ws(65) - 0.03]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('../k21/voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
v = np.zeros(N); m_ = min(N, len(vo)); v[:m_] = vo[:m_]
env = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (env > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); out *= (1 - 0.5 * np.clip(act, 0, 1))[:, None]
out /= np.abs(out).max() + 1e-9; out *= 0.32
out += np.stack([v, v], 1) / (np.abs(v).max() + 1e-9) * 0.85
out = np.tanh(out * 1.2) / np.tanh(1.2)
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out * 0.97, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.8:attack=2:release=40:level=0")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
