// ---------- Favicon: gera ICO (PNG embutido), PNGs, Apple, maskable, SVG e manifest, e junta num ZIP ----------
const form = $('[data-app="favicon"]');
if (form) {
  const status = $('[data-status]');
  let src = null, srcSvg = null;
  let files = []; // { name, blob, url, size }
  const val = (n) => form.elements[n]?.value ?? '';

  // Redução em etapas (metade por vez) pra ícone pequeno não sair serrilhado.
  function scaled(img, size) {
    let cur = img, w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    while (Math.max(w, h) / 2 > size) {
      w = Math.round(w / 2); h = Math.round(h / 2);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, w, h);
      cur = c;
    }
    return cur;
  }
  // Desenha o ícone num quadrado de `size`. opts.solid força fundo; opts.safe = fração mínima de respiro.
  function icon(size, { solid = false, safe = 0, shape } = {}) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d');
    const forma = shape || radioValue('forma', form);
    const comCor = radioValue('fundo_tipo', form) === 'cor';
    const bg = comCor ? val('fundo') : '#FFFFFF';
    if (comCor || solid) {
      x.fillStyle = bg;
      x.beginPath();
      if (forma === 'circulo') x.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      else if (forma === 'arredondado' && x.roundRect) x.roundRect(0, 0, size, size, size * 0.22);
      else x.rect(0, 0, size, size);
      x.fill();
    }
    if (src) {
      const pad = Math.max(Number(val('respiro')) / 100, safe) * size;
      const box = size - pad * 2;
      const im = scaled(src, box);
      const [w, h] = containSize(src, box, box);
      x.imageSmoothingQuality = 'high';
      if (forma === 'circulo' && !comCor && !solid) { x.save(); x.beginPath(); x.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); x.clip(); }
      x.drawImage(im, (size - w) / 2, (size - h) / 2, w, h);
      if (forma === 'circulo' && !comCor && !solid) x.restore();
    } else {
      x.fillStyle = BRAND.muted; x.font = `700 ${size * 0.5}px ${FONTS.mono}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', size / 2, size / 2);
    }
    return c;
  }
  const toBlob = (c) => new Promise((r) => c.toBlob(r, 'image/png'));

  // ICO com PNGs embutidos (aceito por todos os navegadores atuais).
  async function ico(sizes) {
    const pngs = await Promise.all(sizes.map(async (s) => new Uint8Array(await (await toBlob(icon(s))).arrayBuffer())));
    const head = 6 + 16 * sizes.length;
    const total = head + pngs.reduce((a, p) => a + p.length, 0);
    const buf = new Uint8Array(total), dv = new DataView(buf.buffer);
    dv.setUint16(2, 1, true); dv.setUint16(4, sizes.length, true);
    let off = head;
    sizes.forEach((s, i) => {
      const e = 6 + i * 16;
      buf[e] = s >= 256 ? 0 : s; buf[e + 1] = s >= 256 ? 0 : s;
      dv.setUint16(e + 4, 1, true); dv.setUint16(e + 6, 32, true);
      dv.setUint32(e + 8, pngs[i].length, true); dv.setUint32(e + 12, off, true);
      buf.set(pngs[i], off); off += pngs[i].length;
    });
    return new Blob([buf], { type: 'image/x-icon' });
  }

  // ZIP sem compressão (PNG já é comprimido), com CRC32.
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  async function zip(entries) {
    const enc = new TextEncoder(), parts = [], central = [];
    let off = 0;
    const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const e of entries) {
      const data = new Uint8Array(await e.blob.arrayBuffer()), name = enc.encode(e.name), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(10, time, true); lh.setUint16(12, date, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
      parts.push(new Uint8Array(lh.buffer), name, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(12, time, true); ch.setUint16(14, date, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, off, true);
      central.push(new Uint8Array(ch.buffer), name);
      off += 30 + name.length + data.length;
    }
    const csize = central.reduce((a, p) => a + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true); end.setUint32(12, csize, true); end.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
  }

  const base = () => { let p = val('pasta').trim() || '/'; if (!p.startsWith('/')) p = `/${p}`; if (!p.endsWith('/')) p += '/'; return p; };
  function manifest() {
    const bgSolid = radioValue('fundo_tipo', form) === 'cor' ? val('fundo') : '#FFFFFF';
    return JSON.stringify({
      name: val('nome') || 'Meu site', short_name: val('curto') || val('nome') || 'Site',
      icons: [
        { src: `${base()}icon-192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${base()}icon-512.png`, sizes: '512x512', type: 'image/png' },
        { src: `${base()}icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      theme_color: val('tema'), background_color: bgSolid, display: 'standalone', start_url: '/',
    }, null, 2);
  }
  function snippet() {
    const b = base();
    return [
      `<link rel="icon" href="${b}favicon.ico" sizes="32x32">`,
      srcSvg ? `<link rel="icon" href="${b}favicon.svg" type="image/svg+xml">` : `<link rel="icon" href="${b}favicon-32x32.png" type="image/png" sizes="32x32">`,
      `<link rel="apple-touch-icon" href="${b}apple-touch-icon.png">`,
      `<link rel="manifest" href="${b}site.webmanifest">`,
      `<meta name="theme-color" content="${val('tema')}">`,
    ].join('\n');
  }

  let busy = 0;
  async function build() {
    const run = ++busy;
    const out = [];
    const add = async (name, canvasOrBlob, note) => { const blob = canvasOrBlob instanceof Blob ? canvasOrBlob : await toBlob(canvasOrBlob); out.push({ name, blob, note }); };
    await add('favicon.ico', await ico([16, 32, 48]), '16, 32 e 48 px');
    await add('favicon-16x16.png', icon(16), '16 px');
    await add('favicon-32x32.png', icon(32), '32 px');
    await add('apple-touch-icon.png', icon(180, { solid: true, shape: 'quadrado' }), '180 px, iPhone');
    await add('icon-192.png', icon(192), '192 px, Android');
    await add('icon-512.png', icon(512), '512 px, PWA');
    await add('icon-maskable-512.png', icon(512, { solid: true, safe: 0.14, shape: 'quadrado' }), 'Android recorta no formato do aparelho');
    if (srcSvg) out.push({ name: 'favicon.svg', blob: new Blob([srcSvg], { type: 'image/svg+xml' }), note: 'Vetor' });
    out.push({ name: 'site.webmanifest', blob: new Blob([manifest()], { type: 'application/manifest+json' }), note: 'Nome, cores e ícones' });
    if (run !== busy) return;
    files.forEach((f) => URL.revokeObjectURL(f.url));
    files = out.map((f) => ({ ...f, url: URL.createObjectURL(f.blob) }));
    const isImg = (n) => /\.(png|ico|svg)$/.test(n);
    $('[data-files]').innerHTML = files.map((f) => `<li>${isImg(f.name) ? `<img src="${f.url}" alt="">` : '<span style="width:32px;text-align:center" aria-hidden="true">{ }</span>'}<div><a href="${f.url}" download="${f.name}">${f.name}</a><small>${f.note} · ${(f.blob.size / 1024).toFixed(1).replace('.', ',')} KB</small></div></li>`).join('');
    const tab = icon(32).toDataURL();
    $('[data-tab16]').src = tab; $('[data-tab16d]').src = tab;
    $('[data-home]').src = icon(180, { solid: true, shape: 'quadrado' }).toDataURL();
    $('[data-mask]').src = icon(512, { solid: true, safe: 0.14, shape: 'quadrado' }).toDataURL();
    $$('[data-tabname]').forEach((el) => { el.textContent = val('nome') || 'Meu site'; });
    $('[data-homename]').textContent = val('curto') || 'Site';
    form.elements.codigo.value = snippet();
    store.set('fv:prefs', { forma: radioValue('forma', form), fundo_tipo: radioValue('fundo_tipo', form), fundo: val('fundo'), respiro: val('respiro'), nome: val('nome'), curto: val('curto'), tema: val('tema'), pasta: val('pasta') });
  }
  let t;
  const schedule = () => { clearTimeout(t); t = setTimeout(build, 120); };

  bindDrop($('[data-drop="logo"]'), async ([file]) => {
    try {
      srcSvg = file.type === 'image/svg+xml' ? await file.text() : null;
      src = await fileToImage(file);
      const w = src.naturalWidth, h = src.naturalHeight;
      say(status, !srcSvg && Math.min(w, h) < 512 ? `Imagem de ${w}×${h}. Pra ficar nítido no 512, use 512 px ou mais.` : 'Logo carregado.', 6000);
      if (srcSvg && (!w || !h)) say(status, 'O SVG não tem largura e altura. Se o ícone sair vazio, exporte como PNG.', 6000);
      build();
    } catch (e) { say(status, e.message, 5000); }
  });
  $('[data-zip]').addEventListener('click', async () => {
    if (!src) { say(status, 'Envie um logo primeiro.'); return; }
    await build();
    const z = await zip(files.map((f) => ({ name: f.name, blob: f.blob })).concat([{ name: 'LEIA-ME.txt', blob: new Blob([`Coloque os arquivos em ${base()} do seu site e cole no <head>:\n\n${snippet()}\n\nGerado em thiagoraphael.com.br/apps/favicon\n`], { type: 'text/plain' }) }]));
    const a = document.createElement('a'); a.href = URL.createObjectURL(z); a.download = 'favicon.zip'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    say(status, 'ZIP baixado.');
  });
  $('[data-copy-code]').addEventListener('click', async () => { try { await navigator.clipboard.writeText(form.elements.codigo.value); say(status, 'Código copiado.'); } catch { form.elements.codigo.select(); say(status, 'Selecionei o código. Use Ctrl+C.'); } });

  const p = store.get('fv:prefs', {});
  ['forma', 'fundo_tipo'].forEach((n) => p[n] && setRadio(n, p[n], form));
  ['fundo', 'respiro', 'nome', 'curto', 'tema', 'pasta'].forEach((n) => p[n] != null && (form.elements[n].value = p[n]));
  bindRangeLabels(form);
  form.addEventListener('input', schedule);
  form.addEventListener('change', schedule);
  build();
}
