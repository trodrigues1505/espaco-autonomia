/**
 * src/pages/admin/pagamentos.js
 * Painel de pagamentos — dados do banco + sync com API Asaas
 *
 * Desde 15/07/2026, esta tela também pode ser embutida como uma aba dentro
 * de src/pages/admin/alunos.js. Para isso, todo auto-refresh interno que
 * antes chamava navigate('pagamentos') (o que redesenharia a página inteira,
 * perdendo o contexto de abas) agora chama window._rerenderPagamentos(), que
 * apenas re-renderiza no container em que esta tela foi originalmente
 * montada — funciona tanto embutida quanto acessada isoladamente.
 */

import '../../acoes/pages-admin-pagamentos.js'   // handlers (antes: eventos inline; ver ferramentas/verifica-handlers.mjs)
import { sb as _sbAuth } from '../../lib/supabase.js'
import { toast, esc } from '../../modules/utils.js'

import { uiAnimar } from '../../modules/ui.js'
// Correção (mesmo bug encontrado em previsao-professor.js): esta tela nunca
// integrou o painel de notificações, mesmo estando listada em
// admin_pagamentos_vencidos.paginas (notificacoes.js).
import { carregarNotificacoes, renderPainelNotif, initNotifHandlers,
         calcularBadgesMenu, aplicarBadgesMenu } from '../../modules/notificacoes.js'

const FN_URL   = 'https://kctgcjvfsuinwlbgljdw.supabase.co/functions/v1/asaas-proxy'

let _ultimoContainer = null

function fmtR(v) { return 'R$' + (v||0).toFixed(2).replace('.',',') }
function fmtData(d) { return d ? new Date(d+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '—' }
function nomeMes(ym) {
  const [y,m] = ym.split('-')
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return nomes[Number(m)-1] + '/' + y.slice(2)
}

const STATUS_LABEL = {RECEIVED:'Recebido',CONFIRMED:'Confirmado',OVERDUE:'Vencido',PENDING:'Aguardando',CANCELLED:'Cancelado',REFUNDED:'Devolvido'}
const STATUS_BG    = {RECEIVED:'var(--ok-bg)',CONFIRMED:'var(--ok-bg)',OVERDUE:'var(--err-bg)',PENDING:'rgba(232,188,79,.15)',CANCELLED:'var(--neutro-bg)',REFUNDED:'var(--neutro-bg)'}
const STATUS_COR   = {RECEIVED:'var(--ok-fg)',CONFIRMED:'var(--ok-fg)',OVERDUE:'var(--err-fg)',PENDING:'var(--warn-fg)',CANCELLED:'var(--txt2)',REFUNDED:'var(--txt2)'}

async function asaasProxy(path) {
  // O proxy exige o token do usuário logado (admin) — não mais a anon key.
  const { data: { session } } = await _sbAuth.auth.getSession()
  if (!session?.access_token) throw new Error('Sessão expirada. Faça login novamente.')
  const r = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
    body: JSON.stringify({ path })
  })
  if (!r.ok) throw new Error('Asaas proxy ' + r.status)
  return r.json()
}

