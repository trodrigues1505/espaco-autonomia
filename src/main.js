/**
 * src/main.js — ponto de entrada do app (antes: <script type="module"> inline no index.html).
 * Mantido em arquivo próprio para que a CSP possa proibir scripts inline (script-src 'self').
 */
import './modules/acoes.js'            // despacho de eventos por delegação (precisa vir antes de tudo)
import './acoes/index-html.js'         // handlers dos elementos estáticos do index.html
import { initLGPD }    from './modules/lgpd.js'
import { initPWA }     from './modules/pwa.js'
import './modules/privacidade.js'      // registra window.abrirPolitica
import { initSession } from './modules/auth.js'
import './pages/index.js'              // registra window.navigate
import './modules/lista-responsiva.js' // listas em tabela viram cartões no celular

initLGPD()
initPWA()
initSession()                          // onAuthStateChange com INITIAL_SESSION cuida do resto

// Imagens que já falharam ANTES do despachador existir (o evento error não borbulha e já passou): reaplica.
document.querySelectorAll('img[data-h-error]').forEach(img => {
  if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event('error'))
})
