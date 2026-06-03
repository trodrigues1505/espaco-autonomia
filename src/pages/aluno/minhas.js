/**
 * src/pages/aluno/minhas.js
 * Minhas aulas confirmadas
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderAlunoMinhas(container, page) {
  const sb = window._sb
  const perfil = window._perfil
  const tipo = perfil?.tipo

    const userId = window._perfil.id
    const agora = new Date()
    const em7d = new Date(); em7d.setDate(agora.getDate()+7)

    const { data: confs } = await sb.from('confirmacoes')
      .select('*, ocorrencia:ocorrencias(id, data_hora, aula:aulas(modalidade, professor:perfis!professor_id(nome)))')
      .eq('aluno_id', userId)
      .in('status',['confirmado','presente','ausente'])
      .order('criado_em', {ascending:false})

    const { data: cfg } = await sb.from('configuracoes').select('valor').eq('chave','prazo_cancelamento_min').single()
    const prazoCancel = Number(cfg?.valor||180)

    const futuras = (confs||[]).filter(c => c.ocorrencia && new Date(c.ocorrencia.data_hora) >= agora)
    const passadas = (confs||[]).filter(c => c.ocorrencia && new Date(c.ocorrencia.data_hora) < agora)

    function aulaCard(c, isPast) {
      const oc = c.ocorrencia
      if (!oc) return ''
      const dt = new Date(oc.data_hora)
      const cor = CORES[oc.aula?.modalidade]||'#888'
      const nome = NOMES[oc.aula?.modalidade]||'Aula'
      const limiteCancel = new Date(dt.getTime() - prazoCancel*60000)
      const podeCancelar = !isPast && new Date() < limiteCancel
      const statusBg = {confirmado:'#e8f4e8',presente:'#e8f4e8',ausente:'#fceaea'}
      const statusColor = {confirmado:'#1a5a1a',presente:'#1a5a1a',ausente:'#8a1a1a'}
      return `<div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div>
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
            ${dot(oc.aula?.modalidade)}<strong style="font-size:13px">${nome}</strong>
            <span style="background:${statusBg[c.status]||'#f0ede4'};color:${statusColor[c.status]||'#5a5a4a'};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500">${c.status==='confirmado'?'Confirmado':c.status==='presente'?'Presente':'Ausente'}</span>
          </div>
          <div style="font-size:11px;color:var(--txt2)">${dt.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})} · ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
          <div style="font-size:10px;color:var(--txt2);margin-top:2px">${oc.aula?.professor?.nome||''}</div>
          ${podeCancelar?`<div style="font-size:10px;color:var(--verde-cl);margin-top:3px">Cancelamento disponível até ${limiteCancel.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>`:''}
        </div>
        ${podeCancelar?`<button onclick="cancelarMinhaConf('${c.id}','${oc.id}')" style="padding:5px 11px;background:#fceaea;color:#8a1a1a;border:1px solid #f5c1c1;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap">Cancelar</button>`:''}
      </div>`
    }

    container.innerHTML = `
      <div class="topbar"><div class="topbar-t">Minhas Aulas</div><span style="background:#e8f4e8;color:#1a5a1a;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:500">${futuras.length} confirmadas</span></div>
      <div class="content">
        ${futuras.length===0&&passadas.length===0?`<div style="text-align:center;padding:40px;font-size:13px;color:var(--txt2)">Nenhuma aula confirmada ainda. <a href="#" onclick="navigate('aluno-grade');return false" style="color:var(--verde)">Ver grade →</a></div>`:''}
        ${futuras.length>0?`
          <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:500;color:var(--verde);margin-bottom:10px">Próximas aulas</div>
          ${futuras.map(c=>aulaCard(c,false)).join('')}
        `:''}
        ${passadas.length>0?`
          <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:500;color:var(--verde);margin:16px 0 10px">Histórico</div>
          ${passadas.slice(0,10).map(c=>aulaCard(c,true)).join('')}
        `:''}
      </div>
    `
    window.cancelarMinhaConf = async function(confId, ocId) {
      const { data, error } = await sb.rpc('cancelar_confirmacao', { p_aluno_id: window._perfil.id, p_ocorrencia_id: ocId })
      if (error || !data?.ok) { toast('❌ '+(data?.motivo||error?.message)); return }
      toast('✓ Confirmação cancelada')
      navigate('aluno-minhas')
    }
}
