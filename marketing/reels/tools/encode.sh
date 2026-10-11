#!/usr/bin/env sh
# The file to upload: the silent render plus its soundtrack, levelled to about -16 LUFS,
# two-pass H.264 at 3.3 Mb/s (about 23 MB for 53 s, under chat/upload limits) with AAC 192k.
# usage: sh tools/encode.sh <render-hq.mp4> <soundtrack.wav> <out.mp4>
set -eu
video=$(cd "$(dirname "$1")" && pwd)/$(basename "$1"); audio=$2; out=$3
lufs=$(ffmpeg -hide_banner -nostats -i "$audio" -af ebur128 -f null - 2>&1 | awk '$1 == "I:" { v = $2 } END { print v }')
gain=$(awk -v l="$lufs" 'BEGIN { printf "%.1f", -16 - l }')
echo "soundtrack $lufs LUFS, gain ${gain} dB"
work=$(mktemp -d)
ffmpeg -v error -y -i "$audio" -af "volume=${gain}dB" -c:a pcm_s16le "$work/audio.wav"
( cd "$work" && ffmpeg -v error -y -i "$video" -c:v libx264 -preset slow -b:v 3300k -pass 1 -an -f mp4 /dev/null )
( cd "$work" && ffmpeg -v error -y -i "$video" -i audio.wav -map 0:v -map 1:a -c:v libx264 -preset slow -b:v 3300k \
    -maxrate 4500k -bufsize 9000k -pass 2 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -movflags +faststart -shortest "$work/out.mp4" )
mv "$work/out.mp4" "$out"
rm -f "$work"/audio.wav "$work"/ffmpeg2pass*
rmdir "$work"
ls -la "$out"
