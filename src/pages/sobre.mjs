// Sobre (Sobre.dc.html): "OLAAA!" gigante com a foto inclinada, bio, como trabalho, habilidades e contato rosa.
import { html, rich } from '../lib/html.mjs';
import { Shell } from '../lib/page.mjs';
import { Retangulos } from '../components/RotatedRect.mjs';
import { Button } from '../components/Button.mjs';
import { SectionTitle } from '../components/SectionTitle.mjs';
import { TagList } from '../components/Tag.mjs';
import { Picture } from '../components/Picture.mjs';

export default function sobre(ctx) {
  const { site, paginas, scenes } = ctx;
  const c = paginas.sobre;
  const habilidades = paginas.home.habilidades;

  const main = html`
<header class="page-top about-hello container" aria-label="Apresentação">
  <p class="display about-hello__word" aria-hidden="true">${c.ola}</p>
  ${Picture({ name: site.autor.foto, alt: c.fotoAlt, ratio: '357/309', sizes: '(min-width: 768px) 24vw, 40vw', eager: true, className: 'about-hello__photo' })}
</header>

<section class="container about-bio" aria-labelledby="sobre-h1">
  <h1 class="display t-lead" id="sobre-h1">${rich(c.h1)}</h1>
  <div class="stack about-bio__text">
    ${c.bio.map((p) => html`<p class="t-body-l">${p}</p>`)}
    <div class="btn-row">
      ${Button({ variant: 'primary', href: site.orcamento.href, label: site.orcamento.label })}
      ${Button({ variant: 'secondary', href: site.curriculo.href, label: site.curriculo.label, icon: 'download', extra: { download: '' } })}
    </div>
  </div>
</section>

<section class="container stack about-section" aria-labelledby="como-trabalho">
  ${SectionTitle({ n: c.comoTrabalho.n, title: c.comoTrabalho.titulo, id: 'como-trabalho' })}
  <ol class="about-steps" role="list">
    ${c.comoTrabalho.etapas.map((e) => html`<li class="about-step about-step--${e.cor}${e.cor === 'lima' || e.cor === 'rosa' ? ' on-light' : ''}"><span class="about-step__n" aria-hidden="true">${e.n}</span><h3 class="display t-title-l">${e.titulo}</h3><p class="t-body">${e.texto}</p></li>`)}
  </ol>
</section>

<section class="container stack about-section" aria-labelledby="habilidades">
  ${SectionTitle({ n: c.habilidades.n, title: c.habilidades.titulo, id: 'habilidades' })}
  <div class="about-skills">
    ${habilidades.map((g) => html`<div class="stack about-skills__group"><h3 class="display t-title-l about-skills__title">${g.grupo}</h3>${TagList(g.itens, { label: `Habilidades de ${g.grupo}` })}</div>`)}
  </div>
</section>

<section class="about-contact on-light" aria-labelledby="sobre-contato">
  ${Retangulos(scenes, 'sobre-contato')}
  <div class="container stack about-contact__content layer">
    <h2 class="display t-cta" id="sobre-contato">${c.contato.titulo}</h2>
    ${Button({ variant: 'primary', href: `mailto:${site.email}`, label: c.contato.cta })}
  </div>
</section>`;

  return [{
    path: '/sobre/',
    html: Shell(ctx, { current: 'sobre', meta: { title: c.titulo, description: c.descricao, path: '/sobre/', og: '/og/default.png' }, main }),
  }];
}
