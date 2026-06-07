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

const STATUS_LABEL = {RECEIVED:'Recebido',CONFIRMED:'Confirmado',OVERDUE:'Vencido',PENDING:'Aguardando',CANCELLED:'Cancelado',REFUNDED:'Devolvido'}
const STATUS_BG    = {RECEIVED:'#e8f4e8',CONFIRMED:'#e8f4e8',OVERDUE:'#fceaea',PENDING:'rgba(232,188,79,.15)',CANCELLED:'#f0ede4',REFUNDED:'#f0ede4'}
const STATUS_COR   = {RECEIVED:'#1a5a1a',CONFIRMED:'#1a5a1a',OVERDUE:'#8a1a1a',PENDING:'#7a5a10',CANCELLED:'#5a5a4a',REFUNDED:'#5a5a4a'}

async function asaasProxy(path, apiKey, params = {}) {
  const qs = new URLSearchParams(params).toString()
  const r = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_ANON },
    body: JSON.stringify({ apiKey, path: path + (qs ? '?' + qs : '') })
  })
  if (!r.ok) throw new Error('Asaas proxy ' + r.status)
  return r.json()
}

async function syncAsaas(apiKey, sbClient) {
  // Busca pagamentos do mês atual + mês anterior
  const hoje = new Date()
  const de = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().slice(0,10)
  const ate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0,10)

  let todos = [], offset = 0
  while (true) {
    const data = await asaasProxy('/payments', apiKey, {
      limit: 100, offset, dueDateStart: de, dueDateFinish: ate
    })
    todos = todos.concat(data.data || [])
    if (!data.hasMore) break
    offset += 100
  }

  // Buscar também vencidos históricos
  const vencidos = await asaasProxy('/payments', apiKey, {
    limit: 100, offset: 0, status: 'OVERDUE'
  })
  const idsVistos = new Set(todos.map(p => p.id))
  for (const p of (vencidos.data || [])) {
    if (!idsVistos.has(p.id)) { todos.push(p); idsVistos.add(p.id) }
  }

  // Salvar no banco: delete os existentes e reinsere em lote
  const asaasIds = todos.map(p => p.id).filter(Boolean)
  if (asaasIds.length) {
    await sbClient.from('pagamentos').delete().in('asaas_id', asaasIds)
  }
  const registros = todos
    .filter(p => p.id && p.dueDate)  // descarta registros sem id ou data
    .map(p => ({
      asaas_id:       p.id,
      asaas_customer: p.customer || null,
      valor:          p.value || 0,
      status:         p.status || 'PENDING',
      vencimento:     p.dueDate,
      pago_em:        p.paymentDate ? new Date(p.paymentDate).toISOString() : null,
      descricao:      p.description || null,
      mes_ref:        p.dueDate.slice(0,7) + '-01',
    }))
  // Insere em lotes de 50
  for (let i = 0; i < registros.length; i += 50) {
    const { error } = await sbClient.from('pagamentos').insert(registros.slice(i, i + 50))
    if (error) throw new Error('Erro ao salvar pagamentos: ' + error.message)
  }

  // Buscar saldo em conta
  let saldo = null
  try {
    const balData = await asaasProxy('/finance/balance', apiKey)
    saldo = balData.balance ?? null
  } catch(e) { /* ignora erro de saldo */ }

  return { total: todos.length, saldo }
}

