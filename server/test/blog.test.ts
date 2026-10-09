import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string };
let user: { token: string };

const CONTENT = `مقدمه‌ی مقاله با یک [لینک به ثبت‌نام](/signup).

## بک‌تست چیست؟

بک‌تست یعنی **امتحان استراتژی** روی داده‌ی گذشته.

## چرا داده‌ی واقعی؟

- قیمت‌های واقعی
- خبرهای اقتصادی

### جزئیات

<script>alert(1)</script> و [لینک بد](javascript:alert(1))

| نماد | سود |
| --- | ---: |
| EURUSD | ۱۲٪ |
`;

const post = (over: Record<string, unknown> = {}) => ({
  title: 'بک‌تست چیست و چرا مهم است؟',
  excerpt: 'بک‌تست یعنی امتحان یک استراتژی معاملاتی روی داده‌ی تاریخی بازار، پیش از آن‌که سرمایه‌ی واقعی را به خطر بیندازید.',
  content: CONTENT,
  tags: ['آموزش', 'بک‌تست'],
  status: 'published',
  ...over,
});

before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true' });
  admin = await s.signIn('09120000001', 'مدیر');
  user = await s.signIn('09351234567', 'کاربر');
});
after(() => s.stop());

const put = (id: string, body: unknown) => s.call('PUT', `/api/admin/blog/${id}`, body, admin.token);
const enc = encodeURIComponent;

test('blog admin: only admins; a post gets an address from its title; drafts stay hidden', async () => {
  assert.equal((await s.call('GET', '/api/admin/blog', undefined, user.token)).status, 403);
  const draft = await put('post_one', post({ status: 'draft' }));
  assert.equal(draft.status, 200, JSON.stringify(draft.data));
  assert.equal(draft.data.slug, 'بک-تست-چیست-و-چرا-مهم-است');
  assert.equal(draft.data.author, 'بک‌تست‌لب');
  assert.equal(draft.data.publishedAt, undefined);
  assert.equal((await s.call('GET', `/blog/${enc(draft.data.slug)}`)).status, 404);
  assert.equal((await s.call('GET', '/api/blog/latest')).data.length, 0);

  const list = await s.call('GET', '/api/admin/blog', undefined, admin.token);
  assert.equal(list.data.length, 1);
  assert.equal(list.data[0].content, undefined, 'the list has no texts');
  assert.ok(list.data[0].readingMinutes >= 1);
  assert.equal((await s.call('GET', '/api/admin/blog/post_one', undefined, admin.token)).data.content, CONTENT);

  const bad = await put('post_bad', post({ title: 'ab' }));
  assert.equal(bad.status, 400);
  assert.equal(bad.data.field, 'title');
  const badSlug = await put('post_bad', post({ slug: 'a b' }));
  assert.equal(badSlug.data.field, 'slug');
});

