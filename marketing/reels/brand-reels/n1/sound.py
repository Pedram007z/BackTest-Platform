# n1's sound: an original groove from ../../reelkit/soundgen.py (C minor, 118 BPM, Cm–A♭–E♭–B♭) under the user's voice,
# low and tense on the vault, dark under the streak and the panic, opening up with the calm and the vault's light, full
# for the platform. On top: drum rolls (fast ticks) and a clunk as each drum locks; on the monitor a heartbeat
# (a soft double thump) and a monitor beep per beat at the pulse on screen (bpm(t), the same curve as scenes.js), a hit
# per «−1R» and a heavier one on the fifth, stamps for «ریسک ×۲ / اورترید / استراتژی»; a riser into the breath; the door's
# unlocking, a swell and a bell as it opens; ticks for the gold candles; pops for the stats; the coin's ring.
# Everything steps back under the voice (voice/vo.wav).   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
CH = {'Cm': [[196.0, 261.63, 311.13, 392.0], 65.41], 'Ab': [[207.65, 261.63, 311.13, 415.3], 51.91],
      'Eb': [[196.0, 233.08, 311.13, 392.0], 77.78], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
lerp = lambda a, b, k: a + (b - a) * k; cl = lambda x: max(0.0, min(1.0, x)); cub = lambda x: 1 - (1 - cl(x)) ** 3
def bpm(t):                                   # the pulse on screen (scenes.js bpm)
    if t < T['fifth']: return lerp(76, 104, cl((t - T['why']) / (T['fifth'] - T['why'])))
    if t < T['panic']: return lerp(104, 118, cl((t - T['fifth']) / (T['panic'] - T['fifth'])))
    if t < T['calm']: return lerp(118, 148, cl((t - T['panic']) / 3))
    if t < T['breath']: return lerp(148, 96, cub((t - T['calm']) / 1.5))
    return lerp(96, 70, cub((t - T['breath']) / 2))
F('impact', 0.02, size=0.7, gain=0.45); F('pop', ws(13), f=700, gain=0.25)
for k in ('one', 'two', 'three'): run(T[k] + 0.05, 1.05, 18, 1500, 0, 0.18); F('impact', T[k] + 1.1, size=0.55, gain=0.5); F('tick', T[k] + 1.1, f=900, level=0.6)
F('whoosh', T['why'], gain=0.4)
# the heartbeat and the monitor's beep, beat by beat from «چرا؟» to the vault's return
t = T['why'] + 0.3
while t < T['peace'] - 0.1:
    b = bpm(t); F('impact', t, size=0.28, gain=0.33); F('impact', t + 0.16, size=0.22, gain=0.22); F('tick', t + 0.02, f=1320 if t < T['calm'] else 1180, level=0.22)
    t += 60 / b
for i in range(4): F('pop', lerp(T['why'] + 0.3, T['fifth'] - 0.35, i / 3), f=420, gain=0.3)
F('impact', ws(53), size=1.2, gain=0.65); F('fail', ws(53) + 0.05, gain=0.3)
for k in (65, 70, 80): F('impact', ws(k), size=0.8, gain=0.5); F('tick', ws(k) + 0.02, f=500, level=0.5)
F('downlifter', T['calm'] - 0.1, d=1.0, gain=0.35); F('pop', ws(90), f=900, gain=0.3)
F('riser', ws(97), d=1.2, gain=0.25); F('pop', ws(101), f=1100, gain=0.35)
F('tick', T['peace'] + 0.25, f=1600, level=0.4); F('tick', T['peace'] + 0.37, f=1700, level=0.4); F('tick', T['peace'] + 0.49, f=1800, level=0.4)
F('impact', ws(106) - 0.05, size=1.1, gain=0.55); F('riser', ws(106) - 0.6, d=0.6, gain=0.3); F('bell', ws(106) + 0.2, f=1046.5, d=1.8, gain=0.3)
F('impact', T['brand'] + 0.1, size=1.2, gain=0.55); F('bell', T['brand'] + 0.35, f=1318.5, d=1.4, gain=0.25)
F('whoosh', T['test'], gain=0.35); run(T['test'] + 0.2, 0.11 * 12, 13, 2600, 10, 0.15)
F('whoosh', T['analytics'], gain=0.3); [F('pop', ws(k) - 0.15, f=800 + 150 * j, gain=0.3) for j, k in enumerate((121, 122, 123))]
F('whoosh', T['know'], gain=0.3); [F('pop', ws(128) + j * 0.12, f=1000 + 120 * j, gain=0.25) for j in range(3)]
F('bell', ws(131) + 0.4, f=1567.98, d=1.2, gain=0.3); F('tick', ws(131) + 0.45, f=2400, level=0.4)
F('impact', T['end'], size=1.0, gain=0.5); F('pop', ws(133), f=1100, gain=0.4); F('pop', ws(136), f=1300, gain=0.4); F('bell', ws(136) + 0.2, f=1318.5, d=1.6, gain=0.3)
BAR = round(60 / 118 * 4, 4)
spec = {'seed': 53, 'dur': DUR, 'grid0': 0.0, 'bar': BAR, 'fade_from': DUR - 1.3, 'chords': CH, 'prog': ['Cm', 'Ab', 'Eb', 'Bb'],
        'groove': [[T['calm'], T['breath']], [T['brand'], DUR - 0.5]], 'full': [[T['brand'], T['know']], [T['end'], DUR - 0.5]],
        'clap': [[T['brand'], DUR - 0.5]], 'dark': [[T['why'], T['calm']]],
        'arp': [[0, T['why']], [T['breath'], T['brand']], [T['end'], DUR]], 'hats': [[T['one'], T['why']], [T['calm'], DUR - 1.0]],
        'outro_bass': [T['why'], T['calm']], 'rolls': [[T['brand'] - 0.6, T['brand'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
