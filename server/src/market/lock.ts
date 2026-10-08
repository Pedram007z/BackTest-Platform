import { HttpError } from '../http';

/** One job at a time writes the market storage: a download (download.ts) or an import (importer.ts). */
type Holder = 'download' | 'import';
let holder: Holder | null = null;

export function claimStore(kind: Holder) {
  if (holder === 'download') throw new HttpError(409, 'busy', 'یک دانلود در حال انجام است؛ صبر کنید تا تمام شود یا آن را متوقف کنید.');
  if (holder === 'import') throw new HttpError(409, 'busy', 'دریافت تاریخچه‌ی آماده از GitHub در حال انجام است؛ صبر کنید تا تمام شود یا آن را متوقف کنید.');
  holder = kind;
}

export function releaseStore(kind: Holder) {
  if (holder === kind) holder = null;
}
