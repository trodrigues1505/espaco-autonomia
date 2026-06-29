/**
 * src/modules/contrato.js
 * Responsabilidade: exibir e registrar o termo de adesão.
 * LGPD Art. 8° §6 — prova de consentimento: grava user_agent,
 * timestamp e versão do termo no banco.
 * Bloqueio total da UI até aceite — o aluno não pode navegar antes de assinar.
 */

import { sb } from '../lib/supabase.js'
import { toast } from './utils.js'

const CONTRATO_VERSAO = 'v2'

const CONTRATO_TEXTO = `
<div style="font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.8;color:#1F381F">
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500">Espaço Autonomia</div>
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#5a7a5a">Contrato de Prestação de Serviços de Yoga</div>
  </div>

  <p style="margin-bottom:14px">
    Eu, <strong>[NOME]</strong>, declaro que li e concordo com os termos abaixo para utilização dos serviços do
    <strong>Espaço Autonomia</strong>, CNPJ 18.300.737/0001-95, situado na Av. Liberdade, 179, 1º andar,
    salas 3 e 4, Centro, Franco da Rocha – SP, representado pelo instrutor
    <strong>Thiago Rodrigues do Nascimento</strong> (CPF 108.923.177-60, RG 21.123.775-5)
    e pela diretora <strong>Regiane da Silva Rocha</strong> (CPF 199.975.868-40, CRT 47582).
  </p>

  <div style="margin-bottom:10px"><strong>1. OBJETO:</strong> Contratação de serviços de Yoga nas modalidades disponíveis no Espaço Autonomia (Hatha Yoga, Acro Yoga e/ou Raja Yoga), conforme plano escolhido.</div>

  <div style="margin-bottom:10px"><strong>2. APTIDÃO FÍSICA:</strong> Declaro estar apto(a) a praticar Yoga e assumo total responsabilidade pela realização de avaliações médicas que julgar necessárias. Em caso de condição de saúde relevante, comunicarei previamente ao instrutor.</div>

  <div style="margin-bottom:10px"><strong>3. MENORES DE IDADE:</strong> Alunos menores de 18 anos devem ter autorização do responsável legal, que responde solidariamente por seus atos e obrigações decorrentes deste contrato.</div>

  <div style="margin-bottom:10px"><strong>4. PRAZO DE VIGÊNCIA:</strong> Este contrato tem vigência por tempo <strong>indeterminado</strong>, a partir do aceite, permanecendo ativo até a <strong>desistência formal comunicada pelo WhatsApp</strong> ao Espaço Autonomia. Enquanto não houver comunicação formal de desistência, as mensalidades continuam sendo cobradas integralmente, independentemente da frequência de comparecimento.</div>

  <div style="margin-bottom:10px"><strong>5. HORÁRIOS E FALTAS:</strong> A presença nos dias e horários agendados é responsabilidade do aluno. O Espaço Autonomia poderá oferecer reposição conforme disponibilidade da grade, sem obrigatoriedade. Atraso do instrutor garante compensação equivalente ao tempo perdido; atraso do aluno não obriga compensação por parte do instrutor.</div>

  <div style="margin-bottom:10px"><strong>6. PLANOS E PAGAMENTOS:</strong> Os planos vigentes são: <strong>Brahma</strong> (1× por semana), <strong>Shiva 1×</strong> (1× por semana), <strong>Shiva 2×</strong> (2× por semana), <strong>Vishnu 2×</strong> (2× por semana) e <strong>Vishnu Livre</strong> (frequência livre). Os valores são os vigentes no momento da adesão, podendo ser reajustados com aviso prévio de 30 dias. Em caso de cancelamento com plano de vigência determinada, o reembolso será proporcional ao saldo restante, descontada a diferença entre o valor do plano escolhido e o valor mensalista até a data do cancelamento.</div>

  <div style="margin-bottom:10px"><strong>7. SALDO DE AULAS:</strong> Cada plano concede um número mensal de aulas conforme contratado. Aulas não utilizadas acumulam enquanto o plano estiver ativo e em dia. <strong>Aulas confirmadas e não canceladas dentro do prazo são descontadas do saldo mesmo em caso de ausência, sem reposição.</strong></div>

  <div style="margin-bottom:10px"><strong>8. CANCELAMENTO DE PRESENÇA:</strong> O cancelamento de uma aula confirmada deve ser feito com a antecedência mínima definida pelo Espaço Autonomia via app. Após esse prazo, a aula é descontada do saldo independentemente da presença.</div>

  <div style="margin-bottom:14px"><strong>9. FORO:</strong> As partes elegem o foro da Comarca de Franco da Rocha – SP para dirimir quaisquer dúvidas decorrentes deste instrumento.</div>

  <div style="background:rgba(232,188,79,.12);border:1px solid rgba(232,188,79,.45);border-radius:8px;padding:12px 14px;font-size:12px;color:#7a5a10;line-height:1.6">
    ⚠️ <strong>Atenção:</strong> Ao confirmar uma aula e não comparecer sem cancelar com antecedência, a aula será descontada do seu saldo sem direito a reposição ou reembolso. O plano só é encerrado mediante <strong>desistência formal pelo WhatsApp</strong> — a simples ausência não cancela as cobranças.
  </div>
</div>`

