# k16's sound: an original groove from ../../reelkit/soundgen.py under the user's voice (voice/vo.wav), C minor, 118 BPM,
# Cm–A♭–E♭–B♭, with a bar landing on «بهتره». The effects follow the 3D world:
#   - a whoosh on every camera flight;
#   - a hit as «می‌ترسی؟» pops out, pops for the question marks;
#   - the three tiles rising, a pop as each answer's tile hops;
#   - the knob ticking down on «ریسک کمتر»;
#   - the bill dropping toward the red tile and stopping short, a bell for the check;
#   - a swish for the strike through «ندونستن», a hit on «بهتره»;
#   - fifty quick ticks as the cubes land; the screen switching on, a pop for the planned trade;
#   - the logo, the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
CH = {'Cm': [[196.0, 261.63, 311.13, 392.0], 65.41], 'Ab': [[207.65, 261.63, 311.13, 415.30], 51.91],
      'Eb': [[196.0, 233.08, 311.13, 392.0], 38.89], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('see', 'three', 'a1', 'a2', 'a3', 'all', 'week', 'lab', 'cta', 'end'): F('whoosh', T[k] - 0.14, gain=0.26)
# the hook; the question marks
F('pop', 0.06, f=900, gain=0.22); F('impact', ws(8), size=0.8, gain=0.45); F('pop', ws(2), f=1200, gain=0.2)
for j in range(3): F('pop', T['see'] + 0.05 + 0.1 * j, f=800 + 200 * j, gain=0.22)
# «سه تا جواب»: the tiles rise; each answer's tile hops
F('impact', ws(18), size=0.6, gain=0.35)
for j in range(3): F('pop', ws(18) - 0.05 + 0.12 * j, f=700 + 250 * j, gain=0.26)
F('pop', ws(23), f=1300, gain=0.26); F('bell', ws(29), f=1567.98, d=1.0, gain=0.18)
F('pop', ws(34), f=1100, gain=0.26); run(ws(40) - 0.05, 0.45, 7, 2600, -120, 0.14)
F('pop', ws(49), f=900, gain=0.26); F('pop', ws(57), f=1200, gain=0.24); F('downlifter', ws(58), d=ws(59) - ws(58), gain=0.12); F('impact', ws(59), size=0.6, gain=0.4); F('bell', ws(59) + 0.04, f=2093.0, d=1.2, gain=0.24)
# all three; the strike; «بهتره»
for j in range(3): F('pop', ws(61) + 0.1 * j, f=900 + 200 * j, gain=0.22)
F('whoosh', ws(65) - 0.05, gain=0.16); F('impact', ws(65), size=0.9, gain=0.5); F('bell', ws(65) + 0.05, f=1567.98, d=1.4, gain=0.24)
# fifty cubes; the screen; the planned trade
run(ws(69) - 0.05, 1.0, 50, 2400, 8, 0.1); F('impact', ws(69) + 0.95, size=0.5, gain=0.3)
F('impact', ws(75), size=0.6, gain=0.35); run(T['lab'], ws(77) - T['lab'], 6, 1900, 10, 0.07); F('pop', ws(77), f=1500, gain=0.28)
# the logo; the free start; the end card
F('impact', T['cta'] + 0.05, size=0.6, gain=0.35); F('pop', ws(80), f=1300, gain=0.28); F('pop', ws(81), f=1500, gain=0.24)
F('bell', T['end'] + 0.3, f=1046.5, d=2.0, gain=0.28)
BAR = round(60 / 118 * 4, 4); G0 = round(ws(65) % BAR, 4)
spec = {'seed': 616, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Cm', 'Ab', 'Eb', 'Bb'],
        'groove': [[T['see'] - 0.2, DUR - 0.6]],
        'full': [[T['three'], T['all']], [T['week'], T['end']]],
        'clap': [[T['a1'], T['all']], [T['week'], DUR - 0.6]], 'dark': [[T['see'], T['three']], [T['a3'], T['all']]],
        'arp': [[0, T['see']], [T['all'], T['week']], [T['end'], DUR]], 'hats': [[T['three'], DUR - 1.0]],
        'outro_bass': [T['all'], T['week']], 'rolls': [[ws(65) - 0.6, ws(65) - 0.03]], 'fx': fx, 'ticks': ticks}
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
