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
imgs = {k: scaled(v, k, 1440 if k == 'tall' else 2160) for k, v in SRC.items()}
flip = [scaled(p, 'flip-%02d' % i, 1600) for i, p in enumerate(FLIP)]

def icon(name):
    src = open(os.path.join(ROOT, 'node_modules/lucide-react/dist/esm/icons', name + '.mjs'), encoding='utf-8').read()
    block = src[src.index('node: ['):src.index('__iconData.node')]
    parts = [f'<{tag} ' + ' '.join(f'{k}="{v}"' for k, v in re.findall(r'(\w+):\s*"([^"]*)"', attrs) if k != 'key') + '/>' for tag, attrs in re.findall(r'\[\s*"(\w+)",\s*\{(.*?)\}\s*\]', block, re.S)]
    assert parts, name
    return ''.join(parts)
icons = json.dumps({n: icon(n) for n in ['shield-check', 'check']})

CSS = '''
html, body { margin: 0; background: #06060C; overflow: hidden; }
#stage { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: #06060C; font-family: Vazirmatn; }
#glow { position: absolute; left: -260px; top: 120px; width: 1600px; height: 1300px; background: radial-gradient(closest-side, rgba(108,71,255,.42), rgba(108,71,255,0)); }
#persp { position: absolute; inset: 0; perspective: 1700px; perspective-origin: 540px 740px; transform-origin: 540px 740px; }
.plane { position: absolute; border-radius: 28px; overflow: hidden; background: #0B0B14; border: 1.5px solid rgba(255,255,255,.15); box-shadow: 0 80px 200px rgba(0,0,0,.75), 0 0 0 1px rgba(124,92,255,.18); display: none; backface-visibility: hidden; }
.plane img { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.plane .gl { position: absolute; inset: 0; background: linear-gradient(115deg, rgba(255,255,255,0) 38%, rgba(255,255,255,.11) 50%, rgba(255,255,255,0) 62%); background-size: 260% 100%; }
#ov { position: absolute; inset: 0; }
.abs { position: absolute; }
.glass { position: absolute; display: flex; align-items: center; justify-content: center; background: linear-gradient(145deg, rgba(255,255,255,.17), rgba(255,255,255,.04)); border: 2px solid rgba(255,255,255,.28); box-shadow: 0 40px 120px rgba(108,71,255,.45), inset 0 1px 0 rgba(255,255,255,.35); }
.chips { position: absolute; left: 40px; right: 40px; display: flex; justify-content: center; gap: 16px; direction: rtl; }
.chip { padding: 12px 30px 16px; border-radius: 40px; background: rgba(255,255,255,.08); border: 1.5px solid rgba(255,255,255,.24); color: #fff; font-weight: 700; font-size: 40px; white-space: nowrap; }
#capfade { position: absolute; left: 0; right: 0; top: 960px; bottom: 0; background: linear-gradient(to bottom, rgba(6,6,12,0), rgba(6,6,12,.88) 30%, rgba(6,6,12,.96)); }
#caps { position: absolute; left: 80px; right: 80px; top: 1170px; direction: rtl; }
.grp { position: absolute; left: 0; right: 0; top: 0; text-align: right; }
.bar { width: 110px; height: 8px; border-radius: 4px; background: #A48DFF; margin: 0 0 18px auto; transform-origin: 100% 50%; }
.ln { white-space: nowrap; line-height: 1.32; color: #fff; }
.ln.bg { font-weight: 900; font-size: 116px; }
.ln.md { font-weight: 800; font-size: 84px; }
.ln.sm { font-weight: 500; font-size: 50px; color: rgba(255,255,255,.74); }
.wd { display: inline-block; position: relative; }
.wd .st { position: absolute; left: -5%; right: -5%; top: 50%; height: 16px; margin-top: -2px; background: #FF4D5E; border-radius: 8px; transform-origin: 100% 50%; transform: scaleX(0); }
.wd .ul { position: absolute; left: 0; right: 0; bottom: 4px; height: 10px; background: #FF4D5E; border-radius: 5px; transform-origin: 100% 50%; transform: scaleX(0); }
#flash { position: absolute; inset: 0; background: radial-gradient(circle at 50% 40%, rgba(255,255,255,.9), rgba(164,141,255,.5) 45%, rgba(108,71,255,0) 80%); opacity: 0; mix-blend-mode: screen; }
#vig { position: absolute; inset: 0; background: radial-gradient(ellipse 78% 62% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,.6) 100%); }
#grain { position: absolute; inset: 0; opacity: .1; mix-blend-mode: soft-light; }
'''
html = f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>v4 film</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; }}
{CSS}</style></head><body><div id="stage"><div id="glow"></div><div id="persp"></div><div id="ov"></div><div id="capfade"></div><div id="caps"></div><div id="flash"></div><div id="vig"></div><div id="grain"></div></div>
<script>window.DATA = {rd('../v1/data.json')}; window.IMGS = {json.dumps(imgs)}; window.FLIP = {json.dumps(flip)}; window.ICONS = {icons};
window.LOGO = {{ icon: {svg('brand/svg/app-icon.svg')}, word: {svg('brand/svg/wordmark-fa-white.svg')} }};</script>
<script>
{rd('film.js')}
</script></body></html>
'''
open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8').write(html); print('index.html', len(html) // 1024, 'KB')
