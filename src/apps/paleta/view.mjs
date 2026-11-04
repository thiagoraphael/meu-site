// Paleta: extrai as cores de uma imagem, com conta-gotas, contraste e exportação. Comportamento em app.js.
import { html } from '../../lib/html.mjs';
import { Seg, Field, Drop, NoJs } from '../_shared/ui.mjs';
import { Icon } from '../../components/Icon.mjs';

export default function view() {
  return html`${NoJs()}
<form class="tool tool--paleta" data-app="paleta" autocomplete="off" onsubmit="return false">
  <div class="tool__controls">
    ${Drop({ name: 'imagem', title: 'Escolher imagem' })}
    <button class="btn btn--text" type="button" data-sample>Testar com uma imagem de exemplo</button>
    <div class="pal-source" data-source-wrap hidden>
      <canvas class="pal-source__img" data-source aria-label="Imagem enviada. Clique num ponto pra adicionar a cor à paleta." role="img"></canvas>
      <p class="field__hint" data-hover>Clique na imagem pra pegar uma cor exata.</p>
    </div>
    <fieldset class="field-group">
      <legend>Ajustes</legend>
      ${Field({ label: 'Quantidade de cores: 6', name: 'qtd', type: 'range', min: 3, max: 12, step: 1, value: 6 })}
      ${Seg({ name: 'ordem', legend: 'Ordenar por', options: [{ value: 'presenca', label: 'Presença' }, { value: 'luz', label: 'Claro → escuro' }, { value: 'matiz', label: 'Matiz' }] })}
      ${Field({ label: 'Prefixo dos nomes', name: 'prefixo', value: 'cor', maxlength: 24, hint: 'Vira --cor-1, --cor-2... Clique no nome de uma cor pra renomear.' })}
    </fieldset>
  </div>

  <div class="tool__preview">
    <h2 class="field-group__title" id="pal-titulo">Paleta</h2>
    <ol class="pal-list" data-list aria-labelledby="pal-titulo"></ol>
    <p class="pal-empty" data-empty>Envie uma imagem pra ver as cores aqui.</p>

    <div class="field-group" data-export hidden>
      ${Seg({ name: 'formato', legend: 'Exportar como', options: [
        { value: 'css', label: 'CSS' }, { value: 'tw4', label: 'Tailwind 4' }, { value: 'tw3', label: 'Tailwind 3' }, { value: 'scss', label: 'SCSS' }, { value: 'json', label: 'JSON' }] })}
      <pre class="pal-code"><code data-code></code></pre>
      <div class="tool__actions">
        <button class="btn btn--primary" type="button" data-copy-code><span>Copiar código</span></button>
        <button class="btn btn--secondary" type="button" data-download><span>Baixar paleta em PNG</span>${Icon('download', { size: 22 })}</button>
      </div>
    </div>
    <p class="tool__status" role="status" aria-live="polite" data-status></p>
    <canvas data-card hidden></canvas>
  </div>
</form>`;
}
