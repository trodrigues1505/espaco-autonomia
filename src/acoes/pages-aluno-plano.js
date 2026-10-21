// GERADO por refatora-handlers.mjs a partir de pages/aluno/plano.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-aluno-plano', {
  // onclick="toggleBeneficio('${…}')"
  1: function (event, a) {
    toggleBeneficio(a[0])
  },

  // onclick="abrirEditarPerfil()"
  2: function (event, a) {
    abrirEditarPerfil()
  },

  // onclick="document.getElementById('modal-editar-perfil').style.display='none'"
  3: function (event, a) {
    document.getElementById('modal-editar-perfil').style.display='none'
  },

  // onclick="salvarEdicaoPerfil()"
  4: function (event, a) {
    salvarEdicaoPerfil()
  },
})
