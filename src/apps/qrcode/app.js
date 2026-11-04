// ---------- QR Code: tipos, estilos, logo e exportação PNG/SVG ----------
const form = $('[data-app="qrcode"]');
if (form) {
  const canvas = $('[data-canvas]');
  const ctx = canvas.getContext('2d');
  const status = $('[data-status]');
  const info = document.createElement('p');
  info.className = 'qr-info';
  status.before(info);
  let logo = null;
  let current = null; // { qr, text }

  const val = (n) => form.elements[n]?.value?.trim() ?? '';
  const checked = (n) => !!form.elements[n]?.checked;
  const digits = (s) => s.replace(/\D/g, '');

  // ---------- Conteúdo por tipo ----------
  const wifiEsc = (s) => s.replace(/([\;,:"])/g, '\\$1');
  function pixKey() {
    const t = val('pix_tipo'), k = val('pix_chave');
    if (t === 'cpf') return digits(k);
    if (t === 'celular') { const d = digits(k).replace(/^55(?=\d{10,11}$)/, ''); return d ? `+55${d}` : ''; }
    if (t === 'email') return k.toLowerCase();
    return k;
  }
  function content() {
    const tipo = radioValue('tipo', form);
    if (tipo === 'whatsapp') {
      const n = digits(val('wa_num')).replace(/^55(?=\d{10,11}$)/, '');
      if (!n) return { text: '', msg: 'Digite o número com DDD.' };
      const m = val('wa_msg');
      return { text: `https://wa.me/55${n}${m ? `?text=${encodeURIComponent(m)}` : ''}` };
    }
    if (tipo === 'wifi') {
      const s = val('wifi_ssid');
      if (!s) return { text: '', msg: 'Digite o nome da rede.' };
      const t = val('wifi_tipo');
      return { text: `WIFI:T:${t};S:${wifiEsc(s)};${t !== 'nopass' ? `P:${wifiEsc(form.elements.wifi_pass.value)};` : ''}${checked('wifi_oculta') ? 'H:true;' : ''};` };
    }
    if (tipo === 'pix') {
      const chave = pixKey();
      if (!chave || !val('pix_nome') || !val('pix_cidade')) return { text: '', msg: 'Preencha chave, nome e cidade.' };
      const valor = Number(val('pix_valor').replace(/\./g, '').replace(',', '.')) || 0;
      return { text: pixPayload({ chave, nome: val('pix_nome'), cidade: val('pix_cidade'), valor, descricao: val('pix_desc') }), pix: true };
    }
    if (tipo === 'email') {
      const to = val('mail_to');
      if (!to) return { text: '', msg: 'Digite o e-mail.' };
      const q = new URLSearchParams();
      if (val('mail_sub')) q.set('subject', val('mail_sub'));
      if (val('mail_body')) q.set('body', val('mail_body'));
      const qs = q.toString().replace(/\+/g, '%20');
      return { text: `mailto:${to}${qs ? `?${qs}` : ''}` };
    }
    return { text: form.elements.link.value.trim(), msg: 'Digite um link ou texto.' };
  }

  // ---------- Desenho (mesma geometria pro canvas e pro SVG) ----------
  // Devolve uma lista de formas em "unidades de módulo"; cada saída desenha do seu jeito.
  function shapes(qr) {
    const out = [];
    const style = radioValue('estilo', form), eyes = radioValue('olhos', form);
    const n = qr.size;
    // Área do logo: módulos ali ficam de fora (o fundo do logo cobre).
    const lt = logo ? Number(val('logo_tam')) / 100 : 0;
    const ls = Math.ceil(n * lt) | 1, l0 = Math.floor((n - ls) / 2);
    const inLogo = (x, y) => logo && checked('logo_fundo') && x >= l0 - 1 && x <= l0 + ls && y >= l0 - 1 && y <= l0 + ls;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!qr.modules[y][x] || qr.isFinder(x, y) || inLogo(x, y)) continue;
      // Padrões de alinhamento e de tempo ficam quadrados nas bolinhas: leitores mais simples dependem deles.
      if (style === 'bolinhas' && !qr.fn[y][x]) out.push({ t: 'circle', x: x + 0.5, y: y + 0.5, r: 0.47 });
      else out.push({ t: 'rect', x, y, w: 1, h: 1, r: style === 'arredondado' ? 0.35 : 0 });
    }
    // Olhos: anel 7×7 + miolo 3×3.
    const er = eyes === 'arredondado' ? 1 : 0;
    for (const [ex, ey] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      out.push({ t: 'ring', x: ex, y: ey, s: 7, r: er * 1.8 });
      out.push({ t: 'rect', x: ex + 2, y: ey + 2, w: 3, h: 3, r: er * 0.9 });
    }
    return { out, logoBox: logo ? { x: l0, y: l0, s: ls } : null };
  }

  function rrPath(c, x, y, w, h, r) {
    c.beginPath();
    if (r > 0 && c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
  }

  function draw(c, px, qr) {
    const m = Number(val('margem'));
    const total = qr.size + m * 2;
    const u = px / total;
    c.clearRect(0, 0, px, px);
    if (!checked('transparente')) { c.fillStyle = val('fundo'); c.fillRect(0, 0, px, px); }
    const { out, logoBox } = shapes(qr);
    c.fillStyle = val('cor');
    for (const s of out) {
      const X = (s.x + m) * u, Y = (s.y + m) * u;
      if (s.t === 'circle') { c.beginPath(); c.arc(X, Y, s.r * u, 0, Math.PI * 2); c.fill(); }
      else if (s.t === 'rect') { rrPath(c, X, Y, s.w * u + 0.5, s.h * u + 0.5, s.r * u); c.fill(); }
      else if (s.t === 'ring') {
        c.beginPath();
        if (c.roundRect && s.r) { c.roundRect(X, Y, 7 * u, 7 * u, s.r * u); c.roundRect(X + u, Y + u, 5 * u, 5 * u, Math.max(0, s.r - 1) * u); }
        else { c.rect(X, Y, 7 * u, 7 * u); c.rect(X + u, Y + u, 5 * u, 5 * u); }
        c.fill('evenodd');
      }
    }
    if (logoBox && logo) {
      const X = (logoBox.x + m) * u, S = logoBox.s * u;
      if (checked('logo_fundo')) { c.fillStyle = checked('transparente') ? '#FFFFFF' : val('fundo'); rrPath(c, X - u * 0.6, X - u * 0.6, S + u * 1.2, S + u * 1.2, u * 0.8); c.fill(); }
      const [w, h] = containSize(logo, S, S);
      c.drawImage(logo, X + (S - w) / 2, X + (S - h) / 2, w, h);
    }
  }

  function svg(qr) {
    const m = Number(val('margem')), total = qr.size + m * 2;
    const { out, logoBox } = shapes(qr);
    const f = (v) => +v.toFixed(3);
    const parts = [];
    if (!checked('transparente')) parts.push(`<rect width="${total}" height="${total}" fill="${val('fundo')}"/>`);
    const body = out.map((s) => {
      const X = s.x + m, Y = s.y + m;
      if (s.t === 'circle') return `<circle cx="${f(X)}" cy="${f(Y)}" r="${s.r}"/>`;
      if (s.t === 'rect') return `<rect x="${X}" y="${Y}" width="${s.w}" height="${s.h}"${s.r ? ` rx="${s.r}"` : ''}/>`;
      const r = s.r, ri = Math.max(0, r - 1);
      return `<path fill-rule="evenodd" d="${roundRectD(X, Y, 7, 7, r)}${roundRectD(X + 1, Y + 1, 5, 5, ri)}"/>`;
    }).join('');
    parts.push(`<g fill="${val('cor')}">${body}</g>`);
    if (logoBox && logo) {
      const X = logoBox.x + m, S = logoBox.s;
      if (checked('logo_fundo')) parts.push(`<rect x="${f(X - 0.6)}" y="${f(X - 0.6)}" width="${f(S + 1.2)}" height="${f(S + 1.2)}" rx="0.8" fill="${checked('transparente') ? '#FFFFFF' : val('fundo')}"/>`);
      const c = document.createElement('canvas'); c.width = c.height = 512;
      const [w, h] = containSize(logo, 512, 512);
      c.getContext('2d').drawImage(logo, (512 - w) / 2, (512 - h) / 2, w, h);
      parts.push(`<image x="${X}" y="${X}" width="${S}" height="${S}" href="${c.toDataURL('image/png')}"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="${radioValue('estilo', form) === 'quadrado' ? 'crispEdges' : 'geometricPrecision'}">${parts.join('')}</svg>`;
  }
  function roundRectD(x, y, w, h, r) {
    if (!r) return `M${x} ${y}h${w}v${h}h${-w}z`;
    return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
  }

  // ---------- Render ----------
  const PREVIEW = 720;
  const render = scheduler(() => {
    $('[data-logo-only]', form).hidden = !logo;
    $('[data-clear-logo]', form).hidden = !logo;
    const { text, msg, pix } = content();
    $('[data-pix-code]', form).hidden = !pix;
    if (pix) form.elements.pix_code.value = text;
    canvas.width = canvas.height = PREVIEW;
    if (!text) { ctx.fillStyle = BRAND.raised; ctx.fillRect(0, 0, PREVIEW, PREVIEW); ctx.fillStyle = BRAND.muted; ctx.font = `700 28px ${FONTS.mono}`; ctx.textAlign = 'center'; ctx.fillText(msg || 'Preencha os campos', PREVIEW / 2, PREVIEW / 2); ctx.textAlign = 'start'; current = null; info.textContent = ''; return; }
    let ecl = radioValue('ecc', form);
    if (logo && ecl !== 'H') ecl = 'H';
    try {
      const qr = QR.encode(text, ecl);
      current = { qr, text };
      draw(ctx, PREVIEW, qr);
      const c = contrast(val('cor'), checked('transparente') ? '#FFFFFF' : val('fundo'));
      const inverted = luminance(hexToRgb(val('cor'))) > luminance(hexToRgb(checked('transparente') ? '#FFFFFF' : val('fundo')));
      const warn = c < 3 ? ' · Pouco contraste, pode não ler' : inverted ? ' · Pontos mais claros que o fundo: alguns leitores não leem' : '';
      info.textContent = `Versão ${qr.version} · ${qr.size}×${qr.size} módulos · correção ${{ L: 'baixa', M: 'média', Q: 'alta', H: 'máxima' }[qr.ecl]}${logo && radioValue('ecc', form) !== 'H' ? ' (subiu por causa do logo)' : ''}${warn}`;
      canvas.setAttribute('aria-label', `QR code que abre: ${pix ? 'Pix' : text}`);
    } catch (e) { current = null; info.textContent = e.message; }
    store.set('qr:prefs', { cor: val('cor'), fundo: val('fundo'), estilo: radioValue('estilo', form), olhos: radioValue('olhos', form), margem: val('margem'), ecc: radioValue('ecc', form), px: radioValue('px', form), transparente: checked('transparente') });
  });

  // Exporta no tamanho escolhido (a prévia é sempre 720).
  async function full() {
    if (!current) return;
    const px = Number(radioValue('px', form));
    canvas.width = canvas.height = px;
    draw(ctx, px, current.qr);
  }
  const fileBase = () => `qrcode-${radioValue('tipo', form)}`;
  bindExport(canvas, { name: () => `${fileBase()}.png`, text: () => 'Feito em thiagoraphael.com.br/apps/qrcode', status, before: full });
  // Depois de exportar, volta a prévia pro tamanho normal.
  $$('[data-download], [data-copy-img], [data-share]').forEach((b) => b.addEventListener('click', () => setTimeout(render, 400)));
  $('[data-svg]').addEventListener('click', () => {
    if (!current) return;
    const blob = new Blob([svg(current.qr)], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${fileBase()}.svg`; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    say(status, 'SVG baixado.');
  });
  $('[data-copy-pix]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(form.elements.pix_code.value); say(status, 'Código Pix copiado.'); } catch { say(status, 'Selecione o código e copie à mão.', 4000); }
  });

  bindDrop($('[data-drop="logo"]'), async ([file]) => {
    try { logo = await fileToImage(file); render(); say(status, 'Logo adicionado. A correção foi pro máximo.'); } catch (e) { say(status, e.message, 5000); }
  }, { paste: false });
  $('[data-clear-logo]').addEventListener('click', () => { logo = null; render(); });

  const p = store.get('qr:prefs', {});
  ['cor', 'fundo', 'margem'].forEach((n) => p[n] && (form.elements[n].value = p[n]));
  ['estilo', 'olhos', 'ecc', 'px'].forEach((n) => p[n] && setRadio(n, p[n], form));
  if (p.transparente) form.elements.transparente.checked = true;
  bindRangeLabels(form);
  bindTabs('tipo', form, render);
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  render();
}
