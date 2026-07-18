/**
 * src/pages/timeline.js
 */

import { toast } from '../modules/utils.js'
import { uiAnimar } from '../modules/ui.js'
import { aplicarVocabulario } from '../modules/vocabulario.js'

const PLANOS_POSTAR_PENDENTE = ['vishnu_2x', 'vishnu_livre']
const PLANOS_COMENTAR        = ['vishnu_2x', 'vishnu_livre', 'shiva_1x', 'shiva_2x']
const PAGE_SIZE = 10

// ── Lightbox de imagem (clique para ampliar) ─────────────────
function _tlAbrirLightbox(src) {
  document.getElementById('_tl-lightbox')?.remove()
  const lb = document.createElement('div')
  lb.id = '_tl-lightbox'
  lb.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:500;
    display:flex;align-items:center;justify-content:center;padding:20px;cursor:zoom-out`
  lb.innerHTML = `
    <img src="${src}" alt="" referrerpolicy="no-referrer"
      style="max-width:100%;max-height:90vh;border-radius:8px;object-fit:contain;
             box-shadow:0 20px 60px rgba(0,0,0,.5)">
    <button onclick="document.getElementById('_tl-lightbox').remove()"
      style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,.15);
             border:none;border-radius:50%;width:36px;height:36px;color:#fff;
             font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;
             line-height:1">×</button>`
  lb.addEventListener('click', e => { if (e.target === lb) lb.remove() })
  document.body.appendChild(lb)
}
window._tlAbrirLightbox = _tlAbrirLightbox

