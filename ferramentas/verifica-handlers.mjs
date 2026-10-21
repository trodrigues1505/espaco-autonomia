#!/usr/bin/env node
/**
 * ferramentas/verifica-handlers.mjs — falha (código 1) se existir algum atributo de evento inline
 * (onclick="…", onchange="…", onerror="…" etc.) em src/**\/*.js ou no index.html.
 *
 * Por quê: a CSP do app usa  script-src 'self'  (sem 'unsafe-inline'). Um onclick="…" escrito num template
 * simplesmente NÃO executa — o botão fica morto, sem erro visível. Este verificador pega isso antes de publicar.
 *
 * Como escrever um handler novo (padrão do projeto):
 *   • elemento criado com document.createElement:  el.addEventListener('click', fn)
 *   • elemento dentro de template HTML:  <button data-h-click="meu-modulo.1" data-a-click="${esc(JSON.stringify([id]))}">
 *       e em src/acoes/meu-modulo.js:  registrar('meu-modulo', { 1: function (event, a) { editar(a[0]) } })
 *     (a função roda com this = o elemento; a[0], a[1]… são os valores do JSON)
 *   • chamar uma função global pelo nome:  data-h-click="@global" data-a-click='["nomeDaFuncao", arg1]'
 *
 * Uso:  node ferramentas/verifica-handlers.mjs        (rode na raiz do projeto)
 */
import fs from 'fs'
import path from 'path'

const raiz = process.cwd()
const EVT = /(?<![\w-])on(click|dblclick|change|input|submit|keydown|keyup|keypress|mouseover|mouseout|mouseenter|mouseleave|focus|blur|load|error|scroll|touchstart|touchend|contextmenu)\s*=\s*["']/gi
const achados = []

function varre(arquivo) {
  const texto = fs.readFileSync(arquivo, 'utf8')
  const ehHtml = arquivo.endsWith('.html')
  const linhas = texto.split('\n')
  let emComentarioHtml = false
  linhas.forEach((linha, i) => {
    if (ehHtml) {                                   // ignora o que está dentro de <!-- … -->
      let l = linha; let saida = ''
      while (l.length) {
        if (emComentarioHtml) { const f = l.indexOf('-->'); if (f < 0) { l = '' } else { emComentarioHtml = false; l = l.slice(f + 3) } }
        else { const a = l.indexOf('<!--'); if (a < 0) { saida += l; l = '' } else { saida += l.slice(0, a); emComentarioHtml = true; l = l.slice(a + 4) } }
      }
      linha = saida
    }
    if (!ehHtml && /^\s*(\/\/|\*|\/\*)/.test(linha)) return          // comentários de JS
    EVT.lastIndex = 0
    if (EVT.test(linha)) achados.push(`${path.relative(raiz, arquivo)}:${i + 1}: ${linha.trim().slice(0, 110)}`)
  })
}

function percorre(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) { if (f !== 'node_modules' && f !== 'vendor') percorre(p) }
    else if (p.endsWith('.js')) varre(p)
  }
}

if (fs.existsSync(path.join(raiz, 'src'))) percorre(path.join(raiz, 'src'))
if (fs.existsSync(path.join(raiz, 'index.html'))) varre(path.join(raiz, 'index.html'))

if (achados.length) {
  console.error(`✗ ${achados.length} atributo(s) de evento inline encontrado(s) — a CSP vai bloqueá-los:\n`)
  achados.forEach(a => console.error('  ' + a))
  console.error('\nVeja o cabeçalho deste arquivo para o padrão correto (data-h-click + registrar, ou addEventListener).')
  process.exit(1)
}
console.log('✓ nenhum atributo de evento inline em src/ nem no index.html')
