# Assemble <dir>/index.html from head.html, <dir>/data.json and <dir>/scenes.js.
import sys, json
d = sys.argv[1]; asset = sys.argv[2] if len(sys.argv) > 2 else '../../../../'
head = open('head.html').read().replace('@@ASSET@@', asset)
data = open(f'{d}/data.json').read()
scenes = open(f'{d}/scenes.js').read()
open(f'{d}/index.html', 'w').write(head + '<script>\nconst DATA = ' + data + ';\nsetTimeline(DATA);\n' + scenes + '\n</script></body></html>\n')
print('ok', d)
