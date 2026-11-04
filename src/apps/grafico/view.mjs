// Gráfico: CSV ou planilha colada → barras ou linhas em PNG. Comportamento em app.js.
import { html } from '../../lib/html.mjs';
import { Seg, Field, Check, Preview, NoJs } from '../_shared/ui.mjs';

const EXEMPLO = `Mês;Site;Instagram
Jan;12.400;8.100
Fev;13.950;9.800
Mar;15.200;12.300
Abr;14.100;15.900
Mai;17.800;18.400
Jun;21.300;19.700`;

export default function view() {
  return html`${NoJs()}
<form class="tool" data-app="grafico" autocomplete="off" onsubmit="return false">
  <div class="tool__controls">
    <fieldset class="field-group">
      <legend>Dados</legend>
      ${Field({ label: 'Cole aqui (do Excel, Sheets ou CSV)', name: 'dados', type: 'textarea', rows: 8, value: EXEMPLO, hint: 'Primeira coluna = categorias (meses, nomes). As outras = números.' })}
      <div class="drop drop--sm" data-drop="csv">
        <input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" name="csv" aria-label="Abrir arquivo CSV">
        <span class="drop__title" aria-hidden="true">Abrir arquivo .csv</span>
      </div>
      <div class="field-row">
        ${Field({ label: 'Números', name: 'numeros', type: 'select', value: 'br', options: [{ value: 'br', label: '1.234,56 (Brasil)' }, { value: 'en', label: '1,234.56 (internacional)' }] })}
        ${Field({ label: 'Categorias (eixo X)', name: 'xcol', type: 'select', options: [{ value: '0', label: 'Coluna 1' }] })}
      </div>
      ${Check({ label: 'Primeira linha é o cabeçalho', name: 'cabecalho', checked: true })}
      <fieldset class="field-group">
        <legend class="field__label">Séries (colunas com números)</legend>
        <div class="gr-series" data-series></div>
      </fieldset>
      <p class="field__hint" data-parse-info></p>
    </fieldset>

    <fieldset class="field-group">
      <legend>Gráfico</legend>
      ${Seg({ name: 'tipo', legend: 'Tipo', options: [{ value: 'barras', label: 'Barras' }, { value: 'deitadas', label: 'Barras deitadas' }, { value: 'linhas', label: 'Linhas' }] })}
      ${Field({ label: 'Título', name: 'titulo', value: 'Visitas por canal', maxlength: 80 })}
      ${Field({ label: 'Subtítulo (opcional)', name: 'subtitulo', value: 'Primeiro semestre, em visitas por mês', maxlength: 120 })}
      ${Field({ label: 'Fonte dos dados (opcional)', name: 'fonte', placeholder: 'Ex.: Google Analytics', maxlength: 80 })}
      <div class="field-row">
        ${Field({ label: 'Antes do número', name: 'prefixo', placeholder: 'R$', maxlength: 6 })}
        ${Field({ label: 'Depois do número', name: 'sufixo', placeholder: '%', maxlength: 8 })}
        ${Field({ label: 'Casas decimais', name: 'casas', type: 'number', min: 0, max: 4, value: 0, inputmode: 'numeric' })}
      </div>
      ${Seg({ name: 'ordem', legend: 'Ordem', options: [{ value: 'original', label: 'Como está' }, { value: 'desc', label: 'Maior → menor' }, { value: 'asc', label: 'Menor → maior' }] })}
      ${Seg({ name: 'valores', legend: 'Valores no gráfico', options: [{ value: 'auto', label: 'Automático' }, { value: 'todos', label: 'Todos' }, { value: 'nenhum', label: 'Nenhum' }] })}
      ${Check({ label: 'Destacar o maior valor (com uma série só)', name: 'destaque' })}
    </fieldset>

    <fieldset class="field-group">
      <legend>Imagem</legend>
      ${Seg({ name: 'tema', legend: 'Fundo', options: [{ value: 'escuro', label: 'Escuro' }, { value: 'claro', label: 'Claro' }] })}
      ${Seg({ name: 'tamanho', legend: 'Tamanho', options: [{ value: 'slide', label: '16:9' }, { value: 'quadrado', label: '1:1' }, { value: 'feed', label: '4:5' }, { value: 'story', label: '9:16' }] })}
      ${Check({ label: 'Logo e endereço no rodapé', name: 'assinatura', checked: true })}
    </fieldset>
  </div>
  ${Preview({ label: 'Prévia do gráfico' })}
</form>
<div class="gr-tip" data-tip hidden></div>
<details class="gr-table">
  <summary class="field-group__title">Ver os dados em tabela</summary>
  <div class="gr-table__wrap" data-table></div>
</details>`;
}
