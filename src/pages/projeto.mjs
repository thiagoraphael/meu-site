// Projeto (Projeto.dc.html): topo roxo com retângulos, ficha técnica, capa, blocos, galeria e próximo projeto.
import { html, attrs } from '../lib/html.mjs';
import { Shell, breadcrumb } from '../lib/page.mjs';
import { Retangulos } from '../components/RotatedRect.mjs';
import { SectionTitle } from '../components/SectionTitle.mjs';
import { Picture } from '../components/Picture.mjs';

export default function projeto(ctx) {
  const { site, paginas, scenes, projetos } = ctx;
  const c = paginas.projeto;

  return projetos.map((p, i) => {
    const proximo = projetos[(i + 1) % projetos.length];
    const main = html`
<header class="page-top project-head on-dark" aria-labelledby="projeto-h1">
  ${Retangulos(scenes, 'projeto')}
  <div class="container stack project-head__content layer">
    <a class="label project-head__back" href="/projetos/">${c.voltar}</a>
    <h1 class="display t-page" id="projeto-h1">${p.nome}</h1>
    <p class="t-body-l measure project-head__intro">${p.intro}</p>
  </div>
</header>

<section class="container" aria-label="${c.fichaRotulo}">
  <dl class="project-facts">
    ${p.ficha.map((f) => html`<div class="project-facts__item"><dt class="label label--pink label--caps">${f.k}</dt><dd class="t-body">${f.href ? html`<a${attrs({ href: f.href, rel: 'noopener', target: '_blank' })}>${f.v}</a>` : f.v}</dd></div>`)}
  </dl>
</section>

<div class="container project-cover">
  ${Picture({ name: p.capa?.img, alt: p.capa?.alt || `Capa do projeto ${p.nome}`, ratio: '16/9', sizes: '(min-width: 1392px) 1272px, 100vw', eager: true })}
</div>

${p.blocos.map((b, j) => html`<section class="container project-block" aria-labelledby="bloco-${j + 1}">
  ${SectionTitle({ n: String(j + 1).padStart(2, '0'), title: b.titulo, id: `bloco-${j + 1}` })}
  <div class="stack project-block__text">
    <p class="display t-title-m">${b.lead}</p>
    <p class="t-body measure">${b.texto}</p>
  </div>
</section>`)}

${p.galeria?.length ? html`<section class="container project-gallery" aria-label="Galeria de telas">
  ${p.galeria.map((g) => Picture({ name: g.img, alt: g.alt, ratio: g.ratio, className: g.largo ? 'project-gallery__wide' : g.ratio === '9/16' ? 'project-gallery__tall' : '', sizes: g.largo ? '(min-width: 1392px) 1272px, 100vw' : '(min-width: 768px) 50vw, 100vw' }))}
</section>` : ''}

<section class="container project-next" aria-label="Próximo projeto">
  <a class="project-next__link on-light" href="/projetos/${proximo.slug}/">
    <span class="label project-next__label">${c.proximo}</span>
    <span class="display t-cta">${proximo.nome}</span>
  </a>
</section>`;

    return {
      path: `/projetos/${p.slug}/`,
      html: Shell(ctx, {
        current: 'projetos',
        headerTone: 'purple',
        meta: { title: `${p.nome} · Projetos · Thiago Raphael`, description: p.resumo, path: `/projetos/${p.slug}/`, og: `/og/projetos/${p.slug}.png`, type: 'article',
          jsonLd: [
            {
              '@type': 'CreativeWork',
              name: p.nome,
              headline: p.ogTitulo || p.nome,
              description: p.resumo,
              url: new URL(`/projetos/${p.slug}/`, site.url).href,
              image: new URL(`/og/projetos/${p.slug}.png`, site.url).href,
              dateCreated: p.ano,
              genre: p.categoria,
              keywords: (p.tags || []).join(', '),
              inLanguage: 'pt-BR',
              creator: { '@type': 'Person', '@id': `${site.url}/#thiago`, name: site.nome, url: `${site.url}/sobre/` },
            },
            breadcrumb(site, [['Projetos', '/projetos/'], [p.nome, `/projetos/${p.slug}/`]]),
          ],
        },
        main,
      }),
    };
  });
}
