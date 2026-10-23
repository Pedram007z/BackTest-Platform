# q3's sound: an original groove from ../../reelkit/soundgen.py (G minor, 120 BPM, Gm–E♭–B♭–F) under the user's voice:
# a hit on the first frame and on every colour cut, the ad sliding in and its «۹۰٪», the three question circles, a tick
# per winning trade and a rush of ticks as the other 190 appear, the screenshot zooming out to the red months, a tick per
# month at ×1.9 climbing to a hit on $2.2M, a hit on «می‌فروشه؟» and on the «تست‌نشده» stamp, the logo, a tick per year
# of NAS100 candles, the gauges, the struck-out «اسکرین‌شات», and the end card.
# Everything steps back under the voice (voice/vo.wav).   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
lerp = lambda a, b, k: a + (b - a) * k
CH = {'Gm': [[196.0, 233.08, 293.66, 392.0], 49.0], 'Eb': [[196.0, 233.08, 311.13, 392.0], 77.78],
      'Bb': [[174.61, 233.08, 293.66, 349.23], 58.27], 'F': [[174.61, 220.0, 261.63, 349.23], 43.65]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
mon = lambda i: lerp(ws(67), ws(75), (i - 1) / 11)                          # scenes.js mon()
F('impact', 0.02, size=0.8, gain=0.5)
for k in ('three', 'q1', 'q2', 'q3', 'why', 'test', 'brand', 'years', 'stats', 'trust', 'end'): F('whoosh', T[k], gain=0.3)
F('whoosh', ws(2) - 0.1, gain=0.25); F('pop', ws(2), f=800, gain=0.3); F('pop', ws(4), f=1200, gain=0.4); F('riser', ws(6), d=0.5, gain=0.2)
for i in range(3): F('pop', ws(17) + i * 0.1, f=700 + 150 * i, gain=0.35); F('tick', ws(18) + i * 0.08, f=2000 + 200 * i, level=0.35)
for i in range(10): F('tick', ws(30) + i * 0.04, f=1800 + 40 * i, level=0.3)
run(ws(34), 0.55, 60, 2600, 6, 0.08); F('pop', ws(34) + 0.6, f=1000, gain=0.3)
F('pop', ws(40), f=600, gain=0.35); F('downlifter', ws(53) - 0.05, d=0.7, gain=0.35); F('impact', ws(53) + 0.25, size=0.9, gain=0.5); F('fail', ws(54), gain=0.3)
F('pop', ws(62), f=1000, gain=0.35)
for i in range(1, 12): F('tick', mon(i), f=900 + 110 * i, level=0.3 + 0.02 * i)
F('riser', mon(9), d=mon(12) - mon(9), gain=0.35); F('impact', mon(12), size=1.3, gain=0.7); F('bell', mon(12) + 0.1, f=1567.98, d=1.4, gain=0.3)
F('impact', ws(83), size=1.1, gain=0.6)
F('impact', ws(89) + 0.15, size=1.2, gain=0.65); F('tick', ws(89) + 0.17, f=450, level=0.6)
F('impact', ws(99) - 0.1, size=1.1, gain=0.6); F('bell', ws(99) + 0.1, f=987.77, d=1.5, gain=0.3)
for y in range(12): F('tick', ws(107) - 0.1 + (ws(113) + 0.3 - ws(107)) * (y * 12 + 1) / 141, f=1800 + 60 * y, level=0.3)
F('riser', ws(115) - 0.1, d=1.0, gain=0.22); F('riser', ws(118) - 0.1, d=1.0, gain=0.22)
F('pop', ws(127), f=1100, gain=0.35); F('tick', ws(132) + 0.3, f=520, level=0.55)
F('impact', T['end'], size=1.0, gain=0.5); F('pop', ws(133), f=1100, gain=0.4); F('pop', ws(135), f=1300, gain=0.4); F('whoosh', ws(138), gain=0.3); F('bell', ws(138) + 0.2, f=1318.5, d=1.6, gain=0.3)
BAR = round(60 / 120 * 4, 4)
spec = {'seed': 67, 'dur': DUR, 'grid0': 0.0, 'bar': BAR, 'fade_from': DUR - 1.3, 'chords': CH, 'prog': ['Gm', 'Eb', 'Bb', 'F'],
        'groove': [[T['three'], T['why']], [T['brand'], DUR - 0.5]], 'full': [[T['q3'], T['why']], [T['years'], T['trust']]],
        'clap': [[T['q1'], T['why']], [T['brand'], DUR - 0.5]], 'dark': [[T['q2'], T['q3']], [T['why'], T['brand']]],
        'arp': [[0, T['three']], [T['test'], T['brand']], [T['end'], DUR]], 'hats': [[T['three'], DUR - 1.0]],
        'outro_bass': [T['why'], T['brand']], 'rolls': [[mon(12) - 0.7, mon(12) - 0.03]], 'fx': fx, 'ticks': ticks}
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
