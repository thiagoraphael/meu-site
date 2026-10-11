// Header global. Desktop: logo horizontal sobre placa escura + pílulas.
// Mobile (< 768): logo Th + botão "Menu" que abre a folha roxa em tela cheia.
import { html } from '../lib/html.mjs';
import { NavPills, NavSheetLinks } from './NavPills.mjs';
import { Icon } from './Icon.mjs';

export function Header(site, current, { tone } = {}) {
  return html`<header class="site-header${tone ? ` site-header--on-${tone}` : ''}">
  <div class="container site-header__inner">
    <a class="site-header__logo" href="/" aria-label="${site.nome}, página inicial">
      <picture>
        <source media="(max-width: 767px)" srcset="/assets/logos/th-claro.svg" width="41" height="40">
        <img src="/assets/logos/horizontal-claro.svg" alt="" width="168" height="40">
      </picture>
    </a>
    <nav class="site-header__nav" aria-label="Principal">${NavPills(site.nav, current)}</nav>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-sheet" data-menu-open>Menu</button>
  </div>
  <div class="menu-sheet" id="menu-sheet" role="dialog" aria-modal="true" aria-label="Menu" hidden data-menu-sheet>
    <div class="container menu-sheet__top">
      <img src="/assets/logos/th-lima.svg" alt="" width="41" height="40">
      <button class="menu-sheet__close" type="button" data-menu-close>${Icon('close', { size: 22 })}<span>Fechar</span></button>
    </div>
    <nav class="container" aria-label="Menu">${NavSheetLinks(site.nav, current)}</nav>
  </div>
</header>`;
}
