# n1g: inline the Vazirmatn fonts, the BacktestLab icon and white Persian wordmark, n1's data.json (the voice timing
# and the real gold candles), the Lucide icons the scenes use (ISC licence, read from node_modules/lucide-react) and
# scenes.js into index.html.   python3 page.py
import base64, json, os, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '../../../..')
b64 = lambda p: base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()
rd = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()
svg = lambda p: f"'data:image/svg+xml;base64,{b64(p)}'"
ICONS = ['landmark', 'scale', 'trending-down', 'heart-pulse', 'activity', 'triangle-alert', 'shield-check', 'zap', 'repeat',
         'trash-2', 'wind', 'play', 'chart-candlestick', 'chart-line', 'check', 'link', 'gift', 'chevrons-down', 'dollar-sign',
         'sparkles', 'x']
def icon(name):
    """Lucide's icon node, [[tag, {attr: value}], …] in a 24×24 box, parsed from its ES module."""
    src = open(os.path.join(ROOT, 'node_modules/lucide-react/dist/esm/icons', name + '.mjs'), encoding='utf-8').read()
    alias = re.search(r"export \{ default \} from '\./([\w-]+)\.mjs'", src)   # renamed icons re-export the new name
    if alias: return icon(alias.group(1))
    block = src[src.index('node: ['):src.index('__iconData.node')]
    out = []
    for tag, attrs in re.findall(r'\[\s*"(\w+)",\s*\{(.*?)\}\s*\]', block, re.S):
        a = {k: v for k, v in re.findall(r'(\w+):\s*"([^"]*)"', attrs) if k != 'key'}
        out.append([tag, a])
    assert out, name
    return out
icons = json.dumps({n: icon(n) for n in ICONS}, separators=(',', ':'))
html = f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>Three numbers, glass</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; }}
html, body {{ margin: 0; background: #0B0A22; overflow: hidden; }} canvas {{ display: block; width: 1080px; height: 1920px; }}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas>
<script>window.DATA = {open(os.path.join(HERE, '../n1/data.json'), encoding='utf-8').read()}; window.ICONS = {icons};
window.LOGO = {{ icon: {svg('brand/svg/app-icon.svg')}, word: {svg('brand/svg/wordmark-fa-white.svg')} }};</script>
<script>
{rd('scenes.js')}
</script></body></html>
'''
open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8').write(html); print('index.html', len(html) // 1024, 'KB,', len(ICONS), 'icons')
