/**
 * src/modules/privacidade.js
 * Privacidade e LGPD:
 *  • Política de Privacidade (diálogo acessível do login, do banner e da tela "Privacidade")
 *  • Tela "Privacidade e meus dados": baixar dados, enviar solicitações (Art. 18), ver aceite
 *  • confirmarModal(): diálogo de confirmação (substitui window.confirm nestas telas)
 *
 * Pré-requisito: supabase/sql/02_lgpd_titular.sql
 */

import { toast, esc } from './utils.js'

const CONTROLADOR   = 'Thiago Rodrigues do Nascimento'
const CNPJ          = '60.456.737/0001-45'
const EMAIL_CONTATO = 'thiago.rodrigues@espacoautonomia.com'
const VERSAO_DOC    = '1.0'
const VIGENCIA      = '19/10/2026'
const VERSAO_ACEITE = 'v2'          // deve ser igual a VERSAO em lgpd.js

// ── Texto da política ────────────────────────────────────────
function secao(titulo, corpo) {
  return `<section class="priv-doc__sec"><h3>${titulo}</h3>${corpo}</section>`
}

export function politicaHTML() {
  return `
  <div class="priv-doc">
    <p class="priv-doc__meta">Versão ${VERSAO_DOC} · vigente desde ${VIGENCIA}</p>

    ${secao('1. Quem somos', `
      <p>O Espaço Autonomia é operado por <strong>${CONTROLADOR}</strong>, CNPJ ${CNPJ}, em Franco da Rocha/SP.
      Somos o <em>controlador</em> dos dados pessoais tratados neste aplicativo, ou seja, quem decide como e por que eles são usados.</p>
      <p>Canal de contato (encarregado pelo tratamento de dados): <a class="priv-link" href="mailto:${EMAIL_CONTATO}">${EMAIL_CONTATO}</a>.</p>`)}

    ${secao('2. Quais dados coletamos', `
      <ul>
        <li><strong>Cadastro:</strong> nome, e-mail, telefone (opcional) e foto de perfil (do Google ou informada por você).</li>
        <li><strong>Vida no estúdio:</strong> matrícula e plano, confirmações e presenças em aulas, saldo de aulas.</li>
        <li><strong>Pagamentos:</strong> cobranças, valores, vencimentos e status (processados pelo Asaas).</li>
        <li><strong>Uso do app:</strong> data do último acesso, conquistas e engajamento, acessos aos conteúdos de estudo.</li>
        <li><strong>Timeline:</strong> publicações, comentários, curtidas, itens salvos e votos em enquetes.</li>
        <li><strong>Registros de aceite:</strong> data, hora, versão do documento, navegador e idioma, para comprovar o aceite do contrato e desta política.</li>
      </ul>
      <p>Não coletamos dados de saúde nem biometria pelo aplicativo. Se uma funcionalidade futura precisar de dados sensíveis, pediremos seu consentimento específico antes.</p>`)}

    ${secao('3. Para que usamos seus dados', `
      <ul>
        <li>Prestar o serviço: matrícula, agenda, presenças, saldo de aulas e cobrança — <em>execução de contrato</em> (art. 7º, V).</li>
        <li>Cumprir obrigações legais, fiscais e contábeis (art. 7º, II).</li>
        <li>Manter a segurança do app, evitar fraudes e controlar acessos — <em>legítimo interesse</em> (art. 7º, IX).</li>
        <li>Comprovar aceites e defender direitos, se necessário (art. 7º, VI).</li>
      </ul>
      <p>Não vendemos seus dados e não os usamos para publicidade de terceiros.</p>`)}

    ${secao('4. Com quem compartilhamos', `
      <ul>
        <li><strong>Supabase:</strong> banco de dados e autenticação do app.</li>
        <li><strong>Asaas:</strong> emissão e gestão de cobranças.</li>
        <li><strong>Google:</strong> login com Google e carregamento de fontes.</li>
        <li><strong>GitHub Pages e redes de entrega de conteúdo (jsDelivr, Cloudflare):</strong> hospedagem e entrega do app; recebem seu endereço IP ao carregá-lo.</li>
        <li><strong>WhatsApp:</strong> somente se você entrar nos grupos pelos links do app, sob as regras do próprio WhatsApp.</li>
        <li><strong>Professores e equipe do espaço:</strong> acessam apenas o necessário para a função (por exemplo, presenças e contato).</li>
        <li><strong>Autoridades:</strong> quando houver obrigação legal.</li>
      </ul>
      <p>Na Timeline, seu nome e foto aparecem para os demais participantes do app quando você publica ou comenta.</p>`)}

    ${secao('5. Transferência internacional', `
      <p>Alguns desses fornecedores podem armazenar ou processar dados fora do Brasil. Essa transferência ocorre para executar o serviço contratado por você (art. 33, IX, da LGPD).</p>`)}

    ${secao('6. Por quanto tempo guardamos', `
      <p>Mantemos seus dados enquanto você for aluno(a) e por até <strong>2 anos</strong> após o encerramento do vínculo. Depois desse prazo, eles são eliminados ou anonimizados.</p>
      <p>Registros de pagamento podem ser mantidos por mais tempo quando a lei exigir (obrigações fiscais e contábeis).</p>`)}

    ${secao('7. Seus direitos (art. 18 da LGPD)', `
      <ul>
        <li>Confirmar que tratamos seus dados e acessá-los;</li>
        <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>Pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
        <li>Pedir a portabilidade dos seus dados;</li>
        <li>Pedir a eliminação dos dados tratados com base em consentimento;</li>
        <li>Saber com quem compartilhamos seus dados;</li>
        <li>Ser informado(a) sobre a possibilidade de não consentir e suas consequências;</li>
        <li>Revogar o consentimento, quando for essa a base legal.</li>
      </ul>`)}

    ${secao('8. Como exercer seus direitos', `
      <p>No app, abra <strong>Privacidade</strong> no menu: lá você baixa seus dados e envia solicitações. Também pode escrever para
      <a class="priv-link" href="mailto:${EMAIL_CONTATO}">${EMAIL_CONTATO}</a>. Respondemos em até <strong>15 dias</strong>.</p>
      <p>Ao pedir a exclusão, seu acesso ao app é encerrado e seus dados pessoais são anonimizados, exceto os que a lei nos obriga a guardar, que ficam retidos apenas pelo prazo exigido.</p>
      <p>Você também pode registrar reclamação junto à Autoridade Nacional de Proteção de Dados (ANPD), em gov.br/anpd.</p>`)}

    ${secao('9. Segurança', `
      <p>Usamos conexão criptografada (HTTPS), autenticação e regras de acesso por perfil no banco de dados, para que cada pessoa veja apenas o que lhe cabe.
      Em caso de incidente que possa causar risco ou dano relevante, comunicaremos você e a ANPD (art. 48).</p>`)}

    ${secao('10. Menores de idade', `
      <p>O aplicativo é destinado a maiores de 18 anos. Não atendemos menores de idade. Se identificarmos um cadastro de menor, ele será excluído.</p>`)}

    ${secao('11. Armazenamento no navegador', `
      <p>O app guarda no seu navegador a sessão de login, a confirmação de leitura desta política e preferências de instalação do aplicativo.
      Não usamos cookies de publicidade nem ferramentas próprias de análise de comportamento. Conteúdos incorporados de terceiros (como vídeos) podem seguir as regras desses serviços.</p>`)}

    ${secao('12. Alterações', `
      <p>Podemos atualizar esta política. Mudanças relevantes serão avisadas no app e você precisará confirmar a leitura novamente.</p>`)}
  </div>`
}

