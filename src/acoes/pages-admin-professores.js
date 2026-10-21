// GERADO por refatora-handlers.mjs a partir de pages/admin/professores.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-professores', {
  // onclick="window.trocarAbaProfessores('${…}')"
  1: function (event, a) {
    window.trocarAbaProfessores(a[0])
  },

  // onclick="editarProfessor('${…}')"
  2: function (event, a) {
    editarProfessor(a[0])
  },

  // onclick="document.getElementById('modal-cad-prof').style.display='flex'"
  3: function (event, a) {
    document.getElementById('modal-cad-prof').style.display='flex'
  },

  // onclick="document.getElementById('modal-cad-prof').style.display='none'"
  4: function (event, a) {
    document.getElementById('modal-cad-prof').style.display='none'
  },

  // onclick="salvarProfessor()"
  5: function (event, a) {
    salvarProfessor()
  },
})
