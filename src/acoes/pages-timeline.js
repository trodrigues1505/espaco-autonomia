// GERADO por refatora-handlers.mjs a partir de pages/timeline.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-timeline', {
  // onclick="document.getElementById('_tl-lightbox').remove()"
  1: function (event, a) {
    document.getElementById('_tl-lightbox').remove()
  },

  // onclick="document.getElementById('modal-criar-enquete').style.display='none'"
  2: function (event, a) {
    document.getElementById('modal-criar-enquete').style.display='none'
  },

  // onclick="document.getElementById('modal-votos-enquete').style.display='none'"
  3: function (event, a) {
    document.getElementById('modal-votos-enquete').style.display='none'
  },

  // onclick="document.getElementById('modal-lista-pessoas').style.display='none'"
  4: function (event, a) {
    document.getElementById('modal-lista-pessoas').style.display='none'
  },

  // onclick="window._abrirListaPessoas('curtidas','${…}','Quem curtiu')"
  5: function (event, a) {
    window._abrirListaPessoas('curtidas',a[0],'Quem curtiu')
  },

  // onclick="window._abrirListaPessoas('salvos','${…}','Quem salvou')"
  6: function (event, a) {
    window._abrirListaPessoas('salvos',a[0],'Quem salvou')
  },

  // onclick="window._abrirListaPessoas('visualizacoes','${…}','Quem visualizou')"
  7: function (event, a) {
    window._abrirListaPessoas('visualizacoes',a[0],'Quem visualizou')
  },

  // onclick="window._tlAbrirLightbox('${…}')"
  8: function (event, a) {
    window._tlAbrirLightbox(a[0])
  },

  // onerror="this.parentElement.remove()"
  9: function (event, a) {
    this.parentElement.remove()
  },
})
