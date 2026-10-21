// GERADO por refatora-handlers.mjs a partir de pages/admin/repasse-pago.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-repasse-pago', {
  // onclick="window._editarRepasse(this.dataset.id, this.dataset.prof, this.dataset.nome, this.dataset.mes, ${…}, ${…}, thi"
  1: function (event, a) {
    window._editarRepasse(this.dataset.id, this.dataset.prof, this.dataset.nome, this.dataset.mes, a[0], a[1], this.dataset.obs)
  },

  // onclick="window._excluirRepasse('${…}')"
  2: function (event, a) {
    window._excluirRepasse(a[0])
  },

  // onclick="document.getElementById('modal-repasse-pago').style.display='none'"
  3: function (event, a) {
    document.getElementById('modal-repasse-pago').style.display='none'
  },

  // onclick="window._salvarRepasse()"
  4: function (event, a) {
    window._salvarRepasse()
  },
})
