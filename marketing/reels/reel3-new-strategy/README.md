# Reel 3: «استراتژی جدید یاد نگیر‼»

| | |
|---|---|
| **Topic** | Strategy-hopping. After about 20 trades a strategy's results are mostly luck: the same strategy can look like 30% or 70% wins. Only a large sample (hundreds of trades) shows the truth, and a backtest gets you there in a weekend instead of a year. |
| **Counter-belief** | "Learn a better strategy" is the usual advice. The reel says to stop learning new strategies: the problem is the number 20. |
| **Length** | 52 s, 1080×1920, 30 fps. Persian, silent-friendly. |
| **Outlier formats used** | The title box with ‼; the relatable-pain loop (the cycle everyone is stuck in); a **save-worthy checklist** with a «این رو ذخیره کن» chip; a one-tap number comment. |
| **Comment trigger** | «تا حالا چند تا استراتژی رو امتحان کردی و ول کردی؟», options ۱ / ۳ / ۵ / ۱۰+, «عددش رو کامنت کن» |
| **Files** | `index.html` (uses `../reelkit`), `sound.json` (music spec for `reelkit/soundgen.py`), cover: `../covers/reel3-cover.jpg` |

## Timeline

| Time | Beat | On screen |
|---|---|---|
| 0.0–3.6 | **Counter-belief hook** | «دنبال یه استراتژی *جدیدی؟*». Fanned strategy cards (پرایس اکشن هفته‌ی ۱، اسمارت مانی هفته‌ی ۳، ICT هفته‌ی ۶، اسکالپ ۱ دقیقه هفته‌ی ۹) fall away as the red title box «استراتژی جدید یاد نگیر‼» lands at 1.15 s. |
| 3.6–10.0 | The loop, then the **next hook** | The chip «این چرخه آشناست؟» and a circular loop: استراتژی جدید → ۲۰ معامله → چند ضرر پشت هم → «این جواب نمی‌ده!» → back to the start. At 8.3 s: «مشکل از استراتژی‌ها نیست. مشکل، *عدد ۲۰* است.» |
| 10.0–19.4 | Proof: 30 traders at 20 trades | «یه استراتژی با وین‌ریت واقعیِ ۵۰٪؛ ۳۰ نفر، هر کدوم ۲۰ معامله:». 30 dots drop onto a 0–100% win-rate axis around the "true 50%" line. Their spread is marked «۲۰ معامله: ۳۰٪ تا ۷۰٪»; the lowest is labelled «افتضاحه!» in red and the highest «معجزه‌ست!» in green. «همون استراتژی؛ یکی !۳۰٪! می‌بینه، یکی +۷۰٪.+» |
| 17.6–19.4 | **Type Two hook** | «ولی یه چیز *مهم‌تر* هست که کسی بهت نمی‌گه…» |
| 19.4–27.4 | The same 30 with more trades | «همین ۳۰ نفر، با معامله‌های *بیشتر:*». The dots tighten: «۱۰۰ معامله: ۴۰٪ تا ۶۰٪», then «۵۰۰ معامله: ۴۵٪ تا ۵۵٪». «هرچی معامله بیشتر، عدد *واقعی‌تر.*» At 25.7 s: «یعنی اون استراتژی که ول کردی… !شاید اصلاً بد نبود.!» |
| 27.4–35.4 | The catch, then the answer | «۵۰۰ معامله با *حساب واقعی؟*» → «یعنی !بیش از یک سال.!» → «با بک‌تست؟ *یک آخر هفته.*» with the ×60 replay. |
| 35.4–44.0 | **Save-worthy checklist** | Title box «۴ قانون قبل از قضاوت!!», with each rule ticking in: ✓ حداقل ۱۰۰ معامله، با قوانین ثابت · ✓ توی روند، رنج و خبر تستش کن · ✓ وین‌ریت رو کنار سودِ هر معامله ببین · ✓ بدترین زنجیره‌ی ضررش رو بشناس. Then the chip «این رو ذخیره کن» at 41.4 s. |
| 44.0–52.0 | **Pre-launch end card** + number comment | Logo, «به‌زودی», «یه استراتژی، ۵۰۰ معامله، *یک آخر هفته.*», the follow line, then the question card with ۱ / ۳ / ۵ / ۱۰+ and an arrow. |

