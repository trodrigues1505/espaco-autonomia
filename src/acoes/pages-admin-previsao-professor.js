// GERADO por refatora-handlers.mjs a partir de pages/admin/previsao-professor.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-previsao-professor', {
  // onclick="window._ppMes='${…}';navigate('previsao-professor')"
  1: function (event, a) {
    window._ppMes=a[0];navigate('previsao-professor')
  },

  // onclick="abrirModalRegistrarRepasse(this.dataset.prof, this.dataset.nome, ${…}, this.dataset.mes)"
  2: function (event, a) {
    abrirModalRegistrarRepasse(this.dataset.prof, this.dataset.nome, a[0], this.dataset.mes)
  },

  // onchange="window._ppProfId=this.value;navigate('previsao-professor')"
  3: function (event, a) {
    window._ppProfId=this.value;navigate('previsao-professor')
  },
})
