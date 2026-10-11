// Card de post. Variações:
//  teaser   home: meta, título, resumo e "Leia mais"
//  row      lista do Blog: meta à esquerda, título e resumo à direita
//  featured destaque do Blog: bloco rosa com imagem 4:3
//  compact  "Leia também" do Post: bloco colorido (rosa ou azul)
import { html, raw } from '../lib/html.mjs';
import { Picture } from './Picture.mjs';
import { TagList } from './Tag.mjs';

const href = (post) => `/blog/${post.slug}/`;

export function BlogPostCard(post, { variant = 'teaser', headingLevel = 3, color = 'rosa' } = {}) {
  const h = `h${headingLevel}`;
  const titleLink = (cls) => html`${raw(`<${h} class="post-card__title ${cls}">`)}<a class="post-card__link" href="${href(post)}">${post.titulo}</a>${raw(`</${h}>`)}`;

  if (variant === 'row') {
    return html`<article class="post-card post-card--row" data-cat="${post.categoria}">
      <span class="label">${post.metaCurta}</span>
      <div class="post-card__text">
        ${titleLink('display t-title-m')}
        <p class="t-body">${post.resumo}</p>
      </div>
    </article>`;
  }

  if (variant === 'featured') {
    return html`<article class="post-card post-card--featured on-light">
      ${Picture({ name: post.capa, alt: post.capaAlt || `Capa do post ${post.titulo}`, sizes: '(min-width: 768px) 50vw, 100vw', ratio: '4/3', className: 'post-card__media' })}
      <div class="post-card__body">
        <span class="label post-card__meta">Destaque · ${post.metaCurta}</span>
        ${titleLink('display t-lead')}
        <p class="t-body">${post.resumo}</p>
        <span class="post-card__more" aria-hidden="true">Leia mais →</span>
      </div>
    </article>`;
  }

  if (variant === 'compact') {
    return html`<article class="post-card post-card--compact post-card--${color}${color === 'rosa' ? ' on-light' : ''}">
      <span class="label post-card__meta">${post.minutos} min</span>
      ${titleLink('display t-title-m')}
      <p class="t-body">${post.resumo}</p>
      ${TagList(post.tags, { surface: color === 'rosa' ? 'pink' : 'blue', label: `Tags de ${post.titulo}` })}
    </article>`;
  }

  return html`<article class="post-card post-card--teaser">
    <span class="label">${post.metaCurta}</span>
    ${titleLink('display t-title-m')}
    <p class="t-body">${post.resumo}</p>
    <span class="post-card__more" aria-hidden="true">Leia mais</span>
  </article>`;
}
