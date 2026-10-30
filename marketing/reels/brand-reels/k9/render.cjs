// Renders k9 (REEL_DIR=kinetic) with Playwright (1080×1920).
//   node render.cjs stills <out-dir> [t …]            one PNG per time (default: every half second)
//   node render.cjs video <out.mp4> <mix.wav> [workers=3]
//        30 fps; each frame blends 3 subframes 1/180 s apart (t − 1/180, t, t + 1/180) with ffmpeg tmix for motion blur,
//        rendered in parallel chunks, joined, and the mixed soundtrack (already at −14 LUFS) muxed in
const { chromium } = require('../../tools/pw.cjs');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
// REEL_DIR=<dir> renders <dir>/index.html
const PAGE = 'file://' + path.resolve(__dirname, process.env.REEL_DIR || '.', 'index.html'), FPS = 30, SUB = 3, SUBRATE = 180;
const [, , mode, out, ...rest] = process.argv;
async function open() {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(PAGE); await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 }); return { b, p, errs };
}
const run = (cmd, args) => new Promise((ok, no) => { const c = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] }); c.on('close', (code) => (code ? no(new Error(cmd + ' ' + code)) : ok())); });
async function chunk(k, a, b, file) {
  const { b: br, p, errs } = await open();
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(FPS * SUB), '-i', '-',
    '-vf', `tmix=frames=${SUB}:weights='1 1 1',select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB)`, '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '4', '-pix_fmt', 'yuv444p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = a; f < b; f++) for (let j = 0; j < SUB; j++) {
    await p.evaluate((t) => window.seek(t), f / FPS + (j - (SUB - 1) / 2) / SUBRATE);
    const buf = await p.screenshot({ type: 'png' }); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (j === 0 && (f - a) % 120 === 0) console.log(`worker ${k}: frame ${f - a}/${b - a} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await br.close();
  if (errs.length) console.log(`worker ${k} errors:`, JSON.stringify(errs.slice(0, 5)));
}
(async () => {
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true }); const { b, p, errs } = await open(), dur = await p.evaluate(() => window.DURATION);
    const times = rest.length ? rest.map(Number) : Array.from({ length: Math.floor(dur * 2) }, (_, i) => i / 2);
    for (const t of times) { await p.evaluate((t) => window.seek(t), t); await p.screenshot({ path: path.join(out, `t${t.toFixed(3).padStart(6, '0')}.png`) }); }
    console.log('errors:', JSON.stringify(errs)); await b.close();
  } else if (mode === 'cover') {
    const { b, p, errs } = await open(); await p.evaluate(() => window.cover()); await p.screenshot({ path: out, type: 'png' }); console.log('errors:', JSON.stringify(errs)); await b.close();
  } else if (mode === 'video') {
    const wav = path.resolve(rest[0]), workers = Number(rest[1]) || 3, dir = path.join(path.dirname(path.resolve(out)), 'chunks'); fs.mkdirSync(dir, { recursive: true });
    let dur; { const { b, p } = await open(); dur = await p.evaluate(() => window.DURATION); await b.close(); }
    const frames = Math.round(dur * FPS), per = Math.ceil(frames / workers), parts = [];
    for (let k = 0; k < workers; k++) { const a = k * per, e = Math.min(frames, a + per); if (a < e) parts.push([k, a, e, path.join(dir, `c${k}.mkv`)]); }
    await Promise.all(parts.map(([k, a, e, f]) => chunk(k, a, e, f)));
    fs.writeFileSync(path.join(dir, 'list.txt'), parts.map(([, , , f]) => `file '${f}'`).join('\n') + '\n');
    await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-i', wav, '-map', '0:v', '-map', '1:a',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '320k', '-t', String(dur), '-movflags', '+faststart', out]);
    console.log('done', out);
  }
})();
