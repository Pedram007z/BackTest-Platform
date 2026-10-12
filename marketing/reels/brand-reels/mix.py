# Lay the cut voice lines at their timeline places (vo.wav) and mix them over the score, music ducked under the voice.
import json, os, subprocess, sys
d = sys.argv[1]; data = json.load(open(f'{d}/data.json')); PL, DUR = data['place'], data['dur']
if data['lines']:
    # overrides.json: {"<line number>": ["<wav, relative to the reel dir>", <gain dB>]} swaps a line for a better take
    ov = json.load(open(f'{d}/overrides.json')) if os.path.exists(f'{d}/overrides.json') else {}
    ins, flt = [], []
    for k, t in enumerate(PL):
        src, gain = (os.path.join(d, ov[str(k + 1)][0]), ov[str(k + 1)][1]) if str(k + 1) in ov else (f'{d}/line{k + 1:02d}.wav', 0)
        ins += ['-i', src]; flt.append(f'[{k}]volume={gain}dB,adelay={int(t * 1000)}:all=1[a{k}]')
    flt.append(''.join(f'[a{k}]' for k in range(len(PL))) + f'amix=inputs={len(PL)}:normalize=0,apad=whole_dur={DUR}[vo]')
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(flt), '-map', '[vo]', '-ar', '48000', '-ac', '1', f'{d}/vo.wav'], check=True)
    fc = ('[1]aformat=channel_layouts=stereo,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=90,volume=2dB[v];[v]asplit[v1][v2];'
          '[0]volume=-11dB[m];[m][v1]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[md];[md][v2]amix=inputs=2:normalize=0[mx];'
          '[mx]loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000[out]')
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', f'{d}/music.wav', '-i', f'{d}/vo.wav', '-filter_complex', fc, '-map', '[out]', '-c:a', 'pcm_s16le', f'{d}/mix.wav'], check=True)
else:
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', f'{d}/music.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000', '-c:a', 'pcm_s16le', f'{d}/mix.wav'], check=True)
out = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-nostats', '-i', f'{d}/mix.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
print(d, [l.strip() for l in out.splitlines() if l.strip().startswith(('I:', 'Peak:'))][-2:])
