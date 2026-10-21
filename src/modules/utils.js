import '../acoes/modules-utils.js'   // handlers (antes: eventos inline; ver ferramentas/verifica-handlers.mjs)
/**
 * src/modules/utils.js
 * Responsabilidade: constantes de domínio e funções puras de UI.
 * Sem dependências externas — pode ser importado por qualquer módulo.
 */

// ── Constantes de domínio ────────────────────────────────────
export const NOMES = { hatha: 'Hatha Yoga', acro: 'Acro Yoga', raja: 'Raja Yoga' }
export const CORES = { hatha: '#2d7a2d',    acro: '#E8BC4F',   raja: '#5a2d8a'   }

export const HORARIOS = [
  '06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00',
  '14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00',
]

export const DIAS_LABEL = {
  seg: 'Segunda', ter: 'Terça',  qua: 'Quarta',
  qui: 'Quinta',  sex: 'Sexta',  sab: 'Sábado', dom: 'Domingo',
}

// ── Gamificação ──────────────────────────────────────────────
export const NIVEL_LABELS = ['', '🌱 Semente', '🌿 Broto', '🌸 Flor', '🌳 Árvore', '🌲 Floresta']
export const NIVEL_PONTOS = [0, 0, 50, 150, 350, 700]

export function calcularNivel(pontos) {
  for (let i = NIVEL_PONTOS.length - 1; i >= 1; i--) {
    if (pontos >= NIVEL_PONTOS[i]) return i
  }
  return 1
}

// ── Planos ───────────────────────────────────────────────────
export const PLANO_NOMES = {
  brahma: 'Brahma', shiva_1x: 'Shiva 1x', shiva_2x: 'Shiva 2x',
  vishnu_2x: 'Vishnu 2x', vishnu_livre: 'Vishnu Livre',
}
export const PLANO_VALORES = { brahma: 100, shiva_1x: 150, shiva_2x: 200, vishnu_2x: 250, vishnu_livre: 300 }
export const PLANO_OPCOES  = { brahma: 1,   shiva_1x: 1,   shiva_2x: 2,   vishnu_2x: 2,   vishnu_livre: 99  }

export const PLANO_BADGES = {
  brahma:       `<span style="background:var(--neutro-bg);color:var(--txt2);padding:2px 8px;border-radius:20px;font-size:12px;font-weight:500;white-space:nowrap">Brahma</span>`,
  shiva_1x:     `<span style="background:var(--ok-bg);color:var(--ok-fg);padding:2px 8px;border-radius:20px;font-size:12px;font-weight:500;white-space:nowrap">Shiva 1x</span>`,
  shiva_2x:     `<span style="background:var(--ok-bg);color:var(--ok-fg);padding:2px 8px;border-radius:20px;font-size:12px;font-weight:500;white-space:nowrap">Shiva 2x</span>`,
  vishnu_2x:    `<span style="background:rgba(232,188,79,.15);color:var(--warn-fg);padding:2px 8px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid rgba(232,188,79,.3);white-space:nowrap">Vishnu 2x</span>`,
  vishnu_livre: `<span style="background:rgba(232,188,79,.25);color:var(--warn-fg);padding:2px 8px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid rgba(232,188,79,.4);white-space:nowrap">Vishnu Livre</span>`,
}

// ── Helpers de HTML ──────────────────────────────────────────

/** Círculo colorido da modalidade */
export function dot(mod) {
  return `<span style="width:8px;height:8px;border-radius:50%;background:${CORES[mod] || '#888'};flex-shrink:0;display:inline-block"></span>`
}

/** Badge pill colorida */
export function badge(txt, bg, color) {
  return `<span style="background:${bg};color:${color};padding:2px 8px;border-radius:20px;font-size:12px;font-weight:500;white-space:nowrap">${esc(txt)}</span>`
}

/** Card com cabeçalho e corpo */
export function card(title, rightHtml, bodyHtml) {
  return `
    <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);overflow-x:auto;margin-bottom:16px">
      <div style="padding:13px 18px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
        <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--titulo)">${title}</span>
        <div>${rightHtml || ''}</div>
      </div>
      ${bodyHtml}
    </div>`
}

