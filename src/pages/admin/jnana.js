/**
 * src/pages/admin/jnana.js
 * Gestão das posturas do Jñāna Mārga (GUIPPY)
 * Cadastro via IA: cola o texto bruto → API Anthropic interpreta → campos preenchidos
 */

import { toast } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'

export async function renderJnanaAdmin(container, page) {
  const sb   = window._sb
  const hoje = new Date().toISOString().slice(0, 10)

  const { data: posturas, error } = await sb
    .from('jnana_posturas')
    .select('id,nome_popular,nome_sanscrito,publicada_em,etimologia')
    .order('publicada_em', { ascending: false })

  if (error) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Jñāna Mārga</div></div>
      <div class="content"><p style="color:#c0392b">Erro: ${error.message}</p></div>`
    return
  }

  const hojePublicada = (posturas||[]).find(p => p.publicada_em === hoje)

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Jñāna Mārga — GUIPPY</div>
      <button onclick="abrirFormJnana()"
        style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;
               border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
               display:flex;align-items:center;gap:5px">
        <i class="ti ti-sparkles"></i> Nova postura
      </button>
    </div>
    <div class="content">

      ${!hojePublicada
        ? `<div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);
                      border-radius:8px;padding:12px 16px;margin-bottom:16px;
                      display:flex;align-items:center;gap:10px;font-size:13px;color:#7a5a10">
             <i class="ti ti-alert-triangle" style="color:var(--dourado);font-size:18px"></i>
             <span>Nenhuma postura publicada hoje. <strong>Cadastre a postura do dia.</strong></span>
           </div>`
        : `<div style="background:#e8f4e8;border:1px solid #b8ddb8;border-radius:8px;
                      padding:12px 16px;margin-bottom:16px;font-size:13px;color:#1a5a1a;
                      display:flex;align-items:center;gap:10px">
             <i class="ti ti-check" style="font-size:18px"></i>
             <span>Postura de hoje: <strong>${hojePublicada.nome_popular} — ${hojePublicada.nome_sanscrito}</strong></span>
           </div>`
      }

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px">
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Total publicadas</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:var(--verde)">${(posturas||[]).length}</div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Esta semana</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:var(--verde)">
            ${(posturas||[]).filter(p => {
              const d = new Date(p.publicada_em + 'T12:00')
              const h7 = new Date(); h7.setDate(h7.getDate() - 7)
              return d >= h7
            }).length}
          </div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Última postura</div>
          <div style="font-size:13px;font-weight:500;color:var(--verde);margin-top:4px">
            ${(posturas||[])[0]?.nome_popular || '—'}
          </div>
        </div>
      </div>

      <!-- Lista -->
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 160px 100px 80px;padding:8px 18px;
                    background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;
                    letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
          <span>Postura</span><span>Sânscrito</span><span>Publicada em</span><span>Ação</span>
        </div>
        ${(posturas||[]).length === 0
          ? '<div style="padding:24px 18px;font-size:13px;color:var(--txt2)">Nenhuma postura cadastrada ainda.</div>'
          : (posturas||[]).map(p => {
              const isHoje = p.publicada_em === hoje
              return `<div style="display:grid;grid-template-columns:1fr 160px 100px 80px;
                        align-items:center;gap:10px;padding:11px 18px;
                        border-bottom:1px solid rgba(212,200,158,.3);font-size:12px;
                        background:${isHoje ? 'rgba(232,188,79,.05)' : 'transparent'}">
                <div>
                  <div style="font-weight:500;color:var(--txt)">${p.nome_popular}</div>
                  <div style="font-size:10px;color:var(--txt2);margin-top:1px">${p.etimologia||''}</div>
                </div>
                <span style="color:var(--txt2);font-style:italic">${p.nome_sanscrito}</span>
                <span style="font-size:11px;color:${isHoje?'var(--verde)':'var(--txt2)'};font-weight:${isHoje?'500':'400'}">
                  ${isHoje ? '✓ Hoje' : new Date(p.publicada_em+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})}
                </span>
                <div style="display:flex;gap:4px">
                  <button onclick="editarPostura('${p.id}')"
                    style="padding:3px 8px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✎</button>
                  <button onclick="excluirPostura('${p.id}','${p.nome_popular.replace(/'/g,"\\'")}')"
                    style="padding:3px 8px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✕</button>
                </div>
              </div>`
            }).join('')
        }
      </div>
    </div>

    <!-- ── Modal ─────────────────────────────────────────────── -->
    <div id="modal-jnana" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);
                                   z-index:200;align-items:flex-start;justify-content:center;
                                   padding:16px;overflow-y:auto">
      <div style="background:#fff;border-radius:12px;width:680px;max-width:100%;margin:auto">

        <!-- Header modal -->
        <div style="background:var(--verde);padding:16px 20px;border-radius:12px 12px 0 0;
                    display:flex;align-items:center;justify-content:space-between;
                    position:sticky;top:0;z-index:1">
          <div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;
                        color:var(--bege)" id="jnana-modal-titulo">Nova Postura</div>
            <div style="font-size:11px;color:rgba(242,236,206,.6);margin-top:2px">
              Cole o texto do GUIPPY e a IA extrai os campos automaticamente
            </div>
          </div>
          <button onclick="fecharFormJnana()"
            style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
        </div>

        <div style="padding:20px" id="jnana-modal-body">
          <!-- Etapa 1: colar texto -->
          <div id="jn-etapa-1">
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;
                             color:var(--txt2);font-weight:500">Cole o texto da postura</label>
              <textarea id="jn-texto-bruto" rows="12" placeholder="Cole aqui o texto completo da postura do GUIPPY..."
                style="border:1px solid var(--borda);border-radius:6px;padding:10px 12px;font-size:13px;
                       font-family:'DM Sans',sans-serif;outline:none;width:100%;resize:vertical;
                       line-height:1.6"></textarea>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:16px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;
                             color:var(--txt2);font-weight:500">Data de publicação</label>
              <input type="date" id="jn-data-pub" value="${hoje}"
                style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                       font-family:'DM Sans',sans-serif;outline:none;width:200px">
              <div style="font-size:10px;color:var(--txt2)">Posturas com data futura ficam invisíveis para alunos até lá.</div>
            </div>
            <button onclick="interpretarComIA()"
              id="btn-interpretar"
              style="width:100%;padding:12px;background:var(--verde);color:var(--bege);border:none;
                     border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;
                     font-family:'DM Sans',sans-serif;display:flex;align-items:center;
                     justify-content:center;gap:8px">
              <i class="ti ti-sparkles"></i> Interpretar com IA
            </button>
          </div>

          <!-- Etapa 2: campos preenchidos para revisão -->
          <div id="jn-etapa-2" style="display:none"></div>
        </div>

        <div id="jnana-modal-footer" style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:8px">
          <button onclick="fecharFormJnana()"
            style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
                   border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
        </div>
      </div>
    </div>
  `

  uiAnimar(container)

  // ── Abrir modal (nova postura) ────────────────────────────
  window.abrirFormJnana = function() {
    window._editJnanaId = null
    document.getElementById('jnana-modal-titulo').textContent = 'Nova Postura'
    document.getElementById('jn-etapa-1').style.display = 'block'
    document.getElementById('jn-etapa-2').style.display = 'none'
    document.getElementById('jn-etapa-2').innerHTML = ''
    document.getElementById('jn-texto-bruto').value = ''
    document.getElementById('jn-data-pub').value = hoje
    document.getElementById('jnana-modal-footer').innerHTML = `
      <button onclick="fecharFormJnana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>`
    document.getElementById('modal-jnana').style.display = 'flex'
  }

  // ── Editar postura existente ──────────────────────────────
  window.editarPostura = async function(id) {
    const { data: p } = await sb.from('jnana_posturas').select('*').eq('id', id).single()
    if (!p) { toast('Postura não encontrada'); return }
    window._editJnanaId = id
    document.getElementById('jnana-modal-titulo').textContent = `Editar — ${p.nome_popular}`
    document.getElementById('jn-etapa-1').style.display = 'none'

    // Monta campos preenchidos para edição
    _montarCamposRevisao(p)
    document.getElementById('jn-etapa-2').style.display = 'block'
    _mostrarBotaoSalvar()
    document.getElementById('modal-jnana').style.display = 'flex'
  }

  window.fecharFormJnana = function() {
    document.getElementById('modal-jnana').style.display = 'none'
    window._editJnanaId = null
  }

  // ── Interpretar com IA ────────────────────────────────────
  window.interpretarComIA = async function() {
    const texto = document.getElementById('jn-texto-bruto').value.trim()
    if (!texto) { toast('Cole o texto da postura primeiro'); return }

    const btn = document.getElementById('btn-interpretar')
    btn.disabled = true
    btn.innerHTML = '<span class="spinner"></span> Interpretando...'

    try {
      const SUPABASE_ANON = (await import('../../lib/supabase.js')).SUPABASE_ANON
      const FN_URL = 'https://kctgcjvfsuinwlbgljdw.supabase.co/functions/v1/anthropic-proxy'

      const response = await fetch(FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + SUPABASE_ANON,
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-6',
          max_tokens: 1000,
          system: `Você é um extrator de dados de textos sobre posturas de yoga.
Extraia as informações do texto e retorne APENAS um JSON válido, sem markdown, sem explicações.
Formato exato:
{
  "nome_popular": "string",
  "nome_sanscrito": "string",
  "etimologia": "string ou null",
  "simbolismo": "string ou null",
  "instrucoes": ["string", "string", ...],
  "beneficios": "string ou null",
  "sistemas": ["string", ...],
  "elementos": ["string", ...],
  "ayurveda": "string ou null",
  "chakras": "string ou null"
}
instrucoes: cada item é um passo separado (sem numeração).
sistemas/elementos: array de strings simples.
Se um campo não existir no texto, use null ou array vazio.`,
          messages: [{ role: 'user', content: texto }],
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('Proxy erro:', response.status, errText)
        throw new Error('Proxy retornou ' + response.status + ': ' + errText)
      }

      const data = await response.json()
      const raw  = data.content?.[0]?.text || ''

      console.log('IA retornou:', raw) // debug — remover depois

      let parsed
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      } catch {
        throw new Error('IA retornou formato inesperado. Tente novamente.')
      }

      // Adiciona a data de publicação escolhida
      parsed.publicada_em = document.getElementById('jn-data-pub').value || hoje

      // Mostra campos para revisão
      _montarCamposRevisao(parsed)
      document.getElementById('jn-etapa-1').style.display = 'none'
      document.getElementById('jn-etapa-2').style.display = 'block'
      _mostrarBotaoSalvar()

      toast('✓ Campos extraídos — revise e salve')

    } catch(e) {
      toast('Erro: ' + e.message)
      btn.disabled = false
      btn.innerHTML = '<i class="ti ti-sparkles"></i> Interpretar com IA'
    }
  }

  // ── Monta campos de revisão ───────────────────────────────
  function _montarCamposRevisao(p) {
    const f = (label, id, el, dica = '') => `
      <div style="display:flex;flex-direction:column;gap:4px">
        <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;
                       color:var(--txt2);font-weight:500">${label}</label>
        ${el}
        ${dica ? `<div style="font-size:10px;color:var(--txt2)">${dica}</div>` : ''}
      </div>`

    const inp = (id, val = '', ph = '') =>
      `<input id="${id}" value="${(val||'').replace(/"/g,'&quot;')}" placeholder="${ph}"
        style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
               font-family:'DM Sans',sans-serif;outline:none;width:100%">`

    const ta = (id, val = '', rows = 3, ph = '') =>
      `<textarea id="${id}" rows="${rows}" placeholder="${ph}"
        style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
               font-family:'DM Sans',sans-serif;outline:none;width:100%;resize:vertical">${val||''}</textarea>`

    document.getElementById('jn-etapa-2').innerHTML = `
      <div style="background:rgba(31,56,31,.04);border-radius:8px;padding:10px 14px;
                  margin-bottom:16px;font-size:12px;color:var(--verde);
                  display:flex;align-items:center;gap:8px">
        <i class="ti ti-sparkles"></i>
        <span>Campos extraídos pela IA. Revise e corrija se necessário antes de salvar.</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${f('Nome popular',  'jn-popular',   inp('jn-popular',   p.nome_popular,   'ex: Cadeira'))}
          ${f('Nome sânscrito','jn-sanscrito',  inp('jn-sanscrito', p.nome_sanscrito, 'ex: Utkaṭāsana'))}
        </div>
        ${f('Etimologia', 'jn-etim', inp('jn-etim', p.etimologia, 'ex: Utka = feroz + Asana = postura'))}
        ${f('URL da imagem', 'jn-imagem',
          inp('jn-imagem', p.imagem, 'https://i.imgur.com/...'),
          'Link direto da imagem (Imgur recomendado). Opcional.'
        )}
        ${f('Data de publicação', 'jn-data',
          `<input type="date" id="jn-data" value="${p.publicada_em || hoje}"
            style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                   font-family:'DM Sans',sans-serif;outline:none;width:200px">`,
          'Posturas com data futura ficam invisíveis para alunos até lá.'
        )}
        ${f('Simbolismo', 'jn-simb', ta('jn-simb', p.simbolismo, 4))}
        ${f('Instruções', 'jn-inst',
          ta('jn-inst', (p.instrucoes||[]).join('\n'), 8),
          'Uma linha = um passo. A IA já separou — revise se precisar.'
        )}
        ${f('Benefícios', 'jn-benef', ta('jn-benef', p.beneficios, 3))}
        ${f('Sistemas equilibrados', 'jn-sist',
          inp('jn-sist', (p.sistemas||[]).join(', ')),
          'Separados por vírgula.'
        )}
        ${f('Elementos', 'jn-elem',
          inp('jn-elem', (p.elementos||[]).join(', ')),
          'Separados por vírgula.'
        )}
        ${f('Ayurveda', 'jn-ayur', inp('jn-ayur', p.ayurveda))}
        ${f('Chakras',  'jn-chak', inp('jn-chak', p.chakras))}
      </div>
    `
  }

  function _mostrarBotaoSalvar() {
    document.getElementById('jnana-modal-footer').innerHTML = `
      <button onclick="voltarEtapa1()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer;margin-right:auto">
        ← Novo texto
      </button>
      <button onclick="fecharFormJnana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
      <button onclick="salvarPostura()"
        style="padding:8px 16px;background:var(--verde);color:var(--bege);border:none;
               border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
               font-weight:500">
        <i class="ti ti-check"></i> Salvar postura
      </button>`
  }

  window.voltarEtapa1 = function() {
    document.getElementById('jn-etapa-1').style.display = 'block'
    document.getElementById('jn-etapa-2').style.display = 'none'
    const btn = document.getElementById('btn-interpretar')
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-sparkles"></i> Interpretar com IA' }
    document.getElementById('jnana-modal-footer').innerHTML = `
      <button onclick="fecharFormJnana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>`
  }

  // ── Salvar ────────────────────────────────────────────────
  window.salvarPostura = async function() {
    const get    = id => document.getElementById(id)?.value?.trim() || ''
    const getArr = id => get(id).split(',').map(s => s.trim()).filter(Boolean)
    const getLin = id => get(id).split('\n').map(s => s.trim()).filter(Boolean)

    const nome_popular   = get('jn-popular')
    const nome_sanscrito = get('jn-sanscrito')
    if (!nome_popular || !nome_sanscrito) { toast('Preencha nome popular e sânscrito'); return }

    const payload = {
      nome_popular,
      nome_sanscrito,
      etimologia:   get('jn-etim')  || null,
      imagem:       get('jn-imagem')|| null,
      publicada_em: get('jn-data')  || hoje,
      simbolismo:   get('jn-simb')  || null,
      instrucoes:   getLin('jn-inst'),
      beneficios:   get('jn-benef') || null,
      sistemas:     getArr('jn-sist'),
      elementos:    getArr('jn-elem'),
      ayurveda:     get('jn-ayur')  || null,
      chakras:      get('jn-chak')  || null,
    }

    let err
    if (window._editJnanaId) {
      ;({ error: err } = await sb.from('jnana_posturas').update(payload).eq('id', window._editJnanaId))
    } else {
      ;({ error: err } = await sb.from('jnana_posturas').insert(payload))
    }

    if (err) { toast('Erro: ' + err.message); return }
    toast('✓ Postura salva!')
    fecharFormJnana()
    navigate('jnana-admin')
  }

  // ── Excluir ───────────────────────────────────────────────
  window.excluirPostura = async function(id, nome) {
    if (!confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) return
    const { error: err } = await sb.from('jnana_posturas').delete().eq('id', id)
    if (err) { toast('Erro: ' + err.message); return }
    toast('✓ Postura excluída.')
    navigate('jnana-admin')
  }
}       
