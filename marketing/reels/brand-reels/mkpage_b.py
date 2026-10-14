# Assemble <dir>/index.html like mkpage.py, with b-common.js (the shared pieces of b1–b3) after kit.js.
# usage: python3 mkpage_b.py <dir> [asset path to the repo root]; the kit's paths follow <dir>'s depth.
import os, sys
d = sys.argv[1]; up = os.path.relpath('.', d)
asset = sys.argv[2] if len(sys.argv) > 2 else os.path.join(up, '../../../').replace('\\', '/')
head = open('head.html').read().replace('@@ASSET@@', asset).replace('src="../kit.js"', f'src="{up}/kit.js"') + f'<script src="{up}/b-common.js"></script>\n'
open(f'{d}/index.html', 'w').write(head + '<script>\nconst DATA = ' + open(f'{d}/data.json').read() + ';\nsetTimeline(DATA);\n' + open(f'{d}/scenes.js').read() + '\n</script></body></html>\n')
print('ok', d, asset)
