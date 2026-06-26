/**
 * src/pages/aluno/beneficios.js
 * Dharma Phala — detalhe de um benefício do plano.
 */

import { uiAnimar } from '../../modules/ui.js'

const SANGHA_LINKS = {
  brahma:       'https://chat.whatsapp.com/BWIMnUs5ijOAZmoBCEt9su',
  shiva_1x:     'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
  shiva_2x:     'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
  vishnu_2x:    'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
  vishnu_livre: 'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
}

const ESTUDIO_WA = '5511444901620'

const PLANOS_COM_BENEFICIO = {
  sangha:         ['brahma','shiva_1x','shiva_2x','vishnu_2x','vishnu_livre'],
  kala_sadhya:    ['brahma','shiva_1x','shiva_2x','vishnu_2x','vishnu_livre'],
  asana_marga:    ['shiva_1x','shiva_2x','vishnu_2x','vishnu_livre'],
  yoga_adhyayana: ['shiva_1x','shiva_2x','vishnu_2x','vishnu_livre'],
  jnana_marga:    ['shiva_1x','shiva_2x','vishnu_2x','vishnu_livre'],
  sadhana_purna:  ['vishnu_2x','vishnu_livre'],
  atma_vijnana:   ['vishnu_2x','vishnu_livre'],
  shruti:         ['vishnu_2x','vishnu_livre'],
  naada_mandir:   ['vishnu_2x','vishnu_livre'],
}

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
      const link = SANGHA_LINKS[t]
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
  jnana_marga:    { nome: 'Jñāna Mārga',   subtitulo: 'Estudo Literário',        icone: '📜', descricao: `Jñāna Mārga — "o caminho do conhecimento" — é para quem quer ir fundo.\nTextos clássicos como o Hatha Yoga Pradīpikā, os Yoga Sūtras de Patañjali e a Bhagavad Gītā carregam séculos de sabedoria destilada.\nA leitura contemplativa é, ela mesma, uma forma de meditação.`, acaoAtivo() { return '' } },
  sadhana_purna:  { nome: 'Sādhanā Pūrṇā', subtitulo: 'Avaliação de Progresso', icone: '🌿', descricao: `Sādhanā Pūrṇā — "prática plena" — é o olhar atento sobre a sua jornada.\nPeriodicamente você terá uma conversa com o professor para mapear sua evolução.\nO progresso no Yoga não se mede em meses, mas em camadas de consciência.`, acaoAtivo() { return '' } },
  atma_vijnana:   { nome: 'Ātma Vijñāna',  subtitulo: 'Anamnese Personalizada', icone: '🔍', descricao: `Ātma Vijñāna — "conhecimento do ser" — começa antes da primeira āsana.\nEste benefício garante uma conversa inicial aprofundada com o professor sobre histórico, objetivos e limitações.\nPorque a prática mais poderosa é aquela que parte de onde você realmente está.`, acaoAtivo() { return '' } },
  shruti:         { nome: 'Śruti',          subtitulo: 'Áudio Diário',            icone: '🎵', descricao: `Śruti significa "o que foi ouvido" — e nas tradições do Yoga, o som é transmissão de sabedoria.\nDiariamente você recebe um áudio curto com mantras, prāṇāyāmas guiados ou reflexões.\nO som que você carrega dentro de você é o primeiro instrumento.`, acaoAtivo() { return '' } },
  naada_mandir:   { nome: 'Nāda Mandir',   subtitulo: 'Biblioteca de Mantras',  icone: '🕌', descricao: `Nāda Mandir — "o templo do som" — é a nossa biblioteca de mantras sagrados.\nDo Oṃ ao Gāyatrī, do Mrityuñjaya ao Śānti Pāṭha: áudios com pronúncia correta, significado e contexto de uso.\nCom este benefício você leva o templo com você.`, acaoAtivo() { return '' } },
}

