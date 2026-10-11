// Botão do DS: primary (lima), contact (rosa), secondary (roxo, raio 12) e text (lima sublinhado).
// Use href para navegar (<a>) e omita href para ação (<button>).
import { html, attrs } from '../lib/html.mjs';
import { Icon } from './Icon.mjs';

export function Button({ variant = 'primary', href, label, icon, type = 'button', size, extra = {}, external } = {}) {
  const cls = ['btn', `btn--${variant}`, size === 'sm' && 'btn--sm', extra.class].filter(Boolean).join(' ');
  const isExternal = external ?? (href && /^https?:/.test(href));
  const inner = html`<span>${label}</span>${icon ? Icon(icon, { size: 22 }) : ''}`;
  const { class: _c, ...rest } = extra;
  if (href) {
    return html`<a class="${cls}"${attrs({ href, rel: isExternal && 'noopener', target: isExternal && '_blank', ...rest })}>${inner}</a>`;
  }
  return html`<button class="${cls}"${attrs({ type, ...rest })}>${inner}</button>`;
}
