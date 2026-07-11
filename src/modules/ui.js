/**
 * src/modules/ui.js
 * Utilitários de animação e micro-interações para o Espaço Autonomia.
 *
 * USO TÍPICO no final de qualquer renderXxx():
 *
 *   import { uiAnimar } from '../../modules/ui.js'
 *   uiAnimar(container)
 *
 * Essa única chamada ativa TUDO automaticamente:
 *   - fade de entrada da página
 *   - contadores numéricos animados
 *   - barras de progresso animadas
 *   - stagger nos cards (aparecem em sequência)
 *   - feedback universal em botões (ripple + hover + active)
 *   - hover lift em cards
 */

// ─────────────────────────────────────────────────────────────
// 1. FADE DE ENTRADA DA PÁGINA
// ─────────────────────────────────────────────────────────────
export function fadeEntrada(container) {
  const content = container.querySelector('.content')
  if (!content) return
  content.style.opacity = '0'
  content.style.transform = 'translateY(8px)'
  content.style.transition = 'opacity .3s cubic-bezier(.25,.46,.45,.94), transform .3s cubic-bezier(.25,.46,.45,.94)'
  // Força reflow antes de animar
  void content.offsetHeight
  content.style.opacity = '1'
  content.style.transform = 'translateY(0)'
}

// ─────────────────────────────────────────────────────────────
// 2. CONTADORES NUMÉRICOS
// Detecta elementos com data-counter ou .stat-num
// Anima de 0 até o valor exibido
// ─────────────────────────────────────────────────────────────
export function animarContadores(container) {
  // Seleciona elementos marcados com data-counter
  // OU qualquer elemento com fonte grande dentro de .stat-card
  const els = [
    ...container.querySelectorAll('[data-counter]'),
    ...container.querySelectorAll('.stat-num'),
  ]

  // Também detecta automaticamente números grandes isolados
  // (padrão do dashboard: font-size 26px em Cormorant)
  container.querySelectorAll('div').forEach(el => {
    const style = el.getAttribute('style') || ''
    const isLargeNum = style.includes('font-size:26px') || style.includes('font-size:28px') || style.includes('font-size:24px')
    const text = el.textContent.trim()
    const isNum = /^\d+$/.test(text) && Number(text) > 0
    if (isLargeNum && isNum && !els.includes(el)) els.push(el)
  })

  els.forEach(el => {
    const target = parseInt(el.textContent.replace(/\D/g, ''), 10)
    if (!target || target <= 0 || target > 9999) return
    const duration = Math.min(1000, 300 + target * 8)
    const start = performance.now()
    el.textContent = '0'

    function step(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Easing: ease-out-expo
      const eased = 1 - Math.pow(2, -10 * progress)
      el.textContent = Math.round(eased * target)
      if (progress < 1) requestAnimationFrame(step)
      else el.textContent = target
    }
    requestAnimationFrame(step)
  })
}

// ─────────────────────────────────────────────────────────────
// 3. BARRAS DE PROGRESSO ANIMADAS
// Detecta divs com height:6px (padrão das barras inline do app)
// e também elementos .progress-fill
// ─────────────────────────────────────────────────────────────
export function animarBarras(container) {
  // Barras com classe CSS (novo padrão)
  container.querySelectorAll('.progress-fill').forEach(el => {
    const pct = el.style.getPropertyValue('--pct') || el.style.width
    el.style.width = '0'
    void el.offsetHeight
    el.style.transition = 'width .9s cubic-bezier(.25,.46,.45,.94)'
    requestAnimationFrame(() => { el.style.width = pct })
  })

  // Barras inline (padrão atual do dashboard/planos)
  // Detecta pelo padrão: div com height:6px dentro de um container de barra
  container.querySelectorAll('div').forEach(el => {
    const style = el.getAttribute('style') || ''
    if (!style.includes('height:6px') && !style.includes('height: 6px')) return
    // Só anima se tiver uma largura definida em %
    const match = style.match(/width\s*:\s*(\d+(?:\.\d+)?)%/)
    if (!match) return
    const pct = match[1] + '%'
    el.style.width = '0'
    void el.offsetHeight
    el.style.transition = 'width .9s cubic-bezier(.25,.46,.45,.94)'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { el.style.width = pct })
    })
  })
}

