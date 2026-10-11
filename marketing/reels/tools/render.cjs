// Renders a reel's index.html frame by frame (window.render(t)) into a silent H.264 MP4 at high quality.
// usage: node tools/render.cjs <reel-dir> <out.mp4> [fps=30]
const { chromium } = require('./pw.cjs');
const { spawn } = require('child_process');
const path = require('path');
const [,, dir, out, fpsArg] = process.argv;
const FPS = Number(fpsArg) || 30;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(dir, 'index.html'));
  await p.waitForFunction(() => window.ready === true);
  const dur = await p.evaluate(() => window.DURATION);
  const frames = Math.round(dur * FPS);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < frames; i++) {
    await p.evaluate((t) => window.render(t), i / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await b.close();
  console.log('done', out);
})();