// ── Diálogo acessível ────────────────────────────────────────
function abrirDialogo({ titulo, corpoHTML, rodapeHTML = '', onFechar }) {
  const anterior = document.activeElement
  const tid = 'priv-t-' + Math.random().toString(36).slice(2, 8)
  const root = document.createElement('div')
  root.className = 'priv-overlay'
  root.innerHTML = `
    <div class="priv-dialog" role="dialog" aria-modal="true" aria-labelledby="${tid}">
      <div class="priv-dialog__head">
        <h2 class="priv-dialog__title" id="${tid}">${esc(titulo)}</h2>
        <button type="button" class="priv-icon-btn" data-fechar aria-label="Fechar">
          <i class="ti ti-x" aria-hidden="true"></i>
        </button>
      </div>
      <div class="priv-dialog__body">${corpoHTML}</div>
      ${rodapeHTML ? `<div class="priv-dialog__foot">${rodapeHTML}</div>` : ''}
    </div>`
  document.body.appendChild(root)
  const overflowAntes = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  let fechado = false
  const fechar = () => {
    if (fechado) return
    fechado = true
    document.removeEventListener('keydown', onKey, true)
    document.body.style.overflow = overflowAntes
    root.remove()
    anterior?.focus?.()
    onFechar?.()
  }
  const onKey = e => {
    if (e.key === 'Escape') { e.stopPropagation(); fechar(); return }
    if (e.key !== 'Tab') return
    const foc = [...root.querySelectorAll('a[href],button:not([disabled]),input,select,textarea')]
    if (!foc.length) return
    const primeiro = foc[0], ultimo = foc[foc.length - 1]
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
  }
  document.addEventListener('keydown', onKey, true)
  root.addEventListener('mousedown', e => { if (e.target === root) fechar() })
  root.querySelector('[data-fechar]').addEventListener('click', fechar)
  root.querySelector('[data-fechar]').focus()
  return { root, fechar }
}

