# k1's sound: an original groove from ../../reelkit/soundgen.py (F minor, 122 BPM, Fm–Db–Ab–Eb) under the user's voice:
# a whoosh on every colour-block wipe, the payout steps ticking green and coins on «برداشت», a hit and a fail tone on
# «نیست», ticks as the line holds above the rule, the gauges rising, a downlifter as the account dives and an impact
# and fail on «می‌سوزه», the cursor's hover, the drawdown bracket and the fourteen losses ticking in, four steps down the
# risk ladder with a bell when it clears the limit, the real screens popping in, the two steps, the comment and the DM.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
CH = {'Fm': [[174.61, 207.65, 261.63, 349.23], 43.65], 'Db': [[174.61, 207.65, 277.18, 349.23], 69.3],
      'Ab': [[207.65, 261.63, 311.13, 415.3], 51.91], 'Eb': [[196.0, 233.08, 311.13, 392.0], 77.78]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('secret', 'rules', 'limits', 'burn', 'those', 'know', 'risk', 'brand', 'replay', 'analytics', 'pass_', 'cta', 'end'): F('whoosh', T[k], gain=0.28)
F('impact', 0.02, size=0.8, gain=0.45)
for j, t0 in enumerate((0.5, 1.3, 2.1)): F('pop', t0, f=900 + 150 * j, gain=0.3)
F('bell', ws(14), f=1396.91, d=1.6, gain=0.32); run(ws(14), 0.9, 10, 3200, 40, 0.12)
F('impact', ws(20), size=0.9, gain=0.55); F('fail', ws(20) + 0.03, gain=0.3)
for j in range(3): F('tick', ws(21) + (j + 1) * 0.55, f=1800, level=0.4)
F('pop', ws(27), f=1200, gain=0.3)
F('riser', ws(29), d=1.3, gain=0.18, f0=300, f1=3000); F('riser', ws(32), d=1.3, gain=0.18, f0=300, f1=3500)
F('downlifter', ws(37), d=ws(42) - ws(37) + 0.2, gain=0.35); F('impact', ws(42), size=1.2, gain=0.65); F('fail', ws(42) + 0.05, gain=0.35)
F('tick', ws(53), f=2600, level=0.45); F('pop', ws(55), f=1100, gain=0.3)
F('pop', ws(59), f=800, gain=0.3); run(ws(64), ws(71) - ws(64), 14, 700, -15, 0.22)
for x in (T['risk'], ws(77), ws(81), ws(84)): F('tick', x, f=2200, level=0.45); F('pop', x + 0.05, f=700, gain=0.22)
F('bell', ws(84) + 0.3, f=1046.5, d=1.6, gain=0.32)
F('pop', T['brand'], f=1000, gain=0.3); F('tick', ws(95) - 0.15, f=3000, level=0.45)
run(T['replay'], T['analytics'] - 0.4 - T['replay'], 20, 2000, 10, 0.1); F('pop', ws(103), f=1300, gain=0.28)
F('pop', T['analytics'], f=1000, gain=0.3); F('tick', ws(115) - 0.1, f=3000, level=0.45)
F('pop', T['pass_'], f=900, gain=0.3); F('pop', ws(122), f=1300, gain=0.3); F('whoosh', ws(124), gain=0.22); F('pop', ws(124) + 0.05, f=1100, gain=0.3)
for j in range(4): F('tick', ws(132) - 0.1 + j * 0.1, f=2600, level=0.45)
F('pop', ws(133), f=1400, gain=0.35); F('pop', ws(139) - 0.1, f=900, gain=0.35); F('bell', ws(139), f=1046.5, d=1.2, gain=0.22)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1396.91, d=2.0, gain=0.3)
BAR = round(60 / 122 * 4, 4)
spec = {'seed': 83, 'dur': DUR, 'grid0': 0.0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Fm', 'Db', 'Ab', 'Eb'],
        'groove': [[T['secret'], T['brand']], [T['replay'], DUR - 0.6]], 'full': [[T['rules'], T['burn']], [T['know'], T['brand']], [T['pass_'], T['end']]],
        'clap': [[T['secret'], T['brand']], [T['replay'], DUR - 0.6]], 'dark': [[T['burn'], T['those']]],
        'arp': [[0, T['secret']], [T['brand'], T['replay']], [T['end'], DUR]], 'hats': [[T['rules'], DUR - 1.0]],
        'outro_bass': [T['brand'], T['replay']], 'rolls': [[T['secret'] - 0.6, T['secret'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
