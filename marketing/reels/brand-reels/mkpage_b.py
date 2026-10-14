# Assemble bN/index.html like mkpage.py, with b-common.js (the shared pieces of b1–b3) after kit.js.
import sys
d = sys.argv[1]; asset = '../../../../'
head = open('head.html').read().replace('@@ASSET@@', asset) + '<script src="../b-common.js"></script>\n'
open(f'{d}/index.html', 'w').write(head + '<script>\nconst DATA = ' + open(f'{d}/data.json').read() + ';\nsetTimeline(DATA);\n' + open(f'{d}/scenes.js').read() + '\n</script></body></html>\n')
print('ok', d)
