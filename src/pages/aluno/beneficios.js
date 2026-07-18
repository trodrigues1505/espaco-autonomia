/**
 * src/pages/aluno/beneficios.js
 * Dharma Phala — detalhe de um benefício do plano.
 */

import { uiAnimar } from '../../modules/ui.js'
import { BENEFICIO_INTRO } from '../../modules/navigation.js'

// Chave localStorage para controlar quais intros já foram vistas
const _introVista = campo => `ea_intro_${campo}_${window._perfil?.id || 'x'}`

const SANGHA_LINKS = {
  brahma:       'https://chat.whatsapp.com/BWIMnUs5ijOAZmoBCEt9su',
  shiva_1x:     'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
  shiva_2x:     'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
  vishnu_2x:    'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
  vishnu_livre: 'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
  visitante:    'https://chat.whatsapp.com/FyU5bisgUG1HB2rVUx4Ur2',
}

const ESTUDIO_WA = '5511444901620'

// Planos com acesso à Aula 2 (restrita) do Āsana Mārga.
const PLANOS_AULA2_ASANA = ['shiva_1x', 'shiva_2x', 'vishnu_2x', 'vishnu_livre']

const PLANOS_COM_BENEFICIO = {
  sangha:         ['brahma','shiva_1x','shiva_2x','vishnu_2x','vishnu_livre'],
  kala_sadhya:    ['brahma','shiva_1x','shiva_2x','vishnu_2x','vishnu_livre'],
  asana_marga:    ['brahma','shiva_1x','shiva_2x','vishnu_2x','vishnu_livre'],
  yoga_adhyayana: ['shiva_1x','shiva_2x','vishnu_2x','vishnu_livre'],
  jnana_marga:    ['shiva_1x','shiva_2x','vishnu_2x','vishnu_livre'],
  sadhana_purna:  ['vishnu_2x','vishnu_livre'],
  atma_vijnana:   ['vishnu_2x','vishnu_livre'],
  shruti:         ['vishnu_2x','vishnu_livre'],
  naada_mandir:   ['vishnu_2x','vishnu_livre'],
}

const BENEFICIOS_VISITANTE = ['sangha', 'asana_marga']

const PLANO_LABELS = {
  brahma: 'Brahma', shiva_1x: 'Shiva 1×', shiva_2x: 'Shiva 2×',
  vishnu_2x: 'Vishnu 2×', vishnu_livre: 'Vishnu Livre',
}

const SLUG_PARA_CAMPO = {
  'sangha': 'sangha', 'kala-sadhya': 'kala_sadhya', 'asana-marga': 'asana_marga',
  'yoga-adhyayana': 'yoga_adhyayana', 'jnana-marga': 'jnana_marga',
  'sadhana-purna': 'sadhana_purna', 'atma-vijnana': 'atma_vijnana',
  'shruti': 'shruti', 'naada-mandir': 'naada_mandir',
}

const BENEFICIOS = {
  sangha: {
    nome: 'Sangha', subtitulo: 'Comunidade WhatsApp', icone: '🌸',
    descricao: `O Sangha é mais do que um grupo — é o coração pulsante da nossa comunidade.
Aqui você encontra avisos importantes do estúdio, trocas entre praticantes, reflexões sobre a prática e o suporte de quem caminha junto.
No Yoga, a Sangha (comunidade) é um dos três pilares fundamentais ao lado do Dharma e do Buddha.
Fazer parte deste grupo é dar um passo além da aula: é pertencer.`,
    acaoAtivo(t) {
      const link = SANGHA_LINKS[t] || SANGHA_LINKS[window._perfil?.tipo === 'visitante' ? 'visitante' : t]
      if (!link) return ''
      return `<a href="${link}" target="_blank" rel="noopener"
        style="display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:11px 22px;
               background:#25d366;color:#fff;border-radius:8px;text-decoration:none;
               font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif">
        <i class="ti ti-brand-whatsapp"></i> Entrar no grupo Sangha
      </a>`
    },
  },
  kala_sadhya: {
    nome: 'Kāla Sādhyā', subtitulo: 'Agenda Flex', icone: '🗓',
    descricao: `Kāla Sādhyā significa, em sânscrito, "o tempo como prática" — e é exatamente isso que este benefício representa.
Com a Agenda Flex você tem autonomia para moldar o yoga ao seu ritmo de vida, não o contrário.
Precisa faltar a uma aula? Cancele com antecedência e recupere em outra turma disponível na grade, sem custo adicional.
A flexibilidade não é um desvio do caminho — ela é o caminho.`,
    acaoAtivo() {
      return `<button onclick="navigate('aluno-grade')"
        style="display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:11px 22px;
               background:var(--verde);color:var(--bege);border:none;border-radius:8px;
               font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif">
        <i class="ti ti-calendar"></i> Ver grade de aulas
      </button>`
    },
  },
  asana_marga:    { nome: 'Āsana Mārga',   subtitulo: 'App de Prática',         icone: '🧘', descricao: `Āsana Mārga — "o caminho das posturas" — leva a sua prática para onde você estiver.\nCom este benefício você acessa um aplicativo completo de prática guiada: sequências de āsanas, exercícios de prāṇāyāma e meditações conduzidas.\nO tapete pode ser em qualquer lugar — e o caminho também.`, acaoAtivo() { return '' } },
  yoga_adhyayana: { nome: 'Yoga Adhyayana', subtitulo: 'Estudo Teórico',         icone: '📖', descricao: null, acaoAtivo() { return '' } },
  jnana_marga:    { nome: 'Jñāna Mārga',   subtitulo: 'Estudo dos Yoga Sūtras',  icone: '📜', descricao: `Jñāna Mārga — "o caminho do conhecimento" — é para quem quer ir fundo.\nA cada dia útil, um sutra dos Yoga Sūtras de Patañjali é apresentado com texto original, tradução e comentário.\nA leitura contemplativa é, ela mesma, uma forma de meditação.`, acaoAtivo() { return '' } },
  sadhana_purna:  { nome: 'Sādhanā Pūrṇā', subtitulo: 'Avaliação de Progresso', icone: '🌿', descricao: `Sādhanā Pūrṇā — "prática plena" — é o olhar atento sobre a sua jornada.\nPeriodicamente você terá uma conversa com o professor para mapear sua evolução.\nO progresso no Yoga não se mede em meses, mas em camadas de consciência.`, acaoAtivo() { return '' } },
  atma_vijnana:   { nome: 'Ātma Vijñāna',  subtitulo: 'Anamnese Personalizada', icone: '🔍', descricao: `Ātma Vijñāna — "conhecimento do ser" — começa antes da primeira āsana.\nEste benefício garante uma conversa inicial aprofundada com o professor sobre histórico, objetivos e limitações.\nPorque a prática mais poderosa é aquela que parte de onde você realmente está.`, acaoAtivo() { return '' } },
  shruti:         { nome: 'Śruti',          subtitulo: 'Áudio Diário',            icone: '🎵', descricao: `Śruti significa "o que foi ouvido" — e nas tradições do Yoga, o som é transmissão de sabedoria.\nDiariamente você recebe um áudio curto com mantras, prāṇāyāmas guiados ou reflexões.\nO som que você carrega dentro de você é o primeiro instrumento.`, acaoAtivo() { return '' } },
  naada_mandir:   {
    nome: 'Nāda Mandir', subtitulo: 'Biblioteca de Mantras', icone: '🕌',
    descricao: `Nāda Mandir — "o templo do som" — reúne os mantras entoados em nossas aulas, com pronúncia correta, significado e contexto de uso.

Asato Mā Sad Gamaya — Bṛhadāraṇyaka Upaniṣad — oração pela passagem da ignorância para a verdade
Pūrṇamadaḥ Pūrṇamidam — Īśa Upaniṣad — o todo não diminui quando dele se retira o todo
Hari Om — Mantra de dissolução e presença
Śrī Gurubhyo Namaḥ — Saudação ao guru e à linhagem
Āditya Hṛdayam — Vālmīki Rāmāyaṇa — hino ao sol ensinado por Agastya a Rāma
Om Gaṃ Gaṇapataye Namaḥ — Mantra a Gaṇeśa — remoção de obstáculos
Om Klīm Kālikāyai Namaḥ — Mantra a Kālī — transformação e dissolução do ego
Om Namaḥ Śivāya — Pañcākṣara — o mantra de cinco sílabas a Śiva`,
    acaoAtivo() { return '' },
  },
}

