// Build estático do site: lê content/ (JSON e Markdown), renderiza os componentes
// de src/ em HTML puro e grava tudo em dist/. Sem dependências: só Node 18+.
//   node build.mjs
import { readFile, readdir, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { toString, plain as plainText } from './src/lib/html.mjs';
import { parseFrontMatter, markdownToHtml, readingMinutes } from './src/lib/markdown.mjs';
import { retangulosCss } from './src/components/RotatedRect.mjs';
import { hasImage } from './src/components/Picture.mjs';

const ROOT = dirname(new URL(import.meta.url).pathname);
const OUT = join(ROOT, 'dist');
const readJson = async (p) => JSON.parse(await readFile(join(ROOT, p), 'utf8'));
// readdir que devolve [] quando a pasta ainda não existe (cada commit da série builda sozinho).
const list = async (p) => { try { return (await readdir(join(ROOT, p))).sort(); } catch { return []; } };
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const dataCurta = (d) => `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

// ---------- Conteúdo ----------
const todos = [];
const todo = (onde, texto) => todos.push({ onde, texto });

const site = await readJson('content/site.json');
const scenes = await readJson('content/retangulos.json');

const paginas = {};
for (const f of await list('content/paginas')) {
  if (f.endsWith('.json')) paginas[f.replace('.json', '')] = await readJson(`content/paginas/${f}`);
}

const projetos = [];
for (const f of await list('content/projetos')) {
  if (!f.endsWith('.json')) continue;
  const p = await readJson(`content/projetos/${f}`);
  p.slug ??= f.replace('.json', '');
  projetos.push(p);
}
projetos.sort((a, b) => a.ordem - b.ordem);

// Apps: "Web" tem página própria em /apps/<slug>/ (src/apps/<slug>/), "Extensão" só aponta pra loja.
const apps = [];
for (const f of await list('content/apps')) {
  if (!f.endsWith('.json')) continue;
  const a = await readJson(`content/apps/${f}`);
  a.slug ??= f.replace('.json', '');
  a.web = a.tipo === 'Web';
  a.url = a.web ? `/apps/${a.slug}/` : a.href;
  apps.push(a);
}
apps.sort((a, b) => a.ordem - b.ordem);

const posts = [];
for (const f of await list('content/posts')) {
  if (!f.endsWith('.md')) continue;
  const { data, body } = parseFrontMatter(await readFile(join(ROOT, 'content/posts', f), 'utf8'));
  const date = new Date(`${data.data}T12:00:00Z`);
  const tags = (data.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const minutos = readingMinutes(body);
  posts.push({
    slug: data.slug || f.replace('.md', ''),
    titulo: data.titulo,
    resumo: data.resumo,
    tags,
    categoria: data.categoria,
    destaque: data.destaque === 'true',
    capa: data.capa || null,
    capaAlt: data.capaAlt || '',
    data: date,
    dataIso: data.data,
    dataFmt: dataCurta(date),
    minutos,
    metaCurta: `${data.categoria.toUpperCase()} · ${minutos} MIN`,
    metaLonga: `${tags.slice(0, 2).join(' · ').toUpperCase()} · ${minutos} MIN · ${dataCurta(date)}`,
    body,
    todo: data.todo || '',
  });
}
posts.sort((a, b) => b.data - a.data || a.titulo.localeCompare(b.titulo));

// TODOs declarados no conteúdo
for (const [k, v] of Object.entries(site)) if (v && typeof v === 'object' && v.todo) todo(`site.json → ${k}`, v.todo);
for (const [nome, pg] of Object.entries(paginas)) (pg.todo || []).forEach((t) => todo(`paginas/${nome}.json`, t));
for (const p of projetos) {
  (p.todo || []).forEach((t) => todo(`projetos/${p.slug}.json`, t));
  if (!hasImage(p.thumb)) todo(`projetos/${p.slug}.json`, 'Thumbnail 16:10 do projeto (hoje mostra "Imagem em breve")');
}
for (const p of posts) {
  if (p.todo) todo(`posts/${p.slug}.md`, p.todo);
  if (!hasImage(p.capa)) todo(`posts/${p.slug}.md`, 'Imagem de capa do post (hoje mostra "Imagem em breve")');
}

// ---------- Assets ----------
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp(join(ROOT, 'public'), OUT, { recursive: true });

const cssFiles = [
  'src/styles/tokens.css',
  'src/styles/fonts.css',
  'src/styles/base.css',
  ...(await list('src/styles/components')).map((f) => `src/styles/components/${f}`),
  ...(await list('src/styles/pages')).map((f) => `src/styles/pages/${f}`),
];
let css = '';
for (const f of cssFiles) css += `/* ${f} */\n${await readFile(join(ROOT, f), 'utf8')}\n`;
css += retangulosCss(scenes);
const js = await readFile(join(ROOT, 'src/scripts/site.js'), 'utf8');
const assets = { css: `/assets/css/site.${hash(css)}.css`, js: `/assets/js/site.${hash(js)}.js` };
await mkdir(join(OUT, 'assets/css'), { recursive: true });
await mkdir(join(OUT, 'assets/js'), { recursive: true });
await writeFile(join(OUT, assets.css), css);
await writeFile(join(OUT, assets.js), js);

// CSS e JS de cada app web: base comum (src/apps/_shared) + o código do app, só na página dele.
await mkdir(join(OUT, 'assets/apps'), { recursive: true });
const readOpt = async (p) => (existsSync(join(ROOT, p)) ? readFile(join(ROOT, p), 'utf8') : '');
const sharedCss = await readOpt('src/apps/_shared/shared.css');
const sharedJs = await readOpt('src/apps/_shared/shared.js');
for (const a of apps.filter((x) => x.web)) {
  const aCss = `${sharedCss}\n${await readOpt(`src/apps/${a.slug}/app.css`)}`;
  // Todo .js da pasta do app entra, em ordem alfabética, com o app.js por último.
  const own = (await list(`src/apps/${a.slug}`)).filter((f) => f.endsWith('.js')).sort((x, y) => (x === 'app.js') - (y === 'app.js') || x.localeCompare(y));
  let ownJs = '';
  for (const f of own) ownJs += `\n// ${f}\n${await readFile(join(ROOT, `src/apps/${a.slug}/${f}`), 'utf8')}`;
  const aJs = `(() => {\n'use strict';\n${sharedJs}\n${ownJs}\n})();\n`;
  a.assets = { css: `/assets/apps/${a.slug}.${hash(aCss)}.css`, js: `/assets/apps/${a.slug}.${hash(aJs)}.js` };
  await writeFile(join(OUT, a.assets.css), aCss);
  await writeFile(join(OUT, a.assets.js), aJs);
}

