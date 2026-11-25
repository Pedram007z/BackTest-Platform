import type { LibraryIndicator } from './types';

/** Price levels and structure, and the Smart Money / ICT tools, of the built-in library. */

export const LEVELS: LibraryIndicator[] = [
  {
    id: 'pivots',
    name: 'Pivot Points Standard',
    nameFa: 'پیوت پوینت (کلاسیک، فیبوناچی، وودی، کاماریلا)',
    overlay: true,
    code: `//@version=5
indicator("Pivot Points", "Pivots", overlay = true)
kind = input.string("Traditional", "نوع", options = ["Traditional", "Fibonacci", "Woodie", "Camarilla"])
tf   = input.string("D", "دوره", options = ["D", "W", "M"])
showLabels = input.bool(true, "برچسب سطوح")
var float ph = na
var float pl = na
var float pc = na
var float po = na
var float curH = na
var float curL = na
newP = timeframe.change(tf)
if newP
    ph := curH
    pl := curL
    pc := close[1]
    po := open
    curH := high
    curL := low
else
    curH := math.max(nz(curH, high), high)
    curL := math.min(nz(curL, low), low)
r = ph - pl
p = kind == "Woodie" ? (ph + pl + 2 * po) / 4 : (ph + pl + pc) / 3
float r1 = na
float r2 = na
float r3 = na
float s1 = na
float s2 = na
float s3 = na
if kind == "Fibonacci"
    r1 := p + 0.382 * r
    r2 := p + 0.618 * r
    r3 := p + r
    s1 := p - 0.382 * r
    s2 := p - 0.618 * r
    s3 := p - r
else if kind == "Camarilla"
    r1 := pc + r * 1.1 / 12
    r2 := pc + r * 1.1 / 6
    r3 := pc + r * 1.1 / 4
    s1 := pc - r * 1.1 / 12
    s2 := pc - r * 1.1 / 6
    s3 := pc - r * 1.1 / 4
else
    r1 := 2 * p - pl
    s1 := 2 * p - ph
    r2 := p + r
    s2 := p - r
    r3 := ph + 2 * (p - pl)
    s3 := pl - 2 * (ph - p)
lv(x) => newP ? na : x
plot(lv(p), "P", #ff9800, 2, plot.style_linebr)
plot(lv(r1), "R1", #ef5350, 1, plot.style_linebr)
plot(lv(r2), "R2", #ef5350, 1, plot.style_linebr)
plot(lv(r3), "R3", #ef5350, 1, plot.style_linebr)
plot(lv(s1), "S1", #26a69a, 1, plot.style_linebr)
plot(lv(s2), "S2", #26a69a, 1, plot.style_linebr)
plot(lv(s3), "S3", #26a69a, 1, plot.style_linebr)
if barstate.islast and showLabels and not na(p)
    label.new(bar_index, p, "P", style = label.style_label_left, color = color.new(#ff9800, 100), textcolor = #ff9800, size = size.small)
    label.new(bar_index, r1, "R1", style = label.style_label_left, color = color.new(#ef5350, 100), textcolor = #ef5350, size = size.small)
    label.new(bar_index, r2, "R2", style = label.style_label_left, color = color.new(#ef5350, 100), textcolor = #ef5350, size = size.small)
    label.new(bar_index, r3, "R3", style = label.style_label_left, color = color.new(#ef5350, 100), textcolor = #ef5350, size = size.small)
    label.new(bar_index, s1, "S1", style = label.style_label_left, color = color.new(#26a69a, 100), textcolor = #26a69a, size = size.small)
    label.new(bar_index, s2, "S2", style = label.style_label_left, color = color.new(#26a69a, 100), textcolor = #26a69a, size = size.small)
    label.new(bar_index, s3, "S3", style = label.style_label_left, color = color.new(#26a69a, 100), textcolor = #26a69a, size = size.small)
`,
  },
  {
    id: 'prev-high-low',
    name: 'Previous Day / Week / Month High & Low',
    nameFa: 'سقف و کف روز، هفته و ماه قبل (PDH/PDL)',
    overlay: true,
    code: `//@version=5
indicator("Previous High / Low", "PDH/PDL", overlay = true)
showD = input.bool(true, "روز قبل")
showW = input.bool(true, "هفته‌ی قبل")
showM = input.bool(false, "ماه قبل")
period(tf) =>
    var float h = na
    var float l = na
    var float ph = na
    var float pl = na
    if timeframe.change(tf)
        ph := h
        pl := l
        h := high
        l := low
    else
        h := math.max(nz(h, high), high)
        l := math.min(nz(l, low), low)
    [ph, pl]
[dh, dl] = period("D")
[wh, wl] = period("W")
[mh, ml] = period("M")
plot(showD and not timeframe.change("D") ? dh : na, "PDH", #ef5350, 1, plot.style_linebr)
plot(showD and not timeframe.change("D") ? dl : na, "PDL", #26a69a, 1, plot.style_linebr)
plot(showW and not timeframe.change("W") ? wh : na, "PWH", #ff5252, 2, plot.style_linebr)
plot(showW and not timeframe.change("W") ? wl : na, "PWL", #00e676, 2, plot.style_linebr)
plot(showM and not timeframe.change("M") ? mh : na, "PMH", #b71c1c, 2, plot.style_linebr)
plot(showM and not timeframe.change("M") ? ml : na, "PML", #1b5e20, 2, plot.style_linebr)
`,
  },
  {
    id: 'opens',
    name: 'Daily / Weekly / Midnight Open',
    nameFa: 'خط باز شدن روز، هفته و نیمه‌شب نیویورک',
    overlay: true,
    code: `//@version=5
indicator("Opens", overlay = true)
showD  = input.bool(true, "باز شدن روز")
showW  = input.bool(true, "باز شدن هفته")
showM  = input.bool(false, "باز شدن ماه")
showNY = input.bool(true, "باز شدن نیمه‌شب نیویورک")
openOf(tf) =>
    var float o = na
    if timeframe.change(tf)
        o := open
    o
dOpen = openOf("D")
wOpen = openOf("W")
mOpen = openOf("M")
nyDay = dayofmonth(time, "America/New_York")
var float nyOpen = na
if nyDay != nyDay[1]
    nyOpen := open
plot(showD and not timeframe.change("D") ? dOpen : na, "باز شدن روز", #ff9800, 1, plot.style_linebr)
plot(showW and not timeframe.change("W") ? wOpen : na, "باز شدن هفته", #2962ff, 2, plot.style_linebr)
plot(showM and not timeframe.change("M") ? mOpen : na, "باز شدن ماه", #7e57c2, 2, plot.style_linebr)
plot(showNY and nyDay == nyDay[1] ? nyOpen : na, "نیمه‌شب نیویورک", #00bcd4, 1, plot.style_linebr)
`,
  },
  {
    id: 'zigzag',
    name: 'ZigZag',
    nameFa: 'زیگزاگ',
    overlay: true,
    code: `//@version=5
indicator("ZigZag", overlay = true, max_lines_count = 500, max_labels_count = 500)
depth      = input.int(10, "عمق (کندل)", minval = 2)
showLabels = input.bool(true, "برچسب HH / HL / LH / LL")
col        = input.color(#2962ff, "رنگ")
ph = ta.pivothigh(depth, depth)
pl = ta.pivotlow(depth, depth)
var int lastDir = 0
var int lastBar = na
var float lastPrice = na
var line lastLine = na
var label lastLabel = na
var float prevHigh = na
var float prevLow = na
if not na(ph)
    b = bar_index - depth
    if lastDir == 1
        if ph > lastPrice
            lastBar := b
            lastPrice := ph
            if not na(lastLine)
                line.set_xy2(lastLine, b, ph)
            if not na(lastLabel)
                label.set_xy(lastLabel, b, ph)
                label.set_text(lastLabel, na(prevHigh) ? "H" : ph > prevHigh ? "HH" : "LH")
    else
        if not na(lastBar)
            lastLine := line.new(lastBar, lastPrice, b, ph, color = col, width = 2)
        if showLabels
            lastLabel := label.new(b, ph, na(prevHigh) ? "H" : ph > prevHigh ? "HH" : "LH", style = label.style_label_down, color = color.new(col, 100), textcolor = #ef5350, size = size.small)
        if lastDir == -1
            prevLow := lastPrice
        lastBar := b
        lastPrice := ph
        lastDir := 1
if not na(pl)
    b = bar_index - depth
    if lastDir == -1
        if pl < lastPrice
            lastBar := b
            lastPrice := pl
            if not na(lastLine)
                line.set_xy2(lastLine, b, pl)
            if not na(lastLabel)
                label.set_xy(lastLabel, b, pl)
                label.set_text(lastLabel, na(prevLow) ? "L" : pl < prevLow ? "LL" : "HL")
    else
        if not na(lastBar)
            lastLine := line.new(lastBar, lastPrice, b, pl, color = col, width = 2)
        if showLabels
            lastLabel := label.new(b, pl, na(prevLow) ? "L" : pl < prevLow ? "LL" : "HL", style = label.style_label_up, color = color.new(col, 100), textcolor = #26a69a, size = size.small)
        if lastDir == 1
            prevHigh := lastPrice
        lastBar := b
        lastPrice := pl
        lastDir := -1
`,
  },
  {
    id: 'fractals',
    name: 'Williams Fractals',
    nameFa: 'فرکتال ویلیامز',
    overlay: true,
    code: `//@version=5
indicator("Williams Fractals", "Fractals", overlay = true)
n = input.int(2, "کندل‌های دو طرف", minval = 1)
up = ta.pivothigh(n, n)
dn = ta.pivotlow(n, n)
plotshape(not na(up), "فرکتال بالا", shape.triangledown, location.abovebar, #ef5350, offset = -n, size = size.tiny)
plotshape(not na(dn), "فرکتال پایین", shape.triangleup, location.belowbar, #26a69a, offset = -n, size = size.tiny)
`,
  },
  {
    id: 'support-resistance',
    name: 'Support & Resistance',
    nameFa: 'حمایت و مقاومت خودکار',
    overlay: true,
    code: `//@version=5
indicator("Support / Resistance", "S/R", overlay = true, max_lines_count = 100, max_labels_count = 100)
lb    = input.int(10, "قدرت پیوت (کندل)", minval = 2)
count = input.int(5, "تعداد سطوح هر طرف", minval = 1, maxval = 20)
tol   = input.float(0.3, "ادغام سطوح نزدیک (ضریب ATR)", step = 0.05)
ph = ta.pivothigh(lb, lb)
pl = ta.pivotlow(lb, lb)
atr = ta.atr(14)
var levels = array.new_float()
var bars = array.new_int()
var touches = array.new_int()
add(price, b) =>
    merged = false
    if array.size(levels) > 0
        for i = 0 to array.size(levels) - 1
            if math.abs(array.get(levels, i) - price) <= tol * nz(atr, 0)
                array.set(touches, i, array.get(touches, i) + 1)
                merged := true
                break
    if not merged
        array.push(levels, price)
        array.push(bars, b)
        array.push(touches, 1)
        if array.size(levels) > count * 4
            array.shift(levels)
            array.shift(bars)
            array.shift(touches)
if not na(ph)
    add(ph, bar_index - lb)
if not na(pl)
    add(pl, bar_index - lb)
if barstate.islast and array.size(levels) > 0
    above = 0
    below = 0
    for i = array.size(levels) - 1 to 0
        lvl = array.get(levels, i)
        isRes = lvl > close
        if (isRes and above < count) or (not isRes and below < count)
            t = array.get(touches, i)
            line.new(array.get(bars, i), lvl, bar_index, lvl, extend = extend.right, color = isRes ? color.new(#ef5350, 30) : color.new(#26a69a, 30), width = t > 1 ? 2 : 1)
            label.new(bar_index, lvl, (isRes ? "R" : "S") + (t > 1 ? " ×" + str.tostring(t) : ""), style = label.style_label_left, color = color.new(#000000, 100), textcolor = isRes ? #ef5350 : #26a69a, size = size.small)
            if isRes
                above += 1
            else
                below += 1
`,
  },
  {
    id: 'auto-fib',
    name: 'Auto Fibonacci Retracement',
    nameFa: 'فیبوناچی خودکار',
    overlay: true,
    code: `//@version=5
indicator("Auto Fib Retracement", "Auto Fib", overlay = true, max_lines_count = 20, max_labels_count = 20)
lookback = input.int(100, "بازه‌ی جست‌وجو (کندل)", minval = 5)
showExt  = input.bool(false, "سطوح گسترش (۱٫۲۷۲ و ۱٫۶۱۸)")
hh = ta.highest(high, lookback)
ll = ta.lowest(low, lookback)
hb = ta.highestbars(high, lookback)
lb = ta.lowestbars(low, lookback)
fibLine(lvl, from, up, col) =>
    price = up ? hh - (hh - ll) * lvl : ll + (hh - ll) * lvl
    line.new(from, price, bar_index, price, extend = extend.right, color = col)
    label.new(bar_index, price, str.tostring(lvl) + " (" + str.tostring(price, format.mintick) + ")", style = label.style_label_left, color = color.new(#000000, 100), textcolor = col, size = size.small)
if barstate.islast and not na(hh)
    up = hb > lb
    from = bar_index + math.min(hb, lb)
    fibLine(0, from, up, #787b86)
    fibLine(0.236, from, up, #ef5350)
    fibLine(0.382, from, up, #ff9800)
    fibLine(0.5, from, up, #4caf50)
    fibLine(0.618, from, up, #26a69a)
    fibLine(0.786, from, up, #2962ff)
    fibLine(1, from, up, #787b86)
    if showExt
        fibLine(1.272, from, up, #9c27b0)
        fibLine(1.618, from, up, #e91e63)
`,
  },
  {
    id: 'round-numbers',
    name: 'Round Numbers',
    nameFa: 'اعداد رند (سطوح ۰۰ و ۵۰)',
    overlay: true,
    code: `//@version=5
indicator("Round Numbers", overlay = true, max_lines_count = 100)
mult  = input.float(1.0, "ضریب فاصله‌ی سطوح", step = 0.5)
count = input.int(8, "تعداد خطوط هر طرف", minval = 1, maxval = 40)
if barstate.islast
    mag = math.pow(10, math.floor(math.log10(close)))
    step = mag * 0.005 * mult
    base = math.floor(close / step) * step
    for i = -count to count
        lvl = base + i * step
        major = math.abs(lvl / (2 * step) - math.round(lvl / (2 * step))) < 0.001
        line.new(bar_index - 1, lvl, bar_index, lvl, extend = extend.both, color = major ? color.new(#787b86, 35) : color.new(#787b86, 70), style = major ? line.style_solid : line.style_dotted)
`,
  },
  {
    id: 'separators',
    name: 'Period Separators',
    nameFa: 'جداکننده‌ی روز، هفته و ماه',
    overlay: true,
    code: `//@version=5
indicator("Period Separators", "Separators", overlay = true, max_lines_count = 500)
tf  = input.string("D", "دوره", options = ["D", "W", "M"])
col = input.color(color.new(#787b86, 40), "رنگ")
if timeframe.change(tf)
    line.new(bar_index, low, bar_index, high, extend = extend.both, color = col, style = line.style_dashed)
`,
  },
];

