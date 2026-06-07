/**
 * src/pages/admin/grade.js
 * Grade semanal — admin e aluno
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderAlunoGrade(container, page) {
  const sb = window._sb
  const perfil = window._perfil
  const tipo = perfil?.tipo

    const isAluno = page === 'aluno-grade'
    const hoje = new Date()
    // Semana com offset navegável
    const offset = window._gradeOffset || 0
    const diaSemana = hoje.getDay() === 0 ? 6 : hoje.getDay() - 1
    const seg = new Date(hoje); seg.setDate(hoje.getDate() - diaSemana + offset*7); seg.setHours(0,0,0,0)
    const dom = new Date(seg); dom.setDate(seg.getDate() + 6); dom.setHours(23,59,59,999)

    const [ocRes, cfgRes, matRes] = await Promise.all([
      sb.from('ocorrencias_vagas').select('*').gte('data_hora', seg.toISOString()).lte('data_hora', dom.toISOString()).order('data_hora'),
      sb.from('configuracoes').select('*'),
      isAluno ? sb.from('matriculas').select('plano_tipo,opcao_aulas').eq('aluno_id', window._perfil.id).eq('ativa',true).single() : Promise.resolve({data:null}),
    ])
    let ocorrencias = ocRes.data || []
    const cfg = Object.fromEntries((cfgRes.data||[]).map(c=>[c.chave,c.valor]))
    const planoAluno = matRes.data?.plano_tipo

    // ── Filtros do aluno ──────────────────────────────────────
    const f = window._gradeFiltrosAluno || {}
    if (f.modalidade) ocorrencias = ocorrencias.filter(o => o.modalidade === f.modalidade)
    if (f.horario)    ocorrencias = ocorrencias.filter(o => {
      const h = new Date(o.data_hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
      return h === f.horario
    })

    // Modalidades permitidas por plano
    let modPermitidas = ['hatha','acro','raja']
    if (isAluno && planoAluno) {
      const mp = {brahma:['hatha'], shiva:['hatha','raja'], vishnu:['hatha','raja','acro']}
      modPermitidas = mp[planoAluno] || ['hatha']
    }

    // Buscar confirmações do aluno
    let minhasConfs = new Set()
    if (isAluno) {
      const ids = ocorrencias.map(o=>o.id)
      if (ids.length) {
        const { data: confs } = await sb.from('confirmacoes').select('ocorrencia_id').eq('aluno_id', window._perfil.id).in('ocorrencia_id', ids).eq('status','confirmado')
        ;(confs||[]).forEach(c => minhasConfs.add(c.ocorrencia_id))
      }
    }

    // Verificar feriados na semana
    const { data: feriados } = await sb.from('feriados').select('*').gte('data', seg.toISOString().slice(0,10)).lte('data', dom.toISOString().slice(0,10))
    const feriadosDatas = new Set((feriados||[]).map(f=>f.data))

    // Agrupar ocorrências por dia e hora
    const grade = {} // grade[dia_iso][hora] = ocorrencia
    ocorrencias.forEach(o => {
      const dt = new Date(o.data_hora)
      const diaKey = dt.toISOString().slice(0,10)
      const horaKey = dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
      if (!grade[diaKey]) grade[diaKey] = {}
      grade[diaKey][horaKey] = o
    })

    // Todas as horas com aulas
    const horasSet = new Set()
    ocorrencias.forEach(o => {
      const dt = new Date(o.data_hora)
      horasSet.add(dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}))
    })
    const horas = [...horasSet].sort()

    // Dias da semana
    const diasDaSemana = []
    for (let i=0; i<7; i++) {
      const d = new Date(seg); d.setDate(seg.getDate()+i)
      diasDaSemana.push(d)
    }

    const prazoMin = Number(cfg.prazo_confirmacao_min||60)

    // Construir grade HTML
    let gradeHTML = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:600px">`
    // Cabeçalho
    gradeHTML += `<tr><th style="background:var(--verde);color:var(--bege);padding:8px;font-size:11px;font-weight:500;width:60px">Hora</th>`
    diasDaSemana.forEach(d => {
      const dStr = d.toISOString().slice(0,10)
      const isHoje = d.toDateString() === hoje.toDateString()
      const isFeriado = feriadosDatas.has(dStr)
      gradeHTML += `<th style="background:${isHoje?'#2d5a2d':'var(--verde)'};color:var(--bege);padding:8px;font-size:10px;font-weight:500;text-align:center;${isFeriado?'opacity:.6':''}">
        ${d.toLocaleDateString('pt-BR',{weekday:'short'})}<br>
        <span style="font-size:11px;font-weight:400">${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>
        ${isFeriado?'<br><span style="font-size:9px;color:var(--dourado)">feriado</span>':''}
      </th>`
    })
    gradeHTML += '</tr>'

    // Linhas de hora
    if (horas.length === 0) {
      gradeHTML += `<tr><td colspan="8" style="text-align:center;padding:30px;font-size:13px;color:var(--txt2)">Nenhuma aula agendada esta semana.</td></tr>`
    }
    horas.forEach(hora => {
      gradeHTML += `<tr><td style="background:rgba(242,236,206,.5);padding:6px 8px;font-size:11px;font-weight:500;color:var(--txt2);text-align:center;border:1px solid var(--borda)">${hora}</td>`
      diasDaSemana.forEach(d => {
        const dStr = d.toISOString().slice(0,10)
        const oc = grade[dStr]?.[hora]
        const isFeriado = feriadosDatas.has(dStr)
        if (!oc) {
          gradeHTML += `<td style="border:1px solid rgba(212,200,158,.3);background:#fafaf7;min-height:48px"></td>`
        } else {
          const confirmado = minhasConfs.has(oc.id)
          const lotada = oc.vagas_livres <= 0
          const agora = new Date()
          const dtAula = new Date(oc.data_hora)
          const prazoLimite = new Date(dtAula.getTime() - prazoMin*60000)
          const foraPrazo = agora > prazoLimite
          const permitida = modPermitidas.includes(oc.modalidade)
          const passada = dtAula < agora

          let bgCell = '#fff'
          let borderCell = `border-left:3px solid ${CORES[oc.modalidade]||'#888'}`
          if (confirmado) bgCell = 'rgba(232,188,79,.08)'
          if (!permitida) bgCell = '#f8f8f8'

          let actionHtml = ''
          if (isAluno && !passada) {
            if (!permitida) {
              actionHtml = `<div style="font-size:9px;color:#ccc;margin-top:3px">🔒 ${planoAluno}</div>`
            } else if (confirmado) {
              actionHtml = `<div style="font-size:9px;color:var(--dourado);font-weight:500;margin-top:3px">✓ Confirmado</div>`
            } else if (foraPrazo) {
              actionHtml = `<div style="font-size:9px;color:#c0392b;margin-top:3px">Prazo enc.</div>`
            } else if (lotada) {
              actionHtml = `<div style="font-size:9px;color:#c0392b;margin-top:3px">Lotada</div>`
            } else {
              actionHtml = `<button onclick="confirmarOcorrencia('${oc.id}')" style="margin-top:3px;padding:2px 7px;background:var(--dourado);color:var(--verde);border:none;border-radius:4px;font-size:9px;cursor:pointer;font-weight:500;font-family:'DM Sans',sans-serif">Confirmar</button>`
            }
          }

          const adminActions = !isAluno ? `<div style="display:flex;gap:2px;margin-top:3px">
            <button onclick="event.stopPropagation();editarOcorrencia('${oc.id}')" style="padding:1px 5px;background:rgba(31,56,31,.1);color:var(--verde);border:none;border-radius:3px;font-size:9px;cursor:pointer" title="Editar">✎</button>
            <button onclick="event.stopPropagation();excluirOcorrencia('${oc.id}')" style="padding:1px 5px;background:rgba(255,0,0,.08);color:#c0392b;border:none;border-radius:3px;font-size:9px;cursor:pointer" title="Excluir">✕</button>
            <button onclick="event.stopPropagation();verPresencasOcorrencia('${oc.id}')" style="padding:1px 5px;background:rgba(31,56,31,.1);color:var(--verde);border:none;border-radius:3px;font-size:9px;cursor:pointer" title="Presenças">👥</button>
          </div>` : ''
          gradeHTML += `<td style="border:1px solid rgba(212,200,158,.3);background:${bgCell};padding:5px 7px;vertical-align:top;cursor:${isAluno?'default':'pointer'}" ${!isAluno?`onclick="verDetalhesOcorrencia('${oc.id}')"`:''}">
            <div style="font-size:10px;font-weight:500;${borderCell};padding-left:4px;line-height:1.3;color:${!permitida?'#ccc':'var(--txt)'}">${NOMES[oc.modalidade]}</div>
            <div style="font-size:9px;color:var(--txt2);margin-top:1px">${oc.confirmados||0}/${oc.vagas_total}</div>
            ${oc.professor_nome?`<div style="font-size:9px;color:var(--txt2);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px" title="${oc.professor_nome}">👤 ${oc.professor_nome.split(' ')[0]}</div>`:''}
            ${isFeriado&&!isAluno?`<div style="font-size:9px;color:#8a6b1a;margin-top:1px">⚠ feriado</div>`:''}
            ${actionHtml}
            ${adminActions}
          </td>`
        }
      })
      gradeHTML += '</tr>'
    })
    gradeHTML += '</table></div>'

    // Legenda
    const legendaHtml = `<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px">
      ${['hatha','acro','raja'].map(m=>`<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--txt2)">${dot(m)}${NOMES[m]}</span>`).join('')}
      ${isAluno?`<span style="font-size:11px;color:var(--txt2)">· Prazo: <strong>${prazoMin>=60?prazoMin/60+'h':prazoMin+'min'}</strong> antes</span>`:''}
    </div>`

    // Navegação de semana
    const fAtivo = window._gradeFiltrosAluno && Object.values(window._gradeFiltrosAluno).some(v=>v)
    const horasUnicas = [...new Set((ocRes.data||[]).map(o => {
      const dt = new Date(o.data_hora)
      return dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    }))].sort()

    const navHtml = `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <button onclick="window._gradeOffset=(window._gradeOffset||0)-1;navigate('${page}')" style="padding:5px 10px;background:#fff;color:var(--txt);border:1px solid var(--borda);border-radius:5px;font-size:13px;cursor:pointer">‹</button>
        <button onclick="window._gradeOffset=0;navigate('${page}')" style="padding:5px 12px;background:${(window._gradeOffset||0)===0?'var(--verde)':'#fff'};color:${(window._gradeOffset||0)===0?'var(--bege)':'var(--txt)'};border:1px solid ${(window._gradeOffset||0)===0?'var(--verde)':'var(--borda)'};border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">Hoje</button>
        <button onclick="window._gradeOffset=(window._gradeOffset||0)+1;navigate('${page}')" style="padding:5px 10px;background:#fff;color:var(--txt);border:1px solid var(--borda);border-radius:5px;font-size:13px;cursor:pointer">›</button>
        <span style="font-size:12px;color:var(--txt2);font-weight:500">${seg.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} – ${dom.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})}</span>
        ${fAtivo?`<button onclick="window._gradeFiltrosAluno={};navigate('${page}')" style="padding:4px 10px;background:#fceaea;color:#8a1a1a;border:1px solid #f0c0c0;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">✕ Limpar filtros</button>`:''}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding:10px 12px;background:rgba(242,236,206,.4);border:1px solid var(--borda);border-radius:7px;align-items:flex-end">
        <div style="display:flex;flex-direction:column;gap:3px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Modalidade</label>
          <select onchange="(window._gradeFiltrosAluno=window._gradeFiltrosAluno||{}).modalidade=this.value||'';navigate('${page}')"
            style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff;color:var(--txt);cursor:pointer;min-width:130px">
            <option value="" ${!(window._gradeFiltrosAluno?.modalidade)?'selected':''}>Todas</option>
            <option value="hatha" ${window._gradeFiltrosAluno?.modalidade==='hatha'?'selected':''}>Hatha Yoga</option>
            <option value="acro"  ${window._gradeFiltrosAluno?.modalidade==='acro' ?'selected':''}>Acro Yoga</option>
            <option value="raja"  ${window._gradeFiltrosAluno?.modalidade==='raja' ?'selected':''}>Raja Yoga</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:3px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Horário</label>
          <select onchange="(window._gradeFiltrosAluno=window._gradeFiltrosAluno||{}).horario=this.value||'';navigate('${page}')"
            style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff;color:var(--txt);cursor:pointer;min-width:100px">
            <option value="" ${!(window._gradeFiltrosAluno?.horario)?'selected':''}>Todos</option>
            ${horasUnicas.map(h=>`<option value="${h}" ${window._gradeFiltrosAluno?.horario===h?'selected':''}>${h}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>`

    // Modal detalhes ocorrência (admin)
    const modalDetalhes = !isAluno ? modal('modal-det-oc', 'Detalhes da Aula',
      `<div id="det-oc-body">Carregando...</div>`,
      `<button onclick="document.getElementById('modal-det-oc').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Fechar</button>
       <button onclick="navigate('presencas')" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Ver Presenças</button>`
    ) : ''

    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-t">Grade de Aulas</div>
        ${isAluno?`<div>${badge('Plano '+planoAluno,'#e8f4e8','#1a5a1a')}</div>`:''}
      </div>
      <div class="content">
        ${feriados?.length?`<div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);border-radius:6px;padding:9px 13px;display:flex;align-items:center;gap:8px;font-size:12px;color:#7a5a10;margin-bottom:12px"><i class="ti ti-alert-triangle" style="color:var(--dourado)"></i><span>Há feriados esta semana: ${(feriados||[]).map(f=>f.nome).join(', ')}</span></div>`:''}
        ${navHtml}
        ${legendaHtml}
        ${gradeHTML}
      </div>
      ${modalDetalhes}
    `

    window.editarOcorrencia = async function(ocId) {
      const { data: oc } = await sb.from('ocorrencias').select('*, aula:aulas(vagas,modalidade)').eq('id', ocId).single()
      const dt = new Date(oc.data_hora)
      const novaData = prompt('Data da aula (AAAA-MM-DD):', dt.toISOString().slice(0,10))
      if (!novaData) return
      const novaHora = prompt('Hora (HH:MM):', dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}))
      if (!novaHora) return
      const novasVagas = prompt('Vagas:', oc.vagas_override||oc.aula?.vagas||15)
      const dtNova = novaData + 'T' + novaHora + ':00-03:00'
      const { data: fer } = await sb.from('feriados').select('nome').eq('data', novaData)
      await sb.from('ocorrencias').update({
        data_hora: dtNova,
        vagas_override: novasVagas ? Number(novasVagas) : null,
        eh_feriado: !!(fer&&fer.length),
        nome_feriado: fer?.[0]?.nome||null
      }).eq('id', ocId)
      toast('✓ Aula atualizada')
      navigate(page)
    }

    window.excluirOcorrencia = async function(ocId) {
      if (!confirm('Excluir esta aula? As confirmações também serão removidas.')) return
      await sb.from('confirmacoes').delete().eq('ocorrencia_id', ocId)
      await sb.from('ocorrencias').delete().eq('id', ocId)
      toast('Aula excluída')
      navigate(page)
    }

    window.verPresencasOcorrencia = async function(ocId) {
      window._ocPresencaId = ocId
      navigate('presencas')
    }

    window.confirmarOcorrencia = async function(ocId) {
      const { data, error } = await sb.rpc('confirmar_presenca', { p_aluno_id: window._perfil.id, p_ocorrencia_id: ocId })
      if (error || !data?.ok) { toast('❌ '+(data?.motivo||error?.message)); return }
      toast('✓ Presença confirmada!')
      navigate(page)
    }

    window.verDetalhesOcorrencia = async function(ocId) {
      const modal = document.getElementById('modal-det-oc')
      modal.style.display = 'flex'
      const body = document.getElementById('det-oc-body')
      body.innerHTML = 'Carregando...'
      const [ocRes, confsRes] = await Promise.all([
        sb.from('ocorrencias_vagas').select('*').eq('id', ocId).single(),
        sb.from('confirmacoes').select('*, aluno:perfis!aluno_id(nome)').eq('ocorrencia_id', ocId).in('status',['confirmado','presente','ausente']).order('confirmado_em'),
      ])
      const oc = ocRes.data
      const confs = confsRes.data || []
      const dt = new Date(oc.data_hora)
      body.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          <div style="background:var(--fundo);border-radius:6px;padding:12px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2)">Aula</div><div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--verde)">${NOMES[oc.modalidade]}</div></div>
          <div style="background:var(--fundo);border-radius:6px;padding:12px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2)">Data/Hora</div><div style="font-size:13px;font-weight:500;color:var(--verde);margin-top:3px">${dt.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})} ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          <div style="background:var(--fundo);border-radius:6px;padding:12px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2)">Confirmados</div><div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde)">${oc.confirmados||0}/${oc.vagas_total}</div></div>
          <div style="background:var(--fundo);border-radius:6px;padding:12px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2)">Professor</div><div style="font-size:13px;font-weight:500;color:var(--verde);margin-top:3px">${oc.professor_nome||'—'}</div></div>
        </div>
        ${oc.eh_feriado?`<div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);border-radius:6px;padding:8px 12px;font-size:12px;color:#7a5a10;margin-bottom:12px">⚠ Esta aula cai em feriado: ${oc.nome_feriado}</div>`:''}
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);margin-bottom:8px">Alunos confirmados (${confs.length})</div>
        ${confs.length===0?'<div style="font-size:12px;color:var(--txt2);padding:10px 0">Nenhuma confirmação ainda.</div>':
          confs.map(c=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:var(--fundo);border-radius:6px;margin-bottom:4px">
            <span style="font-size:12px;font-weight:500">${c.aluno?.nome||'—'}</span>
            ${badge(c.status==='confirmado'?'Confirmado':c.status==='presente'?'Presente':'Ausente',
              c.status==='confirmado'?'#e8f4e8':c.status==='presente'?'#e8f4e8':'#fceaea',
              c.status==='ausente'?'#8a1a1a':'#1a5a1a')}
          </div>`).join('')
        }
      `
      window._ocAtual = ocId
    }
}
