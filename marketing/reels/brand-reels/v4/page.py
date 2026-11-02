# v4: scale the real screens into screens/ (not kept in git; rebuilt here), then inline the Vazirmatn fonts, the
# BacktestLab icon, the white wordmark, the Lucide icons it uses (ISC licence, from node_modules/lucide-react),
# ../v1/data.json and film.js into index.html. The screens stay files next to the page.
#   python3 page.py
import base64, json, os, re
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); BR = os.path.join(HERE, '..'); ROOT = os.path.join(HERE, '../../../..')
b64 = lambda p: base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()
rd = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()
svg = lambda p: f"'data:image/svg+xml;base64,{b64(p)}'"

# key: (source under brand-reels/, width to scale to)
SRC = {'clean': 'launch/shots/r-clean.jpg', 'hero': 'launch/shots/l-hero.jpg', 'session': 'f1/screens/c-session.jpg',
       'monte': 'k1/screens/k-montecarlo.jpg', 'an': 'f1/screens/h-analytics.jpg', 'tools': 'launch/shots/r-tools.jpg',
       'an2': 'f1/screens/h-analytics-2.jpg', 'dash': 'launch/shots/p-dashboard.jpg', 'tall': 'launch/shots/p-analytics-full.jpg',
       'jour': 'launch/shots/p-journal.jpg', 'placed': 'launch/shots/r-placed.jpg', 'buy': 'launch/shots/r-buy.jpg'}
FLIP = [f'f1/screens/d-{i:03d}.jpg' for i in range(2, 41, 2)]
os.makedirs(os.path.join(HERE, 'screens'), exist_ok=True)
def scaled(src, name, w):
    out = os.path.join(HERE, 'screens', name + '.jpg')
    if not os.path.exists(out):
        im = Image.open(os.path.join(BR, src)).convert('RGB'); im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS); im.save(out, quality=90)
    return 'screens/' + name + '.jpg'
imgs = {k: scaled(v, k, 1600) for k, v in SRC.items() if k != 'tall'}
# the full Analytics page is 1440×4752 once scaled; headless Chromium crashes decoding it whole, so it's cut in 4 tiles
def tiles(src, name, w, n):
    out = [os.path.join(HERE, 'screens', f'{name}-{i}.jpg') for i in range(n)]
    if not all(os.path.exists(o) for o in out):
        im = Image.open(os.path.join(BR, src)).convert('RGB'); im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS); h = im.height
        for i, o in enumerate(out): im.crop((0, round(h * i / n), w, round(h * (i + 1) / n))).save(o, quality=90)
    return ['screens/' + os.path.basename(o) for o in out]
imgs['tall'] = tiles(SRC['tall'], 'tall', 1200, 4)
flip = [scaled(p, 'flip-%02d' % i, 1440) for i, p in enumerate(FLIP)]

def icon(name):
    src = open(os.path.join(ROOT, 'node_modules/lucide-react/dist/esm/icons', name + '.mjs'), encoding='utf-8').read()
    block = src[src.index('node: ['):src.index('__iconData.node')]
    parts = [f'<{tag} ' + ' '.join(f'{k}="{v}"' for k, v in re.findall(r'(\w+):\s*"([^"]*)"', attrs) if k != 'key') + '/>' for tag, attrs in re.findall(r'\[\s*"(\w+)",\s*\{(.*?)\}\s*\]', block, re.S)]
    assert parts, name
    return ''.join(parts)
icons = json.dumps({n: icon(n) for n in ['shield-check', 'check']})

# the page is one 2D canvas: headless Chromium's GPU process died taking screenshots of these screens through
# CSS 3D, WebGL, DOM overlays, blend modes or CSS filters
CSS = '''
html, body { margin: 0; background: #06060C; overflow: hidden; }
#stage { position: relative; width: 1080px; height: 1920px; overflow: hidden; }
#c { display: block; width: 1080px; height: 1920px; }
'''
html = f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>v4 film</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; }}
{CSS}</style></head><body><div id="stage"><canvas id="c" width="1080" height="1920"></canvas></div>
<script>window.DATA = {rd('../v1/data.json')}; window.IMGS = {json.dumps(imgs)}; window.FLIP = {json.dumps(flip)}; window.ICONS = {icons};
window.LOGO = {{ icon: {svg('brand/svg/app-icon.svg')}, word: {svg('brand/svg/wordmark-fa-white.svg')} }};</script>
<script>
{rd('film.js')}
</script></body></html>
'''
open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8').write(html); print('index.html', len(html) // 1024, 'KB')
