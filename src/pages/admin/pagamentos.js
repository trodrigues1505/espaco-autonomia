/**
 * src/pages/admin/pagamentos.js
 * Responsabilidade: Painel de pagamentos — status e inadimplência.
 * Depende de: sb, toast, NOMES, dot, badge, card, fmtDt, inputStyle
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderPagamentos(container) {

    const [pgRes] = await Promise.all([
      sb.from('pagamentos').select('*, aluno:perfis!aluno_id(nome,email)').order('vencimento', {ascending:false}).limit(100),
    ])
    const pgs = pgRes.data || []
    const recebidos = pgs.filter(p=>p.status==='RECEIVED'||p.status==='CONFIRMED')
    const vencidos = pgs.filter(p=>p.status==='OVERDUE')
    const pendentes = pgs.filter(p=>p.status==='PENDING')
    const totalRecebido = recebidos.reduce((s,p)=>s+(p.valor||0),0)
    const totalVencido = vencidos.reduce((s,p)=>s+(p.valor||0),0)
    const total = pgs.length

    const statusLabel = {RECEIVED:'Recebido',CONFIRMED:'Confirmado',OVERDUE:'Vencido',PENDING:'Pendente',CANCELLED:'Cancelado',REFUNDED:'Devolvido'}
    const statusBg = {RECEIVED:'#e8f4e8',CONFIRMED:'#e8f4e8',OVERDUE:'#fceaea',PENDING:'rgba(232,188,79,.15)',CANCELLED:'#f0ede4',REFUNDED:'#f0ede4'}
    const statusColor = {RECEIVED:'#1a5a1a',CONFIRMED:'#1a5a1a',OVERDUE:'#8a1a1a',PENDING:'#7a5a10',CANCELLED:'#5a5a4a',REFUNDED:'#5a5a4a'}

    container.innerHTML = `
      <div class="topbar"><div class="topbar-t">Pagamentos</div></div>
      <div class="content">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Total recebido</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:#1a5a1a">R$${totalRecebido.toFixed(2).replace('.',',')}</div>
            <div style="font-size:10px;color:var(--txt2);margin-top:2px">${recebidos.length} pagamentos</div>
          </div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Em atraso</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:#c0392b">R$${totalVencido.toFixed(2).replace('.',',')}</div>
            <div style="font-size:10px;color:var(--txt2);margin-top:2px">${vencidos.length} cobranças</div>
          </div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Pendentes</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:#e67e22">${pendentes.length}</div>
            <div style="font-size:10px;color:var(--txt2);margin-top:2px">aguardando</div>
          </div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Inadimplência</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:${vencidos.length>0?'#c0392b':'#1a5a1a'}">${total>0?Math.round(vencidos.length/total*100):0}%</div>
            <div style="font-size:10px;color:var(--txt2);margin-top:2px">do total</div>
          </div>
        </div>
        ${vencidos.length>0?`<div style="background:#fceaea;border:1px solid #f5c1c1;border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px"><span style="font-size:20px">⚠️</span><div><div style="font-weight:500;font-size:13px;color:#8a1a1a">${vencidos.length} aluno(s) em atraso</div><div style="font-size:11px;color:#c0392b;margin-top:2px">${vencidos.map(p=>p.aluno?.nome||'-').join(', ')}</div></div></div>`:''}
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden">
          <div style="display:grid;grid-template-columns:1fr 100px 80px 90px 70px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
            <span>Aluno</span><span>Vencimento</span><span>Valor</span><span>Status</span><span>Mês</span>
          </div>
          ${pgs.length===0?'<div style="padding:20px 18px;font-size:12px;color:var(--txt2)">Nenhum pagamento ainda. Configure o webhook do Asaas para sincronizar automaticamente.</div>':
            pgs.map(p=>`<div style="display:grid;grid-template-columns:1fr 100px 80px 90px 70px;align-items:center;gap:10px;padding:9px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
              <div><div style="font-weight:500">${p.aluno?.nome||p.asaas_customer||'—'}</div><div style="font-size:10px;color:var(--txt2)">${p.aluno?.email||''}</div></div>
              <span style="font-size:11px">${p.vencimento?new Date(p.vencimento+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}):'-'}</span>
              <span style="font-weight:500">R$${(p.valor||0).toFixed(2).replace('.',',')}</span>
              <span style="background:${statusBg[p.status]||'#f0ede4'};color:${statusColor[p.status]||'#5a5a4a'};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500">${statusLabel[p.status]||p.status}</span>
              <span style="font-size:10px;color:var(--txt2)">${p.mes_ref?p.mes_ref.slice(0,7):'-'}</span>
            </div>`).join('')
          }
        </div>
      </div>
    `
}
