import { ExternalLink, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGo } from '../lib/nav';
import { useEscapeClose } from './ui/Modal';
import { local, readJson, writeJson } from '../lib/storage';
import { backend } from '../services';
import { mediaSrc } from '../services/api';
import type { Announcement } from '../services/types';

/**
 * Messages from the admin (with an optional picture or video), shown once as a popup when someone opens
 * the website or the dashboard. Closing one remembers it in this browser; the admin can make a message
 * show again by raising its version.
 */

const SEEN_KEY = 'btl:seen-ann';
const SHOW_AFTER_MS = 700;

type Seen = Record<string, number>;
const readSeen = () => readJson<Seen>(local, SEEN_KEY, {});

function markSeen(a: Announcement) {
  const seen = readSeen();
  seen[a.id] = a.version;
  // keep the list short: the newest 60
  const ids = Object.keys(seen);
  if (ids.length > 60) for (const id of ids.slice(0, ids.length - 60)) delete seen[id];
  writeJson(local, SEEN_KEY, seen);
}

/** Shows the first message this browser has not closed yet. */
export function AnnouncementPopup({ where }: { where: 'site' | 'app' }) {
  const [shown, setShown] = useState<Announcement | null>(null);

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    backend
      .announcements(where)
      .then((list) => {
        const seen = readSeen();
        const next = list.find((a) => (seen[a.id] ?? 0) < a.version);
        if (!live || !next) return;
        timer = setTimeout(() => {
          setShown(next);
          void backend.announcementSeen(next.id).catch(() => undefined);
        }, SHOW_AFTER_MS);
      })
      .catch(() => undefined);
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [where]);

  if (!shown) return null;
  return (
    <AnnouncementDialog
      a={shown}
      onClose={() => {
        markSeen(shown);
        setShown(null);
      }}
    />
  );
}

/** The popup itself (also the admin's preview). */
export function AnnouncementDialog({ a, onClose, preview = false }: { a: Pick<Announcement, 'title' | 'body' | 'media' | 'button'>; onClose: () => void; preview?: boolean }) {
  const go = useGo();
  const panel = useRef<HTMLDivElement>(null);
  const [mediaFailed, setMediaFailed] = useState(false);
  const media = a.media && !mediaFailed ? a.media : undefined;
  const external = !!a.button && /^https:\/\//i.test(a.button.url);
  useEscapeClose(onClose);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus(), 30);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" dir="rtl">
      <div className="anim-fade absolute inset-0 bg-black/65 backdrop-blur-[3px]" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ann-title"
        className="anim-pop relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-pop sm:max-w-lg sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
          aria-label="بستن"
          title="بستن"
        >
          <X size={18} />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {media &&
            (media.kind === 'video' ? (
              <video
                key={media.url}
                src={mediaSrc(media.url)}
                className="block max-h-[55vh] w-full bg-black"
                controls
                autoPlay
                muted
                playsInline
                preload="metadata"
                onError={() => setMediaFailed(true)}
              />
            ) : (
              <img key={media.url} src={mediaSrc(media.url)} alt="" className="block max-h-[55vh] w-full bg-raised object-contain" onError={() => setMediaFailed(true)} />
            ))}
          <div className={media ? 'px-6 pb-2 pt-5' : 'px-6 pb-2 pt-12'}>
            <h2 id="ann-title" className="font-display text-xl font-bold leading-8">
              {a.title}
            </h2>
            {a.body && <p className="mt-2 whitespace-pre-line text-[14px] leading-7 text-muted">{a.body}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 px-6 pb-6 pt-4">
          <button type="button" className="btn-ghost" onClick={onClose} data-autofocus={a.button ? undefined : true}>
            {a.button ? 'بعداً' : 'متوجه شدم'}
          </button>
          {a.button &&
            (external ? (
              <a href={preview ? undefined : a.button.url} target="_blank" rel="noopener noreferrer" className="btn-primary" onClick={onClose} data-autofocus>
                {a.button.label} <ExternalLink size={15} />
              </a>
            ) : (
              <button
                type="button"
                className="btn-primary"
                data-autofocus
                onClick={() => {
                  onClose();
                  if (!preview) go(a.button!.url);
                }}
              >
                {a.button.label}
              </button>
            ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
