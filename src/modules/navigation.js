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

  if (tipo === 'admin') {
    // Volta ao modo admin sem modal
    _ativarImpersonar('admin', window._perfil)
    return
  }

  // Para aluno e professor: abre modal de seleção de pessoa
  _abrirModalImpersonar(tipo)
}
window.impersonar = impersonar

async function _abrirModalImpersonar(tipo) {
  const sb = window._sb
  const tipoFiltro = tipo === 'professor' ? ['professor','admin'] : ['aluno']

  const { data: pessoas } = await sb.from('perfis')
    .select('id,nome,email,tipo')
    .in('tipo', tipoFiltro)
    .eq('ativo', true)
    .order('nome')

  // Remove modal anterior se existir
  document.getElementById('modal-impersonar')?.remove()

  const div = document.createElement('div')
  div.id = 'modal-impersonar'
  div.style.cssText = 'position:fixed;inset:0;background:rgba(31,56,31,.7);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px'
  div.innerHTML = `
    <div style="background:#fff;border-radius:12px;width:420px;max-width:100%;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
        <div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)">Ver como ${tipo === 'professor' ? 'Professor' : 'Aluno'}</div>
          <div style="font-size:11px;color:rgba(242,236,206,.7);margin-top:2px">Escolha quem deseja visualizar</div>
        </div>
        <button onclick="document.getElementById('modal-impersonar').remove()" style="background:none;border:none;color:var(--bege);font-size:20px;cursor:pointer;line-height:1">×</button>
      </div>
      <div style="overflow-y:auto;flex:1;padding:12px">
        ${(pessoas||[]).length === 0
          ? `<div style="padding:20px;text-align:center;font-size:13px;color:var(--txt2)">Nenhum ${tipo} encontrado.</div>`
          : (pessoas||[]).map(p => `
            <div onclick="selecionarImpersonar('${p.id}','${tipo}')"
              style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;cursor:pointer;margin-bottom:4px;transition:background .15s"
              onmouseover="this.style.background='rgba(31,56,31,.06)'"
              onmouseout="this.style.background='transparent'">
              <div style="width:34px;height:34px;border-radius:50%;background:rgba(31,56,31,.12);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--verde);flex-shrink:0">
                ${p.nome.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
              </div>
              <div>
                <div style="font-size:13px;font-weight:500;color:var(--txt)">${p.nome}</div>
                <div style="font-size:11px;color:var(--txt2)">${p.email}</div>
              </div>
            </div>`).join('')
        }
      </div>
    </div>`

  document.body.appendChild(div)
  div.addEventListener('click', e => { if (e.target === div) div.remove() })
}

async function selecionarImpersonar(pessoaId, tipo) {
  const sb = window._sb
  document.getElementById('modal-impersonar')?.remove()

  const { data: pessoa } = await sb.from('perfis')
    .select('*, matriculas(plano_tipo,opcao_aulas,ativa)')
    .eq('id', pessoaId).single()

  if (!pessoa) { window.toast?.('Perfil não encontrado'); return }

  _ativarImpersonar(tipo, pessoa)
}
window.selecionarImpersonar = selecionarImpersonar

function _ativarImpersonar(tipo, pessoa) {
  window._viewAs = tipo

  if (tipo === 'admin') {
    // Restaura perfil real do admin
    const perfilAdmin = window._perfilAdmin || window._perfil
    window._perfil = perfilAdmin
    window._perfilAdmin = null
    // Restaura nome e badge corretos
    document.getElementById('sb-nome').textContent = perfilAdmin.nome
    document.getElementById('sb-role-label').textContent = 'Admin'
    ;['admin','prof','aluno'].forEach(t => {
      const btn = document.getElementById('imp-'+t)
      if (!btn) return
      btn.style.background = t==='admin' ? 'var(--dourado)' : 'rgba(242,236,206,.15)'
      btn.style.color      = t==='admin' ? 'var(--verde)'   : 'rgba(242,236,206,.7)'
      btn.style.fontWeight = t==='admin' ? '500'            : '400'
    })
    document.getElementById('impersonar-aviso')?.remove()
    buildMenu('admin')
    window.navigate('dashboard')
    return
  } else {
    // Salva perfil admin e substitui pelo da pessoa selecionada
    if (!window._perfilAdmin) window._perfilAdmin = window._perfil
    window._perfil = pessoa

    // Atualiza plano no sidebar se aluno
    if (tipo === 'aluno') {
      const mat = (pessoa.matriculas||[]).find(m=>m.ativa)
      window._plano = mat?.plano_tipo || null
      const planoEl = document.getElementById('sb-plano')
      if (planoEl) planoEl.textContent = mat?.plano_tipo || ''
    }
  }

  // Atualiza nome e badge no sidebar
  document.getElementById('sb-nome').textContent = pessoa.nome
  document.getElementById('sb-role-label').textContent = {
    admin: 'Admin', professor: 'Modo Professor', aluno: 'Modo Aluno',
  }[tipo]

  // Destaca botão ativo
  ;['admin', 'prof', 'aluno'].forEach(t => {
    const btn = document.getElementById(`imp-${t}`)
    if (!btn) return
    const key = t === 'prof' ? 'professor' : t
    btn.style.background = key === tipo ? 'var(--dourado)' : 'rgba(242,236,206,.15)'
    btn.style.color      = key === tipo ? 'var(--verde)'   : 'rgba(242,236,206,.7)'
    btn.style.fontWeight = key === tipo ? '500'            : '400'
  })

  // Aviso de modo impersonar no topo
  let aviso = document.getElementById('impersonar-aviso')
  if (tipo !== 'admin') {
    if (!aviso) {
      aviso = document.createElement('div')
      aviso.id = 'impersonar-aviso'
      aviso.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:300;background:var(--dourado);color:var(--verde);text-align:center;padding:5px;font-size:11px;font-family:"DM Sans",sans-serif;font-weight:500'
      document.body.appendChild(aviso)
    }
    aviso.textContent = `👁 Visualizando como: ${pessoa.nome} · `
    const voltar = document.createElement('span')
    voltar.textContent = 'Voltar ao Admin'
    voltar.style.cssText = 'text-decoration:underline;cursor:pointer;font-weight:600'
    voltar.onclick = () => impersonar('admin')
    aviso.appendChild(voltar)
  } else {
    aviso?.remove()
  }

  buildMenu(tipo)
  window.navigate(HOME_POR_PERFIL[tipo] || 'dashboard')
}

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
