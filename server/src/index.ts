// `node server.mjs` runs the API server; `node server.mjs download [options]` downloads market history
// into the data folder (see market/cli.ts, or `node server.mjs download --help`).
const [command, ...args] = process.argv.slice(2);
const dataDir = args.find((a) => a.startsWith('--data-dir='));
if (dataDir) process.env.DATA_DIR = dataDir.slice('--data-dir='.length);

if (command === 'download') {
  const { runDownloadCli } = await import('./market/cli');
  process.exit(await runDownloadCli(args));
} else if (command === 'hash-password') {
  // the admin password hash for ADMIN_PASSWORD_HASH (make-admin.sh --username uses it)
  const { runHashPassword } = await import('./password');
  process.exit(await runHashPassword());
} else {
  await import('./server');
}

export {};
