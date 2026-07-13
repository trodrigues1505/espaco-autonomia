/**
 * src/pages/admin/adhyayana.js
 * Gestão do Yoga Adhyayana — estudo teórico/simbólico de cada āsana.
 * Cadastro via IA: cola o texto bruto (nome / origem / koshas / vāyus / chakras /
 * doshas / tattvas / benefícios / observações / fechamento) → IA interpreta os
 * blocos de texto → admin confirma e salva.
 *
 * Não confundir com asana.js (Āsana Mārga): aquele é a aula prática com
 * estatísticas agregadas (musculos/koshas em percentual). Este é o estudo
 * descritivo de uma postura por vez, publicado numa data — mesmo padrão de
 * agendamento do jnana.js.
 */

import { toast } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'

export async function renderAdhyayanaAdmin(container, page) {
  const sb   = window._sb
  const hoje = new Date().toISOString().slice(0, 10)

  const { data: asanas, error } = await sb
    .from('adhyayana_asanas')
    .select('id,nome,nome_alternativo,nivel,publicada_em')
    .order('publicada_em', { ascending: true })

  if (error) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Yoga Adhyayana</div></div>
      <div class="content"><p style="color:#c0392b">Erro: ${error.message}</p></div>`
    return
  }

  const hojePublicado = (asanas||[]).find(a => a.publicada_em === hoje)
  const futuros       = (asanas||[]).filter(a => a.publicada_em > hoje)
  const publicados    = (asanas||[]).filter(a => a.publicada_em <= hoje)

  // Sugestão de dias úteis (seg-sex) livres nas próximas semanas — mesmo padrão do jnana.js
  const diasOcupados = new Set((asanas||[]).map(a => a.publicada_em))
  const sugestoesDias = []
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (sugestoesDias.length < 10) {
    const iso = d.toISOString().slice(0, 10)
    const dia = d.getDay()
    if (dia >= 1 && dia <= 5 && !diasOcupados.has(iso)) sugestoesDias.push(iso)
    d.setDate(d.getDate() + 1)
  }
  const proximoLivre = sugestoesDias[0] || hoje

  function fmtDia(iso) {
    const dt = new Date(iso + 'T12:00')
    return dt.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'2-digit' })
  }

  function badgeStatus(iso) {
    if (iso === hoje) return `<span style="background:#e8f4e8;color:#1a5a1a;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600">✓ Hoje</span>`
    if (iso > hoje)  return `<span style="background:rgba(232,188,79,.15);color:#7a5a10;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500">⏳ Agendada</span>`
    return `<span style="background:rgba(31,56,31,.07);color:var(--txt2);padding:2px 8px;border-radius:20px;font-size:10px">Publicado</span>`
  }

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Yoga Adhyayana — Estudo dos Āsanas</div>
      <button onclick="abrirFormAdhyayana()"
        style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;
               border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
               display:flex;align-items:center;gap:5px">
        <i class="ti ti-sparkles"></i> Novo āsana
      </button>
    </div>
    <div class="content">

      ${!hojePublicado
        ? `<div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);
                      border-radius:8px;padding:12px 16px;margin-bottom:16px;
                      display:flex;align-items:center;gap:10px;font-size:13px;color:#7a5a10">
             <i class="ti ti-alert-triangle" style="color:var(--dourado);font-size:18px"></i>
             <span>Nenhum āsana publicado hoje. <strong>Cadastre o āsana do dia.</strong></span>
           </div>`
        : `<div style="background:#e8f4e8;border:1px solid #b8ddb8;border-radius:8px;
                      padding:12px 16px;margin-bottom:16px;font-size:13px;color:#1a5a1a;
                      display:flex;align-items:center;gap:10px">
             <i class="ti ti-check" style="font-size:18px"></i>
             <span>Āsana de hoje: <strong>${hojePublicado.nome}</strong></span>
           </div>`
      }

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px">
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Total publicados</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:var(--verde)">${publicados.length}</div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Agendados (futuros)</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:${futuros.length > 0 ? '#BA7517' : 'var(--txt2)'}">
            ${futuros.length}
          </div>
          ${futuros.length > 0
            ? `<div style="font-size:10px;color:#BA7517;margin-top:2px">próximo: ${fmtDia(futuros[0].publicada_em)}</div>`
            : `<div style="font-size:10px;color:var(--txt2);margin-top:2px">nenhum na fila</div>`}
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Próx. dia útil livre</div>
          <div style="font-size:13px;font-weight:500;color:var(--verde);margin-top:4px">${fmtDia(proximoLivre)}</div>
          <div style="font-size:10px;color:var(--txt2);margin-top:2px">${proximoLivre}</div>
        </div>
      </div>

      <!-- Lista agrupada -->
      ${futuros.length > 0 ? `
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#BA7517;font-weight:500;margin-bottom:8px">
          ⏳ Agendados — visíveis somente na data
        </div>
        <div style="background:#fff;border:1px solid rgba(232,188,79,.4);border-radius:var(--r);overflow:hidden;margin-bottom:18px">
          <div style="display:grid;grid-template-columns:1fr 130px 110px;padding:8px 18px;
                      background:rgba(232,188,79,.08);font-size:10px;text-transform:uppercase;
                      letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
            <span>Āsana</span><span>Data agendada</span><span>Ação</span>
          </div>
          ${futuros.map(a => `
            <div style="display:grid;grid-template-columns:1fr 130px 110px;
                        align-items:center;gap:10px;padding:11px 18px;
                        border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
              <div>
                <div style="font-weight:500;color:var(--txt)">${a.nome}</div>
                ${a.nome_alternativo ? `<div style="font-size:10px;color:var(--txt2);margin-top:1px;font-style:italic">${a.nome_alternativo}</div>` : ''}
              </div>
              <div style="display:flex;flex-direction:column;gap:3px">
                <input type="date" value="${a.publicada_em}" id="data-${a.id}"
                  style="border:1px solid var(--borda);border-radius:5px;padding:4px 8px;
                         font-size:11px;font-family:'DM Sans',sans-serif;color:var(--txt);
                         width:130px">
                <button onclick="reagendarAsanaAdhyayana('${a.id}')"
                  style="padding:2px 8px;background:rgba(232,188,79,.15);color:#7a5a10;
                         border:1px solid rgba(232,188,79,.4);border-radius:4px;font-size:10px;
                         cursor:pointer;font-family:'DM Sans',sans-serif">Reagendar</button>
              </div>
              <div style="display:flex;gap:4px">
                <button onclick="previaAdhyayana('${a.id}')"
                  style="padding:3px 8px;background:rgba(31,56,31,.08);color:var(--verde);border:none;border-radius:4px;font-size:10px;cursor:pointer" title="Prévia">👁</button>
                <button onclick="editarAdhyayana('${a.id}')"
                  style="padding:3px 8px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✎</button>
                <button onclick="excluirAdhyayana('${a.id}','${(a.nome||'').replace(/'/g,"\\'")}')"
                  style="padding:3px 8px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✕</button>
              </div>
            </div>`).join('')}
        </div>` : ''}

      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);font-weight:500;margin-bottom:8px">
        Publicados (${publicados.length})
      </div>
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 130px 80px;padding:8px 18px;
                    background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;
                    letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
          <span>Āsana</span><span>Publicado em</span><span>Ação</span>
        </div>
        ${publicados.length === 0
          ? '<div style="padding:24px 18px;font-size:13px;color:var(--txt2)">Nenhum āsana publicado ainda.</div>'
          : [...publicados].reverse().map(a => {
              const isHoje = a.publicada_em === hoje
              return `<div style="display:grid;grid-template-columns:1fr 130px 80px;
                        align-items:center;gap:10px;padding:11px 18px;
                        border-bottom:1px solid rgba(212,200,158,.3);font-size:12px;
                        background:${isHoje ? 'rgba(232,188,79,.05)' : 'transparent'}">
                <div>
                  <div style="font-weight:500;color:var(--txt)">${a.nome}</div>
                  ${a.nome_alternativo ? `<div style="font-size:10px;color:var(--txt2);margin-top:1px;font-style:italic">${a.nome_alternativo}</div>` : ''}
                </div>
                <div>${badgeStatus(a.publicada_em)}<div style="font-size:10px;color:var(--txt2);margin-top:2px">${fmtDia(a.publicada_em)}</div></div>
                <div style="display:flex;gap:4px">
                  <button onclick="previaAdhyayana('${a.id}')"
                    style="padding:3px 8px;background:rgba(31,56,31,.08);color:var(--verde);border:none;border-radius:4px;font-size:10px;cursor:pointer" title="Prévia">👁</button>
                  <button onclick="editarAdhyayana('${a.id}')"
                    style="padding:3px 8px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✎</button>
                  <button onclick="excluirAdhyayana('${a.id}','${(a.nome||'').replace(/'/g,"\\'")}')"
                    style="padding:3px 8px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✕</button>
                </div>
              </div>`
            }).join('')
        }
      </div>
    </div>

    <!-- ── Modal de prévia ───────────────────────────────────── -->
    <div id="modal-previa-adhyayana" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.7);
                                          z-index:300;align-items:flex-start;justify-content:center;
                                          padding:16px;overflow-y:auto">
      <div style="width:560px;max-width:100%;margin:auto">
        <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
          <button onclick="document.getElementById('modal-previa-adhyayana').style.display='none'"
            style="background:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px">×</button>
        </div>
        <div id="previa-adhyayana-body"></div>
      </div>
    </div>

    <!-- ── Modal de cadastro ─────────────────────────────────── -->
    <div id="modal-adhyayana" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);
                                   z-index:200;align-items:flex-start;justify-content:center;
                                   padding:16px;overflow-y:auto">
      <div style="background:#fff;border-radius:12px;width:680px;max-width:100%;margin:auto">

        <div style="background:var(--verde);padding:16px 20px;border-radius:12px 12px 0 0;
                    display:flex;align-items:center;justify-content:space-between;
                    position:sticky;top:0;z-index:1">
          <div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;
                        color:var(--bege)" id="adhy-modal-titulo">Novo Āsana</div>
            <div style="font-size:11px;color:rgba(242,236,206,.6);margin-top:2px">
              Cole o texto completo do estudo do āsana e a IA extrai os campos
            </div>
          </div>
          <button onclick="fecharFormAdhyayana()"
            style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
        </div>

        <div style="padding:20px" id="adhyayana-modal-body">
          <div id="adhy-etapa-1">
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;
                             color:var(--txt2);font-weight:500">Cole o texto completo do estudo do āsana</label>
              <textarea id="adhy-texto-bruto" rows="14" placeholder="Cole aqui: nome / origem e simbolismo / koshas / vāyus / chakras / doshas / tattvas / benefícios / observações terapêuticas / fechamento..."
                style="border:1px solid var(--borda);border-radius:6px;padding:10px 12px;font-size:13px;
                       font-family:'DM Sans',sans-serif;outline:none;width:100%;resize:vertical;
                       line-height:1.6"></textarea>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:16px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;
                             color:var(--txt2);font-weight:500">Data de publicação</label>
              <input type="date" id="adhy-data-pub" value="${proximoLivre}"
                style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                       font-family:'DM Sans',sans-serif;outline:none;width:200px">
              <div style="font-size:10px;color:var(--txt2)">
                Próximo dia útil livre: <strong>${fmtDia(proximoLivre)}</strong>.
                Āsanas com data futura ficam invisíveis para alunos até lá.
              </div>
            </div>
            <button onclick="interpretarComIAAdhyayana()"
              id="btn-interpretar-adhy"
              style="width:100%;padding:12px;background:var(--verde);color:var(--bege);border:none;
                     border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;
                     font-family:'DM Sans',sans-serif;display:flex;align-items:center;
                     justify-content:center;gap:8px">
              <i class="ti ti-sparkles"></i> Interpretar com IA
            </button>
          </div>
          <div id="adhy-etapa-2" style="display:none"></div>
        </div>

        <div id="adhyayana-modal-footer" style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:8px">
          <button onclick="fecharFormAdhyayana()"
            style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
                   border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
        </div>
      </div>
    </div>
  `

  uiAnimar(container)

  // ── Reagendar rápido ──────────────────────────────────────
  window.reagendarAsanaAdhyayana = async function(id) {
    const novaData = document.getElementById('data-' + id)?.value
    if (!novaData) { toast('Selecione uma data'); return }
    const { error: err } = await sb.from('adhyayana_asanas').update({ publicada_em: novaData }).eq('id', id)
    if (err) { toast('Erro: ' + err.message); return }
    toast('✓ Data atualizada para ' + fmtDia(novaData))
    navigate('adhyayana-admin')
  }

  window.abrirFormAdhyayana = function() {
    window._editAdhyayanaId = null
    document.getElementById('adhy-modal-titulo').textContent = 'Novo Āsana'
    document.getElementById('adhy-etapa-1').style.display = 'block'
    document.getElementById('adhy-etapa-2').style.display = 'none'
    document.getElementById('adhy-etapa-2').innerHTML = ''
    document.getElementById('adhy-texto-bruto').value = ''
    document.getElementById('adhy-data-pub').value = proximoLivre
    document.getElementById('adhyayana-modal-footer').innerHTML = `
      <button onclick="fecharFormAdhyayana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>`
    document.getElementById('modal-adhyayana').style.display = 'flex'
  }

  window.fecharFormAdhyayana = function() {
    document.getElementById('modal-adhyayana').style.display = 'none'
    window._editAdhyayanaId = null
  }

  window.previaAdhyayana = async function(id) {
    const { data: a } = await sb.from('adhyayana_asanas').select('*').eq('id', id).single()
    if (!a) { toast('Āsana não encontrado'); return }
    const blocos = [
      ['Origem e simbolismo', a.origem_simbolismo],
      ['Koshas estimulados', a.koshas],
      ['Prāṇa Vāyus ativados', a.vayus],
      ['Chakras envolvidos', a.chakras],
      ['Doshas', a.doshas],
      ['Elementos (Tattvas)', a.tattvas],
      ['Benefícios fisiológicos', a.beneficios_fisiologicos],
      ['Benefícios sutis', a.beneficios_sutis],
      ['Observações terapêuticas', a.observacoes_terapeuticas],
    ].filter(([, v]) => v)

    document.getElementById('previa-adhyayana-body').innerHTML = `
      <div style="background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:var(--verde);padding:16px 18px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:rgba(242,236,206,.55);margin-bottom:6px">
            ✦ Yoga Adhyayana · ${fmtDia(a.publicada_em)}${a.nivel ? ' · ' + a.nivel : ''}
          </div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--bege)">${a.nome}</div>
          ${a.nome_alternativo ? `<div style="font-size:13px;font-style:italic;color:rgba(242,236,206,.8);margin-top:2px">${a.nome_alternativo}</div>` : ''}
        </div>
        <div style="padding:16px 18px">
          ${blocos.map(([titulo, texto]) => `
            <div style="margin-bottom:14px">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;margin-bottom:6px">${titulo}</div>
              <div style="font-size:13px;color:var(--txt);line-height:1.7;white-space:pre-line">${texto}</div>
            </div>`).join('')}
          ${a.fechamento ? `
            <div style="background:#f9f7f0;border-radius:8px;padding:12px 14px;margin-top:8px">
              <p style="font-size:13px;font-style:italic;color:var(--verde);line-height:1.7;margin:0;white-space:pre-line">${a.fechamento}</p>
            </div>` : ''}
        </div>
      </div>`
    document.getElementById('modal-previa-adhyayana').style.display = 'flex'
  }

  window.editarAdhyayana = async function(id) {
    const { data: a } = await sb.from('adhyayana_asanas').select('*').eq('id', id).single()
    if (!a) { toast('Āsana não encontrado'); return }
    window._editAdhyayanaId = id
    document.getElementById('adhy-modal-titulo').textContent = `Editar — ${a.nome}`
    document.getElementById('adhy-etapa-1').style.display = 'none'
    _montarCamposRevisao(a)
    document.getElementById('adhy-etapa-2').style.display = 'block'
    _mostrarBotaoSalvar()
    document.getElementById('modal-adhyayana').style.display = 'flex'
  }

  window.interpretarComIAAdhyayana = async function() {
    const texto = document.getElementById('adhy-texto-bruto').value.trim()
    if (!texto) { toast('Cole o texto do āsana primeiro'); return }
    const btn = document.getElementById('btn-interpretar-adhy')
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
          max_tokens: 1800,
          system: `Você é um extrator de dados de textos de estudo simbólico/filosófico de posturas de yoga (āsanas).
O texto colado tipicamente contém: nome do āsana (e nome alternativo em sânscrito), nível,
origem e simbolismo, koshas estimulados, prāṇa vāyus ativados, chakras envolvidos, doshas,
elementos (tattvas), benefícios (fisiológicos e sutis), observações terapêuticas, e um
parágrafo de fechamento reflexivo.

Extraia e retorne APENAS um JSON válido, sem markdown, sem explicações. Formato exato:
{
  "nome": "string",
  "nome_alternativo": "string ou null",
  "nivel": "string ou null",
  "origem_simbolismo": "string ou null",
  "koshas": "string ou null",
  "vayus": "string ou null",
  "chakras": "string ou null",
  "doshas": "string ou null",
  "tattvas": "string ou null",
  "beneficios_fisiologicos": "string ou null",
  "beneficios_sutis": "string ou null",
  "observacoes_terapeuticas": "string ou null",
  "fechamento": "string ou null"
}
Regras:
- Cada campo de texto deve preservar a formatação em bullet points do original quando houver
  (uma linha por item, prefixada com "• "), mantendo quebras de linha com \\n.
- fechamento é o parágrafo final reflexivo/poético do texto, geralmente após "---".
- Se um campo não existir no texto, use null.
- Não invente conteúdo que não está no texto.`,
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
      parsed.publicada_em = document.getElementById('adhy-data-pub').value || proximoLivre
      _montarCamposRevisao(parsed)
      document.getElementById('adhy-etapa-1').style.display = 'none'
      document.getElementById('adhy-etapa-2').style.display = 'block'
      _mostrarBotaoSalvar()
      toast('✓ Campos extraídos — revise e salve')
    } catch(e) {
      toast('Erro: ' + e.message)
      btn.disabled = false
      btn.innerHTML = '<i class="ti ti-sparkles"></i> Interpretar com IA'
    }
  }

  function _montarCamposRevisao(a) {
    const f = (label, el, dica = '') => `
      <div style="display:flex;flex-direction:column;gap:4px">
        <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;
                       color:var(--txt2);font-weight:500">${label}</label>
        ${el}
        ${dica ? `<div style="font-size:10px;color:var(--txt2)">${dica}</div>` : ''}
      </div>`
    const inp = (id, val = '', ph = '') =>
      `<input id="${id}" value="${(val||'').toString().replace(/"/g,'&quot;')}" placeholder="${ph}"
        style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
               font-family:'DM Sans',sans-serif;outline:none;width:100%">`
    const ta = (id, val = '', rows = 3, ph = '') =>
      `<textarea id="${id}" rows="${rows}" placeholder="${ph}"
        style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
               font-family:'DM Sans',sans-serif;outline:none;width:100%;resize:vertical">${val||''}</textarea>`

    document.getElementById('adhy-etapa-2').innerHTML = `
      <div style="background:rgba(31,56,31,.04);border-radius:8px;padding:10px 14px;
                  margin-bottom:16px;font-size:12px;color:var(--verde);
                  display:flex;align-items:center;gap:8px">
        <i class="ti ti-sparkles"></i>
        <span>Campos extraídos pela IA. Revise e corrija se necessário antes de salvar.</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr 150px;gap:12px">
          ${f('Nome', inp('adhy-nome', a.nome, 'ex: Devyāsana — Postura da Deusa'))}
          ${f('Nome alternativo', inp('adhy-nome-alt', a.nome_alternativo, 'ex: Utkaṭa Koṇāsana'))}
          ${f('Nível', inp('adhy-nivel', a.nivel, 'ex: Intermediário'))}
        </div>
        ${f('Data de publicação', `<input type="date" id="adhy-data" value="${a.publicada_em || proximoLivre}"
            style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                   font-family:'DM Sans',sans-serif;outline:none;width:200px">`)}
        ${f('Origem e simbolismo', ta('adhy-origem', a.origem_simbolismo, 5))}
        ${f('Koshas estimulados', ta('adhy-koshas', a.koshas, 4))}
        ${f('Prāṇa Vāyus ativados', ta('adhy-vayus', a.vayus, 4))}
        ${f('Chakras envolvidos', ta('adhy-chakras', a.chakras, 4))}
        ${f('Doshas', ta('adhy-doshas', a.doshas, 3))}
        ${f('Elementos (Tattvas)', ta('adhy-tattvas', a.tattvas, 4))}
        ${f('Benefícios fisiológicos', ta('adhy-benef-fisio', a.beneficios_fisiologicos, 5))}
        ${f('Benefícios sutis', ta('adhy-benef-sutis', a.beneficios_sutis, 4))}
        ${f('Observações terapêuticas', ta('adhy-observacoes', a.observacoes_terapeuticas, 4))}
        ${f('Fechamento (parágrafo reflexivo)', ta('adhy-fechamento', a.fechamento, 3))}
      </div>
    `
  }

  function _mostrarBotaoSalvar() {
    document.getElementById('adhyayana-modal-footer').innerHTML = `
      <button onclick="voltarEtapa1Adhyayana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer;margin-right:auto">
        ← Novo texto
      </button>
      <button onclick="fecharFormAdhyayana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
      <button onclick="salvarAdhyayana()"
        style="padding:8px 16px;background:var(--verde);color:var(--bege);border:none;
               border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
               font-weight:500">
        <i class="ti ti-check"></i> Salvar āsana
      </button>`
  }

  window.voltarEtapa1Adhyayana = function() {
    document.getElementById('adhy-etapa-1').style.display = 'block'
    document.getElementById('adhy-etapa-2').style.display = 'none'
    const btn = document.getElementById('btn-interpretar-adhy')
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-sparkles"></i> Interpretar com IA' }
    document.getElementById('adhyayana-modal-footer').innerHTML = `
      <button onclick="fecharFormAdhyayana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>`
  }

  window.salvarAdhyayana = async function() {
    const get = id => document.getElementById(id)?.value?.trim() || ''
    const nome = get('adhy-nome')
    if (!nome) { toast('Informe o nome do āsana'); return }
    const payload = {
      nome,
      nome_alternativo:         get('adhy-nome-alt') || null,
      nivel:                    get('adhy-nivel') || null,
      origem_simbolismo:        get('adhy-origem') || null,
      koshas:                   get('adhy-koshas') || null,
      vayus:                    get('adhy-vayus') || null,
      chakras:                  get('adhy-chakras') || null,
      doshas:                   get('adhy-doshas') || null,
      tattvas:                  get('adhy-tattvas') || null,
      beneficios_fisiologicos:  get('adhy-benef-fisio') || null,
      beneficios_sutis:         get('adhy-benef-sutis') || null,
      observacoes_terapeuticas: get('adhy-observacoes') || null,
      fechamento:               get('adhy-fechamento') || null,
      publicada_em:             get('adhy-data') || proximoLivre,
      atualizado_em:            new Date().toISOString(),
    }
    let err
    if (window._editAdhyayanaId) {
      ;({ error: err } = await sb.from('adhyayana_asanas').update(payload).eq('id', window._editAdhyayanaId))
    } else {
      ;({ error: err } = await sb.from('adhyayana_asanas').insert(payload))
    }
    if (err) { toast('Erro: ' + err.message); return }
    toast('✓ Āsana salvo!')
    fecharFormAdhyayana()
    navigate('adhyayana-admin')
  }

  window.excluirAdhyayana = async function(id, nome) {
    if (!confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) return
    const { error: err } = await sb.from('adhyayana_asanas').delete().eq('id', id)
    if (err) { toast('Erro: ' + err.message); return }
    toast('✓ Āsana excluído.')
    navigate('adhyayana-admin')
  }
}
