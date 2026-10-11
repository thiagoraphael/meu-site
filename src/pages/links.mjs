// Links (Links Bio.dc.html): página de bio para o Instagram, sem header/footer globais.
import { html } from '../lib/html.mjs';
import { Document } from '../components/Layout.mjs';
import { resolveLink } from '../lib/page.mjs';
import { Retangulos } from '../components/RotatedRect.mjs';
import { Icon } from '../components/Icon.mjs';
import { Picture } from '../components/Picture.mjs';

export default function links(ctx) {
  const { site, paginas, scenes } = ctx;
  const c = paginas.links;
  const fill = (v) => (typeof v === 'string' && v.startsWith('@') ? site[v.slice(1)] : null);
  const itens = c.itens
    .map((it) => {
      const ref = fill(it.titulo);
      return {
        ...it,
        titulo: ref ? ref.nome : it.titulo,
        sub: fill(it.sub) ? fill(it.sub).descricao : it.sub,
        href: resolveLink(site, it.href),
      };
    })
    .filter((it) => it.href);
  const externo = (href) => /^https?:/.test(href);

  const body = html`<main id="conteudo" class="links-page" tabindex="-1">
  <div class="links-page__shapes">${Retangulos(scenes, 'hero', { state: 'inicial', className: 'shapes--links' })}</div>
  <div class="links-page__content layer">
    <div class="links-page__avatar">
      ${Picture({ name: site.autor.foto, alt: 'Thiago Raphael', ratio: '1/1', sizes: '120px', eager: true, className: 'links-page__photo' })}
      <img class="links-page__ring" src="/assets/logos/anel-lima.svg" alt="" width="168" height="168">
    </div>
    <div class="links-page__id">
      <h1><img src="/assets/logos/horizontal-claro.svg" alt="${site.nome}" width="168" height="40"></h1>
      <p class="accent accent--lima links-page__sign">${c.assinatura}</p>
    </div>
    <nav class="links-page__list" aria-label="Links">
      <ul role="list">
        ${itens.map((it) => html`<li><a class="link-tile link-tile--${it.cor}${it.cor === 'lima' || it.cor === 'rosa' ? ' on-light' : ''}" href="${it.href}"${externo(it.href) ? html` rel="noopener" target="_blank"` : ''}><span class="link-tile__text"><span class="link-tile__title">${it.titulo}</span><span class="link-tile__sub">${it.sub}</span></span>${Icon('arrow-right', { size: 24 })}</a></li>`)}
      </ul>
    </nav>
    <ul class="links-page__social" role="list">
      ${site.social.map((s) => html`<li><a href="${s.href}" rel="noopener" target="_blank">${Icon(s.id, { size: 30, label: s.label })}</a></li>`)}
    </ul>
    <p class="caption">© 2026 Thiago Raphael · Feito com café</p>
  </div>
</main>`;

  return [{
    path: '/links/',
    html: Document(ctx, { title: c.titulo, description: c.descricao, path: '/links/', og: '/og/default.png' }, body),
  }];
}
