/**
 * src/modules/notificacoes.js
 *
 * Sistema de notificações contextuais — geradas por query a cada sessão,
 * marcáveis como lidas por instância via tabela notificacoes_lidas.
 *
 * Uso em qualquer dashboard:
 *   import { carregarNotificacoes, renderPainelNotif, initNotifHandlers } from '../../modules/notificacoes.js'
 *
 *   const notifs = await carregarNotificacoes()
 *   // dentro do container.innerHTML, na .content:
 *   ${renderPainelNotif(notifs)}
 *   // após o container.innerHTML:
 *   initNotifHandlers(notifs)
 */

// ─────────────────────────────────────────────────────────────
// CHECKERS POR ROLE
// ─────────────────────────────────────────────────────────────

const TIPOS = {

  // ── ADMIN ─────────────────────────────────────────────────

  admin_pagamentos_vencidos: {
    roles: ['admin'],
    async checar(sb) {
      const mesRef = new Date().toISOString().slice(0, 7)
      const { data: pgs } = await sb
        .from('pagamentos')
        .select('id, valor, aluno:perfis!aluno_id(nome)')
        .eq('status', 'OVERDUE')
        .like('mes_ref', mesRef + '%')
      if (!pgs?.length) return []
      return [{
        key: `admin_pgto_vencido_${mesRef}`,
        titulo: `${pgs.length} pagamento(s) vencido(s) em ${_nomeMes(mesRef)}`,
        corpo: pgs.slice(0, 5).map(p => p.aluno?.nome || '—').join(', ') +
          (pgs.length > 5 ? ` e mais ${pgs.length - 5}` : ''),
        nivel: 'urgente',
        acao: { label: 'Ver pagamentos', page: 'pagamentos' },
      }]
    },
  },

  admin_planos_vencendo: {
    roles: ['admin'],
    async checar(sb) {
      const hoje = new Date()
      const em7 = new Date(); em7.setDate(hoje.getDate() + 7)
      const { data: mats } = await sb
        .from('matriculas')
        .select('fim, aluno:perfis!matriculas_aluno_id_fkey(nome)')
        .eq('ativa', true)
        .not('fim', 'is', null)
        .lte('fim', em7.toISOString().slice(0, 10))
        .gte('fim', hoje.toISOString().slice(0, 10))
      if (!mats?.length) return []
      return [{
        key: `admin_planos_vencendo_${hoje.toISOString().slice(0, 10)}`,
        titulo: `${mats.length} plano(s) vencendo nos próximos 7 dias`,
        corpo: mats.map(m => m.aluno?.nome || '—').join(', '),
        nivel: 'aviso',
        acao: { label: 'Ver alunos', page: 'alunos' },
      }]
    },
  },

  admin_repasse_pendente: {
    roles: ['admin'],
    async checar(sb) {
      const hoje = new Date()
      if (hoje.getDate() < 5) return []

      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const mesRef = mesAnterior.toISOString().slice(0, 7)

      const { data: profs } = await sb
        .from('perfis')
        .select('id, nome')
        .eq('tipo', 'professor')
        .eq('ativo', true)

      if (!profs?.length) return []

      const { data: japagos } = await sb
        .from('repasses_pagos')
        .select('professor_id')
        .like('mes_ref', mesRef + '%')

      const idsJaPagos = new Set((japagos || []).map(r => r.professor_id))
      const pendentes = profs.filter(p => !idsJaPagos.has(p.id))

      if (!pendentes.length) return []

      return [{
        key: `admin_repasse_pendente_${mesRef}`,
        titulo: `Repasse de ${_nomeMes(mesRef)} não registrado`,
        corpo: pendentes.map(p => p.nome).join(', '),
        nivel: 'aviso',
        acao: { label: 'Registrar repasse', page: 'previsao-professor' },
      }]
    },
  },

  admin_alunos_sem_asaas: {
    roles: ['admin'],
    async checar(sb) {
      const { data: alunos } = await sb
        .from('perfis')
        .select('id')
        .eq('tipo', 'aluno')
        .eq('ativo', true)
        .is('asaas_customer_id', null)
      if (!alunos?.length || alunos.length <= 2) return []
      return [{
        key: `admin_sem_asaas_${new Date().toISOString().slice(0, 7)}`,
        titulo: `${alunos.length} aluno(s) sem vínculo no Asaas`,
        corpo: 'Pagamentos destes alunos não são sincronizados automaticamente.',
        nivel: 'info',
        acao: { label: 'Ver alunos', page: 'alunos' },
      }]
    },
  },

  // ── PROFESSOR ─────────────────────────────────────────────

  prof_chamada_pendente: {
    roles: ['professor'],
    async checar(sb, perfil) {
      const hoje = new Date()
      const inicioHoje = new Date(hoje); inicioHoje.setHours(0, 0, 0, 0)
      const fimHoje = new Date(hoje); fimHoje.setHours(23, 59, 59, 999)

      const { data: ocs } = await sb
        .from('ocorrencias_vagas')
        .select('id, modalidade, data_hora, confirmados')
        .gte('data_hora', inicioHoje.toISOString())
        .lte('data_hora', fimHoje.toISOString())
        .eq('professor_id', perfil.id)
        .eq('cancelada', false)

      if (!ocs?.length) return []

      const notifs = []
      for (const oc of ocs) {
        const dtAula = new Date(oc.data_hora)
        if (dtAula > hoje) continue
        if (!oc.confirmados || oc.confirmados === 0) continue

        const { data: marcacoes } = await sb
          .from('confirmacoes')
          .select('id')
          .eq('ocorrencia_id', oc.id)
          .in('status', ['presente', 'ausente'])
          .limit(1)

        if (!marcacoes?.length) {
          const hora = dtAula.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          notifs.push({
            key: `prof_chamada_${oc.id}_${hoje.toISOString().slice(0, 10)}`,
            titulo: `Chamada pendente — ${_nomeModal(oc.modalidade)} ${hora}`,
            corpo: `${oc.confirmados} aluno(s) confirmado(s) aguardando marcação de presença.`,
            nivel: 'urgente',
            acao: { label: 'Fazer chamada', page: 'prof-chamada', ocId: oc.id },
          })
        }
      }
      return notifs
    },
  },

  prof_repasse_status: {
    roles: ['professor'],
    async checar(sb, perfil) {
      const hoje = new Date()
      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const mesRef = mesAnterior.toISOString().slice(0, 7)

      const { data: pago } = await sb
        .from('repasses_pagos')
        .select('id, valor_pago')
        .eq('professor_id', perfil.id)
        .like('mes_ref', mesRef + '%')
        .maybeSingle()

      if (pago) {
        return [{
          key: `prof_repasse_pago_${mesRef}_${perfil.id}`,
          titulo: `Repasse de ${_nomeMes(mesRef)} registrado`,
          corpo: `Valor recebido: R$ ${pago.valor_pago.toFixed(2).replace('.', ',')}`,
          nivel: 'info',
          acao: { label: 'Ver histórico', page: 'prof-repasse' },
        }]
      }

      if (hoje.getDate() >= 5) {
        return [{
          key: `prof_repasse_pendente_${mesRef}_${perfil.id}`,
          titulo: `Repasse de ${_nomeMes(mesRef)} ainda não registrado`,
          corpo: 'Entre em contato com o Espaço Autonomia se tiver dúvidas sobre o valor.',
          nivel: 'aviso',
          acao: { label: 'Ver previsão', page: 'prof-repasse' },
        }]
      }
      return []
    },
  },

  // ── ALUNO ─────────────────────────────────────────────────

  aluno_confirmar_semana: {
    roles: ['aluno'],
    async checar(sb, perfil) {
      const hoje = new Date()
      const diaSemana = hoje.getDay() === 0 ? 6 : hoje.getDay() - 1
      const seg = new Date(hoje); seg.setDate(hoje.getDate() - diaSemana); seg.setHours(0, 0, 0, 0)
      const dom = new Date(seg); dom.setDate(seg.getDate() + 6); dom.setHours(23, 59, 59, 999)

      const [saldoRes, confsRes, matRes] = await Promise.all([
        sb.from('saldo_disponivel').select('saldo_total').eq('aluno_id', perfil.id).maybeSingle(),
        sb.from('confirmacoes')
          .select('id')
          .eq('aluno_id', perfil.id)
          .eq('status', 'confirmado')
          .gte('criado_em', seg.toISOString())
          .lte('criado_em', dom.toISOString())
          .limit(1),
        sb.from('matriculas')
          .select('plano_tipo, opcao_aulas')
          .eq('aluno_id', perfil.id)
          .eq('ativa', true)
          .maybeSingle(),
      ])

      const mat = matRes.data
      const ehLivre = mat?.plano_tipo === 'vishnu_livre' || mat?.opcao_aulas === 99
      if (ehLivre || !mat) return []

      const saldo = saldoRes.data?.saldo_total ?? 0
      const jaConfirmou = (confsRes.data?.length || 0) > 0

      if (saldo > 0 && !jaConfirmou) {
        const semKey = seg.toISOString().slice(0, 10)
        return [{
          key: `aluno_confirmar_semana_${semKey}_${perfil.id}`,
          titulo: `Você tem ${saldo} crédito(s) disponível(is)`,
          corpo: 'Ainda não confirmou aulas nesta semana. Garanta seu lugar na grade!',
          nivel: 'aviso',
          acao: { label: 'Ver grade', page: 'aluno-grade' },
        }]
      }
      return []
    },
  },

  aluno_saldo_zerado: {
    roles: ['aluno'],
    async checar(sb, perfil) {
      const [saldoRes, matRes] = await Promise.all([
        sb.from('saldo_disponivel').select('saldo_total').eq('aluno_id', perfil.id).maybeSingle(),
        sb.from('matriculas').select('plano_tipo, opcao_aulas').eq('aluno_id', perfil.id).eq('ativa', true).maybeSingle(),
      ])

      const mat = matRes.data
      const ehLivre = mat?.plano_tipo === 'vishnu_livre' || mat?.opcao_aulas === 99
      if (ehLivre || !mat) return []

      const saldo = saldoRes.data?.saldo_total ?? 0
      if (saldo > 0) return []

      const semKey = new Date().toISOString().slice(0, 10)
      return [{
        key: `aluno_saldo_zero_${semKey}_${perfil.id}`,
        titulo: 'Saldo de aulas zerado',
        corpo: 'Seus créditos acabaram. Entre em contato para renovar ou aguarde a próxima mensalidade.',
        nivel: 'urgente',
        acao: { label: 'Ver meu plano', page: 'aluno-plano' },
      }]
    },
  },

  aluno_pagamento_vencido: {
    roles: ['aluno'],
    async checar(sb, perfil) {
      const mesRef = new Date().toISOString().slice(0, 7)
      const { data: pg } = await sb
        .from('pagamentos')
        .select('id, valor, vencimento')
        .eq('aluno_id', perfil.id)
        .eq('status', 'OVERDUE')
        .like('mes_ref', mesRef + '%')
        .maybeSingle()

      if (!pg) return []
      return [{
        key: `aluno_pgto_vencido_${pg.id}`,
        titulo: 'Mensalidade em aberto',
        corpo: `Vencimento: ${_fmtData(pg.vencimento)} · R$ ${(pg.valor || 0).toFixed(2).replace('.', ',')}`,
        nivel: 'urgente',
        acao: { label: 'Ver meu plano', page: 'aluno-plano' },
      }]
    },
  },
}

