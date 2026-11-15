# k30's sound: a dark, pulsing original bed from ../../reelkit/soundgen.py (B minor, 96 BPM, Bm–G–D–A), kept low under the
# user's voice at its normal speed (../k27/voice/vo.wav), with the screen's own sounds: a heartbeat blip under the pulse
# line, a shimmer as the dots assemble, blips as the targets lock, crackle ticks as the future is lost, ticks as the
# grid turns, pings from the scope, a hit on the flash, flap clicks, ticks for the counter, a sweep for the violet card,
# and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; END = D['end']
CH = {'Bm': [[246.94, 293.66, 369.99, 493.88], 61.74], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0], 'D': [[220.0, 293.66, 369.99, 440.0], 73.42], 'A': [[220.0, 277.18, 329.63, 440.0], 55.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.12: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
T = lambda i: ws(i) - 0.07
for k in range(4): F('pop', 0.3 + k * 1.0, f=180, gain=0.25)                                         # the pulse
F('riser', T(5) - 0.1, d=0.8, gain=0.06, f0=400, f1=1600)
run(T(8), 1.2, 30, 3000, -20, 0.03)                                                                  # the dots assembling
F('pop', T(18), f=1500, gain=0.18); F('pop', T(21), f=1300, gain=0.18)
F('whoosh', T(26), gain=0.08); run(T(33), 1.0, 40, 5000, 0, 0.025); F('downlifter', T(33), d=0.6, gain=0.1)
run(T(41), 1.0, 42, 2400, 5, 0.035)
for k in range(3): F('bell', T(47) + 0.4 + k * 1.4, f=2093.0, d=0.5, gain=0.07)                     # the scope's pings
F('impact', T(54), size=0.8, gain=0.4); F('bell', T(54) + 0.1, f=1174.66, d=1.2, gain=0.14)
run(T(58) + 0.1, ws(62) - ws(58), 30, 1800, 0, 0.06)                                                 # the flap board
F('pop', T(76), f=1300, gain=0.2); run(T(66), T(76) - T(66), 14, 1900, 0, 0.035)
run(T(80), 1.3, 20, 2200, 20, 0.07)
F('whoosh', T(85) - 0.1, gain=0.2); F('impact', T(85) + 0.3, size=0.5, gain=0.26)
F('impact', T(91), size=0.6, gain=0.32); F('pop', T(93), f=1500, gain=0.2)
F('impact', END, size=0.6, gain=0.32); F('bell', END + 0.2, f=987.77, d=2.2, gain=0.22)
BAR = round(60 / 96 * 4, 4); G0 = round(ws(7) % BAR, 4)
spec = {'seed': 3030, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['Bm', 'G', 'D', 'A'],
        'groove': [[ws(7), DUR - 0.8]], 'full': [[ws(54), END]], 'clap': [[ws(13), ws(47)], [ws(58), END]], 'dark': [[ws(24), ws(54)]],
        'arp': [[0, ws(13)], [END, DUR]], 'hats': [[ws(7), DUR - 1.2]], 'outro_bass': [ws(78), END], 'rolls': [[ws(54) - 0.5, ws(54) - 0.07]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('../k27/voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
v = np.zeros(N); m_ = min(N, len(vo)); v[:m_] = vo[:m_]
env = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (env > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); out *= (1 - 0.5 * np.clip(act, 0, 1))[:, None]
out /= np.abs(out).max() + 1e-9; out *= 0.3
out += np.stack([v, v], 1) / (np.abs(v).max() + 1e-9) * 0.85
out = np.tanh(out * 1.2) / np.tanh(1.2)
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out * 0.97, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.8:attack=2:release=40:level=0")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
