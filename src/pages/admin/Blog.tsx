import clsx from 'clsx';
import {
  ArrowRight,
  Bold,
  CheckCircle2,
  Code2,
  ExternalLink,
  Eye,
  FileText,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Newspaper,
  Pencil,
  Plus,
  Quote,
  RefreshCw,
  Search,
  Table2,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Field, Loading, PageHeader, act, dateTime, useLoad } from '../../components/admin/kit';
import { Link } from '../../components/ui/AppLink';
import { DatePicker } from '../../components/ui/DatePicker';
import { ConfirmDialog } from '../../components/ui/Modal';
import { EmptyState, Meter, Select } from '../../components/ui/controls';
import { addDays, localDayKey } from '../../lib/calendar';
import { fmtNum } from '../../lib/format';
import { renderMarkdown } from '../../lib/markdown';
import { mediaUrl } from '../../lib/mediaStore';
import { useGo } from '../../lib/nav';
import { BackendError, backend } from '../../services';
import { toast } from '../../store/useStore';
import { hasServer, mediaSrc } from '../../services/api';
import { BLOG_LIMITS, SEO_DESCRIPTION_RANGE, SEO_TITLE_RANGE, postIsPublic, readingMinutes, seoChecks, slugify, wordCount, type BlogPostInput } from '../../services/blog';
import { MEDIA_MAX_BYTES, type AnnouncementMedia, type BlogPost, type BlogPostSummary } from '../../services/types';

/**
 * The blog in the admin panel: the list of posts and the editor (Markdown with a toolbar and a
 * preview, cover picture, address, search-result title and description, tags, publishing time and a
 * checklist of what helps a post in Google). The public pages are rendered by the server at /blog.
 */

