# k23's sound: a soft, warm original groove from ../../reelkit/soundgen.py (G major, 92 BPM, G–Em–C–D), kept low under the
# user's voice at its normal speed (voice/vo.wav), with a pop as each beat's prop appears, the stamp on «نیست», the gauges
# ticking up, a whoosh of fire on «می‌سوزه», ticks for the loss streak, the knob turning, a ding for each check, the
# keys typing «PROP», the message sent, and a bell at the end.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; END = D['end'] + 0.25
CH = {'G': [[196.0, 246.94, 293.66, 392.0], 49.0], 'Em': [[196.0, 246.94, 329.63, 392.0], 41.2], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'D': [[220.0, 293.66, 369.99, 440.0], 73.42]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
BEATS = [0, 16, 21, 29, 36, 44, 72, 87, 99, 108, 118, 128]
for k, wi in enumerate(BEATS):
    t = 0.05 if k == 0 else ws(wi) - 0.07
    F('whoosh', t - 0.05, gain=0.12); F('pop', t, f=900 + 60 * k, gain=0.2)
F('impact', ws(20) - 0.03, size=0.6, gain=0.35); F('fail', ws(20), gain=0.12)
run(ws(29), 0.8, 8, 2400, 40, 0.08); run(ws(32), 0.8, 8, 2600, 40, 0.08)
F('riser', ws(39), d=0.5, gain=0.08, f0=300, f1=1400); F('impact', ws(40) - 0.05, size=0.8, gain=0.4); F('downlifter', ws(41), d=1.0, gain=0.12)
F('pop', ws(59) - 0.05, f=1100, gain=0.2); run(ws(64), 0.75, 6, 1600, -40, 0.14)
run(ws(73), 0.8, 7, 2600, -120, 0.1); F('bell', ws(86), f=1567.98, d=1.0, gain=0.18)
F('pop', ws(92), f=1300, gain=0.2); run(ws(99), 3.0, 16, 1900, 10, 0.05); run(ws(113), 1.0, 9, 2400, 30, 0.08)
F('pop', ws(118), f=1100, gain=0.2); F('bell', ws(122), f=2093.0, d=1.0, gain=0.2); F('pop', ws(124), f=1300, gain=0.2)
run(ws(132) - 0.1, 0.4, 4, 3200, 0, 0.12); F('whoosh', ws(134) - 0.05, gain=0.14); F('pop', ws(134), f=1700, gain=0.22)
F('impact', END, size=0.6, gain=0.35); F('bell', END + 0.2, f=1174.66, d=2.0, gain=0.26)
BAR = round(60 / 92 * 4, 4); G0 = round(ws(40) % BAR, 4)
spec = {'seed': 2323, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['G', 'Em', 'C', 'D'],
        'groove': [[0.5, DUR - 0.8]], 'full': [[ws(44), ws(87)], [ws(118), END]], 'clap': [[ws(21), ws(36)], [ws(44), END]], 'dark': [[ws(36), ws(44)]],
        'arp': [[0, ws(21)], [ws(87), ws(118)], [END, DUR]], 'hats': [[ws(16), DUR - 1.2]], 'outro_bass': [ws(87), ws(118)], 'rolls': [[ws(40) - 0.6, ws(40) - 0.03]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
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
