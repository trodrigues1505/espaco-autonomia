/**
 * src/pages/admin/config.js
 * Responsabilidade: Configurações do sistema — prazos, vagas, feriados.
 * Depende de: sb, toast, NOMES, dot, badge, card, fmtDt, inputStyle
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderConfig(container) {

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
        <button onclick="salvarConfig()" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500"><i class="ti ti-device-floppy"></i>Salvar configurações</button>
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
  }
