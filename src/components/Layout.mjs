// Documento HTML com as meta tags de cada página (SEO + Open Graph + ícones).
import { html, raw, plain } from '../lib/html.mjs';

/**
 * @param {object} ctx  contexto do build (site, assets)
 * @param {{ title:string, description:string, path:string, og?:string, ogAlt?:string, type?:string,
 *           noindex?:boolean, jsonLd?:object|object[], bodyClass?:string, preloadImage?:string,
 *           article?:{ published:string, section?:string, tags?:string[] } }} meta
 * @param {*} body
 */
export function Document(ctx, meta, body) {
  const { site, assets } = ctx;
  const url = new URL(meta.path, site.url).href;
  const og = new URL(meta.og || '/og/default.png', site.url).href;
  const title = plain(meta.title);
  const description = plain(meta.description);
  // Vários blocos de dados estruturados viram um @graph só.
  const ld = Array.isArray(meta.jsonLd) ? { '@context': 'https://schema.org', '@graph': meta.jsonLd } : meta.jsonLd;
  const an = ctx.analytics;
  return html`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
<meta name="author" content="${site.nome}">
<meta name="theme-color" content="#1A1A1A">
<link rel="icon" href="/assets/icons/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/icons/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/assets/icons/favicon-16.png" sizes="16x16" type="image/png">
<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<link rel="manifest" href="/assets/icons/site.webmanifest">
<meta property="og:type" content="${meta.type || 'website'}">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${site.nome}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${meta.ogAlt || title}">
${meta.article ? html`<meta property="article:published_time" content="${meta.article.published}">
<meta property="article:author" content="${site.url}/sobre/">${meta.article.section ? html`
<meta property="article:section" content="${meta.article.section}">` : ''}${(meta.article.tags || []).map((t) => html`
<meta property="article:tag" content="${t}">`)}` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${og}">
<link rel="alternate" type="application/rss+xml" title="Blog · ${site.nome}" href="${new URL('/blog/feed.xml', site.url).href}">
<link rel="preload" href="/assets/fonts/kanit-latin-900-italic.woff2" as="font" type="font/woff2" crossorigin>
${meta.preloadImage ? raw(meta.preloadImage) : ''}
<link rel="stylesheet" href="${assets.css}">
<link rel="preconnect" href="https://use.typekit.net" crossorigin>
<link rel="preconnect" href="https://p.typekit.net" crossorigin>
<link rel="stylesheet" href="https://use.typekit.net/qdp6how.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://use.typekit.net/qdp6how.css"></noscript>
${ld ? raw(`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`) : ''}
<script>document.documentElement.classList.add('js')</script>
<script src="${assets.js}" defer></script>
${an ? html`<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };</script>
<script defer src="${an.webAnalytics}"></script>
<script defer src="${an.speedInsights}"></script>` : ''}
</head>
<body${meta.bodyClass ? raw(` class="${meta.bodyClass}"`) : ''}>
<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
${body}
</body>
</html>
`;
}
