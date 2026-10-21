// GERADO por refatora-handlers.mjs a partir de pages/admin/grantha.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-grantha', {
  // onclick="abrirVersos(this.dataset.id, this.dataset.titulo)"
  1: function (event, a) {
    abrirVersos(this.dataset.id, this.dataset.titulo)
  },

  // onclick="editarGrantha('${…}')"
  2: function (event, a) {
    editarGrantha(a[0])
  },

  // onclick="excluirGrantha(this.dataset.id, this.dataset.titulo)"
  3: function (event, a) {
    excluirGrantha(this.dataset.id, this.dataset.titulo)
  },

  // onclick="abrirFormGrantha()"
  4: function (event, a) {
    abrirFormGrantha()
  },

  // onclick="document.getElementById('modal-grantha').style.display='none'"
  5: function (event, a) {
    document.getElementById('modal-grantha').style.display='none'
  },

  // onchange="toggleTipoGrantha()"
  6: function (event, a) {
    toggleTipoGrantha()
  },

  // onclick="salvarGrantha()"
  7: function (event, a) {
    salvarGrantha()
  },

  // onclick="document.getElementById('modal-versos').style.display='none'"
  8: function (event, a) {
    document.getElementById('modal-versos').style.display='none'
  },

  // onclick="importarVersosJson()"
  9: function (event, a) {
    importarVersosJson()
  },

  // onclick="excluirVerso('${…}')"
  10: function (event, a) {
    excluirVerso(a[0])
  },
})
