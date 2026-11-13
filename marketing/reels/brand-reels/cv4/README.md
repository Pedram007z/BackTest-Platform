# cv4: the reel covers with a mascot in the reference grid's style

The user asked for a character just like the one on the reference grid (ticktrade.fa), in different clothes such as
a hoodie. cv4 rebuilds the mascot with that style's proportions in BacktestLab's own colours, on cv3's scene: the rooms,
the symbols, the lighting and the grade are cv3's.

- **The mascot:**
  - a big white round head, about as wide as the shoulders, with no hair, ears or nose, in a matte material;
  - black oval eyes with a catch-light, thin brows and a small mouth that carry each expression (happy with closed
    smiling eyes, thinking, smirk, worried with a sweat drop, sad, shocked);
  - white cartoon hands.
- **The hoodie:** violet, with a thick hood collar and the folded hood on the back, lime drawstrings and the
  BacktestLab logo on the chest. It isn't the reference's grey sweater or its logo. The shoulders slope, and an arm
  at rest hangs just off the body's side.
- **One smooth body (`hoodieBody`):** the hoodie's body and both sleeves are a single surface. It's a signed distance
  field: the torso's profile, flattened front to back, plus a capsule per arm segment, joined with a smooth minimum and
  meshed with marching cubes. Each sleeve grows out of the shoulder like a set-in sleeve, with no seam or bump; the
  forearms only join at the elbow. The collar, hood, drawstrings and logo sit on that surface (`frontZ`).
- **`sheet.cjs`** renders a character sheet: four poses (presenting with a happy face, a finger on the chin, pointing
  with a smirk, worried) side by side in `out/character-sheet.jpg`.

**Rebuild:** build `vendor/three-bundle.js` with `vendor/bundle.sh` (it isn't in git), then run `python3 page.py`,
`node sheet.cjs` and `node render.cjs`. `page/` and `out/` are not in git either.
