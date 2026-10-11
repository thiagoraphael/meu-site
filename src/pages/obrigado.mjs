// Obrigado (Obrigado.dc.html): retângulos no estado "fim", "Recebi! valeu" e atalhos "Enquanto isso".
import { html, rich } from '../lib/html.mjs';
import { Shell, resolveLink } from '../lib/page.mjs';
import { Retangulos } from '../components/RotatedRect.mjs';
import { SectionTitle } from '../components/SectionTitle.mjs';

export default function obrigado(ctx) {
  const { site, paginas, scenes } = ctx;
  const c = paginas.obrigado;
  const atalhos = c.atalhos.map((a) => ({ ...a, href: resolveLink(site, a.href) })).filter((a) => a.href);

  const main = html`
<section class="page-top thanks" aria-labelledby="obrigado-h1">
  ${Retangulos(scenes, 'hero', { state: 'fim' })}
  <div class="container stack thanks__content layer">
    <p class="label label--hl thanks__tag">${c.rotulo}</p>
    <h1 class="display t-page plate-lines" id="obrigado-h1">${c.h1.map((l) => html`<span>${rich(l)}</span>`)}</h1>
    <p class="t-body-l plate-box thanks__text">${c.texto} <a href="mailto:${site.email}">${site.email}</a>.</p>
  </div>
</section>

<section class="container stack thanks-next" aria-labelledby="enquanto-isso">
  ${SectionTitle({ title: c.enquantoIsso, id: 'enquanto-isso' })}
  <ul class="thanks-next__grid" role="list">
    ${atalhos.map((a, i) => html`<li><a class="shortcut shortcut--${a.cor}${a.cor === 'roxo' ? '' : ' on-light'}" href="${a.href}"${/^https?:/.test(a.href) ? html` rel="noopener" target="_blank"` : ''}><span class="shortcut__n">${String(i + 1).padStart(2, '0')}</span><span class="display t-title-l">${a.titulo}</span><span class="shortcut__arrow" aria-hidden="true">→</span></a></li>`)}
  </ul>
</section>`;

  return [{
    path: '/obrigado/',
    noindex: true,
    html: Shell(ctx, { current: null, meta: { title: c.titulo, description: c.descricao, path: '/obrigado/', og: '/og/default.png', noindex: true }, main }),
  }];
}