type Status = 'draft' | 'published' | 'scheduled';
const statusOf = (p: Pick<BlogPost, 'status' | 'publishedAt'>, now = Date.now()): Status => (p.status === 'draft' ? 'draft' : postIsPublic(p, now) ? 'published' : 'scheduled');
const STATUS_LABEL: Record<Status, string> = { draft: 'پیش‌نویس', published: 'منتشرشده', scheduled: 'زمان‌بندی‌شده' };
const STATUS_TONE: Record<Status, 'muted' | 'gain' | 'amber'> = { draft: 'muted', published: 'gain', scheduled: 'amber' };
/** Where visitors read a post (the server renders /blog on the site's own address). */
const postUrl = (slug: string) => `${window.location.origin}/blog/${encodeURIComponent(slug)}`;
const newId = () => `post_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Pictures in the text are written as /api/media/<id>; the preview needs an address the browser can load. */
function useMediaUrls(content: string): (html: string) => string {
  const ids = useMemo(() => [...new Set([...content.matchAll(/\/api\/media\/([\w-]+)/g)].map((m) => m[1]))], [content]);
  const [demoUrls, setDemoUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    if (hasServer) return;
    let alive = true;
    void Promise.all(ids.filter((id) => !demoUrls[id]).map(async (id) => [id, await mediaUrl(id)] as const)).then((pairs) => {
      if (alive && pairs.length) setDemoUrls((u) => ({ ...u, ...Object.fromEntries(pairs) }));
    });
    return () => {
      alive = false;
    };
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  return (html) => html.replace(/src="\/api\/media\/([\w-]+)"/g, (_, id: string) => `src="${hasServer ? mediaSrc(`/api/media/${id}`) : (demoUrls[id] ?? '')}"`);
}

// ---------- list ----------

export function AdminBlog() {
  const list = useLoad(() => backend.admin.blogPosts());
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [deleting, setDeleting] = useState<BlogPostSummary | null>(null);
  const go = useGo();
  const now = Date.now();
  const rows = (list.data ?? []).filter((p) => (filter === 'all' || statusOf(p, now) === filter) && (!q.trim() || `${p.title} ${p.slug} ${p.tags.join(' ')}`.includes(q.trim())));
  const count = (s: Status) => (list.data ?? []).filter((p) => statusOf(p, now) === s).length;

  return (
    <>
      <PageHeader
        title="بلاگ"
        text="مقاله‌هایی که در نشانی ⁦/blog⁩ سایت منتشر می‌شوند؛ صفحه‌ها برای گوگل آماده‌اند (عنوان و توضیح، نقشه‌ی سایت، RSS)."
        onReload={list.reload}
        loading={list.loading}
        actions={
          <>
            {hasServer && (
              <a className="btn-ghost border border-line" href="/blog" target="_blank" rel="noopener noreferrer">
                <ExternalLink size={15} /> دیدن بلاگ
              </a>
            )}
            <button type="button" className="btn-primary" onClick={() => go('/admin/blog/new')}>
              <Plus size={16} /> مقاله‌ی جدید
            </button>
          </>
        }
      />
      {!list.data ? (
        <Loading />
      ) : list.data.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Newspaper size={22} />}
            title="هنوز مقاله‌ای ننوشته‌اید"
            text="مقاله‌های آموزشی (مثل «بک‌تست چیست؟» یا «مدیریت ریسک در فارکس») بازدید از گوگل می‌آورند و کاربر تازه جذب می‌کنند."
            action={
              <button type="button" className="btn-primary" onClick={() => go('/admin/blog/new')}>
                <Plus size={16} /> مقاله‌ی جدید
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line/70 p-3">
            <label className="relative min-w-[200px] flex-1">
              <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint" />
              <input className="field ps-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو در عنوان، نشانی یا برچسب" aria-label="جستجوی مقاله" />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'published', 'scheduled', 'draft'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={clsx(
                    'rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition',
                    filter === f ? 'border-accent/60 bg-accent/12 text-ink' : 'border-line text-muted hover:text-ink',
                  )}
                >
                  {f === 'all' ? `همه (${fmtNum(list.data?.length ?? 0)})` : `${STATUS_LABEL[f]} (${fmtNum(count(f))})`}
                </button>
              ))}
            </div>
          </div>
          {rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">مقاله‌ای با این مشخصات نیست.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {rows.map((p) => {
                const st = statusOf(p, now);
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap">
                    <Link to={`/admin/blog/${p.id}`} className="block h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-raised" aria-label={`ویرایش ${p.title}`}>
                      {p.cover ? (
                        <img src={mediaSrc(p.cover.url)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-faint">
                          <FileText size={20} />
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={STATUS_TONE[st]}>{STATUS_LABEL[st]}</Badge>
                        <Link to={`/admin/blog/${p.id}`} className="truncate font-semibold hover:text-accent-ink">
                          {p.title}
                        </Link>
                      </div>
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-faint">
                        <span dir="ltr" className="truncate">
                          /blog/{p.slug}
                        </span>
                        <span>
                          {st === 'draft' ? `ویرایش ${dateTime(p.updatedAt)}` : `${st === 'scheduled' ? 'انتشار' : 'منتشرشده'} ${dateTime(p.publishedAt ?? p.updatedAt)}`}
                        </span>
                        <span>{fmtNum(p.readingMinutes)} دقیقه مطالعه</span>
                        <span>
                          <Eye size={11} className="inline align-[-1px]" /> {fmtNum(p.views)} بازدید
                        </span>
                        {p.tags.length > 0 && <span>{p.tags.join('، ')}</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {hasServer && st === 'published' && (
                        <a
                          className="icon-btn h-8 w-8"
                          href={postUrl(p.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`دیدن ${p.title} در سایت`}
                          title="دیدن در سایت"
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                      <Link to={`/admin/blog/${p.id}`} className="icon-btn h-8 w-8" aria-label={`ویرایش ${p.title}`} title="ویرایش">
                        <Pencil size={15} />
                      </Link>
                      <button type="button" className="icon-btn h-8 w-8 hover:text-loss" onClick={() => setDeleting(p)} aria-label={`حذف ${p.title}`} title="حذف">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="حذف مقاله"
        message={`مقاله‌ی «${deleting?.title}» حذف می‌شود و نشانی آن دیگر باز نمی‌شود.`}
        confirmLabel="حذف مقاله"
        onConfirm={async () => {
          if (deleting && (await act(backend.admin.deleteBlogPost(deleting.id), 'مقاله حذف شد')) !== null) void list.reload();
        }}
      />
    </>
  );
}

// ---------- editor ----------

interface Draft {
  id: string;
  isNew: boolean;
  title: string;
  slug: string;
  /** the address follows the title until the admin edits it */
  slugTouched: boolean;
  seoTitle: string;
  excerpt: string;
  content: string;
  cover?: AnnouncementMedia;
  coverAlt: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published';
  /** publication day (local) and time; empty for "when published" */
  day: string;
  time: string;
}

const blank = (): Draft => ({
  id: newId(),
  isNew: true,
  title: '',
  slug: '',
  slugTouched: false,
  seoTitle: '',
  excerpt: '',
  content: '',
  coverAlt: '',
  tags: [],
  author: '',
  status: 'draft',
  day: '',
  time: '',
});

const pad = (n: number) => String(n).padStart(2, '0');
function toDraft(p: BlogPost): Draft {
  const d = p.publishedAt ? new Date(p.publishedAt) : null;
  return {
    id: p.id,
    isNew: false,
    title: p.title,
    slug: p.slug,
    slugTouched: true,
    seoTitle: p.seoTitle ?? '',
    excerpt: p.excerpt,
    content: p.content,
    cover: p.cover,
    coverAlt: p.coverAlt ?? '',
    tags: p.tags,
    author: p.author,
    status: p.status,
    day: d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '',
    time: d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '',
  };
}

/** The chosen publication time (local day and time), or undefined for "now, when published". */
function publishedAtOf(d: Draft): number | undefined {
  if (!d.day) return undefined;
  const [y, m, day] = d.day.split('-').map(Number);
  const [hh, mm] = (d.time || '09:00').split(':').map(Number);
  return new Date(y, m - 1, day, hh, mm).getTime();
}

const toInput = (d: Draft): BlogPostInput => ({
  id: d.id,
  title: d.title,
  slug: d.slug || slugify(d.title),
  seoTitle: d.seoTitle,
  excerpt: d.excerpt,
  content: d.content,
  coverId: d.cover?.id,
  coverAlt: d.coverAlt,
  tags: d.tags,
  author: d.author,
  status: d.status,
  publishedAt: publishedAtOf(d),
});

type Format = 'h2' | 'h3' | 'bold' | 'italic' | 'link' | 'ul' | 'ol' | 'quote' | 'code' | 'table' | 'hr';

/** Applies a toolbar button to the text: returns the new text and the selection to restore. */
function format(text: string, start: number, end: number, kind: Format): { text: string; start: number; end: number } {
  const sel = text.slice(start, end);
  const wrap = (before: string, after: string, placeholder: string) => {
    const inner = sel || placeholder;
    return { text: text.slice(0, start) + before + inner + after + text.slice(end), start: start + before.length, end: start + before.length + inner.length };
  };
  const block = (snippet: string, selectFrom = 0, selectLen = 0) => {
    const before = start > 0 && text[start - 1] !== '\n' ? '\n\n' : '';
    const ins = before + snippet + '\n';
    const at = start + before.length + selectFrom;
    return { text: text.slice(0, start) + ins + text.slice(end), start: at, end: at + selectLen };
  };
  const prefix = (p: string | ((i: number) => string)) => {
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lines = text.slice(lineStart, end).split('\n');
    const out = lines.map((l, i) => (typeof p === 'string' ? p : p(i)) + l.replace(/^(#{1,4}|>|[-*+]|\d+[.)])\s+/, '')).join('\n');
    return { text: text.slice(0, lineStart) + out + text.slice(end), start: lineStart, end: lineStart + out.length };
  };
  switch (kind) {
    case 'h2':
      return prefix('## ');
    case 'h3':
      return prefix('### ');
    case 'bold':
      return wrap('**', '**', 'متن پررنگ');
    case 'italic':
      return wrap('*', '*', 'متن کج');
    case 'link': {
      const label = sel || 'متن لینک';
      const t = `[${label}](https://)`;
      const at = start + label.length + 3;
      return { text: text.slice(0, start) + t + text.slice(end), start: at, end: at + 8 };
    }
    case 'ul':
      return prefix('- ');
    case 'ol':
      return prefix((i) => `${i + 1}. `);
    case 'quote':
      return prefix('> ');
    case 'code':
      return sel.includes('\n') || !sel ? block('```\n' + (sel || 'کد') + '\n```', 4, (sel || 'کد').length) : wrap('`', '`', 'کد');
    case 'table':
      return block('| ستون ۱ | ستون ۲ |\n| --- | --- |\n| مقدار | مقدار |', 2, 6);
    case 'hr':
      return block('---');
  }
}

