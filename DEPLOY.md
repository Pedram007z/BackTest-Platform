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

### Choosing where to host

- **Payment gateways and SMS providers** (Zarinpal, Zibal, Kavenegar, …) register your merchant for your
  domain and usually require an eNamad. Some Iranian services refuse requests from servers outside Iran,
  so ask each provider before hosting abroad. A server inside Iran is the safe choice.
- **Dukascopy, Binance and ForexFactory** are often unreachable from servers inside Iran (Binance blocks
  Iran). The API server can fetch them through a small relay server abroad; see step 8.

## 1. Build the release (on your computer)

```bash
cd backtest-dashboard
# optional, for TradingView charts: install the library you licensed
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
relay-nginx.conf      optional relay (step 8)
```

The address you pass is built into the app. If you later change the domain, build again.

## 2. Prepare the server (once)

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v        # v22.x

# a user for the service, and the folders
sudo useradd --system --home /var/lib/backtestlab --shell /usr/sbin/nologin backtestlab
sudo mkdir -p /opt/backtestlab/server /var/www/backtestlab
```

Ubuntu's own `nodejs` package is too old (it must be 20.12 or newer). If the NodeSource address is not
reachable from the server, download the "Linux x64" `.tar.xz` from nodejs.org on your computer, upload it,
and run `sudo tar -xJf node-v22.*-linux-x64.tar.xz -C /usr/local --strip-components=1`. Node is then
`/usr/local/bin/node`: change `ExecStart` in `backtestlab.service` to that path.

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

## 8. Relay for market data and the calendar (only if needed)

Signs that the server cannot reach the data sources: the calendar page in the admin panel shows a
timeout or "Cloudflare" error, or charts show "داده‌ی بازار دریافت نشد".

1. On any small server outside Iran, install nginx and certbot, then use `relay-nginx.conf`: replace
   `relay.example.com` with the relay's domain and `203.0.113.10` with your main server's public IP
   (only that IP may use the relay). Enable it and run certbot as written at the top of the file.
2. On the main server, add to `.env`:
   ```ini
   DUKASCOPY_URL=https://relay.example.com/dukascopy
   BINANCE_URL=https://relay.example.com/binance
   FF_BASE_URL=https://relay.example.com/forexfactory
   FF_FEED_URL=https://relay.example.com/ff_calendar_thisweek.json
   ```
3. `sudo systemctl restart backtestlab`, then sync the calendar again in the admin panel.

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

Run a single copy of the API server: its database is one file and is not shared between processes.
