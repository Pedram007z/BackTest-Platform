import type { LibraryIndicator } from './types';

/** Trend, momentum and volatility indicators of the built-in library. */

export const TREND: LibraryIndicator[] = [
  {
    id: 'ma-ribbon',
    name: 'Moving Average Ribbon',
    nameFa: 'ریبون میانگین‌ها',
    overlay: true,
    code: `//@version=5
indicator("MA Ribbon", "Ribbon", overlay = true)
kind = input.string("EMA", "نوع میانگین", options = ["EMA", "SMA", "WMA", "HMA"])
src  = input.source(close, "منبع")
l1 = input.int(8, "میانگین ۱", minval = 1)
l2 = input.int(21, "میانگین ۲", minval = 1)
l3 = input.int(50, "میانگین ۳", minval = 1)
l4 = input.int(200, "میانگین ۴", minval = 1)
ma(x, len) =>
    switch kind
        "SMA" => ta.sma(x, len)
        "WMA" => ta.wma(x, len)
        "HMA" => ta.hma(x, len)
        => ta.ema(x, len)
plot(ma(src, l1), "MA 1", #26c6da, 1)
plot(ma(src, l2), "MA 2", #42a5f5, 1)
plot(ma(src, l3), "MA 3", #ff9800, 2)
plot(ma(src, l4), "MA 4", #ef5350, 2)
`,
  },
  {
    id: 'wma',
    name: 'Weighted Moving Average',
    nameFa: 'میانگین متحرک وزنی (WMA)',
    overlay: true,
    code: `//@version=5
indicator("Weighted Moving Average", "WMA", overlay = true)
len = input.int(20, "طول", minval = 1)
src = input.source(close, "منبع")
plot(ta.wma(src, len), "WMA", #2962ff, 2)
`,
  },
  {
    id: 'hma',
    name: 'Hull Moving Average',
    nameFa: 'میانگین متحرک هال (HMA)',
    overlay: true,
    code: `//@version=5
indicator("Hull Moving Average", "HMA", overlay = true)
len = input.int(21, "طول", minval = 2)
src = input.source(close, "منبع")
colorize = input.bool(true, "رنگ بر اساس جهت")
hma = ta.hma(src, len)
plot(hma, "HMA", colorize ? (hma > hma[1] ? #26a69a : #ef5350) : #2962ff, 2)
`,
  },
  {
    id: 'dema',
    name: 'Double EMA',
    nameFa: 'میانگین نمایی دوگانه (DEMA)',
    overlay: true,
    code: `//@version=5
indicator("Double EMA", "DEMA", overlay = true)
len = input.int(21, "طول", minval = 1)
src = input.source(close, "منبع")
e1 = ta.ema(src, len)
e2 = ta.ema(e1, len)
plot(2 * e1 - e2, "DEMA", #43a047, 2)
`,
  },
  {
    id: 'tema',
    name: 'Triple EMA',
    nameFa: 'میانگین نمایی سه‌گانه (TEMA)',
    overlay: true,
    code: `//@version=5
indicator("Triple EMA", "TEMA", overlay = true)
len = input.int(21, "طول", minval = 1)
src = input.source(close, "منبع")
e1 = ta.ema(src, len)
e2 = ta.ema(e1, len)
e3 = ta.ema(e2, len)
plot(3 * (e1 - e2) + e3, "TEMA", #8e24aa, 2)
`,
  },
  {
    id: 'alma',
    name: 'Arnaud Legoux Moving Average',
    nameFa: 'میانگین متحرک آلما (ALMA)',
    overlay: true,
    code: `//@version=5
indicator("Arnaud Legoux Moving Average", "ALMA", overlay = true)
len    = input.int(9, "طول", minval = 1)
offset = input.float(0.85, "آفست", step = 0.05)
sigma  = input.float(6, "سیگما", step = 0.5)
src    = input.source(close, "منبع")
plot(ta.alma(src, len, offset, sigma), "ALMA", #00897b, 2)
`,
  },
  {
    id: 'kama',
    name: 'Kaufman Adaptive Moving Average',
    nameFa: 'میانگین تطبیقی کافمن (KAMA)',
    overlay: true,
    code: `//@version=5
indicator("Kaufman Adaptive Moving Average", "KAMA", overlay = true)
len     = input.int(10, "طول بهره‌وری", minval = 1)
fastLen = input.int(2, "سریع", minval = 1)
slowLen = input.int(30, "کند", minval = 1)
src     = input.source(close, "منبع")
moved = math.abs(ta.change(src, len))
noise = math.sum(math.abs(ta.change(src)), len)
er = noise != 0 ? moved / noise : 0
fastSC = 2 / (fastLen + 1)
slowSC = 2 / (slowLen + 1)
sc = math.pow(er * (fastSC - slowSC) + slowSC, 2)
var float kama = na
kama := na(kama) ? src : kama + nz(sc) * (src - kama)
plot(kama, "KAMA", #fb8c00, 2)
`,
  },
  {
    id: 'ichimoku',
    name: 'Ichimoku Cloud',
    nameFa: 'ابر ایچیموکو',
    overlay: true,
    code: `//@version=5
indicator("Ichimoku Cloud", "Ichimoku", overlay = true)
conversionPeriods   = input.int(9, "تنکانسن (Conversion)", minval = 1)
basePeriods         = input.int(26, "کیجونسن (Base)", minval = 1)
laggingSpan2Periods = input.int(52, "سنکو اسپن B", minval = 1)
displacement        = input.int(26, "جابه‌جایی", minval = 1)
donchian(len) => math.avg(ta.lowest(len), ta.highest(len))
conversionLine = donchian(conversionPeriods)
baseLine = donchian(basePeriods)
leadLine1 = math.avg(conversionLine, baseLine)
leadLine2 = donchian(laggingSpan2Periods)
plot(conversionLine, "تنکانسن", #2962ff)
plot(baseLine, "کیجونسن", #b71c1c)
plot(close, "چیکو اسپن", #43a047, offset = -displacement + 1)
p1 = plot(leadLine1, "سنکو اسپن A", #a5d6a7, offset = displacement - 1)
p2 = plot(leadLine2, "سنکو اسپن B", #ef9a9a, offset = displacement - 1)
fill(p1, p2, color = leadLine1 > leadLine2 ? color.rgb(67, 160, 71, 88) : color.rgb(244, 67, 54, 88))
`,
  },
  {
    id: 'supertrend',
    name: 'Supertrend',
    nameFa: 'سوپرترند',
    overlay: true,
    code: `//@version=5
indicator("Supertrend", overlay = true)
atrPeriod = input.int(10, "طول ATR", minval = 1)
factor    = input.float(3.0, "ضریب", step = 0.1)
[st, dir] = ta.supertrend(factor, atrPeriod)
bodyMiddle = plot((open + close) / 2, "میانه‌ی بدنه", display = display.none)
upTrend   = plot(dir < 0 ? st : na, "روند صعودی", #26a69a, 2, plot.style_linebr)
downTrend = plot(dir < 0 ? na : st, "روند نزولی", #ef5350, 2, plot.style_linebr)
fill(bodyMiddle, upTrend, color.new(#26a69a, 90))
fill(bodyMiddle, downTrend, color.new(#ef5350, 90))
plotshape(ta.change(dir) < 0, "شروع روند صعودی", shape.triangleup, location.belowbar, #26a69a, size = size.tiny)
plotshape(ta.change(dir) > 0, "شروع روند نزولی", shape.triangledown, location.abovebar, #ef5350, size = size.tiny)
`,
  },
  {
    id: 'psar',
    name: 'Parabolic SAR',
    nameFa: 'پارابولیک سار',
    overlay: true,
    code: `//@version=5
indicator("Parabolic SAR", "SAR", overlay = true)
start = input.float(0.02, "شروع", step = 0.01)
inc   = input.float(0.02, "افزایش", step = 0.01)
max   = input.float(0.2, "حداکثر", step = 0.05)
sar = ta.sar(start, inc, max)
plot(sar, "SAR", close > sar ? #26a69a : #ef5350, 2, plot.style_cross)
`,
  },
  {
    id: 'keltner',
    name: 'Keltner Channels',
    nameFa: 'کانال کلتنر',
    overlay: true,
    code: `//@version=5
indicator("Keltner Channels", "KC", overlay = true)
length = input.int(20, "طول", minval = 1)
mult   = input.float(2.0, "ضریب", step = 0.1)
src    = input.source(close, "منبع")
useTR  = input.bool(true, "استفاده از True Range")
[basis, upper, lower] = ta.kc(src, length, mult, useTR)
u = plot(upper, "بالا", #2962ff)
plot(basis, "میانه", #ff9800)
l = plot(lower, "پایین", #2962ff)
fill(u, l, color.rgb(33, 150, 243, 93))
`,
  },
  {
    id: 'linreg',
    name: 'Linear Regression Channel',
    nameFa: 'کانال رگرسیون خطی',
    overlay: true,
    code: `//@version=5
indicator("Linear Regression Channel", "LinReg", overlay = true, max_lines_count = 10)
len  = input.int(100, "طول", minval = 2)
mult = input.float(2.0, "انحراف معیار", step = 0.1)
src  = input.source(close, "منبع")
if barstate.islast and bar_index >= len
    sx = 0.0
    sy = 0.0
    sxy = 0.0
    sxx = 0.0
    for i = 0 to len - 1
        x = len - 1 - i
        y = src[i]
        sx += x
        sy += y
        sxy += x * y
        sxx += x * x
    slope = (len * sxy - sx * sy) / (len * sxx - sx * sx)
    icept = (sy - slope * sx) / len
    dev = 0.0
    for i = 0 to len - 1
        dev += math.pow(src[i] - (icept + slope * (len - 1 - i)), 2)
    dev := math.sqrt(dev / len) * mult
    y1 = icept
    y2 = icept + slope * (len - 1)
    x1 = bar_index - len + 1
    line.new(x1, y1, bar_index, y2, color = #2962ff, width = 2, extend = extend.right)
    line.new(x1, y1 + dev, bar_index, y2 + dev, color = #ef5350, extend = extend.right)
    line.new(x1, y1 - dev, bar_index, y2 - dev, color = #26a69a, extend = extend.right)
`,
  },
  {
    id: 'envelope',
    name: 'Envelope',
    nameFa: 'پوشش میانگین (Envelope)',
    overlay: true,
    code: `//@version=5
indicator("Envelope", "Env", overlay = true)
len     = input.int(20, "طول", minval = 1)
percent = input.float(0.5, "درصد فاصله", step = 0.05)
src     = input.source(close, "منبع")
useEma  = input.bool(false, "میانگین نمایی")
basis = useEma ? ta.ema(src, len) : ta.sma(src, len)
u = plot(basis * (1 + percent / 100), "بالا", #2962ff)
plot(basis, "میانه", #ff9800)
l = plot(basis * (1 - percent / 100), "پایین", #2962ff)
fill(u, l, color.rgb(33, 150, 243, 94))
`,
  },
  {
    id: 'adx',
    name: 'ADX / DMI',
    nameFa: 'شاخص قدرت روند (ADX / DMI)',
    overlay: false,
    code: `//@version=5
indicator("Directional Movement Index", "ADX", overlay = false)
len    = input.int(14, "طول DI", minval = 1)
lensig = input.int(14, "هموارسازی ADX", minval = 1)
level  = input.int(25, "آستانه‌ی روند")
[diplus, diminus, adx] = ta.dmi(len, lensig)
plot(adx, "ADX", #ff9800, 2)
plot(diplus, "+DI", #26a69a)
plot(diminus, "-DI", #ef5350)
hline(level, "آستانه", #787b86)
`,
  },
  {
    id: 'aroon',
    name: 'Aroon',
    nameFa: 'آرون',
    overlay: false,
    code: `//@version=5
indicator("Aroon", overlay = false)
length = input.int(14, "طول", minval = 1)
upper = 100 * (ta.highestbars(high, length + 1) + length) / length
lower = 100 * (ta.lowestbars(low, length + 1) + length) / length
plot(upper, "Aroon Up", #ff9800, 2)
plot(lower, "Aroon Down", #2962ff, 2)
hline(70, "", #787b86)
hline(30, "", #787b86)
`,
  },
];

