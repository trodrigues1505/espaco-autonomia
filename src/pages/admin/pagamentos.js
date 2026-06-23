/**
 * src/pages/admin/pagamentos.js
 * Painel de pagamentos — dados do banco + sync com API Asaas
 */

import { SUPABASE_ANON } from '../../lib/supabase.js'
import { toast } from '../../modules/utils.js'

const FN_URL   = 'https://kctgcjvfsuinwlbgljdw.supabase.co/functions/v1/asaas-proxy'
const ASAAS_KEY_STORAGE = 'ea_asaas_key'

function fmtR(v) { return 'R$' + (v||0).toFixed(2).replace('.',',') }
function fmtData(d) { return d ? new Date(d+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '—' }
function nomeMes(ym) {
  const [y,m] = ym.split('-')
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return nomes[Number(m)-1] + '/' + y.slice(2)
}

const STATUS_LABEL = {RECEIVED:'Recebido',CONFIRMED:'Confirmado',OVERDUE:'Vencido',PENDING:'Aguardando',CANCELLED:'Cancelado',REFUNDED:'Devolvido'}
const STATUS_BG    = {RECEIVED:'#e8f4e8',CONFIRMED:'#e8f4e8',OVERDUE:'#fceaea',PENDING:'rgba(232,188,79,.15)',CANCELLED:'#f0ede4',REFUNDED:'#f0ede4'}
const STATUS_COR   = {RECEIVED:'#1a5a1a',CONFIRMED:'#1a5a1a',OVERDUE:'#8a1a1a',PENDING:'#7a5a10',CANCELLED:'#5a5a4a',REFUNDED:'#5a5a4a'}

async function asaasProxy(path, apiKey) {
  const r = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_ANON },
    body: JSON.stringify({ apiKey, path })
  })
  if (!r.ok) throw new Error('Asaas proxy ' + r.status)
  return r.json()
}

async function syncAsaas(apiKey, sbClient) {
  const hoje = new Date()
  const de  = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().slice(0,10)
  const ate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0,10)

  let todos = [], offset = 0
  while (true) {
    const data = await asaasProxy(`/payments?limit=100&offset=${offset}&dueDateStart=${de}&dueDateFinish=${ate}`, apiKey)
    todos = todos.concat(data.data || [])
    if (!data.hasMore) break
    offset += 100
  }

  // Vencidos históricos
  const vencRes = await asaasProxy('/payments?limit=100&offset=0&status=OVERDUE', apiKey)
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
        const clienteAsaas = await asaasProxy(`/customers/${customerId}`, apiKey)
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
      const clientesPage = await asaasProxy(`/customers?limit=100&offset=${offsetCustomers}`, apiKey)
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
    const bal = await asaasProxy('/finance/balance', apiKey)
    saldo = bal.balance ?? null
  } catch(e) {}

  return { total: registros.length, saldo }
}

