// Contraste: WCAG 2 entre texto e fundo, sugestões de ajuste e simulação de daltonismo. Comportamento em app.js.
import { html } from '../../lib/html.mjs';
import { Seg, NoJs } from '../_shared/ui.mjs';

const cor = (name, label, value) => html`<div class="ct-color">
  <label class="field"><span>${label}</span>
    <span class="ct-color__row">
      <input class="input input--color ct-color__pick" type="color" name="${name}_pick" value="${value}" aria-label="${label}: seletor">
      <input class="input ct-color__hex" type="text" name="${name}" value="${value}" spellcheck="false" autocomplete="off" aria-describedby="${name}-hint">
    </span>
  </label>
  <small class="field__hint" id="${name}-hint">Hex, rgb(), hsl() ou nome em inglês.</small>
</div>`;

export default function view() {
  return html`${NoJs()}
<form class="tool tool--input-first" data-app="contraste" autocomplete="off" onsubmit="return false">
  <div class="tool__controls">
    <div class="ct-pair">
      ${cor('texto', 'Cor do texto', '#7301FF')}
      <button class="mini-btn ct-swap" type="button" data-swap aria-label="Trocar texto e fundo">⇄ Trocar</button>
      ${cor('fundo', 'Cor do fundo', '#F8F8F8')}
    </div>
    <div class="ct-score" aria-live="polite">
      <p class="ct-score__ratio"><span data-ratio>0</span><small>:1</small></p>
      <p class="ct-score__label" data-verdict></p>
    </div>
    <ul class="ct-grades" data-grades aria-label="Resultado por uso"></ul>
    <section class="field-group" aria-labelledby="ct-sug">
      <h2 class="field-group__title" id="ct-sug">Sugestões</h2>
      ${Seg({ name: 'ajustar', legend: 'Ajustar qual cor', options: [{ value: 'texto', label: 'Texto' }, { value: 'fundo', label: 'Fundo' }] })}
      <ul class="ct-sugs" data-sugs></ul>
    </section>
    <section class="field-group" aria-labelledby="ct-hist">
      <h2 class="field-group__title" id="ct-hist">Recentes</h2>
      <ul class="ct-hist" data-hist></ul>
    </section>
  </div>

  <div class="tool__preview">
    ${Seg({ name: 'visao', legend: 'Simular visão', options: [
      { value: 'normal', label: 'Normal' }, { value: 'protan', label: 'Protanopia' }, { value: 'deutan', label: 'Deuteranopia' }, { value: 'tritan', label: 'Tritanopia' }, { value: 'cinza', label: 'Tons de cinza' }] })}
    <div class="ct-sample" data-sample>
      <p class="ct-sample__eyebrow">Título grande · 32 px</p>
      <p class="ct-sample__h">Contraste bom é texto que todo mundo lê.</p>
      <p class="ct-sample__p">Texto normal em 16 px. É aqui que o contraste mais pesa: parágrafos, legendas e rótulos de formulário precisam de pelo menos 4,5:1.</p>
      <p class="ct-sample__s">Texto pequeno, 13 px, tipo rodapé e legenda de foto.</p>
      <span class="ct-sample__btn">Botão de exemplo</span>
      <span class="ct-sample__icon" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6L9 17l-5-5"></path></svg></span>
    </div>
    <p class="field__hint" data-sim-note></p>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <filter id="ct-protan"><feColorMatrix type="matrix" values="0.152286 1.052583 -0.204868 0 0  0.114503 0.786281 0.099216 0 0  -0.003882 -0.048116 1.051998 0 0  0 0 0 1 0"/></filter>
      <filter id="ct-deutan"><feColorMatrix type="matrix" values="0.367322 0.860646 -0.227968 0 0  0.280085 0.672501 0.047413 0 0  -0.011820 0.042940 0.968881 0 0  0 0 0 1 0"/></filter>
      <filter id="ct-tritan"><feColorMatrix type="matrix" values="1.255528 -0.076749 -0.178779 0 0  -0.078411 0.930809 0.147602 0 0  0.004733 0.691367 0.303900 0 0  0 0 0 1 0"/></filter>
      <filter id="ct-cinza"><feColorMatrix type="saturate" values="0"/></filter>
    </svg>
  </div>
</form>`;
}
