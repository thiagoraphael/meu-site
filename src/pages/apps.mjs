// Apps: lista das ferramentas (web e extensão) e a página de cada app web em /apps/<slug>/.
// A interface de cada app vem de src/apps/<slug>/view.mjs; CSS e JS próprios entram só na página dele.
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { html, rich, plain } from '../lib/html.mjs';
import { Shell, breadcrumb } from '../lib/page.mjs';
import { Retangulos } from '../components/RotatedRect.mjs';
import { Button } from '../components/Button.mjs';
import { AppCard } from '../components/AppCard.mjs';

const num = (i) => String(i + 1).padStart(2, '0');

export default async function apps(ctx) {
  const { site, paginas, scenes } = ctx;
  const c = paginas.apps;
  const lista = ctx.apps;
  const cta = html`<section class="container stack page-cta" aria-labelledby="apps-cta">
  <h2 class="display t-cta" id="apps-cta">${rich(c.cta.titulo)}</h2>
  <p class="t-body-l measure">${c.cta.texto}</p>
  ${Button({ variant: 'primary', href: `mailto:${site.email}?subject=Ideia%20de%20app`, label: 'Mandar ideia' })}
</section>`;

  const main = html`
<header class="page-top page-head" aria-labelledby="apps-h1">
  ${Retangulos(scenes, 'apps')}
  <div class="container stack page-head__content layer">
    <p class="label">${c.rotulo}</p>
    <h1 class="display t-page" id="apps-h1">${c.h1}</h1>
    <p class="t-body-l measure plate">${c.lead}</p>
  </div>
</header>

<section class="container stack apps-list" aria-labelledby="apps-h1">
  <p class="label label--pink apps-list__note">${c.privacidade}</p>
  <div class="app-grid">${lista.map((a, i) => AppCard(a, { n: num(i), headingLevel: 2 }))}</div>
</section>
${cta}`;

  const rotas = [{
    path: '/apps/',
    html: Shell(ctx, {
      current: 'apps',
      meta: {
        title: c.titulo, description: c.descricao, path: '/apps/', og: '/og/apps.png',
        jsonLd: [
          {
            '@type': 'CollectionPage', name: 'Apps', url: `${site.url}/apps/`, inLanguage: 'pt-BR',
            mainEntity: { '@type': 'ItemList', itemListElement: lista.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: new URL(a.url, site.url).href, name: a.nome })) },
          },
          breadcrumb(site, [['Apps', '/apps/']]),
        ],
      },
      main,
    }),
  }];

  for (const a of lista.filter((x) => x.web)) {
    const viewFile = new URL(`../apps/${a.slug}/view.mjs`, import.meta.url);
    if (!existsSync(viewFile)) { ctx.todo(`apps/${a.slug}`, 'Falta src/apps/<slug>/view.mjs (o app não tem página ainda)'); continue; }
    const view = (await import(pathToFileURL(viewFile.pathname).href)).default;
    const i = lista.indexOf(a);
    const outros = lista.filter((x) => x !== a);
    const path = `/apps/${a.slug}/`;
    const page = html`
<header class="page-top page-head app-head" aria-labelledby="app-h1">
  ${Retangulos(scenes, 'app')}
  <div class="container stack page-head__content app-head__content layer">
    <a class="label app-head__back" href="/apps/">← Apps</a>
    <p class="label label--hl">${a.rotulo} · ${num(i)}</p>
    <h1 class="display t-page" id="app-h1">${rich(a.h1, { accent: 'lima' })}</h1>
    <p class="t-body-l measure plate">${a.lead}</p>
  </div>
</header>

<section class="container tool-wrap" aria-label="${a.nome}">
${view(ctx, a)}
</section>

<section class="container grid app-how" aria-labelledby="app-como">
  <h2 class="section-title__h col-label" id="app-como">${c.como}</h2>
  <ul class="col-main app-how__list" role="list">
    ${a.como.map((it) => html`<li class="stack app-how__item"><h3 class="display t-title-m">${it.titulo}</h3><p class="t-body">${rich(it.texto)}</p></li>`)}
  </ul>
  <p class="col-main label label--pink">${c.privacidade}</p>
</section>

<section class="container stack app-others" aria-labelledby="app-outros">
  <h2 class="section-title__h" id="app-outros">${c.outros}</h2>
  <div class="app-grid app-grid--compact">${outros.map((o) => AppCard(o, { n: num(lista.indexOf(o)), headingLevel: 3, compact: true }))}</div>
</section>
${cta}`;

    rotas.push({
      path,
      html: Shell(ctx, {
        current: 'apps',
        meta: {
          title: a.titulo, description: a.resumo, path, og: `/og/apps/${a.slug}.png`,
          css: [a.assets.css], js: [a.assets.js], bodyClass: `app-page app-page--${a.slug}`,
          jsonLd: [
            {
              '@type': 'WebApplication',
              name: a.nome,
              alternateName: plain(a.ogTitulo),
              description: a.resumo,
              url: new URL(path, site.url).href,
              image: new URL(`/og/apps/${a.slug}.png`, site.url).href,
              applicationCategory: a.categoria,
              operatingSystem: 'Qualquer navegador moderno',
              browserRequirements: 'Requer JavaScript',
              inLanguage: 'pt-BR',
              isAccessibleForFree: true,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
              author: { '@type': 'Person', '@id': `${site.url}/#thiago`, name: site.nome, url: `${site.url}/sobre/` },
            },
            breadcrumb(site, [['Apps', '/apps/'], [a.nome, path]]),
          ],
        },
        main: page,
      }),
    });
  }
  return rotas;
}
