# k19's sound: the board's own clatter (every flap flip a click, from clicks.json: node clicks.cjs) over a minimal
# original pulse from ../../reelkit/soundgen.py (D minor, 112 BPM, Dm–B♭–F–C, no busy drums), under the user's voice
# (k16's cut, ../k16/voice/vo.wav). A few accents: a hit as the status lands on «ترس؟», a ding for each green status,
# a buzz for «توقف» and «لغو», a bell for «به‌موقع» and «بهتره», the counter landing on «۵۰», the screen, the end.
#   node clicks.cjs && python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
CH = {'Dm': [[220.0, 293.66, 349.23, 440.0], 73.42], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27],
      'F': [[174.61, 220.0, 261.63, 349.23], 43.65], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41]}
fx = []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
F('impact', ws(9), size=0.6, gain=0.35); F('impact', ws(18), size=0.5, gain=0.3)
F('bell', ws(23) + 0.05, f=1760.0, d=0.8, gain=0.16); F('bell', ws(30), f=2093.0, d=0.8, gain=0.14); F('pop', ws(39), f=1000, gain=0.2)
F('fail', ws(52), gain=0.16); F('impact', ws(59), size=0.6, gain=0.35); F('bell', ws(59) + 0.04, f=2093.0, d=1.2, gain=0.22)
F('fail', ws(65), gain=0.14); F('bell', ws(65) + 0.08, f=1760.0, d=1.2, gain=0.2)
F('impact', ws(69) + 0.55, size=0.7, gain=0.4); F('riser', ws(69) - 0.05, d=0.6, gain=0.08, f0=500, f1=2400)
F('impact', T['lab'] + 0.12, size=0.5, gain=0.3); F('pop', ws(77), f=1500, gain=0.26)
F('bell', ws(80), f=2093.0, d=1.0, gain=0.2); F('impact', T['end'] + 0.35, size=0.6, gain=0.35); F('bell', T['end'] + 0.45, f=1174.66, d=2.0, gain=0.26)
BAR = round(60 / 112 * 4, 4); G0 = round(ws(65) % BAR, 4)
spec = {'seed': 919, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Dm', 'Bb', 'F', 'C'],
        'groove': [[T['three'] - 0.2, T['lab']], [T['cta'], DUR - 0.6]], 'full': [[T['all'], T['lab']], [T['cta'], T['end']]], 'clap': [[T['all'], T['lab']]], 'dark': [[0, T['three']]],
        'arp': [[0, T['three']], [T['lab'], T['cta']], [T['end'], DUR]], 'hats': [[T['three'], DUR - 1.0]], 'outro_bass': [T['lab'], T['cta']],
        'rolls': [[ws(65) - 0.6, ws(65) - 0.03]], 'fx': fx, 'ticks': []}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
# the flaps: each flip a short plastic click (filtered noise with a fast decay), pitch and level a little random
rng = np.random.default_rng(19); clk = np.zeros((N, 2))
for t, b in json.load(open('clicks.json')):
    i = int(t * SR); L = int(SR * 0.012)
    if i + L >= N: continue
    n = rng.standard_normal(L); n = np.convolve(n, np.ones(3 if b != 'B' else 6) / (3 if b != 'B' else 6), 'same')
    s = n * np.exp(-np.arange(L) / (L / (5 if b != 'B' else 3))) * (0.5 + 0.5 * rng.random()) * (1.6 if b == 'B' else 1.0)
    pan = 0.5 + 0.35 * (rng.random() - 0.5); clk[i:i + L, 0] += s * (1 - pan); clk[i:i + L, 1] += s * pan
clk /= np.abs(clk).max() + 1e-9
out = out / (np.abs(out).max() + 1e-9) + clk * 0.55
vw = wave.open('../k16/voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
v = np.zeros(N); m_ = min(N, len(vo)); v[:m_] = vo[:m_]
env = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (env > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); out *= (1 - 0.45 * np.clip(act, 0, 1))[:, None]
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
