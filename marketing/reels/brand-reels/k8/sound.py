# k8's sound: an original groove from ../../reelkit/soundgen.py under the user's voice (t1's cut: ../t1/voice/vo.wav),
# B minor, 122 BPM, Bm–G–D–A, with a bar landing on the brand reveal. The effects:
#   - pulses for the mystery tile;
#   - a hit and a bell for the brand;
#   - a big ✕ on «نیست»;
#   - pops and a scratch for each of the three things it isn't;
#   - a hit on the «۱» and a bell for the check;
#   - pops for ۲۰۱۵ and «امروز», a falling tone into the covered future;
#   - the cursor's click on «خرید»;
#   - ticks on the trade's fields;
#   - the replay's run;
#   - a tick run as the decisions fill the wall;
#   - the gift's rattle, a hit and a bell as it opens;
#   - the free start, the link, the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Bm': [[185.0, 246.94, 293.66, 369.99], 61.74], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0],
      'D': [[220.0, 293.66, 369.99, 440.0], 73.42], 'A': [[220.0, 277.18, 329.63, 440.0], 55.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('intro', 'nots', 'signal', 'one', 'market', 'blind', 'you', 'trade', 'forward', 'again', 'gift', 'exp', 'cta', 'end'): F('whoosh', T[k], gain=0.24)
# the mystery tile
for x in (0.3, 1.1, 1.9): F('pop', x, f=700, gain=0.18)
F('pop', ws(6), f=900, gain=0.28)
# the brand
F('impact', ws(9), size=0.9, gain=0.5); F('bell', ws(9) + 0.1, f=1479.98, d=1.6, gain=0.26); F('pop', ws(13), f=1200, gain=0.28); F('pop', ws(16), f=1400, gain=0.28)
# what it isn't
F('impact', ws(23), size=0.8, gain=0.48)
for a, b in ((24, 25), (27, 30), (32, 34)): F('pop', ws(a), f=1000, gain=0.26); F('tick', ws(b), f=3800, level=0.5); F('fail', ws(b) + 0.15, gain=0.18)
# one thing, done right
F('impact', ws(37), size=1.0, gain=0.55); F('bell', ws(42), f=1479.98, d=1.4, gain=0.26)
# 2015 to today, the future covered
F('pop', ws(47), f=1100, gain=0.28); F('riser', ws(48), d=ws(52) - ws(48), gain=0.12, f0=400, f1=2400); F('pop', ws(52), f=1500, gain=0.3)
run(T['blind'], T['you'] - T['blind'] - 0.2, 10, 1900, 10, 0.08); F('downlifter', ws(60) - 0.1, d=0.8, gain=0.18); F('pop', ws(60) + 0.3, f=900, gain=0.26)
# your call: buy
F('pop', ws(67), f=1200, gain=0.28); F('tick', ws(69), f=3400, level=0.6); F('bell', ws(69) + 0.1, f=1975.53, d=1.0, gain=0.2)
# the trade
for i in (70, 73, 78, 80): F('tick', ws(i), f=2600 + 20 * i, level=0.45)
F('pop', ws(81), f=1300, gain=0.28)
# the replay runs on
run(T['forward'], ws(96) - T['forward'], 15, 1800, 10, 0.08); F('pop', ws(91), f=1200, gain=0.28)
# decisions, again and again
run(ws(99) - 0.1, ws(103) + 0.5 - ws(99), 30, 1700, 40, 0.15)
# the gift
run(T['gift'], 1.6, 8, 900, 0, 0.12); F('pop', ws(110), f=1000, gain=0.26); F('tick', ws(113), f=3800, level=0.5)
F('impact', ws(115), size=0.9, gain=0.5); F('bell', ws(115) + 0.1, f=1479.98, d=2.0, gain=0.3); F('pop', ws(116), f=1400, gain=0.3)
# the free start, the link
F('pop', ws(118), f=1300, gain=0.3); F('pop', ws(119), f=1500, gain=0.3)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1479.98, d=2.0, gain=0.3)
BAR = round(60 / 122 * 4, 4); G0 = round(ws(9) % BAR, 4)
spec = {'seed': 131, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Bm', 'G', 'D', 'A'],
        'groove': [[T['nots'] - 0.2, T['blind'] - 0.2], [T['you'], DUR - 0.6]],
        'full': [[T['one'], T['blind']], [T['trade'], T['end']]],
        'clap': [[T['one'], DUR - 0.6]], 'dark': [[T['nots'] - 0.2, T['one']]],
        'arp': [[0, T['nots']], [T['blind'], T['you']], [T['end'], DUR]], 'hats': [[T['intro'], DUR - 1.0]],
        'outro_bass': [T['blind'], T['you']], 'rolls': [[T['one'] - 0.6, T['one'] - 0.03]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('../t1/voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
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
