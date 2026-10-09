"""Central-bank rate decisions since 2015, from the banks' own pages (downloaded by fetch.py).

    python3 tools/calendar/central_banks.py WORK_DIR [OUT.json] [--csv OUT.csv]

Writes the schedule the API server fills past calendar weeks with: when each decision, statement,
press conference, report or set of minutes came out (UTC), its currency and impact. No values. The
impact is this platform's own classification. An event whose exact time is not published or not
confirmed is placed at noon local time and marked `tentative`.

Sources and times (local time of the bank):
- Fed: fomchistorical<YEAR>.htm and fomccalendars.htm; statement 14:00 ET, press conference 14:30 ET
  (after every meeting from 2019), minutes 14:00 ET on the date the Fed lists.
- ECB: its lists of monetary policy decisions and meeting accounts, and the meeting calendar;
  decision 13:45 and press conference 14:30 (Frankfurt) until June 2022, 14:15 and 14:45 from the
  July 2022 meeting (ECB press release of 27 June 2022); accounts 13:30.
- Bank of England: the MPC voting history (mpcvoting.xlsx) and the confirmed dates ahead; 12:00 UK.
- Bank of Canada: its rate-announcement press releases and yearly schedule notices; 10:00 ET until
  July 2024, 09:45 ET from September 2024; Monetary Policy Report in Jan, Apr, Jul and Oct.
- Bank of Japan: past Monetary Policy Meetings tables and this year's schedule. The statement has no
  fixed time (tentative); Governor's press conference 15:30 JST; Summary of Opinions and minutes 08:50.
- Swiss National Bank: its list of monetary policy decisions; 09:30 Zurich, news conference 10:00.
- Reserve Bank of Australia: media releases titled "Monetary Policy Decision" and the board meeting
  schedules; 14:30 Sydney, press conference 15:30 from 2024; minutes two weeks after the meeting at
  11:30 (by that rule: the RBA publishes no list of release dates).
Not covered: the Reserve Bank of New Zealand (its website refuses automated requests) and China's
Loan Prime Rate (the data service did not answer).
"""
import datetime as dt
import glob
import hashlib
import html
import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

W = sys.argv[1]
START = '2015-01-01'
TODAY = dt.date.today().isoformat()
MONTHS = {m: i + 1 for i, m in enumerate(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])}
events = []


def read(path):
    return open(os.path.join(W, path), encoding='utf-8', errors='replace').read()


def text(page, sep=' | '):
    """The visible text of an HTML page, items separated by `sep`."""
    page = re.sub(r'<script.*?</script>|<style.*?</style>', '', page, flags=re.S)
    return re.sub(r'\s*\n\s*', sep, html.unescape(re.sub(r'<[^>]+>', '\n', page)))


def ev(ccy, tz, source, title, date, time, impact='high', basis=None):
    if date < START:
        return
    e = {'ccy': ccy, 'tz': tz, 'source': source, 'title': title, 'date': date, 'time': time, 'impact': impact}
    if basis:
        e['basis'] = basis
    events.append(e)


