# k21's sound: a soft, warm original groove from ../../reelkit/soundgen.py (E♭, 84 BPM, E♭–Cm–A♭–B♭), kept low under the
# user's voice at its normal speed (voice/vo.wav), with small pops as the wall's headlines and icons appear, a soft swish
# on each cut, a ding for «راحت» and «فهمیدی», ticks as the 50 squares fill, and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
CH = {'Eb': [[196.0, 233.08, 311.13, 392.0], 38.89], 'Cm': [[196.0, 261.63, 311.13, 392.0], 65.41],
      'Ab': [[207.65, 261.63, 311.13, 415.30], 51.91], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
SHOTS = [1.7, 3.38, T['see'] - 0.05, T['three'] - 0.05, T['a1'] - 0.05, ws(29) - 0.12, T['a2'] - 0.05, ws(42) - 0.1, T['a3'] - 0.05, ws(59) - 0.1, T['all'] - 0.05, T['week'] - 0.05, T['lab'] - 0.06, T['cta'] - 0.06]
for t in SHOTS: F('whoosh', t - 0.03, gain=0.07)
for t in (T['see'], T['three'], T['a1'], T['a2'], T['a3'], T['all'], T['week'], T['lab'], T['cta']): F('pop', t, f=900, gain=0.16)
F('pop', ws(2), f=1200, gain=0.18); F('pop', ws(8), f=800, gain=0.18); F('pop', ws(13), f=1000, gain=0.16)
for j in range(3): F('pop', ws(18) + 0.12 * j, f=900 + 200 * j, gain=0.18)
F('bell', ws(29), f=1567.98, d=1.0, gain=0.16); F('pop', ws(39), f=1000, gain=0.16); F('downlifter', ws(44) - 0.05, d=0.6, gain=0.06)
F('pop', ws(57), f=1100, gain=0.16); F('bell', ws(59), f=2093.0, d=1.0, gain=0.18)
for j in range(3): F('pop', ws(61) + 0.1 * j, f=1000 + 150 * j, gain=0.14)
F('whoosh', ws(65) - 0.05, gain=0.1); F('bell', ws(65) + 0.05, f=1567.98, d=1.2, gain=0.16)
run(ws(69), 1.1, 50, 2400, 8, 0.05); F('pop', ws(77), f=1400, gain=0.18)
F('pop', ws(81), f=1300, gain=0.16); F('bell', T['end'] + 0.3, f=1244.51, d=2.0, gain=0.2)
BAR = round(60 / 84 * 4, 4); G0 = round(ws(65) % BAR, 4)
spec = {'seed': 2121, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['Eb', 'Cm', 'Ab', 'Bb'],
        'groove': [[0.6, DUR - 0.8]], 'full': [[T['a1'], T['all']], [T['week'], T['end']]], 'clap': [[T['a1'], T['all']], [T['week'], DUR - 0.8]], 'dark': [[T['see'], T['three']]],
        'arp': [[0, T['three']], [T['all'], T['week']], [T['end'], DUR]], 'hats': [[T['three'], DUR - 1.2]], 'outro_bass': [T['all'], T['week']],
        'rolls': [], 'fx': fx, 'ticks': ticks}
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
