# p1's sound: an original groove from ../../reelkit/soundgen.py (A minor, 120 BPM, Am–F–C–G) that follows the story:
# tense pads and an arpeggio under the hook and the losing weeks (darker for «ضرر» and the checklist), the groove from
# BacktestLab on, full for the replay and the trade, and an outro under the end card. On top, a sound for each move: a
# hit on the first frame and a drop on the crash, a flip per weekly strategy and a tick per indicator landing, the
# stamp's thud, a pop per ✓ and a fail tone on ✗, a strike for «حس» and pops for «عدد», a riser into the logo, a tick
# per replayed candle, pops for entry, stop and target, a bell when the target is hit, the bars and their labels, the
# year counter, the stopwatch, and the end card. All of it steps back under the voice (vo.wav from voice/build.py).
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS, true peak ≤ −1.5 dB)
import json, os, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; C = D['chart']; ws = lambda i: Wd[i][0]
CH = {'Am': [[220.0, 261.63, 329.63, 440.0], 55.0], 'F': [[220.0, 261.63, 349.23, 440.0], 43.65],
      'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 49.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
F('impact', 0.02, size=0.8, gain=0.55)
F('downlifter', T['crash'] + 0.25, d=1.0, gain=0.4); F('fail', T['crash'] + 0.45, gain=0.35)
F('whoosh', T['weeks'], gain=0.35)
for i in range(5): F('pop', T['weeks'] + i * 0.42, f=650 + 60 * i, gain=0.28)
for i in range(10): F('tick', T['ind'] + 0.05 + i * 0.13 + 0.38, f=1400 + 90 * i, level=0.45)
F('impact', T['loss'], size=1.3, gain=0.75); F('fail', T['loss'] + 0.05, gain=0.35)
F('whoosh', T['test'], gain=0.35); F('pop', ws(22), f=900, gain=0.35); F('pop', ws(23) + 0.15, f=1000, gain=0.35); F('fail', ws(27), gain=0.4)
F('whoosh', T['feel'], gain=0.3); F('tick', ws(34), f=700, level=0.6)
for i in range(4): F('pop', T['num'] + 0.1 + i * 0.12, f=900 + 120 * i, gain=0.3)
F('riser', T['brand'] - 1.1, d=1.1, gain=0.4); F('impact', T['brand'] + 0.05, size=1.3, gain=0.7); F('bell', T['brand'] + 0.3, f=1046.5, d=1.5, gain=0.3)
F('whoosh', T['replay'], gain=0.35)
run(T['replay'] + 0.35, T['pos'] - 0.15 - T['replay'] - 0.35, C['entry_i'] + 1 - 10, 2400, 6)
F('pop', T['pos'] + 0.2, f=700, gain=0.35); F('pop', T['sl'], f=560, gain=0.35); F('pop', T['tp'], f=1100, gain=0.35); F('pop', T['norisk'], f=900, gain=0.35)
run(T['norisk'] + 0.15, T['hit'] - T['norisk'] - 0.15, C['out_i'] - C['entry_i'], 2300, 12); F('riser', T['norisk'], d=T['hit'] - T['norisk'], gain=0.3)
F('impact', T['hit'], size=1.0, gain=0.6); F('bell', T['hit'] + 0.05, f=1318.5, d=1.4, gain=0.35); F('bell', T['hit'] + 0.17, f=1760.0, d=1.6, gain=0.3)
F('whoosh', T['journal'], gain=0.35); run(T['journal'] + 0.75, 0.6, 12, 1800, 10, 0.12)
F('pop', T['make'] + 0.1, f=1200, gain=0.35); F('bell', T['make'] + 0.15, f=1568.0, d=1.0, gain=0.2); F('pop', T['burn'] + 0.1, f=500, gain=0.35)
F('whoosh', T['years'], gain=0.4); run(T['years'] + 0.1, 1.2, 11, 1600, 30, 0.2); F('pop', T['hours'], f=900, gain=0.35); run(T['hours'] + 0.05, 1.0, 14, 3000, 0, 0.12)
F('impact', T['end'], size=1.2, gain=0.6); F('pop', ws(89) - 0.05, f=1000, gain=0.4); F('pop', T['link'], f=1200, gain=0.4); F('bell', T['link'] + 0.2, f=1318.5, d=1.6, gain=0.3)
spec = {'seed': 37, 'dur': DUR, 'grid0': 0.0, 'bar': 2.0, 'fade_from': DUR - 1.3, 'chords': CH, 'prog': ['Am', 'F', 'C', 'G'],
        'groove': [[T['weeks'], T['loss']], [T['brand'], T['end'] + 1.5]], 'full': [[T['replay'], T['journal']], [T['years'], T['end']]],
        'clap': [[T['ind'], T['loss']], [T['replay'], T['end'] + 1.5]], 'dark': [[T['loss'], T['brand']]],
        'arp': [[0, T['weeks']], [T['test'], T['brand']], [T['end'], DUR]], 'hats': [[T['weeks'], DUR - 1.5]],
        'outro_bass': [T['loss'], T['brand']], 'rolls': [[T['brand'] - 0.9, T['brand'] - 0.03]], 'fx': fx, 'ticks': ticks}
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
