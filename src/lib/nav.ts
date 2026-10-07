import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, type Toast } from '../store/useStore';
import { session as sessionStore } from './storage';

/**
 * Moving between pages: every page change is a full page load from the server, like a classic website
 * (clean addresses such as /dashboard, no "#"). Links do this through components/ui/AppLink; code that
 * changes page uses useGo() or <GoTo>.
 *
 * The hosted single-file preview runs inside a sandboxed frame where the page cannot be reloaded at
 * another address, so there pages change in memory instead.
 */
export const PREVIEW = import.meta.env.MODE === 'artifact';

const NOTICE_KEY = 'btl:notice';
const TOAST_KEY = 'btl:toast';
/** This page load. A notice is for the next load only: the page that writes it can still render the
 *  sign-in page for a moment (signing out clears the session first) and must not use it up. */
const THIS_LOAD = Math.random().toString(36).slice(2);

/** Full address of an in-app path (`/billing?x=1`) under the site's base path. */
export const appHref = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

export interface GoOptions {
  /** Replace the current history entry (the back button skips this page). */
  replace?: boolean;
  /** A message the sign-in page shows once (for example "you signed out"). */
  notice?: string;
}

/** Load another page of the app. */
export function useGo() {
  const navigate = useNavigate();
  return (path: string, { replace = false, notice }: GoOptions = {}) => {
    if (PREVIEW) return navigate(path, { replace, state: notice ? { notice } : undefined });
    if (notice) sessionStore.setItem(NOTICE_KEY, JSON.stringify({ text: notice, load: THIS_LOAD }));
    const href = appHref(path);
    if (replace) window.location.replace(href);
    else window.location.assign(href);
  };
}

/** Loads `to` as soon as it renders (a page that should not be shown, e.g. sign-in once signed in). */
export function GoTo({ to, replace = true }: { to: string; replace?: boolean }) {
  const go = useGo();
  useEffect(() => {
    go(to, { replace });
  }, [to]);
  return null;
}

/** The notice left by the page before (see GoOptions.notice); read once. */
export function takeNotice(): string | undefined {
  const raw = sessionStore.getItem(NOTICE_KEY);
  if (!raw) return undefined;
  try {
    const n = JSON.parse(raw) as { text: string; load: string };
    if (n.load === THIS_LOAD) return undefined;
    sessionStore.removeItem(NOTICE_KEY);
    return n.text;
  } catch {
    sessionStore.removeItem(NOTICE_KEY);
    return undefined;
  }
}

/** A toast shown on the next page (the current one is about to be replaced by a page load). */
export function toastNext(text: string, tone?: Toast['tone']) {
  if (PREVIEW) return toast(text, tone);
  sessionStore.setItem(TOAST_KEY, JSON.stringify({ text, tone }));
}

/** Shows a toast left by the page before; call once when the app starts. */
export function showPendingToast() {
  const raw = sessionStore.getItem(TOAST_KEY);
  if (!raw) return;
  sessionStore.removeItem(TOAST_KEY);
  try {
    const t = JSON.parse(raw) as { text: string; tone?: Toast['tone'] };
    if (t.text) toast(t.text, t.tone);
  } catch {
    /* ignore */
  }
}

/** A `next` page from the address (`/login?next=/billing`): same-site paths only, never the sign-in pages. */
export function safeNext(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (/^\/(login|signup)(\/|\?|$)/.test(value)) return fallback;
  return value;
}
