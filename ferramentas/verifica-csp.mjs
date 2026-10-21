#!/usr/bin/env node
/**
 * ferramentas/verifica-csp.mjs — confere a CSP do index.html contra o código. Falha (código 1) se:
 *   • script-src tiver 'unsafe-inline' / 'unsafe-eval' ou algum host externo;
 *   • img-src/media-src do <meta> forem diferentes de HOSTS_IMAGEM/HOSTS_MIDIA em src/modules/utils.js
 *     (se divergirem, imagens ficam quebradas sem aviso, ou a proteção contra envio de dados some);
 *   • faltar object-src 'none', base-uri 'self' ou form-action 'self';
 *   • o index.html tiver <script> inline (sem src).
 * Uso:  node ferramentas/verifica-csp.mjs   (na raiz do projeto)
 */
import fs from 'fs'
const html = fs.readFileSync('index.html', 'utf8')
const utils = fs.readFileSync('src/modules/utils.js', 'utf8')
const erros = []

const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)
if (!meta) { console.error('✗ <meta Content-Security-Policy> não encontrado em index.html'); process.exit(1) }
const dir = {}
for (const parte of meta[1].split(';')) { const [nome, ...v] = parte.trim().split(/\s+/); if (nome) dir[nome] = v }

const scriptSrc = dir['script-src'] || []
if (scriptSrc.some(v => /unsafe-/.test(v))) erros.push(`script-src permite ${scriptSrc.filter(v => /unsafe-/.test(v)).join(' ')}`)
if (scriptSrc.some(v => /^https?:/.test(v))) erros.push('script-src permite host externo: ' + scriptSrc.filter(v => /^https?:/.test(v)).join(' '))
for (const [d, esperado] of [['object-src', "'none'"], ['base-uri', "'self'"], ['form-action', "'self'"]])
  if (!(dir[d] || []).includes(esperado)) erros.push(`${d} deveria conter ${esperado}`)
if (/<script(?![^>]*\ssrc=)[^>]*>/i.test(html.replace(/<!--[\s\S]*?-->/g, ''))) erros.push('há <script> inline no index.html (a CSP o bloqueia)')

const lista = nome => {
  const m = utils.match(new RegExp(`export const ${nome}\\s*=\\s*\\[([^\\]]*)\\]`))
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]).sort() : null
}
for (const [dirNome, arr] of [['img-src', 'HOSTS_IMAGEM'], ['media-src', 'HOSTS_MIDIA']]) {
  const noCsp = (dir[dirNome] || []).filter(v => /^https:\/\//.test(v)).map(v => v.replace('https://', '')).sort()
  const noCodigo = lista(arr)
  if (!noCodigo) erros.push(`${arr} não encontrado em src/modules/utils.js`)
  else if (JSON.stringify(noCsp) !== JSON.stringify(noCodigo))
    erros.push(`${dirNome} (CSP) = [${noCsp.join(', ')}]  ≠  ${arr} (utils.js) = [${noCodigo.join(', ')}]`)
}
if (erros.length) { console.error('✗ CSP inconsistente:\n  ' + erros.join('\n  ')); process.exit(1) }
console.log('✓ CSP consistente: script-src sem unsafe-inline, hosts de imagem/mídia iguais ao código, object/base/form ok')
