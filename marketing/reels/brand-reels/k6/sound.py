# k6's sound: an original groove from ../../reelkit/soundgen.py under the user's voice (E minor, 124 BPM, Em–C–G–D,
# with a bar landing on «بک‌تست‌لب»). The effects:
#   - a soft arp while the equity line climbs, then a hit and a drop on «خودکشی»;
#   - a pop for each line of the plan, and a fail as «بک‌تست» is crossed out;
#   - a fast clock and a falling tone while the capital drains, then a thud on «بدیم»;
#   - a riser into «راه‌حل» and a bell for the light bulb;
#   - a hit, a bell and the full groove from «بک‌تست‌لب»;
#   - three deals and four swishes for the shuffled cards;
#   - ticks on the rules and the checklist, a bell on «ذخیره»;
#   - a pop for each test session, ticks on the analytics filter;
#   - a bell on «سود» and a fail on «اعصابتو»;
#   - a hit for the winner, then «شروع رایگان», the link and the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Em': [[196.0, 246.94, 329.63, 392.0], 41.2], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41],
      'G': [[196.0, 246.94, 293.66, 392.0], 49.0], 'D': [[220.0, 293.66, 369.99, 440.0], 73.42]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('plan', 'lose', 'but', 'brand', 'three', 'save', 'test', 'analytics', 'verdict', 'winner', 'cta', 'end'): F('whoosh', T[k], gain=0.26)
# the equity line climbs, then crashes on «خودکشی»
F('impact', ws(5), size=0.9, gain=0.55); F('downlifter', ws(5), d=1.2, gain=0.3); F('pop', ws(6) + 0.05, f=900, gain=0.28)
# the plan: no backtest, into the market
F('pop', ws(9), f=1000, gain=0.28); F('fail', ws(12) + 0.1, gain=0.26); F('pop', ws(14), f=1200, gain=0.28); F('tick', ws(16), f=3000, level=0.45)
# the clock runs, the capital drains to zero
run(ws(19), ws(28) - ws(19), 26, 2600, 12, 0.14); F('downlifter', ws(23), d=ws(28) - ws(23) + 0.3, gain=0.22); F('impact', ws(28) + 0.12, size=0.7, gain=0.45)
# «اما اگه نخوایم، راه‌حل چیه؟»: a riser into the light bulb
F('riser', T['but'] + 0.1, d=ws(32) - T['but'] - 0.1, gain=0.18, f0=400, f1=3000); F('bell', ws(32), f=1318.51, d=1.4, gain=0.3)
# BacktestLab
F('impact', ws(37), size=1.0, gain=0.55); F('bell', ws(37) + 0.1, f=1975.53, d=1.6, gain=0.26); F('tick', ws(39), f=2800, level=0.4)
# three cards dealt, flipped, shuffled
for i in range(3): F('pop', ws(47 + i), f=900 + 150 * i, gain=0.28)
F('tick', ws(52) - 0.05, f=3200, level=0.45)
s0, s1 = ws(53) - 0.05, ws(56) + 0.1
for q in range(4): F('whoosh', s0 + q * (s1 - s0) / 4 + 0.15, gain=0.14)
F('pop', ws(56), f=1400, gain=0.3)
# the rules, the checklist, saved
F('tick', ws(61), f=2600, level=0.45); F('tick', ws(63), f=2800, level=0.45); F('pop', ws(67), f=1200, gain=0.3); F('bell', ws(67) + 0.05, f=1567.98, d=1.0, gain=0.22)
# the three test sessions
for x in (ws(69) + 0.05, ws(71), ws(73)): F('pop', x, f=1000, gain=0.28)
# the analytics: the filter, the winner alone
F('tick', ws(79), f=2600, level=0.45); F('pop', ws(81), f=1200, gain=0.3); F('tick', ws(82), f=3000, level=0.45)
# the verdict: the profit, the nerves
F('bell', ws(84), f=1318.51, d=1.2, gain=0.28); F('pop', ws(85), f=1300, gain=0.28); F('fail', ws(89), gain=0.26); F('tick', ws(89) + 0.2, f=2000, level=0.4)
# only the winner goes in
F('impact', ws(93), size=0.8, gain=0.45); F('bell', ws(93) + 0.08, f=1567.98, d=1.4, gain=0.26); F('pop', ws(94), f=1400, gain=0.3)
# the free start, the link, the end card
F('pop', ws(98), f=1100, gain=0.3); F('pop', ws(99), f=1400, gain=0.32); F('tick', ws(100), f=3200, level=0.5)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1318.51, d=2.0, gain=0.3)
BAR = round(60 / 124 * 4, 4); G0 = round(T['brand'] % BAR, 4)
spec = {'seed': 61, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Em', 'C', 'G', 'D'],
        'groove': [[T['lose'], T['but'] - 0.2], [T['brand'], DUR - 0.6]],
        'full': [[T['brand'], T['save']], [T['verdict'], T['end']]],
        'clap': [[T['brand'], DUR - 0.6]], 'dark': [[T['lose'], T['but'] - 0.2]],
        'arp': [[0, T['lose']], [T['save'], T['verdict']], [T['end'], DUR]], 'hats': [[T['plan'], DUR - 1.0]],
        'outro_bass': [T['but'], T['brand'] - 0.1], 'rolls': [[T['brand'] - 0.7, T['brand'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
