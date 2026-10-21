#!/usr/bin/env node
/**
 * ferramentas/vendor/build.mjs — gera a pasta vendor/ (bibliotecas hospedadas localmente) a partir das versões
 * EXATAS do package.json desta pasta. Só precisa de Node ≥ 20 (sem Python).
 *
 *   npm install                 instala as versões exatas
 *   npm run build               regenera ../../vendor  (e escreve vendor/VERSOES.md com hashes e datas)
 *   npm run checar              confere idade (≥ 14 dias) e se há versão nova, sem gerar nada
 *   npm run audit               vulnerabilidades conhecidas nas dependências (npm audit)
 *
 * COMO ATUALIZAR uma biblioteca: edite a versão em package.json (use uma publicada há ≥ 14 dias),
 * rode  npm install && npm run build , teste o app e publique. Os ícones Tabler são recalculados a partir do
 * código: se uma tela nova usar um ícone, basta rodar  npm run build  de novo.
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d }
const RAIZ = path.resolve(AQUI, '../..')
const SAIDA = path.resolve(val('--saida', path.join(RAIZ, 'vendor')))
const NM = path.join(AQUI, 'node_modules')
const pkg = JSON.parse(fs.readFileSync(path.join(AQUI, 'package.json'), 'utf8'))
const todas = { ...pkg.dependencies, ...pkg.devDependencies }
const instalada = n => JSON.parse(fs.readFileSync(path.join(NM, n, 'package.json'), 'utf8')).version
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const MIN_DIAS = 14
const hoje = new Date()

function dataDePublicacao(nome, versao) {
  try {
    const t = JSON.parse(execSync(`npm view ${nome} time --json`, { stdio: ['ignore', 'pipe', 'ignore'], cwd: AQUI }).toString())
    return t[versao] ? new Date(t[versao]) : null
  } catch { return null }
}

// ───────────────────────── modo --checar ─────────────────────────
if (args.includes('--checar')) {
  let problemas = 0
  for (const [nome, fixa] of Object.entries(todas)) {
    const inst = fs.existsSync(path.join(NM, nome)) ? instalada(nome) : null
    const d = dataDePublicacao(nome, fixa)
    const dias = d ? Math.floor((hoje - d) / 864e5) : null
    let ultima = '?'
    try { ultima = execSync(`npm view ${nome} version`, { stdio: ['ignore', 'pipe', 'ignore'], cwd: AQUI }).toString().trim() } catch {}
    const avisos = []
    if (inst !== fixa) { avisos.push(`instalada ${inst ?? 'nenhuma'} ≠ fixada ${fixa} (rode npm install)`); problemas++ }
    if (dias !== null && dias < MIN_DIAS) { avisos.push(`publicada há só ${dias} dia(s): espere ${MIN_DIAS}`); problemas++ }
    console.log(`${nome.padEnd(34)} fixada ${fixa.padEnd(8)} (${dias === null ? 'data n/d' : dias + ' dias'}) | última no npm: ${ultima}${ultima !== fixa && ultima !== '?' ? '  ← há versão mais nova' : ''}${avisos.length ? '  ⚠ ' + avisos.join('; ') : ''}`)
  }
  process.exit(problemas ? 1 : 0)
}

// ───────────────────────── build ─────────────────────────
const esbuild = await import('esbuild')
const { default: subsetFont } = await import('subset-font')
for (const n of Object.keys(todas)) if (!fs.existsSync(path.join(NM, n))) { console.error(`Falta ${n}. Rode: npm install`); process.exit(1) }
for (const [n, v] of Object.entries(todas)) if (instalada(n) !== v) { console.error(`${n}: instalada ${instalada(n)} ≠ fixada ${v}. Rode: npm install`); process.exit(1) }

fs.rmSync(SAIDA, { recursive: true, force: true })
for (const d of ['', 'fonts', 'tabler/fonts', 'pdfjs']) fs.mkdirSync(path.join(SAIDA, d), { recursive: true })
const log = m => console.log('  ' + m)

// 1) supabase-js → bundle ESM único
const r = await esbuild.build({
  stdin: { contents: "export { createClient } from '@supabase/supabase-js'", resolveDir: AQUI, loader: 'js' },
  bundle: true, format: 'esm', minify: true, platform: 'browser', target: 'es2020', legalComments: 'none',
  outfile: path.join(SAIDA, 'supabase-js.js'), metafile: true, logLevel: 'error',
})
log(`supabase-js.js  ${Math.round(fs.statSync(path.join(SAIDA, 'supabase-js.js')).size / 1024)} KB`)
const pacotes = new Set()
for (const f of Object.keys(r.metafile.inputs)) { const m = f.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/); if (m) pacotes.add(m[1]) }
const licencas = []
for (const p of [...pacotes].sort()) {
  const dir = path.join(NM, p)
  const lic = fs.readdirSync(dir).find(f => /^licen[cs]e/i.test(f))
  if (lic) licencas.push(`===== ${p} =====\n${fs.readFileSync(path.join(dir, lic), 'utf8').trim()}\n`)
}
fs.writeFileSync(path.join(SAIDA, 'LICENCAS-supabase-js.txt'), 'Licenças dos pacotes incluídos no bundle vendor/supabase-js.js (preservadas conforme exigido pelas licenças).\n\n' + licencas.join('\n'))

// 2) pdf.js
for (const f of ['pdf.min.mjs', 'pdf.worker.min.mjs']) fs.copyFileSync(path.join(NM, 'pdfjs-dist/build', f), path.join(SAIDA, 'pdfjs', f))
fs.copyFileSync(path.join(NM, 'pdfjs-dist/LICENSE'), path.join(SAIDA, 'pdfjs/LICENSE.txt'))
log('pdfjs/ copiado')

// 3) fontes de texto: latin + latin-ext (diacríticos do sânscrito: ā ś ṇ ṃ ñ…)
const FAIXAS = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
}
const FAMILIAS = [
  ['dm-sans', 'DM Sans', [[300, 'normal'], [400, 'normal'], [500, 'normal']]],
  ['cormorant-garamond', 'Cormorant Garamond', [[400, 'normal'], [500, 'normal'], [600, 'normal'], [400, 'italic']]],
]
const css = ['/* Fontes hospedadas localmente (substituem o Google Fonts). latin-ext cobre os diacríticos do sânscrito (ā ś ṇ ṃ ñ…). */']
let nFontes = 0
for (const [pacote, nome, pesos] of FAMILIAS) for (const [peso, estilo] of pesos) for (const sub of ['latin-ext', 'latin']) {
  const arq = `${pacote}-${sub}-${peso}-${estilo}.woff2`
  fs.copyFileSync(path.join(NM, '@fontsource', pacote, 'files', arq), path.join(SAIDA, 'fonts', arq)); nFontes++
  css.push(`@font-face{font-family:'${nome}';font-style:${estilo};font-weight:${peso};font-display:swap;src:url('./${arq}') format('woff2');unicode-range:${FAIXAS[sub]}}`)
}
fs.writeFileSync(path.join(SAIDA, 'fonts/fonts.css'), css.join('\n') + '\n')
const ofl = FAMILIAS.map(([p]) => { const f = fs.readdirSync(path.join(NM, '@fontsource', p)).find(x => /^licen[cs]e/i.test(x)); return f ? `===== ${p} (SIL Open Font License 1.1) =====\n${fs.readFileSync(path.join(NM, '@fontsource', p, f), 'utf8').trim()}\n` : '' })
fs.writeFileSync(path.join(SAIDA, 'fonts/LICENCA-fontes.txt'), ofl.join('\n'))
log(`fonts/ ${nFontes} arquivos woff2`)

