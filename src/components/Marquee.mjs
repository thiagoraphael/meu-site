// Faixa de texto em loop (40 s, linear). Conteúdo duplicado para o loop; leitores de tela recebem o texto uma vez pelo aria-label.
// Pausa no hover; com prefers-reduced-motion fica parada (regra em tokens.css).
import { html } from '../lib/html.mjs';

export function Marquee(items = [], { variant = 'band-lime', label = 'Destaques' } = {}) {
  // Repete os itens até a faixa ficar mais larga que telas grandes.
  const reps = Math.max(2, Math.ceil(8 / Math.max(1, items.length)));
  // As duas cópias ficam aria-hidden: o texto é anunciado uma vez pelo aria-label.
  const group = () => html`<div class="marquee__group" aria-hidden="true">${Array.from({ length: reps }, () => items.map((t) => html`<span class="marquee__item">${t}</span><span class="marquee__sep" aria-hidden="true">·</span>`))}</div>`;
  return html`<div class="marquee marquee--${variant}" role="marquee" aria-label="${label}: ${items.join(', ')}"><div class="marquee__track">${group()}${group()}</div></div>`;
}
