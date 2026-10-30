# k11's colour-block look (q2's language): inline the Vazirmatn fonts, the BacktestLab icon, both Persian wordmarks,
# data.json, the pictures in images.json (the page sits in blocks/) and blocks.js into blocks/index.html.
#   python3 blocks_page.py
import base64, json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '../../../..')
b64 = lambda p: base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()
rd = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()
svg = lambda p: f"'data:image/svg+xml;base64,{b64(p)}'"
imgs = json.dumps({k: '../' + v for k, v in json.load(open(os.path.join(HERE, 'images.json'))).items()})
html = f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>k11 blocks</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; }}
html, body {{ margin: 0; background: #F3F0FA; overflow: hidden; }} canvas {{ display: block; width: 1080px; height: 1920px; }}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas>
<script>window.DATA = {rd('data.json')}; window.IMGS = {imgs}; window.LOGO = {{ icon: {svg('brand/svg/app-icon.svg')}, word: {svg('brand/svg/wordmark-fa-white.svg')}, wordL: {svg('brand/svg/wordmark-fa-light.svg')} }};</script>
<script>
{rd('blocks.js')}
</script></body></html>
'''
os.makedirs(os.path.join(HERE, 'blocks'), exist_ok=True)
open(os.path.join(HERE, 'blocks/index.html'), 'w', encoding='utf-8').write(html); print('blocks/index.html', len(html) // 1024, 'KB')
