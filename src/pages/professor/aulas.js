/**
 * src/pages/professor/aulas.js
 */
import '../../acoes/pages-professor-aulas.js'   // handlers (antes: eventos inline; ver ferramentas/verifica-handlers.mjs)
import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel, PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS, calcularNivel, NIVEL_LABELS, esc } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'
export async function renderProfAulas(container, page) {
  const sb = window._sb
  const perfil = window._perfil
  window._currentPage = page
  const hoje = new Date()
  const em14d = new Date(); em14d.setDate(hoje.getDate()+14)
  const { data: ocs } = await sb.from('ocorrencias_vagas').select('*')
    .eq('professor_id', window._perfil.id)
    .gte('data_hora', hoje.toISOString())
    .lte('data_hora', em14d.toISOString())
    .order('data_hora')
  window._profAulasMap = {}
  ;(ocs||[]).forEach(o => { window._profAulasMap[o.id] = o })
  // Cache compartilhado usado por window._abrirCancelamentoEmMassa (professor-cancel.js)
  window._ocsCache = window._profAulasMap
  // Seleção não deve "vazar" entre páginas diferentes — mas preserva se o
  // usuário só está voltando pra cá após fechar o modal de cancelamento.
  window._ocsSelecionadas = window._ocsSelecionadas || new Set()

  window._atualizarBarraSelecao = function() {
    const bar = document.getElementById('barra-selecao-massa')
    if (!bar) return
    const n = window._ocsSelecionadas.size
    bar.style.display = n > 0 ? 'flex' : 'none'
    const span = document.getElementById('barra-selecao-count')
    if (span) span.textContent = `${n} aula(s) selecionada(s)`
  }

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Minhas Aulas</div>
      <span class="t-mut">Próximos 14 dias</span>
    </div>
    <div class="content">
      <div id="barra-selecao-massa" style="display:none;align-items:center;gap:10px;background:var(--err-bg);border:1px solid var(--err-borda);border-radius:6px;padding:8px 14px;margin-bottom:12px">
        <span id="barra-selecao-count" style="font-size:12px;color:var(--err-fg)"></span>
        <button data-h-click="pages-professor-aulas.4" style="padding:5px 12px;background:#8a1a1a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Cancelar selecionadas</button>
        <button data-h-click="pages-professor-aulas.5" style="padding:5px 10px;background:transparent;border:1px solid var(--borda);border-radius:5px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Limpar seleção</button>
      </div>
      ${(ocs||[]).length===0
        ? '<div style="text-align:center;padding:40px;font-size:13px;color:var(--txt2)">Nenhuma aula nos próximos 14 dias.</div>'
        : (ocs||[]).map(oc => {
            const dt = new Date(oc.data_hora)
            const cancelada = oc.cancelada
            return `<div style="background:var(--superficie);border:1px solid ${cancelada?'var(--err-borda)':'var(--borda)'};border-radius:var(--r);padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;${cancelada?'opacity:.7':''}">
              <div style="display:flex;align-items:flex-start;gap:10px">
                ${!cancelada?`<input type="checkbox" class="chk-cancel-massa mt-3 cursor-pointer" ${window._ocsSelecionadas.has(oc.id)?'checked':''} data-h-click="pages-professor-aulas.1" data-a-click="${esc(JSON.stringify([String(oc.id)]))}" title="Selecionar para cancelamento em massa">`:''}
                <div>
                  <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
                    ${dot(oc.modalidade)}
                    <strong class="fs-13">${NOMES[oc.modalidade]}</strong>
                    ${cancelada?`<span style="background:var(--err-bg);color:var(--err-fg);font-size:12px;padding:2px 8px;border-radius:10px">⊘ Cancelada</span>`:''}
                    ${oc.eh_feriado&&!cancelada?`<span style="background:rgba(232,188,79,.15);color:var(--warn-fg);font-size:12px;padding:2px 7px;border-radius:10px"><i class="ti ti-alert-triangle" aria-hidden="true"></i> Feriado</span>`:''}
                  </div>
                  <div class="t-mut">${dt.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})} · ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                  <div class="t-mut mt-2">${oc.confirmados||0}/${oc.vagas_total} confirmados · ${oc.vagas_livres||0} vagas livres</div>
                  ${cancelada&&oc.motivo_cancel?`<div style="font-size:12px;color:var(--err-fg);margin-top:4px;font-style:italic">Motivo: ${esc(oc.motivo_cancel)}</div>`:''}
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
                ${!cancelada ? `
                  <button data-h-click="pages-professor-aulas.2" data-a-click="${esc(JSON.stringify([String(oc.id)]))}" style="padding:6px 12px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Fazer chamada</button>
                  <button data-h-click="pages-professor-aulas.3" data-a-click="${esc(JSON.stringify([String(oc.id), String(oc.id)]))}" style="padding:5px 12px;background:var(--err-bg);color:var(--err-fg);border:1px solid var(--err-borda);border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Cancelar aula</button>
                ` : '<span style="font-size:12px;color:var(--err-fg)">Aula cancelada</span>'}
              </div>
            </div>`
          }).join('')
      }
    </div>
  `
  uiAnimar(container)
  window._atualizarBarraSelecao()
}  
