// GERADO por refatora-handlers.mjs a partir de pages/admin/jnana.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-jnana', {
  // onclick="reagendarSutra('${…}')"
  1: function (event, a) {
    reagendarSutra(a[0])
  },

  // onclick="previaSutra('${…}')"
  2: function (event, a) {
    previaSutra(a[0])
  },

  // onclick="editarSutra('${…}')"
  3: function (event, a) {
    editarSutra(a[0])
  },

  // onclick="excluirSutra(this.dataset.id, this.dataset.rotulo)"
  4: function (event, a) {
    excluirSutra(this.dataset.id, this.dataset.rotulo)
  },

  // onclick="abrirFormJnana()"
  5: function (event, a) {
    abrirFormJnana()
  },

  // onclick="fecharFormJnana()"
  6: function (event, a) {
    fecharFormJnana()
  },

  // onclick="interpretarComIA()"
  7: function (event, a) {
    interpretarComIA()
  },

  // onclick="document.getElementById('modal-previa-jnana').remove()"
  8: function (event, a) {
    document.getElementById('modal-previa-jnana').remove()
  },

  // onclick="voltarEtapa1()"
  9: function (event, a) {
    voltarEtapa1()
  },

  // onclick="salvarSutra()"
  10: function (event, a) {
    salvarSutra()
  },
})
