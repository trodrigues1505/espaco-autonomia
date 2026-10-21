#!/usr/bin/env node
/**
 * ferramentas/verifica-sintaxe.mjs — confere a sintaxe de TODOS os .js de src/ como módulo ES (node --check não é confiável
 * para módulos em .js). Precisa do pacote acorn:  npm install --no-save acorn@8  (o CI faz isso).
 */
import fs from 'fs'
import path from 'path'
import * as acorn from 'acorn'

let total = 0, erros = 0
function percorre(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) { if (f !== 'node_modules') percorre(p); continue }
    if (!p.endsWith('.js')) continue
    total++
    try { acorn.parse(fs.readFileSync(p, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' }) }
    catch (e) { erros++; console.error(`✗ ${p}: ${e.message}`) }
  }
}
percorre(path.join(process.cwd(), 'src'))
if (fs.existsSync('sw.js')) { total++; try { acorn.parse(fs.readFileSync('sw.js', 'utf8'), { ecmaVersion: 'latest', sourceType: 'script' }) } catch (e) { erros++; console.error('✗ sw.js: ' + e.message) } }
if (erros) { console.error(`\n${erros} arquivo(s) com erro de sintaxe de ${total}`); process.exit(1) }
console.log(`✓ ${total} arquivos .js sem erro de sintaxe`)