/** Modal genérico */
export function modal(id, title, bodyHtml, footHtml) {
  return `
    <div id="${id}" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.45);z-index:100;align-items:center;justify-content:center">
      <div style="background:var(--superficie);border-radius:10px;width:500px;max-width:95vw;max-height:90vh;overflow:auto">
        <div style="padding:18px 22px 14px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
          <span style="font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:500;color:var(--titulo)">${title}</span>
          <button data-h-click="modules-utils.1" data-a-click="${esc(JSON.stringify([String(id)]))}" style="background:none;border:1px solid var(--borda);border-radius:5px;padding:3px 8px;cursor:pointer;font-size:12px"><i class="ti ti-x" aria-hidden="true"></i></button>
        </div>
        <div style="padding:18px 22px">${bodyHtml}</div>
        <div style="padding:12px 22px;border-top:1px solid var(--borda);display:flex;gap:8px;justify-content:flex-end">${footHtml}</div>
      </div>
    </div>`
}

/** Campo de formulário: fi(idIgnorado, label, inputHtml) ou fi(label, inputHtml) */
export function fi(idOrLabel, labelOrInput, inputHtmlOrUndef) {
  const label     = inputHtmlOrUndef !== undefined ? labelOrInput    : idOrLabel
  const inputHtml = inputHtmlOrUndef !== undefined ? inputHtmlOrUndef : labelOrInput
  return `<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
    <label style="font-size:12px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">${label}</label>
    ${inputHtml}
  </div>`
}

export const inputStyle = `style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--txt);width:100%;outline:none"`

/** Formata data ISO para pt-BR */
export function fmtDt(iso, opts) {
  return new Date(iso).toLocaleString('pt-BR', opts || {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Converte minutos em label legível */
export function prazoLabel(min) {
  if (min < 60)   return `${min} minutos`
  if (min === 60) return '1 hora'
  if (min < 1440) return `${min / 60} horas`
  return '24 horas'
}

/** Toast de notificação */
export function toast(msg, dur = 2400) {
  const t = document.createElement('div')
  t.className = 'toast'
  t.setAttribute('role', 'status')
  t.setAttribute('aria-live', 'polite')
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => {
    t.style.opacity = '0'
    setTimeout(() => t.remove(), 300)
  }, dur)
}
// Expõe globalmente para uso em onclick inline
window.toast = toast

// ── Escape de HTML ───────────────────────────────────────────
// Use em QUALQUER dado vindo do usuário (nome, e-mail, telefone, texto livre)
// antes de interpolar em template string que vira innerHTML ou atributo.
export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
window.esc = esc

/**
 * URL segura para src/href: só http(s), caminho relativo ou imagem em data:. Bloqueia javascript:,
 * vbscript: etc. (inclusive disfarçados com espaços/quebras de linha) e neutraliza aspas.
 * Devolve já escapado para HTML; vazio se a URL não for aceitável.
 */
export function urlSegura(u) {
  if (u == null) return ''
  const bruta = String(u).trim()
  if (!bruta) return ''
  const semControle = bruta.replace(/[\u0000-\u0020]/g, '')           // "java\nscript:" vira "javascript:"
  const esquema = (semControle.match(/^([a-z][a-z0-9+.\-]*):/i) || [])[1]
  if (esquema) {
    const e = esquema.toLowerCase()
    const ok = e === 'http' || e === 'https' || (e === 'data' && /^data:image\/(png|jpe?g|gif|webp);/i.test(semControle))
    if (!ok) return ''
  }
  return esc(bruta.replace(/'/g, '%27').replace(/`/g, '%60'))
}
window.urlSegura = urlSegura

/**
 * Imprime uma janela criada com window.open('') + document.write(...), depois que as imagens dela carregarem.
 * Existe porque um <script> escrito DENTRO dessa janela é bloqueado pela CSP (script-src 'self'): ela herda a política
 * de quem a abriu. Aqui o disparo parte do código do app. Chame DEPOIS de win.document.close() (document.open() apaga
 * os ouvintes registrados antes).
 */
export function imprimirQuandoPronto(win) {
  const disparar = () => {
    const pendentes = [...win.document.images].filter(img => !img.complete)
    const imprimir = () => { try { win.focus(); win.print() } catch { /* janela fechada pelo usuário */ } }
    if (!pendentes.length) return imprimir()
    let faltam = pendentes.length
    const concluida = () => { if (--faltam === 0) imprimir() }
    pendentes.forEach(img => {
      img.addEventListener('load', concluida)
      img.addEventListener('error', () => { img.style.display = 'none'; concluida() })
    })
  }
  if (win.document.readyState === 'complete') disparar()
  else win.addEventListener('load', disparar)
}