// ─────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL
// ─────────────────────────────────────────────────────────────

export async function carregarNotificacoes() {
  const sb = window._sb
  const perfil = window._perfil
  if (!sb || !perfil) return []

  const role = perfil.tipo

  const { data: lidas } = await sb
    .from('notificacoes_lidas')
    .select('notif_key')
    .eq('perfil_id', perfil.id)

  const keysLidas = new Set((lidas || []).map(l => l.notif_key))

  const tiposDoRole = Object.values(TIPOS).filter(t => t.roles.includes(role))
  const resultados = await Promise.allSettled(
    tiposDoRole.map(t => t.checar(sb, perfil).catch(() => []))
  )

  const todas = resultados
    .flatMap(r => r.status === 'fulfilled' ? r.value : [])
    .map(n => ({ ...n, lida: keysLidas.has(n.key) }))

  const PRIORIDADE = { urgente: 0, aviso: 1, info: 2 }
  return todas.sort((a, b) => {
    if (a.lida !== b.lida) return a.lida ? 1 : -1
    return (PRIORIDADE[a.nivel] ?? 9) - (PRIORIDADE[b.nivel] ?? 9)
  })
}

export async function marcarLida(key) {
  const sb = window._sb
  const perfil = window._perfil
  if (!sb || !perfil) return
  await sb
    .from('notificacoes_lidas')
    .upsert({ perfil_id: perfil.id, notif_key: key }, { onConflict: 'perfil_id,notif_key' })
}