export async function renderPagamentos(container, page) {
  const sbClient = window._sb

  // Mês atual para filtrar cards
  const agora = new Date()
  const mesAtual = agora.toISOString().slice(0,7) // ex: "2026-06"
  const mesInicio = mesAtual + '-01'
  const mesFim = new Date(agora.getFullYear(), agora.getMonth()+1, 0).toISOString().slice(0,10)

  // Carregar dados do banco — todos para a lista, filtrar mês para cards
  const [pgRes, perfisRes] = await Promise.all([
    sbClient.from('pagamentos').select('*, aluno:perfis!aluno_id(nome,email)')
      .order('vencimento', { ascending: false }).limit(500),
    sbClient.from('perfis').select('nome,email,asaas_customer_id')
      .not('asaas_customer_id', 'is', null),
  ])

  const pgs = pgRes.data || []
  const perfisPorAsaas = Object.fromEntries(
    (perfisRes.data || []).map(p => [p.asaas_customer_id, p])
  )
  // Resolver nome via asaas_customer quando aluno_id não está vinculado
  pgs.forEach(p => {
    if (!p.aluno?.nome && p.asaas_customer) {
      p.aluno = perfisPorAsaas[p.asaas_customer] || null
    }
  })

  // Cards: apenas mês atual
  const pgsMes = pgs.filter(p => p.mes_ref && p.mes_ref.slice(0,7) === mesAtual)
  const recebidos  = pgsMes.filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
  const aguardando = pgsMes.filter(p => p.status === 'PENDING')
  const vencidos   = pgsMes.filter(p => p.status === 'OVERDUE')
  const totalRec   = recebidos.reduce((s,p)  => s + (p.valor||0), 0)
  const totalAg    = aguardando.reduce((s,p) => s + (p.valor||0), 0)
  const totalVenc  = vencidos.reduce((s,p)   => s + (p.valor||0), 0)
  const inadimp    = pgsMes.length ? Math.round(vencidos.length / pgsMes.length * 100) : 0

  // Filtro de status ativo (lista completa)
  const filtroAtivo = window._pgFiltro || 'TODOS'
  const pgsFiltrados = filtroAtivo === 'TODOS' ? pgs : pgs.filter(p => p.status === filtroAtivo)

  // Buscar saldo em conta automaticamente se tiver API key salva
  const savedKey = localStorage.getItem(ASAAS_KEY_STORAGE) || ''
  let saldoConta = null
  if (savedKey) {
    try {
      const balData = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_ANON },
        body: JSON.stringify({ apiKey: savedKey, path: '/finance/balance' })
      }).then(r => r.json())
      saldoConta = balData.balance ?? null
    } catch(e) { /* ignora */ }
  }

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Pagamentos</div>
      <div style="display:flex;gap:8px;align-items:center">
        <span id="sync-status" style="font-size:11px;color:var(--txt2)"></span>
        <button onclick="abrirSyncAsaas()" style="padding:5px 12px;background:#fff;color:var(--verde);border:1px solid var(--borda);border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:4px">
          ↻ Sincronizar Asaas
        </button>
      </div>
    </div>
    <div class="content">

      <!-- Cards estilo Asaas -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid #1a5a1a">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:6px">Recebidas</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:#1a5a1a">${fmtR(totalRec)}</div>
          <div style="height:4px;background:#e8f4e8;border-radius:2px;margin:8px 0 6px">
            <div style="height:4px;background:#1a5a1a;border-radius:2px;width:${pgs.length?Math.round(recebidos.length/pgs.length*100):0}%"></div>
          </div>
          <div style="font-size:10px;color:var(--txt2)">${recebidos.length} cobranças · ${pgs.length ? Math.round(recebidos.length/pgs.length*100) : 0}%</div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid #e67e22">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:6px">Aguardando</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:#e67e22">${fmtR(totalAg)}</div>
          <div style="height:4px;background:rgba(232,188,79,.2);border-radius:2px;margin:8px 0 6px">
            <div style="height:4px;background:#e67e22;border-radius:2px;width:${pgs.length?Math.round(aguardando.length/pgs.length*100):0}%"></div>
          </div>
          <div style="font-size:10px;color:var(--txt2)">${aguardando.length} cobranças · ${pgs.length ? Math.round(aguardando.length/pgs.length*100) : 0}%</div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid #c0392b">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:6px">Vencidas</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:#c0392b">${fmtR(totalVenc)}</div>
          <div style="height:4px;background:#fceaea;border-radius:2px;margin:8px 0 6px">
            <div style="height:4px;background:#c0392b;border-radius:2px;width:${pgs.length?Math.round(vencidos.length/pgs.length*100):0}%"></div>
          </div>
          <div style="font-size:10px;color:var(--txt2)">${vencidos.length} cobranças · ${inadimp}% inadimplência</div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;border-top:3px solid var(--verde)" id="card-saldo">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:6px">Saldo em conta</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--verde)" id="saldo-valor">${saldoConta !== null ? fmtR(saldoConta) : '—'}</div>
          <div style="font-size:10px;color:var(--txt2);margin-top:6px">${saldoConta !== null ? 'Asaas · atualizado agora' : 'via Asaas · sincronize para ver'}</div>
        </div>
      </div>

      <!-- Alerta vencidos -->
      ${vencidos.length > 0 ? `
        <div style="background:#fceaea;border:1px solid #f5c1c1;border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">⚠️</span>
          <div>
            <div style="font-weight:500;font-size:13px;color:#8a1a1a">${vencidos.length} aluno(s) em atraso</div>
            <div style="font-size:11px;color:#c0392b;margin-top:2px">${vencidos.map(p=>p.aluno?.nome||'ID: '+p.asaas_customer||'—').join(', ')}</div>
          </div>
        </div>` : ''}

      <!-- Filtros de status -->
      <div style="display:flex;gap:6px;margin-bottom:4px;flex-wrap:wrap">
        ${['TODOS','RECEIVED','PENDING','OVERDUE','CANCELLED'].map(s => `
          <button onclick="window._pgFiltro='${s}';navigate('pagamentos')"
            style="padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${filtroAtivo===s?'var(--verde)':'var(--borda)'};background:${filtroAtivo===s?'var(--verde)':'#fff'};color:${filtroAtivo===s?'var(--bege)':'var(--txt2)'}">
            ${{TODOS:'Todos',RECEIVED:'Recebidos',PENDING:'Aguardando',OVERDUE:'Vencidos',CANCELLED:'Cancelados'}[s]}
            (${s==='TODOS'?pgs.length:pgs.filter(p=>p.status===s||(s==='RECEIVED'&&p.status==='CONFIRMED')).length})
          </button>`).join('')}
      </div>
      <div style="font-size:10px;color:var(--txt2);margin-bottom:10px">Cards mostram o mês atual (${mesAtual}) · Lista mostra todos os registros</div>

      <!-- Tabela -->
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 110px 90px 100px 80px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
          <span>Aluno</span><span>Vencimento</span><span>Valor</span><span>Status</span><span>Mês ref.</span>
        </div>
        ${pgsFiltrados.length === 0
          ? '<div style="padding:24px 18px;font-size:12px;color:var(--txt2)">Nenhum pagamento' + (filtroAtivo!=='TODOS'?' neste filtro':' ainda. Clique em "Sincronizar Asaas" para importar.') + '</div>'
          : pgsFiltrados.map(p => `
            <div style="display:grid;grid-template-columns:1fr 110px 90px 100px 80px;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
              <div>
                <div style="font-weight:500">${p.aluno?.nome || p.asaas_customer || '—'}</div>
                <div style="font-size:10px;color:var(--txt2)">${p.aluno?.email || ''}</div>
              </div>
              <span style="font-size:11px">${fmtData(p.vencimento)}</span>
              <span style="font-weight:500">${fmtR(p.valor)}</span>
              <span style="background:${STATUS_BG[p.status]||'#f0ede4'};color:${STATUS_COR[p.status]||'#5a5a4a'};padding:3px 10px;border-radius:20px;font-size:10px;font-weight:500;white-space:nowrap">${STATUS_LABEL[p.status]||p.status}</span>
              <span style="font-size:10px;color:var(--txt2)">${p.mes_ref?p.mes_ref.slice(0,7):'—'}</span>
            </div>`).join('')
        }
      </div>

      <!-- Modal sync -->
      <div id="modal-sync-asaas" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);z-index:200;align-items:center;justify-content:center;padding:16px">
        <div style="background:#fff;border-radius:12px;width:420px;max-width:100%;overflow:hidden">
          <div style="background:var(--verde);padding:16px 20px">
            <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)">Sincronizar com Asaas</div>
            <div style="font-size:11px;color:rgba(242,236,206,.7);margin-top:2px">Importa cobranças dos últimos 2 meses + vencidas</div>
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
            <div id="sync-progress" style="display:none;font-size:12px;color:var(--txt2);margin-bottom:10px">⏳ Sincronizando...</div>
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

  window.executarSyncAsaas = async function() {
    const apiKey = document.getElementById('sync-apikey').value.trim()
    if (!apiKey) { toast('Informe a API Key do Asaas'); return }

    if (document.getElementById('sync-salvar').checked) {
      localStorage.setItem(ASAAS_KEY_STORAGE, apiKey)
    }

    const btn = document.getElementById('btn-executar-sync')
    const prog = document.getElementById('sync-progress')
    btn.disabled = true; btn.textContent = 'Sincronizando...'
    prog.style.display = 'block'

    try {
      // Limpa registros de teste antes de sincronizar
      await sbClient.from('pagamentos').delete().like('asaas_id', 'teste_%')
      const { total, saldo } = await syncAsaas(apiKey, sbClient)
      document.getElementById('modal-sync-asaas').style.display = 'none'
      toast('✓ ' + total + ' cobranças sincronizadas')
      // Saldo atualizado no próximo render
      navigate('pagamentos')
    } catch(e) {
      toast('Erro: ' + e.message)
      btn.disabled = false; btn.textContent = 'Sincronizar'
      prog.style.display = 'none'
    }
  }
}