export function abrirPolitica() {
  abrirDialogo({
    titulo: 'Política de Privacidade',
    corpoHTML: politicaHTML(),
    rodapeHTML: `<button type="button" class="priv-btn priv-btn--primary" data-ok>Entendi</button>`,
  }).root.querySelector('[data-ok]').addEventListener('click', e =>
    e.target.closest('.priv-overlay').querySelector('[data-fechar]').click())
}

export function confirmarModal({ titulo, texto, confirmar = 'Confirmar', cancelar = 'Cancelar', perigo = false }) {
  return new Promise(resolve => {
    let decidido = false
    const d = abrirDialogo({
      titulo,
      corpoHTML: `<p class="priv-text">${esc(texto)}</p>`,
      rodapeHTML: `
        <button type="button" class="priv-btn priv-btn--ghost" data-nao>${esc(cancelar)}</button>
        <button type="button" class="priv-btn ${perigo ? 'priv-btn--danger' : 'priv-btn--primary'}" data-sim>${esc(confirmar)}</button>`,
      onFechar: () => { if (!decidido) resolve(false) },
    })
    d.root.querySelector('[data-nao]').addEventListener('click', () => d.fechar())
    d.root.querySelector('[data-sim]').addEventListener('click', () => { decidido = true; resolve(true); d.fechar() })
  })
}

// ── Tela "Privacidade e meus dados" ──────────────────────────
const TIPOS = {
  informacao: 'Saber como meus dados são usados',
  correcao:   'Corrigir meus dados',
  exclusao:   'Excluir meus dados e encerrar minha conta',
}
const STATUS = {
  aberta:   { txt: 'Em análise', icone: 'ti-clock'        },
  atendida: { txt: 'Atendida',   icone: 'ti-circle-check' },
  recusada: { txt: 'Recusada',   icone: 'ti-circle-x'     },
}
const fmtData = iso => iso
  ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—'

