# k11's sound: an original groove from ../../reelkit/soundgen.py under the user's voice (voice/vo.wav), F minor, 122 BPM,
# Fm–D♭–A♭–E♭, with a bar landing on «ریسکت خراب بود». The effects:
#   - the ring filling, a hit and a fail as the challenge burns («سوزوندم»);
#   - the calculator's keys;
#   - ticks as the ten trades appear, a fail as the four losses show, a slide as they bunch up;
#   - a tick run as the 200 trades fill, a bell on «۷۰ درصد», a hit on the run of five;
#   - five falling pops for the 2% staircase, a hit and a fail on «حسابتو می‌بنده»;
#   - a bell for the strategy's check, a hit for the risk's cross;
#   - five softer pops for the 1% staircase, a bell on «هنوز توی بازی‌ای»;
#   - the die's rattle and a fail, a bell for «بک‌تست»;
#   - the replay's ticks, pops for the two analytics rings;
#   - the slider's click, the challenge bought;
#   - the free start, the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
#   LOOK=blocks python3 sound.py → music-blocks.json, music-blocks.wav, mix-blocks.wav: the colour-block look (blocks.js),
#   with whooshes on its two extra cuts, the die's rattle on «حدس» and a pop as each of the five losses lights up.
#   LOOK=note python3 sound.py → …-note: the notebook look (note.js): the same as blocks, plus a pen scratch for each mark
#   drawn by hand.
#   LOOK=dash python3 sound.py → …-dash: the dashboard look (dash.js): the same, plus the hook's five losses, two
#   rewinds (falling tone and ticks), the risk field typed from 2% to 1%, and an alarm when the challenge fails.
import json, os, subprocess, wave
import numpy as np
LOOK = os.environ.get('LOOK', ''); BL = LOOK in ('blocks', 'dash', 'note'); DS = LOOK == 'dash'; NT = LOOK == 'note'; SUF = f'-{LOOK}' if LOOK else ''
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'Fm': [[174.61, 207.65, 261.63, 349.23], 43.65], 'Db': [[138.59, 174.61, 207.65, 277.18], 69.30],
      'Ab': [[155.56, 207.65, 261.63, 311.13], 51.91], 'Eb': [[155.56, 196.0, 233.08, 311.13], 77.78]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('calc', 'four', 'spread', 'odds', 'risk2', 'twist', 'risk1', 'real', 'lab', 'analytics', 'first', 'cta', 'end'): F('whoosh', T[k], gain=0.24)
# the ring, the challenge burns
F('riser', 0.0, d=0.9, gain=0.1, f0=600, f1=2400); F('pop', ws(2), f=1300, gain=0.26); F('pop', ws(7), f=1000, gain=0.26)
F('impact', ws(9), size=0.9, gain=0.5); F('fail', ws(9) + 0.1, gain=0.18)
# the calculator
run(T['calc'] + 0.1, 0.8, 6, 3000, 60, 0.12)
# ten trades, four losses; bunched
run(ws(21) - 0.02, 0.55, 10, 2200, 30, 0.1); F('fail', ws(24), gain=0.14); F('pop', ws(25), f=1200, gain=0.24); F('pop', ws(26), f=900, gain=0.24)
F('pop', ws(33), f=1100, gain=0.22); F('downlifter', ws(34), d=0.6, gain=0.14); F('fail', ws(35) + 0.3, gain=0.14)
# 200 trades; >70%; five in a row
run(ws(38) - 0.05, ws(40) + 0.65 - ws(38), 50, 1700, 40, 0.12); F('bell', ws(45), f=1396.91, d=1.2, gain=0.24)
F('impact', ws(51), size=0.6, gain=0.4); F('pop', ws(53), f=900, gain=0.26)
if BL:
    for k in ('run', 'guess'): F('whoosh', T[k], gain=0.24)
if NT:   # the pen: a short scratch for each circle, box, equation, cross and check drawn by hand
    for t0, d in ((0.05, 0.5), (ws(9) + 0.15, 0.4), (ws(9) + 0.05, 0.4), (ws(24) + 0.15, 0.4), (ws(35) + 0.3, 0.45), (ws(45) + 0.15, 0.5),
                  (ws(61), 0.25), (ws(63), 0.25), (ws(68), 0.3), (ws(80), 0.5), (ws(85), 0.3), (ws(87), 0.35), (ws(91), 0.25), (ws(99), 0.3),
                  (ws(114), 0.3), (ws(139), 0.45), (ws(146), 0.45), (ws(153), 0.25), (ws(158), 0.25)): run(t0, d, 9, 5200, 250, 0.035)
