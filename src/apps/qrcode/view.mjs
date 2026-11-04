// QR Code: link, WhatsApp, Wi-Fi, Pix e e-mail, com cores, estilo dos pontos e logo. Comportamento em app.js.
import { html } from '../../lib/html.mjs';
import { Seg, Field, Check, Drop, Preview, NoJs } from '../_shared/ui.mjs';

export default function view() {
  return html`${NoJs()}
<form class="tool tool--qr" data-app="qrcode" autocomplete="off" onsubmit="return false">
  <div class="tool__controls">
    ${Seg({ name: 'tipo', legend: 'O que o QR abre', tabs: true, options: [
      { value: 'link', label: 'Link' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'wifi', label: 'Wi‑Fi' }, { value: 'pix', label: 'Pix' }, { value: 'email', label: 'E-mail' }] })}

    <div class="field-group" data-panel-group="tipo">
      <div class="field-group" data-panel="link">
        ${Field({ label: 'Link ou texto', name: 'link', type: 'textarea', rows: 3, value: 'https://thiagoraphael.com.br/apps/', maxlength: 2000 })}
      </div>
      <div class="field-group" data-panel="whatsapp" hidden>
        ${Field({ label: 'Número com DDD', name: 'wa_num', placeholder: '(32) 99999-9999', inputmode: 'tel', maxlength: 20, hint: 'Só números do Brasil. O +55 entra sozinho.' })}
        ${Field({ label: 'Mensagem pronta (opcional)', name: 'wa_msg', type: 'textarea', rows: 2, placeholder: 'Olá! Vi seu cartão e quero um orçamento.', maxlength: 500 })}
      </div>
      <div class="field-group" data-panel="wifi" hidden>
        ${Field({ label: 'Nome da rede', name: 'wifi_ssid', placeholder: 'Minha casa', maxlength: 32 })}
        ${Field({ label: 'Senha', name: 'wifi_pass', maxlength: 63 })}
        <div class="field-row">
          ${Field({ label: 'Segurança', name: 'wifi_tipo', type: 'select', value: 'WPA', options: [{ value: 'WPA', label: 'WPA/WPA2/WPA3' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: 'Sem senha' }] })}
        </div>
        ${Check({ label: 'Rede oculta', name: 'wifi_oculta' })}
      </div>
      <div class="field-group" data-panel="pix" hidden>
        <div class="field-row">
          ${Field({ label: 'Tipo de chave', name: 'pix_tipo', type: 'select', value: 'aleatoria', options: [{ value: 'aleatoria', label: 'Aleatória' }, { value: 'email', label: 'E-mail' }, { value: 'celular', label: 'Celular' }, { value: 'cpf', label: 'CPF ou CNPJ' }] })}
          ${Field({ label: 'Chave', name: 'pix_chave', maxlength: 77 })}
        </div>
        <div class="field-row">
          ${Field({ label: 'Nome de quem recebe', name: 'pix_nome', maxlength: 25 })}
          ${Field({ label: 'Cidade', name: 'pix_cidade', maxlength: 15 })}
        </div>
        <div class="field-row">
          ${Field({ label: 'Valor (opcional)', name: 'pix_valor', placeholder: '10,00', inputmode: 'decimal', maxlength: 12, hint: 'Vazio = a pessoa digita o valor.' })}
          ${Field({ label: 'Mensagem (opcional)', name: 'pix_desc', maxlength: 40 })}
        </div>
        <div class="field-group" data-pix-code hidden>
          ${Field({ label: 'Pix copia e cola', name: 'pix_code', type: 'textarea', rows: 3 })}
          <button class="mini-btn" type="button" data-copy-pix>Copiar código Pix</button>
        </div>
      </div>
      <div class="field-group" data-panel="email" hidden>
        ${Field({ label: 'Para', name: 'mail_to', type: 'email', placeholder: 'voce@exemplo.com', maxlength: 120 })}
        ${Field({ label: 'Assunto', name: 'mail_sub', maxlength: 120 })}
        ${Field({ label: 'Mensagem', name: 'mail_body', type: 'textarea', rows: 2, maxlength: 500 })}
      </div>
    </div>

    <fieldset class="field-group">
      <legend>Visual</legend>
      <div class="field-row">
        ${Field({ label: 'Cor dos pontos', name: 'cor', type: 'color', value: '#1A1A1A' })}
        ${Field({ label: 'Cor do fundo', name: 'fundo', type: 'color', value: '#F8F8F8' })}
      </div>
      ${Check({ label: 'Fundo transparente', name: 'transparente' })}
      ${Seg({ name: 'estilo', legend: 'Pontos', options: [{ value: 'quadrado', label: 'Quadrados' }, { value: 'arredondado', label: 'Arredondados' }, { value: 'bolinhas', label: 'Bolinhas' }] })}
      ${Seg({ name: 'olhos', legend: 'Cantos', options: [{ value: 'quadrado', label: 'Retos' }, { value: 'arredondado', label: 'Arredondados' }] })}
      ${Field({ label: '', live: 'Margem: {v} módulos', name: 'margem', type: 'range', min: 0, max: 8, step: 1, value: 4, hint: 'O padrão é 4. Menos que 2 pode atrapalhar a leitura.' })}
      ${Seg({ name: 'ecc', legend: 'Correção de erro', checked: 'M', options: [{ value: 'L', label: 'Baixa' }, { value: 'M', label: 'Média' }, { value: 'Q', label: 'Alta' }, { value: 'H', label: 'Máxima' }] })}
    </fieldset>

    <fieldset class="field-group">
      <legend>Logo no meio</legend>
      ${Drop({ name: 'logo', title: 'Escolher logo', hint: 'PNG ou SVG com fundo transparente fica melhor.' })}
      <div class="field-row" data-logo-only hidden>
        ${Field({ label: '', live: 'Tamanho do logo: {v}%', name: 'logo_tam', type: 'range', min: 10, max: 30, step: 1, value: 22 })}
        ${Check({ label: 'Fundo atrás do logo', name: 'logo_fundo', checked: true })}
      </div>
      <button class="mini-btn" type="button" data-clear-logo hidden>Tirar logo</button>
    </fieldset>

    ${Seg({ name: 'px', legend: 'Tamanho do PNG', checked: '1024', options: [{ value: '512', label: '512 px' }, { value: '1024', label: '1024 px' }, { value: '2048', label: '2048 px' }] })}
  </div>
  ${Preview({ label: 'Prévia do QR code', checker: true, extra: html`<button class="btn btn--secondary" type="button" data-svg><span>Baixar SVG</span></button>` })}
</form>`;
}
