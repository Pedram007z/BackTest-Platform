import { markdownText, renderMarkdown } from '../lib/markdown';
import type { BlogPost, BlogPostSummary } from './types';

/** Rules shared by the API server and the admin panel for blog posts. */

export const BLOG_LIMITS = { title: 120, seoTitle: 70, excerpt: 300, content: 200_000, tags: 10, tag: 30, slug: 100, author: 60, coverAlt: 160 };
/** Search engines show about this much of a title and a description. */
export const SEO_TITLE_RANGE = [30, 65] as const;
export const SEO_DESCRIPTION_RANGE = [70, 160] as const;

/** An address from a title: letters and digits (Persian kept) joined with hyphens. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‌\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, BLOG_LIMITS.slug)
    .replace(/-$/, '');
}

export const isSlug = (s: string) => s.length > 0 && s.length <= BLOG_LIMITS.slug && /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(s);

export const cleanTags = (tags: unknown): string[] =>
  [...new Set((Array.isArray(tags) ? tags : []).map((t) => String(t).replace(/\s+/g, ' ').trim().slice(0, BLOG_LIMITS.tag)).filter(Boolean))].slice(0, BLOG_LIMITS.tags);

/** Words a minute of reading Persian text. */
const WORDS_PER_MINUTE = 200;
export const wordCount = (md: string) => markdownText(md).split(' ').filter(Boolean).length;
export const readingMinutes = (md: string) => Math.max(1, Math.round(wordCount(md) / WORDS_PER_MINUTE));

/** Seen by visitors: published, and its publication time has come. */
export const postIsPublic = (p: Pick<BlogPost, 'status' | 'publishedAt'>, now = Date.now()) => p.status === 'published' && (p.publishedAt ?? 0) <= now;

export function toSummary(p: BlogPost): BlogPostSummary {
  const { content, ...rest } = p;
  return { ...rest, readingMinutes: readingMinutes(content) };
}

export type BlogPostInput = Pick<BlogPost, 'id' | 'slug' | 'title' | 'excerpt' | 'content' | 'tags' | 'author' | 'status'> & {
  seoTitle?: string;
  coverAlt?: string;
  publishedAt?: number;
  /** An uploaded picture (POST /api/admin/media). */
  coverId?: string;
};

/** The first problem of a post, in the words the admin panel shows. */
export function blogPostError(p: Pick<BlogPostInput, 'title' | 'slug' | 'excerpt' | 'content' | 'status'>): { field: string; message: string } | null {
  if (p.title.trim().length < 3) return { field: 'title', message: 'عنوان دست‌کم ۳ حرف باشد.' };
  if (p.title.length > BLOG_LIMITS.title) return { field: 'title', message: `عنوان حداکثر ${BLOG_LIMITS.title} حرف است.` };
  if (!isSlug(p.slug)) return { field: 'slug', message: 'نشانی فقط حروف، عدد و خط تیره (-) باشد، بدون فاصله.' };
  if (p.excerpt.length > BLOG_LIMITS.excerpt) return { field: 'excerpt', message: `خلاصه حداکثر ${BLOG_LIMITS.excerpt} حرف است.` };
  if (p.content.length > BLOG_LIMITS.content) return { field: 'content', message: 'متن بیش از حد بلند است.' };
  if (p.status === 'published' && p.content.trim().length < 50) return { field: 'content', message: 'برای انتشار، متن مقاله را بنویسید.' };
  return null;
}

const fa = (n: number) => n.toLocaleString('fa-IR', { useGrouping: false });

export interface SeoCheck {
  ok: boolean;
  text: string;
}

/** What helps a post in search results, checked in the editor. */
export function seoChecks(p: Pick<BlogPostInput, 'title' | 'seoTitle' | 'excerpt' | 'content' | 'slug' | 'tags' | 'coverAlt'> & { hasCover: boolean }): SeoCheck[] {
  const title = (p.seoTitle || p.title).trim();
  const words = wordCount(p.content);
  const { headings } = renderMarkdown(p.content);
  const internal = /\]\(\/(?!api\/)/.test(p.content);
  return [
    {
      ok: title.length >= SEO_TITLE_RANGE[0] && title.length <= SEO_TITLE_RANGE[1],
      text: `طول عنوان برای گوگل ${fa(SEO_TITLE_RANGE[0])} تا ${fa(SEO_TITLE_RANGE[1])} حرف (اکنون ${fa(title.length)})`,
    },
    {
      ok: p.excerpt.trim().length >= SEO_DESCRIPTION_RANGE[0] && p.excerpt.trim().length <= SEO_DESCRIPTION_RANGE[1],
      text: `خلاصه (توضیح متا) ${fa(SEO_DESCRIPTION_RANGE[0])} تا ${fa(SEO_DESCRIPTION_RANGE[1])} حرف (اکنون ${fa(p.excerpt.trim().length)})`,
    },
    { ok: words >= 300, text: `متن دست‌کم ۳۰۰ کلمه (اکنون ${fa(words)})` },
    { ok: headings.some((h) => h.level === 2), text: 'دست‌کم یک تیتر ## در متن' },
    { ok: p.hasCover && !!p.coverAlt?.trim(), text: 'تصویر شاخص با متن جایگزین (alt)' },
    { ok: internal, text: 'دست‌کم یک لینک به صفحه‌ای از سایت (مثل /signup یا /blog/…)' },
    { ok: p.tags.length > 0, text: 'دست‌کم یک برچسب' },
    { ok: p.slug.length > 0 && p.slug.length <= 60, text: 'نشانی کوتاه (حداکثر ۶۰ حرف)' },
  ];
}
