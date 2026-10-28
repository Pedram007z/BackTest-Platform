# k3's sound: an original bright groove from ../../reelkit/soundgen.py (F major, 116 BPM, F–C–G–Am, a bar landing on
# «توی بک‌تست‌لب») under the user's voice, to suit the light look. A soft arp for the question with pops as the calendar page,
# the flags, the hour and the date land; a hit and a bell on «بک‌تست‌لب»; a darker filtered groove under the half-blind
# backtest and the NFP candle (a riser as it spikes, a hit on «NFP»); a snare roll into the reveal and the full groove from
# there; ticks on each flag, the cursor and the time zones; ticks as the replay walks to the dashed line; the lock opening
# on «لحظه»; the calendar's rings; the link tapped; the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'F': [[174.61, 220.0, 261.63, 349.23], 43.65], 'C': [[164.81, 196.0, 261.63, 329.63], 65.41],
      'G': [[196.0, 246.94, 293.66, 392.0], 49.0], 'Am': [[164.81, 220.0, 261.63, 329.63], 55.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('brand', 'half', 'candle', 'flags', 'colors', 'hover', 'future', 'actual', 'panel', 'test', 'cta', 'end'): F('whoosh', T[k], gain=0.24)
# the hook: the calendar page, the two flags, the hour, the date, the question
F('pop', ws(4), f=900, gain=0.3); F('pop', ws(9), f=1200, gain=0.28); F('pop', ws(9) + 0.2, f=1400, gain=0.28)
F('tick', ws(10), f=2600, level=0.4); F('tick', ws(12), f=2900, level=0.4); F('pop', ws(17), f=1000, gain=0.3)
# «صد البته بک‌تست‌لب»
F('impact', ws(20), size=0.8, gain=0.45); F('bell', ws(20) + 0.1, f=1396.91, d=1.6, gain=0.3)
# half a backtest: the piece «خبر» and the «۵۰٪» stamp
F('pop', ws(24), f=800, gain=0.3); F('impact', ws(25), size=0.5, gain=0.32)
# the NFP candle: the replay steps, the spike, the flag and its card
run(T['candle'] + 0.1, ws(33) - T['candle'], 14, 1700, 10, 0.1); F('riser', ws(28) - 0.6, d=0.9, gain=0.2, f0=300, f1=3000)
F('impact', ws(38), size=1.0, gain=0.55); F('pop', ws(38) + 0.1, f=1100, gain=0.3)
# the flags ringed on the real chart
for x in (ws(48), ws(48) + 0.15, ws(49)): F('tick', x, f=2400, level=0.45)
F('pop', ws(50), f=1200, gain=0.28)
# red = high, orange = medium
F('pop', ws(52), f=1300, gain=0.32); F('pop', ws(56), f=1000, gain=0.32)
# the hover card: the cursor, the Persian title, Tehran; the time zones; New York
F('tick', T['hover'] + 0.6, f=3200, level=0.45); F('pop', ws(66), f=1200, gain=0.28); F('pop', ws(71), f=1400, gain=0.28)
F('whoosh', ws(74) - 0.1, gain=0.18); F('tick', ws(75), f=2600, level=0.4); F('pop', ws(78), f=1100, gain=0.3)
# the coming news: the replay walks to the dashed line
F('pop', ws(85), f=1300, gain=0.3); run(T['future'] + 0.2, ws(96) - T['future'], 13, 1900, 12, 0.12); F('bell', ws(96), f=1174.66, d=1.2, gain=0.24)
# the locked «عدد واقعی»: the playhead walks, the lock opens on «لحظه»
run(ws(102), ws(107) - ws(102), 10, 2400, 15, 0.1); F('bell', ws(107), f=1396.91, d=1.4, gain=0.3)
# the calendar's rings
for x in (ws(122), ws(122) + 0.2, ws(126), ws(128)): F('tick', x, f=2500, level=0.42)
# around the news: before, during, after
for j, x in enumerate((ws(134), ws(135), ws(136))): F('pop', x, f=900 + 200 * j, gain=0.28)
F('pop', ws(137), f=1300, gain=0.28)
# the call: «اشتراک حرفه‌ای», the link tapped
F('pop', ws(142), f=1200, gain=0.3); F('tick', ws(145), f=3200, level=0.5); F('bell', ws(145) + 0.15, f=1396.91, d=1.4, gain=0.26)
F('impact', T['end'], size=0.7, gain=0.38); F('bell', T['end'] + 0.45, f=1174.66, d=2.0, gain=0.3)
BAR = round(60 / 116 * 4, 4); G0 = round(T['flags'] % BAR, 4)
spec = {'seed': 61, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['F', 'C', 'G', 'Am'],
        'groove': [[T['half'], T['flags'] - 0.6], [T['flags'], T['actual']], [T['panel'], DUR - 0.6]],
        'full': [[T['flags'], T['actual']], [T['test'], T['end']]],
        'clap': [[T['flags'], T['actual']], [T['panel'], DUR - 0.6]], 'dark': [[T['half'], T['flags'] - 0.6]],
        'arp': [[0, T['half']], [T['hover'], T['future']], [T['actual'], T['panel']], [T['end'], DUR]], 'hats': [[T['half'], DUR - 1.0]],
        'outro_bass': [T['actual'], T['panel']], 'rolls': [[T['flags'] - 0.7, T['flags'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
