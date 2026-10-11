// Home (Site principal.dc.html): hero com retângulos animados, projetos, serviços, sobre, blog e contato.
import { html, rich, plain } from '../lib/html.mjs';
import { Shell } from '../lib/page.mjs';
import { Retangulos } from '../components/RotatedRect.mjs';
import { Button } from '../components/Button.mjs';
import { SectionTitle } from '../components/SectionTitle.mjs';
import { ProjectCard } from '../components/ProjectCard.mjs';
import { BlogPostCard } from '../components/BlogPostCard.mjs';
import { Picture } from '../components/Picture.mjs';

export default function home(ctx) {
  const { site, paginas, projetos, posts, scenes } = ctx;
  const c = paginas.home;
  const destaque = posts.find((p) => p.destaque);
  const ultimos = [destaque, ...posts.filter((p) => p !== destaque)].filter(Boolean).slice(0, 2);

  const main = html`
<section class="hero page-top" aria-labelledby="hero-titulo">
  ${Retangulos(scenes, 'hero', { animated: true })}
  <div class="container grid hero__content layer">
    <p class="label label--hl hero__tag span-all">${c.hero.rotulo}</p>
    <h1 class="display t-hero plate-lines span-all" id="hero-titulo">${c.hero.nome.map((n) => html`<span>${n}</span>`)}</h1>
    <div class="col-hero-text plate-box hero__text stack">
      <p class="t-body-l">${c.hero.texto}</p>
      <div class="btn-row">
        ${Button({ variant: 'primary', href: site.orcamento.href, label: site.orcamento.label })}
        ${Button({ variant: 'text', href: c.hero.ctaSecundario.href, label: c.hero.ctaSecundario.label })}
      </div>
    </div>
  </div>
</section>

<section class="container grid home-section home-section--first" id="projetos" aria-labelledby="projetos-titulo">
  ${SectionTitle({ n: c.projetos.n, title: c.projetos.titulo, id: 'projetos-titulo', className: 'col-label' })}
  <div class="col-main home-projects">
    ${projetos.map((p, i) => ProjectCard(p, { variant: 'featured', n: `${c.projetos.n}.${i + 1}`, headingLevel: 3 }))}
    ${Button({ variant: 'text', href: '/projetos/', label: c.projetos.cta })}
  </div>
</section>

<section class="container grid home-section" id="servicos" aria-labelledby="servicos-titulo">
  ${SectionTitle({ n: c.servicos.n, title: c.servicos.titulo, id: 'servicos-titulo', className: 'col-label' })}
  <div class="col-main stack home-services">
    <p class="display t-lead home-services__lead">${rich(c.servicos.lead, { accent: 'lima' })}</p>
    <p class="t-body-l measure">${c.servicos.texto}</p>
    <ul class="home-services__list" role="list">
      ${c.servicos.itens.map((s) => html`<li class="stack home-services__item"><span class="label label--pink" aria-hidden="true">${s.n}</span><h3 class="display t-title-m">${s.titulo}</h3><p class="t-body">${s.texto}</p></li>`)}
    </ul>
    ${Button({ variant: 'primary', href: site.orcamento.href, label: site.orcamento.label })}
  </div>
</section>

<section class="container grid home-section" id="sobre" aria-labelledby="sobre-titulo">
  ${SectionTitle({ n: c.sobre.n, title: c.sobre.titulo, id: 'sobre-titulo', className: 'col-label' })}
  <div class="col-main home-about">
    ${Picture({ name: site.autor.foto, alt: 'Retrato de Thiago Raphael', sizes: '(min-width: 768px) 25vw, 100vw', ratio: '4/5', className: 'home-about__photo' })}
    <div class="stack home-about__text">
      <p class="display t-lead">${rich(c.sobre.lead)}</p>
      <p class="t-body-l">${c.sobre.texto}</p>
      <div class="home-about__skills">
        ${c.habilidades.map((g) => html`<div class="stack home-about__group"><h3 class="home-about__group-title">${g.grupo}</h3><ul class="home-about__group-list">${g.itens.map((i) => html`<li>${i}</li>`)}</ul></div>`)}
      </div>
    </div>
  </div>
</section>

<section class="container grid home-section" id="blog" aria-labelledby="blog-titulo">
  ${SectionTitle({ n: c.blog.n, title: c.blog.titulo, id: 'blog-titulo', className: 'col-label' })}
  <div class="col-main home-blog">
    ${ultimos.map((p) => BlogPostCard(p, { variant: 'teaser', headingLevel: 3 }))}
  </div>
</section>

<section class="container grid home-section home-contact" id="contato" aria-labelledby="contato-titulo">
  <h2 class="display t-cta span-all home-contact__title" id="contato-titulo">${rich(c.contato.titulo)}</h2>
  <div class="col-hero-text">
    ${Button({ variant: 'contact', href: `mailto:${site.email}`, label: c.contato.cta })}
  </div>
</section>`;

  return [{
    path: '/',
    html: Shell(ctx, {
      current: 'home',
      meta: {
        title: c.titulo,
        description: c.descricao,
        path: '/',
        og: '/og/default.png',
        jsonLd: [
          {
            '@type': 'WebSite',
            '@id': `${site.url}/#site`,
            name: site.nome,
            url: `${site.url}/`,
            inLanguage: 'pt-BR',
            description: plain(site.descricao),
            publisher: { '@id': `${site.url}/#thiago` },
          },
          {
            '@type': 'Person',
            '@id': `${site.url}/#thiago`,
            name: site.nome,
            url: `${site.url}/`,
            image: `${site.url}/assets/img/${site.autor.foto}-800.webp`,
            email: `mailto:${site.email}`,
            jobTitle: 'Desenvolvedor front-end e designer UI/UX',
            knowsAbout: ['Desenvolvimento front-end', 'UI/UX', 'Figma', 'React', 'React Native', 'Análise de dados'],
            address: { '@type': 'PostalAddress', addressLocality: 'Barbacena', addressRegion: 'MG', addressCountry: 'BR' },
            sameAs: site.social.map((s) => s.href),
            description: plain(c.descricao),
          },
        ],
      },
      main,
    }),
  }];
}
