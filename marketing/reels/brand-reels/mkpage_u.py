# Builds a u-reel's page for one look: python3 mkpage_u.py <reel> <kinetic|motion> → <reel>/<look>/index.html, with the
# Vazirmatn fonts, the BacktestLab icon and both Persian wordmarks, <reel>/data.json (plus the look), u-kit.js and
# <reel>/story.js inlined.
import base64, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '../../..')
reel, look = sys.argv[1], sys.argv[2]; assert look in ('kinetic', 'motion')
b64 = lambda p: base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()
rd = lambda p: open(os.path.join(HERE, p), encoding='utf-8').read()
svg = lambda p: f"'data:image/svg+xml;base64,{b64(p)}'"
data = json.dumps({**json.loads(rd(f'{reel}/data.json')), 'mode': look}, ensure_ascii=False)
bg = '#F3F0FA' if look == 'kinetic' else '#090D18'
# pictures the page loads from the reel's folder (<reel>/images.json: {key: path relative to the reel}); the page sits one level down
imgs_p = os.path.join(HERE, reel, 'images.json')
imgs = json.dumps({k: '../' + v for k, v in json.load(open(imgs_p)).items()}) if os.path.exists(imgs_p) else '{}'
html = f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>{reel} · {look}</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; }}
html, body {{ margin: 0; background: {bg}; overflow: hidden; }} canvas {{ display: block; width: 1080px; height: 1920px; }}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas>
<script>window.DATA = {data}; window.IMGS = {imgs}; window.LOGO = {{ icon: {svg('brand/svg/app-icon.svg')}, word: {svg('brand/svg/wordmark-fa-white.svg')}, wordL: {svg('brand/svg/wordmark-fa-light.svg')} }};</script>
<script>
{rd('u-kit.js')}
{rd(f'{reel}/story.js')}
</script></body></html>
'''
out = os.path.join(HERE, reel, look); os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(html); print(f'{reel}/{look}/index.html', len(html) // 1024, 'KB')
