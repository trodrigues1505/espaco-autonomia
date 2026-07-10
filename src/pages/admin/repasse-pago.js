/**
 * src/pages/admin/repasse-pago.js
 *
 * Seção de histórico de repasses efetivamente pagos a professores.
 * Usada em previsao-professor.js (admin) e repasse.js (professor).
 *
 * Exporta:
 *   renderHistoricoRepasse(container, professorId, isAdmin)
 *   abrirModalRegistrarRepasse(professorId, nomeProfessor, valorPrevisto, mesRef)
 */

import { toast } from '../../modules/utils.js'

function fmtR(v) {
  return 'R$ ' + (v || 0).toFixed(2).replace('.', ',')
}

function nomeMes(mesRef) {
  const partes = (mesRef || '').slice(0, 7).split('-')
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return (nomes[Number(partes[1]) - 1] || partes[1]) + '/' + (partes[0] || '').slice(2)
}

function mesRefDate(mesRef) {
  return mesRef.slice(0, 7) + '-01'
}

/**
 * Renderiza a seção de histórico de repasses e a appenda ao container.
 *
 * @param {HTMLElement} container    — elemento onde inserir (append)
 * @param {string|null} professorId — UUID do professor (null = todos, só admin)
 * @param {boolean}     isAdmin
 */
