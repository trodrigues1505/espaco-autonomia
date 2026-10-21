// GERADO a partir dos atributos on*="…" do index.html (HTML estático). Funções chamadas como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('index', {
  // onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
  1: function (event, a) {
    this.style.display='none';this.nextElementSibling.style.display='block'
  },

  // onclick="window.fazerLogin()"
  2: function (event, a) {
    window.fazerLogin()
  },

  // onclick="window.abrirPolitica(); return false"
  3: function (event, a) {
    window.abrirPolitica(); return false
  },

  // onerror="this.style.display='none'"
  4: function (event, a) {
    this.style.display='none'
  },

  // onclick="window.impersonar('admin')"
  5: function (event, a) {
    window.impersonar('admin')
  },

  // onclick="window.impersonar('professor')"
  6: function (event, a) {
    window.impersonar('professor')
  },

  // onclick="window.impersonar('aluno')"
  7: function (event, a) {
    window.impersonar('aluno')
  },

  // onclick="window.fazerLogout()"
  8: function (event, a) {
    window.fazerLogout()
  },

  // onclick="window.lgpdAceitar()"
  9: function (event, a) {
    window.lgpdAceitar()
  },

  // onclick="window.fecharModalCancelarAula()"
  10: function (event, a) {
    window.fecharModalCancelarAula()
  },

  // onclick="window.confirmarCancelamentoAula()"
  11: function (event, a) {
    window.confirmarCancelamentoAula()
  },

  // onclick="window.dispensarPWA()"
  12: function (event, a) {
    window.dispensarPWA()
  },

  // onclick="window.instalarPWA()"
  13: function (event, a) {
    window.instalarPWA()
  },

})
