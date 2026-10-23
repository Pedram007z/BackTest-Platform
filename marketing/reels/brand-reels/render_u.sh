#!/usr/bin/env sh
# Renders both cuts of a u-reel: covers, then the videos (4 workers each), on the reel's shared mix.
# usage: sh render_u.sh <reel>   (from brand-reels/, after mkpage_u.py <reel> kinetic|motion and <reel>/sound.py)
set -eu
cd "$1"
for m in kinetic motion; do
  REEL_DIR=$m node render.cjs cover $m/cover.png
  rm -rf $m/chunks $m/reel-hq.mp4
  REEL_DIR=$m node render.cjs video $m/reel-hq.mp4 mix.wav 4 > $m/render.log 2>&1
  echo "$1/$m done"
done
