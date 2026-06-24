/**
 * src/pages/aluno/home.js
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'
import { getSaldoAluno, getGamificacao, getPagamentosAluno, verificarConquistas } from '../../modules/gamificacao.js'
import { carregarNotificacoes, renderPainelNotif, initNotifHandlers,
         calcularBadgesMenu, aplicarBadgesMenu } from '../../modules/notificacoes.js'
import { uiAnimar } from '../../modules/ui.js'

export async function renderAlunoHome(container, page) {
  const sb = window._sb
  const perfil = window._perfil

  const userId = perfil.id
  const agora = new Date()

  const [confsRes, matRes, cfgRes, saldoRes, gamRes, pgRes, notifs] = await Promise.all([
    sb.from('confirmacoes').select('*, ocorrencia:ocorrencias(id,data_hora,aula:aulas(modalidade))').eq('aluno_id', userId).eq('status','confirmado').order('criado_em',{ascending:false}),
    sb.from('matriculas').select('*, plano:planos(*)').eq('aluno_id', userId).eq('ativa',true).single(),
    sb.from('configuracoes').select('*'),
    sb.from('saldo_disponivel').select('*').eq('aluno_id', userId).single(),
    getGamificacao(userId),
    getPagamentosAluno(userId),
    carregarNotificacoes(perfil),
  ])

  const mat = matRes.data
  const cfg = Object.fromEntries((cfgRes.data||[]).map(c=>[c.chave,c.valor]))
  const saldo = saldoRes.data
  const gam = gamRes
  const pagamentos = pgRes
  const confs = (confsRes.data||[]).filter(c=>c.ocorrencia && new Date(c.ocorrencia.data_hora) >= agora).slice(0,5)
  const saldoTotal = mat?.plano_tipo === 'vishnu_livre' ? '∞' : (saldo?.saldo_total ?? 0)
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

  // Badges no menu
  const badges = calcularBadgesMenu(notifs)
  aplicarBadgesMenu(badges)

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Olá, ${perfil.nome.split(' ')[0]}!</div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:18px">${nivelLabel?.split(' ')[0]||'🌱'}</span>
        <span style="font-size:12px;color:var(--txt2)">${gam?.prana_points||0} pts</span>
      </div>
    </div>
    <div class="content">
      ${renderPainelNotif(notifs)}
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
      ${!window.matchMedia('(display-mode: standalone)').matches && !localStorage.getItem('pwa-instalado') ? `
      <div data-pwa style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;margin-top:4px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:20px">📲</span>
            <div>
              <div style="font-size:13px;font-weight:500;color:var(--verde)">Instalar o app</div>
              <div style="font-size:11px;color:var(--txt2)">Acesse mais rápido direto da tela inicial</div>
            </div>
          </div>
          <button onclick="this.closest('[data-pwa]').style.display='none';localStorage.setItem('pwa-instalado','1')"
            style="background:none;border:none;color:var(--txt2);font-size:16px;cursor:pointer;padding:4px">×</button>
        </div>
        <div id="pwa-ios-tip" style="display:none;background:rgba(242,236,206,.5);border-radius:6px;padding:10px 12px;font-size:12px;color:var(--txt);line-height:1.6;margin-bottom:8px">
          No <strong>iPhone/iPad</strong>: toque em <strong>Compartilhar</strong> (ícone ↑ na barra do Safari) → <strong>"Adicionar à Tela de Início"</strong>
        </div>
        <div style="display:flex;gap:8px">
          <button id="btn-instalar-pwa" onclick="instalarAppAgora()"
            style="flex:1;padding:9px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500">Instalar agora</button>
          <button onclick="mostrarDicaIOS()"
            style="padding:9px 12px;background:#fff;color:var(--verde);border:1px solid var(--borda);border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer">iPhone/iPad</button>
        </div>
      </div>` : ''}
    </div>
  `
uiAnimar(container)
  initNotifHandlers(notifs, perfil.id)

  window.cancelarConfHome = async function(confId, ocId) {
    const {data,error} = await sb.rpc('cancelar_confirmacao',{p_aluno_id:userId,p_ocorrencia_id:ocId})
    if (error||!data?.ok){toast('❌ '+(data?.motivo||error?.message));return}
    toast(data.mensagem); navigate('aluno-home')
  }

  window.instalarAppAgora = async function() {
    if (window._deferredPrompt) {
      window._deferredPrompt.prompt()
      const { outcome } = await window._deferredPrompt.userChoice
      if (outcome === 'accepted') { localStorage.setItem('pwa-instalado', '1'); toast('✓ App instalado!') }
      window._deferredPrompt = null
    } else {
      document.getElementById('pwa-ios-tip').style.display = 'block'
      document.getElementById('btn-instalar-pwa').textContent = 'Siga as instruções acima'
      document.getElementById('btn-instalar-pwa').style.background = 'var(--borda)'
      document.getElementById('btn-instalar-pwa').style.color = 'var(--txt2)'
    }
  }

  window.mostrarDicaIOS = function() {
    const tip = document.getElementById('pwa-ios-tip')
    if (tip) tip.style.display = tip.style.display === 'none' ? 'block' : 'none'
  }
}   
