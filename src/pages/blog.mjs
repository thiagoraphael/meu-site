// Blog (Blog.dc.html): topo, post em destaque (bloco rosa), filtros, lista e estado vazio.
import { html, rich } from '../lib/html.mjs';
import { Shell } from '../lib/page.mjs';
import { Retangulos } from '../components/RotatedRect.mjs';
import { Button } from '../components/Button.mjs';
import { BlogPostCard } from '../components/BlogPostCard.mjs';

export default function blog(ctx) {
  const { site, paginas, scenes, posts } = ctx;
  const c = paginas.blog;
  const destaque = posts.find((p) => p.destaque) || posts[0];
  const categorias = new Set(posts.map((p) => p.categoria));
  for (const f of c.filtros) if (f !== 'Todos' && !categorias.has(f)) ctx.todo('paginas/blog.json', `Filtro "${f}" não tem nenhum post`);

  const main = html`
<header class="page-top page-head" aria-labelledby="blog-h1">
  ${Retangulos(scenes, 'blog')}
  <div class="container stack page-head__content layer">
    <p class="label">${c.rotulo}</p>
    <h1 class="display t-page" id="blog-h1">${c.h1}</h1>
    <p class="t-body-l measure">${c.lead}</p>
  </div>
</header>

${destaque ? html`<section class="container" aria-label="Post em destaque">${BlogPostCard(destaque, { variant: 'featured', headingLevel: 2 })}</section>` : ''}

<section class="container stack posts-list blog-list" aria-labelledby="blog-lista">
  <h2 class="visually-hidden" id="blog-lista">${c.listaTitulo}</h2>
  <div class="filters" role="group" aria-label="Filtrar posts" data-filters="lista-posts" data-empty="posts-vazio" data-status="posts-status" data-one="post" data-many="posts">
    ${c.filtros.map((f) => html`<button class="filter" type="button" data-filter="${f}" aria-pressed="${f === 'Todos'}">${f}</button>`)}
  </div>
  <p class="visually-hidden" id="posts-status" role="status" aria-live="polite"></p>
  <div class="post-list" id="lista-posts">
    ${posts.map((p) => BlogPostCard(p, { variant: 'row', headingLevel: 3 }))}
  </div>
  <div class="empty-state stack" id="posts-vazio"${posts.length ? html` hidden` : ''}>
    <span class="label">${c.vazio.contador}</span>
    <h2 class="display t-title-l">${rich(c.vazio.titulo)}</h2>
    <p class="t-body measure">${c.vazio.texto}</p>
    <div class="btn-row">
      ${site.podcast.href ? Button({ variant: 'primary', href: site.podcast.href, label: c.vazio.podcast }) : ''}
      ${Button({ variant: 'text', label: c.vazio.verTodos, extra: { 'data-show-all': 'lista-posts' } })}
    </div>
  </div>
</section>`;

  return [{
    path: '/blog/',
    html: Shell(ctx, { current: 'blog', meta: { title: c.titulo, description: c.descricao, path: '/blog/', og: '/og/blog.png' }, main }),
  }];
}