// 4) ícones Tabler: SUBCONJUNTO dos ícones usados no código (nome literal ti-xxx ou texto solto 'xxx' que seja nome de ícone)
const T = path.join(NM, '@tabler/icons-webfont/dist')
const cssTabler = fs.readFileSync(path.join(T, 'tabler-icons.min.css'), 'utf8')
const mapa = new Map([...cssTabler.matchAll(/\.ti-([a-z0-9-]+):before\{content:"\\([0-9a-f]+)"\}/g)].map(m => [m[1], m[2]]))
const fontes = []
;(function rec(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!['node_modules', 'vendor', '.git'].includes(f)) rec(p) } else if (p.endsWith('.js') || p.endsWith('.html')) fontes.push(p) } })(RAIZ)
const usados = new Set(), soTexto = new Set()
for (const f of fontes) {
  const t = fs.readFileSync(f, 'utf8')
  for (const m of t.matchAll(/ti-([a-z0-9]+(?:-[a-z0-9]+)*)/g)) if (mapa.has(m[1])) usados.add(m[1])
  for (const m of t.matchAll(/['"`]([a-z0-9]+(?:-[a-z0-9]+)*)['"`]/g)) if (mapa.has(m[1]) && !usados.has(m[1])) soTexto.add(m[1])
}
const todos = [...new Set([...usados, ...soTexto])].sort()
const pontos = [...new Set(todos.map(n => parseInt(mapa.get(n), 16)))].sort((a, b) => a - b)
const fonteOrig = fs.readFileSync(path.join(T, 'fonts/tabler-icons.woff2'))
const reduzida = await subsetFont(fonteOrig, String.fromCodePoint(...pontos), { targetFormat: 'woff2' })
fs.writeFileSync(path.join(SAIDA, 'tabler/fonts/tabler-icons.woff2'), reduzida)
const base = cssTabler.match(/\.ti\{[^}]*\}/)[0]
fs.writeFileSync(path.join(SAIDA, 'tabler/tabler-icons.min.css'),
  `/*! Tabler Icons ${instalada('@tabler/icons-webfont')} (subconjunto) — MIT — https://tabler.io · gerado a partir dos ícones usados no código */` +
  '@font-face{font-family:"tabler-icons";font-style:normal;font-weight:400;font-display:block;src:url("./fonts/tabler-icons.woff2") format("woff2")}' +
  base + todos.map(n => `.ti-${n}:before{content:"\\${mapa.get(n)}"}`).join('') + '\n')
fs.copyFileSync(path.join(NM, '@tabler/icons-webfont/LICENSE'), path.join(SAIDA, 'tabler/LICENSE.txt'))
log(`tabler/ ${todos.length} ícones (${usados.size} com prefixo ti-, ${soTexto.size} só como texto) | fonte ${Math.round(reduzida.length / 1024)} KB (original ${Math.round(fonteOrig.length / 1024)} KB)`)

// 5) VERSOES.md
const linhasV = ['# vendor/ — bibliotecas hospedadas localmente', '',
  `Gerado por ferramentas/vendor/build.mjs em ${hoje.toISOString().slice(0, 10)}. Nenhum recurso de terceiro é carregado em tempo de execução (exceto conteúdo do usuário: imagens, vídeos, WhatsApp).`,
  `Regra de versão: pacotes com no mínimo ${MIN_DIAS} dias de publicação (confira com  npm run checar ).`, '',
  '| Arquivo(s) | Pacote (npm) | Versão | Publicada | Observação |', '|---|---|---|---|---|']
const fmt = (n, obs, arq) => { const v = instalada(n); const d = dataDePublicacao(n, v); return `| ${arq} | ${n} | ${v} | ${d ? d.toISOString().slice(0, 10) : 'n/d'} | ${obs} |` }
linhasV.push(fmt('@supabase/supabase-js', 'bundle ESM único (esbuild)', 'supabase-js.js'))
linhasV.push(fmt('pdfjs-dist', 'Apache-2.0', 'pdfjs/'))
linhasV.push(fmt('@tabler/icons-webfont', `SUBCONJUNTO: ${todos.length} ícones usados no código; MIT`, 'tabler/'))
linhasV.push(fmt('@fontsource/dm-sans', 'latin + latin-ext; SIL OFL 1.1', 'fonts/'))
linhasV.push(fmt('@fontsource/cormorant-garamond', 'latin + latin-ext; SIL OFL 1.1', 'fonts/'))
linhasV.push('', '## Atualizar', 'Edite a versão em ferramentas/vendor/package.json, rode  npm install && npm run build , teste e publique.',
  'Ícone novo em uma tela? Rode  npm run build  (o subconjunto é recalculado a partir do código).', '', '## Hashes SHA-256', '')
;(function rec(d) { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) rec(p); else if (f !== 'VERSOES.md') linhasV.push(`- \`${path.relative(SAIDA, p)}\` — ${Math.round(fs.statSync(p).size / 1024)} KB — \`${sha(fs.readFileSync(p))}\``) } })(SAIDA)
fs.writeFileSync(path.join(SAIDA, 'VERSOES.md'), linhasV.join('\n') + '\n')
log('VERSOES.md escrito')
console.log(`\nOK → ${SAIDA}`)