test('blog page: rendered for search engines, with meta tags, structured data and safe text', async () => {
  const saved = await put('post_one', post());
  assert.equal(saved.status, 200);
  assert.ok(saved.data.publishedAt > 0, 'publishing sets the time');
  const page = await s.call('GET', `/blog/${enc(saved.data.slug)}`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type') ?? '', /text\/html/);
  assert.match(page.headers.get('cache-control') ?? '', /public/);
  const html: string = page.data;
  assert.match(html, /<html lang="fa" dir="rtl">/);
  assert.match(html, /<title>بک‌تست چیست و چرا مهم است؟ \| بک‌تست‌لب<\/title>/);
  assert.match(html, /<meta name="description" content="بک‌تست یعنی امتحان/);
  assert.ok(html.includes(`<link rel="canonical" href="https://app.test/blog/${enc(saved.data.slug)}">`));
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.match(html, /"@type":"BlogPosting"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /<h1>بک‌تست چیست و چرا مهم است؟<\/h1>/);
  assert.match(html, /<h2 id="بک-تست-چیست">بک‌تست چیست؟<\/h2>/);
  assert.match(html, /<nav class="toc"/, 'three headings: a table of contents');
  assert.match(html, /<strong>امتحان استراتژی<\/strong>/);
  assert.match(html, /<td style="text-align:left">۱۲٪<\/td>/);
  assert.ok(!html.includes('<script>alert'), 'raw HTML in the text is escaped');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('javascript:'), 'unsafe links are dropped');
  assert.match(html, /<a href="\/signup">لینک به ثبت‌نام<\/a>/);

  const index = await s.call('GET', '/blog');
  assert.equal(index.status, 200);
  assert.ok(index.data.includes(`href="/blog/${enc(saved.data.slug)}"`));
  assert.match(index.data, /"@type":"Blog"/);
  const tag = await s.call('GET', `/blog/tag/${enc('آموزش')}`);
  assert.equal(tag.status, 200);
  assert.match(tag.data, /مقاله‌های «آموزش»/);
  assert.equal((await s.call('GET', `/blog/tag/${enc('ناموجود')}`)).status, 404);
  assert.equal((await s.call('GET', '/blog?page=2')).status, 404);
  assert.equal((await s.call('GET', '/blog/no-such-post')).status, 404);

  const latest = await s.call('GET', '/api/blog/latest?limit=3');
  assert.equal(latest.data.length, 1);
  assert.equal(latest.data[0].content, undefined);
});

test('blog: sitemap, robots, RSS; scheduled posts wait; a changed address redirects', async () => {
  const later = await put('post_later', post({ title: 'مقاله‌ی آینده درباره‌ی مدیریت ریسک', publishedAt: Date.now() + 86_400_000 }));
  assert.equal(later.status, 200);
  assert.equal((await s.call('GET', `/blog/${enc(later.data.slug)}`)).status, 404, 'not before its time');

  const sitemap = await s.call('GET', '/sitemap.xml');
  assert.match(sitemap.headers.get('content-type') ?? '', /application\/xml/);
  assert.match(sitemap.data, /<loc>https:\/\/app\.test\/<\/loc>/);
  assert.match(sitemap.data, /<loc>https:\/\/app\.test\/blog<\/loc>/);
  assert.ok(sitemap.data.includes(`<loc>https://app.test/blog/${enc('بک-تست-چیست-و-چرا-مهم-است')}</loc>`));
  assert.ok(sitemap.data.includes(`<loc>https://app.test/blog/tag/${enc('آموزش')}</loc>`));
  assert.ok(!sitemap.data.includes(enc(later.data.slug)), 'scheduled posts are not listed yet');

  const robots = await s.call('GET', '/robots.txt');
  assert.match(robots.data, /Sitemap: https:\/\/app\.test\/sitemap\.xml/);
  assert.match(robots.data, /Allow: \/api\/media\//);
  assert.match(robots.data, /Disallow: \/dashboard/);

  const rss = await s.call('GET', '/blog/rss.xml');
  assert.match(rss.headers.get('content-type') ?? '', /application\/rss\+xml/);
  assert.match(rss.data, /<item><title>بک‌تست چیست و چرا مهم است؟<\/title>/);

  // the address changes: the old one answers with a permanent redirect
  const old = 'بک-تست-چیست-و-چرا-مهم-است';
  const moved = await put('post_one', post({ slug: 'what-is-backtesting' }));
  assert.equal(moved.status, 200);
  const r = await s.call('GET', `/blog/${enc(old)}`);
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), '/blog/what-is-backtesting');
  assert.equal((await s.call('GET', '/blog/what-is-backtesting')).status, 200);
  const taken = await put('post_other', post({ title: 'مقاله‌ی دیگر', slug: old }));
  assert.equal(taken.status, 400, 'an old address stays with its post');
  assert.equal(taken.data.field, 'slug');
});

test('blog: views counted once per reader, robots not counted; deleting a post', async () => {
  const read = (ua: string, ip: string) => s.call('GET', '/blog/what-is-backtesting', undefined, undefined, { headers: { 'User-Agent': ua, 'X-Real-IP': ip } });
  await read('Mozilla/5.0', '5.1.1.1');
  await read('Mozilla/5.0', '5.1.1.1');
  await read('Googlebot/2.1', '5.1.1.2');
  const p = (await s.call('GET', '/api/admin/blog/post_one', undefined, admin.token)).data;
  assert.equal(p.views, 1);

  assert.equal((await s.call('DELETE', '/api/admin/blog/post_one', undefined, admin.token)).status, 204);
  assert.equal((await s.call('GET', '/blog/what-is-backtesting')).status, 404);
  const audit = await s.call('GET', '/api/admin/audit', undefined, admin.token);
  assert.ok(JSON.stringify(audit.data).includes('حذف مقاله'));
});

test('blog: a cover picture is kept while a post uses it', async () => {
  const upload = (name: string) => s.call('POST', `/api/admin/media?name=${name}`, 'PNG picture bytes', admin.token, { headers: { 'Content-Type': 'image/png' } });
  const cover = await upload('cover.png');
  const spare = await upload('spare.png');
  assert.equal(cover.status, 200, JSON.stringify(cover.data));
  const saved = await put('post_cover', post({ title: 'مقاله‌ای با تصویر شاخص', coverId: cover.data.id, coverAlt: 'نمودار بک‌تست' }));
  assert.equal(saved.status, 200, JSON.stringify(saved.data));
  assert.equal(saved.data.cover.id, cover.data.id);
  const html = (await s.call('GET', `/blog/${enc(saved.data.slug)}`)).data;
  assert.ok(html.includes(`<meta property="og:image" content="https://app.test/api/media/${cover.data.id}">`));
  assert.match(html, /alt="نمودار بک‌تست"/);

  // a day later an announcement is saved: unused uploads are removed, the cover stays
  for (const m of s.db().media) m.createdAt -= 2 * 86_400_000;
  const ann = await s.call('PUT', '/api/admin/announcements/ann_x', { title: 'اعلان', body: '', active: false }, admin.token);
  assert.equal(ann.status, 200, JSON.stringify(ann.data));
  assert.equal((await s.call('GET', `/api/media/${cover.data.id}`)).status, 200);
  assert.equal((await s.call('GET', `/api/media/${spare.data.id}`)).status, 404);
});
