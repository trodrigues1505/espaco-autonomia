// GERADO por refatora-handlers.mjs a partir de pages/aluno/grantha.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-aluno-grantha', {
  // onclick="window._granthaSelId='${…}';navigate('grantha-aluno')"
  1: function (event, a) {
    window._granthaSelId=a[0];navigate('grantha-aluno')
  },

  // onclick="window._granthaSelId=null;navigate('grantha-aluno')"
  2: function (event, a) {
    window._granthaSelId=null;navigate('grantha-aluno')
  },

  // onclick="window._granthaCapituloOrdem=${…};navigate('grantha-aluno')"
  3: function (event, a) {
    window._granthaCapituloOrdem=a[0];navigate('grantha-aluno')
  },
})
