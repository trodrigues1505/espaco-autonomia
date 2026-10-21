/**
 * src/antiframe.js — defesa contra clickjacking (o app embutido em um <iframe> de outro site).
 * O GitHub Pages não permite o cabeçalho HTTP "frame-ancestors" e ele não funciona em <meta>, então:
 *   • o index.html nasce com  html{display:none}  (style#antiframe);
 *   • este script, carregado de forma SÍNCRONA no <head>, só revela a página se ela NÃO estiver dentro de um quadro;
 *   • dentro de um quadro, tenta sair dele; se o atacante usar sandbox (que bloqueia isso), a página continua escondida.
 * Defesa melhor, se um dia houver proxy (ex.: Cloudflare): cabeçalho  Content-Security-Policy: frame-ancestors 'none'.
 */
(function () {
  if (window.top === window.self) {
    var estilo = document.getElementById('antiframe')
    if (estilo && estilo.parentNode) estilo.parentNode.removeChild(estilo)
    return
  }
  try { window.top.location = window.self.location.href } catch (e) { /* bloqueado (sandbox/cross-origin): permanece escondida */ }
})()