// ─────────────────────────────────────────────────────────────
// 4. STAGGER NOS CARDS
// Cards aparecem em sequência com delay crescente
// Detecta .ea-card, .stat-card, ou cards inline pelo padrão visual
// ─────────────────────────────────────────────────────────────
export function staggerCards(container) {
  // Cards com classes utilitárias
  const porClasse = [...container.querySelectorAll('.ea-card, .stat-card')]

  // Cards inline: detecta pelo padrão background:#fff + border + border-radius
  // dentro de grids (filhos diretos de elementos com display:grid)
  const porGrid = []
  container.querySelectorAll('div').forEach(el => {
    const style = el.getAttribute('style') || ''
    const isCard = style.includes('background:#fff') &&
                   (style.includes('border:1px solid') || style.includes('border: 1px solid')) &&
                   (style.includes('border-radius:var(--r)') || style.includes('border-radius:10px'))
    if (isCard && !porClasse.includes(el)) porGrid.push(el)
  })

  const todos = [...porClasse, ...porGrid]
  if (todos.length === 0) return

  todos.forEach((el, i) => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(10px)'
    el.style.transition = `opacity .3s ease, transform .3s ease`

    setTimeout(() => {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, 60 + i * 55)  // 55ms de delay entre cada card
  })
}

// ─────────────────────────────────────────────────────────────
// 5. BOTÕES — feedback universal (ripple + hover + active)
//
// Usa delegação de evento no document: cobre QUALQUER botão da
// aplicação, inclusive os inseridos DEPOIS do render inicial
// (conteúdo de modal, listas recarregadas via filtro, etc.), sem
// precisar rechamar nada — antes, o ripple só era aplicado aos
// botões que já existiam no DOM no momento exato de uiAnimar(),
// então qualquer botão criado depois (ex: corpo do modal de editar
// aluno, linhas da lista após o debounce da busca) nunca recebia
// nenhum feedback visual.
//
// A cor do ripple também passou a se adaptar ao fundo do botão:
// antes era um branco fixo (rgba(255,255,255,.18)), invisível em
// cima de botões claros/transparentes — que são a maioria no app
// ("Cancelar", "✎", "✕", filtros). Agora: fundo escuro → ripple
// claro, fundo claro → ripple escuro.
//
// Além do ripple (feedback de clique), foi injetado um CSS global
// de hover/active que cobre TODO <button> da aplicação automatica-
// mente, incluindo os futuros, sem depender de JS por elemento.
// ─────────────────────────────────────────────────────────────
function _corEscura(bgColor) {
  const m = (bgColor || '').match(/\d+/g)
  if (!m || m.length < 3) return false
  const [r, g, b] = m.map(Number)
  return (0.299 * r + 0.587 * g + 0.114 * b) < 150
}

