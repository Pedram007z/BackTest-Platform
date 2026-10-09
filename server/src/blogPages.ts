import { config } from './config';
import { db } from './db';
import type { BlogPost } from './shared';
import { renderMarkdown, type Heading } from '../../src/lib/markdown';
import { readingMinutes, wordCount } from '../../src/services/blog';

/**
 * The blog's public pages, rendered here as plain HTML (no script needed), so search engines read the
 * articles, their titles and descriptions, Open Graph cards for sharing, and schema.org data. Styled
 * like the app (its colours, dark or light with the system, the Vazirmatn font from /fonts).
 */

export const PAGE_SIZE = 12;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const base = () => config.appUrl;
const siteName = () => db().settings.siteName;
export const postPath = (slug: string) => `/blog/${encodeURIComponent(slug)}`;
export const tagPath = (tag: string) => `/blog/tag/${encodeURIComponent(tag)}`;
const abs = (path: string) => (/^https?:\/\//.test(path) ? path : `${base()}${path}`);
const faDate = (ms: number) => new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Tehran' }).format(ms);
const faNum = (n: number) => n.toLocaleString('fa-IR');
const iso = (ms: number) => new Date(ms).toISOString();
/** JSON inside a script tag: `<` escaped so text cannot close it. */
const ldJson = (data: unknown) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const CSS = `
@font-face{font-family:Vazirmatn;src:url(/fonts/vazirmatn-arabic.woff2) format('woff2');font-weight:100 900;font-display:swap;unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}
@font-face{font-family:Vazirmatn;src:url(/fonts/vazirmatn-latin.woff2) format('woff2');font-weight:100 900;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
:root{--bg:13 11 20;--surface:24 20 36;--raised:34 29 50;--line:48 42 68;--ink:238 235 246;--muted:163 156 186;--faint:112 105 136;--accent:124 92 255;--accent-ink:181 162 255;color-scheme:dark}
@media (prefers-color-scheme:light){:root{--bg:246 244 251;--surface:255 255 255;--raised:242 239 249;--line:226 221 239;--ink:24 19 36;--muted:92 85 115;--faint:140 133 162;--accent:106 69 245;--accent-ink:94 56 232;color-scheme:light}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:rgb(var(--bg));color:rgb(var(--ink));font-family:Vazirmatn,Tahoma,system-ui,sans-serif;font-size:16px;line-height:1.9}
a{color:rgb(var(--accent-ink));text-decoration:none}
a:hover{text-decoration:underline}
img{max-width:100%;height:auto}
.wrap{max-width:1120px;margin:0 auto;padding:0 16px}
.narrow{max-width:760px}
header.site{border-bottom:1px solid rgb(var(--line));background:rgb(var(--surface)/.6);backdrop-filter:blur(8px);position:sticky;top:0;z-index:5}
header.site .wrap{display:flex;align-items:center;gap:16px;height:60px}
.brand{display:flex;align-items:center;gap:8px;color:rgb(var(--ink));font-weight:800;font-size:18px}
.brand img{width:30px;height:30px;border-radius:8px}
header.site nav{display:flex;align-items:center;gap:18px;margin-inline-start:auto;font-size:14px}
header.site nav a{color:rgb(var(--muted))}
header.site nav a.btn{color:#fff}
.btn{display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:rgb(var(--accent));color:#fff;padding:8px 18px;font-weight:700;font-size:14px}
.btn:hover{text-decoration:none;filter:brightness(1.08)}
main{padding:32px 0 64px}
.crumbs{font-size:13px;color:rgb(var(--faint));margin:0 0 14px}
.crumbs a{color:rgb(var(--muted))}
h1{font-size:30px;line-height:1.5;margin:0 0 10px;font-weight:800}
.lead{color:rgb(var(--muted));margin:0 0 24px;max-width:680px}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 26px;padding:0;list-style:none}
.tags a{display:inline-block;border:1px solid rgb(var(--line));border-radius:999px;padding:2px 12px;font-size:13px;color:rgb(var(--muted));background:rgb(var(--surface))}
.tags a.on,.tags a:hover{border-color:rgb(var(--accent));color:rgb(var(--ink));text-decoration:none}
.grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.card{display:flex;flex-direction:column;background:rgb(var(--surface));border:1px solid rgb(var(--line));border-radius:18px;overflow:hidden;color:rgb(var(--ink))}
.card:hover{text-decoration:none;border-color:rgb(var(--accent)/.6)}
.card .cover{aspect-ratio:16/9;background:rgb(var(--raised));display:block;width:100%;object-fit:cover}
.card .noimg{aspect-ratio:16/9;background:linear-gradient(135deg,rgb(var(--accent)/.35),rgb(var(--raised)))}
.card .body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:6px;flex:1}
.card h2{font-size:18px;line-height:1.7;margin:0}
.card p{margin:0;color:rgb(var(--muted));font-size:14px;line-height:1.9;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.meta{font-size:12.5px;color:rgb(var(--faint));display:flex;flex-wrap:wrap;gap:4px 12px}
.card .meta{margin-top:auto;padding-top:6px}
.pager{display:flex;justify-content:center;gap:10px;margin-top:32px}
.pager a,.pager span{border:1px solid rgb(var(--line));border-radius:12px;padding:6px 14px;font-size:14px}
.pager span{color:rgb(var(--faint))}
.empty{padding:60px 0;text-align:center;color:rgb(var(--muted))}
article .hero{margin:18px 0 22px;border-radius:18px;overflow:hidden;border:1px solid rgb(var(--line));background:rgb(var(--raised))}
article .hero img{display:block;width:100%;max-height:440px;object-fit:cover}
.toc{background:rgb(var(--surface));border:1px solid rgb(var(--line));border-radius:16px;padding:14px 18px;margin:0 0 26px;font-size:14.5px}
.toc p{margin:0 0 6px;font-weight:700}
.toc ul{margin:0;padding-inline-start:20px}
.toc li.sub{margin-inline-start:18px;list-style:circle}
.content{font-size:17px;line-height:2.05}
.content h2{font-size:23px;line-height:1.6;margin:38px 0 12px}
.content h3{font-size:19px;line-height:1.6;margin:28px 0 10px}
.content h4{font-size:17px;margin:22px 0 8px}
.content p{margin:0 0 18px}
.content ul,.content ol{margin:0 0 18px;padding-inline-start:26px}
.content ol{list-style-type:persian}
.content li{margin:4px 0}
.content blockquote{margin:0 0 18px;padding:10px 18px;border-inline-start:4px solid rgb(var(--accent));background:rgb(var(--surface));border-radius:0 12px 12px 0;color:rgb(var(--muted))}
.content blockquote p:last-child{margin-bottom:0}
.content code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.88em;background:rgb(var(--raised));border-radius:6px;padding:1px 6px}
.content pre{background:rgb(var(--surface));border:1px solid rgb(var(--line));border-radius:12px;padding:14px 16px;overflow-x:auto;line-height:1.7;text-align:left}
.content pre code{background:none;padding:0;font-size:14px}
.content figure{margin:0 0 22px}
.content figure img{border-radius:14px;border:1px solid rgb(var(--line));display:block;margin:0 auto}
.content figcaption{text-align:center;font-size:13px;color:rgb(var(--faint));margin-top:8px}
.content hr{border:0;border-top:1px solid rgb(var(--line));margin:30px 0}
.table-wrap{overflow-x:auto;margin:0 0 20px;border:1px solid rgb(var(--line));border-radius:12px}
.content table{border-collapse:collapse;width:100%;font-size:15px}
.content th,.content td{padding:8px 12px;border-bottom:1px solid rgb(var(--line));text-align:right}
.content th{background:rgb(var(--raised))}
.content tr:last-child td{border-bottom:0}
.cta{margin:36px 0 10px;padding:22px;border-radius:18px;background:linear-gradient(135deg,rgb(var(--accent)/.22),rgb(var(--surface)));border:1px solid rgb(var(--accent)/.4)}
.cta h2{margin:0 0 6px;font-size:20px}
.cta p{margin:0 0 14px;color:rgb(var(--muted))}
.share{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:26px 0;font-size:14px;color:rgb(var(--faint))}
.share a{border:1px solid rgb(var(--line));border-radius:999px;padding:3px 14px;color:rgb(var(--muted))}
.related{margin-top:44px}
.related h2{font-size:21px;margin:0 0 16px}
footer.site{border-top:1px solid rgb(var(--line));padding:26px 0;color:rgb(var(--faint));font-size:13px}
footer.site .wrap{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center}
footer.site nav{display:flex;gap:18px;margin-inline-start:auto}
footer.site a{color:rgb(var(--muted))}
@media (max-width:640px){h1{font-size:24px}.content{font-size:16px}header.site nav a.hide-sm{display:none}.grid{grid-template-columns:1fr}}
`;

interface Head {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  image?: string;
  imageAlt?: string;
  ld?: unknown[];
  prev?: string;
  next?: string;
  noindex?: boolean;
  article?: { published: number; modified: number; tags: string[] };
}

function page(h: Head, body: string): string {
  const url = abs(h.path);
  const name = siteName();
  const image = h.image ? abs(h.image) : abs('/icon-512.png');
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(h.title)}</title>
<meta name="description" content="${esc(h.description)}">
<link rel="canonical" href="${esc(url)}">
${h.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
${h.prev ? `<link rel="prev" href="${esc(abs(h.prev))}">` : ''}${h.next ? `<link rel="next" href="${esc(abs(h.next))}">` : ''}
<link rel="alternate" type="application/rss+xml" title="${esc(`بلاگ ${name}`)}" href="${esc(abs('/blog/rss.xml'))}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/vazirmatn-arabic.woff2" as="font" type="font/woff2" crossorigin>
<meta name="theme-color" content="#0d0b14">
<meta property="og:site_name" content="${esc(name)}">
<meta property="og:locale" content="fa_IR">
<meta property="og:type" content="${h.type ?? 'website'}">
<meta property="og:title" content="${esc(h.title)}">
<meta property="og:description" content="${esc(h.description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
${h.imageAlt ? `<meta property="og:image:alt" content="${esc(h.imageAlt)}">` : ''}
${
  h.article
    ? `<meta property="article:published_time" content="${iso(h.article.published)}">
<meta property="article:modified_time" content="${iso(h.article.modified)}">
${h.article.tags.map((t) => `<meta property="article:tag" content="${esc(t)}">`).join('\n')}`
    : ''
}
<meta name="twitter:card" content="${h.image ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(h.title)}">
<meta name="twitter:description" content="${esc(h.description)}">
<meta name="twitter:image" content="${esc(image)}">
<style>${CSS}</style>
${(h.ld ?? []).map(ldJson).join('\n')}
</head>
<body>
<header class="site"><div class="wrap">
<a class="brand" href="/"><img src="/favicon.svg" alt="" width="30" height="30">${esc(name)}</a>
<nav aria-label="منوی اصلی"><a href="/blog">بلاگ</a><a class="hide-sm" href="/login">ورود</a><a class="btn" href="/signup">شروع رایگان</a></nav>
</div></header>
${body}
<footer class="site"><div class="wrap">
<span>© ${new Date().getFullYear().toLocaleString('fa-IR', { useGrouping: false })} ${esc(name)}، بک‌تست استراتژی روی داده‌ی واقعی بازار</span>
<nav aria-label="پیوندها"><a href="/">خانه</a><a href="/blog">بلاگ</a><a href="/blog/rss.xml">RSS</a></nav>
</div></footer>
</body>
</html>`;
}

const meta = (p: BlogPost) =>
  `<time datetime="${iso(p.publishedAt ?? p.createdAt)}">${faDate(p.publishedAt ?? p.createdAt)}</time><span>${faNum(readingMinutes(p.content))} دقیقه مطالعه</span>`;

function card(p: BlogPost, headingTag = 'h2'): string {
  const img = p.cover
    ? `<img class="cover" src="${esc(p.cover.url)}" alt="${esc(p.coverAlt || p.title)}" loading="lazy" decoding="async" width="640" height="360">`
    : '<div class="noimg" aria-hidden="true"></div>';
  return `<a class="card" href="${esc(postPath(p.slug))}">${img}<div class="body"><${headingTag}>${esc(p.title)}</${headingTag}>${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}<div class="meta">${meta(p)}</div></div></a>`;
}

const organization = () => ({ '@type': 'Organization', name: siteName(), url: base(), logo: { '@type': 'ImageObject', url: abs('/icon-512.png') } });

function tagList(all: string[], current?: string): string {
  if (!all.length) return '';
  return `<ul class="tags" aria-label="برچسب‌ها"><li><a href="/blog"${current ? '' : ' class="on"'}>همه</a></li>${all
    .map((t) => `<li><a href="${esc(tagPath(t))}"${t === current ? ' class="on"' : ''}>${esc(t)}</a></li>`)
    .join('')}</ul>`;
}

/** Tags of the published posts, most used first. */
export function allTags(posts: BlogPost[]): string[] {
  const count = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) count.set(t, (count.get(t) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fa')).map(([t]) => t);
}

/** /blog, /blog?page=2, /blog/tag/<tag> */
export function renderBlogIndex(posts: BlogPost[], pageNo: number, tag: string | undefined, tags: string[]): string {
  const name = siteName();
  const pages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const shown = posts.slice((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE);
  const root = tag ? tagPath(tag) : '/blog';
  const pathOf = (n: number) => (n === 1 ? root : `${root}?page=${n}`);
  const title = tag ? `${tag} | بلاگ ${name}` : `بلاگ ${name}: آموزش بک‌تست و معامله‌گری`;
  const heading = tag ? `مقاله‌های «${tag}»` : `بلاگ ${name}`;
  const description = tag
    ? `مقاله‌های ${name} درباره‌ی ${tag}: آموزش، تحلیل و تجربه‌ی بک‌تست استراتژی روی داده‌ی واقعی بازار.`
    : `آموزش بک‌تست، مدیریت ریسک، ژورنال‌نویسی و تحلیل بازارهای فارکس، طلا، شاخص‌ها و کریپتو؛ مقاله‌های ${name} برای معامله‌گرهایی که استراتژی‌شان را قبل از معامله‌ی واقعی امتحان می‌کنند.`;
  const pager =
    pages > 1
      ? `<nav class="pager" aria-label="صفحه‌ها">${pageNo > 1 ? `<a href="${esc(pathOf(pageNo - 1))}" rel="prev">صفحه‌ی قبل</a>` : ''}<span>صفحه‌ی ${faNum(pageNo)} از ${faNum(pages)}</span>${pageNo < pages ? `<a href="${esc(pathOf(pageNo + 1))}" rel="next">صفحه‌ی بعد</a>` : ''}</nav>`
      : '';
  const body = `<main><div class="wrap">
<p class="crumbs"><a href="/">خانه</a> › ${tag ? `<a href="/blog">بلاگ</a> › ${esc(tag)}` : 'بلاگ'}</p>
<h1>${esc(heading)}</h1>
<p class="lead">${esc(description)}</p>
${tagList(tags, tag)}
${shown.length ? `<div class="grid">${shown.map((p) => card(p)).join('')}</div>` : '<p class="empty">هنوز مقاله‌ای منتشر نشده است.</p>'}
${pager}
</div></main>`;
  return page(
    {
      title: pageNo > 1 ? `${title} (صفحه‌ی ${faNum(pageNo)})` : title,
      description,
      path: pathOf(pageNo),
      prev: pageNo > 1 ? pathOf(pageNo - 1) : undefined,
      next: pageNo < pages ? pathOf(pageNo + 1) : undefined,
      noindex: pageNo > pages && pageNo > 1,
      ld: [
        {
          '@context': 'https://schema.org',
          '@type': tag ? 'CollectionPage' : 'Blog',
          name: heading,
          description,
          url: abs(pathOf(pageNo)),
          inLanguage: 'fa-IR',
          publisher: organization(),
          blogPost: shown.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: abs(postPath(p.slug)), datePublished: iso(p.publishedAt ?? p.createdAt) })),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'خانه', item: abs('/') },
            { '@type': 'ListItem', position: 2, name: 'بلاگ', item: abs('/blog') },
            ...(tag ? [{ '@type': 'ListItem', position: 3, name: tag, item: abs(tagPath(tag)) }] : []),
          ],
        },
      ],
    },
    body,
  );
}

function toc(headings: Heading[]): string {
  if (headings.length < 3) return '';
  return `<nav class="toc" aria-label="فهرست مطالب"><p>فهرست مطالب</p><ul>${headings
    .map((h) => `<li${h.level === 3 ? ' class="sub"' : ''}><a href="#${esc(encodeURIComponent(h.id))}">${esc(h.text)}</a></li>`)
    .join('')}</ul></nav>`;
}

/** /blog/<slug> */
export function renderBlogPost(p: BlogPost, related: BlogPost[]): string {
  const name = siteName();
  const { html, headings } = renderMarkdown(p.content);
  const path = postPath(p.slug);
  const url = abs(path);
  const published = p.publishedAt ?? p.createdAt;
  const description = p.excerpt || p.title;
  const shareText = encodeURIComponent(p.title);
  const shareUrl = encodeURIComponent(url);
  const body = `<main><div class="wrap narrow">
<article>
<p class="crumbs"><a href="/">خانه</a> › <a href="/blog">بلاگ</a>${p.tags[0] ? ` › <a href="${esc(tagPath(p.tags[0]))}">${esc(p.tags[0])}</a>` : ''}</p>
<h1>${esc(p.title)}</h1>
<div class="meta"><span>${esc(p.author)}</span>${meta(p)}${p.updatedAt - published > 86_400_000 ? `<span>به‌روزرسانی ${faDate(p.updatedAt)}</span>` : ''}</div>
${p.cover ? `<figure class="hero"><img src="${esc(p.cover.url)}" alt="${esc(p.coverAlt || p.title)}" fetchpriority="high" decoding="async"></figure>` : ''}
${toc(headings)}
<div class="content">${html}</div>
${p.tags.length ? `<ul class="tags" aria-label="برچسب‌ها">${p.tags.map((t) => `<li><a href="${esc(tagPath(t))}">${esc(t)}</a></li>`).join('')}</ul>` : ''}
<div class="share"><span>اشتراک‌گذاری:</span><a href="https://t.me/share/url?url=${shareUrl}&amp;text=${shareText}" target="_blank" rel="noopener noreferrer">تلگرام</a><a href="https://twitter.com/intent/tweet?url=${shareUrl}&amp;text=${shareText}" target="_blank" rel="noopener noreferrer">X</a><a href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener noreferrer">واتس‌اپ</a></div>
<section class="cta"><h2>استراتژی‌ات را روی داده‌ی واقعی امتحان کن</h2><p>با ${esc(name)} بازار گذشته را کندل به کندل بازپخش کن، معامله کن و نتیجه را با عدد ببین؛ بدون ریسک سرمایه.</p><a class="btn" href="/signup">شروع رایگان</a></section>
</article>
${related.length ? `<section class="related" aria-label="مقاله‌های مرتبط"><h2>مقاله‌های مرتبط</h2><div class="grid">${related.map((r) => card(r, 'h3')).join('')}</div></section>` : ''}
</div></main>`;
  return page(
    {
      title: `${p.seoTitle || p.title} | ${name}`,
      description,
      path,
      type: 'article',
      image: p.cover?.url,
      imageAlt: p.coverAlt,
      article: { published, modified: p.updatedAt, tags: p.tags },
      ld: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: p.seoTitle || p.title,
          description,
          image: p.cover ? [abs(p.cover.url)] : undefined,
          datePublished: iso(published),
          dateModified: iso(p.updatedAt),
          author: { '@type': p.author === name ? 'Organization' : 'Person', name: p.author },
          publisher: organization(),
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          url,
          inLanguage: 'fa-IR',
          keywords: p.tags.join('، ') || undefined,
          wordCount: wordCount(p.content),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'خانه', item: abs('/') },
            { '@type': 'ListItem', position: 2, name: 'بلاگ', item: abs('/blog') },
            { '@type': 'ListItem', position: 3, name: p.title, item: url },
          ],
        },
      ],
    },
    body,
  );
}

export function renderBlogNotFound(): string {
  return page(
    { title: `مقاله پیدا نشد | ${siteName()}`, description: 'این مقاله وجود ندارد یا برداشته شده است.', path: '/blog', noindex: true },
    `<main><div class="wrap narrow"><p class="crumbs"><a href="/">خانه</a> › <a href="/blog">بلاگ</a></p><h1>مقاله پیدا نشد</h1><p class="lead">این مقاله وجود ندارد یا برداشته شده است.</p><a class="btn" href="/blog">همه‌ی مقاله‌ها</a></div></main>`,
  );
}

const xmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** /sitemap.xml: the home page, the blog, its tags and its posts. */
export function sitemapXml(posts: BlogPost[]): string {
  const newest = posts.reduce((m, p) => Math.max(m, p.updatedAt), 0);
  const urls: { loc: string; lastmod?: number; priority: string }[] = [
    { loc: abs('/'), priority: '1.0' },
    { loc: abs('/blog'), lastmod: newest || undefined, priority: '0.8' },
    ...allTags(posts).map((t) => ({ loc: abs(tagPath(t)), lastmod: posts.filter((p) => p.tags.includes(t)).reduce((m, p) => Math.max(m, p.updatedAt), 0), priority: '0.5' })),
    ...posts.map((p) => ({ loc: abs(postPath(p.slug)), lastmod: p.updatedAt, priority: '0.7' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${xmlEsc(u.loc)}</loc>${u.lastmod ? `<lastmod>${iso(u.lastmod)}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
}

/** /robots.txt: everything public may be read; the app's signed-in pages and the API are left out (uploaded pictures stay readable). */
export function robotsTxt(): string {
  const privatePages = ['/dashboard', '/sessions', '/strategies', '/checklists', '/journal', '/analytics', '/settings', '/billing', '/support', '/replay/', '/pay/'];
  return `User-agent: *
Allow: /
Allow: /api/media/
Disallow: /api/
${privatePages.map((p) => `Disallow: ${p}`).join('\n')}

Sitemap: ${abs('/sitemap.xml')}
`;
}

/** /blog/rss.xml: the 30 newest posts. */
export function rssXml(posts: BlogPost[]): string {
  const name = siteName();
  const items = posts.slice(0, 30).map((p) => {
    const link = abs(postPath(p.slug));
    return `<item><title>${xmlEsc(p.title)}</title><link>${xmlEsc(link)}</link><guid isPermaLink="true">${xmlEsc(link)}</guid><pubDate>${new Date(p.publishedAt ?? p.createdAt).toUTCString()}</pubDate>${p.excerpt ? `<description>${xmlEsc(p.excerpt)}</description>` : ''}${p.tags.map((t) => `<category>${xmlEsc(t)}</category>`).join('')}${p.cover ? `<enclosure url="${xmlEsc(abs(p.cover.url))}" length="${p.cover.size}" type="${xmlEsc(p.cover.mime)}"/>` : ''}</item>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${xmlEsc(`بلاگ ${name}`)}</title>
<link>${xmlEsc(abs('/blog'))}</link>
<atom:link href="${xmlEsc(abs('/blog/rss.xml'))}" rel="self" type="application/rss+xml"/>
<description>${xmlEsc(`مقاله‌های ${name} درباره‌ی بک‌تست و معامله‌گری`)}</description>
<language>fa</language>
${posts[0] ? `<lastBuildDate>${new Date(posts[0].updatedAt).toUTCString()}</lastBuildDate>` : ''}
${items.join('\n')}
</channel>
</rss>
`;
}
