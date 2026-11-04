// ---------- Gráfico: CSV/planilha → barras ou linhas (PNG) ----------
// Regras de dataviz: uma escala só, cores em ordem fixa testadas pra daltonismo (passo próprio no claro e no escuro),
// barras finas com ponta arredondada ancorada no zero, linhas de 2 px, grade discreta, legenda a partir de 2 séries.
const form = $('[data-app="grafico"]');
if (form) {
  const canvas = $('[data-canvas]');
  const ctx = canvas.getContext('2d');
  const status = $('[data-status]');
  const tip = $('[data-tip]');
  const PALETTE = {
    escuro: ['#3987E5', '#D95926', '#199E70', '#C98500', '#D55181', '#008300', '#9085E9', '#E66767'],
    claro: ['#2A78D6', '#EB6834', '#1BAF7A', '#EDA100', '#E87BA4', '#008300', '#6250D6', '#E34948'],
  };
  const INK = {
    escuro: { bg: '#1A1A1A', fg: '#F8F8F8', soft: '#C4C4C4', muted: '#9A9A9A', grid: '#2E2E2E', axis: '#5A5A5A', dim: '#4A4A4A', logo: BRAND.claro },
    claro: { bg: '#FFFFFF', fg: '#1A1A1A', soft: '#474747', muted: '#6B6B6B', grid: '#E8E8E8', axis: '#9A9A9A', dim: '#C9C9C9', logo: BRAND.escuro },
  };
  const SIZES = { slide: [1920, 1080], quadrado: [1080, 1080], feed: [1080, 1350], story: [1080, 1920] };
  const val = (n) => form.elements[n]?.value ?? '';
  const checked = (n) => !!form.elements[n]?.checked;

  // ---------- Leitura dos dados ----------
  function detectDelim(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 10);
    if (lines.some((l) => l.includes('\t'))) return '\t';
    const c = (ch) => lines.reduce((a, l) => a + (l.split(ch).length - 1), 0);
    return c(';') >= c(',') && c(';') > 0 ? ';' : ',';
  }
  function parseCSV(text, d) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; continue; }
      if (ch === '"') q = true;
      else if (ch === d) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    row.push(cell); rows.push(row);
    return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''));
  }
  function num(s, mode) {
    let t = String(s).replace(/\s|R\$|US\$|€|%/gi, '');
    if (!t || !/\d/.test(t)) return null;
    t = mode === 'br' ? t.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.') : t.replace(/,/g, '');
    t = t.replace(/[^\d.\-eE]/g, '');
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }

  let table = { header: [], rows: [], numeric: [] };
  let lastCols = '';
  function readData(autoHeader) {
    const text = val('dados');
    const d = detectDelim(text);
    const rows = parseCSV(text, d);
    const mode = val('numeros');
    const w = Math.max(0, ...rows.map((r) => r.length));
    rows.forEach((r) => { while (r.length < w) r.push(''); });
    // Cabeçalho: a 1ª linha não tem número onde as outras têm.
    if (autoHeader && rows.length > 1) {
      const looksHeader = rows[0].some((c, j) => num(c, mode) === null && rows.slice(1).filter((r) => num(r[j], mode) !== null).length >= (rows.length - 1) * 0.6);
      form.elements.cabecalho.checked = looksHeader;
    }
    const hasHeader = checked('cabecalho');
    const header = hasHeader && rows.length ? rows[0].map((h, j) => h || `Coluna ${j + 1}`) : Array.from({ length: w }, (_, j) => `Coluna ${j + 1}`);
    const body = hasHeader ? rows.slice(1) : rows;
    const numeric = header.map((_, j) => body.length > 0 && body.filter((r) => num(r[j], mode) !== null).length >= body.length * 0.6);
    table = { header, rows: body, numeric, delim: d };
    const sig = header.join('|') + numeric.join();
    if (sig !== lastCols) { lastCols = sig; buildColumnControls(); }
  }
  function buildColumnControls() {
    const sel = form.elements.xcol;
    const prevX = sel.value;
    sel.innerHTML = table.header.map((h, j) => `<option value="${j}">${h.replace(/</g, '&lt;')}</option>`).join('');
    const firstText = table.numeric.findIndex((n) => !n);
    sel.value = table.header[prevX] !== undefined && !table.numeric[prevX] ? prevX : String(Math.max(0, firstText));
    const box = $('[data-series]');
    const was = new Set($$('input', box).filter((i) => i.checked).map((i) => i.value));
    const fresh = !was.size;
    box.innerHTML = '';
    let count = 0;
    table.header.forEach((h, j) => {
      if (!table.numeric[j] || String(j) === sel.value) return;
      const on = fresh ? count < 8 : was.has(String(j));
      if (on) count++;
      const l = document.createElement('label');
      l.className = 'check';
      l.innerHTML = `<input type="checkbox" name="serie" value="${j}" ${on ? 'checked' : ''}><i aria-hidden="true"></i><span></span>`;
      l.querySelector('span').textContent = h;
      box.append(l);
    });
  }

  // ---------- Números e escala ----------
  const fmt = (v, compact) => {
    const casas = Math.max(0, Math.min(4, Number(val('casas')) || 0));
    const n = compact && Math.abs(v) >= 10000
      ? new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
      : new Intl.NumberFormat(val('numeros') === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: compact ? 0 : casas, maximumFractionDigits: compact ? Math.min(casas, 1) : casas }).format(v);
    return `${val('prefixo').trim() ? `${val('prefixo').trim()} ` : ''}${n}${val('sufixo').trim()}`;
  };
  function niceScale(min, max, n = 5) {
    if (min === max) { max = min + 1; }
    const raw = (max - min) / n, p = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((k) => k * p).find((s) => s >= raw);
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
    return { lo, hi, ticks };
  }

  // Barra com a ponta arredondada (só o lado do valor).
  function bar(x, y, w, h, r, upEnd) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h));
    ctx.beginPath();
    if (upEnd === 'top') { ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h); }
    else if (upEnd === 'bottom') { ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); }
    else if (upEnd === 'right') { ctx.moveTo(x, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x, y + h); }
    else { ctx.moveTo(x + w, y); ctx.lineTo(x + r, y); ctx.arcTo(x, y, x, y + r, r); ctx.lineTo(x, y + h - r); ctx.arcTo(x, y + h, x + r, y + h, r); ctx.lineTo(x + w, y + h); }
    ctx.closePath();
    ctx.fill();
  }

  let hits = [];
  const render = scheduler(() => {
    const tema = radioValue('tema', form);
    const ink = INK[tema], pal = PALETTE[tema];
    const [W, H] = SIZES[radioValue('tamanho', form)];
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    const u = Math.min(W, H) / 1080;
    const story = radioValue('tamanho', form) === 'story';
    const P = 72 * u;
    ctx.fillStyle = ink.bg; ctx.fillRect(0, 0, W, H);
    hits = [];

    // Cores das bolinhas das séries no formulário seguem a ordem fixa.
    const serieInputs = $$('[data-series] input');
    serieInputs.forEach((inp, i) => { inp.nextElementSibling.style.background = pal[i % 8]; });
    const series = serieInputs.map((inp, i) => ({ col: Number(inp.value), on: inp.checked, color: pal[i % 8], name: table.header[Number(inp.value)] })).filter((s) => s.on).slice(0, 8);
    const xcol = Number(val('xcol'));
    let rows = table.rows.map((r) => ({ cat: r[xcol] ?? '', vals: series.map((s) => num(r[s.col], val('numeros'))) })).filter((r) => r.vals.some((v) => v !== null));
    const ordem = radioValue('ordem', form), tipo = radioValue('tipo', form);
    if (ordem !== 'original' && tipo !== 'linhas') rows = [...rows].sort((a, b) => (ordem === 'desc' ? 1 : -1) * ((b.vals[0] ?? -Infinity) - (a.vals[0] ?? -Infinity)));
    $('[data-parse-info]').textContent = `${table.rows.length} linhas · ${table.header.length} colunas · separador ${{ '\t': 'tabulação', ';': 'ponto e vírgula', ',': 'vírgula' }[table.delim] || 'vírgula'}`;
    renderTable(rows, series);

    let y = story ? 230 : P;
    // Título e subtítulo
    ctx.fillStyle = ink.fg;
    ctx.textBaseline = 'alphabetic';
    const tSize = 64 * u;
    ctx.font = `italic 900 ${tSize}px ${FONTS.display}`;
    const tl = clampLines(ctx, wrapLines(ctx, val('titulo') || ' ', W - P * 2), 2, W - P * 2);
    tl.forEach((l) => { ctx.fillText(l, P, y + tSize * 0.85); y += tSize * 1.02; });
    if (val('subtitulo')) {
      ctx.font = `400 ${30 * u}px ${FONTS.body}`; ctx.fillStyle = ink.soft;
      clampLines(ctx, wrapLines(ctx, val('subtitulo'), W - P * 2), 2, W - P * 2).forEach((l) => { ctx.fillText(l, P, y + 34 * u); y += 40 * u; });
    }
    y += 20 * u;
    // Legenda (2+ séries)
    if (series.length >= 2) {
      ctx.font = `700 ${24 * u}px ${FONTS.mono}`;
      let lx = P; const sw = 18 * u;
      series.forEach((s) => {
        const w = sw + 10 * u + ctx.measureText(s.name).width + 32 * u;
        if (lx + w > W - P) { lx = P; y += 40 * u; }
        ctx.fillStyle = s.color; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(lx, y + 6 * u, sw, sw, 4 * u) : ctx.rect(lx, y + 6 * u, sw, sw); ctx.fill();
        ctx.fillStyle = ink.fg; ctx.fillText(s.name, lx + sw + 10 * u, y + 23 * u);
        lx += w;
      });
      y += 56 * u;
    }
    const footH = (val('fonte') || checked('assinatura')) ? 64 * u : 0;
    const bottom = H - (story ? 250 : P) - footH;

    if (!rows.length || !series.length) {
      ctx.fillStyle = ink.muted; ctx.font = `700 ${30 * u}px ${FONTS.mono}`;
      ctx.fillText(series.length ? 'Nenhuma linha com número.' : 'Escolha pelo menos uma série.', P, y + 60 * u);
      footer(W, H, P, u, story, ink);
      return;
    }

    const all = rows.flatMap((r) => r.vals).filter((v) => v !== null);
    let mn = Math.min(...all), mx = Math.max(...all);
    if (tipo !== 'linhas' || mn > 0 && mn < mx * 0.4) mn = Math.min(0, mn);
    if (tipo !== 'linhas') mx = Math.max(0, mx);
    const sc = niceScale(mn, mx);
    const labelMode = radioValue('valores', form);
    const showAll = labelMode === 'todos' || (labelMode === 'auto' && rows.length * series.length <= 12);
    const highlight = checked('destaque') && series.length === 1;
    const maxIdx = highlight ? rows.reduce((bi, r, i) => (r.vals[0] > rows[bi].vals[0] ? i : bi), 0) : -1;
    const labelFont = `700 ${24 * u}px ${FONTS.mono}`, axisFont = `400 ${22 * u}px ${FONTS.mono}`;

    if (tipo === 'deitadas') {
      ctx.font = `400 ${24 * u}px ${FONTS.body}`;
      const catW = Math.min((W - P * 2) * 0.38, Math.max(...rows.map((r) => ctx.measureText(r.cat).width)) + 20 * u);
      const x0 = P + catW, x1 = W - P - (showAll || highlight ? 140 * u : 20 * u);
      const plotTop = y, plotBot = bottom - 44 * u;
      const band = (plotBot - plotTop) / rows.length;
      const X = (v) => x0 + ((v - sc.lo) / (sc.hi - sc.lo)) * (x1 - x0);
      ctx.font = axisFont; ctx.textAlign = 'center';
      sc.ticks.forEach((t) => { const x = X(t); ctx.fillStyle = ink.grid; ctx.fillRect(x - u, plotTop, 2 * u, plotBot - plotTop); ctx.fillStyle = ink.muted; ctx.fillText(fmt(t, true), x, plotBot + 34 * u); });
      ctx.textAlign = 'start';
      const zx = X(0);
      rows.forEach((r, i) => {
        const by = plotTop + i * band;
        const inner = band * 0.72, gap = 3 * u, bh = (inner - gap * (series.length - 1)) / series.length;
        ctx.fillStyle = ink.fg; ctx.font = `400 ${24 * u}px ${FONTS.body}`; ctx.textBaseline = 'middle';
        ctx.fillText(clampLines(ctx, [r.cat], 1, catW - 20 * u)[0], P, by + band / 2);
        r.vals.forEach((v, k) => {
          if (v === null) return;
          const yy = by + (band - inner) / 2 + k * (bh + gap);
          const xv = X(v);
          ctx.fillStyle = highlight && i !== maxIdx ? ink.dim : series[k].color;
          bar(Math.min(zx, xv), yy, Math.abs(xv - zx), bh, 6 * u, v >= 0 ? 'right' : 'left');
          if (showAll || i === maxIdx) { ctx.fillStyle = ink.fg; ctx.font = labelFont; ctx.fillText(fmt(v), (v >= 0 ? xv : zx) + 12 * u, yy + bh / 2); }
        });
        hits.push({ x0, x1: W, y0: by, y1: by + band, r });
        ctx.textBaseline = 'alphabetic';
      });
      ctx.fillStyle = ink.axis; ctx.fillRect(zx - u, plotTop, 2 * u, plotBot - plotTop);
    } else {
      ctx.font = axisFont;
      const yLabW = Math.max(...sc.ticks.map((t) => ctx.measureText(fmt(t, true)).width)) + 20 * u;
      const x0 = P + yLabW, x1 = W - P - (tipo === 'linhas' && series.length <= 4 ? 170 * u : 0);
      const band = (x1 - x0) / rows.length;
      ctx.font = `400 ${22 * u}px ${FONTS.body}`;
      const maxCat = Math.max(...rows.map((r) => ctx.measureText(r.cat).width));
      const rotate = maxCat > band * 0.92;
      const every = tipo === 'linhas' && rotate ? Math.ceil((maxCat + 16 * u) / band) : 1;
      const rot = rotate && tipo !== 'linhas';
      const xLabH = rot ? Math.min(220 * u, maxCat * 0.6 + 30 * u) : 44 * u;
      const plotTop = y + 30 * u, plotBot = bottom - xLabH;
      const Y = (v) => plotBot - ((v - sc.lo) / (sc.hi - sc.lo)) * (plotBot - plotTop);
      ctx.font = axisFont; ctx.textAlign = 'right';
      sc.ticks.forEach((t) => { const yy = Y(t); ctx.fillStyle = ink.grid; ctx.fillRect(x0, yy - u, x1 - x0, 2 * u); ctx.fillStyle = ink.muted; ctx.fillText(fmt(t, true), x0 - 14 * u, yy + 8 * u); });
      ctx.textAlign = 'start';
      const zy = Y(Math.max(sc.lo, Math.min(0, sc.hi)));
      // Rótulos do eixo X
      ctx.fillStyle = ink.soft; ctx.font = `400 ${22 * u}px ${FONTS.body}`;
      rows.forEach((r, i) => {
        if (i % every) return;
        const cx = x0 + band * (i + 0.5);
        if (rot) { ctx.save(); ctx.translate(cx, plotBot + 18 * u); ctx.rotate((-35 * Math.PI) / 180); ctx.textAlign = 'right'; ctx.fillText(clampLines(ctx, [r.cat], 1, 300 * u)[0], 0, 8 * u); ctx.restore(); }
        else { ctx.textAlign = 'center'; ctx.fillText(r.cat, cx, plotBot + 34 * u); ctx.textAlign = 'start'; }
        hits.push({ x0: x0 + band * i, x1: x0 + band * (i + 1), y0: plotTop, y1: plotBot, r });
      });
      if (tipo === 'barras') {
        rows.forEach((r, i) => {
          const inner = band * 0.72, gap = 3 * u, bw = (inner - gap * (series.length - 1)) / series.length;
          r.vals.forEach((v, k) => {
            if (v === null) return;
            const bx = x0 + band * i + (band - inner) / 2 + k * (bw + gap);
            const yv = Y(v);
            ctx.fillStyle = highlight && i !== maxIdx ? ink.dim : series[k].color;
            bar(bx, Math.min(yv, zy), bw, Math.abs(zy - yv), 6 * u, v >= 0 ? 'top' : 'bottom');
            if (showAll || i === maxIdx) {
              ctx.font = bw < 70 * u ? `700 ${18 * u}px ${FONTS.mono}` : labelFont; ctx.fillStyle = ink.fg; ctx.textAlign = 'center';
              ctx.fillText(fmt(v), bx + bw / 2, v >= 0 ? yv - 12 * u : yv + 30 * u); ctx.textAlign = 'start';
            }
          });
        });
      } else {
        const lw = 4 * u, mr = 6 * u;
        const ends = [];
        series.forEach((s, k) => {
          ctx.strokeStyle = s.color; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          ctx.beginPath();
          let started = false;
          rows.forEach((r, i) => { const v = r.vals[k]; if (v === null) { started = false; return; } const x = x0 + band * (i + 0.5), yy = Y(v); if (started) ctx.lineTo(x, yy); else { ctx.moveTo(x, yy); started = true; } });
          ctx.stroke();
          if (rows.length <= 24) rows.forEach((r, i) => { const v = r.vals[k]; if (v === null) return; const x = x0 + band * (i + 0.5), yy = Y(v); ctx.fillStyle = ink.bg; ctx.beginPath(); ctx.arc(x, yy, mr + 2 * u, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(x, yy, mr, 0, Math.PI * 2); ctx.fill(); });
          // Rótulo direto no fim da linha (até 4 séries).
          const lastI = rows.map((r) => r.vals[k]).map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop();
          if (lastI !== undefined && (series.length <= 4 || showAll)) ends.push({ x: x0 + band * (lastI + 0.5) + 16 * u, y: Y(rows[lastI].vals[k]), v: rows[lastI].vals[k], name: s.name });
          if (showAll && series.length === 1) rows.forEach((r, i) => { if (i === lastI || r.vals[0] === null) return; ctx.fillStyle = ink.soft; ctx.font = `400 ${20 * u}px ${FONTS.mono}`; ctx.textAlign = 'center'; ctx.fillText(fmt(r.vals[0]), x0 + band * (i + 0.5), Y(r.vals[0]) - 20 * u); ctx.textAlign = 'start'; });
        });
        // Rótulos diretos no fim das linhas, afastados pra não encavalar.
        const gapY = (series.length > 1 ? 54 : 30) * u;
        ends.sort((a, b2) => a.y - b2.y);
        for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < gapY) ends[i].y = ends[i - 1].y + gapY;
        const over = ends.length ? ends[ends.length - 1].y - (plotBot - 10 * u) : 0;
        if (over > 0) ends.forEach((e) => { e.y -= over; });
        ends.forEach((e) => {
          ctx.fillStyle = ink.fg; ctx.font = labelFont; ctx.fillText(fmt(e.v), e.x, e.y + 2 * u);
          if (series.length > 1) { ctx.fillStyle = ink.soft; ctx.font = `400 ${20 * u}px ${FONTS.mono}`; ctx.fillText(clampLines(ctx, [e.name], 1, 150 * u)[0], e.x, e.y + 26 * u); }
        });
      }
      ctx.fillStyle = ink.axis; ctx.fillRect(x0, zy - u, x1 - x0, 2 * u);
    }
    footer(W, H, P, u, story, ink);
    canvas.setAttribute('aria-label', `${val('titulo') || 'Gráfico'}: ${tipo === 'linhas' ? 'linhas' : 'barras'} com ${rows.length} categorias e ${series.length} ${series.length === 1 ? 'série' : 'séries'}. A tabela com os dados está logo abaixo.`);
    store.set('gr:prefs', { tema, tamanho: radioValue('tamanho', form), tipo, numeros: val('numeros') });
  });

  function footer(W, H, P, u, story, ink) {
    const by = H - (story ? 250 : P) - 4 * u;
    if (val('fonte')) { ctx.fillStyle = ink.muted; ctx.font = `400 ${20 * u}px ${FONTS.mono}`; ctx.fillText(`Fonte: ${val('fonte')}`, P, by); }
    if (checked('assinatura')) drawSignature(ctx, 'thiagoraphael.com.br/apps', W - P, by, 22 * u, ink.logo);
  }

  function renderTable(rows, series) {
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    $('[data-table]').innerHTML = `<table><caption class="visually-hidden">${esc(val('titulo') || 'Dados do gráfico')}</caption><thead><tr><th scope="col">${esc(table.header[Number(val('xcol'))] || '')}</th>${series.map((s) => `<th scope="col">${esc(s.name)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${esc(r.cat)}</th>${r.vals.map((v) => `<td>${v === null ? '·' : esc(fmt(v))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  // ---------- Tooltip na prévia ----------
  canvas.addEventListener('pointermove', (e) => {
    const rc = canvas.getBoundingClientRect();
    const x = ((e.clientX - rc.left) / rc.width) * canvas.width, y = ((e.clientY - rc.top) / rc.height) * canvas.height;
    const h = hits.find((t) => x >= t.x0 && x <= t.x1 && y >= t.y0 && y <= t.y1);
    if (!h) { tip.hidden = true; return; }
    const ser = $$('[data-series] input').filter((i) => i.checked).slice(0, 8);
    const pal = PALETTE[radioValue('tema', form)];
    const allInputs = $$('[data-series] input');
    tip.innerHTML = `<b></b>${h.r.vals.map((v, k) => `<div><i style="background:${pal[allInputs.indexOf(ser[k]) % 8]}"></i><span></span></div>`).join('')}`;
    tip.querySelector('b').textContent = h.r.cat;
    $$('div span', tip).forEach((sp, k) => { sp.textContent = `${table.header[Number(ser[k].value)]}: ${h.r.vals[k] === null ? 'sem dado' : fmt(h.r.vals[k])}`; });
    tip.hidden = false;
    tip.style.left = `${Math.min(window.innerWidth - tip.offsetWidth - 12, e.clientX + 16)}px`;
    tip.style.top = `${e.clientY + 16}px`;
  });
  canvas.addEventListener('pointerleave', () => { tip.hidden = true; });

  // ---------- Entrada ----------
  const zone = $('[data-drop="csv"]');
  const fileIn = $('input[type="file"]', zone);
  const loadFile = async (f) => { if (!f) return; const t = await f.text(); form.elements.dados.value = t.replace(/^﻿/, ''); readData(true); render(); say(status, `${f.name} carregado.`); };
  fileIn.addEventListener('change', () => { loadFile(fileIn.files[0]); fileIn.value = ''; });
  ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => zone.addEventListener(t, () => zone.classList.remove('is-over')));
  zone.addEventListener('drop', (e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); });

  form.addEventListener('input', (e) => {
    if (e.target.name === 'dados') readData(true);
    else if (e.target.name === 'cabecalho' || e.target.name === 'numeros') readData(false);
    else if (e.target.name === 'xcol') { lastCols = ''; readData(false); }
    if (e.target.name === 'serie') { const on = $$('[data-series] input:checked'); if (on.length > 8) { e.target.checked = false; say(status, 'Máximo de 8 séries. Mais que isso vira confusão de cores.', 4000); } }
    render();
  });
  form.addEventListener('change', render);

  const p = store.get('gr:prefs', {});
  ['tema', 'tamanho', 'tipo'].forEach((n) => p[n] && setRadio(n, p[n], form));
  if (p.numeros) form.elements.numeros.value = p.numeros;
  readData(true);
  bindExport(canvas, { name: () => `grafico-${radioValue('tipo', form)}.png`, text: () => 'Feito em thiagoraphael.com.br/apps/grafico', status });
  render();
  fontsReady().then(render);
  logosReady.then(render);
}
