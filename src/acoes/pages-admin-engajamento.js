// GERADO por refatora-handlers.mjs a partir de pages/admin/engajamento.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-engajamento', {
  // onclick="window._engSort='${…}';window._rerenderEngajamento()"
  1: function (event, a) {
    window._engSort=a[0];window._rerenderEngajamento()
  },

  // onclick="window._abrirDetalheEngajamento('${…}')"
  2: function (event, a) {
    window._abrirDetalheEngajamento(a[0])
  },

  // onclick="window._gerarRelatorioEngajamento()"
  3: function (event, a) {
    window._gerarRelatorioEngajamento()
  },

  // onclick="document.getElementById('modal-detalhe-engajamento').style.display='none'"
  4: function (event, a) {
    document.getElementById('modal-detalhe-engajamento').style.display='none'
  },
})
