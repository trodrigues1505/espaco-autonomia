/**
 * src/modules/contrato.js
 * Responsabilidade: exibir e registrar o termo de adesão.
 * LGPD Art. 8° §6 — prova de consentimento: grava user_agent,
 * timestamp e versão do termo no banco.
 * Depende de: sb (lib/supabase.js), toast (modules/utils.js)
 */

import { sb } from '../lib/supabase.js'
import { toast } from './utils.js'

const CONTRATO_VERSAO = 'v1'

const CONTRATO_TEXTO = `
<div style="font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.8;color:#1F381F">
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500">Espaço Autonomia</div>
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#5a7a5a">Termo de Adesão e Ciência</div>
  </div>
  <p style="margin-bottom:12px">Eu, <strong>[NOME]</strong>, declaro que li e concordo com os termos abaixo para utilização dos serviços do <strong>Espaço Autonomia</strong>, CNPJ 31.038.952/0001-28, representado por <strong>Regiane da Silva Rocha</strong>.</p>
  <div style="margin-bottom:10px"><strong>1. APTIDÃO FÍSICA:</strong> Declaro estar apto(a) a praticar Yoga e assumo total responsabilidade pela realização de avaliações médicas que julgar necessárias.</div>
  <div style="margin-bottom:10px"><strong>2. PLANO ATIVO E PAGAMENTO:</strong> O acesso às aulas está condicionado à manutenção do plano ativo e <strong>pagamento em dia</strong>. As cobranças são realizadas automaticamente na data de vencimento. Em caso de inadimplência, o acesso às aulas é suspenso automaticamente até regularização do pagamento.</div>
  <div style="margin-bottom:10px"><strong>3. SALDO DE AULAS:</strong> Cada plano concede um número mensal de aulas conforme contratado. Aulas não utilizadas acumulam para os meses seguintes enquanto o plano estiver ativo e em dia. <strong>Aulas confirmadas e não canceladas dentro do prazo são descontadas do saldo mesmo em caso de ausência, sem reposição.</strong></div>
  <div style="margin-bottom:10px"><strong>4. CANCELAMENTO DE PRESENÇA:</strong> O cancelamento de uma aula confirmada deve ser realizado com antecedência mínima pelo app, conforme prazo definido pelo Espaço Autonomia. Após esse prazo, a aula é descontada do saldo independentemente da presença do aluno.</div>
  <div style="margin-bottom:10px"><strong>5. CANCELAMENTO DO PLANO:</strong> O cancelamento do plano deve ser comunicado <strong>pessoalmente ou por mensagem diretamente ao Espaço Autonomia</strong>. Em caso de cancelamento antecipado, o reembolso será proporcional ao saldo restante, descontada a diferença entre o valor do plano escolhido e o valor mensalista até a data do cancelamento.</div>
  <div style="margin-bottom:10px"><strong>6. FALTAS:</strong> A presença é responsabilidade do aluno. O Espaço Autonomia poderá oferecer reposição conforme disponibilidade da grade, sem obrigatoriedade.</div>
  <div style="margin-bottom:10px"><strong>7. ATRASO:</strong> Atraso do instrutor garante compensação equivalente ao tempo perdido. Atraso do aluno não obriga compensação por parte do instrutor.</div>
  <div style="margin-bottom:10px"><strong>8. MENORES DE IDADE:</strong> Alunos menores de 18 anos devem ter autorização do responsável legal, que responde solidariamente por seus atos e obrigações.</div>
  <div style="margin-bottom:16px"><strong>9. FORO:</strong> As partes elegem o foro de Franco da Rocha — SP para dirimir quaisquer dúvidas decorrentes deste instrumento.</div>
  <div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.4);border-radius:8px;padding:12px;font-size:12px;color:#7a5a10">
    ⚠️ <strong>Atenção:</strong> Ao confirmar uma aula e não comparecer sem cancelar com antecedência, a aula será descontada do seu saldo sem direito a reposição ou reembolso.
  </div>
</div>`

/**
 * Verifica se o aluno já assinou. Se não, exibe o modal e aguarda.
 * Retorna true após aceite, para continuar o fluxo de iniciarApp.
 */
export async function verificarContrato(userId, nomeAluno) {
  const { data, error: contratoErr } = await sb
    .from('contratos')
    .select('id')
    .eq('aluno_id', userId)
    .eq('versao', CONTRATO_VERSAO)
    .single()
  if (contratoErr && contratoErr.code !== 'PGRST116') return false
  if (data) return true  // já assinou

  return new Promise(resolve => {
    const div = document.createElement('div')
    div.style.cssText = 'position:fixed;inset:0;background:rgba(31,56,31,.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px'
    div.innerHTML = `
      <div style="background:#fff;border-radius:12px;width:580px;max-width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden">
        <div style="background:var(--verde);padding:18px 22px;flex-shrink:0">
          <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--bege)">Termo de Adesão</div>
          <div style="font-size:11px;color:rgba(242,236,206,.7);margin-top:2px">Leia com atenção antes de continuar</div>
        </div>
        <div style="overflow-y:auto;flex:1;padding:20px 22px">
          ${CONTRATO_TEXTO.replace('[NOME]', nomeAluno)}
        </div>
        <div style="padding:16px 22px;border-top:1px solid var(--borda);background:#fafaf7;flex-shrink:0">
          <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin-bottom:14px">
            <input type="checkbox" id="check-contrato" style="margin-top:2px;width:16px;height:16px;accent-color:var(--verde);flex-shrink:0">
            <span style="font-size:13px;color:var(--txt)">Li, entendi e concordo com todos os termos acima, incluindo as regras de saldo de aulas e a política de cancelamento.</span>
          </label>
          <button id="btn-aceitar-contrato" disabled
            onclick="aceitarContrato('${userId}')"
            style="width:100%;padding:12px;background:#ccc;color:#fff;border:none;border-radius:8px;font-size:14px;font-family:'DM Sans',sans-serif;cursor:not-allowed;font-weight:500;transition:all .2s">
            Concordar e Continuar
          </button>
        </div>
      </div>`

    document.body.appendChild(div)
    window._resolveContrato = resolve
    window._divContrato = div

    document.getElementById('check-contrato').addEventListener('change', function () {
      const btn = document.getElementById('btn-aceitar-contrato')
      btn.disabled        = !this.checked
      btn.style.background = this.checked ? 'var(--verde)' : '#ccc'
      btn.style.cursor     = this.checked ? 'pointer'      : 'not-allowed'
    })
  })
}

// Chamado pelo onclick inline do botão
window.aceitarContrato = async function (userId) {
  const btn = document.getElementById('btn-aceitar-contrato')
  btn.textContent = 'Salvando...'
  btn.disabled = true

  // LGPD Art. 8° §6 — registra prova de consentimento
  const { error } = await sb.from('contratos').insert({
    aluno_id:   userId,
    versao:     CONTRATO_VERSAO,
    aceito_em:  new Date().toISOString(),
    user_agent: navigator.userAgent,
    idioma:     navigator.language || 'pt-BR',
  })

  if (error && !error.message.includes('unique')) {
    toast('Erro ao salvar contrato: ' + error.message)
    btn.textContent = 'Concordar e Continuar'
    btn.disabled = false
    return
  }

  window._divContrato?.remove()
  window._resolveContrato?.(true)
}
