// Mini sistema de templates: tudo que entra por interpolação é escapado,
// a não ser que venha de outro html`` (ou de raw()).
const RAW = Symbol('raw');

export const raw = (value) => ({ [RAW]: true, value: String(value ?? '') });

export const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function render(value) {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  if (typeof value === 'object' && value[RAW]) return value.value;
  return esc(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => { out += render(v) + strings[i + 1]; });
  return raw(out);
}

export const toString = (node) => render(node);

// Atributos opcionais: attrs({ href: '/x', 'aria-current': on && 'page' })
export function attrs(map) {
  return raw(
    Object.entries(map)
      .filter(([, v]) => v !== false && v !== null && v !== undefined)
      .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
      .join('')
  );
}

// Texto de conteúdo com destaque em Velzyland: "Tem um site pra [[construir?]]".
// Só um destaque por bloco (regra da marca); o build avisa se aparecer mais de um.
export function rich(text, { accent = 'rosa' } = {}) {
  const parts = String(text ?? '').split(/\[\[(.+?)\]\]/);
  if (parts.length > 3) console.warn(`[rich] mais de um destaque em: "${text}"`);
  return raw(parts.map((p, i) => (i % 2 ? `<span class="accent accent--${accent}">${esc(p)}</span>` : esc(p))).join(''));
}

// Remove a marcação de destaque (para meta tags, alt etc.).
export const plain = (text) => String(text ?? '').replace(/\[\[(.+?)\]\]/g, '$1');
