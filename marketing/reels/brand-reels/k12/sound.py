# k12's sound: an original groove from ../../reelkit/soundgen.py under the user's voice (voice/vo.wav), B♭ minor, 124 BPM,
# B♭m–G♭–D♭–A♭, with a bar landing on «۴۰۰ درصد». The effects:
#   - a hit as the account is half gone, a riser for «چند درصد؟», a fail on «نه»;
#   - the calculator's keys;
#   - a falling tone as $1,000 halves, a rising one for +50%, an alarm tick on «۲۵۰ دلار عقبی», a bell when it doubles;
#   - the curve shooting up;
#   - pops for each row of the table and a hit on «۴۰۰٪»;
#   - the arrow stopped by the bar;
#   - the replay's ticks, pops for the two Monte Carlo rings;
#   - big risk against small risk;
#   - the free start, the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Bbm': [[233.08, 277.18, 349.23, 466.16], 58.27], 'Gb': [[185.0, 233.08, 277.18, 369.99], 46.25],
      'Db': [[174.61, 207.65, 277.18, 349.23], 69.30], 'Ab': [[207.65, 261.63, 311.13, 415.30], 51.91]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('ask', 'fifty', 'calc', 'k1000', 'back', 'hundred', 'worse', 'table', 'quote', 'where', 'lab', 'analytics', 'arrange', 'cta', 'end'): F('whoosh', T[k], gain=0.24)
# half gone; how much?; «نه»
F('impact', 0.05, size=0.7, gain=0.4); F('downlifter', 0.1, d=0.8, gain=0.14); F('impact', ws(2), size=0.6, gain=0.35)
F('riser', ws(5), d=ws(11) - ws(5) + 0.2, gain=0.1, f0=500, f1=2400); F('pop', ws(12), f=1300, gain=0.28); F('impact', ws(14), size=0.9, gain=0.5); F('fail', ws(14) + 0.05, gain=0.18)
# the calculator
run(ws(17), 0.35, 3, 3000, 60, 0.12); F('tick', ws(19), f=3600, level=0.5)
# $1,000 → $500 → $750, $250 short → doubled
F('downlifter', ws(25) - 0.1, d=0.7, gain=0.18); F('pop', ws(24), f=900, gain=0.26); F('pop', ws(27), f=800, gain=0.26)
F('riser', ws(35) - 0.1, d=0.7, gain=0.1, f0=600, f1=2000); F('pop', ws(31), f=1300, gain=0.26); F('pop', ws(36), f=1500, gain=0.26)
F('impact', ws(39), size=0.7, gain=0.4)
for j in range(4): F('tick', ws(40) + 0.15 * j, f=2400, level=0.35)
F('riser', ws(51) - 0.05, d=0.9, gain=0.12, f0=500, f1=2600); F('pop', ws(51), f=1200, gain=0.28); F('bell', ws(57), f=1864.66, d=1.2, gain=0.26)
# the curve; the table; «۴۰۰٪»
F('riser', ws(61), d=ws(66) - ws(61) + 0.3, gain=0.12, f0=400, f1=3000)
for a, b in ((67, 70), (75, 78), (82, 85)): F('pop', ws(a), f=900, gain=0.26); F('pop', ws(b), f=1300, gain=0.28)
F('impact', ws(85), size=1.0, gain=0.55)
# stopped by the bar
F('downlifter', T['quote'], d=ws(98) - T['quote'], gain=0.12); F('impact', ws(98), size=0.8, gain=0.5); F('bell', ws(99), f=1396.91, d=1.2, gain=0.22)
# into the unknown; real money
F('downlifter', T['where'] + 0.1, d=1.4, gain=0.14); F('pop', ws(107), f=1100, gain=0.22); F('fail', ws(115), gain=0.14)
# the replay; the Monte Carlo rings
F('impact', ws(119), size=0.6, gain=0.35); run(T['lab'] + 0.2, T['analytics'] - T['lab'] - 0.4, 10, 1900, 10, 0.07)
F('pop', ws(133), f=1200, gain=0.28); F('pop', ws(140), f=1400, gain=0.3); F('pop', ws(141), f=1000, gain=0.22)
# big risk, small risk
F('pop', ws(143), f=900, gain=0.26); F('pop', ws(146), f=1200, gain=0.26); F('fail', ws(153), gain=0.14); F('bell', ws(157), f=2093.0, d=1.2, gain=0.24)
# the free start, the link, the end card
F('pop', ws(161), f=1300, gain=0.3); F('pop', ws(162), f=1500, gain=0.3)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1864.66, d=2.0, gain=0.3)
BAR = round(60 / 124 * 4, 4); G0 = round(ws(85) % BAR, 4)
spec = {'seed': 171, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Bbm', 'Gb', 'Db', 'Ab'],
        'groove': [[T['ask'] - 0.2, DUR - 0.6]],
        'full': [[T['hundred'], T['quote']], [T['lab'], T['end']]],
        'clap': [[T['k1000'], T['quote']], [T['lab'], DUR - 0.6]], 'dark': [[T['behind'], T['hundred']], [T['where'], T['lab']]],
        'arp': [[0, T['ask']], [T['quote'], T['where']], [T['end'], DUR]], 'hats': [[T['ask'], DUR - 1.0]],
        'outro_bass': [T['quote'], T['where']], 'rolls': [[ws(85) - 0.6, ws(85) - 0.03]], 'fx': fx, 'ticks': ticks}
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