if DS:
    for i in range(5): F('pop', ws(5) + (ws(9) - 0.1 - ws(5)) * i / 4, f=1000 - 90 * i, gain=0.2)
    for t0 in (ws(9), ws(80)):
        for j in range(3): F('tick', t0 + 0.12 + j * 0.16, f=2400, level=0.35)
    for t0, d in ((T['calc'], 0.85), (T['risk1'], 0.6)): F('downlifter', t0, d=d, gain=0.16); run(t0 + 0.02, d, 10, 3200, -120, 0.06)
    for j in range(3): F('tick', ws(91) + j * 0.09, f=3600, level=0.3)
    for j in range(5): F('pop', ws(51) - 0.05 + (ws(57) - ws(51) + 0.05) * j / 4, f=900 - 60 * j, gain=0.22)
# 2% risk staircase; the prop limit; the account closed
for i in range(5): F('pop', ws(63) - 0.05 + (ws(66) - ws(63) + 0.05) * i / 5, f=1100 - 120 * i, gain=0.22)
F('downlifter', ws(68), d=0.7, gain=0.16); F('pop', ws(68), f=700, gain=0.26)
F('tick', ws(72), f=3000, level=0.4); F('impact', ws(80), size=1.0, gain=0.6); F('fail', ws(80) + 0.12, gain=0.2)
# strategy fine, risk broken
F('bell', ws(85), f=1760.0, d=1.0, gain=0.22); F('impact', ws(87), size=0.8, gain=0.5)
# 1% risk staircase; still in the game
for i in range(5): F('pop', ws(93) + (ws(98) - ws(93)) * i / 5, f=1300 - 60 * i, gain=0.18)
F('pop', ws(99), f=1400, gain=0.26); F('bell', ws(102), f=2093.0, d=1.4, gain=0.26)
# guess vs backtest
run((T['guess'] if BL else T['real']) + 0.1, ws(113) - (T['guess'] if BL else T['real']) - 0.1, 8 if BL else 16, 900, 0, 0.12); F('fail', ws(114), gain=0.18); F('bell', ws(117) + 0.05, f=1760.0, d=1.2, gain=0.24)
# the replay; the analytics rings
F('impact', ws(123), size=0.6, gain=0.35); run(T['lab'] + 0.2, T['analytics'] - T['lab'] - 0.4, 10, 1900, 10, 0.07)
F('pop', ws(139), f=1200, gain=0.28); F('pop', ws(145), f=1000, gain=0.24); F('pop', ws(146), f=1400, gain=0.28)
# the slider; the challenge bought
F('tick', ws(151), f=3200, level=0.5); F('tick', ws(153), f=3600, level=0.5); F('pop', ws(154), f=1100, gain=0.26); F('bell', ws(158), f=1760.0, d=1.0, gain=0.22)
# the free start, the link, the end card
F('pop', ws(160), f=1300, gain=0.3); F('pop', ws(161), f=1500, gain=0.3)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1396.91, d=2.0, gain=0.3)
BAR = round(60 / 122 * 4, 4); G0 = round(ws(87) % BAR, 4)
spec = {'seed': 163, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Fm', 'Db', 'Ab', 'Eb'],
        'groove': [[T['calc'] - 0.2, DUR - 0.6]],
        'full': [[T['odds'], T['prop']], [T['twist'], T['real']], [T['lab'], T['end']]],
        'clap': [[T['four'], T['prop']], [T['twist'], DUR - 0.6]], 'dark': [[T['risk2'], T['twist']]],
        'arp': [[0, T['calc']], [T['real'], T['lab']], [T['end'], DUR]], 'hats': [[T['calc'], DUR - 1.0]],
        'outro_bass': [T['real'], T['lab']], 'rolls': [[T['twist'] - 0.6, T['twist'] - 0.03]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open(f'music{SUF}.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', f'music{SUF}.json', f'music{SUF}.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open(f'music{SUF}.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
v = np.zeros(N); m_ = min(N, len(vo)); v[:m_] = vo[:m_]
env = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (env > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); out *= (1 - 0.5 * np.clip(act, 0, 1))[:, None]
out /= np.abs(out).max() + 1e-9; out *= 0.4
out += np.stack([v, v], 1) / (np.abs(v).max() + 1e-9) * 0.85
out = np.tanh(out * 1.2) / np.tanh(1.2)
w = wave.open(f'mix-raw{SUF}.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out * 0.97, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', f'mix-raw{SUF}.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.8:attack=2:release=40:level=0")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'mix-raw{SUF}.wav', '-af', af, '-ar', str(SR), f'mix{SUF}.wav'], check=True)
print(f'mix{SUF}.wav', DUR, 's; input', j['input_i'], 'LUFS')
