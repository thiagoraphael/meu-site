# thiagoraphael.com.br

Portfólio do Thiago Raphael, direção "C Editorial". HTML, CSS e JavaScript puros, gerados por um build em Node sem dependências.

## Rodar

```bash
node build.mjs          # gera dist/
npx serve dist          # ou qualquer servidor estático
```

Na Vercel, o `vercel.json` já define o build (`node build.mjs`), a pasta de saída (`dist`), os redirecionamentos das URLs antigas e o cache dos assets.

## Onde fica cada coisa

| Pasta | O que tem |
| --- | --- |
| `content/site.json` | Nome, e-mail, menu, redes, links de orçamento, currículo, podcast e vlog |
| `content/paginas/*.json` | Textos de cada página (títulos, chamadas, CTAs) |
| `content/projetos/*.json` | Um arquivo por projeto (ordem, ficha, blocos, galeria, TODOs) |
| `content/posts/*.md` | Um Markdown por post, com front matter |
| `content/retangulos.json` | Posição, tamanho, cor e rotação dos retângulos de cada cena |
| `src/styles/tokens.css` | Tokens do Design System, copiados sem alteração do `:root` oficial |
| `src/components/` | Icon, Button, Tag/TagList, SectionTitle, RotatedRect/Retangulos, Marquee, NavPills, Picture, ProjectCard, BlogPostCard, Header, Footer, Layout |
| `src/pages/` | Uma função por página; cada uma devolve as rotas que gera |
| `public/` | Arquivos copiados como estão (fontes, logos, ícones, imagens otimizadas, OG) |
| `tools/` | Ferramentas de desenvolvimento que não rodam no deploy |

Destaque em Velzyland: escreva `[[palavra]]` no texto do JSON. Uma por bloco.

## Adicionar conteúdo

- **Projeto:** crie `content/projetos/<slug>.json` copiando um existente. A ordem vem do campo `ordem`.
- **Post:** crie `content/posts/<slug>.md` com `slug`, `titulo`, `resumo`, `tags`, `data`, `categoria` e, se tiver, `capa` e `capaAlt`.
- **Imagem:** coloque o PNG/JPG em `tools/source/` e rode `cd tools && npm i && npm run images`. Use o nome do arquivo (sem extensão) no campo `thumb`, `capa` ou `img`.
- **Imagens Open Graph:** depois de mudar títulos, rode `cd tools && npm run og`.

O build falha se uma página não tiver exatamente um `<h1>` ou se alguma `<img>` estiver sem `alt`, e atualiza o `TODO.md` com o conteúdo que ainda falta.
