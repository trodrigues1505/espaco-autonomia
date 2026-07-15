/**
 * src/pages/index.js
 */
const V = '?v=21'
const rotaMap = {
  'dashboard':          () => import('./admin/dashboard.js'  + V).then(m => m.renderDashboard),
  'timeline':           () => import('./timeline.js'         + V).then(m => m.renderTimeline),
  'config':             () => import('./admin/config.js'     + V).then(m => m.renderConfig),
  'grade':              () => import('./admin/grade.js' + V).then(m => m.renderAlunoGrade),
  'criar-aulas':        () => import('./admin/criar_aulas.js'+ V).then(m => m.renderCriarAulas),
  'alunos':             () => import('./admin/alunos.js'     + V).then(m => m.renderAlunos),
  'presencas':          () => import('./admin/presencas.js'  + V).then(m => m.renderPresencas),
  'professores':        () => import('./admin/professores.js'+ V).then(m => m.renderProfessores),
  'planos':             () => import('./admin/planos.js'     + V).then(m => m.renderPlanos),
  'pagamentos':         () => import('./admin/pagamentos.js' + V).then(m => m.renderPagamentos),
  'prof-home':          () => import('./professor/home.js'   + V).then(m => m.renderProfHome),
  'prof-chamada':       () => import('./professor/home.js'   + V).then(m => m.renderProfHome),
  'prof-aulas':         () => import('./professor/aulas.js'  + V).then(m => m.renderProfAulas),
  'prof-repasse':       () => import('./professor/repasse.js'+ V).then(m => m.renderProfRepasse),
  'aluno-home':         () => import('./aluno/home.js'       + V).then(m => m.renderAlunoHome),
  'aluno-conquistas':   () => import('./aluno/conquistas.js' + V).then(m => m.renderConquistas),
  'aluno-grade':        () => import('./aluno/grade.js'      + V).then(m => m.renderAlunoGrade),
  'aluno-minhas':       () => import('./aluno/minhas.js'     + V).then(m => m.renderAlunoMinhas),
  'aluno-plano':        () => import('./aluno/plano.js'      + V).then(m => m.renderAlunoPlano),
  'previsao-professor': () => import('./admin/previsao-professor.js' + V).then(m => m.renderPrevisaoProfessor),
  'vinculos':            () => import('./admin/vinculos.js'          + V).then(m => m.renderVinculos),
  'jnana-admin':        () => import('./admin/jnana.js'             + V).then(m => m.renderJnanaAdmin),
  'asana-admin':        () => import('./admin/asana.js'             + V).then(m => m.renderAsanaAdmin),
  'adhyayana-admin':    () => import('./admin/adhyayana.js'         + V).then(m => m.renderAdhyayanaAdmin),
  // Institucional
  'espaco':             () => import('./institucional.js' + V).then(m => m.renderEspaco),
  'nossa-pratica':       () => import('./institucional.js' + V).then(m => m.renderNossaPratica),
  // Dharma Phala — um loader por benefício, todos apontam para o mesmo módulo
  'aluno-beneficio-sangha':         () => import('./aluno/beneficios.js' + V).then(m => m.renderAlunosBeneficios),
  'aluno-beneficio-kala-sadhya':    () => import('./aluno/beneficios.js' + V).then(m => m.renderAlunosBeneficios),
  'aluno-beneficio-asana-marga':    () => import('./aluno/beneficios.js' + V).then(m => m.renderAlunosBeneficios),
  'aluno-beneficio-yoga-adhyayana': () => import('./aluno/beneficios.js' + V).then(m => m.renderAlunosBeneficios),
  'aluno-beneficio-jnana-marga':    () => import('./aluno/beneficios.js' + V).then(m => m.renderAlunosBeneficios),
  'aluno-beneficio-sadhana-purna':  () => import('./aluno/beneficios.js' + V).then(m => m.renderAlunosBeneficios),
  'aluno-beneficio-atma-vijnana':   () => import('./aluno/beneficios.js' + V).then(m => m.renderAlunosBeneficios),
  'aluno-beneficio-shruti':         () => import('./aluno/beneficios.js' + V).then(m => m.renderAlunosBeneficios),
  'aluno-beneficio-naada-mandir':   () => import('./aluno/beneficios.js' + V).then(m => m.renderAlunosBeneficios),
}
export async function navigate(page) {
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'))
  document.getElementById(`ni-${page}`)?.classList.add('on')
  const container = document.getElementById('main-area')
  container.innerHTML = '<div class="loading-page"><div class="spin-big"></div></div>'
  const loader = rotaMap[page]
  if (!loader) {
    container.innerHTML = `<div class="content"><p style="color:var(--txt2);font-size:13px">Página não encontrada: ${page}</p></div>`
    return
  }
  try {
    const fn = await loader()
    await fn(container, page)
  } catch (e) {
    container.innerHTML = `<div class="content"><div style="color:#c0392b;font-size:12px;font-family:monospace">Erro em ${page}: ${e.message}</div></div>`
    console.error(`navigate(${page}):`, e)
  }
}
window.navigate = navigate   