// ── Lightbox ──────────────────────────────────────────────────
function _abrirLightbox(src, alt) {
  document.getElementById('_ea-lightbox')?.remove()
  const lb = document.createElement('div')
  lb.id = '_ea-lightbox'
  lb.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:500;
    display:flex;align-items:center;justify-content:center;padding:20px;cursor:zoom-out`
  lb.innerHTML = `
    <img src="${src}" alt="${alt}" referrerpolicy="no-referrer"
      style="max-width:100%;max-height:90vh;border-radius:8px;object-fit:contain;
             box-shadow:0 20px 60px rgba(0,0,0,.5)">
    <button onclick="document.getElementById('_ea-lightbox').remove()"
      style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,.15);
             border:none;border-radius:50%;width:36px;height:36px;color:#fff;
             font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;
             line-height:1">×</button>`
  lb.addEventListener('click', e => { if (e.target === lb) lb.remove() })
  document.body.appendChild(lb)
}
window._abrirLightbox = _abrirLightbox

// Rótulo de número de sutra: mostra intervalo (ex: "10–11") quando a linha
// cobre mais de um sutra (numero_sutra_fim preenchido), senão mostra o número único.
// (Mesma função existe em jnana.js, no admin — mantidas em sincronia de propósito.)
function _labelNumeroSutra(s) {
  return s.numero_sutra_fim ? `${s.numero_sutra}–${s.numero_sutra_fim}` : `${s.numero_sutra}`
}

// ── Botão salvar PDF ──────────────────────────────────────────
function _btnSalvar(onclick) {
  return `
    <button onclick="${onclick}"
      style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;
             background:#fff;color:var(--verde);border:1px solid var(--borda);
             border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
             font-weight:500">
      <i class="ti ti-download"></i> Salvar PDF
    </button>`
}

