/**
 * src/modules/dialogs.js
 * Diálogos acessíveis do app — substituem window.alert / confirm / prompt.
 *
 *   await confirmarModal({ titulo, texto, confirmar, perigo })        → true | false
 *   await formularioModal({ titulo, campos:[{id,label,tipo,valor,...}] }) → {id: valor} | null
 *   abrirDialogo({ titulo, corpoHTML, rodapeHTML, onFechar, foco })    → { root, fechar }
 *
 * Acessibilidade: role="dialog", aria-modal, rótulo pelo título, foco inicial,
 * foco preso dentro do diálogo, Esc fecha, foco volta ao elemento de origem.
 * Estilos: classes .ui-* em src/styles/main.css (herdam o tema claro/escuro).
 */

import { esc } from './utils.js'

export function abrirDialogo({ titulo, corpoHTML, rodapeHTML = '', onFechar, foco }) {
  const anterior = document.activeElement
  const tid = 'ui-t-' + Math.random().toString(36).slice(2, 8)
  const root = document.createElement('div')
  root.className = 'ui-overlay'
  root.innerHTML = `
    <div class="ui-dialog" role="dialog" aria-modal="true" aria-labelledby="${tid}">
      <div class="ui-dialog__head">
        <h2 class="ui-dialog__title" id="${tid}">${esc(titulo)}</h2>
        <button type="button" class="ui-icon-btn" data-fechar aria-label="Fechar">
          <i class="ti ti-x" aria-hidden="true"></i>
        </button>
      </div>
      <div class="ui-dialog__body">${corpoHTML}</div>
      ${rodapeHTML ? `<div class="ui-dialog__foot">${rodapeHTML}</div>` : ''}
    </div>`
  document.body.appendChild(root)
  const overflowAntes = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  let fechado = false
  const fechar = () => {
    if (fechado) return
    fechado = true
    document.removeEventListener('keydown', onKey, true)
    document.body.style.overflow = overflowAntes
    root.remove()
    anterior?.focus?.()
    onFechar?.()
  }
  const onKey = e => {
    if (e.key === 'Escape') { e.stopPropagation(); fechar(); return }
    if (e.key !== 'Tab') return
    const foc = [...root.querySelectorAll('a[href],button:not([disabled]),input,select,textarea')]
    if (!foc.length) return
    const primeiro = foc[0], ultimo = foc[foc.length - 1]
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
  }
  document.addEventListener('keydown', onKey, true)
  root.addEventListener('mousedown', e => { if (e.target === root) fechar() })
  root.querySelector('[data-fechar]').addEventListener('click', fechar)
  const alvo = (foco && root.querySelector(foco)) || root.querySelector('[data-fechar]')
  alvo.focus()
  return { root, fechar }
}

export function confirmarModal({ titulo, texto, confirmar = 'Confirmar', cancelar = 'Cancelar', perigo = false }) {
  return new Promise(resolve => {
    let decidido = false
    const d = abrirDialogo({
      titulo,
      corpoHTML: `<p class="ui-text">${esc(texto)}</p>`,
      rodapeHTML: `
        <button type="button" class="ui-btn ui-btn--ghost" data-nao>${esc(cancelar)}</button>
        <button type="button" class="ui-btn ${perigo ? 'ui-btn--danger' : 'ui-btn--primary'}" data-sim>${esc(confirmar)}</button>`,
      onFechar: () => { if (!decidido) resolve(false) },
      foco: '[data-nao]',
    })
    d.root.querySelector('[data-nao]').addEventListener('click', () => d.fechar())
    d.root.querySelector('[data-sim]').addEventListener('click', () => { decidido = true; resolve(true); d.fechar() })
  })
}

/**
 * Formulário curto em diálogo. Campos: { id, label, tipo ('text'|'number'|'date'|'time'),
 * valor, min, max, obrigatorio, ajuda }. Resolve com { [id]: string } ou null se cancelado.
 */
export function formularioModal({ titulo, texto = '', campos, confirmar = 'Salvar', cancelar = 'Cancelar' }) {
  return new Promise(resolve => {
    let decidido = false
    const uid = 'ui-f-' + Math.random().toString(36).slice(2, 7)
    const campoHTML = c => `
      <div class="ui-field">
        <label class="ui-label" for="${uid}-${c.id}">${esc(c.label)}</label>
        <input class="ui-input" id="${uid}-${c.id}" data-campo="${esc(c.id)}" type="${esc(c.tipo || 'text')}"
          value="${esc(c.valor ?? '')}"
          ${c.min != null ? `min="${esc(c.min)}"` : ''} ${c.max != null ? `max="${esc(c.max)}"` : ''}
          ${c.obrigatorio ? 'required' : ''} autocomplete="off">
        ${c.ajuda ? `<span class="ui-help">${esc(c.ajuda)}</span>` : ''}
      </div>`
    const d = abrirDialogo({
      titulo,
      corpoHTML: `${texto ? `<p class="ui-text">${esc(texto)}</p>` : ''}
        <div class="ui-form">${campos.map(campoHTML).join('')}</div>
        <div class="ui-error" role="alert" data-erro hidden></div>`,
      rodapeHTML: `
        <button type="button" class="ui-btn ui-btn--ghost" data-nao>${esc(cancelar)}</button>
        <button type="button" class="ui-btn ui-btn--primary" data-sim>${esc(confirmar)}</button>`,
      onFechar: () => { if (!decidido) resolve(null) },
      foco: 'input',
    })
    const erroEl = d.root.querySelector('[data-erro]')
    const enviar = () => {
      for (const inp of d.root.querySelectorAll('[data-campo]')) {
        if (!inp.checkValidity()) {
          const rot = d.root.querySelector(`label[for="${inp.id}"]`)?.textContent || 'Campo'
          erroEl.textContent = `${rot}: ${inp.validationMessage || 'valor inválido'}`
          erroEl.hidden = false
          inp.focus()
          return
        }
      }
      const valores = {}
      d.root.querySelectorAll('[data-campo]').forEach(inp => { valores[inp.dataset.campo] = inp.value.trim() })
      decidido = true
      resolve(valores)
      d.fechar()
    }
    d.root.querySelector('[data-nao]').addEventListener('click', () => d.fechar())
    d.root.querySelector('[data-sim]').addEventListener('click', enviar)
    d.root.querySelectorAll('[data-campo]').forEach(inp =>
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); enviar() } }))
  })
}

