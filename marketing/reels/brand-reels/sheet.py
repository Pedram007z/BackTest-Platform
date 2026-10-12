# Tile a folder of stills (t<time>.jpg) into one sheet, in time order.
import sys, glob, re, subprocess
d, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 5
fs = sorted(glob.glob(f'{d}/t*.jpg'), key=lambda f: float(re.search(r't([0-9.]+)\.jpg', f).group(1)))
w, h = 360, 640; n = len(fs)
ins = sum([['-i', f] for f in fs], [])
flt = ''.join(f'[{i}]scale={w}:{h}[s{i}];' for i in range(n)) + ''.join(f'[s{i}]' for i in range(n))
flt += f'xstack=inputs={n}:layout=' + '|'.join(f'{(i % cols) * w}_{(i // cols) * h}' for i in range(n)) + ':fill=black'
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', *ins, '-filter_complex', flt, out], check=True); print(out, n)
