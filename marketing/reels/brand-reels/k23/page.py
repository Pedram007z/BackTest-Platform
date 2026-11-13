# k23's page: inline the Vazirmatn fonts, the BacktestLab icon, three.js (vendor/three-bundle.js, built by
# vendor/bundle.sh) and reel.js into reel/index.html. Two canvases: #g (WebGL, the 3D scene) and #c (2D, the hook).
#   python3 page.py
import base64, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '../../../..')
b64 = lambda p: base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()
rd = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()
# the replay screens are inlined as data URLs: WebGL can't take textures from file:// pictures
imgs = __import__('json').dumps({k: 'data:image/jpeg;base64,' + base64.b64encode(open(os.path.join(HERE, v), 'rb').read()).decode() for k, v in __import__('json').load(open(os.path.join(HERE, 'images.json'))).items()})
bundle = os.path.join(HERE, '../cv4/vendor/three-bundle.js')
assert os.path.exists(bundle), 'build vendor/three-bundle.js first (see vendor/bundle.sh)'
html = f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>k23 mascot reel</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; }}
html, body {{ margin: 0; background: #000; overflow: hidden; }} canvas {{ display: block; width: 1080px; height: 1920px; position: absolute; left: 0; top: 0; }}
</style></head><body><canvas id="g" width="1080" height="1920"></canvas><canvas id="c" width="1080" height="1920"></canvas>
<script>window.DATA = {rd('data.json')}; window.IMGS = {imgs}; window.LOGO = {{ icon: 'data:image/svg+xml;base64,{b64('brand/svg/app-icon.svg')}', word: 'data:image/svg+xml;base64,{b64('brand/svg/wordmark-fa-white.svg')}' }};</script>
<script>{open(bundle, encoding='utf-8').read()}</script>
<script>
{rd('reel.js')}
</script></body></html>
'''
os.makedirs(os.path.join(HERE, 'reel'), exist_ok=True)
open(os.path.join(HERE, 'reel', 'index.html'), 'w', encoding='utf-8').write(html); print('reel/index.html', len(html) // 1024, 'KB')