/**
 * Diálogo de escolha: opções (rádio) e/ou uma caixa de seleção.
 *   opcoes: [{ valor, rotulo, descricao }]   (a primeira vem marcada; null = sem rádios)
 *   marcar: { rotulo, marcado }               (caixa de seleção opcional)
 * Resolve com { opcao, marcado } ou null se cancelado.
 */
export function escolhaModal({ titulo, texto = '', opcoes = null, marcar = null, confirmar = 'Confirmar', cancelar = 'Cancelar', legenda = 'Aplicar a' }) {
  return new Promise(resolve => {
    let decidido = false
    const nome = 'ui-r-' + Math.random().toString(36).slice(2, 7)
    const radios = opcoes ? `
      <fieldset class="ui-choices">
        <legend class="ui-label">${esc(legenda)}</legend>
        ${opcoes.map((o, i) => `
          <label class="ui-choice">
            <input type="radio" name="${esc(nome)}" value="${esc(o.valor)}" ${i === 0 ? 'checked' : ''}>
            <span class="ui-choice__t">${esc(o.rotulo)}</span>
            ${o.descricao ? `<span class="ui-choice__d">${esc(o.descricao)}</span>` : ''}
          </label>`).join('')}
      </fieldset>` : ''
    const caixa = marcar ? `
      <label class="ui-check">
        <input type="checkbox" data-marcar ${marcar.marcado ? 'checked' : ''}>
        <span>${esc(marcar.rotulo)}</span>
      </label>` : ''
    const d = abrirDialogo({
      titulo,
      corpoHTML: `${texto ? `<p class="ui-text">${esc(texto)}</p>` : ''}${radios}${caixa}`,
      rodapeHTML: `
        <button type="button" class="ui-btn ui-btn--ghost" data-nao>${esc(cancelar)}</button>
        <button type="button" class="ui-btn ui-btn--primary" data-sim>${esc(confirmar)}</button>`,
      onFechar: () => { if (!decidido) resolve(null) },
      foco: 'input[type=radio]:checked',
    })
    d.root.querySelector('[data-nao]').addEventListener('click', () => d.fechar())
    d.root.querySelector('[data-sim]').addEventListener('click', () => {
      decidido = true
      resolve({
        opcao: d.root.querySelector('input[type=radio]:checked')?.value ?? null,
        marcado: !!d.root.querySelector('[data-marcar]')?.checked,
      })
      d.fechar()
    })
  })
}

/**
 * Aviso temporário com ação (ex.: "Desfazer"), anunciado por leitores de tela.
 * Só um por vez. Retorna uma função para fechar manualmente.
 */
export function avisoComAcao({ texto, acao, aoClicar, acao2, aoClicar2, duracao = 8000 }) {
  document.querySelector('.ui-snack')?.remove()
  const el = document.createElement('div')
  el.className = 'ui-snack'
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', 'polite')
  el.innerHTML = `
    <span class="ui-snack__txt">${esc(texto)}</span>
    ${acao ? `<button type="button" class="ui-snack__btn" data-acao>${esc(acao)}</button>` : ''}
    ${acao2 ? `<button type="button" class="ui-snack__btn" data-acao2>${esc(acao2)}</button>` : ''}
    <button type="button" class="ui-snack__x" data-x aria-label="Fechar aviso"><i class="ti ti-x" aria-hidden="true"></i></button>`
  document.body.appendChild(el)
  const fechar = () => { clearTimeout(timer); el.remove() }
  const timer = setTimeout(fechar, duracao)
  el.querySelector('[data-x]').addEventListener('click', fechar)
  el.querySelector('[data-acao]')?.addEventListener('click', () => { fechar(); aoClicar?.() })
  // segunda ação não fecha o aviso; se devolver um texto, ele vira o novo rótulo do botão
  el.querySelector('[data-acao2]')?.addEventListener('click', async e => {
    const btn = e.currentTarget          // currentTarget vira null depois do primeiro await
    const rot = await aoClicar2?.()
    if (typeof rot === 'string' && btn) btn.textContent = rot
  })
  return fechar
}