const TOOLS: { kind: Format; icon: ReactNode; label: string }[] = [
  { kind: 'h2', icon: <Heading2 size={16} />, label: 'تیتر' },
  { kind: 'h3', icon: <Heading3 size={16} />, label: 'زیرتیتر' },
  { kind: 'bold', icon: <Bold size={16} />, label: 'پررنگ' },
  { kind: 'italic', icon: <Italic size={16} />, label: 'کج' },
  { kind: 'link', icon: <Link2 size={16} />, label: 'لینک' },
  { kind: 'ul', icon: <List size={16} />, label: 'فهرست' },
  { kind: 'ol', icon: <ListOrdered size={16} />, label: 'فهرست شماره‌دار' },
  { kind: 'quote', icon: <Quote size={16} />, label: 'نقل قول' },
  { kind: 'code', icon: <Code2 size={16} />, label: 'کد' },
  { kind: 'table', icon: <Table2 size={16} />, label: 'جدول' },
  { kind: 'hr', icon: <Minus size={16} />, label: 'خط جداکننده' },
];

const MB = 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Uploads a picture (cover or in the text). */
async function uploadImage(file: File, onProgress: (f: number) => void): Promise<AnnouncementMedia> {
  if (!IMAGE_TYPES.includes(file.type)) throw new BackendError('type', 'فقط تصویر JPG، PNG، WebP یا GIF.');
  if (file.size > MEDIA_MAX_BYTES.image) throw new BackendError('too_large', `حداکثر حجم تصویر ${fmtNum(MEDIA_MAX_BYTES.image / MB)} مگابایت است.`);
  return backend.admin.uploadMedia(file, onProgress);
}

