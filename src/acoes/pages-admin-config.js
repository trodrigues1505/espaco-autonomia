// GERADO por refatora-handlers.mjs a partir de pages/admin/config.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-config', {
  // onclick="salvarConfig()"
  1: function (event, a) {
    salvarConfig()
  },

  // onclick="sincronizarFeriados()"
  2: function (event, a) {
    sincronizarFeriados()
  },

  // onclick="previewImportAsaas()"
  3: function (event, a) {
    previewImportAsaas()
  },

  // onclick="executarImportAsaas()"
  4: function (event, a) {
    executarImportAsaas()
  },
})
