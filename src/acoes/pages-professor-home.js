// GERADO por refatora-handlers.mjs a partir de pages/professor/home.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-professor-home', {
  // onclick="window._ocPresencaId='${…}';navigate('prof-chamada')"
  1: function (event, a) {
    window._ocPresencaId=a[0];navigate('prof-chamada')
  },

  // onclick="marcarTodosProfPresentes()"
  2: function (event, a) {
    marcarTodosProfPresentes()
  },

  // onclick="togglePresencaProf(this.dataset.id, this.dataset.status)"
  3: function (event, a) {
    togglePresencaProf(this.dataset.id, this.dataset.status)
  },
})
