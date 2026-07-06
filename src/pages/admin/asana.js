/**
 * src/pages/admin/asana.js
 * Gestão do Āsana Mārga — Aula 1 (livre) e Aula 2 (Shiva/Vishnu).
 * SEM histórico: cada slot é uma linha fixa (upsert) na tabela asana_praticas.
 * Cadastro: upload de PDF do Tummee (estatísticas da sequência) → texto extraído
 * no navegador via pdf.js → IA (Groq, via anthropic-proxy) interpreta e estrutura.
 */

import { toast } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'

const PDFJS_VERSION = '4.7.76'
const PDFJS_URL     = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`
const PDFJS_WORKER  = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`

async function _carregarPdfjs() {
  if (window._pdfjsLib) return window._pdfjsLib
  const pdfjsLib = await import(PDFJS_URL)
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER
  window._pdfjsLib = pdfjsLib
  return pdfjsLib
}

async function _extrairTextoPDF(file) {
  const pdfjsLib = await _carregarPdfjs()
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  let texto = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    texto += content.items.map(it => it.str).join(' ') + '\n\n'
  }
  return texto.trim()
}

// ── Helpers de parsing dos campos de revisão ───────────────────
function _fmtListaPercentual(lista) {
  return (lista || []).map(i => `${i.termo}: ${i.percentual ?? ''}`).join('\n')
}
function _parseListaPercentual(texto) {
  return (texto || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const [termo, pct] = l.split(':').map(s => s.trim())
    return { termo, percentual: pct ? parseFloat(pct.replace('%', '').replace(',', '.')) : null }
  })
}
function _fmtListaTermoDesc(lista) {
  return (lista || []).map(i => `${i.termo}: ${i.desc}`).join('\n')
}
function _parseListaTermoDesc(texto) {
  return (texto || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const idx = l.indexOf(':')
    return idx === -1
      ? { termo: l, desc: '' }
      : { termo: l.slice(0, idx).trim(), desc: l.slice(idx + 1).trim() }
  })
}

const SLOT_INFO = {
  1: { label: 'Aula 1', sub: 'Livre para todos os planos' },
  2: { label: 'Aula 2', sub: 'Restrita — Shiva e Vishnu' },
}

