/**
 * src/pages/admin/jnana.js
 * Gestão do estudo dos Yoga Sutras no Jñāna Mārga.
 * Cadastro via IA: cola o texto bruto (ONDE ESTAMOS / sânscrito / COMENTÁRIO / NA PRÁTICA)
 * → API Anthropic interpreta os blocos de texto → admin confirma capítulo/número/data → salva.
 */

import { toast } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'

const CAPITULOS = [
  { nome: 'Samādhipāda',  ordem: 1 },
  { nome: 'Sādhanapāda',  ordem: 2 },
  { nome: 'Vibhūtipāda',  ordem: 3 },
  { nome: 'Kaivalyapāda', ordem: 4 },
]

// Rótulo de número de sutra: mostra intervalo (ex: "10–11") quando a linha
// cobre mais de um sutra (numero_sutra_fim preenchido), senão mostra o número único.
function _labelNumero(s) {
  return s.numero_sutra_fim ? `${s.numero_sutra}–${s.numero_sutra_fim}` : `${s.numero_sutra}`
}

export async function renderJnanaAdmin(container, page) {
  const sb   = window._sb
  const hoje = new Date().toISOString().slice(0, 10)

  const { data: sutras, error } = await sb
    .from('jnana_sutras')
    .select('id,capitulo,capitulo_ordem,numero_sutra,numero_sutra_fim,transliteracao,traducao,publicada_em')
    .order('publicada_em', { ascending: true })

  if (error) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Jñāna Mārga</div></div>
      <div class="content"><p style="color:#c0392b">Erro: ${error.message}</p></div>`
    return
  }

  const hojePublicado = (sutras||[]).find(s => s.publicada_em === hoje)
  const futuros       = (sutras||[]).filter(s => s.publicada_em > hoje)
  const publicados     = (sutras||[]).filter(s => s.publicada_em <= hoje)

  // Sugestão de dias úteis (seg-sex) livres nas próximas semanas
  const diasOcupados = new Set((sutras||[]).map(s => s.publicada_em))
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

  // Próximo número de sutra sugerido: continua o último capítulo cadastrado (por data), senão começa Samādhipāda #1.
  // Usa numero_sutra_fim quando existir, pois a última linha pode cobrir mais de um sutra
  // (ex: uma linha com numero_sutra=10 e numero_sutra_fim=11 já cobriu os sutras 10 e 11 —
  // o próximo cadastro deve sugerir 12, não 11).
  const ultimoCadastrado = (sutras||[]).slice().sort((a,b) => a.publicada_em < b.publicada_em ? 1 : -1)[0]
  const capituloSugerido = ultimoCadastrado ? ultimoCadastrado.capitulo_ordem : 1
  const numeroSugerido   = ultimoCadastrado
    ? (ultimoCadastrado.numero_sutra_fim || ultimoCadastrado.numero_sutra) + 1
    : 1

  function fmtDia(iso) {
    const dt = new Date(iso + 'T12:00')
    return dt.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'2-digit' })
  }

  function badgeStatus(iso) {
    if (iso === hoje) return `<span style="background:#e8f4e8;color:#1a5a1a;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600">✓ Hoje</span>`
    if (iso > hoje)  return `<span style="background:rgba(232,188,79,.15);color:#7a5a10;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500">⏳ Agendada</span>`
    return `<span style="background:rgba(31,56,31,.07);color:var(--txt2);padding:2px 8px;border-radius:20px;font-size:10px">Publicado</span>`
  }

  function selectCapitulo(id, ordemSelecionada) {
    return `<select id="${id}"
      style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
             font-family:'DM Sans',sans-serif;outline:none;width:100%">
      ${CAPITULOS.map(c => `<option value="${c.ordem}" ${c.ordem === ordemSelecionada ? 'selected' : ''}>${c.nome}</option>`).join('')}
    </select>`
  }

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Jñāna Mārga — Yoga Sutras</div>
      <button onclick="abrirFormJnana()"
        style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;
               border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
               display:flex;align-items:center;gap:5px">
        <i class="ti ti-sparkles"></i> Novo sutra
      </button>
    </div>
    <div class="content">

      ${!hojePublicado
        ? `<div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);
                      border-radius:8px;padding:12px 16px;margin-bottom:16px;
                      display:flex;align-items:center;gap:10px;font-size:13px;color:#7a5a10">
             <i class="ti ti-alert-triangle" style="color:var(--dourado);font-size:18px"></i>
             <span>Nenhum sutra publicado hoje. <strong>Cadastre o sutra do dia.</strong></span>
           </div>`
        : `<div style="background:#e8f4e8;border:1px solid #b8ddb8;border-radius:8px;
                      padding:12px 16px;margin-bottom:16px;font-size:13px;color:#1a5a1a;
                      display:flex;align-items:center;gap:10px">
             <i class="ti ti-check" style="font-size:18px"></i>
             <span>Sutra de hoje: <strong>${hojePublicado.capitulo} ${_labelNumero(hojePublicado)} — ${hojePublicado.transliteracao}</strong></span>
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
          <div style="display:grid;grid-template-columns:1fr 150px 130px 110px;padding:8px 18px;
                      background:rgba(232,188,79,.08);font-size:10px;text-transform:uppercase;
                      letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
            <span>Sutra</span><span>Capítulo</span><span>Data agendada</span><span>Ação</span>
          </div>
          ${futuros.map(s => `
            <div style="display:grid;grid-template-columns:1fr 150px 130px 110px;
                        align-items:center;gap:10px;padding:11px 18px;
                        border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
              <div>
                <div style="font-weight:500;color:var(--txt)">${s.capitulo} ${_labelNumero(s)}</div>
                <div style="font-size:10px;color:var(--txt2);margin-top:1px;font-style:italic">${s.transliteracao}</div>
              </div>
              <span style="color:var(--txt2);font-size:11px">${s.capitulo}</span>
              <div style="display:flex;flex-direction:column;gap:3px">
                <input type="date" value="${s.publicada_em}" id="data-${s.id}"
                  style="border:1px solid var(--borda);border-radius:5px;padding:4px 8px;
                         font-size:11px;font-family:'DM Sans',sans-serif;color:var(--txt);
                         width:130px">
                <button onclick="reagendarSutra('${s.id}')"
                  style="padding:2px 8px;background:rgba(232,188,79,.15);color:#7a5a10;
                         border:1px solid rgba(232,188,79,.4);border-radius:4px;font-size:10px;
                         cursor:pointer;font-family:'DM Sans',sans-serif">Reagendar</button>
              </div>
              <div style="display:flex;gap:4px">
                <button onclick="previaSutra('${s.id}')"
                  style="padding:3px 8px;background:rgba(31,56,31,.08);color:var(--verde);border:none;border-radius:4px;font-size:10px;cursor:pointer" title="Prévia">👁</button>
                <button onclick="editarSutra('${s.id}')"
                  style="padding:3px 8px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✎</button>
                <button onclick="excluirSutra('${s.id}','${s.capitulo} ${_labelNumero(s)}')"
                  style="padding:3px 8px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✕</button>
              </div>
            </div>`).join('')}
        </div>` : ''}

      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);font-weight:500;margin-bottom:8px">
        Publicados (${publicados.length})
      </div>
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 150px 130px 80px;padding:8px 18px;
                    background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;
                    letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
          <span>Sutra</span><span>Capítulo</span><span>Publicado em</span><span>Ação</span>
        </div>
        ${publicados.length === 0
          ? '<div style="padding:24px 18px;font-size:13px;color:var(--txt2)">Nenhum sutra publicado ainda.</div>'
          : [...publicados].reverse().map(s => {
              const isHoje = s.publicada_em === hoje
              return `<div style="display:grid;grid-template-columns:1fr 150px 130px 80px;
                        align-items:center;gap:10px;padding:11px 18px;
                        border-bottom:1px solid rgba(212,200,158,.3);font-size:12px;
                        background:${isHoje ? 'rgba(232,188,79,.05)' : 'transparent'}">
                <div>
                  <div style="font-weight:500;color:var(--txt)">${s.capitulo} ${_labelNumero(s)}</div>
                  <div style="font-size:10px;color:var(--txt2);margin-top:1px;font-style:italic">${s.transliteracao}</div>
                </div>
                <span style="color:var(--txt2);font-size:11px">${s.capitulo}</span>
                <div>${badgeStatus(s.publicada_em)}<div style="font-size:10px;color:var(--txt2);margin-top:2px">${fmtDia(s.publicada_em)}</div></div>
                <div style="display:flex;gap:4px">
                  <button onclick="previaSutra('${s.id}')"
                    style="padding:3px 8px;background:rgba(31,56,31,.08);color:var(--verde);border:none;border-radius:4px;font-size:10px;cursor:pointer" title="Prévia">👁</button>
                  <button onclick="editarSutra('${s.id}')"
                    style="padding:3px 8px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✎</button>
                  <button onclick="excluirSutra('${s.id}','${s.capitulo} ${_labelNumero(s)}')"
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

        <div style="background:var(--verde);padding:16px 20px;border-radius:12px 12px 0 0;
                    display:flex;align-items:center;justify-content:space-between;
                    position:sticky;top:0;z-index:1">
          <div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;
                        color:var(--bege)" id="jnana-modal-titulo">Novo Sutra</div>
            <div style="font-size:11px;color:rgba(242,236,206,.6);margin-top:2px">
              Cole o texto (ONDE ESTAMOS / sânscrito / COMENTÁRIO / NA PRÁTICA) e a IA extrai os campos
            </div>
          </div>
          <button onclick="fecharFormJnana()"
            style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
        </div>

        <div style="padding:20px" id="jnana-modal-body">
          <div id="jn-etapa-1">
            <div style="display:grid;grid-template-columns:1fr 100px;gap:12px;margin-bottom:12px">
              <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;
                               color:var(--txt2);font-weight:500">Capítulo</label>
                ${selectCapitulo('jn-capitulo', capituloSugerido)}
              </div>
              <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;
                               color:var(--txt2);font-weight:500">Nº sutra</label>
                <input type="number" id="jn-numero" min="1" value="${numeroSugerido}"
                  style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                         font-family:'DM Sans',sans-serif;outline:none;width:100%">
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;
                             color:var(--txt2);font-weight:500">Cole o texto completo do sutra</label>
              <textarea id="jn-texto-bruto" rows="14" placeholder="Cole aqui: ONDE ESTAMOS / sânscrito+transliteração+tradução / COMENTÁRIO / NA PRÁTICA..."
                style="border:1px solid var(--borda);border-radius:6px;padding:10px 12px;font-size:13px;
                       font-family:'DM Sans',sans-serif;outline:none;width:100%;resize:vertical;
                       line-height:1.6"></textarea>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:16px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;
                             color:var(--txt2);font-weight:500">Data de publicação</label>
              <input type="date" id="jn-data-pub" value="${proximoLivre}"
                style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                       font-family:'DM Sans',sans-serif;outline:none;width:200px">
              <div style="font-size:10px;color:var(--txt2)">
                Próximo dia útil livre: <strong>${fmtDia(proximoLivre)}</strong>.
                Sutras com data futura ficam invisíveis para alunos até lá.
              </div>
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

  // ── Reagendar rápido ──────────────────────────────────────
  window.reagendarSutra = async function(id) {
    const novaData = document.getElementById('data-' + id)?.value
    if (!novaData) { toast('Selecione uma data'); return }
    const { error: err } = await sb.from('jnana_sutras').update({ publicada_em: novaData }).eq('id', id)
    if (err) { toast('Erro: ' + err.message); return }
    toast('✓ Data atualizada para ' + fmtDia(novaData))
    navigate('jnana-admin')
  }

  window.abrirFormJnana = function() {
    window._editJnanaId = null
    document.getElementById('jnana-modal-titulo').textContent = 'Novo Sutra'
    document.getElementById('jn-etapa-1').style.display = 'block'
    document.getElementById('jn-etapa-2').style.display = 'none'
    document.getElementById('jn-etapa-2').innerHTML = ''
    document.getElementById('jn-texto-bruto').value = ''
    document.getElementById('jn-data-pub').value = proximoLivre
    document.getElementById('jn-capitulo').value = String(capituloSugerido)
    document.getElementById('jn-numero').value = numeroSugerido
    document.getElementById('jnana-modal-footer').innerHTML = `
      <button onclick="fecharFormJnana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>`
    document.getElementById('modal-jnana').style.display = 'flex'
  }

  window.previaSutra = async function(id) {
    const { data: s } = await sb.from('jnana_sutras').select('*').eq('id', id).single()
    if (!s) { toast('Sutra não encontrado'); return }
    document.getElementById('modal-previa-jnana')?.remove()
    const div = document.createElement('div')
    div.id = 'modal-previa-jnana'
    div.style.cssText = 'position:fixed;inset:0;background:rgba(31,56,31,.7);z-index:300;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto'
    const comentarioHtml = (s.comentario||'').split(/\n\s*\n/).map(p => `<p style="margin:0 0 10px">${p}</p>`).join('')
    div.innerHTML = `
      <div style="background:#fff;border-radius:12px;width:560px;max-width:100%;margin:auto;overflow:hidden">
        <div style="background:var(--verde);padding:14px 18px;display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--bege)">Prévia — visão do aluno</div>
          <button onclick="document.getElementById('modal-previa-jnana').remove()"
            style="background:none;border:none;color:var(--bege);font-size:20px;cursor:pointer;line-height:1">×</button>
        </div>
        <div style="padding:18px">
          <div style="background:var(--verde);border-radius:10px;padding:16px;margin-bottom:14px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:rgba(242,236,206,.55);margin-bottom:8px">✦ ${s.capitulo} · sutra ${_labelNumero(s)} · ${fmtDia(s.publicada_em)}</div>
            ${s.contexto_capitulo ? `<div style="font-size:12px;color:rgba(242,236,206,.75);line-height:1.6;margin-bottom:12px;font-style:italic">${s.contexto_capitulo}</div>` : ''}
            <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--bege);direction:ltr">${s.texto_devanagari}</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;color:rgba(242,236,206,.8);margin-top:4px">${s.transliteracao}</div>
            <div style="font-size:13px;color:rgba(242,236,206,.9);margin-top:8px">${s.traducao}</div>
          </div>
          ${s.comentario ? `
            <div style="margin-bottom:12px;background:#f9f7f0;border-radius:8px;padding:12px 14px">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;margin-bottom:6px">Comentário</div>
              <div style="font-size:13px;color:var(--txt);line-height:1.7">${comentarioHtml}</div>
            </div>` : ''}
          ${s.pratica ? `
            <div style="background:#f9f7f0;border-radius:8px;padding:12px 14px">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;margin-bottom:6px">Na prática</div>
              <p style="font-size:13px;color:var(--txt);line-height:1.7;margin:0">${s.pratica}</p>
            </div>` : ''}
        </div>
      </div>`
    document.body.appendChild(div)
    div.addEventListener('click', e => { if (e.target === div) div.remove() })
  }

  window.editarSutra = async function(id) {
    const { data: s } = await sb.from('jnana_sutras').select('*').eq('id', id).single()
    if (!s) { toast('Sutra não encontrado'); return }
    window._editJnanaId = id
    document.getElementById('jnana-modal-titulo').textContent = `Editar — ${s.capitulo} ${_labelNumero(s)}`
    document.getElementById('jn-etapa-1').style.display = 'none'
    _montarCamposRevisao(s)
    document.getElementById('jn-etapa-2').style.display = 'block'
    _mostrarBotaoSalvar()
    document.getElementById('modal-jnana').style.display = 'flex'
  }

  window.fecharFormJnana = function() {
    document.getElementById('modal-jnana').style.display = 'none'
    window._editJnanaId = null
  }

  window.interpretarComIA = async function() {
    const texto = document.getElementById('jn-texto-bruto').value.trim()
    if (!texto) { toast('Cole o texto do sutra primeiro'); return }
    const capituloOrdem = parseInt(document.getElementById('jn-capitulo').value, 10)
    const numeroSutra   = parseInt(document.getElementById('jn-numero').value, 10) || 1
    const btn = document.getElementById('btn-interpretar')
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
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: `Você é um extrator de dados de textos sobre o estudo dos Yoga Sutras de Patañjali.
O texto colado tem tipicamente estas seções, separadas por linhas de "---":
- ONDE ESTAMOS: contexto do capítulo/pāda em estudo
- Um bloco com o texto em devanāgarī, sua transliteração (IAST) e a tradução em português
- COMENTÁRIO: texto explicativo, pode ter vários parágrafos
- NA PRÁTICA: aplicação prática sugerida

Extraia as informações e retorne APENAS um JSON válido, sem markdown, sem explicações.
Formato exato:
{
  "contexto_capitulo": "string ou null",
  "texto_devanagari": "string",
  "transliteracao": "string",
  "traducao": "string",
  "comentario": "string ou null",
  "pratica": "string ou null"
}
Regras:
- texto_devanagari: copie exatamente o texto em escrita devanāgarī (script indiano), sem alterar caracteres.
- transliteracao: a versão em caracteres latinos com diacríticos (IAST), ex: "atha yogānuśāsanam".
- traducao: a tradução curta em português.
- comentario: preserve parágrafos separando-os com uma linha em branco (\\n\\n) entre eles.
- Se um campo não existir no texto, use null.`,
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
      parsed.capitulo_ordem = capituloOrdem
      parsed.capitulo       = (CAPITULOS.find(c => c.ordem === capituloOrdem) || CAPITULOS[0]).nome
      parsed.numero_sutra   = numeroSutra
      parsed.numero_sutra_fim = null
      parsed.publicada_em   = document.getElementById('jn-data-pub').value || proximoLivre
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

  function _montarCamposRevisao(s) {
    const f = (label, el, dica = '') => `
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
        <div style="display:grid;grid-template-columns:1fr 90px 90px 150px;gap:12px">
          ${f('Capítulo', selectCapitulo('jn-r-capitulo', s.capitulo_ordem))}
          ${f('Nº sutra', `<input type="number" id="jn-r-numero" min="1" value="${s.numero_sutra}"
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                     font-family:'DM Sans',sans-serif;outline:none;width:100%">`)}
          ${f('Até (opcional)', `<input type="number" id="jn-r-numero-fim" min="1" value="${s.numero_sutra_fim || ''}"
              placeholder="—"
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                     font-family:'DM Sans',sans-serif;outline:none;width:100%">`,
              'Preencha só se esta publicação juntar mais de um sutra (ex: 10 até 11).')}
          ${f('Data de publicação', `<input type="date" id="jn-data" value="${s.publicada_em || proximoLivre}"
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                     font-family:'DM Sans',sans-serif;outline:none;width:100%">`)}
        </div>
        ${f('Onde estamos (contexto do capítulo)', ta('jn-contexto', s.contexto_capitulo, 3))}
        ${f('Texto em devanāgarī', inp('jn-devanagari', s.texto_devanagari, 'ex: अथ योगानुशासनम्'))}
        ${f('Transliteração', inp('jn-translit', s.transliteracao, 'ex: atha yogānuśāsanam'))}
        ${f('Tradução', inp('jn-traducao', s.traducao))}
        ${f('Comentário', ta('jn-comentario', s.comentario, 8), 'Parágrafos separados por linha em branco.')}
        ${f('Na prática', ta('jn-pratica', s.pratica, 4))}
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
      <button onclick="salvarSutra()"
        style="padding:8px 16px;background:var(--verde);color:var(--bege);border:none;
               border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
               font-weight:500">
        <i class="ti ti-check"></i> Salvar sutra
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

  window.salvarSutra = async function() {
    const get = id => document.getElementById(id)?.value?.trim() || ''
    const capitulo_ordem = parseInt(get('jn-r-capitulo'), 10)
    const numero_sutra   = parseInt(get('jn-r-numero'), 10)
    const numeroFimRaw   = get('jn-r-numero-fim')
    const numero_sutra_fim = numeroFimRaw ? parseInt(numeroFimRaw, 10) : null
    const capitulo       = (CAPITULOS.find(c => c.ordem === capitulo_ordem) || CAPITULOS[0]).nome
    const texto_devanagari = get('jn-devanagari')
    const transliteracao   = get('jn-translit')
    const traducao         = get('jn-traducao')
    if (!texto_devanagari || !transliteracao || !traducao) {
      toast('Preencha devanāgarī, transliteração e tradução'); return
    }
    if (!numero_sutra) { toast('Informe o número do sutra'); return }
    if (numero_sutra_fim !== null && numero_sutra_fim <= numero_sutra) {
      toast('O "até" precisa ser maior que o número inicial'); return
    }
    const payload = {
      capitulo,
      capitulo_ordem,
      numero_sutra,
      numero_sutra_fim,
      contexto_capitulo: get('jn-contexto') || null,
      texto_devanagari,
      transliteracao,
      traducao,
      comentario:   get('jn-comentario') || null,
      pratica:      get('jn-pratica')    || null,
      publicada_em: get('jn-data') || proximoLivre,
    }
    let err
    if (window._editJnanaId) {
      ;({ error: err } = await sb.from('jnana_sutras').update(payload).eq('id', window._editJnanaId))
    } else {
      ;({ error: err } = await sb.from('jnana_sutras').insert(payload))
    }
    if (err) { toast('Erro: ' + err.message); return }
    toast('✓ Sutra salvo!')
    fecharFormJnana()
    navigate('jnana-admin')
  }

  window.excluirSutra = async function(id, nome) {
    if (!confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) return
    const { error: err } = await sb.from('jnana_sutras').delete().eq('id', id)
    if (err) { toast('Erro: ' + err.message); return }
    toast('✓ Sutra excluído.')
    navigate('jnana-admin')
  }
}   
