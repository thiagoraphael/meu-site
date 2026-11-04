// Favicon: pacote completo de ícones (ICO, PNGs, Apple, Android/PWA, manifest) num ZIP. Comportamento em app.js.
import { html } from '../../lib/html.mjs';
import { Seg, Field, Drop, NoJs } from '../_shared/ui.mjs';
import { Icon } from '../../components/Icon.mjs';

export default function view() {
  return html`${NoJs()}
<form class="tool" data-app="favicon" autocomplete="off" onsubmit="return false">
  <div class="tool__controls">
    ${Drop({ name: 'logo', title: 'Escolher logo ou ícone', hint: 'SVG ou PNG quadrado de 512 px ou mais. Também dá pra colar.' })}
    <fieldset class="field-group">
      <legend>Ícone</legend>
      ${Seg({ name: 'forma', legend: 'Formato', options: [{ value: 'quadrado', label: 'Quadrado' }, { value: 'arredondado', label: 'Arredondado' }, { value: 'circulo', label: 'Círculo' }] })}
      ${Seg({ name: 'fundo_tipo', legend: 'Fundo', options: [{ value: 'transparente', label: 'Transparente' }, { value: 'cor', label: 'Cor' }] })}
      <div class="field-row">
        ${Field({ label: 'Cor do fundo', name: 'fundo', type: 'color', value: '#1A1A1A' })}
        ${Field({ label: '', live: 'Respiro: {v}%', name: 'respiro', type: 'range', min: 0, max: 30, step: 1, value: 8 })}
      </div>
      <p class="field__hint">O ícone da Apple e o maskable do Android sempre ganham fundo (eles não aceitam transparente): sai a cor escolhida, ou branco.</p>
    </fieldset>
    <fieldset class="field-group">
      <legend>Manifest (Android e PWA)</legend>
      ${Field({ label: 'Nome do site', name: 'nome', value: 'Meu site', maxlength: 45 })}
      <div class="field-row">
        ${Field({ label: 'Nome curto (tela inicial)', name: 'curto', value: 'Site', maxlength: 12 })}
        ${Field({ label: 'Cor do tema', name: 'tema', type: 'color', value: '#1A1A1A' })}
      </div>
      ${Field({ label: 'Pasta no servidor', name: 'pasta', value: '/', maxlength: 60, hint: 'Onde os arquivos vão ficar. Na raiz do site, deixe /.' })}
    </fieldset>
  </div>

  <div class="tool__preview">
    <div class="fv-tabs" aria-label="Prévia na aba do navegador">
      <div class="fv-tab fv-tab--light"><img data-tab16 alt="" width="16" height="16"><span data-tabname>Meu site</span><b aria-hidden="true">×</b></div>
      <div class="fv-tab fv-tab--dark"><img data-tab16d alt="" width="16" height="16"><span data-tabname>Meu site</span><b aria-hidden="true">×</b></div>
    </div>
    <div class="fv-home" aria-label="Prévia na tela inicial do celular">
      <figure><img data-home alt="" width="64" height="64"><figcaption data-homename>Site</figcaption></figure>
      <figure><img data-mask alt="" width="64" height="64"><figcaption>Android</figcaption></figure>
    </div>
    <ul class="fv-files" data-files aria-label="Arquivos gerados"></ul>
    <div class="tool__actions">
      <button class="btn btn--primary" type="button" data-zip><span>Baixar tudo (.zip)</span>${Icon('download', { size: 22 })}</button>
    </div>
    <label class="field"><span>Cole no &lt;head&gt; do site</span>
      <textarea class="textarea fv-code" name="codigo" rows="8" readonly></textarea>
    </label>
    <button class="mini-btn" type="button" data-copy-code>Copiar código</button>
    <p class="tool__status" role="status" aria-live="polite" data-status></p>
  </div>
</form>`;
}