export async function marcarTodasLidas(notifs) {
  const sb = window._sb
  const perfil = window._perfil
  if (!sb || !perfil) return
  const rows = notifs
    .filter(n => !n.lida)
    .map(n => ({ perfil_id: perfil.id, notif_key: n.key }))
  if (!rows.length) return
  await sb
    .from('notificacoes_lidas')
    .upsert(rows, { onConflict: 'perfil_id,notif_key' })
}

// ─────────────────────────────────────────────────────────────
// RENDERIZAÇÃO
// ─────────────────────────────────────────────────────────────

const COR_NIVEL = {
  urgente: { bg: '#fceaea',             borda: '#f5c1c1',             txt: '#8a1a1a',      icon: '⚠️' },
  aviso:   { bg: 'rgba(232,188,79,.1)', borda: 'rgba(232,188,79,.4)', txt: '#7a5a10',      icon: '💡' },
  info:    { bg: 'rgba(31,56,31,.05)',  borda: 'rgba(31,56,31,.15)',  txt: 'var(--verde)', icon: 'ℹ️' },
}

export function renderPainelNotif(notifs, opts = {}) {
  if (!notifs.length) return ''

  const { maxVisiveis = 3, titulo = 'Avisos' } = opts
  const naoLidas = notifs.filter(n => !n.lida)
  const lidas    = notifs.filter(n =>  n.lida)

  const renderCard = (n, idx) => {
    const cor    = COR_NIVEL[n.nivel] || COR_NIVEL.info
    const oculto = idx >= maxVisiveis
      ? 'class="notif-extra" style="display:none"'
      : ''

    const acaoBtn = n.acao
      ? `<button onclick="${_acaoOnclick(n.acao)}"
           style="padding:3px 10px;background:transparent;border:1px solid ${cor.txt};border-radius:4px;
                  font-size:11px;cursor:pointer;color:${cor.txt};font-family:'DM Sans',sans-serif;white-space:nowrap">
           ${_esc(n.acao.label)}
         </button>`
      : ''

    const dispensarBtn = !n.lida
      ? `<button onclick="window._notifMarcarLida('${_esc(n.key)}')"
           style="padding:3px 8px;background:transparent;border:none;font-size:10px;
                  cursor:pointer;color:var(--txt2);font-family:'DM Sans',sans-serif">
           dispensar
         </button>`
      : ''

    return `
      <div ${oculto}
        data-notif-key="${_esc(n.key)}"
        style="background:${n.lida ? '#fafaf7' : cor.bg};
               border:1px solid ${n.lida ? 'var(--borda)' : cor.borda};
               border-radius:8px;padding:11px 14px;
               display:flex;align-items:flex-start;gap:10px;
               opacity:${n.lida ? '.5' : '1'};transition:opacity .25s">
        <span style="font-size:16px;flex-shrink:0;margin-top:1px">${n.lida ? '✓' : cor.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:${n.lida ? 'var(--txt2)' : cor.txt};margin-bottom:2px">
            ${_esc(n.titulo)}
          </div>
          <div style="font-size:11px;color:var(--txt2);line-height:1.45">${_esc(n.corpo)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0">
          ${acaoBtn}
          ${dispensarBtn}
        </div>
      </div>`
  }

  const todasCards = [
    ...naoLidas.map((n, i) => renderCard(n, i)),
    ...lidas.map((n, i)    => renderCard(n, naoLidas.length + i)),
  ]

  const temMais = notifs.length > maxVisiveis

  return `
    <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;margin-bottom:14px"
         id="painel-notif">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde)">
            ${_esc(titulo)}
          </span>
          ${naoLidas.length
            ? `<span style="background:#c0392b;color:#fff;border-radius:10px;padding:1px 7px;font-size:10px;font-weight:600"
                    id="notif-badge-count">${naoLidas.length}</span>`
            : ''}
        </div>
        ${naoLidas.length > 1
          ? `<button onclick="window._notifMarcarTodasLidas()"
               style="font-size:11px;color:var(--txt2);background:none;border:none;cursor:pointer;
                      font-family:'DM Sans',sans-serif;text-decoration:underline">
               dispensar tudo
             </button>`
          : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:7px" id="notif-lista">
        ${todasCards.join('')}
      </div>
      ${temMais
        ? `<button
             onclick="document.querySelectorAll('.notif-extra').forEach(el=>el.style.display='flex');this.style.display='none'"
             style="margin-top:10px;width:100%;padding:6px;background:transparent;border:1px solid var(--borda);
                    border-radius:6px;font-size:11px;cursor:pointer;color:var(--txt2);font-family:'DM Sans',sans-serif">
             Ver mais ${notifs.length - maxVisiveis} aviso(s)
           </button>`
        : ''}
    </div>`
}

