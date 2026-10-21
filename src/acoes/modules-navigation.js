// GERADO por refatora-handlers.mjs a partir de modules/navigation.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('modules-navigation', {
  // onclick="selecionarImpersonar('${…}','${…}')"
  1: function (event, a) {
    selecionarImpersonar(a[0],a[1])
  },

  // onmouseover="this.style.background='rgba(31,56,31,.06)'"
  2: function (event, a) {
    this.style.background='rgba(31,56,31,.06)'
  },

  // onmouseout="this.style.background='transparent'"
  3: function (event, a) {
    this.style.background='transparent'
  },

  // onclick="document.getElementById('modal-impersonar').remove()"
  4: function (event, a) {
    document.getElementById('modal-impersonar').remove()
  },
})
