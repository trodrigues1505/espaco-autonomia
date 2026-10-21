// GERADO por refatora-handlers.mjs a partir de pages/professor/repasse.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-professor-repasse', {
  // onclick="window._prMes='${…}';navigate('prof-repasse')"
  1: function (event, a) {
    window._prMes=a[0];navigate('prof-repasse')
  },
})
