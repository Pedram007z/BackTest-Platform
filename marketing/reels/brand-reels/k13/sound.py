# k13's sound: an original groove from ../../reelkit/soundgen.py under the user's voice (voice/vo.wav), D minor, 122 BPM,
# Dm–B♭–F–C, with a bar landing on «می‌مونه». The effects:
#   - a pop for the profit, the dice landing, a falling tone as the «شانس» battery runs down;
#   - a hit on «سخته», pops for the two account cards and the «=» between them, a hit on «سبزن»;
#   - ten quick ticks for the ten wins and a fail on «معلوم نمی‌شه»;
#   - a riser as the count rolls from 10 to 200, ticks as the grid fills;
#   - a falling tone for luck and a bell for the strategy;
#   - slow ticks for the live market, pops for the months, a fail on «پول واقعی»;
#   - the replay's ticks, a pop for the planned trade, a bell when the balance is ringed;
#   - a bell for «راحت», a pop for «الان», a hit and a falling tone on «تموم شد»;
#   - the free start, the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Dm': [[220.0, 293.66, 349.23, 440.0], 73.42], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27],
      'F': [[174.61, 220.0, 261.63, 349.23], 43.65], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('luck', 'same', 'ten', 'tangle', 'diff', 'two', 'live', 'lab', 'norisk', 'ifs', 'ifl', 'cta', 'end'): F('whoosh', T[k], gain=0.24)
# the profit and the rules; the dice; the battery running down
F('pop', 0.08, f=1200, gain=0.3); F('impact', 0.05, size=0.5, gain=0.3)
for j in range(3): F('tick', 0.5 + 0.12 * j, f=2600 + 200 * j, level=0.3)
F('impact', T['luck'] + 0.25, size=0.6, gain=0.35); F('tick', T['luck'] + 0.4, f=1800, level=0.4)
F('downlifter', ws(7), d=ws(10) + 0.35 - ws(7), gain=0.16); F('fail', ws(10) + 0.25, gain=0.14)
# «سخته»; the same two cards; «سبزن»
F('impact', T['hard'], size=0.7, gain=0.4); F('pop', ws(12), f=700, gain=0.26)
F('pop', ws(15), f=1000, gain=0.26); F('pop', ws(18), f=1200, gain=0.26); F('bell', ws(21), f=1174.66, d=1.0, gain=0.22)
F('impact', T['green'], size=0.9, gain=0.5); F('pop', ws(25), f=1400, gain=0.3)
# ten wins, and still a question
run(ws(27) - 0.1, 0.7, 10, 2400, 40, 0.14); F('impact', ws(31), size=0.7, gain=0.4); F('fail', ws(32), gain=0.16)
# tangled; 10 → 200
F('riser', ws(34), d=ws(41) - ws(34), gain=0.08, f0=500, f1=1400); F('pop', ws(36), f=900, gain=0.22); F('pop', ws(38), f=1100, gain=0.22); F('pop', ws(41), f=700, gain=0.26)
F('riser', ws(48), d=ws(50) + 0.45 - ws(48), gain=0.14, f0=400, f1=3200); run(ws(48), ws(50) + 0.4 - ws(48), 16, 2000, 60, 0.1); F('impact', ws(50) + 0.4, size=0.6, gain=0.35)
# luck fades, the strategy stays
F('riser', T['two'] + 0.15, d=ws(54) - T['two'], gain=0.08, f0=400, f1=1600); F('downlifter', ws(54), d=0.8, gain=0.16); F('fail', ws(55), gain=0.14)
F('pop', ws(58), f=1300, gain=0.28); F('impact', ws(59), size=1.0, gain=0.5); F('bell', ws(59) + 0.05, f=1760.0, d=1.4, gain=0.26)
# the live market: slow ticks, the months, real money
F('pop', ws(62), f=800, gain=0.24); run(ws(63), ws(67) - ws(63), 4, 1500, 0, 0.12)
for j in range(4): F('pop', ws(67) - 0.08 + 0.13 * j, f=1000 + 120 * j, gain=0.22)
F('pop', ws(71), f=700, gain=0.26); F('impact', ws(72), size=0.7, gain=0.4); F('fail', ws(72) + 0.05, gain=0.14)
# the replay; the planned trade; the trade played to its target; the balance
F('impact', ws(74), size=0.6, gain=0.35); run(T['lab'] + 0.15, ws(79) - T['lab'] - 0.2, 6, 1900, 10, 0.08)
F('pop', ws(79), f=1200, gain=0.28); F('pop', ws(80), f=1500, gain=0.24); F('tick', ws(83), f=3200, level=0.45)
run(T['norisk'], ws(87) - T['norisk'], 16, 2000, 15, 0.07); F('pop', ws(88), f=1300, gain=0.3); F('bell', ws(89), f=2349.32, d=1.2, gain=0.24)
# the strategy; the lucky trader, now; too late
F('riser', T['ifs'] + 0.05, d=1.1, gain=0.08, f0=500, f1=2000); F('bell', ws(93), f=1760.0, d=1.2, gain=0.24)
F('tick', ws(97), f=1800, level=0.4); F('downlifter', ws(99), d=1.2, gain=0.1); F('pop', ws(100), f=1400, gain=0.3)
F('impact', T['late'], size=0.8, gain=0.45); F('downlifter', T['late'], d=ws(105) - T['late'] + 0.2, gain=0.16); F('impact', ws(105), size=1.0, gain=0.55); F('fail', ws(105) + 0.05, gain=0.18)
# the free start, the link, the end card
F('pop', ws(108), f=1300, gain=0.3); F('pop', ws(109), f=1500, gain=0.3)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1174.66, d=2.0, gain=0.3)
BAR = round(60 / 122 * 4, 4); G0 = round(ws(59) % BAR, 4)
spec = {'seed': 213, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Dm', 'Bb', 'F', 'C'],
        'groove': [[T['luck'] - 0.2, DUR - 0.6]],
        'full': [[T['diff'], T['live']], [T['lab'], T['late']]],
        'clap': [[T['same'], T['live']], [T['lab'], DUR - 0.6]], 'dark': [[T['live'], T['lab']], [T['late'], T['cta']]],
        'arp': [[0, T['luck']], [T['live'], T['lab']], [T['end'], DUR]], 'hats': [[T['luck'], DUR - 1.0]],
        'outro_bass': [T['live'], T['lab']], 'rolls': [[ws(59) - 0.6, ws(59) - 0.03]], 'fx': fx, 'ticks': ticks}
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
