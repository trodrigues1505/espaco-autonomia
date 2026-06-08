/**
 * src/pages/admin/criar_aulas.js
 * Criar aulas fixas e avulsas
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderCriarAulas(container, page) {
  const sb = window._sb
  const perfil = window._perfil
  const tipo = perfil?.tipo

    const hojeISO = new Date().toISOString()
    const [aulasRes, profsRes, cfgRes, ocsFutRes, ocsTodosRes] = await Promise.all([
      sb.from('aulas').select('*, professor:perfis!professor_id(nome), horarios:aulas_horarios(*)').order('criado_em', {ascending:false}),
      sb.from('perfis').select('id,nome').eq('tipo','professor').order('nome'),
      sb.from('configuracoes').select('*'),
      // RPC agrupa no banco — evita o limite de 1000 linhas do PostgREST
      sb.rpc('get_aulas_com_ocorrencias', { p_data_hora: hojeISO }),
      sb.rpc('get_aulas_com_ocorrencias', { p_data_hora: null }),
    ])
    const aulas = aulasRes.data || []
    const profs = profsRes.data || []
    const cfg = Object.fromEntries((cfgRes.data||[]).map(c=>[c.chave,c.valor]))

    // Mapa aula_id → contagem de ocorrências futuras
    const ocsFuturas = {}
    for (const row of (ocsFutRes.data || [])) {
      ocsFuturas[row.aula_id] = Number(row.total)
    }
    // Set de aulas que já tiveram alguma ocorrência (passada ou futura)
    const aulasComOcs = new Set((ocsTodosRes.data || []).map(o => o.aula_id))

    // Filtros
    const filtroMod  = window._criarFiltroMod  || ''
    const filtroProf = window._criarFiltroProf || ''
    const filtroStat = window._criarFiltroStat || ''
    const filtroDia  = window._criarFiltroDia  || ''
    const filtroHora = window._criarFiltroHora || ''
    const filtrar = arr => arr
      .filter(a => !filtroMod  || a.modalidade === filtroMod)
      .filter(a => !filtroProf || a.professor_id === filtroProf)
      .filter(a => !filtroStat || (filtroStat==='ativa'?a.ativa:!a.ativa))
      .filter(a => !filtroDia  || (a.horarios||[]).some(h=>h.dia_semana===filtroDia))
      .filter(a => !filtroHora || (a.horarios||[]).some(h=>h.hora_inicio.slice(0,5)===filtroHora))
    const fixas   = filtrar(aulas.filter(a=>a.tipo==='fixa'))
    const avulsas = filtrar(aulas.filter(a=>a.tipo==='avulsa'))

    // Horários únicos para o filtro
    const horasUnicas = [...new Set(aulas.flatMap(a=>(a.horarios||[]).map(h=>h.hora_inicio.slice(0,5))))].sort()

    // Detectar redundâncias
    const chaveAula = a => (a.horarios||[]).map(h=>a.modalidade+'|'+h.dia_semana+'|'+h.hora_inicio.slice(0,5)).sort().join(',')
    const chaveMap = {}, redundantes = new Set()
    for (const a of aulas.filter(a=>a.tipo==='fixa' && a.ativa)) {
      const k = chaveAula(a)
      if (k && chaveMap[k]) { redundantes.add(a.id); redundantes.add(chaveMap[k]) }
      else if (k) chaveMap[k] = a.id
    }

    function renderAulaRow(a) {
      const diasStr = (a.horarios||[]).map(h=>`${DIAS_LABEL[h.dia_semana]||h.dia_semana} ${h.hora_inicio.slice(0,5)}`).join(', ')
      const statusBadge = a.ativa ? badge('Ativa','#e8f4e8','#1a5a1a') : badge('Inativa','#fceaea','#8a1a1a')
      const isRed = redundantes.has(a.id)
      const nFut  = ocsFuturas[a.id] || 0
      const jaGerou = aulasComOcs.has(a.id)
      const geradoBadge = nFut > 0
        ? `<span style="background:#e8f4e8;color:#1a5a1a;padding:2px 7px;border-radius:10px;font-size:9px;font-weight:500">✓ ${nFut} futuras</span>`
        : jaGerou
          ? `<span style="background:rgba(232,188,79,.2);color:#7a5a10;padding:2px 7px;border-radius:10px;font-size:9px;font-weight:500">⚠ Sem futuras</span>`
          : `<span style="background:#fceaea;color:#8a1a1a;padding:2px 7px;border-radius:10px;font-size:9px;font-weight:500">✗ Nunca gerada</span>`
      return `<div style="display:grid;grid-template-columns:1fr 110px 70px 60px 110px 60px;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px;background:${isRed?'rgba(255,180,180,.12)':'transparent'}">
        <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">${dot(a.modalidade)}<strong>${NOMES[a.modalidade]}</strong><span style="font-size:10px;color:var(--txt2)">${diasStr}</span>${isRed?'<span style="background:#fceaea;color:#8a1a1a;font-size:9px;padding:1px 6px;border-radius:8px;margin-left:2px">⚠ redundante</span>':''}</span>
        <span style="font-size:11px;color:var(--txt2)">${a.professor?.nome||'—'}</span>
        <span style="font-size:11px">${a.vagas} vagas</span>
        <span>${statusBadge}</span>
        <div style="display:flex;flex-direction:column;gap:3px;align-items:flex-start">
          ${geradoBadge}
          <button onclick="gerarOcorrenciasAula('${a.id}')" style="padding:2px 8px;background:rgba(31,56,31,.08);color:var(--verde);border:1px solid rgba(31,56,31,.2);border-radius:4px;font-size:9px;cursor:pointer;font-family:'DM Sans',sans-serif">${nFut>0?'↻ Regerar':jaGerou?'↻ Regerar':'▶ Gerar'}</button>
        </div>
        <div style="display:flex;gap:3px">
          <button onclick="editarAula('${a.id}')" style="padding:3px 7px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif" title="Editar">✎</button>
          <button onclick="excluirAula('${a.id}')" style="padding:3px 7px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif" title="Excluir">✕</button>
        </div>
      </div>`
    }

    const diasCheckboxes = ['seg','ter','qua','qui','sex','sab','dom'].map(d=>
      `<label style="display:flex;align-items:center;gap:5px;padding:5px 10px;border:1px solid var(--borda);border-radius:20px;font-size:11px;cursor:pointer">
        <input type="checkbox" name="dia" value="${d}" style="accent-color:var(--verde)"> ${DIAS_LABEL[d].slice(0,3)}
      </label>`
    ).join('')

    const profsOptions = profs.map(p=>`<option value="${p.id}">${p.nome}</option>`).join('')

    const modalCriar = modal('modal-criar-aula', 'Nova Aula',
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${fi('','Modalidade',`<select id="na-mod" ${inputStyle}><option value="hatha">Hatha Yoga</option><option value="acro">Acro Yoga</option><option value="raja">Raja Yoga</option></select>`)}
        ${fi('','Tipo',`<select id="na-tipo" ${inputStyle} onchange="toggleTipoAula()"><option value="fixa">Fixa (recorrente)</option><option value="avulsa">Avulsa (única)</option></select>`)}
      </div>
      <div id="na-dias-wrap">
        ${fi('','Dias da semana',`<div style="display:flex;flex-wrap:wrap;gap:6px">${diasCheckboxes}</div>`)}
      </div>
      <div id="na-data-wrap" style="display:none">
        ${fi('','Data',`<input type="date" id="na-data" ${inputStyle}>`)}
      </div>
      <div id="na-horas-wrap">
        <div style="margin-bottom:12px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:6px">Horários (selecione um ou mais)</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px" id="na-horas-checks">
            ${HORARIOS.map(h=>`<label style="display:flex;align-items:center;gap:5px;padding:5px 10px;border:1px solid var(--borda);border-radius:20px;font-size:11px;cursor:pointer"><input type="checkbox" name="hora" value="${h}" style="accent-color:var(--verde)"> ${h}</label>`).join('')}
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${fi('','Duração',`<select id="na-dur" ${inputStyle}><option value="60">60 minutos</option><option value="75">75 minutos</option><option value="90">90 minutos</option></select>`)}
        ${fi('','Vagas',`<input type="number" id="na-vagas" value="${cfg.vagas_padrao||15}" min="1" max="100" ${inputStyle}>`)}
      </div>
      <div style="display:grid;grid-template-columns:1fr;gap:12px">
        ${fi('','Professor',`<select id="na-prof" ${inputStyle}>${profsOptions}</select>`)}
      </div>
      <div id="na-feriado-warn" style="display:none;background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);border-radius:6px;padding:8px 12px;font-size:12px;color:#7a5a10">⚠ Data coincide com feriado. Verifique antes de confirmar.</div>`,
      `<button onclick="document.getElementById('modal-criar-aula').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
       <button onclick="salvarNovaAula()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Criar Aula</button>`
    )

    const modalGerar = modal('modal-gerar', 'Gerar Ocorrências',
      `<p style="font-size:13px;color:var(--txt2);margin-bottom:14px">Gera as datas reais da aula no período selecionado, verificando feriados automaticamente.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${fi('','De',`<input type="date" id="ger-de" ${inputStyle}>`)}
        ${fi('','Até',`<input type="date" id="ger-ate" ${inputStyle}>`)}
      </div>`,
      `<button onclick="document.getElementById('modal-gerar').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
       <button onclick="executarGerarOcorrencias()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Gerar</button>`
    )

    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-t">Criar Aulas</div>
        <div style="display:flex;gap:6px">
          ${[...aulasComOcs].filter ? aulas.filter(a=>a.tipo==='fixa'&&a.ativa&&!ocsFuturas[a.id]).length > 0 ? `<button onclick="gerarTodasPendentes()" style="padding:6px 13px;background:#fff;color:var(--verde);border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">▶ Gerar pendentes (${aulas.filter(a=>a.tipo==='fixa'&&a.ativa&&!ocsFuturas[a.id]).length})</button>` : '' : ''}
          <button onclick="document.getElementById('modal-criar-aula').style.display='flex'" style="padding:6px 13px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px"><i class="ti ti-plus"></i> Nova Aula</button>
        </div>
      </div>
      <div class="content">
        <div style="background:rgba(31,56,31,.04);border:1px solid rgba(31,56,31,.12);border-radius:6px;padding:9px 13px;font-size:12px;color:var(--verde);margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <i class="ti ti-info-circle"></i>
          <span>Após criar uma aula fixa, clique em <strong>Gerar</strong> para criar as datas do semestre no banco.</span>
        </div>
        ${redundantes.size>0?`<div style="background:#fceaea;border:1px solid #f5c1c1;border-radius:6px;padding:9px 13px;font-size:12px;color:#8a1a1a;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px">
          <span>⚠ <strong>${redundantes.size} aula(s) com possível redundância</strong> — mesma modalidade, dia e horário já cadastrados.</span>
          <button onclick="abrirModalRedundancias()" style="padding:4px 12px;background:#8a1a1a;color:#fff;border:none;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap">Ver e resolver →</button>
        </div>`:''}
        <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:flex-end">
          <div style="display:flex;flex-direction:column;gap:3px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Modalidade</label>
            <select onchange="window._criarFiltroMod=this.value;navigate('criar-aulas')" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff">
              <option value="" ${!filtroMod?'selected':''}>Todas</option>
              <option value="hatha" ${filtroMod==='hatha'?'selected':''}>Hatha Yoga</option>
              <option value="acro"  ${filtroMod==='acro' ?'selected':''}>Acro Yoga</option>
              <option value="raja"  ${filtroMod==='raja' ?'selected':''}>Raja Yoga</option>
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:3px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Professor</label>
            <select onchange="window._criarFiltroProf=this.value;navigate('criar-aulas')" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff">
              <option value="" ${!filtroProf?'selected':''}>Todos</option>
              ${profs.map(p=>`<option value="${p.id}" ${filtroProf===p.id?'selected':''}>${p.nome}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:3px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Dia</label>
            <select onchange="window._criarFiltroDia=this.value;navigate('criar-aulas')" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff">
              <option value="" ${!filtroDia?'selected':''}>Todos</option>
              ${['seg','ter','qua','qui','sex','sab','dom'].map(d=>`<option value="${d}" ${filtroDia===d?'selected':''}>${DIAS_LABEL[d]||d}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:3px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Horário</label>
            <select onchange="window._criarFiltroHora=this.value;navigate('criar-aulas')" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff">
              <option value="" ${!filtroHora?'selected':''}>Todos</option>
              ${horasUnicas.map(h=>`<option value="${h}" ${filtroHora===h?'selected':''}>${h}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:3px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Status</label>
            <select onchange="window._criarFiltroStat=this.value;navigate('criar-aulas')" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff">
              <option value="" ${!filtroStat?'selected':''}>Todos</option>
              <option value="ativa"   ${filtroStat==='ativa'  ?'selected':''}>Ativa</option>
              <option value="inativa" ${filtroStat==='inativa'?'selected':''}>Inativa</option>
            </select>
          </div>
          ${filtroMod||filtroProf||filtroStat||filtroDia||filtroHora?`<button onclick="window._criarFiltroMod='';window._criarFiltroProf='';window._criarFiltroStat='';window._criarFiltroDia='';window._criarFiltroHora='';navigate('criar-aulas')" style="padding:5px 10px;background:#fceaea;color:#8a1a1a;border:1px solid #f5c1c1;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;align-self:flex-end">✕ Limpar</button>`:''}
        </div>
        ${card('Aulas Fixas ('+fixas.length+')', '',
          `<div style="display:grid;grid-template-columns:1fr 110px 90px 60px 80px 70px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
            <span>Modalidade / Dias</span><span>Professor</span><span>Vagas</span><span>Status</span><span>Ocorrências</span><span>Ação</span>
          </div>
          ${fixas.length===0?'<div style="padding:18px;font-size:12px;color:var(--txt2)">Nenhuma aula fixa criada.</div>':fixas.map(renderAulaRow).join('')}`
        )}
        ${card('Aulas Avulsas ('+avulsas.length+')', '',
          `<div style="display:grid;grid-template-columns:1fr 110px 90px 60px 80px 70px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
            <span>Modalidade / Data</span><span>Professor</span><span>Vagas</span><span>Status</span><span></span><span>Ação</span>
          </div>
          ${avulsas.length===0?'<div style="padding:18px;font-size:12px;color:var(--txt2)">Nenhuma aula avulsa criada.</div>':avulsas.map(renderAulaRow).join('')}`
        )}
      </div>
      ${modalCriar}
      ${modalGerar}
    `

    window.toggleTipoAula = function() {
      const t = document.getElementById('na-tipo').value
      document.getElementById('na-dias-wrap').style.display = t==='fixa'?'block':'none'
      document.getElementById('na-data-wrap').style.display = t==='avulsa'?'block':'none'
      if (t==='avulsa') {
        document.getElementById('na-data').addEventListener('change', async function() {
          const { data: fer } = await sb.from('feriados').select('*').eq('data', this.value)
          document.getElementById('na-feriado-warn').style.display = (fer&&fer.length)?'block':'none'
        })
      }
    }

    window.salvarNovaAula = async function() {
      const mod = document.getElementById('na-mod').value
      const tipo = document.getElementById('na-tipo').value
      const dur = document.getElementById('na-dur').value
      const vagas = document.getElementById('na-vagas').value
      const prof = document.getElementById('na-prof').value

      if (tipo === 'fixa') {
        const dias = [...document.querySelectorAll('input[name="dia"]:checked')].map(el=>el.value)
        const horas = [...document.querySelectorAll('input[name="hora"]:checked')].map(el=>el.value)
        if (!dias.length) { toast('Selecione ao menos um dia da semana'); return }
        if (!horas.length) { toast('Selecione ao menos um horário'); return }

        let ultimaAula = null
        for (const hora of horas) {
          const { data: novaAula, error: errAula } = await sb.from('aulas').insert({
            modalidade: mod, tipo, vagas: Number(vagas), duracao_min: Number(dur),
            professor_id: prof||null, criado_por: window._perfil.id
          }).select().single()
          if (errAula) { toast('Erro: '+errAula.message); return }
          ultimaAula = novaAula
          const horarios = dias.map(d => ({ aula_id: novaAula.id, dia_semana: d, hora_inicio: hora+':00' }))
          const { error: errH } = await sb.from('aulas_horarios').insert(horarios)
          if (errH) { toast('Erro horários: '+errH.message); return }
        }
        document.getElementById('modal-criar-aula').style.display = 'none'
        toast('✓ Aula criada! Confirme o período para gerar as datas.')
        if (ultimaAula?.id) {
          window._aulaParaGerar = ultimaAula.id
          navigate('criar-aulas')
          setTimeout(() => {
            const hoje2 = new Date().toISOString().slice(0,10)
            const em3anos = new Date(); em3anos.setFullYear(em3anos.getFullYear()+3)
            const deEl = document.getElementById('ger-de')
            const ateEl = document.getElementById('ger-ate')
            if (deEl) deEl.value = hoje2
            if (ateEl) ateEl.value = em3anos.toISOString().slice(0,10)
            document.getElementById('modal-gerar').style.display = 'flex'
          }, 300)
        } else {
          navigate('criar-aulas')
        }
      } else {
        const hora = [...document.querySelectorAll('input[name="hora"]:checked')].map(el=>el.value)[0]
        const data = document.getElementById('na-data').value
        if (!data) { toast('Informe a data'); return }
        if (!hora) { toast('Selecione um horário'); return }
        const { data: novaAula, error: errAula } = await sb.from('aulas').insert({
          modalidade: mod, tipo, vagas: Number(vagas), duracao_min: Number(dur),
          professor_id: prof||null, criado_por: window._perfil.id
        }).select().single()
        if (errAula) { toast('Erro: '+errAula.message); return }
        const dtOc = new Date(data+'T'+hora+':00')
        const { data: fer } = await sb.from('feriados').select('nome').eq('data', data)
        await sb.from('ocorrencias').insert({
          aula_id: novaAula.id, data_hora: dtOc.toISOString(),
          eh_feriado: !!(fer&&fer.length), nome_feriado: fer?.[0]?.nome||null
        })
        document.getElementById('modal-criar-aula').style.display = 'none'
        toast('✓ Aula avulsa criada!')
        navigate('criar-aulas')
      }
    }

    window._aulaParaGerar = null
    window.gerarOcorrenciasAula = function(aulaId) {
      window._aulaParaGerar = aulaId
      const hoje = new Date().toISOString().slice(0,10)
      const em3anos = new Date(); em3anos.setFullYear(em3anos.getFullYear()+3)
      document.getElementById('ger-de').value = hoje
      document.getElementById('ger-ate').value = em3anos.toISOString().slice(0,10)
      document.getElementById('modal-gerar').style.display = 'flex'
    }

    window.executarGerarOcorrencias = async function(silencioso = false) {
      const de = document.getElementById('ger-de').value
      const ate = document.getElementById('ger-ate').value
      if (!de||!ate) { toast('Preencha as datas'); return }

      const btnGerar = document.querySelector('#modal-gerar button[onclick="executarGerarOcorrencias()"]')
      if (btnGerar && !silencioso) { btnGerar.textContent = 'Gerando...'; btnGerar.disabled = true }

      try {
        const { data: aula, error: errAula } = await sb.from('aulas').select('*, horarios:aulas_horarios(*)').eq('id', window._aulaParaGerar).single()
        if (errAula || !aula) { toast('Erro ao buscar aula: '+(errAula?.message||'não encontrada')); return }
        if (!aula.horarios?.length) { toast('Esta aula não tem horários cadastrados'); return }

        const { data: feriados } = await sb.from('feriados').select('*').gte('data',de).lte('data',ate)
        const feriadosDatas = new Set((feriados||[]).map(f=>f.data))
        const diasMap = {seg:1,ter:2,qua:3,qui:4,sex:5,sab:6,dom:0}

        const ocorrencias = []
        const cursor = new Date(de+'T12:00:00')
        const fimDate = new Date(ate+'T12:00:00')
        let iteracoes = 0

        while (cursor <= fimDate && iteracoes < 400) {
          iteracoes++
          const diaSemana = cursor.getDay()
          for (const h of (aula.horarios||[])) {
            if (diasMap[h.dia_semana] === diaSemana) {
              const partes = h.hora_inicio.split(':')
              const hora = Number(partes[0])
              const min = Number(partes[1]||0)
              const dStr = cursor.toISOString().slice(0,10)
              const dtISO = dStr + 'T' + String(hora).padStart(2,'0') + ':' + String(min).padStart(2,'0') + ':00-03:00'
              const feriadoNome = feriadosDatas.has(dStr) ? (feriados||[]).find(f=>f.data===dStr)?.nome : null
              ocorrencias.push({ aula_id: aula.id, data_hora: dtISO, eh_feriado:!!feriadoNome, nome_feriado:feriadoNome||null })
            }
          }
          cursor.setDate(cursor.getDate()+1)
        }

        if (!ocorrencias.length) {
          toast('Nenhuma data gerada. Verifique os dias da semana configurados na aula.')
          return
        }

        let inseridos = 0
        for (let i=0; i<ocorrencias.length; i+=50) {
          const lote = ocorrencias.slice(i, i+50)
          const { error } = await sb.from('ocorrencias').upsert(lote, {onConflict:'aula_id,data_hora', ignoreDuplicates:true})
          if (error) { toast('Erro ao inserir: '+error.message); return }
          inseridos += lote.length
        }

        if (!silencioso) {
          document.getElementById('modal-gerar').style.display = 'none'
          toast('✓ '+inseridos+' aulas geradas com sucesso!')
          navigate('criar-aulas')
        }
      } finally {
        if (btnGerar) { btnGerar.textContent = 'Gerar'; btnGerar.disabled = false }
      }
    }

    window.editarAula = async function(id) {
      const { data: a } = await sb.from('aulas').select('*, horarios:aulas_horarios(*)').eq('id', id).single()
      const novasVagas = prompt('Vagas por aula:', a.vagas)
      if (novasVagas === null) return
      await sb.from('aulas').update({ vagas: Number(novasVagas) }).eq('id', id)
      toast('✓ Aula atualizada')
      navigate('criar-aulas')
    }

    window.excluirAula = async function(id) {
      if (!confirm('Excluir esta aula e todas as suas ocorrências futuras?')) return
      const hoje = new Date().toISOString()
      const { data: ocs } = await sb.from('ocorrencias').select('id').eq('aula_id', id).gte('data_hora', hoje)
      if (ocs?.length) {
        for (const oc of ocs) await sb.from('confirmacoes').delete().eq('ocorrencia_id', oc.id)
        await sb.from('ocorrencias').delete().eq('aula_id', id).gte('data_hora', hoje)
      }
      await sb.from('aulas_horarios').delete().eq('aula_id', id)
      await sb.from('aulas').delete().eq('id', id)
      toast('Aula excluída')
      navigate('criar-aulas')
    }

    window.abrirModalRedundancias = function() {
      const grupos = {}
      for (const a of aulas.filter(a=>a.tipo==='fixa' && a.ativa)) {
        const k = chaveAula(a); if (!k) continue
        if (!grupos[k]) grupos[k] = []
        grupos[k].push(a)
      }
      const gruposRed = Object.values(grupos).filter(g=>g.length>1)
      document.getElementById('modal-redundancias')?.remove()
      const div = document.createElement('div')
      div.id = 'modal-redundancias'
      div.style.cssText = 'position:fixed;inset:0;background:rgba(31,56,31,.7);z-index:250;display:flex;align-items:center;justify-content:center;padding:16px'
      let html = '<div style="background:#fff;border-radius:12px;width:620px;max-width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden">'
        + '<div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'
          + '<div style="font-family:Cormorant Garamond,serif;font-size:18px;font-weight:500;color:var(--bege)">Resolver Redundâncias</div>'
          + '<button id="btn-fechar-red" style="background:none;border:none;color:var(--bege);font-size:20px;cursor:pointer">×</button>'
        + '</div><div style="overflow-y:auto;flex:1;padding:16px">'
      for (const grupo of gruposRed) {
        const ex = grupo[0]
        const diasStr = (ex.horarios||[]).map(h=>`${DIAS_LABEL[h.dia_semana]||h.dia_semana} ${h.hora_inicio.slice(0,5)}`).join(', ')
        html += '<div style="border:1px solid var(--borda);border-radius:8px;padding:14px;margin-bottom:12px">'
          + `<div style="font-size:12px;font-weight:600;color:var(--verde);margin-bottom:10px">${NOMES[ex.modalidade]} · ${diasStr}</div>`
        for (const a of grupo) {
          const nOcs = ocsFuturas[a.id] || 0
          html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:rgba(242,236,206,.3);border-radius:6px;margin-bottom:6px;gap:10px">'
            + '<div>'
              + `<div style="font-size:12px;font-weight:500">${a.professor?.nome||'Sem professor'}</div>`
              + `<div style="font-size:10px;color:var(--txt2)">${nOcs>0?'✓ '+nOcs+' aulas geradas':'⚠ Não gerada'} · Criada ${a.criado_em?new Date(a.criado_em).toLocaleDateString('pt-BR'):'—'}</div>`
            + '</div>'
            + `<button onclick="excluirAulaRedundante('${a.id}')" style="padding:4px 10px;background:#fceaea;color:#8a1a1a;border:1px solid #f5c1c1;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">Excluir esta</button>`
          + '</div>'
        }
        html += '</div>'
      }
      html += '</div><div style="padding:12px 16px;border-top:1px solid var(--borda);font-size:11px;color:var(--txt2)">Excluir remove a aula e ocorrências futuras. Passadas são preservadas.</div></div>'
      div.innerHTML = html
      document.body.appendChild(div)
      document.getElementById('btn-fechar-red')?.addEventListener('click', () => div.remove())
      div.addEventListener('click', e => { if (e.target===div) div.remove() })
    }

    window.excluirAulaRedundante = async function(id) {
      if (!confirm('Excluir esta aula e suas ocorrências futuras?')) return
      const hoje = new Date().toISOString()
      const { data: ocs } = await sb.from('ocorrencias').select('id').eq('aula_id', id).gte('data_hora', hoje)
      if (ocs?.length) {
        for (const oc of ocs) await sb.from('confirmacoes').delete().eq('ocorrencia_id', oc.id)
        await sb.from('ocorrencias').delete().eq('aula_id', id).gte('data_hora', hoje)
      }
      await sb.from('aulas_horarios').delete().eq('aula_id', id)
      await sb.from('aulas').delete().eq('id', id)
      toast('✓ Aula excluída')
      document.getElementById('modal-redundancias')?.remove()
      navigate('criar-aulas')
    }

    window.gerarTodasPendentes = async function() {
      const pendentes = aulas.filter(a => a.tipo==='fixa' && a.ativa && !ocsFuturas[a.id])
      if (!pendentes.length) { toast('Nenhuma aula pendente'); return }
      if (!confirm(`Gerar ocorrências para ${pendentes.length} aula(s) sem datas futuras? Período: hoje até 3 anos.`)) return

      const de  = new Date().toISOString().slice(0,10)
      const ate = (() => { const d = new Date(); d.setFullYear(d.getFullYear()+3); return d.toISOString().slice(0,10) })()

      let deEl = document.getElementById('ger-de')
      let ateEl = document.getElementById('ger-ate')
      if (!deEl || !ateEl) {
        deEl  = Object.assign(document.createElement('input'), { id:'ger-de',  type:'date', value: de,  style:'display:none' })
        ateEl = Object.assign(document.createElement('input'), { id:'ger-ate', type:'date', value: ate, style:'display:none' })
        document.body.appendChild(deEl)
        document.body.appendChild(ateEl)
      }
      deEl.value  = de
      ateEl.value = ate

      let totalGerado = 0
      for (const aula of pendentes) {
        window._aulaParaGerar = aula.id
        await executarGerarOcorrencias(true)
        totalGerado++
        toast(`Gerando ${totalGerado}/${pendentes.length}...`)
      }

      document.getElementById('ger-de')?.remove()
      document.getElementById('ger-ate')?.remove()

      toast('✓ ' + totalGerado + ' aulas geradas!')
      navigate('criar-aulas')
    }

    window.toggleAulaStatus = async function(id, ativa) {
      await sb.from('aulas').update({ativa: !ativa}).eq('id', id)
      toast(ativa ? 'Aula pausada' : 'Aula ativada')
      navigate('criar-aulas')
    }
}  
