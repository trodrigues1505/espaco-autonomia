/**
 * src/pages/aluno/home.js
 * Home do aluno — saldo + gamificação
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'
import { getSaldoAluno, getGamificacao, getPagamentosAluno, verificarConquistas } from '../../modules/gamificacao.js'

export async function renderAlunoHome(container, page) {
  const sb = window._sb
  const perfil = window._perfil
  const tipo = perfil?.tipo

    const userId = window._perfil.id
    const agora = new Date()

    const [confsRes, matRes, cfgRes, saldoRes, gamRes, pgRes] = await Promise.all([
      sb.from('confirmacoes').select('*, ocorrencia:ocorrencias(id,data_hora,aula:aulas(modalidade))').eq('aluno_id', userId).eq('status','confirmado').order('criado_em',{ascending:false}),
      sb.from('matriculas').select('*, plano:planos(*)').eq('aluno_id', userId).eq('ativa',true).single(),
      sb.from('configuracoes').select('*'),
      sb.from('saldo_disponivel').select('*').eq('aluno_id', userId).single(),
      getGamificacao(userId),
      getPagamentosAluno(userId),
    ])

    const mat = matRes.data
    const cfg = Object.fromEntries((cfgRes.data||[]).map(c=>[c.chave,c.valor]))
    const saldo = saldoRes.data
    const gam = gamRes
    const pagamentos = pgRes
    const confs = (confsRes.data||[]).filter(c=>c.ocorrencia && new Date(c.ocorrencia.data_hora) >= agora).slice(0,5)
    const saldoTotal = mat?.plano_tipo === 'vishnu_livre' ? '∞' : (saldo?.saldo_total ?? 0)
    // Disponíveis para agendar = saldo total - confirmações futuras já feitas
    // Para plano livre (opcao_aulas=99) é ilimitado
    const confsFuturas = (confsRes.data||[]).filter(c => c.ocorrencia && new Date(c.ocorrencia.data_hora) >= agora && c.status === 'confirmado')
    const ehLivre = mat?.plano_tipo === 'vishnu_livre' || mat?.opcao_aulas === 99
    const saldoDisponivel = ehLivre ? Infinity : Math.max(0, (saldo?.saldo_total ?? 0) - confsFuturas.length)
    const nivel = calcularNivel(gam?.prana_points||0)
    const nivelLabel = NIVEL_LABELS[nivel]

    const pgMes = pagamentos.find(p => p.mes_ref?.slice(0,7) === agora.toISOString().slice(0,7))
    const pgOk = !pagamentos.length || pgMes?.status === 'RECEIVED' || pgMes?.status === 'CONFIRMED'

    const historico = gam?.historico_presencas || {}
    const diasCalor = []
    for (let i=29; i>=0; i--) {
      const d = new Date(agora); d.setDate(agora.getDate()-i)
      const k = d.toISOString().slice(0,10)
      diasCalor.push({ data: k, presente: !!historico[k] })
    }

    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-t">Olá, ${window._perfil.nome.split(' ')[0]}!</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">${nivelLabel?.split(' ')[0]||'🌱'}</span>
          <span style="font-size:12px;color:var(--txt2)">${gam?.prana_points||0} pts</span>
        </div>
      </div>
      <div class="content">
        ${!pgOk?`<div style="background:#fceaea;border:1px solid #f5c1c1;border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px"><span style="font-size:20px">⚠️</span><div><div style="font-weight:500;font-size:13px;color:#8a1a1a">Mensalidade em aberto</div><div style="font-size:11px;color:#c0392b;margin-top:2px">Regularize o pagamento para continuar confirmando aulas.</div></div></div>`:''}
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px">
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:12px 14px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Saldo total</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:var(--verde)">${saldoTotal}</div>
            <div style="font-size:10px;color:var(--txt2)">aulas acumuladas</div>
          </div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:12px 14px;border-left:3px solid ${saldoDisponivel>0||ehLivre?'var(--verde)':'#c0392b'}">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Disponíveis</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:${saldoDisponivel>0||ehLivre?'var(--verde)':'#c0392b'}">${ehLivre?'∞':saldoDisponivel}</div>
            <div style="font-size:10px;color:var(--txt2)">para agendar agora</div>
          </div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:12px 14px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Sequência</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:${(gam?.streak_atual||0)>0?'#e67e22':'var(--txt2)'}">${gam?.streak_atual||0}🔥</div>
            <div style="font-size:10px;color:var(--txt2)">semanas seguidas</div>
          </div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:12px 14px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Nível</div>
            <div style="font-size:20px;margin-bottom:2px">${nivelLabel}</div>
            <div style="font-size:10px;color:var(--txt2)">${gam?.prana_points||0} pts</div>
          </div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;margin-bottom:14px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:8px">Últimos 30 dias</div>
          <div style="display:flex;gap:3px;flex-wrap:wrap">
            ${diasCalor.map(d=>`<div title="${d.data}" style="width:18px;height:18px;border-radius:3px;background:${d.presente?'var(--verde)':'#f0ede4'}"></div>`).join('')}
          </div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden;margin-bottom:12px">
          <div style="padding:12px 18px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
            <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde)">Próximas aulas</span>
            <button onclick="navigate('aluno-grade')" style="font-size:11px;color:var(--verde);background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif">Ver grade →</button>
          </div>
          ${confs.length===0?`<div style="padding:16px 18px;font-size:12px;color:var(--txt2)">Nenhuma aula confirmada. <a href="#" onclick="navigate('aluno-grade');return false" style="color:var(--verde)">Ver grade →</a></div>`:
            confs.map(c=>{
              const dt = new Date(c.ocorrencia.data_hora)
              const prazo = Number(cfg.prazo_cancelamento_min||180)
              const limiteCancel = new Date(dt.getTime()-prazo*60000)
              const podeCancelar = new Date()<limiteCancel
              return `<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 18px;border-bottom:1px solid rgba(212,200,158,.3);gap:12px">
                <div>
                  <div style="display:flex;align-items:center;gap:6px">${dot(c.ocorrencia.aula?.modalidade)}<strong style="font-size:13px">${NOMES[c.ocorrencia.aula?.modalidade]||'Aula'}</strong></div>
                  <div style="font-size:11px;color:var(--txt2);margin-top:2px">${dt.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})} · ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                  <div style="font-size:10px;color:${podeCancelar?'var(--verde-cl)':'#c0392b'};margin-top:2px">${podeCancelar?'✓ Cancelamento disponível':'⚠ Prazo encerrado — falta perde aula do saldo'}</div>
                </div>
                ${podeCancelar?`<button onclick="cancelarConfHome('${c.id}','${c.ocorrencia_id}')" style="padding:4px 10px;background:#fceaea;color:#8a1a1a;border:1px solid #f5c1c1;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap">Cancelar</button>`:''}
              </div>`
            }).join('')
          }
        </div>
        <button onclick="navigate('aluno-conquistas')" style="width:100%;padding:12px 16px;background:#fff;border:1px solid var(--borda);border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--verde);cursor:pointer;text-align:left;display:flex;align-items:center;justify-content:space-between">
          <span>🏆 Minhas Conquistas · ${gam?.prana_points||0} pts</span>
          <span style="font-size:11px;color:var(--txt2)">Ver todas →</span>
        </button>
      </div>
    `
    window.cancelarConfHome = async function(confId, ocId) {
      const {data,error} = await sb.rpc('cancelar_confirmacao',{p_aluno_id:userId,p_ocorrencia_id:ocId})
      if (error||!data?.ok){toast('❌ '+(data?.motivo||error?.message));return}
      toast(data.mensagem); navigate('aluno-home')
    }
}
