# داشبورد بک‌تست (Backtest Dashboard)

A Persian (Farsi), right-to-left user dashboard for a trading backtesting platform. Charts keep their original left-to-right layout.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Recharts · lightweight-charts · Zustand · Vazirmatn font

## Run it

```bash
cd backtest-dashboard
npm install
npm run dev            # http://localhost:5173
npm run build          # production build in dist/
npm run build:artifact # one self-contained HTML file in dist-artifact/
```

## Pages

| Route | Page | What works |
|---|---|---|
| `/` | داشبورد (Dashboard) | Name and today's Jalali date, practice streak, time invested, historical time replayed, time invested by day, trades taken with the buy/sell ratio bar, overall win rate, win rate by day, trades by symbol, recent sessions with pagination, new-session modal |
| `/sessions` | جلسات (Sessions) | Search, filter by status and strategy, sort, edit, delete |
| `/strategies` | استراتژی‌ها (Strategies) | "Create new strategy" box → name + description modal; each card shows total trades, win rate, average RR, net P&L and an equity chart |
| `/checklists` | چک‌لیست‌ها (Checklists) | Centered "create" button → modal with name, add/delete items, and a "required?" switch per item; edit, duplicate, delete |
| `/journal` | ژورنال (Journal) | Every trade, filterable by session, strategy, symbol and result, with notes per trade |
| `/analytics` | آنالیز (Analytics) | Net P&L, profit factor, expectancy, max drawdown, cumulative P&L, P&L by symbol, win rate by weekday, long vs short |
| `/settings` | تنظیمات حساب (Account) | Name, profile picture upload, subscription renewal, theme, clear data or restore the sample data |
| `/replay/:id` | Chart (Play button) | Candlestick replay with play/pause, step, speed and a skip-a-day button; 5m–1D timeframes; buy/sell with risk %, stop in pips and RR; SL/TP filled automatically as candles advance; a session checklist must have its required items ticked before an order goes through |

### Session row
The Play button opens the chart. The chevron expands a summary: an equity curve, monthly performance for the last 3 months (USD) and daily performance for the last 6 days.

### New-session modal
Name, account balance, assets (multi-select with search), strategy (dropdown of your strategies, or create one inline), optional checklist, and start/end dates. The date picker lets you pick the **year and month first**, then the day of that month, in either the Jalali (شمسی) or Gregorian (میلادی) calendar. The end date has +1D / +1W / +1M shortcuts.

### Sidebar
The menu items, then Account Settings, then the profile picture, current subscription, days remaining and a progress bar that empties as the subscription runs down. On desktop it collapses to icons; on phones it is a drawer.

## Data

- Everything is stored in the browser's `localStorage` (`backtest-dashboard:v1`). There is no backend.
- The first visit loads **sample data** (sessions, strategies, checklists, about 230 trades and 8 days of practice time) so every page has content. Settings → داده‌ها can clear it or restore it.
- Market prices are **synthetic and deterministic** (`src/lib/market.ts`). A seeded daily random walk per symbol is expanded into 5-minute bars, so replaying the same dates always shows the same candles. To use real data, replace `getCandles`, `priceAt` and `bars5m` with calls to your data API.
- Time invested counts 15-second ticks while the chart page is visible. Historical time replayed is the market time you have stepped through.

## Layout

```
src/
  lib/          calendar (Jalali/Gregorian), formatting (Persian digits), market data, stats, types
  store/        Zustand store with persistence, plus sample data
  hooks/        click-outside, popover reveal, chart colors
  components/
    layout/     header, sidebar, toasts
    ui/         modal, confirm dialog, select, multi-select, date picker, toggle, avatar
    charts/     Recharts wrappers (always LTR) and the candlestick replay chart
    sessions/   session list/row/summary and the session modal
  pages/        Dashboard, Sessions, Strategies, Checklists, Journal, Analytics, Settings, Replay
```