// ── Bloqueio total da UI ──────────────────────────────────────
function bloquearUI() {
  if (document.getElementById('contrato-bloqueio')) return
  const bloqueio = document.createElement('div')
  bloqueio.id = 'contrato-bloqueio'
  bloqueio.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:298',
    'background:transparent', 'cursor:not-allowed',
    'pointer-events:all',
  ].join(';')
  bloqueio.addEventListener('click', e => e.stopPropagation())
  bloqueio.addEventListener('keydown', e => e.preventDefault())
  document.body.appendChild(bloqueio)
}

function desbloquearUI() {
  document.getElementById('contrato-bloqueio')?.remove()
}

/**
 * Verifica se o aluno já assinou. Se não, exibe o modal e bloqueia a UI.
 * Retorna Promise<true> após aceite confirmado no banco.
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

  // Ainda não assinou — bloqueia UI e exibe modal
  bloquearUI()

  return new Promise(resolve => {
    const div = document.createElement('div')
    div.id = 'modal-contrato'
    div.style.cssText = [
      'position:fixed', 'inset:0',
      'background:rgba(31,56,31,.82)',
      'z-index:299',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:16px',
    ].join(';')

    div.addEventListener('click', e => e.stopPropagation())

    div.innerHTML = `
      <div style="background:#fff;border-radius:12px;width:600px;max-width:100%;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4)">
        <div style="background:var(--verde);padding:18px 22px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--bege)">Contrato de Adesão</div>
            <div style="font-size:11px;color:rgba(242,236,206,.7);margin-top:2px">Leia com atenção — obrigatório para continuar</div>
          </div>
          <div style="background:rgba(242,236,206,.15);border-radius:6px;padding:4px 10px;font-size:10px;color:var(--bege);letter-spacing:.5px;text-transform:uppercase">Versão ${CONTRATO_VERSAO}</div>
        </div>

        <div style="overflow-y:auto;flex:1;padding:22px 24px" id="contrato-scroll">
          ${CONTRATO_TEXTO.replace('[NOME]', nomeAluno)}
        </div>

        <div style="padding:16px 22px;border-top:1px solid var(--borda);background:#fafaf7;flex-shrink:0">
          <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin-bottom:14px" id="label-check-contrato">
            <input type="checkbox" id="check-contrato"
              style="margin-top:3px;width:16px;height:16px;accent-color:var(--verde);flex-shrink:0;cursor:pointer">
            <span style="font-size:13px;color:var(--txt);line-height:1.5">
              Li na íntegra e concordo com todos os termos acima, incluindo a política de vigência por tempo indeterminado,
              as regras de cancelamento de presença e a necessidade de <strong>desistência formal pelo WhatsApp</strong>
              para encerrar o plano.
            </span>
          </label>
          <button id="btn-aceitar-contrato" disabled
            style="width:100%;padding:13px;background:#ccc;color:#fff;border:none;border-radius:8px;font-size:14px;font-family:'DM Sans',sans-serif;cursor:not-allowed;font-weight:500;transition:background .2s,cursor .2s">
            Concordar e Acessar o App
          </button>
          <div style="text-align:center;margin-top:8px;font-size:11px;color:var(--txt2)">
            Ao aceitar, seu consentimento é registrado com data, hora e dispositivo (LGPD Art. 8° §6).
          </div>
        </div>
      </div>`

    document.body.appendChild(div)
    window._resolveContrato = resolve

    document.getElementById('check-contrato').addEventListener('change', function () {
      const btn = document.getElementById('btn-aceitar-contrato')
      btn.disabled         = !this.checked
      btn.style.background = this.checked ? 'var(--verde)' : '#ccc'
      btn.style.cursor     = this.checked ? 'pointer'      : 'not-allowed'
    })

    document.getElementById('btn-aceitar-contrato').addEventListener('click', () => {
      if (!document.getElementById('check-contrato').checked) return
      _aceitarContrato(userId, resolve)
    })
  })
}

async function _aceitarContrato(userId, resolve) {
  const btn = document.getElementById('btn-aceitar-contrato')
  btn.textContent = 'Salvando...'
  btn.disabled = true

  const { error } = await sb.from('contratos').insert({
    aluno_id:   userId,
    versao:     CONTRATO_VERSAO,
    aceito_em:  new Date().toISOString(),
    user_agent: navigator.userAgent,
    idioma:     navigator.language || 'pt-BR',
  })

  if (error && !error.message.includes('unique')) {
    toast('Erro ao salvar: ' + error.message)
    btn.textContent = 'Concordar e Acessar o App'
    btn.disabled = false
    return
  }

  document.getElementById('modal-contrato')?.remove()
  desbloquearUI()
  resolve(true)
}

/**
 * Exibe o contrato já aceito em modo leitura (sem botão de aceite).
 * Chamada pelo botão "Meu Contrato" na home do aluno.
 */