export async function renderPagamentos(container, page) {
  const sbClient = window._sb
  const agora    = new Date()

  if (!window._pgMes) window._pgMes = agora.toISOString().slice(0,7)
  const mesSel = window._pgMes

  const mesesDisponiveis = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    mesesDisponiveis.push(d.toISOString().slice(0,7))
  }

  const filtroPlano = window._pgPlano || ''

  const [pgRes, perfisRes] = await Promise.all([
    sbClient.from('pagamentos').select('*, aluno:perfis!aluno_id(id,nome,email)')
      .order('vencimento', { ascending: false }).limit(500),
    // FK explícita para evitar ambiguidade com professor_id
    sbClient.from('perfis').select('id,nome,email,asaas_customer_id,matriculas!matriculas_aluno_id_fkey(plano_tipo,ativa)')
      .not('asaas_customer_id', 'is', null),
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

  const savedKey = localStorage.getItem(ASAAS_KEY_STORAGE) || ''
  let saldoConta = null
  if (savedKey) {
    try {
      const bal = await asaasProxy('/finance/balance', savedKey)
      saldoConta = bal.balance ?? null
    } catch(e) {}
  }

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
        <select onchange="window._pgPlano=this.value;navigate('pagamentos')" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:11px;font-family:'DM Sans',sans-serif;background:#fff;color:var(--txt)">
          <option value="" ${!filtroPlano?'selected':''}>Todos os planos</option>
          <option value="brahma"       ${filtroPlano==='brahma'      ?'selected':''}>Brahma</option>
          <option value="shiva_1x"     ${filtroPlano==='shiva_1x'    ?'selected':''}>Shiva 1x</option>
          <option value="shiva_2x"     ${filtroPlano==='shiva_2x'    ?'selected':''}>Shiva 2x</option>
          <option value="vishnu_2x"    ${filtroPlano==='vishnu_2x'   ?'selected':''}>Vishnu 2x</option>
          <option value="vishnu_livre" ${filtroPlano==='vishnu_livre'?'selected':''}>Vishnu Livre</option>
        </select>
        <button onclick="abrirSyncAsaas()" style="padding:5px 12px;background:#fff;color:var(--verde);border:1px solid var(--borda);border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">↻ Sincronizar Asaas</button>
      </div>
    </div>
    <div class="content">

      ${semNome > 0 ? `
        <div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);border-radius:6px;padding:9px 13px;font-size:12px;color:#7a5a10;margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <i class="ti ti-link-off"></i>
          <span><strong>${semNome} pagamento(s)</strong> sem nome resolvido. Sincronize com o Asaas para fazer o vínculo automático por e-mail.</span>
        </div>` : ''}

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        <span style="font-size:11px;color:var(--txt2);font-weight:500">Mês:</span>
        ${mesesDisponiveis.map(m => `
          <button onclick="window._pgMes='${m}';window._pgFiltro='TODOS';navigate('pagamentos')"
            style="padding:4px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${mesSel===m?'var(--verde)':'var(--borda)'};background:${mesSel===m?'var(--verde)':'#fff'};color:${mesSel===m?'var(--bege)':'var(--txt2)'}">
            ${nomeMes(m)}${m===agora.toISOString().slice(0,7)?' ·atual':''}
          </button>`).join('')}
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        <div onclick="window._pgFiltro='RECEIVED';navigate('pagamentos')" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid #1a5a1a;cursor:pointer">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:6px">Recebidas</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:#1a5a1a">${fmtR(totalRec)}</div>
          <div style="height:4px;background:#e8f4e8;border-radius:2px;margin:8px 0 6px"><div style="height:4px;background:#1a5a1a;border-radius:2px;width:${pgsMes.length?Math.round(recebidos.length/pgsMes.length*100):0}%"></div></div>
          <div style="font-size:10px;color:var(--txt2)">${recebidos.length} cobranças · clique para ver ↓</div>
        </div>
        <div onclick="window._pgFiltro='PENDING';navigate('pagamentos')" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid #e67e22;cursor:pointer">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:6px">Aguardando</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:#e67e22">${fmtR(totalAg)}</div>
          <div style="height:4px;background:rgba(232,188,79,.2);border-radius:2px;margin:8px 0 6px"><div style="height:4px;background:#e67e22;border-radius:2px;width:${pgsMes.length?Math.round(aguardando.length/pgsMes.length*100):0}%"></div></div>
          <div style="font-size:10px;color:var(--txt2)">${aguardando.length} cobranças · clique para ver ↓</div>
        </div>
        <div onclick="window._pgFiltro='OVERDUE';navigate('pagamentos')" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid #c0392b;cursor:pointer">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:6px">Vencidas</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:#c0392b">${fmtR(totalVenc)}</div>
          <div style="height:4px;background:#fceaea;border-radius:2px;margin:8px 0 6px"><div style="height:4px;background:#c0392b;border-radius:2px;width:${pgsMes.length?Math.round(vencidos.length/pgsMes.length*100):0}%"></div></div>
          <div style="font-size:10px;color:var(--txt2)">${vencidos.length} cobranças · ${inadimp}% inadimplência</div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid var(--verde)">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:6px">Saldo em conta</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--verde)">${saldoConta !== null ? fmtR(saldoConta) : '—'}</div>
          <div style="font-size:10px;color:var(--txt2);margin-top:6px">${saldoConta !== null ? 'Asaas · atualizado agora' : 'via Asaas · sincronize para ver'}</div>
        </div>
      </div>

      ${vencidos.length > 0 ? `
        <div style="background:#fceaea;border:1px solid #f5c1c1;border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">⚠️</span>
          <div>
            <div style="font-weight:500;font-size:13px;color:#8a1a1a">${vencidos.length} aluno(s) em atraso em ${nomeMes(mesSel)}</div>
            <div style="font-size:11px;color:#c0392b;margin-top:2px">${vencidos.map(p=>p.aluno?.nome||p.asaas_customer||'—').join(', ')}</div>
          </div>
        </div>` : ''}

      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;align-items:center">
        ${['TODOS','RECEIVED','PENDING','OVERDUE','CANCELLED'].map(s => {
          const cnt = s==='TODOS' ? pgsMes.length :
            pgs.filter(p => p.mes_ref?.slice(0,7)===mesSel && (p.status===s||(s==='RECEIVED'&&p.status==='CONFIRMED'))).length
          const label = {TODOS:'Todos',RECEIVED:'Recebidos',PENDING:'Aguardando',OVERDUE:'Vencidos',CANCELLED:'Cancelados'}[s]
          return `<button onclick="window._pgFiltro='${s}';navigate('pagamentos')"
            style="padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${filtroAtivo===s?'var(--verde)':'var(--borda)'};background:${filtroAtivo===s?'var(--verde)':'#fff'};color:${filtroAtivo===s?'var(--bege)':'var(--txt2)'}">${label} (${cnt})</button>`
        }).join('')}
      </div>

      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;align-items:flex-end">
        <div style="display:flex;flex-direction:column;gap:3px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Vencimento de</label>
          <input type="date" value="${window._pgDe||''}" onchange="window._pgDe=this.value;navigate('pagamentos')" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff">
        </div>
        <div style="display:flex;flex-direction:column;gap:3px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Até</label>
          <input type="date" value="${window._pgAte||''}" onchange="window._pgAte=this.value;navigate('pagamentos')" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff">
        </div>
        ${window._pgDe||window._pgAte?`<button onclick="window._pgDe='';window._pgAte='';navigate('pagamentos')" style="padding:5px 10px;background:#fceaea;color:#8a1a1a;border:1px solid #f5c1c1;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;align-self:flex-end">✕ Limpar datas</button>`:''}
        <div style="margin-left:auto;font-size:11px;color:var(--txt2);align-self:flex-end">${pgsFiltrados.length} registro(s)</div>
      </div>

      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden;min-width:520px">
        <div style="display:grid;grid-template-columns:1fr 110px 90px 100px 80px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
          <span onclick="window._pgSort=window._pgSort==='nome_asc'?'nome_desc':'nome_asc';navigate('pagamentos')" style="cursor:pointer">Aluno ${window._pgSort?.startsWith('nome')?window._pgSort==='nome_asc'?'↑':'↓':'↕'}</span>
          <span onclick="window._pgSort=window._pgSort==='data_asc'?'data_desc':'data_asc';navigate('pagamentos')" style="cursor:pointer">Vencimento ${window._pgSort?.startsWith('data')?window._pgSort==='data_asc'?'↑':'↓':'↕'}</span>
          <span onclick="window._pgSort=window._pgSort==='valor_asc'?'valor_desc':'valor_asc';navigate('pagamentos')" style="cursor:pointer">Valor ${window._pgSort?.startsWith('valor')?window._pgSort==='valor_asc'?'↑':'↓':'↕'}</span>
          <span onclick="window._pgSort=window._pgSort==='status_asc'?'status_desc':'status_asc';navigate('pagamentos')" style="cursor:pointer">Status ${window._pgSort?.startsWith('status')?window._pgSort==='status_asc'?'↑':'↓':'↕'}</span>
          <span>Mês ref.</span>
        </div>
        ${pgsFiltrados.length === 0
          ? `<div style="padding:24px 18px;font-size:12px;color:var(--txt2)">Nenhum pagamento${filtroAtivo!=='TODOS'?' com este filtro':''} em ${nomeMes(mesSel)}.</div>`
          : pgsFiltrados.map(p => {
              const temPerfil = !!(p.aluno?.id)
              return `<div style="display:grid;grid-template-columns:1fr 110px 90px 100px 80px;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
                <div>
                  <div style="font-weight:500;${temPerfil?'color:var(--verde);cursor:pointer;text-decoration:underline;text-underline-offset:2px':''}" ${temPerfil?`onclick="abrirPerfilAlunoPg('${p.aluno.id}')"`:''}>${p.aluno?.nome || '—'}</div>
                  <div style="font-size:10px;color:var(--txt2)">${p.aluno?.email || (p.asaas_customer ? '🔗 ' + p.asaas_customer : '')}</div>
                </div>
                <span style="font-size:11px">${fmtData(p.vencimento)}</span>
                <span style="font-weight:500">${fmtR(p.valor)}</span>
                <span style="background:${STATUS_BG[p.status]||'#f0ede4'};color:${STATUS_COR[p.status]||'#5a5a4a'};padding:3px 10px;border-radius:20px;font-size:10px;font-weight:500;white-space:nowrap">${STATUS_LABEL[p.status]||p.status}</span>
                <span style="font-size:10px;color:var(--txt2)">${p.mes_ref?p.mes_ref.slice(0,7):'—'}</span>
              </div>`
            }).join('')
        }
      </div>
      </div>

      <!-- Modal perfil aluno -->
      <div id="modal-pg-aluno" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);z-index:200;align-items:center;justify-content:center;padding:16px">
        <div style="background:#fff;border-radius:12px;width:480px;max-width:100%;max-height:85vh;overflow-y:auto">
          <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0">
            <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)">Perfil do Aluno</div>
            <button onclick="document.getElementById('modal-pg-aluno').style.display='none'" style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
          </div>
          <div id="modal-pg-aluno-body" style="padding:20px">Carregando...</div>
        </div>
      </div>

      <!-- Modal sync -->
      <div id="modal-sync-asaas" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);z-index:200;align-items:center;justify-content:center;padding:16px">
        <div style="background:#fff;border-radius:12px;width:420px;max-width:100%;overflow:hidden">
          <div style="background:var(--verde);padding:16px 20px">
            <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)">Sincronizar com Asaas</div>
            <div style="font-size:11px;color:rgba(242,236,206,.7);margin-top:2px">Importa cobranças dos últimos 2 meses + vencidas · vincula todos os alunos por e-mail automaticamente</div>
          </div>
          <div style="padding:20px">
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">API Key do Asaas</label>
              <input id="sync-apikey" type="password" placeholder="$aact_prod_..." value="${savedKey}"
                style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%">
              <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--txt2);margin-top:4px;cursor:pointer">
                <input type="checkbox" id="sync-salvar" checked style="accent-color:var(--verde)">
                Lembrar chave neste dispositivo
              </label>
            </div>
            <div id="sync-progress" style="display:none;font-size:12px;color:var(--txt2);margin-bottom:10px">⏳ Sincronizando e vinculando alunos...</div>
          </div>
          <div style="padding:0 20px 16px;display:flex;justify-content:flex-end;gap:8px">
            <button onclick="document.getElementById('modal-sync-asaas').style.display='none'"
              style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
            <button id="btn-executar-sync" onclick="executarSyncAsaas()"
              style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Sincronizar</button>
          </div>
        </div>
      </div>

    </div>
  `

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
    const PG_COR   = {RECEIVED:'#1a5a1a',CONFIRMED:'#1a5a1a',OVERDUE:'#c0392b',PENDING:'#e67e22',CANCELLED:'#5a5a4a',REFUNDED:'#5a5a4a'}

    const initials = (a?.nome||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()

    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
        <div style="width:48px;height:48px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;color:var(--verde);flex-shrink:0">${initials}</div>
        <div>
          <div style="font-size:16px;font-weight:500;color:var(--txt)">${a?.nome||'—'}</div>
          <div style="font-size:12px;color:var(--txt2)">${a?.email||'—'}</div>
          ${a?.telefone?`<div style="font-size:12px;color:var(--txt2)">${a.telefone}</div>`:''}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        <div style="background:var(--fundo);border-radius:6px;padding:12px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2)">Plano</div>
          <div style="font-size:14px;font-weight:500;color:var(--verde);margin-top:3px">${mat ? PLANO_NOMES[mat.plano_tipo]||mat.plano_tipo : 'Sem matrícula'}</div>
          ${mat?.valor_mensal?`<div style="font-size:11px;color:var(--txt2)">R$${mat.valor_mensal}/mês</div>`:''}
        </div>
        <div style="background:var(--fundo);border-radius:6px;padding:12px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2)">Saldo de aulas</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde);margin-top:3px">${ehLivre ? '∞' : saldo !== null ? saldo : '—'}</div>
        </div>
      </div>
      ${mat?.fim?`<div style="font-size:12px;color:var(--txt2);margin-bottom:14px">Validade: ${new Date(mat.fim+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}</div>`:''}
      ${a?.asaas_customer_id?`<div style="font-size:11px;color:#1a5a1a;margin-bottom:14px">✓ Vinculado ao Asaas: ${a.asaas_customer_id}</div>`:`<div style="font-size:11px;color:#c0392b;margin-bottom:14px">⚠ Não vinculado ao Asaas</div>`}
      ${pgsAluno.length ? `
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);margin-bottom:8px">Últimos pagamentos</div>
        ${pgsAluno.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
          <span>${p.mes_ref?new Date(p.mes_ref+'T12:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'—'}</span>
          <div style="text-align:right">
            <div style="font-weight:500">${fmtR(p.valor)}</div>
            <div style="font-size:10px;color:${PG_COR[p.status]||'#888'}">${PG_LABEL[p.status]||p.status}</div>
          </div>
        </div>`).join('')}
      ` : '<div style="font-size:12px;color:var(--txt2)">Nenhum pagamento encontrado.</div>'}
      <div style="margin-top:16px;display:flex;gap:8px">
        <button onclick="document.getElementById('modal-pg-aluno').style.display='none';window._pendingEditAluno='${alunoId}';navigate('alunos')" style="flex:1;padding:8px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Editar aluno</button>
        <button onclick="document.getElementById('modal-pg-aluno').style.display='none'" style="padding:8px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Fechar</button>
      </div>
    `
  }

  window.executarSyncAsaas = async function() {
    const apiKey = document.getElementById('sync-apikey').value.trim()
    if (!apiKey) { toast('Informe a API Key do Asaas'); return }
    if (document.getElementById('sync-salvar').checked) {
      localStorage.setItem(ASAAS_KEY_STORAGE, apiKey)
    }
    const btn  = document.getElementById('btn-executar-sync')
    const prog = document.getElementById('sync-progress')
    btn.disabled = true; btn.textContent = 'Sincronizando...'
    prog.style.display = 'block'
    try {
      await sbClient.from('pagamentos').delete().like('asaas_id', 'teste_%')
      const { total } = await syncAsaas(apiKey, sbClient)
      document.getElementById('modal-sync-asaas').style.display = 'none'
      toast('✓ ' + total + ' cobranças sincronizadas')
      navigate('pagamentos')
    } catch(e) {
      toast('Erro: ' + e.message)
      btn.disabled = false; btn.textContent = 'Sincronizar'
      prog.style.display = 'none'
    }
  }
}       
