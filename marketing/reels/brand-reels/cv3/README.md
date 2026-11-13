# cv3: the 3D covers, closer to the reference grid's look

The user said cv2 fell short of the reference grid and asked for covers like it, with different backgrounds and
symbols. cv3 builds on cv2's three.js scene, and its symbols are cv2's. What it changes:

- **The character is a clean mascot:** a smooth porcelain head, glossy oval eyes with catch-lights, strong simple
  brows and a small mouth that carry each expression, white mitten hands, and BacktestLab's violet hoodie with lime
  drawstrings and the logo.
- **The arms are part of the body:** each sleeve grows from a rounded shoulder cap that blends into the hoodie, is
  one fabric colour from shoulder to cuff, and an arm at rest hangs along the body's side (the user asked that the arms
  not look stuck on).
- **A different room per cover** (`theme`):
  - `city`: a big night-city window and monitors;
  - `monitors`: a wall of chart screens;
  - `neon`: violet neon strips, a ring light and shelves;
  - `warm`: a dusk window, a warm lamp and shelves.
  Every room has a wooden desk with a clear coat, a mug, plants and a back light in the cover's tint.
- **The lighting and grade:**
  - a key light, two rims and a front fill;
  - ambient occlusion (GTAO), depth of field and bloom;
  - a grade (teal shadows, warm highlights, contrast), a vignette and film grain.

The reference covers look like full renders (global illumination, subsurface skin, real fabric). In-browser three.js
gets the composition, the style and the light direction, but not that render quality. Blender's Cycles would, but
installing it here was not permitted.

**Rebuild:** as cv2. Build `vendor/three-bundle.js` with `vendor/bundle.sh`, then run `python3 page.py` and
`node render.cjs`. `vendor/three-bundle.js`, `page/` and `out/` are not in git.
