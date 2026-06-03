/**
 * src/pages/admin/presencas.js
 * Responsabilidade: Presenças admin — visualização geral de confirmações.
 * Depende de: sb, toast, NOMES, dot, badge, card, fmtDt, inputStyle
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderPresencas(container) {

    const hoje = new Date()
    const inicioHoje = new Date(hoje); inicioHoje.setHours(0,0,0,0)
    const fimHoje = new Date(hoje); fimHoje.setHours(23,59,59,999)

    const { data: ocHoje } = await sb.from('ocorrencias_vagas').select('*')
      .gte('data_hora', inicioHoje.toISOString()).lte('data_hora', fimHoje.toISOString())
      .eq('cancelada', false).order('data_hora')

    const ocSelecionadaId = window._ocPresencaId || ocHoje?.[0]?.id

    let confs = [], ocAtual = null
    if (ocSelecionadaId) {
      const [confRes, ocRes] = await Promise.all([
        sb.from('confirmacoes').select('*, aluno:perfis!aluno_id(id,nome,email)').eq('ocorrencia_id', ocSelecionadaId).order('confirmado_em'),
        sb.from('ocorrencias_vagas').select('*').eq('id', ocSelecionadaId).single(),
      ])
      confs = confRes.data || []
      ocAtual = ocRes.data
    }

    const seletorAulas = (ocHoje||[]).map(oc => {
      const dt = new Date(oc.data_hora)
      const hora = dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
      const sel = oc.id === ocSelecionadaId
      return `<button onclick="window._ocPresencaId='${oc.id}';navigate('presencas')" style="padding:7px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${sel?'var(--verde)':'var(--borda)'};background:${sel?'var(--verde)':'#fff'};color:${sel?'var(--bege)':'var(--txt2)'};display:flex;align-items:center;gap:6px">
        ${dot(oc.modalidade)} ${NOMES[oc.modalidade]} ${hora}
        <span style="background:${sel?'rgba(242,236,206,.2)':'rgba(31,56,31,.08)'};padding:1px 6px;border-radius:10px;font-size:10px">${oc.confirmados||0}/${oc.vagas_total}</span>
      </button>`
    }).join('')

    const statusMap = { confirmado:'Confirmado', presente:'Presente', ausente:'Ausente', pendente:'Pendente', cancelado:'Cancelado' }
    const statusBg = { confirmado:'#e8f4e8', presente:'#e8f4e8', ausente:'#fceaea', pendente:'rgba(232,188,79,.15)', cancelado:'#f0ede4' }
    const statusColor = { confirmado:'#1a5a1a', presente:'#1a5a1a', ausente:'#8a1a1a', pendente:'#7a5a10', cancelado:'#5a5a4a' }

    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-t">Presenças</div>
        <div style="font-size:11px;color:var(--txt2)">${hoje.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</div>
      </div>
      <div class="content">
        ${ocHoje?.length===0?'<div style="text-align:center;padding:40px;font-size:13px;color:var(--txt2)">Nenhuma aula hoje.</div>':''}
        ${ocHoje?.length>0?`
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">${seletorAulas}</div>
          ${ocAtual?card(
            `${NOMES[ocAtual.modalidade]} — ${new Date(ocAtual.data_hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`,
            `<div style="display:flex;gap:6px">
              ${badge(ocAtual.confirmados+'/'+(ocAtual.vagas_total)+' conf.','#e8f4e8','#1a5a1a')}
              <button onclick="marcarTodosPresentes()" style="padding:3px 10px;background:var(--verde);color:var(--bege);border:none;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">✓ Todos presentes</button>
            </div>`,
            `<div style="display:grid;grid-template-columns:1fr 90px 100px 90px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
              <span>Aluno</span><span>Confirmou</span><span>Status</span><span>Ação</span>
            </div>
            ${confs.length===0?'<div style="padding:16px 18px;font-size:12px;color:var(--txt2)">Nenhuma confirmação para esta aula.</div>':
              confs.map(c=>`<div style="display:grid;grid-template-columns:1fr 90px 100px 90px;align-items:center;gap:10px;padding:9px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px" id="conf-row-${c.id}">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:26px;height:26px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:var(--verde)">${(c.aluno?.nome||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</div>
                  <span style="font-weight:500">${c.aluno?.nome||'—'}</span>
                </div>
                <span style="font-size:10px;color:var(--txt2)">${c.confirmado_em?new Date(c.confirmado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'-'}</span>
                <span>${badge(statusMap[c.status]||c.status, statusBg[c.status]||'#f0ede4', statusColor[c.status]||'#5a5a4a')}</span>
                <div style="display:flex;gap:4px">
                  <button onclick="setPresenca('${c.id}',true)" style="padding:3px 7px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif" title="Presente">✓</button>
                  <button onclick="setPresenca('${c.id}',false)" style="padding:3px 7px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif" title="Ausente">✕</button>
                </div>
              </div>`).join('')
            }`
          ):''}
        `:''}
      </div>
    `

    window.setPresenca = async function(confId, presente) {
      const { error } = await sb.from('confirmacoes').update({
        status: presente ? 'presente' : 'ausente',
        presenca_em: new Date().toISOString()
      }).eq('id', confId)
      if (error) { toast('Erro: '+error.message); return }
      toast(presente ? '✓ Marcado presente' : '✕ Marcado ausente')
      navigate('presencas')
    }

    window.marcarTodosPresentes = async function() {
      const ids = confs.filter(c=>c.status==='confirmado').map(c=>c.id)
      if (!ids.length) { toast('Nenhum confirmado para marcar'); return }
      for (const id of ids) {
        await sb.from('confirmacoes').update({ status:'presente', presenca_em: new Date().toISOString() }).eq('id', id)
      }
      toast('✓ Todos marcados como presentes!')
      navigate('presencas')
    }
    return
  }