# ---------- Federal Reserve ----------
def fed():
    add = lambda title, d, time: ev('USD', 'America/New_York', 'federalreserve.gov', title, f'{d[:4]}-{d[4:6]}-{d[6:]}', time)
    statements, presconf, minutes = set(), set(), set()
    for p in sorted(glob.glob(os.path.join(W, 'fed', '*.html'))):
        t = open(p, encoding='utf-8', errors='replace').read()
        statements |= set(re.findall(r'pressreleases/monetary(\d{8})a\.htm', t))
        presconf |= set(re.findall(r'fomcpresconf(\d{8})\.htm', t))
        # "Minutes (Released Month DD, YYYY)"; other "Released" dates belong to statements
        for r in re.finditer(r'Minutes[^()]{0,40}\(Released ([A-Z][a-z]+) (\d{1,2}), (\d{4})\)', text(t)):
            minutes.add(f'{r.group(3)}{MONTHS[r.group(1)]:02d}{int(r.group(2)):02d}')
    # meetings not held yet: "<Month> | <d>-<d>" in the calendar's year sections
    future = set()
    for sec in re.finditer(r'(\d{4}) FOMC Meetings \|(.*?)(?=\d{4} FOMC Meetings|\Z)', text(read('fed/fomccal.html')), re.S):
        y = int(sec.group(1))
        for m in re.finditer(r'\| (' + '|'.join(MONTHS) + r'|[A-Z][a-z]{2}/[A-Z][a-z]{2}) \| (\d{1,2})(?:-(\d{1,2}))?\*?( \([^)]*\))?(?= \|)', '| ' + sec.group(2).strip()):
            if m.group(4):
                continue  # notation votes and unscheduled calls count only with a statement (above)
            mon = m.group(1)
            n = MONTHS[mon] if mon in MONTHS else MONTHS[next(k for k in MONTHS if k.startswith(mon.split('/')[1]))]
            d = f'{y}{n:02d}{int(m.group(3) or m.group(2)):02d}'
            if d > TODAY.replace('-', ''):
                future.add(d)
    # statements that were not rate decisions: T-bill purchases (11 Oct 2019), March 2020 facilities, and
    # the Statement on Longer-Run Goals revisions (27 Aug 2020, 22 Aug 2025)
    statements -= {'20191011', '20200323', '20200331', '20200827', '20250822'}
    special = {'20200303': ('10:00', '11:00'), '20200315': ('17:00', '18:30')}  # unscheduled cuts
    decisions = statements | future
    for d in sorted(decisions):
        time = special.get(d, ('14:00',))[0]
        add('Federal Funds Rate', d, time)
        add('FOMC Statement', d, time)
    for d in sorted(presconf | {d for d in decisions if d >= '20190101'}):
        if d in decisions:
            add('FOMC Press Conference', d, special.get(d, (None, '14:30'))[1])
    for d in sorted(minutes):
        add('FOMC Meeting Minutes', d, '14:00')


# ---------- European Central Bank ----------
def ecb():
    add = lambda title, d, time, impact='high': ev('EUR', 'Europe/Berlin', 'ecb.europa.eu', title, d, time, impact)
    iso = lambda s: dt.date(int(s.split()[2]), MONTHS[s.split()[1]], int(s.split()[0])).isoformat()
    entries = lambda p: re.findall(r'(\d{1,2} [A-Z][a-z]+ \d{4}) \| ([^|]{3,160}?) \|', text(read(p)))
    decisions, accounts = set(), set()
    for p in sorted(glob.glob(os.path.join(W, 'ecb', 'mopo*.html'))):
        for d, title in entries(os.path.relpath(p, W)):
            if re.fullmatch(r'(combined )?monetary policy decisions( and statement)?', title.strip(), re.I):
                decisions.add(iso(d))
    for m in re.finditer(r'(\d{2})/(\d{2})/(\d{4}) \| Governing Council of the ECB: monetary policy meeting[^|]*\(Day 2\), followed by press conference', text(read('ecb/mgcgc.html'))):
        decisions.add(f'{m.group(3)}-{m.group(2)}-{m.group(1)}')
    for p in sorted(glob.glob(os.path.join(W, 'ecb', 'acc*.html'))):
        for d, title in entries(os.path.relpath(p, W)):
            title = title.strip()
            m = re.fullmatch(r'Meeting of (?:\d{1,2}-)?(\d{1,2}) ([A-Z][a-z]+) (\d{4})', title)
            if title.startswith('Account of the monetary policy meeting') or (m and dt.date(int(m.group(3)), MONTHS[m.group(2)], int(m.group(1))).isoformat() in decisions):
                accounts.add(iso(d))
    for d in sorted(decisions):
        late = d >= '2022-07-21'
        add('Main Refinancing Rate', d, '14:15' if late else '13:45')
        add('Monetary Policy Statement', d, '14:15' if late else '13:45')
        add('ECB Press Conference', d, '14:45' if late else '14:30')
    for d in sorted(accounts):
        add('ECB Monetary Policy Meeting Accounts', d, '13:30', 'medium')


