# Deploying BacktestLab

The site is two parts:

- **the web app**: static files (HTML, JS, CSS) served by nginx;
- **the API server**: one file, `server.mjs`, run by Node.js. It needs no `npm install` on the server.

Both are served from one domain: the app at `https://your-domain/`, the API at `https://your-domain/api/`.
The steps below use `backtestlab.ir` as the domain; use yours.

## What you need

- A Linux server (Ubuntu 22.04 or 24.04). 1 CPU and 1–2 GB RAM are enough to start.
  Disk: about 2 GB for the market history of all symbols from 2015 (about 1.2 MB per symbol per year), plus
  0.2–1 MB per day of optional 1-second data.
- A domain whose A record points to the server.
- On your own computer: Node.js 20.12 or newer, and this repository.

### Servers in Iran

Payment gateways and SMS providers (Zarinpal, Zibal, Kavenegar, …) work best from a server in Iran, and some
refuse servers abroad. On an Iranian VPS, expect these; the steps below handle each one:

- **Downloads from abroad are often blocked** (NodeSource, sometimes npm). Build the release on your own
  computer (step 1) and install Node from a file you upload (step 2). `server.mjs` needs nothing else.
- **`apt update` fails or hangs:** switch to your VPS provider's Ubuntu mirror; most Iranian datacenters run one.
- **Market data and the calendar usually need a relay abroad.** Binance refuses Iranian servers, and Dukascopy
  and ForexFactory are often unreachable. `check-sources.sh` tells you whether you need one; step 8 sets it up.
- **IPv6 is often off**, which stops nginx from starting; step 2 shows the fix.
- **During international internet disruptions** the site keeps working: sign-in, SMS and payments are
  domestic, and the market history is stored on the server (step 9); calendar weeks loaded before are cached.
  Only the newest days wait until the connection returns.
- **Payment gateways** approve your merchant for your domain and usually require an eNamad (اینماد) first.

## 1. Build the release (on your computer)

```bash
cd BackTest-Platform
# TradingView chart (drawing tools, indicators, seconds): install the library you licensed, once
npm run setup:charts -- path/to/charting_library-master.zip
# build for your domain
npm run release -- https://backtestlab.ir
```

This runs the tests and creates `release/backtestlab/`, plus a `.tar.gz` of it when `tar` is available:

```
web/                  the web app (goes to /var/www/backtestlab)
server/server.mjs     the API server (goes to /opt/backtestlab/server)
server/env.example    all server settings
backtestlab.service   systemd unit
nginx-site.conf       nginx site
relay-nginx.conf      relay abroad for servers in Iran (step 8)
check-sources.sh      checks whether the server reaches the data sources (step 8)
make-admin.sh         admin sign-in: username and password, or a mobile number (step 7)
```

The address you pass is built into the app. If you later change the domain, build again.

The TradingView Charting Library is licensed to you and is not part of this repository. `setup:charts` copies
it into `public/charting_library/` (kept out of git), and the release then ships it in `web/charting_library/`.
Without it the replay uses the built-in chart; the release output says which chart it was built with.

If `npm ci` fails with `403 Forbidden` or times out (npm sometimes refuses Iranian connections), run the
build with a VPN on, or point npm at a mirror with `npm config set registry <mirror address>`.

## 2. Prepare the server (once)

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx curl xz-utils
```

If `apt install` ends with `Job for nginx.service failed`, the server has no IPv6 (common in Iran). Remove the
IPv6 line from the default site and start nginx:

```bash
sudo sed -i '/listen \[::\]:80/d' /etc/nginx/sites-available/default
sudo systemctl restart nginx
```

**Node.js 22.** Ubuntu's own `nodejs` package is too old (it must be 20.12 or newer).

- **Upload it (recommended in Iran).** On your computer, download **Linux Binaries (x64)**, the `.tar.xz`
  file of version 22 LTS, from https://nodejs.org/en/download (check the server with `uname -m`:
  `x86_64` means x64). Upload it, then on the server:
  ```bash
  # on your computer
  scp node-v22.*-linux-x64.tar.xz root@SERVER_IP:/tmp/
  # on the server
  sudo tar -xJf /tmp/node-v22.*-linux-x64.tar.xz -C /usr/local --strip-components=1
  sudo ln -sf /usr/local/bin/node /usr/bin/node
  node -v        # v22.x
  ```
- **Or from NodeSource**, if the server can reach it:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
  ```

