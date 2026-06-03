/**
 * src/pages/admin/criar_aulas.js
 * Responsabilidade: Criar aulas fixas e avulsas, grade semanal.
 * Depende de: sb, toast, NOMES, dot, badge, card, fmtDt, inputStyle
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderCriaraulas(container) {

    const [aulasRes, profsRes, cfgRes] = await Promise.all([
      sb.from('aulas').select('*, professor:perfis!professor_id(nome), horarios:aulas_horarios(*)').order('criado_em', {ascending:false}),
      sb.from('perfis').select('id,nome').in('tipo',['admin','professor']).order('nome'),
      sb.from('configuracoes').select('*'),
    ])
    const aulas = aulasRes.data || []
    const profs = profsRes.data || []
    const cfg = Object.fromEntries((cfgRes.data||[]).map(c=>[c.chave,c.valor]))
    const fixas = aulas.filter(a=>a.tipo==='fixa')
    const avulsas = aulas.filter(a=>a.tipo==='avulsa')

    function renderAulaRow(a) {
      const diasStr = (a.horarios||[]).map(h=>`${DIAS_LABEL[h.dia_semana]||h.dia_semana} ${h.hora_inicio.slice(0,5)}`).join(', ')
      const statusBadge = a.ativa
        ? badge('Ativa','#e8f4e8','#1a5a1a')
        : badge('Inativa','#fceaea','#8a1a1a')
      return `<div style="display:grid;grid-template-columns:1fr 110px 90px 60px 80px 70px;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
        <span style="display:flex;align-items:center;gap:6px">${dot(a.modalidade)}<strong>${NOMES[a.modalidade]}</strong><span style="font-size:10px;color:var(--txt2)">${diasStr}</span></span>
        <span style="font-size:11px;color:var(--txt2)">${a.professor?.nome||'—'}</span>
        <span style="font-size:11px">${a.vagas} vagas</span>
        <span>${statusBadge}</span>
        <button onclick="gerarOcorrenciasAula('${a.id}')" style="padding:3px 8px;background:rgba(31,56,31,.08);color:var(--verde);border:1px solid rgba(31,56,31,.2);border-radius:4px;font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif">Gerar</button>
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
        <button onclick="document.getElementById('modal-criar-aula').style.display='flex'" style="padding:6px 13px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px"><i class="ti ti-plus"></i> Nova Aula</button>
      </div>
      <div class="content">
        <div style="background:rgba(31,56,31,.04);border:1px solid rgba(31,56,31,.12);border-radius:6px;padding:9px 13px;font-size:12px;color:var(--verde);margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <i class="ti ti-info-circle"></i>
          <span>Após criar uma aula fixa, clique em <strong>Gerar</strong> para criar as datas do semestre no banco.</span>
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
      // Verifica feriado para avulsa
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

        // Cria uma aula para cada combinação dia+hora
        for (const hora of horas) {
          const { data: novaAula, error: errAula } = await sb.from('aulas').insert({
            modalidade: mod, tipo, vagas: Number(vagas), duracao_min: Number(dur),
            professor_id: prof||null, criado_por: window._perfil.id
          }).select().single()
          if (errAula) { toast('Erro: '+errAula.message); return }
          const horarios = dias.map(d => ({ aula_id: novaAula.id, dia_semana: d, hora_inicio: hora+':00' }))
          const { error: errH } = await sb.from('aulas_horarios').insert(horarios)
          if (errH) { toast('Erro horários: '+errH.message); return }
        }
        document.getElementById('modal-criar-aula').style.display = 'none'
        toast('✓ Aulas criadas! Clique em "Gerar" para criar as datas.')
        navigate('criar-aulas')
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
      const em90 = new Date(); em90.setDate(em90.getDate()+90)
      document.getElementById('ger-de').value = hoje
      document.getElementById('ger-ate').value = em90.toISOString().slice(0,10)
      document.getElementById('modal-gerar').style.display = 'flex'
    }

    window.executarGerarOcorrencias = async function() {
      const de = document.getElementById('ger-de').value
      const ate = document.getElementById('ger-ate').value
      if (!de||!ate) { toast('Preencha as datas'); return }

      const btnGerar = document.querySelector('#modal-gerar button[onclick="executarGerarOcorrencias()"]')
      if (btnGerar) { btnGerar.textContent = 'Gerando...'; btnGerar.disabled = true }

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
              // Usa horário local BR (UTC-3)
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

        // Insere em lotes de 50
        let inseridos = 0
        for (let i=0; i<ocorrencias.length; i+=50) {
          const lote = ocorrencias.slice(i, i+50)
          const { error } = await sb.from('ocorrencias').upsert(lote, {onConflict:'aula_id,data_hora', ignoreDuplicates:true})
          if (error) { toast('Erro ao inserir: '+error.message); return }
          inseridos += lote.length
        }

        document.getElementById('modal-gerar').style.display = 'none'
        toast('✓ '+inseridos+' aulas geradas com sucesso!')
        navigate('criar-aulas')
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
      // Remove ocorrências futuras e suas confirmações
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

    window.toggleAulaStatus = async function(id, ativa) {
      await sb.from('aulas').update({ativa: !ativa}).eq('id', id)
      toast(ativa ? 'Aula pausada' : 'Aula ativada')
      navigate('criar-aulas')
    }
  }
