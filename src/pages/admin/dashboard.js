/**
 * src/pages/admin/dashboard.js
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel, PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS, calcularNivel, NIVEL_LABELS, esc } from '../../modules/utils.js'
import { carregarNotificacoes, renderPainelNotif, initNotifHandlers,
         calcularBadgesMenu, aplicarBadgesMenu } from '../../modules/notificacoes.js'
import { uiAnimar } from '../../modules/ui.js'   // ← linha 1: import
import { abrirDialogo } from '../../modules/dialogs.js'

// ── Resumo do dia: aulas de hoje com a turma ─────────────────────
const NOME_MOD = { hatha: 'Hatha Yoga', acro: 'Acro Yoga', raja: 'Raja Yoga' }
const COR_MOD  = { hatha: '#2d7a2d', acro: '#c9a227', raja: '#5a2d8a' }
const ROTULO_STATUS = { confirmado: 'Confirmado', presente: 'Presente', ausente: 'Ausente', pendente: 'Pendente' }
const MAX_CHIPS = 6

const partesNome = nome => String(nome || '').trim().split(/\s+/).filter(Boolean)
function nomeCurto(nome) {
  const p = partesNome(nome)
  if (!p.length) return 'Aluno removido'
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0].toUpperCase()}.` : p[0]
}
function iniciais(nome) {
  const p = partesNome(nome)
  if (!p.length) return '?'
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
}
const horaSP = iso => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

function htmlAula(a, turma) {
  const cor = COR_MOD[a.modalidade] || '#888'
  const conf = Number(a.confirmados || 0), vagas = Number(a.vagas_total || 0)
  const livres = a.vagas_livres != null ? Number(a.vagas_livres) : Math.max(0, vagas - conf)
  const pct = vagas ? Math.min(100, Math.round((conf / vagas) * 100)) : 0
  const chips = turma.slice(0, MAX_CHIPS).map(c => `
      <span class="dash-chip"><span class="dash-chip__av" aria-hidden="true">${esc(iniciais(c.aluno?.nome))}</span>${esc(nomeCurto(c.aluno?.nome))}</span>`).join('')
  const mais = turma.length > MAX_CHIPS
    ? `<button type="button" class="dash-chip" data-turma="${esc(a.id)}" aria-label="Ver os outros ${turma.length - MAX_CHIPS} inscritos">+${turma.length - MAX_CHIPS}</button>` : ''
  return `
    <article class="dash-aula" style="--c:${cor}">
      <div class="dash-aula__hora"><strong>${horaSP(a.data_hora)}</strong>${a.eh_feriado ? '<span class="ui-badge ui-badge--pendente">Feriado</span>' : ''}</div>
      <div>
        <div class="dash-aula__nome"><span class="dash-dot" aria-hidden="true"></span>${esc(NOME_MOD[a.modalidade] || a.modalidade)}</div>
        <div class="dash-aula__meta">${a.professor_nome ? esc(a.professor_nome) + ' · ' : ''}${conf} de ${vagas} vagas · ${livres} livre(s)</div>
        <div class="dash-meter" role="img" aria-label="${conf} de ${vagas} vagas ocupadas"><span style="width:${pct}%"></span></div>
        <div class="dash-roster">${turma.length ? chips + mais : '<span class="dash-roster__vazio">Ninguém inscrito ainda</span>'}</div>
      </div>
      <div class="dash-aula__acoes">
        <button type="button" class="ui-btn ui-btn--primary ui-btn--sm" data-chamada="${esc(a.id)}"><i class="ti ti-clipboard-check" aria-hidden="true"></i><span>Chamada</span></button>
        <button type="button" class="ui-btn ui-btn--secondary ui-btn--sm" data-turma="${esc(a.id)}"><i class="ti ti-users" aria-hidden="true"></i><span>Ver turma</span></button>
      </div>
    </article>`
}

function htmlAulasHoje(aulas, porAula) {
  const total = aulas.reduce((s, a) => s + (porAula.get(a.id)?.length || 0), 0)
  const cab = `
    <div class="dash-hoje__head">
      <div>
        <h3 class="dash-hoje__title">Aulas de hoje</h3>
        <div class="dash-hoje__sub">${aulas.length ? `${aulas.length} aula(s) · ${total} inscrito(s)` : 'Nenhuma aula hoje'}</div>
      </div>
      <button type="button" class="ui-btn ui-btn--secondary ui-btn--sm" data-abrir-agenda>
        <i class="ti ti-calendar-week" aria-hidden="true"></i><span>Agenda da semana</span></button>
    </div>`
  if (!aulas.length) {
    return `<section class="dash-hoje" aria-label="Aulas de hoje">${cab}
      <div class="ui-empty dash-vazio"><i class="ti ti-calendar-off" aria-hidden="true"></i>
        <span>Nenhuma aula hoje. Abra a agenda da semana para ver ou mover as próximas.</span></div></section>`
  }
  return `<section class="dash-hoje" aria-label="Aulas de hoje">${cab}${aulas.map(a => htmlAula(a, porAula.get(a.id) || [])).join('')}</section>`
}

function abrirTurma(aula, turma) {
  const nome = NOME_MOD[aula.modalidade] || aula.modalidade
  const lista = turma.length
    ? `<ul class="dash-turma">${turma.map(c => `
        <li class="dash-turma__item">
          <span class="dash-av" style="--c:${COR_MOD[aula.modalidade] || '#888'}" aria-hidden="true">${esc(iniciais(c.aluno?.nome))}</span>
          <span class="dash-turma__nome">${esc(c.aluno?.nome || 'Aluno removido')}</span>
          <span class="ui-badge ui-badge--${esc(c.status)}">${esc(ROTULO_STATUS[c.status] || c.status)}</span>
        </li>`).join('')}</ul>`
    : '<div class="ui-empty"><i class="ti ti-users-minus" aria-hidden="true"></i><span>Ninguém inscrito nesta aula.</span></div>'
  const d = abrirDialogo({
    titulo: `${nome} · ${horaSP(aula.data_hora)}`,
    corpoHTML: `<p class="ui-help" style="margin-bottom:10px">${turma.length} inscrito(s) · ${Number(aula.vagas_total || 0)} vagas</p>${lista}`,
    rodapeHTML: `<button type="button" class="ui-btn ui-btn--ghost" data-fechar-turma>Fechar</button>
                 <button type="button" class="ui-btn ui-btn--primary" data-ir-chamada><i class="ti ti-clipboard-check" aria-hidden="true"></i><span>Fazer chamada</span></button>`,
  })
  d.root.querySelector('[data-fechar-turma]').addEventListener('click', d.fechar)
  d.root.querySelector('[data-ir-chamada]').addEventListener('click', () => { d.fechar(); irParaChamada(aula.id) })
}

function irParaChamada(ocId) {
  window._ocPresencaId = ocId
  window._presencaData = null
  window.navigate('presencas')
}

export async function renderDashboard(container, page) {
  const sb = window._sb
  const perfil = window._perfil

  const hoje = new Date()
  const inicioHoje = new Date(hoje); inicioHoje.setHours(0,0,0,0)
  const fimHoje = new Date(hoje); fimHoje.setHours(23,59,59,999)

  const [ocorrencias, alunos, feriados, notifs] = await Promise.all([
    sb.from('ocorrencias_vagas').select('*')
      .gte('data_hora', inicioHoje.toISOString()).lte('data_hora', fimHoje.toISOString())
      .eq('cancelada', false).order('data_hora'),
    sb.from('alunos_plano_ativo').select('plano_tipo').then(r => r.data || []),
    (() => {
      const ate = new Date(); ate.setDate(ate.getDate()+30)
      return sb.from('feriados').select('*')
        .gte('data', hoje.toISOString().slice(0,10))
        .lte('data', ate.toISOString().slice(0,10)).order('data')
    })().then(r => r.data || []),
    carregarNotificacoes(perfil),
  ])

  const aulasHoje = ocorrencias.data || []

  // Inscritos de cada aula de hoje (mesma consulta da tela de chamada: tudo que não foi cancelado)
  const porAula = new Map()
  if (aulasHoje.length) {
    const { data: inscritos } = await sb.from('confirmacoes')
      .select('ocorrencia_id, status, aluno:perfis!aluno_id(id,nome)')
      .in('ocorrencia_id', aulasHoje.map(a => a.id))
      .neq('status', 'cancelado')
      .order('confirmado_em')
    for (const c of inscritos || []) {
      if (!porAula.has(c.ocorrencia_id)) porAula.set(c.ocorrencia_id, [])
      porAula.get(c.ocorrencia_id).push(c)
    }
  }
  const totalConf = aulasHoje.reduce((s,a)=>s+(a.confirmados||0),0)
  const totalLivres = aulasHoje.reduce((s,a)=>s+(a.vagas_livres||0),0)
  const por = { brahma:0, shiva_1x:0, shiva_2x:0, vishnu_2x:0, vishnu_livre:0 }
  alunos.forEach(a => { if(por[a.plano_tipo]!==undefined) por[a.plano_tipo]++ })

  const badges = calcularBadgesMenu(notifs)
  aplicarBadgesMenu(badges)

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Dashboard</div>
      <div style="font-size:12px;color:var(--txt2)">${hoje.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</div>
    </div>
    <div class="content">
      ${renderPainelNotif(notifs, { titulo: 'Avisos do sistema' })}
      ${feriados.length ? `<div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);border-radius:6px;padding:9px 13px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--warn-fg);margin-bottom:14px"><i class="ti ti-alert-triangle" style="color:var(--dourado-texto)"></i><span><strong>Atenção:</strong> Há feriados nos próximos 30 dias: ${feriados.slice(0,3).map(f=>`${esc(f.nome)} (${new Date(f.data+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})})`).join(' · ')}</span></div>` : ''}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px">
        <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:5px">Aulas hoje</div><div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--titulo)">${aulasHoje.length}</div></div>
        <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:5px">Alunos ativos</div><div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--titulo)">${alunos.length}</div></div>
        <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:5px">Confirmações</div><div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--titulo)">${totalConf}</div></div>
        <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:5px">Vagas livres</div><div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--titulo)">${totalLivres}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:3fr 2fr;gap:16px">
        ${htmlAulasHoje(aulasHoje, porAula)}
        <div>
          <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;margin-bottom:14px">
            <div style="font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:500;color:var(--titulo);margin-bottom:12px">Alunos por plano</div>
            ${[
              {k:'brahma',      l:'Brahma',       c:'var(--bege2)'},
              {k:'shiva_1x',    l:'Shiva 1x',     c:'#7ab87a'},
              {k:'shiva_2x',    l:'Shiva 2x',     c:'var(--verde-cl)'},
              {k:'vishnu_2x',   l:'Vishnu 2x',    c:'var(--dourado)'},
              {k:'vishnu_livre',l:'Vishnu Livre',  c:'#d4a838'},
            ].map(({k,l,c})=>{
              const n   = por[k]||0
              const pct = alunos.length ? Math.round(n/alunos.length*100) : 0
              return `<div style="margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
                  <span style="font-weight:500">${l}</span>
                  <span style="color:var(--txt2)">${n} alunos</span>
                </div>
                <div style="height:6px;background:var(--neutro-bg);border-radius:4px">
                  <div style="height:6px;background:${c};border-radius:4px;width:${pct}%"></div>
                </div>
              </div>`
            }).join('')}
          </div>
          <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
            <div style="font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:500;color:var(--titulo);margin-bottom:10px">Próximos feriados</div>
            ${feriados.length===0 ? '<div style="font-size:12px;color:var(--txt2)">Nenhum nos próximos 30 dias</div>' :
              feriados.slice(0,4).map(f=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(212,200,158,.25);font-size:12px"><span>${esc(f.nome)}</span><span style="font-size:12px;color:var(--txt2)">${new Date(f.data+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `

  initNotifHandlers(notifs, perfil.id)
  // Ações do resumo do dia (delegação de eventos no próprio cartão: sem handlers inline)
  const cartao = container.querySelector('.dash-hoje')
  cartao?.addEventListener('click', e => {
    const btn = e.target.closest('[data-chamada],[data-turma],[data-abrir-agenda]')
    if (!btn) return
    if (btn.hasAttribute('data-abrir-agenda')) { window._abaGrade = 'agenda'; window.navigate('grade'); return }
    if (btn.dataset.chamada) { irParaChamada(btn.dataset.chamada); return }
    const aula = aulasHoje.find(a => a.id === btn.dataset.turma)
    if (aula) abrirTurma(aula, porAula.get(aula.id) || [])
  })
  uiAnimar(container)   // ← linha 2: chama tudo
}       
