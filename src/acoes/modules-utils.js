// GERADO por refatora-handlers.mjs a partir de modules/utils.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('modules-utils', {
  // onclick="document.getElementById('${…}').style.display='none'"
  1: function (event, a) {
    document.getElementById(a[0]).style.display='none'
  },
})