// ── Dicionário de sistemas/elementos/chakras ──────────────────
const DICIONARIO = {
  // Sistemas corporais
  'Muscular':        'Fortalece e tona a musculatura, melhorando força, resistência e coordenação motora.',
  'Esquelético':     'Promove alinhamento ósseo, densidade e saúde articular, prevenindo desgastes.',
  'Cardiovascular':  'Estimula a circulação sanguínea, nutrindo órgãos e tecidos com oxigênio.',
  'Respiratório':    'Amplia a capacidade pulmonar e melhora a qualidade e profundidade da respiração.',
  'Nervoso':         'Regula o sistema nervoso, reduzindo o estresse e promovendo equilíbrio entre ação e repouso.',
  'Digestório':      'Estimula os órgãos digestivos, melhorando absorção de nutrientes e eliminação de toxinas.',
  'Eliminatório':    'Apoia os rins, intestinos e pele na eliminação de resíduos e toxinas do organismo.',
  'Reprodutivo':     'Equilibra a energia pélvica, hormônios e vitalidade relacionados à criatividade e reprodução.',
  'Linfático':       'Ativa a circulação linfática, fortalecendo a imunidade e drenando fluidos em excesso.',
  'Endócrino':       'Regula as glândulas e a produção hormonal, influenciando humor, energia e metabolismo.',
  // Elementos (Tattvas)
  'Terra':           'Sustentação, estabilidade e enraizamento. Convida à presença, firmeza e solidez interior.',
  'Água':            'Fluidez, adaptabilidade e purificação. Conecta com as emoções e a capacidade de fluir.',
  'Fogo':            'Transformação, potência e ativação metabólica. Acende a vontade e dissolve resistências.',
  'Ar':              'Expansão, leveza e circulação energética. Nutre a mente e abre espaço para novos movimentos.',
  'Éter':            'Espaço, vazio fértil e consciência pura. O elemento que contém todos os outros.',
  // Ayurveda — Doshas
  'Vata':            'Dosha do movimento e leveza. Equilibrado pela prática, traz estabilidade e calma ao sistema nervoso.',
  'Pitta':           'Dosha do fogo e transformação. A prática pode intensificá-lo; requer atenção ao esforço excessivo.',
  'Kapha':           'Dosha da terra e água. Reduzido pela ativação muscular, calor e movimento, trazendo mais leveza.',
  // Chakras
  'Muladhara':       'Chakra raiz. Centro de segurança, sobrevivência e enraizamento. Localizado na base da coluna.',
  'Svadisthana':     'Chakra sacral. Centro de criatividade, prazer e emoções. Localizado abaixo do umbigo.',
  'Svādhiṣṭhāna':   'Chakra sacral. Centro de criatividade, prazer e emoções. Localizado abaixo do umbigo.',
  'Manipura':        'Chakra do plexo solar. Centro de poder pessoal, vontade e autoestima.',
  'Maṇipūra':       'Chakra do plexo solar. Centro de poder pessoal, vontade e autoestima.',
  'Anahata':         'Chakra do coração. Centro do amor, compaixão e equilíbrio entre mundo material e espiritual.',
  'Anāhata':        'Chakra do coração. Centro do amor, compaixão e equilíbrio entre mundo material e espiritual.',
  'Vishuddha':       'Chakra da garganta. Centro da expressão, comunicação e autenticidade.',
  'Ajna':            'Chakra do terceiro olho. Centro da intuição, discernimento e visão interior.',
  'Sahasrara':       'Chakra da coroa. Centro da consciência pura, conexão com o todo e transcendência.',
}

function descDicionario(termo) {
  // Busca exata primeiro, depois parcial
  if (DICIONARIO[termo]) return DICIONARIO[termo]
  const key = Object.keys(DICIONARIO).find(k =>
    termo.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(termo.toLowerCase())
  )
  return key ? DICIONARIO[key] : null
}

// ── Lightbox de imagem ────────────────────────────────────────
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

// ── Componente de imagem clicável ─────────────────────────────
function _imgClicavel(src, alt, maxHeight = '240px') {
  return `
    <div style="position:relative;border-radius:12px;overflow:hidden;
                background:var(--verde);min-height:160px;cursor:zoom-in;
                group"
         onclick="_abrirLightbox('${src}','${alt}')"
         title="Clique para ampliar">
      <img src="${src}" alt="${alt}" referrerpolicy="no-referrer"
        style="width:100%;max-height:${maxHeight};object-fit:cover;
               object-position:center center;display:block;opacity:.9"
        onerror="this.parentElement.style.display='none'">
      <div style="position:absolute;bottom:0;left:0;right:0;padding:16px;
                  background:linear-gradient(to top,rgba(31,56,31,.92) 0%,transparent 100%)">
        <slot></slot>
      </div>
      <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.4);
                  border-radius:20px;padding:3px 8px;font-size:10px;color:#fff;
                  display:flex;align-items:center;gap:4px">
        <i class="ti ti-zoom-in" style="font-size:12px"></i> ampliar
      </div>
    </div>`
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

  let planoData = window._planoData
  const planoTipo = window._plano || null
  if (planoData === undefined) {
    if (planoTipo) {
      const { data } = await window._sb.from('planos')
        .select('sangha,kala_sadhya,asana_marga,yoga_adhyayana,jnana_marga,sadhana_purna,atma_vijnana,shruti,naada_mandir')
        .eq('tipo', planoTipo).maybeSingle()
      planoData = data || null
      window._planoData = planoData
    } else { planoData = null }
  }

  const temAcesso = !!(planoData && planoData[campo])

  if (campo === 'yoga_adhyayana' && temAcesso) { await _renderYogaAdhyayana(container); return }
  if (campo === 'asana_marga'    && temAcesso) { await _renderAsanaMarga(container);    return }
  if (campo === 'jnana_marga'    && temAcesso) { await _renderJnanaMarga(container);    return }

  _renderBeneficioGenerico(container, b, campo, temAcesso, planoTipo)
}

