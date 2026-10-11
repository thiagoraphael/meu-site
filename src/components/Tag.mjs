// Tag informativa (não clicável) e lista de tags.
import { html } from '../lib/html.mjs';

export function Tag(text, { surface = 'dark' } = {}) {
  return html`<span class="tag tag--${surface}">${text}</span>`;
}

export function TagList(tags = [], { surface = 'dark', label = 'Tags' } = {}) {
  if (!tags.length) return '';
  return html`<ul class="tag-list" role="list" aria-label="${label}">${tags.map((t) => html`<li>${Tag(t, { surface })}</li>`)}</ul>`;
}
