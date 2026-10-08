import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { config } from '../config';
import { badRequest } from '../http';
import type { MarketImportJob, MarketImportStatus } from '../shared';
import { UpstreamError, fetchWithTimeout, limiter } from '../util';
import { INSTRUMENTS } from './instruments';
import { claimStore, releaseStore } from './lock';
import { coveredDays, monthFilePath, refreshCoverage, writeMonthFile } from './store';

/**
 * Ready-made market history from a GitHub repository branch that holds store/<SYMBOL>/<YYYY>-<MM>.m1,
 * the storage's own month files (this platform's market-data branch by default). Started from the
 * admin panel. A month is downloaded only when the server lacks it or its copy differs; it replaces
 * the server's copy only when it covers more days. Running it again fetches only what changed.
 */

const PARALLEL = 4;
const RETRIES = 2;
const FILE = /^store\/([A-Z0-9]+)\/(\d{4}-\d{2})\.m1$/;

let job: MarketImportJob | null = null;
let lastJob: MarketImportJob | null = null;
let stopping = false;
let finished: Promise<MarketImportJob | null> = Promise.resolve(null);

const clone = <T>(v: T): T => (v ? JSON.parse(JSON.stringify(v)) : v);
const headers = (accept: string) => ({
  'User-Agent': 'backtestlab-server',
  Accept: accept,
  ...(config.marketDataToken ? { Authorization: `Bearer ${config.marketDataToken}` } : {}),
});

/** Git's id of a file's content, to tell whether the server's copy is the same file. */
const blobSha = (data: Uint8Array) => createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');

interface Entry {
  path: string;
  symbol: string;
  month: string;
  size: number;
  sha: string;
}

/** The branch's month files (one request to GitHub's API). */
async function listFiles(repo: string, branch: string): Promise<Entry[]> {
  const url = `${config.githubApiUrl}/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const res = await fetchWithTimeout(url, { headers: headers('application/vnd.github+json') }, 60_000);
  if (res.status === 404) throw new UpstreamError(`GitHub: مخزن ${repo} یا شاخه‌ی ${branch} پیدا نشد (اگر مخزن خصوصی است MARKET_DATA_TOKEN را تنظیم کنید).`, 404);
  if (res.status === 401 || res.status === 403) throw new UpstreamError(`GitHub: دسترسی رد شد (HTTP ${res.status}). توکن MARKET_DATA_TOKEN را بررسی کنید.`, res.status);
  if (!res.ok) throw new UpstreamError(`GitHub: HTTP ${res.status}`, res.status);
  const data = (await res.json()) as { tree?: { path: string; type: string; size?: number; sha: string }[]; truncated?: boolean };
  if (!Array.isArray(data.tree)) throw new UpstreamError('GitHub: پاسخ نامعتبر');
  if (data.truncated) throw new UpstreamError('GitHub: فهرست فایل‌ها کامل نیامد (truncated).');
  const out: Entry[] = [];
  for (const t of data.tree) {
    const m = FILE.exec(t.path);
    if (t.type !== 'blob' || !m || !INSTRUMENTS[m[1]]) continue;
    out.push({ path: t.path, symbol: m[1], month: m[2], size: Number(t.size) || 0, sha: t.sha });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

async function download(repo: string, branch: string, e: Entry): Promise<Uint8Array> {
  const path = e.path.split('/').map(encodeURIComponent).join('/');
  const url = `${config.githubRawUrl}/${repo}/${encodeURIComponent(branch)}/${path}`;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { headers: headers('application/octet-stream') }, 120_000);
      if (!res.ok) throw new UpstreamError(`HTTP ${res.status}`, res.status);
      const data = new Uint8Array(await res.arrayBuffer());
      if (data.length !== e.size || blobSha(data) !== e.sha) throw new UpstreamError('فایل ناقص دریافت شد');
      return data;
    } catch (err) {
      const status = (err as UpstreamError).status ?? 0;
      if (attempt >= RETRIES || (status >= 400 && status < 500 && status !== 429)) throw err;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
}

async function run(j: MarketImportJob): Promise<MarketImportJob> {
  try {
    const files = await listFiles(j.repo, j.branch);
    j.total = files.length;
    j.totalBytes = files.reduce((n, f) => n + f.size, 0);
    const queue = limiter(PARALLEL);
    await Promise.all(
      files.map((e) =>
        queue(async () => {
          if (stopping || j.state !== 'running') return;
          j.current = `${e.symbol} ${e.month}`;
          const file = monthFilePath(e.symbol, e.month);
          const local = existsSync(file) ? readFileSync(file) : null;
          try {
            if (local && blobSha(local) === e.sha) {
              j.kept++;
              return;
            }
            const data = await download(j.repo, j.branch, e);
            j.bytes += data.length;
            const days = coveredDays(data);
            if (days < 0) throw new Error('فایل ماه معتبر نیست');
            if (local && coveredDays(local) >= days) j.kept++;
            else {
              writeMonthFile(e.symbol, e.month, data);
              if (local) j.replaced++;
              else j.added++;
            }
          } catch (err) {
            j.failed++;
            j.errors.push({ file: e.path, error: (err as Error).message });
            if (j.errors.length > 30) j.errors.shift();
          } finally {
            j.done++;
          }
        }),
      ),
    );
    if (j.state === 'running') j.state = stopping ? 'stopped' : 'done';
  } catch (err) {
    j.state = 'failed';
    j.message = (err as Error).message;
  }
  refreshCoverage();
  j.current = undefined;
  j.finishedAt = Date.now();
  console.log(`[market] import ${j.state}: ${j.added} months added, ${j.replaced} replaced, ${j.kept} kept, ${j.failed} failed (${j.repo}@${j.branch})`);
  lastJob = j;
  job = null;
  stopping = false;
  releaseStore('import');
  return j;
}

const REPO = /^[\w.-]+\/[\w.-]+$/;
const BRANCH = /^[\w./-]{1,100}$/;

/** Start an import (one storage job at a time). */
export function startImport(input: { repo?: unknown; branch?: unknown }): MarketImportJob {
  const repo = input.repo === undefined || input.repo === '' ? config.marketDataRepo : String(input.repo).trim();
  const branch = input.branch === undefined || input.branch === '' ? config.marketDataBranch : String(input.branch).trim();
  if (!REPO.test(repo)) throw badRequest('repo', 'نام مخزن به شکل owner/repo است.', 'repo');
  if (!BRANCH.test(branch) || branch.includes('..')) throw badRequest('branch', 'نام شاخه معتبر نیست.', 'branch');
  claimStore('import');
  const j: MarketImportJob = {
    repo,
    branch,
    state: 'running',
    total: 0,
    done: 0,
    added: 0,
    replaced: 0,
    kept: 0,
    failed: 0,
    bytes: 0,
    totalBytes: 0,
    errors: [],
    startedAt: Date.now(),
  };
  job = j;
  stopping = false;
  finished = run(j);
  return clone(j);
}

/** Stop after the files being downloaded now; what was stored stays. */
export function stopImport() {
  if (job) stopping = true;
  return clone(job);
}

export const importFinished = () => finished;

export function importStatus(): MarketImportStatus {
  return { repo: config.marketDataRepo, branch: config.marketDataBranch, tokenSet: config.marketDataToken !== '', job: clone(job), lastJob: clone(lastJob) };
}
