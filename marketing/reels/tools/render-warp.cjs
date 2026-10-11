// Renders a reel with a time-warp, to fit a voice-over: new time T → original time t, piecewise linear between
// the knots [[T, t], ...] in the warp JSON (see reel3-new-strategy/voiceover.json).
// usage: node tools/render-warp.cjs <reel-dir> <warp.json> <out.mp4> [fps]
const { chromium } = require('./pw.cjs');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const [,, dir, warpFile, out, fpsArg] = process.argv;
const FPS = Number(fpsArg) || 30;
const W = JSON.parse(fs.readFileSync(warpFile, 'utf8'));
const { knots, duration } = W.warp || W;
const f = (T) => { for (let i = 0; i < knots.length - 1; i++) { const [n0, b0] = knots[i], [n1, b1] = knots[i + 1]; if (T <= n1) return b0 + (T - n0) * (b1 - b0) / (n1 - n0); } return knots[knots.length - 1][1]; };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(dir, 'index.html'));
  await p.waitForFunction(() => window.ready === true);
  const frames = Math.round(duration * FPS);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < frames; i++) {
    await p.evaluate((t) => window.render(t), Math.min(f(i / FPS), 51.99));
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await b.close();
  console.log('done', out);
})();
