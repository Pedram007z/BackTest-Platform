# cv6: the reference grid's character, from scratch, in its drawn look

The user asked to set aside cv5 and build a character exactly like the reference grid's (ticktrade.fa) from scratch.
A close look at the reference showed why cv4 and cv5 felt off. That character isn't a glossy 3D render. It's a cartoon
that looks drawn, standing in a 3D scene. cv6 builds that look:

- **The drawn look:**
  - a bold dark outline round every form: an inverted hull on each part, and a second, slightly larger mesh of each
    soft surface;
  - cartoon shading in soft tones with no shine (`MeshToonMaterial` with a soft ramp). A light from behind only lights
    the edge, so the shadow tone is the ambient light alone;
  - no self-shadowing on the character, which would only streak the tones. It still casts its shadow on the floor.
- **The face:** a perfectly round white head on a short visible neck, with:
  - flat black oval eyes, each with a tiny catch-light;
  - thin arched line brows and a small line mouth;
  - these faces: curious, worried, smile, happy, thinking and surprised.
- **The body:**
  - **The sweatshirt and sleeves** are one soft surface. It's a plain crew-neck sweatshirt with round sloping
    shoulders, a soft neckband, a gathered hem and soft cuffs.
  - **The pants and shoes** are one soft surface: slightly tapered legs and round simple shoes.
  - **The hands** are big and white.
  - **How the soft surfaces are made:** signed distance fields, meshed with marching cubes and painted with vertex
    colours.
- **Two outfits (`OUTFITS`):**
  - `grey`: the reference's plain grey sweatshirt with dark pants;
  - `navy`: a navy sweatshirt with a purple line above the hem and cuffs, and white soles.
  - Either way, the logo on the chest is BacktestLab's, not the reference's.
- **The views (`VIEWS` in `toon.js`):**
  - a turnaround: front, three-quarter, side and back;
  - three poses: presenting; thinking, with the index finger along the jaw and the thumb under the chin; waving;
  - the navy outfit;
  - two covers in cv4's rooms: standing before a glass chart, and at the desk in navy.

**Rebuild:** build `../cv4/vendor/three-bundle.js` with `../cv4/vendor/bundle.sh` (it isn't in git), then
`python3 page.py` and `node render.cjs`. The outputs are:
- `out/<id>.jpg` for each view;
- `out/turnaround.jpg`, `out/poses.jpg` and `out/navy.jpg` for the sheets.

`page/` and `out/` are not in git.
