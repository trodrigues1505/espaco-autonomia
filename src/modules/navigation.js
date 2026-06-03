/**
 * src/modules/navigation.js
 * Responsabilidade: definição dos menus por perfil, construção
 * do sidebar e controle da rota ativa.
 * Depende de: window._perfil, renderPage() (pages/index.js)
 */

// ── Definição dos menus por perfil ───────────────────────────
const MENUS = {
  admin: [
    { sec: 'Visão Geral' },
    { id: 'dashboard',   label: 'Dashboard',      icon: 'ti-layout-dashboard' },
    { id: 'grade',       label: 'Grade de Aulas', icon: 'ti-calendar'         },
    { sec: 'Gestão' },
    { id: 'criar-aulas', label: 'Criar Aulas',    icon: 'ti-plus-circle'      },
    { id: 'alunos',      label: 'Alunos',         icon: 'ti-users'            },
    { id: 'professores', label: 'Professores',    icon: 'ti-user-star'        },
    { id: 'presencas',   label: 'Presenças',      icon: 'ti-checkbox'         },
    { id: 'pagamentos',  label: 'Pagamentos',     icon: 'ti-currency-dollar'  },
    { id: 'planos',      label: 'Planos',         icon: 'ti-award'            },
    { sec: 'Sistema' },
    { id: 'config',      label: 'Configurações',  icon: 'ti-settings'         },
  ],
  professor: [
    { sec: 'Minhas Aulas' },
    { id: 'prof-home',    label: 'Dashboard',    icon: 'ti-layout-dashboard' },
    { id: 'prof-aulas',   label: 'Minhas Aulas', icon: 'ti-calendar'         },
    { id: 'prof-chamada', label: 'Chamada',      icon: 'ti-checkbox'         },
  ],
  aluno: [
    { sec: 'Meu Espaço' },
    { id: 'aluno-home',   label: 'Início',         icon: 'ti-home'     },
    { id: 'aluno-grade',  label: 'Grade de Aulas', icon: 'ti-calendar' },
    { id: 'aluno-minhas', label: 'Minhas Aulas',   icon: 'ti-bookmark' },
    { id: 'aluno-plano',  label: 'Meu Plano',      icon: 'ti-award'    },
  ],
}

const HOME_POR_PERFIL = {
  admin:     'dashboard',
  professor: 'prof-home',
  aluno:     'aluno-home',
}

// ── Constrói sidebar conforme perfil ─────────────────────────
export function buildMenu(tipo) {
  const nav = document.getElementById('nav-menu')
  nav.innerHTML = ''

  for (const item of (MENUS[tipo] || [])) {
    if (item.sec) {
      const d = document.createElement('div')
      d.className = 'nav-sec'
      d.textContent = item.sec
      nav.appendChild(d)
    } else {
      const d = document.createElement('div')
      d.className = 'ni'
      d.id = `ni-${item.id}`
      d.innerHTML = `<i class="ti ${item.icon}"></i>${item.label}`
      d.onclick = () => window.navigate(item.id)
      nav.appendChild(d)
    }
  }

  // Barra de impersonar: visível apenas para admin real
  const bar = document.getElementById('impersonate-bar')
  if (bar) bar.style.display = window._perfil?.tipo === 'admin' ? 'block' : 'none'
}

export function setActiveNav(id) {
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'))
  document.getElementById(`ni-${id}`)?.classList.add('on')
}

export function homePorPerfil(tipo) {
  return HOME_POR_PERFIL[tipo] || 'dashboard'
}

// ── Impersonar (admin simula outro perfil) ───────────────────
export function impersonar(tipo) {
  const perfil = window._perfil
  if (!perfil || perfil.tipo !== 'admin') return

  window._viewAs = tipo
  document.getElementById('sb-role-label').textContent = {
    admin: 'Admin', professor: 'Modo Professor', aluno: 'Modo Aluno',
  }[tipo]

  ;['admin', 'prof', 'aluno'].forEach(t => {
    const btn = document.getElementById(`imp-${t}`)
    if (!btn) return
    const key = t === 'prof' ? 'professor' : t
    btn.style.background  = key === tipo ? 'var(--dourado)' : 'rgba(242,236,206,.15)'
    btn.style.color       = key === tipo ? 'var(--verde)'   : 'rgba(242,236,206,.7)'
    btn.style.fontWeight  = key === tipo ? '500'            : '400'
  })

  buildMenu(tipo)
  window.navigate(HOME_POR_PERFIL[tipo] || 'dashboard')
}
window.impersonar = impersonar

// ── Mobile hamburger ─────────────────────────────────────────
export function initMobileMenu() {
  const sbEl = document.querySelector('.sb')
  if (!sbEl) return

  sbEl.addEventListener('click', e => {
    if (window.innerWidth > 768) return
    const nav = document.getElementById('nav-menu')
    if (!nav) return
    const rect = sbEl.getBoundingClientRect()
    if (e.clientX > rect.right - 50) nav.classList.toggle('mobile-open')
  })

  document.addEventListener('click', e => {
    if (e.target.classList.contains('ni')) {
      document.getElementById('nav-menu')?.classList.remove('mobile-open')
    }
  })
}
