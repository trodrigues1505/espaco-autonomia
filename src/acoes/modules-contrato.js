// GERADO por refatora-handlers.mjs a partir de modules/contrato.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('modules-contrato', {
  // onclick="document.getElementById('modal-ver-contrato').remove()"
  1: function (event, a) {
    document.getElementById('modal-ver-contrato').remove()
  },
})
