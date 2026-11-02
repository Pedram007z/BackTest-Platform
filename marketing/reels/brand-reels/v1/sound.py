# The score of the manifesto reels v1–v4: an original piece from ../../reelkit/soundgen.py under the user's voice
# (voice/vo.wav), one per look, each with its own key, tempo, layers and effects:
#   - kinetic (v1): A minor, 112 BPM, the full groove from «ما بستری جامع» on.
#   - glass (v2): C♯ minor, 96 BPM, airy, the groove only from the feature list.
#   - type (v3): D minor, 104 BPM, minimal: an arp and pads, hits on the struck words.
#   - film (v4): E minor, 92 BPM, cinematic: pads and low drums, the full groove only for the closing line.
# The shared effects: a hit on «حرفه‌ای», a fail on «حدس», the brand, pops for each feature, a hit on «یکپارچه»,
# a bell on «آماده شوید», the end card.
#   LOOK=<kinetic|glass|type|film> python3 sound.py → music-<look>.json, music-<look>.wav, mix-<look>.wav (−14 LUFS), here in v1/
import json, os, subprocess, wave
import numpy as np
os.chdir(os.path.dirname(os.path.abspath(__file__)))
LOOK = os.environ.get('LOOK', 'kinetic'); assert LOOK in ('kinetic', 'glass', 'type', 'film')
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]
KEYS = {
  'kinetic': (112, {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[174.61, 220.0, 261.63, 349.23], 43.65], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]}, ['Am', 'F', 'C', 'G'], 181),
  'glass': (96, {'C#m': [[207.65, 277.18, 329.63, 415.30], 69.30], 'A': [[220.0, 277.18, 329.63, 440.0], 55.0], 'E': [[207.65, 246.94, 329.63, 415.30], 41.20], 'B': [[185.0, 246.94, 311.13, 369.99], 61.74]}, ['C#m', 'A', 'E', 'B'], 182),
  'type': (104, {'Dm': [[220.0, 293.66, 349.23, 440.0], 73.42], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27], 'F': [[220.0, 261.63, 349.23, 440.0], 43.65], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41]}, ['Dm', 'Bb', 'F', 'C'], 183),
  'film': (92, {'Em': [[196.0, 246.94, 329.63, 392.0], 41.20], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0], 'D': [[220.0, 293.66, 369.99, 440.0], 73.42]}, ['Em', 'C', 'G', 'D'], 184),
}
BPM, CH, PROG, SEED = KEYS[LOOK]
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('guess', 'we', 'three', 'manual', 'evals', 'prop', 'tools', 'one', 'not_', 'ready', 'end'): F('whoosh', T[k], gain=0.2 if LOOK != 'type' else 0.12)
F('impact', ws(1), size=0.8, gain=0.45); F('riser', 0.0, d=ws(1), gain=0.1, f0=400, f1=2400)
F('fail', ws(8) + 0.1, gain=0.14); F('pop', ws(10), f=900, gain=0.24)
F('impact', ws(14), size=0.7, gain=0.4); F('bell', ws(14) + 0.1, f=1318.51, d=1.6, gain=0.24)
for i in (17, 18, 20): F('pop', ws(i), f=1000 + 20 * i, gain=0.26)
for i in (29, 31, 33, 39): F('pop', ws(i), f=1100 + 10 * i, gain=0.26)
F('pop', ws(48), f=1300, gain=0.24); F('pop', ws(52), f=1500, gain=0.24)
F('riser', ws(54), d=ws(59) - ws(54), gain=0.12, f0=300, f1=2600); F('impact', ws(59), size=0.9, gain=0.5)
F('fail', ws(64), gain=0.14); F('bell', ws(72), f=1760.0, d=1.8, gain=0.3); F('impact', ws(72), size=0.6, gain=0.35)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1318.51, d=2.2, gain=0.3)
if LOOK == 'type': run(0.05, 0.6, 8, 3800, 0, 0.05); run(ws(43), 0.4, 6, 3800, 0, 0.05)
if LOOK == 'film':
    for k in ('three', 'manual', 'evals', 'tools', 'one', 'not_'): F('tick', T[k] + 0.05, f=4200, level=0.25)   # a shutter on each new screen
BAR = round(60 / BPM * 4, 4); G0 = round(ws(59) % BAR, 4)
L = {'kinetic': dict(groove=[[T['we'] - 0.2, DUR - 0.6]], full=[[T['manual'], T['not_']], [T['ready'], T['end']]], clap=[[T['three'], DUR - 0.6]], dark=[[T['guess'], T['we']], [T['not_'], T['ready']]],
                     arp=[[0, T['we']], [T['end'], DUR]], hats=[[T['we'], DUR - 1.0]], outro_bass=[T['not_'], T['ready']], rolls=[[ws(59) - 0.6, ws(59) - 0.03]]),
     'glass': dict(groove=[[T['manual'] - 0.2, T['not_']], [T['ready'], DUR - 0.6]], full=[[T['tools'], T['not_']]], clap=[[T['tools'], T['not_']]], dark=[[0, T['we']]],
                   arp=[[0, DUR]], hats=[[T['manual'], DUR - 1.0]], outro_bass=[T['not_'], T['ready']], rolls=[[ws(59) - 0.6, ws(59) - 0.03]]),
     'type': dict(groove=[], full=[], clap=[], dark=[[T['not_'], T['ready']]], arp=[[0, DUR]], hats=[[T['three'], T['not_']]], outro_bass=[T['ready'], DUR - 0.6], rolls=[]),
     'film': dict(groove=[[T['ready'] - 0.2, DUR - 0.6]], full=[[T['one'], T['not_']], [T['ready'], T['end']]], clap=[[T['one'], T['not_']]], dark=[[0, T['one']]],
                  arp=[[T['we'], T['one']], [T['end'], DUR]], hats=[[T['three'], DUR - 1.0]], outro_bass=[T['not_'], T['ready']], rolls=[[ws(59) - 0.6, ws(59) - 0.03]])}[LOOK]
spec = {'seed': SEED, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': PROG, **L, 'fx': fx, 'ticks': ticks}
SUF = f'-{LOOK}'
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
