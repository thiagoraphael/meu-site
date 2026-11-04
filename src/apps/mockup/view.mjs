// Mockup: print dentro de celular, navegador ou os dois. Comportamento em app.js.
import { html } from '../../lib/html.mjs';
import { Seg, Field, Check, Drop, Preview, NoJs, Effects } from '../_shared/ui.mjs';

const FUNDOS = [
  { value: 'roxo', label: 'Roxo', swatch: '#7301FF' }, { value: 'rosa', label: 'Rosa', swatch: '#FF007F' },
  { value: 'lima', label: 'Lima', swatch: '#D8FB81' }, { value: 'azul', label: 'Azul', swatch: '#1B0AD4' },
  { value: 'escuro', label: 'Escuro', swatch: '#1A1A1A' }, { value: 'claro', label: 'Claro', swatch: '#F8F8F8' },
  { value: 'print', label: 'Print desfocado' }, { value: 'transparente', label: 'Transparente' }, { value: 'custom', label: 'Outra cor' },
];

export default function view() {
  return html`${NoJs()}
<form class="tool" data-app="mockup" autocomplete="off" onsubmit="return false">
  <div class="tool__controls">
    ${Seg({ name: 'moldura', legend: 'Moldura', tabs: true, options: [{ value: 'celular', label: 'Celular' }, { value: 'navegador', label: 'Navegador' }, { value: 'combo', label: 'Os dois' }] })}
    <div class="field-group" data-drop-desktop>
      ${Drop({ name: 'desktop', title: 'Print do desktop', hint: 'Vai na janela do navegador. Arraste, solte ou cole.' })}
    </div>
    <div class="field-group" data-drop-mobile>
      ${Drop({ name: 'mobile', title: 'Print do celular', hint: 'Vai na tela do celular. Sem ele, uso o print do desktop.' })}
    </div>
    ${Field({ label: 'Parte do print que aparece: topo', name: 'posicao', type: 'range', min: 0, max: 100, step: 1, value: 0, hint: 'Pra print de página inteira: arraste pra mostrar outra parte.' })}

    <fieldset class="field-group">
      <legend>Moldura</legend>
      <div class="field-row">
        ${Field({ label: 'Endereço na barra', name: 'url', value: 'seusite.com.br', maxlength: 60 })}
      </div>
      ${Seg({ name: 'cor_moldura', legend: 'Cor da moldura', options: [{ value: 'escuro', label: 'Escura' }, { value: 'claro', label: 'Clara' }] })}
    </fieldset>

    <fieldset class="field-group">
      <legend>Imagem final</legend>
      ${Seg({ name: 'tamanho', legend: 'Tamanho', options: [
        { value: 'quadrado', label: '1:1' }, { value: 'feed', label: 'Feed 4:5' }, { value: 'story', label: 'Story 9:16' },
        { value: 'slide', label: 'Slide 16:9' }, { value: 'justo', label: 'Só a moldura' }], checked: 'slide' })}
      ${Seg({ name: 'fundo', legend: 'Fundo', options: FUNDOS })}
      <div class="field-row">
        ${Field({ label: 'Outra cor', name: 'fundo_custom', type: 'color', value: '#1B0AD4' })}
        ${Field({ label: 'Respiro: 8%', name: 'respiro', type: 'range', min: 0, max: 20, step: 1, value: 8 })}
      </div>
      ${Check({ label: 'Retângulos da marca no fundo', name: 'formas', checked: true })}
    </fieldset>
    ${Effects({ tintHint: 'Camada escura por cima do print do fundo, pra moldura se destacar.', shadowLabel: 'Sombra na moldura', shadowChecked: true })}
  </div>
  ${Preview({ label: 'Prévia do mockup', checker: true })}
</form>`;
}
