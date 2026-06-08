/**
 * src/pages/admin/professores.js
 * Gestão de professores
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderProfessores(container, page) {
  const sb = window._sb
  const perfil = window._perfil
  const tipo = perfil?.tipo

    const { data: profs } = await sb.from('perfis').select('*').eq('tipo','professor').order('nome')
    const { data: todos_alunos } = await sb.from('perfis').select('id,nome,email').eq('tipo','aluno').order('nome')

    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-t">Professores</div>
        <button onclick="document.getElementById('modal-cad-prof').style.display='flex'" style="padding:6px 13px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px"><i class="ti ti-user-plus"></i> Cadastrar Professor</button>
      </div>
      <div class="content">
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden;margin-bottom:16px">
          <div style="display:grid;grid-template-columns:1fr 160px 70px 80px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
            <span>Professor</span><span>Especialidades</span><span>Status</span><span></span>
          </div>
          ${(profs||[]).length===0?'<div style="padding:18px;font-size:12px;color:var(--txt2)">Nenhum professor cadastrado.</div>':
            (profs||[]).map(p=>`<div style="display:grid;grid-template-columns:1fr 160px 70px 80px;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:28px;height:28px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:var(--verde)">${p.nome.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</div>
                <div><div style="font-weight:500">${p.nome}</div><div style="font-size:10px;color:var(--txt2)">${p.email}</div></div>
              </div>
              <span style="font-size:11px;color:var(--txt2)">${(()=>{try{const m=Array.isArray(p.modalidades)?p.modalidades:(p.modalidades?JSON.parse(p.modalidades):[]);return m.length?m.map(x=>({hatha:'Hatha',acro:'Acro',raja:'Raja'}[x]||x)).join(', '):'Todas'}catch(e){return'Todas'}})()}</span>
              <span style="background:${p.ativo?'#e8f4e8':'#fceaea'};color:${p.ativo?'#1a5a1a':'#8a1a1a'};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:500">${p.ativo?'Ativo':'Inativo'}</span>
              <button onclick="editarProfessor('${p.id}')" style="padding:3px 10px;background:transparent;border:1px solid var(--borda);border-radius:5px;font-size:11px;cursor:pointer;color:var(--txt2);font-family:'DM Sans',sans-serif">Editar</button>
            </div>`).join('')
          }
        </div>
        <div style="background:rgba(31,56,31,.04);border:1px solid rgba(31,56,31,.12);border-radius:6px;padding:10px 14px;font-size:12px;color:var(--verde)">
          <strong>Dica:</strong> Para promover um aluno existente a professor, edite o aluno e mude o tipo para "Professor" no banco de dados, ou cadastre um novo professor abaixo.
        </div>
      </div>
      <div id="modal-cad-prof" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.45);z-index:100;align-items:center;justify-content:center">
        <div style="background:#fff;border-radius:10px;width:440px;max-width:95vw">
          <div style="padding:18px 22px 14px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
            <span style="font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:500;color:var(--verde)">Cadastrar Professor</span>
            <button onclick="document.getElementById('modal-cad-prof').style.display='none'" style="background:none;border:1px solid var(--borda);border-radius:5px;padding:3px 8px;cursor:pointer">✕</button>
          </div>
          <div style="padding:18px 22px">
            <div style="margin-bottom:10px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:5px">Nome completo</label>
              <input id="cp-nome" placeholder="Nome do professor" style="border:1px solid var(--borda);border-radius:6px;padding:8px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none">
            </div>
            <div style="margin-bottom:10px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:5px">E-mail</label>
              <input id="cp-email" type="email" placeholder="professor@email.com" style="border:1px solid var(--borda);border-radius:6px;padding:8px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none">
            </div>
            <div style="margin-bottom:10px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:5px">Telefone</label>
              <input id="cp-tel" placeholder="(11) 99999-9999" style="border:1px solid var(--borda);border-radius:6px;padding:8px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none">
            </div>
            <div style="margin-bottom:4px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:8px">Especialidades</label>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <label style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--borda);border-radius:20px;cursor:pointer;font-size:12px"><input type="checkbox" name="cp-mod" value="hatha" style="accent-color:var(--verde)"> Hatha Yoga</label>
                <label style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--borda);border-radius:20px;cursor:pointer;font-size:12px"><input type="checkbox" name="cp-mod" value="acro" style="accent-color:var(--verde)"> Acro Yoga</label>
                <label style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--borda);border-radius:20px;cursor:pointer;font-size:12px"><input type="checkbox" name="cp-mod" value="raja" style="accent-color:var(--verde)"> Raja Yoga</label>
              </div>
            </div>
            <div style="margin-top:12px;background:rgba(232,188,79,.08);border:1px solid rgba(232,188,79,.2);border-radius:6px;padding:10px;font-size:11px;color:var(--txt2)">
              O professor receberá um e-mail para definir sua senha e poderá acessar o painel de professor.
            </div>
          </div>
          <div style="padding:12px 22px;border-top:1px solid var(--borda);display:flex;gap:8px;justify-content:flex-end">
            <button onclick="document.getElementById('modal-cad-prof').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
            <button onclick="salvarProfessor()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Cadastrar</button>
          </div>
        </div>
      </div>
    `

    window.editarProfessor = async function(profId) {
      const { data: p } = await sb.from('perfis').select('*').eq('id', profId).single()
      let mods = []
      try { mods = Array.isArray(p.modalidades) ? p.modalidades : (p.modalidades ? JSON.parse(p.modalidades) : []) } catch(e) {}

      document.getElementById('modal-edit-prof')?.remove()
      const div = document.createElement('div')
      div.id = 'modal-edit-prof'
      div.style.cssText = 'position:fixed;inset:0;background:rgba(31,56,31,.45);z-index:200;display:flex;align-items:center;justify-content:center'
      div.innerHTML = ''
        + '<div style="background:#fff;border-radius:10px;width:440px;max-width:95vw;overflow:hidden">'
          + '<div style="padding:18px 22px 14px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">'
            + '<span style="font-family:Cormorant Garamond,serif;font-size:19px;font-weight:500;color:var(--verde)">Editar Professor</span>'
            + '<button id="btn-fechar-ep" style="background:none;border:1px solid var(--borda);border-radius:5px;padding:3px 8px;cursor:pointer">✕</button>'
          + '</div>'
          + '<div style="padding:18px 22px">'
            + '<div style="margin-bottom:10px"><label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:5px">Nome</label>'
            + '<input id="ep-nome" value="' + p.nome + '" style="border:1px solid var(--borda);border-radius:6px;padding:8px 10px;font-size:13px;font-family:DM Sans,sans-serif;width:100%;outline:none"></div>'
            + '<div style="margin-bottom:10px"><label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:5px">Telefone</label>'
            + '<input id="ep-tel" value="' + (p.telefone||'') + '" style="border:1px solid var(--borda);border-radius:6px;padding:8px 10px;font-size:13px;font-family:DM Sans,sans-serif;width:100%;outline:none"></div>'
            + '<div style="margin-bottom:10px"><label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:8px">Especialidades</label>'
            + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
              + '<label style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--borda);border-radius:20px;cursor:pointer;font-size:12px"><input type="checkbox" name="ep-mod" value="hatha" ' + (mods.includes('hatha')?'checked':'') + ' style="accent-color:var(--verde)"> Hatha Yoga</label>'
              + '<label style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--borda);border-radius:20px;cursor:pointer;font-size:12px"><input type="checkbox" name="ep-mod" value="acro" '  + (mods.includes('acro') ?'checked':'') + ' style="accent-color:var(--verde)"> Acro Yoga</label>'
              + '<label style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--borda);border-radius:20px;cursor:pointer;font-size:12px"><input type="checkbox" name="ep-mod" value="raja" '  + (mods.includes('raja') ?'checked':'') + ' style="accent-color:var(--verde)"> Raja Yoga</label>'
            + '</div>'
            + '<div style="font-size:10px;color:var(--txt2);margin-top:6px">Vazio = todas as modalidades.</div></div>'
            + '<div style="display:flex;align-items:center;gap:8px">'
              + '<input type="checkbox" id="ep-ativo" ' + (p.ativo?'checked':'') + ' style="accent-color:var(--verde);width:15px;height:15px">'
              + '<label for="ep-ativo" style="font-size:13px;cursor:pointer">Ativo</label>'
            + '</div>'
          + '</div>'
          + '<div style="padding:12px 22px;border-top:1px solid var(--borda);display:flex;gap:8px;justify-content:flex-end">'
            + '<button id="btn-cancel-ep" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>'
            + '<button id="btn-salvar-ep" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:DM Sans,sans-serif">Salvar</button>'
          + '</div>'
        + '</div>'
      document.body.appendChild(div)
      document.getElementById('btn-fechar-ep').addEventListener('click', () => div.remove())
      document.getElementById('btn-cancel-ep').addEventListener('click', () => div.remove())
      document.getElementById('btn-salvar-ep').addEventListener('click', async () => {
        const nome  = document.getElementById('ep-nome').value.trim()
        const tel   = document.getElementById('ep-tel').value.trim()
        const ativo = document.getElementById('ep-ativo').checked
        const mods  = [...document.querySelectorAll('input[name="ep-mod"]:checked')].map(el=>el.value)
        if (!nome) { toast('Informe o nome'); return }
        const { error } = await sb.from('perfis').update({
          nome, telefone: tel||null, ativo,
          modalidades: mods.length ? JSON.stringify(mods) : null
        }).eq('id', profId)
        if (error) { toast('Erro: '+error.message); return }
        div.remove(); toast('✓ Professor atualizado!'); navigate('professores')
      })
    }

    window.salvarProfessor = async function() {
      const nome = document.getElementById('cp-nome').value.trim()
      const email = document.getElementById('cp-email').value.trim()
      const tel = document.getElementById('cp-tel').value.trim()
      if (!nome||!email) { toast('Preencha nome e e-mail'); return }

      // Verifica se já existe pelo e-mail
      const { data: existe } = await sb.from('perfis').select('id,tipo').eq('email', email).single()
      if (existe) {
        if (existe.tipo !== 'professor') {
          await sb.from('perfis').update({ tipo: 'professor', nome, telefone: tel||null }).eq('id', existe.id)
          toast('✓ Usuário promovido a professor!')
        } else {
          toast('Este e-mail já é professor')
        }
        document.getElementById('modal-cad-prof').style.display = 'none'
        navigate('professores')
        return
      }

      // Cadastra pré-perfil — professor faz login pelo Google ou pela tela de login
      // O perfil será completado automaticamente no primeiro acesso
      const cpMods = [...document.querySelectorAll('input[name="cp-mod"]:checked')].map(el=>el.value)
      const tempId = crypto.randomUUID()
      const { error } = await sb.from('perfis').insert({
        id: tempId, nome, email, telefone: tel||null, tipo: 'professor', ativo: true,
        modalidades: cpMods.length ? JSON.stringify(cpMods) : null
      })
      if (error) {
        // Se erro de UUID conflict, tenta sem ID fixo
        toast('Cadastro pré-registrado. Professor deve fazer login com Google usando: '+email)
        document.getElementById('modal-cad-prof').style.display = 'none'
        navigate('professores')
        return
      }
      document.getElementById('modal-cad-prof').style.display = 'none'
      toast('✓ Professor pré-cadastrado! Oriente-o a fazer login com Google usando: '+email)
      navigate('professores')
    }
}
