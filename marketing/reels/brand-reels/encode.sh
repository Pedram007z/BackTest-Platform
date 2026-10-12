#!/usr/bin/env sh
# Mux a silent render with its finished mix: two-pass H.264 at 3.3 Mb/s, AAC 192k, no level change.
# usage: sh encode.sh <reel-dir> <out.mp4>
set -eu
d=$(cd "$1" && pwd); out=$2; v=${3:-reel-hq.mp4}; work=$(mktemp -d)
( cd "$work" && ffmpeg -nostdin -v error -y -i "$d/$v" -c:v libx264 -preset slow -b:v 3300k -pass 1 -an -f mp4 /dev/null )
( cd "$work" && ffmpeg -nostdin -v error -y -i "$d/$v" -i "$d/mix.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -b:v 3300k \
    -maxrate 4500k -bufsize 9000k -pass 2 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -movflags +faststart -shortest "$work/out.mp4" )
mv "$work/out.mp4" "$out"; rm -f "$work"/ffmpeg2pass*; rmdir "$work"; ls -la "$out"
