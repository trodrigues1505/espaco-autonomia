// GERADO por refatora-handlers.mjs a partir de pages/admin/vocabulario.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-vocabulario', {
  // onclick="editarVocab('${…}')"
  1: function (event, a) {
    editarVocab(a[0])
  },

  // onclick="excluirVocab(this.dataset.id, this.dataset.termo)"
  2: function (event, a) {
    excluirVocab(this.dataset.id, this.dataset.termo)
  },

  // onclick="abrirFormVocab()"
  3: function (event, a) {
    abrirFormVocab()
  },

  // onclick="escanearTermosNaoCatalogados()"
  4: function (event, a) {
    escanearTermosNaoCatalogados()
  },

  // onclick="processarImportacaoJson()"
  5: function (event, a) {
    processarImportacaoJson()
  },

  // onclick="document.getElementById('modal-vocab').style.display='none'"
  6: function (event, a) {
    document.getElementById('modal-vocab').style.display='none'
  },

  // onclick="salvarVocab()"
  7: function (event, a) {
    salvarVocab()
  },

  // onclick="salvarTermoEscaneado(${…}, this.dataset.termo)"
  8: function (event, a) {
    salvarTermoEscaneado(a[0], this.dataset.termo)
  },

  // onclick="document.getElementById('tnc-${…}').remove()"
  9: function (event, a) {
    document.getElementById(("tnc-" + a[0])).remove()
  },

  // onclick="exportarTermosEscaneadosJson()"
  10: function (event, a) {
    exportarTermosEscaneadosJson()
  },
})
