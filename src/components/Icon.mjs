// Ícones SVG inline (herdam a cor do texto com currentColor).
import { readFileSync, readdirSync } from 'node:fs';
import { html, raw } from '../lib/html.mjs';

const dir = new URL('../icons/', import.meta.url);
const icons = Object.fromEntries(
  readdirSync(dir)
    .filter((f) => f.endsWith('.svg'))
    .map((f) => [f.replace('.svg', ''), readFileSync(new URL(f, dir), 'utf8').trim()])
);

/**
 * @param {string} name github | behance | linkedin | instagram | x | download | arrow-right | close
 * @param {{ size?: number, label?: string }} opts  sem label o ícone é decorativo (aria-hidden)
 */
export function Icon(name, { size = 24, label } = {}) {
  const svg = icons[name];
  if (!svg) throw new Error(`Ícone desconhecido: ${name}`);
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  // Troca só o tamanho da tag <svg> raiz (os elementos internos mantêm width/height próprios).
  const out = svg.replace(/^<svg([^>]*)>/, (_, a) => `<svg class="icon" width="${size}" height="${size}" ${a11y}${a.replace(/\s(width|height)="[^"]*"/g, '')}>`);
  return html`${raw(out)}`;
}
