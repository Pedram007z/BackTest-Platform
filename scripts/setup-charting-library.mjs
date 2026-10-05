// Copies TradingView Advanced Charts into public/charting_library so the chart page can use it.
//
//   npm run setup:charts -- ../charting_library-master          (extracted folder)
//   npm run setup:charts -- ~/Downloads/charting_library-master.zip
//
// The library is licensed per company by TradingView and must not be published in a public
// repository, so public/charting_library is git-ignored. Without it the app uses its built-in engine.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const src = process.argv[2];
if (!src) {
  console.error('Usage: npm run setup:charts -- <path to charting_library folder or .zip>');
  process.exit(1);
}

let root = resolve(src);
let temp = null;
if (root.endsWith('.zip')) {
  temp = mkdtempSync(join(tmpdir(), 'tv-'));
  try {
    execFileSync('unzip', ['-q', root, '-d', temp], { stdio: 'inherit' });
  } catch {
    try {
      // Windows 10+ ships bsdtar, which reads zip files
      execFileSync('tar', ['-xf', root, '-C', temp], { stdio: 'inherit' });
    } catch {
      console.error('Could not extract the zip. Extract it yourself and pass the folder instead.');
      process.exit(1);
    }
  }
  root = temp;
}

/** Find the folder that holds charting_library.standalone.js (the library may be nested). */
function find(dir, depth = 0) {
  if (existsSync(join(dir, 'charting_library.standalone.js'))) return dir;
  if (depth > 3) return null;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      const hit = find(p, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

const lib = find(root);
if (!lib) {
  console.error(`No charting_library.standalone.js found under ${src}.`);
  process.exit(1);
}

const dest = resolve('public/charting_library');
rmSync(dest, { recursive: true, force: true });
cpSync(lib, dest, {
  recursive: true,
  // the chart keeps its left-to-right layout, so the RTL stylesheets are not needed
  filter: (p) => !p.endsWith('.rtl.css'),
});
if (temp) rmSync(temp, { recursive: true, force: true });
console.log(`TradingView Advanced Charts installed in ${dest}`);
