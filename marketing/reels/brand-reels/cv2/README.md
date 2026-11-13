# cv2: the reel covers in 3D

The user asked for cv1's covers in 3D rather than 2D. This is a real 3D scene (three.js r170, rendered in headless
Chromium), with the same nine hooks and symbols as cv1. It keeps only the reference grid's principles: a two-line
question in white then red or green, one expressive character, one bold glowing symbol, and a dark cinematic room with
depth.

- **The trader, built in 3D** (BacktestLab's character, not the reference's):
  - a rounded head with glossy eyes (iris, pupil, a catch-light) and eyelids and brows posed per expression (worried,
    thinking, shocked, sad, smirk, happy), plus cheeks, a nose and a sweat drop;
  - a swept quiff of rounded hair shapes;
  - a violet fabric hoodie (sheen) with a hood collar, lime drawstrings and the logo on the chest;
  - two-bone arms, with hands that present (open palm), point or rest a finger on the chin.
- **The room:** a night-city window, monitors with candle charts, shelves with books, plants, a warm lamp, and a glossy
  dark desk in front.
- **The lighting:** a key light with soft shadows, two rim lights (the cover's tint and violet), the symbol's own
  coloured light and a dim environment. Then depth of field (the room in bokeh) and a light bloom on the glowing parts.
- **The symbols, in 3D:**
  - the «بررسی» scanner gate and a «؟» thought bubble;
  - a glass candle panel and two dice;
  - the account bar at $500 with −50% and +100%;
  - a 60% ring and a prop challenge card on fire;
  - an approved payout card and a fan of bills;
  - a cracking 200% curve;
  - a «سیگنال VIP» phone and a warning sign;
  - an envelope «۱ سال بعد» and an hourglass of candles;
  - a 100-square grid.
- **The hook** is drawn on a 2D canvas on top (outlined and shadowed), as in cv1.

The numbers on the covers are the reels' own. The candles and the grid's colours are decoration.

**Rebuild:**
1. Build three.js once (see `vendor/bundle.sh`): `npm install three@0.170.0` in a scratch folder, then `THREE_DIR=<it>
   ESBUILD=<esbuild> sh vendor/bundle.sh`.
2. `python3 page.py` and `node render.cjs`. The output is the same as cv1's: `out/<n>-<reel>.jpg`,
   `out/<n>-<reel>-grid.jpg` and `out/grid-preview.jpg`.

`vendor/three-bundle.js`, `page/` and `out/` are not in git.
