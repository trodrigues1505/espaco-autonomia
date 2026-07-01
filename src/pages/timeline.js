/**
 * src/pages/timeline.js
 */

import { toast } from '../modules/utils.js'
import { uiAnimar } from '../modules/ui.js'

// ── Regras de permissão por plano_tipo ────────────────────────
const PODE_POSTAR_DIRETO = ['admin', 'professor']
const PLANOS_POSTAR_PENDENTE = ['vishnu_2x', 'vishnu_livre']
const PLANOS_COMENTAR        = ['vishnu_2x', 'vishnu_livre', 'shiva_1x', 'shiva_2x']
// Curtir: qualquer perfil logado, incluindo sem matrícula (brahma já cobre o resto)
// Salvar: qualquer aluno com matrícula ativa + admin/professor (não visitante)

const PAGE_SIZE = 10

export async function renderTimeline(container, page) {
  const sb = window._sb
  const perfil = window._perfil

  // ── Descobre plano ativo do aluno (se for aluno) ────────────
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

  const isAdmin = perfil.tipo === 'admin'
  const isProf  = perfil.tipo === 'professor'

  const podePostar   = isAdmin || isProf || PLANOS_POSTAR_PENDENTE.includes(planoTipo)
  const podeComentar = isAdmin || isProf || PLANOS_COMENTAR.includes(planoTipo)
  const podeSalvar   = isAdmin || isProf || !!planoTipo // qualquer plano (inclui brahma), exclui visitante
  const podeCurtir   = true // qualquer perfil logado, incluindo visitante

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Timeline</div>
    </div>
    <div class="content">
      ${podePostar ? renderComposeBox(perfil, isAdmin, isProf) : ''}
      ${isAdmin ? `
        <button id="btn-moderacao" style="width:100%;padding:10px 14px;background:#fff8f0;border:1px solid #f0d9b5;border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:12px;color:#e67e22;cursor:pointer;text-align:left;display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <span>📋 Posts aguardando moderação</span>
          <span id="mod-count" style="background:#e67e22;color:#fff;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:600">0</span>
        </button>` : ''}
      <div id="tl-feed-container">
        <div class="loading-page" style="padding:40px 0"><div class="spin-big"></div></div>
      </div>
      <div id="tl-load-more" style="text-align:center;margin-top:14px;display:none">
        <button id="btn-carregar-mais" style="padding:8px 18px;background:#fff;border:1px solid var(--borda);border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:12px;color:var(--txt2);cursor:pointer">Carregar mais</button>
      </div>
    </div>
  `

  uiAnimar(container)

  // ── Estado local ──
  let feedOffset = 0
  let modoModeracao = false

  // ── Compose handlers ──
  if (podePostar) {
    document.getElementById('btn-tl-postar')?.addEventListener('click', () => publicarPost())
    document.getElementById('btn-tl-cancelar')?.addEventListener('click', () => limparCompose())
  }

  if (isAdmin) {
    document.getElementById('btn-moderacao')?.addEventListener('click', () => toggleModeracao())
    atualizarContadorPendentes()
  }

  document.getElementById('btn-carregar-mais')?.addEventListener('click', () => carregarFeed(true))

  await carregarFeed(false)

  // ════════════════════════════════════════════════════════════
  // Funções internas
  // ════════════════════════════════════════════════════════════

  async function carregarFeed(append) {
    if (!append) feedOffset = 0
    modoModeracao = false

    const { data, error } = await sb.rpc('get_timeline_feed', {
      p_limit: PAGE_SIZE,
      p_offset: feedOffset,
    })

    const feedEl = document.getElementById('tl-feed-container')

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

    data.forEach(post => feedEl.insertAdjacentHTML('beforeend', renderPostCard(post, false)))
    ligarEventosPosts(data.map(p => p.id))

    feedOffset += data.length
    document.getElementById('tl-load-more').style.display = data.length < PAGE_SIZE ? 'none' : 'block'
  }

  async function toggleModeracao() {
    const { data, error } = await sb.rpc('get_posts_pendentes')
    if (error) { toast('Erro: ' + error.message); return }

    const feedEl = document.getElementById('tl-feed-container')
    document.getElementById('tl-load-more').style.display = 'none'
    modoModeracao = true

    if (!data?.length) {
      feedEl.innerHTML = `<div style="padding:30px 20px;text-align:center;color:var(--txt2);font-size:13px">Nenhum post pendente. ✓</div>`
      return
    }

    feedEl.innerHTML = `<div style="font-size:12px;font-weight:600;color:#e67e22;margin-bottom:10px">📋 ${data.length} post(s) pendente(s)</div>`
    data.forEach(p => {
      const post = {
        id: p.id, autor_nome: p.autor_nome, autor_tipo: 'aluno', autor_foto: null,
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

  function renderPostCard(post, emModeracao) {
    const fotoHtml = post.autor_foto
      ? `<img src="${post.autor_foto}" style="width:38px;height:38px;border-radius:50%;object-fit:cover">`
      : `<div style="width:38px;height:38px;border-radius:50%;background:rgba(31,56,31,.1);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--verde)">${(post.autor_nome || '?')[0].toUpperCase()}</div>`

    const roleBadgeMap = {
      admin: { bg: 'var(--verde)', cor: 'var(--bege)', label: 'Admin' },
      professor: { bg: 'var(--dourado)', cor: 'var(--verde)', label: 'Professor' },
      aluno: { bg: 'rgba(31,56,31,.08)', cor: 'var(--verde)', label: 'Aluno' },
    }
    const rb = roleBadgeMap[post.autor_tipo]
    const roleBadge = rb ? `<span style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;padding:2px 7px;border-radius:10px;background:${rb.bg};color:${rb.cor};margin-left:6px">${rb.label}</span>` : ''

    const pendBadge = post.status === 'pendente'
      ? `<div style="font-size:11px;color:#e67e22;margin:6px 18px 0;display:flex;align-items:center;gap:5px">⏳ Aguardando aprovação</div>` : ''

    const conteudoHtml = post.conteudo
      ? `<div style="padding:12px 18px 0;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word;color:var(--txt)">${escapeHtml(post.conteudo)}</div>` : ''

    const mediaHtml = renderMedia(post.midia_url, post.midia_tipo)

    const curtidoColor = post.eu_curti ? '#e74c3c' : 'var(--txt2)'
    const salvoColor   = post.eu_salvei ? 'var(--dourado)' : 'var(--txt2)'

    const btnCurtir = podeCurtir
      ? `<button class="tl-btn-curtir" data-post="${post.id}" data-curtido="${post.eu_curti}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border:none;background:none;cursor:pointer;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:${curtidoColor}">❤️ ${post.total_curtidas ?? 0}</button>`
      : `<button disabled style="flex:1;padding:8px;border:none;background:none;font-size:12px;color:var(--txt2);opacity:.4">❤️ ${post.total_curtidas ?? 0}</button>`

    const btnComentar = podeComentar
      ? `<button class="tl-btn-comentar" data-post="${post.id}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border:none;background:none;cursor:pointer;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--txt2)">💬 ${post.total_comentarios ?? 0}</button>`
      : `<button disabled title="Disponível a partir do plano Shiva" style="flex:1;padding:8px;border:none;background:none;font-size:12px;color:var(--txt2);opacity:.4">💬 ${post.total_comentarios ?? 0}</button>`

    const btnSalvar = podeSalvar
      ? `<button class="tl-btn-salvar" data-post="${post.id}" data-salvo="${post.eu_salvei}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border:none;background:none;cursor:pointer;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:${salvoColor}">🔖 ${post.eu_salvei ? 'Salvo' : 'Salvar'}</button>`
      : `<button disabled title="Disponível a partir do plano Brahma" style="flex:1;padding:8px;border:none;background:none;font-size:12px;color:var(--txt2);opacity:.4">🔖 Salvar</button>`

    const modBar = emModeracao ? `
      <div style="display:flex;gap:8px;padding:10px 18px;border-top:1px solid var(--borda);background:#fff8f0">
        <span style="flex:1;font-size:11px;color:#e67e22;display:flex;align-items:center">Moderar este post:</span>
        <button class="tl-btn-aprovar" data-post="${post.id}" style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer">Aprovar</button>
        <button class="tl-btn-rejeitar" data-post="${post.id}" style="padding:6px 14px;background:#fff;color:#c0392b;border:1px solid #f5c1c1;border-radius:6px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer">Rejeitar</button>
      </div>` : ''

    const comentariosSection = podeComentar ? `
      <div id="tl-comments-${post.id}" style="display:none;border-top:1px solid var(--borda);padding:10px 18px">
        <div id="tl-comments-list-${post.id}"></div>
        <div style="display:flex;gap:8px;align-items:flex-end;margin-top:8px">
          <textarea id="tl-comment-input-${post.id}" rows="1" placeholder="Escreva um comentário..."
            style="flex:1;border:1px solid var(--borda);border-radius:6px;padding:7px 10px;font-size:12px;font-family:'DM Sans',sans-serif;resize:none;min-height:34px"></textarea>
          <button class="tl-btn-enviar-comentario" data-post="${post.id}" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer">Enviar</button>
        </div>
      </div>` : ''

    return `
      <div class="tl-post-card" id="tl-post-${post.id}" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);margin-bottom:14px;overflow:hidden;${post.status === 'pendente' ? 'border-left:3px solid #e67e22' : ''}">
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 0">
          ${fotoHtml}
          <div style="flex:1">
            <div><span style="font-size:13px;font-weight:600;color:var(--txt)">${escapeHtml(post.autor_nome || 'Usuário')}</span>${roleBadge}</div>
            <div style="font-size:11px;color:var(--txt2);margin-top:1px">${formatarData(post.criado_em)}</div>
          </div>
        </div>
        ${pendBadge}
        ${conteudoHtml}
        ${mediaHtml}
        <div style="display:flex;border-top:1px solid var(--borda);margin-top:10px">
          ${btnCurtir}
          ${btnComentar}
          ${btnSalvar}
        </div>
        ${modBar}
        ${comentariosSection}
      </div>
    `
  }

  function renderMedia(url, tipo) {
    if (!url) return ''
    if (!tipo) tipo = detectarTipoMidia(url)

    if (tipo === 'imagem') {
      return `<div style="margin-top:12px"><img src="${url}" style="width:100%;max-height:420px;object-fit:cover;display:block" loading="lazy" onerror="this.parentElement.remove()"></div>`
    }
    if (tipo === 'video') {
      const embed = youtubeEmbed(url) || url
      return `<div style="margin-top:12px"><iframe src="${embed}" style="width:100%;aspect-ratio:16/9;border:none;display:block" allowfullscreen loading="lazy"></iframe></div>`
    }
    return `<div style="margin:12px 18px 0">
      <a href="${url}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(31,56,31,.04);border:1px solid var(--borda);border-radius:6px;text-decoration:none;color:var(--txt);font-size:12px">
        <span>🔗</span><span style="word-break:break-all">${url}</span>
      </a>
    </div>`
  }

  function detectarTipoMidia(url) {
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return 'imagem'
    if (/imgur\.com\/.+\.(jpg|jpeg|png|gif|webp)/i.test(url)) return 'imagem'
    if (/youtube\.com|youtu\.be/i.test(url)) return 'video'
    if (/vimeo\.com/i.test(url)) return 'video'
    return 'link'
  }

  function youtubeEmbed(url) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)
    return m ? `https://www.youtube.com/embed/${m[1]}` : null
  }

  // ── Ligação de eventos por post (delegação simples, re-bind a cada render) ──
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
    })
  }

  function ligarEventosModeracao(ids) {
    ids.forEach(id => {
      document.querySelector(`.tl-btn-aprovar[data-post="${id}"]`)
        ?.addEventListener('click', () => moderarPost(id, 'aprovar'))
      document.querySelector(`.tl-btn-rejeitar[data-post="${id}"]`)
        ?.addEventListener('click', () => moderarPost(id, 'rejeitar'))
    })
  }

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
    const abrir = sec.style.display === 'none'
    sec.style.display = abrir ? 'block' : 'none'
    if (abrir) await carregarComentarios(postId)
  }

  async function carregarComentarios(postId) {
    const list = document.getElementById(`tl-comments-list-${postId}`)
    list.innerHTML = `<div style="font-size:11px;color:var(--txt2)">Carregando...</div>`

    const { data, error } = await sb.rpc('get_comentarios_post', { p_post_id: postId })

    if (error || !data?.length) {
      list.innerHTML = `<div style="font-size:12px;color:var(--txt2);padding:4px 0">Nenhum comentário ainda.</div>`
      return
    }

    list.innerHTML = data.map(c => `
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <div style="width:26px;height:26px;border-radius:50%;background:rgba(31,56,31,.08);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--verde);flex-shrink:0">${(c.autor_nome || '?')[0].toUpperCase()}</div>
        <div style="flex:1;background:rgba(31,56,31,.03);border-radius:6px;padding:7px 10px">
          <div style="font-size:11px;font-weight:600;color:var(--verde)">${escapeHtml(c.autor_nome)}</div>
          <div style="font-size:12px;color:var(--txt);margin-top:2px;line-height:1.5">${escapeHtml(c.conteudo)}</div>
          <div style="font-size:10px;color:var(--txt2);margin-top:3px">${formatarData(c.criado_em)}</div>
        </div>
      </div>
    `).join('')
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

    // atualiza contador no botão
    const { count } = await sb.from('timeline_comentarios')
      .select('id', { count: 'exact', head: true }).eq('post_id', postId)
    const btn = document.querySelector(`.tl-btn-comentar[data-post="${postId}"]`)
    if (btn) btn.innerHTML = `💬 ${count ?? 0}`

    toast('Comentário enviado 💬')
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
    const texto = textoEl.value.trim()
    const midia = midiaEl.value.trim()

    if (!texto && !midia) { toast('Escreva algo ou adicione um link'); return }

    const btn = document.getElementById('btn-tl-postar')
    btn.disabled = true
    btn.textContent = 'Publicando...'

    const tipo = midia ? detectarTipoMidia(midia) : null

    const { error } = await sb.rpc('criar_post_timeline', {
      p_conteudo: texto || null,
      p_midia_url: midia || null,
      p_midia_tipo: tipo,
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

  function formatarData(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const min = Math.floor((Date.now() - d.getTime()) / 60000)
    if (min < 1) return 'agora mesmo'
    if (min < 60) return `há ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `há ${h}h`
    const dias = Math.floor(h / 24)
    if (dias < 7) return `há ${dias} dia${dias > 1 ? 's' : ''}`
    return d.toLocaleDateString('pt-BR')
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }
}

function renderComposeBox(perfil, isAdmin, isProf) {
  const fotoHtml = perfil.foto_url
    ? `<img src="${perfil.foto_url}" style="width:36px;height:36px;border-radius:50%;object-fit:cover">`
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
      <input id="tl-compose-midia" type="url" placeholder="Link de imagem (Imgur), vídeo (YouTube) ou outro URL..."
        style="width:100%;margin-top:10px;border:1px solid var(--borda);border-radius:6px;padding:8px 10px;font-size:12px;font-family:'DM Sans',sans-serif">
      ${noticeHtml}
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
        <button id="btn-tl-cancelar" style="padding:7px 16px;background:#fff;border:1px solid var(--borda);border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--txt2);cursor:pointer">Cancelar</button>
        <button id="btn-tl-postar" style="padding:7px 18px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500">Publicar</button>
      </div>
    </div>
  `
}