// ── Stepper genérico reutilizável ─────────────────────────────
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
                    <div style="width:6px;height:6px;border-radius:50%;background:${s.cor};
                                 flex-shrink:0;margin-top:6px"></div>
                    <div style="font-size:13px;line-height:1.6">
                      <span style="font-weight:500;color:var(--txt)">${item.termo}</span>
                      <span style="color:var(--txt2)">: ${item.desc}</span>
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

// ── Injeta keyframe uma única vez ─────────────────────────────
function _injetarAnimacao() {
  if (!document.getElementById('_ya-style')) {
    const s = document.createElement('style')
    s.id = '_ya-style'
    s.textContent = `@keyframes _ya-slide-in { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`
    document.head.appendChild(s)
  }
}

// ── Yoga Adhyayana ────────────────────────────────────────────
async function _renderYogaAdhyayana(container) {
  const { AULA_SEMANA: aula } = await import(`../../data/yoga_adhyayana.js?t=${Date.now()}`)
  _injetarAnimacao()

  const nivelCor = { 'Iniciante': '#2d7a2d', 'Intermediário': '#c8a020', 'Avançado': '#8a1a1a' }[aula.nivel] || 'var(--verde)'
  const nivelBg  = { 'Iniciante': 'rgba(45,122,45,.1)', 'Intermediário': 'rgba(200,160,32,.1)', 'Avançado': 'rgba(138,26,26,.1)' }[aula.nivel] || 'rgba(31,56,31,.08)'

  const { renderStepper, containerId } = _stepper(aula.secoes, 'ya')

  const imgHtml = aula.imagem ? `
    <div style="position:relative;border-radius:12px;overflow:hidden;margin-bottom:16px;
                background:var(--verde);min-height:160px;cursor:zoom-in"
         onclick="_abrirLightbox('${aula.imagem}','${aula.tema}')" title="Clique para ampliar">
      <img src="${aula.imagem}" alt="${aula.tema}" referrerpolicy="no-referrer"
        style="width:100%;max-height:240px;object-fit:cover;object-position:center center;
               display:block;opacity:.9" onerror="this.parentElement.style.display='none'">
      <div style="position:absolute;bottom:0;left:0;right:0;padding:16px;
                  background:linear-gradient(to top,rgba(31,56,31,.92) 0%,transparent 100%)">
        <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;
                    color:var(--bege);line-height:1.2">${aula.tema}</div>
        <div style="font-size:11px;color:rgba(242,236,206,.75);margin-top:3px">${aula.nivel_descricao}</div>
      </div>
      <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.4);
                  border-radius:20px;padding:3px 8px;font-size:10px;color:#fff;
                  display:flex;align-items:center;gap:4px">
        <i class="ti ti-zoom-in" style="font-size:12px"></i> ampliar
      </div>
    </div>` : ''

  container.querySelector('.content').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <span style="font-size:26px">📖</span>
      <div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde)">Yoga Adhyayana</div>
        <div style="font-size:12px;color:var(--txt2)">Conteúdo da semana</div>
      </div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
      <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">Aula ${aula.numero}</span>
      <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${aula.data}</span>
      <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${aula.categoria}</span>
      <span style="font-size:11px;background:${nivelBg};color:${nivelCor};padding:3px 10px;border-radius:20px;font-weight:500">${aula.nivel}</span>
    </div>
    ${imgHtml}
    <div style="border-left:3px solid var(--dourado);background:rgba(232,188,79,.07);
                border-radius:0 8px 8px 0;padding:13px 16px;margin-bottom:18px">
      <p style="font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;
                color:var(--verde);line-height:1.6;margin:0">"${aula.citacao}"</p>
    </div>
    <div id="${containerId}" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:18px 16px;margin-bottom:16px">
      ${renderStepper()}
    </div>
    <div style="background:var(--verde);border-radius:12px;padding:20px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:rgba(242,236,206,.55);margin-bottom:8px;font-weight:500">Reflexão da semana</div>
      <p style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--bege);line-height:1.7;margin:0;font-style:italic">${aula.reflexao}</p>
    </div>
  `
  uiAnimar(container)
}

// ── Asana Marga ───────────────────────────────────────────────
async function _renderAsanaMarga(container) {
  const { AULA_PRATICA: aula } = await import(`../../data/asana_marga.js?t=${Date.now()}`)
  _injetarAnimacao()

  const nivelCor = { 'Novatos': '#2d7a2d', 'Intermediário': '#c8a020', 'Avançado': '#8a1a1a' }[aula.nivel] || 'var(--verde)'
  const nivelBg  = { 'Novatos': 'rgba(45,122,45,.1)', 'Intermediário': 'rgba(200,160,32,.1)', 'Avançado': 'rgba(138,26,26,.1)' }[aula.nivel] || 'rgba(31,56,31,.08)'

  const secoes = [
    { id:'introducao', titulo:'Introdução',       icone:'ti-Om',         cor:'#7F77DD', itens: aula.introducao },
    { id:'pranayama',  titulo:'Prāṇāyāma',        icone:'ti-wind',       cor:'#378ADD', itens: aula.pranayama  },
    { id:'mantra',     titulo:'Mantra',            icone:'ti-music',      cor:'#BA7517', itens: aula.mantra     },
    { id:'energetica', titulo:'Leitura Energética',icone:'ti-sparkles',   cor:'#639922', itens: [
      { termo: 'Koshas',  desc: aula.leitura_energetica.koshas.join(' · ') },
      { termo: 'Chakras', desc: aula.leitura_energetica.cakras.join(' · ')  },
      { termo: 'Gunas',   desc: aula.leitura_energetica.gunas.join(' · ')   },
    ]},
  ]

  const { renderStepper, containerId } = _stepper(secoes, 'am')
  let iframeAberto = false

  container.querySelector('.content').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <span style="font-size:26px">🧘</span>
      <div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde)">Āsana Mārga</div>
        <div style="font-size:12px;color:var(--txt2)">Aula prática da semana</div>
      </div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
      <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">Aula ${aula.numero}</span>
      <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${aula.data}</span>
      <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${aula.modalidade}</span>
      <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${aula.duracao}</span>
      <span style="font-size:11px;background:${nivelBg};color:${nivelCor};padding:3px 10px;border-radius:20px;font-weight:500">${aula.nivel}</span>
    </div>
    <div style="border-left:3px solid var(--dourado);background:rgba(232,188,79,.07);
                border-radius:0 8px 8px 0;padding:13px 16px;margin-bottom:18px">
      <p style="font-size:14px;font-style:italic;color:var(--verde);line-height:1.6;margin:0;
                font-family:'Cormorant Garamond',serif">${aula.descricao}</p>
    </div>
    <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:16px">
      <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:4px">Sequência de Āsanas</div>
      <div style="font-size:12px;color:var(--txt2);margin-bottom:12px">Faça-os devagar, sem forçar — de 30s a 1min cada āsana.</div>
      <button onclick="window._amToggleIframe()" id="btn-am-iframe"
        style="width:100%;padding:11px;background:var(--verde);color:var(--bege);border:none;
               border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;
               font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px">
        <i class="ti ti-eye"></i> Ver sequência completa
      </button>
      <div id="am-iframe-wrap" style="display:none;margin-top:12px;border-radius:8px;overflow:hidden;border:1px solid var(--borda)">
        <iframe src="${aula.link_tummee}"
          style="width:100%;height:600px;border:none;display:block" loading="lazy"
          title="Sequência de āsanas"></iframe>
      </div>
    </div>
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);font-weight:500;margin-bottom:10px">Estrutura da aula</div>
    <div id="${containerId}" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:18px 16px">
      ${renderStepper()}
    </div>
  `

  window._amToggleIframe = function() {
    iframeAberto = !iframeAberto
    const wrap = document.getElementById('am-iframe-wrap')
    const btn  = document.getElementById('btn-am-iframe')
    if (!wrap || !btn) return
    wrap.style.display = iframeAberto ? 'block' : 'none'
    btn.innerHTML = iframeAberto ? '<i class="ti ti-eye-off"></i> Fechar sequência' : '<i class="ti ti-eye"></i> Ver sequência completa'
    btn.style.background = iframeAberto ? 'rgba(31,56,31,.15)' : 'var(--verde)'
    btn.style.color      = iframeAberto ? 'var(--verde)' : 'var(--bege)'
    btn.style.border     = iframeAberto ? '1px solid var(--borda)' : 'none'
  }

  uiAnimar(container)
}

