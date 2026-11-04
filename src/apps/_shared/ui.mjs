// Peças de interface dos apps (renderizadas no build). O comportamento fica no app.js de cada app.
import { html, attrs } from '../../lib/html.mjs';
import { Icon } from '../../components/Icon.mjs';

let uid = 0;
const nextId = (p) => `${p}-${++uid}`;

/** Grupo de rádios em pílula. options: [{ value, label, swatch? }] */
export function Seg({ name, legend, options, checked, tabs = false, hideLegend = false }) {
  return html`<fieldset class="seg${tabs ? ' seg--tabs' : ''}">
    <legend class="${hideLegend ? 'visually-hidden' : 'field-group__title'}">${legend}</legend>
    ${options.map((o) => html`<label class="seg__opt"><input type="radio"${attrs({ name, value: o.value, checked: o.value === (checked ?? options[0].value) })}><span>${o.swatch ? html`<i class="seg__swatch" style="background:${o.swatch}"></i>` : ''}${o.label}</span></label>`)}
  </fieldset>`;
}

/** Campo de texto, número, cor, select ou textarea. */
export function Field({ label, name, type = 'text', value, placeholder, hint, options, min, max, step, rows, maxlength, inputmode, autocomplete = 'off' }) {
  const id = nextId(name);
  let control;
  if (type === 'select') control = html`<select class="select"${attrs({ id, name })}>${options.map((o) => html`<option${attrs({ value: o.value, selected: o.value === value })}>${o.label}</option>`)}</select>`;
  else if (type === 'textarea') control = html`<textarea class="textarea"${attrs({ id, name, placeholder, rows: rows || 3, maxlength })}>${value || ''}</textarea>`;
  else if (type === 'range') control = html`<input class="range"${attrs({ id, name, type, value, min, max, step })}>`;
  else control = html`<input class="input${type === 'color' ? ' input--color' : ''}"${attrs({ id, name, type, value, placeholder, min, max, step, maxlength, inputmode, autocomplete })}>`;
  return html`<label class="field"${attrs({ for: id })}><span>${label}</span>${control}${hint ? html`<small class="field__hint">${hint}</small>` : ''}</label>`;
}

export function Check({ label, name, checked = false }) {
  return html`<label class="check"><input type="checkbox"${attrs({ name, checked })}><span>${label}</span></label>`;
}

/** Área de upload (clique, arrastar ou colar). */
export function Drop({ name = 'arquivo', title = 'Escolher imagem', hint = 'Ou arraste e solte aqui. Também dá pra colar com Ctrl+V.', multiple = false }) {
  return html`<div class="drop" data-drop="${name}">
    <input type="file" accept="image/*"${attrs({ name, multiple, 'aria-label': title })}>
    <span class="drop__title" aria-hidden="true">${title}</span>
    <span class="drop__hint">${hint}</span>
  </div>`;
}

/** Prévia + ações (baixar / compartilhar) + status. */
export function Preview({ label, checker = false, actions = true, extra = '' }) {
  return html`<div class="tool__preview">
    <div class="tool__stage${checker ? ' tool__stage--checker' : ''}"><canvas data-canvas role="img" aria-label="${label}"></canvas></div>
    ${actions ? html`<div class="tool__actions">
      <button class="btn btn--primary" type="button" data-download><span>Baixar PNG</span>${Icon('download', { size: 22 })}</button>
      <button class="btn btn--secondary" type="button" data-share hidden><span>Compartilhar</span></button>
      ${extra}
    </div>` : extra}
    <p class="tool__status" role="status" aria-live="polite" data-status></p>
  </div>`;
}

export const NoJs = () => html`<p class="tool-nojs">Esse app precisa de JavaScript ligado no navegador.</p>`;
