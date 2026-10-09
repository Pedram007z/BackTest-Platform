"""Euro-area releases from Eurostat's "euro indicators" (its list of news releases, read through the
list's Atom feed: title and publication time of every release since 2002; 11:00 Luxembourg time).

    python3 tools/calendar/eu_releases.py WORK_DIR [OUT.json] [--csv OUT.csv] [--refresh]

The feed pages are saved in WORK_DIR/eurostat/ (--refresh fetches them again for new releases).
Releases are told apart by their titles ("Euro area annual inflation up to 2.2%") and by when they come
out: the inflation flash estimate at the end of the reference month, the full figures mid-month; GDP's
preliminary flash about 30 days after the quarter, the flash estimate mid second month, the update early
third month.
"""
import datetime as dt
import glob
import html
import os
import re
import sys
import time
import urllib.request
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from schedule import START, write  # noqa: E402

W = sys.argv[1]
UA = {'User-Agent': 'backtestlab-calendar (economic calendar dates; github.com/Pedram007z/BackTest-Platform)'}
P = '_estatsearchportlet_WAR_estatsearchportlet_INSTANCE_OaTpFrwlabNK'
FEED = ('https://ec.europa.eu/eurostat/en/news/euro-indicators?p_p_id=estatsearchportlet_WAR_estatsearchportlet_INSTANCE_OaTpFrwlabNK'
        '&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=atom&p_p_cacheability=cacheLevelPage'
        f'&{P}_pageNumber={{n}}&{P}_pageSize=200&{P}_sort=lastUpdateDate&{P}_collection=CAT_PREREL')
LUX = ZoneInfo('Europe/Luxembourg')


def pages():
    os.makedirs(os.path.join(W, 'eurostat'), exist_ok=True)
    n = 1
    while True:
        path = os.path.join(W, 'eurostat', f'atom{n}.xml')
        if not os.path.exists(path) or '--refresh' in sys.argv:
            data = urllib.request.urlopen(urllib.request.Request(FEED.format(n=n), headers=UA), timeout=90).read()
            open(path, 'wb').write(data)
            time.sleep(1)
        t = open(path, encoding='utf-8', errors='replace').read()
        if '<entry>' not in t or n >= 40:
            break
        yield t
        n += 1


releases = {}
for t in pages():
    for e in re.findall(r'<entry>(.*?)</entry>', t, re.S):
        title = re.search(r'<title[^>]*>(.*?)</title>', e, re.S)
        updated = re.search(r'<updated>(.*?)</', e)
        if title and updated:
            utc = dt.datetime.strptime(updated.group(1)[:16], '%Y-%m-%dT%H:%M').replace(tzinfo=dt.timezone.utc)
            releases[(utc, html.unescape(title.group(1)).strip())] = True

kinds = {}  # (kind, local date) → local time


def add(kind, local):
    kinds.setdefault((kind, local.date().isoformat()), local.strftime('%H:%M'))


for utc, title in sorted(releases):
    local = utc.astimezone(LUX)
    if local.date().isoformat() < START:
        continue
    day, month = local.day, local.month
    if re.search(r'inflation', title, re.I) and not re.search(r'labour cost|household', title, re.I):
        # full figures mid-month (January's late February), the flash at the end of the month (early January after the holidays)
        add('final-cpi' if 10 <= day <= 25 else 'flash-cpi', local)
    elif re.match(r'(euro area (and EU\S* )?|euro-zone )?GDP (up|down|stable|unchanged|and employment)', title, re.I) or re.search(r'preliminary flash estimate', title, re.I):
        q = month % 3  # 1: first month after the quarter, 2: second, 0: third
        if (q == 1 and day >= 25) or (q == 2 and day <= 3):
            add('prelim-gdp', local)
        elif q == 2:
            add('flash-gdp', local)
        else:
            add('revised-gdp', local)
    elif re.search(r'unemployment', title, re.I):
        add('unemployment', local)
    elif re.search(r'retail trade', title, re.I):
        add('retail', local)
    elif re.match(r'Industrial production', title, re.I):
        add('production', local)
    elif re.search(r'industrial producer prices', title, re.I):
        add('ppi', local)
    elif re.match(r'euro(-| )?(area|zone) (international trade in goods|external trade)', title, re.I):
        add('trade', local)

EVENTS = {
    'flash-cpi': [('CPI Flash Estimate y/y', 'high'), ('Core CPI Flash Estimate y/y', 'medium')],
    'final-cpi': [('Final CPI y/y', 'low')],
    'prelim-gdp': [('Prelim Flash GDP q/q', 'medium')],
    'flash-gdp': [('Flash GDP q/q', 'low')],
    'revised-gdp': [('Revised GDP q/q', 'low')],
    'unemployment': [('Unemployment Rate', 'low')],
    'retail': [('Retail Sales m/m', 'low')],
    'production': [('Industrial Production m/m', 'low')],
    'ppi': [('PPI m/m', 'low')],
    'trade': [('Trade Balance', 'low')],
}
# a corrected release a few days after the first counts once (releases come at least three weeks apart)
last, events = {}, []
for (kind, date), hhmm in sorted(kinds.items(), key=lambda x: x[0][1]):
    d = dt.date.fromisoformat(date)
    if kind in last and (d - last[kind]).days < 10:
        continue
    last[kind] = d
    for title, impact in EVENTS[kind]:
        events.append({'ccy': 'EUR', 'tz': 'Europe/Luxembourg', 'source': 'ec.europa.eu/eurostat', 'title': title, 'date': date, 'time': hhmm, 'impact': impact})

write(events, *sys.argv[2:])
