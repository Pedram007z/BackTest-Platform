/**
 * Markdown for blog posts, turned into safe HTML. The server's blog pages and the admin panel's preview
 * use this one renderer, so a post looks the same in both.
 *
 * Everything the writer types is escaped; links may point to http(s), mailto, the site's own pages
 * (/…) or a heading (#…), pictures to http(s) or the site's own files. Supported: # to #### headings
 * (# and ## become h2: the page's h1 is the post title), paragraphs (a single line break is kept),
 * **bold**, *italic*, `code`, ``` code blocks ```, [links](url), ![pictures](url "caption"), - and 1.
 * lists (nested by indenting two spaces), > quotes, --- rules and | tables |.
 */

export interface Heading {
  level: 2 | 3;
  id: string;
  text: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** An address a link may use (anything else becomes "#"). */
function safeUrl(url: string, image = false): string {
  const u = url.trim();
  if (/^https?:\/\//i.test(u) || /^\/(?!\/)/.test(u)) return u;
  if (!image && (/^mailto:/i.test(u) || u.startsWith('#'))) return u;
  return '#';
}

/** A heading's id: its words joined with hyphens (Persian letters kept). */
export function headingId(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[‌\s]+/g, '-')
      .replace(/[^\p{L}\p{N}-]+/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'section'
  );
}

// ---------- inline ----------
function inline(text: string): string {
  const keep: string[] = [];
  const hold = (html: string) => `\u0000${keep.push(html) - 1}\u0000`;
  // code spans first: nothing inside them is formatted
  let s = text.replace(/`([^`\n]+)`/g, (_, c: string) => hold(`<code>${esc(c)}</code>`));
  s = s.replace(/!\[([^\]\n]*)\]\(([^)\s]+)(?:\s+"([^"\n]*)")?\)/g, (_, alt: string, url: string, title?: string) =>
    hold(`<img src="${esc(safeUrl(url, true))}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy" decoding="async">`),
  );
  s = s.replace(/\[([^\]\n]+)\]\(([^)\s]+)(?:\s+"([^"\n]*)")?\)/g, (_, label: string, url: string, title?: string) => {
    const href = safeUrl(url);
    const external = /^https?:\/\//i.test(href);
    return hold(`<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${inlineText(label)}</a>`);
  });
  return inlineText(s).replace(/\u0000(\d+)\u0000/g, (_, i: string) => keep[Number(i)]);
}

/** Escaped text with bold and italic (no links: used inside link labels too). */
function inlineText(s: string): string {
  return esc(s)
    .replace(/\*\*(?=\S)([^*]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(?=\S)([^_]+?)__/g, '<strong>$1</strong>')
    .replace(/\*(?=\S)([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(/(^|[\s(])_(?=\S)([^_\n]+?)_(?=$|[\s).,!?:؛،])/g, '$1<em>$2</em>');
}

// ---------- blocks ----------
const FENCE = /^\s*```\s*([\w+-]*)\s*$/;
const HEADING = /^(#{1,4})\s+(.+?)\s*#*\s*$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const LIST = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const IMAGE_LINE = /^\s*!\[([^\]\n]*)\]\(([^)\s]+)(?:\s+"([^"\n]*)")?\)\s*$/;

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

interface ListItem {
  indent: number;
  ordered: boolean;
  text: string;
}

function renderList(items: ListItem[]): string {
  let i = 0;
  const level = (indent: number): string => {
    const ordered = items[i].ordered;
    let out = ordered ? '<ol>' : '<ul>';
    while (i < items.length && items[i].indent >= indent) {
      if (items[i].indent > indent) {
        out = out.replace(/<\/li>$/, '') + level(items[i].indent) + '</li>';
        continue;
      }
      out += `<li>${inline(items[i].text)}</li>`;
      i++;
    }
    return out + (ordered ? '</ol>' : '</ul>');
  };
  let html = '';
  while (i < items.length) html += level(items[i].indent);
  return html;
}

export function renderMarkdown(md: string): { html: string; headings: Heading[] } {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  const headings: Heading[] = [];
  const used = new Map<string, number>();
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`);
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      flush();
      continue;
    }
    const fence = FENCE.exec(line);
    if (fence) {
      flush();
      const code: string[] = [];
      for (i++; i < lines.length && !FENCE.test(lines[i]); i++) code.push(lines[i]);
      out.push(`<pre dir="ltr"><code${fence[1] ? ` class="language-${esc(fence[1])}"` : ''}>${esc(code.join('\n'))}</code></pre>`);
      continue;
    }
    const h = HEADING.exec(line);
    if (h) {
      flush();
      const tag = Math.max(2, h[1].length);
      const text = h[2];
      const plain = markdownText(text);
      let id = headingId(plain);
      const n = used.get(id) ?? 0;
      used.set(id, n + 1);
      if (n) id = `${id}-${n + 1}`;
      if (tag <= 3) headings.push({ level: tag as 2 | 3, id, text: plain });
      out.push(`<h${tag} id="${esc(id)}">${inline(text)}</h${tag}>`);
      continue;
    }
    if (RULE.test(line)) {
      flush();
      out.push('<hr>');
      continue;
    }
    const img = IMAGE_LINE.exec(line);
    if (img) {
      flush();
      const caption = img[3] || img[1];
      out.push(
        `<figure><img src="${esc(safeUrl(img[2], true))}" alt="${esc(img[1])}" loading="lazy" decoding="async">${caption ? `<figcaption>${inlineText(caption)}</figcaption>` : ''}</figure>`,
      );
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      flush();
      const head = cells(line);
      const align = cells(lines[i + 1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'left' : c.startsWith(':') ? 'right' : ''));
      const style = (k: number) => (align[k] ? ` style="text-align:${align[k]}"` : '');
      let html = `<div class="table-wrap"><table><thead><tr>${head.map((c, k) => `<th${style(k)}>${inline(c)}</th>`).join('')}</tr></thead><tbody>`;
      for (i += 2; i < lines.length && lines[i].includes('|') && lines[i].trim(); i++) {
        const row = cells(lines[i]);
        html += `<tr>${head.map((_, k) => `<td${style(k)}>${inline(row[k] ?? '')}</td>`).join('')}</tr>`;
      }
      i--;
      out.push(`${html}</tbody></table></div>`);
      continue;
    }
    if (QUOTE.test(line)) {
      flush();
      const quoted: string[] = [];
      for (; i < lines.length && QUOTE.test(lines[i]); i++) quoted.push(QUOTE.exec(lines[i])![1]);
      i--;
      out.push(`<blockquote>${renderMarkdown(quoted.join('\n')).html}</blockquote>`);
      continue;
    }
    if (LIST.test(line)) {
      flush();
      const items: ListItem[] = [];
      for (; i < lines.length; i++) {
        const m = LIST.exec(lines[i]);
        if (m) items.push({ indent: m[1].replace(/\t/g, '  ').length, ordered: /\d/.test(m[2]), text: m[3] });
        else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) items[items.length - 1].text += ' ' + lines[i].trim();
        else break;
      }
      i--;
      out.push(renderList(items));
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return { html: out.join('\n'), headings };
}

/** The words of a post without its formatting (search snippets, reading time, the RSS feed). */
export function markdownText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '')
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, ' ')
    .replace(/[|*_`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
