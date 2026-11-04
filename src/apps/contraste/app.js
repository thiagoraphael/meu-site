// ---------- Contraste: WCAG 2.x, sugestões e simulação de daltonismo ----------
const form = $('[data-app="contraste"]');
if (form) {
  const sample = $('[data-sample]');
  const probe = document.createElement('canvas').getContext('2d');
  // Qualquer cor CSS → hex (o canvas normaliza). Devolve null se não for cor.
  function parse(v) {
    const s = String(v).trim();
    if (/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(s)) return parse(`#${s}`);
    probe.fillStyle = '#010203';
    probe.fillStyle = s;
    const out = probe.fillStyle;
    if (out === '#010203' && !/^#?010203$/i.test(s)) return null;
    if (out.startsWith('#')) return out.toUpperCase();
    const m = out.match(/[\d.]+/g);
    return m ? rgbToHex(+m[0], +m[1], +m[2]) : null;
  }
  const get = (n) => parse(form.elements[n].value) || form.elements[`${n}_pick`].value.toUpperCase();

  // HSL ↔ RGB pra mexer só na luminosidade.
  function toHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h, s, l];
  }
  function fromHsl([h, s, l]) {
    if (!s) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => { t = (t + 1) % 1; return 255 * (t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p); };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
  }
  // Tom mais próximo (mesmo matiz e saturação) que atinge `target` contra `other`.
  function nearest(hex, other, target) {
    const [h, s, l0] = toHsl(hexToRgb(hex));
    let best = null;
    for (const dir of [1, -1]) {
      let lo = 0, hi = dir > 0 ? 1 - l0 : l0, found = null;
      if (contrast(rgbToHex(...fromHsl([h, s, dir > 0 ? 1 : 0])), other) < target) continue;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        const c = rgbToHex(...fromHsl([h, s, l0 + dir * mid]));
        if (contrast(c, other) >= target) { found = { hex: c, d: mid }; hi = mid; } else lo = mid;
      }
      if (found && (!best || found.d < best.d)) best = found;
    }
    return best;
  }

  // Simulação (Machado et al., 2009) em RGB linear, pra calcular o contraste simulado.
  const SIM = {
    protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
    deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
    tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
  };
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const unlin = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  function simulate(hex, kind) {
    const [r, g, b] = hexToRgb(hex).map(lin);
    if (kind === 'cinza') { const y = 0.2126 * r + 0.7152 * g + 0.0722 * b; const v = Math.round(unlin(y)); return rgbToHex(v, v, v); }
    const m = SIM[kind];
    if (!m) return hex;
    return rgbToHex(...[m[0] * r + m[1] * g + m[2] * b, m[3] * r + m[4] * g + m[5] * b, m[6] * r + m[7] * g + m[8] * b].map((v) => Math.max(0, Math.min(255, unlin(Math.max(0, Math.min(1, v)))))));
  }

  const fmt = (r) => r.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const GRADES = [
    { nome: 'Texto normal', alvo: 4.5, nivel: 'AA' }, { nome: 'Texto normal', alvo: 7, nivel: 'AAA' },
    { nome: 'Texto grande', alvo: 3, nivel: 'AA', nota: '24 px, ou 18,7 px em negrito' }, { nome: 'Texto grande', alvo: 4.5, nivel: 'AAA' },
    { nome: 'Ícones e bordas', alvo: 3, nivel: 'AA', nota: 'Componentes de interface' },
  ];

  // Só troca o HTML quando mudou: assim um clique não perde o botão (o blur do campo redesenha).
  const setHTML = (el, h) => { if (el._h !== h) { el.innerHTML = h; el._h = h; } };
  let hist = store.get('ct:hist', []);
  let saveT;
  function render() {
    const t = get('texto'), f = get('fundo');
    ['texto', 'fundo'].forEach((n) => form.elements[n].setAttribute('aria-invalid', String(!parse(form.elements[n].value))));
    const r = contrast(t, f);
    $('[data-ratio]').textContent = fmt(r);
    $('[data-verdict]').textContent = r >= 7 ? 'Passa em tudo, até no AAA.' : r >= 4.5 ? 'Passa pra texto normal (AA).' : r >= 3 ? 'Só serve pra texto grande e ícones.' : 'Não passa. Difícil de ler pra muita gente.';
    setHTML($('[data-grades]'), GRADES.map((g) => `<li class="${r >= g.alvo ? 'ok' : 'no'}"><b>${g.nome} · ${g.nivel}</b><span>${r >= g.alvo ? 'Passa' : 'Falha'} (${g.alvo.toLocaleString('pt-BR')}:1)</span>${g.nota ? `<small class="field__hint">${g.nota}</small>` : ''}</li>`).join(''));

    const alvo = radioValue('ajustar', form);
    const base = alvo === 'texto' ? t : f, other = alvo === 'texto' ? f : t;
    setHTML($('[data-sugs]'), [[4.5, 'AA'], [7, 'AAA']].map(([target, nivel]) => {
      if (r >= target) return `<li><i style="background:${alvo === 'texto' ? f : t};color:${alvo === 'texto' ? t : f}">Aa</i><div><b>${nivel}: já passa</b><small>${fmt(r)}:1</small></div><span></span></li>`;
      const n = nearest(base, other, target);
      if (!n) return `<li><i>×</i><div><b>${nivel}: sem saída nesse tom</b><small>Ajuste a outra cor ou mude o matiz.</small></div><span></span></li>`;
      const tt = alvo === 'texto' ? n.hex : t, ff = alvo === 'texto' ? f : n.hex;
      return `<li><i style="background:${ff};color:${tt}">Aa</i><div><b>${nivel}: ${n.hex}</b><small>${fmt(contrast(tt, ff))}:1 · ${alvo === 'texto' ? 'texto' : 'fundo'} ${toHsl(hexToRgb(n.hex))[2] > toHsl(hexToRgb(base))[2] ? 'mais claro' : 'mais escuro'}</small></div><button class="mini-btn" type="button" data-apply="${alvo}:${n.hex}">Usar</button></li>`;
    }).join(''));

    const vis = radioValue('visao', form);
    sample.style.background = f;
    sample.style.color = t;
    sample.style.filter = vis === 'normal' ? '' : `url(#ct-${vis})`;
    const note = $('[data-sim-note]');
    if (vis === 'normal') note.textContent = 'Escolha uma simulação pra ver como fica pra quem enxerga cor de outro jeito.';
    else { const rs = contrast(simulate(t, vis), simulate(f, vis)); note.textContent = `Contraste simulado: ${fmt(rs)}:1. O WCAG mede luminosidade, então ele muda pouco; o que muda é se as cores ainda se distinguem.`; }

    form.elements.texto_pick.value = t; form.elements.fundo_pick.value = f;
    store.set('ct:last', { t, f });
    clearTimeout(saveT);
    saveT = setTimeout(() => { hist = [{ t, f }, ...hist.filter((h) => h.t !== t || h.f !== f)].slice(0, 6); store.set('ct:hist', hist); renderHist(); }, 1200);
  }
  function renderHist() {
    setHTML($('[data-hist]'), hist.length ? hist.map((h, i) => `<li><i style="background:${h.f};color:${h.t}">Aa</i><div><b>${h.t} em ${h.f}</b><small>${fmt(contrast(h.t, h.f))}:1</small></div><button class="mini-btn" type="button" data-restore="${i}">Abrir</button></li>`).join('') : '<li><i>·</i><div><small>As últimas combinações aparecem aqui.</small></div><span></span></li>');
  }

  form.addEventListener('input', (e) => {
    const n = e.target.name;
    if (n && n.endsWith('_pick')) form.elements[n.replace('_pick', '')].value = e.target.value.toUpperCase();
    render();
  });
  form.addEventListener('change', render);
  form.addEventListener('focusout', (e) => { const n = e.target.name; if (n === 'texto' || n === 'fundo') { const p = parse(e.target.value); if (p) e.target.value = p; } });
  $('[data-swap]').addEventListener('click', () => { const a = form.elements.texto.value; form.elements.texto.value = form.elements.fundo.value; form.elements.fundo.value = a; render(); });
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-apply], [data-restore]');
    if (!b) return;
    if (b.dataset.apply) { const [n, hex] = b.dataset.apply.split(':'); form.elements[n].value = hex; }
    else { const h = hist[Number(b.dataset.restore)]; form.elements.texto.value = h.t; form.elements.fundo.value = h.f; }
    render();
  });

  const last = store.get('ct:last', null);
  if (last) { form.elements.texto.value = last.t; form.elements.fundo.value = last.f; }
  renderHist();
  render();
}
