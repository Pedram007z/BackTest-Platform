# k20's sound: chat sounds over a soft original lo-fi groove from ../../reelkit/soundgen.py (F, 90 BPM, F–Am–Dm–B♭), under
# the user's voice (k16's cut, ../k16/voice/vo.wav): a pop for each incoming message, keyboard ticks and a whoosh as the
# viewer types and sends, the poll rows filling (a rising tone each), the knob ticking down, the «ندونستن» row and the
# stamp, fifty ticks for the challenge squares, the link preview, the heart, the profile card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
CH = {'F': [[174.61, 220.0, 261.63, 329.63], 43.65], 'Am': [[220.0, 261.63, 329.63, 392.0], 55.0],
      'Dm': [[220.0, 293.66, 349.23, 440.0], 73.42], 'Bb': [[233.08, 293.66, 349.23, 440.0], 58.27]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
# incoming messages (when each bubble opens)
for i in (10, 16, 60, 66, 74, 79): F('pop', ws(i) - 0.06, f=1250, gain=0.24)
# the viewer types and sends
for t0, t1 in ((3.22, 3.62), (16.42, 16.8), (T['end'] - 0.15, T['end'] + 0.22)): run(t0, t1 - t0 - 0.04, int((t1 - t0) * 22), 3200, 0, 0.08); F('whoosh', t1 - 0.02, gain=0.16); F('pop', t1, f=1700, gain=0.2)
# the poll: it opens; each row fills; the knob; «ندونستن»; the strike; the stamp
F('pop', ws(20) - 0.05, f=900, gain=0.26); F('impact', ws(20), size=0.4, gain=0.25)
for i, f0 in ((23, 600), (34, 700), (49, 800)): F('riser', ws(i), d=0.5, gain=0.07, f0=f0, f1=f0 * 3)
F('bell', ws(23) + 0.5, f=1760.0, d=0.8, gain=0.16); F('pop', ws(34) + 0.5, f=1100, gain=0.2); run(ws(40) - 0.05, 0.4, 6, 2600, -120, 0.1); F('fail', ws(49) + 0.5, gain=0.12)
F('pop', ws(64) - 0.08, f=700, gain=0.22); F('whoosh', ws(65) - 0.05, gain=0.14); F('impact', ws(65) + 0.05, size=0.8, gain=0.45); F('bell', ws(65) + 0.1, f=1396.91, d=1.2, gain=0.2)
# the challenge, the link preview, the ring, the heart, the profile card
F('pop', ws(69) - 0.02, f=1000, gain=0.24); run(ws(69), 1.0, 50, 2400, 8, 0.07)
F('pop', ws(75) + 0.12, f=1150, gain=0.24); F('pop', ws(77), f=1500, gain=0.24)
F('pop', T['end'], f=1900, gain=0.22); F('bell', T['end'] + 0.6, f=1046.5, d=2.0, gain=0.24); F('whoosh', T['end'] + 0.5, gain=0.16)
BAR = round(60 / 90 * 4, 4); G0 = round(ws(65) % BAR, 4)
spec = {'seed': 2020, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['F', 'Am', 'Dm', 'Bb'],
        'groove': [[0.0, DUR - 0.6]], 'full': [[T['three'], T['all']], [T['week'], T['end']]], 'clap': [[T['a1'], T['all']], [T['week'], DUR - 0.6]], 'dark': [],
        'arp': [[0, T['three']], [T['all'], T['week']], [T['end'], DUR]], 'hats': [[T['see'], DUR - 1.0]], 'outro_bass': [T['all'], T['week']],
        'rolls': [[ws(65) - 0.6, ws(65) - 0.03]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('../k16/voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
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
