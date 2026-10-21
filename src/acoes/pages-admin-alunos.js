// GERADO por refatora-handlers.mjs a partir de pages/admin/alunos.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-alunos', {
  // onclick="editarAluno('${…}')"
  1: function (event, a) {
    editarAluno(a[0])
  },

  // onclick="confirmarExcluirAluno('${…}', this.dataset.nome)"
  2: function (event, a) {
    confirmarExcluirAluno(a[0], this.dataset.nome)
  },

  // onclick="abrirPromoverVisitante('${…}')"
  3: function (event, a) {
    abrirPromoverVisitante(a[0])
  },

  // onchange="updateValorPlano()"
  4: function (event, a) {
    updateValorPlano()
  },

  // onclick="document.getElementById('modal-cad-aluno').style.display='none'"
  5: function (event, a) {
    document.getElementById('modal-cad-aluno').style.display='none'
  },

  // onclick="salvarNovoAluno()"
  6: function (event, a) {
    salvarNovoAluno()
  },

  // onclick="document.getElementById('modal-edit-aluno').style.display='none'"
  7: function (event, a) {
    document.getElementById('modal-edit-aluno').style.display='none'
  },

  // onclick="salvarEdicaoAluno()"
  8: function (event, a) {
    salvarEdicaoAluno()
  },

  // onchange="updateValorPromocao()"
  9: function (event, a) {
    updateValorPromocao()
  },

  // onclick="document.getElementById('modal-promover-visitante').style.display='none'"
  10: function (event, a) {
    document.getElementById('modal-promover-visitante').style.display='none'
  },

  // onclick="salvarPromocaoVisitante()"
  11: function (event, a) {
    salvarPromocaoVisitante()
  },

  // onclick="window.trocarAbaAlunos('${…}')"
  12: function (event, a) {
    window.trocarAbaAlunos(a[0])
  },

  // oninput="window.filtrarAlunosDebounced(this.value)"
  13: function (event, a) {
    window.filtrarAlunosDebounced(this.value)
  },

  // onchange="window._filtroPlanoAlunos=this.value;window.aplicarFiltroAlunos()"
  14: function (event, a) {
    window._filtroPlanoAlunos=this.value;window.aplicarFiltroAlunos()
  },

  // onclick="window.executarCreditoMensal()"
  15: function (event, a) {
    window.executarCreditoMensal()
  },

  // onclick="document.getElementById('modal-cad-aluno').style.display='flex'"
  16: function (event, a) {
    document.getElementById('modal-cad-aluno').style.display='flex'
  },

  // onclick="window.toggleFiltroSemAsaas()"
  17: function (event, a) {
    window.toggleFiltroSemAsaas()
  },

  // onclick="window.trocarAbaAlunos('visitantes')"
  18: function (event, a) {
    window.trocarAbaAlunos('visitantes')
  },

  // onclick="window.toggleDistribPlano()"
  19: function (event, a) {
    window.toggleDistribPlano()
  },

  // onclick="document.getElementById('modal-excluir-aluno').style.display='none'"
  20: function (event, a) {
    document.getElementById('modal-excluir-aluno').style.display='none'
  },

  // onchange="updateValorEdicao()"
  21: function (event, a) {
    updateValorEdicao()
  },

  // onclick="document.getElementById('modal-edit-aluno').style.display='none';window._abaAlunos='vinculos';navigate('alunos"
  22: function (event, a) {
    document.getElementById('modal-edit-aluno').style.display='none';window._abaAlunos='vinculos';navigate('alunos');return false
  },

  // onclick="creditarAulasManual('${…}')"
  23: function (event, a) {
    creditarAulasManual(a[0])
  },
})
