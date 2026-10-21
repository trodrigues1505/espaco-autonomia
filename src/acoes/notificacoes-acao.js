// Handler do botão de ação dos avisos (antes: onclick="window._ocPresencaId='…';navigate('…')" montado em _acaoOnclick()).
import { registrar } from '../modules/acoes.js'

registrar('notificacoes', {
  acao: function (event, a) {
    if (a[0]) window._ocPresencaId = String(a[0])
    navigate(String(a[1]))
  },
})