# ---------- Bank of England ----------
def xlsx_rows(path):
    """Rows of the first sheet of an .xlsx file ({column letter: value})."""
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    z = zipfile.ZipFile(path)
    shared = [''.join(t.text or '' for t in si.iter('{%s}t' % ns['m'])) for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', ns)] if 'xl/sharedStrings.xml' in z.namelist() else []
    out = []
    for r in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).iter('{%s}row' % ns['m']):
        row = {}
        for c in r.findall('m:c', ns):
            v = c.find('m:v', ns)
            if v is not None:
                col = re.match(r'[A-Z]+', c.get('r')).group(0)
                row[col] = shared[int(v.text)] if c.get('t') == 's' else v.text
        out.append(row)
    return out


def boe():
    add = lambda title, d, time: ev('GBP', 'Europe/London', 'bankofengland.co.uk', title, d, time)
    dates = set()
    for r in xlsx_rows(os.path.join(W, 'boe', 'mpcvoting.xlsx')):
        v = r.get('B', '')
        if re.fullmatch(r'\d{5}(\.0+)?', v):
            dates.add((dt.date(1899, 12, 30) + dt.timedelta(days=int(float(v)))).isoformat())
    # the sheet has the vote date; in early 2015 the decision was announced the next working day
    # (11 May 2015 after the general election, 4 June and 9 July)
    announced = {'2015-05-08': '2015-05-11', '2015-06-03': '2015-06-04', '2015-07-08': '2015-07-09'}
    dates = {announced.get(d, d) for d in dates}
    report = set()
    for sec in re.finditer(r'(\d{4}) confirmed dates \|(.*?)(?=\d{4} confirmed dates|Current Bank Rate|Monetary Policy Committee Reports)', text(read('boe/upcoming.html'))):
        for m in re.finditer(r'Thursday\s+(\d{1,2})\s+([A-Z][a-z]+) \| [A-Z][a-z]+ MPC Summary and minutes( \| and \| [A-Z][a-z]+ Monetary Policy Report)?', sec.group(2)):
            d = dt.date(int(sec.group(1)), MONTHS[m.group(2)], int(m.group(1))).isoformat()
            dates.add(d)
            if m.group(3):
                report.add(d)
    special = {'2020-03-11': '07:00', '2020-03-19': None}  # emergency cuts; 19 March 2020's time not confirmed
    for d in sorted(dates):
        time = special.get(d, '12:00')
        add('Official Bank Rate', d, time)
        if d >= '2015-08-01' and d not in special:
            # from August 2015 the votes and the summary come with the decision; the quarterly report
            # (Inflation Report until 2019, Monetary Policy Report from 2020) with every other one
            add('MPC Official Bank Rate Votes', d, time)
            add('Monetary Policy Summary', d, time)
            m = int(d[5:7])
            if d in report or (not report.intersection({x for x in dates if x[:4] == d[:4]}) and m in ((1, 5, 8, 11) if d[:4] == '2020' else (2, 5, 8, 11))):
                add('BOE Inflation Report' if d < '2020-01-01' else 'BOE Monetary Policy Report', d, time)


# ---------- Bank of Canada ----------
def boc():
    add = lambda title, d, time: ev('CAD', 'America/Toronto', 'bankofcanada.ca', title, d, time)
    dates = set()
    for p in glob.glob(os.path.join(W, 'boc', 'list', 'p*.html')):
        dates |= set(re.findall(r'fad-press-release-(\d{4}-\d{2}-\d{2})', open(p, encoding='utf-8', errors='replace').read()))
    unscheduled = {'2020-03-13', '2020-03-27'}  # exact times not confirmed
    dates |= unscheduled
    # dates ahead: "dates … for <year> are as follows: …", then "… reconfirmed as follows: …" (the year before)
    for p in glob.glob(os.path.join(W, 'boc', 'schedule-*.html')):
        year = int(re.search(r'schedule-(\d{4})', p).group(1))
        t = text(open(p, encoding='utf-8', errors='replace').read(), ' ')
        main = t[t.find('are as follows:'):t.find('All interest rate announcements')]
        split = main.find('reconfirmed')
        for part, y in ((main[:split] if split > 0 else main, year), (main[split:] if split > 0 else '', year - 1)):
            for m in re.finditer(r'Wednesday,? (' + '|'.join(MONTHS) + r') (\d{1,2})', part):
                dates.add(dt.date(y, MONTHS[m.group(1)], int(m.group(2))).isoformat())
    for d in sorted(dates):
        time = None if d in unscheduled else ('09:45' if d >= '2024-09-01' else '10:00')
        add('Overnight Rate', d, time)
        add('BOC Rate Statement', d, time)
        if d not in unscheduled and int(d[5:7]) in (1, 4, 7, 10):
            add('BOC Monetary Policy Report', d, time)


