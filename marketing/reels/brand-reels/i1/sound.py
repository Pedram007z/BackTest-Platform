# i1's sound: an original groove from ../../reelkit/soundgen.py (D minor, 120 BPM, Dm–B♭–F–C) that builds with the
# story: soft pads and an arpeggio under the questions, the groove from the chart on, darker for the losing trade, full
# for the features. On top, a sound for each move: a hit on the first frame, slot ticks while the numbers spin and a hit
# when they land on «؟», a pop per answer bubble and a fail tone on «یعنی نمی‌دونی», a tick per candle as the charts
# replay, pops as the setup is drawn, a riser into each result with a bell for +2R and a drop for −1R, a hundred ticks
# for the tiles, a hit on the logo, a whoosh per feature card with its typing and pops, and the call to action.
# With a voice (voice/vo.wav from voice/build.py) the music and effects step back under it and the voice goes on top.
#   python3 sound.py [dir] → <dir>/music.json, music.wav, mix.wav (−14 LUFS, true peak ≤ −1.5 dB); dir: '.' or 'voice'
import json, os, subprocess, sys, wave
import numpy as np
DIR = sys.argv[1] if len(sys.argv) > 1 else '.'; P = lambda f: os.path.join(DIR, f)
D = json.load(open(P('data.json'))); T = D['T']; DUR = D['dur']; W, L = D['charts']['win'], D['charts']['loss']
CH = {'Dm': [[220.0, 293.66, 349.23, 440.0], 73.42], 'Bb': [[233.08, 293.66, 349.23, 466.16], 58.27],
      'F': [[220.0, 261.63, 349.23, 440.0], 43.65], 'C': [[196.0, 261.63, 329.63, 392.0], 65.41]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.16: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
# hook and the two numbers
F('impact', 0.02, size=0.8, gain=0.6); F('whoosh', T['q1'] - 0.05, gain=0.35)
for q, d in ((T['q1'], 1.2), (T['q2'], 1.15)):
    F('pop', q + 0.05, f=650, gain=0.35); run(q + 0.15, d, 26, 1500, 0, 0.2); F('impact', q + d + 0.15, size=0.75, gain=0.55); F('pop', q + d + 0.17, f=1100, gain=0.3)
# the usual answers, struck out
for i in range(3): F('pop', T['guess'] + 0.25 + i * 0.5, f=700 + 120 * i, gain=0.4)
for i in range(3): F('tick', T['dunno'] - 0.25 + i * 0.12, f=900, level=0.5)
F('fail', T['dunno'], gain=0.4); F('impact', T['dunno'], size=1.1, gain=0.6)
# the winning trade
F('whoosh', T['chart'], gain=0.4); run(T['chart'] + 0.3, T['liq'] - 0.4 - T['chart'], W['sweep'], 2400, 4)
F('pop', T['liq'] + 0.2, f=800, gain=0.35); F('impact', T['sweep'] + 0.35, size=0.55, gain=0.45); run(T['sweep'], 0.5, W['ext'] + 1 - W['sweep'], 2600, 0)
F('whoosh', T['fvg'], gain=0.3); run(T['fvg'], 0.6, W['fvg_i'] + 1 - W['ext'], 2600, 0); F('pop', T['fvg'] + 0.45, f=900, gain=0.35)
for i, f in enumerate((700, 600, 1000)): F('pop', T['entry'] + i * 0.15, f=f, gain=0.3)
run(T['run'], T['tp'] - T['run'], W['out'] - 1 - W['fvg_i'], 2300, 10); F('riser', T['run'], d=T['tp'] - T['run'], gain=0.35)
F('impact', T['tp'], size=1.0, gain=0.6); F('bell', T['tp'] + 0.05, f=1318.5, d=1.4, gain=0.35); F('bell', T['tp'] + 0.17, f=1760.0, d=1.6, gain=0.3)
# the same setup, losing
F('whoosh', T['loss'], gain=0.4); run(T['loss'] + 0.3, T['lbuild'] - T['loss'] - 0.3, L['sweep'], 2400, 4)
for k, f in ((-0.1 + 0.2, 800), (0.3, 850), (0.65, 900), (0.95, 700), (1.1, 1000)): F('pop', T['lbuild'] + k, f=f, gain=0.3)
run(T['lrun'], T['sl'] - T['lrun'], L['out'] - 1 - L['fvg_i'], 2300, 10); F('riser', T['lrun'], d=T['sl'] - T['lrun'], gain=0.35)
F('impact', T['sl'], size=1.3, gain=0.7); F('fail', T['sl'] + 0.05, gain=0.4); F('downlifter', T['sl'] + 0.1, d=1.2, gain=0.35)
# one trade proves nothing; a hundred tiles
F('whoosh', T['proof'], gain=0.4); run(T['grid'], 1.2, 100, 1800, 6, 0.12); F('whoosh', T['grid'] + 1.3, gain=0.25)
# BacktestLab and the five features
F('riser', T['brand'] - 1.2, d=1.2, gain=0.4); F('impact', T['brand'] + 0.2, size=1.3, gain=0.75); F('bell', T['brand'] + 0.45, f=1046.5, d=1.6, gain=0.3)
for k in ('f1', 'f2', 'f3', 'f4', 'f5'): F('whoosh', T[k], gain=0.35)
n1 = int((T['f2'] - T['f1']) / 0.16); run(T['f1'] + 0.16, n1 * 0.16, n1, 2600, 0, 0.1)
run(T['f2'] + 0.15, 0.45, 8, 3000, 0, 0.12); [F('pop', T['f2'] + 0.55 + i * 0.1, f=750 + 80 * i, gain=0.22) for i in range(3)]; F('pop', T['f2'] + 0.95, f=1200, gain=0.35); F('pop', T['f2'] + 1.1, f=600, gain=0.25)
[F('pop', T['f3'] + 0.45 + j * 0.32, f=800 + 120 * j, gain=0.35) for j in range(3)]; F('whoosh', T['f3'] + 1.35, gain=0.2)
[F('pop', T['f4'] + 0.2 + i * 0.25, f=700, gain=0.22) for i in range(2)]; run(T['f4'] + 0.45, 0.6, 6, 3000, 0, 0.12); F('pop', T['f4'] + 0.9, f=900, gain=0.25)
F('pop', T['f5'] + 0.15, f=700, gain=0.3); F('pop', T['f5'] + 0.65, f=1000, gain=0.3); [F('pop', T['f5'] + 1.52 + i * 0.12, f=1100 + 150 * i, gain=0.3) for i in range(3)]
F('bell', T['f5'] + 1.9, f=1568.0, d=1.2, gain=0.25)
# the call to action
F('impact', T['cta'], size=1.0, gain=0.6); F('pop', T['cta'] + 0.45, f=900, gain=0.35); F('whoosh', T['end'], gain=0.35)
F('impact', T['end'] + 0.25, size=1.2, gain=0.6); F('pop', T['end'] + 0.85, f=1000, gain=0.4); F('bell', T['end'] + 1.3, f=1318.5, d=1.6, gain=0.3)
spec = {'seed': 23, 'dur': DUR, 'grid0': 0.0, 'bar': 2.0, 'fade_from': DUR - 1.3, 'chords': CH, 'prog': ['Dm', 'Bb', 'F', 'C'],
        'groove': [[T['chart'], T['proof']], [T['brand'], T['cta'] + 3.5]], 'full': [[T['run'], T['loss']], [T['f1'], T['cta']]],
        'clap': [[T['liq'], T['proof']], [T['f1'], T['cta'] + 3.5]], 'dark': [[T['loss'], T['proof']]],
        'arp': [[0, T['chart']], [T['proof'], T['brand']], [T['cta'], DUR]], 'hats': [[T['q1'], DUR - 1.5]],
        'outro_bass': [T['proof'], T['brand']], 'rolls': [[T['brand'] - 1.0, T['brand'] - 0.03]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open(P('music.json'), 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', P('music.json'), P('music.wav')], check=True)
src = P('music.wav')
if os.path.exists(P('vo.wav')):
    SR = 48000; N = int(DUR * SR)
    w = wave.open(P('music.wav')); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
    out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
    vw = wave.open(P('vo.wav')); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
    v = np.zeros(N); m_ = min(N, len(vo)); v[:m_] = vo[:m_]
    env = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (env > 0.01).astype(float)
    act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); out *= (1 - 0.5 * np.clip(act, 0, 1))[:, None]
    out /= np.abs(out).max() + 1e-9; out *= 0.4
    out += np.stack([v, v], 1) / (np.abs(v).max() + 1e-9) * 0.85
    out = np.tanh(out * 1.2) / np.tanh(1.2)
    w = wave.open(P('mix-raw.wav'), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out * 0.97, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
    src = P('mix-raw.wav')
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.8:attack=2:release=40:level=0")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', '48000', P('mix.wav')], check=True)
print(P('mix.wav'), DUR, 's; input', j['input_i'], 'LUFS')
