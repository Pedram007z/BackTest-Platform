# q3: inline the Vazirmatn fonts, the BacktestLab icon, both Persian wordmarks (white for violet, light for paper),
# data.json and scenes.js into index.html.   python3 page.py
import base64, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '../../../..')
b64 = lambda p: base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()
rd = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()
svg = lambda p: f"'data:image/svg+xml;base64,{b64(p)}'"
html = f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>Signals at 90% a month</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; }}
html, body {{ margin: 0; background: #F3F0FA; overflow: hidden; }} canvas {{ display: block; width: 1080px; height: 1920px; }}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas>
<script>window.DATA = {rd('data.json')}; window.LOGO = {{ icon: {svg('brand/svg/app-icon.svg')}, word: {svg('brand/svg/wordmark-fa-white.svg')}, wordL: {svg('brand/svg/wordmark-fa-light.svg')} }};</script>
<script>
{rd('scenes.js')}
</script></body></html>
'''
open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8').write(html); print('index.html', len(html) // 1024, 'KB')
