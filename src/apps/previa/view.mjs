// Prévia de link: como a URL aparece no WhatsApp, LinkedIn, X, Facebook e Google, com avisos e meta tags prontas.
import { html } from '../../lib/html.mjs';
import { Seg, Field, Drop, NoJs } from '../_shared/ui.mjs';

export default function view() {
  return html`${NoJs()}
<form class="tool tool--input-first" data-app="previa" autocomplete="off" onsubmit="return false">
  <div class="tool__controls">
    ${Seg({ name: 'modo', legend: 'De onde vêm os dados', tabs: true, options: [{ value: 'preencher', label: 'Preencher' }, { value: 'html', label: 'Colar HTML' }] })}
    <div class="field-group" data-panel-group="modo">
      <div class="field-group" data-panel="html" hidden>
        ${Field({ label: 'Código-fonte da página', name: 'fonte', type: 'textarea', rows: 6, placeholder: 'Abra a página, aperte Ctrl+U, copie tudo e cole aqui.', hint: 'O app lê as meta tags e preenche os campos. Nada é enviado.' })}
      </div>
    </div>
    <fieldset class="field-group">
      <legend>Dados do link</legend>
      ${Field({ label: 'Endereço (URL)', name: 'url', type: 'url', value: 'https://thiagoraphael.com.br/apps/', maxlength: 300 })}
      ${Field({ label: 'Título', name: 'titulo', value: 'Apps grátis pra criar stories, paletas e mockups', maxlength: 200 })}
      ${Field({ label: 'Descrição', name: 'descricao', type: 'textarea', rows: 3, value: 'Ferramentas pequenas que rodam no navegador: stories, QR code, paleta, contraste, favicon e mais.', maxlength: 400 })}
      <div class="field-row">
        ${Field({ label: 'Nome do site', name: 'site', value: 'Thiago Raphael', maxlength: 60 })}
        ${Field({ label: '@ no X (opcional)', name: 'twitter', placeholder: '@voce', maxlength: 30 })}
      </div>
      ${Field({ label: 'Imagem (URL)', name: 'imagem', type: 'url', placeholder: 'https://seusite.com/og.png', maxlength: 400 })}
      ${Drop({ name: 'img', title: 'Ou enviar a imagem', hint: 'Recomendado: 1200×630 px (1,91:1), até 300 KB.' })}
      ${Field({ label: 'Texto alternativo da imagem', name: 'alt', placeholder: 'Descreva a imagem em uma frase', maxlength: 200 })}
    </fieldset>
    <ul class="pv-checks" data-checks aria-label="Avisos"></ul>
  </div>

  <div class="tool__preview">
    ${Seg({ name: 'rede', legend: 'Ver no', options: [{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'x', label: 'X' }, { value: 'facebook', label: 'Facebook' }, { value: 'google', label: 'Google' }] })}
    <div class="pv-stage" data-stage></div>
    <label class="field"><span>Meta tags pra colar no &lt;head&gt;</span>
      <textarea class="textarea pv-code" name="codigo" rows="12" readonly></textarea>
    </label>
    <button class="mini-btn" type="button" data-copy-code>Copiar meta tags</button>
    <p class="tool__status" role="status" aria-live="polite" data-status></p>
  </div>
</form>`;
}