// ── Jñāna Mārga ───────────────────────────────────────────────
async function _renderJnanaMarga(container) {
  _injetarAnimacao()
  const sb   = window._sb
  const hoje = new Date().toISOString().slice(0, 10)

  const { data: posturas, error } = await sb
    .from('jnana_posturas').select('*')
    .lte('publicada_em', hoje)
    .order('publicada_em', { ascending: false })

  if (error) {
    container.querySelector('.content').innerHTML = `<p style="color:#c0392b;font-size:13px">Erro: ${error.message}</p>`
    return
  }

  if (!posturas || posturas.length === 0) {
    container.querySelector('.content').innerHTML = `
      <div style="text-align:center;padding:48px 24px">
        <div style="font-size:40px;margin-bottom:12px">📜</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--verde);margin-bottom:8px">Em breve</div>
        <div style="font-size:13px;color:var(--txt2)">O conteúdo do Jñāna Mārga chegará em breve.</div>
      </div>`
    return
  }

  const hoje_postura = posturas.find(p => p.publicada_em === hoje) || posturas[0]
  let posturaSel = hoje_postura

  function _secoesDicionario(p) {
    // Sistemas
    const secSistemas = (p.sistemas||[]).length ? {
      id:'sist', titulo:'Sistemas equilibrados', icone:'ti-heart', cor:'#1D9E75',
      itens: (p.sistemas||[]).map(t => ({ termo: t, desc: descDicionario(t) || 'Equilibrado e fortalecido por esta postura.' }))
    } : null

    // Elementos
    const secElementos = (p.elementos||[]).length ? {
      id:'elem', titulo:'Elementos (Tattvas)', icone:'ti-leaf', cor:'#639922',
      itens: (p.elementos||[]).map(t => ({ termo: t, desc: descDicionario(t) || 'Elemento ativado por esta postura.' }))
    } : null

    // Ayurveda
    const secAyur = p.ayurveda ? {
      id:'ayur', titulo:'Ayurveda', icone:'ti-scale', cor:'#BA7517',
      itens: p.ayurveda.split(/[,;]/).map(s => s.trim()).filter(Boolean).map(t => {
        const dosha = ['Vata','Pitta','Kapha'].find(d => t.includes(d))
        return { termo: dosha || t, desc: descDicionario(dosha || t) || t }
      })
    } : null

    // Chakras
    const secChakras = p.chakras ? {
      id:'chak', titulo:'Chakras', icone:'ti-rotate-clockwise', cor:'#7F77DD',
      itens: [{ termo: 'Chakras ativados', desc: p.chakras }]
    } : null

    return [secSistemas, secElementos, secAyur, secChakras].filter(Boolean)
  }

  function renderPostura(p) {
    const secoesBase = [
      p.simbolismo ? {
        id:'simb', titulo:'Simbolismo', icone:'ti-sun', cor:'#7F77DD',
        itens: [{ termo: 'Simbolismo', desc: p.simbolismo }]
      } : null,
      (p.instrucoes||[]).length ? {
        id:'inst', titulo:'Instruções', icone:'ti-list-check', cor:'#1D9E75',
        itens: p.instrucoes.map((inst, i) => ({ termo: `Passo ${i+1}`, desc: inst }))
      } : null,
      p.beneficios ? {
        id:'benef', titulo:'Benefícios', icone:'ti-heart-filled', cor:'#c0392b',
        itens: [{ termo: 'Benefícios', desc: p.beneficios }]
      } : null,
    ].filter(Boolean)

    const secoesEnergia = _secoesDicionario(p)
    const todasSecoes = [...secoesBase, ...secoesEnergia]

    const { renderStepper, containerId } = _stepper(todasSecoes, 'jn_' + p.id.slice(0,8))

    const isHoje  = p.publicada_em === hoje
    const dataFmt = new Date(p.publicada_em + 'T12:00').toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })

    const imgHtml = p.imagem ? `
      <div style="position:relative;cursor:zoom-in"
           onclick="_abrirLightbox('${p.imagem}','${p.nome_popular}')" title="Clique para ampliar">
        <img src="${p.imagem}" alt="${p.nome_popular}" referrerpolicy="no-referrer"
          style="width:100%;max-height:220px;object-fit:cover;object-position:center center;
                 display:block;opacity:.9" onerror="this.style.display='none'">
        <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.4);
                    border-radius:20px;padding:3px 8px;font-size:10px;color:#fff;
                    display:flex;align-items:center;gap:4px">
          <i class="ti ti-zoom-in" style="font-size:12px"></i> ampliar
        </div>
      </div>` : ''

    return `
      <div style="background:var(--verde);border-radius:12px;overflow:hidden;margin-bottom:16px">
        ${imgHtml}
        <div style="padding:${p.imagem ? '10px 16px 14px' : '20px'}">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:rgba(242,236,206,.55);margin-bottom:6px">
            ${isHoje ? '✦ Postura de hoje' : dataFmt}
          </div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;color:var(--bege);line-height:1.1">${p.nome_popular}</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;color:rgba(242,236,206,.8);margin-top:4px">${p.nome_sanscrito}</div>
          ${p.etimologia ? `<div style="font-size:11px;color:rgba(242,236,206,.55);margin-top:8px">${p.etimologia}</div>` : ''}
        </div>
      </div>
      <div id="${containerId}" style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:18px 16px;margin-bottom:16px">
        ${renderStepper()}
      </div>`
  }

  const historicoHtml = posturas.length > 1 ? `
    <div style="margin-top:6px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);font-weight:500;margin-bottom:10px">
        Posturas anteriores (${posturas.length - 1})
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${posturas.filter(p => p.publicada_em !== hoje_postura.publicada_em).map(p => `
          <button onclick="window._jnSelPost('${p.id}')" id="jn-hist-${p.id}"
            style="display:flex;align-items:center;justify-content:space-between;
                   padding:11px 14px;background:#fff;border:1px solid var(--borda);
                   border-radius:8px;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif">
            <div>
              <div style="font-size:13px;font-weight:500;color:var(--txt)">${p.nome_popular}</div>
              <div style="font-size:11px;color:var(--txt2);font-style:italic">${p.nome_sanscrito}</div>
            </div>
            <div style="font-size:11px;color:var(--txt2);flex-shrink:0;margin-left:12px">
              ${new Date(p.publicada_em + 'T12:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}
            </div>
          </button>`).join('')}
      </div>
    </div>` : ''

  container.querySelector('.content').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <span style="font-size:26px">📜</span>
      <div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde)">Jñāna Mārga</div>
        <div style="font-size:12px;color:var(--txt2)">GUIPPY · Estudo literário diário</div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--txt2);margin-bottom:16px">
      <strong style="color:var(--verde)">${posturas.length}</strong> postura${posturas.length !== 1 ? 's' : ''} publicada${posturas.length !== 1 ? 's' : ''} até hoje
    </div>
    <div id="jn-postura-view">${renderPostura(posturaSel)}</div>
    ${historicoHtml}
  `

  window._jnSelPost = function(id) {
    const p = posturas.find(x => x.id === id)
    if (!p) return
    posturaSel = p
    document.querySelectorAll('[id^="jn-hist-"]').forEach(b => {
      b.style.borderColor = b.id === `jn-hist-${id}` ? 'var(--verde)' : 'var(--borda)'
      b.style.background  = b.id === `jn-hist-${id}` ? 'rgba(31,56,31,.04)' : '#fff'
    })
    const view = document.getElementById('jn-postura-view')
    if (view) { view.innerHTML = renderPostura(p); view.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  }

  uiAnimar(container)
}

// ── Benefício genérico ────────────────────────────────────────
function _renderBeneficioGenerico(container, b, campo, temAcesso, planoTipo) {
  const ORDEM = ['brahma','shiva_1x','shiva_2x','vishnu_2x','vishnu_livre']
  const idxAtual = ORDEM.indexOf(planoTipo)
  const planosComAcesso = PLANOS_COM_BENEFICIO[campo] || []
  const planosUpgrade   = planosComAcesso.filter(p => ORDEM.indexOf(p) > idxAtual)

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
      ${temAcesso ? b.acaoAtivo(planoTipo) : ''}
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
