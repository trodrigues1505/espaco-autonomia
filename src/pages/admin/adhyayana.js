/**
 * src/pages/admin/adhyayana.js
 * Gestão do Yoga Adhyayana — estudo teórico/simbólico de cada āsana.
 * Cadastro via IA: cola o texto bruto → IA interpreta os blocos de texto →
 * admin revisa em etapas (wizard) → salva.
 *
 * Não confundir com asana.js (Āsana Mārga): aquele é a aula prática com
 * estatísticas agregadas (musculos/koshas em percentual). Este é o estudo
 * descritivo de uma postura por vez, publicado numa data — mesmo padrão de
 * agendamento do jnana.js.
 */

import { toast } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'

// ── Lightbox de imagem (clique para ampliar) — mesmo padrão usado
// na visão do aluno (beneficios.js) e na timeline (timeline.js).
function _abrirLightboxAdhy(src, alt) {
  document.getElementById('_adhy-lightbox')?.remove()
  const lb = document.createElement('div')
  lb.id = '_adhy-lightbox'
  lb.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:500;
    display:flex;align-items:center;justify-content:center;padding:20px;cursor:zoom-out`
  lb.innerHTML = `
    <img src="${src}" alt="${alt}" referrerpolicy="no-referrer"
      style="max-width:100%;max-height:90vh;border-radius:8px;object-fit:contain;
             box-shadow:0 20px 60px rgba(0,0,0,.5)">
    <button onclick="document.getElementById('_adhy-lightbox').remove()"
      style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,.15);
             border:none;border-radius:50%;width:36px;height:36px;color:#fff;
             font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;
             line-height:1">×</button>`
  lb.addEventListener('click', e => { if (e.target === lb) lb.remove() })
  document.body.appendChild(lb)
}
window._abrirLightboxAdhy = _abrirLightboxAdhy

// ── Definição dos passos do wizard de revisão ─────────────────
const STEPS = [
  {
    titulo: 'Identificação',
    campos: [
      { id: 'nome',             label: 'Nome',                          tipo: 'input', ph: 'ex: Devyāsana — Postura da Deusa' },
      { id: 'nome_alternativo', label: 'Nome alternativo',              tipo: 'input', ph: 'ex: Utkaṭa Koṇāsana' },
      { id: 'nivel',            label: 'Nível',                          tipo: 'input', ph: 'ex: Intermediário' },
      { id: 'imagem_url',       label: 'Link da imagem (Imgur)',        tipo: 'input', ph: 'https://i.imgur.com/...' },
      { id: 'publicada_em',     label: 'Data de publicação',            tipo: 'date'  },
    ],
  },
  {
    titulo: 'Origem e simbolismo',
    campos: [
      { id: 'origem_simbolismo', label: 'Origem e simbolismo', tipo: 'textarea', rows: 10 },
    ],
  },
  {
    titulo: 'Corpo energético',
    campos: [
      { id: 'koshas',  label: 'Koshas estimulados',    tipo: 'textarea', rows: 5 },
      { id: 'vayus',   label: 'Prāṇa Vāyus ativados',  tipo: 'textarea', rows: 5 },
      { id: 'chakras', label: 'Chakras envolvidos',    tipo: 'textarea', rows: 5 },
    ],
  },
  {
    titulo: 'Ayurveda e elementos',
    campos: [
      { id: 'doshas',  label: 'Doshas',                tipo: 'textarea', rows: 4 },
      { id: 'tattvas', label: 'Elementos (Tattvas)',   tipo: 'textarea', rows: 5 },
    ],
  },
  {
    titulo: 'Benefícios e fechamento',
    campos: [
      { id: 'beneficios_fisiologicos',  label: 'Benefícios fisiológicos',     tipo: 'textarea', rows: 5 },
      { id: 'beneficios_sutis',         label: 'Benefícios sutis',            tipo: 'textarea', rows: 5 },
      { id: 'observacoes_terapeuticas', label: 'Observações terapêuticas',    tipo: 'textarea', rows: 4 },
      { id: 'fechamento',               label: 'Fechamento (parágrafo reflexivo)', tipo: 'textarea', rows: 3 },
    ],
  },
]

