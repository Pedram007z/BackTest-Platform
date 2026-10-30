# k9's sound: an original groove from ../../reelkit/soundgen.py under the user's voice (dg1's cut: ../dg1/voice/vo.wav),
# G minor, 120 BPM, Gm–E♭–B♭–F, with a bar landing on «برده». The effects:
#   - a hit and a bell for the challenge, the runner's rise to the finish, a scratch on «ترید مثل قبل»;
#   - pops for the four steps;
#   - pops for the three strategy cards, the cursor's click, a bell when one is kept;
#   - the candles' tick run, a tick on each level and the pen's scratch;
#   - a tick run as the grid fills to ۱۰۰;
#   - a fail on «پول واقعی», a bell on «بازار واقعی گذشته»;
#   - a hit on «تقلب», a falling tone into the hidden future, a click as the rules lock;
#   - the fork, the checks on the strategy card;
#   - a tick run for the wall of bad trades and a hit for the «مجانی» stamp;
#   - a hit, a bell and a roll into «هر دوش برده»;
#   - the brand, the hops up the stair, the free start, the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Gm': [[196.0, 233.08, 293.66, 392.0], 49.0], 'Eb': [[155.56, 196.0, 233.08, 311.13], 77.78],
      'Bb': [[174.61, 233.08, 293.66, 349.23], 58.27], 'F': [[174.61, 220.0, 261.63, 349.23], 43.65]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('rule', 'pick', 'write', 'hundred', 'safe', 'fair', 'outcome', 'know', 'bad', 'both', 'start', 'follow', 'cta', 'end'): F('whoosh', T[k], gain=0.24)
# the challenge, the track, «ترید مثل قبل»
F('impact', ws(1), size=0.8, gain=0.45); F('bell', ws(1) + 0.1, f=1567.98, d=1.6, gain=0.24)
F('riser', ws(5), d=ws(7) + 0.2 - ws(5), gain=0.12, f0=500, f1=2600); F('pop', ws(7) + 0.2, f=1500, gain=0.3)
F('pop', ws(11), f=900, gain=0.24); F('fail', ws(13) + 0.1, gain=0.16)
# four steps
for i in range(4): F('pop', T['rule'] + 0.1 + i * 0.12, f=900 + 150 * i, gain=0.24)
F('pop', ws(17), f=1500, gain=0.28)
# one strategy
for i in range(3): F('pop', ws(19) + 0.05 + i * 0.12, f=1000 + 120 * i, gain=0.24)
F('tick', ws(22), f=3400, level=0.6); F('downlifter', ws(23) - 0.05, d=0.5, gain=0.12); F('bell', ws(24), f=1975.53, d=1.2, gain=0.22)
# the rules written
run(ws(25), 0.9, 12, 2000, 20, 0.08)
for i in (28, 31, 34): F('tick', ws(i), f=2600 + 20 * i, level=0.5); run(ws(i) + 0.1, 0.6, 9, 5200, 300, 0.04); F('pop', ws(i) + 0.8, f=1400, gain=0.22)
# 100 trades
run(ws(38) - 0.05, ws(42) + 0.35 - ws(38), 50, 1700, 50, 0.13); F('impact', ws(38), size=0.7, gain=0.4); F('bell', ws(42) + 0.35, f=1567.98, d=1.2, gain=0.24)
# not real money, the real past market
F('pop', ws(44), f=1000, gain=0.26); F('tick', ws(46), f=3800, level=0.5); F('fail', ws(46) + 0.15, gain=0.18)
F('pop', ws(47), f=1200, gain=0.26); F('bell', ws(50), f=1975.53, d=1.2, gain=0.22)
# no cheating
F('impact', ws(52), size=0.9, gain=0.5); F('downlifter', ws(55), d=0.7, gain=0.16); F('tick', ws(60), f=3000, level=0.6); F('pop', ws(60) + 0.1, f=800, gain=0.26)
# the fork, the strategy you know
F('riser', T['outcome'], d=ws(65) - T['outcome'], gain=0.1, f0=400, f1=2000); F('pop', ws(65), f=1300, gain=0.28); F('pop', ws(65) + 0.15, f=1500, gain=0.28)
for i in (71, 73, 75): F('pop', ws(i), f=1100, gain=0.22); F('tick', ws(i) + 0.2, f=3600, level=0.45)
# 100 bad trades, free; your real money untouched
run(ws(78) - 0.05, ws(81) + 0.35 - ws(78), 30, 1500, -20, 0.14); F('impact', ws(83), size=0.9, gain=0.5)
F('pop', ws(85) + 0.1, f=900, gain=0.26); F('pop', ws(90), f=1100, gain=0.22); F('bell', ws(91), f=1567.98, d=1.2, gain=0.22); F('pop', ws(92), f=1400, gain=0.26)
# both win
F('impact', ws(95), size=1.0, gain=0.55); F('bell', ws(95) + 0.1, f=1567.98, d=1.8, gain=0.3); F('pop', ws(94), f=1300, gain=0.26)
# the brand, the stair, the free start
F('impact', ws(99), size=0.8, gain=0.45); F('bell', ws(99) + 0.1, f=1567.98, d=1.6, gain=0.26); F('pop', ws(101), f=1400, gain=0.28)
F('pop', ws(106), f=1200, gain=0.26)
for i, h in enumerate((ws(108), ws(110), ws(111) + 0.15)): F('pop', h + 0.2, f=1000 + 200 * i, gain=0.28)
F('pop', ws(113), f=1300, gain=0.3); F('pop', ws(114), f=1500, gain=0.3)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1567.98, d=2.0, gain=0.3)
BAR = round(60 / 120 * 4, 4); G0 = round(ws(95) % BAR, 4)
spec = {'seed': 149, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Gm', 'Eb', 'Bb', 'F'],
        'groove': [[T['rule'] - 0.2, T['outcome']], [T['know'], DUR - 0.6]],
        'full': [[T['hundred'], T['outcome']], [T['both'], T['end']]],
        'clap': [[T['write'], T['outcome']], [T['both'], DUR - 0.6]], 'dark': [[T['fair'], T['outcome']], [T['bad'], T['both']]],
        'arp': [[0, T['rule']], [T['outcome'], T['know']], [T['end'], DUR]], 'hats': [[T['rule'], DUR - 1.0]],
        'outro_bass': [T['outcome'], T['know']], 'rolls': [[T['both'] - 0.6, T['both'] - 0.03]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('../dg1/voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
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