// ── Impressão ─────────────────────────────────────────────────
function _imprimirHTML(titulo, html) {
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
    <meta charset="UTF-8">
    <title>${titulo} — Espaço Autonomia</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
      body { font-family: 'DM Sans', sans-serif; font-size: 11px; color: #1F381F;
             background: #fff; padding: 20px 28px; max-width: 700px; margin: 0 auto }
      h1 { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500;
           color: #1F381F; margin-bottom: 4px }
      h2 { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 500;
           color: #1F381F; margin: 10px 0 5px; border-bottom: 1px solid #d4c89e; padding-bottom: 3px }
      p  { line-height: 1.6; color: #444; margin-bottom: 6px; font-size: 11px }
      .meta { font-size: 10px; color: #7a7a6a; margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap }
      .meta span { background: #f0ede4; padding: 2px 7px; border-radius: 20px }
      .secao { margin-bottom: 8px; padding: 8px 12px; background: #fafaf7;
               border-left: 3px solid #1F381F; border-radius: 0 6px 6px 0 }
      .item { display: flex; gap: 8px; padding: 3px 0;
              border-bottom: 1px solid #e8e4d8; font-size: 11px; line-height: 1.4 }
      .item:last-child { border-bottom: none }
      .item-termo { font-weight: 500; min-width: 110px; flex-shrink: 0; color: #1F381F }
      .item-desc  { color: #555 }
      .citacao { border-left: 3px solid #e8bc4f; background: #fdf8ec;
                 padding: 8px 12px; border-radius: 0 8px 8px 0; margin: 10px 0;
                 font-family: 'Cormorant Garamond', serif; font-size: 13px;
                 font-style: italic; color: #1F381F; line-height: 1.5 }
      .reflexao { background: #1F381F; color: #f2ecce; padding: 12px 16px;
                  border-radius: 8px; margin-top: 14px; font-style: italic;
                  font-family: 'Cormorant Garamond', serif; font-size: 13px; line-height: 1.6 }
      .reflexao-label { font-size: 9px; text-transform: uppercase; letter-spacing: .8px;
                        color: rgba(242,236,206,.55); margin-bottom: 4px; font-style: normal;
                        font-family: 'DM Sans', sans-serif }
      .rodape { margin-top: 16px; padding-top: 8px; border-top: 1px solid #d4c89e;
                font-size: 9px; color: #aaa; text-align: center }
      .tummee-link { background: #1F381F; color: #f2ecce; padding: 8px 12px;
                     border-radius: 6px; margin: 8px 0; font-size: 11px; word-break: break-all }
      img.postura { width: 100%; max-height: 160px; object-fit: cover;
                    object-position: center top; border-radius: 6px; margin-bottom: 10px;
                    display: block; page-break-inside: avoid }
      @media print {
        @page { margin: 1cm; size: A4 }
        body { padding: 0; font-size: 10px }
        h1 { font-size: 20px }
        h2 { font-size: 13px; margin: 8px 0 4px }
        .secao { padding: 6px 10px; margin-bottom: 6px }
        .item { padding: 2px 0 }
        img.postura { max-height: 140px; page-break-inside: avoid; break-inside: avoid }
        h2, .secao, .item { page-break-inside: avoid; break-inside: avoid }
        html { zoom: 0.82 }
      }
    </style>
  </head><body>${html}
    <div class="rodape">Espaço Autonomia · Dharma Phala · gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
    <script>
      window.onload = function() {
        const imgs = document.querySelectorAll('img')
        if (!imgs.length) { window.print(); return }
        let loaded = 0
        imgs.forEach(img => {
          if (img.complete) { loaded++; if (loaded === imgs.length) window.print() }
          else {
            img.onload  = () => { loaded++; if (loaded === imgs.length) window.print() }
            img.onerror = () => { img.style.display='none'; loaded++; if (loaded === imgs.length) window.print() }
          }
        })
      }
    <\/script>
  </body></html>`)
  win.document.close()
}

// ── Banner de introdução (primeira visita) ────────────────────
function _renderIntro(campo, onContinuar) {
  const intro = BENEFICIO_INTRO[campo]
  if (!intro) { onContinuar(); return }
  const chave = _introVista(campo)
  if (localStorage.getItem(chave)) { onContinuar(); return }
  const div = document.createElement('div')
  div.id = '_ea-intro-banner'
  div.style.cssText = `
    background:var(--verde);border-radius:12px;padding:24px 20px;margin-bottom:16px;
    animation:_ya-slide-in .3s ease
  `
  div.innerHTML = `
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;
                color:rgba(242,236,206,.55);margin-bottom:8px;font-weight:500">O que é este benefício</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;
                color:var(--bege);margin-bottom:10px">${intro.titulo}</div>
    <p style="font-size:13px;color:rgba(242,236,206,.85);line-height:1.7;margin:0 0 18px">${intro.desc}</p>
    <button id="btn-intro-continuar"
      style="padding:10px 22px;background:var(--bege);color:var(--verde);border:none;
             border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;
             font-family:'DM Sans',sans-serif">
      Continuar →
    </button>
  `
  const content = document.querySelector('.content') || document.getElementById('main-area')
  if (content) content.insertBefore(div, content.firstChild)
  document.getElementById('btn-intro-continuar').addEventListener('click', () => {
    localStorage.setItem(chave, '1')
    div.style.opacity = '0'
    div.style.transition = 'opacity .2s'
    setTimeout(() => { div.remove(); onContinuar() }, 200)
  })
}

// ── Render principal ──────────────────────────────────────────
export async function renderAlunosBeneficios(container, page) {
  const slug  = page.replace('aluno-beneficio-', '')
  const campo = SLUG_PARA_CAMPO[slug]
  const b     = campo ? BENEFICIOS[campo] : null

  if (!b) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Dharma Phala</div></div>
      <div class="content"><p style="color:#c0392b;font-size:13px">Benefício não encontrado: ${slug}</p></div>`
    return
  }

  container.innerHTML = `
    <div class="topbar"><div class="topbar-t">Dharma Phala</div></div>
    <div class="content"><div class="loading-page"><div class="spin-big"></div></div></div>`

  const isVisitante = window._perfil?.tipo === 'visitante'
  let planoData = window._planoData
  const planoTipo = window._plano || null

  if (isVisitante) {
    planoData = null
  } else if (planoData === undefined) {
    if (planoTipo) {
      const { data } = await window._sb.from('planos')
        .select('sangha,kala_sadhya,asana_marga,yoga_adhyayana,jnana_marga,sadhana_purna,atma_vijnana,shruti,naada_mandir')
        .eq('tipo', planoTipo).maybeSingle()
      planoData = data || null
      window._planoData = planoData
    } else { planoData = null }
  }

  const temAcesso = isVisitante
    ? BENEFICIOS_VISITANTE.includes(campo)
    : !!(planoData && planoData[campo])

  const _renderConteudo = async () => {
    if (campo === 'yoga_adhyayana' && temAcesso) { await _renderYogaAdhyayana(container); return }
    if (campo === 'asana_marga'    && temAcesso) { await _renderAsanaMarga(container);    return }
    if (campo === 'jnana_marga'    && temAcesso) { await _renderJnanaMarga(container);    return }
    _renderBeneficioGenerico(container, b, campo, temAcesso, planoTipo, isVisitante)
  }

  if (temAcesso && ['yoga_adhyayana','asana_marga','jnana_marga'].includes(campo)) {
    const chave = _introVista(campo)
    if (!localStorage.getItem(chave)) {
      container.querySelector('.content').innerHTML = ''
      _injetarAnimacao()
      const intro = BENEFICIO_INTRO[campo]
      const div = document.createElement('div')
      div.style.cssText = 'padding:0'
      div.innerHTML = `
        <div style="background:var(--verde);border-radius:12px;padding:24px 20px;
                    animation:_ya-slide-in .3s ease">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;
                      color:rgba(242,236,206,.55);margin-bottom:8px;font-weight:500">O que é este benefício</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;
                      color:var(--bege);margin-bottom:10px">${intro.titulo}</div>
          <p style="font-size:13px;color:rgba(242,236,206,.85);line-height:1.7;margin:0 0 18px">${intro.desc}</p>
          <button id="btn-intro-ok"
            style="padding:10px 22px;background:var(--bege);color:var(--verde);border:none;
                   border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;
                   font-family:'DM Sans',sans-serif">
            Continuar →
          </button>
        </div>`
      container.querySelector('.content').appendChild(div)
      document.getElementById('btn-intro-ok').addEventListener('click', () => {
        localStorage.setItem(chave, '1')
        container.querySelector('.content').innerHTML = '<div class="loading-page"><div class="spin-big"></div></div>'
        _renderConteudo()
      })
      return
    }
  }

  await _renderConteudo()
}

// ── Stepper ───────────────────────────────────────────────────
function _stepper(secoes, prefixo) {
  let secaoAtiva = 0
  function renderStepper() {
    return secoes.map((s, idx) => {
      const aberta  = idx === secaoAtiva
      const passada = idx < secaoAtiva
      const linha   = idx < secoes.length - 1
        ? `<div style="width:2px;min-height:12px;flex:1;background:${passada ? s.cor : 'rgba(212,200,158,.4)'};margin:2px auto;transition:background .3s"></div>`
        : ''
      return `
        <div style="display:flex;gap:12px">
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:32px">
            <button onclick="window._step_${prefixo}(${idx})"
              style="width:32px;height:32px;border-radius:50%;border:none;cursor:pointer;
                     display:flex;align-items:center;justify-content:center;flex-shrink:0;
                     background:${aberta ? s.cor : passada ? s.cor : 'rgba(212,200,158,.4)'};
                     transition:background .3s;padding:0">
              <i class="ti ${s.icone}" style="font-size:14px;color:${aberta||passada?'#fff':'var(--txt2)'}"></i>
            </button>
            ${linha}
          </div>
          <div style="flex:1">
            <div onclick="window._step_${prefixo}(${idx})" style="cursor:pointer;padding:5px 0 ${aberta?'12px':'16px'}">
              <div style="font-size:13px;font-weight:500;color:${aberta?s.cor:passada?'var(--txt2)':'var(--txt)'};transition:color .3s">${s.titulo}</div>
              ${!aberta ? `<div style="font-size:11px;color:var(--txt2);margin-top:2px">${s.itens.length} itens</div>` : ''}
            </div>
            ${aberta ? `
              <div style="animation:_ya-slide-in .25s ease">
                ${s.itens.map((item, i) => `
                  <div style="display:flex;gap:10px;padding:9px 0;
                              border-bottom:${i < s.itens.length-1 ? '1px solid rgba(212,200,158,.3)' : 'none'}">
                    <div style="width:6px;height:6px;border-radius:50%;background:${s.cor};flex-shrink:0;margin-top:6px"></div>
                    <div style="font-size:13px;line-height:1.6;white-space:pre-line">
                      ${item.termo
                        ? `<span style="font-weight:500;color:var(--txt)">${item.termo}</span><span style="color:var(--txt2)">: ${item.desc}</span>`
                        : `<span style="color:var(--txt)">${item.desc}</span>`}
                    </div>
                  </div>`).join('')}
                ${idx < secoes.length - 1
                  ? `<button onclick="window._step_${prefixo}(${idx+1})"
                       style="margin-top:14px;width:100%;padding:9px;background:${s.cor};color:#fff;
                              border:none;border-radius:7px;font-size:12px;font-weight:500;
                              cursor:pointer;font-family:'DM Sans',sans-serif">
                       Próximo: ${secoes[idx+1].titulo} →
                     </button>`
                  : `<div style="margin-top:14px;padding:12px;background:rgba(31,56,31,.06);
                                 border-radius:7px;text-align:center;font-size:12px;color:var(--txt2)">
                       ✓ Completo
                     </div>`
                }
              </div>` : ''}
          </div>
        </div>`
    }).join('')
  }
  window[`_step_${prefixo}`] = function(idx) {
    secaoAtiva = idx
    const el = document.getElementById(`stepper-${prefixo}`)
    if (el) el.innerHTML = renderStepper()
  }
  return { renderStepper, containerId: `stepper-${prefixo}` }
}

function _injetarAnimacao() {
  if (!document.getElementById('_ya-style')) {
    const s = document.createElement('style')
    s.id = '_ya-style'
    s.textContent = `@keyframes _ya-slide-in { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`
    document.head.appendChild(s)
  }
}

// Registro de acesso a benefício (item: dashboard de engajamento).
// Upsert com onConflict evita duplicar quando o aluno abre a mesma tela
// várias vezes no mesmo dia — conta como 1 acesso naquele dia.
// Silencioso em erro: isso não pode travar a experiência do aluno.
async function _registrarAcessoBeneficio(beneficio) {
  if (window._perfil?.tipo !== 'aluno') return
  try {
    await window._sb.from('beneficio_acessos').upsert(
      { aluno_id: window._perfil.id, beneficio, dia: new Date().toISOString().slice(0, 10) },
      { onConflict: 'aluno_id,beneficio,dia', ignoreDuplicates: true }
    )
  } catch (e) { /* silencioso */ }
}

// ── Yoga Adhyayana — lido de adhyayana_asanas (Supabase) ───────
async function _renderYogaAdhyayana(container) {
  _registrarAcessoBeneficio('yoga_adhyayana')
  _injetarAnimacao()
  const sb   = window._sb
  const hoje = new Date().toISOString().slice(0, 10)
  const { data: linhas, error } = await sb
    .from('adhyayana_asanas')
    .select('*')
    .lte('publicada_em', hoje)
    .order('publicada_em', { ascending: false })
    .limit(1)
  if (error) {
    container.querySelector('.content').innerHTML = `<p style="color:#c0392b;font-size:13px">Erro: ${error.message}</p>`
    return
  }
  const aula = linhas?.[0]
  if (!aula) {
    container.querySelector('.content').innerHTML = `
      <div style="text-align:center;padding:48px 24px">
        <div style="font-size:40px;margin-bottom:12px">📖</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--verde);margin-bottom:8px">Em breve</div>
        <div style="font-size:13px;color:var(--txt2)">O estudo do Yoga Adhyayana chegará em breve.</div>
      </div>`
    return
  }

  const nivelCor = { 'Iniciante': '#2d7a2d', 'Intermediário': '#c8a020', 'Avançado': '#8a1a1a', 'Novato': '#2d7a2d' }[aula.nivel] || 'var(--verde)'
  const nivelBg  = { 'Iniciante': 'rgba(45,122,45,.1)', 'Intermediário': 'rgba(200,160,32,.1)', 'Avançado': 'rgba(138,26,26,.1)', 'Novato': 'rgba(45,122,45,.1)' }[aula.nivel] || 'rgba(31,56,31,.08)'

  // Monta as seções do stepper a partir dos campos de texto cadastrados no wizard admin.
  // Cada campo vira um item; quando um campo estiver vazio, ele simplesmente não aparece.
  const secoes = []
  if (aula.origem_simbolismo)
    secoes.push({ id:'origem', titulo:'Origem e simbolismo', icone:'ti-book', cor:'#BA7517',
      itens: [{ termo: null, desc: aula.origem_simbolismo }] })

  const corpoEnergetico = []
  if (aula.koshas)  corpoEnergetico.push({ termo:'Koshas',       desc: aula.koshas })
  if (aula.vayus)   corpoEnergetico.push({ termo:'Prāṇa Vāyus',  desc: aula.vayus })
  if (aula.chakras) corpoEnergetico.push({ termo:'Chakras',      desc: aula.chakras })
  if (corpoEnergetico.length)
    secoes.push({ id:'energetico', titulo:'Corpo energético', icone:'ti-sparkles', cor:'#639922', itens: corpoEnergetico })

  const ayurveda = []
  if (aula.doshas)  ayurveda.push({ termo:'Doshas',              desc: aula.doshas })
  if (aula.tattvas) ayurveda.push({ termo:'Elementos (Tattvas)', desc: aula.tattvas })
  if (ayurveda.length)
    secoes.push({ id:'ayurveda', titulo:'Ayurveda e elementos', icone:'ti-atom', cor:'#8e44ad', itens: ayurveda })

  const beneficios = []
  if (aula.beneficios_fisiologicos) beneficios.push({ termo:'Benefícios fisiológicos',    desc: aula.beneficios_fisiologicos })
  if (aula.beneficios_sutis)        beneficios.push({ termo:'Benefícios sutis',           desc: aula.beneficios_sutis })
  if (aula.observacoes_terapeuticas) beneficios.push({ termo:'Observações terapêuticas',  desc: aula.observacoes_terapeuticas })
  if (beneficios.length)
    secoes.push({ id:'beneficios', titulo:'Benefícios', icone:'ti-heart-filled', cor:'#c0392b', itens: beneficios })

  const { renderStepper, containerId } = _stepper(secoes, 'ya')

  const imgHtml = aula.imagem_url ? `
    <div style="position:relative;border-radius:12px;overflow:hidden;margin-bottom:16px;
                background:var(--verde);min-height:160px;cursor:zoom-in"
         onclick="_abrirLightbox('${aula.imagem_url}','${aula.nome}')" title="Clique para ampliar">
      <img src="${aula.imagem_url}" alt="${aula.nome}" referrerpolicy="no-referrer"
        style="width:100%;max-height:240px;object-fit:cover;object-position:center center;
               display:block;opacity:.9" onerror="this.parentElement.style.display='none'">
      <div style="position:absolute;bottom:0;left:0;right:0;padding:16px;
                  background:linear-gradient(to top,rgba(31,56,31,.92) 0%,transparent 100%)">
        <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;
                    color:var(--bege);line-height:1.2">${aula.nome}</div>
        ${aula.nome_alternativo ? `<div style="font-size:11px;color:rgba(242,236,206,.75);margin-top:3px;font-style:italic">${aula.nome_alternativo}</div>` : ''}
      </div>
      <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.4);
                  border-radius:20px;padding:3px 8px;font-size:10px;color:#fff;
                  display:flex;align-items:center;gap:4px">
        <i class="ti ti-zoom-in" style="font-size:12px"></i> ampliar
      </div>
    </div>` : ''

  const dataFmt = new Date(aula.publicada_em + 'T12:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })

  container.querySelector('.content').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:26px">📖</span>
        <div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde)">Yoga Adhyayana</div>
          <div style="font-size:12px;color:var(--txt2)">Conteúdo da semana</div>
        </div>
      </div>
      ${_btnSalvar('window._salvarYA()')}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
      <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${dataFmt}</span>
      ${aula.nivel ? `<span style="font-size:11px;background:${nivelBg};color:${nivelCor};padding:3px 10px;border-radius:20px;font-weight:500">${aula.nivel}</span>` : ''}
    </div>
    ${imgHtml}
    <div id="${containerId}" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:18px 16px;margin-bottom:16px">
      ${secoes.length ? renderStepper() : '<p style="font-size:13px;color:var(--txt2)">Ainda não há conteúdo detalhado cadastrado para este āsana.</p>'}
    </div>
    ${aula.fechamento ? `
    <div style="background:var(--verde);border-radius:12px;padding:20px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:rgba(242,236,206,.55);margin-bottom:8px;font-weight:500">Reflexão</div>
      <p style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--bege);line-height:1.7;margin:0;font-style:italic;white-space:pre-line">${aula.fechamento}</p>
    </div>` : ''}
  `
  window._salvarYA = function() {
    const secoesHtml = secoes.map(s => `
      <h2>${s.titulo}</h2>
      <div class="secao">
        ${s.itens.map(item => `
          <div class="item"><div class="item-termo">${item.termo || ''}</div><div class="item-desc">${item.desc}</div></div>`).join('')}
      </div>`).join('')
    const imgTag = aula.imagem_url ? `<img src="${aula.imagem_url}" alt="${aula.nome}" class="postura" referrerpolicy="no-referrer">` : ''
    _imprimirHTML(`Yoga Adhyayana — ${aula.nome}`, `
      <h1>${aula.nome}</h1>
      ${aula.nome_alternativo ? `<p style="font-family:'Cormorant Garamond',serif;font-size:14px;font-style:italic;color:#5a7a5a;margin-bottom:6px">${aula.nome_alternativo}</p>` : ''}
      <div class="meta"><span>${dataFmt}</span>${aula.nivel ? `<span>${aula.nivel}</span>` : ''}</div>
      ${imgTag}
      ${secoesHtml}
      ${aula.fechamento ? `<div class="reflexao"><div class="reflexao-label">Reflexão</div>${aula.fechamento}</div>` : ''}
    `)
  }
  uiAnimar(container)
}

// ── Āsana Mārga — lido de asana_praticas (Supabase), sem histórico ──

// Normalizações/traduções (mesma lógica duplicada em asana.js admin, de propósito)
const TIPOS_ASANA_LABELS = { 'Esticar': 'Alongamento' }
const GUNA_ADJETIVOS = { 'Sattva': 'equilibrantes', 'Rajas': 'energizantes', 'Tamas': 'relaxantes' }
const CHAKRA_CANONICOS = [
  { chave: 'Muladhara',   nome: 'Muladhara'   },
  { chave: 'Swadisthana', nome: 'Svadisthana' },
  { chave: 'Manipura',    nome: 'Manipura'    },
  { chave: 'Anahata',     nome: 'Anahata'     },
  { chave: 'Vishuddha',   nome: 'Vishuddha'   },
  { chave: 'Ajna',        nome: 'Ajna'        },
  { chave: 'Sahasrara',   nome: 'Sahasrara'   },
]
function _normalizarKosha(termo) { return (termo || '').replace(/\s*Kosha$/i, '').trim() }
function _normalizarChakra(termo) {
  const t = termo || ''
  const achado = CHAKRA_CANONICOS.find(c => t.toLowerCase().includes(c.chave.toLowerCase()))
  return achado ? achado.nome : t
}
function _traduzirTipoAsana(termo) { return TIPOS_ASANA_LABELS[termo] || termo }
function _acimaDe50(lista) { return (lista || []).filter(i => (i.percentual || 0) > 50) }
function _juntarComE(lista) {
  if (lista.length === 0) return ''
  if (lista.length === 1) return lista[0]
  return lista.slice(0, -1).join(', ') + ' e ' + lista[lista.length - 1]
}
function _gerarDescricaoAsana(aula) {
  const gunas = _acimaDe50(aula.gunas).map(g => GUNA_ADJETIVOS[g.termo] || g.termo.toLowerCase())
  const tipos = _acimaDe50(aula.tipos_yoga).map(t => _traduzirTipoAsana(t.termo).toLowerCase())
  const musculos = _acimaDe50(aula.musculos).map(m => m.termo.toLowerCase())
  let texto = gunas.length ? `Aula de posturas predominantemente ${_juntarComE(gunas)}` : 'Aula de posturas'
  if (tipos.length) texto += `, com foco principal em ${_juntarComE(tipos)}`
  if (musculos.length) texto += ` com ênfase em trabalho de ${_juntarComE(musculos)}`
  return texto + '.'
}
// Item 17: qualquer campo de texto preenchível pelo admin aceita links
function _linkify(texto) {
  if (!texto) return texto
  return String(texto).replace(/(https?:\/\/[^\s<]+)/g, url =>
    `<a href="${url}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">${url}</a>`)
}

function _blocoIntroducao(itens) {
  if (!itens || !itens.length) return ''
  return `
    <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:16px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);font-weight:500;margin-bottom:10px">Abertura da prática</div>
      ${itens.map((it,i) => `
        <div style="display:flex;gap:10px;padding:8px 0;border-bottom:${i<itens.length-1?'1px solid rgba(212,200,158,.3)':'none'}">
          <span style="font-weight:500;color:var(--txt);min-width:120px;flex-shrink:0;font-size:13px">${it.termo}</span>
          <span style="color:var(--txt2);font-size:13px;line-height:1.6">${_linkify(it.desc)}</span>
        </div>`).join('')}
    </div>`
}

// Seções depois do link (item 15/16): pranayama, mantra adicional, leitura energética, músculos, tipos —
// todas já filtradas para >50% e com termos traduzidos/normalizados.
function _secoesAsana(aula) {
  const secoes = []
  if ((aula.pranayama||[]).length)
    secoes.push({ id:'pranayama', titulo:'Prāṇāyāma', icone:'ti-wind', cor:'#378ADD',
      itens: aula.pranayama.map(i => ({ termo: i.termo, desc: _linkify(i.desc) })) })
  if ((aula.mantra||[]).length)
    secoes.push({ id:'mantra', titulo:'Mantra', icone:'ti-music', cor:'#BA7517',
      itens: aula.mantra.map(i => ({ termo: i.termo, desc: _linkify(i.desc) })) })

  const koshas   = _acimaDe50(aula.koshas).map(k => ({ ...k, termo: _normalizarKosha(k.termo) }))
  const chakras  = _acimaDe50(aula.chakras).map(k => ({ ...k, termo: _normalizarChakra(k.termo) }))
  const gunas    = _acimaDe50(aula.gunas)
  const energItens = []
  if (koshas.length)  energItens.push({ termo:'Koshas Principais',  desc: koshas.map(k=>`${k.termo} (${k.percentual}%)`).join(' · ') })
  if (chakras.length) energItens.push({ termo:'Chakras Principais', desc: chakras.map(k=>`${k.termo} (${k.percentual}%)`).join(' · ') })
  if (gunas.length)   energItens.push({ termo:'Gunas',   desc: gunas.map(k=>`${k.termo} (${k.percentual}%)`).join(' · ') })
  if (energItens.length) secoes.push({ id:'energetica', titulo:'Leitura Energética', icone:'ti-sparkles', cor:'#639922', itens: energItens })

  const musculos = _acimaDe50(aula.musculos)
  if (musculos.length)
    secoes.push({ id:'musculos', titulo:'Músculos Principais', icone:'ti-heart-filled', cor:'#c0392b',
      itens: musculos.map(m => ({ termo: m.termo, desc: `${m.percentual}%` })) })

  const tipos = _acimaDe50(aula.tipos_yoga).map(t => ({ ...t, termo: _traduzirTipoAsana(t.termo) }))
  if (tipos.length)
    secoes.push({ id:'tipos', titulo:'Tipos de Āsana', icone:'ti-yoga', cor:'#1D9E75',
      itens: tipos.map(t => ({ termo: t.termo, desc: `${t.percentual}%` })) })

  return secoes
}

// Detecção simples de URL de imagem (mesma lógica-base do timeline.js), usada para decidir
// se o link do Tummee deve renderizar como <img> com lightbox ou como <iframe> (página embutida).
function _ehImagemUrl(url) {
  const u = (url || '').split('#')[0].split('?')[0].toLowerCase()
  if (/\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(u)) return true
  if (/(^|\.)imgur\.com\//i.test(url)) return true
  if (/ibb\.co\//i.test(url)) return true
  if (/postimg\.cc\//i.test(url)) return true
  return false
}

function _blocoAulaPratica(aula, secoes, sufixo) {
  const { renderStepper, containerId } = _stepper(secoes, 'am' + sufixo)
  const badges = [
    aula.numero      ? `<span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">Aula ${aula.numero}</span>` : '',
    aula.data_aula   ? `<span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${new Date(aula.data_aula+'T12:00').toLocaleDateString('pt-BR')}</span>` : '',
    aula.modalidade  ? `<span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${aula.modalidade}</span>` : '',
    aula.duracao     ? `<span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${aula.duracao}</span>` : '',
  ].filter(Boolean).join('')

  const descricaoGerada = _gerarDescricaoAsana(aula)

  const linkEhImagem = aula.link_tummee && _ehImagemUrl(aula.link_tummee)

  const iframeHtml = aula.link_tummee ? (
    linkEhImagem ? `
    <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:16px">
      <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:4px">Sequência de Āsanas</div>
      <div style="font-size:12px;color:var(--txt2);margin-bottom:12px">Faça-os devagar, sem forçar — de 30s a 1min cada āsana. Clique na imagem para ampliar.</div>
      <div style="position:relative;border-radius:8px;overflow:hidden;cursor:zoom-in"
           onclick="_abrirLightbox('${aula.link_tummee}','Sequência de āsanas')" title="Clique para ampliar">
        <img src="${aula.link_tummee}" alt="Sequência de āsanas" referrerpolicy="no-referrer"
          style="width:100%;max-height:480px;object-fit:contain;display:block;background:#f7f5ee"
          onerror="this.parentElement.parentElement.style.display='none'">
        <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.4);
                    border-radius:20px;padding:3px 8px;font-size:10px;color:#fff;
                    display:flex;align-items:center;gap:4px;pointer-events:none">
          <i class="ti ti-zoom-in" style="font-size:12px"></i> ampliar
        </div>
      </div>
    </div>` : `
    <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:16px">
      <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:4px">Sequência de Āsanas</div>
      <div style="font-size:12px;color:var(--txt2);margin-bottom:12px">Faça-os devagar, sem forçar — de 30s a 1min cada āsana.</div>
      <button onclick="window._amToggleIframe${sufixo}()" id="btn-am-iframe${sufixo}"
        style="width:100%;padding:11px;background:var(--verde);color:var(--bege);border:none;
               border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;
               font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px">
        <i class="ti ti-eye"></i> Ver sequência completa
      </button>
      <div id="am-iframe-wrap${sufixo}" style="display:none;margin-top:12px;border-radius:8px;overflow:hidden;border:1px solid var(--borda)">
        <iframe src="${aula.link_tummee}"
          style="width:100%;height:600px;border:none;display:block" loading="lazy"
          title="Sequência de āsanas"></iframe>
      </div>
    </div>`
  ) : ''

  return `
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${badges}</div>
    <div style="border-left:3px solid var(--dourado);background:rgba(232,188,79,.07);
                border-radius:0 8px 8px 0;padding:13px 16px;margin-bottom:16px">
      <p style="font-size:14px;font-style:italic;color:var(--verde);line-height:1.6;margin:0;
                font-family:'Cormorant Garamond',serif">${descricaoGerada}</p>
    </div>
    ${_blocoIntroducao(aula.introducao)}
    ${iframeHtml}
    ${secoes.length ? `
      <div id="${containerId}" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:18px 16px">
        ${renderStepper()}
      </div>` : ''}
  `
}

function _bloqueadaAula2Html() {
  const msg = encodeURIComponent('Olá! Sou aluno(a) do Espaço Autonomia e gostaria de saber mais sobre os planos Shiva/Vishnu para desbloquear a segunda aula do Āsana Mārga.')
  return `
    <div style="background:rgba(232,188,79,.06);border:1px solid rgba(232,188,79,.25);border-radius:var(--r);padding:20px;text-align:center">
      <div style="font-size:28px;margin-bottom:8px">🔒</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:500;color:var(--verde);margin-bottom:6px">Segunda aula exclusiva</div>
      <p style="font-size:13px;color:var(--txt2);line-height:1.6;margin:0 0 14px">Disponível nos planos Shiva e Vishnu.</p>
      <a href="https://wa.me/${ESTUDIO_WA}?text=${msg}" target="_blank" rel="noopener"
        style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;
               background:var(--verde);color:var(--bege);border-radius:8px;text-decoration:none;
               font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif">
        <i class="ti ti-brand-whatsapp"></i> Saber mais sobre os planos
      </a>
    </div>`
}

function _emBreveAsanaHtml() {
  return `
    <div style="text-align:center;padding:32px 24px;background:#fff;border:1px solid var(--borda);border-radius:var(--r)">
      <div style="font-size:32px;margin-bottom:10px">🧘</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:17px;color:var(--verde);margin-bottom:6px">Em breve</div>
      <div style="font-size:13px;color:var(--txt2)">Esta aula ainda não foi cadastrada.</div>
    </div>`
}

async function _renderAsanaMarga(container) {
  _registrarAcessoBeneficio('asana_marga')
  _injetarAnimacao()
  const sb = window._sb
  const { data: linhas, error } = await sb.from('asana_praticas').select('*').order('slot', { ascending: true })
  if (error) {
    container.querySelector('.content').innerHTML = `<p style="color:#c0392b;font-size:13px">Erro: ${error.message}</p>`
    return
  }
  const aula1 = linhas?.find(l => l.slot === 1)
  const aula2 = linhas?.find(l => l.slot === 2)

  const planoAtual = window._plano || null
  const temAula2 = PLANOS_AULA2_ASANA.includes(planoAtual)

  const temConteudo1 = aula1 && aula1.modalidade
  const temConteudo2 = aula2 && aula2.modalidade
  const secoes1 = temConteudo1 ? _secoesAsana(aula1) : []
  const secoes2 = (temAula2 && temConteudo2) ? _secoesAsana(aula2) : []

  container.querySelector('.content').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:26px">🧘</span>
        <div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde)">Āsana Mārga</div>
          <div style="font-size:12px;color:var(--txt2)">Aulas práticas da semana</div>
        </div>
      </div>
      ${temConteudo1 ? _btnSalvar('window._salvarAM1()') : ''}
    </div>

    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);font-weight:500;margin-bottom:10px">Aula 1 · livre para todos os planos</div>
    ${temConteudo1 ? _blocoAulaPratica(aula1, secoes1, '1') : _emBreveAsanaHtml()}

    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);font-weight:500;margin:24px 0 10px">Aula 2 · Shiva e Vishnu</div>
    ${!temAula2 ? _bloqueadaAula2Html() : (temConteudo2 ? _blocoAulaPratica(aula2, secoes2, '2') : _emBreveAsanaHtml())}
  `

  if (temConteudo1) {
    window._amToggleIframe1 = function() {
      const wrap = document.getElementById('am-iframe-wrap1')
      const btn  = document.getElementById('btn-am-iframe1')
      if (!wrap || !btn) return
      const abrindo = wrap.style.display !== 'block'
      wrap.style.display = abrindo ? 'block' : 'none'
      btn.innerHTML = abrindo ? '<i class="ti ti-eye-off"></i> Fechar sequência' : '<i class="ti ti-eye"></i> Ver sequência completa'
      btn.style.background = abrindo ? 'rgba(31,56,31,.15)' : 'var(--verde)'
      btn.style.color      = abrindo ? 'var(--verde)' : 'var(--bege)'
      btn.style.border     = abrindo ? '1px solid var(--borda)' : 'none'
    }
  }
  if (temAula2 && temConteudo2) {
    window._amToggleIframe2 = function() {
      const wrap = document.getElementById('am-iframe-wrap2')
      const btn  = document.getElementById('btn-am-iframe2')
      if (!wrap || !btn) return
      const abrindo = wrap.style.display !== 'block'
      wrap.style.display = abrindo ? 'block' : 'none'
      btn.innerHTML = abrindo ? '<i class="ti ti-eye-off"></i> Fechar sequência' : '<i class="ti ti-eye"></i> Ver sequência completa'
      btn.style.background = abrindo ? 'rgba(31,56,31,.15)' : 'var(--verde)'
      btn.style.color      = abrindo ? 'var(--verde)' : 'var(--bege)'
      btn.style.border     = abrindo ? '1px solid var(--borda)' : 'none'
    }
  }

  function _salvarAula(aula, secoes, titulo) {
    const introHtml = (aula.introducao||[]).length ? `
      <h2>Abertura da prática</h2>
      <div class="secao">
        ${aula.introducao.map(item => `<div class="item"><div class="item-termo">${item.termo}</div><div class="item-desc">${item.desc}</div></div>`).join('')}
      </div>` : ''
    const estruturaHtml = secoes.map(s => `
      <h2>${s.titulo}</h2>
      <div class="secao">
        ${s.itens.map(item => `<div class="item"><div class="item-termo">${item.termo}</div><div class="item-desc">${item.desc}</div></div>`).join('')}
      </div>`).join('')
    _imprimirHTML(`Āsana Mārga — ${titulo}`, `
      <h1>Āsana Mārga — ${titulo}</h1>
      <div class="meta">${aula.data_aula ? `<span>${new Date(aula.data_aula+'T12:00').toLocaleDateString('pt-BR')}</span>` : ''}<span>${aula.modalidade||''}</span><span>${aula.duracao||''}</span></div>
      <div class="citacao">${_gerarDescricaoAsana(aula)}</div>
      ${introHtml}
      ${aula.link_tummee ? `<h2>Sequência de Āsanas</h2><div class="tummee-link">Acesse a sequência completa em: <strong>${aula.link_tummee}</strong></div>` : ''}
      ${estruturaHtml}
    `)
  }
  if (temConteudo1) window._salvarAM1 = function() { _salvarAula(aula1, secoes1, `Aula ${aula1.numero || ''} (livre)`) }
  if (temAula2 && temConteudo2) window._salvarAM2 = function() { _salvarAula(aula2, secoes2, `Aula ${aula2.numero || ''} (Shiva/Vishnu)`) }

  uiAnimar(container)
}

// ── Jñāna Mārga — Estudo dos Yoga Sutras ───────────────────────
async function _renderJnanaMarga(container) {
  _registrarAcessoBeneficio('jnana_marga')
  _injetarAnimacao()
  const sb   = window._sb
  const hoje = new Date().toISOString().slice(0, 10)
  const { data: sutras, error } = await sb
    .from('jnana_sutras').select('*')
    .lte('publicada_em', hoje)
    .order('publicada_em', { ascending: false })
  if (error) {
    container.querySelector('.content').innerHTML = `<p style="color:#c0392b;font-size:13px">Erro: ${error.message}</p>`
    return
  }
  if (!sutras || sutras.length === 0) {
    container.querySelector('.content').innerHTML = `
      <div style="text-align:center;padding:48px 24px">
        <div style="font-size:40px;margin-bottom:12px">📜</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--verde);margin-bottom:8px">Em breve</div>
        <div style="font-size:13px;color:var(--txt2)">O estudo dos Yoga Sūtras chegará em breve.</div>
      </div>`
    return
  }
  const sutra_hoje = sutras.find(s => s.publicada_em === hoje) || sutras[0]
  let sutraSel = sutra_hoje

  // Lista ordenada da mais antiga para a mais recente — usada na navegação anterior/próximo
  // ("anterior" = sutra publicado antes, "próximo" = depois).
  const sutrasOrdemCrescente = [...sutras].sort((a, b) => a.publicada_em < b.publicada_em ? -1 : 1)
  function _jnTemAnterior(s) {
    const idx = sutrasOrdemCrescente.findIndex(x => x.id === s.id)
    return idx > 0
  }
  function _jnTemProximo(s) {
    const idx = sutrasOrdemCrescente.findIndex(x => x.id === s.id)
    return idx >= 0 && idx < sutrasOrdemCrescente.length - 1
  }

  function _salvarSutra(s) {
    const dataFmt = new Date(s.publicada_em + 'T12:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })
    const comentarioHtml = (s.comentario||'').split(/\n\s*\n/).map(p => `<p>${p}</p>`).join('')
    _imprimirHTML(`Jñāna Mārga — ${s.capitulo} ${_labelNumeroSutra(s)}`, `
      <h1>${s.capitulo} — Sutra ${_labelNumeroSutra(s)}</h1>
      <p style="font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;color:#5a7a5a;margin-bottom:4px">${s.transliteracao}</p>
      <div class="meta"><span>Jñāna Mārga · Yoga Sūtras</span><span>${dataFmt}</span></div>
      ${s.contexto_capitulo ? `<div class="citacao">${s.contexto_capitulo}</div>` : ''}
      <h2>Texto</h2>
      <div class="secao">
        <p style="font-family:'Cormorant Garamond',serif;font-size:14px">${s.texto_devanagari}</p>
        <p style="font-style:italic">${s.transliteracao}</p>
        <p>${s.traducao}</p>
      </div>
      ${s.comentario ? `<h2>Comentário</h2><div class="secao">${comentarioHtml}</div>` : ''}
      ${s.pratica ? `<h2>Na prática</h2><div class="secao"><p>${s.pratica}</p></div>` : ''}
    `)
  }

  function renderSutra(s) {
    const isHoje  = s.publicada_em === hoje
    const dataFmt = new Date(s.publicada_em + 'T12:00').toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })
    const comentarioHtml = (s.comentario||'').split(/\n\s*\n/).map(p => `<p style="margin:0 0 12px;line-height:1.8">${p}</p>`).join('')
    return `
      <div style="background:var(--verde);border-radius:12px;padding:20px;margin-bottom:16px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:rgba(242,236,206,.55);margin-bottom:8px">
          ${isHoje ? '✦ Sutra de hoje' : dataFmt} · ${s.capitulo} ${_labelNumeroSutra(s)}
        </div>
        ${s.contexto_capitulo ? `<p style="font-size:12px;color:rgba(242,236,206,.75);line-height:1.6;margin-bottom:14px;font-style:italic">${s.contexto_capitulo}</p>` : ''}
        <div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:var(--bege);line-height:1.3">${s.texto_devanagari}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-style:italic;color:rgba(242,236,206,.8);margin-top:6px">${s.transliteracao}</div>
        <div style="font-size:14px;color:rgba(242,236,206,.92);margin-top:10px">${s.traducao}</div>
      </div>
      ${s.comentario ? `
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:18px;margin-bottom:16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;margin-bottom:10px">Comentário</div>
          <div style="font-size:13px;color:var(--txt)">${comentarioHtml}</div>
        </div>` : ''}
      ${s.pratica ? `
        <div style="background:rgba(232,188,79,.07);border-left:3px solid var(--dourado);border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:#7a5a10;font-weight:500;margin-bottom:6px">Na prática</div>
          <p style="font-size:13px;color:var(--txt);line-height:1.7;margin:0">${s.pratica}</p>
        </div>` : ''}
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <button onclick="window._jnAnterior()" ${_jnTemAnterior(s) ? '' : 'disabled'}
          style="flex:1;padding:10px;background:#fff;color:${_jnTemAnterior(s) ? 'var(--verde)' : 'var(--txt2)'};
                 border:1px solid var(--borda);border-radius:var(--r);font-family:'DM Sans',sans-serif;
                 font-size:12px;cursor:${_jnTemAnterior(s) ? 'pointer' : 'default'};opacity:${_jnTemAnterior(s) ? '1' : '.4'};
                 display:flex;align-items:center;justify-content:center;gap:6px">
          <i class="ti ti-chevron-left"></i> Anterior
        </button>
        <button onclick="window._jnProximo()" ${_jnTemProximo(s) ? '' : 'disabled'}
          style="flex:1;padding:10px;background:#fff;color:${_jnTemProximo(s) ? 'var(--verde)' : 'var(--txt2)'};
                 border:1px solid var(--borda);border-radius:var(--r);font-family:'DM Sans',sans-serif;
                 font-size:12px;cursor:${_jnTemProximo(s) ? 'pointer' : 'default'};opacity:${_jnTemProximo(s) ? '1' : '.4'};
                 display:flex;align-items:center;justify-content:center;gap:6px">
          Próximo <i class="ti ti-chevron-right"></i>
        </button>
      </div>
      <button onclick="window._salvarJN()" style="width:100%;margin-bottom:16px;padding:10px;background:#fff;color:var(--verde);border:1px solid var(--borda);border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:500">
        <i class="ti ti-download"></i> Salvar este sutra em PDF
      </button>`
  }

  const historicoHtml = sutras.length > 1 ? `
    <div style="margin-top:6px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);font-weight:500;margin-bottom:10px">Sutras anteriores (${sutras.length - 1})</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${sutras.filter(s => s.id !== sutra_hoje.id).map(s => `
          <button onclick="window._jnSelSutra('${s.id}')" id="jn-hist-${s.id}"
            style="display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:#fff;border:1px solid var(--borda);border-radius:8px;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif">
            <div>
              <div style="font-size:13px;font-weight:500;color:var(--txt)">${s.capitulo} ${_labelNumeroSutra(s)}</div>
              <div style="font-size:11px;color:var(--txt2);font-style:italic">${s.transliteracao}</div>
            </div>
            <div style="font-size:11px;color:var(--txt2);flex-shrink:0;margin-left:12px">${new Date(s.publicada_em + 'T12:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</div>
          </button>`).join('')}
      </div>
    </div>` : ''

  container.querySelector('.content').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:26px">📜</span>
        <div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde)">Jñāna Mārga</div>
          <div style="font-size:12px;color:var(--txt2)">Estudo dos Yoga Sūtras · diário</div>
        </div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--txt2);margin-bottom:16px">
      <strong style="color:var(--verde)">${sutras.length}</strong> sutra${sutras.length !== 1 ? 's' : ''} publicado${sutras.length !== 1 ? 's' : ''} até hoje
    </div>
    <div id="jn-sutra-view">${renderSutra(sutraSel)}</div>
    ${historicoHtml}
  `
  window._salvarJN = function() { _salvarSutra(sutraSel) }
  window._jnSelSutra = function(id) {
    const s = sutras.find(x => x.id === id)
    if (!s) return
    sutraSel = s
    document.querySelectorAll('[id^="jn-hist-"]').forEach(btn => {
      btn.style.borderColor = btn.id === `jn-hist-${id}` ? 'var(--verde)' : 'var(--borda)'
      btn.style.background  = btn.id === `jn-hist-${id}` ? 'rgba(31,56,31,.04)' : '#fff'
    })
    const view = document.getElementById('jn-sutra-view')
    if (view) { view.innerHTML = renderSutra(s); view.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  }
  window._jnAnterior = function() {
    const idx = sutrasOrdemCrescente.findIndex(x => x.id === sutraSel.id)
    if (idx > 0) window._jnSelSutra(sutrasOrdemCrescente[idx - 1].id)
  }
  window._jnProximo = function() {
    const idx = sutrasOrdemCrescente.findIndex(x => x.id === sutraSel.id)
    if (idx >= 0 && idx < sutrasOrdemCrescente.length - 1) window._jnSelSutra(sutrasOrdemCrescente[idx + 1].id)
  }
  uiAnimar(container)
}

// ── Benefício genérico ────────────────────────────────────────
function _renderBeneficioGenerico(container, b, campo, temAcesso, planoTipo, isVisitante) {
  const ORDEM = ['brahma','shiva_1x','shiva_2x','vishnu_2x','vishnu_livre']
  const idxAtual = ORDEM.indexOf(planoTipo)
  const planosComAcesso = PLANOS_COM_BENEFICIO[campo] || []
  const planosUpgrade   = isVisitante ? planosComAcesso : planosComAcesso.filter(p => ORDEM.indexOf(p) > idxAtual)

  const botoesUpgrade = planosUpgrade.map(p => {
    const label = PLANO_LABELS[p] || p
    const msg   = encodeURIComponent(`Olá! Sou aluno(a) do Espaço Autonomia e gostaria de mudar para o plano ${label}.`)
    return `<a href="https://wa.me/${ESTUDIO_WA}?text=${msg}" target="_blank" rel="noopener"
      style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;
             background:var(--verde);color:var(--bege);border-radius:7px;text-decoration:none;
             font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;white-space:nowrap">
      <i class="ti ti-brand-whatsapp"></i> Mudar para ${label}
    </a>`
  }).join('')

  const listaPlanos = planosComAcesso.map(p =>
    `<span style="font-size:11px;background:rgba(232,188,79,.15);color:#7a6010;
      padding:2px 8px;border-radius:20px;white-space:nowrap">${PLANO_LABELS[p]||p}</span>`
  ).join(' ')

  const acaoHtml = temAcesso
    ? (campo === 'sangha' && isVisitante
        ? `<a href="${SANGHA_LINKS.visitante}" target="_blank" rel="noopener"
            style="display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:11px 22px;
                   background:#25d366;color:#fff;border-radius:8px;text-decoration:none;
                   font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif">
            <i class="ti ti-brand-whatsapp"></i> Entrar no grupo Sangha
          </a>`
        : b.acaoAtivo(planoTipo))
    : ''

  container.querySelector('.content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <span style="font-size:36px;line-height:1;${temAcesso?'':'filter:grayscale(1);opacity:.4'}">${b.icone}</span>
      <div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;
                    color:${temAcesso?'var(--verde)':'var(--txt2)'};line-height:1.2">${b.nome}</div>
        <div style="font-size:12px;color:var(--txt2);margin-top:3px">${b.subtitulo}</div>
        ${temAcesso
          ? `<span style="font-size:10px;background:rgba(31,56,31,.08);color:var(--verde);padding:2px 8px;border-radius:20px;font-weight:500;margin-top:4px;display:inline-block">Incluso no seu plano</span>`
          : `<span style="font-size:10px;background:rgba(0,0,0,.06);color:var(--txt2);padding:2px 8px;border-radius:20px;margin-top:4px;display:inline-block">Não incluso no seu plano</span>`
        }
      </div>
    </div>
    <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:18px 20px;margin-bottom:16px">
      <p style="font-size:14px;color:var(--txt);line-height:1.8;margin:0;white-space:pre-line">${(b.descricao||'').trim()}</p>
      ${acaoHtml}
    </div>
    ${!temAcesso ? `
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:12px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);margin-bottom:8px">Disponível nos planos</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${listaPlanos}</div>
      </div>
      ${planosUpgrade.length > 0 ? `
        <div style="background:rgba(232,188,79,.06);border:1px solid rgba(232,188,79,.25);border-radius:var(--r);padding:16px 18px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:4px">Quero ter acesso</div>
          <div style="font-size:12px;color:var(--txt2);margin-bottom:12px">Escolha o plano e enviaremos as informações pelo WhatsApp.</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">${botoesUpgrade}</div>
        </div>` : ''}
    ` : ''}
  `
  uiAnimar(container)
}   
