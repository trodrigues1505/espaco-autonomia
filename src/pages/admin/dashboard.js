/**
 * src/pages/admin/dashboard.js
 * Responsabilidade: Dashboard do admin — stats do dia, aulas, feriados.
 * Depende de: sb, toast, NOMES, dot, badge, card, fmtDt, inputStyle
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderDashboard(container) {
  const tipo = window._perfil?.tipo
  const sb = window._sb

    if (page === 'dashboard' && tipo === 'admin') {
    const hoje = new Date()
    const inicioHoje = new Date(hoje); inicioHoje.setHours(0,0,0,0)
    const fimHoje = new Date(hoje); fimHoje.setHours(23,59,59,999)

    const [ocorrencias, alunos, feriados, config] = await Promise.all([
      sb.from('ocorrencias_vagas').select('*').gte('data_hora', inicioHoje.toISOString()).lte('data_hora', fimHoje.toISOString()).eq('cancelada', false).order('data_hora'),
      sb.from('alunos_plano_ativo').select('plano_tipo').then(r => r.data || []),
      (() => { const ate = new Date(); ate.setDate(ate.getDate()+30); return sb.from('feriados').select('*').gte('data', hoje.toISOString().slice(0,10)).lte('data', ate.toISOString().slice(0,10)).order('data') })().then(r => r.data || []),
      sb.from('configuracoes').select('*').then(r => Object.fromEntries((r.data||[]).map(c=>[c.chave,c.valor]))),
    ])

    const aulasHoje = ocorrencias.data || []
    const totalConf = aulasHoje.reduce((s,a)=>s+(a.confirmados||0),0)
    const totalLivres = aulasHoje.reduce((s,a)=>s+(a.vagas_livres||0),0)
    const por = { brahma:0, shiva_1x:0, shiva_2x:0, vishnu_2x:0, vishnu_livre:0 }
    alunos.forEach(a => { if(por[a.plano_tipo]!==undefined) por[a.plano_tipo]++ })

    container.innerHTML = `
      <div class="topbar"><div class="topbar-t">Dashboard</div><div style="font-size:11px;color:var(--txt2)">${hoje.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</div></div>
      <div class="content">
        ${feriados.length ? `<div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);border-radius:6px;padding:9px 13px;display:flex;align-items:center;gap:8px;font-size:12px;color:#7a5a10;margin-bottom:14px"><i class="ti ti-alert-triangle" style="color:var(--dourado)"></i><span><strong>Atenção:</strong> Há feriados nos próximos 30 dias: ${feriados.slice(0,3).map(f=>`${f.nome} (${new Date(f.data+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})})`).join(' · ')}</span></div>` : ''}
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px">
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:5px">Aulas hoje</div><div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--verde)">${aulasHoje.length}</div></div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:5px">Alunos ativos</div><div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--verde)">${alunos.length}</div></div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:5px">Confirmações</div><div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--verde)">${totalConf}</div></div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:5px">Vagas livres</div><div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--verde)">${totalLivres}</div></div>
        </div>
        <div style="display:grid;grid-template-columns:3fr 2fr;gap:16px">
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden">
            <div style="padding:13px 18px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between"><span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde)">Aulas de hoje</span></div>
            ${aulasHoje.length === 0 ? '<div style="padding:20px 18px;font-size:12px;color:var(--txt2)">Nenhuma aula hoje.</div>' :
              aulasHoje.map(a => {
                const cor = {hatha:'#2d7a2d',acro:'var(--dourado)',raja:'#5a2d8a'}[a.modalidade]||'#888'
                const nomes = {hatha:'Hatha Yoga',acro:'Acro Yoga',raja:'Raja Yoga'}
                const hora = new Date(a.data_hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
                const pct = a.vagas_total ? Math.round(a.confirmados/a.vagas_total*100) : 0
                const corBadge = pct>80?'#e8f4e8':'rgba(232,188,79,.15)'
                const corTxtBadge = pct>80?'#1a5a1a':'#7a5a10'
                return `<div style="display:grid;grid-template-columns:60px 1fr 90px 70px;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.35);font-size:12px">
                  <span style="color:var(--txt2);font-size:11px">${hora}</span>
                  <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${cor};flex-shrink:0"></span><strong>${nomes[a.modalidade]}</strong>${a.eh_feriado?`<span style="background:rgba(232,188,79,.2);color:#7a5a10;font-size:10px;padding:1px 6px;border-radius:10px">⚠ ${a.nome_feriado}</span>`:''}</span>
                  <span style="font-size:11px;color:var(--txt2)">${a.confirmados||0}/${a.vagas_total} conf.</span>
                  <button onclick="navigate('presencas')" style="padding:4px 8px;background:transparent;border:1px solid var(--borda);border-radius:5px;font-size:11px;cursor:pointer;color:var(--txt2)">Ver</button>
                </div>`
              }).join('')
            }
          </div>
          <div>
            <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;margin-bottom:14px">
              <div style="font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:500;color:var(--verde);margin-bottom:12px">Alunos por plano</div>
              ${[
                {k:'brahma',l:'Brahma',c:'var(--bege2)'},
                {k:'shiva_1x',l:'Shiva 1x',c:'#7ab87a'},
                {k:'shiva_2x',l:'Shiva 2x',c:'var(--verde-cl)'},
                {k:'vishnu_2x',l:'Vishnu 2x',c:'var(--dourado)'},
                {k:'vishnu_livre',l:'Vishnu Livre',c:'#d4a838'},
              ].map(({k,l,c})=>{const n=por[k]||0;const pct2=alunos.length?Math.round(n/alunos.length*100):0;return `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="font-weight:500">${l}</span><span style="color:var(--txt2)">${n} alunos</span></div><div style="height:6px;background:#f0ede4;border-radius:4px"><div style="height:6px;background:${c};border-radius:4px;width:${pct2}%"></div></div></div>`}).join('')}
            </div>
            <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
              <div style="font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:500;color:var(--verde);margin-bottom:10px">Próximos feriados</div>
              ${feriados.length===0?'<div style="font-size:12px;color:var(--txt2)">Nenhum nos próximos 30 dias</div>':
                feriados.slice(0,4).map(f=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(212,200,158,.25);font-size:12px"><span>${f.nome}</span><span style="font-size:11px;color:var(--txt2)">${new Date(f.data+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span></div>`).join('')
              }
            </div>
          </div>
        </div>
      </div>
    `
    return
  }

}