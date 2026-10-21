// GERADO por refatora-handlers.mjs a partir de pages/professor/aulas.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-professor-aulas', {
  // onclick="window._toggleOcSelecionada('${…}')"
  1: function (event, a) {
    window._toggleOcSelecionada(a[0])
  },

  // onclick="window._ocPresencaId='${…}';navigate('prof-chamada')"
  2: function (event, a) {
    window._ocPresencaId=a[0];navigate('prof-chamada')
  },

  // onclick="window._currentPage='prof-aulas';cancelarOcorrenciaGrade('${…}',window._profAulasMap['${…}'])"
  3: function (event, a) {
    window._currentPage='prof-aulas';cancelarOcorrenciaGrade(a[0],window._profAulasMap[a[1]])
  },

  // onclick="window._abrirCancelamentoEmMassa()"
  4: function (event, a) {
    window._abrirCancelamentoEmMassa()
  },

  // onclick="window._ocsSelecionadas.clear();window._atualizarBarraSelecao();document.querySelectorAll('.chk-cancel-massa')"
  5: function (event, a) {
    window._ocsSelecionadas.clear();window._atualizarBarraSelecao();document.querySelectorAll('.chk-cancel-massa').forEach(c=>c.checked=false)
  },
})
