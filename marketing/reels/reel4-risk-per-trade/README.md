# Reel 4: «یه استراتژی سودده… و حسابت نصف شد‼»

| | |
|---|---|
| **Topic** | Risk per trade. The same profitable trades end +46% at 1% risk and −51% at 30% risk. The right risk is set by the strategy's worst days, which a backtest shows before they cost money. |
| **Counter-belief** | "If your strategy is profitable, you'll make money." The reel shows a profitable strategy halving the account. |
| **Length** | 53 s, 1080×1920, 30 fps. Persian, silent-friendly. |
| **Outlier formats used** | The title box with ‼; a two-account race; a **save-worthy risk calculator** (a tool reveal in the style of the dashboard reel); a one-tap number comment that also starts a careful-vs-risky debate. |
| **Comment trigger** | «ریسک تو توی هر معامله چند درصده؟», options ۰٫۵٪ / ۱٪ / ۲٪ / ۵٪+, «عددش رو کامنت کن» |
| **Files** | `index.html` (uses `../reelkit`), `sound.json` (music spec for `reelkit/soundgen.py`), cover: `../covers/reel4-cover.jpg` |
| **Series link** | It uses **the same 100 trades as reel 2's strategy B** (35 wins at +3R, 65 losses, longest losing run 8), so it works as a follow-up to reel 2. |

## Timeline

| Time | Beat | On screen |
|---|---|---|
| 0.0–3.6 | **Counter-belief hook** | «یه استراتژی *سودده*…». An account card counts the 30%-risk balance trade by trade: red while under $10,000, green as it climbs into the hundreds of thousands, red as it crashes to **$4,872**. At 1.15 s the red title box «و حسابت نصف شد‼» lands, with a flash and shake. |
| 3.6–9.4 | The belief, then the **next hook** | «همه فکر می‌کنن:» and a bubble: «اگه استراتژیت سودده باشه، حتماً پول درمیاری.» The ✓ flips to ؟. At 7.6 s: «ولی یه عدد هست که از *خودِ استراتژی* مهم‌تره…» |
| 9.4–17.0 | The reveal, then the race | Title box «*ریسکِ* هر معامله.» Then «همون ۱۰۰ معامله‌ی سودده، دو تا حساب ۱۰ هزار دلاری:». Two cards (ریسک ۱٪ and ریسک ۳۰٪ در هر معامله) count up while both balance lines run on a log scale. At 15.2 s: «همون معامله‌ها؛ یکی +۴۶٪+، یکی !۵۱٪- ضرر.!» |
| 17.2–18.8 | **Type Two hook** | «ولی *ترسناک‌ترش* اینه:» |
| 18.8–27.0 | The collapse | «حسابِ *ریسک ۳۰٪*، وسط راه:». The 30% line climbs to a green «اوج: $1,273,879» peak, then the fall is redrawn in bold red, ending on the chip **−۹۹٫۸٪** and the tag «آخرش: $4,872». «یه میلیون دلار سود… و بعد !ریزش ۹۹٫۸٪.!» At 25.4 s: «پس ریسک درست *چقدره؟*» |
| 27.0–35.0 | The answer: backtesting | «جوابش توی *بدترین روزهای* استراتژیته.» → «و اون روزها رو قبل از ضرر، فقط یه جا می‌بینی:» → «*بک‌تست:* ۵ سال، ۵۰۰ معامله» with the ×60 replay and the red chip «طولانی‌ترین زنجیره‌ی ضرر: ۸». |
| 35.0–44.5 | **Save-worthy calculator** | Title box «ماشین‌حساب ریسک!!», with «اگه ۸ ضرر پشت سر هم بیاد، حسابت:» and one row per risk level. Each bar fills and counts: ریسک ۱٪ −۷٫۷٪ (green), ۲٪ −۱۴٫۹٪ (green), ۵٪ −۳۳٫۷٪ (amber), ۱۰٪ −۵۷٫۰٪ (red), ۳۰٪ −۹۴٫۲٪ (red). At 39.8 s: «ریسکی رو انتخاب کن که *بدترین روزش* رو تحمل کنی.» |
| 44.5–53.0 | **Pre-launch end card** + number comment | Logo, «به‌زودی», «اول بدترین روزها رو ببین، *بعد* ریسک کن.», the follow line, then the question card with ۰٫۵٪ / ۱٪ / ۲٪ / ۵٪+ and an arrow. |

## Numbers (re-checked by `tools/verify_numbers.py`, which rebuilds the exact trade sequence bit for bit)