# ---------- Bank of Japan ----------
def boj():
    add = lambda title, d, time, impact='high': ev('JPY', 'Asia/Tokyo', 'boj.or.jp', title, d, time, impact)
    mon = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'June': 6, 'Jul': 7, 'July': 7, 'Aug': 8, 'Sep': 9, 'Sept': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12}

    def last_day(cell, year):
        """'Jan. 23 (Thurs.), 24 (Fri.)' or 'Apr. 30 (Wed.), May 1 (Thurs.)' → the last day."""
        parts = re.findall(r'(?:([A-Z][a-z]+)\.? )?(\d{1,2}) \(', cell)
        if not parts:
            return None
        m = None
        for name, d in parts:
            m = mon[name] if name else m
            last = (m, int(d))
        return f'{year}-{last[0]:02d}-{last[1]:02d}'

    seen = set()
    for page in ('boj/past.html', 'boj/schedule.html'):
        for tb in re.findall(r'<table.*?</table>', read(page), re.S):
            cap = re.search(r'Table : (\d{4})', re.sub(r'<[^>]+>', '', tb))
            if not cap:
                continue
            year = int(cap.group(1))
            rows = [[re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', c))).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.S)] for r in re.findall(r'<tr.*?</tr>', tb, re.S)]
            # 2016 on: two header rows, then meeting | Outlook Report | Summary of Opinions | minutes;
            # through 2015: one header row, then meeting | minutes | Outlook Report | Monthly Report | Summary of Opinions
            body, cols = (rows[1:], (2, 4, 1)) if rows[0][1].startswith('Publication of MPM Minutes') else (rows[2:], (1, 2, 3))
            for cells in body:
                if len(cells) < 4:
                    continue
                cells = [cells[0]] + [cells[i] if i < len(cells) else '-' for i in cols]
                decision = last_day(cells[0], year)
                if not decision or decision < START or decision in seen:
                    continue
                seen.add(decision)
                add('BOJ Policy Rate', decision, None)
                add('Monetary Policy Statement', decision, None)
                add('BOJ Press Conference', decision, '15:30')
                if re.search(r'\d', cells[1]):
                    add('BOJ Outlook Report', last_day(cells[1], year) or decision, None)
                for title, cell, impact in (('BOJ Summary of Opinions', cells[2], 'medium'), ('Monetary Policy Meeting Minutes', cells[3], 'low')):
                    d = last_day(cell, year)
                    if d:
                        add(title, d if d >= decision else f'{int(d[:4]) + 1}{d[4:]}', '08:50', impact)


# ---------- Swiss National Bank ----------
def snb():
    add = lambda title, d, time: ev('CHF', 'Europe/Zurich', 'snb.ch', title, d, time)
    items = text(read('snb/decisions.html')).split(' | ')
    assessments, conferences = set(), set()  # an assessment can be listed twice (latest and archive)
    for i, item in enumerate(items):
        m = re.fullmatch(r'Monetary policy assessment of (\d{1,2}) ([A-Z][a-z]+) (\d{4})', item.strip())
        if not m:
            continue
        d = dt.date(int(m.group(3)), MONTHS[m.group(2)], int(m.group(1))).isoformat()
        assessments.add(d)
        if i + 1 < len(items) and 'news conference' in items[i + 1].lower():
            conferences.add(d)
    for d in sorted(assessments):
        add('SNB Policy Rate', d, '09:30')
        add('SNB Monetary Policy Assessment', d, '09:30')
        if d in conferences:
            add('SNB Press Conference', d, '10:00')
    # 15 January 2015: minimum exchange rate discontinued, rate lowered to -0.75%, at 10:30
    add('SNB Policy Rate', '2015-01-15', '10:30')
    add('SNB Monetary Policy Assessment', '2015-01-15', '10:30')


# ---------- Reserve Bank of Australia ----------
def rba():
    add = lambda title, d, time, impact='high', basis=None: ev('AUD', 'Australia/Sydney', 'rba.gov.au', title, d, time, impact, basis)
    decisions = set()
    for p in glob.glob(os.path.join(W, 'rba', 'mr*.html')):
        for a in re.findall(r'<article.*?</article>', open(p, encoding='utf-8', errors='replace').read(), re.S):
            h = re.search(r'itemprop="headline">([^<]*)<', a)
            d = re.search(r'datetime="(\d{4}-\d{2}-\d{2})"', a)
            if h and d and re.search(r'monetary policy decision', h.group(1), re.I):
                decisions.add(d.group(1))
    # board meeting schedules: "| March | 16–17 March | 5 March |": the two-day range is the Monetary Policy
    # Board's (decision on day 2), a single date the Payments System Board's
    for sec in re.finditer(r'Board meeting schedules (\d{4}) \|(.*?)(?=Board meeting schedules \d{4}|Related Information)', text(read('rba/schedule.html'))):
        cells = [c.strip() for c in sec.group(2).split('|')]
        for i, c in enumerate(cells[:-1]):
            m = re.fullmatch(r'\d{1,2}[–-](\d{1,2}) ([A-Z][a-z]+)', cells[i + 1])
            if c in MONTHS and m and m.group(2) == c:
                decisions.add(dt.date(int(sec.group(1)), MONTHS[c], int(m.group(1))).isoformat())
    for d in sorted(decisions):
        time = None if d == '2020-03-19' else '14:30'  # the unscheduled cut of 19 March 2020: time not confirmed
        add('Cash Rate', d, time)
        add('RBA Rate Statement', d, time)
        if d >= '2024-01-01':
            add('RBA Press Conference', d, '15:30')
        if d <= TODAY:
            add('RBA Monetary Policy Meeting Minutes', (dt.date.fromisoformat(d) + dt.timedelta(days=14)).isoformat(), '11:30', 'medium', 'two weeks after the meeting')


for collect in (fed, ecb, boe, boc, boj, snb, rba):
    collect()

out = {}
for e in events:
    y, m, d = map(int, e['date'].split('-'))
    hh, mm = map(int, (e['time'] or '12:00').split(':'))
    utc = dt.datetime(y, m, d, hh, mm, tzinfo=ZoneInfo(e['tz'])).astimezone(dt.timezone.utc)
    rec = {
        'id': 'sch-' + hashlib.sha1(f"{e['ccy']}|{e['title']}|{e['date']}".encode()).hexdigest()[:12],
        'time': int(utc.timestamp() * 1000),
        'currency': e['ccy'],
        'title': e['title'],
        'impact': e['impact'],
    }
    if not e['time']:
        rec['tentative'] = True
    rec['source'] = e['source']
    if e.get('basis'):
        rec['basis'] = e['basis']
    rec['_utc'], rec['_local'] = utc.strftime('%Y-%m-%d %H:%M'), f"{e['date']} {e['time'] or '--:--'} {e['tz']}"
    out[rec['id']] = rec
rows = sorted(out.values(), key=lambda r: (r['time'], r['currency'], r['title']))

target = next((a for a in sys.argv[2:] if not a.startswith('--') and a.endswith('.json')), None)
if target:
    with open(target, 'w') as f:
        f.write('[\n' + ',\n'.join(json.dumps({k: v for k, v in r.items() if not k.startswith('_')}, ensure_ascii=False) for r in rows) + '\n]\n')
if '--csv' in sys.argv:
    with open(sys.argv[sys.argv.index('--csv') + 1], 'w') as f:
        f.write('utc,currency,impact,title,local_time,time_fixed,source\n')
        for r in rows:
            f.write(f"{r['_utc']},{r['currency']},{r['impact']},\"{r['title']}\",{r['_local']},{'no' if r.get('tentative') else 'yes'},{r['source']}\n")
counts = {}
for r in rows:
    counts[r['currency']] = counts.get(r['currency'], 0) + 1
print(f"{len(rows)} events ({sum(1 for r in rows if r.get('tentative'))} without a fixed time), {rows[0]['_utc']} to {rows[-1]['_utc']}: {counts}")
