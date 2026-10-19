/**
 * src/pages/admin/config.js
 * Configurações do sistema
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS, esc } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'
import { confirmarModal } from '../../modules/dialogs.js'

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
            <option value="30"   ${cfg.prazo_confirmacao_min=='30'  ?'selected':''}>30 minutos</option>
            <option value="60"   ${cfg.prazo_confirmacao_min=='60'  ?'selected':''}>1 hora</option>
            <option value="120"  ${cfg.prazo_confirmacao_min=='120' ?'selected':''}>2 horas</option>
            <option value="180"  ${cfg.prazo_confirmacao_min=='180' ?'selected':''}>3 horas</option>
            <option value="240"  ${cfg.prazo_confirmacao_min=='240' ?'selected':''}>4 horas</option>
            <option value="720"  ${cfg.prazo_confirmacao_min=='720' ?'selected':''}>12 horas</option>
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
        <div style="background:rgba(31,56,31,.04);border:1px solid rgba(31,56,31,.12);border-radius:6px;padding:9px 13px;font-size:11px;color:var(--verde);margin-bottom:12px">
          <i class="ti ti-info-circle"></i>
          Ao sincronizar, aulas futuras já geradas que caem em feriado são canceladas automaticamente, e o crédito de quem já tinha confirmado presença nelas é estornado.
        </div>
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
            <option value="3"  ${cfg.alerta_feriado_dias=='3' ?'selected':''}>3 dias</option>
            <option value="7"  ${cfg.alerta_feriado_dias=='7' ?'selected':''}>7 dias</option>
            <option value="14" ${cfg.alerta_feriado_dias=='14'?'selected':''}>14 dias</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">
        <button onclick="salvarConfig()" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500"><i class="ti ti-device-floppy"></i>Salvar configurações</button>
        <button onclick="sincronizarFeriados()" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:#fff;color:var(--verde);border:1px solid var(--borda);border-radius:6px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500"><i class="ti ti-calendar-event"></i>Sincronizar Feriados <span id="sync-feriado-status"></span></button>
      </div>

      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:14px">
        <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:6px;padding-bottom:10px;border-bottom:1px solid var(--borda)">Importar Alunos do Asaas</div>
        <div style="font-size:12px;color:var(--txt2);margin-bottom:12px;line-height:1.5">
          Busca todos os clientes cadastrados no Asaas e cria perfis de aluno no app.<br>
          Alunos já existentes (mesmo e-mail) são atualizados. O aluno só terá acesso ao app após fazer o primeiro login.
        </div>
        <div style="font-size:12px;color:var(--txt2);line-height:1.5;margin-bottom:12px">
          A chave de API do Asaas fica guardada com segurança no servidor — não é mais necessário informá-la aqui.
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button onclick="previewImportAsaas()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#fff;color:var(--verde);border:1px solid var(--borda);border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500">👁 Pré-visualizar</button>
          <button onclick="executarImportAsaas()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500">⬇ Importar alunos</button>
          <span id="asaas-status" style="font-size:12px;color:var(--txt2)"></span>
        </div>
        <div id="asaas-preview" style="margin-top:12px"></div>
      </div>

      <!-- Solicitações de titulares (LGPD Art. 18) -->
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:14px">
        <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:6px;padding-bottom:10px;border-bottom:1px solid var(--borda)">
          Solicitações de titulares (LGPD)
        </div>
        <div style="font-size:12px;color:var(--txt2);margin-bottom:12px">
          Pedidos de exclusão, correção e informação feitos pelos próprios usuários. Prazo legal de resposta: 15 dias.
        </div>
        <div id="titulares-lista" class="priv-admin" style="font-size:13px;color:var(--txt2)">Carregando...</div>
      </div>

      <!-- Retenção de dados (2 anos) -->
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:14px">
        <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:6px;padding-bottom:10px;border-bottom:1px solid var(--borda)">
          Retenção de dados (2 anos)
        </div>
        <div style="font-size:12px;color:var(--txt2);margin-bottom:12px">
          Ex-alunos sem matrícula ativa, sem cobrança em aberto e sem atividade há mais de 2 anos são anonimizados automaticamente no dia 1º de cada mês.
        </div>
        <div id="retencao-info" style="font-size:13px;color:var(--txt2)">Carregando...</div>
      </div>

      <!-- Aceites de Contrato -->
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:14px">
        <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:6px;padding-bottom:10px;border-bottom:1px solid var(--borda)">
          Aceites de Contrato
        </div>
        <div style="font-size:12px;color:var(--txt2);margin-bottom:12px">
          Alunos que aceitaram o Contrato de Adesão — prova de consentimento LGPD Art. 8° §6.
        </div>
        <div id="contratos-lista" style="font-size:12px;color:var(--txt2)">Carregando...</div>
      </div>
    </div>
  `

  uiAnimar(container)

  // ── Contratos aceitos ─────────────────────────────────────────
  ;(async () => {
    const { data: contratos, error: errC } = await sb
      .from('contratos')
      .select('versao, aceito_em, perfis(nome, email)')
      .order('aceito_em', { ascending: false })

    const el = document.getElementById('contratos-lista')
    if (!el) return

    if (errC) {
      el.textContent = 'Erro ao carregar: ' + errC.message
      return
    }
    if (!contratos?.length) {
      el.textContent = 'Nenhum aceite registrado ainda.'
      return
    }

    el.innerHTML = `
      <div style="border:1px solid var(--borda);border-radius:6px;overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 1fr 80px 120px;background:rgba(31,56,31,.06);padding:7px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">
          <div>Aluno</div>
          <div>E-mail</div>
          <div>Versão</div>
          <div>Data do aceite</div>
        </div>
        ${contratos.map(c => {
          const dt = c.aceito_em
            ? new Date(c.aceito_em).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
            : '—'
          return `
            <div style="display:grid;grid-template-columns:1fr 1fr 80px 120px;padding:8px 12px;border-top:1px solid rgba(212,200,158,.25);align-items:center">
              <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px">${esc(c.perfis?.nome || '—')}</div>
              <div style="color:var(--txt2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px;font-size:11px">${esc(c.perfis?.email || '—')}</div>
              <div><span style="background:rgba(31,56,31,.1);color:var(--verde);border-radius:4px;padding:2px 7px;font-size:10px;font-weight:600">${c.versao}</span></div>
              <div style="color:var(--txt2);font-size:11px">${dt}</div>
            </div>`
        }).join('')}
      </div>
      <div style="margin-top:8px;font-size:11px;color:var(--txt2)">${contratos.length} aceite(s) registrado(s)</div>
    `
  })()

  // ── Solicitações de titulares (LGPD) ─────────────────────────
  ;(async () => {
    const el = document.getElementById('titulares-lista')
    if (!el) return
    const ROTULO = { exclusao: 'Excluir dados e encerrar conta', correcao: 'Corrigir dados', informacao: 'Informação sobre o uso dos dados' }

    async function carregar() {
      const { data, error } = await sb
        .from('solicitacoes_titular')
        .select('id, aluno_id, tipo, mensagem, criada_em, aluno:perfis!aluno_id(nome, email)')
        .eq('status', 'aberta')
        .order('criada_em', { ascending: true })

      if (error) {
        el.textContent = 'Recurso ainda não ativado: rode o 02_lgpd_titular.sql no Supabase. (' + error.message + ')'
        return
      }
      if (!data?.length) { el.textContent = 'Nenhuma solicitação em aberto.'; return }

      el.innerHTML = data.map(s => {
        const dias = Math.floor((Date.now() - new Date(s.criada_em).getTime()) / 86400000)
        const alerta = dias >= 10
        const acao = s.tipo === 'exclusao'
          ? `<button type="button" class="ui-btn ui-btn--danger" data-acao="anonimizar" data-id="${esc(s.id)}" data-aluno="${esc(s.aluno_id)}">Anonimizar e concluir</button>`
          : `<button type="button" class="ui-btn ui-btn--secondary" data-acao="atender" data-id="${esc(s.id)}">Marcar como atendida</button>`
        return `
          <div class="priv-row">
            <div>
              <div class="priv-row__nome">${esc(s.aluno?.nome || '—')}</div>
              <div class="ui-help"><a class="ui-link" href="mailto:${esc(s.aluno?.email || '')}">${esc(s.aluno?.email || '—')}</a></div>
              <div class="priv-row__prazo ${alerta ? 'priv-row__prazo--alerta' : ''}">há ${dias} dia(s)${alerta ? ' · prazo de 15 dias se aproximando' : ''}</div>
            </div>
            <div>
              <div class="priv-item__t">${esc(ROTULO[s.tipo] || s.tipo)}</div>
              <div class="ui-help">${esc(s.mensagem || 'Sem detalhes informados.')}</div>
            </div>
            <div>${acao}</div>
          </div>`
      }).join('')
    }

    el.addEventListener('click', async e => {
      const btn = e.target.closest('[data-acao]')
      if (!btn) return
      const id = btn.dataset.id
      if (btn.dataset.acao === 'anonimizar') {
        const ok = await confirmarModal({
          titulo: 'Anonimizar este titular?',
          texto: 'O nome, e-mail, telefone, foto e login serão removidos e os comentários da Timeline serão apagados. Pagamentos ficam retidos sem identificação direta.\n\nEsta ação não pode ser desfeita.',
          confirmar: 'Anonimizar e concluir', perigo: true,
        })
        if (!ok) return
        btn.disabled = true
        const { data, error } = await sb.rpc('lgpd_anonimizar_titular', { p_aluno: btn.dataset.aluno, p_solicitacao: id })
        if (error) { btn.disabled = false; toast('Erro: ' + error.message, 5000); return }
        const avisos = data?.avisos?.length ? ' Avisos: ' + data.avisos.join(' | ') : ''
        toast(data?.auth_anonimizado === false
          ? 'Perfil anonimizado, mas o login não foi limpo.' + avisos
          : 'Titular anonimizado.' + avisos, 7000)
      } else {
        const ok = await confirmarModal({
          titulo: 'Marcar como atendida?',
          texto: 'Confirme que você já respondeu ao titular por e-mail.',
          confirmar: 'Marcar como atendida',
        })
        if (!ok) return
        btn.disabled = true
        const { error } = await sb.from('solicitacoes_titular')
          .update({ status: 'atendida', resolvida_em: new Date().toISOString(), resolvida_por: window._perfil.id })
          .eq('id', id)
        if (error) { btn.disabled = false; toast('Erro: ' + error.message, 5000); return }
        toast('Solicitação concluída.')
      }
      carregar()
    })

    carregar()
  })()

  // ── Retenção de dados (prévia) ────────────────────────────────
  ;(async () => {
    const el = document.getElementById('retencao-info')
    if (!el) return
    const [{ data: previa, error }, { data: ult }] = await Promise.all([
      sb.rpc('lgpd_retencao_previa'),
      sb.from('lgpd_retencao_log').select('executado_em').order('executado_em', { ascending: false }).limit(1),
    ])
    if (error) {
      el.textContent = 'Recurso ainda não ativado: rode o 03_lgpd_retencao.sql no Supabase. (' + error.message + ')'
      return
    }
    const ultima = ult?.[0]?.executado_em
      ? new Date(ult[0].executado_em).toLocaleDateString('pt-BR')
      : 'nenhuma execução ainda'
    const lista = (previa?.candidatos || []).slice(0, 10)
    el.innerHTML = `
      <div class="priv-item__t">${previa?.total || 0} perfil(is) elegível(is) para a próxima execução</div>
      <div class="ui-help" style="margin-top:2px">Última execução: ${esc(ultima)}</div>
      ${lista.length ? `<ul class="priv-list" style="margin-top:8px">${lista.map(c => `
        <li class="priv-item">
          <div>
            <div class="priv-item__t">${esc(c.nome || '—')}</div>
            <div class="ui-help">${esc(c.email || '—')}</div>
          </div>
          <span class="ui-help">sem atividade desde ${esc(new Date(c.ultima_atividade).toLocaleDateString('pt-BR'))}</span>
        </li>`).join('')}</ul>
        ${previa.total > lista.length ? `<div class="ui-help" style="margin-top:6px">e mais ${previa.total - lista.length}</div>` : ''}` : ''}`
  })()

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

  // ── Importação do Asaas ──────────────────────────────────────
  async function buscarClientesAsaas() {
    const FN_URL = 'https://kctgcjvfsuinwlbgljdw.supabase.co/functions/v1/asaas-proxy'
    const { sb: sbAuth } = await import('../../lib/supabase.js')
    const { data: { session } } = await sbAuth.auth.getSession()
    if (!session?.access_token) throw new Error('Sessão expirada. Faça login novamente.')
    let todos = [], offset = 0
    while (true) {
      const r = await fetch(FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({ offset })
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
    const status = document.getElementById('asaas-status')
    const preview = document.getElementById('asaas-preview')
    status.textContent = '⏳ Buscando...'
    try {
      const clientes = await buscarClientesAsaas()
      status.textContent = `${clientes.length} clientes encontrados`
      preview.innerHTML = `
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);margin-bottom:6px;font-weight:500">Prévia (${clientes.length} clientes)</div>
        <div style="max-height:220px;overflow-y:auto;border:1px solid var(--borda);border-radius:6px">
          ${clientes.map(c=>`<div style="display:flex;align-items:center;gap:10px;padding:7px 12px;border-bottom:1px solid rgba(212,200,158,.25);font-size:12px">
            <div style="width:28px;height:28px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:var(--verde);flex-shrink:0">${esc((c.name||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase())}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name||'—')}</div>
              <div style="font-size:10px;color:var(--txt2)">${esc(c.email||'sem e-mail')} · ${esc(c.mobilePhone||c.phone||'sem tel')}</div>
            </div>
            <div style="font-size:10px;color:var(--txt2);flex-shrink:0">${esc(c.id)}</div>
          </div>`).join('')}
        </div>`
    } catch(e) {
      status.textContent = ''
      toast('Erro: ' + e.message)
    }
  }

  window.executarImportAsaas = async function() {
    if (!(await confirmarModal({ titulo: 'Importar do Asaas?', texto: 'Confirmar importação? Perfis existentes serão atualizados com dados do Asaas.', confirmar: 'Importar', perigo: false }))) return
    const status = document.getElementById('asaas-status')
    status.textContent = '⏳ Importando...'
    try {
      const clientes = await buscarClientesAsaas()
      let criados = 0, atualizados = 0, erros = 0
      for (const c of clientes) {
        if (!c.email) continue
        const perfilData = {
          nome: c.name || c.email,
          email: c.email,
          telefone: c.mobilePhone || c.phone || null,
          tipo: 'aluno',
          ativo: true,
          asaas_customer_id: c.id,
        }
        const { data: existente } = await sb.from('perfis').select('id').eq('email', c.email).single()
        if (existente) {
          const { error } = await sb.from('perfis').update({
            telefone: perfilData.telefone,
            asaas_customer_id: perfilData.asaas_customer_id,
            ativo: true,
          }).eq('id', existente.id)
          error ? erros++ : atualizados++
        } else {
          const { error } = await sb.from('perfis_pendentes').upsert({
            nome: perfilData.nome,
            email: perfilData.email,
            telefone: perfilData.telefone,
            asaas_customer_id: perfilData.asaas_customer_id,
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
      let totalOcsCanceladas = 0
      let totalConfsEstornadas = 0
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

          // Cancela retroativamente qualquer ocorrência futura já gerada
          // que caia nessa data, estornando crédito de quem já confirmou.
          // Idempotente: rodar de novo não estorna em dobro.
          const { data: cancelResult, error: errCancel } = await sb.rpc('admin_cancelar_ocorrencias_feriado', {
            p_data: f.date,
            p_nome_feriado: f.name,
          })
          if (!errCancel && cancelResult) {
            totalOcsCanceladas += cancelResult.ocorrencias_canceladas || 0
            totalConfsEstornadas += cancelResult.confirmacoes_estornadas || 0
          }
        }
      }
      if (status) status.textContent = ''
      toast(`✓ ${total} feriados sincronizados (${ano} e ${ano+1})`
        + (totalOcsCanceladas > 0 ? ` · ${totalOcsCanceladas} aula(s) cancelada(s) automaticamente` : '')
        + (totalConfsEstornadas > 0 ? ` · ${totalConfsEstornadas} crédito(s) estornado(s)` : ''))
    } catch(e) {
      if (status) status.textContent = ''
      toast('Erro: ' + e.message)
    }
  }
}
