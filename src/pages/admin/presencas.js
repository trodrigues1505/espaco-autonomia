/**
 * src/pages/admin/presencas.js
 *
 * TODOS os updates de status usam RPCs SECURITY DEFINER
 * para evitar erro de cast do enum confirmacao_status.
 */

import { sb } from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderPresencas(container, page) {
  const sb = window._sb
  const perfil = window._perfil

  const hoje = new Date()
  const dataSel = window._presencaData
    ? new Date(window._presencaData + 'T12:00:00')
    : hoje
  const inicioDia = new Date(dataSel); inicioDia.setHours(0,0,0,0)
  const fimDia    = new Date(dataSel); fimDia.setHours(23,59,59,999)

  const { data: ocHoje } = await sb.from('ocorrencias_vagas').select('*')
    .gte('data_hora', inicioDia.toISOString()).lte('data_hora', fimDia.toISOString())
    .eq('cancelada', false).order('data_hora')

  const ocSelecionadaId = window._ocPresencaId || ocHoje?.[0]?.id

  let confs = [], ocAtual = null
  if (ocSelecionadaId) {
    const [confRes, ocRes] = await Promise.all([
      sb.from('confirmacoes')
        .select('*, aluno:perfis!aluno_id(id,nome,email)')
        .eq('ocorrencia_id', ocSelecionadaId)
        .neq('status', 'cancelado')
        .order('confirmado_em'),
      sb.from('ocorrencias_vagas').select('*').eq('id', ocSelecionadaId).single(),
    ])
    confs = confRes.data || []
    ocAtual = ocRes.data
  }

  const { data: todosAlunos } = await sb.from('perfis')
    .select('id,nome,email')
    .eq('tipo','aluno')
    .eq('ativo', true)
    .order('nome')

  const seletorAulas = (ocHoje||[]).map(oc => {
    const dt = new Date(oc.data_hora)
    const hora = dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    const sel = oc.id === ocSelecionadaId
    return `<button onclick="window._ocPresencaId='${oc.id}';navigate('presencas')" style="padding:7px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${sel?'var(--verde)':'var(--borda)'};background:${sel?'var(--verde)':'#fff'};color:${sel?'var(--bege)':'var(--txt2)'};display:flex;align-items:center;gap:6px">
      ${dot(oc.modalidade)} ${NOMES[oc.modalidade]} ${hora}
      <span style="background:${sel?'rgba(242,236,206,.2)':'rgba(31,56,31,.08)'};padding:1px 6px;border-radius:10px;font-size:10px">${oc.confirmados||0}/${oc.vagas_total}</span>
    </button>`
  }).join('')

  const statusMap   = { confirmado:'Confirmado', presente:'Presente', ausente:'Ausente', pendente:'Pendente', cancelado:'Cancelado' }
  const statusBg    = { confirmado:'#e8f4e8', presente:'#e8f4e8', ausente:'#fceaea', pendente:'rgba(232,188,79,.15)', cancelado:'#f0ede4' }
  const statusColor = { confirmado:'#1a5a1a', presente:'#1a5a1a', ausente:'#8a1a1a', pendente:'#7a5a10', cancelado:'#5a5a4a' }

  const ehHoje = dataSel.toDateString() === hoje.toDateString()
  const dataFmtLonga = dataSel.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})
  const dataISO = dataSel.toISOString().slice(0,10)

  const antOntem = new Date(dataSel); antOntem.setDate(dataSel.getDate()-1)
  const amanha   = new Date(dataSel); amanha.setDate(dataSel.getDate()+1)
  const anteriorISO = antOntem.toISOString().slice(0,10)
  const amanhaISO   = amanha.toISOString().slice(0,10)

  const alunosJaConfirmados = new Set(confs.map(c => c.aluno?.id).filter(Boolean))
  const alunosDisponiveis = (todosAlunos||[]).filter(a => !alunosJaConfirmados.has(a.id))

  const aulaPassada = ocAtual ? new Date(ocAtual.data_hora) < hoje : false

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Presenças</div>
      <div style="font-size:11px;color:var(--txt2)">${dataFmtLonga}</div>
    </div>
    <div class="content">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        <button onclick="window._presencaData='${anteriorISO}';window._ocPresencaId=null;navigate('presencas')"
          style="padding:5px 10px;background:#fff;color:var(--txt);border:1px solid var(--borda);border-radius:5px;font-size:13px;cursor:pointer">‹</button>
        <button onclick="window._presencaData=null;window._ocPresencaId=null;navigate('presencas')"
          style="padding:5px 12px;background:${ehHoje?'var(--verde)':'#fff'};color:${ehHoje?'var(--bege)':'var(--txt)'};border:1px solid ${ehHoje?'var(--verde)':'var(--borda)'};border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">Hoje</button>
        <button onclick="window._presencaData='${amanhaISO}';window._ocPresencaId=null;navigate('presencas')"
          style="padding:5px 10px;background:#fff;color:var(--txt);border:1px solid var(--borda);border-radius:5px;font-size:13px;cursor:pointer">›</button>
        <input type="date" value="${dataISO}"
          onchange="window._presencaData=this.value;window._ocPresencaId=null;navigate('presencas')"
          style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff;color:var(--txt);cursor:pointer">
        <span style="font-size:11px;color:var(--txt2)">${ocHoje?.length||0} aula(s)</span>
      </div>
      ${ocHoje?.length===0?`<div style="text-align:center;padding:40px;font-size:13px;color:var(--txt2)">Nenhuma aula em ${dataFmtLonga}.</div>`:''}
      ${ocHoje?.length>0?`
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">${seletorAulas}</div>
        ${ocAtual?card(
          `${NOMES[ocAtual.modalidade]} — ${new Date(ocAtual.data_hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`,
          `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            ${badge(ocAtual.confirmados+'/'+(ocAtual.vagas_total)+' conf.','#e8f4e8','#1a5a1a')}
            ${aulaPassada ? '<span style="font-size:10px;color:#e67e22;background:rgba(230,126,34,.1);padding:2px 8px;border-radius:10px">Aula já realizada</span>' : ''}
            <button onclick="marcarTodosPresentes('${ocSelecionadaId}')" style="padding:3px 10px;background:var(--verde);color:var(--bege);border:none;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">✓ Todos presentes</button>
          </div>`,
          `<div style="padding:10px 18px;background:rgba(242,236,206,.25);border-bottom:1px solid var(--borda);display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500;white-space:nowrap">+ Adicionar aluno</span>
            <select id="sel-add-aluno" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff;color:var(--txt);flex:1;min-width:180px">
              <option value="">— selecionar aluno —</option>
              ${alunosDisponiveis.map(a=>`<option value="${a.id}">${a.nome}</option>`).join('')}
            </select>
            <button onclick="adicionarAlunoPresenca('${ocSelecionadaId}')" style="padding:5px 12px;background:var(--verde);color:var(--bege);border:none;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap">Adicionar${aulaPassada?' (débita saldo)':''}</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 90px 100px 120px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
            <span>Aluno</span><span>Confirmou</span><span>Status</span><span>Ações</span>
          </div>
          ${confs.length===0?'<div style="padding:16px 18px;font-size:12px;color:var(--txt2)">Nenhuma confirmação para esta aula.</div>':
            confs.map(c=>`<div style="display:grid;grid-template-columns:1fr 90px 100px 120px;align-items:center;gap:10px;padding:9px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px" id="conf-row-${c.id}">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:26px;height:26px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:var(--verde)">${(c.aluno?.nome||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</div>
                <span style="font-weight:500">${c.aluno?.nome||'—'}</span>
              </div>
              <span style="font-size:10px;color:var(--txt2)">${c.confirmado_em?new Date(c.confirmado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'-'}</span>
              <span>${badge(statusMap[c.status]||c.status, statusBg[c.status]||'#f0ede4', statusColor[c.status]||'#5a5a4a')}</span>
              <div style="display:flex;gap:4px">
                <button onclick="setPresenca('${c.id}',true)" style="padding:3px 7px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif" title="Presente">✓</button>
                <button onclick="setPresenca('${c.id}',false)" style="padding:3px 7px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif" title="Ausente">✕</button>
                <button onclick="excluirPresenca('${c.id}','${(c.aluno?.nome||'').replace(/'/g,"\\'")}','${c.aluno?.id||''}')" style="padding:3px 7px;background:#f0ede4;color:#5a5a4a;border:none;border-radius:4px;font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif" title="Remover presença">🗑</button>
              </div>
            </div>`).join('')
          }`
        ):''}
      `:''}
    </div>
  `

  window.setPresenca = async function(confId, presente) {
    const { error } = await sb.rpc('admin_set_presenca', {
      p_conf_id: confId,
      p_presente: presente,
    })
    if (error) { toast('Erro: '+error.message); return }
    toast(presente ? '✓ Marcado presente' : '✕ Marcado ausente')
    navigate('presencas')
  }

  window.marcarTodosPresentes = async function(ocId) {
    const temConfirmados = confs.some(c => c.status === 'confirmado')
    if (!temConfirmados) { toast('Nenhum confirmado para marcar'); return }
    const { error } = await sb.rpc('admin_marcar_todos_presentes', {
      p_ocorrencia_id: ocId,
    })
    if (error) { toast('Erro: '+error.message); return }
    toast('✓ Todos marcados como presentes!')
    navigate('presencas')
  }

  window.adicionarAlunoPresenca = async function(ocId) {
    const alunoId = document.getElementById('sel-add-aluno')?.value
    if (!alunoId) { toast('Selecione um aluno'); return }

    const { data: existe } = await sb.from('confirmacoes')
      .select('id,status')
      .eq('ocorrencia_id', ocId)
      .eq('aluno_id', alunoId)
      .maybeSingle()

    if (existe) {
      if (existe.status === 'cancelado') {
        const { data, error } = await sb.rpc('admin_adicionar_presenca', {
          p_aluno_id: alunoId,
          p_ocorrencia_id: ocId,
        })
        if (error || !data?.ok) {
          toast('Erro: ' + (data?.motivo || error?.message))
          return
        }
        toast('✓ Presença reativada!')
      } else {
        toast('Aluno já está na lista')
      }
      navigate('presencas')
      return
    }

    const { data, error } = await sb.rpc('admin_adicionar_presenca', {
      p_aluno_id: alunoId,
      p_ocorrencia_id: ocId,
    })
    if (error || !data?.ok) {
      toast('Erro: ' + (data?.motivo || error?.message))
      return
    }
    if (!window._presencaDebitou) window._presencaDebitou = {}
    const { data: novaConf } = await sb.from('confirmacoes')
      .select('id').eq('ocorrencia_id', ocId).eq('aluno_id', alunoId).single()
    if (novaConf?.id) window._presencaDebitou[novaConf.id] = !!data.debitou
    toast('✓ Aluno adicionado!' + (data.debitou ? ' Saldo debitado.' : ''))
    navigate('presencas')
  }

  window.excluirPresenca = async function(confId, nomeAluno, alunoId) {
    if (!confirm('Remover presença de ' + nomeAluno + '?\nSe o saldo foi debitado, ele será estornado.')) return

    const { data: conf } = await sb.from('confirmacoes')
      .select('aluno_id,ocorrencia_id,status').eq('id', confId).single()
    if (!conf) { toast('Confirmação não encontrada'); return }

    const { error } = await sb.rpc('admin_cancelar_presenca', { p_conf_id: confId })
    if (error) { toast('Erro: '+error.message); return }

    const foiDebitado = window._presencaDebitou?.[confId] ?? (conf.status === 'presente')
    const { data: mat } = await sb.from('matriculas')
      .select('plano_tipo,opcao_aulas')
      .eq('aluno_id', conf.aluno_id)
      .eq('ativa', true)
      .single()
    const ehLivre = mat?.plano_tipo === 'vishnu_livre' || mat?.opcao_aulas === 99

    if (!ehLivre && foiDebitado) {
      await sb.rpc('creditar_aulas_manual', {
        p_aluno_id: conf.aluno_id,
        p_quantidade: 1,
        p_motivo: 'Estorno por remoção de presença pelo admin',
      })
    }

    if (window._presencaDebitou) delete window._presencaDebitou[confId]
    toast('✓ Presença removida' + (!ehLivre && foiDebitado ? ' e crédito estornado' : ''))
    navigate('presencas')
  }
}       
