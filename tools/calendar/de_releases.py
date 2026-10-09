"""German releases: the ZEW Indicator of Economic Sentiment. ZEW's list of press releases labels each
monthly result "ZEW Indicator of Economic Sentiment // <date>" (one a month since before 2015), and its
yearly "Release Dates for ZEW Indicator of Economic Sentiment" announcements give the coming dates and the
time: 11:05 Frankfurt time in the announcements for 2024 to 2027; 11:00 before.

    python3 tools/calendar/de_releases.py WORK_DIR [OUT.json] [--csv OUT.csv] [--refresh]

The list's pages are saved in WORK_DIR/zew/ (about 160 pages back to 2015, one request a second;
--refresh fetches them again for new releases).
"""
import datetime as dt
import html
import os
import re
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from schedule import START, write  # noqa: E402

W = sys.argv[1]
UA = {'User-Agent': 'Mozilla/5.0 (compatible; backtestlab-calendar; economic calendar dates; github.com/Pedram007z/BackTest-Platform)'}
BASE = 'https://www.zew.de'
LIST = BASE + '/en/press/latest-press-releases?tx_news_pi1%5BoverwriteDemand%5D%5Bcategories%5D=29&cHash=cdf8364d229b2d9bde4d933812d4f134'
LABEL = 'ZEW Indicator of Economic Sentiment'
MONTHS = {m: i + 1 for i, m in enumerate(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'])}


def get(url, name, refresh=False):
    path = os.path.join(W, 'zew', name)
    if not os.path.exists(path) or refresh:
        data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, 'wb').write(data)
        time.sleep(1)
    return open(path, encoding='utf-8', errors='replace').read()


def text(page):
    page = re.sub(r'<script.*?</script>|<style.*?</style>', '', page, flags=re.S)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', page)))


# the press list, newest first, following its "next page" links until 2015
items = []  # (label, date, title, href)
url, n = LIST, 1
while url:
    page = get(url, f'list{n}.html', refresh='--refresh' in sys.argv and n <= 3)
    oldest = '9999'
    for m in re.finditer(r'c-category-label">\s*(.*?)\s*//\s*(\d\d)\.(\d\d)\.(\d{4})\s*</span>.*?href="([^"]+)">([^<]+)<', page, re.S):
        day = f'{m.group(4)}-{m.group(3)}-{m.group(2)}'
        oldest = min(oldest, day)
        items.append((m.group(1).strip(), day, html.unescape(m.group(6)).strip(), m.group(5)))
    if oldest < START:
        break
    nxt = re.search(r'href="([^"]*currentPage%5D=' + str(n + 1) + r'&[^"]*)"', page)
    url = BASE + html.unescape(nxt.group(1)) if nxt else None
    n += 1

released, announced, times = set(), {}, {}
for label, day, title, href in items:
    if label != LABEL:
        continue
    year = re.match(r'(\d{4}) Release Dates', title)
    if not year:
        released.add(day)
        continue
    # "In 2026, the ZEW Indicator … will be released on the following dates at 11:05 a.m. Frankfurt Time. 20 January 2026 …"
    t = text(get(BASE + href, href.rstrip('/').split('/')[-1] + '.html'))
    m = re.search(r'released on the following dates at (\d{1,2}):(\d\d) ?a\.m\.[^.]*\.(.{0,600}?)To contacts', t)
    if not m:
        continue
    times[int(year.group(1))] = f'{int(m.group(1)):02d}:{m.group(2)}'
    for d, mon, y in re.findall(r'(\d{1,2}) ([A-Z][a-z]+) (\d{4})', m.group(3)):
        announced[f'{y}-{MONTHS[mon.lower()]:02d}-{int(d):02d}'] = int(year.group(1))
    for mon, d, y in re.findall(r'([A-Z][a-z]+) (\d{1,2}), (\d{4})', m.group(3)):
        announced[f'{y}-{MONTHS[mon.lower()]:02d}-{int(d):02d}'] = int(year.group(1))

today = dt.date.today().isoformat()
days = {d for d in released if d >= START} | {d for d in announced if d > today}
events = []
for day in sorted(days):
    # an announcement's time holds for its dates (the 2027 list ends with January 2028)
    hhmm = times.get(announced.get(day, int(day[:4])), '11:00')
    events.append({'ccy': 'EUR', 'tz': 'Europe/Berlin', 'source': 'zew.de', 'title': 'German ZEW Economic Sentiment', 'date': day, 'time': hhmm, 'impact': 'high'})
missed = sorted(d for d in announced if d <= today and d not in released and d >= START)
print(f'{len(released)} releases listed, {len(announced)} dates announced, times {times}; announced but not listed: {missed}', file=sys.stderr)

write(events, *sys.argv[2:])
