// ---------- Mockup: print em celular, navegador ou os dois ----------
const form = $('[data-app="mockup"]');
if (form) {
  const canvas = $('[data-canvas]');
  const ctx = canvas.getContext('2d');
  const status = $('[data-status]');
  const imgs = { desktop: null, mobile: null };
  const BG = { roxo: BRAND.roxo, rosa: BRAND.rosa, lima: BRAND.lima, azul: BRAND.azul, escuro: BRAND.escuro, claro: BRAND.claro };
  const SIZES = { quadrado: [1080, 1080], feed: [1080, 1350], story: [1080, 1920], slide: [1920, 1080] };
  const posLabel = form.elements.posicao.closest('label').querySelector('span');
  const respLabel = form.elements.respiro.closest('label').querySelector('span');

  const saved = store.get('mockup:prefs', {});
  ['moldura', 'cor_moldura', 'tamanho', 'fundo'].forEach((n) => saved[n] && setRadio(n, saved[n], form));
  ['url', 'fundo_custom', 'respiro'].forEach((n) => saved[n] != null && (form.elements[n].value = saved[n]));
  if (saved.formas === false) form.elements.formas.checked = false;
  const savePrefs = () => store.set('mockup:prefs', {
    moldura: radioValue('moldura', form), cor_moldura: radioValue('cor_moldura', form), tamanho: radioValue('tamanho', form), fundo: radioValue('fundo', form),
    url: form.elements.url.value, fundo_custom: form.elements.fundo_custom.value, respiro: form.elements.respiro.value, formas: form.elements.formas.checked,
  });

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  }
  const fy = () => Number(form.elements.posicao.value) / 100;

  // Desenha a imagem preenchendo a área (corta o excesso pelo controle de posição).
  function screen(img, x, y, w, h, r, emptyLabel) {
    ctx.save();
    rr(x, y, w, h, r);
    ctx.clip();
    if (img) ctx.drawImage(img, ...coverRect(img, w, h, 0.5, fy()), x, y, w, h);
    else {
      ctx.fillStyle = BRAND.raised; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = BRAND.muted; ctx.font = `700 ${Math.max(16, w / 18)}px ${FONTS.mono}`;
      const tw = ctx.measureText(emptyLabel).width;
      ctx.fillText(emptyLabel, x + (w - tw) / 2, y + h / 2);
    }
    ctx.restore();
  }

  // Celular: proporção 9:19,5, bordas arredondadas e ilha no topo.
  const PHONE = 9 / 19.5;
  function phone(x, y, h, dark) {
    const w = h * PHONE;
    const b = w * 0.035, r = w * 0.15;
    ctx.fillStyle = dark ? '#111111' : '#E6E6E6';
    rr(x, y, w, h, r); ctx.fill();
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.strokeStyle = dark ? '#3A3A3A' : '#BDBDBD';
    rr(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth, r); ctx.stroke();
    screen(imgs.mobile || imgs.desktop, x + b, y + b, w - b * 2, h - b * 2, r - b, 'Seu print');
    ctx.fillStyle = '#0A0A0A';
    const iw = w * 0.3, ih = w * 0.085;
    rr(x + (w - iw) / 2, y + b + w * 0.03, iw, ih, ih / 2); ctx.fill();
    return w;
  }

  // Navegador: barra com três bolinhas e endereço; área de conteúdo 16:10.
  const BROWSER = 16 / 10;
  function browserSize(w) { const bar = w * 0.055; return [w, bar + w / BROWSER, bar]; }
  function browser(x, y, w, dark) {
    const [, h, bar] = browserSize(w);
    const r = w * 0.012;
    ctx.fillStyle = dark ? BRAND.escuro : '#E9E9E9';
    rr(x, y, w, h, r); ctx.fill();
    const d = bar * 0.22;
    [BRAND.rosa, BRAND.lima, dark ? BRAND.claro : '#9A9A9A'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + bar * 0.55 + i * d * 2.8, y + bar / 2, d, 0, Math.PI * 2); ctx.fill(); });
    const ux = x + bar * 0.55 + d * 8.6, uw = w - (ux - x) - bar * 0.9, uh = bar * 0.56;
    ctx.fillStyle = dark ? BRAND.raised : BRAND.claro;
    rr(ux, y + (bar - uh) / 2, uw, uh, uh / 2); ctx.fill();
    ctx.fillStyle = dark ? BRAND.claro : BRAND.escuro;
    ctx.font = `400 ${uh * 0.48}px ${FONTS.mono}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(clampLines(ctx, [form.elements.url.value || ''], 1, uw - uh)[0] || '', ux + uh * 0.5, y + bar / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.save();
    rr(x, y, w, h, r); ctx.clip();
    screen(imgs.desktop || imgs.mobile, x, y + bar, w, h - bar, 0, 'Seu print');
    ctx.restore();
    return h;
  }

  const render = scheduler(() => {
    const mold = radioValue('moldura', form);
    const dark = radioValue('cor_moldura', form) === 'escuro';
    const size = radioValue('tamanho', form);
    const fundo = radioValue('fundo', form);
    const pad = Number(form.elements.respiro.value) / 100;
    $('[data-drop-desktop]').hidden = mold === 'celular';
    $('[data-drop-mobile]').hidden = mold === 'navegador';
    form.elements.url.closest('.field').hidden = mold === 'celular';

    // Proporção da composição (largura/altura) pra cada moldura.
    const comboPhoneH = 0.82; // celular com 82% da altura do navegador
    const ratio = mold === 'celular' ? PHONE : mold === 'navegador' ? 1 / (browserSize(1)[1]) : (() => {
      const [, bh] = browserSize(1);
      const pw = bh * comboPhoneH * PHONE;
      return (1 + pw * 0.55) / (bh + bh * 0.12);
    })();
    let W, H;
    if (size === 'justo') { W = 1920; H = Math.round(W / ratio); if (H > 2600) { H = 2600; W = Math.round(H * ratio); } W = Math.round(W * (1 + pad * 2)); H = Math.round(H + W * pad * 2); }
    else [W, H] = SIZES[size];
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    ctx.clearRect(0, 0, W, H);
    if (fundo !== 'transparente') { ctx.fillStyle = fundo === 'custom' ? form.elements.fundo_custom.value : BG[fundo]; ctx.fillRect(0, 0, W, H); }

    const p = Math.round(Math.min(W, H) * pad);
    const boxW = W - p * 2, boxH = H - p * 2;
    let cw = boxW, ch = cw / ratio;
    if (ch > boxH) { ch = boxH; cw = ch * ratio; }
    const cx = (W - cw) / 2, cy = (H - ch) / 2;

    if (form.elements.formas.checked) {
      const bgc = fundo === 'custom' ? form.elements.fundo_custom.value : BG[fundo] || BRAND.escuro;
      const pool = [BRAND.lima, BRAND.rosa, BRAND.roxo, BRAND.azul].filter((c) => c !== bgc && contrast(c, bgc) > 1.3);
      drawRect(ctx, pool[0], cx + cw * 0.92, cy + ch * 0.86, Math.max(W, H) * 0.42, Math.min(W, H) * 0.12, -11.8);
      drawRect(ctx, pool[1] || pool[0], cx + cw * 0.06, cy + ch * 0.12, Math.max(W, H) * 0.24, Math.min(W, H) * 0.07, 17.8);
    }

    if (mold === 'celular') phone(cx, cy, ch, dark);
    else if (mold === 'navegador') browser(cx, cy, cw, dark);
    else {
      const [, bh1] = browserSize(1);
      const bw = cw / (1 + (bh1 * comboPhoneH * PHONE) * 0.55);
      const bh = browser(cx, cy, bw, dark);
      const ph = bh * comboPhoneH;
      phone(cx + cw - ph * PHONE, cy + ch - ph, ph, dark);
    }
    canvas.setAttribute('aria-label', `Prévia do mockup: ${mold === 'combo' ? 'navegador e celular' : mold}, ${W} por ${H} pixels`);
    savePrefs();
  });

  const load = (key) => async ([file]) => {
    try { imgs[key] = await fileToImage(file); render(); say(status, 'Print carregado.'); } catch (e) { say(status, e.message, 5000); }
  };
  bindDrop($('[data-drop="desktop"]'), load('desktop'), { paste: false });
  bindDrop($('[data-drop="mobile"]'), load('mobile'), { paste: false });
  // Colar: vai pro celular quando a moldura é só celular, senão pro desktop.
  document.addEventListener('paste', async (e) => {
    if (e.target.closest && e.target.closest('input:not([type="file"]), textarea')) return;
    const file = [...(e.clipboardData?.items || [])].find((i) => i.kind === 'file')?.getAsFile();
    if (!file || !file.type.startsWith('image/')) return;
    e.preventDefault();
    load(radioValue('moldura', form) === 'celular' ? 'mobile' : 'desktop')([file]);
  });

  const posText = (v) => (v <= 2 ? 'topo' : v >= 98 ? 'fim' : `${v}%`);
  form.addEventListener('input', (e) => {
    if (e.target.name === 'posicao') posLabel.textContent = `Parte do print que aparece: ${posText(+e.target.value)}`;
    if (e.target.name === 'respiro') respLabel.textContent = `Respiro: ${e.target.value}%`;
    if (e.target.name === 'fundo_custom') setRadio('fundo', 'custom', form);
    render();
  });
  form.addEventListener('change', render);
  respLabel.textContent = `Respiro: ${form.elements.respiro.value}%`;

  const fileName = () => `mockup-${radioValue('moldura', form)}-${canvas.width}x${canvas.height}.png`;
  $('[data-download]').addEventListener('click', async () => { await downloadCanvas(canvas, fileName()); say(status, 'Mockup baixado.'); });
  const shareBtn = $('[data-share]');
  if (canShareFiles()) {
    shareBtn.hidden = false;
    shareBtn.addEventListener('click', async () => {
      try { if (!(await shareCanvas(canvas, fileName(), 'Feito em thiagoraphael.com.br/apps/mockup'))) await downloadCanvas(canvas, fileName()); }
      catch { say(status, 'Não deu pra compartilhar. Baixe a imagem.', 4000); }
    });
  }
  render();
  fontsReady(['400 40px "Space Mono"', '700 40px "Space Mono"']).then(render);
}
