// GERADO por refatora-handlers.mjs a partir de pages/admin/pagamentos.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-pagamentos', {
  // onclick="window._pgMes='${…}';window._pgFiltro='TODOS';window._rerenderPagamentos()"
  1: function (event, a) {
    window._pgMes=a[0];window._pgFiltro='TODOS';window._rerenderPagamentos()
  },

  // onclick="window._pgFiltro='${…}';window._rerenderPagamentos()"
  2: function (event, a) {
    window._pgFiltro=a[0];window._rerenderPagamentos()
  },

  // onclick="window._pgDe='';window._pgAte='';window._rerenderPagamentos()"
  3: function (event, a) {
    window._pgDe='';window._pgAte='';window._rerenderPagamentos()
  },

  // onclick="abrirPerfilAlunoPg('${…}')"
  4: function (event, a) {
    abrirPerfilAlunoPg(a[0])
  },

  // onchange="window._pgPlano=this.value;window._rerenderPagamentos()"
  5: function (event, a) {
    window._pgPlano=this.value;window._rerenderPagamentos()
  },

  // onclick="abrirSyncAsaas()"
  6: function (event, a) {
    abrirSyncAsaas()
  },

  // onclick="window._pgFiltro='RECEIVED';window._rerenderPagamentos()"
  7: function (event, a) {
    window._pgFiltro='RECEIVED';window._rerenderPagamentos()
  },

  // onclick="window._pgFiltro='PENDING';window._rerenderPagamentos()"
  8: function (event, a) {
    window._pgFiltro='PENDING';window._rerenderPagamentos()
  },

  // onclick="window._pgFiltro='OVERDUE';window._rerenderPagamentos()"
  9: function (event, a) {
    window._pgFiltro='OVERDUE';window._rerenderPagamentos()
  },

  // onchange="window._pgDe=this.value;window._rerenderPagamentos()"
  10: function (event, a) {
    window._pgDe=this.value;window._rerenderPagamentos()
  },

  // onchange="window._pgAte=this.value;window._rerenderPagamentos()"
  11: function (event, a) {
    window._pgAte=this.value;window._rerenderPagamentos()
  },

  // onclick="window._pgSort=window._pgSort==='nome_asc'?'nome_desc':'nome_asc';window._rerenderPagamentos()"
  12: function (event, a) {
    window._pgSort=window._pgSort==='nome_asc'?'nome_desc':'nome_asc';window._rerenderPagamentos()
  },

  // onclick="window._pgSort=window._pgSort==='data_asc'?'data_desc':'data_asc';window._rerenderPagamentos()"
  13: function (event, a) {
    window._pgSort=window._pgSort==='data_asc'?'data_desc':'data_asc';window._rerenderPagamentos()
  },

  // onclick="window._pgSort=window._pgSort==='valor_asc'?'valor_desc':'valor_asc';window._rerenderPagamentos()"
  14: function (event, a) {
    window._pgSort=window._pgSort==='valor_asc'?'valor_desc':'valor_asc';window._rerenderPagamentos()
  },

  // onclick="window._pgSort=window._pgSort==='status_asc'?'status_desc':'status_asc';window._rerenderPagamentos()"
  15: function (event, a) {
    window._pgSort=window._pgSort==='status_asc'?'status_desc':'status_asc';window._rerenderPagamentos()
  },

  // onclick="document.getElementById('modal-pg-aluno').style.display='none'"
  16: function (event, a) {
    document.getElementById('modal-pg-aluno').style.display='none'
  },

  // onclick="document.getElementById('modal-sync-asaas').style.display='none'"
  17: function (event, a) {
    document.getElementById('modal-sync-asaas').style.display='none'
  },

  // onclick="executarSyncAsaas()"
  18: function (event, a) {
    executarSyncAsaas()
  },

  // onclick="document.getElementById('modal-pg-aluno').style.display='none';window._pendingEditAluno='${…}';window._abaAlun"
  19: function (event, a) {
    document.getElementById('modal-pg-aluno').style.display='none';window._pendingEditAluno=a[0];window._abaAlunos='alunos';navigate('alunos')
  },
})
