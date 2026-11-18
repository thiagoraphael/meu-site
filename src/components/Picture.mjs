// <picture> com AVIF + WebP responsivos (gerados por tools/images.mjs).
// Sem imagem: bloco roxo com o Th lima e "Imagem em breve" (estado "sem imagem" do DS).
import { readFileSync } from 'node:fs';
import { html, attrs } from '../lib/html.mjs';

const manifest = JSON.parse(readFileSync(new URL('../../content/_images.json', import.meta.url), 'utf8'));
export const hasImage = (name) => Boolean(name && manifest[name]);

const srcset = (file, widths, ext, q) => widths.map((w) => `/assets/img/${file}-${w}.${ext}${q} ${w}w`).join(', ');

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
  const file = name;
  const q = manifest[name].v ? `?v=${manifest[name].v}` : '';
  // ratio "auto": o quadro segue a proporção da própria imagem, sem cortar.
  const style2 = ratio === 'auto' ? `aspect-ratio:${width}/${height}` : style;
  const largest = widths[widths.length - 1];
  return html`<div class="media ${className}" style="${style2}"><span class="media__skeleton" aria-hidden="true"><span class="media__loading">carregando…</span><span class="skeleton__bar-track"><span class="skeleton__bar"></span></span></span><picture><source type="image/avif" srcset="${srcset(file, widths, 'avif', q)}" sizes="${sizes}"><source type="image/webp" srcset="${srcset(file, widths, 'webp', q)}" sizes="${sizes}"><img${attrs({
    src: `/assets/img/${file}-${widths.includes(800) ? 800 : largest}.webp${q}`,
    alt,
    width,
    height,
    loading: eager ? 'eager' : 'lazy',
    fetchpriority: eager ? 'high' : false,
    decoding: eager ? 'sync' : 'async',
  })}></picture></div>`;
}

/** URL de uma largura da imagem (para JSON-LD e metas). */
export const imageUrl = (name, w = 800, ext = 'webp') => {
  const m = manifest[name];
  if (!m) return '';
  const width = m.widths.includes(w) ? w : m.widths[m.widths.length - 1];
  return `/assets/img/${name}-${width}.${ext}${m.v ? `?v=${m.v}` : ''}`;
};
