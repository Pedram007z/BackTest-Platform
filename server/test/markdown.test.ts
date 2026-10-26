import assert from 'node:assert/strict';
import { test } from 'node:test';
import { markdownText, renderMarkdown } from '../../src/lib/markdown';
import { isSlug, readingMinutes, seoChecks, slugify } from '../../src/services/blog';

test('markdown: blocks, nesting and headings for the table of contents', () => {
  const { html, headings } = renderMarkdown(
    [
      '# عنوان اول',
      '',
      '## عنوان اول',
      'خط یک',
      'خط دو',
      '',
      '- یک',
      '  - زیر یک',
      '- دو',
      '',
      '1. اول',
      '2. دوم',
      '',
      '> نقل *قول*',
      '',
      '```js',
      'const a = 1 < 2;',
      '```',
      '',
      '---',
      '',
      '![نمودار](/api/media/m_1 "زیرنویس")',
    ].join('\n'),
  );
  assert.deepEqual(headings, [
    { level: 2, id: 'عنوان-اول', text: 'عنوان اول' },
    { level: 2, id: 'عنوان-اول-2', text: 'عنوان اول' },
  ]);
  assert.match(html, /<p>خط یک<br>خط دو<\/p>/);
  assert.match(html, /<ul><li>یک<ul><li>زیر یک<\/li><\/ul><\/li><li>دو<\/li><\/ul>/);
  assert.match(html, /<ol><li>اول<\/li><li>دوم<\/li><\/ol>/);
  assert.match(html, /<blockquote><p>نقل <em>قول<\/em><\/p><\/blockquote>/);
  assert.match(html, /<pre dir="ltr"><code class="language-js">const a = 1 &lt; 2;<\/code><\/pre>/);
  assert.match(html, /<hr>/);
  assert.match(html, /<figure><img src="\/api\/media\/m_1" alt="نمودار" loading="lazy" decoding="async"><figcaption>زیرنویس<\/figcaption><\/figure>/);
});

test('markdown: everything typed is escaped and only safe addresses become links', () => {
  const { html } = renderMarkdown('<img src=x onerror=alert(1)> [a](javascript:alert(1)) [b](//evil.test) [c](https://ok.test) ![d](data:image/png;base64,xx) `<b>`');
  assert.ok(!/<img src=x/.test(html));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /<a href="#">a<\/a>/);
  assert.match(html, /<a href="#">b<\/a>/);
  assert.match(html, /<a href="https:\/\/ok\.test" target="_blank" rel="noopener noreferrer">c<\/a>/);
  assert.match(html, /<img src="#" alt="d"/);
  assert.match(html, /<code>&lt;b&gt;<\/code>/);
});

test('blog rules: addresses, reading time, plain text and the SEO checklist', () => {
  assert.equal(slugify('  بک‌تست چیست؟ Backtest 101! '), 'بک-تست-چیست-backtest-101');
  assert.ok(isSlug('بک-تست-چیست'));
  assert.ok(!isSlug('a b') && !isSlug('-a') && !isSlug(''));
  assert.equal(markdownText('## تیتر\n**پررنگ** و [لینک](/x)'), 'تیتر پررنگ و لینک');
  assert.equal(readingMinutes('کلمه '.repeat(600)), 3);
  const checks = seoChecks({ title: 'کوتاه', excerpt: '', content: '## تیتر\n[ثبت‌نام](/signup)', slug: 'a', tags: ['x'], coverAlt: '', hasCover: false });
  assert.deepEqual(
    checks.map((c) => c.ok),
    [false, false, false, true, false, true, true, true],
  );
});
