/**
 * src/pages/admin/alunos.js
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'
import { carregarNotificacoes, renderPainelNotif, initNotifHandlers } from '../../modules/notificacoes.js'
import { uiAnimar } from '../../modules/ui.js'

let _buscaAlunoTimer = null

function fmtDataHora(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function montarListaAlunosHTML(alunos, saldoPorAluno) {
  return card('Lista de Alunos ('+alunos.length+')', '',
    `<div style="display:grid;grid-template-columns:1fr 80px 60px 60px 80px 160px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
      <span>Aluno</span><span>Plano</span><span>Freq.</span><span>Saldo</span><span>Validade</span><span></span>
    </div>
    ${alunos.length===0?'<div style="padding:18px;font-size:12px;color:var(--txt2)">Nenhum aluno encontrado.</div>':
      alunos.map(a => {
        const mat = (a.matriculas||[]).find(m=>m.ativa)
        const initials = a.nome.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()
        const opcaoLabel = mat?.opcao_aulas===99?'Livre':mat?.opcao_aulas===2?'2×/sem':mat?.opcao_aulas===1?'1×/sem':'—'
        const vencida = mat?.fim && new Date(mat.fim) < new Date()
        const saldo = saldoPorAluno[a.id] ?? null
        const ehLivre = mat?.plano_tipo === 'vishnu_livre' || mat?.opcao_aulas === 99
        const saldoLabel = ehLivre ? '∞' : saldo !== null ? String(saldo) : '—'
        const saldoCor = ehLivre ? 'var(--verde)' : saldo === 0 ? '#c0392b' : (saldo !== null && saldo <= 1) ? '#e67e22' : 'var(--verde)'
        const temDesconto = mat && ((mat.desconto_fixo||0) > 0 || (mat.desconto_avulso_meses > mat.desconto_avulso_usado && (mat.desconto_avulso_valor||0) > 0))
        return `<div style="display:grid;grid-template-columns:1fr 80px 60px 60px 80px 160px;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:28px;height:28px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:var(--verde);flex-shrink:0">${initials}</div>
            <div>
              <div style="font-weight:500">${a.nome}</div>
              <div style="font-size:10px;color:var(--txt2)">${a.email}</div>
              ${temDesconto?`<div style="font-size:10px;color:#e67e22">🏷 com desconto</div>`:''}
            </div>
          </div>
          <span>${mat?PLANO_BADGES[mat?.plano_tipo]||mat?.plano_tipo||'—':badge('Sem plano','#fceaea','#8a1a1a')}</span>
          <span style="font-size:11px;color:var(--txt2)">${opcaoLabel}</span>
          <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:${saldoCor}">${saldoLabel}</span>
          <span style="font-size:11px;color:${vencida?'#c0392b':'var(--txt2)'}">${mat?.fim?new Date(mat.fim+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}):vencida?'Vencida':'—'}</span>
          <div style="display:flex;gap:4px">
            <button onclick="editarAluno('${a.id}')" style="padding:3px 10px;background:transparent;border:1px solid var(--borda);border-radius:5px;font-size:11px;cursor:pointer;color:var(--txt2);font-family:'DM Sans',sans-serif">Editar</button>
            <button onclick="confirmarExcluirAluno('${a.id}','${a.nome.replace(/'/g,"\\'")}')" style="padding:3px 8px;background:transparent;border:1px solid #f5c1c1;border-radius:5px;font-size:11px;cursor:pointer;color:#c0392b;font-family:'DM Sans',sans-serif" title="Excluir aluno">✕</button>
          </div>
        </div>`
      }).join('')
    }`
  )
}

function montarListaVisitantesHTML(visitantes) {
  return card('Visitantes / Leads ('+visitantes.length+')', '',
    `<div style="display:grid;grid-template-columns:1fr 130px 110px 120px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
      <span>Visitante</span><span>Telefone</span><span>Lead desde</span><span></span>
    </div>
    ${visitantes.length===0?'<div style="padding:18px;font-size:12px;color:var(--txt2)">Nenhum visitante no momento.</div>':
      visitantes.map(v => {
        const initials = (v.nome||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()
        return `<div style="display:grid;grid-template-columns:1fr 130px 110px 120px;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:28px;height:28px;border-radius:50%;background:rgba(58,110,165,.12);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:#3a6ea5;flex-shrink:0">${initials}</div>
            <div>
              <div style="font-weight:500">${v.nome||'—'}</div>
              <div style="font-size:10px;color:var(--txt2)">${v.email}</div>
            </div>
          </div>
          <span style="font-size:11px;color:var(--txt2)">${v.telefone||'—'}</span>
          <span style="font-size:11px;color:var(--txt2)">${fmtDataHora(v.criado_em)}</span>
          <div>
            <button onclick="abrirPromoverVisitante('${v.id}')" style="padding:4px 10px;background:var(--verde);color:var(--bege);border:none;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap">↑ Promover a Aluno</button>
          </div>
        </div>`
      }).join('')
    }`
  )
}

function filtrarAlunosLista(todos, busca, filtroPlanok, semAsaas) {
  return todos
    .filter(a => !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.email.toLowerCase().includes(busca.toLowerCase()))
    .filter(a => !filtroPlanok || (a.matriculas||[]).some(m=>m.ativa && m.plano_tipo===filtroPlanok))
    .filter(a => !semAsaas || !a.asaas_customer_id)
}

function filtrarVisitantesLista(todos, busca) {
  return todos.filter(v => !busca || (v.nome||'').toLowerCase().includes(busca.toLowerCase()) || (v.email||'').toLowerCase().includes(busca.toLowerCase()))
}

export async function renderAlunos(container, page) {
  const _sb = window._sb || sb
  const perfil = window._perfil

  const aba = window._abaAlunos || 'alunos'
  const busca = window._buscaAlunos || ''
  const filtroPlanok = window._filtroPlanoAlunos || ''
  const filtroSemAsaas = window._filtroSemAsaasAlunos || false
  const distribAberta = window._mostrarDistribPlano || false

  const [perfisRes, saldoRes, professoresRes, visitantesRes, notifs] = await Promise.all([
    _sb.from('perfis').select('*, matriculas!matriculas_aluno_id_fkey(plano_tipo,opcao_aulas,valor_mensal,desconto_fixo,desconto_avulso_valor,desconto_avulso_meses,desconto_avulso_usado,ativa,fim,professor_id)').eq('tipo','aluno').order('nome'),
    _sb.from('saldo_disponivel').select('aluno_id,saldo_total'),
    _sb.from('perfis').select('id,nome').eq('tipo','professor').order('nome'),
    _sb.from('perfis').select('id,nome,email,telefone,criado_em').eq('tipo','visitante').order('criado_em',{ascending:false}),
    carregarNotificacoes(perfil, 'alunos'),
  ])

  const todos = perfisRes.data || []
  const professores = professoresRes.data || []
  const visitantesTodos = visitantesRes.data || []

  const saldoPorAluno = Object.fromEntries(
    (saldoRes.data || []).map(s => [s.aluno_id, s.saldo_total ?? 0])
  )

  // Cache em memória: usado pelo filtro local (aplicarFiltroAlunos), evita
  // refetch + re-render de tela inteira a cada tecla digitada na busca.
  window._alunosTodosCache = todos
  window._saldoPorAlunoCache = saldoPorAluno
  window._visitantesTodosCache = visitantesTodos
  window._professoresCache = professores

  let alunos = filtrarAlunosLista(todos, busca, filtroPlanok, filtroSemAsaas)
  let visitantes = filtrarVisitantesLista(visitantesTodos, busca)

  const modalCadastro = modal('modal-cad-aluno', 'Cadastrar Aluno',
    `${fi('','Nome completo',`<input type="text" id="ca-nome" ${inputStyle} placeholder="Nome do aluno">`)}
    ${fi('','E-mail',`<input type="email" id="ca-email" ${inputStyle} placeholder="email@exemplo.com">`)}
    ${fi('','Telefone',`<input type="tel" id="ca-tel" ${inputStyle} placeholder="(11) 99999-9999">`)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${fi('','Plano',`<select id="ca-plano" ${inputStyle} onchange="updateValorPlano()">
        <option value="brahma">Brahma — 1× por semana — R$100/mês</option>
        <option value="shiva_1x">Shiva 1x — 1× por semana — R$150/mês</option>
        <option value="shiva_2x">Shiva 2x — 2× por semana — R$200/mês</option>
        <option value="vishnu_2x">Vishnu 2x — 2× por semana — R$250/mês</option>
        <option value="vishnu_livre">Vishnu Livre — uso livre — R$300/mês</option>
      </select>`)}
      ${fi('','Aulas/semana',`<select id="ca-opcao" ${inputStyle} onchange="updateValorPlano()">
        <option value="1">1× por semana</option>
        <option value="2">2× por semana</option>
        <option value="99">Uso livre</option>
      </select>`)}
    </div>
    ${fi('','Valor mensal (R$)',`<input type="number" id="ca-valor" ${inputStyle} value="100">`)}
    ${fi('','Professor responsável',`<select id="ca-professor" ${inputStyle}>
      <option value="">— Sem professor —</option>
      ${professores.map(p=>`<option value="${p.id}">${p.nome}</option>`).join('')}
    </select>`)}
    ${fi('','ID no Asaas (opcional)',`<input type="text" id="ca-asaas" ${inputStyle} placeholder="cus_...">`)}
    <div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.3);border-radius:6px;padding:10px;font-size:11px;color:#7a5a10">
      ⚠ O aluno precisa entrar no app pelo menos uma vez com Google usando este e-mail <strong>antes</strong> de ser cadastrado aqui — o login cria o registro de autenticação necessário. Se ele já é visitante no app, use a aba <strong>Visitantes (Leads)</strong> para promover diretamente.
    </div>`,
    `<button onclick="document.getElementById('modal-cad-aluno').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
     <button onclick="salvarNovoAluno()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Cadastrar</button>`
  )

  const modalEditar = modal('modal-edit-aluno', 'Editar Aluno',
    `<div id="edit-aluno-body">Carregando...</div>`,
    `<button onclick="document.getElementById('modal-edit-aluno').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
     <button onclick="salvarEdicaoAluno()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Salvar</button>`
  )

  const modalPromover = modal('modal-promover-visitante', 'Promover Visitante a Aluno',
    `<input type="hidden" id="pv-id">
    <div style="background:rgba(58,110,165,.08);border:1px solid rgba(58,110,165,.25);border-radius:8px;padding:12px;margin-bottom:14px">
      <div id="pv-nome" style="font-size:14px;font-weight:500;color:var(--txt)"></div>
      <div id="pv-email" style="font-size:12px;color:var(--txt2);margin-top:2px"></div>
    </div>
    ${fi('','Telefone',`<input type="tel" id="pv-tel" ${inputStyle} placeholder="(11) 99999-9999">`)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${fi('','Plano',`<select id="pv-plano" ${inputStyle} onchange="updateValorPromocao()">
        <option value="brahma">Brahma — 1× por semana — R$100/mês</option>
        <option value="shiva_1x">Shiva 1x — 1× por semana — R$150/mês</option>
        <option value="shiva_2x">Shiva 2x — 2× por semana — R$200/mês</option>
        <option value="vishnu_2x">Vishnu 2x — 2× por semana — R$250/mês</option>
        <option value="vishnu_livre">Vishnu Livre — uso livre — R$300/mês</option>
      </select>`)}
      ${fi('','Aulas/semana',`<select id="pv-opcao" ${inputStyle} onchange="updateValorPromocao()">
        <option value="1">1× por semana</option>
        <option value="2">2× por semana</option>
        <option value="99">Uso livre</option>
      </select>`)}
    </div>
    ${fi('','Valor mensal (R$)',`<input type="number" id="pv-valor" ${inputStyle} value="100">`)}
    ${fi('','Professor responsável',`<select id="pv-professor" ${inputStyle}>
      <option value="">— Sem professor —</option>
      ${professores.map(p=>`<option value="${p.id}">${p.nome}</option>`).join('')}
    </select>`)}
    ${fi('','ID no Asaas (opcional)',`<input type="text" id="pv-asaas" ${inputStyle} placeholder="cus_...">`)}`,
    `<button onclick="document.getElementById('modal-promover-visitante').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
     <button onclick="salvarPromocaoVisitante()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Promover a Aluno</button>`
  )

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Alunos</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input id="input-busca-aluno" placeholder="Buscar..." value="${busca}" oninput="window.filtrarAlunosDebounced(this.value)" style="border:1px solid var(--borda);border-radius:6px;padding:6px 10px;font-size:12px;width:140px;font-family:'DM Sans',sans-serif;outline:none">
        ${aba==='alunos'?`<select onchange="window._filtroPlanoAlunos=this.value;window.aplicarFiltroAlunos()" style="border:1px solid var(--borda);border-radius:6px;padding:6px 10px;font-size:12px;font-family:'DM Sans',sans-serif;outline:none;background:#fff;color:var(--txt)">
          <option value="" ${!filtroPlanok?'selected':''}>Todos os planos</option>
          <option value="brahma"       ${filtroPlanok==='brahma'      ?'selected':''}>Brahma</option>
          <option value="shiva_1x"     ${filtroPlanok==='shiva_1x'    ?'selected':''}>Shiva 1x</option>
          <option value="shiva_2x"     ${filtroPlanok==='shiva_2x'    ?'selected':''}>Shiva 2x</option>
          <option value="vishnu_2x"    ${filtroPlanok==='vishnu_2x'   ?'selected':''}>Vishnu 2x</option>
          <option value="vishnu_livre" ${filtroPlanok==='vishnu_livre'?'selected':''}>Vishnu Livre</option>
        </select>`:''}
        <button onclick="document.getElementById('modal-cad-aluno').style.display='flex'" style="padding:6px 13px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px"><i class="ti ti-user-plus"></i> Cadastrar</button>
      </div>
    </div>
    <div class="content">
      ${renderPainelNotif(notifs, { titulo: 'Avisos', maxVisiveis: 2 })}
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:10px">
        <div style="background:var(--verde);border-radius:var(--r);padding:14px 16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:rgba(242,236,206,.7);margin-bottom:4px">Total de Alunos</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:500;color:var(--bege)">${todos?.length||0}</div>
          <div style="font-size:10px;color:rgba(242,236,206,.6);margin-top:2px">${(todos||[]).filter(a=>a.ativo).length} ativos</div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Receita Mensal Est.</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:#1a5a1a">R$${(todos||[]).reduce((s,a)=>{const m=(a.matriculas||[]).find(m=>m.ativa);if(!m) return s; const desc = (m.desconto_fixo||0) + (m.desconto_avulso_meses>m.desconto_avulso_usado ? (m.desconto_avulso_valor||0) : 0); return s+Math.max(0,(m.valor_mensal||0)-desc)},0).toFixed(0)}</div>
          <div style="font-size:10px;color:var(--txt2);margin-top:2px">soma das mensalidades líquidas</div>
        </div>
        <div id="card-sem-asaas" onclick="window.toggleFiltroSemAsaas()" title="Clique para filtrar a lista pelos alunos sem Asaas vinculado" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;cursor:pointer;transition:box-shadow .15s;box-shadow:${filtroSemAsaas?'0 0 0 2px #e67e22 inset':'none'}">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Sem Asaas</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:500;color:#e67e22">${(todos||[]).filter(a=>!a.asaas_customer_id).length}</div>
          <div style="font-size:10px;color:var(--txt2);margin-top:2px">não vinculados · clique p/ filtrar</div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Vencendo em 7d</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:500;color:${(()=>{const em7=new Date();em7.setDate(em7.getDate()+7);return (todos||[]).filter(a=>{const m=(a.matriculas||[]).find(m=>m.ativa);return m?.fim&&new Date(m.fim+'T12:00')<=em7&&new Date(m.fim+'T12:00')>=new Date()}).length})()>0?'#c0392b':'var(--verde)'}">
            ${(()=>{const em7=new Date();em7.setDate(em7.getDate()+7);return (todos||[]).filter(a=>{const m=(a.matriculas||[]).find(m=>m.ativa);return m?.fim&&new Date(m.fim+'T12:00')<=em7&&new Date(m.fim+'T12:00')>=new Date()}).length})()}
          </div>
          <div style="font-size:10px;color:var(--txt2);margin-top:2px">planos vencendo</div>
        </div>
        <div id="card-visitantes" onclick="window.trocarAbaAlunos('visitantes')" title="Clique para ver os visitantes (leads)" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;cursor:pointer;transition:box-shadow .15s;box-shadow:${aba==='visitantes'?'0 0 0 2px #3a6ea5 inset':'none'}">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Visitantes (Leads)</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:500;color:#3a6ea5">${visitantesTodos.length}</div>
          <div style="font-size:10px;color:var(--txt2);margin-top:2px">usando o app · clique p/ ver</div>
        </div>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:14px">
        <button onclick="window.trocarAbaAlunos('alunos')" style="padding:6px 16px;border-radius:20px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${aba==='alunos'?'var(--verde)':'var(--borda)'};background:${aba==='alunos'?'var(--verde)':'#fff'};color:${aba==='alunos'?'var(--bege)':'var(--txt2)'}">Alunos</button>
        <button onclick="window.trocarAbaAlunos('visitantes')" style="padding:6px 16px;border-radius:20px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${aba==='visitantes'?'#3a6ea5':'var(--borda)'};background:${aba==='visitantes'?'#3a6ea5':'#fff'};color:${aba==='visitantes'?'#fff':'var(--txt2)'}">Visitantes (Leads) ${visitantesTodos.length>0?'· '+visitantesTodos.length:''}</button>
      </div>

      ${aba==='alunos'?`
      <div style="margin-bottom:14px">
        <button onclick="window.toggleDistribPlano()" style="width:100%;text-align:left;background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:10px 18px;font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:6px">
          <i id="icon-toggle-distrib" class="ti ti-chevron-${distribAberta?'down':'right'}" style="font-size:13px"></i> Distribuição por Plano
        </button>
        <div id="distribuicao-plano-wrap" data-aberto="${distribAberta?'true':'false'}" style="max-height:${distribAberta?'2000px':'0px'};overflow:hidden;transition:max-height .3s ease">
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 18px;margin-top:8px">
            ${[
              {k:'brahma',l:'Brahma',c:'#8a9a7a'},
              {k:'shiva_1x',l:'Shiva 1x',c:'#5a8a5a'},
              {k:'shiva_2x',l:'Shiva 2x',c:'#2d7a2d'},
              {k:'vishnu_2x',l:'Vishnu 2x',c:'#c8a020'},
              {k:'vishnu_livre',l:'Vishnu Livre',c:'#e8bc4f'},
            ].map(({k,l,c})=>{
              const n=(todos||[]).filter(a=>a.matriculas?.some(m=>m.ativa&&m.plano_tipo===k)).length
              const pct=todos?.length?Math.round(n/todos.length*100):0
              const recMes=(todos||[]).filter(a=>a.matriculas?.some(m=>m.ativa&&m.plano_tipo===k)).reduce((s,a)=>{const m=(a.matriculas||[]).find(m=>m.ativa);if(!m) return s; const desc=(m.desconto_fixo||0)+(m.desconto_avulso_meses>m.desconto_avulso_usado?(m.desconto_avulso_valor||0):0); return s+Math.max(0,(m.valor_mensal||0)-desc)},0)
              return `<div style="margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                  <span style="font-weight:500">${l}</span>
                  <span style="color:var(--txt2)">${n} aluno${n!==1?'s':''} · R$${recMes}/mês · ${pct}%</span>
                </div>
                <div style="height:6px;background:#f0ede4;border-radius:4px;overflow:hidden">
                  <div style="height:6px;background:${c};border-radius:4px;width:${pct}%;transition:width .5s"></div>
                </div>
              </div>`
            }).join('')}
          </div>
        </div>
      </div>
      <div id="lista-alunos-container">
        ${montarListaAlunosHTML(alunos, saldoPorAluno)}
      </div>
      `:`
      <div id="lista-visitantes-container">
        ${montarListaVisitantesHTML(visitantes)}
      </div>
      `}
    </div>
    ${modalCadastro}
    ${modalEditar}
    ${modalPromover}
    <div id="modal-excluir-aluno" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);z-index:200;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:12px;width:400px;max-width:100%;overflow:hidden">
        <div style="background:#c0392b;padding:16px 20px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:#fff">Excluir Aluno</div>
        </div>
        <div style="padding:20px">
          <div id="excluir-aluno-msg" style="font-size:13px;color:var(--txt);margin-bottom:8px"></div>
          <div style="font-size:11px;color:#c0392b;background:#fceaea;border:1px solid #f5c1c1;border-radius:6px;padding:10px;margin-top:10px">
            ⚠ Esta ação remove o perfil, matrículas e presenças do aluno. Não pode ser desfeita.
          </div>
        </div>
        <div style="padding:0 20px 16px;display:flex;justify-content:flex-end;gap:8px">
          <button onclick="document.getElementById('modal-excluir-aluno').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
          <button id="btn-confirmar-exclusao" style="padding:7px 14px;background:#c0392b;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Excluir</button>
        </div>
      </div>
    </div>
  `

  uiAnimar(container)

  if (busca) {
    const inp = document.getElementById('input-busca-aluno')
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length) }
  }

  initNotifHandlers(notifs, perfil.id)

  window.trocarAbaAlunos = function(novaAba) {
    window._abaAlunos = novaAba
    navigate('alunos')
  }

  // Filtro local: só refiltra o cache em memória e substitui o container da
  // lista. Não refaz fetch ao Supabase nem re-renderiza a tela inteira.
  // Funciona tanto para a aba Alunos quanto Visitantes, conforme a aba ativa.
  window.filtrarAlunosDebounced = function(valor) {
    window._buscaAlunos = valor
    clearTimeout(_buscaAlunoTimer)
    _buscaAlunoTimer = setTimeout(() => window.aplicarFiltroAlunos(), 180)
  }

  window.aplicarFiltroAlunos = function() {
    const buscaAtual = window._buscaAlunos || ''
    const abaAtual = window._abaAlunos || 'alunos'
    if (abaAtual === 'visitantes') {
      const visitantesCache = window._visitantesTodosCache || []
      const visitantesFiltrados = filtrarVisitantesLista(visitantesCache, buscaAtual)
      const wrap = document.getElementById('lista-visitantes-container')
      if (wrap) wrap.innerHTML = montarListaVisitantesHTML(visitantesFiltrados)
      return
    }
    const todosCache = window._alunosTodosCache || []
    const saldoCache = window._saldoPorAlunoCache || {}
    const filtroAtual = window._filtroPlanoAlunos || ''
    const semAsaasAtual = window._filtroSemAsaasAlunos || false
    const alunosFiltrados = filtrarAlunosLista(todosCache, buscaAtual, filtroAtual, semAsaasAtual)
    const wrap = document.getElementById('lista-alunos-container')
    if (wrap) wrap.innerHTML = montarListaAlunosHTML(alunosFiltrados, saldoCache)
  }

  window.toggleFiltroSemAsaas = function() {
    window._filtroSemAsaasAlunos = !window._filtroSemAsaasAlunos
    const cardEl = document.getElementById('card-sem-asaas')
    if (cardEl) cardEl.style.boxShadow = window._filtroSemAsaasAlunos ? '0 0 0 2px #e67e22 inset' : 'none'
    window.aplicarFiltroAlunos()
  }

  window.toggleDistribPlano = function() {
    const wrap = document.getElementById('distribuicao-plano-wrap')
    const icon = document.getElementById('icon-toggle-distrib')
    if (!wrap) return
    const aberto = wrap.getAttribute('data-aberto') === 'true'
    if (aberto) {
      wrap.style.maxHeight = '0px'
      wrap.setAttribute('data-aberto', 'false')
      if (icon) icon.className = 'ti ti-chevron-right'
    } else {
      wrap.style.maxHeight = wrap.scrollHeight + 'px'
      wrap.setAttribute('data-aberto', 'true')
      if (icon) icon.className = 'ti ti-chevron-down'
    }
    window._mostrarDistribPlano = !aberto
  }

  window.updateValorPlano = function() {
    const p = document.getElementById('ca-plano')?.value
    if (p && document.getElementById('ca-valor')) document.getElementById('ca-valor').value = PLANO_VALORES[p]||0
  }

  window.updateValorPromocao = function() {
    const p = document.getElementById('pv-plano')?.value
    if (p && document.getElementById('pv-valor')) document.getElementById('pv-valor').value = PLANO_VALORES[p]||0
  }

  window.salvarNovoAluno = async function() {
    const nome = document.getElementById('ca-nome').value.trim()
    const email = document.getElementById('ca-email').value.trim()
    const tel = document.getElementById('ca-tel').value.trim()
    const plano = document.getElementById('ca-plano').value
    const opcao = PLANO_OPCOES[plano]||1
    const valor = Number(document.getElementById('ca-valor').value)||PLANO_VALORES[plano]||0
    const professorId = document.getElementById('ca-professor').value || null
    if (!nome||!email) { toast('Preencha nome e e-mail'); return }

    // O cadastro depende de o aluno já ter feito login com Google ao menos
    // uma vez (isso cria a linha em auth.users e, por consequência, em
    // perfis). Não criamos o perfil "do zero" aqui: perfis.id é FK para
    // auth.users.id, e este app roda com chave anônima no navegador — sem
    // acesso à Admin API do Supabase Auth para criar o usuário do lado do
    // servidor. Um insert com id aleatório sempre violaria essa FK (409).
    const { data: existente } = await _sb.from('perfis').select('id').eq('email', email).single()
    let alunoId = existente?.id

    if (!alunoId) {
      toast('Este e-mail ainda não tem login no app. Peça para o(a) aluno(a) entrar primeiro com Google usando: '+email+' — depois volte aqui para cadastrar o plano.')
      return
    }

    const asaasNovo = document.getElementById('ca-asaas')?.value.trim() || null
    await _sb.from('perfis').update({ tipo: 'aluno' }).eq('id', alunoId)
    await _sb.from('matriculas').update({ativa:false}).eq('aluno_id', alunoId).eq('ativa', true)
    const { error: errMat } = await _sb.from('matriculas').insert({ aluno_id: alunoId, plano_tipo: plano, opcao_aulas: opcao, valor_mensal: valor, professor_id: professorId })
    if (errMat) { toast('Erro ao criar matrícula: ' + errMat.message); return }

    // Se um professor foi selecionado no cadastro, cria também o vínculo
    // oficial em vinculos_professor_aluno (mesma RPC usada em vinculos.js).
    // Sem isso, previsao_repasse_professor não encontra vínculo vigente
    // para o primeiro mês do aluno.
    if (professorId) {
      const hoje = new Date().toISOString().slice(0,10)
      const { error: errVinc } = await _sb.rpc('admin_vincular_aluno_professor', {
        p_aluno_id: alunoId,
        p_professor_id: professorId,
        p_data_inicio: hoje,
        p_observacao: 'Vínculo criado automaticamente no cadastro do aluno',
      })
      if (errVinc) {
        toast('Aluno cadastrado, mas houve erro ao criar vínculo com o professor: ' + errVinc.message)
      }
    }

    if (asaasNovo) await _sb.from('perfis').update({ asaas_customer_id: asaasNovo }).eq('id', alunoId)
    document.getElementById('modal-cad-aluno').style.display = 'none'
    toast('✓ Aluno cadastrado!')
    navigate('alunos')
  }

  window.abrirPromoverVisitante = function(visitanteId) {
    const v = (window._visitantesTodosCache || []).find(x => x.id === visitanteId)
    if (!v) return
    document.getElementById('pv-id').value = v.id
    document.getElementById('pv-nome').textContent = v.nome || '—'
    document.getElementById('pv-email').textContent = v.email
    document.getElementById('pv-tel').value = v.telefone || ''
    document.getElementById('pv-plano').value = 'brahma'
    document.getElementById('pv-opcao').value = '1'
    document.getElementById('pv-valor').value = PLANO_VALORES['brahma']||100
    document.getElementById('pv-professor').value = ''
    document.getElementById('pv-asaas').value = ''
    document.getElementById('modal-promover-visitante').style.display = 'flex'
  }

  window.salvarPromocaoVisitante = async function() {
    const visitanteId = document.getElementById('pv-id').value
    const tel = document.getElementById('pv-tel').value.trim()
    const plano = document.getElementById('pv-plano').value
    const opcao = PLANO_OPCOES[plano]||1
    const valor = Number(document.getElementById('pv-valor').value)||PLANO_VALORES[plano]||0
    const professorId = document.getElementById('pv-professor').value || null
    const asaasNovo = document.getElementById('pv-asaas')?.value.trim() || null
    if (!visitanteId) { toast('Erro: visitante não identificado'); return }

    // Trava o botão durante o processamento inteiro — evita que um segundo
    // clique (por exemplo, enquanto o admin acha que a primeira tentativa
    // "não fez nada" por causa de erro de RLS silencioso) dispare uma nova
    // promoção completa e duplique matrícula/vínculo (bug identificado em
    // 15/07/2026, causou 5 matrículas duplicadas para um único visitante).
    const btn = document.querySelector('#modal-promover-visitante button[onclick="salvarPromocaoVisitante()"]')
    if (btn) { btn.disabled = true; btn.textContent = 'Promovendo...' }

    try {
      // Confirma que o perfil ainda é visitante antes de prosseguir. Se já
      // foi promovido (por esta ou por uma tentativa anterior), não refaz
      // o trabalho.
      const { data: atual, error: errAtual } = await _sb.from('perfis').select('tipo').eq('id', visitanteId).single()
      if (errAtual) { toast('Erro ao verificar visitante: ' + errAtual.message); return }
      if (atual?.tipo !== 'visitante') {
        toast('Este perfil já não está mais como visitante (tipo atual: ' + (atual?.tipo || '?') + '). Nenhuma ação foi feita.')
        document.getElementById('modal-promover-visitante').style.display = 'none'
        window._abaAlunos = 'alunos'
        navigate('alunos')
        return
      }

      // IMPORTANTE: verifica quantas linhas o update realmente afetou.
      // Se a policy de UPDATE do admin em perfis não existir, o Supabase/RLS
      // filtra a linha silenciosamente e retorna sucesso com 0 linhas — sem
      // erro. Checar apenas errPerfil não bastava (bug identificado em
      // 15/07/2026: promoção "funcionava" segundo o toast, mas tipo nunca
      // mudava porque só existia policy de UPDATE para "próprio perfil").
      const { data: atualizado, error: errPerfil } = await _sb.from('perfis').update({
        tipo: 'aluno', telefone: tel || null,
        ...(asaasNovo ? { asaas_customer_id: asaasNovo } : {}),
      }).eq('id', visitanteId).select('id')
      if (errPerfil) { toast('Erro ao promover perfil: ' + errPerfil.message); return }
      if (!atualizado || atualizado.length === 0) {
        toast('Erro: nenhuma linha foi atualizada em perfis. Provável bloqueio de RLS (falta policy de UPDATE para admin) — verifique pg_policies.')
        return
      }

      await _sb.from('matriculas').update({ativa:false}).eq('aluno_id', visitanteId).eq('ativa', true)
      const { error: errMat } = await _sb.from('matriculas').insert({ aluno_id: visitanteId, plano_tipo: plano, opcao_aulas: opcao, valor_mensal: valor, professor_id: professorId })
      if (errMat) { toast('Erro ao criar matrícula: ' + errMat.message); return }

      if (professorId) {
        const hoje = new Date().toISOString().slice(0,10)
        const { error: errVinc } = await _sb.rpc('admin_vincular_aluno_professor', {
          p_aluno_id: visitanteId,
          p_professor_id: professorId,
          p_data_inicio: hoje,
          p_observacao: 'Vínculo criado automaticamente na promoção de visitante a aluno',
        })
        if (errVinc) {
          toast('Aluno promovido, mas houve erro ao criar vínculo com o professor: ' + errVinc.message)
        }
      }

      document.getElementById('modal-promover-visitante').style.display = 'none'
      toast('✓ Visitante promovido a aluno!')
      window._abaAlunos = 'alunos'
      navigate('alunos')
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Promover a Aluno' }
    }
  }

  window.editarAluno = async function(alunoId) {
    const { data: a } = await _sb.from('perfis').select('*, matriculas!matriculas_aluno_id_fkey(*)').eq('id', alunoId).single()
    const mat = (a.matriculas||[]).find(m=>m.ativa)
    window._editAlunoId = alunoId
    const descAvulsoAtivo = mat && mat.desconto_avulso_meses > mat.desconto_avulso_usado
    document.getElementById('edit-aluno-body').innerHTML = `
      <div style="background:rgba(242,236,206,.3);border:1px solid var(--borda);border-radius:8px;padding:12px;margin-bottom:14px">
        <div style="font-size:11px;font-weight:500;color:var(--verde);margin-bottom:10px;text-transform:uppercase;letter-spacing:.6px">Dados Pessoais</div>
        ${fi('','Nome completo',`<input type="text" id="ea-nome" ${inputStyle} value="${(a.nome||'').replace(/"/g,'&quot;')}">`)}
        ${fi('','Telefone',`<input type="tel" id="ea-tel" ${inputStyle} value="${a.telefone||''}" placeholder="(11) 99999-9999">`)}
        <div style="font-size:11px;color:var(--txt2);margin-top:4px">E-mail: <strong>${a.email}</strong> (não editável — usado para login)</div>
      </div>
      ${fi('','Plano',`<select id="ea-plano" ${inputStyle} onchange="updateValorEdicao()">
        <option value="brahma" ${mat?.plano_tipo==='brahma'?'selected':''}>Brahma</option>
        <option value="shiva_1x" ${mat?.plano_tipo==='shiva_1x'?'selected':''}>Shiva 1x</option>
        <option value="shiva_2x" ${mat?.plano_tipo==='shiva_2x'?'selected':''}>Shiva 2x</option>
        <option value="vishnu_2x" ${mat?.plano_tipo==='vishnu_2x'?'selected':''}>Vishnu 2x</option>
        <option value="vishnu_livre" ${mat?.plano_tipo==='vishnu_livre'?'selected':''}>Vishnu Livre</option>
      </select>`)}
      <div style="font-size:11px;color:var(--txt2);margin:-6px 0 12px">
        Professor responsável agora é gerenciado em
        <a href="#" onclick="document.getElementById('modal-edit-aluno').style.display='none';navigate('vinculos');return false" style="color:var(--verde);text-decoration:underline;text-underline-offset:2px">Vínculos</a>.
      </div>
      ${fi('','Valor mensal (R$)',`<input type="number" id="ea-valor" ${inputStyle} value="${mat?.valor_mensal||0}">`)}
      ${fi('','Vencimento',`<input type="date" id="ea-fim" ${inputStyle} value="${mat?.fim||''}">`)}
      ${fi('','Status',`<select id="ea-ativo" ${inputStyle}><option value="true" ${a.ativo?'selected':''}>Ativo</option><option value="false" ${!a.ativo?'selected':''}>Inativo</option></select>`)}
      <div style="background:rgba(232,188,79,.08);border:1px solid rgba(232,188,79,.25);border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:500;color:var(--verde);margin-bottom:10px;text-transform:uppercase;letter-spacing:.6px">🏷 Descontos</div>
        <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:10px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Desconto fixo mensal (R$)</label>
          <input type="number" id="ea-desconto-fixo" min="0" step="0.01" value="${mat?.desconto_fixo||0}" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="display:flex;flex-direction:column;gap:3px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Desconto avulso (R$)</label>
            <input type="number" id="ea-desconto-avulso-valor" min="0" step="0.01" value="${mat?.desconto_avulso_valor||0}" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
          <div style="display:flex;flex-direction:column;gap:3px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Por quantos meses</label>
            <input type="number" id="ea-desconto-avulso-meses" min="0" max="24" value="${mat?.desconto_avulso_meses||0}" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
        </div>
        ${descAvulsoAtivo?`<div style="margin-top:8px;font-size:11px;color:#e67e22">⏳ ${mat.desconto_avulso_meses - mat.desconto_avulso_usado} mês(es) restante(s)</div>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
        <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">ID no Asaas (cus_...)</label>
        <input id="ea-asaas" placeholder="cus_000..." style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none" value="${a.asaas_customer_id||''}">
        <div style="font-size:10px;color:${a.asaas_customer_id?'#1a5a1a':'#c0392b'};margin-top:3px">${a.asaas_customer_id?'✓ Vinculado ao Asaas':'⚠ Não vinculado'}</div>
      </div>
      <div style="background:rgba(242,236,206,.4);border:1px solid var(--borda);border-radius:8px;padding:12px;margin-bottom:4px">
        <div style="font-size:11px;font-weight:500;color:var(--verde);margin-bottom:6px">➕ Créditos manuais de aulas</div>
        <div style="display:flex;align-items:flex-end;gap:8px">
          <div style="display:flex;flex-direction:column;gap:3px;flex:1">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Qtd</label>
            <input type="number" id="ea-creditos" min="1" max="50" value="1" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
          <div style="display:flex;flex-direction:column;gap:3px;flex:2">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Motivo</label>
            <input type="text" id="ea-credito-motivo" placeholder="Ex: aulas a repor de maio" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
          <button onclick="creditarAulasManual('${a.id}')" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap">Creditar</button>
        </div>
      </div>
    `
    document.getElementById('modal-edit-aluno').style.display = 'flex'
  }

  window.creditarAulasManual = async function(alunoId) {
    const qtd = Number(document.getElementById('ea-creditos').value) || 0
    const motivo = document.getElementById('ea-credito-motivo').value.trim()
    if (qtd < 1) { toast('Informe ao menos 1 aula'); return }
    if (!motivo) { toast('Informe o motivo do crédito'); return }
    const { error } = await _sb.rpc('creditar_aulas_manual', { p_aluno_id: alunoId, p_quantidade: qtd, p_motivo: motivo })
    if (error) { toast('Erro: ' + error.message); return }
    toast('✓ ' + qtd + ' aula(s) creditada(s)!')
    document.getElementById('ea-creditos').value = 1
    document.getElementById('ea-credito-motivo').value = ''
  }

  window.updateValorEdicao = function() {
    const p = document.getElementById('ea-plano')?.value
    if (p && document.getElementById('ea-valor')) document.getElementById('ea-valor').value = PLANO_VALORES[p]||0
  }

  window.salvarEdicaoAluno = async function() {
    const nome = document.getElementById('ea-nome')?.value.trim()
    const tel  = document.getElementById('ea-tel')?.value.trim()
    if (!nome) { toast('O nome não pode ficar vazio'); return }
    const plano    = document.getElementById('ea-plano').value
    const opcao    = PLANO_OPCOES[plano]||1
    const valor    = Number(document.getElementById('ea-valor').value)||PLANO_VALORES[plano]||0
    const fim      = document.getElementById('ea-fim').value || null
    const ativo    = document.getElementById('ea-ativo').value === 'true'
    const asaasId  = document.getElementById('ea-asaas')?.value?.trim() || null
    const descontoFixo        = Number(document.getElementById('ea-desconto-fixo').value) || 0
    const descontoAvulsoValor = Number(document.getElementById('ea-desconto-avulso-valor').value) || 0
    const descontoAvulsoMeses = Number(document.getElementById('ea-desconto-avulso-meses').value) || 0

    const { error: errPerfil } = await _sb.from('perfis').update({ nome, telefone: tel || null, ativo, asaas_customer_id: asaasId }).eq('id', window._editAlunoId)
    if (errPerfil) { toast('Erro ao salvar perfil: ' + errPerfil.message); return }

    // Busca a matrícula ativa atual para comparar com o formulário e decidir
    // se precisa encerrar+criar nova (mudança de plano/opção/valor) ou só
    // atualizar a existente (demais campos) — evita duplicar matrícula a
    // cada clique em Salvar (bug identificado em 15/07/2026).
    const { data: matAtual, error: errBusca } = await _sb
      .from('matriculas')
      .select('*')
      .eq('aluno_id', window._editAlunoId)
      .eq('ativa', true)
      .maybeSingle()
    if (errBusca) { toast('Erro ao verificar matrícula atual: ' + errBusca.message); return }

    const mudouPlano = !matAtual
      || matAtual.plano_tipo !== plano
      || matAtual.opcao_aulas !== opcao
      || Number(matAtual.valor_mensal) !== valor

    if (mudouPlano) {
      if (matAtual) {
        const { error: errDesativa } = await _sb.from('matriculas').update({ ativa: false }).eq('id', matAtual.id)
        if (errDesativa) { toast('Erro ao encerrar matrícula anterior: ' + errDesativa.message); return }
      }
      const { error: errMat } = await _sb.from('matriculas').insert({
        aluno_id: window._editAlunoId, plano_tipo: plano, opcao_aulas: opcao, valor_mensal: valor, fim,
        professor_id: matAtual?.professor_id || null, desconto_fixo: descontoFixo,
        desconto_avulso_valor: descontoAvulsoValor, desconto_avulso_meses: descontoAvulsoMeses, desconto_avulso_usado: 0,
      })
      if (errMat) { toast('Erro ao salvar matrícula: ' + errMat.message); return }
    } else {
      const { error: errMat } = await _sb.from('matriculas').update({
        fim, desconto_fixo: descontoFixo,
        desconto_avulso_valor: descontoAvulsoValor, desconto_avulso_meses: descontoAvulsoMeses,
      }).eq('id', matAtual.id)
      if (errMat) { toast('Erro ao salvar matrícula: ' + errMat.message); return }
    }

    document.getElementById('modal-edit-aluno').style.display = 'none'
    toast(asaasId ? '✓ Aluno atualizado! Asaas vinculado.' : '✓ Aluno atualizado!')
    navigate('alunos')
  }

  window.confirmarExcluirAluno = function(alunoId, nomeAluno) {
    document.getElementById('excluir-aluno-msg').textContent = 'Tem certeza que deseja excluir ' + nomeAluno + '?'
    document.getElementById('modal-excluir-aluno').style.display = 'flex'
    document.getElementById('btn-confirmar-exclusao').onclick = function() { excluirAluno(alunoId) }
  }

  window.excluirAluno = async function(alunoId) {
    const btn = document.getElementById('btn-confirmar-exclusao')
    btn.disabled = true; btn.textContent = 'Excluindo...'
    try {
      await _sb.from('presencas').delete().eq('aluno_id', alunoId)
      await _sb.from('saldo_aulas').delete().eq('aluno_id', alunoId)
      await _sb.from('matriculas').delete().eq('aluno_id', alunoId)
      const { data: linhasApagadas, error } = await _sb.from('perfis').delete().eq('id', alunoId).select('id')
      if (error) throw new Error(error.message)
      if (!linhasApagadas || linhasApagadas.length === 0) {
        throw new Error('Nenhuma linha foi removida em perfis. Provável bloqueio de RLS (falta policy de DELETE para o admin nessa tabela) — verifique pg_policies.')
      }
      document.getElementById('modal-excluir-aluno').style.display = 'none'
      toast('✓ Aluno excluído.')
      navigate('alunos')
    } catch(e) { toast('Erro ao excluir: ' + e.message); btn.disabled = false; btn.textContent = 'Excluir' }
  }

  if (window._pendingEditAluno) {
    const idParaEditar = window._pendingEditAluno
    window._pendingEditAluno = null
    setTimeout(() => window.editarAluno && window.editarAluno(idParaEditar), 50)
  }
}