export async function renderMeusDados(container) {
  const sb = window._sb
  const perfil = window._perfil

  const [{ data: aceite }, { data: sols, error: errSols }] = await Promise.all([
    sb.from('consentimentos').select('versao, aceito_em').eq('aluno_id', perfil.id)
      .eq('versao', VERSAO_ACEITE).maybeSingle(),
    sb.from('solicitacoes_titular').select('id, tipo, status, criada_em, resolvida_em')
      .eq('aluno_id', perfil.id).order('criada_em', { ascending: false }),
  ])

  const listaSols = errSols
    ? `<div class="priv-empty"><i class="ti ti-plug-off" aria-hidden="true"></i>
         <span>As solicitações ainda não estão ativas neste ambiente. Escreva para <a class="priv-link" href="mailto:${EMAIL_CONTATO}">${EMAIL_CONTATO}</a>.</span></div>`
    : !sols?.length
      ? `<div class="priv-empty"><i class="ti ti-inbox" aria-hidden="true"></i><span>Você ainda não enviou nenhuma solicitação.</span></div>`
      : `<ul class="priv-list">${sols.map(s => {
          const st = STATUS[s.status] || STATUS.aberta
          return `<li class="priv-item">
            <div>
              <div class="priv-item__t">${esc(TIPOS[s.tipo] || s.tipo)}</div>
              <div class="priv-help">Enviada em ${fmtData(s.criada_em)}${s.resolvida_em ? ' · respondida em ' + fmtData(s.resolvida_em) : ''}</div>
            </div>
            <span class="priv-badge priv-badge--${esc(s.status)}"><i class="ti ${st.icone}" aria-hidden="true"></i>${st.txt}</span>
          </li>`
        }).join('')}</ul>`

  container.innerHTML = `
    <div class="topbar"><div class="topbar-t">Privacidade e meus dados</div></div>
    <div class="content priv-page">
      <p class="priv-lead">Seus dados são seus. Aqui você vê o que guardamos, baixa uma cópia e pede correção ou exclusão. Respondemos em até 15 dias.</p>

      <div class="priv-grid">
        <section class="priv-card" aria-labelledby="priv-h-cad">
          <div class="priv-card__head"><span class="priv-card__icon"><i class="ti ti-user-circle" aria-hidden="true"></i></span>
            <h3 id="priv-h-cad">Seus dados cadastrais</h3></div>
          <dl class="priv-dl">
            <dt>Nome</dt><dd>${esc(perfil.nome)}</dd>
            <dt>E-mail</dt><dd>${esc(perfil.email)}</dd>
            <dt>Telefone</dt><dd>${esc(perfil.telefone || 'não informado')}</dd>
          </dl>
          <p class="priv-help">Para corrigir algum dado, envie uma solicitação abaixo.</p>
        </section>

        <section class="priv-card" aria-labelledby="priv-h-baixar">
          <div class="priv-card__head"><span class="priv-card__icon"><i class="ti ti-download" aria-hidden="true"></i></span>
            <h3 id="priv-h-baixar">Baixar meus dados</h3></div>
          <p class="priv-text">Receba uma cópia de tudo que o app guarda sobre você (cadastro, aulas, pagamentos, Timeline e aceites) em um arquivo legível.</p>
          <div><button type="button" class="priv-btn priv-btn--primary" data-act="baixar">
            <i class="ti ti-file-download" aria-hidden="true"></i><span>Baixar arquivo</span></button></div>
        </section>

        <section class="priv-card priv-card--wide" aria-labelledby="priv-h-sol">
          <div class="priv-card__head"><span class="priv-card__icon"><i class="ti ti-message-question" aria-hidden="true"></i></span>
            <h3 id="priv-h-sol">Fazer uma solicitação</h3></div>
          <div class="priv-form">
            <div class="priv-field">
              <label class="priv-label" for="priv-tipo">O que você precisa?</label>
              <select id="priv-tipo" class="priv-input">
                ${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}
              </select>
            </div>
            <div class="priv-field">
              <label class="priv-label" for="priv-msg">Detalhes <span class="priv-help">(opcional, até 500 caracteres)</span></label>
              <textarea id="priv-msg" class="priv-input" maxlength="500" rows="3"
                placeholder="Conte o que precisa corrigir, saber ou excluir"></textarea>
            </div>
            <div><button type="button" class="priv-btn priv-btn--secondary" data-act="enviar">
              <i class="ti ti-send" aria-hidden="true"></i><span>Enviar solicitação</span></button></div>
          </div>
          <h4 class="priv-sub">Suas solicitações</h4>
          ${listaSols}
        </section>

        <section class="priv-card priv-card--wide" aria-labelledby="priv-h-pol">
          <div class="priv-card__head"><span class="priv-card__icon"><i class="ti ti-shield-lock" aria-hidden="true"></i></span>
            <h3 id="priv-h-pol">Política de Privacidade</h3></div>
          <p class="priv-text">${aceite
            ? 'Você confirmou a leitura em ' + fmtData(aceite.aceito_em) + '.'
            : 'Ainda não há confirmação de leitura registrada para a versão atual.'}</p>
          <div class="priv-actions">
            <button type="button" class="priv-btn priv-btn--secondary" data-act="politica">
              <i class="ti ti-file-text" aria-hidden="true"></i><span>Ler a política</span></button>
            <a class="priv-btn priv-btn--ghost" href="mailto:${EMAIL_CONTATO}">
              <i class="ti ti-mail" aria-hidden="true"></i><span>Falar com o encarregado</span></a>
          </div>
        </section>
      </div>
    </div>`

  // ── ações ──
  container.querySelector('[data-act="politica"]').addEventListener('click', abrirPolitica)

  const btnBaixar = container.querySelector('[data-act="baixar"]')
  btnBaixar.addEventListener('click', async () => {
    const rot = btnBaixar.querySelector('span')
    btnBaixar.disabled = true; rot.textContent = 'Preparando...'
    try {
      const { data, error } = await sb.rpc('lgpd_exportar_meus_dados')
      if (error) throw new Error(error.message)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meus-dados-espaco-autonomia-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast('Arquivo gerado')
    } catch (e) {
      toast('Não foi possível gerar o arquivo: ' + e.message, 4000)
    } finally {
      btnBaixar.disabled = false; rot.textContent = 'Baixar arquivo'
    }
  })

  const btnEnviar = container.querySelector('[data-act="enviar"]')
  btnEnviar.addEventListener('click', async () => {
    const tipo = container.querySelector('#priv-tipo').value
    const mensagem = container.querySelector('#priv-msg').value.trim()
    if (tipo === 'correcao' && mensagem.length < 5) {
      toast('Descreva o que precisa ser corrigido'); container.querySelector('#priv-msg').focus(); return
    }
    if (tipo === 'exclusao') {
      const ok = await confirmarModal({
        titulo: 'Excluir meus dados?',
        texto: 'Seu acesso ao aplicativo será encerrado e seus dados pessoais serão anonimizados, exceto os que a lei nos obriga a guardar.\n\nDepois de atendida, essa ação não pode ser desfeita.',
        confirmar: 'Pedir exclusão', perigo: true,
      })
      if (!ok) return
    }
    btnEnviar.disabled = true
    const { error } = await sb.from('solicitacoes_titular').insert({
      aluno_id: perfil.id, tipo, mensagem: mensagem || null,
    })
    if (error) {
      btnEnviar.disabled = false
      toast(error.code === '23505'
        ? 'Você já tem uma solicitação desse tipo em análise.'
        : 'Erro ao enviar: ' + error.message, 4000)
      return
    }
    toast('Solicitação enviada. Responderemos em até 15 dias.', 3500)
    renderMeusDados(container)
  })
}

window.abrirPolitica = abrirPolitica
