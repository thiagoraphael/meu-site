// ---------- Paleta: cores de uma imagem, conta-gotas, contraste WCAG e exportação ----------
const form = $('[data-app="paleta"]');
if (form) {
  const src = $('[data-source]');
  const sctx = src.getContext('2d', { willReadFrequently: true });
  const srcWrap = $('[data-source-wrap]');
  const listEl = $('[data-list]');
  const emptyEl = $('[data-empty]');
  const exportEl = $('[data-export]');
  const codeEl = $('[data-code]');
  const status = $('[data-status]');
  const hover = $('[data-hover]');
  const qtd = form.elements.qtd;
  const qtdLabel = qtd.closest('label').querySelector('span');
  let img = null;
  let auto = [];       // cores extraídas
  let picked = [];     // cores do conta-gotas
  let removed = new Set();
  const names = {};    // hex → nome dado pela pessoa

  const prefs = store.get('paleta:prefs', {});
  if (prefs.qtd) qtd.value = prefs.qtd;
  if (prefs.ordem) setRadio('ordem', prefs.ordem, form);
  if (prefs.formato) setRadio('formato', prefs.formato, form);
  if (prefs.prefixo) form.elements.prefixo.value = prefs.prefixo;
  const savePrefs = () => store.set('paleta:prefs', { qtd: qtd.value, ordem: radioValue('ordem', form), formato: radioValue('formato', form), prefixo: form.elements.prefixo.value });

  function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }
  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cor';
  const grade = (r) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA grande' : 'Falha');

  function colors() {
    const all = [...auto, ...picked].filter((c) => !removed.has(c.hex));
    const seen = new Set();
    const uniq = all.filter((c) => (seen.has(c.hex) ? false : seen.add(c.hex)));
    const ordem = radioValue('ordem', form);
    if (ordem === 'luz') uniq.sort((a, b) => luminance(b.rgb) - luminance(a.rgb));
    if (ordem === 'matiz') uniq.sort((a, b) => { const ha = rgbToHsl(a.rgb), hb = rgbToHsl(b.rgb); return (ha[1] < 10) - (hb[1] < 10) || ha[0] - hb[0]; });
    const pre = slug(form.elements.prefixo.value);
    return uniq.map((c, i) => ({ ...c, name: names[c.hex] || `${pre}-${i + 1}` }));
  }

  function exportCode(list) {
    const f = radioValue('formato', form);
    const key = (n) => (/^[a-z_$][\w$]*$/i.test(n) ? n : `'${n}'`);
    if (f === 'css') return `:root {\n${list.map((c) => `  --${c.name}: ${c.hex};`).join('\n')}\n}`;
    if (f === 'tw4') return `@import "tailwindcss";\n\n@theme {\n${list.map((c) => `  --color-${c.name}: ${c.hex};`).join('\n')}\n}\n\n/* Uso: bg-${list[0]?.name} text-${list[1]?.name || list[0]?.name} */`;
    if (f === 'tw3') return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${list.map((c) => `        ${key(c.name)}: '${c.hex}',`).join('\n')}\n      },\n    },\n  },\n};`;
    if (f === 'scss') return list.map((c) => `$${c.name}: ${c.hex};`).join('\n');
    return JSON.stringify(Object.fromEntries(list.map((c) => [c.name, c.hex])), null, 2);
  }

  function renderList() {
    const list = colors();
    emptyEl.hidden = !!list.length;
    exportEl.hidden = !list.length;
    listEl.replaceChildren(...list.map((c) => {
      const li = document.createElement('li');
      li.className = 'pal-item';
      li.dataset.hex = c.hex;
      const [h, s, l] = rgbToHsl(c.rgb);
      const cw = contrast(c.hex, '#FFFFFF'), cb = contrast(c.hex, '#000000');
      const badge = (label, r, fg) => `<span class="wcag${r < 3 ? ' wcag--bad' : ''}" title="Contraste ${r.toFixed(2)}:1">${label} ${r.toFixed(1)} · ${grade(r)}</span>`;
      li.innerHTML = `
        <button class="pal-item__swatch" type="button" data-copy="${c.hex}" style="background:${c.hex};color:${readableOn(c.hex)}" aria-label="Copiar ${c.hex}">${c.share ? `<span class="pal-item__share">${Math.round(c.share * 100)}%</span>` : '<span class="pal-item__share">conta-gotas</span>'}</button>
        <div class="pal-item__body">
          <button class="pal-item__name" type="button" data-rename aria-label="Renomear ${c.name}">${c.name}</button>
          <button class="pal-item__hex" type="button" data-copy="${c.hex}" aria-label="Copiar ${c.hex}">${c.hex}</button>
          <span class="pal-item__codes">rgb(${c.rgb.join(', ')}) · hsl(${h} ${s}% ${l}%)</span>
          <span class="pal-item__wcag">${badge('Branco', cw)}${badge('Preto', cb)}</span>
        </div>
        <button class="pal-item__del" type="button" data-del aria-label="Remover ${c.hex}">×</button>`;
      return li;
    }));
    codeEl.textContent = list.length ? exportCode(list) : '';
    savePrefs();
  }

  function extract() {
    if (!img) return;
    auto = extractPalette(img, Number(qtd.value), { max: 140, iterations: 16 });
    removed = new Set();
    renderList();
  }

  function showSource(image) {
    img = image;
    const [w, h] = containSize(image, 1600, 1600);
    src.width = Math.round(w); src.height = Math.round(h);
    sctx.drawImage(image, 0, 0, src.width, src.height);
    srcWrap.hidden = false;
    picked = [];
    extract();
    say(status, `${colors().length} cores encontradas.`);
  }

  bindDrop($('[data-drop="imagem"]'), async ([file]) => {
    try { showSource(await fileToImage(file)); } catch (e) { say(status, e.message, 5000); }
  });

  // Imagem de exemplo: composição com as cores do site.
  $('[data-sample]').addEventListener('click', () => {
    const c = document.createElement('canvas');
    c.width = 1200; c.height = 800;
    const x = c.getContext('2d');
    x.fillStyle = BRAND.escuro; x.fillRect(0, 0, 1200, 800);
    drawRect(x, BRAND.rosa, 300, 260, 620, 300, -11.8);
    drawRect(x, BRAND.roxo, 880, 520, 560, 260, 17.8);
    drawRect(x, BRAND.lima, 640, 690, 760, 120, -23.5);
    drawRect(x, BRAND.azul, 1040, 160, 300, 120, 56.7);
    drawRect(x, BRAND.claro, 180, 620, 160, 90, 68.2);
    const im = new Image();
    im.onload = () => showSource(im);
    im.src = c.toDataURL('image/png');
  });

  // Conta-gotas: cor média de 3×3 pixels no ponto clicado.
  const pointColor = (e) => {
    const r = src.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * src.width), y = Math.floor(((e.clientY - r.top) / r.height) * src.height);
    const d = sctx.getImageData(Math.max(0, x - 1), Math.max(0, y - 1), 3, 3).data;
    let rr = 0, gg = 0, bb = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { rr += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; }
    const rgb = [rr / n, gg / n, bb / n].map(Math.round);
    return { rgb, hex: rgbToHex(...rgb) };
  };
  src.addEventListener('click', (e) => {
    const c = pointColor(e);
    removed.delete(c.hex);
    picked.push({ ...c, share: 0 });
    renderList();
    say(status, `${c.hex} adicionada à paleta.`);
  });
  src.addEventListener('pointermove', (e) => { const c = pointColor(e); hover.textContent = `Clique pra adicionar ${c.hex}`; hover.style.color = c.hex; });
  src.addEventListener('pointerleave', () => { hover.textContent = 'Clique na imagem pra pegar uma cor exata.'; hover.style.color = ''; });

  const copy = async (text, msg) => {
    try { await navigator.clipboard.writeText(text); say(status, msg); } catch { say(status, 'Não deu pra copiar. Selecione e copie à mão.', 4000); }
  };

  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const li = b.closest('li');
    const hex = li.dataset.hex;
    if (b.dataset.copy) copy(b.dataset.copy, `${b.dataset.copy} copiada.`);
    else if (b.hasAttribute('data-del')) {
      const next = li.nextElementSibling || li.previousElementSibling;
      removed.add(hex);
      renderList();
      (next && $(`li[data-hex="${next.dataset.hex}"] [data-del]`, listEl))?.focus();
      say(status, `${hex} removida.`);
    } else if (b.hasAttribute('data-rename')) {
      const input = document.createElement('input');
      input.className = 'pal-item__name-input';
      input.value = b.textContent;
      input.setAttribute('aria-label', `Nome da cor ${hex}`);
      b.replaceWith(input);
      input.focus();
      input.select();
      const done = (ok) => { if (ok && input.value.trim()) names[hex] = slug(input.value); renderList(); $(`li[data-hex="${hex}"] [data-rename]`, listEl)?.focus(); };
      input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); done(true); } if (ev.key === 'Escape') done(false); });
      input.addEventListener('blur', () => done(true), { once: true });
    }
  });

  $('[data-copy-code]').addEventListener('click', () => copy(codeEl.textContent, 'Código copiado.'));

  // PNG da paleta (1080×1350): imagem no topo e as faixas de cor com o hex.
  $('[data-download]').addEventListener('click', async () => {
    const list = colors();
    if (!list.length) return;
    await fontsReady(['700 40px "Space Mono"', '900 italic 40px Kanit']);
    const card = $('[data-card]');
    card.width = 1080; card.height = 1350;
    const x = card.getContext('2d');
    const P = 72;
    x.fillStyle = BRAND.escuro; x.fillRect(0, 0, 1080, 1350);
    const imgH = 470;
    if (img) x.drawImage(img, ...coverRect(img, 1080 - P * 2, imgH), P, P, 1080 - P * 2, imgH);
    const top = P + imgH + 32, bottom = 1350 - P - 48;
    const rowH = (bottom - top) / list.length;
    list.forEach((c, i) => {
      const y = top + i * rowH;
      x.fillStyle = c.hex; x.fillRect(P, y, 1080 - P * 2, rowH);
      x.fillStyle = readableOn(c.hex);
      const fs = Math.min(40, Math.max(20, rowH * 0.42));
      x.font = `700 ${fs}px ${FONTS.mono}`;
      x.textBaseline = 'middle';
      x.fillText(c.hex, P + 28, y + rowH / 2);
      const n = `--${c.name}`;
      x.font = `400 ${fs * 0.7}px ${FONTS.mono}`;
      x.fillText(n, 1080 - P - 28 - x.measureText(n).width, y + rowH / 2);
    });
    x.textBaseline = 'alphabetic';
    await logosReady;
    drawSignature(x, 'thiagoraphael.com.br/apps/paleta', 1080 - P, 1350 - P + 6, 26, BRAND.claro);
    await downloadCanvas(card, 'paleta.png');
    say(status, 'Paleta baixada.');
  });

  qtd.addEventListener('input', () => { qtdLabel.textContent = `Quantidade de cores: ${qtd.value}`; });
  qtd.addEventListener('change', extract);
  qtdLabel.textContent = `Quantidade de cores: ${qtd.value}`;
  form.addEventListener('change', (e) => { if (e.target.name === 'ordem' || e.target.name === 'formato') renderList(); });
  form.elements.prefixo.addEventListener('input', renderList);
}
