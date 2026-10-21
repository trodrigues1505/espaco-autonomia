// GERADO por refatora-handlers.mjs a partir de pages/admin/presencas.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-presencas', {
  // onclick="window._ocPresencaId='${…}';navigate('presencas')"
  1: function (event, a) {
    window._ocPresencaId=a[0];navigate('presencas')
  },

  // onclick="marcarTodosPresentes('${…}')"
  2: function (event, a) {
    marcarTodosPresentes(a[0])
  },

  // onclick="setPresenca('${…}',true)"
  3: function (event, a) {
    setPresenca(a[0],true)
  },

  // onclick="setPresenca('${…}',false)"
  4: function (event, a) {
    setPresenca(a[0],false)
  },

  // onclick="excluirPresenca(this.dataset.id, this.dataset.nome, this.dataset.aluno)"
  5: function (event, a) {
    excluirPresenca(this.dataset.id, this.dataset.nome, this.dataset.aluno)
  },

  // onclick="adicionarAlunoPresenca('${…}')"
  6: function (event, a) {
    adicionarAlunoPresenca(a[0])
  },

  // onclick="window._presencaData='${…}';window._ocPresencaId=null;navigate('presencas')"
  7: function (event, a) {
    window._presencaData=a[0];window._ocPresencaId=null;navigate('presencas')
  },

  // onclick="window._presencaData=null;window._ocPresencaId=null;navigate('presencas')"
  8: function (event, a) {
    window._presencaData=null;window._ocPresencaId=null;navigate('presencas')
  },

  // onchange="window._presencaData=this.value;window._ocPresencaId=null;navigate('presencas')"
  9: function (event, a) {
    window._presencaData=this.value;window._ocPresencaId=null;navigate('presencas')
  },
})
