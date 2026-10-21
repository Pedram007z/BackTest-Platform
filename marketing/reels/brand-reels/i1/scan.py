# Lists every NAS100 day (Jan 2024 – Sep 2026) where setup.py's short setup forms in the NY morning (sweep by 10:30 NY,
# FVG within 8 bars, entry filled, stop or target reached), with how fast it played out. The reel's two days were picked
# by eye from the quick, clean ones: 2025-01-07 (target) and 2026-05-18 (stop).   python3 scan.py
import sys, datetime as dt
sys.argv = ['x']; exec(open('setup.py').read().split("if __name__")[0])
rows, d = [], dt.date(2024, 1, 2)
while d <= dt.date(2026, 9, 30):
    if d.weekday() < 5:
        try: s = setup('NAS100', d.isoformat())
        except Exception: s = None
        if s and s['sweep'] * 5 / 60 + 2 <= 10.5 and s['fvg_i'] - s['sweep'] <= 8 and s['fill_i'] is not None and s['out_i'] is not None:
            rows.append((d.isoformat(), s['out'], s['fill'], s['out_t'], s['out_i'] - s['sweep']))
    d += dt.timedelta(1)
for r in rows: print(*r)
print(len(rows), 'setups:', sum(r[1] == 'tp' for r in rows), 'target,', sum(r[1] == 'sl' for r in rows), 'stop')
