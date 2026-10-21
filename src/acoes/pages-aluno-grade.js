// GERADO por refatora-handlers.mjs a partir de pages/aluno/grade.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-aluno-grade', {
  // onclick="confirmarOcorrencia('${…}')"
  1: function (event, a) {
    confirmarOcorrencia(a[0])
  },

  // onclick="event.stopPropagation();editarOcorrencia('${…}')"
  2: function (event, a) {
    event.stopPropagation();editarOcorrencia(a[0])
  },

  // onclick="event.stopPropagation();excluirOcorrencia('${…}')"
  3: function (event, a) {
    event.stopPropagation();excluirOcorrencia(a[0])
  },

  // onclick="verDetalhesOcorrencia('${…}')"
  4: function (event, a) {
    verDetalhesOcorrencia(a[0])
  },

  // onclick="window._gradeFiltrosAluno={};navigate('${…}')"
  5: function (event, a) {
    window._gradeFiltrosAluno={};navigate(a[0])
  },

  // onclick="window._gradeOffset=(window._gradeOffset||0)-1;navigate('${…}')"
  6: function (event, a) {
    window._gradeOffset=(window._gradeOffset||0)-1;navigate(a[0])
  },

  // onclick="window._gradeOffset=0;navigate('${…}')"
  7: function (event, a) {
    window._gradeOffset=0;navigate(a[0])
  },

  // onclick="window._gradeOffset=(window._gradeOffset||0)+1;navigate('${…}')"
  8: function (event, a) {
    window._gradeOffset=(window._gradeOffset||0)+1;navigate(a[0])
  },

  // onchange="(window._gradeFiltrosAluno=window._gradeFiltrosAluno||{}).modalidade=this.value||'';navigate('${…}')"
  9: function (event, a) {
    (window._gradeFiltrosAluno=window._gradeFiltrosAluno||{}).modalidade=this.value||'';navigate(a[0])
  },

  // onchange="(window._gradeFiltrosAluno=window._gradeFiltrosAluno||{}).horario=this.value||'';navigate('${…}')"
  10: function (event, a) {
    (window._gradeFiltrosAluno=window._gradeFiltrosAluno||{}).horario=this.value||'';navigate(a[0])
  },
})