export function initBotoesGlobal() {
  if (document.body.dataset.botoesGlobalInit) return
  document.body.dataset.botoesGlobalInit = '1'

  if (!document.getElementById('_botoes-style')) {
    const s = document.createElement('style')
    s.id = '_botoes-style'
    s.textContent = `
      @keyframes _ripple { to { transform:scale(1); opacity:0; } }
      button { transition: filter .15s ease, transform .08s ease, box-shadow .15s ease; }
      button:hover:not(:disabled) { filter: brightness(0.95); }
      button:active:not(:disabled) { transform: scale(0.96); }
      button:disabled { cursor: default; }
    `
    document.head.appendChild(s)
  }

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('button')
    if (!btn || btn.disabled) return

    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 1.5
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top  - size / 2

    const bg = getComputedStyle(btn).backgroundColor
    const overlay = _corEscura(bg) ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.10)'

    if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative'
    btn.style.overflow = 'hidden'

    const ripple = document.createElement('span')
    ripple.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${x}px; top:${y}px;
      border-radius:50%;
      background:${overlay};
      transform:scale(0);
      pointer-events:none;
      animation:_ripple .5s ease-out forwards;
    `
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  })
}

// Mantido por compatibilidade com o nome antigo — agora só garante
// que o listener global de botões esteja ativo (idempotente).
export function initRipple(container) {
  initBotoesGlobal()
}

// ─────────────────────────────────────────────────────────────
// 6. HOVER LIFT EM CARDS
// Adiciona elevação ao passar o mouse em cards detectados
// ─────────────────────────────────────────────────────────────
export function initHoverLift(container) {
  container.querySelectorAll('div').forEach(el => {
    const style = el.getAttribute('style') || ''
    const isCard = style.includes('background:#fff') &&
                   (style.includes('border:1px solid') || style.includes('border: 1px solid')) &&
                   (style.includes('border-radius:var(--r)') || style.includes('border-radius:10px'))
    if (!isCard) return
    if (el.dataset.hoverLift) return
    el.dataset.hoverLift = '1'

    // Só aplica se não for um container grande (tabelas, listas longas)
    // Heurística: cards com menos de 200px de altura
    el.addEventListener('mouseenter', () => {
      if (el.offsetHeight > 200) return
      el.style.transition = 'box-shadow .2s ease, transform .2s ease'
      el.style.boxShadow  = '0 4px 18px rgba(31,56,31,.1)'
      el.style.transform  = 'translateY(-2px)'
    })
    el.addEventListener('mouseleave', () => {
      el.style.boxShadow = ''
      el.style.transform = ''
    })
  })
}

// ─────────────────────────────────────────────────────────────
// 7. HIGHLIGHT DE LINHA EM TABELAS
// Linhas de tabela (divs com grid) piscam suavemente no hover
// ─────────────────────────────────────────────────────────────
export function initRowHighlight(container) {
  container.querySelectorAll('div').forEach(el => {
    const style = el.getAttribute('style') || ''
    // Detecta linhas: display:grid com colunas + border-bottom
    const isRow = (style.includes('display:grid') || style.includes('display: grid')) &&
                   style.includes('border-bottom')
    if (!isRow || el.dataset.rowHL) return
    el.dataset.rowHL = '1'
    el.style.transition = 'background .15s ease'
    el.addEventListener('mouseenter', () => { el.style.background = 'rgba(31,56,31,.025)' })
    el.addEventListener('mouseleave', () => { el.style.background = '' })
  })
}

// ─────────────────────────────────────────────────────────────
// 8. TOPBAR — título entra com fade
// ─────────────────────────────────────────────────────────────
export function animarTopbar(container) {
  const t = container.querySelector('.topbar-t')
  if (!t) return
  t.style.opacity = '0'
  t.style.transform = 'translateX(-6px)'
  t.style.transition = 'opacity .3s ease, transform .3s ease'
  void t.offsetHeight
  t.style.opacity = '1'
  t.style.transform = 'translateX(0)'
}

// ─────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL — chame esta no final de cada página
// ─────────────────────────────────────────────────────────────
export function uiAnimar(container) {
  // Executa na ordem certa: primeiro estrutura, depois detalhes
  fadeEntrada(container)
  animarTopbar(container)
  initBotoesGlobal()

  // Pequeno delay para o DOM estar pintado antes das animações
  requestAnimationFrame(() => {
    staggerCards(container)
    animarBarras(container)
    initHoverLift(container)
    initRowHighlight(container)

    // Contadores com delay extra para aparecerem após os cards
    setTimeout(() => animarContadores(container), 150)
  })
}
