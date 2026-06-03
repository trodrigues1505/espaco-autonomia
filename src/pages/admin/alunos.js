/**
 * src/pages/admin/alunos.js
 * Responsabilidade: Gestão de alunos — listagem, cadastro, plano.
 * Depende de: sb, toast, NOMES, dot, badge, card, fmtDt, inputStyle
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderAlunos(container) {
  const tipo = window._perfil?.tipo
  const sb = window._sb

    if (page === 'alunos') {
    const busca = window._buscaAlunos || ''
    let q = sb.from('perfis').select('*, matriculas(plano_tipo,opcao_aulas,valor_mensal,ativa,fim)').eq('tipo','aluno').order('nome')
    // Busca asaas_customer_id separado (campo extra na tabela)
    const { data: todos } = await q
    const alunos = (todos||[]).filter(a => !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.email.toLowerCase().includes(busca.toLowerCase()))

    const planoBadge = {
      brahma:       badge('Brahma','#f0ede4','#5a5a4a'),
      shiva_1x:     badge('Shiva 1x','#e8f4e8','#1a5a1a'),
      shiva_2x:     badge('Shiva 2x','#d4edda','#155724'),
      vishnu_2x:    badge('Vishnu 2x','rgba(232,188,79,.15)','#7a5a10'),
      vishnu_livre: badge('Vishnu Livre','rgba(232,188,79,.25)','#5a3a00'),
    }

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
      ${fi('','ID no Asaas (opcional)',`<input type="text" id="ca-asaas" ${inputStyle} placeholder="cus_...">`)}
      <div style="background:rgba(232,188,79,.08);border:1px solid rgba(232,188,79,.2);border-radius:6px;padding:10px;font-size:11px;color:var(--txt2)">
        O aluno acessa com Google usando o e-mail cadastrado.
      </div>`,
      `<button onclick="document.getElementById('modal-cad-aluno').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
       <button onclick="salvarNovoAluno()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Cadastrar</button>`
    )

    const modalEditar = modal('modal-edit-aluno', 'Editar Plano',
      `<div id="edit-aluno-body">Carregando...</div>`,
      `<button onclick="document.getElementById('modal-edit-aluno').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
       <button onclick="salvarEdicaoAluno()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Salvar</button>`
    )

    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-t">Alunos</div>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="input-busca-aluno" placeholder="Buscar..." value="${busca}" oninput="window._buscaAlunos=this.value;navigate('alunos')" style="border:1px solid var(--borda);border-radius:6px;padding:6px 10px;font-size:12px;width:180px;font-family:'DM Sans',sans-serif;outline:none">
          <button onclick="document.getElementById('modal-cad-aluno').style.display='flex'" style="padding:6px 13px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px"><i class="ti ti-user-plus"></i> Cadastrar</button>
        </div>
      </div>
      <div class="content">
        <!-- Stats row 1 -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px">
          <div style="background:var(--verde);border-radius:var(--r);padding:14px 16px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:rgba(242,236,206,.7);margin-bottom:4px">Total de Alunos</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:500;color:var(--bege)">${todos?.length||0}</div>
            <div style="font-size:10px;color:rgba(242,236,206,.6);margin-top:2px">${(todos||[]).filter(a=>a.ativo).length} ativos</div>
          </div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:4px">Receita Mensal Est.</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:#1a5a1a">R$${(todos||[]).reduce((s,a)=>{const m=(a.matriculas||[]).find(m=>m.ativa);return s+(m?.valor_mensal||0)},0).toFixed(0)}</div>
            <div style="font-size:10px;color:var(--txt2);margin-top:2px">soma das mensalidades</div>
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
        <!-- Stats row 2: por plano com barra -->
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
            const recMes=(todos||[]).filter(a=>a.matriculas?.some(m=>m.ativa&&m.plano_tipo===k)).reduce((s,a)=>{const m=(a.matriculas||[]).find(m=>m.ativa);return s+(m?.valor_mensal||0)},0)
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
          `<div style="display:grid;grid-template-columns:1fr 80px 80px 80px 70px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
            <span>Aluno</span><span>Plano</span><span>Aulas</span><span>Validade</span><span></span>
          </div>
          ${alunos.length===0?'<div style="padding:18px;font-size:12px;color:var(--txt2)">Nenhum aluno encontrado.</div>':
            alunos.map(a => {
              const mat = (a.matriculas||[]).find(m=>m.ativa)
              const initials = a.nome.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()
              const opcaoLabel = mat?.opcao_aulas===99?'Livre':mat?.opcao_aulas===2?'2×/sem':mat?.opcao_aulas===1?'1×/sem':'—'
              const vencida = mat?.fim && new Date(mat.fim) < new Date()
              return `<div style="display:grid;grid-template-columns:1fr 80px 80px 80px 70px;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:28px;height:28px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:var(--verde);flex-shrink:0">${initials}</div>
                  <div><div style="font-weight:500">${a.nome}</div><div style="font-size:10px;color:var(--txt2)">${a.email}</div></div>
                </div>
                <span>${mat?PLANO_BADGES[mat?.plano_tipo]||mat?.plano_tipo||'—':badge('Sem plano','#fceaea','#8a1a1a')}</span>
                <span style="font-size:11px;color:var(--txt2)">${opcaoLabel}</span>
                <span style="font-size:11px;color:${vencida?'#c0392b':'var(--txt2)'}">${mat?.fim?new Date(mat.fim+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}):vencida?'Vencida':'—'}</span>
                <button onclick="editarAluno('${a.id}')" style="padding:3px 10px;background:transparent;border:1px solid var(--borda);border-radius:5px;font-size:11px;cursor:pointer;color:var(--txt2);font-family:'DM Sans',sans-serif">Editar</button>
              </div>`
            }).join('')
          }`
        )}
      </div>
      ${modalCadastro}
      ${modalEditar}
    `

    // valoresPlano → use PLANO_VALORES
    // opcaoPlano → use PLANO_OPCOES
    window.updateValorPlano = function() {
      const p = document.getElementById('ca-plano')?.value
      if (p && document.getElementById('ca-valor')) document.getElementById('ca-valor').value = valoresPlano[p]||0
    }

    window.salvarNovoAluno = async function() {
      const nome = document.getElementById('ca-nome').value.trim()
      const email = document.getElementById('ca-email').value.trim()
      const tel = document.getElementById('ca-tel').value.trim()
      const plano = document.getElementById('ca-plano').value
      const opcao = PLANO_OPCOES[plano]||1
      const valor = Number(document.getElementById('ca-valor').value)||PLANO_VALORES[plano]||0
      if (!nome||!email) { toast('Preencha nome e e-mail'); return }

      // Cria usuário no Auth (admin API não disponível no client — orienta fluxo de convite)
      const { data: invited, error: errInv } = await sb.auth.admin?.inviteUserByEmail(email).catch(()=>({error:{message:'use service role'}})) || {}

      // Fallback: cria perfil direto e orienta senha manual
      const { data: existente } = await sb.from('perfis').select('id').eq('email', email).single()
      let alunoId = existente?.id

      if (!alunoId) {
        // Pré-cadastra perfil — aluno completa ao fazer login com Google
        const tempId = crypto.randomUUID()
        const { error: errP } = await sb.from('perfis').insert({
          id: tempId, nome, email, telefone: tel||null, tipo: 'aluno', ativo: true
        })
        if (!errP) alunoId = tempId
      }

      if (alunoId) {
        const asaasNovo = document.getElementById('ca-asaas')?.value.trim() || null
        await sb.from('matriculas').update({ativa:false}).eq('aluno_id', alunoId).eq('ativa', true)
        await sb.from('matriculas').insert({ aluno_id: alunoId, plano_tipo: plano, opcao_aulas: opcao, valor_mensal: valor })
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
      document.getElementById('edit-aluno-body').innerHTML = `
        <div style="margin-bottom:10px"><div style="font-weight:500;font-size:14px">${a.nome}</div><div style="font-size:11px;color:var(--txt2)">${a.email}</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${fi('','Plano',`<select id="ea-plano" ${inputStyle} onchange="updateValorEdicao()">
            <option value="brahma" ${mat?.plano_tipo==='brahma'?'selected':''}>Brahma — 1× por semana — R$100/mês</option>
            <option value="shiva_1x" ${mat?.plano_tipo==='shiva_1x'?'selected':''}>Shiva 1x — 1× por semana — R$150/mês</option>
            <option value="shiva_2x" ${mat?.plano_tipo==='shiva_2x'?'selected':''}>Shiva 2x — 2× por semana — R$200/mês</option>
            <option value="vishnu_2x" ${mat?.plano_tipo==='vishnu_2x'?'selected':''}>Vishnu 2x — 2× por semana — R$250/mês</option>
            <option value="vishnu_livre" ${mat?.plano_tipo==='vishnu_livre'?'selected':''}>Vishnu Livre — uso livre — R$300/mês</option>
          </select>`)}
        </div>
        ${fi('','Valor mensal (R$)',`<input type="number" id="ea-valor" ${inputStyle} value="${mat?.valor_mensal||0}">`)}
        ${fi('','Vencimento',`<input type="date" id="ea-fim" ${inputStyle} value="${mat?.fim||''}">`)}
        ${fi('','Status',`<select id="ea-ativo" ${inputStyle}><option value="true" ${a.ativo?'selected':''}>Ativo</option><option value="false" ${!a.ativo?'selected':''}>Inativo</option></select>`)}
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">ID no Asaas (cus_...)</label>
          <input id="ea-asaas" placeholder="cus_000..." style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none" value="${a.asaas_customer_id||''}">
          <div style="font-size:10px;color:${a.asaas_customer_id?'#1a5a1a':'#c0392b'};margin-top:3px">${a.asaas_customer_id?'✓ Vinculado ao Asaas':'⚠ Não vinculado — pagamentos não sincronizados'}</div>
        </div>
      `
      document.getElementById('modal-edit-aluno').style.display = 'flex'
    }

    window.updateValorEdicao = function() {
      const p = document.getElementById('ea-plano')?.value
      if (p && document.getElementById('ea-valor')) document.getElementById('ea-valor').value = valoresPlano[p]||0
    }

    window.salvarEdicaoAluno = async function() {
      const plano = document.getElementById('ea-plano').value
      const opcao = PLANO_OPCOES[plano]||1
      const valor = Number(document.getElementById('ea-valor').value)||PLANO_VALORES[plano]||0
      const fim = document.getElementById('ea-fim').value || null
      const ativo = document.getElementById('ea-ativo').value === 'true'
      await sb.from('matriculas').update({ativa:false}).eq('aluno_id', window._editAlunoId).eq('ativa', true)
      await sb.from('matriculas').insert({ aluno_id: window._editAlunoId, plano_tipo: plano, opcao_aulas: opcao, valor_mensal: valor, fim })
      const asaasId = document.getElementById('ea-asaas')?.value?.trim() || null
      await sb.from('perfis').update({ ativo, asaas_customer_id: asaasId }).eq('id', window._editAlunoId)
      document.getElementById('modal-edit-aluno').style.display = 'none'
      toast(asaasId ? '✓ Aluno atualizado! Asaas vinculado.' : '✓ Aluno atualizado!')
      navigate('alunos')
    }
    return
  }

}