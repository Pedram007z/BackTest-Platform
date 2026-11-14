# cv5: the mascot in full body, in a navy hoodie

The user asked for the same character as the reference grid (ticktrade.fa), changing only the clothes: a dark navy
hoodie with subtle purple details, black casual pants and simple sneakers. cv5 builds that character in full body on
cv4's scene code. The proportions follow the reference style; the outfit and the logo are BacktestLab's own.

- **The character:**
  - a perfectly round, matte white head, a little wider than the shoulders, with no hair, ears or nose;
  - black oval eyes with a white catch-light, thin arched brows and a small mouth. The faces are curious, smile,
    happy, thinking and surprised;
  - a short visible neck, slim arms and legs, white cartoon hands;
  - a thin dark outline. Each part has an inverted hull: a copy pushed out along its normals and drawn from the back.
- **Soft, like a painted 3D illustration** (after the user found the first version boxy):
  - **No hard parts on the body.** The hoodie and sleeves are one soft surface, and so are the pants and sneakers.
    Each is a signed distance field meshed with marching cubes, so every join is rounded.
  - **The hoodie's surface:** a smooth torso profile (Catmull-Rom) with sloping round shoulders, a rolled hem, a soft
    collar, the hood folded on the back, and rolled cuffs. The shoulder blend is wide and fades along the upper arm, so
    an arm at rest still hangs free of the body.
  - **The pants and sneakers' surface:** the seat, tapered legs with a turned hem, and round sneakers on a rounded sole.
  - **Colours painted on the surface:** they are vertex colours, painted per voxel, so the stripes, bands and soles are
    part of the same surface rather than separate rings or slabs.
  - **The shading:** matte materials with wrapped diffuse light, so it turns in a gentle gradient. Shadows are softer.
  - **The finish:** a Kuwahara filter that flattens fine noise into soft strokes while keeping the edges.
  - **The outline:** a dark navy outline from a second mesh of each field.
- **The outfit:**
  - **The hoodie:** dark navy, with:
    - a purple lining inside the collar;
    - purple drawstrings with silver tips;
    - the BacktestLab icon on the left chest;
    - a kangaroo pocket with stitching;
    - darker ribbed cuffs and hem, each with a thin purple line.
  - **The pants:** black and casual.
  - **The sneakers:** a dark upper, a white sole and white laces, with a purple side stripe and heel tab.
- **The views (`VIEWS` in `mascot.js`):**
  - a turnaround: front, three-quarter, side and back;
  - three poses: presenting with an open palm; thinking, with the index finger on the cheek and the thumb under the
    chin; waving;
  - two covers in cv4's rooms: standing in full body before a glass chart, and at the desk.

**Rebuild:** build `../cv4/vendor/three-bundle.js` with `../cv4/vendor/bundle.sh` (it isn't in git), then
`python3 page.py` and `node render.cjs`. The outputs are:
- `out/<id>.jpg` for each view;
- `out/turnaround.jpg` and `out/poses.jpg` for the sheets.

`page/` and `out/` are not in git.
