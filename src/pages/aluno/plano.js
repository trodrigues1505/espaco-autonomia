/**
 * src/pages/aluno/plano.js
 * Responsabilidade: Meu plano — detalhes, saldo, vencimento.
 * Depende de: sb, toast, NOMES, dot, badge, card, fmtDt, inputStyle
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderPlano(container) {

    const [matRes, planosRes] = await Promise.all([
      sb.from('matriculas').select('*, plano:planos(*, modalidades:plano_modalidades(modalidade))').eq('aluno_id', window._perfil.id).eq('ativa',true).single(),
      sb.from('planos').select('*, modalidades:plano_modalidades(modalidade)').order('preco_1x'),
    ])
    const mat = matRes.data
    const plano = mat?.plano
    const todos = planosRes.data || []
    const modsDoPLano = mat ? (plano?.modalidades||[]).map(m=>m.modalidade) : []

    const featLabels = {
      sangha:'Sangha — grupo WhatsApp', kala_sadhya:'Kala Sadhya — agenda flex',
      asana_marga:'Asana Marga — app prática', yoga_adhyayana:'Yoga Adhyayana — estudo teórico',
      jnana_marga:'Jnana Marga — estudo literário', sadhana_purna:'Sadhana Purna — avaliação de progresso',
      atma_vijnana:'Atma Vijnana — anamnese personalizada', shruti:'Shruti — áudio diário',
      naada_mandir:'Naada Mandir — biblioteca de mantras'
    }

    const vencimento = mat?.fim ? new Date(mat.fim+'T12:00') : null
    const diasRestantes = vencimento ? Math.ceil((vencimento-new Date())/(1000*60*60*24)) : null

    // Busca pagamentos do aluno
    const { data: pgAluno } = await sb.from('pagamentos').select('*').eq('aluno_id', window._perfil.id).order('vencimento',{ascending:false}).limit(6)
    const pgAtual = (pgAluno||[]).find(p=>p.mes_ref?.slice(0,7)===new Date().toISOString().slice(0,7))
    const pgStatusOk = !pgAluno?.length || pgAtual?.status==='RECEIVED' || pgAtual?.status==='CONFIRMED'

    const pgStatusLabel = {RECEIVED:'Pago ✓',CONFIRMED:'Confirmado ✓',OVERDUE:'Em atraso ⚠',PENDING:'Aguardando pagamento',CANCELLED:'Cancelado',REFUNDED:'Devolvido'}
    const pgStatusColor = {RECEIVED:'#1a5a1a',CONFIRMED:'#1a5a1a',OVERDUE:'#c0392b',PENDING:'#e67e22',CANCELLED:'#5a5a4a',REFUNDED:'#5a5a4a'}

    container.innerHTML = `
      <div class="topbar"><div class="topbar-t">Meu Plano</div></div>
      <div class="content">
        ${!mat?`<div style="text-align:center;padding:40px;font-size:13px;color:var(--txt2)">Nenhuma matrícula ativa. Entre em contato com o Espaço Autonomia.</div>`:`
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden;margin-bottom:16px">
            <div style="padding:18px;background:var(--verde)">
              <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--bege)">Plano ${plano?.nome||mat.plano_tipo}</div>
              <div style="font-size:24px;font-family:'Cormorant Garamond',serif;font-weight:600;color:var(--dourado);margin-top:6px">R$${mat.valor_mensal}<span style="font-size:13px;font-weight:400;opacity:.8">/mês</span></div>
              ${vencimento?`<div style="font-size:12px;color:rgba(242,236,206,.7);margin-top:6px">Vencimento: ${vencimento.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})} ${diasRestantes!==null?'· '+diasRestantes+' dias restantes':''}</div>`:''}
            </div>
            <div style="padding:16px 18px">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);margin-bottom:10px">Benefícios incluídos</div>
              ${Object.entries(featLabels).map(([f,label])=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(212,200,158,.2);font-size:12px;color:${plano?.[f]?'var(--txt)':'#ccc'}${plano?.[f]?'':';text-decoration:line-through'}">
                <span>${plano?.[f]?'✓':'✕'}</span>${label}
              </div>`).join('')}
              <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--borda)">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);margin-bottom:6px">Modalidades</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  ${modsDoPLano.map(m=>`<span style="background:${CORES[m]||'#888'}22;color:${CORES[m]||'#888'};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500">${NOMES[m]||m}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>
          ${mat.plano_tipo !== 'vishnu'?`
            <div style="background:rgba(232,188,79,.08);border:1px solid rgba(232,188,79,.3);border-radius:var(--r);padding:16px 18px;margin-bottom:16px">
              <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:6px">Quer mais?</div>
              <div style="font-size:12px;color:var(--txt2);margin-bottom:12px">Faça upgrade e acesse mais modalidades e benefícios.</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${todos.filter(p=>p.tipo!==mat.plano_tipo&&p.preco_1x>(plano?.preco_1x||0)).map(p=>`
                  <button style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
                    Upgrade para ${p.nome} · R$${p.preco_1x}/mês
                  </button>`).join('')}
              </div>
            </div>
          `:''}
        `}
      </div>
    
        <!-- Histórico de pagamentos do aluno -->
        ${(pgAluno||[]).length?`<div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden;margin-bottom:14px">
          <div style="padding:13px 18px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
            <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde)">Histórico de Pagamentos</span>
            ${pgAtual?`<span style="background:${pgStatusOk?'#e8f4e8':'#fceaea'};color:${pgStatusOk?'#1a5a1a':'#8a1a1a'};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500">${pgStatusLabel[pgAtual?.status]||pgAtual?.status||'—'}</span>`:''}
          </div>
          ${(pgAluno||[]).map(p=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
            <div><div style="font-weight:500">${p.mes_ref?new Date(p.mes_ref+'T12:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'—'}</div>
            <div style="font-size:10px;color:var(--txt2);margin-top:1px">Venc: ${p.vencimento?new Date(p.vencimento+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}):'-'}</div></div>
            <div style="text-align:right"><div style="font-weight:500">R$${(p.valor||0).toFixed(2).replace('.',',')}</div>
            <div style="font-size:10px;color:${pgStatusColor[p.status]||'#888'};margin-top:1px">${pgStatusLabel[p.status]||p.status}</div></div>
          </div>`).join('')}
        </div>`:''}`
  }
