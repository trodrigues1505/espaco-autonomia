/**
 * src/modules/tour.js
 * Tour guiado (coach marks) para alunos novos — balão + spotlight apontando elementos.
 */

let _emAndamento = false
let _ultimaPagina = null

// ── Definição dos passos ──────────────────────────────────────
// selector: CSS selector do elemento a destacar
// texto: conteúdo do balão
// page: (opcional) página que precisa estar ativa para o elemento existir
// sidebar: (opcional) true se o alvo está no menu lateral (cuida do menu mobile)
const TOUR_STEPS = [
  { page: 'aluno-home', selector: '#tour-saudacao', texto: 'Este é o seu espaço. Tudo aqui foi pensado para acompanhar sua prática.' },
  { page: 'aluno-home', selector: '#tour-link-nossa-pratica', texto: 'Comece aqui. Antes de explorar o app, entenda o método.' },
  { selector: '#ni-aluno-beneficio-sangha', texto: 'Entre na comunidade da sua turma. Avisos, trocas e suporte.', sidebar: true },
  { selector: '#ni-aluno-beneficio-asana-marga', texto: 'A aula da semana está aqui. Sequência completa para consultar antes e depois de praticar.', sidebar: true },
  { selector: '#ni-aluno-beneficio-yoga-adhyayana', texto: 'O estudo teórico da semana. Aprofunda o que você praticou em aula.', sidebar: true },
  { selector: '#ni-aluno-beneficio-jnana-marga', texto: 'Estudo diário. Uma postura publicada de segunda a sexta.', sidebar: true },
  { selector: '#ni-aluno-beneficio-shruti', texto: 'Um áudio por dia. Mantra, pranayama guiado ou reflexão.', sidebar: true },
  { selector: '#ni-aluno-beneficio-naada-mandir', texto: 'Biblioteca de mantras com pronúncia e significado.', sidebar: true },
  { selector: '#ni-aluno-beneficio-kala-sadhya', texto: 'Precisa remarcar uma aula? Aqui você gerencia sua agenda.', sidebar: true },
  { page: 'aluno-grade', selector: '#tour-grade-table', texto: 'Escolha seu horário e confirme presença com até 24h de antecedência.' },
]

function _chave(perfilId) {
  return `ea_tour_v1_${perfilId}`
}

// ── Entrada pública ────────────────────────────────────────────
export async function iniciarTourSeNecessario(perfil) {
  if (!perfil || perfil.tipo !== 'aluno') return
  if (_emAndamento) return
  if (localStorage.getItem(_chave(perfil.id))) return
  _emAndamento = true
  _ultimaPagina = 'aluno-home'
  try {
    await _rodarTour(perfil, 0)
  } catch (e) {
    console.warn('[tour] erro:', e)
    _finalizarTour(perfil)
  }
}

// Permite reiniciar manualmente (ex: link "rever tutorial" ou teste no console)
export function reiniciarTour(perfil) {
  if (!perfil) return
  localStorage.removeItem(_chave(perfil.id))
  _emAndamento = false
  iniciarTourSeNecessario(perfil)
}
window._reiniciarTourDharmaPhala = () => reiniciarTour(window._perfil)

// ── Motor ────────────────────────────────────────────────────
function _injetarEstilo() {
  if (document.getElementById('_tour-style')) return
  const s = document.createElement('style')
  s.id = '_tour-style'
  s.textContent = `
    @keyframes _tour-in { from { opacity:0; transform:scale(.94) } to { opacity:1; transform:scale(1) } }
    #_tour-spot { transition: top .3s ease, left .3s ease, width .3s ease, height .3s ease }
  `
  document.head.appendChild(s)
}

function _limparDOM() {
  document.getElementById('_tour-spot')?.remove()
  document.getElementById('_tour-bubble')?.remove()
}

async function _aguardarElemento(selector, tentativas = 30) {
  for (let i = 0; i < tentativas; i++) {
    const el = document.querySelector(selector)
    if (el) return el
    await new Promise(r => setTimeout(r, 100))
  }
  return null
}

