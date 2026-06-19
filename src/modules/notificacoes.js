/**
 * src/modules/notificacoes.js
 *
 * Sistema de notificações contextuais.
 *
 * CORREÇÕES nesta versão:
 *   - Queries de professor usam RPC SECURITY DEFINER para contornar RLS
 *     (auth.uid() admin ≠ perfil.id professor no two-profile setup)
 *   - carregarNotificacoes() recebe o perfil como argumento explícito
 *     para evitar race condition durante impersonação
 *   - Avisos de admin nunca vazam para sessão impersonada
 */

// ─────────────────────────────────────────────────────────────
// CHECKERS
// ─────────────────────────────────────────────────────────────

const TIPOS = {

  // ── ADMIN ─────────────────────────────────────────────────

  admin_pagamentos_vencidos: {
    roles: ['admin'],
    paginas: ['dashboard', 'pagamentos'],
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
        menuIds: ['pagamentos'],
      }]
    },
  },

  admin_planos_vencendo: {
    roles: ['admin'],
    paginas: ['dashboard', 'alunos'],
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
        menuIds: ['alunos'],
      }]
    },
  },

  admin_repasse_pendente: {
    roles: ['admin'],
    paginas: ['dashboard', 'previsao-professor'],
    async checar(sb) {
      const hoje = new Date()
      if (hoje.getDate() < 5) return []
      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const mesRef = mesAnterior.toISOString().slice(0, 7)
      const { data: profs } = await sb
        .from('perfis').select('id, nome').eq('tipo', 'professor').eq('ativo', true)
      if (!profs?.length) return []
      const { data: japagos } = await sb
        .from('repasses_pagos').select('professor_id').like('mes_ref', mesRef + '%')
      const idsJaPagos = new Set((japagos || []).map(r => r.professor_id))
      const pendentes = profs.filter(p => !idsJaPagos.has(p.id))
      if (!pendentes.length) return []
      return [{
        key: `admin_repasse_pendente_${mesRef}`,
        titulo: `Repasse de ${_nomeMes(mesRef)} não registrado`,
        corpo: pendentes.map(p => p.nome).join(', '),
        nivel: 'aviso',
        acao: { label: 'Registrar repasse', page: 'previsao-professor' },
        menuIds: ['previsao-professor'],
      }]
    },
  },

  admin_alunos_sem_asaas: {
    roles: ['admin'],
    paginas: ['dashboard', 'alunos'],
    async checar(sb) {
      const { data: alunos } = await sb
        .from('perfis').select('id').eq('tipo', 'aluno').eq('ativo', true).is('asaas_customer_id', null)
      if (!alunos?.length || alunos.length <= 2) return []
      return [{
        key: `admin_sem_asaas_${new Date().toISOString().slice(0, 7)}`,
        titulo: `${alunos.length} aluno(s) sem vínculo no Asaas`,
        corpo: 'Pagamentos destes alunos não são sincronizados automaticamente.',
        nivel: 'info',
        acao: { label: 'Ver alunos', page: 'alunos' },
        menuIds: ['alunos'],
      }]
    },
  },

  admin_aulas_sem_professor: {
    roles: ['admin'],
    paginas: ['dashboard', 'criar-aulas', 'grade'],
    async checar(sb) {
      const hoje = new Date()
      const fimSemana = new Date(hoje); fimSemana.setDate(hoje.getDate() + 7)
      const { data: ocs } = await sb
        .from('ocorrencias_vagas')
        .select('id, modalidade, data_hora')
        .gte('data_hora', hoje.toISOString())
        .lte('data_hora', fimSemana.toISOString())
        .is('professor_id', null)
        .eq('cancelada', false)
      if (!ocs?.length) return []
      return [{
        key: `admin_sem_professor_${hoje.toISOString().slice(0, 10)}`,
        titulo: `${ocs.length} aula(s) esta semana sem professor definido`,
        corpo: ocs.slice(0, 4).map(o =>
          `${_nomeModal(o.modalidade)} ${new Date(o.data_hora).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}`
        ).join(', ') + (ocs.length > 4 ? ` e mais ${ocs.length - 4}` : ''),
        nivel: 'urgente',
        acao: { label: 'Ver grade', page: 'grade' },
        menuIds: ['grade', 'criar-aulas'],
      }]
    },
  },

  admin_alunos_sumidos: {
    roles: ['admin'],
    paginas: ['dashboard', 'alunos', 'presencas'],
    async checar(sb) {
      // Alunos com saldo > 0 e nenhuma confirmação nas últimas 2 semanas
      const ha2semanas = new Date(); ha2semanas.setDate(ha2semanas.getDate() - 14)
      const { data: comSaldo } = await sb
        .from('saldo_disponivel')
        .select('aluno_id, saldo_total')
        .gt('saldo_total', 0)
      if (!comSaldo?.length) return []
      // Busca quem confirmou algo nas últimas 2 semanas
      const ids = comSaldo.map(s => s.aluno_id)
      const { data: recentes } = await sb
        .from('confirmacoes')
        .select('aluno_id')
        .in('aluno_id', ids)
        .gte('criado_em', ha2semanas.toISOString())
        .in('status', ['confirmado', 'presente'])
      const idsAtivos = new Set((recentes || []).map(c => c.aluno_id))
      const sumidos = comSaldo.filter(s => !idsAtivos.has(s.aluno_id))
      if (!sumidos.length) return []
      // Busca nomes
      const { data: perfis } = await sb
        .from('perfis').select('id, nome').in('id', sumidos.map(s => s.aluno_id))
      const nomeMap = Object.fromEntries((perfis || []).map(p => [p.id, p.nome]))
      return [{
        key: `admin_alunos_sumidos_${new Date().toISOString().slice(0, 10)}`,
        titulo: `${sumidos.length} aluno(s) sem confirmar aulas há 2+ semanas`,
        corpo: sumidos.slice(0, 5).map(s => nomeMap[s.aluno_id] || '—').join(', ') +
          (sumidos.length > 5 ? ` e mais ${sumidos.length - 5}` : ''),
        nivel: 'info',
        acao: { label: 'Ver alunos', page: 'alunos' },
        menuIds: ['alunos', 'presencas'],
      }]
    },
  },

  // ── PROFESSOR ─────────────────────────────────────────────
  // TODAS as queries de professor usam RPC SECURITY DEFINER
  // para contornar a RLS quando auth.uid() ≠ perfil.id
  // (two-profile pitfall do Thiago: admin 1d4eaaed, professor 6b79a085)

  prof_aulas_semana: {
    roles: ['professor'],
    paginas: ['prof-home', 'prof-aulas'],
    async checar(sb, perfil) {
      const { data, error } = await sb.rpc('notif_prof_aulas_semana', {
        p_professor_id: perfil.id,
      })
      if (error) { console.warn('notif_prof_aulas_semana:', error.message); return [] }
      const ocs = data || []
      if (!ocs.length) return []
      const hoje = new Date().toISOString().slice(0, 10)
      const hojeOcs = ocs.filter(o => o.data_hora?.slice(0, 10) === hoje)
      const proxima = ocs.find(o => new Date(o.data_hora) >= new Date())
      const notifs = []
      // Aviso semanal
      notifs.push({
        key: `prof_semana_${_semKey()}_${perfil.id}`,
        titulo: `Você tem ${ocs.length} aula(s) nesta semana`,
        corpo: ocs.slice(0, 4).map(o =>
          `${_nomeModal(o.modalidade)} ${new Date(o.data_hora).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}`
        ).join(', ') + (ocs.length > 4 ? ` e mais ${ocs.length - 4}` : ''),
        nivel: 'info',
        acao: { label: 'Ver aulas', page: 'prof-aulas' },
        menuIds: ['prof-aulas'],
      })
      // Aviso de próxima aula hoje
      if (proxima && proxima.data_hora?.slice(0, 10) === hoje) {
        const hora = new Date(proxima.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        notifs.push({
          key: `prof_proxima_hoje_${proxima.id}`,
          titulo: `Sua próxima aula é hoje às ${hora}`,
          corpo: `${_nomeModal(proxima.modalidade)} · ${proxima.confirmados || 0} aluno(s) confirmado(s)`,
          nivel: 'aviso',
          acao: { label: 'Fazer chamada', page: 'prof-chamada', ocId: proxima.id },
          menuIds: ['prof-chamada', 'prof-home'],
        })
      }
      return notifs
    },
  },

  prof_chamada_pendente: {
    roles: ['professor'],
    paginas: ['prof-home', 'prof-chamada'],
    async checar(sb, perfil) {
      const { data, error } = await sb.rpc('notif_prof_chamada_pendente', {
        p_professor_id: perfil.id,
      })
      if (error) { console.warn('notif_prof_chamada_pendente:', error.message); return [] }
      return (data || []).map(oc => {
        const hora = new Date(oc.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        return {
          key: `prof_chamada_${oc.id}_${new Date().toISOString().slice(0, 10)}`,
          titulo: `Chamada pendente — ${_nomeModal(oc.modalidade)} ${hora}`,
          corpo: `${oc.confirmados} aluno(s) confirmado(s) aguardando marcação de presença.`,
          nivel: 'urgente',
          acao: { label: 'Fazer chamada', page: 'prof-chamada', ocId: oc.id },
          menuIds: ['prof-chamada', 'prof-home'],
        }
      })
    },
  },

  prof_repasse_status: {
    roles: ['professor'],
    paginas: ['prof-home', 'prof-repasse'],
    async checar(sb, perfil) {
      const hoje = new Date()
      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const mesRef = mesAnterior.toISOString().slice(0, 7)
      const { data, error } = await sb.rpc('notif_prof_repasse', {
        p_professor_id: perfil.id,
        p_mes_ref: mesRef + '-01',
      })
      if (error) { console.warn('notif_prof_repasse:', error.message); return [] }
      const pago = data?.[0]
      if (pago) {
        return [{
          key: `prof_repasse_pago_${mesRef}_${perfil.id}`,
          titulo: `Repasse de ${_nomeMes(mesRef)} registrado`,
          corpo: `Valor recebido: R$ ${Number(pago.valor_pago).toFixed(2).replace('.', ',')}`,
          nivel: 'info',
          acao: { label: 'Ver histórico', page: 'prof-repasse' },
          menuIds: ['prof-repasse'],
        }]
      }
      if (hoje.getDate() >= 5) {
        return [{
          key: `prof_repasse_pendente_${mesRef}_${perfil.id}`,
          titulo: `Repasse de ${_nomeMes(mesRef)} ainda não registrado`,
          corpo: 'Entre em contato com o Espaço Autonomia se tiver dúvidas sobre o valor.',
          nivel: 'aviso',
          acao: { label: 'Ver previsão', page: 'prof-repasse' },
          menuIds: ['prof-repasse'],
        }]
      }
      return []
    },
  },

  // ── ALUNO ─────────────────────────────────────────────────

  aluno_proxima_aula: {
    roles: ['aluno'],
    paginas: ['aluno-home', 'aluno-grade'],
    async checar(sb, perfil) {
      const amanha = new Date(); amanha.setDate(amanha.getDate() + 1)
      const depois = new Date(); depois.setDate(depois.getDate() + 2)
      const { data: confs } = await sb
        .from('confirmacoes')
        .select('ocorrencia:ocorrencias(id, data_hora, aula:aulas(modalidade))')
        .eq('aluno_id', perfil.id)
        .eq('status', 'confirmado')
        .gte('criado_em', new Date().toISOString())
        .limit(5)
      const proxAmanha = (confs || []).find(c => {
        const d = c.ocorrencia?.data_hora?.slice(0, 10)
        return d === amanha.toISOString().slice(0, 10)
      })
      if (!proxAmanha) return []
      const dt = new Date(proxAmanha.ocorrencia.data_hora)
      const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      return [{
        key: `aluno_proxima_amanha_${proxAmanha.ocorrencia.id}`,
        titulo: `Sua aula é amanhã às ${hora}`,
        corpo: `${_nomeModal(proxAmanha.ocorrencia.aula?.modalidade)} · Lembre-se de confirmar presença se ainda não fez.`,
        nivel: 'info',
        acao: { label: 'Ver grade', page: 'aluno-grade' },
        menuIds: ['aluno-grade', 'aluno-home'],
      }]
    },
  },

  aluno_confirmar_semana: {
    roles: ['aluno'],
    paginas: ['aluno-home', 'aluno-grade'],
    async checar(sb, perfil) {
      const hoje = new Date()
      const diaSemana = hoje.getDay() === 0 ? 6 : hoje.getDay() - 1
      const seg = new Date(hoje); seg.setDate(hoje.getDate() - diaSemana); seg.setHours(0, 0, 0, 0)
      const dom = new Date(seg); dom.setDate(seg.getDate() + 6); dom.setHours(23, 59, 59, 999)
      const [saldoRes, confsRes, matRes] = await Promise.all([
        sb.from('saldo_disponivel').select('saldo_total').eq('aluno_id', perfil.id).maybeSingle(),
        sb.from('confirmacoes').select('id')
          .eq('aluno_id', perfil.id).eq('status', 'confirmado')
          .gte('criado_em', seg.toISOString()).lte('criado_em', dom.toISOString()).limit(1),
        sb.from('matriculas').select('plano_tipo, opcao_aulas')
          .eq('aluno_id', perfil.id).eq('ativa', true).maybeSingle(),
      ])
      const mat = matRes.data
      const ehLivre = mat?.plano_tipo === 'vishnu_livre' || mat?.opcao_aulas === 99
      if (ehLivre || !mat) return []
      const saldo = saldoRes.data?.saldo_total ?? 0
      const jaConfirmou = (confsRes.data?.length || 0) > 0
      if (saldo > 0 && !jaConfirmou) {
        return [{
          key: `aluno_confirmar_semana_${_semKey()}_${perfil.id}`,
          titulo: `Você tem ${saldo} crédito(s) disponível(is)`,
          corpo: 'Ainda não confirmou aulas nesta semana. Garanta seu lugar na grade!',
          nivel: 'aviso',
          acao: { label: 'Ver grade', page: 'aluno-grade' },
          menuIds: ['aluno-grade', 'aluno-home'],
        }]
      }
      return []
    },
  },

  aluno_saldo_zerado: {
    roles: ['aluno'],
    paginas: ['aluno-home', 'aluno-plano'],
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
      return [{
        key: `aluno_saldo_zero_${new Date().toISOString().slice(0, 10)}_${perfil.id}`,
        titulo: 'Saldo de aulas zerado',
        corpo: 'Seus créditos acabaram. Entre em contato para renovar ou aguarde a próxima mensalidade.',
        nivel: 'urgente',
        acao: { label: 'Ver meu plano', page: 'aluno-plano' },
        menuIds: ['aluno-plano', 'aluno-home'],
      }]
    },
  },

  aluno_pagamento_vencido: {
    roles: ['aluno'],
    paginas: ['aluno-home', 'aluno-plano'],
    async checar(sb, perfil) {
      const mesRef = new Date().toISOString().slice(0, 7)
      const { data: pg } = await sb
        .from('pagamentos').select('id, valor, vencimento')
        .eq('aluno_id', perfil.id).eq('status', 'OVERDUE')
        .like('mes_ref', mesRef + '%').maybeSingle()
      if (!pg) return []
      return [{
        key: `aluno_pgto_vencido_${pg.id}`,
        titulo: 'Mensalidade em aberto',
        corpo: `Vencimento: ${_fmtData(pg.vencimento)} · R$ ${(pg.valor || 0).toFixed(2).replace('.', ',')}`,
        nivel: 'urgente',
        acao: { label: 'Ver meu plano', page: 'aluno-plano' },
        menuIds: ['aluno-plano', 'aluno-home'],
      }]
    },
  },
}

