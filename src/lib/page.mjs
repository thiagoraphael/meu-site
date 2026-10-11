// Peças comuns às páginas: casca (header + main + footer) e resolução de links do conteúdo.
import { html } from './html.mjs';
import { Document } from '../components/Layout.mjs';
import { Header } from '../components/Header.mjs';
import { Footer } from '../components/Footer.mjs';

// Links no conteúdo podem apontar para atalhos do site.json: "@orcamento", "@podcast", "@vlog".
export function resolveLink(site, href) {
  if (typeof href !== 'string' || !href.startsWith('@')) return href;
  const ref = site[href.slice(1)];
  if (!ref) throw new Error(`Atalho de link desconhecido: ${href}`);
  return ref.href ?? null;
}

export function Shell(ctx, { current, meta, main, headerTone }) {
  return Document(ctx, meta, html`${Header(ctx.site, current, { tone: headerTone })}
<main id="conteudo" tabindex="-1">
${main}
</main>
${Footer(ctx.site)}`);
}

// Trilha (BreadcrumbList) para dados estruturados. itens: [[nome, caminho], ...], sem o Início.
export function breadcrumb(site, itens) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [['Início', '/'], ...itens].map(([name, path], i) => ({
      '@type': 'ListItem', position: i + 1, name, item: new URL(path, site.url).href,
    })),
  };
}
