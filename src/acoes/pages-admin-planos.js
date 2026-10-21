// GERADO por refatora-handlers.mjs a partir de pages/admin/planos.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-planos', {
  // onclick="document.getElementById('modal-criar-plano').style.display='none'"
  1: function (event, a) {
    document.getElementById('modal-criar-plano').style.display='none'
  },

  // onclick="salvarNovoPLano()"
  2: function (event, a) {
    salvarNovoPLano()
  },

  // onclick="abrirEditarPlano(this.dataset.tipo)"
  3: function (event, a) {
    abrirEditarPlano(this.dataset.tipo)
  },

  // onclick="document.getElementById('modal-criar-plano').style.display='flex'"
  4: function (event, a) {
    document.getElementById('modal-criar-plano').style.display='flex'
  },

  // onclick="document.getElementById('modal-editar-plano').style.display='none'"
  5: function (event, a) {
    document.getElementById('modal-editar-plano').style.display='none'
  },

  // onclick="salvarEdicaoPlano()"
  6: function (event, a) {
    salvarEdicaoPlano()
  },
})
