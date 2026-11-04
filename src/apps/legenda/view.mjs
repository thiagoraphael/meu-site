// Legenda: contagem por rede, corte do "mais", hashtags e ferramentas de texto. Comportamento em app.js.
import { html } from '../../lib/html.mjs';
import { Seg, Field, NoJs } from '../_shared/ui.mjs';

export default function view() {
  return html`${NoJs()}
<form class="tool tool--input-first leg" data-app="legenda" autocomplete="off" onsubmit="return false">
  <div class="tool__controls">
    <label class="field leg__main"><span>Sua legenda</span>
      <textarea class="textarea leg__text" name="texto" rows="12" placeholder="Escreva ou cole a legenda aqui. Quebras de linha, emoji e #hashtags contam do jeito de cada rede."></textarea>
    </label>
    <dl class="leg__stats" data-stats aria-live="polite"></dl>
    <div class="tool__actions">
      <button class="btn btn--primary btn--sm" type="button" data-copy-text><span>Copiar legenda</span></button>
      <button class="mini-btn" type="button" data-fix-lines title="Troca linhas vazias por um caractere invisível">Manter linhas em branco no Instagram</button>
      <button class="mini-btn" type="button" data-fix-spaces>Tirar espaços sobrando</button>
      <button class="mini-btn" type="button" data-move-tags>Hashtags pro fim</button>
    </div>
    <p class="tool__status" role="status" aria-live="polite" data-status></p>

    <fieldset class="field-group">
      <legend>Grupos de hashtags</legend>
      <p class="field__hint">Salve as hashtags que você sempre usa e coloque no texto com um clique. Ficam guardadas neste navegador.</p>
      <div class="leg__save">
        ${Field({ label: 'Nome do grupo', name: 'grupo_nome', placeholder: 'Ex.: Circuito Geek', maxlength: 30 })}
        ${Field({ label: 'Hashtags', name: 'grupo_tags', placeholder: '#geek #animes #games', maxlength: 400 })}
        <button class="btn btn--secondary btn--sm" type="button" data-save-group><span>Salvar grupo</span></button>
      </div>
      <ul class="leg__groups" data-groups aria-label="Grupos salvos"></ul>
    </fieldset>
  </div>

  <div class="tool__preview">
    <h2 class="field-group__title" id="leg-redes">Cabe em cada rede?</h2>
    <ul class="leg__nets" data-nets aria-labelledby="leg-redes"></ul>
    <h2 class="field-group__title" id="leg-previa">Como aparece antes do "mais"</h2>
    ${Seg({ name: 'previa', legend: 'Rede da prévia', hideLegend: true, options: [{ value: 'instagram', label: 'Instagram' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'tiktok', label: 'TikTok' }] })}
    <div class="leg__mock" data-mock aria-labelledby="leg-previa"></div>
    ${Field({ label: 'Seu @ na prévia', name: 'arroba', placeholder: 'thiagoraphael.dev', maxlength: 30 })}
  </div>
</form>`;
}
