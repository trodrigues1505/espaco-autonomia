/**
 * src/modules/agenda.js
 * Agenda semanal do dashboard — arraste uma aula para trocar o dia e o horário
 * (como no Google Agenda).
 *
 *  • Arrastar: mouse (clique e arraste) e toque (segure ~0,3 s e arraste). Usa Pointer Events,
 *    não o drag nativo do HTML, que não funciona no celular.
 *  • Sem mouse: clique/Enter na aula abre "Mover aula" (data e hora).
 *  • Ao soltar, pergunta: "somente esta aula" ou "todas as aulas desta série" (esta e as próximas;
 *    muda também o horário-modelo). A lógica roda no banco (agenda_mover_aula), de forma atômica.
 *  • Os alunos confirmados recebem um aviso no app (desmarcável) e há botão para copiar o texto
 *    para o WhatsApp. Passo de 15 min. Aulas que já começaram não se movem.
 *  • Pede confirmação só quando há conflito de professor ou o destino é feriado.
 *  • Todo movimento tem "Desfazer" (também atômico).
 *  • Horários sempre em America/Sao_Paulo, independente do fuso do navegador.
 */

import { esc, NOMES, CORES } from './utils.js'
import { formularioModal, confirmarModal, escolhaModal, avisoComAcao } from './dialogs.js'

