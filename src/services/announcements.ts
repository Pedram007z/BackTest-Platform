import type { Announcement } from './types';

/** Rules for popup messages, shared by the API server and the demo backend. */

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export interface AnnouncementFields {
  id: string;
  title: string;
  body: string;
  button?: { label: string; url: string };
  startsAt?: string;
  endsAt?: string;
}

/** The first problem with a message the admin wrote, or null. */
export function announcementError(a: AnnouncementFields): { field: string; message: string } | null {
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(a.id)) return { field: 'id', message: 'شناسه‌ی پیام معتبر نیست.' };
  const title = a.title.trim();
  if (title.length < 2 || title.length > 120) return { field: 'title', message: 'عنوان باید ۲ تا ۱۲۰ حرف باشد.' };
  if (a.body.trim().length > 4000) return { field: 'body', message: 'متن پیام حداکثر ۴۰۰۰ حرف است.' };
  if (a.button && (a.button.label || a.button.url)) {
    const label = a.button.label.trim();
    const url = a.button.url.trim();
    if (!label || label.length > 40) return { field: 'buttonLabel', message: 'متن دکمه ۱ تا ۴۰ حرف باشد.' };
    // an in-app path or a web address only (never javascript: and the like)
    if (url !== '/' && !/^\/[^/\\]/.test(url) && !/^https:\/\/\S+$/i.test(url)) return { field: 'buttonUrl', message: 'نشانی دکمه باید مثل /billing یا https://… باشد.' };
  }
  for (const k of ['startsAt', 'endsAt'] as const) if (a[k] && !DAY_KEY.test(a[k]!)) return { field: k, message: 'تاریخ معتبر نیست.' };
  if (a.startsAt && a.endsAt && a.endsAt < a.startsAt) return { field: 'endsAt', message: 'تاریخ پایان قبل از تاریخ شروع است.' };
  return null;
}

/** Whether a visitor sees the message now: on the website ('site') or the dashboard ('app'). */
export function announcementVisible(a: Announcement, where: 'site' | 'app', signedIn: boolean, today: string): boolean {
  return (
    a.active &&
    (a.placement === 'both' || a.placement === where) &&
    (a.audience === 'everyone' || signedIn) &&
    (!a.startsAt || a.startsAt <= today) &&
    (!a.endsAt || a.endsAt >= today)
  );
}
