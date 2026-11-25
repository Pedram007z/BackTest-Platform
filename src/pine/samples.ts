/** Ready-made scripts for the tester's "new from template" menu. */

export interface Sample {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const SAMPLES: Sample[] = [
  {
    id: 'ma-cross',
    name: 'تقاطع میانگین متحرک با حد ضرر ATR',
    description: 'خرید با عبور EMA سریع از کند به بالا، فروش برعکس؛ حد ضرر و حد سود بر پایه‌ی ATR.',
    code: `//@version=5
strategy("MA Cross + ATR", overlay = true, initial_capital = 10000,
     default_qty_type = strategy.percent_of_equity, default_qty_value = 100,
     commission_type = strategy.commission.cash_per_contract, commission_value = 0.00005)

// ورودی‌ها از دکمه‌ی «تنظیمات» قابل تغییرند
fastLen = input.int(9, "میانگین سریع", minval = 1)
slowLen = input.int(21, "میانگین کند", minval = 1)
atrLen  = input.int(14, "طول ATR")
slMult  = input.float(1.5, "ضریب حد ضرر (ATR)", step = 0.1)
tpMult  = input.float(3.0, "ضریب حد سود (ATR)", step = 0.1)

fast = ta.ema(close, fastLen)
slow = ta.ema(close, slowLen)
atr  = ta.atr(atrLen)

plot(fast, "EMA سریع", color.new(color.teal, 0), 2)
plot(slow, "EMA کند", color.new(color.orange, 0), 2)

if ta.crossover(fast, slow)
    strategy.entry("Long", strategy.long)
if ta.crossunder(fast, slow)
    strategy.entry("Short", strategy.short)

// حد ضرر و حد سود هر معامله از قیمت ورود
if strategy.position_size > 0
    strategy.exit("XL", "Long", stop = strategy.position_avg_price - slMult * atr, limit = strategy.position_avg_price + tpMult * atr)
if strategy.position_size < 0
    strategy.exit("XS", "Short", stop = strategy.position_avg_price + slMult * atr, limit = strategy.position_avg_price - tpMult * atr)
`,
  },
  {
    id: 'rsi',
    name: 'برگشت از اشباع RSI',
    description: 'خرید وقتی RSI از ناحیه‌ی اشباع فروش بالا می‌آید و فروش وقتی از اشباع خرید پایین می‌آید.',
    code: `//@version=5
strategy("RSI Reversal", overlay = true, initial_capital = 10000,
     default_qty_type = strategy.percent_of_equity, default_qty_value = 50)

length     = input.int(14, "طول RSI")
oversold   = input.int(30, "اشباع فروش")
overbought = input.int(70, "اشباع خرید")

r = ta.rsi(close, length)

if ta.crossover(r, oversold)
    strategy.entry("RSI Long", strategy.long, comment = "RSI↑")
if ta.crossunder(r, overbought)
    strategy.entry("RSI Short", strategy.short, comment = "RSI↓")

plotshape(ta.crossover(r, oversold), "سیگنال خرید", shape.triangleup, location.belowbar, color.green, size = size.tiny)
plotshape(ta.crossunder(r, overbought), "سیگنال فروش", shape.triangledown, location.abovebar, color.red, size = size.tiny)
`,
  },
  {
    id: 'supertrend',
    name: 'سوپرترند',
    description: 'ورود و برگشت پوزیشن با تغییر جهت سوپرترند.',
    code: `//@version=5
strategy("Supertrend", overlay = true, initial_capital = 10000,
     default_qty_type = strategy.percent_of_equity, default_qty_value = 100)

atrPeriod = input.int(10, "طول ATR")
factor    = input.float(3.0, "ضریب", step = 0.1)

[st, direction] = ta.supertrend(factor, atrPeriod)
plot(direction < 0 ? st : na, "روند صعودی", color.green, 2, plot.style_linebr)
plot(direction > 0 ? st : na, "روند نزولی", color.red, 2, plot.style_linebr)

if ta.change(direction) < 0
    strategy.entry("Long", strategy.long)
if ta.change(direction) > 0
    strategy.entry("Short", strategy.short)
`,
  },
  {
    id: 'bollinger',
    name: 'شکست باندهای بولینگر با فیلتر تایم‌فریم بالاتر',
    description: 'ورود با بسته شدن بیرون از باند، فقط هم‌جهت با EMA تایم‌فریم ۴ ساعته (request.security).',
    code: `//@version=5
strategy("BB Breakout + HTF", overlay = true, initial_capital = 10000,
     default_qty_type = strategy.percent_of_equity, default_qty_value = 100)

length = input.int(20, "طول")
mult   = input.float(2.0, "انحراف معیار", step = 0.1)
htf    = input.timeframe("240", "تایم‌فریم فیلتر")

[basis, upper, lower] = ta.bb(close, length, mult)
trend = request.security(syminfo.tickerid, htf, ta.ema(close, 50))

plot(basis, "میانه", color.gray)
plot(upper, "باند بالا", color.blue)
plot(lower, "باند پایین", color.blue)
plot(trend, "EMA تایم‌فریم بالا", color.orange, 2)

if close > upper and close > trend
    strategy.entry("Long", strategy.long)
if close < lower and close < trend
    strategy.entry("Short", strategy.short)
if strategy.position_size > 0 and close < basis
    strategy.close("Long", comment = "میانه")
if strategy.position_size < 0 and close > basis
    strategy.close("Short", comment = "میانه")
`,
  },
  {
    id: 'session-breakout',
    name: 'شکست سقف و کف سشن آسیا',
    description: 'سقف و کف سشن آسیا را می‌سازد و در سشن لندن با شکست آن وارد می‌شود (یک معامله در روز).',
    code: `//@version=5
strategy("Asia Range Breakout", overlay = true, initial_capital = 10000,
     default_qty_type = strategy.percent_of_equity, default_qty_value = 100)

asia   = input.session("0000-0700", "سشن آسیا (UTC)")
london = input.session("0700-1100", "زمان ورود (UTC)")
rr     = input.float(2.0, "نسبت سود به ضرر", step = 0.5)

inAsia   = not na(time(timeframe.period, asia, "UTC"))
inLondon = not na(time(timeframe.period, london, "UTC"))

var float hi = na
var float lo = na
var bool traded = false
if inAsia and not inAsia[1]
    hi := high
    lo := low
    traded := false
else if inAsia
    hi := math.max(hi, high)
    lo := math.min(lo, low)

plot(inAsia ? na : hi, "سقف آسیا", color.green, 1, plot.style_linebr)
plot(inAsia ? na : lo, "کف آسیا", color.red, 1, plot.style_linebr)

if inLondon and not traded and strategy.position_size == 0
    if close > hi
        strategy.entry("Long", strategy.long)
        strategy.exit("XL", "Long", stop = lo, limit = close + (close - lo) * rr)
        traded := true
    else if close < lo
        strategy.entry("Short", strategy.short)
        strategy.exit("XS", "Short", stop = hi, limit = close - (hi - close) * rr)
        traded := true

// پایان روز: بستن پوزیشن باز
if hour(time, "UTC") == 20
    strategy.close_all(comment = "پایان روز")
`,
  },
  {
    id: 'rsi-indicator',
    name: 'اندیکاتور RSI با نواحی اشباع (نمونه‌ی اندیکاتور)',
    description: 'یک اندیکاتور ساده در پنل جداگانه؛ اجرای اندیکاتورها به افزونه نیاز ندارد.',
    code: `//@version=5
indicator("RSI Zones", overlay = false)

length = input.int(14, "طول")
src    = input.source(close, "منبع")

r = ta.rsi(src, length)
c = r > 70 ? color.red : r < 30 ? color.green : color.gray
plot(r, "RSI", c, 2)
hline(70, "اشباع خرید", color.red)
hline(50, "میانه", color.gray)
hline(30, "اشباع فروش", color.green)
bgcolor(r > 70 ? color.new(color.red, 88) : r < 30 ? color.new(color.green, 88) : na)
`,
  },
];

export const BLANK_SCRIPT = `//@version=5
strategy("استراتژی من", overlay = true, initial_capital = 10000,
     default_qty_type = strategy.percent_of_equity, default_qty_value = 100)

// شرط ورود و خروج را اینجا بنویسید
fast = ta.sma(close, 10)
slow = ta.sma(close, 30)
plot(fast, "سریع", color.blue)
plot(slow, "کند", color.orange)

if ta.crossover(fast, slow)
    strategy.entry("Long", strategy.long)
if ta.crossunder(fast, slow)
    strategy.close("Long")
`;
