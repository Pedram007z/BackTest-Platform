// Renders the showreel's index.html with Playwright.
//   node render.cjs stills <out-dir> [t …]      one PNG per time (default: every beat, 0 … 24.5)
//   node render.cjs audio <out.wav>             the Web Audio soundtrack (OfflineAudioContext) as a WAV
//   node render.cjs video <out.mp4> [workers=3] 60 fps; each frame is 3 subframes (t − 1/180, t, t + 1/180)
//                                               blended with ffmpeg tmix for motion blur, rendered in parallel
//                                               chunks; then the chunks are joined and the loudness-normalised audio muxed in
const { chromium } = require('../../tools/pw.cjs');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, 'index.html'), FPS = 60, SUB = 3;
const [, , mode, out, ...rest] = process.argv;

async function open() {
  const b = await chromium.launch({ args: ['--disable-gpu-vsync', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(PAGE); await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  return { b, p, errs };
}
const run = (cmd, args) => new Promise((ok, no) => { const c = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] }); c.on('close', (code) => (code ? no(new Error(cmd + ' ' + code)) : ok())); });

async function chunk(k, a, b, file) {   // frames [a, b) → a near-lossless 60 fps chunk
  const { b: br, p, errs } = await open();
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(FPS * SUB), '-i', '-',
    '-vf', `tmix=frames=${SUB}:weights='1 1 1',select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB)`, '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '4', '-pix_fmt', 'yuv444p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = a; f < b; f++) for (let j = 0; j < SUB; j++) {
    const t = f / FPS + (j - (SUB - 1) / 2) / (FPS * SUB);
    await p.evaluate((t) => window.seek(t), t);
    const buf = await p.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (j === 0 && (f - a) % 120 === 0) console.log(`worker ${k}: frame ${f - a}/${b - a} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await br.close();
  if (errs.length) console.log(`worker ${k} errors:`, JSON.stringify(errs.slice(0, 5)));
}

(async () => {
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    const times = rest.length ? rest.map(Number) : Array.from({ length: 50 }, (_, i) => i / 2);
    const { b, p, errs } = await open();
    for (const t of times) { await p.evaluate((t) => window.seek(t), t); await p.screenshot({ path: path.join(out, `t${t.toFixed(3).padStart(6, '0')}.png`) }); }
    console.log('errors:', JSON.stringify(errs)); await b.close();
  } else if (mode === 'audio') {
    const { b, p, errs } = await open();
    const b64 = await p.evaluate(() => window.renderAudio());
    fs.writeFileSync(out, Buffer.from(b64, 'base64')); console.log('wrote', out, 'errors:', JSON.stringify(errs)); await b.close();
  } else if (mode === 'video') {
    const workers = Number(rest[0]) || 3, dur = 25, frames = dur * FPS, dir = path.join(path.dirname(path.resolve(out)), 'chunks');
    fs.mkdirSync(dir, { recursive: true });
    const wav = path.join(dir, 'music.wav');
    { const { b, p } = await open(); fs.writeFileSync(wav, Buffer.from(await p.evaluate(() => window.renderAudio()), 'base64')); await b.close(); }
    const per = Math.ceil(frames / workers), parts = [];
    for (let k = 0; k < workers; k++) { const a = k * per, e = Math.min(frames, a + per); if (a < e) parts.push([k, a, e, path.join(dir, `c${k}.mkv`)]); }
    await Promise.all(parts.map(([k, a, e, f]) => chunk(k, a, e, f)));
    fs.writeFileSync(path.join(dir, 'list.txt'), parts.map(([, , , f]) => `file '${f}'`).join('\n') + '\n');
    // two-pass loudness normalisation of the soundtrack (I −14 LUFS, TP −1.5 dB)
    const err = execFileSync('bash', ['-c', `ffmpeg -hide_banner -nostats -i '${wav}' -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | tail -12`]).toString();
    const J = JSON.parse(err.slice(err.indexOf('{')));
    const ln = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${J.input_i}:measured_TP=${J.input_tp}:measured_LRA=${J.input_lra}:measured_thresh=${J.input_thresh}:offset=${J.target_offset}:linear=true`;
    await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-i', wav, '-map', '0:v', '-map', '1:a',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-af', ln + ',aresample=48000',
      '-c:a', 'aac', '-b:a', '320k', '-t', String(dur), '-movflags', '+faststart', out]);
    console.log('done', out);
  }
})();
