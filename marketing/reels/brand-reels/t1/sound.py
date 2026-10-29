# t1's sound: an original percussive score from ../../reelkit/soundgen.py under the user's voice (D minor, 118 BPM,
# Dm–F–C–Bb, with a bar landing on «فقط یه کار»). The effects:
#   - ticks as the big words land;
#   - a scratch on each strike-through and a fall as the struck words drop;
#   - a hit on the giant «۱», a bell for the tick;
#   - a riser from ۲۰۱۵ to «امروز»;
#   - a thud as «آینده» is redacted, a hit on «تو»;
#   - ticks on the trade's fields;
#   - a tick run that speeds up as «تصمیم» multiplies;
#   - near-silence, then a bell, for «تجربه‌ی خودت»;
#   - the free start, the link, the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Dm': [[220.0, 293.66, 349.23, 440.0], 73.42], 'F': [[174.61, 220.0, 261.63, 349.23], 43.65],
      'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('intro', 'nots', 'signal', 'one', 'market', 'blind', 'you', 'trade', 'forward', 'again', 'gift', 'cta'): F('whoosh', T[k], gain=0.16)
# the question
F('tick', ws(2), f=2400, level=0.5); F('pop', ws(6) + 0.05, f=900, gain=0.3)
# what it is, what it can do
for i in (7, 9, 14, 17): F('tick', ws(i), f=2200 + 60 * i, level=0.35)
F('impact', ws(13), size=0.5, gain=0.35)
# what it's not: three strikes, then they fall
F('impact', ws(23), size=0.7, gain=0.42)
for i in (24, 29, 32): F('tick', ws(i), f=2400, level=0.4)
for i in (25, 30, 34): F('tick', ws(i), f=3800, level=0.55); F('pop', ws(i) + 0.03, f=380, gain=0.3)
F('downlifter', T['one'] - 0.35, d=0.5, gain=0.22)
# just one thing, done right
F('impact', ws(37), size=1.0, gain=0.55); F('bell', ws(42) + 0.15, f=1174.66, d=1.4, gain=0.26)
# the real market from 2015 to today
F('pop', ws(47), f=1000, gain=0.28); F('riser', ws(48), d=ws(52) - ws(48), gain=0.14, f0=400, f1=2400); F('pop', ws(52), f=1500, gain=0.3); F('tick', ws(50), f=2800, level=0.45)
# the future, redacted
F('impact', ws(60) + 0.22, size=0.5, gain=0.4)
# now you decide
F('impact', ws(67), size=1.0, gain=0.55); F('bell', ws(67) + 0.05, f=1760.0, d=1.2, gain=0.2)
# the trade
for i in (70, 73, 78, 80): F('tick', ws(i), f=2600 + 20 * i, level=0.45)
F('pop', ws(81), f=1300, gain=0.3)
# the market moves on
run(ws(82), ws(96) - ws(82), 14, 1800, 10, 0.08); F('pop', ws(90), f=1200, gain=0.26)
# again, and again
run(ws(99), ws(103) + 0.3 - ws(99), 44, 1600, 40, 0.16)
# no signal seller gives you this
F('tick', ws(110), f=2400, level=0.45); F('tick', ws(113), f=3800, level=0.55); F('pop', ws(113) + 0.03, f=380, gain=0.3)
# your own experience
F('impact', ws(115), size=0.9, gain=0.5); F('bell', ws(115) + 0.05, f=1174.66, d=2.2, gain=0.3); F('bell', ws(116), f=1760.0, d=2.0, gain=0.24)
# the free start, the link
F('pop', ws(118), f=1300, gain=0.3); F('tick', ws(119), f=3000, level=0.45)
F('impact', T['end'], size=0.7, gain=0.4); F('bell', T['end'] + 0.45, f=1174.66, d=2.0, gain=0.28)
BAR = round(60 / 118 * 4, 4); G0 = round(ws(37) % BAR, 4)
spec = {'seed': 113, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Dm', 'F', 'C', 'Bb'],
        'groove': [[T['nots'], T['blind'] - 0.1], [T['trade'], T['exp'] - 0.05], [T['cta'], DUR - 0.6]],
        'full': [[T['one'], T['blind']], [T['forward'], T['exp']]],
        'clap': [[T['one'], T['blind']], [T['trade'], T['exp'] - 0.05]], 'dark': [[T['nots'], T['one']]],
        'arp': [[0, T['nots']], [T['blind'], T['trade']], [T['cta'], DUR]], 'hats': [[0, T['exp'] - 0.1], [T['cta'], DUR - 1.0]],
        'outro_bass': [T['blind'], T['trade']], 'rolls': [[T['one'] - 0.6, T['one'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
