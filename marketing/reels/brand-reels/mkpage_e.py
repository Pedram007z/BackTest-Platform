# Assemble <dir>/index.html for the character reels (e2, e3): kit.js, then e-kit.js (the shared room and trader).
# usage: python3 mkpage_e.py <dir> [asset path to the repo root]
import os, sys
d = sys.argv[1]; up = os.path.relpath('.', d)
asset = sys.argv[2] if len(sys.argv) > 2 else os.path.join(up, '../../../').replace('\\', '/')
head = open('head.html').read().replace('@@ASSET@@', asset).replace('src="../kit.js"', f'src="{up}/kit.js"') + f'<script src="{up}/e-kit.js"></script>\n'
open(f'{d}/index.html', 'w').write(head + '<script>\nconst DATA = ' + open(f'{d}/data.json').read() + ';\nsetTimeline(DATA);\n' + open(f'{d}/scenes.js').read() + '\n</script></body></html>\n')
print('ok', d, asset)