async function _rodarTour(perfil, idx) {
  if (idx >= TOUR_STEPS.length) { _finalizarTour(perfil); return }
  const step = TOUR_STEPS[idx]
  const isMobile = window.innerWidth <= 768
  const navMenu = document.getElementById('nav-menu')

  // Navega se o passo exigir uma página diferente da atual
  if (step.page && step.page !== _ultimaPagina) {
    _limparDOM()
    window.navigate(step.page)
    _ultimaPagina = step.page
    await new Promise(r => setTimeout(r, 250)) // dá tempo do loader trocar o conteúdo
  }

  // Menu lateral no mobile precisa estar aberto pro elemento ficar visível
  if (step.sidebar && isMobile && navMenu && !navMenu.classList.contains('mobile-open')) {
    navMenu.classList.add('mobile-open')
  }
  if (!step.sidebar && isMobile && navMenu?.classList.contains('mobile-open')) {
    navMenu.classList.remove('mobile-open')
  }

  const el = await _aguardarElemento(step.selector)
  if (!el) { await _rodarTour(perfil, idx + 1); return } // pula passo se elemento não existir

  _injetarEstilo()
  _mostrarPasso(el, step.texto, idx, TOUR_STEPS.length, () => {
    _limparDOM()
    _rodarTour(perfil, idx + 1)
  }, () => _finalizarTour(perfil))
}

function _mostrarPasso(el, texto, idx, total, onProximo, onPular) {
  _limparDOM()
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })

  const rect = el.getBoundingClientRect()
  const pad = 6

  const spot = document.createElement('div')
  spot.id = '_tour-spot'
  spot.style.cssText = `
    position:fixed; pointer-events:none; z-index:601; border-radius:10px;
    box-shadow:0 0 0 9999px rgba(20,25,20,.65);
    top:${rect.top - pad}px; left:${rect.left - pad}px;
    width:${rect.width + pad*2}px; height:${rect.height + pad*2}px;
  `
  document.body.appendChild(spot)

  const bubble = document.createElement('div')
  bubble.id = '_tour-bubble'
  bubble.style.cssText = `
    position:fixed; z-index:602; max-width:min(300px, calc(100vw - 32px));
    background:#fff; border-radius:14px; padding:16px 18px;
    box-shadow:0 14px 34px rgba(0,0,0,.3); font-family:'DM Sans',sans-serif;
    animation:_tour-in .2s ease;
  `
  const isLast = idx === total - 1
  bubble.innerHTML = `
    <div style="font-size:13px;color:var(--txt);line-height:1.6;margin-bottom:14px">${texto}</div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
      <button id="_tour-pular" style="background:none;border:none;font-size:11px;color:var(--txt2);
        cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:underline;padding:0">Pular tutorial</button>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:11px;color:var(--txt2)">${idx + 1}/${total}</span>
        <button id="_tour-prox" style="padding:7px 16px;background:var(--verde);color:var(--bege);
          border:none;border-radius:7px;font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif">
          ${isLast ? 'Concluir' : 'Próximo →'}
        </button>
      </div>
    </div>
  `
  document.body.appendChild(bubble)

  // Posiciona o balão perto do alvo, com fallback pra caber na tela
  const bw = bubble.offsetWidth
  const bh = bubble.offsetHeight
  const vw = window.innerWidth
  const vh = window.innerHeight
  let top, left

  const cabeAbaixo = rect.bottom + 12 + bh < vh
  const cabeAcima  = rect.top - 12 - bh > 0

  if (cabeAbaixo) {
    top = rect.bottom + 14
  } else if (cabeAcima) {
    top = rect.top - bh - 14
  } else {
    top = Math.max(12, (vh - bh) / 2)
  }

  left = rect.left + rect.width / 2 - bw / 2
  left = Math.min(Math.max(left, 12), vw - bw - 12)
  top  = Math.min(Math.max(top, 12), vh - bh - 12)

  bubble.style.top  = `${top}px`
  bubble.style.left = `${left}px`

  document.getElementById('_tour-prox')?.addEventListener('click', onProximo)
  document.getElementById('_tour-pular')?.addEventListener('click', onPular)
}

function _finalizarTour(perfil) {
  _limparDOM()
  document.getElementById('nav-menu')?.classList.remove('mobile-open')
  _emAndamento = false
  if (perfil?.id) localStorage.setItem(_chave(perfil.id), '1')
  if (_ultimaPagina !== 'aluno-home') window.navigate('aluno-home')
}   
