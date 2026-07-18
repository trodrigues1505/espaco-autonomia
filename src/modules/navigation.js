/**
 * src/modules/navigation.js
 */

import { calcularBadgesMenu, aplicarBadgesMenu } from './notificacoes.js'

// ── Descrições curtas dos benefícios (intro na primeira visita) ──
export const BENEFICIO_INTRO = {
  sangha:         { titulo: 'Sangha',         desc: 'Grupo exclusivo no WhatsApp da turma. Avisos do estúdio, trocas entre praticantes e suporte da comunidade.' },
  kala_sadhya:    { titulo: 'Kāla Sādhyā',   desc: 'Agenda Flex. Cancelou com antecedência? Recupera em outra turma da grade sem custo.' },
  asana_marga:    { titulo: 'Āsana Mārga',   desc: 'Aula prática semanal no app. Sequência de āsanas, pranayama e mantra com estrutura completa para praticar em casa.' },
  yoga_adhyayana: { titulo: 'Yoga Adhyayana', desc: 'Estudo teórico semanal. Uma postura por semana com koshas, vāyus, chakras, doshas, elementos, origem e reflexão.' },
  jnana_marga:    { titulo: 'Jñāna Mārga',   desc: 'Estudo dos Yoga Sūtras. Um sutra de Patañjali publicado de segunda a sexta com texto original, transliteração, tradução e comentário.' },
  sadhana_purna:  { titulo: 'Sādhanā Pūrṇā', desc: 'Avaliação periódica de progresso com o professor. Conversa estruturada para mapear evolução e ajustar a prática.' },
  atma_vijnana:   { titulo: 'Ātma Vijñāna',  desc: 'Anamnese personalizada no início da jornada. Entrevista aprofundada com o professor sobre histórico, objetivos e limitações.' },
  shruti:         { titulo: 'Śruti',          desc: 'Áudio diário. Mantras, pranayamas guiados ou reflexões para ouvir no dia a dia.' },
  naada_mandir:   { titulo: 'Nāda Mandir',   desc: 'Biblioteca de mantras. Áudios com pronúncia correta, significado e contexto de uso dos principais mantras da tradição.' },
}

// ── Benefícios com ícone e campo do plano ────────────────────
const DHARMA_PHALA = [
  { id: 'aluno-beneficio-sangha',         label: 'Sangha',         icone: '🌸', beneficio: 'sangha'         },
  { id: 'aluno-beneficio-kala-sadhya',    label: 'Kāla Sādhyā',   icone: '🗓', beneficio: 'kala_sadhya'    },
  { id: 'aluno-beneficio-asana-marga',    label: 'Āsana Mārga',   icone: '🧘', beneficio: 'asana_marga'    },
  { id: 'aluno-beneficio-yoga-adhyayana', label: 'Yoga Adhyayana', icone: '📖', beneficio: 'yoga_adhyayana' },
  { id: 'aluno-beneficio-jnana-marga',    label: 'Jñāna Mārga',   icone: '📜', beneficio: 'jnana_marga'    },
  { id: 'aluno-beneficio-sadhana-purna',  label: 'Sādhanā Pūrṇā', icone: '🌿', beneficio: 'sadhana_purna'  },
  { id: 'aluno-beneficio-atma-vijnana',   label: 'Ātma Vijñāna',  icone: '🔍', beneficio: 'atma_vijnana'   },
  { id: 'aluno-beneficio-shruti',         label: 'Śruti',          icone: '🎵', beneficio: 'shruti'         },
  { id: 'aluno-beneficio-naada-mandir',   label: 'Nāda Mandir',   icone: '🕌', beneficio: 'naada_mandir'   },
]

// Benefícios disponíveis para visitantes (acesso pleno). Os demais aparecem
// no menu do visitante também, porém bloqueados — clicar neles leva à tela
// do benefício mostrando em quais planos ele está incluso e um CTA de
// upgrade (ver src/pages/aluno/beneficios.js, _renderBeneficioGenerico).
const DHARMA_VISITANTE = ['sangha', 'asana_marga']

