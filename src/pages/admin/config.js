/**
 * src/pages/admin/config.js
 * Configurações do sistema
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderConfig(container, page) {
  const sb = window._sb
  const perfil = window._perfil
  const tipo = perfil?.tipo

    const { data: cfgs } = await sb.from('configuracoes').select('*')
    const cfg = Object.fromEntries((cfgs||[]).map(c=>[c.chave,c.valor]))
    container.innerHTML = `
      <div class="topbar"><div class="topbar-t">Configurações</div></div>
      <div class="content">
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:14px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--borda)">Confirmação de Presença</div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(212,200,158,.25)">
            <div><div style="font-size:12px;font-weight:500">Prazo mínimo de confirmação</div><div style="font-size:10px;color:var(--txt2)">Minutos antes da aula para confirmar</div></div>
            <select id="cfg-prazo" style="border:1px solid var(--borda);border-radius:6px;padding:6px 10px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--txt)">
              <option value="30" ${cfg.prazo_confirmacao_min=='30'?'selected':''}>30 minutos</option>
              <option value="60" ${cfg.prazo_confirmacao_min=='60'?'selected':''}>1 hora</option>
              <option value="120" ${cfg.prazo_confirmacao_min=='120'?'selected':''}>2 horas</option>
              <option value="180" ${cfg.prazo_confirmacao_min=='180'?'selected':''}>3 horas</option>
              <option value="1440" ${cfg.prazo_confirmacao_min=='1440'?'selected':''}>24 horas</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(212,200,158,.25)">
            <div><div style="font-size:12px;font-weight:500">Prazo para cancelar confirmação</div></div>
            <select id="cfg-cancel" style="border:1px solid var(--borda);border-radius:6px;padding:6px 10px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--txt)">
              <option value="120" ${cfg.prazo_cancelamento_min=='120'?'selected':''}>2 horas</option>
              <option value="180" ${cfg.prazo_cancelamento_min=='180'?'selected':''}>3 horas</option>
              <option value="360" ${cfg.prazo_cancelamento_min=='360'?'selected':''}>6 horas</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0">
            <div><div style="font-size:12px;font-weight:500">Vagas padrão por aula</div></div>
            <input type="number" id="cfg-vagas" value="${cfg.vagas_padrao||15}" min="1" max="100" style="border:1px solid var(--borda);border-radius:6px;padding:6px 10px;font-size:12px;width:80px;font-family:'DM Sans',sans-serif;color:var(--txt)">
          </div>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:14px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--borda)">Alertas de Feriado</div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(212,200,158,.25)">
            <div style="font-size:12px;font-weight:500">Feriados nacionais</div>
            <input type="checkbox" id="cfg-fnac" ${cfg.feriados_nacionais==='true'?'checked':''} style="width:15px;height:15px;accent-color:var(--verde)">
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(212,200,158,.25)">
            <div style="font-size:12px;font-weight:500">Feriados estaduais (SP)</div>
            <input type="checkbox" id="cfg-fesp" ${cfg.feriados_estaduais_sp==='true'?'checked':''} style="width:15px;height:15px;accent-color:var(--verde)">
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(212,200,158,.25)">
            <div style="font-size:12px;font-weight:500">Feriados municipais</div>
            <input type="checkbox" id="cfg-fmun" ${cfg.feriados_municipais==='true'?'checked':''} style="width:15px;height:15px;accent-color:var(--verde)">
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0">
            <div style="font-size:12px;font-weight:500">Antecedência do alerta</div>
            <select id="cfg-alertdias" style="border:1px solid var(--borda);border-radius:6px;padding:6px 10px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--txt)">
              <option value="3" ${cfg.alerta_feriado_dias=='3'?'selected':''}>3 dias</option>
              <option value="7" ${cfg.alerta_feriado_dias=='7'?'selected':''}>7 dias</option>
              <option value="14" ${cfg.alerta_feriado_dias=='14'?'selected':''}>14 dias</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button onclick="salvarConfig()" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500"><i class="ti ti-device-floppy"></i>Salvar configurações</button>
          <button onclick="sincronizarFeriados()" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:#fff;color:var(--verde);border:1px solid var(--borda);border-radius:6px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500"><i class="ti ti-calendar-event"></i>Sincronizar Feriados <span id="sync-feriado-status"></span></button>
        </div>

        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-top:14px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:6px;padding-bottom:10px;border-bottom:1px solid var(--borda)">Importar Alunos do Asaas</div>
          <div style="font-size:12px;color:var(--txt2);margin-bottom:12px;line-height:1.5">
            Busca todos os clientes cadastrados no Asaas e cria perfis de aluno no app.<br>
            Alunos já existentes (mesmo e-mail) são atualizados. O aluno só terá acesso ao app após fazer o primeiro login.
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">API Key do Asaas</label>
            <input id="asaas-apikey" type="password" placeholder="\$aact_..." style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%">
            <div style="font-size:10px;color:var(--txt2)">Encontre em Minha Conta → Integrações → Gerar chave de API</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <button onclick="previewImportAsaas()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#fff;color:var(--verde);border:1px solid var(--borda);border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500">👁 Pré-visualizar</button>
            <button onclick="executarImportAsaas()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500">⬇ Importar alunos</button>
            <span id="asaas-status" style="font-size:12px;color:var(--txt2)"></span>
          </div>
          <div id="asaas-preview" style="margin-top:12px"></div>
        </div>
      </div>
    `
    window.salvarConfig = async function() {
      try {
        const updates = [
          { chave:'prazo_confirmacao_min', valor: document.getElementById('cfg-prazo').value },
          { chave:'prazo_cancelamento_min', valor: document.getElementById('cfg-cancel').value },
          { chave:'vagas_padrao', valor: document.getElementById('cfg-vagas').value },
          { chave:'feriados_nacionais', valor: String(document.getElementById('cfg-fnac').checked) },
          { chave:'feriados_estaduais_sp', valor: String(document.getElementById('cfg-fesp').checked) },
          { chave:'feriados_municipais', valor: String(document.getElementById('cfg-fmun').checked) },
          { chave:'alerta_feriado_dias', valor: document.getElementById('cfg-alertdias').value },
        ]
        for (const u of updates) {
          await sb.from('configuracoes').update({ valor: u.valor, atualizado_em: new Date().toISOString() }).eq('chave', u.chave)
        }
        toast('Configurações salvas!')
      } catch(e) { toast('Erro: ' + e.message) }
    }

    // ── Importação do Asaas ──────────────────────────────────
    async function buscarClientesAsaas(apiKey) {
      const FN_URL = 'https://kctgcjvfsuinwlbgljdw.supabase.co/functions/v1/asaas-proxy'
      let todos = [], offset = 0
      while (true) {
        const r = await fetch(FN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, offset })
        })
        if (!r.ok) throw new Error(`Proxy erro ${r.status}: ${await r.text()}`)
        const json = await r.json()
        todos = todos.concat(json.data || [])
        if (!json.hasMore) break
        offset += 100
      }
      return todos
    }

    window.previewImportAsaas = async function() {
      const apiKey = document.getElementById('asaas-apikey').value.trim()
      if (!apiKey) { toast('Informe a API Key do Asaas'); return }
      const status = document.getElementById('asaas-status')
      const preview = document.getElementById('asaas-preview')
      status.textContent = '⏳ Buscando...'
      try {
        const clientes = await buscarClientesAsaas(apiKey)
        status.textContent = `${clientes.length} clientes encontrados`
        preview.innerHTML = `
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);margin-bottom:6px;font-weight:500">Prévia (${clientes.length} clientes)</div>
          <div style="max-height:220px;overflow-y:auto;border:1px solid var(--borda);border-radius:6px">
            ${clientes.map(c=>`<div style="display:flex;align-items:center;gap:10px;padding:7px 12px;border-bottom:1px solid rgba(212,200,158,.25);font-size:12px">
              <div style="width:28px;height:28px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:var(--verde);flex-shrink:0">${(c.name||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name||'—'}</div>
                <div style="font-size:10px;color:var(--txt2)">${c.email||'sem e-mail'} · ${c.mobilePhone||c.phone||'sem tel'}</div>
              </div>
              <div style="font-size:10px;color:var(--txt2);flex-shrink:0">${c.id}</div>
            </div>`).join('')}
          </div>`
      } catch(e) {
        status.textContent = ''
        toast('Erro: ' + e.message)
      }
    }

    window.executarImportAsaas = async function() {
      const apiKey = document.getElementById('asaas-apikey').value.trim()
      if (!apiKey) { toast('Informe a API Key do Asaas'); return }
      if (!confirm('Confirmar importação? Perfis existentes serão atualizados com dados do Asaas.')) return
      const status = document.getElementById('asaas-status')
      status.textContent = '⏳ Importando...'
      try {
        const clientes = await buscarClientesAsaas(apiKey)
        let criados = 0, atualizados = 0, erros = 0
        for (const c of clientes) {
          if (!c.email) continue
          const perfil = {
            nome: c.name || c.email,
            email: c.email,
            telefone: c.mobilePhone || c.phone || null,
            tipo: 'aluno',
            ativo: true,
            asaas_customer_id: c.id,
          }
          // Verificar se já existe
          const { data: existente } = await sb.from('perfis').select('id').eq('email', c.email).single()
          if (existente) {
            const { error } = await sb.from('perfis').update({
              telefone: perfil.telefone,
              asaas_customer_id: perfil.asaas_customer_id,
              ativo: true,
            }).eq('id', existente.id)
            error ? erros++ : atualizados++
          } else {
            // Cria perfil pré-cadastrado sem id de auth — será vinculado no primeiro login
            const { error } = await sb.from('perfis_pendentes').upsert({
              nome: perfil.nome,
              email: perfil.email,
              telefone: perfil.telefone,
              asaas_customer_id: perfil.asaas_customer_id,
            }, { onConflict: 'email' })
            error ? erros++ : criados++
          }
        }
        status.textContent = ''
        toast(`✓ ${atualizados} atualizados · ${criados} pré-cadastros criados${erros?` · ${erros} erros`:''}`)
        document.getElementById('asaas-preview').innerHTML = ''
      } catch(e) {
        status.textContent = ''
        toast('Erro: ' + e.message)
      }
    }

    window.sincronizarFeriados = async function() {
      const status = document.getElementById('sync-feriado-status')
      if (status) status.textContent = ' ⏳'
      try {
        const ano = new Date().getFullYear()
        let total = 0
        for (const a of [ano, ano + 1]) {
          const r = await fetch(`https://brasilapi.com.br/api/feriados/v1/${a}`)
          if (!r.ok) throw new Error(`BrasilAPI ${r.status}`)
          const feriados = await r.json()
          for (const f of feriados) {
            await sb.from('feriados').upsert({
              data: f.date,
              nome: f.name,
              tipo: f.type === 'national' ? 'nacional' : 'estadual',
              fonte: 'brasilapi',
              atualizado_em: new Date().toISOString(),
            }, { onConflict: 'data' })
            total++
          }
        }
        if (status) status.textContent = ''
        toast(`✓ ${total} feriados sincronizados (${ano} e ${ano+1})`)
      } catch(e) {
        if (status) status.textContent = ''
        toast('Erro: ' + e.message)
      }
    }
}