async function syncAsaas(sbClient) {
  const hoje = new Date()
  const de  = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().slice(0,10)
  const ate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0,10)

  let todos = [], offset = 0
  while (true) {
    const data = await asaasProxy(`/payments?limit=100&offset=${offset}&dueDateStart=${de}&dueDateFinish=${ate}`)
    todos = todos.concat(data.data || [])
    if (!data.hasMore) break
    offset += 100
  }

  // Vencidos históricos
  const vencRes = await asaasProxy('/payments?limit=100&offset=0&status=OVERDUE')
  const idsVistos = new Set(todos.map(p => p.id))
  for (const p of (vencRes.data || [])) {
    if (!idsVistos.has(p.id)) { todos.push(p); idsVistos.add(p.id) }
  }

  // Auto-link via cobranças
  const customerIds = [...new Set(todos.map(p => p.customer).filter(Boolean))]
  const { data: perfisComId } = await sbClient
    .from('perfis')
    .select('id, email, asaas_customer_id')
    .not('asaas_customer_id', 'is', null)
  const jaVinculados = new Set((perfisComId || []).map(p => p.asaas_customer_id))
  const novosIds = customerIds.filter(id => !jaVinculados.has(id))
  if (novosIds.length > 0) {
    const { data: perfisSemId } = await sbClient.from('perfis').select('id, email').is('asaas_customer_id', null)
    const perfilPorEmail = Object.fromEntries((perfisSemId || []).map(p => [p.email.toLowerCase(), p.id]))
    for (const customerId of novosIds) {
      try {
        const clienteAsaas = await asaasProxy(`/customers/${customerId}`)
        if (clienteAsaas?.email) {
          const emailNorm = clienteAsaas.email.toLowerCase()
          const perfilId = perfilPorEmail[emailNorm]
          if (perfilId) {
            await sbClient.from('perfis').update({ asaas_customer_id: customerId }).eq('id', perfilId)
            jaVinculados.add(customerId)
          }
        }
      } catch(e) {}
    }
  }

  // Auto-link global — varre todos os customers do Asaas
  const { data: todosPerfis } = await sbClient.from('perfis').select('id, email, asaas_customer_id').eq('tipo', 'aluno')
  const perfilPorEmailGlobal = Object.fromEntries(
    (todosPerfis || []).filter(p => !p.asaas_customer_id).map(p => [p.email.toLowerCase(), p.id])
  )
  if (Object.keys(perfilPorEmailGlobal).length > 0) {
    let offsetCustomers = 0
    while (true) {
      const clientesPage = await asaasProxy(`/customers?limit=100&offset=${offsetCustomers}`)
      for (const cliente of (clientesPage.data || [])) {
        if (!cliente.email) continue
        const emailNorm = cliente.email.toLowerCase()
        const perfilId = perfilPorEmailGlobal[emailNorm]
        if (perfilId) {
          await sbClient.from('perfis').update({ asaas_customer_id: cliente.id }).eq('id', perfilId)
          delete perfilPorEmailGlobal[emailNorm]
        }
      }
      if (!clientesPage.hasMore) break
      offsetCustomers += 100
    }
  }

  // Delete + insert
  const asaasIds = todos.map(p => p.id).filter(Boolean)
  if (asaasIds.length) {
    await sbClient.from('pagamentos').delete().in('asaas_id', asaasIds)
  }
  const { data: todosPerfisSb } = await sbClient
  .from('perfis')
  .select('id, asaas_customer_id')
  .not('asaas_customer_id', 'is', null)
const customerParaPerfilId = Object.fromEntries(
  (todosPerfisSb || []).map(p => [p.asaas_customer_id, p.id])
)

const registros = todos
  .filter(p => p.id && p.dueDate)
  .map(p => ({
    asaas_id:       p.id,
    asaas_customer: p.customer || null,
    aluno_id:       customerParaPerfilId[p.customer] || null,
    valor:          p.value || 0,
    status:         p.status || 'PENDING',
    vencimento:     p.dueDate,
    pago_em:        p.paymentDate ? new Date(p.paymentDate).toISOString() : null,
    descricao:      p.description || null,
    mes_ref:        p.dueDate.slice(0,7) + '-01',
  }))
  for (let i = 0; i < registros.length; i += 50) {
    const { error } = await sbClient.from('pagamentos').insert(registros.slice(i, i + 50))
    if (error) throw new Error('Erro ao salvar: ' + error.message)
  }

  let saldo = null
  try {
    const bal = await asaasProxy('/finance/balance')
    saldo = bal.balance ?? null
  } catch(e) {}

  return { total: registros.length, saldo }
}

