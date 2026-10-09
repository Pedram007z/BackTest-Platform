"""Japanese releases: the Bank of Japan's Tankan survey (its list of Tankan summaries by year, each with its
release date; 8:50 Tokyo time) and the Cabinet Office's quarterly GDP estimates (its release archive by
year, and its release schedule for the coming ones; 8:50 Tokyo time).

    python3 tools/calendar/jp_releases.py WORK_DIR [OUT.json] [--csv OUT.csv] [--refresh]

Pages are saved in WORK_DIR/jp/ (--refresh fetches them again).
"""
import datetime as dt
import html
import os
import re
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from schedule import START, TODAY, write  # noqa: E402

W = sys.argv[1]
UA = {'User-Agent': 'backtestlab-calendar (economic calendar dates; github.com/Pedram007z/BackTest-Platform)'}
MON = {m: i + 1 for i, m in enumerate(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'])}


def get(url, name):
    path = os.path.join(W, 'jp', name)
    if not os.path.exists(path) or '--refresh' in sys.argv:
        data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, 'wb').write(data)
        time.sleep(1)
    return open(path, encoding='utf-8', errors='replace').read()


def text(page):
    page = re.sub(r'<script.*?</script>|<style.*?</style>', '', page, flags=re.S)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', page))).replace('\xa0', ' ')


def date(mon, day, year):
    return dt.date(int(year), MON[mon[:3].lower()], int(day)).isoformat()


events = []


def add(day, items, source):
    if day >= START:
        for title, impact in items:
            events.append({'ccy': 'JPY', 'tz': 'Asia/Tokyo', 'source': source, 'title': title, 'date': day, 'time': '08:50', 'impact': impact})


# Tankan: one page per five years ("Dec. 14, 2016 | December 2016 Survey")
tankan = set()
for first in range(2011, int(TODAY[:4]) + 1, 5):
    page = get(f'https://www.boj.or.jp/en/statistics/tk/gaiyo/{first}/index.htm', f'tankan{first}.html')
    for mon, day, year in re.findall(r'<td>\s*([A-Z][a-z]+)\.?(?:\s|&nbsp;)+(\d{1,2}),(?:\s|&nbsp;)*(\d{4})\s*</td>\s*<td>[A-Z][a-z]+ \d{4} Survey', page):
        tankan.add(date(mon, day, year))
for day in sorted(tankan):
    add(day, [('Tankan Manufacturing Index', 'medium'), ('Tankan Non-Manufacturing Index', 'low')], 'boj.or.jp')

# GDP: "Feb. 13, 2017 Quarterly Estimates of GDP for Oct. - Dec. 2016 (The First Preliminary)"
gdp = {}
for year in range(2014, int(TODAY[:4]) + 1):
    t = text(get(f'https://www.esri.cao.go.jp/en/sna/data/sokuhou/files/{year}/toukei_{year}.html', f'gdp{year}.html'))
    for mon, day, yr, kind in re.findall(r'([A-Z][a-z]+)\.? (\d{1,2}), (\d{4}) Quarterly Estimates of GDP.{0,60}?\(The (First|Second) Preliminary', t, re.I):
        gdp[date(mon, day, yr)] = kind.capitalize()
# coming releases: "Jul.-Sep. 2026 (The First Preliminary) Monday, November 16, 2026 8:50AM (JST)"
t = text(get('https://www.esri.cao.go.jp/en/sna/kouhyou/kouhyou_top.html', 'gdp-schedule.html'))
for kind, mon, day, yr in re.findall(r'\(The (First|Second) Preliminary\) [A-Z][a-z]+, ([A-Z][a-z]+) (\d{1,2}), (\d{4}) 8:50', t, re.I):
    gdp.setdefault(date(mon, day, yr), kind.capitalize())
last = {}
for day, kind in sorted(gdp.items()):
    # a second preliminary estimate corrected weeks later (August 2020, July 2024) is not a scheduled release
    if kind in last and (dt.date.fromisoformat(day) - last[kind]).days < 45:
        continue
    last[kind] = dt.date.fromisoformat(day)
    add(day, [('Prelim GDP q/q', 'medium')] if kind == 'First' else [('Final GDP q/q', 'low')], 'esri.cao.go.jp')

write(events, *sys.argv[2:])
