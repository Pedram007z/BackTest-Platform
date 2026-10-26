import clsx from 'clsx';
import { Eye, ImagePlus, Megaphone, Pencil, Plus, RefreshCw, Trash2, Upload, Video } from 'lucide-react';
import { useRef, useState } from 'react';
import { AnnouncementDialog } from '../../components/AnnouncementPopup';
import { Badge, Field, Loading, PageHeader, act, dateTime, useLoad } from '../../components/admin/kit';
import { DatePicker } from '../../components/ui/DatePicker';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { EmptyState, Meter, Select, Toggle } from '../../components/ui/controls';
import { addDays, fmtDayLong, localDayKey } from '../../lib/calendar';
import { fmtNum } from '../../lib/format';
import { BackendError, backend } from '../../services';
import type { AnnouncementInput } from '../../services/backend';
import { mediaSrc } from '../../services/api';
import { MEDIA_MAX_BYTES, MEDIA_TYPES, type Announcement, type AnnouncementMedia } from '../../services/types';

/** Popup messages for visitors, with an optional picture or video. */

const PLACEMENTS: { value: Announcement['placement']; label: string }[] = [
  { value: 'both', label: 'صفحه‌ی اصلی سایت و داشبورد' },
  { value: 'site', label: 'فقط صفحه‌ی اصلی سایت' },
  { value: 'app', label: 'فقط داشبورد کاربران' },
];
const AUDIENCES: { value: Announcement['audience']; label: string }[] = [
  { value: 'everyone', label: 'همه‌ی بازدیدکنندگان' },
  { value: 'users', label: 'فقط کاربرانی که وارد شده‌اند' },
];
const placementLabel = (p: Announcement['placement']) => (p === 'both' ? 'سایت و داشبورد' : p === 'site' ? 'صفحه‌ی اصلی سایت' : 'داشبورد');
const MB = 1024 * 1024;
const fmtSize = (n: number) => (n >= MB ? `${fmtNum(n / MB, 1)} مگابایت` : `${fmtNum(Math.max(1, Math.round(n / 1024)))} کیلوبایت`);

interface Draft {
  id: string;
  isNew: boolean;
  title: string;
  body: string;
  media?: AnnouncementMedia;
  buttonLabel: string;
  buttonUrl: string;
  audience: Announcement['audience'];
  placement: Announcement['placement'];
  startsAt?: string;
  endsAt?: string;
  active: boolean;
  showAgain: boolean;
}

