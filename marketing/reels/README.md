# بک‌تست‌لب Instagram reels

Four pre-launch Instagram reels for بک‌تست‌لب (BacktestLab), in Persian, 9:16, 52–58 s each. Each one has its own original soundtrack, a cover and a caption. Everything is code, so any reel can be edited and rendered again, and new reels can be built the same way.

**Start here**, then read:
1. [METHOD.md](METHOD.md): the growth technique, the research on competing reels, the reel formula and the rules (pre-launch, honest numbers, captions, covers, posting).
2. [PRODUCTION.md](PRODUCTION.md): how a reel is built, rendered, scored and encoded, the `reelkit` API, the checklist for a new reel, and the gotchas.
3. Each reel's own README: the full timeline with on-screen text, the numbers and where they come from, the cover, the caption ready to paste, and the soundtrack.

[`reels.json`](reels.json) has the same facts in machine-readable form.

## The four reels

| # | Hook (title box) | Counter-belief | Proof | Save / outlier moment | Comment trigger | Length |
|---|---|---|---|---|---|---|
| 1 | [«تمرین با حساب دمو؟ وقت تلف کردنه‼»](reel1-demo-account/README.md) | "Practise on demo first" | 100 trades ≈ 3 months, and they show only one kind of market | «داشبورد بک‌تست!!» | Fill in the blank: «اول ____» | 58 s |
| 2 | [«وین‌ریت ۸۰٪… و حسابت منفیه‼»](reel2-win-rate/README.md) | "Look for a high win rate" | 80% → −4R vs 35% → +40R; 8 losses in a row are likely (69%) | «داشبورد بک‌تست!!» | Pick a side: A or B | 52.5 s |
| 3 | [«استراتژی جدید یاد نگیر‼»](reel3-new-strategy/README.md) | "Learn a better strategy" | The same 50% strategy reads 30–70% at 20 trades, 45–55% at 500 | «۴ قانون قبل از قضاوت!!» checklist | How many strategies have you quit? ۱ / ۳ / ۵ / ۱۰+ | 52 s |
| 4 | [«یه استراتژی سودده… و حسابت نصف شد‼»](reel4-risk-per-trade/README.md) | "A profitable strategy makes money" | The same 100 trades: 1% risk → +46%, 30% risk → $1.27M → −99.8% → −51% | «ماشین‌حساب ریسک!!» calculator | What % do you risk? ۰٫۵٪ / ۱٪ / ۲٪ / ۵٪+ | 53 s |

**Covers** are in [`covers/`](covers): `reelN-cover.jpg` (1080×1920, to upload as the reel cover) and `reelN-cover-grid-preview.jpg` (how it looks on the profile grid).

**Posting order:**
- Post 1 → 2 → 3 → 4, a few days apart.
- Reel 4 reuses reel 2's strategy B trades, so it works as a sequel.
- Pin a first comment that answers your own question; the per-reel READMEs have suggestions.

## Status and hard rules

- **Pre-launch:** بک‌تست‌لب has not launched.
  - **No website address** goes in any video, cover or caption.
  - The end card says «به‌زودی» and «فالو کن تا روز لانچ رو از دست ندی».
  - After launch, the end cards and captions can add the address.
- **Numbers are computed, never invented.**
  - `python tools/verify_numbers.py` re-checks every claim.
  - `node tools/facts.cjs <reel>` prints what each page computed.
  - Illustrative dashboards say «داده‌ی نمونه».
- **No voice-over yet.** The reels work silently. Reel 1's README has a timed voice-over script.
- **Rendered files are not in git.** The final MP4s (about 23 MB each) and the soundtrack WAVs were delivered separately; rebuild them with the commands in PRODUCTION.md. Secrets such as API keys and the app-signing keystore are never stored here.

## Quick start

```sh
cd marketing/reels
pip install -r tools/requirements.txt          # numpy, scipy
# Node with Playwright + Chromium, and ffmpeg (see PRODUCTION.md)
python tools/verify_numbers.py                 # all numbers check out
node tools/stills.cjs reel3-new-strategy /tmp/s 2 12 22 33 40 48
node tools/render.cjs reel3-new-strategy /tmp/reel3-hq.mp4 30
python reelkit/soundgen.py reel3-new-strategy/sound.json /tmp/reel3.wav
sh tools/encode.sh /tmp/reel3-hq.mp4 /tmp/reel3.wav /tmp/backtestlab-reel3.mp4
```

## For an AI picking this up

- **Read in this order:** this file, METHOD.md, PRODUCTION.md, then the reel you're working on. They are enough to continue without the original conversation.
- **To make reel 5:**
  - pick an idea from METHOD.md §5, or a new counter-belief in trading
  - script it to the formula
  - verify its numbers first
  - copy `reel4-risk-per-trade/` and edit it
  - follow the PRODUCTION.md checklist
- **To edit an existing reel:**
  - text is in `data-k` attributes and timings are in `render(t)`
  - move the sound cues in `sound.json` (or the soundtrack script) if you move timings
  - re-render, re-score and re-encode
- **Keep every reel consistent** with the brand look, the end card, and the caption structure.
- **Things you can't do here** (most AI sandboxes):
  - Listen to audio: check soundtracks with a spectrogram and ask a human to listen.
  - Post to Instagram: hand back the files and caption.