## Numbers (re-checked by `tools/verify_numbers.py` and `tools/facts.cjs`)

- **The dots are a real simulation** (seeded, `window.facts`): 30 traders with a true 50% win rate. Their measured win rates span:
  - 30%–70% after 20 trades
  - 40%–59% after 100 trades
  - 46%–55% after 500 trades
- **The range chips are the binomial ranges** a 50% strategy lands in most of the time:
  - 30–70% at 20 trades: 95.9% of the time
  - 40–60% at 100 trades: 96.5%
  - 45–55% at 500 trades: 97.8%
- **"More than a year":** 500 trades at 1–2 setups per trading day is 250–500 trading days, 1 to 2 years.
- **The replay** is the illustrative ×60 candle replay shared by the reels.

## Cover

`covers/reel3-cover.jpg`:
- «دنبال یه استراتژی جدیدی؟»
- a cascading deck of strategy cards (older ones dimmed) stamped in red «بعد از ۲۰ معامله: ول شد»
- the red title box «استراتژی جدید یاد نگیر‼»
- the chip «مشکل، عدد ۲۰ است»

## Caption

```
استراتژی جدید یاد نگیر‼️

دنبال یه استراتژی جدیدی چون قبلیه «جواب نداد»؟
بیشتر وقت‌ها مشکل از استراتژی نیست؛ مشکل، عدد ۲۰ است.

۳۰ نفر، یه استراتژی با وین‌ریت واقعی ۵۰٪، هر کدوم ۲۰ معامله:
یکی ۳۰٪ می‌بینه و می‌گه «افتضاحه!»
یکی ۷۰٪ می‌بینه و می‌گه «معجزه‌ست!» 🤯

همون استراتژی:
۲۰ معامله ← بین ۳۰٪ تا ۷۰٪
۱۰۰ معامله ← بین ۴۰٪ تا ۶۰٪
۵۰۰ معامله ← بین ۴۵٪ تا ۵۵٪

هرچی معامله بیشتر، عدد واقعی‌تر.
یعنی اون استراتژی که ول کردی… شاید اصلاً بد نبود.

۵۰۰ معامله با حساب واقعی؟ بیش از یک سال.
با بک‌تست؟ یک آخر هفته. ⏱️

📌 ۴ قانون قبل از قضاوت (سیو کن):
۱. حداقل ۱۰۰ معامله، با قوانین ثابت
۲. توی روند، رنج و خبر تستش کن
۳. وین‌ریت رو کنار سودِ هر معامله ببین
۴. بدترین زنجیره‌ی ضررش رو بشناس

بک‌تست‌لب به‌زودی میاد 🚀
فالو کن تا روز لانچ رو از دست ندی 🔔

👇 تا حالا چند تا استراتژی رو امتحان کردی و ول کردی؟ ۱، ۳، ۵ یا ۱۰ به بالا؟ عددش رو کامنت کن
.
.
.
#بک_تست #ترید #تریدر #فارکس #کریپتو #بازار_مالی #استراتژی_معاملاتی #پرایس_اکشن #وین_ریت #بکتست
```

**Pinned first comment:** «من ۵ تا. تو چند تا؟»

## Soundtrack

`sound.json` → `reelkit/soundgen.py`: E minor (Em–C–G–D), 120 BPM, bar lines from 1.4 s.
- A riser into the hook impact at 1.05 s, and whooshes on the cuts at 3.6, 10.0, 19.4 and 27.4 s.
- A light riser into «مشکل، عدد ۲۰ است».
- A run of ticks as the 30 dots drop, over a groove with clap.
- A downlifter into «ولی یه چیز مهم‌تر…».
- A dark (low-passed) groove under the tightening dots, and a bell on «شاید اصلاً بد نبود».
- A long riser and snare roll into the replay at 31.4 s, with an impact.
- A full groove under the checklist, with a pop per rule.
- The end card: an impact, a bell on the follow line, pops on the options, and an outro bass.
- Raw output is −14.6 LUFS, levelled to −16 by `tools/encode.sh`.
