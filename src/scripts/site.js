// JS do site: menu mobile, retângulos no scroll, filtros de lista e copiar link.
// Tudo é melhoria progressiva: sem JS o conteúdo continua acessível.
(() => {
  // Menu mobile: folha roxa em tela cheia. Fecha com o botão, com Esc e ao tocar num link.
  // Trava o scroll do body e devolve o focus ao botão "Menu".
  const openBtn = document.querySelector('[data-menu-open]');
  const sheet = document.querySelector('[data-menu-sheet]');
  if (openBtn && sheet) {
    const closeBtn = sheet.querySelector('[data-menu-close]');
    const focusables = () => [...sheet.querySelectorAll('a[href], button:not([disabled])')];
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const open = () => {
      sheet.hidden = false;
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
      document.addEventListener('keydown', onKey);
      (sheet.querySelector('[aria-current="page"]') || closeBtn).focus();
    };
    const close = () => {
      sheet.hidden = true;
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKey);
      openBtn.focus();
    };
    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    sheet.addEventListener('click', (e) => { if (e.target.closest('a[href]')) close(); });
    window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches && !sheet.hidden) close(); });
  }

  // Retângulos do hero: inicial → meio (30% do hero rolado) → fim (65%).
  const shapes = document.querySelector('[data-shapes-scroll]');
  if (shapes) {
    const hero = shapes.parentElement;
    let ticking = false;
    const update = () => {
      ticking = false;
      const progress = window.scrollY / Math.max(1, hero.offsetHeight);
      const state = progress < 0.3 ? 'inicial' : progress < 0.65 ? 'meio' : 'fim';
      if (shapes.dataset.state !== state) shapes.dataset.state = state;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // Filtros (Projetos e Blog): botões com aria-pressed, itens com data-cat.
  document.querySelectorAll('[data-filters]').forEach((bar) => {
    const list = document.getElementById(bar.dataset.filters);
    const empty = document.getElementById(bar.dataset.empty);
    const status = document.getElementById(bar.dataset.status);
    if (!list) return;
    const items = [...list.children];
    const apply = (value) => {
      let shown = 0;
      items.forEach((it) => {
        const ok = value === 'Todos' || it.dataset.cat === value;
        it.hidden = !ok;
        if (ok) shown++;
      });
      bar.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === value)));
      if (empty) empty.hidden = shown > 0;
      if (status) status.textContent = `${shown} ${shown === 1 ? bar.dataset.one : bar.dataset.many}`;
    };
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-filter]');
      if (b) apply(b.dataset.filter);
    });
    document.querySelectorAll(`[data-show-all="${bar.dataset.filters}"]`).forEach((b) => b.addEventListener('click', () => apply('Todos')));
  });

  // Copiar link do post
  document.querySelectorAll('[data-copy-link]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const label = btn.textContent;
      try { await navigator.clipboard.writeText(location.href); btn.textContent = 'Link copiado'; }
      catch { btn.textContent = 'Não deu pra copiar'; }
      setTimeout(() => { btn.textContent = label; }, 1800);
    });
  });

  // Skeleton: some quando a imagem termina de carregar
  document.querySelectorAll('.media img').forEach((img) => {
    const done = () => img.closest('.media')?.classList.add('is-loaded');
    if (img.complete) done(); else img.addEventListener('load', done, { once: true });
  });

})();
