// Título de seção: número em lima + nome em Space Mono 700 itálico, alinhados pela linha de base.
import { html, raw } from '../lib/html.mjs';

export function SectionTitle({ n, title, level = 2, id, className = '' }) {
  const tag = `h${level}`;
  return html`<div class="section-title ${className}">${n ? html`<span class="section-title__n" aria-hidden="true">${n}</span>` : ''}${raw(`<${tag} class="section-title__h"${id ? ` id="${id}"` : ''}>`)}${n ? html`<span class="visually-hidden">${n} · </span>` : ''}${title}${raw(`</${tag}>`)}</div>`;
}
