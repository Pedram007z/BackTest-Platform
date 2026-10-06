# Deploying BacktestLab

The site is two parts:

- **the web app**: static files (HTML, JS, CSS) served by nginx;
- **the API server**: one file, `server.mjs`, run by Node.js. It needs no `npm install` on the server.

Both are served from one domain: the app at `https://your-domain/`, the API at `https://your-domain/api/`.
The steps below use `backtestlab.ir` as the domain; use yours.

## What you need

- A Linux server (Ubuntu 22.04 or 24.04). 1 CPU and 1–2 GB RAM are enough to start.
  Disk: the market-data cache grows by about 1.2 MB per symbol per year of history that users replay.
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
  domestic, and market data and calendar weeks loaded before are cached on the server. Only data that was
  never loaded is missing until the connection returns.
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
sudo cp backtestlab/check-sources.sh /opt/backtestlab/
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

Open `https://YOUR-DOMAIN`. You should see the landing page.

## 7. First sign-in and the admin panel

1. Click **ورود** and enter a number from `ADMIN_PHONES`. Real SMS sending is still off, so the code is
   in the server log:
   ```bash
   sudo journalctl -u backtestlab -n 20 | grep sms:dev
   ```
2. Open **پنل مدیریت** (admin panel):
   - **پیامک** (SMS): choose your provider, enter the API key, sender line and OTP template, send a test
     message, then turn on **ارسال واقعی** (real sending).
   - **درگاه‌های پرداخت** (gateways): enter each merchant id, turn sandbox off, and press the connection test.
     If a gateway asks for a callback address, it is `https://YOUR-DOMAIN/api/payments/callback/zarinpal`
     (or `zibal`, `idpay`, `nextpay`, `payir`).
   - **پلن‌ها** (plans) and **کدهای تخفیف** (discount codes): prices and offers.
   - **نمادها و داده‌ی بازار** (symbols and market data): data source per market, and which symbols users can pick.
   - **تقویم اقتصادی** (economic calendar): press sync and check that no error is shown.

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

## Updating

Build a new release (step 1), upload it (step 3), copy `web/` and `server.mjs` as in step 3, then:

```bash
sudo systemctl restart backtestlab
```

Accounts, payments, settings and cached data in `/var/lib/backtestlab` are kept.

## Backups

`/var/lib/backtestlab/db.json` holds accounts, payments and settings; back it up daily. The market cache
(`market/`) can always be downloaded again.

```bash
sudo mkdir -p /root/backups
sudo crontab -e
# add this line: every night at 03:30
30 3 * * * tar -czf /root/backups/backtestlab-$(date +\%F).tar.gz -C /var/lib/backtestlab db.json news.json
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
| Charts stay empty, with «دریافت نشد» messages | The server cannot reach Dukascopy or Binance: `bash /opt/backtestlab/check-sources.sh`, then set up the relay (step 8) |
| A click shows an **empty page** until you refresh | Errors from visitors' browsers are logged: `sudo journalctl -u backtestlab \| grep client-error`. Common causes: the browser's translator (turn off "Translate this page"), an extension, or a CDN/firewall "optimization" (ArvanCloud/Cloudflare minify, Rocket Loader, script rewriting): turn those off for the site. Serve the release's `web/` folder, not the source code or `npm run dev` |
| Replay shows the simple chart, not TradingView's | The library was not installed when the release was built: `npm run setup:charts -- …zip`, build again, upload `web/` |
| 1-second charts take long to open | Second bars are downloaded per hour on first use (Dukascopy tick files / Binance 1s klines) and cached in `DATA_DIR/market` |

Run a single copy of the API server: its database is one file and is not shared between processes.
