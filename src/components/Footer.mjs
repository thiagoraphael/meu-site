// Footer global: faixa marquee, selo duo no recorte circular, três colunas
// (Páginas, Redes, Contato), logo horizontal lima em largura total e linha legal.
import { html, attrs } from '../lib/html.mjs';
import { Marquee } from './Marquee.mjs';
import { Icon } from './Icon.mjs';

export function Footer(site) {
  const f = site.footer;
  return html`<footer class="site-footer">
  ${Marquee(site.marquee, { variant: 'band-lime', label: 'Sobre o trabalho' })}
  <div class="container site-footer__inner">
    <div class="site-footer__notch"><img src="/assets/logos/selo-duo-lima-rosa.svg" alt="Selo Thiago Raphael" width="150" height="150" loading="lazy" decoding="async"></div>
    <div class="grid site-footer__grid">
      <nav class="site-footer__col site-footer__col--pages" aria-labelledby="footer-paginas">
        <h2 class="site-footer__label" id="footer-paginas">${f.paginas}</h2>
        <ul role="list">${[{ label: 'Início', href: '/' }, ...site.nav].map((l) => html`<li><a href="${l.href}">${l.label}</a></li>`)}</ul>
      </nav>
      <div class="site-footer__col site-footer__col--social">
        <h2 class="site-footer__label" id="footer-redes">${f.redes}</h2>
        <ul role="list" aria-labelledby="footer-redes">${site.social.map((s) => html`<li><a${attrs({ href: s.href, rel: 'noopener', target: '_blank' })}>${Icon(s.id, { size: 22 })}<span>${s.label}</span></a></li>`)}</ul>
      </div>
      <div class="site-footer__col site-footer__col--contact">
        <h2 class="site-footer__label" id="footer-contato">${f.contato}</h2>
        <ul role="list" aria-labelledby="footer-contato">
          <li><a href="mailto:${site.email}">${site.email}</a></li>
          <li><a href="${site.orcamento.href}">${site.orcamento.label}</a></li>
          <li><span>${f.local}</span></li>
        </ul>
      </div>
    </div>
    <img class="site-footer__logo" src="/assets/logos/horizontal-lima.svg" alt="${site.nome}" width="533" height="127" loading="lazy" decoding="async">
    <p class="caption site-footer__legal">${f.legal}</p>
  </div>
</footer>`;
}
