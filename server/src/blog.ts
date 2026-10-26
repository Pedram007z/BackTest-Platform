import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config';
import { db } from './db';
import { badRequest, notFound, rateLimit, type Ctx } from './http';
import { dropUnusedMedia, registerMediaUser, toMedia } from './announcements';
import { BLOG_LIMITS, blogPostError, cleanTags, postIsPublic, slugify, toSummary } from '../../src/services/blog';
import type { BlogPost, BlogPostSummary } from './shared';
import { clone } from './util';

/**
 * Blog posts, kept in DATA_DIR/blog.json. The admin panel writes them (Markdown); the public pages
 * (blogPages.ts) are rendered by this server at /blog, with a sitemap and an RSS feed, so search
 * engines read them without running the app. A post whose address changes keeps answering at the old
 * address with a permanent redirect.
 */

interface BlogFile {
  posts: BlogPost[];
  /** old address → post id */
  redirects: Record<string, string>;
}

let store: BlogFile | null = null;
let editTimer: NodeJS.Timeout | null = null;
let viewTimer: NodeJS.Timeout | null = null;
const FILE = () => join(config.dataDir, 'blog.json');

function blog(): BlogFile {
  if (!store) {
    store = { posts: [], redirects: {} };
    if (existsSync(FILE())) {
      try {
        const raw = JSON.parse(readFileSync(FILE(), 'utf8'));
        store = { posts: Array.isArray(raw.posts) ? raw.posts : [], redirects: raw.redirects ?? {} };
      } catch (e) {
        console.warn('[blog] could not read blog.json:', (e as Error).message);
      }
    }
  }
  return store;
}

export function flushBlog() {
  for (const t of [editTimer, viewTimer]) if (t) clearTimeout(t);
  editTimer = viewTimer = null;
  if (!store) return;
  const tmp = `${FILE()}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(store));
  renameSync(tmp, FILE());
}
/** Edits are saved at once; view counts at most once a minute. */
const saveEdit = () => {
  if (viewTimer) clearTimeout(viewTimer);
  viewTimer = null;
  editTimer ??= setTimeout(flushBlog, 300);
};
const saveViews = () => {
  if (!editTimer) viewTimer ??= setTimeout(flushBlog, 60_000);
};

/** Files the posts use: covers and pictures in the text (/api/media/<id>). */
function blogMediaIds(): string[] {
  const ids: string[] = [];
  for (const p of blog().posts) {
    if (p.cover) ids.push(p.cover.id);
    for (const m of p.content.matchAll(/\/api\/media\/([\w-]+)/g)) ids.push(m[1]);
  }
  return ids;
}
registerMediaUser(blogMediaIds);

/** Tests: read the file again. */
export function resetBlog() {
  store = null;
}

// ---------- admin ----------

export function adminPosts(): BlogPostSummary[] {
  return blog()
    .posts.map(toSummary)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function adminPost(id: string): BlogPost {
  const p = blog().posts.find((x) => x.id === id);
  if (!p) throw notFound('مقاله پیدا نشد.');
  return clone(p);
}

const text = (v: unknown, max: number) => String(v ?? '').slice(0, max);

/** PUT /api/admin/blog/:id (creates the post when the id is new). */
export function savePost(id: string, b: any): BlogPost {
  if (!/^[\w-]{3,60}$/.test(id)) throw badRequest('invalid', 'شناسه‌ی مقاله معتبر نیست.');
  const f = blog();
  const title = text(b.title, BLOG_LIMITS.title + 1).trim();
  const slug = String(b.slug ?? '').trim() || slugify(title);
  const input = {
    title,
    slug,
    excerpt: text(b.excerpt, BLOG_LIMITS.excerpt + 1).trim(),
    content: text(b.content, BLOG_LIMITS.content + 1),
    status: b.status === 'published' ? ('published' as const) : ('draft' as const),
  };
  const bad = blogPostError(input);
  if (bad) throw badRequest('invalid', bad.message, bad.field);
  const taken = f.posts.find((p) => p.slug === slug && p.id !== id);
  if (taken || (f.redirects[slug] && f.redirects[slug] !== id)) throw badRequest('invalid', 'این نشانی برای مقاله‌ی دیگری است.', 'slug');
  let cover: BlogPost['cover'];
  if (b.coverId) {
    const m = db().media.find((x) => x.id === b.coverId);
    if (!m || m.kind !== 'image') throw badRequest('invalid', 'تصویر شاخص پیدا نشد؛ دوباره بارگذاری کنید.', 'cover');
    cover = toMedia(m);
  }
  const prev = f.posts.find((p) => p.id === id);
  const now = Date.now();
  const asked = Number(b.publishedAt);
  const publishedAt = Number.isFinite(asked) && asked > 0 ? asked : input.status === 'published' ? (prev?.publishedAt ?? now) : prev?.publishedAt;
  const next: BlogPost = {
    id,
    ...input,
    seoTitle: text(b.seoTitle, BLOG_LIMITS.seoTitle).trim() || undefined,
    cover,
    coverAlt: text(b.coverAlt, BLOG_LIMITS.coverAlt).trim() || undefined,
    tags: cleanTags(b.tags),
    author: text(b.author, BLOG_LIMITS.author).trim() || db().settings.siteName,
    publishedAt,
    views: prev?.views ?? 0,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };
  // the old address of a post people may have found keeps working
  if (prev && prev.slug !== slug && postIsPublic(prev, now)) f.redirects[prev.slug] = id;
  delete f.redirects[slug];
  if (prev) f.posts[f.posts.indexOf(prev)] = next;
  else f.posts.unshift(next);
  saveEdit();
  dropUnusedMedia();
  return clone(next);
}

export function deletePost(id: string): BlogPost | undefined {
  const f = blog();
  const p = f.posts.find((x) => x.id === id);
  f.posts = f.posts.filter((x) => x.id !== id);
  for (const [from, to] of Object.entries(f.redirects)) if (to === id) delete f.redirects[from];
  saveEdit();
  dropUnusedMedia();
  return p;
}

// ---------- visitors ----------

/** Published posts, newest first. */
export function publicPosts(now = Date.now()): BlogPost[] {
  return blog()
    .posts.filter((p) => postIsPublic(p, now))
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
}

/** GET /api/blog/latest?limit=3: for the home page. */
export function latestPosts(limit: unknown): BlogPostSummary[] {
  const n = Math.min(12, Math.max(1, Number(limit) || 3));
  return publicPosts()
    .slice(0, n)
    .map((p) => ({ ...toSummary(p), views: 0 }));
}

/** A published post by its address; or the address it moved to. */
export function findPost(slug: string): { post: BlogPost } | { movedTo: string } | null {
  const now = Date.now();
  const f = blog();
  const post = f.posts.find((p) => p.slug === slug && postIsPublic(p, now));
  if (post) return { post };
  const moved = f.redirects[slug] && f.posts.find((p) => p.id === f.redirects[slug] && postIsPublic(p, now));
  return moved ? { movedTo: moved.slug } : null;
}

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|lighthouse/i;

/** A reader opened the post: counted once per address every 6 hours, robots not counted. */
export function countPostView(ctx: Ctx, post: BlogPost) {
  if (BOT.test(ctx.userAgent)) return;
  try {
    rateLimit(`blog-view:${post.id}:${ctx.ip}`, 1, 6 * 3_600_000);
  } catch {
    return;
  }
  post.views++;
  saveViews();
}
