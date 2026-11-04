// ---------- Prévia de link: Open Graph, Twitter Card e resultado do Google ----------
const form = $('[data-app="previa"]');
if (form) {
  const stage = $('[data-stage]');
  const status = $('[data-status]');
  let upload = null; // { url, w, h, bytes }
  let remote = { w: 0, h: 0 };
  const val = (n) => (form.elements[n]?.value ?? '').trim();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const probe = document.createElement('canvas').getContext('2d');
  const host = () => { try { return new URL(val('url')).hostname.replace(/^www\./, ''); } catch { return ''; } };
  const imgSrc = () => upload?.url || val('imagem');

  // Corta pelo tamanho que o Google mostra (cerca de 580 px em Arial 20).
  function fitPx(text, px, font) {
    probe.font = font;
    if (probe.measureText(text).width <= px) return text;
    let t = text;
    while (t && probe.measureText(`${t}…`).width > px) t = t.slice(0, -1);
    return `${t.replace(/\s+\S*$/, '')}…`;
  }
  const cutChars = (s, n) => (s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, '')}…` : s);
  const image = (cls = '') => (imgSrc() ? `<img class="${cls}" src="${esc(imgSrc())}" alt="${esc(val('alt'))}" referrerpolicy="no-referrer">` : '<div class="noimg">Sem imagem</div>');

  const MOCK = {
    whatsapp: () => `<div class="pv-card pv-wa"><div class="bub"><div class="box">${imgSrc() ? image() : ''}<div class="txt"><b class="t2">${esc(val('titulo'))}</b><small class="t2">${esc(val('descricao'))}</small><small>${esc(host())}</small></div></div><div class="link">${esc(val('url'))}</div></div></div>`,
    linkedin: () => `<div class="pv-card pv-li">${image()}<div class="txt"><b class="t2">${esc(val('titulo'))}</b><small>${esc(host())}</small></div></div>`,
    x: () => `<div class="pv-card pv-x">${image()}<span class="dom">${esc(host())}</span><div class="below">De ${esc(host())}</div></div>`,
    facebook: () => `<div class="pv-card pv-fb">${image()}<div class="txt"><small>${esc(host())}</small><b class="t1">${esc(val('titulo'))}</b><span class="t1">${esc(val('descricao'))}</span></div></div>`,
    google: () => {
      let crumbs = host();
      try { const u = new URL(val('url')); crumbs = `${u.origin}${u.pathname.split('/').filter(Boolean).map((p) => ` › ${p}`).join('')}`; } catch {}
      return `<div class="pv-card pv-g"><div class="top"><span class="fav" aria-hidden="true">${esc((val('site') || host() || '?')[0] || '?')}</span><span><span class="nm">${esc(val('site') || host())}</span><span class="cr">${esc(crumbs)}</span></span></div><h3>${esc(fitPx(val('titulo'), 580, '20px arial'))}</h3><p>${esc(cutChars(val('descricao'), 158))}</p></div>`;
    },
  };

  function checks() {
    const out = [];
    const ok = (t) => out.push(['ok', t]), warn = (t) => out.push(['warn', t]);
    const t = val('titulo'), d = val('descricao');
    if (!t) warn('Falta o título.');
    else if (t.length > 60) warn(`Título com ${t.length} caracteres: o Google corta por volta de 60.`);
    else ok(`Título com ${t.length} caracteres.`);
    if (!d) warn('Falta a descrição.');
    else if (d.length > 160) warn(`Descrição com ${d.length} caracteres: o Google mostra uns 155.`);
    else if (d.length < 70) warn(`Descrição curta (${d.length}). Entre 70 e 155 aproveita melhor o espaço.`);
    else ok(`Descrição com ${d.length} caracteres.`);
    try { const u = new URL(val('url')); if (u.protocol !== 'https:') warn('O endereço não é https.'); else ok('Endereço com https.'); } catch { warn('Endereço inválido. Use a URL completa, com https://.'); }
    if (!imgSrc()) warn('Sem imagem: WhatsApp e LinkedIn mostram só texto, e o card perde muita força.');
    else {
      const w = upload?.w || remote.w, h = upload?.h || remote.h;
      if (w && h) {
        const r = w / h;
        if (w < 600 || h < 315) warn(`Imagem de ${w}×${h}: pequena. O mínimo recomendado é 600×315; o ideal, 1200×630.`);
        else if (Math.abs(r - 1.91) > 0.15) warn(`Imagem de ${w}×${h} (${r.toFixed(2).replace('.', ',')}:1). Fora de 1,91:1, as redes cortam as bordas.`);
        else ok(`Imagem de ${w}×${h}, na proporção certa.`);
      }
      if (upload?.bytes > 300 * 1024) warn(`Imagem com ${Math.round(upload.bytes / 1024)} KB. Acima de 300 KB, o WhatsApp às vezes não mostra a prévia.`);
      if (upload && !val('imagem')) warn('A imagem enviada é só pra prévia. No código, troque pelo endereço público dela.');
      if (!val('alt')) warn('Falta o texto alternativo da imagem (og:image:alt).');
    }
    $('[data-checks]').innerHTML = out.map(([k, txt]) => `<li class="${k}"><span>${esc(txt)}</span></li>`).join('');
  }

  function code() {
    const lines = [];
    const m = (attr, k, v) => v && lines.push(`<meta ${attr}="${k}" content="${esc(v)}">`);
    if (val('titulo')) lines.push(`<title>${esc(val('titulo'))}</title>`);
    m('name', 'description', val('descricao'));
    if (val('url')) lines.push(`<link rel="canonical" href="${esc(val('url'))}">`);
    lines.push('');
    m('property', 'og:type', 'website');
    m('property', 'og:locale', 'pt_BR');
    m('property', 'og:site_name', val('site'));
    m('property', 'og:title', val('titulo'));
    m('property', 'og:description', val('descricao'));
    m('property', 'og:url', val('url'));
    const im = val('imagem') || (upload ? 'https://seusite.com/caminho/da-imagem.png' : '');
    m('property', 'og:image', im);
    if (im && (upload?.w || remote.w)) { m('property', 'og:image:width', String(upload?.w || remote.w)); m('property', 'og:image:height', String(upload?.h || remote.h)); }
    m('property', 'og:image:alt', val('alt'));
    lines.push('');
    m('name', 'twitter:card', im ? 'summary_large_image' : 'summary');
    if (val('twitter')) m('name', 'twitter:site', val('twitter').startsWith('@') ? val('twitter') : `@${val('twitter')}`);
    m('name', 'twitter:title', val('titulo'));
    m('name', 'twitter:description', val('descricao'));
    m('name', 'twitter:image', im);
    form.elements.codigo.value = lines.join('\n');
  }

  function render() {
    const rede = radioValue('rede', form);
    stage.style.background = { whatsapp: '#0b141a', x: '#000', linkedin: '#f4f2ee', facebook: '#f0f2f5', google: '#fff' }[rede] || '';
    stage.innerHTML = MOCK[rede]();
    checks();
    code();
    store.set('pv:draft', Object.fromEntries(['url', 'titulo', 'descricao', 'site', 'twitter', 'imagem', 'alt'].map((n) => [n, val(n)])));
  }

  // Lê as meta tags de um HTML colado.
  function fromHtml(text) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const meta = (sel) => doc.querySelector(sel)?.getAttribute('content')?.trim() || '';
    const pick = (...v) => v.find(Boolean) || '';
    const base = pick(meta('meta[property="og:url"]'), doc.querySelector('link[rel="canonical"]')?.getAttribute('href'));
    const abs = (u) => { try { return u ? new URL(u, base || undefined).href : ''; } catch { return u; } };
    const set = (n, v) => { if (v) form.elements[n].value = v; };
    set('url', base);
    set('titulo', pick(meta('meta[property="og:title"]'), meta('meta[name="twitter:title"]'), doc.title?.trim()));
    set('descricao', pick(meta('meta[property="og:description"]'), meta('meta[name="description"]'), meta('meta[name="twitter:description"]')));
    set('site', meta('meta[property="og:site_name"]'));
    set('twitter', meta('meta[name="twitter:site"]'));
    set('imagem', abs(pick(meta('meta[property="og:image"]'), meta('meta[name="twitter:image"]'))));
    set('alt', pick(meta('meta[property="og:image:alt"]'), meta('meta[name="twitter:image:alt"]')));
    const found = doc.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').length;
    say(status, found ? `${found} meta tags encontradas.` : 'Não achei meta tags de Open Graph nesse HTML.', 5000);
    loadRemote();
  }
  // Mede a imagem remota (só pra checar tamanho; ela é carregada direto do site dela).
  function loadRemote() {
    remote = { w: 0, h: 0 };
    const u = val('imagem');
    if (!u) { render(); return; }
    const im = new Image();
    im.referrerPolicy = 'no-referrer';
    im.onload = () => { remote = { w: im.naturalWidth, h: im.naturalHeight }; render(); };
    im.onerror = () => { say(status, 'Não consegui abrir a imagem desse endereço. Confira se ela é pública.', 5000); render(); };
    im.src = u;
  }

  bindDrop($('[data-drop="img"]'), async ([file]) => {
    try { const img = await fileToImage(file); upload = { url: img.src, w: img.naturalWidth, h: img.naturalHeight, bytes: file.size }; render(); } catch (e) { say(status, e.message, 5000); }
  });
  let t;
  form.addEventListener('input', (e) => {
    if (e.target.name === 'fonte') { clearTimeout(t); t = setTimeout(() => fromHtml(e.target.value), 250); return; }
    if (e.target.name === 'imagem') { upload = null; clearTimeout(t); t = setTimeout(loadRemote, 400); }
    render();
  });
  form.addEventListener('change', render);
  $('[data-copy-code]').addEventListener('click', async () => { try { await navigator.clipboard.writeText(form.elements.codigo.value); say(status, 'Meta tags copiadas.'); } catch { form.elements.codigo.select(); say(status, 'Selecionei o código. Use Ctrl+C.'); } });

  const d = store.get('pv:draft', null);
  if (d) Object.entries(d).forEach(([k, v]) => { if (v && form.elements[k]) form.elements[k].value = v; });
  bindTabs('modo', form, () => {});
  loadRemote();
}
