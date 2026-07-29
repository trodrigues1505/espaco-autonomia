/**
 * src/pages/admin/vocabulario.js
 * Gestão do vocabulário — termos que ficam clicáveis automaticamente em
 * qualquer texto do app (ver src/modules/vocabulario.js).
 */

import { toast } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'
import { invalidarCacheVocabulario } from '../../modules/vocabulario.js'

function _normalizarDiacriticos(str) {
  return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export async function renderVocabularioAdmin(container, page) {
  const sb = window._sb

  const { data: termos, error } = await sb
    .from('vocabulario')
    .select('*')
    .order('termo', { ascending: true })

  if (error) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Śabda Kośa</div></div>
      <div class="content"><p style="color:#c0392b">Erro: ${error.message}</p></div>`
    return
  }

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Śabda Kośa</div>
      <div style="display:flex;gap:8px">
        <button onclick="abrirImportVocab()"
          style="padding:6px 14px;background:transparent;color:var(--verde);border:1px solid var(--verde);
                 border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
                 display:flex;align-items:center;gap:5px">
          <i class="ti ti-upload"></i> Importar JSON
        </button>
        <button onclick="abrirFormVocab()"
          style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;
                 border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
                 display:flex;align-items:center;gap:5px">
          <i class="ti ti-plus"></i> Novo termo
        </button>
      </div>
    </div>
    <div class="content">
      <div style="background:rgba(31,56,31,.04);border:1px solid rgba(31,56,31,.12);border-radius:6px;padding:9px 13px;font-size:12px;color:var(--verde);margin-bottom:14px;display:flex;align-items:center;gap:8px">
        <i class="ti ti-info-circle"></i>
        <span>Termos ficam clicáveis automaticamente em qualquer texto do app. Reconhecimento ignora maiúscula/minúscula e diacríticos — "Sankalpa", "sankalpa" e "saṅkalpa" contam como o mesmo termo.</span>
      </div>

      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde)">Termos não catalogados</div>
          <button onclick="escanearTermosNaoCatalogados()"
            style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px;white-space:nowrap">
            <i class="ti ti-search"></i> Escanear agora
          </button>
        </div>
        <div style="font-size:11px;color:var(--txt2);margin-bottom:10px">
          Varre Jñāna Mārga, Yoga Adhyayana e Āsana Mārga procurando palavras com diacríticos exclusivos de transliteração sânscrita (ā, ī, ū, ṛ, ṃ, ḥ, ṣ, ṭ, ḍ, ṇ, ś, ñ, ṅ) que ainda não estão cadastradas aqui.
        </div>
        <div id="termos-nao-catalogados-container"></div>
      </div>

      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 2fr 90px;padding:8px 18px;
                    background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;
                    letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
          <span>Termo</span><span>Definição</span><span>Ação</span>
        </div>
        ${(termos||[]).length === 0
          ? '<div style="padding:24px 18px;font-size:13px;color:var(--txt2)">Nenhum termo cadastrado ainda.</div>'
          : termos.map(t => `
            <div style="display:grid;grid-template-columns:1fr 2fr 90px;align-items:center;gap:10px;
                        padding:11px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
              <span style="font-weight:500;color:var(--txt)">${t.termo}</span>
              <span style="color:var(--txt2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.definicao}</span>
              <div style="display:flex;gap:4px">
                <button onclick="editarVocab('${t.id}')"
                  style="padding:3px 8px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✎</button>
                <button onclick="excluirVocab('${t.id}','${(t.termo||'').replace(/'/g,"\\'")}')"
                  style="padding:3px 8px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✕</button>
              </div>
            </div>`).join('')
        }
      </div>
    </div>

    <div id="modal-vocab" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);
                                   z-index:200;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:12px;width:480px;max-width:100%">
        <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)" id="vocab-modal-titulo">Novo Termo</div>
          <button onclick="document.getElementById('modal-vocab').style.display='none'"
            style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
        </div>
        <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <input type="hidden" id="voc-id">
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Termo (forma de exibição)</label>
            <input id="voc-termo" placeholder="ex: Sankalpa"
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Definição</label>
            <textarea id="voc-definicao" rows="5" placeholder="O que significa este termo..."
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;resize:vertical"></textarea>
          </div>
        </div>
        <div style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:8px">
          <button onclick="document.getElementById('modal-vocab').style.display='none'"
            style="padding:8px 16px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
          <button onclick="salvarVocab()"
            style="padding:8px 16px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500">
            <i class="ti ti-check"></i> Salvar
          </button>
        </div>
      </div>
    </div>

    <div id="modal-import-vocab" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);
                                   z-index:210;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:12px;width:640px;max-width:100%;max-height:88vh;display:flex;flex-direction:column">
        <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)" id="import-vocab-titulo">Importar termos (JSON)</div>
          <button onclick="fecharImportVocab()"
            style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
        </div>

        <div id="import-vocab-step-colar" style="padding:20px;display:flex;flex-direction:column;gap:12px;overflow-y:auto">
          <div style="font-size:12px;color:var(--txt2)">
            Cole abaixo um array JSON no formato <code>[{"termo": "...", "definicao": "..."}]</code>, ou selecione um arquivo <code>.json</code>.
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Arquivo .json</label>
            <input type="file" id="import-vocab-file" accept="application/json,.json"
              style="font-size:12px;font-family:'DM Sans',sans-serif">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Ou cole o JSON aqui</label>
            <textarea id="import-vocab-textarea" rows="10" placeholder='[{"termo": "Sankalpa", "definicao": "..."}]'
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:12px;font-family:monospace;outline:none;resize:vertical"></textarea>
          </div>
          <div id="import-vocab-erro" style="display:none;font-size:12px;color:#c0392b;background:#fceaea;border-radius:6px;padding:8px 12px"></div>
        </div>

        <div id="import-vocab-step-preview" style="display:none;padding:20px;overflow-y:auto;flex:1">
          <div id="import-vocab-preview-resumo" style="font-size:12px;color:var(--txt2);margin-bottom:12px"></div>
          <div id="import-vocab-preview-lista"></div>
        </div>

        <div style="padding:16px 20px;border-top:1px solid var(--borda);display:flex;justify-content:space-between;gap:8px">
          <button id="import-vocab-btn-voltar" onclick="voltarImportVocab()" style="display:none;padding:8px 16px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">
            ← Voltar
          </button>
          <div style="flex:1"></div>
          <button onclick="fecharImportVocab()"
            style="padding:8px 16px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
          <button id="import-vocab-btn-avancar" onclick="prevalidarImportVocab()"
            style="padding:8px 16px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500">
            Continuar →
          </button>
        </div>
      </div>
    </div>
  `

  uiAnimar(container)

  window.abrirFormVocab = function() {
    window._editVocabId = null
    document.getElementById('vocab-modal-titulo').textContent = 'Novo Termo'
    document.getElementById('voc-termo').value = ''
    document.getElementById('voc-definicao').value = ''
    document.getElementById('modal-vocab').style.display = 'flex'
  }

  window.editarVocab = async function(id) {
    const { data: t } = await sb.from('vocabulario').select('*').eq('id', id).single()
    if (!t) { toast('Termo não encontrado'); return }
    window._editVocabId = id
    document.getElementById('vocab-modal-titulo').textContent = `Editar — ${t.termo}`
    document.getElementById('voc-termo').value = t.termo
    document.getElementById('voc-definicao').value = t.definicao
    document.getElementById('modal-vocab').style.display = 'flex'
  }

  window.salvarVocab = async function() {
    const termo = document.getElementById('voc-termo').value.trim()
    const definicao = document.getElementById('voc-definicao').value.trim()
    if (!termo) { toast('Informe o termo'); return }
    if (!definicao) { toast('Informe a definição'); return }

    const payload = {
      termo,
      termo_normalizado: _normalizarDiacriticos(termo),
      definicao,
    }
    let err
    if (window._editVocabId) {
      ;({ error: err } = await sb.from('vocabulario').update(payload).eq('id', window._editVocabId))
    } else {
      ;({ error: err } = await sb.from('vocabulario').insert(payload))
    }
    if (err) { toast('Erro: ' + err.message); return }
    invalidarCacheVocabulario()
    toast('✓ Termo salvo!')
    document.getElementById('modal-vocab').style.display = 'none'
    navigate('vocabulario-admin')
  }

  window.excluirVocab = async function(id, termo) {
    if (!confirm(`Excluir "${termo}"? Esta ação não pode ser desfeita.`)) return
    const { error: err } = await sb.from('vocabulario').delete().eq('id', id)
    if (err) { toast('Erro: ' + err.message); return }
    invalidarCacheVocabulario()
    toast('✓ Termo excluído.')
    navigate('vocabulario-admin')
  }

  // ── Escaneamento de termos não catalogados ──────────────────
  // Heurística: qualquer palavra contendo um diacrítico exclusivo de IAST
  // (transliteração sânscrita) — nenhum desses caracteres existe em
  // ortografia portuguesa, então a presença de um deles é um sinal forte
  // e confiável de que a palavra é um termo sânscrito.
  const IAST_MARCADOR = /[āīūṛṃḥṣṭḍṇśñṅĀĪŪṚṂḤṢṬḌṆŚÑṄ]/
  const REGEX_PALAVRA = /[A-Za-zĀĪŪṚṂḤṢṬḌṆŚÑṄāīūṛṃḥṣṭḍṇśñṅ]{3,}/g

  function _extrairDoTexto(texto, destino) {
    if (!texto || typeof texto !== 'string') return
    const palavras = texto.match(REGEX_PALAVRA) || []
    for (const p of palavras) {
      if (IAST_MARCADOR.test(p)) {
        const idx = texto.indexOf(p)
        const contexto = texto.slice(Math.max(0, idx - 40), idx + p.length + 40).trim()
        destino.push({ termo: p, contexto })
      }
    }
  }

  window.escanearTermosNaoCatalogados = async function() {
    const btn = document.querySelector('button[onclick="escanearTermosNaoCatalogados()"]')
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Escaneando...' }
    const container = document.getElementById('termos-nao-catalogados-container')
    container.innerHTML = '<div style="font-size:12px;color:var(--txt2);padding:8px 0">Escaneando...</div>'

    try {
      const encontrados = []

      // Jñāna Mārga
      const { data: sutras } = await sb.from('jnana_sutras').select('contexto_capitulo,comentario,pratica')
      for (const s of sutras || []) {
        _extrairDoTexto(s.contexto_capitulo, encontrados)
        _extrairDoTexto(s.comentario, encontrados)
        _extrairDoTexto(s.pratica, encontrados)
      }

      // Yoga Adhyayana
      const { data: asanas } = await sb.from('adhyayana_asanas').select(
        'origem_simbolismo,koshas,vayus,chakras,doshas,tattvas,beneficios_fisiologicos,beneficios_sutis,observacoes_terapeuticas,fechamento'
      )
      const CAMPOS_ADHY = ['origem_simbolismo','koshas','vayus','chakras','doshas','tattvas',
        'beneficios_fisiologicos','beneficios_sutis','observacoes_terapeuticas','fechamento']
      for (const a of asanas || []) {
        for (const campo of CAMPOS_ADHY) _extrairDoTexto(a[campo], encontrados)
      }

      // Āsana Mārga (campos são arrays jsonb de {termo, desc})
      const { data: praticas } = await sb.from('asana_praticas').select('*')
      const CAMPOS_ASANA = ['introducao','pranayama','mantra','koshas','chakras','gunas','tipos_yoga','musculos']
      for (const p of praticas || []) {
        for (const campo of CAMPOS_ASANA) {
          const lista = p[campo]
          if (Array.isArray(lista)) {
            for (const item of lista) {
              if (item?.termo) _extrairDoTexto(item.termo, encontrados)
              if (item?.desc) _extrairDoTexto(item.desc, encontrados)
            }
          }
        }
      }

      // Dedup por termo normalizado — mantém só a 1ª ocorrência (com contexto)
      const vistos = new Map()
      for (const f of encontrados) {
        const norm = _normalizarDiacriticos(f.termo)
        if (!vistos.has(norm)) vistos.set(norm, f)
      }

      // Remove os que já estão catalogados
      const { data: existentes } = await sb.from('vocabulario').select('termo_normalizado')
      const jaCatalogados = new Set((existentes || []).map(v => v.termo_normalizado))
      const novos = [...vistos.entries()]
        .filter(([norm]) => !jaCatalogados.has(norm))
        .map(([norm, f]) => ({ ...f, termo_normalizado: norm }))
        .sort((a, b) => a.termo.localeCompare(b.termo))

      window._tncLista = novos
      _renderTermosNaoCatalogados(novos)
    } catch (e) {
      container.innerHTML = `<p style="color:#c0392b;font-size:12px">Erro ao escanear: ${e.message}</p>`
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-search"></i> Escanear agora' }
    }
  }

  function _renderTermosNaoCatalogados(lista) {
    const container = document.getElementById('termos-nao-catalogados-container')
    if (!lista.length) {
      container.innerHTML = '<div style="font-size:12px;color:var(--txt2);padding:8px 0">Nenhum termo novo encontrado — tudo que foi detectado já está catalogado.</div>'
      return
    }
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:#7a5a10;background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);border-radius:6px;padding:8px 12px;margin-bottom:10px">
        <span>${lista.length} termo(s) encontrado(s), ainda não cadastrado(s). Revise o contexto e escreva a definição de cada um antes de salvar.</span>
        <button onclick="exportarTermosEscaneadosJson()"
          style="padding:4px 10px;background:#fff;color:#7a5a10;border:1px solid rgba(232,188,79,.5);border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;display:flex;align-items:center;gap:4px">
          <i class="ti ti-download"></i> Exportar JSON
        </button>
      </div>
      ${lista.map((item, i) => `
        <div style="border:1px solid var(--borda);border-radius:8px;padding:12px 14px;margin-bottom:8px" id="tnc-${i}">
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
            <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde)">${item.termo}</span>
          </div>
          <div style="font-size:11px;color:var(--txt2);font-style:italic;margin-bottom:8px">"...${item.contexto}..."</div>
          <textarea id="tnc-def-${i}" rows="2" placeholder="Escreva a definição deste termo..."
            style="width:100%;border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:12px;font-family:'DM Sans',sans-serif;outline:none;resize:vertical;box-sizing:border-box;margin-bottom:8px"></textarea>
          <div style="display:flex;gap:6px">
            <button onclick="salvarTermoEscaneado(${i}, '${item.termo.replace(/'/g, "\\'")}')"
              style="padding:5px 12px;background:var(--verde);color:var(--bege);border:none;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">
              ✓ Cadastrar
            </button>
            <button onclick="document.getElementById('tnc-${i}').remove()"
              style="padding:5px 12px;background:transparent;border:1px solid var(--borda);border-radius:5px;font-size:11px;cursor:pointer;color:var(--txt2)">
              Ignorar
            </button>
          </div>
        </div>`).join('')}
    `
  }

  window.salvarTermoEscaneado = async function(idx, termo) {
    const definicao = document.getElementById(`tnc-def-${idx}`)?.value.trim()
    if (!definicao) { toast('Escreva a definição antes de cadastrar'); return }
    const { error: err } = await sb.from('vocabulario').insert({
      termo,
      termo_normalizado: _normalizarDiacriticos(termo),
      definicao,
    })
    if (err) { toast('Erro: ' + err.message); return }
    invalidarCacheVocabulario()
    toast(`✓ "${termo}" cadastrado!`)
    document.getElementById(`tnc-${idx}`)?.remove()
  }

  // Exporta a lista escaneada (termo + contexto onde apareceu) como um
  // arquivo .json, no formato que encaixa direto no prompt de geração de
  // definições em lote. Não depende de servidor — gera o arquivo no
  // próprio navegador via Blob e dispara o download.
  window.exportarTermosEscaneadosJson = function() {
    const lista = window._tncLista || []
    if (!lista.length) { toast('Nenhum termo escaneado pra exportar'); return }
    const exportavel = lista.map(item => ({ termo: item.termo, contexto: item.contexto }))
    const blob = new Blob([JSON.stringify(exportavel, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sabda-kosha-termos-nao-catalogados-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast(`✓ ${lista.length} termo(s) exportado(s)`)
  }

  // ── Importação em lote de termos já com definição ───────────
  // Recebe um array [{termo, definicao}], valida, deduplica contra o que
  // já existe na tabela e contra o próprio lote, mostra prévia, e só então
  // insere tudo de uma vez (um único insert em lote, não um loop).

  window.abrirImportVocab = function() {
    document.getElementById('import-vocab-erro').style.display = 'none'
    document.getElementById('import-vocab-erro').textContent = ''
    document.getElementById('import-vocab-textarea').value = ''
    document.getElementById('import-vocab-file').value = ''
    document.getElementById('import-vocab-step-colar').style.display = 'flex'
    document.getElementById('import-vocab-step-preview').style.display = 'none'
    document.getElementById('import-vocab-btn-voltar').style.display = 'none'
    document.getElementById('import-vocab-btn-avancar').style.display = 'inline-block'
    document.getElementById('import-vocab-btn-avancar').textContent = 'Continuar →'
    document.getElementById('import-vocab-btn-avancar').onclick = window.prevalidarImportVocab
    document.getElementById('import-vocab-titulo').textContent = 'Importar termos (JSON)'
    document.getElementById('modal-import-vocab').style.display = 'flex'

    const fileInput = document.getElementById('import-vocab-file')
    fileInput.onchange = function() {
      const file = fileInput.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => { document.getElementById('import-vocab-textarea').value = reader.result }
      reader.onerror = () => { _mostrarErroImportVocab('Não foi possível ler o arquivo selecionado.') }
      reader.readAsText(file)
    }
  }

  window.fecharImportVocab = function() {
    document.getElementById('modal-import-vocab').style.display = 'none'
  }

  function _mostrarErroImportVocab(msg) {
    const el = document.getElementById('import-vocab-erro')
    el.textContent = msg
    el.style.display = 'block'
  }

  function _parseImportJson(raw) {
    raw = (raw || '').trim()
    if (!raw) throw new Error('Cole o JSON ou selecione um arquivo antes de continuar.')
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Fallback: extrai o primeiro array presente no texto colado, caso
      // venha com texto/markdown ao redor (mesmo padrão usado no jnana.js).
      const m = raw.match(/\[[\s\S]*\]/)
      if (!m) throw new Error('Não encontrei um array JSON válido no texto colado.')
      parsed = JSON.parse(m[0])
    }
    if (!Array.isArray(parsed)) throw new Error('O JSON precisa ser um array de objetos {termo, definicao}.')
    return parsed
  }

  window.prevalidarImportVocab = async function() {
    document.getElementById('import-vocab-erro').style.display = 'none'
    let parsed
    try {
      parsed = _parseImportJson(document.getElementById('import-vocab-textarea').value)
    } catch (e) {
      _mostrarErroImportVocab(e.message)
      return
    }

    // Validação item a item
    const validos = []
    const invalidos = []
    parsed.forEach((item, i) => {
      const termo = String(item?.termo ?? '').trim()
      const definicao = String(item?.definicao ?? '').trim()
      if (!termo || !definicao) { invalidos.push({ i, item }); return }
      validos.push({ termo, definicao, termo_normalizado: _normalizarDiacriticos(termo) })
    })

    // Dedup dentro do próprio lote — mantém a primeira ocorrência
    const semDupInterna = []
    const vistosNoLote = new Set()
    let duplicadosNoLote = 0
    for (const v of validos) {
      if (vistosNoLote.has(v.termo_normalizado)) { duplicadosNoLote++; continue }
      vistosNoLote.add(v.termo_normalizado)
      semDupInterna.push(v)
    }

    // Dedup contra o que já existe na tabela
    const { data: existentes, error: errExist } = await sb.from('vocabulario').select('termo_normalizado')
    if (errExist) { _mostrarErroImportVocab('Erro ao consultar termos existentes: ' + errExist.message); return }
    const jaCatalogados = new Set((existentes || []).map(v => v.termo_normalizado))

    const novos = semDupInterna.filter(v => !jaCatalogados.has(v.termo_normalizado))
    const jaExistentes = semDupInterna.filter(v => jaCatalogados.has(v.termo_normalizado))

    window._importVocabNovos = novos
    window._importVocabJaExistentes = jaExistentes
    window._importVocabInvalidos = invalidos

    _renderPreviewImportVocab({ novos, jaExistentes, invalidos, duplicadosNoLote, totalRecebido: parsed.length })

    document.getElementById('import-vocab-step-colar').style.display = 'none'
    document.getElementById('import-vocab-step-preview').style.display = 'block'
    document.getElementById('import-vocab-btn-voltar').style.display = 'inline-block'
    const btnAvancar = document.getElementById('import-vocab-btn-avancar')
    btnAvancar.textContent = novos.length ? `Importar ${novos.length} termo(s)` : 'Nada a importar'
    btnAvancar.disabled = !novos.length
    btnAvancar.style.opacity = novos.length ? '1' : '.5'
    btnAvancar.onclick = window.confirmarImportVocab
    document.getElementById('import-vocab-titulo').textContent = 'Revisar importação'
  }

  function _renderPreviewImportVocab({ novos, jaExistentes, invalidos, duplicadosNoLote, totalRecebido }) {
    const resumo = document.getElementById('import-vocab-preview-resumo')
    resumo.innerHTML = `
      ${totalRecebido} registro(s) recebido(s) do JSON.<br>
      <b style="color:var(--verde)">${novos.length}</b> serão importados como termos novos.
      ${jaExistentes.length ? `<br><b style="color:#7a5a10">${jaExistentes.length}</b> já existem no vocabulário e serão ignorados (não sobrescrevem).` : ''}
      ${duplicadosNoLote ? `<br><b style="color:#7a5a10">${duplicadosNoLote}</b> duplicado(s) dentro do próprio JSON colado (mantida só a primeira ocorrência).` : ''}
      ${invalidos.length ? `<br><b style="color:#c0392b">${invalidos.length}</b> registro(s) sem "termo" ou "definicao" — ignorados.` : ''}
    `

    const lista = document.getElementById('import-vocab-preview-lista')
    if (!novos.length) {
      lista.innerHTML = '<div style="font-size:12px;color:var(--txt2);padding:8px 0">Nenhum termo novo para importar.</div>'
      return
    }
    lista.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 2fr;padding:6px 12px;background:rgba(242,236,206,.45);
                  font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px;border-radius:6px 6px 0 0">
        <span>Termo</span><span>Definição</span>
      </div>
      <div style="max-height:320px;overflow-y:auto;border:1px solid var(--borda);border-top:none;border-radius:0 0 6px 6px">
        ${novos.map(v => `
          <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
            <span style="font-weight:500;color:var(--txt)">${_escImport(v.termo)}</span>
            <span style="color:var(--txt2)">${_escImport(v.definicao)}</span>
          </div>`).join('')}
      </div>
    `
  }

  function _escImport(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  window.voltarImportVocab = function() {
    document.getElementById('import-vocab-step-preview').style.display = 'none'
    document.getElementById('import-vocab-step-colar').style.display = 'flex'
    document.getElementById('import-vocab-btn-voltar').style.display = 'none'
    const btnAvancar = document.getElementById('import-vocab-btn-avancar')
    btnAvancar.textContent = 'Continuar →'
    btnAvancar.disabled = false
    btnAvancar.style.opacity = '1'
    btnAvancar.onclick = window.prevalidarImportVocab
    document.getElementById('import-vocab-titulo').textContent = 'Importar termos (JSON)'
  }

  window.confirmarImportVocab = async function() {
    const novos = window._importVocabNovos || []
    if (!novos.length) return
    const btn = document.getElementById('import-vocab-btn-avancar')
    btn.disabled = true
    const textoOriginal = btn.textContent
    btn.textContent = 'Importando...'

    const payload = novos.map(v => ({
      termo: v.termo,
      termo_normalizado: v.termo_normalizado,
      definicao: v.definicao,
    }))

    const { error: err } = await sb.from('vocabulario').insert(payload)

    if (err) {
      btn.disabled = false
      btn.textContent = textoOriginal
      _mostrarErroImportVocab('Erro ao importar: ' + err.message)
      document.getElementById('import-vocab-step-preview').style.display = 'none'
      document.getElementById('import-vocab-step-colar').style.display = 'flex'
      return
    }

    invalidarCacheVocabulario()
    toast(`✓ ${novos.length} termo(s) importado(s)!`)
    document.getElementById('modal-import-vocab').style.display = 'none'
    navigate('vocabulario-admin')
  }
}
