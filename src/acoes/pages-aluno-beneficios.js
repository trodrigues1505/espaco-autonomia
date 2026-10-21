// GERADO por refatora-handlers.mjs a partir de pages/aluno/beneficios.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-aluno-beneficios', {
  // onclick="navigate('aluno-grade')"
  1: function (event, a) {
    navigate('aluno-grade')
  },

  // onclick="document.getElementById('_ea-lightbox').remove()"
  2: function (event, a) {
    document.getElementById('_ea-lightbox').remove()
  },

  // onclick="_abrirLightbox(this.dataset.src, this.dataset.nome)"
  3: function (event, a) {
    _abrirLightbox(this.dataset.src, this.dataset.nome)
  },

  // onerror="this.parentElement.style.display='none'"
  4: function (event, a) {
    this.parentElement.style.display='none'
  },

  // onclick="window._yaSelPostura('${…}')"
  5: function (event, a) {
    window._yaSelPostura(a[0])
  },

  // onclick="window._yaOrdenar('nome')"
  6: function (event, a) {
    window._yaOrdenar('nome')
  },

  // onclick="window._yaOrdenar('data')"
  7: function (event, a) {
    window._yaOrdenar('data')
  },

  // onclick="_abrirLightbox('${…}','Sequência de āsanas')"
  8: function (event, a) {
    _abrirLightbox(a[0],'Sequência de āsanas')
  },

  // onerror="this.parentElement.parentElement.style.display='none'"
  9: function (event, a) {
    this.parentElement.parentElement.style.display='none'
  },

  // onclick="window._jnAnterior()"
  10: function (event, a) {
    window._jnAnterior()
  },

  // onclick="window._jnProximo()"
  11: function (event, a) {
    window._jnProximo()
  },

  // onclick="window._salvarJN()"
  12: function (event, a) {
    window._salvarJN()
  },

  // onclick="window._jnSelSutra('${…}')"
  13: function (event, a) {
    window._jnSelSutra(a[0])
  },
})