- **The sequence:** `sequence(21, 35, 100, 8)` shuffles 35 wins among 100 trades with the seeded PRNG and keeps the first shuffle whose longest losing run is exactly 8. Each trade wins +3R or loses −1R.
- **Compounding:** each trade risks a fixed share of the current balance. A win adds 3 × risk and a loss subtracts risk.
  - **1% risk:** $10,000 → **$14,642 (+46%)**.
  - **30% risk:** $10,000 → peak **$1,273,879** → **−99.8%** from the peak → **$4,872** at the end (−51%).
- **The calculator** is 1 − (1 − risk)^8 for 8 losses in a row:
  - 1%: −7.7%
  - 2%: −14.9%
  - 5%: −33.7%
  - 10%: −57.0%
  - 30%: −94.2%
- **Honesty caveat:** on this sequence, 10% risk actually finishes highest (+932%), with −57% on its worst streak. The Kelly fraction for 35% wins at 3R is 13.3%. That is why the reel never claims "1% makes the most money". Its message is "pick the risk whose worst day you can survive".

## Cover

`covers/reel4-cover.jpg`:
- «یه استراتژی سودده…» with «سودده» in green
- the real 1% (green) and 30% (red) balance lines on a log chart, tagged «ریسک ۱٪ +۴۶٪» and «ریسک ۳۰٪ −۵۱٪»
- the red title box «و حسابت نصف شد‼»
- the chip «رازش: ریسک هر معامله»

## Caption

```
یه استراتژی سودده… و حسابت نصف شد؟! 😳

همون ۱۰۰ معامله، دو تا حساب ۱۰ هزار دلاری:
ریسک ۱٪ در هر معامله ← ۱۴٬۶۴۲ دلار (۴۶٪ سود)
ریسک ۳۰٪ در هر معامله ← ۴٬۸۷۲ دلار (۵۱٪ ضرر)

ترسناک‌ترش؟
حساب ۳۰٪ وسط راه به ۱٫۲۷ میلیون دلار رسید…
و بعد ۹۹٫۸٪ ریزش کرد. 📉

استراتژی یکی بود. فرقش فقط یه عدد بود: «ریسک هر معامله».

📌 ماشین‌حساب ریسک (سیو کن)
اگه ۸ ضرر پشت سر هم بیاد، حسابت چقدر کم می‌شه:
ریسک ۱٪ ← ۷٫۷٪
ریسک ۲٪ ← ۱۴٫۹٪
ریسک ۵٪ ← ۳۳٫۷٪
ریسک ۱۰٪ ← ۵۷٪
ریسک ۳۰٪ ← ۹۴٫۲٪

ریسک درست رو بدترین روزهای استراتژیت تعیین می‌کنه،
و بک‌تست یعنی اون روزها رو قبل از ضرر ببینی.

بک‌تست‌لب به‌زودی میاد 🚀
فالو کن تا روز لانچ رو از دست ندی 🔔

👇 ریسک تو توی هر معامله چند درصده؟ ۰٫۵٪، ۱٪، ۲٪ یا ۵٪ به بالا؟ عددش رو کامنت کن
.
.
.
#بک_تست #مدیریت_ریسک #مدیریت_سرمایه #ترید #تریدر #فارکس #کریپتو #بازار_مالی #پراپ_فرم #بکتست
```

**Pinned first comment:** «من روی ۱٪ ثابتم. تو چی؟»

## Soundtrack

`sound.json` → `reelkit/soundgen.py`: C minor (Cm–A♭–E♭–B♭), 120 BPM, bar lines from 1.0 s, so the cuts at 27.0, 35.0 and 44.5 s land on beats.
- Ticks follow the hook counter, an impact and "fail" tone hit the title, and whooshes mark the cuts.
- A riser into the «ریسکِ هر معامله» impact.
- A tick run as the race counts its 100 trades, over a groove with clap.
- A downlifter into «ترسناک‌ترش».
- For the collapse:
  - a riser as the line climbs
  - a bell on the peak
  - a downlifter, impact and "fail" tone as it falls
- A bell on «پس ریسک درست چقدره؟».
- A long riser and snare roll into the replay at 31.5 s.
- A full groove under the calculator, with a rising pop per row and a low "fail" at the 30% row.
- The end card: an impact, a bell on the follow line, pops on the options, and an outro bass.
- Raw output is −14.9 LUFS, levelled to −16 by `tools/encode.sh`.

## Voice-over (script ready, not generated)

The timed script for the Kourosh voice is in [`voiceover.json`](voiceover.json). ElevenLabs refused every take ("Free Tier access has been disabled"), so it needs a paid ElevenLabs plan. Then follow reel 3's "Voice-over version" steps.
