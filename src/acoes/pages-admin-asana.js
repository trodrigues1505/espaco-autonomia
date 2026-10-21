// GERADO por refatora-handlers.mjs a partir de pages/admin/asana.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-asana', {
  // onclick="previaAsana(${…})"
  1: function (event, a) {
    previaAsana(a[0])
  },

  // onclick="abrirEdicaoAsana(${…})"
  2: function (event, a) {
    abrirEdicaoAsana(a[0])
  },

  // onclick="abrirFormAsana(${…})"
  3: function (event, a) {
    abrirFormAsana(a[0])
  },

  // onclick="document.getElementById('modal-previa-asana').style.display='none'"
  4: function (event, a) {
    document.getElementById('modal-previa-asana').style.display='none'
  },

  // onclick="fecharFormAsana()"
  5: function (event, a) {
    fecharFormAsana()
  },

  // onclick="interpretarComIAAsana()"
  6: function (event, a) {
    interpretarComIAAsana()
  },

  // onclick="voltarEtapa1Asana()"
  7: function (event, a) {
    voltarEtapa1Asana()
  },

  // onclick="salvarAsana()"
  8: function (event, a) {
    salvarAsana()
  },
})
