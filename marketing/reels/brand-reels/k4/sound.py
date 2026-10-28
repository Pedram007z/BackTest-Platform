# k4's sound: an original groove from ../../reelkit/soundgen.py (A minor, 120 BPM, Am–F–C–G, a bar landing on
# «بک‌تست‌لب») under the user's voice. A soft arp and a locked thud for the window that won't open; a click and a bell as
# the lock opens on «همینجاست»; three fail ticks as the card, the VPN and the dollar are crossed out; a hit and the full
# groove from «بک‌تست‌لب»; ticks on each ring (the date, the data range, the timeframes, the line, the Fibonacci, the
# indicators, «برو به», London, New York, the flags, the card); the replay's candles; the spread and commission; a bell on
# «جواب میده» and a fail on «نه»; the payment, «شروع رایگان», the link; the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[174.61, 220.0, 261.63, 349.23], 43.65],
      'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('fix', 'pains', 'brand', 'replay', 'tf', 'draw', 'goto', 'news', 'trade', 'analytics', 'cta', 'end'): F('whoosh', T[k], gain=0.26)
# the window that won't open
run(0.1, 2.0, 14, 1800, 8, 0.08); F('impact', ws(6), size=0.6, gain=0.4); F('fail', ws(7), gain=0.28); F('pop', ws(7) + 0.05, f=900, gain=0.28)
# the key and the lock opening
F('tick', ws(10) - 0.1, f=3200, level=0.5); F('bell', ws(10) + 0.1, f=1318.51, d=1.4, gain=0.3); F('pop', ws(11), f=1200, gain=0.3)
# no foreign card, no VPN, no dollars
for x in (ws(12), ws(16), ws(19)): F('pop', x, f=1000, gain=0.28); F('tick', x + 0.3, f=2300, level=0.4)
# BacktestLab: Persian, the Jalali date, Tehran
F('impact', ws(22), size=0.9, gain=0.5); F('bell', ws(22) + 0.1, f=1760.0, d=1.6, gain=0.28)
for x in (ws(28), ws(30), ws(34)): F('tick', x, f=2600, level=0.45)
# 2015 to now, then the replay with the future covered
F('tick', ws(38), f=2600, level=0.45); F('pop', ws(39), f=1200, gain=0.3); F('pop', ws(41), f=1400, gain=0.3)
run(ws(42), T['tf'] - ws(42) - 0.2, 14, 1900, 10, 0.1); F('downlifter', ws(45), d=0.8, gain=0.18); F('pop', ws(45) + 0.3, f=900, gain=0.3)
# 1 minute to daily
F('tick', ws(54), f=2600, level=0.45); F('riser', ws(54) + 0.1, d=ws(57) - ws(54), gain=0.14, f0=500, f1=2500); F('tick', ws(57), f=3000, level=0.45)
# a line, Fibonacci, indicators
for x in (ws(60), ws(62), ws(64)): F('pop', x, f=1100, gain=0.3)
# «برو به», London, New York
F('tick', ws(69), f=3000, level=0.5); F('pop', ws(75), f=1200, gain=0.3); F('pop', ws(77), f=1400, gain=0.3)
# the flags, the card: its Persian name and the exact time
for x in (ws(83), ws(83) + 0.15, ws(84)): F('tick', x, f=2400, level=0.45)
F('whoosh', ws(85) - 0.15, gain=0.16); F('pop', ws(87), f=1200, gain=0.3); F('pop', ws(90), f=1400, gain=0.3)
# spread and commission, the trade
F('tick', ws(93), f=2600, level=0.45); F('tick', ws(95), f=2600, level=0.45); F('pop', ws(96), f=1000, gain=0.3); F('tick', ws(97), f=3000, level=0.45)
# does it work or not
F('tick', ws(104), f=2600, level=0.45); F('bell', ws(107), f=1318.51, d=1.2, gain=0.26); F('fail', ws(109), gain=0.22)
# rial payment, the free start, the link
F('pop', ws(111), f=1100, gain=0.3); F('pop', ws(114), f=1400, gain=0.32); F('tick', ws(115), f=3200, level=0.5)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1318.51, d=2.0, gain=0.3)
BAR = round(60 / 120 * 4, 4); G0 = round(T['brand'] % BAR, 4)
spec = {'seed': 29, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Am', 'F', 'C', 'G'],
        'groove': [[T['pains'], T['brand'] - 0.6], [T['brand'], DUR - 0.6]],
        'full': [[T['brand'], T['news']], [T['analytics'], T['end']]],
        'clap': [[T['brand'], DUR - 0.6]], 'dark': [[T['pains'], T['brand'] - 0.6]],
        'arp': [[0, T['pains']], [T['tf'], T['goto']], [T['end'], DUR]], 'hats': [[T['pains'], DUR - 1.0]],
        'outro_bass': [T['news'], T['analytics']], 'rolls': [[T['brand'] - 0.7, T['brand'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
