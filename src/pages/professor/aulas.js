/**
 * src/pages/professor/aulas.js
 * Minhas aulas + cancelar
 */
import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderProfAulas(container, page) {
  const sb = window._sb
  const perfil = window._perfil

  const hoje = new Date()
  const em14d = new Date(); em14d.setDate(hoje.getDate()+14)
  const { data: ocs } = await sb.from('ocorrencias_vagas').select('*')
    .eq('professor_id', window._perfil.id)
    .gte('data_hora', hoje.toISOString())
    .lte('data_hora', em14d.toISOString())
    .order('data_hora')

  // FIX: armazena as ocorrências num mapa global para evitar JSON inline nos atributos HTML
  window._profAulasMap = {}
  ;(ocs||[]).forEach(o => { window._profAulasMap[o.id] = o })

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Minhas Aulas</div>
      <span style="font-size:11px;color:var(--txt2)">Próximos 14 dias</span>
    </div>
    <div class="content">
      ${(ocs||[]).length===0
        ? '<div style="text-align:center;padding:40px;font-size:13px;color:var(--txt2)">Nenhuma aula nos próximos 14 dias.</div>'
        : (ocs||[]).map(oc => {
            const dt = new Date(oc.data_hora)
            const cancelada = oc.cancelada
            return `<div style="background:#fff;border:1px solid ${cancelada?'#f5c1c1':'var(--borda)'};border-radius:var(--r);padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;${cancelada?'opacity:.7':''}">
              <div>
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
                  ${dot(oc.modalidade)}
                  <strong style="font-size:13px">${NOMES[oc.modalidade]}</strong>
                  ${cancelada?`<span style="background:#fceaea;color:#8a1a1a;font-size:10px;padding:2px 8px;border-radius:10px">⊘ Cancelada</span>`:''}
                  ${oc.eh_feriado&&!cancelada?`<span style="background:rgba(232,188,79,.15);color:#7a5a10;font-size:10px;padding:2px 7px;border-radius:10px">⚠ Feriado</span>`:''}
                </div>
                <div style="font-size:11px;color:var(--txt2)">${dt.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})} · ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                <div style="font-size:11px;color:var(--txt2);margin-top:2px">${oc.confirmados||0}/${oc.vagas_total} confirmados · ${oc.vagas_livres||0} vagas livres</div>
                ${cancelada&&oc.motivo_cancelamento?`<div style="font-size:11px;color:#8a1a1a;margin-top:4px;font-style:italic">Motivo: ${oc.motivo_cancelamento}</div>`:''}
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
                ${!cancelada ? `
                  <button onclick="window._ocPresencaId='${oc.id}';navigate('prof-chamada')" style="padding:6px 12px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">Fazer chamada</button>
                  <button onclick="window._currentPage='prof-aulas';cancelarOcorrenciaGrade('${oc.id}',window._profAulasMap['${oc.id}'])" style="padding:5px 12px;background:#fceaea;color:#8a1a1a;border:1px solid #f5c1c1;border-radius:6px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">Cancelar aula</button>
                ` : '<span style="font-size:11px;color:#8a1a1a">Aula cancelada</span>'}
              </div>
            </div>`
          }).join('')
      }
    </div>
  `
}
