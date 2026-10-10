import clsx from 'clsx';
import { CloudCheck, CloudOff, CloudUpload } from 'lucide-react';
import { useSyncStatus, type SyncState } from '../../services/workspaceSync';

const clock = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** Saving to the server, in a word (header icon, settings). */
export function syncText(state: SyncState, savedAt: number, message?: string): string {
  switch (state) {
    case 'loading':
    case 'syncing':
      return 'در حال ذخیره روی سرور…';
    case 'saved':
      return savedAt ? `روی سرور ذخیره شد (ساعت ${clock.format(savedAt)})` : 'روی سرور ذخیره شد';
    case 'offline':
      return 'اتصال برقرار نیست؛ تغییرات در همین دستگاه نگه داشته می‌شوند و پس از اتصال ذخیره می‌شوند.';
    case 'error':
      return message ? `ذخیره روی سرور انجام نشد: ${message}` : 'ذخیره روی سرور انجام نشد؛ دوباره تلاش می‌شود.';
    default:
      return '';
  }
}

/** Header icon: whether this browser's changes are saved on the server. */
export function SyncBadge() {
  const { state, savedAt, message } = useSyncStatus();
  if (state === 'off') return null;
  const text = syncText(state, savedAt, message);
  const Icon = state === 'offline' || state === 'error' ? CloudOff : state === 'saved' ? CloudCheck : CloudUpload;
  return (
    <span
      className={clsx('icon-btn cursor-default', state === 'offline' && 'text-amber', state === 'error' && 'text-loss', (state === 'syncing' || state === 'loading') && 'animate-pulse')}
      title={text}
      aria-label={text}
      role="status"
    >
      <Icon size={19} />
    </span>
  );
}
