# i1 · «ICT و اسمارت‌مانی: وین‌ریتش رو می‌دونی؟»: music-only reel (no voice; the on-screen lines carry the script).
# Writes data.json: the timeline (T, seconds) and the two real NAS100 charts (5-minute bars, New York time) with the
# setup's levels from setup.py: London (02–05 NY) high swept in the NY morning, the displacement's first bearish FVG,
# entry at its midpoint, stop above the sweep's high, target 2R; the outcome is replayed on the stored 1-minute bars.
#   python3 build.py && python3 page.py && python3 sound.py && node render.cjs video i1.mp4 mix.wav
import json, sys, datetime as dt
from zoneinfo import ZoneInfo
sys.argv = ['x']; exec(open('setup.py').read().split("if __name__")[0])
NY = ZoneInfo('America/New_York')
T = dict(hook=0.0, q1=2.7, q2=4.6, guess=6.6, dunno=8.8, chart=10.4, liq=11.6, sweep=12.9, fvg=14.1, entry=15.3, run=16.4, tp=17.6,
         loss=19.2, lbuild=19.8, lrun=21.0, sl=22.0, proof=23.4, grid=25.0, brand=27.2, f1=28.6, f2=30.8, f3=33.0, f4=35.2, f5=37.2,
         cta=40.0, end=41.6, dur=45.0)
def chart(day, jalali, before, after):
    s = setup('NAS100', day); b = s['bars']; a0 = s['sweep'] - before; a1 = s['out_i'] + after + 1
    rel = lambda i: None if i is None else i - a0
    bars = [[round(x, 2) for x in r[1:]] for r in b[a0:a1]]
    times = [dt.datetime.fromtimestamp(r[0], NY).strftime('%H:%M') for r in b[a0:a1]]
    return dict(day=day, jalali=jalali, bars=bars, times=times, LH=round(s['LH'], 2), sweep=rel(s['sweep']), ext=rel(s['ext_i']), fvg_i=rel(s['fvg_i']),
                fvg=[round(v, 2) for v in s['fvg']], ce=round(s['ce'], 2), sl=round(s['sl'], 2), tp=round(s['tp'], 2), fill=rel(s['fill_i']),
                out=rel(s['out_i']), result=s['out'], fill_t=s['fill'], out_t=s['out_t'])
C = {'win': chart('2025-01-07', '۱۸ دی ۱۴۰۳', 13, 2), 'loss': chart('2026-05-18', '۲۸ اردیبهشت ۱۴۰۵', 18, 2)}
C['win']['badge'], C['loss']['badge'] = [330, 1190], [330, 1240]   # the result badge: an empty corner of each chart
for k, c in C.items():
    assert c['result'] == ('tp' if k == 'win' else 'sl'), (k, c['result'])
    print(k, c['day'], len(c['bars']), 'bars', c['times'][0], '→', c['times'][-1], '| sweep', c['times'][c['sweep']], 'fvg', c['times'][c['fvg_i']],
          'fill', c['fill_t'], c['result'], c['out_t'], '| LH', c['LH'], 'CE', c['ce'], 'SL', c['sl'], 'TP', c['tp'])
json.dump({'T': T, 'dur': T['dur'], 'charts': C}, open('data.json', 'w'), ensure_ascii=False)
