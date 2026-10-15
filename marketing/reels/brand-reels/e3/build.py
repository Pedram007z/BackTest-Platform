# e3 · «از شنبه»: the FOMO reel. On Saturday 16 Dey 1402 (6 Jan 2024) the trader writes «از شنبه شروع می‌کنم» on his
# closed laptop and goes back to his phone. Week after week the sky turns, the calendar flips to another Saturday, the
# notes pile up, other people post their progress, and gold climbs on its real monthly closes (XAUUSD from the
# platform's store) until today: $4,108 (+101%) and 145 Saturdays later. He puts the phone down and opens the laptop.
#   python3 build.py <xau_h1.csv> && python3 ../mkpage_e.py e3 && python3 sound.py
import csv, json, sys
from datetime import datetime, timezone, date, timedelta

def jalali(g):
    gy, gm, gd = g.year, g.month, g.day
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = 355666 + 365 * gy + (gy2 + 3) // 4 - (gy2 + 99) // 100 + (gy2 + 399) // 400 + gd + g_d_m[gm - 1]
    jy = -1595 + 33 * (days // 12053); days %= 12053; jy += 4 * (days // 1461); days %= 1461
    if days > 365: jy += (days - 1) // 365; days = (days - 1) % 365
    jm = 1 + days // 31 if days < 186 else 7 + (days - 186) // 30
    jd = 1 + (days % 31 if days < 186 else (days - 186) % 30)
    return jy, jm, jd
MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
fa = lambda n: str(n).translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))

H1 = [(int(r['t']), float(r['c'])) for r in csv.DictReader(open(sys.argv[1]))]
start = date(2024, 1, 6); assert start.weekday() == 5 and jalali(start) == (1402, 10, 16)
p0 = [c for t, c in H1 if datetime.fromtimestamp(t, timezone.utc).date() <= date(2024, 1, 5)][-1]   # Friday's close
monthly = {}
for t, c in H1:
    d = datetime.fromtimestamp(t, timezone.utc).date()
    if d >= start: monthly[(d.year, d.month)] = (d, c)
series = [[d.isoformat(), round(c, 2)] for d, c in monthly.values()]
last_d, last_c = monthly[max(monthly)]
sats = (date(2026, 10, 10) - start).days // 7 + 1
# the time-lapse steps: one Saturday per step, each showing the gold price of that week
steps, picks = [], [0, 2, 4, 6, 8, 9, 12, 14, 15, 19, 20, 21, 23, 24, 25, 27, 29, 31, 33]
for i in picks:
    d, c = list(monthly.values())[i]
    sat = d - timedelta(days=(d.weekday() - 5) % 7)
    jy, jm, jd = jalali(sat)
    steps.append({'i': i, 'price': round(c), 'label': f'{MONTHS[jm - 1]} {fa(jy)}', 'day': fa(jd), 'month': MONTHS[jm - 1], 'year': fa(jy)})
jy, jm, jd = jalali(last_d)
T = {'room': 2.6, 'lapse': 4.3, 'freeze': 14.6, 'turn': 16.6, 'lid': 17.25, 'end': 19.2}
ts, t = [], T['lapse']
for k in range(len(steps)):
    ts.append(round(t, 3)); t += 0.72 + (0.34 - 0.72) * k / (len(steps) - 1)
assert t <= T['freeze'] + 0.05, t
for s, x in zip(steps, ts): s['t'] = x
data = {'t': T, 'dur': 22.2, 'p0': round(p0), 'series': series, 'steps': steps, 'last': {'price': round(last_c), 'label': f'{MONTHS[jm - 1]} {fa(jy)}'},
        'gain': round((last_c / p0 - 1) * 100), 'saturdays': sats, 'place': [], 'lens': [], 'lines': []}
json.dump(data, open('data.json', 'w'), ensure_ascii=False)
print('p0', round(p0, 2), 'last', last_d, round(last_c, 2), 'gain', data['gain'], '% saturdays', sats, 'lapse ends', round(t, 2))
print([(s['label'], s['price'], s['t']) for s in steps])
