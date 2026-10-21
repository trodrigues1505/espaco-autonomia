// GERADO por refatora-handlers.mjs a partir de pages/institucional.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-institucional', {
  // onclick="window._npMudarAba(${…})"
  1: function (event, a) {
    window._npMudarAba(a[0])
  },
})
