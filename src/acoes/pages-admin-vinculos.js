// GERADO por refatora-handlers.mjs a partir de pages/admin/vinculos.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-vinculos', {
  // onclick="document.getElementById('modal-novo-vinculo').style.display='none'"
  1: function (event, a) {
    document.getElementById('modal-novo-vinculo').style.display='none'
  },

  // onclick="salvarNovoVinculo()"
  2: function (event, a) {
    salvarNovoVinculo()
  },

  // onclick="document.getElementById('modal-editar-vinculo').style.display='none'"
  3: function (event, a) {
    document.getElementById('modal-editar-vinculo').style.display='none'
  },

  // onclick="salvarEdicaoVinculo()"
  4: function (event, a) {
    salvarEdicaoVinculo()
  },

  // onclick="confirmarDesvincular('${…}')"
  5: function (event, a) {
    confirmarDesvincular(a[0])
  },

  // onclick="abrirEditarVinculo('${…}')"
  6: function (event, a) {
    abrirEditarVinculo(a[0])
  },

  // onclick="confirmarExcluirVinculo('${…}')"
  7: function (event, a) {
    confirmarExcluirVinculo(a[0])
  },

  // onclick="document.getElementById('modal-novo-vinculo').style.display='flex'"
  8: function (event, a) {
    document.getElementById('modal-novo-vinculo').style.display='flex'
  },

  // onchange="window._vincFiltroProf=this.value;window._rerenderVinculos()"
  9: function (event, a) {
    window._vincFiltroProf=this.value;window._rerenderVinculos()
  },

  // oninput="window._vincBusca=this.value;window._rerenderVinculos()"
  10: function (event, a) {
    window._vincBusca=this.value;window._rerenderVinculos()
  },

  // onchange="window._vincSomenteAtuais=this.checked;window._rerenderVinculos()"
  11: function (event, a) {
    window._vincSomenteAtuais=this.checked;window._rerenderVinculos()
  },

  // onclick="document.getElementById('modal-confirmar-vinc').style.display='none'"
  12: function (event, a) {
    document.getElementById('modal-confirmar-vinc').style.display='none'
  },
})