export async function verContratoAceito(userId, nomeAluno) {
  const { data, error } = await sb
    .from('contratos')
    .select('versao, aceito_em, user_agent')
    .eq('aluno_id', userId)
    .order('aceito_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    toast('Nenhum contrato encontrado.')
    return
  }

  const dtFormatada = new Date(data.aceito_em).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  // Remove instância anterior se existir
  document.getElementById('modal-ver-contrato')?.remove()

  const div = document.createElement('div')
  div.id = 'modal-ver-contrato'
  div.style.cssText = [
    'position:fixed', 'inset:0',
    'background:rgba(31,56,31,.82)',
    'z-index:299',
    'display:flex', 'align-items:center', 'justify-content:center',
    'padding:16px',
  ].join(';')

  div.innerHTML = `
    <div style="background:#fff;border-radius:12px;width:600px;max-width:100%;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4)">
      <div style="background:var(--verde);padding:18px 22px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--bege)">Contrato de Adesão</div>
          <div style="font-size:11px;color:rgba(242,236,206,.7);margin-top:2px">Versão ${data.versao}</div>
        </div>
        <button onclick="document.getElementById('modal-ver-contrato').remove()"
          style="background:rgba(242,236,206,.15);border:none;border-radius:6px;padding:6px 14px;font-size:13px;color:var(--bege);cursor:pointer;font-family:'DM Sans',sans-serif">
          ✕ Fechar
        </button>
      </div>

      <div style="background:#f0faf0;border-bottom:1px solid #b6ddb6;padding:10px 22px;display:flex;align-items:center;gap:10px;flex-shrink:0">
        <span style="font-size:20px">✅</span>
        <div>
          <div style="font-size:12px;font-weight:600;color:#2e7d32">Contrato aceito</div>
          <div style="font-size:11px;color:#4a7a4a">Assinado em ${dtFormatada} · Registro LGPD Art. 8° §6</div>
        </div>
      </div>

      <div style="overflow-y:auto;flex:1;padding:22px 24px">
        ${CONTRATO_TEXTO.replace('[NOME]', nomeAluno)}
      </div>

      <div style="padding:14px 22px;border-top:1px solid var(--borda);background:#fafaf7;flex-shrink:0;text-align:center">
        <div style="font-size:11px;color:var(--txt2)">
          Este é o contrato que você assinou em ${dtFormatada}.
          Para encerrar seu plano, envie uma mensagem formal pelo WhatsApp.
        </div>
      </div>
    </div>`

  document.body.appendChild(div)
}   