// ---------- Páginas ----------
// Analytics da Vercel só no deploy (ou com FORCE_ANALYTICS=1), pra não sujar os números com testes locais.
const analytics = process.env.VERCEL === '1' || process.env.FORCE_ANALYTICS ? site.analytics : null;
const buildDate = new Date().toISOString().slice(0, 10);
const ctx = { site, paginas, projetos, apps, posts, scenes, assets, todo, markdownToHtml, analytics, buildDate };
const pageFiles = (await list('src/pages')).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
const rotas = [];
for (const f of pageFiles) {
  const mod = await import(pathToFileURL(join(ROOT, 'src/pages', f)).href);
  for (const r of await mod.default(ctx)) {
    const file = r.path.endsWith('/') ? join(OUT, r.path, 'index.html') : join(OUT, r.path);
    await mkdir(dirname(file), { recursive: true });
    const out = toString(r.html);
    const h1 = (out.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) throw new Error(`${r.path}: precisa de exatamente um <h1> (achei ${h1})`);
    const semAlt = out.match(/<img(?![^>]*\balt=)[^>]*>/g);
    if (semAlt) throw new Error(`${r.path}: <img> sem alt → ${semAlt[0]}`);
    await writeFile(file, out);
    rotas.push(r);
  }
}

// ---------- SEO ----------
const indexaveis = rotas.filter((r) => !r.noindex && r.path.endsWith('/')).sort((a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path));
const abs = (p) => new URL(p, site.url).href;
const xml = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Sem data própria, a página leva a data do post mais recente ou a do build.
const ultimoPost = posts[0]?.dataIso;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexaveis
  .map((r) => `  <url><loc>${abs(r.path)}</loc><lastmod>${r.lastmod || (r.path === '/blog/' ? ultimoPost : null) || buildDate}</lastmod></url>`)
  .join('\n')}\n</urlset>\n`;
await writeFile(join(OUT, 'sitemap.xml'), sitemap);
await writeFile(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);

// RSS do blog (link no <head> de todas as páginas).
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${xml(`Blog · ${site.nome}`)}</title>
  <link>${abs('/blog/')}</link>
  <atom:link href="${abs('/blog/feed.xml')}" rel="self" type="application/rss+xml"/>
  <description>${xml(plainText(paginas.blog.descricao))}</description>
  <language>pt-BR</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${posts.map((p) => `  <item>
    <title>${xml(p.titulo)}</title>
    <link>${abs(`/blog/${p.slug}/`)}</link>
    <guid isPermaLink="true">${abs(`/blog/${p.slug}/`)}</guid>
    <pubDate>${p.data.toUTCString()}</pubDate>
    <description>${xml(p.resumo)}</description>
${p.tags.map((t) => `    <category>${xml(t)}</category>`).join('\n')}
  </item>`).join('\n')}
</channel>
</rss>
`;
await mkdir(join(OUT, 'blog'), { recursive: true });
await writeFile(join(OUT, 'blog/feed.xml'), rss);

// ---------- TODOs de conteúdo ----------
const todoMd = `# TODOs de conteúdo\n\nGerado pelo \`node build.mjs\`. Some daqui quando o conteúdo real entrar nos arquivos de content/.\n\n${todos
  .map((t) => `- [ ] **${t.onde}**: ${t.texto}`)
  .join('\n')}\n`;
if (!process.env.VERCEL) await writeFile(join(ROOT, 'TODO.md'), todoMd);

console.log(`ok: ${rotas.length} páginas em dist/ · ${todos.length} TODOs de conteúdo (veja TODO.md)`);
if (!existsSync(join(OUT, 'og/default.png'))) console.warn('! og/default.png não encontrado: rode `cd tools && npm run og`');
