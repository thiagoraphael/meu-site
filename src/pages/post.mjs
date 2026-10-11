// Post (Post.dc.html): cabeçalho, capa 16:9, texto em coluna de leitura, tags, compartilhar, autor e "Leia também".
import { html, raw, toString } from '../lib/html.mjs';
import { Shell, breadcrumb } from '../lib/page.mjs';
import { TagList } from '../components/Tag.mjs';
import { Picture, hasImage } from '../components/Picture.mjs';
import { BlogPostCard } from '../components/BlogPostCard.mjs';

export default function post(ctx) {
  const { site, paginas, posts, markdownToHtml } = ctx;
  const c = paginas.post;

  return posts.map((p) => {
    const url = new URL(`/blog/${p.slug}/`, site.url).href;
    const corpo = markdownToHtml(p.body, {
      image: (src, alt) => `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`,
      figure: (src, alt) => {
        const name = `post-${src.split('/').pop().replace(/\.\w+$/, '')}`;
        return hasImage(name)
          ? `<figure class="post-figure">${toString(Picture({ name, alt, sizes: '(min-width: 760px) 680px, 100vw' }))}</figure>`
          : `<figure class="post-figure"><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></figure>`;
      },
    });
    const outros = posts.filter((o) => o !== p);
    const relacionados = [...outros.filter((o) => o.categoria === p.categoria), ...outros.filter((o) => o.categoria !== p.categoria)].slice(0, 2);

    const main = html`
<article class="post">
  <header class="page-top container post__head">
    <div class="stack post__intro">
      <a class="label post__back" href="/blog/">${c.voltar}</a>
      <p class="label label--pink post__meta"><time datetime="${p.dataIso}">${p.metaLonga}</time></p>
      <h1 class="display t-lead post__title">${p.titulo}</h1>
      <p class="t-body-l">${p.resumo}</p>
    </div>
  </header>
  <div class="container post__cover">
    ${Picture({ name: p.capa, alt: p.capaAlt || `Capa do post ${p.titulo}`, ratio: '16/9', sizes: '(min-width: 1180px) 1100px, 100vw', eager: true })}
  </div>
  <div class="container">
    <div class="post__body">${raw(corpo)}</div>
    <footer class="post__foot">
      <div class="post__share-row">
        ${TagList(p.tags, { label: 'Tags do post' })}
        <div class="post__share" role="group" aria-label="${c.compartilhe}">
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" rel="noopener" target="_blank">LinkedIn</a>
          <a href="https://x.com/intent/post?url=${encodeURIComponent(url)}&amp;text=${encodeURIComponent(p.titulo)}" rel="noopener" target="_blank">X</a>
          <button type="button" class="post__copy" data-copy-link>${c.copiar}</button>
        </div>
      </div>
      <div class="post__author">
        ${Picture({ name: site.autor.foto, alt: site.autor.nome, sizes: '72px', ratio: '1/1', className: 'post__avatar' })}
        <div class="stack post__author-text">
          <p class="display post__author-name">${site.autor.nome}</p>
          <p class="t-body">${site.autor.bio}</p>
        </div>
      </div>
    </footer>
  </div>
</article>

${relacionados.length ? html`<section class="container stack post-related" aria-labelledby="leia-tambem">
  <h2 class="section-title__h" id="leia-tambem">${c.leiaTambem}</h2>
  <div class="post-related__grid">${relacionados.map((r, i) => BlogPostCard(r, { variant: 'compact', headingLevel: 3, color: i === 0 ? 'rosa' : 'azul' }))}</div>
</section>` : ''}`;

    return {
      path: `/blog/${p.slug}/`,
      lastmod: p.dataIso,
      html: Shell(ctx, {
        current: 'blog',
        meta: {
          title: `${p.titulo} · Thiago Raphael`,
          description: p.resumo,
          path: `/blog/${p.slug}/`,
          og: `/og/blog/${p.slug}.png`,
          type: 'article',
          article: { published: p.dataIso, section: p.categoria, tags: p.tags },
          jsonLd: [
            {
              '@type': 'BlogPosting',
              headline: p.titulo,
              description: p.resumo,
              datePublished: p.dataIso,
              dateModified: p.dataIso,
              inLanguage: 'pt-BR',
              articleSection: p.categoria,
              keywords: p.tags.join(', '),
              author: { '@type': 'Person', '@id': `${site.url}/#thiago`, name: site.autor.nome, url: `${site.url}/sobre/` },
              publisher: { '@id': `${site.url}/#thiago` },
              mainEntityOfPage: url,
              image: new URL(`/og/blog/${p.slug}.png`, site.url).href,
            },
            breadcrumb(site, [['Blog', '/blog/'], [p.titulo, `/blog/${p.slug}/`]]),
          ],
        },
        main,
      }),
    };
  });
}
