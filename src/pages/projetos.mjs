// Projetos (Projetos.dc.html): topo com retângulos, filtros, grade de cards, estado vazio e CTA.
import { html, rich } from '../lib/html.mjs';
import { Shell, breadcrumb } from '../lib/page.mjs';
import { Retangulos } from '../components/RotatedRect.mjs';
import { Button } from '../components/Button.mjs';
import { ProjectCard } from '../components/ProjectCard.mjs';

export default function projetos(ctx) {
  const { site, paginas, scenes } = ctx;
  const c = paginas.projetos;
  const lista = ctx.projetos;
  const categorias = new Set(lista.map((p) => p.categoria));
  for (const f of c.filtros) if (f !== 'Todos' && !categorias.has(f)) ctx.todo('paginas/projetos.json', `Filtro "${f}" não tem nenhum projeto`);

  const main = html`
<header class="page-top page-head" aria-labelledby="projetos-h1">
  ${Retangulos(scenes, 'projetos')}
  <div class="container stack page-head__content layer">
    <p class="label">${c.rotulo}</p>
    <h1 class="display t-page" id="projetos-h1">${c.h1}</h1>
    <p class="t-body-l measure">${c.lead}</p>
  </div>
</header>

<section class="container stack projects-list" aria-labelledby="projetos-h1">
  <div class="filters" role="group" aria-label="Filtrar projetos" data-filters="lista-projetos" data-empty="projetos-vazio" data-status="projetos-status" data-one="projeto" data-many="projetos">
    ${c.filtros.map((f) => html`<button class="filter" type="button" data-filter="${f}" aria-pressed="${f === 'Todos'}">${f}</button>`)}
  </div>
  <p class="visually-hidden" id="projetos-status" role="status" aria-live="polite"></p>
  <div class="project-grid" id="lista-projetos">
    ${lista.map((p, i) => ProjectCard(p, { n: String(i + 1).padStart(2, '0'), headingLevel: 2, eager: i < 2 }))}
  </div>
  <div class="empty-state stack" id="projetos-vazio"${lista.length ? html` hidden` : ''}>
    <span class="label">${c.vazio.contador}</span>
    <h2 class="display t-title-l">${rich(c.vazio.titulo)}</h2>
    <p class="t-body measure">${c.vazio.texto}</p>
    <div class="btn-row">
      ${Button({ variant: 'primary', href: site.orcamento.href, label: site.orcamento.label })}
      ${Button({ variant: 'text', label: c.vazio.verTodos, extra: { 'data-show-all': 'lista-projetos' } })}
    </div>
  </div>
</section>

<section class="container stack page-cta" aria-labelledby="projetos-cta">
  <h2 class="display t-cta" id="projetos-cta">${rich(c.cta.titulo)}</h2>
  ${Button({ variant: 'primary', href: site.orcamento.href, label: site.orcamento.label })}
</section>`;

  return [{
    path: '/projetos/',
    html: Shell(ctx, { current: 'projetos', meta: { title: c.titulo, description: c.descricao, path: '/projetos/', og: '/og/projetos.png',
      jsonLd: [
        {
          '@type': 'CollectionPage',
          name: 'Projetos',
          url: `${ctx.site.url}/projetos/`,
          inLanguage: 'pt-BR',
          mainEntity: { '@type': 'ItemList', itemListElement: ctx.projetos.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${ctx.site.url}/projetos/${p.slug}/`, name: p.nome })) },
        },
        breadcrumb(ctx.site, [['Projetos', '/projetos/']]),
      ] }, main }),
  }];
}
