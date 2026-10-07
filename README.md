# BackTest Platform (بک‌تست‌لب)

A Persian (Farsi), right-to-left trading backtesting platform: landing page, phone sign-in, user dashboard, chart replay, analytics, journal and an admin panel, with an API server for Iranian SMS providers and payment gateways. Charts keep their original left-to-right layout.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Recharts · lightweight-charts / TradingView Advanced Charts · Zustand · Vazirmatn font
**API server** (`server/`): Node.js + TypeScript with no runtime dependencies: phone sign-in over Iranian SMS services, Iranian payment gateways, the ForexFactory calendar, real market data and the admin API.

## Run it

The app runs on its own in **demo mode** (everything simulated in the browser), or against the **API server**.

```bash
cd BackTest-Platform
npm install
npm run dev            # demo mode: http://localhost:5173
npm run build          # production build in dist/
npm run build:artifact # one self-contained HTML file in dist-artifact/
```

With the API server:

```bash
cd BackTest-Platform/server
npm install
echo ADMIN_PHONES=09121234567 > .env   # your number
npm run dev                            # API on http://localhost:8787

cd ..
VITE_API_URL=http://localhost:8787 npm run dev
```

Sign in with a number from `ADMIN_PHONES` to become admin. While real SMS sending is off (the default), the code is
printed in the server console and shown on the sign-in page in development. Admins can also sign in with a username
and password on the admin sign-in page, whose address is secret: `/k/<ADMIN_LOGIN_KEY>`; the site never links to it and the server answers "not found" without the key (`ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` from `node server/dist/server.mjs
hash-password`, or set in the admin panel's settings). Then open **پنل مدیریت** (`/admin`)
to add your SMS provider's key and your payment gateways' merchant ids.

## Pages

Plain addresses (`site.ir/dashboard`, no `#`); every link and page change loads the new page from the
server (a full page load). The web server must answer every address with `index.html` (see
`deploy/nginx-site.conf`); old `/#/…` links are moved to the plain address when the page opens. The
single-file preview build (`npm run build:artifact`) keeps routing in memory.

| Route | Page | What works |
|---|---|---|
| `/` | صفحه‌ی اصلی (Landing) | Hero with a self-playing candle replay and a sample trade, product facts, features, a dashboard preview, how it works, markets, pricing with a monthly/yearly switch, FAQ, final call to action, footer. Every "start" button opens the dashboard |
| `/dashboard` | داشبورد (Dashboard) | Name and today's Jalali date, practice streak, time invested, historical time replayed, time invested by day, trades taken with the buy/sell ratio bar, overall win rate, win rate by day, trades by symbol, recent sessions with pagination, new-session modal |
| `/sessions` | جلسات (Sessions) | Search, filter by status and strategy, sort, edit, delete |
| `/strategies` | استراتژی‌ها (Strategies) | "Create new strategy" box → name + description modal; each card shows total trades, win rate, average RR, net P&L and an equity chart |
| `/checklists` | چک‌لیست‌ها (Checklists) | Centered "create" button → modal with name, add/delete items, and a "required?" switch per item; edit, duplicate, delete |
| `/journal` | ژورنال (Journal) | Every trade, filterable by session, strategy, symbol and result, with notes per trade |
| `/analytics` | آنالیز (Analytics) | Net P&L, profit factor, expectancy, max drawdown, cumulative P&L, P&L by symbol, win rate by weekday, long vs short |
| `/settings` | تنظیمات حساب (Account) | Name, profile picture upload, subscription renewal, theme, clear data or restore the sample data |
| `/login` | ورود / ثبت‌نام | Phone number → SMS code (5 digits by default); new numbers also give their name. Candlestick chart on the left half |
| `/billing` | اشتراک و پرداخت | Plans, discount codes, payment method (a bank gateway or card to card), payment history; the bank sends the user back here with the result |
| `/billing/card` | پرداخت کارت به کارت | The card, its holder's name and the exact amount in rial (with this payment's own last three digits), a countdown, and «واریز کردم» (I have paid) |
| `/support` | پشتیبانی | Tickets with replies from the admins |
| `/k/<key>` | ورود به پنل مدیریت | The admin sign-in page (username and password) at a secret address: the key is `ADMIN_LOGIN_KEY` on the server (make-admin.sh sets it), checked by the server before the page shows. Any other key, `/admin` while signed out, and the old `/admin/login` lead to the home page |
| `/admin/*` | پنل مدیریت | Overview, users (search, ban, plan changes, admin role, last IP), users' backtests (each user's sessions, analytics, equity curve, open positions, pending orders and closed trades with entry and exit prices and times; delete a session), sign-ins and sign-outs with IP address and device (sign a user out of one device or all), announcements (a popup with a picture or video on the website and/or the dashboard), plans, transactions and refunds, discount codes (optionally for a customer's first purchase only), gateways (with connection test), card to card (cards, settings, confirming transfers), SMS (provider, test, bulk messages, log), tickets, economic calendar sync, symbols and market data sources, site settings, audit log |
| `/replay/:id` | Chart (Play button) | Candlestick replay with play/pause, step, speed and a skip-a-day button; 1s–1D timeframes; Buy/Sell opens a long or short position tool whose entry, stop (SL) and target (TP) lines are dragged on the chart (risk %, lots and R:R follow); SL/TP filled automatically as candles advance; a session checklist must have its required items ticked before an order goes through. Drawing tools on the chart's left side and indicators come from TradingView when its library is installed, otherwise from the built-in chart (below) |

### Session row
The Play button opens the chart. The chevron expands a summary: an equity curve, monthly performance for the last 3 months (USD) and daily performance for the last 6 days.

### New-session modal
Name, account balance, assets (multi-select with search), strategy (dropdown of your strategies, or create one inline), optional checklist, and start/end dates. The date picker lets you pick the **year and month first**, then the day of that month, in either the Jalali (شمسی) or Gregorian (میلادی) calendar. The end date has +1D / +1W / +1M shortcuts.

### Sidebar
The menu items, then Account Settings, then the profile picture, current subscription, days remaining and a progress bar that empties as the subscription runs down. On desktop it collapses to icons; on phones it is a drawer.

## Data

- Sessions, trades, journals, strategies and checklists are stored per account in the browser's `localStorage`.
- The demo account loads **sample data** (sessions, strategies, checklists, about 230 trades and 8 days of practice time) so every page has content. Real accounts start empty. Settings → داده‌ها can clear it or restore it.
- **Demo mode** (no `VITE_API_URL`): accounts, payments and admin data are simulated in the browser (`src/services/localBackend.ts`); market prices are **synthetic and deterministic** (`src/lib/market.ts`), a seeded random walk per symbol expanded into 5-minute bars, and the replay shows a «داده‌ی نمونه» (sample data) badge; the economic calendar is a sample built from the real release schedules. Use it for previews only.
- **Server mode**: every price is real history from Dukascopy (forex, metals, energy, indices; bid prices) and Binance (crypto), downloaded once into the server's storage (`server/src/market/download.ts`, `store.ts`: 1-minute bars per month, optional 1-second bars per day) and read from there only; `src/services/marketFeed.ts` loads it around the replay cursor. The chart waits for the bars it needs before stepping, so orders always fill on real prices; a period not downloaded stays empty, it is never filled with generated prices. The calendar comes from ForexFactory.
- **Candles**: daily and 4-hour candles of forex, metals, energy and indices close at 17:00 New York, as at brokers and on TradingView (no Sunday candle; the Sunday evening session belongs to Monday); crypto uses UTC days.
- Time invested counts 15-second ticks while the chart page is visible. Historical time replayed is the market time you have stepped through.
- **Built-in chart** (when the TradingView library is not installed, or chosen in the chart settings): a drawing toolbar on the left (trend line, ray, horizontal and vertical lines, horizontal ray, parallel channel, rectangle, Fibonacci retracement, long and short position, price range, text; magnet, stay-in-drawing mode, lock, hide, undo with Ctrl+Z, delete with the Delete key) and indicators (moving average, EMA, Bollinger Bands, Donchian channels, RSI, MACD, stochastic, ATR) with their own settings. Indicator values use only the candles already shown. Drawings (per symbol) and indicators are kept per session and chart pane in the browser. Code: `src/chart/lwDrawings.ts`, `lwIndicators.ts`, `indicators.ts`, `src/components/replay/ChartTools.tsx`.
- **Navigation buttons** (both chart engines): zoom out, zoom in, scroll back, scroll forward and reset at the bottom of the chart, as on TradingView. They show while the pointer is over the chart (always on phones and tablets), and holding a button repeats it. Reset loads the candles again, returns to the starting view and fits the price scale: the fix when the chart is squashed, stretched or scrolled away. The buttons keep clear of the floating replay bar (TradingView's own buttons, which sat under it, are turned off). Code: `src/chart/navButtons.ts`.

## API server (`server/`)

| Area | What it does |
|---|---|
| Sign-in | `POST /api/auth/otp`, `POST /api/auth/verify`. Codes are stored as HMACs, expire (120 s by default), allow 5 tries and one resend per minute; requests are rate limited per IP and per number. Sessions are random bearer tokens (30 days) stored hashed. |
| SMS (پیامک) | Kavenegar (verify lookup), SMS.ir (verify template), Melipayamak (shared service number, REST or console API), Ghasedak (OTP template), FarazSMS / IPPanel (pattern). With a template set the code goes through the provider's OTP service; otherwise as a normal message. In the template field, `id:VARIABLE` sets the template's variable name. Every message is logged. |
| Payments | Zarinpal (v4), Zibal, IDPay, NextPay and Pay.ir, each with its sandbox. Checkout registers the payment, the browser goes to the bank, the bank returns to `/api/payments/callback/<gateway>`, and the server verifies it server-to-server (and checks the amount) before extending the plan. Repeated and forged callbacks are ignored. Unfinished payments expire after two hours. |
| Card to card | Admins add the cards that receive money (card number checked, bank found from its first six digits, holder name) and switch the method on. Each payment gets one of the active cards in turn and an amount in **rial** whose last three digits are a code no other open payment has (the price rounded up to whole thousands of rial, plus 1–999). The payer transfers that exact amount and presses «واریز کردم», optionally with the last 4 digits of their card and the bank's tracking number. The admin finds the deposit by its last three digits on the **کارت به کارت** page and confirms it (the plan starts) or rejects it (the payer sees the reason). Unreported payments close at the deadline (30 minutes by default) but keep their code for a day, so a late transfer can still be reported and confirmed. Code in `server/src/payments/card.ts` and `src/services/cards.ts`. |
| Calendar | ForexFactory calendar pages (with actual values) by week, cached; past weeks are fetched once, the current and next week refresh hourly; the weekly JSON feed covers the current week if the page is blocked. Weeks that cannot be fetched are filled from the sample calendar in the app. |
| Market data | `GET /api/market/days?symbol=EURUSD&from=2024-01-01&to=2024-01-30[&res=1m]` and `GET /api/market/seconds?...` read the stored history only. The downloader fills it from Dukascopy's data API (JSON) or its datafeed files (`.bi5`, decoded by a built-in LZMA decoder), and Binance's monthly archives (data.binance.vision) or klines: every hour by itself, from the admin panel (`/api/admin/market/*`), or with `node server.mjs download`. `GET /api/market/showcase` (public): stored prices for the landing and sign-in pages. |
| Backtest copy | The app keeps each signed-in user's sessions, orders, positions and strategies on the server for the admin panel: on every page load it sends a fingerprint (`POST /api/me/backtests/check`) and uploads only when the server's copy is out of date (`PUT /api/me/backtests`, at most 8 MB), a few seconds after a change. Journals, notes and chart drawings are not sent. One file per user in `DATA_DIR/backtests/`. A session an admin deletes is removed from the user's browser the next time they open the site. Code: `server/src/backtests.ts`, `src/services/backtestSync.ts`. |
| Sign-ins | Every sign-in and sign-out (with the method, IP address and browser) is logged, newest 10 000 kept; each user's last IP is on their account. A device is a sign-in session; admins can end one or all. Code: `server/src/activity.ts`. |
| Announcements | `GET /api/announcements?placement=site\|app` (public; members-only messages need a sign-in), `POST /api/announcements/:id/view`, `GET /api/media/:id` (byte ranges, for video). Admins upload a picture (JPG, PNG, WebP, GIF, up to 10 MB) or video (MP4, WebM, MOV, up to 100 MB) to `POST /api/admin/media`; files are kept in `DATA_DIR/media/` and deleted a day after no message uses them. Each visitor sees a message once (remembered in the browser); «نمایش دوباره» shows it again. Code: `server/src/announcements.ts`, `src/components/AnnouncementPopup.tsx`. |
| Admin | Everything under `/api/admin/*` that the admin panel uses, with input validation and an audit log. |

Data lives in `server/data/` (`db.json` for accounts, payments and settings; `news.json`; `market/` for cached bars).
The database is one JSON file written atomically, which fits a single server process.

```bash
npm test          # sign-in, payments (simulator, each gateway's verify flow, card to card), SMS providers, calendar and market parsers, market storage, admin API, backtest copies, sign-in log, announcements
npm run typecheck
npm run build     # bundles to dist/server.mjs; run with `npm start`
```

### Deploying

See **[DEPLOY.md](DEPLOY.md)** for the step-by-step guide. In short: `npm run release -- https://your-domain`
builds the app and the self-contained `server.mjs` on your computer; on the server, nginx serves the app and
proxies `/api/` to the API server, which systemd keeps running. Ready-made files are in `deploy/`
(nginx site, systemd unit, and a relay for servers inside Iran that cannot reach Dukascopy, Binance or ForexFactory).

## Layout

```
server/
  src/          config, JSON database, router, auth, sms/, payments/, news/, market/ (with the LZMA decoder), routes/
  test/         node:test suites with mocked upstream services
src/
  services/     backend interface: localBackend (demo), httpBackend (API server), marketFeed (real bars, site config)
  lib/          calendar (Jalali/Gregorian), formatting (Persian digits), market data, stats, types
  store/        Zustand store with persistence, plus sample data
  hooks/        click-outside, popover reveal, chart colors
  components/
    layout/     header, sidebar, toasts
    ui/         modal, confirm dialog, select, multi-select, date picker, toggle, avatar
    charts/     Recharts wrappers (always LTR) and the candlestick replay chart
    sessions/   session list/row/summary and the session modal
  components/landing/  animated replay demo for the landing hero
  pages/        Landing, Dashboard, Sessions, Strategies, Checklists, Journal, Analytics, Settings, Replay
```
