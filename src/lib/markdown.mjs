// Markdown mínimo para os posts: front matter, títulos, parágrafos, listas,
// citação, código, imagem, link, negrito e itálico. Sem dependências.
import { esc } from './html.mjs';

export function parseFrontMatter(source) {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: source };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
    data[key] = value;
  }
  return { data, body: m[2] };
}

function inline(text, ctx) {
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => ctx.image(src, alt));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, href) => {
    const ext = /^https?:/.test(href);
    return `<a href="${href}"${ext ? ' rel="noopener" target="_blank"' : ''}>${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/ {2,}$/gm, '<br>');
  return s;
}

/**
 * @param {string} md
 * @param {{ image:(src:string, alt:string)=>string, figure?:(src:string, alt:string)=>string }} ctx
 * O maior título do texto vira <h2> (o título do post é o único <h1>), e os demais descem na mesma proporção.
 */
export function markdownToHtml(md, ctx) {
  const levels = [...md.matchAll(/^(#{1,6})\s/gm)].map((m) => m[1].length);
  const offset = levels.length ? 2 - Math.min(...levels) : 0;
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null;
  let quote = [];

  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join('\n'), ctx)}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i, ctx)}</li>`).join('')}</${list.tag}>`); list = null; } };
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote><p>${inline(quote.join(' '), ctx)}</p></blockquote>`); quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) {
      flushAll();
      const code = [];
      for (i++; i < lines.length && !/^```/.test(lines[i]); i++) code.push(lines[i]);
      out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushAll();
      const level = Math.min(6, h[1].length + offset);
      out.push(`<h${level}>${inline(h[2].replace(/\*\*/g, ''), ctx)}</h${level}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { flushAll(); out.push('<hr>'); continue; }
    const img = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) { flushAll(); out.push(ctx.figure ? ctx.figure(img[2], img[1]) : ctx.image(img[2], img[1])); continue; }
    const q = line.match(/^>\s?(.*)$/);
    if (q) { flushPara(); flushList(); quote.push(q[1]); continue; }
    const li = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      flushPara(); flushQuote();
      const tag = /\d/.test(li[1]) ? 'ol' : 'ul';
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push(li[2]);
      continue;
    }
    if (!line.trim()) { flushAll(); continue; }
    flushList(); flushQuote();
    para.push(line);
  }
  flushAll();
  return out.join('\n');
}

export function readingMinutes(md) {
  const words = md.replace(/[#>*`![\]()_-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