A user for the service, and the folders:

```bash
sudo useradd --system --home /var/lib/backtestlab --shell /usr/sbin/nologin backtestlab
sudo mkdir -p /opt/backtestlab/server /var/www/backtestlab
```

## 3. Upload and install the files

From your computer (Windows 10+ has `scp` in PowerShell; WinSCP also works):

```bash
scp release/backtestlab-*.tar.gz root@SERVER_IP:/tmp/
```

On the server:

```bash
cd /tmp && tar -xzf backtestlab-*.tar.gz
sudo cp -r backtestlab/web/. /var/www/backtestlab/
sudo cp backtestlab/server/server.mjs /opt/backtestlab/server/
sudo cp backtestlab/backtestlab.service /etc/systemd/system/
sudo cp backtestlab/check-sources.sh backtestlab/make-admin.sh /opt/backtestlab/
```

If you uploaded the folder instead of the archive, skip the `tar` line.

## 4. Server settings

Create `/opt/backtestlab/server/.env` (`sudo nano /opt/backtestlab/server/.env`):

```ini
NODE_ENV=production
HOST=127.0.0.1
PORT=8787
APP_URL=https://backtestlab.ir
PUBLIC_URL=https://backtestlab.ir
CORS_ORIGINS=https://backtestlab.ir,https://www.backtestlab.ir
ADMIN_PHONES=09121234567
DATA_DIR=/var/lib/backtestlab
TRUST_PROXY=true
```

- `ADMIN_PHONES`: your mobile number(s), comma separated. These accounts get the admin panel.
- An admin can also sign in with a username and password instead (`ADMIN_USERNAME` and
  `ADMIN_PASSWORD_HASH`): `make-admin.sh --username` sets both (step 7). Never write the password itself here.
- `HOST=127.0.0.1` keeps the API reachable only through nginx.
- Every other setting (SMS keys, gateways, prices, data sources) is set later in the admin panel.
  `backtestlab/server/env.example` lists the rest.

```bash
sudo chown root:backtestlab /opt/backtestlab/server/.env
sudo chmod 640 /opt/backtestlab/server/.env
```

## 5. Start the API server

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backtestlab
sudo systemctl status backtestlab          # should say "active (running)"
curl http://127.0.0.1:8787/api/health      # {"ok":true,...}
```

It restarts by itself after a crash or a reboot. Logs: `sudo journalctl -u backtestlab -f`.

## 6. nginx and HTTPS

```bash
sudo cp /tmp/backtestlab/nginx-site.conf /etc/nginx/sites-available/backtestlab
sudo sed -i 's/backtestlab\.ir/YOUR-DOMAIN/g' /etc/nginx/sites-available/backtestlab
sudo ln -s /etc/nginx/sites-available/backtestlab /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d YOUR-DOMAIN -d www.YOUR-DOMAIN
```

- If `nginx -t` reports `socket() [::]:80 failed (97: Address family not supported by protocol)`, the
  server has no IPv6: `sudo sed -i '/listen \[::\]:80/d' /etc/nginx/sites-available/backtestlab`, then
  run `sudo nginx -t` again.
- certbot needs the domain to point at this server and port 80 to be open from abroad. If it cannot verify
  the domain during an international disruption, run the same command again later.

`nginx-site.conf` lets the app upload up to 10 MB to the API (a user's backtest copy) and the admin panel
upload pictures and videos for announcements up to 100 MB (`location /api/admin/media`). If you set up nginx
with an older copy of the file, copy it again (and repeat the `sed` line), or uploads stop with "حجم فایل
بیش از حد مجاز سرور است".

Open `https://YOUR-DOMAIN`. You should see the landing page.

Pages have plain addresses (`https://YOUR-DOMAIN/dashboard`) and every click loads the new page from the
server. nginx answers every address that is not a file with `index.html` (`try_files $uri /index.html` in
`nginx-site.conf`); keep that line if you edit the file, or addresses other than the home page show
"404". Older links with `/#/` (for example an admin address from before) still work: they are moved to
the plain address when the page opens.

## 7. First sign-in and the admin panel

Users sign in with a mobile number and a code sent by SMS. Admins can do the same, or use a username and
password, which needs no SMS. Pick one:

**A. Username and password (simplest).**

```bash
sudo bash /opt/backtestlab/make-admin.sh --username admin
```