export async function renderAdhyayanaAdmin(container, page) {
  const sb   = window._sb
  const hoje = new Date().toISOString().slice(0, 10)

  const { data: asanas, error } = await sb
    .from('adhyayana_asanas')
    .select('id,nome,nome_alternativo,nivel,imagem_url,publicada_em')
    .order('publicada_em', { ascending: true })

  if (error) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Yoga Adhyayana</div></div>
      <div class="content"><p style="color:#c0392b">Erro: ${error.message}</p></div>`
    return
  }

  const hojePublicado = (asanas||[]).find(a => a.publicada_em === hoje)
  const futuros       = (asanas||[]).filter(a => a.publicada_em > hoje)
  const publicados    = (asanas||[]).filter(a => a.publicada_em <= hoje)

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
              <div style="display:flex;align-items:center;gap:10px">
                ${a.imagem_url ? `<img src="${a.imagem_url}" style="width:34px;height:34px;border-radius:6px;object-fit:cover;flex-shrink:0">` : ''}
                <div>
                  <div style="font-weight:500;color:var(--txt)">${a.nome}</div>
                  ${a.nome_alternativo ? `<div style="font-size:10px;color:var(--txt2);margin-top:1px;font-style:italic">${a.nome_alternativo}</div>` : ''}
                </div>
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
                <div style="display:flex;align-items:center;gap:10px">
                  ${a.imagem_url ? `<img src="${a.imagem_url}" style="width:34px;height:34px;border-radius:6px;object-fit:cover;flex-shrink:0">` : ''}
                  <div>
                    <div style="font-weight:500;color:var(--txt)">${a.nome}</div>
                    ${a.nome_alternativo ? `<div style="font-size:10px;color:var(--txt2);margin-top:1px;font-style:italic">${a.nome_alternativo}</div>` : ''}
                  </div>
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
            <div style="font-size:11px;color:rgba(242,236,206,.6);margin-top:2px" id="adhy-modal-subtitulo">
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
    window._adhyDadosRevisao = null
    window._adhyStepAtual = 1
    document.getElementById('adhy-modal-titulo').textContent = 'Novo Āsana'
    document.getElementById('adhy-modal-subtitulo').textContent = 'Cole o texto completo do estudo do āsana e a IA extrai os campos'
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
    window._adhyDadosRevisao = null
    window._adhyStepAtual = 1
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
          ${a.imagem_url ? `
            <div style="position:relative;border-radius:8px;overflow:hidden;margin-bottom:12px;cursor:zoom-in"
                 onclick="_abrirLightboxAdhy('${a.imagem_url}','${(a.nome||'').replace(/'/g,"\\'")}')" title="Clique para ampliar">
              <img src="${a.imagem_url}" referrerpolicy="no-referrer"
                style="width:100%;max-height:220px;object-fit:cover;display:block">
              <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.4);
                          border-radius:20px;padding:3px 8px;font-size:10px;color:#fff;
                          display:flex;align-items:center;gap:4px;pointer-events:none">
                <i class="ti ti-zoom-in" style="font-size:12px"></i> ampliar
              </div>
            </div>` : ''}
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
    window._adhyDadosRevisao = { ...a }
    window._adhyStepAtual = 1
    document.getElementById('adhy-modal-titulo').textContent = `Editar — ${a.nome}`
    document.getElementById('adhy-etapa-1').style.display = 'none'
    document.getElementById('adhy-etapa-2').style.display = 'block'
    document.getElementById('modal-adhyayana').style.display = 'flex'
    _renderStepAtual()
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
      const raw_data = await response.json()
      if (!response.ok) {
        throw new Error(raw_data?.error || ('Proxy retornou ' + response.status))
      }
      const raw  = raw_data.content?.[0]?.text || ''
      let parsed
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      } catch {
        throw new Error('IA retornou formato inesperado. Tente novamente.')
      }
      parsed.publicada_em = document.getElementById('adhy-data-pub').value || proximoLivre
      parsed.imagem_url = null
      window._adhyDadosRevisao = parsed
      window._adhyStepAtual = 1
      document.getElementById('adhy-etapa-1').style.display = 'none'
      document.getElementById('adhy-etapa-2').style.display = 'block'
      _renderStepAtual()
      toast('✓ Campos extraídos — revise e salve')
    } catch(e) {
      toast('Erro: ' + e.message)
      btn.disabled = false
      btn.innerHTML = '<i class="ti ti-sparkles"></i> Interpretar com IA'
    }
  }

  function _lerStepAtual() {
    const step = STEPS[window._adhyStepAtual - 1]
    for (const campo of step.campos) {
      const el = document.getElementById('adhy-f-' + campo.id)
      if (el) window._adhyDadosRevisao[campo.id] = el.value.trim() || null
    }
  }

  function _renderStepAtual() {
    const idx  = window._adhyStepAtual
    const step = STEPS[idx - 1]
    const dados = window._adhyDadosRevisao || {}

    document.getElementById('adhy-modal-subtitulo').textContent =
      `Revisão — Passo ${idx} de ${STEPS.length}: ${step.titulo}`

    const dots = STEPS.map((s, i) => {
      const n = i + 1
      const ativo     = n === idx
      const concluido = n < idx
      const cor = ativo ? 'var(--dourado)' : concluido ? 'var(--verde)' : 'rgba(31,56,31,.15)'
      return `<span style="width:8px;height:8px;border-radius:50%;background:${cor};display:inline-block"></span>`
    }).join('<span style="width:16px;height:1px;background:rgba(31,56,31,.15);display:inline-block"></span>')

    const camposHtml = step.campos.map(campo => {
      const val = (dados[campo.id] ?? '').toString().replace(/"/g, '&quot;')
      const inputEl = campo.tipo === 'textarea'
        ? `<textarea id="adhy-f-${campo.id}" rows="${campo.rows || 4}" placeholder="${campo.ph || ''}"
            style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                   font-family:'DM Sans',sans-serif;outline:none;width:100%;resize:vertical">${dados[campo.id] || ''}</textarea>`
        : `<input type="${campo.tipo === 'date' ? 'date' : 'text'}" id="adhy-f-${campo.id}" value="${val}" placeholder="${campo.ph || ''}"
            style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                   font-family:'DM Sans',sans-serif;outline:none;width:100%">`
      return `
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;
                         color:var(--txt2);font-weight:500">${campo.label}</label>
          ${inputEl}
        </div>`
    }).join('')

    document.getElementById('adhy-etapa-2').innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:18px">${dots}</div>
      ${camposHtml}
    `

    const ehPrimeiro = idx === 1
    const ehUltimo   = idx === STEPS.length
    document.getElementById('adhyayana-modal-footer').innerHTML = `
      <button onclick="${ehPrimeiro ? 'voltarEtapa1Adhyayana()' : 'adhyVoltarStep()'}"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer;margin-right:auto">
        ← ${ehPrimeiro ? 'Novo texto' : 'Voltar'}
      </button>
      <button onclick="fecharFormAdhyayana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
      ${ehUltimo
        ? `<button onclick="salvarAdhyayana()"
             style="padding:8px 16px;background:var(--verde);color:var(--bege);border:none;
                    border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
                    font-weight:500">
             <i class="ti ti-check"></i> Salvar āsana
           </button>`
        : `<button onclick="adhyAvancarStep()"
             style="padding:8px 16px;background:var(--verde);color:var(--bege);border:none;
                    border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
                    font-weight:500">
             Próximo →
           </button>`}
    `
  }

  window.adhyAvancarStep = function() {
    _lerStepAtual()
    if (window._adhyStepAtual < STEPS.length) {
      window._adhyStepAtual++
      _renderStepAtual()
    }
  }

  window.adhyVoltarStep = function() {
    _lerStepAtual()
    if (window._adhyStepAtual > 1) {
      window._adhyStepAtual--
      _renderStepAtual()
    }
  }

  window.voltarEtapa1Adhyayana = function() {
    document.getElementById('adhy-etapa-1').style.display = 'block'
    document.getElementById('adhy-etapa-2').style.display = 'none'
    document.getElementById('adhy-modal-subtitulo').textContent = 'Cole o texto completo do estudo do āsana e a IA extrai os campos'
    const btn = document.getElementById('btn-interpretar-adhy')
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-sparkles"></i> Interpretar com IA' }
    document.getElementById('adhyayana-modal-footer').innerHTML = `
      <button onclick="fecharFormAdhyayana()"
        style="padding:8px 16px;background:transparent;border:1px solid var(--borda);
               border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>`
  }

  window.salvarAdhyayana = async function() {
    _lerStepAtual()
    const dados = window._adhyDadosRevisao || {}
    if (!dados.nome) { toast('Informe o nome do āsana'); return }
    const payload = {
      nome:                      dados.nome,
      nome_alternativo:          dados.nome_alternativo || null,
      nivel:                     dados.nivel || null,
      imagem_url:                dados.imagem_url || null,
      origem_simbolismo:         dados.origem_simbolismo || null,
      koshas:                    dados.koshas || null,
      vayus:                     dados.vayus || null,
      chakras:                   dados.chakras || null,
      doshas:                    dados.doshas || null,
      tattvas:                   dados.tattvas || null,
      beneficios_fisiologicos:   dados.beneficios_fisiologicos || null,
      beneficios_sutis:          dados.beneficios_sutis || null,
      observacoes_terapeuticas:  dados.observacoes_terapeuticas || null,
      fechamento:                dados.fechamento || null,
      publicada_em:              dados.publicada_em || proximoLivre,
      atualizado_em:             new Date().toISOString(),
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
