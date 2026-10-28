# k2's sound: an original groove from ../../reelkit/soundgen.py (D minor, 118 BPM, Dm–Bb–F–C, a bar landing on «ولی»)
# under the user's voice. A soft arp for the question; an impact and a fail tone as the arrow snaps on «آره، میشه»; a dark
# filtered groove under the three wrong ways (the buy and sell chips ticking in, the losses, the eye shutting); a snare
# roll and a riser into «ولی اگه درست تمرین کنی» and the full groove from there; ticks for the strategy's rules, the
# replay's candles, the checklist and the typing; pops for the real screens; a fail on «حس» and a bell on «عدد»; a hit on
# «نیست»; the link tapped; the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Dm': [[146.83, 174.61, 220.0, 293.66], 73.42], 'Bb': [[174.61, 233.08, 293.66, 349.23], 58.27],
      'F': [[174.61, 220.0, 261.63, 349.23], 43.65], 'C': [[164.81, 196.0, 261.63, 329.63], 65.41]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('twist', 'aimless', 'rules', 'numbers', 'strategy', 'replay', 'costs', 'journal', 'analytics', 'feel', 'truth', 'cta', 'end'): F('whoosh', T[k], gain=0.26)
# the hook: seven practice days, the trophy, the question mark
for j in range(7): F('tick', 0.25 + j * 0.22, f=1800 + 120 * j, level=0.35)
F('pop', 2.1, f=900, gain=0.3); F('pop', ws(8), f=1400, gain=0.32)
# «آره، میشه.»: the arrow snaps
F('impact', ws(10), size=0.6, gain=0.35); F('impact', ws(11), size=1.0, gain=0.55); F('fail', ws(11) + 0.04, gain=0.32)
# wrong way 1: play pressed, chips everywhere, «بی‌هدف»
F('pop', ws(15), f=700, gain=0.3); run(ws(19), ws(23) - ws(19) + 0.4, 14, 1500, 25, 0.16); F('impact', ws(19) + 0.1, size=0.5, gain=0.3)
# wrong way 2: two losses, the rules struck out
for x in (ws(28), ws(32)): F('pop', x, f=600, gain=0.3)
for x in (ws(29), ws(33)): F('tick', x, f=2600, level=0.4)
# wrong way 3: the eye shuts
F('downlifter', ws(38), d=ws(41) - ws(38) + 0.3, gain=0.22); F('pop', ws(40), f=500, gain=0.28)
# the turn
F('riser', T['turn'] - 1.4, d=1.4, gain=0.22, f0=300, f1=3200); F('impact', T['turn'], size=1.1, gain=0.6); F('bell', ws(47) + 0.15, f=1174.66, d=1.6, gain=0.3)
# the strategy's rules ticked
for x in (ws(52), ws(53), ws(54)): F('tick', x, f=2400, level=0.45)
F('pop', ws(54), f=1200, gain=0.3)
# the replay: candles stepping, the future covered
run(T['replay'] + 0.1, ws(64) - T['replay'], 12, 1900, 10, 0.1); F('downlifter', ws(64), d=0.8, gain=0.18); F('pop', ws(64) + 0.3, f=900, gain=0.3)
# real costs: the screen, the two fields ringed
F('pop', T['costs'], f=1000, gain=0.3); F('tick', ws(74), f=3000, level=0.45); F('tick', ws(76), f=3000, level=0.45)
# the checklist ticked, the journal typed
for j in range(3): F('tick', ws(84) + j * 0.18, f=2200 + 200 * j, level=0.45)
F('pop', ws(87), f=1000, gain=0.28); run(ws(89), we(92) - ws(89), 18, 4200, 0, 0.08)
# the analytics: trades piling up, the three real numbers
run(T['analytics'] + 0.1, 1.8, 40, 1600, 6, 0.1)
for x in (ws(100), ws(103), ws(108)): F('pop', x, f=1100, gain=0.3)
F('tick', ws(110), f=2600, level=0.4)
# feeling against numbers
F('fail', ws(120), gain=0.26); F('pop', ws(122), f=1300, gain=0.3); F('bell', ws(123), f=1396.91, d=1.4, gain=0.28)
# the truth: «سود تضمینی» struck out on «نیست»; when it works and when it doesn't
F('pop', ws(130), f=900, gain=0.3); F('impact', ws(132), size=0.9, gain=0.5)
F('pop', ws(133), f=1000, gain=0.28); F('bell', ws(138), f=1174.66, d=1.2, gain=0.24); F('fail', ws(142), gain=0.22)
# the call: «شروع رایگان», the link tapped
F('pop', T['cta'], f=1100, gain=0.3); F('pop', ws(149), f=1300, gain=0.32); F('tick', ws(153), f=3200, level=0.5); F('bell', ws(153) + 0.15, f=1396.91, d=1.4, gain=0.26)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1174.66, d=2.0, gain=0.3)
BAR = round(60 / 118 * 4, 4); G0 = round(T['turn'] % BAR, 4)
spec = {'seed': 47, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Dm', 'Bb', 'F', 'C'],
        'groove': [[T['aimless'], T['turn'] - 0.6], [T['turn'], T['truth']], [T['cta'], DUR - 0.6]],
        'full': [[T['strategy'], T['analytics']], [T['feel'], T['truth']], [T['cta'], T['end']]],
        'clap': [[T['turn'], T['truth']], [T['cta'], DUR - 0.6]], 'dark': [[T['twist'], T['turn'] - 0.6]],
        'arp': [[0, T['twist']], [T['turn'], T['strategy']], [T['analytics'], T['feel']], [T['end'], DUR]], 'hats': [[T['aimless'], DUR - 1.0]],
        'outro_bass': [T['truth'], T['cta']], 'rolls': [[T['turn'] - 0.7, T['turn'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
