/**
 * src/pages/index.js
 * Responsabilidade: roteador central de páginas.
 * Cada import é um módulo de página independente.
 * Adicionar uma nova página = criar o arquivo + um import + uma linha no switch.
 */

// Admin
import { renderAdmindashboard }   from './admin/dashboard.js'
import { renderAdminconfig }       from './admin/config.js'
import { renderAdmincriar_aulas }  from './admin/criar_aulas.js'
import { renderAdminalunos }       from './admin/alunos.js'
import { renderAdminpresencas }    from './admin/presencas.js'
import { renderAdminprofessores }  from './admin/professores.js'
import { renderAdminplanos }       from './admin/planos.js'
import { renderAdminpagamentos }   from './admin/pagamentos.js'
import { renderAdmingrade }        from './admin/grade.js'

// Professor
import { renderProfessorhome }     from './professor/home.js'
import { renderProfessoraulas }    from './professor/aulas.js'

// Aluno
import { renderAlunohome }         from './aluno/home.js'
import { renderAlunograde }        from './aluno/grade.js'
import { renderAlunominhas }       from './aluno/minhas.js'
import { renderAlunoplano }        from './aluno/plano.js'
import { renderAlunoconquistas }   from './aluno/conquistas.js'

// ── navigate() — ponto de entrada de toda navegação ─────────
export async function navigate(page) {
  // Marca item ativo no sidebar
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'))
  document.getElementById(`ni-${page}`)?.classList.add('on')

  const main = document.getElementById('main-area')
  main.innerHTML = '<div class="loading-page"><div class="spin-big"></div><p>Carregando...</p></div>'

  try {
    await renderPage(page, main)
  } catch (e) {
    main.innerHTML = `<div class="content"><div style="color:#c0392b;font-size:13px;padding:20px">Erro: ${e.message}</div></div>`
    console.error('navigate error:', e)
  }
}
window.navigate = navigate

// ── renderPage() — despacha para o módulo correto ────────────
async function renderPage(page, container) {
  const tipo = window._perfil?.tipo

  // Grade é compartilhada entre admin e aluno com parâmetro
  if (page === 'grade')       return renderAdmingrade(container)
  if (page === 'aluno-grade') return renderAlunograde(container)

  // Prof-chamada é renderizado dentro do módulo prof-home
  if (page === 'prof-chamada' || page === 'prof-home') return renderProfessorhome(container, page)

  const rotaMap = {
    // Admin
    'dashboard':   renderAdmindashboard,
    'config':      renderAdminconfig,
    'criar-aulas': renderAdmincriar_aulas,
    'alunos':      renderAdminalunos,
    'presencas':   renderAdminpresencas,
    'professores': renderAdminprofessores,
    'planos':      renderAdminplanos,
    'pagamentos':  renderAdminpagamentos,
    // Professor
    'prof-aulas':      renderProfessoraulas,
    // Aluno
    'aluno-home':      renderAlunohome,
    'aluno-minhas':    renderAlunominhas,
    'aluno-plano':     renderAlunoplano,
    'aluno-conquistas':renderAlunoconquistas,
  }

  const fn = rotaMap[page]
  if (fn) return fn(container)

  container.innerHTML = `<div class="content"><p style="color:var(--txt2);font-size:13px">Página não encontrada: ${page}</p></div>`
}