export async function renderAsanaAdmin(container, page) {
  const sb = window._sb

  const { data: linhas, error } = await sb
    .from('asana_praticas')
    .select('*')
    .order('slot', { ascending: true })

  if (error) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Āsana Mārga</div></div>
      <div class="content"><p style="color:#c0392b">Erro: ${error.message}</p></div>`
    return
  }

  const porSlot = { 1: linhas.find(l => l.slot === 1), 2: linhas.find(l => l.slot === 2) }

  function cardResumo(slot) {
    const a = porSlot[slot]
    const vazio = !a || !a.modalidade
    return `
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:18px 20px;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--verde)">${SLOT_INFO[slot].label}</div>
            <div style="font-size:11px;color:var(--txt2)">${SLOT_INFO[slot].sub}</div>
          </div>
          <button onclick="abrirFormAsana(${slot})"
            style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;
                   border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
                   display:flex;align-items:center;gap:5px">
            <i class="ti ti-sparkles"></i> ${vazio ? 'Cadastrar' : 'Recadastrar'}
          </button>
        </div>
        ${vazio
          ? `<div style="font-size:13px;color:var(--txt2)">Nenhum conteúdo cadastrado ainda.</div>`
          : `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
               <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${a.modalidade || '—'}</span>
               ${a.data_aula ? `<span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${new Date(a.data_aula+'T12:00').toLocaleDateString('pt-BR')}</span>` : ''}
               ${a.duracao ? `<span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${a.duracao}</span>` : ''}
             </div>
             <div style="font-size:12px;color:var(--txt2);line-height:1.6">${a.nivel || ''}</div>`
        }
      </div>`
  }

  container.innerHTML = `
    <div class="topbar"><div class="topbar-t">Āsana Mārga</div></div>
    <div class="content">
      ${cardResumo(1)}
      ${cardResumo(2)}
    </div>

    <!-- ── Modal ─────────────────────────────────────────────── -->
    <div id="modal-asana" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);
                                   z-index:200;align-items:flex-start;justify-content:center;
                                   padding:16px;overflow-y:auto">
      <div style="background:#fff;border-radius:12px;width:680px;max-width:100%;margin:auto">
        <div style="background:var(--verde);padding:16px 20px;border-radius:12px 12px 0 0;
                    display:flex;align-items:center;justify-content:space-between;
                    position:sticky;top:0;z-index:1">
          <div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;
                        color:var(--bege)" id="asana-modal-titulo">Cadastrar aula</div>
            <div style="font-size:11px;color:rgba(242,236,206,.6);margin-top:2px">
              Envie o PDF de estatísticas do Tummee — a IA extrai e interpreta os campos
            </div>
          </div>
          <button onclick="fecharFormAsana()"
            style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
        </div>

        <div style="padding:20px" id="asana-modal-body">
          <div id="am-etapa-1">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px">
              <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Nº da aula</label>
                <input type="number" id="am-numero" min="1"
                  style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%">
              </div>
              <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Duração</label>
                <input id="am-duracao" placeholder="ex: 60 minutos"
                  style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%">
              </div>
              <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Link Tummee</label>
                <input id="am-link" placeholder="https://tummee.com/..."
                  style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%">
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">PDF do Tummee</label>
              <input type="file" id="am-pdf-file" accept="application/pdf"
                style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:12px;font-family:'DM Sans',sans-serif">
              <div id="am-pdf-status" style="font-size:10px;color:var(--txt2)"></div>
            </div>

            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:16px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">
                Texto extraído (revise antes de interpretar, se quiser)
              </label>
              <textarea id="am-texto-bruto" rows="10" placeholder="Envie o PDF acima, ou cole o texto manualmente aqui..."
                style="border:1px solid var(--borda);border-radius:6px;padding:10px 12px;font-size:12px;
                       font-family:monospace;outline:none;width:100%;resize:vertical;line-height:1.5"></textarea>
            </div>

            <button onclick="interpretarComIAAsana()" id="btn-interpretar-am"
              style="width:100%;padding:12px;background:var(--verde);color:var(--bege);border:none;
                     border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;
                     font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px">
              <i class="ti ti-sparkles"></i> Interpretar com IA
            </button>
          </div>
          <div id="am-etapa-2" style="display:none"></div>
        </div>

        <div id="asana-modal-footer" style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:8px">
          <button onclick="fecharFormAsana()"
            style="padding:8px 16px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
        </div>
      </div>
    </div>
  `

  uiAnimar(container)

  window._asanaSlotAtual = null

  window.abrirFormAsana = function(slot) {
    window._asanaSlotAtual = slot
    const a = porSlot[slot] || {}
    document.getElementById('asana-modal-titulo').textContent = `${SLOT_INFO[slot].label} — ${SLOT_INFO[slot].sub}`
    document.getElementById('am-etapa-1').style.display = 'block'
    document.getElementById('am-etapa-2').style.display = 'none'
    document.getElementById('am-etapa-2').innerHTML = ''
    document.getElementById('am-numero').value = a.numero || ''
    document.getElementById('am-duracao').value = a.duracao || ''
    document.getElementById('am-link').value = a.link_tummee || ''
    document.getElementById('am-texto-bruto').value = ''
    document.getElementById('am-pdf-file').value = ''
    document.getElementById('am-pdf-status').textContent = ''
    document.getElementById('asana-modal-footer').innerHTML = `
      <button onclick="fecharFormAsana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>`
    document.getElementById('modal-asana').style.display = 'flex'

    document.getElementById('am-pdf-file').onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      const status = document.getElementById('am-pdf-status')
      status.textContent = 'Extraindo texto do PDF...'
      try {
        const texto = await _extrairTextoPDF(file)
        document.getElementById('am-texto-bruto').value = texto
        status.textContent = `✓ Texto extraído (${texto.length} caracteres). Revise acima se quiser.`
      } catch (err) {
        status.textContent = 'Erro ao extrair PDF: ' + err.message
      }
    }
  }

  window.fecharFormAsana = function() {
    document.getElementById('modal-asana').style.display = 'none'
    window._asanaSlotAtual = null
  }

  window.interpretarComIAAsana = async function() {
    const texto = document.getElementById('am-texto-bruto').value.trim()
    if (!texto) { toast('Envie o PDF ou cole o texto primeiro'); return }
    const btn = document.getElementById('btn-interpretar-am')
    btn.disabled = true
    btn.innerHTML = '<span class="spinner"></span> Interpretando...'
    try {
      const FN_URL = 'https://kctgcjvfsuinwlbgljdw.supabase.co/functions/v1/anthropic-proxy'
      const { data: { session } } = await window._sb.auth.getSession()
      const authToken = session?.access_token
      if (!authToken) throw new Error('Sessão expirada. Faça login novamente.')
      const response = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
        body: JSON.stringify({
          max_tokens: 2000,
          system: `Você é um extrator de dados de páginas de estatísticas de sequências de yoga exportadas do Tummee.
O texto colado é a página de análise agregada de uma sequência (não lista as posturas uma a uma, só estatísticas).

Extraia e retorne APENAS um JSON válido, sem markdown, sem explicações. Formato exato:
{
  "data_aula": "YYYY-MM-DD ou null",
  "modalidade": "string ou null (ex: Hatha)",
  "nivel": "string — síntese em texto corrido da distribuição de dificuldade. Exemplo: se o texto mostrar 'Intermediário 51% / Novato 48%', escreva algo como 'Aula com equilíbrio entre praticantes novatos e intermediários, leve predominância intermediária.' Se for algo como 'Novato 80%+', escreva 'Aula orientada para iniciantes, com foco em posturas acessíveis.'",
  "descricao": "string — síntese em texto corrido combinando os grupos musculares mais trabalhados e os tipos de yoga predominantes. 2-3 frases.",
  "total_poses": number ou null,
  "poses_unicas": number ou null,
  "poses_base": number ou null,
  "musculos": [{"termo": "string", "percentual": number}],
  "tipos_yoga": [{"termo": "string", "percentual": number}],
  "posicoes_corpo": [{"termo": "string", "percentual": number}],
  "koshas": [{"termo": "string", "percentual": number}],
  "chakras": [{"termo": "string", "percentual": number}],
  "gunas": [{"termo": "string", "percentual": number}],
  "meridianos": [{"termo": "string", "percentual": number}],
  "mudras_pranayama_percentual": number ou null
}
Regras:
- Os campos de lista (musculos, tipos_yoga, etc.) devem conter TODOS os itens que aparecerem no texto para aquela categoria, com o percentual exatamente como aparece.
- Ignore o texto "Mais (N)" — ele só indica que há mais itens não detalhados, não é um item em si.
- Se uma categoria inteira não aparecer no texto, retorne array vazio [].
- Não invente dados que não estão no texto.`,
          messages: [{ role: 'user', content: texto }],
        }),
      })
      if (!response.ok) {
        const errText = await response.text()
        throw new Error('Proxy retornou ' + response.status + ': ' + errText)
      }
      const data = await response.json()
      const raw  = data.content?.[0]?.text || ''
      let parsed
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      } catch {
        throw new Error('IA retornou formato inesperado. Tente novamente.')
      }
      _montarCamposRevisao(parsed)
      document.getElementById('am-etapa-1').style.display = 'none'
      document.getElementById('am-etapa-2').style.display = 'block'
      _mostrarBotaoSalvarAsana()
      toast('✓ Campos extraídos — revise e salve')
    } catch(e) {
      toast('Erro: ' + e.message)
      btn.disabled = false
      btn.innerHTML = '<i class="ti ti-sparkles"></i> Interpretar com IA'
    }
  }

  function _montarCamposRevisao(p) {
    const f = (label, el, dica = '') => `
      <div style="display:flex;flex-direction:column;gap:4px">
        <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">${label}</label>
        ${el}
        ${dica ? `<div style="font-size:10px;color:var(--txt2)">${dica}</div>` : ''}
      </div>`
    const inp = (id, val = '', ph = '') =>
      `<input id="${id}" value="${(val ?? '').toString().replace(/"/g,'&quot;')}" placeholder="${ph}"
        style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%">`
    const ta = (id, val = '', rows = 3, ph = '') =>
      `<textarea id="${id}" rows="${rows}" placeholder="${ph}"
        style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:12px;font-family:monospace;outline:none;width:100%;resize:vertical">${val||''}</textarea>`

    document.getElementById('am-etapa-2').innerHTML = `
      <div style="background:rgba(31,56,31,.04);border-radius:8px;padding:10px 14px;margin-bottom:16px;
                  font-size:12px;color:var(--verde);display:flex;align-items:center;gap:8px">
        <i class="ti ti-sparkles"></i>
        <span>Campos extraídos pela IA. Revise e corrija se necessário. Campos que a IA não consegue extrair (introdução, prāṇāyāma guiado, mantra) precisam ser preenchidos manualmente.</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${f('Data da aula', `<input type="date" id="am-data" value="${p.data_aula || ''}" style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%">`)}
          ${f('Modalidade', inp('am-modalidade', p.modalidade))}
        </div>
        ${f('Nível (síntese)', ta('am-nivel', p.nivel, 2))}
        ${f('Descrição (síntese)', ta('am-descricao', p.descricao, 3))}

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          ${f('Total de poses', inp('am-total-poses', p.total_poses))}
          ${f('Poses únicas', inp('am-poses-unicas', p.poses_unicas))}
          ${f('Poses base', inp('am-poses-base', p.poses_base))}
        </div>

        <div style="border-top:1px solid var(--borda);padding-top:14px;margin-top:4px">
          <div style="font-size:11px;font-weight:500;color:var(--verde);margin-bottom:10px">Estatísticas extraídas do PDF (uma linha = termo: percentual)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${f('Músculos', ta('am-musculos', _fmtListaPercentual(p.musculos), 6))}
            ${f('Tipos de Yoga', ta('am-tipos-yoga', _fmtListaPercentual(p.tipos_yoga), 6))}
            ${f('Posições do corpo', ta('am-posicoes', _fmtListaPercentual(p.posicoes_corpo), 5))}
            ${f('Meridianos', ta('am-meridianos', _fmtListaPercentual(p.meridianos), 3))}
            ${f('Koshas', ta('am-koshas', _fmtListaPercentual(p.koshas), 5))}
            ${f('Chakras', ta('am-chakras', _fmtListaPercentual(p.chakras), 6))}
            ${f('Gunas', ta('am-gunas', _fmtListaPercentual(p.gunas), 3))}
            ${f('% Mudras e Prāṇāyāma', inp('am-mudras-pct', p.mudras_pranayama_percentual))}
          </div>
        </div>

        <div style="border-top:1px solid var(--borda);padding-top:14px;margin-top:4px">
          <div style="font-size:11px;font-weight:500;color:var(--verde);margin-bottom:10px">Campos manuais (não vêm do PDF — uma linha = termo: descrição)</div>
          ${f('Introdução', ta('am-introducao', _fmtListaTermoDesc(porSlot[window._asanaSlotAtual]?.introducao), 5), 'ex: Dharana: Retenha os sentidos...')}
          ${f('Prāṇāyāma (prática guiada)', ta('am-pranayama', _fmtListaTermoDesc(porSlot[window._asanaSlotAtual]?.pranayama), 3))}
          ${f('Mantra', ta('am-mantra', _fmtListaTermoDesc(porSlot[window._asanaSlotAtual]?.mantra), 2))}
        </div>
      </div>
    `
  }

  function _mostrarBotaoSalvarAsana() {
    document.getElementById('asana-modal-footer').innerHTML = `
      <button onclick="voltarEtapa1Asana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer;margin-right:auto">
        ← Novo PDF
      </button>
      <button onclick="fecharFormAsana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
      <button onclick="salvarAsana()"
        style="padding:8px 16px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;
               font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500">
        <i class="ti ti-check"></i> Salvar
      </button>`
  }

  window.voltarEtapa1Asana = function() {
    document.getElementById('am-etapa-1').style.display = 'block'
    document.getElementById('am-etapa-2').style.display = 'none'
    const btn = document.getElementById('btn-interpretar-am')
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-sparkles"></i> Interpretar com IA' }
    document.getElementById('asana-modal-footer').innerHTML = `
      <button onclick="fecharFormAsana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>`
  }

  window.salvarAsana = async function() {
    const slot = window._asanaSlotAtual
    if (!slot) { toast('Erro: slot não identificado'); return }
    const get = id => document.getElementById(id)?.value?.trim() || ''
    const getNum = id => { const v = get(id); return v === '' ? null : parseFloat(v) }

    const payload = {
      slot,
      numero:       getNum('am-numero'),
      duracao:      get('am-duracao') || null,
      link_tummee:  get('am-link') || null,
      introducao:   _parseListaTermoDesc(get('am-introducao')),
      pranayama:    _parseListaTermoDesc(get('am-pranayama')),
      mantra:       _parseListaTermoDesc(get('am-mantra')),
      data_aula:    get('am-data') || null,
      modalidade:   get('am-modalidade') || null,
      nivel:        get('am-nivel') || null,
      descricao:    get('am-descricao') || null,
      total_poses:  getNum('am-total-poses'),
      poses_unicas: getNum('am-poses-unicas'),
      poses_base:   getNum('am-poses-base'),
      musculos:       _parseListaPercentual(get('am-musculos')),
      tipos_yoga:     _parseListaPercentual(get('am-tipos-yoga')),
      posicoes_corpo: _parseListaPercentual(get('am-posicoes')),
      koshas:         _parseListaPercentual(get('am-koshas')),
      chakras:        _parseListaPercentual(get('am-chakras')),
      gunas:          _parseListaPercentual(get('am-gunas')),
      meridianos:     _parseListaPercentual(get('am-meridianos')),
      mudras_pranayama_percentual: getNum('am-mudras-pct'),
      atualizado_em: new Date().toISOString(),
    }

    const { error: err } = await sb.from('asana_praticas').upsert(payload, { onConflict: 'slot' })
    if (err) { toast('Erro: ' + err.message); return }
    toast('✓ Salvo!')
    fecharFormAsana()
    navigate('asana-admin')
  }
}
