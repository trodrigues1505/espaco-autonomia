/**
 * src/pages/admin/planos.js
 * Gestão de planos
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderPlanos(container, page) {
  const sb = window._sb || (await import('../../lib/supabase.js')).sb
  const perfil = window._perfil
  const tipo = perfil?.tipo

    const { data: planos, error: errPlanos } = await sb.from('planos').select('*, modalidades:plano_modalidades(modalidade)').order('preco_1x')
    if (errPlanos) console.error('Erro planos:', errPlanos)
    console.log('Planos carregados:', planos?.length, planos)

    const featLabels = {
      sangha:'Sangha — grupo WhatsApp', kala_sadhya:'Kala Sadhya — agenda flex',
      asana_marga:'Asana Marga — app prática', yoga_adhyayana:'Yoga Adhyayana — estudo teórico',
      jnana_marga:'Jnana Marga — estudo literário', sadhana_purna:'Sadhana Purna — avaliação de progresso',
      atma_vijnana:'Atma Vijnana — anamnese personalizada', shruti:'Shruti — áudio diário',
      naada_mandir:'Naada Mandir — biblioteca de mantras'
    }
    const feats = Object.keys(featLabels)

    // Gerar lista de opções de plano (uma linha por preço/frequência)
    const opcoes = []
    for (const p of (planos||[])) {
      if (p.preco_1x) opcoes.push({plano:p, opcao:'1x', label:'1× por semana', preco:p.preco_1x})
      if (p.preco_2x) opcoes.push({plano:p, opcao:'2x', label:'2× por semana', preco:p.preco_2x})
      if (p.preco_livre) opcoes.push({plano:p, opcao:'livre', label:'Uso livre', preco:p.preco_livre})
    }

    // Modal criar plano
    const modalCriarPlano = `<div id="modal-criar-plano" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.45);z-index:100;align-items:center;justify-content:center">
      <div style="background:#fff;border-radius:10px;width:520px;max-width:95vw;max-height:90vh;overflow:auto">
        <div style="padding:18px 22px 14px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
          <span style="font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:500;color:var(--verde)">Novo Plano</span>
          <button onclick="document.getElementById('modal-criar-plano').style.display='none'" style="background:none;border:1px solid var(--borda);border-radius:5px;padding:3px 8px;cursor:pointer">✕</button>
        </div>
        <div style="padding:18px 22px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Tipo (identificador)</label>
              <input id="np-tipo" placeholder="ex: gold" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--txt);width:100%;outline:none">
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Nome exibido</label>
              <input id="np-nome" placeholder="ex: Gold" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--txt);width:100%;outline:none">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
            <div style="display:flex;flex-direction:column;gap:4px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Preço 1×/sem (R$)</label>
              <input id="np-p1" type="number" placeholder="100" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none">
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Preço 2×/sem (R$)</label>
              <input id="np-p2" type="number" placeholder="150" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none">
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Preço livre (R$)</label>
              <input id="np-pl" type="number" placeholder="200" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none">
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:6px">Modalidades incluídas</label>
            <div style="display:flex;gap:8px">
              ${['hatha','acro','raja'].map(m=>`<label style="display:flex;align-items:center;gap:5px;padding:6px 12px;border:1px solid var(--borda);border-radius:20px;font-size:12px;cursor:pointer"><input type="checkbox" name="np-mod" value="${m}" style="accent-color:var(--verde)"> ${NOMES[m]}</label>`).join('')}
            </div>
          </div>
          <div style="margin-bottom:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:8px">Benefícios incluídos</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
              ${feats.map(f=>`<label style="display:flex;align-items:center;gap:6px;font-size:11px;padding:4px 0;cursor:pointer"><input type="checkbox" name="np-feat" value="${f}" style="accent-color:var(--verde)"> ${featLabels[f].split('—')[0].trim()}</label>`).join('')}
            </div>
          </div>
        </div>
        <div style="padding:12px 22px;border-top:1px solid var(--borda);display:flex;gap:8px;justify-content:flex-end">
          <button onclick="document.getElementById('modal-criar-plano').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
          <button onclick="salvarNovoPLano()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Criar Plano</button>
        </div>
      </div>
    </div>`

    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-t">Planos</div>
        <button onclick="document.getElementById('modal-criar-plano').style.display='flex'" style="padding:6px 13px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px">+ Novo Plano</button>
      </div>
      <div class="content">
        <div style="margin-bottom:16px;font-size:13px;color:var(--txt2)">
          Cada linha abaixo é uma opção de assinatura disponível. Os 5 planos base já estão configurados. Use "+ Novo Plano" apenas para criar planos especiais (ex: Gestante, Melhor Idade, Família).
        </div>

        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden;margin-bottom:24px">
          <div style="display:grid;grid-template-columns:180px 120px 1fr 120px 60px;padding:8px 18px;background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
            <span>Plano</span><span>Frequência</span><span>Modalidades</span><span>Valor</span><span>Ação</span>
          </div>
          ${opcoes.map(o=>`<div style="display:grid;grid-template-columns:180px 120px 1fr 120px 60px;align-items:center;gap:10px;padding:11px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
            <span style="font-weight:500">${o.plano.nome}</span>
            <span style="color:var(--txt2)">${o.label}</span>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${(o.plano.modalidades||[]).map(m=>`<span style="background:${CORES[m.modalidade]||'#888'}22;color:${CORES[m.modalidade]||'#888'};padding:1px 7px;border-radius:10px;font-size:10px;font-weight:500">${NOMES[m.modalidade]||m.modalidade}</span>`).join('')}
            </div>
            <span style="font-weight:500;color:var(--verde)">R$ ${o.preco}<span style="font-weight:400;color:var(--txt2);font-size:11px">/mês</span></span>
            <button onclick="abrirEditarPlano('${o.plano.tipo}')" style="padding:3px 8px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif" title="Editar">✎</button>
          </div>`).join('')}
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
          ${(planos||[]).map(p => {
            const modsDoPLano = (p.modalidades||[]).map(m=>m.modalidade)
            return `<div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden">
              <div style="padding:14px 18px;background:var(--fundo);border-bottom:1px solid var(--borda)">
                <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--verde)">${p.nome}</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">
                  ${modsDoPLano.map(m=>`<span style="background:${CORES[m]||'#888'}22;color:${CORES[m]||'#888'};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:500">${NOMES[m]||m}</span>`).join('')}
                </div>
              </div>
              <div style="padding:12px 18px">
                ${feats.map(f=>`<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;color:${p[f]?'var(--txt)':'#ccc'}${p[f]?'':';text-decoration:line-through'}">
                  <span>${p[f]?'✓':'—'}</span>${featLabels[f]}
                </div>`).join('')}
              </div>
            </div>`
          }).join('')}
        </div>
      </div>
      ${modalCriarPlano}
    `

    window.salvarNovoPLano = async function() {
      const tipo = document.getElementById('np-tipo').value.trim().toLowerCase().replace(/[^a-z0-9_]/g,'_')
      const nome = document.getElementById('np-nome').value.trim()
      if (!tipo||!nome) { toast('Preencha tipo e nome'); return }
      // Verifica duplicata
      const { data: existeArr } = await sb.from('planos').select('tipo').eq('tipo', tipo)
      if (existeArr && existeArr.length > 0) { toast('Já existe um plano com este identificador: '+tipo); return }
      const p1 = document.getElementById('np-p1').value
      const p2 = document.getElementById('np-p2').value
      const pl = document.getElementById('np-pl').value
      if (!tipo||!nome) { toast('Preencha tipo e nome'); return }
      const mods = [...document.querySelectorAll('input[name="np-mod"]:checked')].map(e=>e.value)
      const featsObj = {}
      Object.keys(featLabels).forEach(f => { featsObj[f] = false })
      ;[...document.querySelectorAll('input[name="np-feat"]:checked')].forEach(e=>{ featsObj[e.value]=true })

      const btnSalvar = document.querySelector('#modal-criar-plano .btn-salvar')
      if (btnSalvar) { btnSalvar.textContent = 'Salvando...'; btnSalvar.disabled = true }

      const { error } = await sb.from('planos').insert({
        tipo, nome,
        preco_1x: p1?Number(p1):null,
        preco_2x: p2?Number(p2):null,
        preco_livre: pl?Number(pl):null,
        aulas_semana_max: p1&&!p2?1:p2?2:null,
        ...featsObj
      })
      if (error) {
        toast('Erro: '+error.message)
        if (btnSalvar) { btnSalvar.textContent = 'Criar Plano'; btnSalvar.disabled = false }
        return
      }

      // Inserir modalidades
      if (mods.length) {
        const { error: errMod } = await sb.from('plano_modalidades').insert(mods.map(m=>({plano_tipo:tipo,modalidade:m})))
        if (errMod) {
          // Plano criado mas modalidades falharam (RLS) — ainda mostra sucesso parcial
          console.warn('plano_modalidades insert:', errMod.message)
        }
      }
      document.getElementById('modal-criar-plano').style.display = 'none'
      toast('✓ Plano criado!')
      navigate('planos')
    }

    // ── Modal de edição de plano ──────────────────────────────
    const modalEditarPlanoHtml = `<div id="modal-editar-plano" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.45);z-index:100;align-items:center;justify-content:center">
      <div style="background:#fff;border-radius:10px;width:520px;max-width:95vw;max-height:90vh;overflow:auto">
        <div style="padding:18px 22px 14px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
          <span style="font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:500;color:var(--verde)" id="ep-titulo">Editar Plano</span>
          <button onclick="document.getElementById('modal-editar-plano').style.display='none'" style="background:none;border:1px solid var(--borda);border-radius:5px;padding:3px 8px;cursor:pointer">✕</button>
        </div>
        <div style="padding:18px 22px" id="ep-body">Carregando...</div>
        <div style="padding:12px 22px;border-top:1px solid var(--borda);display:flex;gap:8px;justify-content:flex-end">
          <button onclick="document.getElementById('modal-editar-plano').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
          <button onclick="salvarEdicaoPlano()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Salvar Alterações</button>
        </div>
      </div>
    </div>`
    document.body.insertAdjacentHTML('beforeend', modalEditarPlanoHtml)

    window._editandoPlanoTipo = null

    window.abrirEditarPlano = async function(tipo) {
      window._editandoPlanoTipo = tipo
      const { data: p } = await sb.from('planos').select('*, modalidades:plano_modalidades(modalidade)').eq('tipo', tipo).single()
      if (!p) { toast('Plano não encontrado'); return }

      const modsSel = (p.modalidades||[]).map(m=>m.modalidade)
      document.getElementById('ep-titulo').textContent = 'Editar — ' + p.nome
      document.getElementById('ep-body').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Nome exibido</label>
            <input id="ep-nome" value="${p.nome}" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--txt);width:100%;outline:none">
          </div>
          <div></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Preço 1×/sem (R$)</label>
            <input id="ep-p1" type="number" value="${p.preco_1x||''}" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Preço 2×/sem (R$)</label>
            <input id="ep-p2" type="number" value="${p.preco_2x||''}" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Preço livre (R$)</label>
            <input id="ep-pl" type="number" value="${p.preco_livre||''}" style="border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none">
          </div>
        </div>
        <div style="margin-bottom:12px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:6px">Modalidades incluídas</label>
          <div style="display:flex;gap:8px">
            ${['hatha','acro','raja'].map(m=>`<label style="display:flex;align-items:center;gap:5px;padding:6px 12px;border:1px solid var(--borda);border-radius:20px;font-size:12px;cursor:pointer"><input type="checkbox" name="ep-mod" value="${m}" ${modsSel.includes(m)?'checked':''} style="accent-color:var(--verde)"> ${NOMES[m]}</label>`).join('')}
          </div>
        </div>
        <div>
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;display:block;margin-bottom:8px">Benefícios</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
            ${feats.map(f=>`<label style="display:flex;align-items:center;gap:6px;font-size:11px;padding:4px 0;cursor:pointer"><input type="checkbox" name="ep-feat" value="${f}" ${p[f]?'checked':''} style="accent-color:var(--verde)"> ${featLabels[f].split('—')[0].trim()}</label>`).join('')}
          </div>
        </div>`
      document.getElementById('modal-editar-plano').style.display = 'flex'
    }

    window.salvarEdicaoPlano = async function() {
      const tipo = window._editandoPlanoTipo
      if (!tipo) return
      const nome  = document.getElementById('ep-nome').value.trim()
      const p1    = document.getElementById('ep-p1').value
      const p2    = document.getElementById('ep-p2').value
      const pl    = document.getElementById('ep-pl').value
      const mods  = [...document.querySelectorAll('input[name="ep-mod"]:checked')].map(e=>e.value)
      const featsObj = {}
      Object.keys(featLabels).forEach(f => { featsObj[f] = false })
      ;[...document.querySelectorAll('input[name="ep-feat"]:checked')].forEach(e=>{ featsObj[e.value]=true })

      const { error } = await sb.from('planos').update({
        nome,
        preco_1x:    p1 ? Number(p1) : null,
        preco_2x:    p2 ? Number(p2) : null,
        preco_livre: pl ? Number(pl) : null,
        ...featsObj,
      }).eq('tipo', tipo)
      if (error) { toast('Erro: ' + error.message); return }

      // Atualiza modalidades: delete explícito + insert com upsert como fallback
      await sb.from('plano_modalidades').delete().eq('plano_tipo', tipo)
      if (mods.length) {
        const { error: errMod } = await sb
          .from('plano_modalidades')
          .upsert(
            mods.map(m => ({ plano_tipo: tipo, modalidade: m })),
            { onConflict: 'plano_tipo,modalidade', ignoreDuplicates: true }
          )
        if (errMod) console.warn('plano_modalidades upsert:', errMod.message)
      }

      document.getElementById('modal-editar-plano').style.display = 'none'
      toast('✓ Plano atualizado!')
      navigate('planos')
    }
}