export async function renderTimeline(container, page) {
  const sb     = window._sb
  const perfil = window._perfil

  // ── Descobre plano ativo do aluno ────────────────────────────
  let planoTipo = null
  if (perfil.tipo === 'aluno') {
    const { data: mat } = await sb
      .from('matriculas')
      .select('plano_tipo')
      .eq('aluno_id', perfil.id)
      .eq('ativa', true)
      .maybeSingle()
    planoTipo = mat?.plano_tipo || null
  }

  const isAdmin  = perfil.tipo === 'admin'
  const isProf   = perfil.tipo === 'professor'
  const podePostar    = isAdmin || isProf || PLANOS_POSTAR_PENDENTE.includes(planoTipo)
  const podeComentar  = isAdmin || isProf || PLANOS_COMENTAR.includes(planoTipo)
  const podeSalvar    = isAdmin || isProf || !!planoTipo
  const podeExcluir   = isAdmin || isProf

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Timeline</div>
    </div>
    <div class="content">
      ${podePostar ? renderComposeBox(perfil, isAdmin, isProf) : ''}
      ${(isAdmin || isProf) ? `
        <button id="btn-criar-enquete" style="width:100%;padding:10px 14px;background:#fff;border:1px solid var(--borda);border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:12px;color:var(--verde);cursor:pointer;text-align:left;display:flex;align-items:center;gap:8px;margin-bottom:14px">
          📊 Criar enquete
        </button>` : ''}
      ${isAdmin ? `
        <button id="btn-moderacao" style="width:100%;padding:10px 14px;background:#fff8f0;border:1px solid #f0d9b5;border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:12px;color:#e67e22;cursor:pointer;text-align:left;display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <span>📋 Posts aguardando moderação</span>
          <span id="mod-count" style="background:#e67e22;color:#fff;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:600">0</span>
        </button>` : ''}
      <div id="tl-enquetes-container"></div>
      <div id="tl-feed-container">
        <div class="loading-page" style="padding:40px 0"><div class="spin-big"></div></div>
      </div>
      <div id="tl-load-more" style="text-align:center;margin-top:14px;display:none">
        <button id="btn-carregar-mais" style="padding:8px 18px;background:#fff;border:1px solid var(--borda);border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:12px;color:var(--txt2);cursor:pointer">Carregar mais</button>
      </div>
    </div>
    <div id="modal-criar-enquete" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.7);z-index:400;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:12px;width:460px;max-width:100%;max-height:85vh;display:flex;flex-direction:column;overflow:hidden">
        <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)">Nova enquete</div>
          <button onclick="document.getElementById('modal-criar-enquete').style.display='none'" style="background:none;border:none;color:var(--bege);font-size:20px;cursor:pointer;line-height:1">×</button>
        </div>
        <div style="overflow-y:auto;flex:1;padding:18px 20px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Pergunta</label>
          <textarea id="enq-pergunta" rows="2" placeholder="Ex: Qual horário vocês preferem para a aula extra de sábado?"
            style="width:100%;margin-top:5px;margin-bottom:14px;border:1px solid var(--borda);border-radius:6px;padding:9px 11px;font-size:13px;font-family:'DM Sans',sans-serif;resize:none"></textarea>
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Opções</label>
          <div id="enq-opcoes-lista" style="display:flex;flex-direction:column;gap:6px;margin-top:5px"></div>
          <button id="btn-enq-add-opcao" style="margin-top:8px;padding:7px 12px;background:rgba(31,56,31,.06);color:var(--verde);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">+ Adicionar opção</button>
        </div>
        <div style="padding:14px 20px;border-top:1px solid var(--borda);display:flex;justify-content:flex-end;gap:8px;flex-shrink:0">
          <button onclick="document.getElementById('modal-criar-enquete').style.display='none'" style="padding:8px 16px;background:#fff;border:1px solid var(--borda);border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;color:var(--txt2)">Cancelar</button>
          <button id="btn-enq-publicar" style="padding:8px 18px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500">Publicar enquete</button>
        </div>
      </div>
    </div>
    <div id="modal-votos-enquete" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.7);z-index:400;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:12px;width:440px;max-width:100%;max-height:80vh;display:flex;flex-direction:column;overflow:hidden">
        <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)">Votos individuais</div>
          <button onclick="document.getElementById('modal-votos-enquete').style.display='none'" style="background:none;border:none;color:var(--bege);font-size:20px;cursor:pointer;line-height:1">×</button>
        </div>
        <div id="votos-enquete-body" style="overflow-y:auto;flex:1;padding:12px 20px">Carregando...</div>
      </div>
    </div>
    <div id="modal-lista-pessoas" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.7);z-index:400;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:12px;width:400px;max-width:100%;max-height:75vh;display:flex;flex-direction:column;overflow:hidden">
        <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)" id="lista-pessoas-titulo">—</div>
          <button onclick="document.getElementById('modal-lista-pessoas').style.display='none'" style="background:none;border:none;color:var(--bege);font-size:20px;cursor:pointer;line-height:1">×</button>
        </div>
        <div id="lista-pessoas-body" style="overflow-y:auto;flex:1;padding:14px 20px">Carregando...</div>
      </div>
    </div>
  `

  uiAnimar(container)

  let feedOffset    = 0
  let modoModeracao = false

  if (podePostar) {
    document.getElementById('btn-tl-postar')?.addEventListener('click', () => publicarPost())
    document.getElementById('btn-tl-cancelar')?.addEventListener('click', () => limparCompose())
  }
  if (isAdmin) {
    document.getElementById('btn-moderacao')?.addEventListener('click', () => toggleModeracao())
    atualizarContadorPendentes()
  }
  if (isAdmin || isProf) {
    document.getElementById('btn-criar-enquete')?.addEventListener('click', () => abrirModalCriarEnquete())
    document.getElementById('btn-enq-add-opcao')?.addEventListener('click', () => _enqAdicionarOpcao())
    document.getElementById('btn-enq-publicar')?.addEventListener('click', () => publicarEnquete())
  }
  document.getElementById('btn-carregar-mais')?.addEventListener('click', () => carregarFeed(true))

  await Promise.all([carregarFeed(false), carregarEnquetes()])

  // ════════════════════════════════════════════════════════════
  // Quem curtiu / salvou / visualizou (admin) — item 2
  // ════════════════════════════════════════════════════════════

  window._abrirListaPessoas = async function(tipo, postId, titulo) {
    const modal = document.getElementById('modal-lista-pessoas')
    const body  = document.getElementById('lista-pessoas-body')
    document.getElementById('lista-pessoas-titulo').textContent = titulo
    modal.style.display = 'flex'
    body.innerHTML = 'Carregando...'

    const config = {
      curtidas:       { tabela: 'timeline_curtidas',      campoData: 'criado_em' },
      salvos:         { tabela: 'timeline_salvos',        campoData: 'criado_em' },
      visualizacoes:  { tabela: 'timeline_visualizacoes', campoData: 'visualizado_em' },
    }[tipo]
    if (!config) { body.innerHTML = '<p style="font-size:12px;color:#c0392b">Tipo inválido.</p>'; return }

    const { data, error } = await sb
      .from(config.tabela)
      .select(`perfil_id, ${config.campoData}, perfil:perfis!perfil_id(nome)`)
      .eq('post_id', postId)
      .order(config.campoData, { ascending: true })

    if (error) { body.innerHTML = `<p style="font-size:12px;color:#c0392b">Erro: ${escapeHtml(error.message)}</p>`; return }
    if (!data?.length) { body.innerHTML = '<p style="font-size:12px;color:var(--txt2)">Ninguém ainda.</p>'; return }

    body.innerHTML = data.map(r => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(212,200,158,.3)">
        <span style="font-size:13px;font-weight:500;color:var(--txt)">${escapeHtml(r.perfil?.nome || '—')}</span>
        <span style="font-size:11px;color:var(--txt2)">${new Date(r[config.campoData]).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>
      </div>`).join('')
  }

  // Rastreio de visualização: quando um post fica visível na tela por ~1s,
  // registra em timeline_visualizacoes (upsert — não duplica por aluno/post).
  // Silencioso em caso de erro, pois visualização não é uma ação crítica.
  function _observarVisualizacoes(ids) {
    if (!('IntersectionObserver' in window)) return
    window._tlVisualizacoesRegistradas = window._tlVisualizacoesRegistradas || new Set()
    const registradas = window._tlVisualizacoesRegistradas

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target
        const postId = el.dataset.postId
        if (!postId || registradas.has(postId)) return
        if (entry.isIntersecting) {
          el._tlViewTimer = setTimeout(async () => {
            if (registradas.has(postId)) return
            registradas.add(postId)
            observer.unobserve(el)
            try {
              await sb.from('timeline_visualizacoes').upsert(
                { post_id: postId, perfil_id: perfil.id },
                { onConflict: 'post_id,perfil_id' }
              )
            } catch (e) { /* silencioso */ }
          }, 1000)
        } else {
          clearTimeout(el._tlViewTimer)
        }
      })
    }, { threshold: 0.6 })

    ids.forEach(id => {
      const el = document.getElementById(`tl-post-${id}`)
      if (el) { el.dataset.postId = id; observer.observe(el) }
    })
  }

  // ════════════════════════════════════════════════════════════
  // Enquetes (múltipla escolha)
  // ════════════════════════════════════════════════════════════

  function _enqAdicionarOpcao(valor = '') {
    const lista = document.getElementById('enq-opcoes-lista')
    if (!lista) return
    const idx = lista.children.length
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;gap:6px;align-items:center'
    row.innerHTML = `
      <input type="text" class="enq-opcao-input" placeholder="Opção ${idx + 1}" value="${valor}"
        style="flex:1;border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:12px;font-family:'DM Sans',sans-serif">
      <button type="button" class="enq-opcao-remover" style="background:none;border:none;color:var(--txt2);font-size:16px;cursor:pointer;padding:2px 6px" title="Remover">×</button>
    `
    row.querySelector('.enq-opcao-remover').addEventListener('click', () => row.remove())
    lista.appendChild(row)
  }

  function abrirModalCriarEnquete() {
    const modal = document.getElementById('modal-criar-enquete')
    const lista = document.getElementById('enq-opcoes-lista')
    document.getElementById('enq-pergunta').value = ''
    lista.innerHTML = ''
    _enqAdicionarOpcao()
    _enqAdicionarOpcao()
    modal.style.display = 'flex'
  }

  async function publicarEnquete() {
    const pergunta = document.getElementById('enq-pergunta').value.trim()
    const opcoes = [...document.querySelectorAll('.enq-opcao-input')]
      .map(i => i.value.trim()).filter(Boolean)
    if (!pergunta) { toast('Escreva a pergunta da enquete'); return }
    if (opcoes.length < 2) { toast('Adicione pelo menos 2 opções'); return }

    const btn = document.getElementById('btn-enq-publicar')
    btn.disabled = true; btn.textContent = 'Publicando...'
    const { error } = await sb.rpc('criar_enquete_timeline', { p_pergunta: pergunta, p_opcoes: opcoes })
    btn.disabled = false; btn.textContent = 'Publicar enquete'

    if (error) { toast('Erro: ' + error.message); return }
    document.getElementById('modal-criar-enquete').style.display = 'none'
    toast('✓ Enquete publicada')
    await carregarEnquetes()
  }

  async function carregarEnquetes() {
    const { data, error } = await sb.rpc('get_enquetes_timeline')
    const cont = document.getElementById('tl-enquetes-container')
    if (!cont) return
    if (error) { console.warn('get_enquetes_timeline:', error.message); cont.innerHTML = ''; return }
    if (!data?.length) { cont.innerHTML = ''; return }

    // Agrupa linhas (uma por opção) em enquetes
    const mapa = new Map()
    for (const r of data) {
      if (!mapa.has(r.enquete_id)) {
        mapa.set(r.enquete_id, {
          id: r.enquete_id, pergunta: r.pergunta, criadoPorNome: r.criado_por_nome,
          criadoEm: r.criado_em, encerrada: r.encerrada,
          totalParticipantes: Number(r.total_participantes) || 0,
          minhasOpcoesIds: r.minhas_opcoes_ids || [],
          opcoes: [],
        })
      }
      mapa.get(r.enquete_id).opcoes.push({
        id: r.opcao_id, texto: r.opcao_texto, ordem: r.opcao_ordem,
        votos: Number(r.total_votos_opcao) || 0,
      })
    }
    const enquetes = [...mapa.values()]
    cont.innerHTML = enquetes.map(renderEnqueteCard).join('')

    enquetes.forEach(enq => {
      document.getElementById(`btn-enq-votar-${enq.id}`)
        ?.addEventListener('click', () => confirmarVoto(enq.id))
      document.getElementById(`btn-enq-encerrar-${enq.id}`)
        ?.addEventListener('click', () => encerrarEnquete(enq.id))
      document.getElementById(`btn-enq-excluir-${enq.id}`)
        ?.addEventListener('click', () => excluirEnquete(enq.id))
      document.getElementById(`btn-enq-votos-${enq.id}`)
        ?.addEventListener('click', () => abrirVotosIndividuais(enq.id, enq.pergunta))
    })
  }

  function renderEnqueteCard(enq) {
    const jaVotou = enq.minhasOpcoesIds.length > 0
    const mostrarResultado = enq.encerrada || jaVotou
    const podeGerenciar = isAdmin || isProf

    const opcoesHtml = enq.opcoes.map(o => {
      const pct = enq.totalParticipantes > 0 ? Math.round((o.votos / enq.totalParticipantes) * 100) : 0
      const marcada = enq.minhasOpcoesIds.includes(o.id)
      if (mostrarResultado) {
        return `
          <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
              <span style="color:${marcada ? 'var(--verde)' : 'var(--txt)'};font-weight:${marcada ? '600' : '400'}">${marcada ? '✓ ' : ''}${escapeHtml(o.texto)}</span>
              <span style="color:var(--txt2)">${pct}% · ${o.votos}</span>
            </div>
            <div style="height:8px;background:rgba(31,56,31,.07);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${marcada ? 'var(--dourado)' : 'var(--verde-cl, #4a8a4a)'};border-radius:99px"></div>
            </div>
          </div>`
      }
      return `
        <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--borda);border-radius:6px;margin-bottom:6px;cursor:pointer">
          <input type="checkbox" class="enq-voto-check-${enq.id}" value="${o.id}" style="accent-color:var(--verde)">
          <span style="font-size:13px">${escapeHtml(o.texto)}</span>
        </label>`
    }).join('')

    const acaoVotar = (!enq.encerrada && !jaVotou) ? `
      <button id="btn-enq-votar-${enq.id}" style="width:100%;margin-top:6px;padding:9px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500">Confirmar voto</button>
    ` : (!enq.encerrada && jaVotou) ? `
      <button id="btn-enq-votar-${enq.id}" style="width:100%;margin-top:6px;padding:8px;background:none;color:var(--txt2);border:1px solid var(--borda);border-radius:6px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer">Alterar meu voto</button>
    ` : ''

    const rodapeGestao = podeGerenciar ? `
      <div style="display:flex;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid var(--borda);flex-wrap:wrap">
        <button id="btn-enq-votos-${enq.id}" style="padding:5px 10px;background:rgba(31,56,31,.06);color:var(--verde);border:none;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">🔍 Ver votos individuais</button>
        ${!enq.encerrada ? `<button id="btn-enq-encerrar-${enq.id}" style="padding:5px 10px;background:none;color:var(--txt2);border:1px solid var(--borda);border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">Encerrar</button>` : ''}
        ${isAdmin ? `<button id="btn-enq-excluir-${enq.id}" style="padding:5px 10px;background:none;color:#c0392b;border:1px solid #f0c0c0;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">Excluir</button>` : ''}
      </div>` : ''

    return `
      <div class="tl-enquete-card" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:14px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">
          <div>
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);margin-bottom:3px">📊 Enquete · ${escapeHtml(enq.criadoPorNome)}${enq.encerrada ? ' · encerrada' : ''}</div>
            <div style="font-size:14px;font-weight:600;color:var(--verde);line-height:1.4">${escapeHtml(enq.pergunta)}</div>
          </div>
        </div>
        ${opcoesHtml}
        ${acaoVotar}
        <div style="font-size:10px;color:var(--txt2);margin-top:8px">${enq.totalParticipantes} pessoa(s) votaram · pode marcar mais de uma opção</div>
        ${rodapeGestao}
      </div>`
  }

  async function confirmarVoto(enqId) {
    const checks = [...document.querySelectorAll(`.enq-voto-check-${enqId}:checked`)].map(c => c.value)
    if (!checks.length) { toast('Marque pelo menos uma opção'); return }
    const { data, error } = await sb.rpc('votar_enquete_multipla', { p_enquete_id: enqId, p_opcoes_ids: checks })
    if (error || !data?.ok) { toast('❌ ' + (data?.motivo || error?.message)); return }
    toast('✓ Voto registrado')
    await carregarEnquetes()
  }

  async function encerrarEnquete(enqId) {
    if (!confirm('Encerrar esta enquete? Ninguém mais poderá votar.')) return
    const { error } = await sb.rpc('encerrar_enquete', { p_enquete_id: enqId })
    if (error) { toast('Erro: ' + error.message); return }
    toast('Enquete encerrada')
    await carregarEnquetes()
  }

  async function excluirEnquete(enqId) {
    if (!confirm('Excluir esta enquete e todos os votos? Não pode ser desfeito.')) return
    const { error } = await sb.rpc('excluir_enquete', { p_enquete_id: enqId })
    if (error) { toast('Erro: ' + error.message); return }
    toast('Enquete excluída')
    await carregarEnquetes()
  }

  async function abrirVotosIndividuais(enqId, pergunta) {
    const modal = document.getElementById('modal-votos-enquete')
    const body = document.getElementById('votos-enquete-body')
    modal.style.display = 'flex'
    body.innerHTML = 'Carregando...'

    const { data, error } = await sb
      .from('timeline_enquete_votos')
      .select('votado_em, aluno:perfis!aluno_id(nome), opcao:timeline_enquete_opcoes!opcao_id(texto)')
      .eq('enquete_id', enqId)
      .order('votado_em', { ascending: true })

    if (error) { body.innerHTML = `<p style="color:#c0392b;font-size:12px">Erro: ${error.message}</p>`; return }
    if (!data?.length) { body.innerHTML = `<p style="font-size:12px;color:var(--txt2)">Ninguém votou ainda.</p>`; return }

    // Agrupa por aluno (múltipla escolha = várias linhas por pessoa)
    const porAluno = new Map()
    for (const v of data) {
      const nome = v.aluno?.nome || '—'
      if (!porAluno.has(nome)) porAluno.set(nome, [])
      porAluno.get(nome).push(v.opcao?.texto || '—')
    }

    body.innerHTML = `
      <div style="font-size:11px;color:var(--txt2);margin-bottom:12px">${escapeHtml(pergunta)}</div>
      ${[...porAluno.entries()].map(([nome, opcoes]) => `
        <div style="padding:9px 12px;background:rgba(31,56,31,.03);border-radius:6px;margin-bottom:6px">
          <div style="font-size:12px;font-weight:600;color:var(--verde)">${escapeHtml(nome)}</div>
          <div style="font-size:11px;color:var(--txt2);margin-top:2px">${opcoes.map(escapeHtml).join(' · ')}</div>
        </div>`).join('')}
    `
  }

  // ════════════════════════════════════════════════════════════
  // Feed
  // ════════════════════════════════════════════════════════════

  async function carregarFeed(append) {
    if (!append) feedOffset = 0
    modoModeracao = false

    const { data, error } = await sb.rpc('get_timeline_feed', {
      p_limit: PAGE_SIZE, p_offset: feedOffset,
    })

    const feedEl = document.getElementById('tl-feed-container')
    if (!feedEl) return

    if (error) {
      feedEl.innerHTML = `<div style="padding:24px;text-align:center;font-size:12px;color:#c0392b">Erro ao carregar feed: ${error.message}</div>`
      return
    }

    if (!append) feedEl.innerHTML = ''

    if (!data?.length && !append) {
      feedEl.innerHTML = `<div style="padding:40px 20px;text-align:center;color:var(--txt2)">
        <div style="font-size:32px;margin-bottom:10px">🌱</div>
        <div style="font-size:13px">Nenhuma publicação ainda.</div>
      </div>`
      document.getElementById('tl-load-more').style.display = 'none'
      return
    }

    // RPC retorna colunas prefixadas: post_id, post_conteudo, post_status, etc.
    // Normaliza para objeto uniforme usado pelo renderPostCard
    const posts = (data || []).map(r => ({
      id:         r.post_id,
      autor_id:   r.post_autor_id,
      autor_nome: r.autor_nome,
      autor_foto: r.autor_foto,
      autor_tipo: r.autor_tipo,
      conteudo:   r.post_conteudo,
      midia_url:  r.post_midia_url,
      midia_tipo: r.post_midia_tipo,
      status:     r.post_status,
      criado_em:  r.post_criado_em,
      total_curtidas:    r.total_curtidas    ?? 0,
      total_comentarios: r.total_comentarios ?? 0,
      eu_curti:   r.eu_curti  === true,
      eu_salvei:  r.eu_salvei === true,
    }))

    posts.forEach(post => feedEl.insertAdjacentHTML('beforeend', renderPostCard(post, false)))
    ligarEventosPosts(posts.map(p => p.id))
    _observarVisualizacoes(posts.map(p => p.id))
    await aplicarVocabulario(feedEl)

    feedOffset += posts.length
    document.getElementById('tl-load-more').style.display = posts.length < PAGE_SIZE ? 'none' : 'block'
  }

  // ════════════════════════════════════════════════════════════
  // Moderação
  // ════════════════════════════════════════════════════════════

  async function toggleModeracao() {
    const { data, error } = await sb.rpc('get_posts_pendentes')
    if (error) { toast('Erro: ' + error.message); return }

    const feedEl = document.getElementById('tl-feed-container')
    if (!feedEl) return
    document.getElementById('tl-load-more').style.display = 'none'
    modoModeracao = true

    if (!data?.length) {
      feedEl.innerHTML = `<div style="padding:30px 20px;text-align:center;color:var(--txt2);font-size:13px">Nenhum post pendente. ✓</div>`
      return
    }

    feedEl.innerHTML = `<div style="font-size:12px;font-weight:600;color:#e67e22;margin-bottom:10px">📋 ${data.length} post(s) pendente(s)</div>`
    data.forEach(p => {
      const post = {
        id: p.id, autor_id: null, autor_nome: p.autor_nome, autor_tipo: 'aluno', autor_foto: null,
        conteudo: p.conteudo, midia_url: p.midia_url, midia_tipo: p.midia_tipo,
        status: 'pendente', criado_em: p.criado_em,
        total_curtidas: 0, total_comentarios: 0, eu_curti: false, eu_salvei: false,
      }
      feedEl.insertAdjacentHTML('beforeend', renderPostCard(post, true))
    })
    ligarEventosModeracao(data.map(p => p.id))
  }

  async function atualizarContadorPendentes() {
    const { data } = await sb.rpc('get_posts_pendentes')
    const el = document.getElementById('mod-count')
    if (el) el.textContent = data?.length ?? 0
  }

  // ════════════════════════════════════════════════════════════
  // Render card
  // ════════════════════════════════════════════════════════════

  function renderPostCard(post, emModeracao) {
    const fotoHtml = post.autor_foto
      ? `<img src="${post.autor_foto}" referrerpolicy="no-referrer" style="width:38px;height:38px;border-radius:50%;object-fit:cover">`
      : `<div style="width:38px;height:38px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--verde)">${(post.autor_nome || '?')[0].toUpperCase()}</div>`

    const roleBadgeMap = {
      admin:     { bg: 'var(--verde)',          cor: 'var(--bege)',    label: 'Admin'     },
      professor: { bg: 'var(--dourado)',         cor: 'var(--verde)',   label: 'Professor' },
      aluno:     { bg: 'rgba(31,56,31,.08)',     cor: 'var(--verde)',   label: 'Aluno'     },
    }
    const rb = roleBadgeMap[post.autor_tipo]
    const roleBadge = rb
      ? `<span style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;padding:2px 7px;border-radius:10px;background:${rb.bg};color:${rb.cor};margin-left:6px">${rb.label}</span>`
      : ''

    const pendBadge = post.status === 'pendente'
      ? `<div style="font-size:11px;color:#e67e22;margin:6px 18px 0;display:flex;align-items:center;gap:5px">⏳ Aguardando aprovação</div>` : ''

    const conteudoHtml = post.conteudo
      ? `<div style="padding:12px 18px 0;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word;color:var(--txt)">${escapeHtml(post.conteudo)}</div>` : ''

    const mediaHtml = renderMedia(post.midia_url, post.midia_tipo)

    const curtidoColor = post.eu_curti  ? '#e74c3c'        : 'var(--txt2)'
    const salvoColor   = post.eu_salvei ? 'var(--dourado)' : 'var(--txt2)'

    const btnCurtir = `<button class="tl-btn-curtir" data-post="${post.id}" data-curtido="${post.eu_curti}"
      style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border:none;background:none;cursor:pointer;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:${curtidoColor}">
      ❤️ ${post.total_curtidas ?? 0}</button>`

    const btnComentar = podeComentar
      ? `<button class="tl-btn-comentar" data-post="${post.id}"
          style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border:none;background:none;cursor:pointer;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--txt2)">
          💬 ${post.total_comentarios ?? 0}</button>`
      : `<button disabled title="Disponível a partir do plano Shiva"
          style="flex:1;padding:8px;border:none;background:none;font-size:12px;color:var(--txt2);opacity:.4">
          💬 ${post.total_comentarios ?? 0}</button>`

    const btnSalvar = podeSalvar
      ? `<button class="tl-btn-salvar" data-post="${post.id}" data-salvo="${post.eu_salvei}"
          style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border:none;background:none;cursor:pointer;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:${salvoColor}">
          🔖 ${post.eu_salvei ? 'Salvo' : 'Salvar'}</button>`
      : `<button disabled title="Disponível a partir do plano Brahma"
          style="flex:1;padding:8px;border:none;background:none;font-size:12px;color:var(--txt2);opacity:.4">
          🔖 Salvar</button>`

    // Botão excluir: admin/prof sempre; autor do próprio post também pode
    const ehAutor = post.autor_id === perfil.id
    const btnExcluir = (podeExcluir || ehAutor)
      ? `<button class="tl-btn-excluir-post" data-post="${post.id}"
          style="padding:4px 8px;border:none;background:none;cursor:pointer;font-size:11px;color:var(--txt2);border-radius:4px"
          title="Excluir post">🗑</button>`
      : ''

    // Linha admin-only: acesso rápido a "quem curtiu / salvou / visualizou" (item 2).
    // Não aparece pra professor nem aluno — só admin enxerga essas listas.
    const adminStatsRow = (isAdmin && post.status !== 'pendente') ? `
      <div style="display:flex;gap:14px;padding:7px 18px;border-top:1px solid rgba(212,200,158,.2);font-size:10px;color:var(--txt2)">
        <span style="cursor:pointer" onclick="window._abrirListaPessoas('curtidas','${post.id}','Quem curtiu')">❤️ ver quem curtiu</span>
        <span style="cursor:pointer" onclick="window._abrirListaPessoas('salvos','${post.id}','Quem salvou')">🔖 ver quem salvou</span>
        <span style="cursor:pointer" onclick="window._abrirListaPessoas('visualizacoes','${post.id}','Quem visualizou')">👁 ver quem visualizou</span>
      </div>` : ''

    const modBar = emModeracao ? `
      <div style="display:flex;gap:8px;padding:10px 18px;border-top:1px solid var(--borda);background:#fff8f0">
        <span style="flex:1;font-size:11px;color:#e67e22;display:flex;align-items:center">Moderar este post:</span>
        <button class="tl-btn-aprovar" data-post="${post.id}" style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer">Aprovar</button>
        <button class="tl-btn-rejeitar" data-post="${post.id}" style="padding:6px 14px;background:#fff;color:#c0392b;border:1px solid #f5c1c1;border-radius:6px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer">Rejeitar</button>
      </div>` : ''

    const comentariosSection = podeComentar ? `
      <div id="tl-comments-${post.id}" data-aberto="0" style="max-height:0;overflow:hidden;border-top:0 solid var(--borda);padding:0 18px;transition:max-height .2s ease">
        <div id="tl-comments-list-${post.id}"></div>
        <div style="display:flex;gap:8px;align-items:flex-end;margin-top:8px;padding-bottom:10px">
          <textarea id="tl-comment-input-${post.id}" rows="1" placeholder="Escreva um comentário..."
            style="flex:1;border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:12px;font-family:'DM Sans',sans-serif;resize:none;min-height:34px"></textarea>
          <button class="tl-btn-enviar-comentario" data-post="${post.id}"
            style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer">Enviar</button>
        </div>
      </div>` : ''

    return `
      <div class="tl-post-card" id="tl-post-${post.id}"
        style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);margin-bottom:14px;overflow:hidden;${post.status === 'pendente' ? 'border-left:3px solid #e67e22' : ''}">
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 0">
          ${fotoHtml}
          <div style="flex:1">
            <div><span style="font-size:13px;font-weight:600;color:var(--txt)">${escapeHtml(post.autor_nome || 'Usuário')}</span>${roleBadge}</div>
            <div style="font-size:11px;color:var(--txt2);margin-top:1px">${formatarData(post.criado_em)}</div>
          </div>
          ${btnExcluir}
        </div>
        ${pendBadge}
        ${conteudoHtml}
        ${mediaHtml}
        <div style="display:flex;border-top:1px solid var(--borda);margin-top:10px">
          ${btnCurtir}
          ${btnComentar}
          ${btnSalvar}
        </div>
        ${adminStatsRow}
        ${modBar}
        ${comentariosSection}
      </div>
    `
  }

  // ════════════════════════════════════════════════════════════
  // Mídia
  // ════════════════════════════════════════════════════════════

  function renderMedia(url, tipo) {
    if (!url) return ''
    if (!tipo) tipo = detectarTipoMidia(url)

    if (tipo === 'imagem') {
      return `<div style="margin-top:12px;cursor:zoom-in;position:relative" onclick="window._tlAbrirLightbox('${url}')" title="Clique para ampliar">
        <img src="${url}" referrerpolicy="no-referrer" style="width:100%;max-height:420px;object-fit:cover;display:block" loading="lazy" onerror="this.parentElement.remove()">
        <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.4);border-radius:20px;padding:3px 8px;font-size:10px;color:#fff;display:flex;align-items:center;gap:4px;pointer-events:none">
          <i class="ti ti-zoom-in" style="font-size:12px"></i> ampliar
        </div>
      </div>`
    }

    if (tipo === 'video') {
      const embed = gerarEmbedVideo(url)
      if (embed) {
        return `<div style="margin-top:12px"><iframe src="${embed}" style="width:100%;aspect-ratio:16/9;border:none;display:block" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`
      }
      // Arquivo de vídeo direto (mp4/webm/ogg/mov) — sem provedor reconhecido, usa <video> nativo
      return `<div style="margin-top:12px"><video src="${url}" controls preload="metadata" style="width:100%;max-height:420px;display:block;background:#000"></video></div>`
    }

    if (tipo === 'pdf') {
      const viewer = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
      return `<div style="margin-top:12px;border:1px solid var(--borda);border-radius:8px;overflow:hidden">
        <iframe src="${viewer}" style="width:100%;height:420px;border:none;display:block" loading="lazy"></iframe>
        <a href="${url}" target="_blank" rel="noopener"
          style="display:flex;align-items:center;gap:6px;padding:8px 12px;font-size:11px;color:var(--txt2);background:rgba(31,56,31,.03);text-decoration:none">
          <span>📄</span><span>Abrir PDF em nova aba</span>
        </a>
      </div>`
    }

    return `<div style="margin:12px 18px 0">
      <a href="${url}" target="_blank" rel="noopener"
        style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(31,56,31,.04);border:1px solid var(--borda);border-radius:6px;text-decoration:none;color:var(--txt);font-size:12px">
        <span>🔗</span><span style="word-break:break-all">${url}</span>
      </a>
    </div>`
  }

  // Detecta o tipo de mídia a partir da URL: pdf, imagem, video ou link genérico.
  // Cobre extensão direta de arquivo E hosts conhecidos que não expõem extensão na URL.
  function detectarTipoMidia(url) {
    const u = (url || '').split('#')[0].split('?')[0].toLowerCase()
    const uOriginal = url || ''

    // PDF — sempre por extensão
    if (/\.pdf$/i.test(u)) return 'pdf'

    // Vídeo — provedores conhecidos (qualquer formato de link) ou arquivo de vídeo direto
    if (/youtube\.com|youtu\.be|vimeo\.com/i.test(uOriginal)) return 'video'
    if (/\.(mp4|webm|ogv|ogg|mov|m4v)$/i.test(u)) return 'video'

    // Imagem — extensão direta
    if (/\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(u)) return 'imagem'
    // Imagem — hosts conhecidos que servem imagem sem extensão na URL
    if (/(^|\.)imgur\.com\//i.test(uOriginal)) return 'imagem'
    if (/ibb\.co\//i.test(uOriginal)) return 'imagem'
    if (/postimg\.cc\//i.test(uOriginal)) return 'imagem'
    if (/i\.redd\.it\//i.test(uOriginal)) return 'imagem'
    if (/cdn\.discordapp\.com\/attachments\//i.test(uOriginal) && /\.(jpe?g|png|gif|webp)$/i.test(u)) return 'imagem'

    return 'link'
  }

  // Converte uma URL de vídeo (YouTube em qualquer formato, ou Vimeo) para a URL de embed
  // que pode ser usada como src de <iframe> sem ser bloqueada por X-Frame-Options.
  // Retorna null se a URL não for de um provedor reconhecido (ex: vídeo direto .mp4).
  function gerarEmbedVideo(url) {
    // youtube.com/watch?v=ID (com quaisquer outros parâmetros antes ou depois do v=)
    let m = url.match(/youtube\.com\/watch\?[^#]*\bv=([\w-]{6,})/i)
    if (m) return `https://www.youtube.com/embed/${m[1]}`
    // youtu.be/ID (link curto de compartilhamento)
    m = url.match(/youtu\.be\/([\w-]{6,})/i)
    if (m) return `https://www.youtube.com/embed/${m[1]}`
    // youtube.com/shorts/ID
    m = url.match(/youtube\.com\/shorts\/([\w-]{6,})/i)
    if (m) return `https://www.youtube.com/embed/${m[1]}`
    // já é um link de embed do YouTube — usa direto
    if (/youtube\.com\/embed\//i.test(url)) return url
    // vimeo.com/ID
    m = url.match(/vimeo\.com\/(\d+)/i)
    if (m) return `https://player.vimeo.com/video/${m[1]}`
    // já é um link de player do Vimeo — usa direto
    if (/player\.vimeo\.com\/video\//i.test(url)) return url
    return null
  }

  // ════════════════════════════════════════════════════════════
  // Event binding
  // ════════════════════════════════════════════════════════════

  function ligarEventosPosts(ids) {
    ids.forEach(id => {
      document.querySelector(`.tl-btn-curtir[data-post="${id}"]`)
        ?.addEventListener('click', e => toggleCurtir(id, e.currentTarget))
      document.querySelector(`.tl-btn-salvar[data-post="${id}"]`)
        ?.addEventListener('click', e => toggleSalvar(id, e.currentTarget))
      document.querySelector(`.tl-btn-comentar[data-post="${id}"]`)
        ?.addEventListener('click', () => toggleComentarios(id))
      document.querySelector(`.tl-btn-enviar-comentario[data-post="${id}"]`)
        ?.addEventListener('click', () => enviarComentario(id))
      document.querySelector(`.tl-btn-excluir-post[data-post="${id}"]`)
        ?.addEventListener('click', () => excluirPost(id))
    })
  }

  function ligarEventosModeracao(ids) {
    ids.forEach(id => {
      document.querySelector(`.tl-btn-aprovar[data-post="${id}"]`)
        ?.addEventListener('click', () => moderarPost(id, 'aprovar'))
      document.querySelector(`.tl-btn-rejeitar[data-post="${id}"]`)
        ?.addEventListener('click', () => moderarPost(id, 'rejeitar'))
      document.querySelector(`.tl-btn-excluir-post[data-post="${id}"]`)
        ?.addEventListener('click', () => excluirPost(id))
    })
  }

  // ════════════════════════════════════════════════════════════
  // Ações
  // ════════════════════════════════════════════════════════════

  async function toggleCurtir(postId, btn) {
    const curtido = btn.dataset.curtido === 'true'
    btn.disabled = true
    if (curtido) {
      await sb.from('timeline_curtidas').delete().eq('post_id', postId).eq('perfil_id', perfil.id)
    } else {
      await sb.from('timeline_curtidas').insert({ post_id: postId, perfil_id: perfil.id })
    }
    const { count } = await sb.from('timeline_curtidas')
      .select('id', { count: 'exact', head: true }).eq('post_id', postId)
    btn.dataset.curtido = (!curtido).toString()
    btn.style.color = !curtido ? '#e74c3c' : 'var(--txt2)'
    btn.innerHTML = `❤️ ${count ?? 0}`
    btn.disabled = false
  }

  async function toggleSalvar(postId, btn) {
    const salvo = btn.dataset.salvo === 'true'
    btn.disabled = true
    if (salvo) {
      await sb.from('timeline_salvos').delete().eq('post_id', postId).eq('perfil_id', perfil.id)
    } else {
      await sb.from('timeline_salvos').insert({ post_id: postId, perfil_id: perfil.id })
    }
    btn.dataset.salvo = (!salvo).toString()
    btn.style.color = !salvo ? 'var(--dourado)' : 'var(--txt2)'
    btn.innerHTML = `🔖 ${!salvo ? 'Salvo' : 'Salvar'}`
    btn.disabled = false
    toast(salvo ? 'Removido dos salvos' : 'Post salvo 🔖')
  }

  async function toggleComentarios(postId) {
    const sec = document.getElementById(`tl-comments-${postId}`)
    if (!sec) return
    const aberto = sec.dataset.aberto === '1'
    if (aberto) {
      sec.style.maxHeight = '0'
      sec.style.borderTopWidth = '0'
      sec.style.padding = '0 18px'
      sec.dataset.aberto = '0'
    } else {
      sec.style.maxHeight = '600px'
      sec.style.borderTopWidth = '1px'
      sec.style.padding = '10px 18px'
      sec.dataset.aberto = '1'
      await carregarComentarios(postId)
    }
  }

  async function carregarComentarios(postId) {
    const list = document.getElementById(`tl-comments-list-${postId}`)
    if (!list) return
    list.innerHTML = `<div style="font-size:11px;color:var(--txt2)">Carregando...</div>`

    const { data, error } = await sb.rpc('get_comentarios_post', { p_post_id: postId })

    const listAfter = document.getElementById(`tl-comments-list-${postId}`)
    if (!listAfter) return

    if (error || !data?.length) {
      listAfter.innerHTML = `<div style="font-size:12px;color:var(--txt2);padding:4px 0">Nenhum comentário ainda.</div>`
      return
    }

    // RPC retorna: comentario_id, autor_nome, autor_tipo, comentario_text, comentario_em
    listAfter.innerHTML = data.map(c => {
      const btnExcluirComentario = podeExcluir
        ? `<button class="tl-btn-excluir-comentario" data-comentario="${c.comentario_id}"
            style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--txt2);padding:0 0 0 6px"
            title="Excluir comentário">🗑</button>`
        : ''
      return `
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <div style="width:26px;height:26px;border-radius:50%;background:rgba(31,56,31,.08);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--verde);flex-shrink:0">
            ${(c.autor_nome || '?')[0].toUpperCase()}
          </div>
          <div style="flex:1;background:rgba(31,56,31,.03);border-radius:6px;padding:7px 10px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="font-size:11px;font-weight:600;color:var(--verde)">${escapeHtml(c.autor_nome)}</span>
              ${btnExcluirComentario}
            </div>
            <div style="font-size:12px;color:var(--txt);margin-top:2px;line-height:1.5">${escapeHtml(c.comentario_text)}</div>
            <div style="font-size:10px;color:var(--txt2);margin-top:3px">${formatarData(c.comentario_em)}</div>
          </div>
        </div>`
    }).join('')

    // Liga botões de exclusão de comentário
    data.forEach(c => {
      document.querySelector(`.tl-btn-excluir-comentario[data-comentario="${c.comentario_id}"]`)
        ?.addEventListener('click', () => excluirComentario(c.comentario_id, postId))
    })
  }

  async function enviarComentario(postId) {
    const input = document.getElementById(`tl-comment-input-${postId}`)
    const texto = input.value.trim()
    if (!texto) return

    const { error } = await sb.from('timeline_comentarios').insert({
      post_id: postId, autor_id: perfil.id, conteudo: texto,
    })
    if (error) { toast('Erro ao comentar: ' + error.message); return }

    input.value = ''
    await carregarComentarios(postId)

    const { count } = await sb.from('timeline_comentarios')
      .select('id', { count: 'exact', head: true }).eq('post_id', postId)
    const btn = document.querySelector(`.tl-btn-comentar[data-post="${postId}"]`)
    if (btn) btn.innerHTML = `💬 ${count ?? 0}`
    toast('Comentário enviado 💬')
  }

  async function excluirPost(postId) {
    if (!confirm('Excluir este post? Esta ação não pode ser desfeita.')) return
    const { error } = await sb.rpc('excluir_post_timeline', { p_post_id: postId })
    if (error) { toast('Erro ao excluir: ' + error.message); return }
    document.getElementById(`tl-post-${postId}`)?.remove()
    toast('Post excluído')
    if (isAdmin) await atualizarContadorPendentes()
  }

  async function excluirComentario(comentarioId, postId) {
    if (!confirm('Excluir este comentário?')) return
    const { error } = await sb.rpc('excluir_comentario_timeline', { p_comentario_id: comentarioId })
    if (error) { toast('Erro ao excluir: ' + error.message); return }
    await carregarComentarios(postId)

    const { count } = await sb.from('timeline_comentarios')
      .select('id', { count: 'exact', head: true }).eq('post_id', postId)
    const btn = document.querySelector(`.tl-btn-comentar[data-post="${postId}"]`)
    if (btn) btn.innerHTML = `💬 ${count ?? 0}`
    toast('Comentário excluído')
  }

  async function moderarPost(postId, acao) {
    const { error } = await sb.rpc('moderar_post_timeline', { p_post_id: postId, p_acao: acao })
    if (error) { toast('Erro: ' + error.message); return }
    toast(acao === 'aprovar' ? 'Post aprovado ✓' : 'Post rejeitado')
    document.getElementById(`tl-post-${postId}`)?.remove()
    await atualizarContadorPendentes()
  }

  async function publicarPost() {
    const textoEl = document.getElementById('tl-compose-texto')
    const midiaEl = document.getElementById('tl-compose-midia')
    const texto   = textoEl.value.trim()
    const midia   = midiaEl.value.trim()
    if (!texto && !midia) { toast('Escreva algo ou adicione um link'); return }

    const btn = document.getElementById('btn-tl-postar')
    btn.disabled = true
    btn.textContent = 'Publicando...'

    const tipo = midia ? detectarTipoMidia(midia) : null
    const { error } = await sb.rpc('criar_post_timeline', {
      p_conteudo: texto || null, p_midia_url: midia || null, p_midia_tipo: tipo,
    })

    btn.disabled = false
    btn.textContent = 'Publicar'

    if (error) { toast('Erro ao publicar: ' + error.message); return }

    limparCompose()
    if (isAdmin || isProf) {
      toast('Post publicado 🌿')
      await carregarFeed(false)
    } else {
      toast('Post enviado para aprovação ⏳')
    }
  }

  function limparCompose() {
    const t = document.getElementById('tl-compose-texto')
    const m = document.getElementById('tl-compose-midia')
    if (t) t.value = ''
    if (m) m.value = ''
  }

  // ════════════════════════════════════════════════════════════
  // Helpers
  // ════════════════════════════════════════════════════════════

  function formatarData(iso) {
    if (!iso) return ''
    const d   = new Date(iso)
    const min = Math.floor((Date.now() - d.getTime()) / 60000)
    if (min < 1)  return 'agora mesmo'
    if (min < 60) return `há ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24)   return `há ${h}h`
    const dias = Math.floor(h / 24)
    if (dias < 7) return `há ${dias} dia${dias > 1 ? 's' : ''}`
    return d.toLocaleDateString('pt-BR')
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }
}

// ════════════════════════════════════════════════════════════
// Compose box (fora do closure, sem estado)
// ════════════════════════════════════════════════════════════

function renderComposeBox(perfil, isAdmin, isProf) {
  const fotoHtml = perfil.foto_url
    ? `<img src="${perfil.foto_url}" referrerpolicy="no-referrer" style="width:36px;height:36px;border-radius:50%;object-fit:cover">`
    : `<div style="width:36px;height:36px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--verde)">${perfil.nome[0].toUpperCase()}</div>`

  const noticeHtml = (!isAdmin && !isProf)
    ? `<div style="font-size:11px;color:#e67e22;margin-top:8px;display:flex;align-items:center;gap:5px">⏳ Seu post passará por aprovação antes de aparecer no feed.</div>`
    : ''

  return `
    <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px;margin-bottom:16px">
      <div style="display:flex;gap:10px;align-items:flex-start">
        ${fotoHtml}
        <textarea id="tl-compose-texto" rows="3" placeholder="Compartilhe algo com a comunidade..."
          style="flex:1;border:1px solid var(--borda);border-radius:6px;padding:10px;font-size:13px;font-family:'DM Sans',sans-serif;resize:none;min-height:70px"></textarea>
      </div>
      <input id="tl-compose-midia" type="url" placeholder="Link de imagem, vídeo (YouTube/Vimeo), PDF ou outro URL..."
        style="width:100%;margin-top:10px;border:1px solid var(--borda);border-radius:6px;padding:8px 10px;font-size:12px;font-family:'DM Sans',sans-serif;box-sizing:border-box">
      ${noticeHtml}
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
        <button id="btn-tl-cancelar" style="padding:7px 16px;background:#fff;border:1px solid var(--borda);border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--txt2);cursor:pointer">Cancelar</button>
        <button id="btn-tl-postar" style="padding:7px 18px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500">Publicar</button>
      </div>
    </div>
  `
}  