export async function renderHistoricoRepasse(container, professorId, isAdmin) {
  const sb = window._sb
  const agora = new Date()

  let query = sb
    .from('repasses_pagos')
    .select('*, professor:perfis!professor_id(nome), registrado_por_perfil:perfis!registrado_por(nome)')
    .order('mes_ref', { ascending: false })
    .limit(24)

  if (professorId) {
    query = query.eq('professor_id', professorId)
  }

  const { data: repasses, error } = await query
  if (error) {
    console.error('renderHistoricoRepasse:', error)
    return
  }

  const lista = repasses || []

  const mesesDisponiveis = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    mesesDisponiveis.push(d.toISOString().slice(0, 7))
  }

  // Remove instância anterior se existir (re-render ao salvar/excluir)
  container.querySelector('#secao-historico-repasse')?.remove()

  const sec = document.createElement('div')
  sec.id = 'secao-historico-repasse'
  sec.style.cssText = 'margin-top:20px'

  sec.innerHTML = `
    <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden">
      <div style="padding:13px 18px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde)">
          Histórico de Repasses
        </span>
        ${isAdmin && professorId
          ? `<button id="btn-novo-repasse"
               style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;
                      font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px">
               <i class="ti ti-plus"></i> Registrar pagamento
             </button>`
          : ''}
      </div>

      ${lista.length === 0
        ? `<div style="padding:24px 18px;font-size:12px;color:var(--txt2)">
             Nenhum repasse registrado ainda.${isAdmin ? ' Use o botão acima para registrar o primeiro.' : ''}
           </div>`
        : `<div style="overflow-x:auto">
             <div style="display:grid;
                         grid-template-columns:${isAdmin ? '1fr 100px 110px 110px 1fr 80px' : '100px 110px 110px 1fr'};
                         padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;
                         text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px;min-width:480px">
               ${isAdmin ? '<span>Professor</span>' : ''}
               <span>Mês</span>
               <span>Previsto</span>
               <span>Pago</span>
               <span>Obs.</span>
               ${isAdmin ? '<span>Ações</span>' : ''}
             </div>
             ${lista.map(r => {
               const diff = r.valor_pago - (r.valor_previsto || r.valor_pago)
               const diffStr = diff !== 0 && r.valor_previsto
                 ? `<span style="font-size:10px;color:${diff > 0 ? '#1a5a1a' : '#c0392b'};display:block">
                      ${diff > 0 ? '+' : ''}${fmtR(diff)}
                    </span>`
                 : ''
               // Escapa <, >, " (contra quebra de HTML) e ' (contra quebra do onclick,
               // já que o atributo onclick concatena essa string dentro de aspas simples
               // no JS gerado). Faltava o escape de ' aqui — era a causa do botão
               // "Editar" quebrar (SyntaxError) sempre que a observação tinha apóstrofo.
               const obsEsc = (r.observacao || '')
                 .replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
                 .replace(/'/g,"\\'")
                 .replace(/\r\n|\r|\n/g, '\\n')
               const nomeEsc = (r.professor?.nome || '').replace(/'/g,"\\'")
               return `
                 <div style="display:grid;
                             grid-template-columns:${isAdmin ? '1fr 100px 110px 110px 1fr 80px' : '100px 110px 110px 1fr'};
                             align-items:center;gap:10px;padding:10px 18px;
                             border-bottom:1px solid rgba(212,200,158,.3);font-size:12px;min-width:480px"
                      id="repasse-row-${r.id}">
                   ${isAdmin ? `<span style="font-weight:500">${r.professor?.nome || '—'}</span>` : ''}
                   <span style="font-size:11px;color:var(--txt2)">${nomeMes(r.mes_ref)}</span>
                   <span style="font-size:11px;color:var(--txt2)">${r.valor_previsto ? fmtR(r.valor_previsto) : '—'}</span>
                   <div>
                     <span style="font-weight:500;color:#1a5a1a">${fmtR(r.valor_pago)}</span>
                     ${diffStr}
                   </div>
                   <span style="font-size:11px;color:var(--txt2)">${r.observacao || '—'}</span>
                   ${isAdmin
                     ? `<div style="display:flex;gap:4px">
                          <button
                            onclick="window._editarRepasse('${r.id}','${r.professor_id}','${nomeEsc}','${r.mes_ref}',${r.valor_pago},${r.valor_previsto || 0},'${obsEsc}')"
                            style="padding:3px 7px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer"
                            title="Editar">✎</button>
                          <button
                            onclick="window._excluirRepasse('${r.id}')"
                            style="padding:3px 7px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer"
                            title="Excluir">✕</button>
                        </div>`
                     : ''}
                 </div>`
             }).join('')}
           </div>`
      }
    </div>

    <!-- Modal registro / edição -->
    <div id="modal-repasse-pago"
      style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);z-index:200;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:12px;width:460px;max-width:100%;overflow:hidden">
        <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)"
               id="modal-repasse-titulo">Registrar Pagamento</div>
          <button onclick="document.getElementById('modal-repasse-pago').style.display='none'"
            style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
        </div>
        <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <input type="hidden" id="rp-id">
          <input type="hidden" id="rp-professor-id">

          <div style="display:flex;flex-direction:column;gap:3px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Professor</label>
            <div id="rp-professor-nome" style="font-size:13px;font-weight:500;color:var(--verde);padding:4px 0"></div>
          </div>

          <div style="display:flex;flex-direction:column;gap:3px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Mês de referência</label>
            <select id="rp-mes"
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
              ${mesesDisponiveis.map(m =>
                `<option value="${m}">${nomeMes(m)}${m === agora.toISOString().slice(0, 7) ? ' (atual)' : ''}</option>`
              ).join('')}
            </select>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="display:flex;flex-direction:column;gap:3px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Valor previsto (R$)</label>
              <input type="number" id="rp-valor-previsto" step="0.01" min="0" readonly
                style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                       font-family:'DM Sans',sans-serif;outline:none;background:#f8f6f0;color:var(--txt2)"
                placeholder="0,00">
              <div style="font-size:10px;color:var(--txt2)">Calculado pela previsão</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:3px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Valor pago (R$) *</label>
              <input type="number" id="rp-valor-pago" step="0.01" min="0"
                style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                       font-family:'DM Sans',sans-serif;outline:none"
                placeholder="0,00">
              <div id="rp-diff" style="font-size:10px;color:var(--txt2);min-height:14px"></div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:3px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Observação (opcional)</label>
            <textarea id="rp-obs" rows="2"
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;
                     font-family:'DM Sans',sans-serif;outline:none;resize:vertical"
              placeholder="Ex: inclui bônus de indicação, desconto acordado..."></textarea>
          </div>
        </div>
        <div style="padding:0 20px 16px;display:flex;justify-content:flex-end;gap:8px">
          <button onclick="document.getElementById('modal-repasse-pago').style.display='none'"
            style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">
            Cancelar
          </button>
          <button onclick="window._salvarRepasse()"
            style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;
                   font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
            Salvar
          </button>
        </div>
      </div>
    </div>
  `

  container.appendChild(sec)

  // ── Handler: diff ao digitar valor pago ─────────────────────
  document.getElementById('rp-valor-pago')?.addEventListener('input', function () {
    const pago = parseFloat(this.value) || 0
    const prev = parseFloat(document.getElementById('rp-valor-previsto')?.value) || 0
    const el   = document.getElementById('rp-diff')
    if (!el) return
    if (!prev || pago === prev) { el.textContent = ''; return }
    const diff = pago - prev
    el.textContent = diff > 0
      ? `+${fmtR(diff)} acima do previsto`
      : `${fmtR(diff)} abaixo do previsto`
    el.style.color = diff > 0 ? '#1a5a1a' : '#c0392b'
  })

  // ── Handler: botão "Novo repasse" ────────────────────────────
  if (isAdmin && professorId) {
    document.getElementById('btn-novo-repasse')?.addEventListener('click', () => {
      abrirModalRegistrarRepasse(professorId, '', 0, agora.toISOString().slice(0, 7))
    })
  }

  // ── Handler: salvar (novo ou edição) ─────────────────────────
  window._salvarRepasse = async function () {
    const id           = document.getElementById('rp-id')?.value || null
    const profIdVal    = document.getElementById('rp-professor-id')?.value
    const mes          = document.getElementById('rp-mes')?.value
    const valorPago    = parseFloat(document.getElementById('rp-valor-pago')?.value)
    const valorPrev    = parseFloat(document.getElementById('rp-valor-previsto')?.value) || null
    const obs          = document.getElementById('rp-obs')?.value?.trim() || null

    if (!profIdVal)                        { toast('Professor não identificado'); return }
    if (!mes)                              { toast('Selecione o mês'); return }
    if (isNaN(valorPago) || valorPago <= 0){ toast('Informe o valor pago'); return }

    const registro = {
      professor_id:    profIdVal,
      mes_ref:         mesRefDate(mes),
      valor_pago:      valorPago,
      valor_previsto:  valorPrev,
      observacao:      obs,
      registrado_por:  window._perfilAdmin?.id || window._perfil.id,
    }

    let err
    if (id) {
      const res = await sb.from('repasses_pagos').update(registro).eq('id', id)
      err = res.error
    } else {
      const res = await sb.from('repasses_pagos').insert(registro)
      err = res.error
    }

    if (err) { toast('Erro: ' + err.message); return }

    document.getElementById('modal-repasse-pago').style.display = 'none'
    toast(id ? '✓ Repasse atualizado!' : '✓ Repasse registrado!')

    // Re-renderiza a seção sem recarregar a página inteira
    await renderHistoricoRepasse(container, professorId, isAdmin)
  }

  // ── Handler: editar ──────────────────────────────────────────
  window._editarRepasse = function (id, profId, profNome, mesRef, valorPago, valorPrevisto, obs) {
    document.getElementById('modal-repasse-titulo').textContent = 'Editar Pagamento'
    document.getElementById('rp-id').value             = id
    document.getElementById('rp-professor-id').value   = profId
    document.getElementById('rp-professor-nome').textContent = profNome
    document.getElementById('rp-mes').value            = mesRef.slice(0, 7)
    document.getElementById('rp-valor-previsto').value = valorPrevisto || ''
    document.getElementById('rp-valor-pago').value      = valorPago
    document.getElementById('rp-obs').value             = obs || ''
    document.getElementById('rp-diff').textContent      = ''
    document.getElementById('modal-repasse-pago').style.display = 'flex'
  }

  // ── Handler: excluir ─────────────────────────────────────────
  window._excluirRepasse = async function (id) {
    if (!confirm('Excluir este registro de repasse?')) return
    const { error } = await sb.from('repasses_pagos').delete().eq('id', id)
    if (error) { toast('Erro: ' + error.message); return }
    toast('Repasse excluído')
    await renderHistoricoRepasse(container, professorId, isAdmin)
  }
}

/**
 * Abre o modal de registro com dados pré-preenchidos.
 * Chamado externamente pelo previsao-professor.js após calcular a previsão.
 */
export function abrirModalRegistrarRepasse(professorId, nomeProfessor, valorPrevisto, mesRef) {
  const modalEl = document.getElementById('modal-repasse-pago')
  if (!modalEl) {
    toast('Carregue a página de repasse antes de registrar.')
    return
  }
  document.getElementById('modal-repasse-titulo').textContent  = 'Registrar Pagamento'
  document.getElementById('rp-id').value                       = ''
  document.getElementById('rp-professor-id').value             = professorId
  document.getElementById('rp-professor-nome').textContent     = nomeProfessor
  document.getElementById('rp-mes').value                      = mesRef
  document.getElementById('rp-valor-previsto').value           = valorPrevisto ? valorPrevisto.toFixed(2) : ''
  document.getElementById('rp-valor-pago').value                = valorPrevisto ? valorPrevisto.toFixed(2) : ''
  document.getElementById('rp-obs').value                       = ''
  document.getElementById('rp-diff').textContent                = ''
  modalEl.style.display = 'flex'
}   
