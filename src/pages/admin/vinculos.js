/**
 * src/pages/admin/vinculos.js
 * Gestão do vínculo histórico entre professor e aluno, por período de datas.
 * Cada aluno pode ter no máximo um vínculo "em aberto" (sem data_fim) por vez.
 */

import { sb } from '../../lib/supabase.js'
import { toast, badge, card, modal, fi, inputStyle } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'

function fmtData(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export async function renderVinculos(container, page) {
  const _sb = window._sb || sb

  const filtroProf = window._vincFiltroProf || ''
  const buscaAluno = window._vincBusca || ''
  const somenteAtuais = window._vincSomenteAtuais ?? true

  const [vincsRes, alunosRes, profsRes] = await Promise.all([
    _sb.from('vinculos_professor_aluno')
      .select('*, aluno:perfis!aluno_id(nome), professor:perfis!professor_id(nome)')
      .order('data_inicio', { ascending: false }),
    _sb.from('perfis').select('id,nome').eq('tipo', 'aluno').eq('ativo', true).order('nome'),
    _sb.from('perfis').select('id,nome').eq('tipo', 'professor').order('nome'),
  ])

  const vinculos = vincsRes.data || []
  const alunos = alunosRes.data || []
  const professores = profsRes.data || []

  // Mapa pra acesso seguro nos handlers (evita interpolar nome/observação em onclick)
  window._vinculosMap = Object.fromEntries(vinculos.map(v => [v.id, v]))

  const listaFiltrada = vinculos
    .filter(v => !filtroProf || v.professor_id === filtroProf)
    .filter(v => !buscaAluno || (v.aluno?.nome || '').toLowerCase().includes(buscaAluno.toLowerCase()))
    .filter(v => !somenteAtuais || !v.data_fim)

  const modalNovo = modal('modal-novo-vinculo', 'Novo Vínculo',
    `${fi('', 'Aluno', `<select id="nv-aluno" ${inputStyle}>
        <option value="">— selecionar aluno —</option>
        ${alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join('')}
      </select>`)}
    ${fi('', 'Professor', `<select id="nv-professor" ${inputStyle}>
        <option value="">— selecionar professor —</option>
        ${professores.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')}
      </select>`)}
    ${fi('', 'Data de início', `<input type="date" id="nv-data-inicio" ${inputStyle} value="${new Date().toISOString().slice(0,10)}">`)}
    ${fi('', 'Observação (opcional)', `<textarea id="nv-obs" rows="2" ${inputStyle} placeholder="Ex: aluno pediu troca de professor"></textarea>`)}
    <div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.3);border-radius:6px;padding:9px 12px;font-size:11px;color:#7a5a10">
      Se o aluno já tiver um vínculo em aberto, ele será encerrado automaticamente um dia antes desta data de início.
    </div>`,
    `<button onclick="document.getElementById('modal-novo-vinculo').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
     <button onclick="salvarNovoVinculo()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Vincular</button>`
  )

  const modalEditar = modal('modal-editar-vinculo', 'Editar Vínculo',
    `<div id="ev-aluno-professor" style="font-size:13px;font-weight:500;color:var(--verde);margin-bottom:12px"></div>
    <input type="hidden" id="ev-id">
    ${fi('', 'Data de início', `<input type="date" id="ev-data-inicio" ${inputStyle}>`)}
    <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--txt2);margin:8px 0;cursor:pointer">
      <input type="checkbox" id="ev-em-aberto" style="accent-color:var(--verde)"> Vínculo ainda em aberto (sem data de fim)
    </label>
    <div id="ev-data-fim-wrap">
      ${fi('', 'Data de fim', `<input type="date" id="ev-data-fim" ${inputStyle}>`)}
    </div>
    ${fi('', 'Observação (opcional)', `<textarea id="ev-obs" rows="2" ${inputStyle}></textarea>`)}`,
    `<button onclick="document.getElementById('modal-editar-vinculo').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
     <button onclick="salvarEdicaoVinculo()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Salvar</button>`
  )

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Vínculos Professor × Aluno</div>
      <button onclick="document.getElementById('modal-novo-vinculo').style.display='flex'" style="padding:6px 13px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px"><i class="ti ti-link-plus"></i> Novo Vínculo</button>
    </div>
    <div class="content">
      <div style="background:rgba(31,56,31,.04);border:1px solid rgba(31,56,31,.12);border-radius:6px;padding:9px 13px;font-size:12px;color:var(--verde);margin-bottom:12px">
        <i class="ti ti-info-circle"></i>
        O repasse de cada mês usa o vínculo que estava em vigor <strong>naquele mês</strong>, não o vínculo atual — trocar de professor hoje não altera meses já fechados.
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:flex-end">
        <div style="display:flex;flex-direction:column;gap:3px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Professor</label>
          <select onchange="window._vincFiltroProf=this.value;navigate('vinculos')" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;background:#fff">
            <option value="" ${!filtroProf?'selected':''}>Todos</option>
            ${professores.map(p=>`<option value="${p.id}" ${filtroProf===p.id?'selected':''}>${p.nome}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:3px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500">Buscar aluno</label>
          <input id="input-busca-vinc" value="${buscaAluno}" placeholder="Nome do aluno..." oninput="window._vincBusca=this.value;navigate('vinculos')" style="border:1px solid var(--borda);border-radius:5px;padding:5px 8px;font-size:12px;font-family:'DM Sans',sans-serif;width:180px">
        </div>
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--txt2);cursor:pointer;align-self:flex-end;padding:6px 0">
          <input type="checkbox" ${somenteAtuais?'checked':''} onchange="window._vincSomenteAtuais=this.checked;navigate('vinculos')" style="accent-color:var(--verde)">
          Mostrar só vínculos em aberto
        </label>
      </div>
      ${card('Vínculos ('+listaFiltrada.length+')', '',
        `<div style="display:grid;grid-template-columns:1fr 1fr 100px 100px 1fr 130px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
          <span>Aluno</span><span>Professor</span><span>Início</span><span>Fim</span><span>Obs.</span><span>Ações</span>
        </div>
        ${listaFiltrada.length===0?'<div style="padding:18px;font-size:12px;color:var(--txt2)">Nenhum vínculo encontrado.</div>':
          listaFiltrada.map(v => {
            const emAberto = !v.data_fim
            return `<div style="display:grid;grid-template-columns:1fr 1fr 100px 100px 1fr 130px;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
              <span style="font-weight:500">${v.aluno?.nome||'—'}</span>
              <span>${v.professor?.nome||'—'}</span>
              <span style="font-size:11px;color:var(--txt2)">${fmtData(v.data_inicio)}</span>
              <span>${emAberto?badge('Atual','#e8f4e8','#1a5a1a'):`<span style="font-size:11px;color:var(--txt2)">${fmtData(v.data_fim)}</span>`}</span>
              <span style="font-size:11px;color:var(--txt2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(v.observacao||'').replace(/"/g,'&quot;')}">${v.observacao||'—'}</span>
              <div style="display:flex;gap:4px">
                <button onclick="abrirEditarVinculo('${v.id}')" style="padding:3px 8px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer" title="Editar datas">✎</button>
                ${emAberto?`<button onclick="confirmarDesvincular('${v.id}')" style="padding:3px 8px;background:rgba(232,188,79,.15);color:#7a5a10;border:none;border-radius:4px;font-size:10px;cursor:pointer" title="Desvincular (encerrar hoje)">Desvincular</button>`:''}
                <button onclick="confirmarExcluirVinculo('${v.id}')" style="padding:3px 8px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer" title="Excluir registro">✕</button>
              </div>
            </div>`
          }).join('')
        }`
      )}
    </div>
    ${modalNovo}
    ${modalEditar}
    <div id="modal-confirmar-vinc" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);z-index:200;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:12px;width:400px;max-width:100%;overflow:hidden">
        <div style="padding:20px">
          <div id="conf-vinc-msg" style="font-size:13px;color:var(--txt);margin-bottom:14px"></div>
          <div id="conf-vinc-data-wrap" style="display:none;margin-bottom:14px">
            ${fi('', 'Data de fim', `<input type="date" id="conf-vinc-data" ${inputStyle} value="${new Date().toISOString().slice(0,10)}">`)}
          </div>
        </div>
        <div style="padding:0 20px 16px;display:flex;justify-content:flex-end;gap:8px">
          <button onclick="document.getElementById('modal-confirmar-vinc').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
          <button id="btn-confirmar-vinc" style="padding:7px 14px;background:#c0392b;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Confirmar</button>
        </div>
      </div>
    </div>
  `

  uiAnimar(container)

  window.salvarNovoVinculo = async function() {
    const alunoId = document.getElementById('nv-aluno').value
    const professorId = document.getElementById('nv-professor').value
    const dataInicio = document.getElementById('nv-data-inicio').value
    const obs = document.getElementById('nv-obs').value.trim() || null
    if (!alunoId) { toast('Selecione o aluno'); return }
    if (!professorId) { toast('Selecione o professor'); return }
    if (!dataInicio) { toast('Informe a data de início'); return }

    const { error } = await _sb.rpc('admin_vincular_aluno_professor', {
      p_aluno_id: alunoId,
      p_professor_id: professorId,
      p_data_inicio: dataInicio,
      p_observacao: obs,
    })
    if (error) { toast('Erro: ' + error.message); return }
    document.getElementById('modal-novo-vinculo').style.display = 'none'
    toast('✓ Vínculo criado!')
    navigate('vinculos')
  }

  window.abrirEditarVinculo = function(id) {
    const v = window._vinculosMap[id]
    if (!v) return
    document.getElementById('ev-aluno-professor').textContent = `${v.aluno?.nome||'—'} → ${v.professor?.nome||'—'}`
    document.getElementById('ev-id').value = v.id
    document.getElementById('ev-data-inicio').value = v.data_inicio
    document.getElementById('ev-obs').value = v.observacao || ''
    const emAberto = !v.data_fim
    document.getElementById('ev-em-aberto').checked = emAberto
    document.getElementById('ev-data-fim').value = v.data_fim || ''
    document.getElementById('ev-data-fim-wrap').style.display = emAberto ? 'none' : 'block'
    document.getElementById('modal-editar-vinculo').style.display = 'flex'
  }

  document.getElementById('ev-em-aberto')?.addEventListener('change', function() {
    document.getElementById('ev-data-fim-wrap').style.display = this.checked ? 'none' : 'block'
  })

  window.salvarEdicaoVinculo = async function() {
    const id = document.getElementById('ev-id').value
    const dataInicio = document.getElementById('ev-data-inicio').value
    const emAberto = document.getElementById('ev-em-aberto').checked
    const dataFim = emAberto ? null : (document.getElementById('ev-data-fim').value || null)
    const obs = document.getElementById('ev-obs').value.trim() || null
    if (!dataInicio) { toast('Informe a data de início'); return }
    if (!emAberto && !dataFim) { toast('Informe a data de fim, ou marque como "em aberto"'); return }

    const { error } = await _sb.rpc('admin_editar_vinculo', {
      p_vinculo_id: id,
      p_data_inicio: dataInicio,
      p_data_fim: dataFim,
      p_observacao: obs,
    })
    if (error) { toast('Erro: ' + error.message); return }
    document.getElementById('modal-editar-vinculo').style.display = 'none'
    toast('✓ Vínculo atualizado!')
    navigate('vinculos')
  }

  window.confirmarDesvincular = function(id) {
    const v = window._vinculosMap[id]
    if (!v) return
    document.getElementById('conf-vinc-msg').textContent =
      `Desvincular ${v.aluno?.nome||'aluno'} de ${v.professor?.nome||'professor'}?`
    document.getElementById('conf-vinc-data-wrap').style.display = 'block'
    document.getElementById('modal-confirmar-vinc').style.display = 'flex'
    document.getElementById('btn-confirmar-vinc').textContent = 'Desvincular'
    document.getElementById('btn-confirmar-vinc').onclick = async function() {
      const dataFim = document.getElementById('conf-vinc-data').value
      if (!dataFim) { toast('Informe a data de fim'); return }
      const { error } = await _sb.rpc('admin_desvincular_aluno', { p_aluno_id: v.aluno_id, p_data_fim: dataFim })
      if (error) { toast('Erro: ' + error.message); return }
      document.getElementById('modal-confirmar-vinc').style.display = 'none'
      toast('✓ Aluno desvinculado')
      navigate('vinculos')
    }
  }

  window.confirmarExcluirVinculo = function(id) {
    const v = window._vinculosMap[id]
    if (!v) return
    document.getElementById('conf-vinc-msg').textContent =
      `Excluir este registro de vínculo (${v.aluno?.nome||'aluno'} × ${v.professor?.nome||'professor'})? Isso remove o histórico, não pode ser desfeito.`
    document.getElementById('conf-vinc-data-wrap').style.display = 'none'
    document.getElementById('modal-confirmar-vinc').style.display = 'flex'
    document.getElementById('btn-confirmar-vinc').textContent = 'Excluir'
    document.getElementById('btn-confirmar-vinc').onclick = async function() {
      const { error } = await _sb.rpc('admin_excluir_vinculo', { p_vinculo_id: id })
      if (error) { toast('Erro: ' + error.message); return }
      document.getElementById('modal-confirmar-vinc').style.display = 'none'
      toast('✓ Vínculo excluído')
      navigate('vinculos')
    }
  }
}
