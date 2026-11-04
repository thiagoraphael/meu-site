// Pomodoro: timer com tarefas, histórico da semana, som ambiente, atalhos e tela cheia. Comportamento em app.js.
import { html } from '../../lib/html.mjs';
import { Seg, Field, Check, NoJs } from '../_shared/ui.mjs';

export default function view() {
  return html`${NoJs()}
<div class="tool pomo" data-app="pomodoro">
  <section class="pomo__timer" data-timer data-phase="foco" aria-labelledby="pomo-fase">
    <div class="pomo__phases" role="group" aria-label="Etapa">
      <button class="pomo__phase" type="button" data-set-phase="foco" aria-pressed="true">Foco</button>
      <button class="pomo__phase" type="button" data-set-phase="curta" aria-pressed="false">Pausa curta</button>
      <button class="pomo__phase" type="button" data-set-phase="longa" aria-pressed="false">Pausa longa</button>
    </div>
    <h2 class="visually-hidden" id="pomo-fase" data-phase-name>Foco</h2>
    <p class="pomo__time display" role="timer" aria-live="off" data-time>25:00</p>
    <div class="pomo__bar" aria-hidden="true"><span data-bar></span></div>
    <p class="pomo__task label" data-current-task>Sem tarefa selecionada</p>
    <ol class="pomo__rounds" data-rounds aria-label="Rodadas até a pausa longa"></ol>
    <div class="pomo__controls">
      <button class="btn btn--primary pomo__start" type="button" data-toggle><span>Começar</span></button>
      <button class="mini-btn" type="button" data-reset title="Atalho: R">Reiniciar</button>
      <button class="mini-btn" type="button" data-skip title="Atalho: S">Pular</button>
      <button class="mini-btn" type="button" data-full title="Atalho: F" aria-pressed="false">Tela cheia</button>
    </div>
    <p class="tool__status" role="status" aria-live="polite" data-status></p>
  </section>

  <div class="tool__controls pomo__side">
    <section class="field-group" aria-labelledby="pomo-tarefas">
      <h2 class="field-group__title" id="pomo-tarefas">Tarefas</h2>
      <form class="pomo__add" data-add-task>
        ${Field({ label: 'Nova tarefa', name: 'tarefa', placeholder: 'Ex.: Revisar o layout da home', maxlength: 80 })}
        ${Field({ label: 'Pomodoros', name: 'estimativa', type: 'number', min: 1, max: 20, value: 2, inputmode: 'numeric' })}
        <button class="btn btn--secondary btn--sm" type="submit"><span>Adicionar</span></button>
      </form>
      <ul class="pomo__tasks" data-tasks aria-label="Lista de tarefas"></ul>
      <button class="btn btn--text" type="button" data-clear-done hidden>Apagar concluídas</button>
    </section>

    <section class="field-group" aria-labelledby="pomo-semana">
      <h2 class="field-group__title" id="pomo-semana">Sua semana</h2>
      <dl class="pomo__stats">
        <div><dt>Hoje</dt><dd data-stat-today>0</dd></div>
        <div><dt>Minutos hoje</dt><dd data-stat-min>0</dd></div>
        <div><dt>Dias seguidos</dt><dd data-stat-streak>0</dd></div>
      </dl>
      <ol class="pomo__week" data-week aria-label="Pomodoros por dia nos últimos 7 dias"></ol>
    </section>

    <details class="pomo__settings">
      <summary class="field-group__title">Ajustes</summary>
      <form class="field-group" data-settings onsubmit="return false">
        <div class="field-row">
          ${Field({ label: 'Foco (min)', name: 'foco', type: 'number', min: 1, max: 120, value: 25, inputmode: 'numeric' })}
          ${Field({ label: 'Pausa curta', name: 'curta', type: 'number', min: 1, max: 60, value: 5, inputmode: 'numeric' })}
          ${Field({ label: 'Pausa longa', name: 'longa', type: 'number', min: 1, max: 90, value: 15, inputmode: 'numeric' })}
          ${Field({ label: 'Longa a cada', name: 'ciclo', type: 'number', min: 2, max: 10, value: 4, inputmode: 'numeric' })}
        </div>
        ${Check({ label: 'Começar a pausa sozinho', name: 'autoPausa', checked: true })}
        ${Check({ label: 'Começar o próximo foco sozinho', name: 'autoFoco' })}
        ${Seg({ name: 'alarme', legend: 'Alarme', options: [{ value: 'sino', label: 'Sino' }, { value: 'bip', label: 'Bipe' }, { value: 'nenhum', label: 'Sem som' }] })}
        ${Seg({ name: 'ambiente', legend: 'Som ambiente durante o foco', options: [{ value: 'nenhum', label: 'Nenhum' }, { value: 'branco', label: 'Branco' }, { value: 'rosa', label: 'Rosa' }, { value: 'marrom', label: 'Marrom' }] })}
        ${Field({ label: 'Volume', name: 'volume', type: 'range', min: 0, max: 100, step: 1, value: 50 })}
        ${Check({ label: 'Mostrar o tempo no título da aba', name: 'titulo', checked: true })}
        ${Check({ label: 'Manter a tela acesa durante o timer', name: 'acesa', checked: true })}
        <button class="mini-btn" type="button" data-notify>Ativar notificações</button>
      </form>
    </details>

    <section class="field-group" aria-labelledby="pomo-atalhos">
      <h2 class="field-group__title" id="pomo-atalhos">Atalhos</h2>
      <dl class="pomo__keys">
        <div><dt><kbd>Espaço</kbd></dt><dd>Começar ou pausar</dd></div>
        <div><dt><kbd>R</kbd></dt><dd>Reiniciar a etapa</dd></div>
        <div><dt><kbd>S</kbd></dt><dd>Pular pra próxima</dd></div>
        <div><dt><kbd>F</kbd></dt><dd>Tela cheia</dd></div>
        <div><dt><kbd>N</kbd></dt><dd>Nova tarefa</dd></div>
      </dl>
    </section>
  </div>
</div>`;
}