export const BENEFICIO_IDS = DHARMA_PHALA.map(b => b.id)

// Itens institucionais — aparecem para todos os perfis
const ITENS_SOBRE = [
  { sec: 'Sobre' },
  { id: 'espaco',        label: 'O Espaço',       icon: 'ti-building' },
  { id: 'nossa-pratica', label: 'Nossa Prática',  icon: 'ti-compass' },
]

const MENUS = {
  admin: [
    { sec: 'Visão Geral' },
    { id: 'dashboard',          label: 'Dashboard',           icon: 'ti-layout-dashboard' },
    { id: 'timeline',           label: 'Timeline',            icone: '💬'                  },
    { id: 'grade',              label: 'Grade de Aulas',      icon: 'ti-calendar'         },
    { sec: 'Gestão' },
    // 'criar-aulas' agora vive como aba dentro de 'grade' (unificação
    // Grade + Criar Aulas). A rota em si continua existindo em index.js
    // para compatibilidade (várias funções de criar_aulas.js chamam
    // navigate('criar-aulas') internamente), só não é mais linkada
    // diretamente pelo menu — mesmo padrão já usado para 'vinculos' e
    // 'pagamentos' dentro de 'alunos'.
    // 'Alunos' agora inclui, por abas internas: Alunos, Visitantes (Leads),
    // Vínculos Prof×Aluno, Pagamentos e Engajamento (unificação de
    // 15/07/2026 + rodadas seguintes). As entradas de menu separadas para
    // 'vinculos' e 'pagamentos' foram removidas — as rotas em si continuam
    // existindo em index.js para compatibilidade, mas não são mais
    // linkadas diretamente pelo menu.
    { id: 'alunos',             label: 'Alunos',              icon: 'ti-users'            },
    { id: 'professores',        label: 'Professores',         icon: 'ti-user-star'        },
    // 'previsao-professor' agora vive como aba dentro de 'professores'
    // (unificação Professores + Repasse). Mesma lógica de compatibilidade
    // acima: a rota continua existindo, só não é mais linkada pelo menu.
    { id: 'presencas',          label: 'Presenças',           icon: 'ti-checkbox'         },
    { id: 'planos',             label: 'Planos',              icon: 'ti-award'            },
    { sec: 'Sistema' },
    { id: 'jnana-admin',        label: 'Jñāna Mārga',         icon: 'ti-book'             },
    { id: 'asana-admin',        label: 'Āsana Mārga',         icon: 'ti-yoga'             },
    { id: 'adhyayana-admin',    label: 'Yoga Adhyayana',      icon: 'ti-flower'           },
    { id: 'vocabulario-admin',  label: 'Vocabulário',         icon: 'ti-abc'              },
    { id: 'config',             label: 'Configurações',        icon: 'ti-settings'         },
    ...ITENS_SOBRE,
  ],
  professor: [
    { sec: 'Minhas Aulas' },
    { id: 'prof-home',    label: 'Dashboard',    icon: 'ti-layout-dashboard' },
    { id: 'timeline',     label: 'Timeline',     icone: '💬'                  },
    { id: 'prof-aulas',   label: 'Minhas Aulas', icon: 'ti-calendar'         },
    { id: 'prof-chamada', label: 'Chamada',      icon: 'ti-checkbox'         },
    { id: 'prof-repasse', label: 'Meu Repasse',  icon: 'ti-calculator'       },
    ...ITENS_SOBRE,
  ],
  aluno: [
    { sec: 'Meu Espaço' },
    { id: 'aluno-home',   label: 'Início',         icon: 'ti-home'     },
    { id: 'timeline',     label: 'Timeline',       icone: '💬'          },
    { id: 'aluno-grade',  label: 'Grade de Aulas', icon: 'ti-calendar' },
    { id: 'aluno-minhas', label: 'Minhas Aulas',   icon: 'ti-bookmark' },
    { id: 'aluno-plano',  label: 'Meu Plano',      icon: 'ti-award'    },
    ...ITENS_SOBRE,
  ],
  visitante: [
    { sec: 'Meu Espaço' },
    { id: 'aluno-home', label: 'Início', icon: 'ti-home' },
    { id: 'timeline',   label: 'Timeline', icone: '💬'    },
    ...ITENS_SOBRE,
  ],
}