It asks for a password twice (at least 8 characters; nothing is shown while you type), writes
`ADMIN_USERNAME` and a hash of the password (`ADMIN_PASSWORD_HASH`, never the password itself) to the `.env`
and restarts the API server. It also gives the admin sign-in page a secret address and prints it:
`https://YOUR-DOMAIN/k/` followed by 32 random characters (`ADMIN_LOGIN_KEY` in `.env`). The site has no link to
it, and without the key the page leads to the home page and the admin sign-in API answers "not found", so it
cannot be guessed or found in the site's code. Save it privately (a password manager), open it, enter the
username and password, and you are in the admin panel. Signed-in admins also see it in **تنظیمات سایت**. To
replace it (the old one stops working): `sudo bash /opt/backtestlab/make-admin.sh --new-url`. Change them later in **پنل مدیریت → تنظیمات سایت → ورود مدیر با نام کاربری و رمز**; forgot the
password? Run the command again. Ten wrong passwords in 15 minutes block further tries for 15 minutes.

**B. Mobile number.** A number becomes an admin when it is listed in `ADMIN_PHONES` (step 4). To add one:

```bash
sudo bash /opt/backtestlab/make-admin.sh 09121234567
```

1. Open `https://YOUR-DOMAIN/login` (or click **ورود**) and enter that number. Real SMS sending is still
   off, so the code is in the server log; run this right after pressing the button:
   ```bash
   sudo journalctl -u backtestlab -n 30 --no-pager | grep sms:dev
   ```
   The last line reads `[sms:dev] 09121234567 ← 12345`; enter that code (and your name, the first time).
   The menu then shows **پنل مدیریت** (admin panel).
