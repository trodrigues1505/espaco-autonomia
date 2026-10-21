// GERADO por refatora-handlers.mjs a partir de modules/vocabulario.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('modules-vocabulario', {
  // onclick="document.getElementById('_voc-modal').remove()"
  1: function (event, a) {
    document.getElementById('_voc-modal').remove()
  },
})
