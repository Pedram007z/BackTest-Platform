# Story s1 · «آپشن بعدی بک‌تست‌لب رو تو انتخاب کن» (question box)

A 1080×1920 story that asks followers which feature to add next. The platform's own toolbar (lucide icons, as in
the app) ends in an empty dashed slot with a "+". A pointer clicks it, and an arrow leads down to the space left for
Instagram's question sticker. Below that are example ideas and «همه‌ی پیشنهادها رو می‌خونیم».

The faint candles behind are real BTC/USD 12-hour candles (the same ones as reel m8), with no labels or numbers.

**Files**
- `index.html` (built by `build.py` from `template.html`, `icons.json` and `candles.json`)
- `node render.cjs still <out.png> [t=6]`: the still
- `node render.cjs video <out.mp4>`: 12 s at 30 fps, with a silent audio track so music can be added in the app

**In the Instagram app**
1. Upload the video (or the still), then add the «سؤال» (Questions) sticker.
2. Prompt: `دوست داری چه آپشنی به بک‌تست‌لب اضافه بشه؟`
3. Place it in the empty space under the arrow, between the toolbar and «مثلاً», at about two thirds of the screen
   width. That space is y 990–1320 in the 1080×1920 frame.
4. Optional: add soft music from the app.

**Afterwards**
- Share the best answers as new stories (tap a reply, then «اشتراک‌گذاری پاسخ») with a short reply such as
  «رفت توی لیست» or «داریم روش کار می‌کنیم». People answer more when they see that answers get read.
- When a suggested feature ships, post it and credit the idea: «پیشنهاد خودتون بود».
