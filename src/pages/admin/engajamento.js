/**
 * src/pages/admin/engajamento.js
 * Dashboard de engajamento dos alunos — score 0-100 composto por 5 sinais:
 *   Presença (30 pts) · Timeline (20 pts) · Uso de saldo (20 pts) ·
 *   Acesso a benefícios (15 pts) · Login recente (15 pts)
 *
 * Cada sinal é calculado direto das tabelas de origem (não depende de
 * gamificacao.prana_points, cuja lógica de atualização não foi confirmada
 * em código — ver conversa de definição deste dashboard).
 */

import { toast } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'

const JANELA_DIAS = 30

const PESO_TIMELINE = { curtida: 1.5, comentario: 4, salvo: 2, visualizacao: 1 }

function fmtDataHora(iso) {
  return iso ? new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—'
}

function diasDesde(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

let _ultimoContainer = null

export async function renderEngajamento(container, page) {
  const sb = window._sb
  _ultimoContainer = container
  window._rerenderEngajamento = () => renderEngajamento(_ultimoContainer, 'engajamento')

  const hoje = new Date()
  const desde = new Date(hoje.getTime() - JANELA_DIAS * 86400000)
  const desdeISO = desde.toISOString()
  const desdeData = desde.toISOString().slice(0, 10)

  container.innerHTML = `<div class="loading-page" style="padding:60px 0"><div class="spin-big"></div></div>`

  const [
    perfisRes, matriculasRes, saldoRes,
    confsRes, curtidasRes, comentariosRes, salvosRes, visualizacoesRes,
    acessosRes,
  ] = await Promise.all([
    sb.from('perfis').select('id,nome,ultimo_acesso').eq('tipo', 'aluno').eq('ativo', true).order('nome'),
    sb.from('matriculas').select('aluno_id,plano_tipo,opcao_aulas').eq('ativa', true),
    sb.from('saldo_disponivel').select('aluno_id,saldo_total,total_usadas'),
    sb.from('confirmacoes').select('aluno_id,status').gte('criado_em', desdeISO),
    sb.from('timeline_curtidas').select('perfil_id').gte('criado_em', desdeISO),
    sb.from('timeline_comentarios').select('autor_id').gte('criado_em', desdeISO),
    sb.from('timeline_salvos').select('perfil_id').gte('criado_em', desdeISO),
    sb.from('timeline_visualizacoes').select('perfil_id').gte('visualizado_em', desdeISO),
    sb.from('beneficio_acessos').select('aluno_id,beneficio').gte('dia', desdeData),
  ])

  const erroCritico = perfisRes.error || matriculasRes.error
  if (erroCritico) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Engajamento</div></div>
      <div class="content"><p style="color:#c0392b;font-size:13px">Erro: ${erroCritico.message}</p></div>`
    return
  }

  const alunos = perfisRes.data || []
  const matPorAluno = Object.fromEntries((matriculasRes.data || []).map(m => [m.aluno_id, m]))
  const saldoPorAluno = Object.fromEntries((saldoRes.data || []).map(s => [s.aluno_id, s]))

  // ── Agregações client-side (mesmo padrão já usado em pagamentos.js/alunos.js) ──
  function agrupar(rows, campo) {
    const mapa = {}
    for (const r of rows || []) {
      const id = r[campo]
      if (!id) continue
      mapa[id] = (mapa[id] || 0) + 1
    }
    return mapa
  }

  const presPorAluno = {}
  for (const c of (confsRes.data || [])) {
    if (!c.aluno_id) continue
    if (!presPorAluno[c.aluno_id]) presPorAluno[c.aluno_id] = { confirmado: 0, presente: 0, ausente: 0 }
    if (presPorAluno[c.aluno_id][c.status] !== undefined) presPorAluno[c.aluno_id][c.status]++
  }
  const curtidasPorAluno   = agrupar(curtidasRes.data, 'perfil_id')
  const comentariosPorAluno = agrupar(comentariosRes.data, 'autor_id')
  const salvosPorAluno     = agrupar(salvosRes.data, 'perfil_id')
  const visualizacoesPorAluno = agrupar(visualizacoesRes.data, 'perfil_id')

  const acessosPorAluno = {}
  for (const a of (acessosRes.data || [])) {
    if (!a.aluno_id) continue
    if (!acessosPorAluno[a.aluno_id]) acessosPorAluno[a.aluno_id] = { asana_marga: 0, jnana_marga: 0, yoga_adhyayana: 0 }
    if (acessosPorAluno[a.aluno_id][a.beneficio] !== undefined) acessosPorAluno[a.aluno_id][a.beneficio]++
  }

  // Raw de timeline por aluno, para normalizar depois pelo máximo observado no grupo
  const timelineRawPorAluno = {}
  let maxTimelineRaw = 0
  for (const a of alunos) {
    const raw =
      (curtidasPorAluno[a.id] || 0) * PESO_TIMELINE.curtida +
      (comentariosPorAluno[a.id] || 0) * PESO_TIMELINE.comentario +
      (salvosPorAluno[a.id] || 0) * PESO_TIMELINE.salvo +
      (visualizacoesPorAluno[a.id] || 0) * PESO_TIMELINE.visualizacao
    timelineRawPorAluno[a.id] = raw
    if (raw > maxTimelineRaw) maxTimelineRaw = raw
  }

  // ── Cálculo do score por aluno ──────────────────────────────
  const linhas = alunos.map(a => {
    const mat = matPorAluno[a.id]
    const ehLivre = mat?.plano_tipo === 'vishnu_livre' || mat?.opcao_aulas === 99
    const saldo = saldoPorAluno[a.id]
    const pres = presPorAluno[a.id] || { confirmado: 0, presente: 0, ausente: 0 }
    const totalConfirmadas = pres.confirmado + pres.presente + pres.ausente
    const acessos = acessosPorAluno[a.id] || { asana_marga: 0, jnana_marga: 0, yoga_adhyayana: 0 }
    const diasAcesso = diasDesde(a.ultimo_acesso)

    // Presença (30 pts): % de comparecimento real sobre confirmações no período.
    // Sem confirmações no período = sem dado, não penaliza (null → tratado como 0 no total,
    // mas sinalizado visualmente como "sem dados").
    const presencaScore = totalConfirmadas > 0
      ? (pres.presente / totalConfirmadas) * 30
      : null

    // Timeline (20 pts): normalizado pelo maior valor observado entre todos os alunos,
    // pra um aluno muito ativo não estourar a escala sozinho.
    const timelineScore = maxTimelineRaw > 0
      ? (timelineRawPorAluno[a.id] / maxTimelineRaw) * 20
      : 0

    // Uso de saldo (20 pts): penaliza crédito parado. Plano livre não se aplica (nota cheia).
    let saldoScore
    if (ehLivre) {
      saldoScore = 20
    } else if (saldo && (saldo.total_usadas + saldo.saldo_total) > 0) {
      saldoScore = (saldo.total_usadas / (saldo.total_usadas + saldo.saldo_total)) * 20
    } else {
      saldoScore = null // sem matrícula/saldo carregado ainda
    }

    // Benefícios (15 pts): 1 ponto por dia distinto de acesso a qualquer benefício, até 15.
    const totalDiasBeneficio = acessos.asana_marga + acessos.jnana_marga + acessos.yoga_adhyayana
    const beneficioScore = Math.min(15, totalDiasBeneficio)

    // Login recente (15 pts): decai a partir de hoje, chega a 0 com 15+ dias sem acessar.
    const loginScore = diasAcesso === null ? 0 : Math.max(0, 15 - diasAcesso)

    const total = (presencaScore ?? 0) + timelineScore + (saldoScore ?? 0) + beneficioScore + loginScore

    return {
      id: a.id, nome: a.nome,
      presencaScore, timelineScore, saldoScore, beneficioScore, loginScore, total,
      pres, curtidas: curtidasPorAluno[a.id] || 0, comentarios: comentariosPorAluno[a.id] || 0,
      salvos: salvosPorAluno[a.id] || 0, visualizacoes: visualizacoesPorAluno[a.id] || 0,
      acessos, diasAcesso, ultimoAcesso: a.ultimo_acesso, ehLivre,
      saldoAtual: saldo?.saldo_total ?? null, totalUsadas: saldo?.total_usadas ?? null,
    }
  })

  const sortAtual = window._engSort || 'total_desc'
  linhas.sort((x, y) => {
    const [campo, dir] = sortAtual.split('_')
    const mult = dir === 'asc' ? 1 : -1
    if (campo === 'nome') return x.nome.localeCompare(y.nome) * mult
    return ((x[campo + 'Score'] ?? (campo === 'total' ? x.total : 0)) - (y[campo + 'Score'] ?? (campo === 'total' ? y.total : 0))) * mult
  })

  function cabecalhoOrdenavel(label, campo) {
    const ativo = sortAtual.startsWith(campo)
    const seta = ativo ? (sortAtual.endsWith('asc') ? '↑' : '↓') : '↕'
    const proximo = ativo && sortAtual.endsWith('desc') ? `${campo}_asc` : `${campo}_desc`
    return `<span onclick="window._engSort='${proximo}';window._rerenderEngajamento()" style="cursor:pointer">${label} ${seta}</span>`
  }

  function corScore(v) {
    if (v === null) return 'var(--txt2)'
    if (v >= 70) return '#1a5a1a'
    if (v >= 40) return '#7a5a10'
    return '#8a1a1a'
  }

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Engajamento</div>
      <button onclick="window._gerarRelatorioEngajamento()"
        style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:6px">
        <i class="ti ti-download"></i> Gerar relatório
      </button>
    </div>
    <div class="content">
      <div style="background:rgba(31,56,31,.04);border:1px solid rgba(31,56,31,.12);border-radius:6px;padding:9px 13px;font-size:11px;color:var(--verde);margin-bottom:14px;display:flex;align-items:center;gap:8px">
        <i class="ti ti-info-circle"></i>
        <span>Score 0-100, últimos ${JANELA_DIAS} dias · Presença 30 · Timeline 20 · Saldo 20 · Benefícios 15 · Login 15</span>
      </div>

      <div style="overflow-x:auto">
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden;min-width:760px">
        <div style="display:grid;grid-template-columns:1.4fr 90px 90px 90px 90px 90px 90px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:8px">
          <span>${cabecalhoOrdenavel('Aluno', 'nome')}</span>
          <span>${cabecalhoOrdenavel('Presença', 'presenca')}</span>
          <span>${cabecalhoOrdenavel('Timeline', 'timeline')}</span>
          <span>${cabecalhoOrdenavel('Saldo', 'saldo')}</span>
          <span>${cabecalhoOrdenavel('Benefícios', 'beneficio')}</span>
          <span>${cabecalhoOrdenavel('Login', 'login')}</span>
          <span>${cabecalhoOrdenavel('Total', 'total')}</span>
        </div>
        ${linhas.length === 0
          ? '<div style="padding:24px 18px;font-size:12px;color:var(--txt2)">Nenhum aluno encontrado.</div>'
          : linhas.map(l => `
            <div style="display:grid;grid-template-columns:1.4fr 90px 90px 90px 90px 90px 90px;align-items:center;gap:8px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px;cursor:pointer"
                 onclick="window._abrirDetalheEngajamento('${l.id}')">
              <span style="font-weight:500">${l.nome}</span>
              <span style="color:${corScore(l.presencaScore)}">${l.presencaScore === null ? '—' : l.presencaScore.toFixed(1)}</span>
              <span style="color:${corScore(l.timelineScore)}">${l.timelineScore.toFixed(1)}</span>
              <span style="color:${corScore(l.saldoScore)}">${l.saldoScore === null ? '—' : l.saldoScore.toFixed(1)}</span>
              <span style="color:${corScore(l.beneficioScore)}">${l.beneficioScore.toFixed(1)}</span>
              <span style="color:${corScore(l.loginScore)}">${l.loginScore.toFixed(1)}</span>
              <span style="font-weight:600;color:${corScore(l.total)}">${l.total.toFixed(1)}</span>
            </div>`).join('')
        }
      </div>
      </div>
    </div>

    <div id="modal-detalhe-engajamento" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);z-index:200;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:12px;width:480px;max-width:100%;max-height:85vh;overflow-y:auto">
        <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)" id="det-eng-titulo">—</div>
          <button onclick="document.getElementById('modal-detalhe-engajamento').style.display='none'" style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
        </div>
        <div id="det-eng-body" style="padding:20px"></div>
      </div>
    </div>
  `
  uiAnimar(container)

  window._abrirDetalheEngajamento = function(alunoId) {
    const l = linhas.find(x => x.id === alunoId)
    if (!l) return
    document.getElementById('det-eng-titulo').textContent = l.nome
    document.getElementById('det-eng-body').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;margin-bottom:6px">Presença (peso 30) — ${l.presencaScore === null ? 'sem dados no período' : l.presencaScore.toFixed(1) + ' pts'}</div>
          <div style="font-size:12px;color:var(--txt)">Confirmado: ${l.pres.confirmado} · Presente: ${l.pres.presente} · Ausente: ${l.pres.ausente}</div>
        </div>
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;margin-bottom:6px">Timeline (peso 20) — ${l.timelineScore.toFixed(1)} pts</div>
          <div style="font-size:12px;color:var(--txt)">❤️ ${l.curtidas} curtidas · 💬 ${l.comentarios} comentários · 🔖 ${l.salvos} salvos · 👁 ${l.visualizacoes} visualizações</div>
        </div>
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;margin-bottom:6px">Uso de saldo (peso 20) — ${l.saldoScore === null ? 'sem dados' : l.saldoScore.toFixed(1) + ' pts'}</div>
          <div style="font-size:12px;color:var(--txt)">${l.ehLivre ? 'Plano livre — não se aplica' : `Saldo parado: ${l.saldoAtual ?? '—'} · Usadas: ${l.totalUsadas ?? '—'}`}</div>
        </div>
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;margin-bottom:6px">Benefícios (peso 15) — ${l.beneficioScore.toFixed(1)} pts</div>
          <div style="font-size:12px;color:var(--txt)">Āsana Mārga: ${l.acessos.asana_marga}d · Jñāna Mārga: ${l.acessos.jnana_marga}d · Yoga Adhyayana: ${l.acessos.yoga_adhyayana}d</div>
        </div>
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;margin-bottom:6px">Login recente (peso 15) — ${l.loginScore.toFixed(1)} pts</div>
          <div style="font-size:12px;color:var(--txt)">Último acesso: ${fmtDataHora(l.ultimoAcesso)}${l.diasAcesso !== null ? ` (há ${l.diasAcesso} dia${l.diasAcesso !== 1 ? 's' : ''})` : ''}</div>
        </div>
        <div style="background:var(--verde);border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px;color:rgba(242,236,206,.7);text-transform:uppercase;letter-spacing:.7px">Score total</span>
          <span style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:var(--bege)">${l.total.toFixed(1)} / 100</span>
        </div>
      </div>
    `
    document.getElementById('modal-detalhe-engajamento').style.display = 'flex'
  }

  window._gerarRelatorioEngajamento = function() {
    const linhasOrdenadas = [...linhas].sort((a, b) => b.total - a.total)
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="UTF-8">
      <title>Relatório de Engajamento — Espaço Autonomia</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
      <style>
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;font-size:11px;color:#1F381F;background:#fff;padding:24px 28px;max-width:900px;margin:0 auto}
        h1{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;margin-bottom:4px}
        .meta{font-size:10px;color:#7a7a6a;margin-bottom:18px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:#f2ecce;text-align:left;padding:7px 10px;font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:#555}
        td{padding:7px 10px;border-bottom:1px solid #e8e4d8}
        tr:nth-child(even) td{background:#fafaf7}
        .total{font-weight:600}
        .rodape{margin-top:18px;padding-top:8px;border-top:1px solid #d4c89e;font-size:9px;color:#aaa;text-align:center}
        @media print{ @page{margin:1cm;size:A4 landscape} body{padding:0} }
      </style>
    </head><body>
      <h1>Relatório de Engajamento</h1>
      <div class="meta">Últimos ${JANELA_DIAS} dias · gerado em ${new Date().toLocaleDateString('pt-BR')} · Espaço Autonomia</div>
      <table>
        <tr><th>Aluno</th><th>Presença</th><th>Timeline</th><th>Saldo</th><th>Benefícios</th><th>Login</th><th>Total</th></tr>
        ${linhasOrdenadas.map(l => `
          <tr>
            <td>${l.nome}</td>
            <td>${l.presencaScore === null ? '—' : l.presencaScore.toFixed(1)}</td>
            <td>${l.timelineScore.toFixed(1)}</td>
            <td>${l.saldoScore === null ? '—' : l.saldoScore.toFixed(1)}</td>
            <td>${l.beneficioScore.toFixed(1)}</td>
            <td>${l.loginScore.toFixed(1)}</td>
            <td class="total">${l.total.toFixed(1)}</td>
          </tr>`).join('')}
      </table>
      <div class="rodape">Espaço Autonomia · Dharma Phala · Score calculado a partir de presença real, atividade na timeline, uso do saldo de aulas, acesso aos benefícios e recência de login.</div>
      <script>window.onload = () => window.print()<\/script>
    </body></html>`)
    win.document.close()
  }
}
