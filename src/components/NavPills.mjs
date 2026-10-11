// Navegação em pílulas: círculo do início (Th) + pílulas roxas. Página atual em lima.
import { html, attrs } from '../lib/html.mjs';

export function NavPills(items, current, { homeLabel = 'Início' } = {}) {
  return html`<ul class="nav-pills" role="list">
    <li><a class="nav-pills__home"${attrs({ href: '/', 'aria-current': current === 'home' && 'page' })}><img src="/assets/logos/${current === 'home' ? 'th-escuro' : 'th-lima'}.svg" alt="" width="30" height="29"><span class="visually-hidden">${homeLabel}</span></a></li>
    ${items.map((it) => html`<li><a class="nav-pill${current === it.id ? ' is-current' : ''}"${attrs({ href: it.href, 'aria-current': current === it.id && 'page' })}>${it.label}</a></li>`)}
  </ul>`;
}

// Mesma lista, no formato da folha roxa do menu mobile (pílulas lima, Kanit grande, atual em rosa).
export function NavSheetLinks(items, current, { homeLabel = 'Início' } = {}) {
  const all = [{ id: 'home', label: homeLabel, href: '/' }, ...items];
  return html`<ul class="menu-sheet__list" role="list">${all.map((it) => html`<li><a class="menu-sheet__link${current === it.id ? ' is-current' : ''}"${attrs({ href: it.href, 'aria-current': current === it.id && 'page' })}>${it.label}</a></li>`)}</ul>`;
}
