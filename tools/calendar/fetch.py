"""Download the official pages the central-bank collectors read, into a work folder.

    python3 tools/calendar/fetch.py WORK_DIR [--refresh]

One request a second; a file already downloaded is kept unless --refresh (pages that change: the
current year's lists and the calendars of meetings ahead are always fetched again with --refresh).
"""
import os, re, sys, time, html, urllib.request

W = sys.argv[1]
REFRESH = '--refresh' in sys.argv
UA = {'User-Agent': 'backtestlab-calendar (economic calendar dates; github.com/Pedram007z/BackTest-Platform)'}
YEAR = time.gmtime().tm_year
_last = 0.0


def get(url, path, always=False):
    """Save `url` to WORK_DIR/path (kept if present, unless --refresh and `always`). Returns the text."""
    global _last
    full = os.path.join(W, path)
    if os.path.exists(full) and not (REFRESH and always):
        return open(full, encoding='utf-8', errors='replace').read() if not full.endswith('.xlsx') else ''
    os.makedirs(os.path.dirname(full), exist_ok=True)
    time.sleep(max(0, 1.0 - (time.time() - _last)))
    _last = time.time()
    data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
    open(full, 'wb').write(data)
    print(f'{len(data):>9}  {path}')
    return data.decode('utf-8', errors='replace')


# Federal Reserve: FOMC pages by year (the five latest years are on the calendar page)
for y in range(2014, 2021):
    get(f'https://www.federalreserve.gov/monetarypolicy/fomchistorical{y}.htm', f'fed/fomc{y}.html')
get('https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm', 'fed/fomccal.html', always=True)

# ECB: monetary policy decisions and meeting accounts by year, and the meeting calendar
for y in range(2015, YEAR + 1):
    cur = y >= YEAR - 1
    get(f'https://www.ecb.europa.eu/press/govcdec/mopo/{y}/html/index_include.en.html', f'ecb/mopo{y}.html', cur)
    get(f'https://www.ecb.europa.eu/press/accounts/{y}/html/index_include.en.html', f'ecb/acc{y}.html', cur)
get('https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html', 'ecb/mgcgc.html', always=True)

# Bank of England: MPC voting history (every meeting) and the confirmed dates ahead
get('https://www.bankofengland.co.uk/-/media/boe/files/monetary-policy-summary-and-minutes/mpcvoting.xlsx', 'boe/mpcvoting.xlsx', always=True)
get('https://www.bankofengland.co.uk/monetary-policy/upcoming-mpc-dates', 'boe/upcoming.html', always=True)

# Bank of Canada: the press release list (rate announcements and yearly schedule notices)
first = get('https://www.bankofcanada.ca/press/press-releases/?mt_page=1', 'boc/list/p1.html', always=True)
pages = max([int(n) for n in re.findall(r'mt_page=(\d+)', first)] + [1])
for p in range(2, pages + 1):
    get(f'https://www.bankofcanada.ca/press/press-releases/?mt_page={p}', f'boc/list/p{p}.html', p <= 3)
for p in range(1, pages + 1):
    t = open(os.path.join(W, f'boc/list/p{p}.html'), encoding='utf-8', errors='replace').read()
    for url, title in re.findall(r'<a[^>]+href="(https://www\.bankofcanada\.ca/\d{4}/\d{2}/[^"]+)"[^>]*>([^<]{10,200})</a>', t):
        m = re.search(r'(\d{4}) [Ss]chedule', html.unescape(title))
        if m and int(m.group(1)) >= YEAR - 1:
            get(url, f'boc/schedule-{m.group(1)}.html')

# Bank of Japan: past meetings (tables by year) and this year's schedule
get('https://www.boj.or.jp/en/mopo/mpmsche_minu/past.htm', 'boj/past.html', always=True)
get('https://www.boj.or.jp/en/mopo/mpmsche_minu/index.htm', 'boj/schedule.html', always=True)

# Swiss National Bank: list of monetary policy decisions
get('https://www.snb.ch/en/the-snb/mandates-goals/monetary-policy/decisions', 'snb/decisions.html', always=True)

# Reserve Bank of Australia: media releases by year and the board meeting schedules
for y in range(2015, YEAR + 1):
    get(f'https://www.rba.gov.au/media-releases/{y}/', f'rba/mr{y}.html', y >= YEAR - 1)
get('https://www.rba.gov.au/schedules-events/board-meeting-schedules.html', 'rba/schedule.html', always=True)
