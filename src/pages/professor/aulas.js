/**
 * src/pages/professor/aulas.js
 * Responsabilidade: Minhas aulas (professor) — próximos 7 dias + cancelar.
 * Depende de: sb, toast, NOMES, dot, badge, card, fmtDt, inputStyle
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderAulas(container) {

    const hoje = new Date()
    const em7d = new Date(); em7d.setDate(hoje.getDate()+7)
    const { data: ocs } = await sb.from('ocorrencias_vagas').select('*')
      .eq('professor_id', window._perfil.id)
      .gte('data_hora', hoje.toISOString())
      .lte('data_hora', em7d.toISOString())
      .order('data_hora')

    container.innerHTML = `
      <div class="topbar"><div class="topbar-t">Minhas Aulas</div><span style="font-size:11px;color:var(--txt2)">Próximos 7 dias</span></div>
      <div class="content">
        ${(ocs||[]).length===0?'<div style="text-align:center;padding:40px;font-size:13px;color:var(--txt2)">Nenhuma aula nos próximos 7 dias.</div>':
          (ocs||[]).map(oc=>{
            const dt = new Date(oc.data_hora)
            return `<div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
              <div>
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">${dot(oc.modalidade)}<strong style="font-size:13px">${NOMES[oc.modalidade]}</strong>${oc.eh_feriado?`<span style="background:rgba(232,188,79,.15);color:#7a5a10;font-size:10px;padding:2px 7px;border-radius:10px">⚠ Feriado</span>`:''}</div>
                <div style="font-size:11px;color:var(--txt2)">${dt.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})} · ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                <div style="font-size:11px;color:var(--txt2);margin-top:2px">${oc.confirmados||0}/${oc.vagas_total} confirmados · ${oc.vagas_livres||0} vagas livres</div>
              </div>
              <button onclick="window._ocPresencaId='${oc.id}';navigate('prof-chamada')" style="padding:6px 12px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">Fazer chamada</button>
            </div>`
          }).join('')
        }
      </div>
    `
    return
  }
