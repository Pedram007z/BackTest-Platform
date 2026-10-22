# q1's sound: an original groove from ../../reelkit/soundgen.py (E minor, 124 BPM, Em–C–G–D) under the user's voice:
# a hit on the first frame and on every colour cut, a stamp on «تو نه», strikes for «نه اخبار / اندیکاتور / نظر بقیه»,
# the cursor's glide and a click-less hover, ten flips for the «؟» circles, a falling tone with the red arrow, a hundred
# ticks for the wall of tests, a lift into «تو هم می‌تونی» and the logo, a tick per gold candle (and the rewinds), pops
# for the worked example and the journal, the gauges' sweep, the cursor's return, and the closing question's hit.
# Everything steps back under the voice (voice/vo.wav).   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
CH = {'Em': [[164.81, 196.0, 246.94, 329.63], 41.2], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41],
      'G': [[196.0, 246.94, 293.66, 392.0], 49.0], 'D': [[220.0, 293.66, 369.99, 440.0], 73.42]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
F('impact', 0.02, size=0.8, gain=0.5); F('pop', ws(9), f=1200, gain=0.35)
for k in ('notyou', 'button', 'tenof', 'loss', 'number', 'hundreds', 'you', 'brand', 'replay', 'risk', 'journal', 'stats', 'next', 'end'): F('whoosh', T[k], gain=0.32)
F('impact', ws(13), size=1.2, gain=0.65)
for wn, ww in ((14, 15), (16, 17), (18, 19)): F('pop', ws(wn), f=520, gain=0.3); F('tick', ws(ww) + 0.15, f=600, level=0.55)
F('pop', ws(25), f=900, gain=0.35); F('whoosh', ws(25) + 0.5, gain=0.18); F('pop', ws(31), f=1300, gain=0.3)
for i in range(10): F('tick', ws(37) + i * 0.07, f=1800 + 60 * i, level=0.35)
F('impact', ws(41), size=0.6, gain=0.4)
F('downlifter', ws(48), d=0.9, gain=0.45); F('fail', ws(49) + 0.25, gain=0.35); F('impact', ws(49) + 0.3, size=1.0, gain=0.5)
F('pop', ws(55), f=1000, gain=0.35); F('tick', ws(60) + 0.2, f=500, level=0.55)
run(ws(61), ws(69) + 0.3 - ws(61), 120, 2400, 4, 0.1)
F('riser', T['you'] - 0.8, d=0.8, gain=0.4); F('impact', T['you'], size=1.3, gain=0.7)
F('impact', ws(75), size=1.1, gain=0.6); F('bell', ws(75) + 0.2, f=987.77, d=1.5, gain=0.3)
run(ws(80) - 0.2, 0.33 * 12, 13, 2600, 10, 0.16)
for j in range(2): F('downlifter', T['repeat'] + j * 1.15, d=0.25, gain=0.25); run(T['repeat'] + j * 1.15 + 0.25, 0.8, 10, 2600, 12, 0.12)
for k, f in ((ws(99) + 0.1, 700), (ws(100), 800), (ws(101), 900)): F('pop', k, f=f, gain=0.3)
F('impact', ws(102), size=0.7, gain=0.45); F('bell', ws(102) + 0.05, f=1318.5, d=1.0, gain=0.25)
for k in (ws(106), ws(108), ws(110)): F('pop', k, f=850, gain=0.3)
F('impact', ws(110) + 0.35, size=0.8, gain=0.45)
F('riser', ws(116), d=1.0, gain=0.25); F('riser', ws(120), d=1.0, gain=0.25)
F('pop', T['next'] + 0.1, f=900, gain=0.3); F('whoosh', T['next'] + 0.6, gain=0.18)
F('impact', T['q'], size=1.4, gain=0.75); F('pop', ws(140), f=1400, gain=0.35)
F('impact', T['end'], size=1.0, gain=0.5); F('pop', ws(142), f=1100, gain=0.4); F('pop', ws(145), f=1300, gain=0.4); F('bell', ws(145) + 0.2, f=1318.5, d=1.6, gain=0.3)
BAR = round(60 / 124 * 4, 4)
spec = {'seed': 41, 'dur': DUR, 'grid0': 0.0, 'bar': BAR, 'fade_from': DUR - 1.3, 'chords': CH, 'prog': ['Em', 'C', 'G', 'D'],
        'groove': [[T['button'], T['q']], [T['end'], DUR - 0.5]], 'full': [[T['hundreds'], T['risk']], [T['stats'], T['q']]],
        'clap': [[T['tenof'], T['q']], [T['end'], DUR - 0.5]], 'dark': [[T['loss'], T['hundreds']], [T['q'], T['end']]],
        'arp': [[0, T['button']], [T['you'], T['replay']], [T['end'], DUR]], 'hats': [[T['notyou'], DUR - 1.0]],
        'outro_bass': [T['q'], T['end']], 'rolls': [[T['you'] - 0.7, T['you'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
