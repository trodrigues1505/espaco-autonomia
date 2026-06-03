/**
 * src/pages/professor/home.js
 * Dashboard professor — aulas do dia + chamada
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderProfHome(container, page) {
  const sb = window._sb
  const perfil = window._perfil
  const tipo = perfil?.tipo

    const hoje = new Date()
    const inicioHoje = new Date(hoje); inicioHoje.setHours(0,0,0,0)
    const fimHoje = new Date(hoje); fimHoje.setHours(23,59,59,999)

    const { data: ocHoje } = await sb.from('ocorrencias_vagas').select('*')
      .gte('data_hora', inicioHoje.toISOString()).lte('data_hora', fimHoje.toISOString())
      .eq('cancelada', false).eq('professor_id', window._perfil.id).order('data_hora')

    if (page === 'prof-home') {
      const proxima = (ocHoje||[]).find(o => new Date(o.data_hora) >= hoje) || ocHoje?.[0]
      container.innerHTML = `
        <div class="topbar"><div class="topbar-t">Olá, ${window._perfil.nome.split(' ')[0]}</div></div>
        <div class="content">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
            <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:5px">Aulas hoje</div><div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--verde)">${ocHoje?.length||0}</div></div>
            <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:5px">Confirmados hoje</div><div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--verde)">${(ocHoje||[]).reduce((s,o)=>s+(o.confirmados||0),0)}</div></div>
            <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:5px">Próxima aula</div><div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--verde)">${proxima?new Date(proxima.data_hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+' · '+NOMES[proxima.modalidade]:'—'}</div></div>
          </div>
          ${card('Aulas de hoje', '',
            (ocHoje||[]).length===0?'<div style="padding:18px;font-size:12px;color:var(--txt2)">Nenhuma aula hoje.</div>':
            (ocHoje||[]).map(oc=>{
              const dt = new Date(oc.data_hora)
              const hora = dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
              const isProxima = oc.id === proxima?.id
              return `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid rgba(212,200,158,.3);${isProxima?'background:rgba(232,188,79,.04);border-left:3px solid var(--dourado)':''}">
                <div>
                  <div style="display:flex;align-items:center;gap:6px">${dot(oc.modalidade)}<strong style="font-size:13px">${NOMES[oc.modalidade]}</strong>${isProxima?badge('Próxima','rgba(232,188,79,.15)','#7a5a10'):''}</div>
                  <div style="font-size:11px;color:var(--txt2);margin-top:2px">${hora} · ${oc.confirmados||0}/${oc.vagas_total} confirmados</div>
                </div>
                <button onclick="window._ocPresencaId='${oc.id}';navigate('prof-chamada')" style="padding:5px 12px;background:${isProxima?'var(--dourado)':'var(--verde)'};color:${isProxima?'var(--verde)':'var(--bege)'};border:none;border-radius:6px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500">Fazer Chamada</button>
              </div>`
            }).join('')
          )}
        </div>
      `
      return
    }

    // CHAMADA
    const ocSelecionadaId = window._ocPresencaId || ocHoje?.[0]?.id
    let confs = [], ocAtual = null
    if (ocSelecionadaId) {
      const [confRes, ocRes] = await Promise.all([
        sb.from('confirmacoes').select('*, aluno:perfis!aluno_id(id,nome)').eq('ocorrencia_id', ocSelecionadaId).order('confirmado_em'),
        sb.from('ocorrencias_vagas').select('*').eq('id', ocSelecionadaId).single(),
      ])
      confs = confRes.data || []
      ocAtual = ocRes.data
    }

    const seletor = (ocHoje||[]).map(oc=>{
      const dt = new Date(oc.data_hora)
      const sel = oc.id === ocSelecionadaId
      return `<button onclick="window._ocPresencaId='${oc.id}';navigate('prof-chamada')" style="padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${sel?'var(--verde)':'var(--borda)'};background:${sel?'var(--verde)':'#fff'};color:${sel?'var(--bege)':'var(--txt2)'}">${NOMES[oc.modalidade]} ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</button>`
    }).join('')

    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-t">Chamada</div>
        ${ocAtual?badge(`${confs.filter(c=>c.status==='presente').length} presentes`,'#e8f4e8','#1a5a1a'):''}
      </div>
      <div class="content">
        ${(ocHoje||[]).length>1?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">${seletor}</div>`:''}
        ${ocAtual?card(
          `${NOMES[ocAtual.modalidade]} — ${new Date(ocAtual.data_hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`,
          `<button onclick="marcarTodosProfPresentes()" style="padding:5px 12px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">✓ Todos presentes</button>`,
          `<div style="padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Clique no nome para alternar presença/ausência</div>
          ${confs.length===0?'<div style="padding:16px 18px;font-size:12px;color:var(--txt2)">Nenhuma confirmação para esta aula.</div>':
            confs.map(c=>{
              const presente = c.status==='presente'
              const ausente = c.status==='ausente'
              return `<div onclick="togglePresencaProf('${c.id}','${c.status}')" style="display:flex;align-items:center;justify-content:space-between;padding:11px 18px;border-bottom:1px solid rgba(212,200,158,.3);cursor:pointer;background:${presente?'rgba(232,188,79,.06)':ausente?'rgba(255,0,0,.03)':'#fff'};transition:background .15s" id="prow-${c.id}">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:32px;height:32px;border-radius:50%;background:${presente?'var(--dourado)':ausente?'#fceaea':'rgba(31,56,31,.1)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;color:${presente?'var(--verde)':ausente?'#8a1a1a':'var(--verde)'}">
                    ${(c.aluno?.nome||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                  </div>
                  <span style="font-size:13px;font-weight:500">${c.aluno?.nome||'—'}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  ${presente?badge('Presente','#e8f4e8','#1a5a1a'):ausente?badge('Ausente','#fceaea','#8a1a1a'):badge('Pendente','rgba(232,188,79,.15)','#7a5a10')}
                  <span style="font-size:16px;color:${presente?'#2d7a2d':ausente?'#c0392b':'#ccc'}">${presente?'✓':ausente?'✕':'○'}</span>
                </div>
              </div>`
            }).join('')
          }`
        ):`<div style="text-align:center;padding:40px;font-size:13px;color:var(--txt2)">Nenhuma aula hoje.</div>`}
      </div>
    `

    window.togglePresencaProf = async function(confId, statusAtual) {
      const novoStatus = statusAtual === 'presente' ? 'ausente' : 'presente'
      await sb.from('confirmacoes').update({ status: novoStatus, presenca_em: new Date().toISOString() }).eq('id', confId)
      navigate('prof-chamada')
    }

    window.marcarTodosProfPresentes = async function() {
      for (const c of confs) {
        if (c.status !== 'presente') {
          await sb.from('confirmacoes').update({ status: 'presente', presenca_em: new Date().toISOString() }).eq('id', c.id)
        }
      }
      toast('✓ Todos presentes!')
      navigate('prof-chamada')
    }
}
