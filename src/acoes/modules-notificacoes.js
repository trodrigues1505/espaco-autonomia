// GERADO por refatora-handlers.mjs a partir de modules/notificacoes.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('modules-notificacoes', {
  // onclick="window._notifMarcarLida('${…}')"
  1: function (event, a) {
    window._notifMarcarLida(a[0])
  },

  // onclick="window._notifMarcarTodasLidas()"
  2: function (event, a) {
    window._notifMarcarTodasLidas()
  },

  // onclick="document.querySelectorAll('.notif-extra').forEach(el=>el.style.display='flex');this.style.display='none'"
  3: function (event, a) {
    document.querySelectorAll('.notif-extra').forEach(el=>el.style.display='flex');this.style.display='none'
  },
})