export const SMC: LibraryIndicator[] = [
  {
    id: 'fvg',
    name: 'Fair Value Gap',
    nameFa: 'شکاف ارزش منصفانه (FVG)',
    overlay: true,
    code: `//@version=5
indicator("Fair Value Gap", "FVG", overlay = true, max_boxes_count = 500)
showBull = input.bool(true, "FVG صعودی")
showBear = input.bool(true, "FVG نزولی")
minSize  = input.float(0.0, "حداقل اندازه (ضریب ATR)", step = 0.1)
extendOpen = input.bool(true, "ادامه تا پر شدن")
maxKeep  = input.int(30, "حداکثر تعداد روی چارت", minval = 1, maxval = 200)
bullCol  = input.color(color.new(#26a69a, 75), "رنگ صعودی")
bearCol  = input.color(color.new(#ef5350, 75), "رنگ نزولی")
atr = ta.atr(14)
var boxes = array.new_box()
var kinds = array.new_int()
if showBull and low > high[2] and low - high[2] >= minSize * nz(atr, 0)
    array.push(boxes, box.new(bar_index - 2, low, bar_index, high[2], border_color = na, bgcolor = bullCol))
    array.push(kinds, 1)
if showBear and high < low[2] and low[2] - high >= minSize * nz(atr, 0)
    array.push(boxes, box.new(bar_index - 2, low[2], bar_index, high, border_color = na, bgcolor = bearCol))
    array.push(kinds, -1)
if array.size(boxes) > 0
    for i = array.size(boxes) - 1 to 0
        b = array.get(boxes, i)
        k = array.get(kinds, i)
        filled = k == 1 ? low <= box.get_bottom(b) : high >= box.get_top(b)
        if filled
            box.delete(b)
            array.remove(boxes, i)
            array.remove(kinds, i)
        else if extendOpen
            box.set_right(b, bar_index)
while array.size(boxes) > maxKeep
    box.delete(array.shift(boxes))
    array.shift(kinds)
`,
  },
  {
    id: 'order-blocks',
    name: 'Order Blocks',
    nameFa: 'اوردر بلاک',
    overlay: true,
    code: `//@version=5
indicator("Order Blocks", "OB", overlay = true, max_boxes_count = 500)
swingLen = input.int(10, "طول سوینگ", minval = 2)
maxKeep  = input.int(8, "حداکثر تعداد هر نوع", minval = 1, maxval = 50)
bullCol  = input.color(color.new(#26a69a, 75), "رنگ صعودی")
bearCol  = input.color(color.new(#ef5350, 75), "رنگ نزولی")
ph = ta.pivothigh(swingLen, swingLen)
pl = ta.pivotlow(swingLen, swingLen)
var float hiLvl = na
var int hiBar = na
var bool hiBroken = true
var float loLvl = na
var int loBar = na
var bool loBroken = true
if not na(ph)
    hiLvl := ph
    hiBar := bar_index - swingLen
    hiBroken := false
if not na(pl)
    loLvl := pl
    loBar := bar_index - swingLen
    loBroken := false
var bulls = array.new_box()
var bears = array.new_box()
// bullish: price closes above the last swing high; the block is the last down candle before the move up from its low
if not hiBroken and close > hiLvl
    hiBroken := true
    back = math.min(bar_index - hiBar, 300)
    lowest = 1
    for i = 1 to back
        if low[i] < low[lowest]
            lowest := i
    ob = -1
    for i = lowest to math.min(lowest + 10, 300)
        if close[i] < open[i]
            ob := i
            break
    if ob > 0
        array.push(bulls, box.new(bar_index - ob, high[ob], bar_index, low[ob], border_color = color.new(bullCol, 30), bgcolor = bullCol))
if not loBroken and close < loLvl
    loBroken := true
    back = math.min(bar_index - loBar, 300)
    highest = 1
    for i = 1 to back
        if high[i] > high[highest]
            highest := i
    ob = -1
    for i = highest to math.min(highest + 10, 300)
        if close[i] > open[i]
            ob := i
            break
    if ob > 0
        array.push(bears, box.new(bar_index - ob, high[ob], bar_index, low[ob], border_color = color.new(bearCol, 30), bgcolor = bearCol))
// a block closed through is no longer valid; the rest reach the current candle
if array.size(bulls) > 0
    for i = array.size(bulls) - 1 to 0
        b = array.get(bulls, i)
        if close < box.get_bottom(b)
            box.delete(b)
            array.remove(bulls, i)
        else
            box.set_right(b, bar_index)
if array.size(bears) > 0
    for i = array.size(bears) - 1 to 0
        b = array.get(bears, i)
        if close > box.get_top(b)
            box.delete(b)
            array.remove(bears, i)
        else
            box.set_right(b, bar_index)
while array.size(bulls) > maxKeep
    box.delete(array.shift(bulls))
while array.size(bears) > maxKeep
    box.delete(array.shift(bears))
`,
  },
  {
    id: 'market-structure',
    name: 'Market Structure (BOS / CHoCH)',
    nameFa: 'ساختار بازار (BOS و CHoCH)',
    overlay: true,
    code: `//@version=5
indicator("Market Structure", "BOS/CHoCH", overlay = true, max_lines_count = 500, max_labels_count = 500)
len     = input.int(5, "طول سوینگ", minval = 1)
bullCol = input.color(#26a69a, "رنگ صعودی")
bearCol = input.color(#ef5350, "رنگ نزولی")
ph = ta.pivothigh(len, len)
pl = ta.pivotlow(len, len)
var float hiLvl = na
var int hiBar = na
var bool hiDone = true
var float loLvl = na
var int loBar = na
var bool loDone = true
var int trend = 0
if not na(ph)
    hiLvl := ph
    hiBar := bar_index - len
    hiDone := false
if not na(pl)
    loLvl := pl
    loBar := bar_index - len
    loDone := false
if not hiDone and close > hiLvl
    choch = trend == -1
    line.new(hiBar, hiLvl, bar_index, hiLvl, color = bullCol, style = choch ? line.style_dashed : line.style_solid)
    label.new(math.round((hiBar + bar_index) / 2), hiLvl, choch ? "CHoCH" : "BOS", style = label.style_label_down, color = color.new(bullCol, 100), textcolor = bullCol, size = size.small)
    trend := 1
    hiDone := true
if not loDone and close < loLvl
    choch = trend == 1
    line.new(loBar, loLvl, bar_index, loLvl, color = bearCol, style = choch ? line.style_dashed : line.style_solid)
    label.new(math.round((loBar + bar_index) / 2), loLvl, choch ? "CHoCH" : "BOS", style = label.style_label_up, color = color.new(bearCol, 100), textcolor = bearCol, size = size.small)
    trend := -1
    loDone := true
`,
  },
  {
    id: 'liquidity',
    name: 'Liquidity (Equal Highs / Lows)',
    nameFa: 'نقدینگی (سقف و کف‌های برابر)',
    overlay: true,
    code: `//@version=5
indicator("Equal Highs / Lows", "EQH/EQL", overlay = true, max_lines_count = 200, max_labels_count = 200)
len = input.int(5, "طول پیوت", minval = 1)
tol = input.float(0.1, "تلورانس (ضریب ATR)", step = 0.05)
atr = ta.atr(14)
ph = ta.pivothigh(len, len)
pl = ta.pivotlow(len, len)
var float lastPh = na
var int lastPhBar = na
var float lastPl = na
var int lastPlBar = na
if not na(ph)
    b = bar_index - len
    if not na(lastPh) and math.abs(ph - lastPh) <= tol * nz(atr, 0)
        line.new(lastPhBar, lastPh, b, ph, color = #ef5350, style = line.style_dotted, width = 2)
        label.new(b, math.max(ph, lastPh), "EQH", style = label.style_label_down, color = color.new(#ef5350, 100), textcolor = #ef5350, size = size.small)
    lastPh := ph
    lastPhBar := b
if not na(pl)
    b = bar_index - len
    if not na(lastPl) and math.abs(pl - lastPl) <= tol * nz(atr, 0)
        line.new(lastPlBar, lastPl, b, pl, color = #26a69a, style = line.style_dotted, width = 2)
        label.new(b, math.min(pl, lastPl), "EQL", style = label.style_label_up, color = color.new(#26a69a, 100), textcolor = #26a69a, size = size.small)
    lastPl := pl
    lastPlBar := b
`,
  },
  {
    id: 'premium-discount',
    name: 'Premium / Discount Zones',
    nameFa: 'نواحی پریمیوم و دیسکانت',
    overlay: true,
    code: `//@version=5
indicator("Premium / Discount", "P/D", overlay = true, max_boxes_count = 10)
lookback = input.int(50, "بازه‌ی رنج (کندل)", minval = 5)
hh = ta.highest(high, lookback)
ll = ta.lowest(low, lookback)
hb = ta.highestbars(high, lookback)
lb = ta.lowestbars(low, lookback)
if barstate.islast and not na(hh)
    left = bar_index + math.min(hb, lb)
    right = bar_index + 10
    mid = (hh + ll) / 2
    eq = (hh - ll) * 0.025
    box.new(left, hh, right, mid + eq, border_color = na, bgcolor = color.new(#ef5350, 85), text = "Premium", text_color = #ef5350, text_size = size.small)
    box.new(left, mid + eq, right, mid - eq, border_color = na, bgcolor = color.new(#787b86, 80), text = "Equilibrium", text_color = #787b86, text_size = size.small)
    box.new(left, mid - eq, right, ll, border_color = na, bgcolor = color.new(#26a69a, 85), text = "Discount", text_color = #26a69a, text_size = size.small)
`,
  },
  {
    id: 'killzones',
    name: 'ICT Killzones',
    nameFa: 'کیل‌زون‌های ICT',
    overlay: true,
    code: `//@version=5
indicator("ICT Killzones", "Killzones", overlay = true, max_boxes_count = 500)
tz = "America/New_York"
showAsia   = input.bool(true, "آسیا", group = "کیل‌زون‌ها (ساعت نیویورک)")
asiaSess   = input.session("2000-0000", "ساعت آسیا", group = "کیل‌زون‌ها (ساعت نیویورک)")
showLondon = input.bool(true, "لندن", group = "کیل‌زون‌ها (ساعت نیویورک)")
londonSess = input.session("0200-0500", "ساعت لندن", group = "کیل‌زون‌ها (ساعت نیویورک)")
showNY     = input.bool(true, "نیویورک صبح", group = "کیل‌زون‌ها (ساعت نیویورک)")
nySess     = input.session("0700-1000", "ساعت نیویورک", group = "کیل‌زون‌ها (ساعت نیویورک)")
showLC     = input.bool(false, "بسته شدن لندن", group = "کیل‌زون‌ها (ساعت نیویورک)")
lcSess     = input.session("1000-1200", "ساعت بسته شدن لندن", group = "کیل‌زون‌ها (ساعت نیویورک)")
showSB     = input.bool(true, "سیلور بولت‌ها (۰۳–۰۴، ۱۰–۱۱، ۱۴–۱۵)", group = "کیل‌زون‌ها (ساعت نیویورک)")
zone(on, sess, col, name) =>
    var box bx = na
    var float hi = na
    var float lo = na
    inS = on and not na(time(timeframe.period, sess, tz))
    wasIn = nz(inS[1], false)
    if inS and not wasIn
        hi := high
        lo := low
        bx := box.new(bar_index, high, bar_index, low, border_color = col, bgcolor = color.new(col, 88), text = name, text_color = col, text_size = size.small)
    else if inS
        hi := math.max(hi, high)
        lo := math.min(lo, low)
        box.set_top(bx, hi)
        box.set_bottom(bx, lo)
        box.set_right(bx, bar_index)
    inS
zone(showAsia, asiaSess, #2962ff, "Asia")
zone(showLondon, londonSess, #26a69a, "London")
zone(showNY, nySess, #ef5350, "New York")
zone(showLC, lcSess, #7e57c2, "London Close")
zone(showSB, "0300-0400,1000-1100,1400-1500", #ff9800, "SB")
`,
  },
  {
    id: 'opening-range',
    name: 'Opening Range',
    nameFa: 'رنج شروع سشن (Opening Range)',
    overlay: true,
    code: `//@version=5
indicator("Opening Range", "OR", overlay = true, max_boxes_count = 300)
orSess  = input.session("0930-1000", "بازه‌ی رنج شروع")
daySess = input.session("0930-1600", "تا پایان سشن")
tz = input.string("America/New_York", "منطقه‌ی زمانی", options = ["America/New_York", "Europe/London", "Asia/Tokyo", "UTC", "Asia/Tehran"])
inOR  = not na(time(timeframe.period, orSess, tz))
inDay = not na(time(timeframe.period, daySess, tz))
var float orH = na
var float orL = na
var box bx = na
if inOR and not nz(inOR[1], false)
    orH := high
    orL := low
    bx := box.new(bar_index, high, bar_index, low, border_color = #2962ff, bgcolor = color.new(#2962ff, 85))
else if inOR
    orH := math.max(orH, high)
    orL := math.min(orL, low)
    box.set_top(bx, orH)
    box.set_bottom(bx, orL)
    box.set_right(bx, bar_index)
plot(inDay and not inOR ? orH : na, "سقف رنج", #26a69a, 1, plot.style_linebr)
plot(inDay and not inOR ? orL : na, "کف رنج", #ef5350, 1, plot.style_linebr)
plot(inDay and not inOR ? (orH + orL) / 2 : na, "میانه‌ی رنج", #787b86, 1, plot.style_linebr)
`,
  },
  {
    id: 'candle-patterns',
    name: 'Candlestick Patterns',
    nameFa: 'الگوهای کندلی',
    overlay: true,
    code: `//@version=5
indicator("Candlestick Patterns", "Patterns", overlay = true)
showEng    = input.bool(true, "انگالفینگ")
showPin    = input.bool(true, "پین‌بار (چکش و ستاره‌ی دنباله‌دار)")
showDoji   = input.bool(false, "دوجی")
showInside = input.bool(false, "اینساید بار")
showStar   = input.bool(true, "ستاره‌ی صبحگاهی و شامگاهی")
body   = math.abs(close - open)
range_ = high - low
upperW = high - math.max(open, close)
lowerW = math.min(open, close) - low
avgBody = ta.sma(body, 14)
bullEng = close > open and close[1] < open[1] and close >= open[1] and open <= close[1] and body > body[1]
bearEng = close < open and close[1] > open[1] and close <= open[1] and open >= close[1] and body > body[1]
hammer   = range_ > 0 and lowerW >= 2 * body and upperW <= range_ * 0.15
shooting = range_ > 0 and upperW >= 2 * body and lowerW <= range_ * 0.15
doji   = range_ > 0 and body <= range_ * 0.1
inside = high < high[1] and low > low[1]
morning = close[2] < open[2] and body[2] > avgBody and body[1] < avgBody * 0.5 and close > open and close > (open[2] + close[2]) / 2
evening = close[2] > open[2] and body[2] > avgBody and body[1] < avgBody * 0.5 and close < open and close < (open[2] + close[2]) / 2
plotshape(showEng and bullEng, "انگالفینگ صعودی", shape.labelup, location.belowbar, #26a69a, text = "BE", textcolor = color.white, size = size.tiny)
plotshape(showEng and bearEng, "انگالفینگ نزولی", shape.labeldown, location.abovebar, #ef5350, text = "BE", textcolor = color.white, size = size.tiny)
plotshape(showPin and hammer, "چکش", shape.triangleup, location.belowbar, #26a69a, text = "Pin", size = size.tiny)
plotshape(showPin and shooting, "ستاره‌ی دنباله‌دار", shape.triangledown, location.abovebar, #ef5350, text = "Pin", size = size.tiny)
plotshape(showDoji and doji, "دوجی", shape.circle, location.abovebar, #787b86, text = "D", size = size.tiny)
plotshape(showInside and inside, "اینساید بار", shape.square, location.abovebar, #ff9800, text = "IB", size = size.tiny)
plotshape(showStar and morning, "ستاره‌ی صبحگاهی", shape.labelup, location.belowbar, #00897b, text = "MS", textcolor = color.white, size = size.tiny)
plotshape(showStar and evening, "ستاره‌ی شامگاهی", shape.labeldown, location.abovebar, #c62828, text = "ES", textcolor = color.white, size = size.tiny)
`,
  },
];