export const MOMENTUM: LibraryIndicator[] = [
  {
    id: 'stoch-rsi',
    name: 'Stochastic RSI',
    nameFa: 'استوکستیک RSI',
    overlay: false,
    code: `//@version=5
indicator("Stochastic RSI", "Stoch RSI", overlay = false)
smoothK     = input.int(3, "هموارسازی K", minval = 1)
smoothD     = input.int(3, "هموارسازی D", minval = 1)
lengthRSI   = input.int(14, "طول RSI", minval = 1)
lengthStoch = input.int(14, "طول استوکستیک", minval = 1)
src = input.source(close, "منبع")
rsi1 = ta.rsi(src, lengthRSI)
k = ta.sma(ta.stoch(rsi1, rsi1, rsi1, lengthStoch), smoothK)
d = ta.sma(k, smoothD)
plot(k, "K", #2962ff)
plot(d, "D", #ff6d00)
h0 = hline(80, "بالا", #787b86)
h1 = hline(20, "پایین", #787b86)
fill(h0, h1, color.rgb(33, 150, 243, 92))
`,
  },
  {
    id: 'cci',
    name: 'Commodity Channel Index',
    nameFa: 'شاخص کانال کالا (CCI)',
    overlay: false,
    code: `//@version=5
indicator("Commodity Channel Index", "CCI", overlay = false)
length = input.int(20, "طول", minval = 1)
src    = input.source(hlc3, "منبع")
plot(ta.cci(src, length), "CCI", #2962ff, 2)
b1 = hline(100, "+۱۰۰", #787b86)
hline(0, "", #787b86)
b0 = hline(-100, "-۱۰۰", #787b86)
fill(b1, b0, color.rgb(33, 150, 243, 93))
`,
  },
  {
    id: 'williams-r',
    name: 'Williams %R',
    nameFa: 'ویلیامز %R',
    overlay: false,
    code: `//@version=5
indicator("Williams %R", "%R", overlay = false)
length = input.int(14, "طول", minval = 1)
plot(ta.wpr(length), "%R", #7e57c2, 2)
b1 = hline(-20, "اشباع خرید", #787b86)
hline(-50, "", #787b86)
b0 = hline(-80, "اشباع فروش", #787b86)
fill(b1, b0, color.rgb(126, 87, 194, 92))
`,
  },
  {
    id: 'momentum',
    name: 'Momentum',
    nameFa: 'مومنتوم',
    overlay: false,
    code: `//@version=5
indicator("Momentum", "Mom", overlay = false)
len = input.int(10, "طول", minval = 1)
src = input.source(close, "منبع")
plot(ta.mom(src, len), "Momentum", #2962ff, 2)
hline(0, "", #787b86)
`,
  },
  {
    id: 'roc',
    name: 'Rate of Change',
    nameFa: 'نرخ تغییر (ROC)',
    overlay: false,
    code: `//@version=5
indicator("Rate Of Change", "ROC", overlay = false)
length = input.int(9, "طول", minval = 1)
src    = input.source(close, "منبع")
plot(ta.roc(src, length), "ROC", #2962ff, 2)
hline(0, "", #787b86)
`,
  },
  {
    id: 'awesome',
    name: 'Awesome Oscillator',
    nameFa: 'اسیلاتور شگفت‌انگیز (AO)',
    overlay: false,
    code: `//@version=5
indicator("Awesome Oscillator", "AO", overlay = false)
fast = input.int(5, "سریع", minval = 1)
slow = input.int(34, "کند", minval = 1)
ao = ta.sma(hl2, fast) - ta.sma(hl2, slow)
plot(ao, "AO", ao - ao[1] <= 0 ? #ef5350 : #26a69a, 1, plot.style_columns)
hline(0, "", #787b86)
`,
  },
  {
    id: 'tsi',
    name: 'True Strength Index',
    nameFa: 'شاخص قدرت واقعی (TSI)',
    overlay: false,
    code: `//@version=5
indicator("True Strength Index", "TSI", overlay = false)
longLen   = input.int(25, "طول بلند", minval = 1)
shortLen  = input.int(13, "طول کوتاه", minval = 1)
signalLen = input.int(13, "خط سیگنال", minval = 1)
tsi = 100 * ta.tsi(close, shortLen, longLen)
plot(tsi, "TSI", #2962ff, 2)
plot(ta.ema(tsi, signalLen), "سیگنال", #e91e63)
hline(0, "", #787b86)
`,
  },
  {
    id: 'ultimate',
    name: 'Ultimate Oscillator',
    nameFa: 'اسیلاتور نهایی (UO)',
    overlay: false,
    code: `//@version=5
indicator("Ultimate Oscillator", "UO", overlay = false)
length1 = input.int(7, "طول سریع", minval = 1)
length2 = input.int(14, "طول میانه", minval = 1)
length3 = input.int(28, "طول کند", minval = 1)
average(bp, tr_, length) => math.sum(bp, length) / math.sum(tr_, length)
high_ = math.max(high, close[1])
low_  = math.min(low, close[1])
bp  = close - low_
tr_ = high_ - low_
avg7  = average(bp, tr_, length1)
avg14 = average(bp, tr_, length2)
avg28 = average(bp, tr_, length3)
plot(100 * (4 * avg7 + 2 * avg14 + avg28) / 7, "UO", #f44336, 2)
hline(70, "", #787b86)
hline(30, "", #787b86)
`,
  },
  {
    id: 'fisher',
    name: 'Fisher Transform',
    nameFa: 'تبدیل فیشر',
    overlay: false,
    code: `//@version=5
indicator("Fisher Transform", "Fisher", overlay = false)
len = input.int(9, "طول", minval = 1)
high_ = ta.highest(hl2, len)
low_  = ta.lowest(hl2, len)
round_(val) => val > .99 ? .999 : val < -.99 ? -.999 : val
value = 0.0
value := round_(.66 * ((hl2 - low_) / math.max(high_ - low_, .001) - .5) + .67 * nz(value[1]))
fish1 = 0.0
fish1 := .5 * math.log((1 + value) / (1 - value)) + .5 * nz(fish1[1])
plot(fish1, "Fisher", #2962ff, 2)
plot(fish1[1], "Trigger", #ff6d00)
hline(1.5, "", #787b86)
hline(0.75, "", #787b86)
hline(0, "", #787b86)
hline(-0.75, "", #787b86)
hline(-1.5, "", #787b86)
`,
  },
  {
    id: 'trix',
    name: 'TRIX',
    nameFa: 'تریکس (TRIX)',
    overlay: false,
    code: `//@version=5
indicator("TRIX", overlay = false)
length = input.int(18, "طول", minval = 1)
out = 10000 * ta.change(ta.ema(ta.ema(ta.ema(math.log(close), length), length), length))
plot(out, "TRIX", #f44336, 2)
hline(0, "", #787b86)
`,
  },
  {
    id: 'rsi-divergence',
    name: 'RSI Divergence',
    nameFa: 'واگرایی خودکار RSI',
    overlay: false,
    code: `//@version=5
indicator("RSI Divergence", "RSI Div", overlay = false, max_lines_count = 300)
len        = input.int(14, "طول RSI", minval = 1)
src        = input.source(close, "منبع")
lbL        = input.int(5, "کندل‌های چپ پیوت", minval = 1)
lbR        = input.int(5, "کندل‌های راست پیوت", minval = 1)
rangeLower = input.int(5, "حداقل فاصله‌ی دو پیوت", minval = 1)
rangeUpper = input.int(60, "حداکثر فاصله‌ی دو پیوت", minval = 2)
showHidden = input.bool(true, "واگرایی مخفی")
osc = ta.rsi(src, len)
plot(osc, "RSI", #7e57c2, 2)
hline(70, "", #787b86)
hline(50, "", #787b86)
hline(30, "", #787b86)
pl = ta.pivotlow(osc, lbL, lbR)
ph = ta.pivothigh(osc, lbL, lbR)
var int   loBar = na
var float loOsc = na
var float loPrice = na
var int   hiBar = na
var float hiOsc = na
var float hiPrice = na
bull = false
hiddenBull = false
bear = false
hiddenBear = false
if not na(pl)
    b = bar_index - lbR
    o = osc[lbR]
    p = low[lbR]
    if not na(loBar) and b - loBar >= rangeLower and b - loBar <= rangeUpper
        if o > loOsc and p < loPrice
            bull := true
            line.new(loBar, loOsc, b, o, color = #26a69a, width = 2)
        else if showHidden and o < loOsc and p > loPrice
            hiddenBull := true
            line.new(loBar, loOsc, b, o, color = #26a69a, width = 1, style = line.style_dashed)
    loBar := b
    loOsc := o
    loPrice := p
if not na(ph)
    b = bar_index - lbR
    o = osc[lbR]
    p = high[lbR]
    if not na(hiBar) and b - hiBar >= rangeLower and b - hiBar <= rangeUpper
        if o < hiOsc and p > hiPrice
            bear := true
            line.new(hiBar, hiOsc, b, o, color = #ef5350, width = 2)
        else if showHidden and o > hiOsc and p < hiPrice
            hiddenBear := true
            line.new(hiBar, hiOsc, b, o, color = #ef5350, width = 1, style = line.style_dashed)
    hiBar := b
    hiOsc := o
    hiPrice := p
plotshape(bull, "واگرایی مثبت", shape.labelup, location.belowbar, #26a69a, offset = -lbR, text = "Bull", textcolor = color.white, size = size.tiny)
plotshape(hiddenBull, "واگرایی مثبت مخفی", shape.labelup, location.belowbar, color.new(#26a69a, 40), offset = -lbR, text = "H Bull", textcolor = color.white, size = size.tiny)
plotshape(bear, "واگرایی منفی", shape.labeldown, location.abovebar, #ef5350, offset = -lbR, text = "Bear", textcolor = color.white, size = size.tiny)
plotshape(hiddenBear, "واگرایی منفی مخفی", shape.labeldown, location.abovebar, color.new(#ef5350, 40), offset = -lbR, text = "H Bear", textcolor = color.white, size = size.tiny)
`,
  },
  {
    id: 'macd-divergence',
    name: 'MACD Divergence',
    nameFa: 'واگرایی خودکار MACD',
    overlay: false,
    code: `//@version=5
indicator("MACD Divergence", "MACD Div", overlay = false, max_lines_count = 300)
fast   = input.int(12, "میانگین سریع", minval = 1)
slow   = input.int(26, "میانگین کند", minval = 1)
sig    = input.int(9, "خط سیگنال", minval = 1)
lbL    = input.int(5, "کندل‌های چپ پیوت", minval = 1)
lbR    = input.int(5, "کندل‌های راست پیوت", minval = 1)
rangeUpper = input.int(60, "حداکثر فاصله‌ی دو پیوت", minval = 2)
showHidden = input.bool(false, "واگرایی مخفی")
[m, s, h] = ta.macd(close, fast, slow, sig)
plot(h, "هیستوگرام", h >= 0 ? color.new(#26a69a, 40) : color.new(#ef5350, 40), 1, plot.style_columns)
plot(m, "MACD", #2962ff, 2)
plot(s, "سیگنال", #ff6d00)
hline(0, "", #787b86)
pl = ta.pivotlow(m, lbL, lbR)
ph = ta.pivothigh(m, lbL, lbR)
var int   loBar = na
var float loOsc = na
var float loPrice = na
var int   hiBar = na
var float hiOsc = na
var float hiPrice = na
bull = false
bear = false
if not na(pl)
    b = bar_index - lbR
    o = m[lbR]
    p = low[lbR]
    if not na(loBar) and b - loBar <= rangeUpper
        if o > loOsc and p < loPrice
            bull := true
            line.new(loBar, loOsc, b, o, color = #26a69a, width = 2)
        else if showHidden and o < loOsc and p > loPrice
            line.new(loBar, loOsc, b, o, color = #26a69a, style = line.style_dashed)
    loBar := b
    loOsc := o
    loPrice := p
if not na(ph)
    b = bar_index - lbR
    o = m[lbR]
    p = high[lbR]
    if not na(hiBar) and b - hiBar <= rangeUpper
        if o < hiOsc and p > hiPrice
            bear := true
            line.new(hiBar, hiOsc, b, o, color = #ef5350, width = 2)
        else if showHidden and o > hiOsc and p < hiPrice
            line.new(hiBar, hiOsc, b, o, color = #ef5350, style = line.style_dashed)
    hiBar := b
    hiOsc := o
    hiPrice := p
plotshape(bull, "واگرایی مثبت", shape.labelup, location.belowbar, #26a69a, offset = -lbR, text = "Bull", textcolor = color.white, size = size.tiny)
plotshape(bear, "واگرایی منفی", shape.labeldown, location.abovebar, #ef5350, offset = -lbR, text = "Bear", textcolor = color.white, size = size.tiny)
`,
  },
];

