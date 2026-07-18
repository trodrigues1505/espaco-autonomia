/**
 * src/modules/vocabulario.js
 * Detecta termos cadastrados no vocabulário dentro de qualquer texto já
 * renderizado no DOM e os torna clicáveis, abrindo um modal com a definição.
 *
 * Uso típico, no final de qualquer renderXxx() que mostra texto pro usuário:
 *   import { aplicarVocabulario } from '../../modules/vocabulario.js'
 *   await aplicarVocabulario(container)
 *
 * Reconhecimento é insensível a maiúscula/minúscula E a diacríticos —
 * "Sankalpa", "sankalpa" e "saṅkalpa" são tratados como o mesmo termo,
 * via normalização Unicode NFD (decompõe ā → a + macron, remove a marca).
 */

// ── Normalização ──────────────────────────────────────────────
function _normalizarDiacriticos(str) {
  return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Constrói uma versão "achatada" (sem diacríticos, minúscula) do texto E um
// mapa de índice: mapa[i] = posição no texto ORIGINAL que corresponde ao
// caractere i do texto achatado. Isso permite localizar exatamente onde,
// no texto original (com acentos), um termo casado na versão normalizada
// começa e termina.
function _construirMapa(texto) {
  let flat = ''
  const mapa = []
  for (let i = 0; i < texto.length; i++) {
    const decomposto = texto[i].normalize('NFD')
    for (const ch of decomposto) {
      if (/[\u0300-\u036f]/.test(ch)) continue
      flat += ch.toLowerCase()
      mapa.push(i)
    }
  }
  return { flat, mapa }
}

function _construirRegexVocab(termosNormalizados) {
  const unicos = [...new Set(termosNormalizados.filter(Boolean))]
  if (!unicos.length) return null
  const escapados = unicos
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length) // termos mais longos primeiro, evita casar só uma parte
  return new RegExp(`\\b(${escapados.join('|')})\\b`, 'g')
}

// ── Percorre o DOM e envolve os termos casados em <span class="voc-termo"> ──
function _percorrerEEnvolver(node, regex) {
  if (node.nodeType === Node.TEXT_NODE) {
    const texto = node.textContent
    if (!texto || !texto.trim()) return
    const { flat, mapa } = _construirMapa(texto)
    regex.lastIndex = 0
    const matches = []
    let m
    while ((m = regex.exec(flat))) {
      matches.push({ start: m.index, end: m.index + m[0].length })
      if (m.index === regex.lastIndex) regex.lastIndex++ // evita loop infinito em casos degenerados
    }
    if (!matches.length) return

    const frag = document.createDocumentFragment()
    let cursor = 0
    for (const mt of matches) {
      const origStart = mapa[mt.start]
      const origEnd = mapa[mt.end - 1] + 1
      if (origStart > cursor) frag.appendChild(document.createTextNode(texto.slice(cursor, origStart)))
      const span = document.createElement('span')
      span.className = 'voc-termo'
      const termoOriginal = texto.slice(origStart, origEnd)
      span.dataset.termo = _normalizarDiacriticos(termoOriginal)
      span.style.cssText = 'text-decoration:underline;text-decoration-style:dotted;text-decoration-color:var(--dourado, #e8bc4f);text-underline-offset:2px;cursor:help'
      span.textContent = termoOriginal
      frag.appendChild(span)
      cursor = origEnd
    }
    if (cursor < texto.length) frag.appendChild(document.createTextNode(texto.slice(cursor)))
    node.parentNode?.replaceChild(frag, node)
    return
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const tag = node.tagName
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') return
    if (node.classList?.contains('voc-termo')) return
    // Clona a lista de filhos porque a substituição de texto muta o DOM durante a iteração.
    ;[...node.childNodes].forEach(child => _percorrerEEnvolver(child, regex))
  }
}

// ── Modal de definição ───────────────────────────────────────
function _abrirModalVocab(entrada) {
  document.getElementById('_voc-modal')?.remove()
  const div = document.createElement('div')
  div.id = '_voc-modal'
  div.style.cssText = 'position:fixed;inset:0;background:rgba(31,56,31,.7);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px'
  div.innerHTML = `
    <div style="background:#fff;border-radius:12px;width:380px;max-width:100%;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
        <div style="font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:500;color:var(--bege)">${_esc(entrada.termo)}</div>
        <button onclick="document.getElementById('_voc-modal').remove()" style="background:none;border:none;color:var(--bege);font-size:20px;cursor:pointer;line-height:1">×</button>
      </div>
      <div style="padding:18px 20px;font-size:13px;color:var(--txt);line-height:1.7;white-space:pre-line">${_esc(entrada.definicao)}</div>
    </div>`
  div.addEventListener('click', e => { if (e.target === div) div.remove() })
  document.body.appendChild(div)
}

function _esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function _initClickHandler() {
  if (window._vocabClickInit) return
  window._vocabClickInit = true
  document.addEventListener('click', (e) => {
    const el = e.target.closest?.('.voc-termo')
    if (!el) return
    const entrada = window._vocabPorNormalizado?.[el.dataset.termo]
    if (entrada) _abrirModalVocab(entrada)
  })
}

// ── Carrega o vocabulário uma única vez por sessão (cache em window) ──
async function _garantirVocabCarregado() {
  if (window._vocabRegex !== undefined) return // já carregado (mesmo que vazio → null)
  const { data, error } = await window._sb.from('vocabulario').select('termo,termo_normalizado,definicao')
  if (error) { console.warn('vocabulario:', error.message); window._vocabRegex = null; return }
  const lista = data || []
  window._vocabPorNormalizado = Object.fromEntries(lista.map(v => [v.termo_normalizado, v]))
  window._vocabRegex = _construirRegexVocab(lista.map(v => v.termo_normalizado))
}

// Força um recarregamento na próxima chamada — usar depois de criar/editar/excluir
// um termo no admin, senão a tela do aluno continuaria com o cache antigo.
export function invalidarCacheVocabulario() {
  window._vocabRegex = undefined
  window._vocabPorNormalizado = undefined
}

// ── Função principal ──────────────────────────────────────────
export async function aplicarVocabulario(container) {
  await _garantirVocabCarregado()
  if (!window._vocabRegex) return
  _initClickHandler()
  const alvo = container.querySelector?.('.content') || container
  _percorrerEEnvolver(alvo, window._vocabRegex)
}
