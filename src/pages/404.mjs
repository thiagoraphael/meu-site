// 404 (404.dc.html): três retângulos nas bordas, "404" gigante e "deu ruim no deploy?".
import { html } from '../lib/html.mjs';
import { Document } from '../components/Layout.mjs';
import { Header } from '../components/Header.mjs';
import { Retangulos } from '../components/RotatedRect.mjs';
import { Button } from '../components/Button.mjs';

export default function notFound(ctx) {
  const { site, paginas, scenes } = ctx;
  const c = paginas['404'];

  const body = html`<div class="nf">
  ${Retangulos(scenes, '404')}
  ${Header(site, null)}
  <main id="conteudo" class="container stack nf__content layer" tabindex="-1">
    <h1 class="display nf__number">${c.numero}<span class="visually-hidden"> · ${c.h1Oculto}</span></h1>
    <p class="accent accent--rosa nf__phrase">${c.frase}</p>
    <p class="t-body-l nf__text">${c.texto}</p>
    <div class="btn-row nf__actions">
      ${Button({ variant: 'primary', href: '/', label: c.voltar })}
      ${Button({ variant: 'text', href: '/projetos/', label: c.projetos })}
    </div>
  </main>
</div>`;

  // Vercel serve /404.html para qualquer rota inexistente; os links são absolutos para funcionar em qualquer nível.
  return [{
    path: '/404.html',
    noindex: true,
    html: Document(ctx, { title: c.titulo, description: c.descricao, path: '/404.html', og: '/og/default.png', noindex: true }, body),
  }];
}
