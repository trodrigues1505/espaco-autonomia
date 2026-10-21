// GERADO por refatora-handlers.mjs a partir de pages/admin/grade.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-grade', {
  // onclick="window._abaGrade='${…}';navigate('${…}')"
  1: function (event, a) {
    window._abaGrade=a[0];navigate(a[1])
  },

  // onclick="confirmarOcorrencia('${…}')"
  2: function (event, a) {
    confirmarOcorrencia(a[0])
  },

  // onclick="event.stopPropagation();window.cancelarOcorrenciaGrade('${…}',window._ocsCache['${…}'])"
  3: function (event, a) {
    event.stopPropagation();window.cancelarOcorrenciaGrade(a[0],window._ocsCache[a[1]])
  },

  // onclick="event.stopPropagation();window._toggleOcSelecionada('${…}')"
  4: function (event, a) {
    event.stopPropagation();window._toggleOcSelecionada(a[0])
  },

  // onclick="event.stopPropagation();editarOcorrencia('${…}')"
  5: function (event, a) {
    event.stopPropagation();editarOcorrencia(a[0])
  },

  // onclick="event.stopPropagation();excluirOcorrencia('${…}')"
  6: function (event, a) {
    event.stopPropagation();excluirOcorrencia(a[0])
  },

  // onclick="verDetalhesOcorrencia('${…}')"
  7: function (event, a) {
    verDetalhesOcorrencia(a[0])
  },

  // onclick="window._abrirCancelamentoEmMassa()"
  8: function (event, a) {
    window._abrirCancelamentoEmMassa()
  },

  // onclick="window._ocsSelecionadas.clear();window._atualizarBarraSelecao();document.querySelectorAll('.chk-cancel-massa')"
  9: function (event, a) {
    window._ocsSelecionadas.clear();window._atualizarBarraSelecao();document.querySelectorAll('.chk-cancel-massa').forEach(c=>c.checked=false)
  },

  // onclick="window._gradeFiltrosAluno={};navigate('${…}')"
  10: function (event, a) {
    window._gradeFiltrosAluno={};navigate(a[0])
  },

  // onclick="window._gradeOffset=(window._gradeOffset||0)-1;navigate('${…}')"
  11: function (event, a) {
    window._gradeOffset=(window._gradeOffset||0)-1;navigate(a[0])
  },

  // onclick="window._gradeOffset=0;navigate('${…}')"
  12: function (event, a) {
    window._gradeOffset=0;navigate(a[0])
  },

  // onclick="window._gradeOffset=(window._gradeOffset||0)+1;navigate('${…}')"
  13: function (event, a) {
    window._gradeOffset=(window._gradeOffset||0)+1;navigate(a[0])
  },

  // onchange="(window._gradeFiltrosAluno=window._gradeFiltrosAluno||{}).modalidade=this.value||'';navigate('${…}')"
  14: function (event, a) {
    (window._gradeFiltrosAluno=window._gradeFiltrosAluno||{}).modalidade=this.value||'';navigate(a[0])
  },

  // onchange="(window._gradeFiltrosAluno=window._gradeFiltrosAluno||{}).horario=this.value||'';navigate('${…}')"
  15: function (event, a) {
    (window._gradeFiltrosAluno=window._gradeFiltrosAluno||{}).horario=this.value||'';navigate(a[0])
  },

  // onclick="document.getElementById('modal-det-oc').style.display='none'"
  16: function (event, a) {
    document.getElementById('modal-det-oc').style.display='none'
  },

  // onclick="window._setPresencaModal('${…}','${…}',true)"
  17: function (event, a) {
    window._setPresencaModal(a[0],a[1],true)
  },

  // onclick="window._setPresencaModal('${…}','${…}',false)"
  18: function (event, a) {
    window._setPresencaModal(a[0],a[1],false)
  },

  // onclick="window._excluirPresencaModal(this.dataset.oc, this.dataset.id, this.dataset.nome)"
  19: function (event, a) {
    window._excluirPresencaModal(this.dataset.oc, this.dataset.id, this.dataset.nome)
  },

  // onclick="window._marcarTodosPresentesModal('${…}')"
  20: function (event, a) {
    window._marcarTodosPresentesModal(a[0])
  },

  // onclick="window._adicionarAlunoModal('${…}')"
  21: function (event, a) {
    window._adicionarAlunoModal(a[0])
  },
})
