// GERADO por refatora-handlers.mjs a partir de modules/auth.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('modules-auth', {
  // onclick="finalizarOnboarding(this.dataset.id, this.dataset.email)"
  1: function (event, a) {
    finalizarOnboarding(this.dataset.id, this.dataset.email)
  },
})
