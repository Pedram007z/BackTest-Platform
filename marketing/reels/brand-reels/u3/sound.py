# u3's sound, shared by both cuts (kinetic/ and motion/): an original groove from ../../reelkit/soundgen.py (B minor,
# 116 BPM, Bm–G–D–A) under the user's voice: a hit on the first frame and on every scene, the post's heart, the line
# drawn, the arrow and the bounce, the pen drawing the line after the fact, the right side lit, the curtain at the
# entry, a tick per real trade as the 106 outcomes fill in and a stamp on «بدون اسکرین‌شات», the replay's candles, the
# count to a hundred, and the end card. Everything steps back under the voice (voice/vo.wav).
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
lerp = lambda a, b, k: a + (b - a) * k
CH = {'Bm': [[185.0, 246.94, 293.66, 369.99], 61.74], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0],
      'D': [[220.0, 293.66, 369.99, 440.0], 73.42], 'A': [[220.0, 277.18, 329.63, 440.0], 55.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
F('impact', 0.02, size=0.8, gain=0.5)
for k in ('clean', 'after', 'everyone', 'empty', 'failed', 'only', 'brand', 'replay', 'hundred', 'end'): F('whoosh', T[k], gain=0.28)
F('pop', ws(4), f=1300, gain=0.35); F('pop', ws(7), f=900, gain=0.3)
F('riser', ws(14) - 0.1, d=0.5, gain=0.2); F('pop', ws(16), f=1100, gain=0.3); F('bell', ws(21), f=1318.5, d=1.0, gain=0.25); F('pop', ws(23), f=1200, gain=0.3)
F('riser', ws(26), d=ws(33) - ws(26), gain=0.2)
F('whoosh', ws(35), gain=0.2)
F('downlifter', T['empty'], d=0.6, gain=0.3); F('impact', ws(51), size=0.9, gain=0.5)
run(T['failed'] + 0.1, ws(58) - T['failed'], 106, 2200, 2, 0.07); F('impact', ws(57), size=0.8, gain=0.45); F('impact', ws(61), size=1.1, gain=0.6); F('tick', ws(61) + 0.02, f=450, level=0.55)
F('impact', ws(81) - 0.1, size=1.1, gain=0.6); F('bell', ws(81) + 0.1, f=987.77, d=1.5, gain=0.3)
run(ws(89), 0.08 * 52, 52, 2600, 5, 0.06)
run(ws(100), ws(103) - ws(100), 40, 1800, 25, 0.08); F('bell', ws(103), f=1567.98, d=1.0, gain=0.28)
F('impact', T['end'], size=1.0, gain=0.5); F('pop', ws(108), f=1100, gain=0.4); F('pop', ws(110), f=1300, gain=0.4); F('bell', ws(110) + 0.2, f=1318.5, d=1.6, gain=0.3)
BAR = round(60 / 116 * 4, 4)
spec = {'seed': 79, 'dur': DUR, 'grid0': 0.0, 'bar': BAR, 'fade_from': DUR - 1.3, 'chords': CH, 'prog': ['Bm', 'G', 'D', 'A'],
        'groove': [[T['clean'], T['empty']], [T['brand'], DUR - 0.5]], 'full': [[T['after'], T['everyone']], [T['replay'], T['end']]],
        'clap': [[T['clean'], T['empty']], [T['brand'], DUR - 0.5]], 'dark': [[T['empty'], T['only']]],
        'arp': [[0, T['clean']], [T['only'], T['brand']], [T['end'], DUR]], 'hats': [[T['clean'], DUR - 1.0]],
        'outro_bass': [T['empty'], T['only']], 'rolls': [[T['failed'] - 0.6, T['failed'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