export async function renderPagamentos(container, page) {
  const sbClient = window._sb
  const perfil   = window._perfil
  const agora    = new Date()

  _ultimoContainer = container
  window._rerenderPagamentos = () => renderPagamentos(_ultimoContainer, 'pagamentos')

  if (!window._pgMes) window._pgMes = agora.toISOString().slice(0,7)
  const mesSel = window._pgMes

  const mesesDisponiveis = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    mesesDisponiveis.push(d.toISOString().slice(0,7))
  }

  const filtroPlano = window._pgPlano || ''

  const [pgRes, perfisRes, notifs] = await Promise.all([
    sbClient.from('pagamentos').select('*, aluno:perfis!aluno_id(id,nome,email)')
      .order('vencimento', { ascending: false }).limit(500),
    // FK explícita para evitar ambiguidade com professor_id
    sbClient.from('perfis').select('id,nome,email,asaas_customer_id,matriculas!matriculas_aluno_id_fkey(plano_tipo,ativa)')
      .not('asaas_customer_id', 'is', null),
    carregarNotificacoes(perfil, 'pagamentos'),
  ])

  const pgs = pgRes.data || []

  const perfisPorAsaas = Object.fromEntries(
    (perfisRes.data || []).map(p => [p.asaas_customer_id, p])
  )

  // Resolve nome/id pelo asaas_customer quando o join direto não existe
  pgs.forEach(p => {
    if ((!p.aluno?.nome || !p.aluno?.id) && p.asaas_customer) {
      const perfilMatch = perfisPorAsaas[p.asaas_customer]
      if (perfilMatch) {
        p.aluno = { id: perfilMatch.id, nome: perfilMatch.nome, email: perfilMatch.email }
      }
    }
  })

  const pgsParaFiltrar = !filtroPlano ? pgs : pgs.filter(p => {
    const perfil = p.aluno ? perfisRes.data?.find(pf => pf.email === p.aluno?.email) : null
    return perfil?.matriculas?.some(m => m.ativa && m.plano_tipo === filtroPlano)
  })

  const pgsMes    = pgsParaFiltrar.filter(p => p.mes_ref?.slice(0,7) === mesSel)
  const recebidos  = pgsMes.filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
  const ultimoDiaMes = new Date(agora.getFullYear(), agora.getMonth()+1, 0).toISOString().slice(0,10)
  const aguardando = pgsMes.filter(p => p.status === 'PENDING' && p.vencimento !== ultimoDiaMes)
  const vencidos   = pgsMes.filter(p => p.status === 'OVERDUE')
  const totalRec  = recebidos.reduce((s,p)  => s+(p.valor||0), 0)
  const totalAg   = aguardando.reduce((s,p) => s+(p.valor||0), 0)
  const totalVenc = vencidos.reduce((s,p)   => s+(p.valor||0), 0)
  const inadimp   = pgsMes.length ? Math.round(vencidos.length/pgsMes.length*100) : 0

  const filtroAtivo = window._pgFiltro || 'TODOS'
  const pgDe  = window._pgDe  || ''
  const pgAte = window._pgAte || ''
  const pgSort = window._pgSort || 'data_asc'

  let pgsFiltrados = pgsParaFiltrar
    .filter(p => p.mes_ref?.slice(0,7) === mesSel)
    .filter(p => filtroAtivo === 'TODOS' || p.status === filtroAtivo || (filtroAtivo==='RECEIVED' && p.status==='CONFIRMED'))
    .filter(p => !pgDe  || (p.vencimento && p.vencimento >= pgDe))
    .filter(p => !pgAte || (p.vencimento && p.vencimento <= pgAte))

  pgsFiltrados.sort((a,b) => {
    const nomeA = a.aluno?.nome || ''
    const nomeB = b.aluno?.nome || ''
    if (pgSort === 'nome_asc')    return nomeA.localeCompare(nomeB)
    if (pgSort === 'nome_desc')   return nomeB.localeCompare(nomeA)
    if (pgSort === 'valor_asc')   return (a.valor||0) - (b.valor||0)
    if (pgSort === 'valor_desc')  return (b.valor||0) - (a.valor||0)
    if (pgSort === 'data_desc')   return (b.vencimento||'').localeCompare(a.vencimento||'')
    if (pgSort === 'status_asc')  return (a.status||'').localeCompare(b.status||'')
    if (pgSort === 'status_desc') return (b.status||'').localeCompare(a.status||'')
    return (a.vencimento||'').localeCompare(b.vencimento||'')
  })

  let saldoConta = null
  try {
    const bal = await asaasProxy('/finance/balance')
    saldoConta = bal.balance ?? null
  } catch(e) {}

  const semNome = pgs.filter(p => !p.aluno?.nome && p.asaas_customer &&
  p.vencimento >= new Date().toISOString().slice(0,10)
).length

  window._pgAlunosMap = {}
  pgs.forEach(p => {
    if (p.aluno?.id) window._pgAlunosMap[p.aluno.id] = p.aluno
  })

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Pagamentos</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select data-h-change="pages-admin-pagamentos.5" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:var(--superficie);color:var(--txt)">
          <option value="" ${!filtroPlano?'selected':''}>Todos os planos</option>
          <option value="brahma"       ${filtroPlano==='brahma'      ?'selected':''}>Brahma</option>
          <option value="shiva_1x"     ${filtroPlano==='shiva_1x'    ?'selected':''}>Shiva 1x</option>
          <option value="shiva_2x"     ${filtroPlano==='shiva_2x'    ?'selected':''}>Shiva 2x</option>
          <option value="vishnu_2x"    ${filtroPlano==='vishnu_2x'   ?'selected':''}>Vishnu 2x</option>
          <option value="vishnu_livre" ${filtroPlano==='vishnu_livre'?'selected':''}>Vishnu Livre</option>
        </select>
        <button data-h-click="pages-admin-pagamentos.6" style="padding:5px 12px;background:var(--superficie);color:var(--titulo);border:1px solid var(--borda);border-radius:5px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif"><i class="ti ti-refresh" aria-hidden="true"></i> Sincronizar Asaas</button>
      </div>
    </div>
    <div class="content">
      ${renderPainelNotif(notifs, { titulo: 'Avisos', maxVisiveis: 2 })}

      ${semNome > 0 ? `
        <div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);border-radius:6px;padding:9px 13px;font-size:12px;color:var(--warn-fg);margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <i class="ti ti-link-off"></i>
          <span><strong>${semNome} pagamento(s)</strong> sem nome resolvido. Sincronize com o Asaas para fazer o vínculo automático por e-mail.</span>
        </div>` : ''}

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        <span class="t-mut fw-500">Mês:</span>
        ${mesesDisponiveis.map(m => `
          <button data-h-click="pages-admin-pagamentos.1" data-a-click="${esc(JSON.stringify([String(m)]))}"
            style="padding:4px 12px;border-radius:20px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${mesSel===m?'var(--verde)':'var(--borda)'};background:${mesSel===m?'var(--verde)':'var(--superficie)'};color:${mesSel===m?'var(--bege)':'var(--txt2)'}">
            ${nomeMes(m)}${m===agora.toISOString().slice(0,7)?' ·atual':''}
          </button>`).join('')}
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        <div data-h-click="pages-admin-pagamentos.7" style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid var(--ok-fg);cursor:pointer">
          <div class="t-label mb-6">Recebidas</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--ok-fg)">${fmtR(totalRec)}</div>
          <div style="height:4px;background:var(--ok-bg);border-radius:2px;margin:8px 0 6px"><div style="height:4px;background:var(--ok-fg);border-radius:2px;width:${pgsMes.length?Math.round(recebidos.length/pgsMes.length*100):0}%"></div></div>
          <div class="t-mut">${recebidos.length} cobranças · clique para ver <i class="ti ti-arrow-down" aria-hidden="true"></i></div>
        </div>
        <div data-h-click="pages-admin-pagamentos.8" style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid var(--warn-vivo);cursor:pointer">
          <div class="t-label mb-6">Aguardando</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--warn-vivo)">${fmtR(totalAg)}</div>
          <div style="height:4px;background:rgba(232,188,79,.2);border-radius:2px;margin:8px 0 6px"><div style="height:4px;background:#e67e22;border-radius:2px;width:${pgsMes.length?Math.round(aguardando.length/pgsMes.length*100):0}%"></div></div>
          <div class="t-mut">${aguardando.length} cobranças · clique para ver <i class="ti ti-arrow-down" aria-hidden="true"></i></div>
        </div>
        <div data-h-click="pages-admin-pagamentos.9" style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid var(--err-vivo);cursor:pointer">
          <div class="t-label mb-6">Vencidas</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--err-vivo)">${fmtR(totalVenc)}</div>
          <div style="height:4px;background:var(--err-bg);border-radius:2px;margin:8px 0 6px"><div style="height:4px;background:#c0392b;border-radius:2px;width:${pgsMes.length?Math.round(vencidos.length/pgsMes.length*100):0}%"></div></div>
          <div class="t-mut">${vencidos.length} cobranças · ${inadimp}% inadimplência</div>
        </div>
        <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid var(--verde)">
          <div class="t-label mb-6">Saldo em conta</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--titulo)">${saldoConta !== null ? fmtR(saldoConta) : '—'}</div>
          <div style="font-size:12px;color:var(--txt2);margin-top:6px">${saldoConta !== null ? 'Asaas · atualizado agora' : 'via Asaas · sincronize para ver'}</div>
        </div>
      </div>

      ${vencidos.length > 0 ? `
        <div style="background:var(--err-bg);border:1px solid var(--err-borda);border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
          <span class="fs-20"><i class="ti ti-alert-triangle" aria-hidden="true"></i></span>
          <div>
            <div style="font-weight:500;font-size:13px;color:var(--err-fg)">${vencidos.length} aluno(s) em atraso em ${nomeMes(mesSel)}</div>
            <div class="mt-2 fs-12 c-err">${vencidos.map(p=>esc(p.aluno?.nome||p.asaas_customer||'—')).join(', ')}</div>
          </div>
        </div>` : ''}

      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;align-items:center">
        ${['TODOS','RECEIVED','PENDING','OVERDUE','CANCELLED'].map(s => {
          const cnt = s==='TODOS' ? pgsMes.length :
            pgs.filter(p => p.mes_ref?.slice(0,7)===mesSel && (p.status===s||(s==='RECEIVED'&&p.status==='CONFIRMED'))).length
          const label = {TODOS:'Todos',RECEIVED:'Recebidos',PENDING:'Aguardando',OVERDUE:'Vencidos',CANCELLED:'Cancelados'}[s]
          return `<button data-h-click="pages-admin-pagamentos.2" data-a-click="${esc(JSON.stringify([String(s)]))}"
            style="padding:5px 12px;border-radius:20px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${filtroAtivo===s?'var(--verde)':'var(--borda)'};background:${filtroAtivo===s?'var(--verde)':'var(--superficie)'};color:${filtroAtivo===s?'var(--bege)':'var(--txt2)'}">${label} (${cnt})</button>`
        }).join('')}
      </div>

      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;align-items:flex-end">
        <div class="stack-3">
          <label class="t-label">Vencimento de</label>
          <input type="date" value="${window._pgDe||''}" data-h-change="pages-admin-pagamentos.10" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:var(--superficie)">
        </div>
        <div class="stack-3">
          <label class="t-label">Até</label>
          <input type="date" value="${window._pgAte||''}" data-h-change="pages-admin-pagamentos.11" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:var(--superficie)">
        </div>
        ${window._pgDe||window._pgAte?`<button data-h-click="pages-admin-pagamentos.3" style="padding:5px 10px;background:var(--err-bg);color:var(--err-fg);border:1px solid var(--err-borda);border-radius:5px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;align-self:flex-end"><i class="ti ti-x" aria-hidden="true"></i> Limpar datas</button>`:''}
        <div style="margin-left:auto;font-size:12px;color:var(--txt2);align-self:flex-end">${pgsFiltrados.length} registro(s)</div>
      </div>

      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
      <div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);overflow-x:auto;min-width:520px">
        <div style="display:grid;grid-template-columns:1fr 110px 90px 100px 80px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:12px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
          <span data-h-click="pages-admin-pagamentos.12" class="cursor-pointer">Aluno ${window._pgSort?.startsWith('nome')?window._pgSort==='nome_asc'?'<i class="ti ti-arrow-up" aria-hidden="true"></i>':'<i class="ti ti-arrow-down" aria-hidden="true"></i>':'<i class="ti ti-arrows-sort" aria-hidden="true"></i>'}</span>
          <span data-h-click="pages-admin-pagamentos.13" class="cursor-pointer">Vencimento ${window._pgSort?.startsWith('data')?window._pgSort==='data_asc'?'<i class="ti ti-arrow-up" aria-hidden="true"></i>':'<i class="ti ti-arrow-down" aria-hidden="true"></i>':'<i class="ti ti-arrows-sort" aria-hidden="true"></i>'}</span>
          <span data-h-click="pages-admin-pagamentos.14" class="cursor-pointer">Valor ${window._pgSort?.startsWith('valor')?window._pgSort==='valor_asc'?'<i class="ti ti-arrow-up" aria-hidden="true"></i>':'<i class="ti ti-arrow-down" aria-hidden="true"></i>':'<i class="ti ti-arrows-sort" aria-hidden="true"></i>'}</span>
          <span data-h-click="pages-admin-pagamentos.15" class="cursor-pointer">Status ${window._pgSort?.startsWith('status')?window._pgSort==='status_asc'?'<i class="ti ti-arrow-up" aria-hidden="true"></i>':'<i class="ti ti-arrow-down" aria-hidden="true"></i>':'<i class="ti ti-arrows-sort" aria-hidden="true"></i>'}</span>
          <span>Mês ref.</span>
        </div>
        ${pgsFiltrados.length === 0
          ? `<div style="padding:24px 18px;font-size:12px;color:var(--txt2)">Nenhum pagamento${filtroAtivo!=='TODOS'?' com este filtro':''} em ${nomeMes(mesSel)}.</div>`
          : pgsFiltrados.map(p => {
              const temPerfil = !!(p.aluno?.id)
              return `<div style="display:grid;grid-template-columns:1fr 110px 90px 100px 80px;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
                <div>
                  <div style="font-weight:500;${temPerfil?'color:var(--titulo);cursor:pointer;text-decoration:underline;text-underline-offset:2px':''}" ${temPerfil?`data-h-click="pages-admin-pagamentos.4" data-a-click="${esc(JSON.stringify([String(p.aluno.id)]))}"`:''}>${esc(p.aluno?.nome || '—')}</div>
                  <div class="t-mut">${esc(p.aluno?.email || (p.asaas_customer ? '<i class="ti ti-link" aria-hidden="true"></i> ' + p.asaas_customer : ''))}</div>
                </div>
                <span class="fs-12">${fmtData(p.vencimento)}</span>
                <span class="fw-500">${fmtR(p.valor)}</span>
                <span style="background:${STATUS_BG[p.status]||'var(--neutro-bg)'};color:${STATUS_COR[p.status]||'var(--txt2)'};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500;white-space:nowrap">${STATUS_LABEL[p.status]||esc(p.status)}</span>
                <span class="t-mut">${p.mes_ref?p.mes_ref.slice(0,7):'—'}</span>
              </div>`
            }).join('')
        }
      </div>
      </div>

      <!-- Modal perfil aluno -->
      <div id="modal-pg-aluno" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);z-index:200;align-items:center;justify-content:center;padding:16px">
        <div style="background:var(--superficie);border-radius:12px;width:480px;max-width:100%;max-height:85vh;overflow-y:auto">
          <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0">
            <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)">Perfil do Aluno</div>
            <button data-h-click="pages-admin-pagamentos.16" style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
          </div>
          <div id="modal-pg-aluno-body" class="p-20">Carregando...</div>
        </div>
      </div>

      <!-- Modal sync -->
      <div id="modal-sync-asaas" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);z-index:200;align-items:center;justify-content:center;padding:16px">
        <div style="background:var(--superficie);border-radius:12px;width:420px;max-width:100%;overflow:hidden">
          <div style="background:var(--verde);padding:16px 20px">
            <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)">Sincronizar com Asaas</div>
            <div style="font-size:12px;color:rgba(242,236,206,.7);margin-top:2px">Importa cobranças dos últimos 2 meses + vencidas · vincula todos os alunos por e-mail automaticamente</div>
          </div>
          <div class="p-20">
            <div style="font-size:12px;color:var(--txt2);line-height:1.5;margin-bottom:14px">
              A chave de API do Asaas fica guardada com segurança no servidor — não é mais necessário informá-la aqui.
            </div>
            <div id="sync-progress" style="display:none;font-size:12px;color:var(--txt2);margin-bottom:10px"><i class="ti ti-hourglass" aria-hidden="true"></i> Sincronizando e vinculando alunos...</div>
          </div>
          <div class="modal-foot modal-foot-sm">
            <button data-h-click="pages-admin-pagamentos.17"
              style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
            <button id="btn-executar-sync" data-h-click="pages-admin-pagamentos.18"
              style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Sincronizar</button>
          </div>
        </div>
      </div>

    </div>
  `
uiAnimar(container)
  initNotifHandlers(notifs, perfil.id)
  aplicarBadgesMenu(calcularBadgesMenu(notifs))
  window.abrirSyncAsaas = function() {
    document.getElementById('modal-sync-asaas').style.display = 'flex'
  }

  window.abrirPerfilAlunoPg = async function(alunoId) {
    const modal = document.getElementById('modal-pg-aluno')
    const body  = document.getElementById('modal-pg-aluno-body')
    modal.style.display = 'flex'
    body.innerHTML = 'Carregando...'

    const [perfilRes, matRes, pgsAlunoRes, saldoRes] = await Promise.all([
      sbClient.from('perfis').select('*').eq('id', alunoId).single(),
      sbClient.from('matriculas').select('*').eq('aluno_id', alunoId).eq('ativa', true).single(),
      sbClient.from('pagamentos').select('*').eq('aluno_id', alunoId).order('vencimento', {ascending:false}).limit(6),
      sbClient.from('saldo_disponivel').select('saldo_total').eq('aluno_id', alunoId).single(),
    ])

    const a   = perfilRes.data
    const mat = matRes.data
    const pgsAluno = pgsAlunoRes.data || []
    const saldo = saldoRes.data?.saldo_total ?? null
    const ehLivre = mat?.plano_tipo === 'vishnu_livre' || mat?.opcao_aulas === 99

    const PLANO_NOMES = {brahma:'Brahma',shiva_1x:'Shiva 1x',shiva_2x:'Shiva 2x',vishnu_2x:'Vishnu 2x',vishnu_livre:'Vishnu Livre'}
    const PG_LABEL = {RECEIVED:'Recebido ✓',CONFIRMED:'Confirmado ✓',OVERDUE:'Vencido ⚠',PENDING:'Aguardando',CANCELLED:'Cancelado',REFUNDED:'Devolvido'}
    const PG_COR   = {RECEIVED:'var(--ok-fg)',CONFIRMED:'var(--ok-fg)',OVERDUE:'var(--err-vivo)',PENDING:'var(--warn-vivo)',CANCELLED:'var(--txt2)',REFUNDED:'var(--txt2)'}

    const initials = (a?.nome||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()

    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
        <div style="width:48px;height:48px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;color:var(--titulo);flex-shrink:0">${esc(initials)}</div>
        <div>
          <div class="fs-16 fw-500 c-txt">${esc(a?.nome||'—')}</div>
          <div class="t-mut">${esc(a?.email||'—')}</div>
          ${a?.telefone?`<div class="t-mut">${esc(a.telefone)}</div>`:''}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        <div style="background:var(--fundo);border-radius:6px;padding:12px">
          <div class="t-label">Plano</div>
          <div style="font-size:14px;font-weight:500;color:var(--titulo);margin-top:3px">${mat ? PLANO_NOMES[mat.plano_tipo]||esc(mat.plano_tipo) : 'Sem matrícula'}</div>
          ${mat?.valor_mensal?`<div class="t-mut">R$${mat.valor_mensal}/mês</div>`:''}
        </div>
        <div style="background:var(--fundo);border-radius:6px;padding:12px">
          <div class="t-label">Saldo de aulas</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--titulo);margin-top:3px">${ehLivre ? '∞' : saldo !== null ? saldo : '—'}</div>
        </div>
      </div>
      ${mat?.fim?`<div class="t-mut mb-14">Validade: ${new Date(mat.fim+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}</div>`:''}
      ${a?.asaas_customer_id?`<div style="font-size:12px;color:var(--ok-fg);margin-bottom:14px"><i class="ti ti-check" aria-hidden="true"></i> Vinculado ao Asaas: ${a.asaas_customer_id}</div>`:`<div class="mb-14 fs-12 c-err"><i class="ti ti-alert-triangle" aria-hidden="true"></i> Não vinculado ao Asaas</div>`}
      ${pgsAluno.length ? `
        <div class="t-label mb-8">Últimos pagamentos</div>
        ${pgsAluno.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
          <span>${p.mes_ref?new Date(p.mes_ref+'T12:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'—'}</span>
          <div class="ta-right">
            <div class="fw-500">${fmtR(p.valor)}</div>
            <div style="font-size:12px;color:${PG_COR[p.status]||'var(--txt2)'}">${PG_LABEL[p.status]||esc(p.status)}</div>
          </div>
        </div>`).join('')}
      ` : '<div style="font-size:12px;color:var(--txt2)">Nenhum pagamento encontrado.</div>'}
      <div style="margin-top:16px;display:flex;gap:8px">
        <button data-h-click="pages-admin-pagamentos.19" data-a-click="${esc(JSON.stringify([String(alunoId)]))}" style="flex:1;padding:8px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Editar aluno</button>
        <button data-h-click="pages-admin-pagamentos.16" style="padding:8px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Fechar</button>
      </div>
    `
  }

  window.executarSyncAsaas = async function() {
    const btn  = document.getElementById('btn-executar-sync')
    const prog = document.getElementById('sync-progress')
    btn.disabled = true; btn.textContent = 'Sincronizando...'
    prog.style.display = 'block'
    try {
      await sbClient.from('pagamentos').delete().like('asaas_id', 'teste_%')
      const { total } = await syncAsaas(sbClient)
      document.getElementById('modal-sync-asaas').style.display = 'none'
      toast('✓ ' + total + ' cobranças sincronizadas')
      window._rerenderPagamentos()
    } catch(e) {
      toast('Erro: ' + e.message)
      btn.disabled = false; btn.textContent = 'Sincronizar'
      prog.style.display = 'none'
    }
  }
}   
