/**
 * src/pages/index.js
 * Roteador central. Para adicionar uma página:
 *   1. Crie src/pages/<perfil>/nome.js com export async function renderNome(container, page)
 *   2. Importe aqui
 *   3. Adicione uma linha no rotaMap
 */

import { renderDashboard }    from './admin/dashboard.js'
import { renderConfig }       from './admin/config.js'
import { renderGrade }        from './admin/grade.js'
import { renderCriarAulas }   from './admin/criar_aulas.js'
import { renderAlunos }       from './admin/alunos.js'
import { renderPresencas }    from './admin/presencas.js'
import { renderProfessores }  from './admin/professores.js'
import { renderPlanos }       from './admin/planos.js'
import { renderPagamentos }   from './admin/pagamentos.js'

import { renderProfHome }     from './professor/home.js'
import { renderProfAulas }    from './professor/aulas.js'

import { renderAlunoHome }    from './aluno/home.js'
import { renderConquistas }   from './aluno/conquistas.js'
import { renderAlunoGrade }   from './aluno/grade.js'
import { renderAlunoMinhas }  from './aluno/minhas.js'
import { renderAlunoPlano }   from './aluno/plano.js'

const rotaMap = {
  'dashboard':        renderDashboard,
  'config':           renderConfig,
  'grade':            renderGrade,
  'criar-aulas':      renderCriarAulas,
  'alunos':           renderAlunos,
  'presencas':        renderPresencas,
  'professores':      renderProfessores,
  'planos':           renderPlanos,
  'pagamentos':       renderPagamentos,
  'prof-home':        renderProfHome,
  'prof-chamada':     renderProfHome,
  'prof-aulas':       renderProfAulas,
  'aluno-home':       renderAlunoHome,
  'aluno-conquistas': renderConquistas,
  'aluno-grade':      renderAlunoGrade,
  'aluno-minhas':     renderAlunoMinhas,
  'aluno-plano':      renderAlunoPlano,
}

export async function navigate(page) {
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'))
  document.getElementById(`ni-${page}`)?.classList.add('on')

  const container = document.getElementById('main-area')
  container.innerHTML = '<div class="loading-page"><div class="spin-big"></div></div>'

  const fn = rotaMap[page]
  if (!fn) {
    container.innerHTML = `<div class="content"><p style="color:var(--txt2);font-size:13px">Página não encontrada: ${page}</p></div>`
    return
  }

  try {
    await fn(container, page)
  } catch (e) {
    container.innerHTML = `<div class="content"><div style="color:#c0392b;font-size:12px;font-family:monospace">Erro em ${page}: ${e.message}</div></div>`
    console.error(`navigate(${page}):`, e)
  }
}

window.navigate = navigate
