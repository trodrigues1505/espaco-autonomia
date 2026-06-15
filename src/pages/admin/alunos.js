/**
 * src/pages/admin/alunos.js
 * Gestão de alunos
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderAlunos(container, page) {
  const sb = window._sb
  const perfil = window._perfil
  const tipo = perfil?.tipo

  const busca = window._buscaAlunos || ''
  const filtroPlanok = window._filtroPlanoAlunos || ''

  const [perfisRes, saldoRes, professoresRes] = await Promise.all([
    sb.from('perfis').select('*, matriculas(plano_tipo,opcao_aulas,valor_mensal,desconto_fixo,desconto_avulso_valor,desconto_avulso_meses,desconto_avulso_usado,ativa,fim,professor_id)').eq('tipo','aluno').order('nome'),
    sb.from('saldo_disponivel').select('aluno_id,saldo_total'),
    sb.from('perfis').select('id,nome').eq('tipo','professor').order('nome'),
  ])

  const todos = perfisRes.data || []
  const professores = professoresRes.data || []

  const saldoPorAluno = Object.fromEntries(
    (saldoRes.data || []).map(s => [s.aluno_id, s.saldo_total ?? 0])
  )

  let alunos = todos
    .filter(a => !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.email.toLowerCase().includes(busca.toLowerCase()))
    .filter(a => !filtroPlanok || (a.matriculas||[]).some(m=>m.ativa && m.plano_tipo===filtroPlanok))

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
    <div style="background:rgba(232,188,79,.08);border:1px solid rgba(232,188,79,.2);border-radius:6px;padding:10px;font-size:11px;color:var(--txt2)">
      O aluno acessa com Google usando o e-mail cadastrado.
    </div>`,
    `<button onclick="document.getElementById('modal-cad-aluno').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
     <button onclick="salvarNovoAluno()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Cadastrar</button>`
  )

  const modalEditar = modal('modal-edit-aluno', 'Editar Aluno',
    `<div id="edit-aluno-body">Carregando...</div>`,
    `<button onclick="document.getElementById('modal-edit-aluno').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
     <button onclick="salvarEdicaoAluno()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Salvar</button>`
  )

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Alunos</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input id="input-busca-aluno" placeholder="Buscar..." value="${busca}" oninput="window._buscaAlunos=this.value;navigate('alunos')" style="border:1px solid var(--borda);border-radius:6px;padding:6px 10px;font-size:12px;width:140px;font-family:'DM Sans',sans-serif;outline:none">
        <select onchange="window._filtroPlanoAlunos=this.value;navigate('alunos')" style="border:1px solid var(--borda);border-radius:6px;padding:6px 10px;font-size:12px;font-family:'DM Sans',sans-serif;outline:none;background:#fff;color:var(--txt)">
          <option value="" ${!filtroPlanok?'selected':''}>Todos os planos</option>
          <option value="brahma"       ${filtroPlanok==='brahma'      ?'selected':''}>Brahma</option>
          <option value="shiva_1x"     ${filtroPlanok==='shiva_1x'    ?'selected':''}>Shiva 1x</option>
          <option value="shiva_2x"     ${filtroPlanok==='shiva_2x'    ?'selected':''}>Shiva 2x</option>
          <option value="vishnu_2x"    ${filtroPlanok==='vishnu_2x'   ?'selected':''}>Vishnu 2x</option>
          <option value="vishnu_livre" ${filtroPlanok==='vishnu_livre'?'selected':''}>Vishnu Livre</option>
        </select>
        <button onclick="document.getElementById('modal-cad-aluno').style.display='flex'" style="padding:6px 13px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px"><i class="ti ti-user-plus"></i> Cadastrar</button>
      </div>
    </div>
    <div class="content">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px">
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
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Sem Asaas</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:500;color:#e67e22">${(todos||[]).filter(a=>!a.asaas_customer_id).length}</div>
          <div style="font-size:10px;color:var(--txt2);margin-top:2px">não vinculados</div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Vencendo em 7d</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:500;color:${(()=>{const em7=new Date();em7.setDate(em7.getDate()+7);return (todos||[]).filter(a=>{const m=(a.matriculas||[]).find(m=>m.ativa);return m?.fim&&new Date(m.fim+'T12:00')<=em7&&new Date(m.fim+'T12:00')>=new Date()}).length})()>0?'#c0392b':'var(--verde)'}">
            ${(()=>{const em7=new Date();em7.setDate(em7.getDate()+7);return (todos||[]).filter(a=>{const m=(a.matriculas||[]).find(m=>m.ativa);return m?.fim&&new Date(m.fim+'T12:00')<=em7&&new Date(m.fim+'T12:00')>=new Date()}).length})()}
          </div>
          <div style="font-size:10px;color:var(--txt2);margin-top:2px">planos vencendo</div>
        </div>
      </div>
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 18px;margin-bottom:14px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:12px;font-weight:500">Distribuição por Plano</div>
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
      ${card('Lista de Alunos ('+alunos.length+')', '',
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
      )}
    </div>
    ${modalCadastro}
    ${modalEditar}

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

  window.updateValorPlano = function() {
    const p = document.getElementById('ca-plano')?.value
    if (p && document.getElementById('ca-valor')) document.getElementById('ca-valor').value = PLANO_VALORES[p]||0
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

    let errInv = null
    try {
      const r = await sb.auth.admin?.inviteUserByEmail(email)
      errInv = r?.error
    } catch(e) { errInv = { message: 'use service role key' } }

    const { data: existente } = await sb.from('perfis').select('id').eq('email', email).single()
    let alunoId = existente?.id

    if (!alunoId) {
      const tempId = crypto.randomUUID()
      const { error: errP } = await sb.from('perfis').insert({
        id: tempId, nome, email, telefone: tel||null, tipo: 'aluno', ativo: true
      })
      if (!errP) alunoId = tempId
    }

    if (alunoId) {
      const asaasNovo = document.getElementById('ca-asaas')?.value.trim() || null
      await sb.from('matriculas').update({ativa:false}).eq('aluno_id', alunoId).eq('ativa', true)
      await sb.from('matriculas').insert({
        aluno_id: alunoId,
        plano_tipo: plano,
        opcao_aulas: opcao,
        valor_mensal: valor,
        professor_id: professorId,
      })
      if (asaasNovo) await sb.from('perfis').update({ asaas_customer_id: asaasNovo }).eq('id', alunoId)
      document.getElementById('modal-cad-aluno').style.display = 'none'
      toast('✓ Aluno cadastrado! Peça para entrar com Google usando: '+email)
      navigate('alunos')
    } else {
      toast('Erro ao cadastrar. Verifique se o e-mail já existe.')
    }
  }

  window.editarAluno = async function(alunoId) {
    const { data: a } = await sb.from('perfis').select('*, matriculas(*)').eq('id', alunoId).single()
    const mat = (a.matriculas||[]).find(m=>m.ativa)
    window._editAlunoId = alunoId

    // calcula desconto avulso ativo
    const descAvulsoAtivo = mat && mat.desconto_avulso_meses > mat.desconto_avulso_usado

    document.getElementById('edit-aluno-body').innerHTML = `
      <!-- Dados pessoais -->
      <div style="background:rgba(242,236,206,.3);border:1px solid var(--borda);border-radius:8px;padding:12px;margin-bottom:14px">
        <div style="font-size:11px;font-weight:500;color:var(--verde);margin-bottom:10px;text-transform:uppercase;letter-spacing:.6px">Dados Pessoais</div>
        ${fi('','Nome completo',`<input type="text" id="ea-nome" ${inputStyle} value="${(a.nome||'').replace(/"/g,'&quot;')}">`)}
        ${fi('','Telefone',`<input type="tel" id="ea-tel" ${inputStyle} value="${a.telefone||''}" placeholder="(11) 99999-9999">`)}
        <div style="font-size:11px;color:var(--txt2);margin-top:4px">E-mail: <strong>${a.email}</strong> (não editável — usado para login)</div>
      </div>

      <!-- Plano -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${fi('','Plano',`<select id="ea-plano" ${inputStyle} onchange="updateValorEdicao()">
          <option value="brahma" ${mat?.plano_tipo==='brahma'?'selected':''}>Brahma — 1× por semana — R$100/mês</option>
          <option value="shiva_1x" ${mat?.plano_tipo==='shiva_1x'?'selected':''}>Shiva 1x — 1× por semana — R$150/mês</option>
          <option value="shiva_2x" ${mat?.plano_tipo==='shiva_2x'?'selected':''}>Shiva 2x — 2× por semana — R$200/mês</option>
          <option value="vishnu_2x" ${mat?.plano_tipo==='vishnu_2x'?'selected':''}>Vishnu 2x — 2× por semana — R$250/mês</option>
          <option value="vishnu_livre" ${mat?.plano_tipo==='vishnu_livre'?'selected':''}>Vishnu Livre — uso livre — R$300/mês</option>
        </select>`)}
        ${fi('','Professor',`<select id="ea-professor" ${inputStyle}>
          <option value="">— Sem professor —</option>
          ${professores.map(p=>`<option value="${p.id}" ${mat?.professor_id===p.id?'selected':''}>${p.nome}</option>`).join('')}
        </select>`)}
      </div>
      ${fi('','Valor mensal (R$)',`<input type="number" id="ea-valor" ${inputStyle} value="${mat?.valor_mensal||0}">`)}
      ${fi('','Vencimento',`<input type="date" id="ea-fim" ${inputStyle} value="${mat?.fim||''}">`)}
      ${fi('','Status',`<select id="ea-ativo" ${inputStyle}><option value="true" ${a.ativo?'selected':''}>Ativo</option><option value="false" ${!a.ativo?'selected':''}>Inativo</option></select>`)}

      <!-- Descontos -->
      <div style="background:rgba(232,188,79,.08);border:1px solid rgba(232,188,79,.25);border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:500;color:var(--verde);margin-bottom:10px;text-transform:uppercase;letter-spacing:.6px">🏷 Descontos</div>

        <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:10px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Desconto fixo mensal (R$)</label>
          <input type="number" id="ea-desconto-fixo" min="0" step="0.01" value="${mat?.desconto_fixo||0}" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          <div style="font-size:10px;color:var(--txt2)">Aplica todo mês automaticamente. Ex: R$20 de desconto familiar.</div>
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
        ${descAvulsoAtivo?`<div style="margin-top:8px;font-size:11px;color:#e67e22;background:rgba(230,126,34,.08);border-radius:5px;padding:6px 10px">
          ⏳ Desconto avulso ativo: ${mat.desconto_avulso_meses - mat.desconto_avulso_usado} mês(es) restante(s) de ${mat.desconto_avulso_meses} total
        </div>`:''}
        <div style="margin-top:8px;font-size:10px;color:var(--txt2)">Desconto avulso: ex: R$30 por 3 meses para um aluno que vai viajar. Zere os campos para cancelar.</div>
      </div>

      <!-- Asaas -->
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
        <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">ID no Asaas (cus_...)</label>
        <input id="ea-asaas" placeholder="cus_000..." style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none" value="${a.asaas_customer_id||''}">
        <div style="font-size:10px;color:${a.asaas_customer_id?'#1a5a1a':'#c0392b'};margin-top:3px">${a.asaas_customer_id?'✓ Vinculado ao Asaas':'⚠ Não vinculado — pagamentos não sincronizados'}</div>
      </div>

      <!-- Créditos manuais -->
      <div style="background:rgba(242,236,206,.4);border:1px solid var(--borda);border-radius:8px;padding:12px;margin-bottom:4px">
        <div style="font-size:11px;font-weight:500;color:var(--verde);margin-bottom:6px">➕ Créditos manuais de aulas</div>
        <div style="font-size:11px;color:var(--txt2);margin-bottom:8px">Para repor aulas anteriores ao app ou por acordo especial.</div>
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
    const { error } = await sb.rpc('creditar_aulas_manual', {
      p_aluno_id: alunoId,
      p_quantidade: qtd,
      p_motivo: motivo,
    })
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
    const professorId = document.getElementById('ea-professor').value || null

    const descontoFixo        = Number(document.getElementById('ea-desconto-fixo').value) || 0
    const descontoAvulsoValor = Number(document.getElementById('ea-desconto-avulso-valor').value) || 0
    const descontoAvulsoMeses = Number(document.getElementById('ea-desconto-avulso-meses').value) || 0

    // Salva dados pessoais
    const { error: errPerfil } = await sb.from('perfis').update({
      nome,
      telefone: tel || null,
      ativo,
      asaas_customer_id: asaasId,
    }).eq('id', window._editAlunoId)
    if (errPerfil) { toast('Erro ao salvar perfil: ' + errPerfil.message); return }

    // Salva matrícula (desativa a atual, cria nova com os valores atualizados)
    await sb.from('matriculas').update({ativa:false}).eq('aluno_id', window._editAlunoId).eq('ativa', true)
    const { error: errMat } = await sb.from('matriculas').insert({
      aluno_id:               window._editAlunoId,
      plano_tipo:             plano,
      opcao_aulas:            opcao,
      valor_mensal:           valor,
      fim,
      professor_id:           professorId,
      desconto_fixo:          descontoFixo,
      desconto_avulso_valor:  descontoAvulsoValor,
      desconto_avulso_meses:  descontoAvulsoMeses,
      desconto_avulso_usado:  0,
    })
    if (errMat) { toast('Erro ao salvar matrícula: ' + errMat.message); return }

    document.getElementById('modal-edit-aluno').style.display = 'none'
    toast(asaasId ? '✓ Aluno atualizado! Asaas vinculado.' : '✓ Aluno atualizado!')
    navigate('alunos')
  }

  window.confirmarExcluirAluno = function(alunoId, nomeAluno) {
    document.getElementById('excluir-aluno-msg').textContent = 'Tem certeza que deseja excluir ' + nomeAluno + '?'
    document.getElementById('modal-excluir-aluno').style.display = 'flex'
    document.getElementById('btn-confirmar-exclusao').onclick = function() {
      excluirAluno(alunoId)
    }
  }

  window.excluirAluno = async function(alunoId) {
    const btn = document.getElementById('btn-confirmar-exclusao')
    btn.disabled = true
    btn.textContent = 'Excluindo...'
    try {
      await sb.from('presencas').delete().eq('aluno_id', alunoId)
      await sb.from('saldo_aulas').delete().eq('aluno_id', alunoId)
      await sb.from('matriculas').delete().eq('aluno_id', alunoId)
      const { error } = await sb.from('perfis').delete().eq('id', alunoId)
      if (error) throw new Error(error.message)
      document.getElementById('modal-excluir-aluno').style.display = 'none'
      toast('✓ Aluno excluído.')
      navigate('alunos')
    } catch(e) {
      toast('Erro ao excluir: ' + e.message)
      btn.disabled = false
      btn.textContent = 'Excluir'
    }
  }

  // Abre modal de edição automaticamente se vier de outra aba (ex: pagamentos)
  if (window._pendingEditAluno) {
    const idParaEditar = window._pendingEditAluno
    window._pendingEditAluno = null
    setTimeout(() => window.editarAluno && window.editarAluno(idParaEditar), 50)
  }
}     
