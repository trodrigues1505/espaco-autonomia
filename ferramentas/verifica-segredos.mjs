#!/usr/bin/env node
/**
 * ferramentas/verifica-segredos.mjs — falha (código 1) se o projeto contiver dados pessoais ou chaves secretas.
 * Procura: CPF e RG formatados, chave do Asaas ($aact_…), chave da Groq (gsk_…), chaves sk-…, e JWT com papel
 * service_role (a chave "anon" é PÚBLICA por desenho e é permitida).
 * Roda no CI a cada push (.github/workflows/verificacoes.yml) e à mão:  node ferramentas/verifica-segredos.mjs
 * (O histórico antigo é outro assunto: ver ferramentas/limpar-historico.sh.)
 */
import fs from 'fs'
import path from 'path'

const raiz = process.cwd()
const IGNORAR = new Set(['node_modules', '.git', 'vendor'])
const REGRAS = [
  { nome: 'CPF formatado', rx: /(?<!\d)\d{3}\.\d{3}\.\d{3}-\d{2}(?!\d)/g, ok: m => !/^(\d)\1{2}\.\1{3}\.\1{3}-\1{2}$/.test(m) },   // ok() = "é violação"; ***.***.***-** (máscara) é permitido
  { nome: 'RG formatado', rx: /(?<!\d)\d{1,2}\.\d{3}\.\d{3}-[\dXx](?!\d)/g, ok: m => !/^(\d)\1?\.\1{3}\.\1{3}-\1$/.test(m) },
  { nome: 'chave do Asaas', rx: /\$aact_[A-Za-z0-9_=-]{20,}/g },
  { nome: 'chave da Groq', rx: /gsk_[A-Za-z0-9]{20,}/g },
  { nome: 'chave sk-…', rx: /sk-[A-Za-z0-9]{30,}/g },
  { nome: 'JWT service_role', rx: /eyJ[A-Za-z0-9_-]{15,}\.([A-Za-z0-9_-]{15,})\.[A-Za-z0-9_-]{10,}/g,
    ok: (m, g) => { try { const p = g[1] + '='.repeat((4 - g[1].length % 4) % 4); return JSON.parse(Buffer.from(p, 'base64url').toString()).role === 'service_role' } catch { return false } } },   // só é violação se o papel for service_role
]
const achados = []

function varre(arq) {
  let texto
  try { texto = fs.readFileSync(arq, 'utf8') } catch { return }
  if (texto.includes('\u0000')) return                                    // binário
  texto.split('\n').forEach((linha, i) => {
    for (const r of REGRAS) {
      r.rx.lastIndex = 0
      for (const m of linha.matchAll(r.rx)) {
        if (r.ok && !r.ok(m[0], m)) continue
        achados.push(`${path.relative(raiz, arq)}:${i + 1}  [${r.nome}]  ${m[0].slice(0, 3)}…${m[0].slice(-2)}`)   // mascarado
      }
    }
  })
}
function percorre(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (IGNORAR.has(f)) continue
    const p = path.join(dir, f), st = fs.statSync(p)
    if (st.isDirectory()) percorre(p)
    else if (st.size < 2_000_000 && !/\.(png|jpe?g|gif|webp|woff2?|ttf|zip|pdf)$/i.test(f)) varre(p)
  }
}
percorre(raiz)
if (achados.length) {
  console.error(`✗ ${achados.length} possível(is) dado(s) pessoal(is) ou segredo(s) (valores mascarados):\n`)
  achados.forEach(a => console.error('  ' + a))
  console.error('\nTire do código (use secrets do Supabase/GitHub). Se já foi commitado, use ferramentas/limpar-historico.sh e TROQUE a chave.')
  process.exit(1)
}
console.log('✓ nenhum CPF, RG ou chave secreta encontrado')
