/**
 * src/pages/aluno/home.js
 */

import '../../acoes/pages-aluno-home.js'   // handlers (antes: eventos inline; ver ferramentas/verifica-handlers.mjs)
import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel, PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS, calcularNivel, NIVEL_LABELS, esc } from '../../modules/utils.js'
import { getSaldoAluno, getGamificacao, getPagamentosAluno, verificarConquistas } from '../../modules/gamificacao.js'
import { carregarNotificacoes, renderPainelNotif, initNotifHandlers,
         calcularBadgesMenu, aplicarBadgesMenu } from '../../modules/notificacoes.js'
import { uiAnimar } from '../../modules/ui.js'
import { verContratoAceito } from '../../modules/contrato.js'
import { iniciarTourSeNecessario } from '../../modules/tour.js'

// Bloco fixo de boas-vindas ao Dharma Phala
function _blocoBoasVindas() {
  return `
    <div style="background:var(--verde);border-radius:12px;padding:20px 22px;margin-bottom:14px">
      <div style="font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:500;color:var(--bege);margin-bottom:10px">
        Bem-vindo ao Dharma Phala — a plataforma do Espaço Autonomia.
      </div>
      <p style="font-size:13px;color:rgba(242,236,206,.85);line-height:1.75;margin:0 0 10px">
        Aqui ensinamos yoga como ele foi concebido: um sistema completo de conhecimento sobre mente, corpo e consciência. Não como exercício. Não como filosofia de autoajuda.
      </p>
      <p style="font-size:13px;color:rgba(242,236,206,.85);line-height:1.75;margin:0 0 10px">
        O Dharma Phala acompanha cada etapa dessa jornada. O Āsana Mārga traz a estrutura completa da aula semanal. O Yoga Adhyayana aprofunda a postura da semana. O Jñāna Mārga publica um estudo literário diário. A Śruti oferece um áudio por dia. O Nāda Mandir é a biblioteca de mantras da tradição.
      </p>
      <p style="font-size:13px;color:rgba(242,236,206,.85);line-height:1.75;margin:0 0 14px">
        Parte desse conteúdo está disponível para qualquer pessoa. O restante acompanha as aulas presenciais — é lá que ele faz sentido.
      </p>
      <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:rgba(242,236,206,.85);line-height:1.6">
        <div>Se é sua primeira vez aqui, comece por <a href="#" id="tour-link-nossa-pratica" data-h-click="pages-aluno-home.1" style="color:var(--dourado);font-weight:500;text-decoration:underline">Nossa Prática</a> antes de acessar a grade de aulas.</div>
        <div>Se você já pratica aqui, comece pelo <a href="#" data-h-click="pages-aluno-home.2" style="color:var(--dourado);font-weight:500;text-decoration:underline">Āsana Mārga</a> da semana.</div>
        <div>Se ainda não é aluno e quer entender o que fazemos antes de se matricular, comece pela <a href="#" data-h-click="pages-aluno-home.3" style="color:var(--dourado);font-weight:500;text-decoration:underline">Sangha</a>.</div>
      </div>
    </div>
  `
}

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
      <div class="topbar-t" id="tour-saudacao">Olá, ${esc(perfil.nome.split(' ')[0])}!</div>
      <div class="row-8">
        <span class="fs-18">${nivelLabel?.split(' ')[0]||'🌱'}</span>
        <span class="t-mut">${gam?.prana_points||0} pts</span>
      </div>
    </div>
    <div class="content">
      ${renderPainelNotif(notifs)}
      ${_blocoBoasVindas()}
      <button data-h-click="pages-aluno-home.9" data-a-click="${esc(JSON.stringify([(Number(cfg.prazo_confirmacao_min || 60))]))}"
        style="width:100%;padding:8px 16px;background:none;border:none;font-family:'DM Sans',sans-serif;
               font-size:12px;color:var(--txt2);cursor:pointer;text-align:left;margin:-6px 0 14px;
               display:flex;align-items:center;gap:5px;text-decoration:underline">
        <i class="ti ti-repeat" aria-hidden="true"></i> Rever tutorial guiado
      </button>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px">
        <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:12px 14px">
          <div class="t-label mb-4">Saldo total</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:var(--titulo)">${saldoTotal}</div>
          <div class="t-mut">aulas acumuladas</div>
        </div>
        <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:12px 14px;border-left:3px solid ${saldoDisponivel>0||ehLivre?'var(--verde)':'var(--err-vivo)'}">
          <div class="t-label mb-4">Disponíveis</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:${saldoDisponivel>0||ehLivre?'var(--titulo)':'var(--err-vivo)'}">${ehLivre?'∞':saldoDisponivel}</div>
          <div class="t-mut">para agendar agora</div>
        </div>
        <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:12px 14px">
          <div class="t-label mb-4">Sequência</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:${(gam?.streak_atual||0)>0?'var(--warn-vivo)':'var(--txt2)'}">${gam?.streak_atual||0}<i class="ti ti-flame" aria-hidden="true"></i></div>
          <div class="t-mut">semanas seguidas</div>
        </div>
        <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:12px 14px">
          <div class="t-label mb-4">Nível</div>
          <div style="font-size:20px;margin-bottom:2px">${nivelLabel}</div>
          <div class="t-mut">${gam?.prana_points||0} pts</div>
        </div>
      </div>
      <div class="card mb-14">
        <div class="t-label mb-8">Últimos 30 dias</div>
        <div style="display:flex;gap:3px;flex-wrap:wrap">
          ${diasCalor.map(d=>`<div title="${d.data}" style="width:18px;height:18px;border-radius:3px;background:${d.presente?'var(--verde)':'var(--neutro-bg)'}"></div>`).join('')}
        </div>
      </div>
      <div class="card-scroll mb-12">
        <div style="padding:12px 18px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
          <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--titulo)">Próximas aulas</span>
          <button data-h-click="pages-aluno-home.10" style="font-size:12px;color:var(--titulo);background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif">Ver grade <i class="ti ti-arrow-right" aria-hidden="true"></i></button>
        </div>
        ${confs.length===0?`<div style="padding:16px 18px;font-size:12px;color:var(--txt2)">Nenhuma aula confirmada. <a href="#" data-h-click="pages-aluno-home.4" class="c-titulo">Ver grade <i class="ti ti-arrow-right" aria-hidden="true"></i></a></div>`:
          confs.map(c=>{
            const dt = new Date(c.ocorrencia.data_hora)
            const prazo = Number(cfg.prazo_cancelamento_min||180)
            const limiteCancel = new Date(dt.getTime()-prazo*60000)
            const podeCancelar = new Date()<limiteCancel
            return `<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 18px;border-bottom:1px solid rgba(212,200,158,.3);gap:12px">
              <div>
                <div class="row-6">${dot(c.ocorrencia.aula?.modalidade)}<strong class="fs-13">${NOMES[c.ocorrencia.aula?.modalidade]||'Aula'}</strong></div>
                <div class="t-mut mt-2">${dt.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})} · ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                <div style="font-size:12px;color:${podeCancelar?'var(--verde-cl)':'var(--err-vivo)'};margin-top:2px">${podeCancelar?'<i class="ti ti-check" aria-hidden="true"></i> Cancelamento disponível':'<i class="ti ti-alert-triangle" aria-hidden="true"></i> Prazo encerrado — falta perde aula do saldo'}</div>
              </div>
              ${podeCancelar?`<button data-h-click="pages-aluno-home.5" data-a-click="${esc(JSON.stringify([String(c.id), String(c.ocorrencia_id)]))}" style="padding:4px 10px;background:var(--err-bg);color:var(--err-fg);border:1px solid var(--err-borda);border-radius:5px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap">Cancelar</button>`:''}
            </div>`
          }).join('')
        }
      </div>
      <button data-h-click="pages-aluno-home.11" style="width:100%;padding:12px 16px;background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--titulo);cursor:pointer;text-align:left;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span><i class="ti ti-trophy" aria-hidden="true"></i> Minhas Conquistas · ${gam?.prana_points||0} pts</span>
        <span class="t-mut">Ver todas <i class="ti ti-arrow-right" aria-hidden="true"></i></span>
      </button>

      <!-- Botão Meu Contrato -->
      <button id="btn-meu-contrato" style="width:100%;padding:12px 16px;background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--titulo);cursor:pointer;text-align:left;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span class="row-8">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:var(--superficie-2);border-radius:50%;font-size:13px"><i class="ti ti-circle-check" aria-hidden="true"></i></span>
          Meu Contrato
        </span>
        <span class="t-mut">Ver <i class="ti ti-arrow-right" aria-hidden="true"></i></span>
      </button>

      ${!window.matchMedia('(display-mode: standalone)').matches && !localStorage.getItem('pwa-instalado') ? `
      <div data-pwa style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;margin-top:4px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div class="row-8">
            <span class="fs-20"><i class="ti ti-download" aria-hidden="true"></i></span>
            <div>
              <div class="fs-13 fw-500 c-titulo">Instalar o app</div>
              <div class="t-mut">Acesse mais rápido direto da tela inicial</div>
            </div>
          </div>
          <button data-h-click="pages-aluno-home.6"
            style="background:none;border:none;color:var(--txt2);font-size:16px;cursor:pointer;padding:4px">×</button>
        </div>
        <div id="pwa-ios-tip" style="display:none;background:rgba(242,236,206,.5);border-radius:6px;padding:10px 12px;font-size:12px;color:var(--txt);line-height:1.6;margin-bottom:8px">
          No <strong>iPhone/iPad</strong>: toque em <strong>Compartilhar</strong> (ícone <i class="ti ti-arrow-up" aria-hidden="true"></i> na barra do Safari) <i class="ti ti-arrow-right" aria-hidden="true"></i> <strong>"Adicionar à Tela de Início"</strong>
        </div>
        <div style="display:flex;gap:8px">
          <button id="btn-instalar-pwa" data-h-click="pages-aluno-home.7"
            style="flex:1;padding:9px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500">Instalar agora</button>
          <button data-h-click="pages-aluno-home.8"
            style="padding:9px 12px;background:var(--superficie);color:var(--titulo);border:1px solid var(--borda);border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer">iPhone/iPad</button>
        </div>
      </div>` : ''}
    </div>
  `

  uiAnimar(container)
  initNotifHandlers(notifs, perfil.id)

  // ── Meu Contrato ─────────────────────────────────────────────
  document.getElementById('btn-meu-contrato').addEventListener('click', () => {
    verContratoAceito(userId, perfil.nome)
  })

  window.cancelarConfHome = async function(confId, ocId) {
    const {data,error} = await sb.rpc('cancelar_confirmacao',{p_aluno_id:userId,p_ocorrencia_id:ocId})
    if (error||!data?.ok){toast('❌ '+(data?.motivo||error?.message));return}
    toast(data.mensagem); navigate('aluno-home')
  }

  window.instalarAppAgora = async function() {
    if (window._deferredPrompt) {
      window._deferredPrompt.prompt()
      const { outcome } = await window._deferredPrompt.userChoice
      if (outcome === 'accepted') { localStorage.setItem('pwa-instalado', '1'); toast('App instalado!') }
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

  // Tour guiado — roda uma única vez por aluno (localStorage cuida disso)
  iniciarTourSeNecessario(perfil, Number(cfg.prazo_confirmacao_min || 60))
}   