const HOME_POR_PERFIL = {
  admin:      'dashboard',
  professor:  'prof-home',
  aluno:      'aluno-home',
  visitante:  'aluno-home',
}

// ── Constrói sidebar conforme perfil ─────────────────────────
export function buildMenu(tipo, badges = {}) {
  const nav = document.getElementById('nav-menu')
  nav.innerHTML = ''

  const itens = [...(MENUS[tipo] || MENUS['aluno'])]

  if (tipo === 'aluno') {
    itens.push({ sec: 'Dharma Phala' })
    const planoData = window._planoData || null
    for (const b of DHARMA_PHALA) {
      itens.push({ ...b, _bloqueado: planoData ? !planoData[b.beneficio] : false })
    }
  }

  if (tipo === 'visitante') {
    itens.push({ sec: 'Dharma Phala' })
    for (const b of DHARMA_PHALA) {
      itens.push({ ...b, _bloqueado: !DHARMA_VISITANTE.includes(b.beneficio) })
    }
  }

  for (const item of itens) {
    if (item.sec) {
      const d = document.createElement('div')
      d.className = 'nav-sec'
      d.textContent = item.sec
      nav.appendChild(d)
      continue
    }

    const d = document.createElement('div')
    d.className = 'ni'
    d.id = `ni-${item.id}`
    d.style.display = 'flex'
    d.style.alignItems = 'center'

    const iconHtml = item.icone
      ? `<span style="font-size:14px;flex-shrink:0;width:20px;text-align:center;${item._bloqueado ? 'filter:grayscale(1);opacity:.4' : ''}">${item.icone}</span>`
      : `<i class="ti ${item.icon}" style="flex-shrink:0"></i>`

    const labelStyle = item._bloqueado
      ? 'flex:1;color:var(--txt2);opacity:.5'
      : 'flex:1'

    d.innerHTML = `${iconHtml}<span style="${labelStyle}">${item.label}</span>`

    const count = badges[item.id] || 0
    if (count > 0) {
      const badge = document.createElement('span')
      badge.className = 'notif-menu-badge'
      badge.textContent = count
      badge.style.cssText = `
        background:#c0392b;color:#fff;border-radius:10px;padding:1px 6px;
        font-size:10px;font-weight:600;margin-left:auto;flex-shrink:0;
        font-family:'DM Sans',sans-serif;line-height:1.4
      `
      d.appendChild(badge)
    }

    d.onclick = () => window.navigate(item.id)
    nav.appendChild(d)
  }

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
  const isAdmin = perfil?.tipo === 'admin' || window._perfilAdmin?.tipo === 'admin'
  if (!isAdmin) return
  if (tipo === 'admin') {
    _ativarImpersonar('admin', window._perfilAdmin || window._perfil)
    return
  }
  _abrirModalImpersonar(tipo)
}
window.impersonar = impersonar

async function _abrirModalImpersonar(tipo) {
  const sb = window._sb
  const tipoFiltro = tipo === 'professor' ? ['professor','admin'] : ['aluno']
  const { data: pessoas } = await sb.from('perfis')
    .select('id,nome,email,tipo').in('tipo', tipoFiltro).eq('ativo', true).order('nome')

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
          ? `<div style="padding:20px;text-align:center;font-size:13px;color:var(--txt2)">Nenhum encontrado.</div>`
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
                <div style="font-size:11px;color:var(--txt2)">${p.email}${p.tipo==='visitante'?' · Visitante':''}</div>
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
  const { data: pessoa } = await sb.from('perfis').select('*').eq('id', pessoaId).single()
  if (!pessoa) { window.toast?.('Perfil não encontrado'); return }

  const tipoReal = pessoa.tipo // pode ser 'visitante'

  if (tipoReal === 'aluno') {
    const { data: mats } = await sb.from('matriculas')
      .select('plano_tipo,opcao_aulas,ativa').eq('aluno_id', pessoaId)
    pessoa.matriculas = mats || []
    const mat = (mats||[]).find(m => m.ativa)
    if (mat?.plano_tipo) {
      const { data: planoData } = await sb
        .from('planos')
        .select('sangha,kala_sadhya,asana_marga,yoga_adhyayana,jnana_marga,sadhana_purna,atma_vijnana,shruti,naada_mandir')
        .eq('tipo', mat.plano_tipo)
        .maybeSingle()
      window._planoData = planoData || null
    } else {
      window._planoData = null
    }
  } else {
    pessoa.matriculas = []
    window._planoData = null
  }
  _ativarImpersonar(tipoReal, pessoa)
}
window.selecionarImpersonar = selecionarImpersonar

