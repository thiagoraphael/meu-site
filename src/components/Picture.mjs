// <picture> com AVIF + WebP responsivos (gerados por tools/images.mjs).
// Sem imagem: bloco roxo com o Th lima e "Imagem em breve" (estado "sem imagem" do DS).
import { readFileSync } from 'node:fs';
import { html, attrs } from '../lib/html.mjs';

const manifest = JSON.parse(readFileSync(new URL('../../content/_images.json', import.meta.url), 'utf8'));
export const hasImage = (name) => Boolean(name && manifest[name]);

const srcset = (name, widths, ext) => widths.map((w) => `/assets/img/${name}-${w}.${ext} ${w}w`).join(', ');

/**
 * @param {{ name?: string|null, alt: string, sizes?: string, eager?: boolean, ratio?: string, fit?: 'cover'|'contain', className?: string }} p
 * ratio: proporção do quadro ("16/10", "4/3"...). O skeleton fica por baixo e some quando a imagem carrega.
 */
export function Picture({ name, alt, sizes = '100vw', eager = false, ratio, className = '' }) {
  const style = ratio && ratio !== 'auto' ? `aspect-ratio:${ratio}` : ratio === 'auto' ? 'aspect-ratio:16/10' : '';
  if (!hasImage(name)) {
    return html`<div class="media media--empty ${className}" style="${style}" role="img" aria-label="${alt} (imagem em breve)"><img class="media__mark" src="/assets/logos/th-lima.svg" alt="" width="48" height="47" loading="lazy" decoding="async"><span class="media__note">Imagem em breve</span></div>`;
  }
  const { width, height, widths } = manifest[name];
  // ratio "auto": o quadro segue a proporção da própria imagem, sem cortar.
  const style2 = ratio === 'auto' ? `aspect-ratio:${width}/${height}` : style;
  const largest = widths[widths.length - 1];
  return html`<div class="media ${className}" style="${style2}"><span class="media__skeleton" aria-hidden="true"><span class="media__loading">carregando…</span><span class="skeleton__bar-track"><span class="skeleton__bar"></span></span></span><picture><source type="image/avif" srcset="${srcset(name, widths, 'avif')}" sizes="${sizes}"><source type="image/webp" srcset="${srcset(name, widths, 'webp')}" sizes="${sizes}"><img${attrs({
    src: `/assets/img/${name}-${widths.includes(800) ? 800 : largest}.webp`,
    alt,
    width,
    height,
    loading: eager ? 'eager' : 'lazy',
    fetchpriority: eager ? 'high' : false,
    decoding: eager ? 'sync' : 'async',
  })}></picture></div>`;
}
