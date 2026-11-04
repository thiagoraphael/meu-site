// ---------- Estante: capa, estante e citação em story (1080×1920) ou feed (1080×1350) ----------
const form = $('[data-app="estante"]');
if (form) {
  const canvas = $('[data-canvas]');
  const ctx = canvas.getContext('2d');
  const status = $('[data-status]');
  const thumbsEl = $('[data-thumbs]');
  const W = 1080;
  const state = { capa: null, capaPal: null, capas: [], qCapa: null };
  const MAX_CAPAS = 9;

  const STATUS = { lendo: 'TÔ LENDO', jogando: 'TÔ JOGANDO', assistindo: 'TÔ ASSISTINDO', ouvindo: 'TÔ OUVINDO', terminei: 'TERMINEI', recomendo: 'RECOMENDO' };
  const UNIDADE = { paginas: ['página', 'páginas'], capitulos: ['capítulo', 'capítulos'], episodios: ['episódio', 'episódios'], horas: ['hora', 'horas'] };

  // Temas: fundo, texto, chip, destaque (barra/estrelas), trilho da barra, cor da palavra destacada e retângulos.
  const THEMES = {
    escuro: { bg: BRAND.escuro, fg: BRAND.claro, chipBg: BRAND.lima, chipFg: BRAND.escuro, accent: BRAND.lima, track: BRAND.raised, hl: BRAND.rosa, rects: [BRAND.rosa, BRAND.roxo], empty: BRAND.raised },
    rosa: { bg: BRAND.rosa, fg: BRAND.escuro, chipBg: BRAND.escuro, chipFg: BRAND.lima, accent: BRAND.escuro, track: BRAND.claro, hl: BRAND.claro, rects: [BRAND.roxo, BRAND.lima], empty: BRAND.escuro },
    roxo: { bg: BRAND.roxo, fg: BRAND.claro, chipBg: BRAND.lima, chipFg: BRAND.escuro, accent: BRAND.lima, track: BRAND.escuro, hl: BRAND.lima, rects: [BRAND.rosa, BRAND.azul], empty: BRAND.escuro },
    lima: { bg: BRAND.lima, fg: BRAND.escuro, chipBg: BRAND.roxo, chipFg: BRAND.claro, accent: BRAND.roxo, track: BRAND.escuro, hl: BRAND.rosa, rects: [BRAND.rosa, BRAND.roxo], empty: BRAND.escuro },
  };
  // Tema "cor da capa": fundo com a cor que mais aparece, texto no contraste certo, retângulos com as outras cores.
  function coverTheme(pal) {
    if (!pal || !pal.length) return THEMES.escuro;
    // Fundo com a segunda cor mais presente (com a primeira a capa sumiria no fundo); sem ela, a primeira escurecida.
    const alt = pal.slice(1).find((c) => contrast(c.hex, pal[0].hex) >= 1.5);
    const bg = alt ? alt.hex : rgbToHex(...pal[0].rgb.map((v) => v * 0.45));
    const fg = readableOn(bg);
    const others = pal.filter((c) => c.hex !== bg && contrast(c.hex, bg) > 1.6);
    const accent = others.find((c) => contrast(c.hex, bg) >= 3)?.hex || fg;
    return { bg, fg, chipBg: fg, chipFg: bg, accent, track: fg === BRAND.claro ? BRAND.escuro : BRAND.claro, hl: accent, rects: [others[0]?.hex || BRAND.rosa, others[1]?.hex || BRAND.roxo], empty: fg === BRAND.claro ? BRAND.escuro : BRAND.claro };
  }

  const val = (n) => form.elements[n]?.value?.trim() ?? '';
  const checked = (n) => !!form.elements[n]?.checked;

  // Rascunho (só os textos; as imagens não são guardadas).
  const DRAFT = 'estante:draft';
  const TEXTS = ['desfoque', 'pelicula', 'grao', 'tam_capa', 'cor_fundo', 'cor_destaque', 'status', 'rotulo', 'titulo', 'autor', 'atual', 'total', 'unidade', 'nota', 'comentario', 'e_titulo', 'e_sub', 'q_texto', 'q_autor', 'q_obra', 'arroba'];
  const RADIOS = ['modo', 'formato', 'tema', 'e_recorte', 'fundo_tipo'];
  const CHECKS = { e_rank: false, assinatura: true, sombra: false, inclinar: false, formas: true };
  function loadDraft() {
    const d = store.get(DRAFT, null);
    if (!d) return;
    TEXTS.forEach((n) => { if (d[n] != null && form.elements[n]) form.elements[n].value = d[n]; });
    RADIOS.forEach((n) => d[n] && setRadio(n, d[n], form));
    Object.keys(CHECKS).forEach((n) => { if (typeof d[n] === 'boolean' && form.elements[n]) form.elements[n].checked = d[n]; });
  }
  function saveDraft() {
    const d = {};
    TEXTS.forEach((n) => { d[n] = form.elements[n]?.value ?? ''; });
    RADIOS.forEach((n) => { d[n] = radioValue(n, form); });
    Object.keys(CHECKS).forEach((n) => { d[n] = checked(n); });
    store.set(DRAFT, d);
  }

  // ---------- Desenho ----------
  const deco = (colors, ...args) => { if (checked('formas')) drawRect(ctx, colors, ...args); };
  // Capa com sombra e inclinação opcionais (gira em volta do centro).
  function cover(img, ...args) {
    const [dx, dy, dw, dh] = args.length === 4 ? args : args.slice(4);
    withShadow(ctx, checked('sombra'), () => {
      if (!checked('inclinar') || radioValue('modo', form) === 'estante') { ctx.drawImage(img, ...args); return; }
      ctx.save();
      ctx.translate(dx + dw / 2, dy + dh / 2);
      ctx.rotate((-2.5 * Math.PI) / 180);
      ctx.translate(-(dx + dw / 2), -(dy + dh / 2));
      ctx.drawImage(img, ...args);
      ctx.restore();
    }, dw / 700);
  }
  const font = (kind, size) => ({ display: `italic 900 ${size}px ${FONTS.display}`, mono: `700 ${size}px ${FONTS.mono}`, monoReg: `400 ${size}px ${FONTS.mono}`, monoIt: `italic 700 ${size}px ${FONTS.mono}`, body: `400 ${size}px ${FONTS.body}`, bodyStrong: `600 ${size}px ${FONTS.body}`, accent: `400 ${size}px ${FONTS.accent}` }[kind]);

  function chip(text, x, y, size, t) {
    ctx.font = font('monoIt', size);
    const padX = size * 0.6, padY = size * 0.42;
    const w = ctx.measureText(text).width + padX * 2;
    const h = size + padY * 2;
    ctx.fillStyle = t.chipBg;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = t.chipFg;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + padX, y + h / 2 + size * 0.04);
    ctx.textBaseline = 'alphabetic';
    return h;
  }

  function star(cx, cy, r, fill, stroke, part = 1) {
    const path = new Path2D();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.46 : r;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i ? path.lineTo(x, y) : path.moveTo(x, y);
    }
    path.closePath();
    ctx.lineWidth = Math.max(3, r * 0.12);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    ctx.stroke(path);
    if (part > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - r, cy - r, r * 2 * part, r * 2);
      ctx.clip();
      ctx.fillStyle = fill;
      ctx.fill(path);
      ctx.restore();
    }
  }

  // Rodapé: @ à esquerda, endereço à direita.
  function footer(H, P, bottom, t) {
    const at = val('arroba');
    const sig = checked('assinatura');
    if (!at && !sig) return;
    ctx.font = font('mono', 28);
    ctx.fillStyle = t.fg;
    const y = H - bottom + 10;
    if (at) ctx.fillText(at.startsWith('@') ? at : `@${at}`, P, y);
    if (sig) {
      const s = 'thiagoraphael.com.br/apps';
      ctx.fillText(s, W - P - ctx.measureText(s).width, y);
    }
  }

  function placeholder(x, y, w, h, t, label) {
    ctx.fillStyle = t.empty;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = mix(t.empty, readableOn(t.empty), 0.5);
    ctx.font = font('mono', Math.max(22, Math.min(36, w / 9)));
    const lines = wrapLines(ctx, label, w - 40);
    lines.forEach((l, i) => { const lw = ctx.measureText(l).width; ctx.fillText(l, x + (w - lw) / 2, y + h / 2 + (i - (lines.length - 1) / 2) * 44); });
  }

  // Margens: o story deixa espaço pra barra de perfil e pra caixa de resposta do Instagram.
  const frame = () => (radioValue('formato', form) === 'feed' ? { H: 1350, P: 80, top: 96, bottom: 96 } : { H: 1920, P: 88, top: 230, bottom: 250 });

  // Mistura duas cores hex (k = quanto de b).
  const mix = (a, b, k) => { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(...x.map((v, i) => v + (y[i] - v) * k)); };
  // Tema "minha cor": fundo e destaque escolhidos; texto, trilho e retângulos calculados pelo contraste.
  function customTheme() {
    const bg = val('cor_fundo') || BRAND.azul;
    let accent = val('cor_destaque') || BRAND.lima;
    const fg = readableOn(bg);
    if (contrast(accent, bg) < 1.4) accent = fg;
    const second = [BRAND.rosa, BRAND.roxo, BRAND.lima, BRAND.azul, BRAND.claro].filter((c) => c.toUpperCase() !== accent.toUpperCase()).sort((a, b) => contrast(b, bg) - contrast(a, bg))[0];
    return { bg, fg, chipBg: accent, chipFg: readableOn(accent), accent, track: mix(bg, fg, 0.22), hl: accent, rects: [accent, second], empty: mix(bg, fg, 0.14) };
  }

  function theme() {
    const v = radioValue('tema', form);
    $('[data-custom-only]', form).hidden = v !== 'minha';
    const sw = $('input[name="tema"][value="minha"] + span .seg__swatch', form);
    if (sw) sw.style.background = val('cor_fundo') || BRAND.azul;
    if (v === 'minha') return customTheme();
    if (v !== 'capa') return THEMES[v] || THEMES.escuro;
    const mode = radioValue('modo', form);
    const pal = mode === 'capa' ? state.capaPal : mode === 'citacao' ? state.qCapa?.pal : state.capas[0]?.pal;
    return coverTheme(pal);
  }

  // Dados comuns da capa (story e feed).
  function capaData() {
    const un = val('unidade');
    const atual = Number(val('atual')) || 0, total = Number(val('total')) || 0;
    const hasProg = un !== 'nenhum' && (un === 'porcento' ? atual > 0 : atual > 0 || total > 0);
    const pct = un === 'porcento' ? Math.min(100, atual) : total ? Math.min(100, (atual / total) * 100) : 0;
    let txt = '';
    if (hasProg) {
      if (un === 'porcento') txt = `${Math.round(pct)}%`;
      else {
        const [s1, s2] = UNIDADE[un] || UNIDADE.paginas;
        const nome = (n) => (n === 1 ? s1 : s2);
        txt = total ? `${nome(atual)[0].toUpperCase()}${nome(atual).slice(1)} ${atual} de ${total} · ${Math.round(pct)}%` : `${atual} ${nome(atual)}`;
      }
    }
    return { label: (val('rotulo') || STATUS[val('status')] || 'TÔ LENDO').toUpperCase(), titulo: val('titulo'), autor: val('autor'), hasProg, pct, bar: total || un === 'porcento', txt, nota: Number(val('nota')) || 0, comentario: val('comentario') };
  }

  // Feed 4:5: capa à esquerda, texto à direita.
  function drawCapaFeed(f, t) {
    const { H, P, top, bottom } = f;
    const d = capaData();
    const footerH = val('arroba') || checked('assinatura') ? 60 : 0;
    const colGap = 56;
    const coverW = Math.round((W - P * 2) * 0.46);
    const textX = P + coverW + colGap, textW = W - P - textX;
    const areaH = H - top - bottom - footerH;
    const img = state.capa;
    const k = Number(val('tam_capa') || 100) / 100;
    const [cw0, ch0] = img ? containSize(img, coverW, areaH) : [coverW, Math.min(areaH, coverW * 1.5)];
    const cw = cw0 * k, ch = ch0 * k;
    const cy = top + (areaH - ch) / 2;
    const ox = P + (coverW - cw) / 2;
    deco(t.rects[0], ox + cw * 0.6, cy + ch * 0.95, cw * 0.85, ch * 0.16, -11.8);
    deco(t.rects[1], ox + cw * 0.1, cy + ch * 0.05, cw * 0.5, ch * 0.09, 17.8);
    if (img) cover(img, P + (coverW - cw) / 2, cy, cw, ch);
    else placeholder(P + (coverW - cw) / 2, cy, cw, ch, t, 'Envie a capa');

    // Coluna de texto centralizada na altura da capa.
    const blocks = [];
    ctx.font = font('monoIt', 32);
    blocks.push({ h: 32 + 27 + 30, draw: (y) => chip(d.label, textX, y, 32, t) });
    let ts = 76;
    ctx.font = font('display', ts);
    let tl = d.titulo ? wrapLines(ctx, d.titulo, textW) : [];
    while (tl.length > 3 && ts > 48) { ts -= 4; ctx.font = font('display', ts); tl = wrapLines(ctx, d.titulo, textW); }
    tl = clampLines(ctx, tl, 3, textW);
    if (tl.length) blocks.push({ h: tl.length * ts * 0.98 + 18, draw: (y) => { ctx.font = font('display', ts); ctx.fillStyle = t.fg; tl.forEach((l, i) => ctx.fillText(l, textX, y + ts * 0.82 + i * ts * 0.98)); } });
    if (d.autor) blocks.push({ h: 34 + 26, draw: (y) => { ctx.font = font('body', 32); ctx.fillStyle = t.fg; ctx.fillText(clampLines(ctx, [d.autor], 1, textW)[0], textX, y + 28); } });
    if (d.hasProg) blocks.push({ h: 28 + 14 + 14 + 30, draw: (y) => {
      ctx.font = font('mono', 26); ctx.fillStyle = t.fg; ctx.fillText(clampLines(ctx, [d.txt], 1, textW)[0], textX, y + 23);
      ctx.fillStyle = t.track; ctx.fillRect(textX, y + 42, textW, 14);
      ctx.fillStyle = t.accent; ctx.fillRect(textX, y + 42, d.bar ? (textW * d.pct) / 100 : 0, 14);
    } });
    if (d.nota > 0) blocks.push({ h: 44 + 30, draw: (y) => {
      const r = 21;
      for (let i = 0; i < 5; i++) star(textX + r + i * r * 2.5, y + r, r, t.accent, t.fg, Math.max(0, Math.min(1, d.nota - i)));
      ctx.fillStyle = t.fg; ctx.font = font('mono', 26); ctx.fillText(`${String(d.nota).replace('.', ',')}/5`, textX + r * 2.5 * 5 + 6, y + r + 9);
    } });
    if (d.comentario) {
      ctx.font = font('body', 30);
      const cl = clampLines(ctx, wrapLines(ctx, d.comentario, textW), 5, textW);
      blocks.push({ h: cl.length * 42, draw: (y) => { ctx.font = font('body', 30); ctx.fillStyle = t.fg; cl.forEach((l, i) => ctx.fillText(l, textX, y + 26 + i * 42)); } });
    }
    const total = blocks.reduce((a, b) => a + b.h, 0);
    let y = top + Math.max(0, (areaH - total) / 2);
    for (const b of blocks) { b.draw(y); y += b.h; }
    footer(H, P, bottom - 40, t);
    return `${d.label}: ${d.titulo || 'sem título'}${d.autor ? `, de ${d.autor}` : ''}`;
  }

  function drawCapa(f, t) {
    const { H, P, top, bottom } = f;
    const feed = H < 1500;
    if (feed) return drawCapaFeed(f, t);
    let y = top;
    const label = (val('rotulo') || STATUS[val('status')] || 'TÔ LENDO').toUpperCase();
    y += chip(label, P, y, feed ? 38 : 46, t) + (feed ? 40 : 56);

    // Blocos de baixo (medidos antes, pra capa ocupar o que sobra).
    const maxW = W - P * 2;
    const titleSize = feed ? 72 : 92;
    ctx.font = font('display', titleSize);
    const titleLines = val('titulo') ? clampLines(ctx, wrapLines(ctx, val('titulo'), maxW), 2, maxW) : [];
    ctx.font = font('body', feed ? 34 : 40);
    const autor = val('autor');
    const un = val('unidade');
    const atual = Number(val('atual')) || 0, total = Number(val('total')) || 0;
    const hasProg = un !== 'nenhum' && (un === 'porcento' ? atual > 0 : atual > 0 || total > 0);
    const nota = Number(val('nota')) || 0;
    ctx.font = font('body', feed ? 32 : 38);
    const comentario = val('comentario');
    const comLines = comentario ? clampLines(ctx, wrapLines(ctx, comentario, maxW), feed ? 2 : 3, maxW) : [];

    const gap = feed ? 22 : 30;
    let below = 0;
    if (titleLines.length) below += titleLines.length * titleSize * 0.98 + gap;
    if (autor) below += (feed ? 34 : 40) + gap;
    if (hasProg) below += (feed ? 30 : 34) + 18 + (feed ? 16 : 20) + gap;
    if (nota > 0) below += (feed ? 50 : 60) + gap;
    if (comLines.length) below += comLines.length * (feed ? 32 : 38) * 1.4 + gap;
    const footerH = val('arroba') || checked('assinatura') ? 60 : 0;
    const coverBox = Math.max(200, H - bottom - footerH - y - below - (feed ? 30 : 46));

    // Capa (ou espaço reservado) centralizada, com dois retângulos da marca atrás.
    const img = state.capa;
    // Tamanho da capa: encolhe dentro do espaço dela, sem mexer na posição do texto.
    const k = Number(val('tam_capa') || 100) / 100;
    const [cw0, ch0] = img ? containSize(img, maxW, coverBox) : [Math.min(maxW, coverBox * 2 / 3), coverBox];
    const cw = cw0 * k, ch = ch0 * k;
    const cx = (W - cw) / 2, cyy = y + (ch0 - ch) / 2;
    deco(t.rects[0], cx + cw * 0.92, cyy + ch * 0.86, cw * 0.95, ch * 0.24, -11.8);
    deco(t.rects[1], cx + cw * 0.04, cyy + ch * 0.1, cw * 0.5, ch * 0.12, 17.8);
    if (img) cover(img, cx, cyy, cw, ch);
    else placeholder(cx, cyy, cw, ch, t, 'Envie a capa');
    y += ch0 + (feed ? 34 : 50);

    ctx.fillStyle = t.fg;
    if (titleLines.length) {
      ctx.font = font('display', titleSize);
      titleLines.forEach((l, i) => ctx.fillText(l, P, y + titleSize * 0.82 + i * titleSize * 0.98));
      y += titleLines.length * titleSize * 0.98 + gap;
    }
    if (autor) {
      ctx.font = font('body', feed ? 34 : 40);
      ctx.fillText(autor, P, y + (feed ? 28 : 33));
      y += (feed ? 34 : 40) + gap;
    }
    if (hasProg) {
      const pct = un === 'porcento' ? Math.min(100, atual) : total ? Math.min(100, (atual / total) * 100) : 0;
      let txt;
      if (un === 'porcento') txt = `${Math.round(pct)}%`;
      else {
        const [s1, s2] = UNIDADE[un] || UNIDADE.paginas;
        const nome = (n) => (n === 1 ? s1 : s2);
        txt = total ? `${nome(atual)[0].toUpperCase()}${nome(atual).slice(1)} ${atual} de ${total} · ${Math.round(pct)}%` : `${atual} ${nome(atual)}`;
      }
      ctx.font = font('mono', feed ? 30 : 34);
      ctx.fillText(txt, P, y + (feed ? 26 : 29));
      y += (feed ? 30 : 34) + 18;
      const bh = feed ? 16 : 20;
      ctx.fillStyle = t.track;
      ctx.fillRect(P, y, maxW, bh);
      ctx.fillStyle = t.accent;
      ctx.fillRect(P, y, (maxW * (total || un === 'porcento' ? pct : 0)) / 100, bh);
      ctx.fillStyle = t.fg;
      y += bh + gap;
    }
    if (nota > 0) {
      const r = feed ? 24 : 29;
      for (let i = 0; i < 5; i++) star(P + r + i * r * 2.5, y + r, r, t.accent, t.fg, Math.max(0, Math.min(1, nota - i)));
      ctx.fillStyle = t.fg;
      ctx.font = font('mono', feed ? 30 : 34);
      ctx.fillText(`${String(nota).replace('.', ',')}/5`, P + r * 2.5 * 5 + 10, y + r + 12);
      y += r * 2 + gap;
    }
    if (comLines.length) {
      ctx.font = font('body', feed ? 32 : 38);
      const lh = (feed ? 32 : 38) * 1.4;
      comLines.forEach((l, i) => ctx.fillText(l, P, y + (feed ? 26 : 31) + i * lh));
    }
    footer(H, P, bottom - 40, t);
    return `${label}: ${val('titulo') || 'sem título'}${autor ? `, de ${autor}` : ''}`;
  }

  function drawEstante(f, t) {
    const { H, P, top, bottom } = f;
    const feed = H < 1500;
    let y = top;
    const sub = val('e_sub');
    if (sub) y += chip(sub.toUpperCase(), P, y, feed ? 32 : 38, t) + (feed ? 24 : 34);
    const title = val('e_titulo') || 'Minha estante';
    let size = feed ? 110 : 140;
    ctx.font = font('display', size);
    while (ctx.measureText(title).width > W - P * 2 && size > 56) { size -= 4; ctx.font = font('display', size); }
    ctx.fillStyle = t.fg;
    ctx.fillText(title, P, y + size * 0.82);
    y += size + (feed ? 36 : 56);

    const footerH = val('arroba') || checked('assinatura') ? 70 : 0;
    const areaW = W - P * 2, areaH = H - bottom - footerH - y;
    const list = state.capas;
    const n = Math.max(list.length, 1);
    const cols = n === 1 ? 1 : n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const gap = feed ? 20 : 26;
    const cellW = Math.min((areaW - gap * (cols - 1)) / cols, ((areaH - gap * (rows - 1)) / rows) * (2 / 3));
    const cellH = cellW * 1.5;
    const gridW = cols * cellW + (cols - 1) * gap, gridH = rows * cellH + (rows - 1) * gap;
    const gx = (W - gridW) / 2, gy = y + (areaH - gridH) / 2;
    deco(t.rects[0], gx + gridW * 0.85, gy + gridH * 0.95, gridW * 0.7, cellH * 0.35, -11.8);
    deco(t.rects[1], gx + cellW * 0.05, gy + gridH * 0.4, cellW * 0.9, cellH * 0.16, 17.8);
    const inteira = radioValue('e_recorte', form) === 'inteira';
    const rank = checked('e_rank');
    for (let i = 0; i < n; i++) {
      // A última fileira incompleta fica centralizada.
      const row = Math.floor(i / cols), inRow = row === rows - 1 ? n - row * cols : cols;
      const x = gx + (gridW - (inRow * cellW + (inRow - 1) * gap)) / 2 + (i % cols) * (cellW + gap), yy = gy + row * (cellH + gap);
      const it = list[i];
      if (!it) { placeholder(x, yy, cellW, cellH, t, 'Adicione capas'); continue; }
      if (inteira) {
        const [w, h] = containSize(it.img, cellW, cellH);
        withShadow(ctx, checked('sombra'), () => ctx.drawImage(it.img, x + (cellW - w) / 2, yy + (cellH - h), w, h), cellW / 700);
      } else withShadow(ctx, checked('sombra'), () => ctx.drawImage(it.img, ...coverRect(it.img, cellW, cellH), x, yy, cellW, cellH), cellW / 700);
      if (rank) {
        const s = Math.max(26, cellW * 0.14);
        ctx.font = font('display', s);
        const label = String(i + 1);
        const bw = ctx.measureText(label).width + s * 0.7;
        ctx.fillStyle = t.chipBg;
        ctx.fillRect(x, yy, bw, s * 1.3);
        ctx.fillStyle = t.chipFg;
        ctx.fillText(label, x + s * 0.3, yy + s * 1.02);
      }
    }
    footer(H, P, bottom - 40, t);
    return `${title}: estante com ${list.length} ${list.length === 1 ? 'capa' : 'capas'}`;
  }

  // Frase com uma palavra destacada ([[assim]]): tokens com fontes diferentes na mesma linha.
  function quoteLayout(text, size, maxW) {
    const tokens = [];
    String(text).split(/(\[\[.+?\]\])/).forEach((part) => {
      const acc = /^\[\[(.+)\]\]$/.exec(part);
      (acc ? acc[1] : part).split(/(\s+)/).forEach((w) => { if (w && !/^\s+$/.test(w)) tokens.push({ w, acc: !!acc }); else if (w && /\n/.test(w)) tokens.push({ br: true }); });
    });
    const lines = [[]];
    let lineW = 0;
    for (const tk of tokens) {
      if (tk.br) { lines.push([]); lineW = 0; continue; }
      ctx.font = tk.acc ? font('accent', size * 1.12) : font('display', size);
      const ww = ctx.measureText(tk.w).width;
      ctx.font = font('display', size);
      const sp = ctx.measureText(' ').width;
      const add = (lines[lines.length - 1].length ? sp : 0) + ww;
      if (lineW + add > maxW && lines[lines.length - 1].length) { lines.push([]); lineW = 0; }
      const cur = lines[lines.length - 1];
      tk.x = cur.length ? lineW + sp : 0;
      tk.width = ww;
      lineW = tk.x + ww;
      cur.push(tk);
    }
    return { lines: lines.filter((l) => l.length), lh: size * 1.04 };
  }

  function drawCitacao(f, t) {
    const { H, P, top, bottom } = f;
    const feed = H < 1500;
    const maxW = W - P * 2;
    const text = val('q_texto') || 'Escreva a [[frase]] que ficou na sua cabeça.';
    const autor = val('q_autor'), obra = val('q_obra');
    const qc = state.qCapa;
    const footerH = val('arroba') || checked('assinatura') ? 70 : 0;
    const metaH = autor || obra || qc ? (qc ? (feed ? 200 : 260) : 110) : 0;
    const markSize = feed ? 260 : 340;
    const availH = H - top - bottom - footerH - metaH - markSize * 0.55 - (feed ? 40 : 70);

    // Maior tamanho que cabe.
    let size = feed ? 104 : 120, lay;
    for (; size >= 40; size -= 4) { lay = quoteLayout(text, size, maxW); if (lay.lines.length * lay.lh <= availH) break; }

    deco(t.rects[0], W - P * 0.6, top + markSize * 0.25, 420, 120, 17.8);
    ctx.fillStyle = t.accent;
    ctx.font = font('display', markSize);
    ctx.fillText('“', P - markSize * 0.06, top + markSize * 0.72);

    const blockH = lay.lines.length * lay.lh;
    const metaGap = feed ? 40 : 60;
    // Frase + autor centralizados juntos no espaço livre.
    let y = top + markSize * 0.55 + Math.max(0, (availH + metaH - blockH - (metaH ? metaGap + metaH : 0)) / 2);
    for (const line of lay.lines) {
      for (const tk of line) {
        ctx.font = tk.acc ? font('accent', size * 1.12) : font('display', size);
        ctx.fillStyle = tk.acc ? t.hl : t.fg;
        ctx.fillText(tk.w, P + tk.x, y + size * 0.86);
      }
      y += lay.lh;
    }
    y += metaGap;

    if (metaH) {
      let x = P;
      if (qc) {
        const [w, h] = containSize(qc.img, metaH * 0.75, metaH);
        deco(t.rects[1], P + w * 0.8, y + h * 0.85, w * 1.1, h * 0.2, -23.5);
        cover(qc.img, P, y, w, h);
        x = P + w + 36;
      }
      const ty = qc ? y + metaH / 2 - 10 : y + 40;
      ctx.fillStyle = t.fg;
      if (autor) { ctx.font = font('mono', feed ? 36 : 42); ctx.fillText(autor, x, ty); }
      if (obra) { ctx.font = font('body', feed ? 32 : 38); ctx.fillText(obra, x, ty + (autor ? (feed ? 50 : 58) : 0)); }
    }
    footer(H, P, bottom - 40, t);
    return `Citação: ${text.replace(/\[\[|\]\]/g, '')}${autor ? `, ${autor}` : ''}`;
  }

  const render = scheduler(() => {
    const f = frame();
    if (canvas.width !== W || canvas.height !== f.H) { canvas.width = W; canvas.height = f.H; }
    const t = theme();
    const mode = radioValue('modo', form);
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, f.H);
    // Capa no fundo: a do modo aberto (na estante, a primeira).
    const bgImg = mode === 'capa' ? state.capa : mode === 'citacao' ? state.qCapa?.img : state.capas[0]?.img;
    const useImg = radioValue('fundo_tipo', form) === 'imagem';
    $$('[data-bg-image-only]', form).forEach((el) => { el.hidden = !useImg; });
    $$('[data-hide-in]', form).forEach((el) => { el.hidden = el.dataset.hideIn === mode; });
    if (useImg && bgImg) drawBackdrop(ctx, bgImg, W, f.H, { blur: Number(val('desfoque')) * 0.9, tint: t.bg, dim: Number(val('pelicula')) / 100 });
    const desc = mode === 'estante' ? drawEstante(f, t) : mode === 'citacao' ? drawCitacao(f, t) : drawCapa(f, t);
    applyGrain(ctx, W, f.H, Number(val('grao')));
    canvas.setAttribute('aria-label', `Prévia do ${f.H > 1500 ? 'story' : 'post'}. ${desc}`);
    saveDraft();
  });

  // ---------- Imagens ----------
  async function addImage(file) {
    const img = await fileToImage(file);
    return { img, pal: extractPalette(img, 5, { max: 64 }) };
  }
  bindDrop($('[data-drop="capa"]'), async ([file]) => {
    try { const r = await addImage(file); state.capa = r.img; state.capaPal = r.pal; render(); say(status, 'Capa carregada.'); }
    catch (e) { say(status, e.message, 5000); }
  }, { paste: false });

  function renderThumbs() {
    thumbsEl.replaceChildren(...state.capas.map((it, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="thumbs__n">${i + 1}</span><div class="thumbs__bar"><button type="button" data-move="-1" aria-label="Mover capa ${i + 1} pra trás">←</button><button type="button" data-del aria-label="Remover capa ${i + 1}">×</button><button type="button" data-move="1" aria-label="Mover capa ${i + 1} pra frente">→</button></div>`;
      const im = document.createElement('img');
      im.src = it.img.src;
      im.alt = `Capa ${i + 1}`;
      li.prepend(im);
      li.dataset.i = i;
      return li;
    }));
  }
  thumbsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const i = Number(b.closest('li').dataset.i);
    if (b.hasAttribute('data-del')) state.capas.splice(i, 1);
    else {
      const j = i + Number(b.dataset.move);
      if (j < 0 || j >= state.capas.length) return;
      [state.capas[i], state.capas[j]] = [state.capas[j], state.capas[i]];
    }
    renderThumbs();
    render();
    const again = thumbsEl.querySelector(`li[data-i="${Math.min(i, state.capas.length - 1)}"] button${b.dataset.move ? `[data-move="${b.dataset.move}"]` : '[data-del]'}`);
    again?.focus();
  });
  bindDrop($('[data-drop="capas"]'), async (files) => {
    const free = MAX_CAPAS - state.capas.length;
    if (free <= 0) { say(status, 'A estante já tem 9 capas. Remova uma pra trocar.', 4000); return; }
    for (const file of files.slice(0, free)) {
      try { state.capas.push(await addImage(file)); } catch (e) { say(status, e.message, 5000); }
    }
    if (files.length > free) say(status, `Entraram só ${free}. O limite é 9 capas.`, 4000);
    renderThumbs();
    render();
  }, { paste: false });
  const clearQ = $('[data-clear-qcapa]');
  bindDrop($('[data-drop="q_capa"]'), async ([file]) => {
    try { state.qCapa = await addImage(file); clearQ.hidden = false; render(); } catch (e) { say(status, e.message, 5000); }
  }, { paste: false });
  clearQ.addEventListener('click', () => { state.qCapa = null; clearQ.hidden = true; render(); });

  // Colar (Ctrl+V) vai pro modo aberto.
  document.addEventListener('paste', async (e) => {
    if (e.target.closest && e.target.closest('input:not([type="file"]), textarea')) return;
    const files = [...(e.clipboardData?.items || [])].filter((i) => i.kind === 'file').map((i) => i.getAsFile()).filter((f) => f && f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    const mode = radioValue('modo', form);
    const zone = mode === 'estante' ? 'capas' : mode === 'citacao' ? 'q_capa' : 'capa';
    const input = $(`[data-drop="${zone}"] input`);
    const dt = new DataTransfer();
    (mode === 'estante' ? files : files.slice(0, 1)).forEach((f) => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  });

  // ---------- Exportar ----------
  const fileName = () => `estante-${radioValue('modo', form)}-${radioValue('formato', form)}.png`;
  bindExport(canvas, { name: fileName, text: () => 'Feito em thiagoraphael.com.br/apps/estante', status });

  loadDraft();
  bindRangeLabels(form);
  bindTabs('modo', form, render);
  form.addEventListener('input', (e) => { if (e.target.name === 'cor_fundo' || e.target.name === 'cor_destaque') setRadio('tema', 'minha', form); render(); });
  form.addEventListener('change', render);
  render();
  fontsReady([...['900 italic 40px Kanit', '700 40px "Space Mono"', '700 italic 40px "Space Mono"', '400 40px "Hanken Grotesk"'], '400 40px velzyland']).then(render);
  document.fonts?.addEventListener?.('loadingdone', render);
}
