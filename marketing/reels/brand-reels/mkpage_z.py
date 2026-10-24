# Builds a z-reel's page: python3 mkpage_z.py <reel> → <reel>/index.html, with the Vazirmatn fonts, the BacktestLab icon
# and the white Persian wordmark, <reel>/data.json, <reel>/images.json (pictures the page loads from its folder, if any),
# z-kit.js and <reel>/story.js inlined.
import base64, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '../../..')
reel = sys.argv[1]
b64 = lambda p: base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()
rd = lambda p: open(os.path.join(HERE, p), encoding='utf-8').read()
svg = lambda p: f"'data:image/svg+xml;base64,{b64(p)}'"
html = f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>{reel}</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; }}
html, body {{ margin: 0; background: #07060C; overflow: hidden; }} canvas {{ display: block; width: 1080px; height: 1920px; }}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas>
<script>window.DATA = {rd(f'{reel}/data.json')}; window.IMGS = {rd(f'{reel}/images.json') if os.path.exists(os.path.join(HERE, reel, 'images.json')) else '{}'}; window.LOGO = {{ icon: {svg('brand/svg/app-icon.svg')}, word: {svg('brand/svg/wordmark-fa-white.svg')} }};</script>
<script>
{rd('z-kit.js')}
{rd(f'{reel}/story.js')}
</script></body></html>
'''
open(os.path.join(HERE, reel, 'index.html'), 'w', encoding='utf-8').write(html); print(f'{reel}/index.html', len(html) // 1024, 'KB')
