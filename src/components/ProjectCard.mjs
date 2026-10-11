// Card editorial de projeto, sem caixa. O link do título cobre o card inteiro.
// variant "default": página Projetos (empilhado, título 48). "featured": home (7 + 5 colunas, título 40).
import { html, raw } from '../lib/html.mjs';
import { Picture } from './Picture.mjs';
import { TagList } from './Tag.mjs';

export function ProjectCard(p, { variant = 'default', n, headingLevel = 2, eager = false } = {}) {
  const h = `h${headingLevel}`;
  const href = `/projetos/${p.slug}/`;
  const sizes = variant === 'featured' ? '(min-width: 768px) 45vw, 100vw' : '(min-width: 1180px) 620px, 100vw';
  const title = html`${raw(`<${h} class="project-card__title display ${variant === 'featured' ? 't-title-m' : 't-title-l'}">`)}<a class="project-card__link" href="${href}">${p.nome}</a>${raw(`</${h}>`)}`;
  const media = Picture({ name: p.thumb, alt: `Thumbnail do projeto ${p.nome}`, sizes, ratio: '16/10', eager, className: 'project-card__media' });

  if (variant === 'featured') {
    return html`<article class="project-card project-card--featured" data-cat="${p.categoria}">
      ${media}
      <div class="project-card__body">
        <span class="label">${n}</span>
        ${title}
        <p class="t-body">${p.resumo}</p>
        ${TagList(p.tags, { label: `Tags de ${p.nome}` })}
      </div>
    </article>`;
  }
  return html`<article class="project-card" data-cat="${p.categoria}">
    ${media}
    <div class="project-card__meta label"><span>${n}</span><span class="project-card__year">${p.ano}</span></div>
    ${title}
    <p class="t-body">${p.resumo}</p>
    ${TagList(p.tags, { label: `Tags de ${p.nome}` })}
  </article>`;
}
