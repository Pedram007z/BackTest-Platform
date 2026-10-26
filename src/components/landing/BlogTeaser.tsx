import { ArrowLeft, Newspaper } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fmtNum } from '../../lib/format';
import { backend } from '../../services';
import { hasServer, mediaSrc } from '../../services/api';
import type { BlogPostSummary } from '../../services/types';

const dayFmt = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * The newest blog posts on the home page (with the API server; the pages are its /blog). Links are
 * plain addresses: the server renders the blog, the app does not.
 */
export function BlogTeaser() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  useEffect(() => {
    if (!hasServer) return;
    let alive = true;
    backend
      .latestBlogPosts(3)
      .then((p) => alive && setPosts(p))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  if (!posts.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-3 text-[13px] font-bold tracking-wide text-accent">بلاگ</p>
          <h2 className="font-display text-[28px] font-extrabold leading-[1.5] sm:text-[34px]">آموزش بک‌تست و معامله‌گری</h2>
        </div>
        <a href="/blog" className="btn-soft rounded-full px-5 py-2.5">
          همه‌ی مقاله‌ها <ArrowLeft size={15} />
        </a>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {posts.map((p) => (
          <a key={p.id} href={`/blog/${encodeURIComponent(p.slug)}`} className="card group flex flex-col overflow-hidden transition hover:border-accent/50">
            {p.cover ? (
              <img src={mediaSrc(p.cover.url)} alt={p.coverAlt || p.title} loading="lazy" className="aspect-video w-full bg-raised object-cover" />
            ) : (
              <span className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-accent/30 to-raised text-accent-ink">
                <Newspaper size={30} />
              </span>
            )}
            <span className="flex flex-1 flex-col gap-2 p-4">
              <span className="font-bold leading-7 group-hover:text-accent-ink">{p.title}</span>
              {p.excerpt && <span className="line-clamp-2 text-[13px] leading-6 text-muted">{p.excerpt}</span>}
              <span className="mt-auto text-[11.5px] text-faint">
                {dayFmt.format(p.publishedAt ?? p.updatedAt)} · {fmtNum(p.readingMinutes)} دقیقه مطالعه
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