function Card({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('card p-4', className)}>
      <h2 className="mb-3 text-[13px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Counter({ n, range }: { n: number; range: readonly [number, number] }) {
  return <span className={clsx('num', n >= range[0] && n <= range[1] ? 'text-gain' : n > range[1] ? 'text-loss' : 'text-faint')}>{fmtNum(n)}</span>;
}

function TagsInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [text, setText] = useState('');
  const add = () => {
    const t = text.replace(/[،,]/g, ' ').replace(/\s+/g, ' ').trim();
    if (t && !tags.includes(t) && tags.length < BLOG_LIMITS.tags) onChange([...tags, t.slice(0, BLOG_LIMITS.tag)]);
    setText('');
  };
  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full border border-line bg-raised px-2.5 py-0.5 text-[12px]">
              {t}
              <button type="button" className="text-faint hover:text-loss" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`حذف برچسب ${t}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        id="bl-tags"
        className="field"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',' || e.key === '،') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder="مثلاً: آموزش، فارکس (Enter برای افزودن)"
      />
    </div>
  );
}

export function AdminBlogEditor() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const loaded = useLoad(() => (isNew ? Promise.resolve(null) : backend.admin.blogPost(id)), [id]);
  if (!isNew && !loaded.data) {
    return loaded.loading ? (
      <Loading />
    ) : (
      <div className="card">
        <EmptyState
          icon={<FileText size={22} />}
          title="مقاله پیدا نشد"
          text="ممکن است حذف شده باشد."
          action={
            <Link to="/admin/blog" className="btn-primary">
              همه‌ی مقاله‌ها
            </Link>
          }
        />
      </div>
    );
  }
  return <Editor key={id} initial={loaded.data ? toDraft(loaded.data) : blank()} />;
}

function Editor({ initial }: { initial: Draft }) {
  const go = useGo();
  const [d, setD] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [saving, setSaving] = useState(false);
  const [upload, setUpload] = useState<{ what: 'cover' | 'inline'; progress: number } | null>(null);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const inlineInput = useRef<HTMLInputElement>(null);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);
  const fixUrls = useMediaUrls(d.content);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const slug = d.slug || slugify(d.title);
  const words = wordCount(d.content);
  const checks = seoChecks({ ...toInput(d), slug, hasCover: !!d.cover });
  const score = checks.filter((c) => c.ok).length;
  const when = publishedAtOf(d);
  const scheduled = d.status === 'published' && when !== undefined && when > Date.now();
  const preview = useMemo(() => (tab === 'preview' ? renderMarkdown(d.content) : null), [tab, d.content]);
  const today = localDayKey();

  const applyFormat = (kind: Format) => {
    const ta = area.current;
    if (!ta) return;
    const r = format(d.content, ta.selectionStart, ta.selectionEnd, kind);
    set({ content: r.text });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(r.start, r.end);
    });
  };

  const insertImage = async (file: File | undefined) => {
    if (!file) return;
    const ta = area.current;
    const at = ta?.selectionStart ?? d.content.length;
    setUpload({ what: 'inline', progress: 0 });
    try {
      const m = await uploadImage(file, (progress) => setUpload({ what: 'inline', progress }));
      const alt = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ');
      setD((x) => {
        const before = at > 0 && x.content[at - 1] !== '\n' ? '\n\n' : '';
        return { ...x, content: `${x.content.slice(0, at)}${before}![${alt}](/api/media/${m.id})\n${x.content.slice(at)}` };
      });
    } catch (e) {
      setError({ message: e instanceof BackendError ? e.message : 'بارگذاری تصویر انجام نشد.' });
    } finally {
      setUpload(null);
    }
  };

  const pickCover = async (file: File | undefined) => {
    if (!file) return;
    setUpload({ what: 'cover', progress: 0 });
    try {
      const cover = await uploadImage(file, (progress) => setUpload({ what: 'cover', progress }));
      set({ cover, coverAlt: d.coverAlt || d.title });
    } catch (e) {
      setError({ field: 'cover', message: e instanceof BackendError ? e.message : 'بارگذاری تصویر انجام نشد.' });
    } finally {
      setUpload(null);
    }
  };

  const save = async (status: Draft['status']) => {
    const next = { ...d, status, slug };
    setSaving(true);
    setError(null);
    try {
      const p = await backend.admin.saveBlogPost(toInput(next));
      const fresh = toDraft(p);
      setD(fresh);
      setSaved(fresh);
      toast(status === 'draft' ? 'پیش‌نویس ذخیره شد' : scheduled ? 'مقاله زمان‌بندی شد' : 'مقاله منتشر شد');
      if (d.isNew) go(`/admin/blog/${p.id}`, { replace: true });
    } catch (e) {
      setError(e instanceof BackendError ? { field: e.field, message: e.message } : { message: 'ذخیره انجام نشد.' });
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (f: string) => (error?.field === f ? <p className="mt-1 text-[12px] text-loss">{error.message}</p> : null);
  const published = !d.isNew && saved.status === 'published' && !scheduled;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link to="/admin/blog" className="btn-ghost px-2.5">
          <ArrowRight size={16} /> همه‌ی مقاله‌ها
        </Link>
        <h1 className="font-display text-xl font-bold">{d.isNew ? 'مقاله‌ی جدید' : 'ویرایش مقاله'}</h1>
        {!d.isNew && (
          <Badge tone={STATUS_TONE[statusOf({ status: saved.status, publishedAt: publishedAtOf(saved) })]}>
            {STATUS_LABEL[statusOf({ status: saved.status, publishedAt: publishedAtOf(saved) })]}
          </Badge>
        )}
        {dirty && <span className="text-[12px] text-amber">تغییرات ذخیره نشده</span>}
        <div className="ms-auto flex flex-wrap gap-2">
          {hasServer && published && (
            <a className="btn-ghost border border-line" href={postUrl(saved.slug)} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={15} /> دیدن در سایت
            </a>
          )}
          <button type="button" className="btn-soft" disabled={saving || !!upload || d.title.trim().length < 3} onClick={() => void save('draft')}>
            {d.status === 'published' && !d.isNew ? 'برگرداندن به پیش‌نویس' : 'ذخیره‌ی پیش‌نویس'}
          </button>
          <button type="button" className="btn-primary" disabled={saving || !!upload || d.title.trim().length < 3} onClick={() => void save('published')}>
            {scheduled ? 'زمان‌بندی انتشار' : saved.status === 'published' && !d.isNew ? 'به‌روزرسانی' : 'انتشار'}
          </button>
        </div>
      </div>
      {error && !error.field && <p className="mb-4 rounded-xl bg-loss/10 px-3 py-2 text-[13px] text-loss">{error.message}</p>}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <label htmlFor="bl-title" className="sr-only">
              عنوان مقاله
            </label>
            <input
              id="bl-title"
              className="field h-auto py-3 text-lg font-bold"
              maxLength={BLOG_LIMITS.title}
              value={d.title}
              onChange={(e) => set({ title: e.target.value, ...(d.slugTouched ? {} : { slug: '' }) })}
              placeholder="عنوان مقاله"
            />
            {fieldError('title')}
          </div>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-0.5 border-b border-line/70 px-2 py-1.5">
              <div className="me-2 flex rounded-lg border border-line p-0.5 text-[12px] font-semibold">
                {(['write', 'preview'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={tab === t}
                    onClick={() => setTab(t)}
                    className={clsx('rounded-md px-2.5 py-1', tab === t ? 'bg-accent text-white' : 'text-muted hover:text-ink')}
                  >
                    {t === 'write' ? 'نوشتن' : 'پیش‌نمایش'}
                  </button>
                ))}
              </div>
              {tab === 'write' &&
                TOOLS.map((t) => (
                  <button key={t.kind} type="button" className="icon-btn h-8 w-8" title={t.label} aria-label={t.label} onClick={() => applyFormat(t.kind)}>
                    {t.icon}
                  </button>
                ))}
              {tab === 'write' && (
                <button type="button" className="icon-btn h-8 w-8" title="تصویر" aria-label="افزودن تصویر" disabled={!!upload} onClick={() => inlineInput.current?.click()}>
                  <ImagePlus size={16} />
                </button>
              )}
              <input
                ref={inlineInput}
                type="file"
                className="hidden"
                accept={IMAGE_TYPES.join(',')}
                onChange={(e) => {
                  void insertImage(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
            {upload?.what === 'inline' && (
              <div className="border-b border-line/70 px-3 py-2">
                <Meter value={upload.progress} tone="accent" />
              </div>
            )}
            {tab === 'write' ? (
              <textarea
                ref={area}
                id="bl-content"
                aria-label="متن مقاله"
                className="block min-h-[520px] w-full resize-y bg-transparent px-4 py-3 text-[15px] leading-8 outline-none"
                value={d.content}
                maxLength={BLOG_LIMITS.content}
                onChange={(e) => set({ content: e.target.value })}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const f = e.dataTransfer.files?.[0];
                  if (f) {
                    e.preventDefault();
                    void insertImage(f);
                  }
                }}
                placeholder={'متن مقاله را بنویسید…\n\n## تیتر بخش\nپاراگراف با **کلمه‌ی پررنگ** و [لینک](/signup).\n\n- مورد اول\n- مورد دوم'}
              />
            ) : (
              <article className="blog-prose min-h-[520px] px-5 py-4">
                {d.title && <h1>{d.title}</h1>}
                {d.cover && <img className="blog-cover" src={mediaSrc(d.cover.url)} alt={d.coverAlt} />}
                {preview && preview.html ? <div dangerouslySetInnerHTML={{ __html: fixUrls(preview.html) }} /> : <p className="text-muted">متنی برای نمایش نیست.</p>}
              </article>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line/70 px-4 py-2 text-[11.5px] text-faint">
              <span>{fmtNum(words)} کلمه</span>
              <span>{fmtNum(readingMinutes(d.content))} دقیقه مطالعه</span>
              <span>راهنما: ## تیتر · **پررنگ** · [متن](نشانی) · - فهرست · &gt; نقل قول · | جدول |</span>
            </div>
            {fieldError('content')}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <Card title="انتشار">
            <div className="flex flex-col gap-3">
              <Field label="وضعیت" htmlFor="bl-status">
                <Select
                  id="bl-status"
                  value={d.status}
                  options={[
                    { value: 'draft', label: 'پیش‌نویس (فقط در پنل)' },
                    { value: 'published', label: 'منتشرشده' },
                  ]}
                  onChange={(status) => set({ status })}
                />
              </Field>
              <div>
                <span className="label">زمان انتشار</span>
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  <DatePicker id="bl-day" value={d.day} onChange={(day) => set({ day })} min={addDays(today, -3650)} max={addDays(today, 365)} placeholder="هنگام انتشار" />
                  <input type="time" className="field num" dir="ltr" aria-label="ساعت انتشار" value={d.time} disabled={!d.day} onChange={(e) => set({ time: e.target.value })} />
                </div>
                <p className="mt-1 text-[11px] leading-5 text-muted">
                  {scheduled ? 'تا این زمان در سایت دیده نمی‌شود و بعد خودکار منتشر می‌شود.' : 'خالی بگذارید تا زمان انتشار همان لحظه‌ی انتشار باشد.'}
                </p>
                {d.day && (
                  <button type="button" className="mt-0.5 text-[11px] text-accent-ink hover:underline" onClick={() => set({ day: '', time: '' })}>
                    پاک کردن زمان
                  </button>
                )}
              </div>
              <Field label="نویسنده" htmlFor="bl-author" hint="خالی: نام سایت">
                <input id="bl-author" className="field" maxLength={BLOG_LIMITS.author} value={d.author} onChange={(e) => set({ author: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card title="تصویر شاخص">
            <input
              ref={coverInput}
              type="file"
              className="hidden"
              accept={IMAGE_TYPES.join(',')}
              onChange={(e) => {
                void pickCover(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            {upload?.what === 'cover' ? (
              <div className="rounded-xl border border-line p-4">
                <p className="mb-2 flex items-center gap-2 text-[13px] text-muted">
                  <Upload size={15} /> در حال بارگذاری… {fmtNum(Math.round(upload.progress * 100))}٪
                </p>
                <Meter value={upload.progress} tone="accent" />
              </div>
            ) : d.cover ? (
              <div className="overflow-hidden rounded-xl border border-line">
                <img src={mediaSrc(d.cover.url)} alt="" className="block aspect-video w-full bg-raised object-cover" />
                <div className="flex gap-2 border-t border-line/70 px-2 py-1.5">
                  <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => coverInput.current?.click()}>
                    <RefreshCw size={13} /> تعویض
                  </button>
                  <button type="button" className="btn-ghost px-2 py-1 text-xs text-loss" onClick={() => set({ cover: undefined })}>
                    <Trash2 size={13} /> حذف
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void pickCover(e.dataTransfer.files?.[0]);
                }}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-line px-4 py-6 text-center text-muted transition hover:border-accent/60 hover:text-ink"
              >
                <ImagePlus size={24} />
                <span className="text-[13px] font-semibold">انتخاب یا رها کردن تصویر</span>
                <span className="text-[11px] text-faint">نسبت ۱۶ به ۹ (مثلاً ۱۲۰۰×۶۷۵)، تا ۱۰ مگابایت</span>
              </button>
            )}
            {fieldError('cover')}
            <div className="mt-3">
              <Field label="متن جایگزین تصویر (alt)" htmlFor="bl-alt" hint="آنچه در تصویر است؛ برای گوگل و نابینایان">
                <input id="bl-alt" className="field" maxLength={BLOG_LIMITS.coverAlt} value={d.coverAlt} onChange={(e) => set({ coverAlt: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card title="نشانی و نمایش در گوگل">
            <div className="flex flex-col gap-3">
              <div>
                <Field label="نشانی مقاله" htmlFor="bl-slug" hint="کوتاه، با خط تیره؛ بعد از انتشار کمتر تغییرش دهید">
                  <input
                    id="bl-slug"
                    className="field"
                    dir="auto"
                    maxLength={BLOG_LIMITS.slug}
                    value={slug}
                    onChange={(e) => set({ slug: e.target.value.replace(/\s+/g, '-'), slugTouched: true })}
                    onBlur={() => set({ slug: slugify(slug) })}
                  />
                </Field>
                {fieldError('slug')}
              </div>
              <Field
                label="عنوان در گوگل (اختیاری)"
                htmlFor="bl-seo-title"
                hint={`خالی: همان عنوان مقاله · بهترین طول ${fmtNum(SEO_TITLE_RANGE[0])} تا ${fmtNum(SEO_TITLE_RANGE[1])} حرف`}
              >
                <input id="bl-seo-title" className="field" maxLength={BLOG_LIMITS.seoTitle} value={d.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} />
              </Field>
              <div>
                <Field
                  label="خلاصه / توضیح متا"
                  htmlFor="bl-excerpt"
                  hint={`در فهرست مقاله‌ها و زیر عنوان در گوگل · بهترین طول ${fmtNum(SEO_DESCRIPTION_RANGE[0])} تا ${fmtNum(SEO_DESCRIPTION_RANGE[1])} حرف`}
                >
                  <textarea
                    id="bl-excerpt"
                    className="field min-h-[96px] leading-7"
                    maxLength={BLOG_LIMITS.excerpt}
                    value={d.excerpt}
                    onChange={(e) => set({ excerpt: e.target.value })}
                  />
                </Field>
                <p className="mt-1 text-[11px] text-faint">
                  <Counter n={d.excerpt.trim().length} range={SEO_DESCRIPTION_RANGE} /> حرف
                </p>
                {fieldError('excerpt')}
              </div>
              {/* how the result may look in Google */}
              <div className="rounded-xl border border-line bg-raised/50 p-3" aria-label="پیش‌نمایش نتیجه‌ی گوگل">
                <p className="truncate text-[11.5px] text-muted" dir="ltr">
                  {window.location.host} › blog › {slug || '…'}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[15px] font-semibold text-sky">{(d.seoTitle || d.title || 'عنوان مقاله').slice(0, 65)}</p>
                <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-6 text-muted">{d.excerpt || 'خلاصه‌ی مقاله اینجا دیده می‌شود.'}</p>
              </div>
            </div>
          </Card>

          <Card title="برچسب‌ها">
            <TagsInput tags={d.tags} onChange={(tags) => set({ tags })} />
            <p className="mt-1.5 text-[11px] text-faint">هر برچسب صفحه‌ی خودش را در بلاگ دارد.</p>
          </Card>

          <Card title={`چک‌لیست سئو (${fmtNum(score)} از ${fmtNum(checks.length)})`}>
            <Meter value={score / checks.length} tone={score >= checks.length - 1 ? 'gain' : score >= checks.length / 2 ? 'amber' : 'loss'} />
            <ul className="mt-3 flex flex-col gap-1.5 text-[12.5px]">
              {checks.map((c) => (
                <li key={c.text} className={clsx('flex items-start gap-2', c.ok ? 'text-ink' : 'text-muted')}>
                  {c.ok ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-gain" /> : <XCircle size={15} className="mt-0.5 shrink-0 text-faint" />}
                  {c.text}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
