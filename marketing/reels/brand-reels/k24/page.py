# k24's page: inline the Vazirmatn fonts, the BacktestLab icon and wordmark, the timeline (data.json) and kinetic.js
# into reel/index.html (one 2D canvas). The replay screens are k13's (images.json), loaded from ../k13/screens.
#   python3 page.py
import base64, json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '../../../..')
b64 = lambda p: base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()
rd = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()
imgs = json.dumps({k: '../' + v for k, v in json.load(open(os.path.join(HERE, 'images.json'))).items()})
html = f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>k24 kinetic</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; }}
html, body {{ margin: 0; background: #000; overflow: hidden; }} canvas {{ display: block; width: 1080px; height: 1920px; }}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas>
<script>window.DATA = {rd('data.json')}; window.IMGS = {imgs}; window.LOGO = {{ icon: 'data:image/svg+xml;base64,{b64('brand/svg/app-icon.svg')}', word: 'data:image/svg+xml;base64,{b64('brand/svg/wordmark-fa-white.svg')}' }};</script>
<script>
{rd('kinetic.js')}
</script></body></html>
'''
os.makedirs(os.path.join(HERE, 'reel'), exist_ok=True)
open(os.path.join(HERE, 'reel', 'index.html'), 'w', encoding='utf-8').write(html); print('reel/index.html', len(html) // 1024, 'KB')
