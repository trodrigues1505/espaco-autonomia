// GERADO por refatora-handlers.mjs a partir de pages/aluno/home.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-aluno-home', {
  // onclick="navigate('nossa-pratica');return false"
  1: function (event, a) {
    navigate('nossa-pratica');return false
  },

  // onclick="navigate('aluno-beneficio-asana-marga');return false"
  2: function (event, a) {
    navigate('aluno-beneficio-asana-marga');return false
  },

  // onclick="navigate('aluno-beneficio-sangha');return false"
  3: function (event, a) {
    navigate('aluno-beneficio-sangha');return false
  },

  // onclick="navigate('aluno-grade');return false"
  4: function (event, a) {
    navigate('aluno-grade');return false
  },

  // onclick="cancelarConfHome('${…}','${…}')"
  5: function (event, a) {
    cancelarConfHome(a[0],a[1])
  },

  // onclick="this.closest('[data-pwa]').style.display='none';localStorage.setItem('pwa-instalado','1')"
  6: function (event, a) {
    this.closest('[data-pwa]').style.display='none';localStorage.setItem('pwa-instalado','1')
  },

  // onclick="instalarAppAgora()"
  7: function (event, a) {
    instalarAppAgora()
  },

  // onclick="mostrarDicaIOS()"
  8: function (event, a) {
    mostrarDicaIOS()
  },

  // onclick="window._reiniciarTourDharmaPhala(${…})"
  9: function (event, a) {
    window._reiniciarTourDharmaPhala(a[0])
  },

  // onclick="navigate('aluno-grade')"
  10: function (event, a) {
    navigate('aluno-grade')
  },

  // onclick="navigate('aluno-conquistas')"
  11: function (event, a) {
    navigate('aluno-conquistas')
  },
})
