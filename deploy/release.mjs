// Builds the web app and the API server into release/backtestlab, ready to upload to the server.
//
//   npm run release -- https://backtestlab.ir
//
// The address is where the site will be served; the app calls its API at <address>/api/.
// Works on Windows, macOS and Linux (needs Node 20.12+ and npm).
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteUrl = (process.argv[2] ?? '').replace(/\/$/, '');
if (!/^https?:\/\/[^/]+$/.test(siteUrl)) {
  console.error('Usage: npm run release -- https://your-domain.ir');
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'release', 'backtestlab');
const run = (cmd, cwd = root, env = {}) => {
  console.log(`\n› ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });
};

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'server'), { recursive: true });

if (!existsSync(join(root, 'public', 'charting_library'))) {
  console.log('Note: TradingView library not installed (npm run setup:charts); the chart page will use its built-in engine.');
}

run('npm ci --no-audit --no-fund');
run('npm run build', root, { VITE_API_URL: siteUrl });
cpSync(join(root, 'dist'), join(out, 'web'), { recursive: true });

const server = join(root, 'server');
run('npm ci --no-audit --no-fund', server);
run('npm test', server);
run('npm run build', server);
cpSync(join(server, 'dist', 'server.mjs'), join(out, 'server', 'server.mjs'));
cpSync(join(server, '.env.example'), join(out, 'server', 'env.example'));
for (const f of ['backtestlab.service', 'nginx-site.conf', 'relay-nginx.conf']) cpSync(join(root, 'deploy', f), join(out, f));
cpSync(join(root, 'DEPLOY.md'), join(out, 'DEPLOY.md'));
writeFileSync(join(out, 'VERSION.txt'), `built ${new Date().toISOString()} for ${siteUrl}\n`);

let archive = '';
try {
  const name = `backtestlab-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.tar.gz`;
  execSync(`tar -czf ${name} backtestlab`, { cwd: join(root, 'release'), stdio: 'ignore' });
  archive = join(root, 'release', name);
} catch {
  /* no tar: upload the folder instead */
}
console.log(`\nDone: ${out}${archive ? `\nArchive: ${archive}` : ''}\nNext: DEPLOY.md, step 3.`);
