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
      <button onclick="abrirFormVocab()"
        style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;
               border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
               display:flex;align-items:center;gap:5px">
        <i class="ti ti-plus"></i> Novo termo
      </button>
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
}