// ─────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL
// ─────────────────────────────────────────────────────────────

/**
 * Carrega notificações para o perfil explicitamente passado.
 * SEMPRE passe o perfil como argumento — não usa window._perfil
 * para evitar race condition durante impersonação.
 *
 * @param {Object} perfilExplicito — o perfil a usar (window._perfil no momento do render)
 * @param {string|null} filtroPagina — se passado, retorna só notifs desta página
 */
export async function carregarNotificacoes(perfilExplicito, filtroPagina = null) {
  const sb = window._sb
  const perfil = perfilExplicito
  if (!sb || !perfil) return []

  // Garante que não vaza notificação de admin para sessão impersonada de professor/aluno
  const role = perfil.tipo

  const { data: lidas } = await sb
    .from('notificacoes_lidas')
    .select('notif_key')
    .eq('perfil_id', perfil.id)
  const keysLidas = new Set((lidas || []).map(l => l.notif_key))

  const tiposDoRole = Object.values(TIPOS).filter(t => {
    if (!t.roles.includes(role)) return false
    if (filtroPagina && t.paginas && !t.paginas.includes(filtroPagina)) return false
    return true
  })

  const resultados = await Promise.allSettled(
    tiposDoRole.map(t => t.checar(sb, perfil).catch(e => {
      console.warn(`notif checker erro:`, e); return []
    }))
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

export async function marcarLida(key, perfilId) {
  const sb = window._sb
  if (!sb || !perfilId) return
  await sb.from('notificacoes_lidas')
    .upsert({ perfil_id: perfilId, notif_key: key }, { onConflict: 'perfil_id,notif_key' })
}

export async function marcarTodasLidas(notifs, perfilId) {
  const sb = window._sb
  if (!sb || !perfilId) return
  const rows = notifs.filter(n => !n.lida).map(n => ({ perfil_id: perfilId, notif_key: n.key }))
  if (!rows.length) return
  await sb.from('notificacoes_lidas').upsert(rows, { onConflict: 'perfil_id,notif_key' })
}

/**
 * Calcula contagens por menuId para os badges do sidebar.
 * Retorna objeto { 'pagamentos': 2, 'alunos': 1, ... }
 */
export function calcularBadgesMenu(notifs) {
  const badges = {}
  for (const n of notifs) {
    if (n.lida) continue
    for (const menuId of (n.menuIds || [])) {
      badges[menuId] = (badges[menuId] || 0) + 1
    }
  }
  return badges
}

// ─────────────────────────────────────────────────────────────
// RENDERIZAÇÃO — PAINEL
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
    const oculto = idx >= maxVisiveis ? 'class="notif-extra" style="display:none"' : ''
    const acaoBtn = n.acao
      ? `<button onclick="${_acaoOnclick(n.acao)}"
           style="padding:3px 10px;background:transparent;border:1px solid ${cor.txt};border-radius:4px;
                  font-size:11px;cursor:pointer;color:${cor.txt};font-family:'DM Sans',sans-serif;white-space:nowrap">
           ${_esc(n.acao.label)}</button>` : ''
    const dispensarBtn = !n.lida
      ? `<button onclick="window._notifMarcarLida('${_esc(n.key)}')"
           style="padding:3px 8px;background:transparent;border:none;font-size:10px;
                  cursor:pointer;color:var(--txt2);font-family:'DM Sans',sans-serif">dispensar</button>` : ''
    return `
      <div ${oculto} data-notif-key="${_esc(n.key)}"
        style="background:${n.lida ? '#fafaf7' : cor.bg};border:1px solid ${n.lida ? 'var(--borda)' : cor.borda};
               border-radius:8px;padding:11px 14px;display:flex;align-items:flex-start;gap:10px;
               opacity:${n.lida ? '.5' : '1'};transition:opacity .25s">
        <span style="font-size:16px;flex-shrink:0;margin-top:1px">${n.lida ? '✓' : cor.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:${n.lida ? 'var(--txt2)' : cor.txt};margin-bottom:2px">${_esc(n.titulo)}</div>
          <div style="font-size:11px;color:var(--txt2);line-height:1.45">${_esc(n.corpo)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0">
          ${acaoBtn}${dispensarBtn}
        </div>
      </div>`
  }

  const todasCards = [
    ...naoLidas.map((n, i) => renderCard(n, i)),
    ...lidas.map((n, i)    => renderCard(n, naoLidas.length + i)),
  ]
  const temMais = notifs.length > maxVisiveis

  return `
    <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;margin-bottom:14px" id="painel-notif">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde)">${_esc(titulo)}</span>
          ${naoLidas.length ? `<span id="notif-badge-count" style="background:#c0392b;color:#fff;border-radius:10px;padding:1px 7px;font-size:10px;font-weight:600">${naoLidas.length}</span>` : ''}
        </div>
        ${naoLidas.length > 1
          ? `<button onclick="window._notifMarcarTodasLidas()"
               style="font-size:11px;color:var(--txt2);background:none;border:none;cursor:pointer;
                      font-family:'DM Sans',sans-serif;text-decoration:underline">dispensar tudo</button>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:7px" id="notif-lista">${todasCards.join('')}</div>
      ${temMais
        ? `<button onclick="document.querySelectorAll('.notif-extra').forEach(el=>el.style.display='flex');this.style.display='none'"
             style="margin-top:10px;width:100%;padding:6px;background:transparent;border:1px solid var(--borda);
                    border-radius:6px;font-size:11px;cursor:pointer;color:var(--txt2);font-family:'DM Sans',sans-serif">
             Ver mais ${notifs.length - maxVisiveis} aviso(s)</button>` : ''}
    </div>`
}

export function initNotifHandlers(notifs, perfilId) {
  window._notifMarcarLida = async function (key) {
    await marcarLida(key, perfilId)
    const el = document.querySelector(`[data-notif-key="${CSS.escape(key)}"]`)
    if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 260) }
    const badge = document.getElementById('notif-badge-count')
    if (badge) {
      const atual = parseInt(badge.textContent) - 1
      if (atual <= 0) badge.remove(); else badge.textContent = atual
    }
  }
  window._notifMarcarTodasLidas = async function () {
    await marcarTodasLidas(notifs, perfilId)
    document.querySelectorAll('[data-notif-key]').forEach(el => {
      el.style.opacity = '0'; setTimeout(() => el.remove(), 260)
    })
    document.getElementById('notif-badge-count')?.remove()
  }
}

// ─────────────────────────────────────────────────────────────
// BADGES NO MENU LATERAL
// ─────────────────────────────────────────────────────────────

/**
 * Aplica badges numéricos nos itens do menu lateral.
 * Chama após buildMenu() e após carregarNotificacoes().
 */
export function aplicarBadgesMenu(badges) {
  // Remove badges anteriores
  document.querySelectorAll('.ni .notif-menu-badge').forEach(el => el.remove())

  for (const [menuId, count] of Object.entries(badges)) {
    if (!count) continue
    const niEl = document.getElementById(`ni-${menuId}`)
    if (!niEl) continue
    const badge = document.createElement('span')
    badge.className = 'notif-menu-badge'
    badge.textContent = count
    badge.style.cssText = `
      background:#c0392b;color:#fff;border-radius:10px;padding:1px 6px;
      font-size:10px;font-weight:600;margin-left:auto;flex-shrink:0;
      font-family:'DM Sans',sans-serif;line-height:1.4
    `
    // O item de menu usa display:flex — o badge vai para a direita automaticamente
    niEl.style.display = 'flex'
    niEl.style.alignItems = 'center'
    niEl.appendChild(badge)
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
  return d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'
}

function _semKey() {
  const hoje = new Date()
  const diaSemana = hoje.getDay() === 0 ? 6 : hoje.getDay() - 1
  const seg = new Date(hoje); seg.setDate(hoje.getDate() - diaSemana)
  return seg.toISOString().slice(0, 10)
}

function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function _acaoOnclick(acao) {
  if (acao.ocId) return `window._ocPresencaId='${acao.ocId}';navigate('${acao.page}')`
  return `navigate('${acao.page}')`
}