function _ativarImpersonar(tipo, pessoa) {
  window._viewAs = tipo

  if (tipo === 'admin') {
    const perfilAdmin = window._perfilAdmin || window._perfil
    window._perfil = perfilAdmin
    window._perfilAdmin = null
    window._planoData = null
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
    const bar = document.getElementById('impersonate-bar')
    if (bar) bar.style.display = 'block'
    buildMenu('admin')
    window.navigate('dashboard')
    return
  }

  if (!window._perfilAdmin) window._perfilAdmin = window._perfil
  window._perfil = pessoa

  if (tipo === 'aluno') {
    const mat = (pessoa.matriculas||[]).find(m=>m.ativa)
    window._plano = mat?.plano_tipo || null
    const planoEl = document.getElementById('sb-plano')
    if (planoEl) planoEl.textContent = mat?.plano_tipo || ''
  }

  document.getElementById('sb-nome').textContent = pessoa.nome
  document.getElementById('sb-role-label').textContent = {
    admin: 'Admin', professor: 'Modo Professor', aluno: 'Modo Aluno', visitante: 'Modo Visitante',
  }[tipo] || tipo

  ;['admin', 'prof', 'aluno'].forEach(t => {
    const btn = document.getElementById(`imp-${t}`)
    if (!btn) return
    const key = t === 'prof' ? 'professor' : t
    btn.style.background = key === tipo ? 'var(--dourado)' : 'rgba(242,236,206,.15)'
    btn.style.color      = key === tipo ? 'var(--verde)'   : 'rgba(242,236,206,.7)'
    btn.style.fontWeight = key === tipo ? '500'            : '400'
  })

  let aviso = document.getElementById('impersonar-aviso')
  if (!aviso) {
    aviso = document.createElement('div')
    aviso.id = 'impersonar-aviso'
    aviso.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:300;background:var(--dourado);color:var(--verde);text-align:center;padding:5px;font-size:11px;font-family:"DM Sans",sans-serif;font-weight:500;pointer-events:none'
    document.body.appendChild(aviso)
  }
  aviso.textContent = `👁 Visualizando como: ${pessoa.nome} · `
  const voltar = document.createElement('span')
  voltar.textContent = 'Voltar ao Admin'
  voltar.style.cssText = 'text-decoration:underline;cursor:pointer;font-weight:600;pointer-events:auto'
  voltar.onclick = () => impersonar('admin')
  aviso.appendChild(voltar)

  buildMenu(tipo)
  window.navigate(HOME_POR_PERFIL[tipo] || 'aluno-home')
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
    if (e.clientX > rect.right - 50) {
      nav.classList.toggle('mobile-open')
      const bar = document.getElementById('impersonate-bar')
      if (bar && (window._perfil?.tipo === 'admin' || window._perfilAdmin?.tipo === 'admin')) {
        bar.style.display = nav.classList.contains('mobile-open') ? 'block' : 'none'
      }
    }
  })
  document.addEventListener('click', e => {
    if (e.target.classList.contains('ni')) {
      document.getElementById('nav-menu')?.classList.remove('mobile-open')
      const bar = document.getElementById('impersonate-bar')
      if (bar && window.innerWidth <= 768) bar.style.display = 'none'
    }
  })
}   
