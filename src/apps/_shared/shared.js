// ---------- Base comum dos apps (entra antes do código de cada app, no mesmo escopo) ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const BRAND = { rosa: '#FF007F', roxo: '#7301FF', lima: '#D8FB81', azul: '#1B0AD4', claro: '#F8F8F8', escuro: '#1A1A1A', raised: '#2A2A2A', muted: '#9A9A9A' };
const ROT = [-11.8, 17.8, -23.5, 56.7, 68.2];
const FONTS = { display: '"Kanit", "Arial Black", sans-serif', mono: '"Space Mono", ui-monospace, monospace', body: '"Hanken Grotesk", system-ui, sans-serif', accent: '"velzyland", "Caveat Brush", cursive' };

// Guarda preferências no navegador (falha em silêncio em aba anônima ou sem permissão).
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(`tr:${key}`); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(`tr:${key}`, JSON.stringify(value)); } catch {} },
};

// Mensagens curtas no campo de status (role="status" no HTML).
function say(el, text, ms = 2600) {
  if (!el) return;
  el.textContent = text;
  clearTimeout(el._t);
  if (ms) el._t = setTimeout(() => { el.textContent = ''; }, ms);
}

// Junta várias mudanças seguidas num redesenho só.
function scheduler(fn) {
  let queued = false;
  return () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; fn(); }); };
}

// As fontes do site precisam estar carregadas antes de desenhar no canvas.
async function fontsReady(specs = ['900 italic 40px Kanit', '700 40px "Space Mono"', '400 40px "Space Mono"', '700 italic 40px "Space Mono"', '400 40px "Hanken Grotesk"', '600 40px "Hanken Grotesk"']) {
  if (!document.fonts) return;
  await Promise.allSettled(specs.map((s) => document.fonts.load(s)));
}

// Arquivo → imagem. Recusa o que não é imagem e explica o HEIC (foto de iPhone).
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('Esse arquivo não é uma imagem.')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(/hei[cf]/i.test(file.type) ? 'O navegador não abre HEIC. Exporte a foto como JPG ou PNG.' : 'Não consegui abrir essa imagem.')); };
    img.src = url;
  });
}

// Liga uma área de upload: clique (input file), arrastar e soltar, e colar (Ctrl+V) na página.
function bindDrop(zone, onFiles, { paste = true } = {}) {
  const input = $('input[type="file"]', zone);
  const take = (list) => { const files = [...(list || [])].filter((f) => f.type.startsWith('image/')); if (files.length) onFiles(files); };
  input.addEventListener('change', () => { take(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => zone.addEventListener(t, () => zone.classList.remove('is-over')));
  zone.addEventListener('drop', (e) => { e.preventDefault(); take(e.dataTransfer.files); });
  if (paste) document.addEventListener('paste', (e) => {
    if (e.target.closest && e.target.closest('input:not([type="file"]), textarea')) return;
    const files = [...(e.clipboardData?.items || [])].filter((i) => i.kind === 'file').map((i) => i.getAsFile()).filter(Boolean);
    if (files.length) { e.preventDefault(); take(files); }
  });
}

// Canvas → Blob PNG
const canvasBlob = (canvas, type = 'image/png', quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

async function downloadCanvas(canvas, name) {
  const blob = await canvasBlob(canvas);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// Compartilhar imagem (celular). Devolve false quando o navegador não suporta, pra cair no download.
async function shareCanvas(canvas, name, text) {
  const blob = await canvasBlob(canvas);
  const file = new File([blob], name, { type: 'image/png' });
  if (!navigator.canShare || !navigator.canShare({ files: [file] })) return false;
  try { await navigator.share({ files: [file], text }); } catch (e) { if (e.name !== 'AbortError') throw e; }
  return true;
}
const canShareFiles = () => { try { return !!navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] }); } catch { return false; } };

// Recorte "cover": parte da imagem que preenche w×h sem distorcer. fy/fx = foco (0 topo/esquerda, 1 base/direita).
function coverRect(img, w, h, fx = 0.5, fy = 0.5) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih);
  const sw = w / s, sh = h / s;
  return [(iw - sw) * fx, (ih - sh) * fy, sw, sh];
}
// Encaixe "contain": tamanho que cabe em w×h mantendo a proporção.
function containSize(img, w, h) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const s = Math.min(w / iw, h / ih);
  return [iw * s, ih * s];
}

