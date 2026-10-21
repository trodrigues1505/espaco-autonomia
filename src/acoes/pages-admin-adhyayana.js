// GERADO por refatora-handlers.mjs a partir de pages/admin/adhyayana.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-adhyayana', {
  // onclick="document.getElementById('_adhy-lightbox').remove()"
  1: function (event, a) {
    document.getElementById('_adhy-lightbox').remove()
  },

  // onclick="reagendarAsanaAdhyayana('${…}')"
  2: function (event, a) {
    reagendarAsanaAdhyayana(a[0])
  },

  // onclick="previaAdhyayana('${…}')"
  3: function (event, a) {
    previaAdhyayana(a[0])
  },

  // onclick="editarAdhyayana('${…}')"
  4: function (event, a) {
    editarAdhyayana(a[0])
  },

  // onclick="excluirAdhyayana(this.dataset.id, this.dataset.nome)"
  5: function (event, a) {
    excluirAdhyayana(this.dataset.id, this.dataset.nome)
  },

  // onclick="abrirFormAdhyayana()"
  6: function (event, a) {
    abrirFormAdhyayana()
  },

  // onclick="document.getElementById('modal-previa-adhyayana').style.display='none'"
  7: function (event, a) {
    document.getElementById('modal-previa-adhyayana').style.display='none'
  },

  // onclick="fecharFormAdhyayana()"
  8: function (event, a) {
    fecharFormAdhyayana()
  },

  // onclick="interpretarComIAAdhyayana()"
  9: function (event, a) {
    interpretarComIAAdhyayana()
  },

  // onclick="_abrirLightboxAdhy(this.dataset.src, this.dataset.nome)"
  10: function (event, a) {
    _abrirLightboxAdhy(this.dataset.src, this.dataset.nome)
  },

  // onclick="salvarAdhyayana()"
  11: function (event, a) {
    salvarAdhyayana()
  },

  // onclick="adhyAvancarStep()"
  12: function (event, a) {
    adhyAvancarStep()
  },
})
