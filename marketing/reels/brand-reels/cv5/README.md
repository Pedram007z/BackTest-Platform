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
- **The outfit:**
  - **The hoodie:** dark navy fabric with a soft sheen. It has:
    - a full hood collar with a purple lining, and the hood folded on the back;
    - purple drawstrings with silver tips;
    - the BacktestLab icon on the left chest;
    - a kangaroo pocket with stitching;
    - ribbed cuffs and hem, each with a thin purple line.
  - **The pants:** black and casual, with a turned hem.
  - **The sneakers:** a dark upper, a white sole and white laces, with a purple side stripe and heel tab.
- **One smooth hoodie (`hoodie5`):**
  - The torso and both sleeves are one signed distance field, meshed with marching cubes, as in cv4.
  - The blend is wide at the shoulder and fades along the upper arm. That way the sleeve grows out of the shoulder,
    while an arm at rest still hangs free of the body.
  - A second mesh of the same field, a little further out, gives the hoodie's outline.
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