// Quebra texto em linhas que cabem em maxWidth (com a fonte já aplicada no ctx).
function wrapLines(ctx, text, maxWidth) {
  const out = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width <= maxWidth || !line) line = test;
      else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}
// Limita a n linhas, com reticências na última.
function clampLines(ctx, lines, n, maxWidth) {
  if (lines.length <= n) return lines;
  const kept = lines.slice(0, n);
  let last = kept[n - 1];
  while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.replace(/\s*\S+$/, '');
  kept[n - 1] = `${last}…`;
  return kept;
}

// Retângulo girado (forma da marca) no canvas: centro cx/cy, rotação em graus.
function drawRect(ctx, color, cx, cy, w, h, deg) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

// Contraste WCAG entre duas cores hex.
function hexToRgb(hex) { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r, g, b) { return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase(); }
function luminance([r, g, b]) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
function contrast(a, b) { const la = luminance(hexToRgb(a)), lb = luminance(hexToRgb(b)); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
const readableOn = (bg) => (contrast(bg, BRAND.escuro) >= contrast(bg, BRAND.claro) ? BRAND.escuro : BRAND.claro);

// Liga abas (rádios name=X) a painéis [data-panel="valor"].
function bindTabs(name, root, onChange) {
  const radios = $$(`input[name="${name}"]`, root);
  const apply = () => {
    const v = radios.find((r) => r.checked)?.value;
    $$(`[data-panel-group="${name}"] [data-panel]`, root).forEach((p) => { p.hidden = p.dataset.panel !== v; });
    onChange?.(v);
  };
  radios.forEach((r) => r.addEventListener('change', apply));
  apply();
  return () => radios.find((r) => r.checked)?.value;
}
const radioValue = (name, root = document) => $(`input[name="${name}"]:checked`, root)?.value;
const setRadio = (name, value, root = document) => { const r = $(`input[name="${name}"][value="${value}"]`, root); if (r) r.checked = true; };

// Cores principais de uma imagem: k-means em RGB sobre uma versão reduzida (determinístico).
function samplePixels(img, max = 96) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const s = Math.min(1, max / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * s)), h = Math.max(1, Math.round(ih * s));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  const px = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] >= 128) px.push([d[i], d[i + 1], d[i + 2]]);
  return px;
}
function extractPalette(img, k = 6, { max = 96, iterations = 12 } = {}) {
  const px = samplePixels(img, max);
  if (!px.length) return [];
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const dist = (a, b) => (a[0] - b[0]) ** 2 * 0.3 + (a[1] - b[1]) ** 2 * 0.59 + (a[2] - b[2]) ** 2 * 0.11;
  // k-means++: cada centro novo nasce longe dos que já existem.
  const centers = [px[Math.floor(rand() * px.length)].slice()];
  while (centers.length < Math.min(k, px.length)) {
    const ds = px.map((p) => Math.min(...centers.map((c) => dist(p, c))));
    const sum = ds.reduce((a, b) => a + b, 0);
    if (!sum) break;
    let r = rand() * sum, i = 0;
    while ((r -= ds[i]) > 0 && i < ds.length - 1) i++;
    centers.push(px[i].slice());
  }
  let counts = [];
  for (let it = 0; it < iterations; it++) {
    const acc = centers.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < centers.length; c++) { const dd = dist(p, centers[c]); if (dd < bd) { bd = dd; best = c; } }
      const a = acc[best]; a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3]++;
    }
    acc.forEach((a, c) => { if (a[3]) centers[c] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
    counts = acc.map((a) => a[3]);
  }
  return centers
    .map((c, i) => ({ rgb: c.map(Math.round), hex: rgbToHex(...c), share: counts[i] / px.length }))
    .filter((c) => c.share > 0)
    .sort((a, b) => b.share - a.share);
}
