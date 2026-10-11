// Gera as imagens Open Graph (1200 × 630) a partir dos modelos do Open Graph.dc.html:
//   og/default.png               site (home, sobre, links, obrigado, 404)
//   og/projetos.png, og/blog.png listas
//   og/projetos/<slug>.png       modelo "PROJETO"
//   og/blog/<slug>.png           modelo "BLOG · N MIN"
// Rode depois de mudar títulos de posts/projetos:  cd tools && npm i && npm run og
import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { RotatedRect } from '../src/components/RotatedRect.mjs';
import { toString } from '../src/lib/html.mjs';
import { parseFrontMatter, readingMinutes } from '../src/lib/markdown.mjs';

const root = new URL('..', import.meta.url).pathname;
const pub = join(root, 'public');
const asset = (p) => pathToFileURL(join(pub, p)).href;
const tokens = await readFile(join(root, 'src/styles/tokens.css'), 'utf8');
const fonts = (await readFile(join(root, 'src/styles/fonts.css'), 'utf8')).replace(/url\("\/assets\//g, `url("${asset('assets/')}`);
const json = async (p) => JSON.parse(await readFile(join(root, p), 'utf8'));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rect = (cor, w, h, r, x, y) => toString(RotatedRect({ cor, w, h, r, x, y }, 'og'));

const css = `${tokens}${fonts}
html,body{margin:0}
.og{width:1200px;height:630px;position:relative;overflow:hidden;background:var(--tr-escuro);color:var(--tr-claro)}
.rr{position:absolute;left:var(--x);top:var(--y);width:var(--w);height:var(--h);background:var(--c);transform:rotate(var(--r))}
.chip{background:var(--tr-lima);color:var(--tr-escuro);padding:8px 16px;font-family:var(--font-mono);font-weight:700}
.k{font-family:var(--font-display);font-style:italic;font-weight:900;letter-spacing:-.02em}
.mono{font-family:var(--font-mono);font-weight:700}`;

const padrao = () => `<div class="og">
  ${rect('lima', 760, 180, -11.8, '52%', '68%')}${rect('roxo', 420, 150, 17.8, '78%', '6%')}${rect('rosa', 360, 110, -23.5, '88%', '44%')}
  <div style="position:absolute;left:60px;top:60px;bottom:60px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start">
    <img src="${asset('assets/logos/th-claro.svg')}" style="height:56px" alt="">
    <div style="display:flex;flex-direction:column;align-items:flex-start">
      <span class="chip" style="font-style:italic;font-size:26px">Dev + design</span>
      <span class="k" style="background:var(--tr-escuro);padding:0 20px 8px 6px;margin-top:12px;font-size:120px;line-height:.92">Thiago</span>
      <span class="k" style="background:var(--tr-escuro);padding:0 20px 10px 6px;font-size:120px;line-height:.92">Raphael</span>
      <span class="mono" style="background:var(--tr-escuro);padding:12px 6px 0;font-size:24px">thiagoraphael.com.br</span>
    </div>
  </div>
</div>`;

const modelo = ({ kicker, title, meta, c1, c2 }) => `<div class="og">
  ${rect(c1, 520, 150, 17.8, '84%', '70%')}${rect(c2, 300, 100, -23.5, '92%', '8%')}
  <div style="position:absolute;left:60px;right:300px;top:60px;bottom:60px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start">
    <span class="chip" style="font-size:24px;letter-spacing:.06em">${esc(kicker)}</span>
    <span class="k" id="t" style="font-size:84px;line-height:1;text-wrap:balance">${esc(title)}</span>
    <div style="display:flex;align-items:center;gap:20px">
      <img src="${asset('assets/logos/horizontal-claro.svg')}" style="height:40px" alt="">
      <span class="mono" style="font-size:22px;color:var(--tr-lima)">${esc(meta)}</span>
    </div>
  </div>
</div>`;

const jobs = [['og/default.png', padrao()]];
const pg = { projetos: await json('content/paginas/projetos.json'), blog: await json('content/paginas/blog.json') };
jobs.push(['og/projetos.png', modelo({ kicker: 'PROJETOS', title: pg.projetos.lead, meta: 'thiagoraphael.com.br/projetos', c1: 'roxo', c2: 'lima' })]);
jobs.push(['og/blog.png', modelo({ kicker: 'BLOG', title: pg.blog.lead, meta: 'thiagoraphael.com.br/blog', c1: 'rosa', c2: 'lima' })]);
for (const f of await readdir(join(root, 'content/projetos'))) {
  const p = await json(`content/projetos/${f}`);
  const slug = p.slug || f.replace('.json', '');
  jobs.push([`og/projetos/${slug}.png`, modelo({ kicker: 'PROJETO', title: p.ogTitulo || p.nome, meta: 'thiagoraphael.com.br/projetos', c1: 'roxo', c2: 'lima' })]);
}
for (const f of await readdir(join(root, 'content/posts'))) {
  const { data, body } = parseFrontMatter(await readFile(join(root, 'content/posts', f), 'utf8'));
  jobs.push([`og/blog/${data.slug}.png`, modelo({ kicker: `BLOG · ${readingMinutes(body)} MIN`, title: data.titulo, meta: 'thiagoraphael.com.br/blog', c1: 'rosa', c2: 'lima' })]);
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ['--headless=new'] } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const tmp = join(root, 'tools/.og-tmp.html');
for (const [out, body] of jobs) {
  await mkdir(join(pub, out, '..'), { recursive: true });
  // Página temporária em arquivo (setContent roda em about:blank e não lê fontes/logos locais).
  await writeFile(tmp, `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // Títulos longos: reduz até caber em 3 linhas (o modelo aceita ~60 caracteres).
  await page.evaluate(() => {
    const t = document.getElementById('t');
    if (!t) return;
    let size = 84;
    while (t.getBoundingClientRect().height > size * 3.05 && size > 48) { size -= 4; t.style.fontSize = size + 'px'; }
  });
  await page.screenshot({ path: join(pub, out), type: 'png' });
  console.log(out);
}
await browser.close();
await rm(tmp, { force: true });