2. Open **پنل مدیریت** (admin panel):
   - **پیامک** (SMS): choose your provider, enter the API key, sender line and OTP template, send a test
     message, then turn on **ارسال واقعی** (real sending).
   - **درگاه‌های پرداخت** (gateways): enter each merchant id, turn sandbox off, and press the connection test.
     If a gateway asks for a callback address, it is `https://YOUR-DOMAIN/api/payments/callback/zarinpal`
     (or `zibal`, `idpay`, `nextpay`, `payir`).
   - **کارت به کارت** (card to card, optional, works without a gateway): add your cards (number and the
     holder's name) and switch on «پرداخت کارت به کارت در صفحه‌ی خرید». Each payment's amount is in rial and
     its last three digits are its own; when the bank tells you a deposit arrived (SMS or account history),
     type those three digits in the search box of the **واریزها** list and press **تأیید** (confirm). The
     plan starts at once. The menu shows how many reported transfers are waiting.
   - **پلن‌ها** (plans) and **کدهای تخفیف** (discount codes): prices and offers. A code marked
     **فقط برای اولین خرید** (first purchase only) works only for customers who have never completed a
     purchase; a refunded purchase counts as one. It is checked when the code is applied and again at checkout.
   - **نمادها و داده‌ی بازار** (symbols and market data): the stored market history and its download (step 9),
     data source per market, which symbols users can pick, and QVeris (optional, paid; step 9).
   - **تقویم اقتصادی** (economic calendar): press sync and check that no error is shown.
   - **بک‌تست کاربران** (users' backtests): every user's sessions with their results, open positions,
     pending orders and closed trades (entry and exit price and time), the equity curve, the IP address their
     app last sent data from, their devices and recent sign-ins. **حذف این جلسه** deletes a session; it also
     disappears from the user's browser the next time they open the site. Only sessions, orders, positions
     and strategies are copied to the server; journals and notes stay in the user's browser.
   - **ورود و خروج کاربران** (sign-ins and sign-outs): every sign-in and sign-out with the time, IP address,
     browser and method; search by name, number or IP. On a user's backtests page, **خروج از همه** (or the
     button next to one device) signs them out.
   - **اعلان‌ها** (announcements): a message with an optional picture or video that opens as a popup when
     someone opens the home page, the dashboard, or both; for every visitor or signed-in users only; with an
     optional button (a page like `/billing` or a full `https://` address) and start and end dates. Each
     visitor sees a message once; turn on «دوباره به کسانی که این پیام را بسته‌اند نشان داده شود» when you
     edit it to show it again. MP4 (H.264) videos play in every browser; iPhone videos saved as HEVC may not
     play on Windows or Android.

## 8. Relay for market data and the calendar (servers in Iran)

Check whether the server reaches the sources on its own:

```bash
bash /opt/backtestlab/check-sources.sh
```

If it ends with `All sources reachable.`, skip this step (for Dukascopy one of its two addresses is enough).
Otherwise (the usual case in Iran) the API server fetches them through a relay: a small server outside Iran
that forwards only these sources, and only for your server.

1. **Rent a small Ubuntu VPS outside Iran.** The smallest plan is enough (1 CPU, 512 MB–1 GB RAM); it only
   forwards requests.
2. **Give it a name:** in your domain's DNS, add an A record such as `relay.YOUR-DOMAIN` pointing to the
   relay's IP.
3. **On the relay**, install nginx and certbot and add the relay site (`relay-nginx.conf` is in the release):
   ```bash
   sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
   # upload relay-nginx.conf from the release, then:
   sudo cp relay-nginx.conf /etc/nginx/sites-available/relay
   sudo sed -i 's/relay\.example\.com/relay.YOUR-DOMAIN/; s/203\.0\.113\.10/MAIN_SERVER_IP/' /etc/nginx/sites-available/relay
   sudo ln -s /etc/nginx/sites-available/relay /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d relay.YOUR-DOMAIN
   ```
   `MAIN_SERVER_IP` is your Iranian server's public IP (shown in its VPS panel). Requests from any other
   address are refused.
4. **On the main server**, add to `/opt/backtestlab/server/.env`:
   ```ini
   DUKASCOPY_API_URL=https://relay.YOUR-DOMAIN/dukascopy-api
   DUKASCOPY_URL=https://relay.YOUR-DOMAIN/dukascopy
   BINANCE_URL=https://relay.YOUR-DOMAIN/binance
   BINANCE_VISION_URL=https://relay.YOUR-DOMAIN/binance-vision
   FF_BASE_URL=https://relay.YOUR-DOMAIN/forexfactory
   FF_FEED_URL=https://relay.YOUR-DOMAIN/ff_calendar_thisweek.json
   ```
5. Restart and check again:
   ```bash
   sudo systemctl restart backtestlab
   bash /opt/backtestlab/check-sources.sh
   ```
   Then press sync on the calendar page of the admin panel.

ForexFactory protects its site with Cloudflare. If only the ForexFactory calendar line fails through the
relay, the server falls back to the weekly feed for the current week, and the app fills older weeks from
its sample calendar.

## 9. Market history

Charts read candles only from the server's own storage (`/var/lib/backtestlab/market/store`): nothing is
fetched from Dukascopy or Binance while someone uses the site. The history has to be downloaded once:

- **By itself (default).** Half a minute after the API server starts, and then every hour, it downloads
  whatever is missing: the whole history from 2015 the first time (a few hours; about 2 GB), afterwards
  only each new day. Progress, coverage per symbol, stop and start are in the admin panel →
  **نمادها و داده‌ی بازار**. Turn **دانلود خودکار** off there to download only when you press the button.
  A stopped or interrupted download continues where it ended.
- **From the command line** on the server (the same download, with progress in the terminal):
  ```bash
  sudo -u backtestlab node --env-file=/opt/backtestlab/server/.env /opt/backtestlab/server/server.mjs download
  # some symbols or dates only:
  sudo -u backtestlab node --env-file=/opt/backtestlab/server/.env /opt/backtestlab/server/server.mjs download --symbols=EURUSD,XAUUSD --from=2020-01-01
  ```
  `download --help` lists the options. Stop the API server's automatic download first (admin panel) so the
  two do not fetch the same days.
- **On another computer**, when the server cannot reach the sources even through the relay: copy
  `server.mjs` from the release to any computer with Node.js 20.12+ and open internet, then
  ```bash
  node server.mjs download --data-dir=./backtestlab-data
  scp -r ./backtestlab-data/market/store root@SERVER_IP:/var/lib/backtestlab/market/
  # on the server
  sudo chown -R backtestlab /var/lib/backtestlab/market && sudo systemctl restart backtestlab
  ```
  Run it again later (it adds only new days) and copy again to bring the server up to date.

Dukascopy refuses a share of requests when they come quickly, and its firewall blocks a server that sends
too many for a while (it answers with a "challenge" instead of data). The download therefore asks at most
10 times a second (`DUKASCOPY_RATE` in `.env`); when it is blocked anyway it pauses five minutes, halves the
rate and goes on, so it only slows down. The first download of the whole history from 2015 takes several
hours; it runs in the background and continues after a restart.

**QVeris (optional, paid).** QVeris (qveris.ai) sells EODHD's 1-minute history for forex, metals and crypto
and live quotes, per request (2.81 credits each). The free sources above are enough; use QVeris only if
your server cannot reach them, or for live prices in the sign-in page's ticker. Put the key in
`/opt/backtestlab/server/.env` (`QVERIS_API_KEY=…`, see `.env.example`), restart, then in the admin panel →
**نمادها و داده‌ی بازار** pick QVeris as a market's source and set the daily credit limit. One request
fetches one symbol's day, newest days first; at the limit the rest waits for the next day. A full history
for one forex pair is about 3,700 requests (about 10,000 credits). Through the relay (step 8) also set
`QVERIS_URL` and `QVERIS_FILES_URL`.

Second timeframes (1–30 s) are built from the 1-minute candles. For the real movement inside each minute,
download 1-second data (Dukascopy ticks / Binance 1-second archives) for a symbol and date range in the
admin panel, or with `download --seconds --symbols=EURUSD --from=… --to=…` (up to 92 days per run).

## Updating

Build a new release (step 1), upload it (step 3), copy `web/` and `server.mjs` as in step 3, then:

```bash
sudo systemctl restart backtestlab
```

Accounts, payments, settings and the market history in `/var/lib/backtestlab` are kept. Versions before the
market storage kept a download cache in `market/dukascopy` and `market/binance`; after updating, those two
folders are no longer used and can be deleted.

## Backups

`/var/lib/backtestlab/db.json` holds accounts, payments, settings, the sign-in log and announcements;
`backtests/` the copies of users' backtests and `media/` the announcements' pictures and videos. Back them
up daily. The market history
(`market/store`) can be downloaded again, but that takes hours: keep a copy of it too, for example monthly.

```bash
sudo mkdir -p /root/backups
sudo crontab -e
# add this line: every night at 03:30
30 3 * * * tar -czf /root/backups/backtestlab-$(date +\%F).tar.gz -C /var/lib/backtestlab db.json news.json backtests media
```

## When something goes wrong

| What you see | What to check |
|---|---|
| **502 Bad Gateway** on the site's API | The API server is not running: `sudo journalctl -u backtestlab -n 50` |
| **500** on every page | nginx cannot read the files: `sudo chmod -R a+rX /var/www/backtestlab`; details in `/var/log/nginx/error.log` |
| **اتصال به سرور برقرار نشد** when signing in | The app was built for another address. Build again with the exact domain you open (step 1), and list both `www` and non-`www` in `CORS_ORIGINS` |
| No sign-in code arrives | Admin panel → پیامک → send a test message; the SMS log shows the provider's error |
| Payment returns as failed | Merchant id and sandbox setting in the admin panel; the gateway's callback domain must match your site |
| Settings are not saved after a restart | `DATA_DIR` must be `/var/lib/backtestlab` (the only folder the service may write to) |
| Replay candles look made up, with a «داده‌ی نمونه» badge | The app was built without the API server (demo mode). Build with `npm run release -- https://YOUR-DOMAIN` (step 1) and install the API server; only then are prices real |
| Prices differ slightly from your broker | Normal: prices are Dukascopy's (bid) and Binance's; brokers' feeds differ by a few points. Daily and 4-hour candles close at 17:00 New York like most brokers; crypto days are UTC |
| Charts stay empty, with «هنوز روی سرور دانلود نشده» | Those days are not in the market history yet: admin panel → نمادها و داده‌ی بازار shows coverage and the download (step 9). If downloads fail, the server cannot reach the sources: `bash /opt/backtestlab/check-sources.sh`, then set up the relay (step 8) or download on another computer |
| A click shows an **empty page** until you refresh | Errors from visitors' browsers are logged: `sudo journalctl -u backtestlab \| grep client-error`. Common causes: the browser's translator (turn off "Translate this page"), an extension, or a CDN/firewall "optimization" (ArvanCloud/Cloudflare minify, Rocket Loader, script rewriting): turn those off for the site. Serve the release's `web/` folder, not the source code or `npm run dev` |
| Replay shows the simple chart, not TradingView's | The library was not installed when the release was built: `npm run setup:charts -- …zip`, build again, upload `web/` |
| 1-second candles look smooth inside each minute | They are built from the 1-minute candles. Download 1-second data for that symbol and period (step 9) |

Run a single copy of the API server: its database is one file and is not shared between processes.
