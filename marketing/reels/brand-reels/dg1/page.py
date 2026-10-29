# dg1: builds index.html. It inlines:
#   - the Vazirmatn fonts;
#   - the BacktestLab icon and white Persian wordmark (the icon's SVG also as text, for its shapes in glass);
#   - dg1's data.json (the voice timing);
#   - the Lucide icons the scene uses (ISC licence, from node_modules/lucide-react);
#   - three.js (vendor/three-bundle.js, built by vendor/bundle.sh);
#   - scenes.js.
# The page has two canvases: #g (WebGL, the glass world) and #c (2D, the text on top).
#   python3 page.py
import base64, json, os, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '../../../..')
b64 = lambda p: base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()
rd = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()
svg = lambda p: f"'data:image/svg+xml;base64,{b64(p)}'"
ICONS = ['trophy', 'star', 'crosshair', 'log-in', 'octagon-x', 'target', 'shield', 'check', 'split', 'chart-line', 'piggy-bank',
         'footprints', 'user-plus', 'link', 'gift', 'chevrons-down', 'list-checks']
def icon(name):
    """Lucide's icon node, [[tag, {attr: value}], …] in a 24×24 box, parsed from its ES module."""
    src = open(os.path.join(ROOT, 'node_modules/lucide-react/dist/esm/icons', name + '.mjs'), encoding='utf-8').read()
    alias = re.search(r"export \{ default \} from '\./([\w-]+)\.mjs'", src)
    if alias: return icon(alias.group(1))
    block = src[src.index('node: ['):src.index('__iconData.node')]
    out = []
    for tag, attrs in re.findall(r'\[\s*"(\w+)",\s*\{(.*?)\}\s*\]', block, re.S):
        out.append([tag, {k: v for k, v in re.findall(r'(\w+):\s*"([^"]*)"', attrs) if k != 'key'}])
    assert out, name
    return out
icons = json.dumps({n: icon(n) for n in ICONS}, separators=(',', ':'))
bundle = os.path.join(HERE, 'vendor/three-bundle.js')
assert os.path.exists(bundle), 'build vendor/three-bundle.js first (see vendor/bundle.sh)'
app_svg = json.dumps(open(os.path.join(ROOT, 'brand/svg/app-icon.svg'), encoding='utf-8').read())
html = f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>The 100-trade challenge</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; }}
html, body {{ margin: 0; background: #07051A; overflow: hidden; }} canvas {{ display: block; width: 1080px; height: 1920px; position: absolute; left: 0; top: 0; }}
</style></head><body><canvas id="g" width="1080" height="1920"></canvas><canvas id="c" width="1080" height="1920"></canvas>
<script>window.DATA = {rd('data.json')}; window.ICONS = {icons}; window.APP_SVG = {app_svg};
window.LOGO = {{ icon: {svg('brand/svg/app-icon.svg')}, word: {svg('brand/svg/wordmark-fa-white.svg')} }};</script>
<script>{open(bundle, encoding='utf-8').read()}</script>
<script>
{rd('scenes.js')}
</script></body></html>
'''
open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8').write(html); print('index.html', len(html) // 1024, 'KB,', len(ICONS), 'icons')
