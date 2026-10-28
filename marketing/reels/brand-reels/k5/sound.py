# k5's sound: an original noir groove from ../../reelkit/soundgen.py (D minor, 96 BPM, Dm–Bb–Gm–A) under the user's
# voice, for the case-file look. A low, filtered pad and a slow arp while the folder opens; typewriter keys as the plan is
# typed and a pen tick for each red check; a heavy stamp and a fail tone on «لغو شد»; a whoosh each time the camera flies
# along a string, and a pin pop for each photo; the full groove from «اینجاست که بک‌تست‌لب»; three stamps on the verdict
# (a bell for the winner), the losers falling, the ribbon, the sticky note and the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Dm': [[146.83, 174.61, 220.0, 293.66], 73.42], 'Bb': [[174.61, 233.08, 293.66, 349.23], 58.27],
      'Gm': [[146.83, 196.0, 233.08, 293.66], 49.0], 'A': [[164.81, 220.0, 277.18, 329.63], 55.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
# the camera flying along the strings
for k in ('brand', 'three', 'save', 'test', 'analytics', 'verdict', 'winner', 'cta'): F('whoosh', T[k] - 0.35, gain=0.3)
F('whoosh', T['end'] - 0.1, gain=0.3)
# the folder: the stamp «محرمانه», the cover opening
F('impact', 1.0, size=0.5, gain=0.35); F('whoosh', T['plan'] - 0.15, gain=0.2)
# the plan typed (a key each ~0.05 s) and ticked
for i in (9, 14, 19, 23): run(ws(i) - 0.05, 0.55, 11, 3400, 0, 0.16); F('tick', ws(i) + 0.55, f=1500, level=0.4)
F('pop', ws(24) - 0.1, f=500, gain=0.28); F('downlifter', ws(24), d=1.0, gain=0.2)
# «لغو شد»
F('impact', T['but'], size=1.2, gain=0.65); F('fail', T['but'] + 0.05, gain=0.3); F('pop', ws(32), f=450, gain=0.3)
# BacktestLab
F('bell', ws(37), f=1174.66, d=1.6, gain=0.28); F('pop', ws(40), f=500, gain=0.28)
# three cards, their «؟», the strings
for j in range(3): F('pop', T['three'] + 0.1 + j * 0.18, f=480 + 60 * j, gain=0.28)
for j in range(3): F('tick', ws(53) + j * 0.12, f=2200, level=0.3)
# the photos pinned
for x in (ws(61), ws(63), ws(70), ws(71), ws(72), ws(77), ws(81)): F('pop', x, f=520, gain=0.3)
F('impact', ws(67), size=0.5, gain=0.35)
# the verdict: the results land, the winner's stamp, the losers' stamps
F('pop', T['verdict'] - 0.1, f=600, gain=0.3); F('impact', ws(84), size=0.7, gain=0.45); F('bell', ws(84) + 0.05, f=1396.91, d=1.2, gain=0.28)
F('impact', ws(89) - 0.05, size=0.6, gain=0.4); F('fail', ws(89), gain=0.22)
# the winner: the losers fall, the ribbon
F('downlifter', ws(92), d=0.9, gain=0.24); F('bell', T['winner'] + 0.1, f=1760.0, d=1.4, gain=0.3)
# «شروع رایگان», «لینک توی بیو»
F('pop', ws(97), f=600, gain=0.3); F('tick', ws(99), f=2800, level=0.45)
F('impact', T['end'] + 0.25, size=0.8, gain=0.4); F('bell', T['end'] + 0.6, f=1174.66, d=2.0, gain=0.3)
BAR = round(60 / 96 * 4, 4); G0 = round(T['brand'] % BAR, 4)
spec = {'seed': 71, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Dm', 'Bb', 'Gm', 'A'],
        'groove': [[T['plan'], T['but'] - 0.2], [T['brand'], DUR - 0.6]],
        'full': [[T['three'], T['end']]],
        'clap': [[T['brand'], DUR - 0.6]], 'dark': [[0, T['brand'] - 0.3]],
        'arp': [[0, T['plan']], [T['brand'], T['three']], [T['end'], DUR]], 'hats': [[T['plan'], DUR - 1.0]],
        'outro_bass': [T['but'], T['brand']], 'rolls': [[T['brand'] - 0.7, T['brand'] - 0.05]], 'fx': fx, 'ticks': ticks}
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