export function initNotifHandlers(notifs) {
  window._notifMarcarLida = async function (key) {
    await marcarLida(key)
    const el = document.querySelector(`[data-notif-key="${CSS.escape(key)}"]`)
    if (el) {
      el.style.opacity = '0'
      setTimeout(() => el.remove(), 260)
    }
    const badge = document.getElementById('notif-badge-count')
    if (badge) {
      const atual = parseInt(badge.textContent) - 1
      if (atual <= 0) badge.remove()
      else badge.textContent = atual
    }
  }

  window._notifMarcarTodasLidas = async function () {
    await marcarTodasLidas(notifs)
    document.querySelectorAll('[data-notif-key]').forEach(el => {
      el.style.opacity = '0'
      setTimeout(() => el.remove(), 260)
    })
    document.getElementById('notif-badge-count')?.remove()
  }
}

// ─────────────────────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────────────────────

function _nomeMes(ymStr) {
  const [y, m] = (ymStr || '').slice(0, 7).split('-')
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return (nomes[Number(m) - 1] || m) + '/' + (y || '').slice(2)
}

function _nomeModal(m) {
  return { hatha: 'Hatha Yoga', acro: 'Acro Yoga', raja: 'Raja Yoga' }[m] || m
}

function _fmtData(d) {
  return d
    ? new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : '—'
}

function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function _acaoOnclick(acao) {
  if (acao.ocId) return `window._ocPresencaId='${acao.ocId}';navigate('${acao.page}')`
  return `navigate('${acao.page}')`
}
