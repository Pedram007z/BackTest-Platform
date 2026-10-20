// Renders the story. node render.cjs still <out.png> [t=6]   |   node render.cjs video <out.mp4>
// The video is 12 s at 30 fps; each frame blends 3 subframes for a little motion blur.
const { chromium } = require('../../../reels/tools/pw.cjs');
const { spawn } = require('child_process');
const path = require('path');
const [, , mode, out, tArg] = process.argv, FPS = 30, SUB = 3;
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, 'index.html')); await p.waitForFunction(() => window.ready === true);
  if (mode === 'still') {
    await p.evaluate((t) => window.render(t), Number(tArg ?? 6)); await p.screenshot({ path: out });
  } else {
    const dur = await p.evaluate(() => window.DURATION), n = Math.round(dur * FPS);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(FPS * SUB), '-i', '-',
      '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
      '-filter_complex', `[0:v]tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB)[v]`, '-map', '[v]', '-map', '1:a',
      '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
      '-c:a', 'aac', '-b:a', '128k', '-t', String(dur), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < n; f++) for (let j = 0; j < SUB; j++) {
      await p.evaluate((t) => window.render(t), Math.max(0, f / FPS + (j - 1) / (FPS * SUB)));
      const buf = await p.screenshot({ type: 'png' }); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  }
  console.log('done', out, errs.length ? JSON.stringify(errs) : ''); await b.close();
})();
