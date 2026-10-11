// Documento HTML com as meta tags de cada página (SEO + Open Graph + ícones).
import { html, raw, plain } from '../lib/html.mjs';

/**
 * @param {object} ctx  contexto do build (site, assets)
 * @param {{ title:string, description:string, path:string, og?:string, ogAlt?:string, type?:string,
 *           noindex?:boolean, jsonLd?:object, bodyClass?:string, preloadImage?:string }} meta
 * @param {*} body
 */
export function Document(ctx, meta, body) {
  const { site, assets } = ctx;
  const url = new URL(meta.path, site.url).href;
  const og = new URL(meta.og || '/og/default.png', site.url).href;
  const title = plain(meta.title);
  const description = plain(meta.description);
  return html`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
${meta.noindex ? html`<meta name="robots" content="noindex, follow">` : ''}
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
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/assets/fonts/kanit-latin-900-italic.woff2" as="font" type="font/woff2" crossorigin>
${meta.preloadImage ? raw(meta.preloadImage) : ''}
<link rel="stylesheet" href="${assets.css}">
<link rel="preconnect" href="https://use.typekit.net" crossorigin>
<link rel="preconnect" href="https://p.typekit.net" crossorigin>
<link rel="stylesheet" href="https://use.typekit.net/qdp6how.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://use.typekit.net/qdp6how.css"></noscript>
${meta.jsonLd ? raw(`<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`) : ''}
<script>document.documentElement.classList.add('js')</script>
<script src="${assets.js}" defer></script>
</head>
<body${meta.bodyClass ? raw(` class="${meta.bodyClass}"`) : ''}>
<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
${body}
</body>
</html>
`;
}
