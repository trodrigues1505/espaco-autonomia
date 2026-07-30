/**
 * src/pages/aluno/grantha.js
 * Grantha Mandir — visão de leitura do aluno, com opção de ouvir (TTS
 * via Web Speech API do navegador — sem hospedagem de áudio nem custo).
 */

import { uiAnimar } from '../../modules/ui.js'
import { aplicarVocabulario } from '../../modules/vocabulario.js'

const CATEGORIAS_LABEL = {
  yoga_classico: 'Yoga Clássico', upanishads: 'Upaniṣads', vedas: 'Vedas',
  hatha_yoga: 'Hatha Yoga', outro: 'Outro',
}

function _esc(str) { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

function _falar(texto) {
  if (!('speechSynthesis' in window)) { alert('Seu navegador não suporta leitura em voz alta.'); return }
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(texto)
  utter.lang = 'pt-BR'
  utter.rate = 0.95
  window.speechSynthesis.speak(utter)
}

function _pararFala() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

export async function renderGranthaAluno(container, page) {
  const sb = window._sb
  const granthaSel = window._granthaSelId || null

  if (!granthaSel) {
    await _renderLista(container, sb)
  } else {
    await _renderLeitura(container, sb, granthaSel)
  }
}

async function _renderLista(container, sb) {
  const { data: granthas, error } = await sb.from('grantha_mandir').select('*').order('titulo')
  if (error) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Grantha Mandir</div></div>
      <div class="content"><p style="color:#c0392b;font-size:13px">Erro: ${error.message}</p></div>`
    return
  }

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Grantha Mandir</div>
    </div>
    <div class="content">
      <div style="background:rgba(31,56,31,.04);border:1px solid rgba(31,56,31,.12);border-radius:6px;padding:9px 13px;font-size:12px;color:var(--verde);margin-bottom:16px">
        "O templo dos textos" — biblioteca de textos clássicos e artigos, em sânscrito e tradução, sem comentários.
      </div>
      ${(granthas||[]).length === 0
        ? `<div style="text-align:center;padding:48px 24px">
             <div style="font-size:40px;margin-bottom:12px">📚</div>
             <div style="font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--verde);margin-bottom:8px">Em breve</div>
             <div style="font-size:13px;color:var(--txt2)">A biblioteca chegará em breve.</div>
           </div>`
        : `<div style="display:flex;flex-direction:column;gap:10px">
            ${granthas.map(g => `
              <div onclick="window._granthaSelId='${g.id}';navigate('grantha-aluno')"
                style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;cursor:pointer;display:flex;gap:14px;align-items:center">
                ${g.capa_url ? `<img src="${g.capa_url}" referrerpolicy="no-referrer" style="width:56px;height:72px;object-fit:cover;border-radius:4px;flex-shrink:0">` : `<div style="width:56px;height:72px;background:var(--verde);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px">📖</div>`}
                <div style="flex:1;min-width:0">
                  <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--verde)">${g.titulo}</div>
                  <div style="font-size:11px;color:var(--txt2);margin-top:2px">${g.autor ? g.autor+' · ' : ''}${CATEGORIAS_LABEL[g.categoria] || g.categoria || ''}${g.periodo ? ' · '+g.periodo : ''}</div>
                  ${g.descricao ? `<div style="font-size:12px;color:var(--txt);margin-top:6px;line-height:1.5">${g.descricao}</div>` : ''}
                  <div style="font-size:10px;color:var(--txt2);margin-top:6px;background:rgba(31,56,31,.06);display:inline-block;padding:2px 8px;border-radius:20px">${g.tipo === 'obra_classica' ? 'Obra clássica' : 'Artigo'}</div>
                </div>
              </div>`).join('')}
          </div>`
      }
    </div>
  `
  uiAnimar(container)
  await aplicarVocabulario(container)
}

async function _renderLeitura(container, sb, granthaId) {
  const { data: g, error } = await sb.from('grantha_mandir').select('*').eq('id', granthaId).single()
  if (error || !g) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Grantha Mandir</div></div>
      <div class="content"><p style="color:#c0392b;font-size:13px">Obra não encontrada.</p></div>`
    return
  }

  if (g.tipo === 'artigo') {
    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-t">Grantha Mandir</div>
        <button onclick="window._granthaSelId=null;navigate('grantha-aluno')"
          style="padding:5px 12px;background:#fff;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer;color:var(--txt2)">
          ← Voltar
        </button>
      </div>
      <div class="content">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px">
          <div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde)">${g.titulo}</div>
            <div style="font-size:12px;color:var(--txt2);margin-top:3px">${g.autor ? g.autor+' · ' : ''}${CATEGORIAS_LABEL[g.categoria] || ''}</div>
          </div>
          <button id="btn-ouvir-artigo" style="padding:8px 16px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:6px;white-space:nowrap">
            🔊 Ouvir
          </button>
        </div>
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:20px;font-size:14px;color:var(--txt);line-height:1.9;white-space:pre-line">${_esc(g.conteudo || '')}</div>
      </div>
    `
    uiAnimar(container)
    await aplicarVocabulario(container)

    let falando = false
    document.getElementById('btn-ouvir-artigo').addEventListener('click', function() {
      if (falando) {
        _pararFala(); falando = false; this.innerHTML = '🔊 Ouvir'
      } else {
        _falar(g.conteudo || ''); falando = true; this.innerHTML = '⏸ Parar'
        const utterCheck = setInterval(() => {
          if (!window.speechSynthesis.speaking) { falando = false; this.innerHTML = '🔊 Ouvir'; clearInterval(utterCheck) }
        }, 400)
      }
    })
    return
  }

  // Obra clássica — versos agrupados por capítulo
  const { data: versos } = await sb.from('grantha_versos').select('*').eq('grantha_id', granthaId).order('ordem', { ascending: true })
  const capitulos = [...new Map((versos||[]).map(v => [v.capitulo_ordem, v.capitulo])).entries()].sort((a,b) => a[0]-b[0])
  const capAtual = window._granthaCapituloOrdem || capitulos[0]?.[0]
  const versosCapitulo = (versos||[]).filter(v => v.capitulo_ordem === capAtual)

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Grantha Mandir</div>
      <button onclick="window._granthaSelId=null;navigate('grantha-aluno')"
        style="padding:5px 12px;background:#fff;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer;color:var(--txt2)">
        ← Voltar
      </button>
    </div>
    <div class="content">
      <div style="margin-bottom:14px">
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde)">${g.titulo}</div>
        <div style="font-size:12px;color:var(--txt2);margin-top:3px">${g.autor ? g.autor+' · ' : ''}${g.periodo || ''}</div>
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
        ${capitulos.map(([ordem, nome]) => `
          <button onclick="window._granthaCapituloOrdem=${ordem};navigate('grantha-aluno')"
            style="padding:6px 14px;border-radius:20px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
                   border:1px solid ${ordem===capAtual?'var(--verde)':'var(--borda)'};background:${ordem===capAtual?'var(--verde)':'#fff'};color:${ordem===capAtual?'var(--bege)':'var(--txt2)'}">
            ${nome}
          </button>`).join('')}
      </div>

      <button id="btn-ouvir-capitulo" style="width:100%;margin-bottom:14px;padding:10px;background:var(--verde);color:var(--bege);border:none;border-radius:var(--r);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px">
        🔊 Ouvir este capítulo
      </button>

      <div id="versos-leitura-container">
        ${versosCapitulo.map(v => `
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:10px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);margin-bottom:8px">${v.capitulo} · ${v.numero}${v.numero_fim?'–'+v.numero_fim:''}</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:500;color:var(--verde);line-height:1.5">${v.texto_devanagari}</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:14px;font-style:italic;color:var(--txt2);margin-top:4px">${v.transliteracao}</div>
            <div style="font-size:13px;color:var(--txt);margin-top:8px;line-height:1.6">${v.traducao}</div>
          </div>`).join('')}
      </div>
    </div>
  `
  uiAnimar(container)
  await aplicarVocabulario(container)

  let falandoCap = false
  document.getElementById('btn-ouvir-capitulo').addEventListener('click', function() {
    if (falandoCap) {
      _pararFala(); falandoCap = false; this.innerHTML = '🔊 Ouvir este capítulo'
    } else {
      const textoCompleto = versosCapitulo.map(v => `${v.numero}. ${v.traducao}`).join('. ')
      _falar(textoCompleto); falandoCap = true; this.innerHTML = '⏸ Parar'
      const check = setInterval(() => {
        if (!window.speechSynthesis.speaking) { falandoCap = false; this.innerHTML = '🔊 Ouvir este capítulo'; clearInterval(check) }
      }, 400)
    }
  })
}