const TZ = 'America/Sao_Paulo'
const OFFSET = '-03:00'          // Brasil sem horário de verão desde 2019 (mesma convenção da Grade)
const PX_HORA = 56
const PASSO = 15
const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_LONGO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// ── Datas (funções puras, exportadas para teste) ─────────────
const fmtSP = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})
export function partesSP(d) {
  const p = Object.fromEntries(fmtSP.formatToParts(new Date(d)).map(x => [x.type, x.value]))
  return { data: `${p.year}-${p.month}-${p.day}`, hh: +p.hour, mm: +p.minute }
}
export const dowDe = data => new Date(data + 'T12:00:00Z').getUTCDay()
export function addDias(data, n) {
  const d = new Date(data + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const inicioSemana = data => addDias(data, -((dowDe(data) + 6) % 7))   // segunda-feira
export const hhmm = min => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0')
export const isoSP = (data, hora) => `${data}T${hora}:00${OFFSET}`

/** Distribui aulas simultâneas lado a lado (colunas dentro do dia). */
export function layoutLanes(evs) {
  const lista = [...evs].sort((a, b) => a.ini - b.ini || a.fim - b.fim)
  let grupo = [], fimGrupo = -1
  const fechar = () => {
    const faixas = []
    grupo.forEach(e => {
      let l = faixas.findIndex(f => f <= e.ini)
      if (l < 0) { l = faixas.length; faixas.push(0) }
      faixas[l] = e.fim; e.lane = l
    })
    grupo.forEach(e => { e.lanes = faixas.length })
    grupo = []; fimGrupo = -1
  }
  for (const e of lista) {
    if (grupo.length && e.ini >= fimGrupo) fechar()
    grupo.push(e); fimGrupo = Math.max(fimGrupo, e.fim)
  }
  if (grupo.length) fechar()
  return lista
}

/** Converte a posição do ponteiro em (coluna do dia, minuto de início), com encaixe de 15 min. */
export function slotDoPonteiro({ x, y, cols, offsetY, inicioMin, fimMin, dur }) {
  let idx = cols.findIndex(c => x >= c.left && x < c.right)
  if (idx < 0) idx = x < cols[0].left ? 0 : cols.length - 1
  const bruto = ((y - cols[idx].top - offsetY) / PX_HORA) * 60 + inicioMin
  let ini = Math.round(bruto / PASSO) * PASSO
  ini = Math.max(inicioMin, Math.min(ini, fimMin - dur))
  return { idx, ini }
}

// ── Estado global do arraste (só uma agenda ativa por vez) ────
let drag = null
let suprimirClique = false
let touchmoveGlobal = false

// ── Componente ───────────────────────────────────────────────
export function renderAgendaSemanal(root, { sb = window._sb, agora = () => Date.now(), onAlterou } = {}) {
  let offsetSemanas = window._agendaOffset || 0
  let semana = []                  // 7 datas YYYY-MM-DD
  let eventos = []                 // aulas da semana já com ini/fim em minutos
  let feriados = {}                // data → nome
  let duracoes = {}                // aula_id → minutos
  let tipos = {}                   // aula_id → 'fixa' | 'avulsa'
  let faixa = { inicioMin: 6 * 60, fimMin: 22 * 60 }
  const porId = new Map()

  const hojeSP = () => partesSP(agora()).data
  const durDe = aulaId => duracoes[aulaId] || 60

  // ── Dados ──
  async function carregar() {
    const base = addDias(inicioSemana(hojeSP()), offsetSemanas * 7)
    semana = Array.from({ length: 7 }, (_, i) => addDias(base, i))
    root.innerHTML = `<div class="ag"><div class="ag__head"><span class="ag__title">Agenda da semana</span></div>
      <div class="ag__hint">Carregando agenda...</div></div>`
    const [oc, au0, fe] = await Promise.all([
      sb.from('ocorrencias_vagas').select('*')
        .gte('data_hora', isoSP(semana[0], '00:00')).lt('data_hora', isoSP(addDias(semana[6], 1), '00:00'))
        .eq('cancelada', false).order('data_hora'),
      sb.from('aulas').select('id, duracao_min, tipo'),
      sb.from('feriados').select('data, nome').gte('data', semana[0]).lte('data', semana[6]),
    ])
    // se a coluna "tipo" não existir neste banco, tenta só com a duração
    const au = au0?.error ? await sb.from('aulas').select('id, duracao_min') : au0
    if (oc.error) {
      root.innerHTML = `<div class="ag"><div class="ag__head"><span class="ag__title">Agenda da semana</span></div>
        <div class="ag__hint">Não foi possível carregar a agenda: ${esc(oc.error.message)}</div></div>`
      return
    }
    duracoes = {}; tipos = {}
    ;(au?.data || []).forEach(a => { duracoes[a.id] = a.duracao_min || 60; if (a.tipo) tipos[a.id] = a.tipo })
    feriados = {}; (fe?.data || []).forEach(f => { feriados[f.data] = f.nome })
    porId.clear()
    eventos = (oc.data || []).map(o => {
      const p = partesSP(o.data_hora)
      const ini = p.hh * 60 + p.mm
      const ev = { ...o, dia: p.data, ini, fim: ini + durDe(o.aula_id), dur: durDe(o.aula_id),
                   passada: Date.parse(o.data_hora) <= agora() }
      porId.set(o.id, ev); return ev
    })
    const mins = eventos.map(e => e.ini), maxs = eventos.map(e => e.fim)
    faixa = {
      inicioMin: Math.max(0, Math.min(6 * 60, ...mins.map(m => Math.floor(m / 60) * 60))),
      fimMin: Math.min(24 * 60, Math.max(22 * 60, ...maxs.map(m => Math.ceil(m / 60) * 60))),
    }
    desenhar()
  }

  // ── Desenho ──
  function rotuloSemana() {
    const [a, b] = [semana[0], semana[6]].map(d => ({ d: +d.slice(8), m: MESES[+d.slice(5, 7) - 1], y: d.slice(0, 4) }))
    return a.m === b.m ? `${a.d} – ${b.d} de ${a.m} de ${a.y}` : `${a.d} ${a.m} – ${b.d} ${b.m} de ${b.y}`
  }

  function blocoHTML(ev) {
    const cor = CORES[ev.modalidade] || '#888'
    const alt = Math.max(28, (ev.dur / 60) * PX_HORA - 2)
    const top = ((ev.ini - faixa.inicioMin) / 60) * PX_HORA
    const w = 100 / ev.lanes
    const nome = NOMES[ev.modalidade] || ev.modalidade
    const conf = Number(ev.confirmados || 0)
    const rotulo = `${nome}, ${DIAS_LONGO[dowDe(ev.dia)]} ${hhmm(ev.ini)} às ${hhmm(ev.fim)}, ${conf} de ${ev.vagas_total ?? '?'} confirmados`
      + (ev.passada ? '. Já começou, não pode ser movida.' : '. Arraste ou pressione Enter para mover.')
    return `<button type="button" class="ag-ev ${ev.passada ? 'ag-ev--passada' : ''}" data-id="${esc(ev.id)}"
        style="--c:${cor};top:${top}px;height:${alt}px;left:calc(${ev.lane * w}% + 2px);width:calc(${w}% - 4px)"
        aria-label="${esc(rotulo)}" ${ev.passada ? 'aria-disabled="true"' : ''}>
      <span class="ag-ev__t">${esc(nome)}</span>
      <span class="ag-ev__h">${hhmm(ev.ini)}–${hhmm(ev.fim)}</span>
      ${alt >= 64 ? `<span class="ag-ev__h">${conf}/${esc(ev.vagas_total ?? '?')}${ev.professor_nome ? ' · ' + esc(ev.professor_nome.split(' ')[0]) : ''}</span>` : ''}
    </button>`
  }

  function desenhar() {
    const altTotal = ((faixa.fimMin - faixa.inicioMin) / 60) * PX_HORA
    const hoje = hojeSP(), p = partesSP(agora())
    const agoraMin = p.hh * 60 + p.mm
    const horas = []
    for (let m = faixa.inicioMin; m <= faixa.fimMin; m += 60)
      horas.push(`<span class="ag__hora" style="top:${((m - faixa.inicioMin) / 60) * PX_HORA}px">${hhmm(m)}</span>`)

    const colunas = semana.map(dia => {
      const doDia = layoutLanes(eventos.filter(e => e.dia === dia))
      const passadoOv = dia < hoje ? altTotal
        : dia === hoje ? Math.max(0, Math.min(altTotal, ((agoraMin - faixa.inicioMin) / 60) * PX_HORA)) : 0
      const linhaAgora = dia === hoje && agoraMin >= faixa.inicioMin && agoraMin <= faixa.fimMin
        ? `<div class="ag__agora" style="top:${((agoraMin - faixa.inicioMin) / 60) * PX_HORA}px"></div>` : ''
      return `<div class="ag__col" data-dia="${dia}" style="height:${altTotal}px">
        ${passadoOv ? `<div class="ag__passado" style="height:${passadoOv}px"></div>` : ''}
        ${linhaAgora}${doDia.map(blocoHTML).join('')}</div>`
    }).join('')

    const cabecalhos = semana.map(dia => `
      <div class="ag__dh ${dia === hoje ? 'ag__dh--hoje' : ''}">${DIAS_CURTO[dowDe(dia)]}
        <strong>${+dia.slice(8)}</strong>
        ${feriados[dia] ? `<span class="ag__fer" title="${esc(feriados[dia])}">Feriado</span>` : ''}
      </div>`).join('')

    root.innerHTML = `
      <section class="ag" aria-label="Agenda da semana">
        <div class="ag__head">
          <div>
            <h3 class="ag__title">Agenda da semana</h3>
            <div class="ag__range">${esc(rotuloSemana())}</div>
          </div>
          <div class="ag__nav">
            <button type="button" class="ui-btn ui-btn--secondary" data-nav="-1" aria-label="Semana anterior"><i class="ti ti-chevron-left" aria-hidden="true"></i></button>
            <button type="button" class="ui-btn ui-btn--secondary" data-nav="0">Hoje</button>
            <button type="button" class="ui-btn ui-btn--secondary" data-nav="1" aria-label="Próxima semana"><i class="ti ti-chevron-right" aria-hidden="true"></i></button>
          </div>
        </div>
        <p class="ag__hint">Arraste uma aula para outro dia ou horário (no celular, segure e arraste). Sem mouse, clique ou pressione Enter na aula para escolher a data e a hora.</p>
        <div class="ag__scroll">
          <div class="ag__grid">
            <div class="ag__corner"></div>${cabecalhos}
            <div class="ag__gutter" style="height:${altTotal}px">${horas.join('')}</div>${colunas}
          </div>
        </div>
      </section>`
    root.querySelector('.ag__grid').style.setProperty('--ag-h', PX_HORA + 'px')
  }

  // ── Mover ──
  const ddmm = d => `${d.slice(8)}/${d.slice(5, 7)}`

  function erroRPC(error) {
    const msg = error.code === '23505' ? (error.message?.includes('modelo') ? error.message : 'Essa aula já existe nesse horário.')
      : error.code === '42501' ? 'Somente administradores podem mover aulas.'
      : error.code === '22023' ? error.message
      : 'Erro ao mover: ' + error.message
    window.toast?.(msg, 5000)
    return false
  }

  async function copiar(texto) {
    try { await navigator.clipboard.writeText(texto); return true } catch { /* tenta o método antigo */ }
    const ta = document.createElement('textarea')
    ta.value = texto; ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta); ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    ta.remove(); return ok
  }

  async function mover(ev, destino) {
    const novoISO = isoSP(destino.data, destino.hora)
    const novoMs = Date.parse(novoISO)
    if (Number.isNaN(novoMs)) { window.toast?.('Data ou hora inválida.'); return false }
    if (novoMs <= agora()) { window.toast?.('Não é possível mover uma aula para um horário que já passou.', 4000); return false }
    if (novoMs === Date.parse(ev.data_hora)) return false

    const nome = NOMES[ev.modalidade] || ev.modalidade
    const conf = Number(ev.confirmados || 0)
    const fixa = tipos[ev.aula_id] !== 'avulsa'            // desconhecido conta como fixa; o banco confere
    const origem = `${DIAS_LONGO[dowDe(ev.dia)]} ${hhmm(ev.ini)}`
    const alvo = `${DIAS_LONGO[dowDe(destino.data)]} ${destino.hora}`

    // 1) Escopo e aviso aos alunos
    let escopo = 'esta', avisar = true
    if (fixa || conf > 0) {
      const r = await escolhaModal({
        titulo: 'Mover aula',
        texto: `${nome}: ${origem} → ${alvo}`,
        opcoes: fixa ? [
          { valor: 'esta', rotulo: 'Somente esta aula',
            descricao: `Só a aula de ${ddmm(ev.dia)} muda. As outras continuam no horário de sempre.` },
          { valor: 'serie', rotulo: 'Todas as aulas desta série',
            descricao: `Esta e todas as próximas aulas de ${DIAS_LONGO[dowDe(ev.dia)]}s às ${hhmm(ev.ini)} passam para ${DIAS_LONGO[dowDe(destino.data)]}s às ${destino.hora}. O horário-modelo da aula também muda. Aulas já dadas não são alteradas.` },
        ] : null,
        marcar: { rotulo: conf > 0 ? `Avisar no app os ${conf} aluno(s) confirmado(s)` : 'Avisar no app os alunos confirmados', marcado: true },
        confirmar: 'Mover',
      })
      if (!r) return false
      escopo = r.opcao || 'esta'; avisar = r.marcado
    }

    // 2) Banco: valida, mede conflitos e aplica (1ª chamada sem confirmar)
    const chamar = confirmado => sb.rpc('agenda_mover_aula', {
      p_ocorrencia: ev.id, p_novo: novoISO, p_escopo: escopo, p_avisar: avisar, p_confirmado: confirmado,
    })
    let { data, error } = await chamar(false)
    if (error) return erroRPC(error)
    if (data?.precisa_confirmar) {
      const ok = await confirmarModal({ titulo: 'Mover mesmo assim?', texto: data.avisos.join('\n\n'), confirmar: 'Mover aula' })
      if (!ok) return false
      ;({ data, error } = await chamar(true))
      if (error) return erroRPC(error)
    }
    if (!data?.ok) { window.toast?.('Não foi possível mover a aula.', 4000); return false }

    // 3) Aviso com Desfazer e texto para o WhatsApp
    const hoje = hojeSP()
    const tocaHoje = ev.dia === hoje || destino.data === hoje
    const avisados = Number(data.alunos_avisados || 0)
    avisoComAcao({
      texto: (escopo === 'serie'
          ? `Série de ${nome}: ${data.movidas} aula(s) movida(s) para ${DIAS_LONGO[dowDe(destino.data)]}s às ${destino.hora}.`
          : `${nome} movida para ${alvo}.`)
        + (avisados > 0 ? ` ${avisados} aluno(s) avisado(s) no app.`
           : conf > 0 && !avisar ? ' Os confirmados não foram avisados.' : ''),
      acao: 'Desfazer',
      aoClicar: async () => {
        const { data: d2, error: e2 } = await sb.rpc('agenda_desfazer_mover', { p_desfazer: data.desfazer })
        if (e2 || !d2?.ok) { window.toast?.('Não foi possível desfazer.', 4000); return }
        window.toast?.('Movimento desfeito.')
        await carregar(); if (tocaHoje) onAlterou?.()
      },
      acao2: data.texto_whatsapp ? 'Copiar aviso' : undefined,
      aoClicar2: async () => ((await copiar(data.texto_whatsapp)) ? 'Copiado' : 'Não foi possível copiar'),
      duracao: 12000,
    })
    await carregar()
    if (tocaHoje) onAlterou?.()
    return true
  }

  async function abrirMover(ev) {
    if (ev.passada) { window.toast?.('Aulas que já começaram não podem ser movidas.', 3500); return }
    // quem está inscrito (mesma consulta da tela de chamada): ajuda a ver quem será afetado
    let inscritos = ''
    try {
      const { data: turma } = await sb.from('confirmacoes')
        .select('status, aluno:perfis!aluno_id(nome)')
        .eq('ocorrencia_id', ev.id).neq('status', 'cancelado').order('confirmado_em')
      const nomes = (turma || []).map(c => c.aluno?.nome || 'Aluno removido')
      if (nomes.length) inscritos = `\nInscritos: ${nomes.slice(0, 12).join(', ')}${nomes.length > 12 ? ` e mais ${nomes.length - 12}` : ''}`
    } catch { /* sem a lista, o diálogo continua funcionando */ }
    const v = await formularioModal({
      titulo: 'Mover aula',
      texto: `${NOMES[ev.modalidade] || ev.modalidade} · ${ev.professor_nome || 'sem professor'} · ${Number(ev.confirmados || 0)} confirmado(s)${inscritos}`,
      campos: [
        { id: 'data', label: 'Data', tipo: 'date', valor: ev.dia, obrigatorio: true },
        { id: 'hora', label: 'Hora', tipo: 'time', valor: hhmm(ev.ini), obrigatorio: true },
      ],
      confirmar: 'Mover',
    })
    if (v) await mover(ev, { data: v.data, hora: v.hora })
  }

  // ── Arrastar ──
  const colunasEl = () => [...root.querySelectorAll('.ag__col')]
  const retangulos = () => colunasEl().map(c => { const r = c.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top } })

  function slotAtual(x, y) {
    return slotDoPonteiro({ x, y, cols: retangulos(), offsetY: drag.offsetY, inicioMin: faixa.inicioMin, fimMin: faixa.fimMin, dur: drag.ev.dur })
  }
  const slotInvalido = slot => Date.parse(isoSP(semana[slot.idx], hhmm(slot.ini))) <= agora()

  function iniciarArraste() {
    if (!drag || drag.ativo) return
    drag.ativo = true
    drag.el.classList.add('ag-ev--arrastando')
    document.body.classList.add('ag-arrastando')
    const g = document.createElement('div')
    g.className = 'ag-ghost'
    g.style.setProperty('--c', CORES[drag.ev.modalidade] || '#888')
    g.style.height = Math.max(28, (drag.ev.dur / 60) * PX_HORA - 2) + 'px'
    drag.ghost = g
    navigator.vibrate?.(8)
    atualizarGhost(drag.x0, drag.y0)
  }

  function atualizarGhost(x, y) {
    const slot = slotAtual(x, y)
    const col = colunasEl()[slot.idx]
    if (drag.ghost.parentElement !== col) col.appendChild(drag.ghost)
    drag.ghost.style.top = ((slot.ini - faixa.inicioMin) / 60) * PX_HORA + 'px'
    drag.ghost.textContent = `${DIAS_CURTO[dowDe(semana[slot.idx])]} ${hhmm(slot.ini)}–${hhmm(slot.ini + drag.ev.dur)}`
    drag.ghost.classList.toggle('ag-ghost--invalido', slotInvalido(slot))
    drag.slot = slot
  }

  function limparArraste() {
    if (!drag) return
    clearTimeout(drag.timer)
    drag.ghost?.remove()
    drag.el.classList.remove('ag-ev--arrastando')
    document.body.classList.remove('ag-arrastando')
    document.removeEventListener('pointermove', aoMover)
    document.removeEventListener('pointerup', aoSoltar)
    document.removeEventListener('pointercancel', aoCancelar)
  }

  function aoMover(e) {
    if (!drag || (drag.id != null && e.pointerId != null && e.pointerId !== drag.id)) return
    const dist = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0)
    if (!drag.ativo) {
      if (drag.toque) { if (dist > 10) { limparArraste(); drag = null } return }   // era rolagem
      if (dist > 5) iniciarArraste(); else return
    }
    atualizarGhost(e.clientX, e.clientY)
  }

  async function aoSoltar(e) {
    if (!drag) return
    const d = drag, ativo = d.ativo
    if (ativo) { suprimirClique = true; setTimeout(() => { suprimirClique = false }, 60) }
    const slot = ativo ? slotAtual(e.clientX ?? d.x0, e.clientY ?? d.y0) : null
    limparArraste(); drag = null
    if (!ativo || !slot) return
    if (slotInvalido(slot)) { window.toast?.('Não é possível mover uma aula para um horário que já passou.', 4000); return }
    await mover(d.ev, { data: semana[slot.idx], hora: hhmm(slot.ini) })
  }

  function aoCancelar() { limparArraste(); drag = null }

  if (!root.dataset.agPronto) {
    root.dataset.agPronto = '1'

    root.addEventListener('pointerdown', e => {
      const el = e.target.closest?.('.ag-ev')
      if (!el || (e.pointerType === 'mouse' && e.button !== 0)) return
      const ev = porId.get(el.dataset.id)
      if (!ev || ev.passada) return
      drag = {
        ev, el, id: e.pointerId, x0: e.clientX, y0: e.clientY, ativo: false, toque: e.pointerType === 'touch',
        offsetY: e.clientY - el.getBoundingClientRect().top,
      }
      if (drag.toque) drag.timer = setTimeout(() => { if (drag && !drag.ativo) iniciarArraste() }, 320)
      document.addEventListener('pointermove', aoMover)
      document.addEventListener('pointerup', aoSoltar)
      document.addEventListener('pointercancel', aoCancelar)
    })

    // Depois de segurar no toque, impede a página de rolar enquanto arrasta (ouvinte único)
    if (!touchmoveGlobal) {
      touchmoveGlobal = true
      document.addEventListener('touchmove', e => { if (drag?.ativo && e.cancelable) e.preventDefault() }, { passive: false })
    }

    root.addEventListener('click', e => {
      const nav = e.target.closest?.('[data-nav]')
      if (nav) {
        offsetSemanas = nav.dataset.nav === '0' ? 0 : offsetSemanas + Number(nav.dataset.nav)
        window._agendaOffset = offsetSemanas
        carregar(); return
      }
      const el = e.target.closest?.('.ag-ev')
      if (!el) return
      if (suprimirClique) { e.preventDefault(); return }
      const ev = porId.get(el.dataset.id)
      if (ev) abrirMover(ev)
    })
  }

  return carregar()
}
