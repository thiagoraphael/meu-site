// ---------- Legenda: contagem por rede social ----------
const form = $('[data-app="legenda"]');
if (form) {
  const ta = form.elements.texto;
  const status = $('[data-status]');
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('pt-BR', { granularity: 'grapheme' }) : null;
  const graphemes = (s) => (seg ? [...seg.segment(s)].map((x) => x.segment) : Array.from(s));
  const URL_RE = /\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+/gi;
  const TAG_RE = /(^|[^\p{L}\p{N}_])#([\p{L}\p{N}_]+)/gu;
  const AT_RE = /(^|[^\p{L}\p{N}_])@([\w.]+)/gu;
  const EMOJI = /\p{Extended_Pictographic}/u;
  const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/;

  // Contagem do X: link vale 23, emoji e ideograma valem 2.
  function countX(s) {
    let n = 0;
    const rest = s.replace(URL_RE, () => { n += 23; return ''; });
    for (const g of graphemes(rest)) n += EMOJI.test(g) || WIDE.test(g) ? 2 : 1;
    return n;
  }
  // Bluesky: link conta como o domínio + até 16 caracteres do caminho.
  function countBsky(s) {
    let n = 0;
    const rest = s.replace(URL_RE, (u) => { const v = u.replace(/^https?:\/\//, ''); const [host, ...p] = v.split('/'); const path = p.join('/'); n += graphemes(host).length + Math.min(graphemes(path ? `/${path}` : '').length, 17); return ''; });
    return n + graphemes(rest).length;
  }
  const utf16 = (s) => s.length;
  const NETS = [
    { id: 'instagram', nome: 'Instagram', limite: 2200, conta: (s) => utf16(s) + (s.match(/\n/g) || []).length, nota: 'Quebra de linha conta 2. Aparecem uns 125 caracteres antes do "mais".' },
    { id: 'x', nome: 'X (Twitter)', limite: 280, conta: countX, nota: 'Conta grátis. Link vale 23 e emoji vale 2. Assinantes têm até 25 mil.' },
    { id: 'tiktok', nome: 'TikTok', limite: 2200, conta: utf16, nota: '2.200 com vídeo, 4.000 em post de foto.' },
    { id: 'linkedin', nome: 'LinkedIn', limite: 3000, conta: utf16, nota: 'Aparecem umas 3 linhas (cerca de 210 caracteres) antes do "ver mais".' },
    { id: 'threads', nome: 'Threads', limite: 500, conta: (s) => graphemes(s).length, nota: '' },
    { id: 'bluesky', nome: 'Bluesky', limite: 300, conta: countBsky, nota: 'Conta pelo que você vê; link encurta sozinho.' },
    { id: 'youtube', nome: 'YouTube (descrição)', limite: 5000, conta: utf16, nota: 'Não aceita < nem >.', extra: (s) => (/[<>]/.test(s) ? 'Tem < ou > no texto: o YouTube recusa.' : '') },
  ];

  function stats(s) {
    const tags = [...s.matchAll(TAG_RE)].map((m) => m[2]);
    const ats = [...s.matchAll(AT_RE)].map((m) => m[2]);
    return {
      chars: graphemes(s).length,
      words: (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length,
      tags, ats,
      links: (s.match(URL_RE) || []).length,
      lines: s ? s.split('\n').length : 0,
    };
  }

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tagHtml = (s) => esc(s).replace(/(^|[^\p{L}\p{N}_])([#@][\p{L}\p{N}_.]+)/gu, '$1<span class="tag">$2</span>');

  // Corte aproximado do "mais": por caracteres e por linhas (o que vier primeiro).
  function cut(s, chars, lines) {
    const ls = s.split('\n');
    let out = ls.slice(0, lines).join('\n');
    const g = graphemes(out);
    let cutHere = g.length > chars ? g.slice(0, chars).join('').replace(/\s+\S*$/, '') : out;
    const truncated = cutHere.length < s.length;
    return { text: cutHere.replace(/\s+$/, ''), truncated };
  }

  function renderMock() {
    const s = ta.value;
    const net = radioValue('previa', form);
    const at = (form.elements.arroba.value.trim() || 'voce').replace(/^@/, '');
    const box = $('[data-mock]');
    box.className = `leg__mock${net === 'tiktok' ? ' leg__mock--dark' : ''}`;
    const cfg = { instagram: [125, 2, '… mais'], linkedin: [210, 3, '…ver mais'], tiktok: [100, 2, '… mais'] }[net];
    const { text, truncated } = cut(s, cfg[0], cfg[1]);
    const who = `<div class="who"><span class="ava" aria-hidden="true"></span>${esc(at)}</div>`;
    const lead = net === 'instagram' ? `<b>${esc(at)}</b> ` : '';
    box.innerHTML = s ? `${who}${lead}${tagHtml(text)}${truncated ? `<span class="more">${cfg[2]}</span>` : ''}` : `${who}<span class="more">A prévia aparece aqui.</span>`;
  }

  function render() {
    const s = ta.value;
    const st = stats(s);
    const nTags = st.tags.length;
    $('[data-stats]').innerHTML = [
      ['Caracteres', st.chars], ['Palavras', st.words], ['Hashtags', nTags], ['Menções', st.ats.length], ['Links', st.links], ['Linhas', st.lines],
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v.toLocaleString('pt-BR')}</dd></div>`).join('');
    $('[data-nets]').innerHTML = NETS.map((n) => {
      const c = n.conta(s);
      const pct = (c / n.limite) * 100;
      const over = c > n.limite;
      const extra = [n.extra?.(s), n.id === 'instagram' && nTags > 5 ? `${nTags} hashtags. O Instagram vem reduzindo o limite; com mais de 5, confira se o post publica com todas.` : ''].filter(Boolean).join(' ');
      return `<li class="leg__net${over ? ' is-over' : pct > 90 ? ' is-near' : ''}"><b>${n.nome}</b><span>${c.toLocaleString('pt-BR')} / ${n.limite.toLocaleString('pt-BR')}${over ? ` · passou ${(c - n.limite).toLocaleString('pt-BR')}` : ''}</span><span class="leg__bar" aria-hidden="true"><i style="width:${Math.min(100, pct)}%"></i></span>${n.nota || extra ? `<small>${esc([extra, n.nota].filter(Boolean).join(' '))}</small>` : ''}</li>`;
    }).join('');
    renderMock();
    store.set('leg:draft', s);
  }

  // ---------- Ferramentas ----------
  const setText = (v, msg) => { ta.value = v; ta.dispatchEvent(new Event('input', { bubbles: true })); say(status, msg); };
  $('[data-fix-lines]').addEventListener('click', () => {
    // Linha vazia (ou só com espaços) vira U+2800, que o Instagram não apaga.
    const v = ta.value.replace(/[ \t]+$/gm, '').replace(/^\s*$/gm, (m, off, all) => (off === 0 || off === all.length ? m : '⠀'));
    setText(v, 'Linhas em branco protegidas. Copie e cole no Instagram.');
  });
  $('[data-fix-spaces]').addEventListener('click', () => setText(ta.value.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim(), 'Espaços sobrando removidos.'));
  $('[data-move-tags]').addEventListener('click', () => {
    const tags = [];
    const body = ta.value.replace(TAG_RE, (m, pre, t) => { tags.push(`#${t}`); return pre; }).replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    if (!tags.length) { say(status, 'Não tem hashtag no texto.'); return; }
    setText(`${body}\n\n${[...new Set(tags)].join(' ')}`, `${tags.length} hashtags no fim.`);
  });
  $('[data-copy-text]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(ta.value); say(status, 'Legenda copiada.'); } catch { ta.select(); say(status, 'Selecionei o texto. Use Ctrl+C.', 4000); }
  });

  // ---------- Grupos de hashtags ----------
  let groups = store.get('leg:groups', []);
  function renderGroups() {
    const ul = $('[data-groups]');
    ul.replaceChildren(...groups.map((g, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<div><b></b><small></small></div><button class="mini-btn" type="button" data-use="${i}">Inserir</button><button class="mini-btn" type="button" data-del="${i}" aria-label="Apagar grupo">×</button>`;
      li.querySelector('b').textContent = g.nome;
      li.querySelector('small').textContent = g.tags;
      return li;
    }));
  }
  $('[data-save-group]').addEventListener('click', () => {
    const nome = form.elements.grupo_nome.value.trim();
    const tags = (form.elements.grupo_tags.value.match(/#?[\p{L}\p{N}_]+/gu) || []).map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
    if (!nome || !tags) { say(status, 'Dê um nome e coloque pelo menos uma hashtag.'); return; }
    groups = [...groups.filter((g) => g.nome !== nome), { nome, tags }];
    store.set('leg:groups', groups);
    form.elements.grupo_nome.value = ''; form.elements.grupo_tags.value = '';
    renderGroups();
    say(status, `Grupo "${nome}" salvo.`);
  });
  $('[data-groups]').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.use) {
      const g = groups[Number(b.dataset.use)];
      const pos = ta.selectionEnd ?? ta.value.length;
      const before = ta.value.slice(0, pos), after = ta.value.slice(pos);
      const sep = before && !/\s$/.test(before) ? (/#\S+$/.test(before) ? ' ' : '\n\n') : '';
      setText(`${before}${sep}${g.tags}${after}`, `Hashtags de "${g.nome}" inseridas.`);
      ta.focus();
    } else if (b.dataset.del) {
      groups.splice(Number(b.dataset.del), 1);
      store.set('leg:groups', groups);
      renderGroups();
    }
  });

  ta.value = store.get('leg:draft', '');
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  renderGroups();
  render();
}