export const VOLATILITY: LibraryIndicator[] = [
  {
    id: 'squeeze',
    name: 'Squeeze Momentum',
    nameFa: 'اسکوییز مومنتوم (LazyBear)',
    overlay: false,
    code: `//@version=5
indicator("Squeeze Momentum", "SQZMOM", overlay = false)
length   = input.int(20, "طول بولینگر", minval = 1)
mult     = input.float(2.0, "ضریب بولینگر", step = 0.1)
lengthKC = input.int(20, "طول کلتنر", minval = 1)
multKC   = input.float(1.5, "ضریب کلتنر", step = 0.1)
source = close
basis = ta.sma(source, length)
dev = mult * ta.stdev(source, length)
upperBB = basis + dev
lowerBB = basis - dev
ma = ta.sma(source, lengthKC)
rangema = ta.sma(ta.tr, lengthKC)
upperKC = ma + rangema * multKC
lowerKC = ma - rangema * multKC
sqzOn  = lowerBB > lowerKC and upperBB < upperKC
sqzOff = lowerBB < lowerKC and upperBB > upperKC
noSqz  = not sqzOn and not sqzOff
val = ta.linreg(source - math.avg(math.avg(ta.highest(high, lengthKC), ta.lowest(low, lengthKC)), ta.sma(close, lengthKC)), lengthKC, 0)
bcolor = val > 0 ? (val > nz(val[1]) ? #00e676 : #26a69a) : (val < nz(val[1]) ? #ff5252 : #b71c1c)
scolor = noSqz ? #2962ff : sqzOn ? #ff9800 : #787b86
plot(val, "مومنتوم", bcolor, 4, plot.style_histogram)
plot(0, "فشردگی", scolor, 2, plot.style_cross)
`,
  },
  {
    id: 'bb-percent',
    name: 'Bollinger Bands %B',
    nameFa: 'بولینگر %B',
    overlay: false,
    code: `//@version=5
indicator("Bollinger Bands %B", "%B", overlay = false)
length = input.int(20, "طول", minval = 1)
mult   = input.float(2.0, "انحراف معیار", step = 0.1)
src    = input.source(close, "منبع")
[basis, upper, lower] = ta.bb(src, length, mult)
plot((src - lower) / (upper - lower), "%B", #26a69a, 2)
b1 = hline(1, "", #787b86)
hline(0.5, "", #787b86)
b0 = hline(0, "", #787b86)
fill(b1, b0, color.rgb(38, 166, 154, 92))
`,
  },
  {
    id: 'bb-width',
    name: 'Bollinger Bandwidth',
    nameFa: 'پهنای باند بولینگر',
    overlay: false,
    code: `//@version=5
indicator("Bollinger BandWidth", "BBW", overlay = false)
length = input.int(20, "طول", minval = 1)
mult   = input.float(2.0, "انحراف معیار", step = 0.1)
src    = input.source(close, "منبع")
[basis, upper, lower] = ta.bb(src, length, mult)
bbw = (upper - lower) / basis * 100
plot(bbw, "پهنای باند (٪)", #2962ff, 2)
plot(ta.lowest(bbw, 125), "کمترین پهنا (۱۲۵ کندل)", #ef5350)
`,
  },
  {
    id: 'chandelier',
    name: 'Chandelier Exit',
    nameFa: 'خروج شمعدانی (Chandelier Exit)',
    overlay: true,
    code: `//@version=5
indicator("Chandelier Exit", "CE", overlay = true)
length   = input.int(22, "طول ATR", minval = 1)
mult     = input.float(3.0, "ضریب ATR", step = 0.1)
useClose = input.bool(true, "سقف و کف از قیمت بسته شدن")
atr = mult * ta.atr(length)
longStop = (useClose ? ta.highest(close, length) : ta.highest(length)) - atr
longStopPrev = nz(longStop[1], longStop)
longStop := close[1] > longStopPrev ? math.max(longStop, longStopPrev) : longStop
shortStop = (useClose ? ta.lowest(close, length) : ta.lowest(length)) + atr
shortStopPrev = nz(shortStop[1], shortStop)
shortStop := close[1] < shortStopPrev ? math.min(shortStop, shortStopPrev) : shortStop
var int dir = 1
dir := close > shortStopPrev ? 1 : close < longStopPrev ? -1 : dir
plot(dir == 1 ? longStop : na, "حد ضرر خرید", #26a69a, 2, plot.style_linebr)
plot(dir == 1 ? na : shortStop, "حد ضرر فروش", #ef5350, 2, plot.style_linebr)
plotshape(dir == 1 and dir[1] == -1 ? longStop : na, "سیگنال خرید", shape.circle, location.absolute, #26a69a, size = size.tiny)
plotshape(dir == -1 and dir[1] == 1 ? shortStop : na, "سیگنال فروش", shape.circle, location.absolute, #ef5350, size = size.tiny)
`,
  },
  {
    id: 'adr',
    name: 'Average Daily Range',
    nameFa: 'میانگین دامنه‌ی روزانه (ADR)',
    overlay: true,
    code: `//@version=5
indicator("Average Daily Range", "ADR", overlay = true)
len = input.int(14, "تعداد روز", minval = 1)
showOpen = input.bool(true, "خط باز شدن روز")
var float dayHigh = na
var float dayLow = na
var float dayOpen = na
var ranges = array.new_float()
newDay = timeframe.change("D")
if newDay
    if not na(dayHigh)
        array.push(ranges, dayHigh - dayLow)
        if array.size(ranges) > len
            array.shift(ranges)
    dayHigh := high
    dayLow := low
    dayOpen := open
else
    dayHigh := math.max(nz(dayHigh, high), high)
    dayLow := math.min(nz(dayLow, low), low)
adr = array.size(ranges) > 0 ? array.avg(ranges) : na
plot(newDay ? na : dayLow + adr, "سقف ADR", #ef5350, 1, plot.style_linebr)
plot(newDay ? na : dayHigh - adr, "کف ADR", #26a69a, 1, plot.style_linebr)
plot(showOpen and not newDay ? dayOpen : na, "باز شدن روز", #787b86, 1, plot.style_linebr)
if barstate.islast and not na(adr)
    used = (dayHigh - dayLow) / adr * 100
    label.new(bar_index, dayHigh, "ADR " + str.tostring(adr, format.mintick) + " · " + str.tostring(used, "#") + "%", style = label.style_label_down, color = color.new(#2962ff, 100), textcolor = #2962ff, size = size.small)
`,
  },
  {
    id: 'atr-bands',
    name: 'ATR Bands',
    nameFa: 'باندهای ATR',
    overlay: true,
    code: `//@version=5
indicator("ATR Bands", overlay = true)
len  = input.int(14, "طول ATR", minval = 1)
mult = input.float(1.5, "ضریب", step = 0.1)
src  = input.source(close, "مبنا")
atr = ta.atr(len)
u = plot(src + atr * mult, "بالا", #ef5350)
d = plot(src - atr * mult, "پایین", #26a69a)
fill(u, d, color.rgb(120, 123, 134, 93))
`,
  },
  {
    id: 'hv',
    name: 'Historical Volatility',
    nameFa: 'نوسان تاریخی (HV)',
    overlay: false,
    code: `//@version=5
indicator("Historical Volatility", "HV", overlay = false)
length = input.int(10, "طول", minval = 2)
annual = 365
per = timeframe.isintraday or timeframe.isdaily and timeframe.multiplier == 1 ? 1 : 7
hv = 100 * ta.stdev(math.log(close / close[1]), length) * math.sqrt(annual / per)
plot(hv, "HV", #2962ff, 2)
`,
  },
  {
    id: 'stdev',
    name: 'Standard Deviation',
    nameFa: 'انحراف معیار',
    overlay: false,
    code: `//@version=5
indicator("Standard Deviation", "StdDev", overlay = false)
length = input.int(20, "طول", minval = 1)
src    = input.source(close, "منبع")
plot(ta.stdev(src, length), "StdDev", #2962ff, 2)
`,
  },
];
