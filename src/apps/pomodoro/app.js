// ---------- Pomodoro: timer por horário de término (não atrasa com a aba em segundo plano) ----------
const root = $('[data-app="pomodoro"]');
if (root) {
  const timerEl = $('[data-timer]', root);
  const timeEl = $('[data-time]', root);
  const barEl = $('[data-bar]', root);
  const status = $('[data-status]', root);
  const toggleBtn = $('[data-toggle]', root);
  const settingsForm = $('[data-settings]', root);
  const taskForm = $('[data-add-task]', root);
  const tasksEl = $('[data-tasks]', root);
  const NAMES = { foco: 'Foco', curta: 'Pausa curta', longa: 'Pausa longa' };
  const baseTitle = document.title;

  // ---------- Estado salvo ----------
  const DEF = { foco: 25, curta: 5, longa: 15, ciclo: 4, autoPausa: true, autoFoco: false, alarme: 'sino', ambiente: 'nenhum', volume: 50, titulo: true, acesa: true };
  const cfg = { ...DEF, ...store.get('pomo:cfg', {}) };
  let tasks = store.get('pomo:tasks', []);
  let stats = store.get('pomo:stats', {});
  let t = store.get('pomo:timer', null) || { phase: 'foco', running: false, endAt: 0, left: cfg.foco * 60000, round: 0 };
  const saveCfg = () => store.set('pomo:cfg', cfg);
  const saveTasks = () => store.set('pomo:tasks', tasks);
  const saveStats = () => store.set('pomo:stats', stats);
  const saveTimer = () => store.set('pomo:timer', t);

  const dur = (phase) => Math.max(1, Number(cfg[phase]) || DEF[phase]) * 60000;
  const remaining = () => (t.running ? Math.max(0, t.endAt - Date.now()) : t.left);
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // ---------- Áudio (criado no primeiro clique, como o navegador exige) ----------
  let audio = null, master = null, noise = null;
  function ensureAudio() {
    if (audio) { if (audio.state === 'suspended') audio.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC();
    master = audio.createGain();
    master.gain.value = cfg.volume / 100;
    master.connect(audio.destination);
  }
  function alarm() {
    if (cfg.alarme === 'nenhum' || !audio) return;
    const now = audio.currentTime;
    const notes = cfg.alarme === 'sino' ? [880, 1318.5, 1760] : [1000, 1000, 1000];
    notes.forEach((f, i) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = cfg.alarme === 'sino' ? 'sine' : 'square';
      o.frequency.value = f;
      const s = now + i * (cfg.alarme === 'sino' ? 0.22 : 0.3);
      const len = cfg.alarme === 'sino' ? 1.4 : 0.14;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(cfg.alarme === 'sino' ? 0.5 : 0.18, s + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, s + len);
      o.connect(g).connect(master);
      o.start(s); o.stop(s + len + 0.05);
    });
  }
  // Ruído gerado na hora: branco (plano), rosa (filtro de Paul Kellet) e marrom (integrado).
  function noiseBuffer(kind) {
    const len = audio.sampleRate * 4;
    const buf = audio.createBuffer(1, len, audio.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'branco') d[i] = w * 0.25;
      else if (kind === 'rosa') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.06; b6 = w * 0.115926;
      } else { last = (last + 0.02 * w) / 1.02; d[i] = last * 2.4; }
    }
    return buf;
  }
  function updateNoise() {
    const want = t.running && t.phase === 'foco' && cfg.ambiente !== 'nenhum' ? cfg.ambiente : null;
    if (noise && noise.kind !== want) { noise.src.stop(); noise = null; }
    if (want && !noise && audio) {
      const src = audio.createBufferSource();
      src.buffer = noiseBuffer(want);
      src.loop = true;
      src.connect(master);
      src.start();
      noise = { kind: want, src };
    }
  }

  // ---------- Tela acesa (Wake Lock) ----------
  let lock = null;
  async function updateLock() {
    const want = t.running && cfg.acesa && document.visibilityState === 'visible' && 'wakeLock' in navigator;
    if (want && !lock) { try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } catch {} }
    if (!want && lock) { lock.release(); lock = null; }
  }

  // ---------- Notificação ----------
  function notify(text) {
    if (!('Notification' in window) || Notification.permission !== 'granted' || document.visibilityState === 'visible') return;
    try { new Notification('Pomodoro', { body: text, icon: '/assets/icons/icon-192.png', tag: 'pomodoro' }); } catch {}
  }
  const notifyBtn = $('[data-notify]', root);
  const syncNotifyBtn = () => {
    if (!('Notification' in window)) { notifyBtn.hidden = true; return; }
    notifyBtn.textContent = Notification.permission === 'granted' ? 'Notificações ativadas' : Notification.permission === 'denied' ? 'Notificações bloqueadas no navegador' : 'Ativar notificações';
    notifyBtn.disabled = Notification.permission !== 'default';
  };
  notifyBtn.addEventListener('click', async () => { await Notification.requestPermission(); syncNotifyBtn(); });
  syncNotifyBtn();

  // ---------- Tela ----------
  const fmt = (ms) => { const s = Math.ceil(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const digits = (txt) => txt.split('').map((ch) => `<span class="${ch === ':' ? 'c' : 'd'}">${ch}</span>`).join('');
  let lastTxt = '';
  function paint() {
    const ms = remaining();
    const txt = fmt(ms);
    if (txt !== lastTxt) {
      timeEl.innerHTML = digits(txt);
      timeEl.setAttribute('aria-label', `${NAMES[t.phase]}: faltam ${txt.replace(':', ' minutos e ')} segundos`);
      lastTxt = txt;
      document.title = cfg.titulo && (t.running || ms < dur(t.phase)) ? `${txt} · ${NAMES[t.phase]}` : baseTitle;
    }
    barEl.style.width = `${(1 - ms / dur(t.phase)) * 100}%`;
  }
  function paintStatic() {
    timerEl.dataset.phase = t.phase;
    $('[data-phase-name]', root).textContent = NAMES[t.phase];
    $$('[data-set-phase]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setPhase === t.phase)));
    toggleBtn.querySelector('span').textContent = t.running ? 'Pausar' : remaining() < dur(t.phase) ? 'Continuar' : 'Começar';
    const n = Math.max(2, Number(cfg.ciclo) || 4);
    $('[data-rounds]', root).innerHTML = Array.from({ length: n }, (_, i) => `<li class="${i < t.round ? 'is-done' : ''}"><span class="visually-hidden">Rodada ${i + 1}${i < t.round ? ' feita' : ''}</span></li>`).join('');
    const cur = tasks.find((x) => x.current && !x.done);
    $('[data-current-task]', root).textContent = cur ? `Focando em: ${cur.name}` : 'Sem tarefa selecionada';
    lastTxt = '';
    paint();
  }

  // ---------- Motor ----------
  let tickId = null;
  function startTick() { stopTick(); tickId = setInterval(tick, 250); }
  function stopTick() { clearInterval(tickId); tickId = null; }
  function tick() { paint(); if (t.running && Date.now() >= t.endAt) finish(true); }

  function start() {
    ensureAudio();
    t.running = true;
    t.endAt = Date.now() + t.left;
    saveTimer();
    startTick();
    updateNoise(); updateLock();
    paintStatic();
  }
  function pause() {
    t.left = remaining();
    t.running = false;
    saveTimer();
    stopTick();
    updateNoise(); updateLock();
    paintStatic();
  }
  function setPhase(phase, { autostart = false } = {}) {
    t.phase = phase;
    t.running = false;
    t.left = dur(phase);
    saveTimer();
    stopTick();
    paintStatic();
    if (autostart) start(); else { updateNoise(); updateLock(); }
  }
  // Etapa terminou (ou foi pulada): registra o foco, avisa e passa pra próxima.
  function finish(natural) {
    const was = t.phase;
    if (was === 'foco' && natural) {
      const k = dayKey();
      stats[k] = stats[k] || { p: 0, m: 0 };
      stats[k].p += 1;
      stats[k].m += Math.round(dur('foco') / 60000);
      const keep = Object.keys(stats).sort().slice(-90);
      stats = Object.fromEntries(keep.map((d) => [d, stats[d]]));
      saveStats();
      const cur = tasks.find((x) => x.current && !x.done);
      if (cur) { cur.spent += 1; saveTasks(); renderTasks(); }
      renderStats();
    }
    let next;
    if (was === 'foco') {
      t.round += 1;
      next = t.round >= Math.max(2, Number(cfg.ciclo) || 4) ? 'longa' : 'curta';
    } else {
      if (was === 'longa') t.round = 0;
      next = 'foco';
    }
    if (natural) {
      alarm();
      const msg = was === 'foco' ? `Foco concluído. Hora da ${NAMES[next].toLowerCase()}.` : 'Pausa acabou. Bora focar.';
      notify(msg);
      say(status, msg, 6000);
    }
    setPhase(next, { autostart: natural && (next === 'foco' ? cfg.autoFoco : cfg.autoPausa) });
  }

  toggleBtn.addEventListener('click', () => (t.running ? pause() : start()));
  $('[data-reset]', root).addEventListener('click', () => { setPhase(t.phase); say(status, 'Etapa reiniciada.'); });
  $('[data-skip]', root).addEventListener('click', () => finish(false));
  $$('[data-set-phase]', root).forEach((b) => b.addEventListener('click', () => { if (b.dataset.setPhase !== t.phase) setPhase(b.dataset.setPhase); }));

  const fullBtn = $('[data-full]', root);
  const toggleFull = () => {
    if (!document.fullscreenElement) timerEl.requestFullscreen?.().catch(() => say(status, 'O navegador não deixou abrir a tela cheia.'));
    else document.exitFullscreen();
  };
  fullBtn.addEventListener('click', toggleFull);
  if (!document.fullscreenEnabled) fullBtn.hidden = true;
  document.addEventListener('fullscreenchange', () => fullBtn.setAttribute('aria-pressed', String(!!document.fullscreenElement)));

  // Atalhos (fora de campos de texto).
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    const k = e.key.toLowerCase();
    if (k === ' ' && !e.target.closest('button, a, summary')) { e.preventDefault(); toggleBtn.click(); }
    else if (k === 'r') $('[data-reset]', root).click();
    else if (k === 's') $('[data-skip]', root).click();
    else if (k === 'f' && !fullBtn.hidden) toggleFull();
    else if (k === 'n') { e.preventDefault(); taskForm.elements.tarefa.focus(); }
  });

  document.addEventListener('visibilitychange', () => { tick(); updateLock(); });

  // ---------- Tarefas ----------
  function renderTasks() {
    tasksEl.replaceChildren(...tasks.map((x) => {
      const li = document.createElement('li');
      li.className = `ptask${x.current && !x.done ? ' is-current' : ''}${x.done ? ' is-done' : ''}`;
      li.dataset.id = x.id;
      li.innerHTML = `<input type="checkbox" data-done ${x.done ? 'checked' : ''} aria-label="Concluir: ${x.name.replace(/"/g, '&quot;')}">
        <button class="ptask__name" type="button" data-pick aria-pressed="${!!(x.current && !x.done)}" title="Focar nesta tarefa"></button>
        <span class="ptask__count" title="Pomodoros feitos de estimados">${x.spent}/${x.est}</span>
        <button class="ptask__del" type="button" data-del aria-label="Apagar: ${x.name.replace(/"/g, '&quot;')}">×</button>`;
      li.querySelector('[data-pick]').textContent = x.name;
      return li;
    }));
    $('[data-clear-done]', root).hidden = !tasks.some((x) => x.done);
    paintStatic();
  }
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = taskForm.elements.tarefa.value.trim();
    if (!name) { taskForm.elements.tarefa.focus(); return; }
    const est = Math.max(1, Math.min(20, Number(taskForm.elements.estimativa.value) || 1));
    const first = !tasks.some((x) => x.current && !x.done);
    tasks.push({ id: Date.now().toString(36), name, est, spent: 0, done: false, current: first });
    saveTasks();
    renderTasks();
    taskForm.elements.tarefa.value = '';
    taskForm.elements.tarefa.focus();
    say(status, first ? `"${name}" adicionada e selecionada.` : `"${name}" adicionada.`);
  });
  tasksEl.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const x = tasks.find((y) => y.id === li.dataset.id);
    if (e.target.closest('[data-del]')) {
      const next = li.nextElementSibling || li.previousElementSibling;
      tasks = tasks.filter((y) => y !== x);
      saveTasks(); renderTasks();
      (next ? $(`li[data-id="${next.dataset.id}"] [data-del]`, tasksEl) : taskForm.elements.tarefa)?.focus();
    } else if (e.target.closest('[data-pick]') && !x.done) {
      tasks.forEach((y) => { y.current = y === x; });
      saveTasks(); renderTasks();
      $(`li[data-id="${x.id}"] [data-pick]`, tasksEl)?.focus();
    }
  });
  tasksEl.addEventListener('change', (e) => {
    if (!e.target.matches('[data-done]')) return;
    const x = tasks.find((y) => y.id === e.target.closest('li').dataset.id);
    x.done = e.target.checked;
    if (x.done && x.current) {
      x.current = false;
      const nxt = tasks.find((y) => !y.done);
      if (nxt) nxt.current = true;
    }
    saveTasks(); renderTasks();
    $(`li[data-id="${x.id}"] [data-done]`, tasksEl)?.focus();
  });
  $('[data-clear-done]', root).addEventListener('click', () => { tasks = tasks.filter((x) => !x.done); saveTasks(); renderTasks(); taskForm.elements.tarefa.focus(); });

  // ---------- Semana ----------
  const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  function renderStats() {
    const today = stats[dayKey()] || { p: 0, m: 0 };
    $('[data-stat-today]', root).textContent = today.p;
    $('[data-stat-min]', root).textContent = today.m;
    let streak = 0;
    const d = new Date();
    if (!stats[dayKey(d)]?.p) d.setDate(d.getDate() - 1);
    while (stats[dayKey(d)]?.p) { streak++; d.setDate(d.getDate() - 1); }
    $('[data-stat-streak]', root).textContent = streak;
    const days = Array.from({ length: 7 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() - 6 + i); return x; });
    const max = Math.max(1, ...days.map((x) => stats[dayKey(x)]?.p || 0));
    $('[data-week]', root).innerHTML = days.map((x, i) => {
      const p = stats[dayKey(x)]?.p || 0;
      return `<li class="${i === 6 ? 'is-today' : ''}"><b>${p}</b><i style="height:${(p / max) * 100}%"></i><span>${i === 6 ? 'hoje' : DIAS[x.getDay()]}</span><span class="visually-hidden">: ${p} pomodoro${p === 1 ? '' : 's'}</span></li>`;
    }).join('');
  }

  // ---------- Ajustes ----------
  function loadSettings() {
    ['foco', 'curta', 'longa', 'ciclo', 'volume'].forEach((n) => { settingsForm.elements[n].value = cfg[n]; });
    ['autoPausa', 'autoFoco', 'titulo', 'acesa'].forEach((n) => { settingsForm.elements[n].checked = !!cfg[n]; });
    setRadio('alarme', cfg.alarme, settingsForm);
    setRadio('ambiente', cfg.ambiente, settingsForm);
  }
  settingsForm.addEventListener('input', (e) => {
    const el = e.target;
    const n = el.name;
    if (!n) return;
    if (el.type === 'checkbox') cfg[n] = el.checked;
    else if (el.type === 'radio') cfg[n] = el.value;
    else if (el.type === 'number' || el.type === 'range') { if (el.value === '') return; cfg[n] = Number(el.value); }
    saveCfg();
    if (n === 'volume' && master) master.gain.value = cfg.volume / 100;
    if (n === 'ambiente') { ensureAudio(); updateNoise(); }
    if (n === 'acesa') updateLock();
    // Mudou a duração da etapa parada e ainda não começada: aplica na hora.
    if (n === t.phase && !t.running && t.left >= dur(t.phase) - 60000 * 120) { t.left = dur(t.phase); saveTimer(); }
    if (n === 'titulo' && !cfg.titulo) document.title = baseTitle;
    paintStatic();
  });
  settingsForm.addEventListener('change', (e) => { if (e.target.name === 'alarme') { ensureAudio(); alarm(); } });

  // ---------- Início: retoma o timer salvo (se acabou com a aba fechada, conta e avança) ----------
  loadSettings();
  renderTasks();
  renderStats();
  if (t.running && Date.now() >= t.endAt) { t.running = true; finish(true); }
  else if (t.running) { startTick(); updateLock(); say(status, 'Timer retomado. Toque em Pausar ou Começar pra religar o som.', 5000); }
  paintStatic();
}
