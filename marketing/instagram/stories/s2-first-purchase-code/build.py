# Writes index.html from template.html with the Lucide icons it uses inlined (ISC licence, read from
# node_modules/lucide-react). usage: python3 build.py
import json, os, re
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.join(here, '../../../..')
ICONS = ['gift', 'lock', 'send', 'chevrons-down']
def icon(name):
    src = open(os.path.join(root, 'node_modules/lucide-react/dist/esm/icons', name + '.mjs'), encoding='utf-8').read()
    alias = re.search(r"export \{ default \} from '\./([\w-]+)\.mjs'", src)
    if alias: return icon(alias.group(1))
    block = src[src.index('node: ['):src.index('__iconData.node')]
    return [[tag, {k: v for k, v in re.findall(r'(\w+):\s*"([^"]*)"', attrs) if k != 'key'}] for tag, attrs in re.findall(r'\[\s*"(\w+)",\s*\{(.*?)\}\s*\]', block, re.S)]
t = open(os.path.join(here, 'template.html'), encoding='utf-8').read()
t = t.replace('/*ICONS*/', json.dumps({n: icon(n) for n in ICONS}, separators=(',', ':')))
open(os.path.join(here, 'index.html'), 'w', encoding='utf-8').write(t)
print('ok')
