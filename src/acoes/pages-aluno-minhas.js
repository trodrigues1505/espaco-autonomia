// GERADO por refatora-handlers.mjs a partir de pages/aluno/minhas.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-aluno-minhas', {
  // onclick="cancelarMinhaConf('${…}','${…}')"
  1: function (event, a) {
    cancelarMinhaConf(a[0],a[1])
  },

  // onclick="navigate('aluno-grade');return false"
  2: function (event, a) {
    navigate('aluno-grade');return false
  },
})