const newId = () => `ann_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const blank = (): Draft => ({
  id: newId(),
  isNew: true,
  title: '',
  body: '',
  buttonLabel: '',
  buttonUrl: '',
  audience: 'everyone',
  placement: 'both',
  active: true,
  showAgain: false,
});
const toDraft = (a: Announcement): Draft => ({
  id: a.id,
  isNew: false,
  title: a.title,
  body: a.body,
  media: a.media,
  buttonLabel: a.button?.label ?? '',
  buttonUrl: a.button?.url ?? '',
  audience: a.audience,
  placement: a.placement,
  startsAt: a.startsAt,
  endsAt: a.endsAt,
  active: a.active,
  showAgain: false,
});
const toInput = (d: Draft): AnnouncementInput => ({
  id: d.id,
  title: d.title,
  body: d.body,
  mediaId: d.media?.id,
  button: d.buttonLabel.trim() || d.buttonUrl.trim() ? { label: d.buttonLabel, url: d.buttonUrl } : undefined,
  audience: d.audience,
  placement: d.placement,
  startsAt: d.startsAt,
  endsAt: d.endsAt,
  active: d.active,
  showAgain: d.showAgain,
});

function status(a: Announcement, today: string): { label: string; tone: 'gain' | 'amber' | 'muted' } {
  if (!a.active) return { label: 'غیرفعال', tone: 'muted' };
  if (a.startsAt && a.startsAt > today) return { label: `از ${fmtDayLong(a.startsAt)}`, tone: 'amber' };
  if (a.endsAt && a.endsAt < today) return { label: 'پایان یافته', tone: 'muted' };
  return { label: 'در حال نمایش', tone: 'gain' };
}

function MediaThumb({ media }: { media?: AnnouncementMedia }) {
  if (!media) {
    return (
      <span className="flex h-full w-full items-center justify-center text-faint">
        <Megaphone size={26} />
      </span>
    );
  }
  return media.kind === 'video' ? (
    <span className="relative block h-full w-full">
      <video src={mediaSrc(media.url)} className="h-full w-full object-cover" muted playsInline preload="metadata" />
      <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
        <Video size={11} /> ویدیو
      </span>
    </span>
  ) : (
    <img src={mediaSrc(media.url)} alt="" className="h-full w-full object-cover" />
  );
}

/** Picks, uploads and shows the message's picture or video. */
function MediaField({ media, onChange, onBusy }: { media?: AnnouncementMedia; onChange: (m?: AnnouncementMedia) => void; onBusy: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    const kind = MEDIA_TYPES[file.type];
    if (!kind) return setError('فقط تصویر (JPG، PNG، WebP، GIF) یا ویدیو (MP4، WebM، MOV) پذیرفته می‌شود.');
    if (file.size > MEDIA_MAX_BYTES[kind]) return setError(`حداکثر حجم ${kind === 'image' ? 'تصویر' : 'ویدیو'} ${fmtNum(MEDIA_MAX_BYTES[kind] / MB)} مگابایت است.`);
    setProgress(0);
    onBusy(true);
    try {
      onChange(await backend.admin.uploadMedia(file, setProgress));
    } catch (e) {
      setError(e instanceof BackendError ? e.message : 'بارگذاری انجام نشد.');
    } finally {
      setProgress(null);
      onBusy(false);
    }
  };

  return (
    <div>
      <span className="label">تصویر یا ویدیو (اختیاری)</span>
      <input
        ref={input}
        type="file"
        className="hidden"
        accept={Object.keys(MEDIA_TYPES).join(',')}
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {progress !== null ? (
        <div className="rounded-xl border border-line p-4">
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-muted">
              <Upload size={15} /> در حال بارگذاری…
            </span>
            <span className="num">{fmtNum(Math.round(progress * 100))}٪</span>
          </div>
          <Meter value={progress} tone="accent" />
        </div>
      ) : media ? (
        <div className="overflow-hidden rounded-xl border border-line">
          {media.kind === 'video' ? (
            <video src={mediaSrc(media.url)} className="block max-h-64 w-full bg-black" controls playsInline preload="metadata" />
          ) : (
            <img src={mediaSrc(media.url)} alt="" className="block max-h-64 w-full bg-raised object-contain" />
          )}
          <div className="flex flex-wrap items-center gap-2 border-t border-line/70 px-3 py-2 text-[12px]">
            <span className="min-w-0 flex-1 truncate text-muted" dir="auto" title={media.name}>
              {media.kind === 'video' ? 'ویدیو' : 'تصویر'} · {media.name} · {fmtSize(media.size)}
            </span>
            <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => input.current?.click()}>
              <RefreshCw size={13} /> تعویض
            </button>
            <button type="button" className="btn-ghost px-2.5 py-1 text-xs text-loss" onClick={() => onChange(undefined)}>
              <Trash2 size={13} /> حذف فایل
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void pick(e.dataTransfer.files?.[0]);
          }}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-7 text-center text-muted transition hover:border-accent/60 hover:text-ink"
        >
          <ImagePlus size={26} />
          <span className="text-sm font-semibold">انتخاب یا رها کردن فایل</span>
          <span className="text-[11px] leading-5 text-faint">تصویر JPG، PNG، WebP یا GIF تا ۱۰ مگابایت · ویدیو MP4 (پخش در همه‌ی مرورگرها)، WebM یا MOV تا ۱۰۰ مگابایت</span>
        </button>
      )}
      {error && <p className="mt-1.5 text-[12px] text-loss">{error}</p>}
    </div>
  );
}

function Editor({ draft: initial, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const today = localDayKey();
  const min = addDays(today, -365);
  const max = addDays(today, 3650);
  const button = d.buttonLabel.trim() ? { label: d.buttonLabel.trim(), url: d.buttonUrl.trim() } : undefined;

  return (
    <>
      <Modal
        open
        size="lg"
        onClose={onClose}
        title={d.isNew ? 'اعلان جدید' : 'ویرایش اعلان'}
        footer={
          <>
            <button type="button" className="btn-ghost me-auto" disabled={!d.title.trim()} onClick={() => setPreview(true)}>
              <Eye size={15} /> پیش‌نمایش
            </button>
            <button type="button" className="btn-ghost" onClick={onClose}>
              انصراف
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={saving || uploading || d.title.trim().length < 2}
              onClick={async () => {
                setSaving(true);
                const r = await act(backend.admin.saveAnnouncement(toInput(d)), 'اعلان ذخیره شد');
                setSaving(false);
                if (r) onSaved();
              }}
            >
              {d.isNew ? 'انتشار' : 'ذخیره'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="عنوان" htmlFor="an-title">
              <input id="an-title" className="field" maxLength={120} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="مثلاً: ۲۰٪ تخفیف اولین خرید" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="متن پیام" htmlFor="an-body" hint={`${fmtNum(d.body.length)} از ۴۰۰۰ حرف`}>
              <textarea id="an-body" className="field min-h-[120px] leading-7" maxLength={4000} value={d.body} onChange={(e) => set({ body: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <MediaField media={d.media} onChange={(media) => set({ media })} onBusy={setUploading} />
          </div>
          <Field label="متن دکمه (اختیاری)" htmlFor="an-blabel">
            <input id="an-blabel" className="field" maxLength={40} value={d.buttonLabel} onChange={(e) => set({ buttonLabel: e.target.value })} placeholder="مثلاً: خرید اشتراک" />
          </Field>
          <Field label="نشانی دکمه" htmlFor="an-burl" hint="صفحه‌ای از سایت مثل /billing یا نشانی کامل https://…">
            <input id="an-burl" className="field" dir="ltr" value={d.buttonUrl} onChange={(e) => set({ buttonUrl: e.target.value })} placeholder="/billing" />
          </Field>
          <Field label="محل نمایش" htmlFor="an-place">
            <Select id="an-place" value={d.placement} options={PLACEMENTS} onChange={(placement) => set({ placement })} />
          </Field>
          <Field label="مخاطب" htmlFor="an-aud" hint={d.placement === 'app' ? 'داشبورد فقط برای کاربران واردشده است.' : undefined}>
            <Select id="an-aud" value={d.audience} options={AUDIENCES} onChange={(audience) => set({ audience })} />
          </Field>
          <div>
            <span className="label">شروع نمایش</span>
            <DatePicker
              id="an-start"
              value={d.startsAt ?? ''}
              onChange={(startsAt) => set({ startsAt })}
              min={min}
              max={max}
              rangeWith={d.endsAt ?? ''}
              placeholder="از همین حالا"
            />
            {d.startsAt && (
              <button type="button" className="mt-1 text-[11px] text-accent-ink hover:underline" onClick={() => set({ startsAt: undefined })}>
                از همین حالا
              </button>
            )}
          </div>
          <div>
            <span className="label">پایان نمایش</span>
            <DatePicker
              id="an-end"
              value={d.endsAt ?? ''}
              onChange={(endsAt) => set({ endsAt })}
              min={d.startsAt ?? min}
              max={max}
              rangeWith={d.startsAt ?? ''}
              placeholder="بدون پایان"
            />
            {d.endsAt && (
              <button type="button" className="mt-1 text-[11px] text-accent-ink hover:underline" onClick={() => set({ endsAt: undefined })}>
                بدون پایان
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Toggle checked={d.active} onChange={(active) => set({ active })} label="فعال" /> فعال
          </label>
          {!d.isNew && (
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <Toggle checked={d.showAgain} onChange={(showAgain) => set({ showAgain })} label="نمایش دوباره" /> دوباره به کسانی که این پیام را بسته‌اند نشان داده شود
              </label>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                هر بازدیدکننده هر پیام را یک بار می‌بیند؛ با روشن کردن این گزینه، بعد از ذخیره یک بار دیگر برایشان باز می‌شود.
              </p>
            </div>
          )}
        </div>
      </Modal>
      {preview && <AnnouncementDialog a={{ title: d.title.trim(), body: d.body.trim(), media: d.media, button }} onClose={() => setPreview(false)} preview />}
    </>
  );
}

export function AdminAnnouncements() {
  const list = useLoad(() => backend.admin.announcements());
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [previewing, setPreviewing] = useState<Announcement | null>(null);
  const today = localDayKey();

  const toggle = async (a: Announcement) => {
    const r = await act(backend.admin.saveAnnouncement(toInput({ ...toDraft(a), active: !a.active })), a.active ? 'اعلان غیرفعال شد' : 'اعلان فعال شد');
    if (r) void list.reload();
  };

  return (
    <>
      <PageHeader
        title="اعلان‌ها"
        text="پیامی که هنگام باز کردن سایت یا داشبورد در یک پنجره برای بازدیدکننده باز می‌شود؛ با تصویر یا ویدیو. هر کس هر پیام را یک بار می‌بیند."
        onReload={list.reload}
        loading={list.loading}
        actions={
          <button type="button" className="btn-primary" onClick={() => setEditing(blank())}>
            <Plus size={16} /> اعلان جدید
          </button>
        }
      />
      {!list.data ? (
        <Loading />
      ) : list.data.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Megaphone size={22} />}
            title="هنوز اعلانی ساخته نشده"
            text="مثلاً تخفیف، قابلیت تازه یا اطلاعیه‌ی به‌روزرسانی را با یک تصویر یا ویدیو به همه نشان دهید."
            action={
              <button type="button" className="btn-primary" onClick={() => setEditing(blank())}>
                <Plus size={16} /> اعلان جدید
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.data.map((a) => {
            const st = status(a, today);
            return (
              <div key={a.id} className={clsx('card flex flex-col overflow-hidden', !a.active && 'opacity-75')}>
                <button type="button" className="block h-40 w-full overflow-hidden bg-raised" onClick={() => setPreviewing(a)} aria-label={`پیش‌نمایش ${a.title}`}>
                  <MediaThumb media={a.media} />
                </button>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <Badge>{placementLabel(a.placement)}</Badge>
                    {a.audience === 'users' && <Badge tone="accent">فقط کاربران</Badge>}
                  </div>
                  <p className="font-semibold leading-7">{a.title}</p>
                  {a.body && <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-muted">{a.body}</p>}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-faint">
                    <span>
                      <Eye size={12} className="inline align-[-2px]" /> {fmtNum(a.views)} بازدید
                    </span>
                    {a.endsAt && <span>تا {fmtDayLong(a.endsAt)}</span>}
                    <span>ویرایش {dateTime(a.updatedAt)}</span>
                  </div>
                  <div className="mt-auto flex items-center gap-1 pt-3">
                    <Toggle checked={a.active} onChange={() => void toggle(a)} label={a.active ? `غیرفعال کردن ${a.title}` : `فعال کردن ${a.title}`} />
                    <span className="ms-2 text-[12px] text-muted">{a.active ? 'فعال' : 'غیرفعال'}</span>
                    <div className="ms-auto flex gap-1">
                      <button type="button" className="icon-btn h-8 w-8" onClick={() => setPreviewing(a)} aria-label={`پیش‌نمایش ${a.title}`} title="پیش‌نمایش">
                        <Eye size={15} />
                      </button>
                      <button type="button" className="icon-btn h-8 w-8" onClick={() => setEditing(toDraft(a))} aria-label={`ویرایش ${a.title}`} title="ویرایش">
                        <Pencil size={15} />
                      </button>
                      <button type="button" className="icon-btn h-8 w-8 hover:text-loss" onClick={() => setDeleting(a)} aria-label={`حذف ${a.title}`} title="حذف">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Editor
          key={editing.id}
          draft={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void list.reload();
          }}
        />
      )}
      {previewing && <AnnouncementDialog a={previewing} onClose={() => setPreviewing(null)} preview />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="حذف اعلان"
        message={`اعلان «${deleting?.title}» و فایل آن حذف می‌شود.`}
        confirmLabel="حذف اعلان"
        onConfirm={async () => {
          if (deleting && (await act(backend.admin.deleteAnnouncement(deleting.id), 'اعلان حذف شد')) !== null) void list.reload();
        }}
      />
    </>
  );
}
