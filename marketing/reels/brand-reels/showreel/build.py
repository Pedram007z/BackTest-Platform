# «بازپخش» showreel: inlines the Vazirmatn fonts (base64), data.json and the scene + sound code into self-contained
# pages: index.html (the 16:9 film, 1920×1080, 25 s) and reel.html (the 9:16 Instagram cut, 1080×1920, 28 s).
#   python3 data.py <market store> && python3 build.py && node render.cjs stills|audio|video …
import base64, os
HERE = os.path.dirname(os.path.abspath(__file__)); FONTS = os.path.join(HERE, '../../../../public/fonts')
b64 = lambda f: base64.b64encode(open(os.path.join(FONTS, f), 'rb').read()).decode()
rd = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()
def page(fmt, w, h):
    return f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>Replay showreel</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }}
html, body {{ margin: 0; background: #09080D; overflow: hidden; }} canvas {{ display: block; width: {w}px; height: {h}px; }}
</style></head><body><canvas id="c" width="{w}" height="{h}"></canvas><svg width="0" height="0" style="position:absolute"><defs id="flt"></defs></svg>
<script>window.FORMAT = '{fmt}'; window.DATA = {rd('data.json')};</script>
<script>
{rd('showreel.js')}
</script>
<script>
{rd('sound.js')}
</script></body></html>
'''
for fmt, w, h, name in (('film', 1920, 1080, 'index.html'), ('reel', 1080, 1920, 'reel.html')):
    html = page(fmt, w, h); open(os.path.join(HERE, name), 'w', encoding='utf-8').write(html); print(name, len(html) // 1024, 'KB')
