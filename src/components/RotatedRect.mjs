// Retângulos decorativos da marca.
// RotatedRect: uma forma. Retangulos: a cena inteira (fica atrás do conteúdo, aria-hidden).
import { html } from '../lib/html.mjs';

const ROTACOES = { '-11.8': 1, '17.8': 2, '-23.5': 3, '56.7': 4, '68.2': 5 };
const CORES = { lima: '--tr-lima', roxo: '--tr-roxo', rosa: '--tr-rosa', azul: '--tr-azul' };

function check(rect, where) {
  if (!ROTACOES[String(rect.r)]) throw new Error(`[${where}] rotação fora da marca: ${rect.r}`);
  if (!CORES[rect.cor]) throw new Error(`[${where}] cor fora da marca: ${rect.cor}`);
}

// w/h: número = px, texto = qualquer unidade ("45vw"). Posição por canto (x/y) ou por centro (cx/cy).
const len = (v) => (typeof v === 'number' ? `${v}px` : v);
const pos = (rect) =>
  rect.cx !== undefined
    ? `--x:calc(${rect.cx} - ${len(rect.w)} / 2);--y:calc(${rect.cy} - ${len(rect.h)} / 2)`
    : `--x:${rect.x};--y:${rect.y}`;
const vars = (rect) =>
  `${pos(rect)};--w:${len(rect.w)};--h:${len(rect.h)};--r:var(--rect-rot-${ROTACOES[String(rect.r)]});--c:var(${CORES[rect.cor]})`;

export function RotatedRect(rect, where = 'rect') {
  check(rect, where);
  return html`<span class="rr" style="${vars(rect)}"></span>`;
}

/**
 * @param {object} scenes content/retangulos.json
 * @param {string} name   nome da cena (hero, projetos, blog...)
 * @param {{ state?: 'inicial'|'meio'|'fim', animated?: boolean, className?: string }} opts
 */
export function Retangulos(scenes, name, { state = 'inicial', animated = false, className = '' } = {}) {
  const scene = scenes[name];
  if (!scene) throw new Error(`Cena de retângulos desconhecida: ${name}`);
  if (scene.estados) {
    const count = scene.estados.inicial.desktop.length;
    return html`<div class="shapes shapes--${name} ${className}" data-state="${state}"${animated ? html` data-shapes-scroll` : ''} aria-hidden="true">${Array.from({ length: count }, () => html`<span class="rr"></span>`)}</div>`;
  }
  if (scene.length > 6) throw new Error(`[${name}] mais de 6 retângulos na cena`);
  return html`<div class="shapes shapes--static ${className}" aria-hidden="true">${scene.map((r) => RotatedRect(r, name))}</div>`;
}

// CSS das cenas com estados (gerado no build a partir do JSON).
export function retangulosCss(scenes) {
  let css = '/* Gerado pelo build a partir de content/retangulos.json */\n';
  for (const [name, scene] of Object.entries(scenes)) {
    if (name.startsWith('_') || !scene.estados) continue;
    const block = (bp) =>
      Object.entries(scene.estados)
        .map(([estado, sets]) =>
          sets[bp]
            .map((rect, i) => {
              check(rect, `${name}/${estado}/${bp}`);
              const sel = estado === 'inicial' ? `.shapes--${name} .rr:nth-child(${i + 1})` : `.shapes--${name}[data-state="${estado}"] .rr:nth-child(${i + 1})`;
              return `${sel}{${vars(rect)}}`;
            })
            .join('\n')
        )
        .join('\n');
    css += `${block('desktop')}\n@media (max-width: 767px){\n${block('mobile')}\n}\n`;
  }
  return css;
}
