"""Australian releases from the Australian Bureau of Statistics: each release's own page gives its release
date and time. Releases up to 2020 are on the ABS's archived site (a "Past & Future Releases" list per
catalogue number), later ones on the current site (a list of releases on the product's page).

    python3 tools/calendar/au_releases.py WORK_DIR [OUT.json] [--csv OUT.csv]

Pages are saved in WORK_DIR/abs/ (one request a second); a run fetches only pages it does not have.
"""
import datetime as dt
import hashlib
import html
import os
import re
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from schedule import START, write  # noqa: E402

W = sys.argv[1]
UA = {'User-Agent': 'backtestlab-calendar (economic calendar dates; github.com/Pedram007z/BackTest-Platform)'}
OLD = 'https://www.abs.gov.au/AUSSTATS/abs@.nsf/'
NEW = 'https://www.abs.gov.au'



def cpi(date):
    """The CPI was quarterly until the September quarter 2025; since November 2025 it is monthly, the quarterly
    measures coming with the last month of each quarter (released in January, April, July and October)."""
    quarterly = [('CPI q/q', 'high'), ('Trimmed Mean CPI q/q', 'high')]
    if date < '2025-11-01':
        return quarterly
    return [('CPI y/y', 'high')] + (quarterly if int(date[5:7]) in (1, 4, 7, 10) else [])


# (catalogue number on the archived site, product path on the current site, first date) → events (title, impact),
# or a function of the release date giving them
PRODUCTS = [
    ('6202.0', '/statistics/labour/employment-and-unemployment/labour-force-australia', None, [('Employment Change', 'high'), ('Unemployment Rate', 'high')]),
    ('6401.0', '/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia', None, cpi),
    # the monthly indicator, published from October 2022 until the full monthly CPI replaced it
    (None, '/statistics/economy/price-indexes-and-inflation/monthly-consumer-price-index-indicator', None, [('Monthly CPI Indicator y/y', 'medium')]),
    ('6345.0', '/statistics/economy/price-indexes-and-inflation/wage-price-index-australia', None, [('Wage Price Index q/q', 'medium')]),
    ('8501.0', '/statistics/industry/retail-and-wholesale-trade/retail-trade-australia', None, [('Retail Sales m/m', 'medium')]),
    # Retail Trade's last release was July 2025; the household spending indicator took its place
    (None, '/statistics/economy/finance/monthly-household-spending-indicator', '2025-08-01', [('Household Spending m/m', 'medium')]),
    ('5206.0', '/statistics/economy/national-accounts/australian-national-accounts-national-income-expenditure-and-product', None, [('GDP q/q', 'high')]),
    ('5368.0', '/statistics/economy/international-trade/international-trade-goods', None, [('Trade Balance', 'low')]),
]
_last = 0.0


def get(url):
    global _last
    path = os.path.join(W, 'abs', hashlib.sha1(url.encode()).hexdigest()[:16] + '.html')
    if os.path.exists(path):
        return open(path, encoding='utf-8', errors='replace').read()
    for attempt in range(3):
        time.sleep(max(0, 1.0 - (time.time() - _last)) + 5 * attempt)
        _last = time.time()
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
            break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return ''
            if attempt == 2:
                raise
        except OSError:
            if attempt == 2:
                raise
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'wb').write(data)
    return data.decode('utf-8', errors='replace')


def text(page):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'<script.*?</script>|<style.*?</style>', '', page, flags=re.S))))


events = []
for catalogue, path, since, items in PRODUCTS:
    released = {}  # date → HH:MM
    # archived site: releases up to 2020 ("<title> Aug 2019" → its page "Released at 11:30 AM (CANBERRA TIME) 19/09/2019")
    if catalogue:
        listing = get(f'{OLD}second+level+view?ReadForm&prodno={catalogue}&&tabname=Past%20Future%20Issues')
        for href, title in re.findall(r"<a href='(allprimarymainfeatures/[0-9A-F]+\?opendocument)'>([^<]+)</a>", listing):
            m = re.search(r'(\d{4})$', title.strip())
            if not m or not 2014 <= int(m.group(1)) <= 2020:
                continue
            r = re.search(r'Released at (\d{1,2}):(\d{2}) ?([AP]M) \(CANBERRA TIME\) (\d{1,2})/(\d{1,2})/(\d{4})', text(get(OLD + href)), re.I)
            if r:
                hh = int(r.group(1)) % 12 + (12 if r.group(3).upper() == 'PM' else 0)
                released[f'{r.group(6)}-{int(r.group(5)):02d}-{int(r.group(4)):02d}'] = f'{hh:02d}:{r.group(2)}'
    # current site: the product page lists its releases (…/<path>/jul-2026); each page has "Release date and time"
    product = get(NEW + path)
    for slug in sorted(set(re.findall(re.escape(path) + r'/([a-z]{3}-\d{4}|[a-z]+-quarter-\d{4}|[a-z]{3}-[a-z]{3}-\d{4})"', product))):
        r = re.search(r'Release date and time (\d{1,2})/(\d{1,2})/(\d{4}) (\d{1,2}):(\d{2}) ?([ap]m)', text(get(f'{NEW}{path}/{slug}')))
        if r:
            hh = int(r.group(4)) % 12 + (12 if r.group(6) == 'pm' else 0)
            released[f'{r.group(3)}-{int(r.group(2)):02d}-{int(r.group(1)):02d}'] = f'{hh:02d}:{r.group(5)}'
    for date, hhmm in sorted(released.items()):
        if date >= max(START, since or START):
            for title, impact in items(date) if callable(items) else items:
                events.append({'ccy': 'AUD', 'tz': 'Australia/Sydney', 'source': 'abs.gov.au', 'title': title, 'date': date, 'time': hhmm, 'impact': impact})
    print(path.split('/')[-1], len(released), min(released, default='-'), max(released, default='-'), file=sys.stderr)

write(events, *sys.argv[2:])
