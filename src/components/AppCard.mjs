// Card de app (página Apps e "Outros apps"). Arte em SVG chapado na cor do app; o link do título cobre o card.
// Apps "Extensão" abrem a loja em outra aba.
import { readFileSync, existsSync } from 'node:fs';
import { html, raw } from '../lib/html.mjs';
import { TagList } from './Tag.mjs';
import { Icon } from './Icon.mjs';

const thumb = (slug) => {
  const f = new URL(`../apps/_thumbs/${slug}.svg`, import.meta.url);
  if (!existsSync(f)) throw new Error(`Falta a arte do app: src/apps/_thumbs/${slug}.svg`);
  return readFileSync(f, 'utf8').trim().replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
};

export function AppCard(a, { n, headingLevel = 2, compact = false } = {}) {
  const h = `h${headingLevel}`;
  const ext = !a.web;
  return html`<article class="app-card app-card--${a.cor}${compact ? ' app-card--compact' : ''}" data-cat="${a.grupo || ''}">
    <div class="app-card__art">${raw(thumb(a.slug))}</div>
    <div class="app-card__meta label"><span>${n}</span><span class="app-card__type">${a.tipo}</span></div>
    ${raw(`<${h} class="app-card__title display ${compact ? 't-title-m' : 't-title-l'}">`)}<a class="app-card__link"${raw(ext ? ` href="${a.url}" target="_blank" rel="noopener"` : ` href="${a.url}"`)}>${a.nome}${ext ? html`<span class="visually-hidden"> (abre a Chrome Web Store)</span>${Icon('arrow-right', { size: 28 })}` : ''}</a>${raw(`</${h}>`)}
    ${compact ? '' : html`<p class="t-body">${a.resumo}</p>
    ${TagList(a.tags, { label: `Tags de ${a.nome}` })}`}
  </article>`;
}
