# k10's sound: an original groove from ../../reelkit/soundgen.py under the user's voice (voice/vo.wav), A minor, 108 BPM,
# Am–F–C–G, with a bar landing on «هست». The effects:
#   - a two-note chime as the message arrives, ticks as the calendar runs to a year;
#   - pops for the moon and the ticket's rows, a fail on the empty stop loss, the click on «باز کن»;
#   - a falling tone for the price, a riser for the hope arrow, a hit on «برنمی‌گرده»;
#   - the hourglass's clock ticks;
#   - the cards, a fail on «نیست», a hit and a bell on «هست»;
#   - pops for fear, greed and the pattern, and for the new dates;
#   - a hit on the «۱», the typing ticks;
#   - pops as the bills fly off, a fail on «شهریه‌ی گرون»;
#   - the replay's ticks and a bell on «بگیر»;
#   - the reply, the heart's bell, the pen's scratch;
#   - the brand, the free start, the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[174.61, 220.0, 261.63, 349.23], 43.65],
      'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('tonight', 'sure', 'waste', 'changed', 'same', 'one', 'money', 'past', 'thanks', 'sign', 'brand', 'cta', 'end'): F('whoosh', T[k], gain=0.24)
# the message arrives; the calendar runs to a year
F('pop', 0.06, f=1300, gain=0.3); F('pop', 0.2, f=1750, gain=0.28)
run(ws(2) - 0.05, ws(5) + 0.15 - ws(2), 12, 2400, 30, 0.1); F('bell', ws(5) + 0.2, f=1760.0, d=1.2, gain=0.22)
# tonight: the moon, the rows, the empty stop loss, the click
F('pop', ws(8), f=1100, gain=0.26)
for i in range(3): F('pop', T['tonight'] + 0.2 + i * 0.15, f=900 + 150 * i, gain=0.2)
F('fail', ws(13) + 0.05, gain=0.16); F('tick', ws(15), f=3600, level=0.4); F('tick', ws(16), f=3400, level=0.6)
# the fall, the hope, «برنمی‌گرده»
F('downlifter', T['sure'] + 0.05, d=1.1, gain=0.16); F('riser', ws(23) - 0.05, d=ws(25) + 0.2 - ws(23), gain=0.12, f0=500, f1=2600)
F('impact', ws(27), size=1.0, gain=0.6); F('downlifter', ws(26), d=1.0, gain=0.22)
# the hourglass
run(T['waste'] + 0.1, T['changed'] - T['waste'] - 0.3, 12, 1500, 0, 0.1); F('pop', ws(34), f=1200, gain=0.26); F('pop', ws(36), f=900, gain=0.26)
# before ≠ now; «هست»
F('pop', T['changed'] + 0.05, f=1000, gain=0.24); F('pop', T['changed'] + 0.19, f=1200, gain=0.24); F('fail', ws(43) + 0.05, gain=0.2)
F('impact', ws(44), size=0.9, gain=0.55); F('bell', ws(44) + 0.1, f=1760.0, d=1.6, gain=0.28)
# fear, greed, patterns; new dates
for i, f in ((46, 900), (48, 1100), (50, 1300)): F('pop', ws(i), f=f, gain=0.28)
for i in range(3): F('pop', ws(53) + i * 0.15, f=1400 + 150 * i, gain=0.24)
# one thing; typing
F('impact', ws(57), size=0.7, gain=0.45); F('bell', ws(57) + 0.1, f=1318.51, d=1.2, gain=0.22)
run(ws(63), T['money'] - ws(63) - 0.1, 14, 4200, 0, 0.05)
# the bills fly off
for i in range(9): F('pop', ws(72) + i * 0.1, f=700 + 60 * i, gain=0.14)
F('pop', ws(75), f=800, gain=0.28); F('fail', ws(75) + 0.15, gain=0.16)
# the real past market
run(T['past'], T['thanks'] - T['past'] - 0.2, 10, 1900, 10, 0.07); F('pop', ws(77), f=1200, gain=0.26); F('bell', ws(81), f=1760.0, d=1.4, gain=0.26)
# your reply, the heart, the signature
F('pop', ws(83), f=1100, gain=0.24); F('pop', ws(86), f=1300, gain=0.28); F('bell', ws(87) + 0.1, f=2093.0, d=1.4, gain=0.24)
run(ws(90), ws(91) + 0.5 - ws(90), 18, 5200, 200, 0.04)
# the brand, the free start, the end card
F('impact', ws(92), size=0.8, gain=0.45); F('bell', ws(92) + 0.1, f=1760.0, d=1.6, gain=0.26)
F('pop', ws(96), f=1300, gain=0.3); F('pop', ws(97), f=1500, gain=0.3)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1760.0, d=2.0, gain=0.3)
BAR = round(60 / 108 * 4, 4); G0 = round(ws(44) % BAR, 4)
spec = {'seed': 157, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Am', 'F', 'C', 'G'],
        'groove': [[T['tonight'] - 0.2, T['no']], [T['waste'], T['one']], [T['money'], DUR - 0.6]],
        'full': [[T['still'], T['one']], [T['past'], T['end']]],
        'clap': [[T['waste'], T['one']], [T['past'], DUR - 0.6]], 'dark': [[T['sure'], T['waste']], [T['money'], T['past']]],
        'arp': [[0, T['tonight']], [T['one'], T['money']], [T['end'], DUR]], 'hats': [[T['tonight'], DUR - 1.0]],
        'outro_bass': [T['one'], T['money']], 'rolls': [[T['still'] - 0.6, T['still'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
