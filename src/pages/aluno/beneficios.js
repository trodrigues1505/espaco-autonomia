/**
 * src/pages/aluno/beneficios.js
 * Dharma Phala — Benefícios do plano do aluno.
 *
 * Lógica:
 *  - Busca a matrícula ativa do aluno com join em planos (campos booleanos de benefício)
 *  - Para cada benefício: se plano[campo] === true → card ativo (aluno tem acesso)
 *  - Se plano[campo] === false → card bloqueado (mostra quais planos têm + botões upgrade WA)
 */

// ── Links do Sangha por plano ─────────────────────────────────
// Brahma tem grupo próprio; Shiva e Vishnu (2x e livre) compartilham o mesmo link.
const SANGHA_LINKS = {
  brahma:      'https://chat.whatsapp.com/BWIMnUs5ijOAZmoBCEt9su',
  shiva_1x:    'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
  shiva_2x:    'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
  vishnu_2x:   'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
  vishnu_livre:'https://chat.whatsapp.com/ChO0Yyy1D3F7zFG43PYUIJ',
}

// ── Número do estúdio para upgrade ───────────────────────────
const ESTUDIO_WA = '551144490162'

// ── Quais planos incluem cada benefício ──────────────────────
// (espelha a tabela planos; evita round-trip extra ao banco)
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

// Rótulos de exibição dos planos (para os botões de upgrade)
const PLANO_LABELS = {
  brahma:       'Brahma',
  shiva_1x:     'Shiva 1×',
  shiva_2x:     'Shiva 2×',
  vishnu_2x:    'Vishnu 2×',
  vishnu_livre: 'Vishnu Livre',
}

// ── Dados de cada benefício ───────────────────────────────────
const BENEFICIOS = [
  {
    campo: 'sangha',
    nome:  'Sangha',
    subtitulo: 'Comunidade WhatsApp',
    icone: '🪷',
    descricao: `O Sangha é mais do que um grupo — é o coração pulsante da nossa comunidade.
      Aqui você encontra avisos importantes do estúdio, trocas entre praticantes, reflexões sobre a prática e o suporte de quem caminha junto.
      No Yoga, a Sangha (comunidade) é um dos três pilares fundamentais ao lado do Dharma e do Buddha.
      Fazer parte deste grupo é dar um passo além da aula: é pertencer.`,
    acaoAtivo(planoTipo) {
      const link = SANGHA_LINKS[planoTipo]
      if (!link) return ''
      return `<a href="${link}" target="_blank" rel="noopener"
        style="display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:10px 20px;
               background:#25d366;color:#fff;border-radius:8px;text-decoration:none;
               font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif">
        📱 Entrar no grupo Sangha
      </a>`
    },
  },
  {
    campo: 'kala_sadhya',
    nome:  'Kāla Sādhyā',
    subtitulo: 'Agenda Flex',
    icone: '🗓',
    descricao: `Kāla Sādhyā significa, em sânscrito, "o tempo como prática" — e é exatamente isso que este benefício representa.
      Com a Agenda Flex você tem autonomia para moldar o yoga ao seu ritmo de vida, não o contrário.
      Precisa faltar a uma aula? Cancele com antecedência e recupere em outra turma disponível na grade, sem custo adicional.
      Quer experimentar uma modalidade diferente no mesmo mês? Também é possível.
      A flexibilidade não é um desvio do caminho — ela é o caminho.`,
    acaoAtivo(planoTipo) {
      return `<button onclick="navigate('aluno-grade')"
        style="display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:10px 20px;
               background:var(--verde);color:var(--bege);border:none;border-radius:8px;
               font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif">
        📅 Ver grade de aulas
      </button>`
    },
  },
  {
    campo: 'asana_marga',
    nome:  'Āsana Mārga',
    subtitulo: 'App de Prática',
    icone: '🧘',
    descricao: `Āsana Mārga — "o caminho das posturas" — leva a sua prática para onde você estiver.
      Com este benefício você acessa um aplicativo completo de prática guiada: sequências de āsanas, exercícios de prāṇāyāma e meditações conduzidas.
      Sua sādhana não precisa parar quando você não consegue vir ao estúdio.
      O tapete pode ser em qualquer lugar — e o caminho também.`,
    acaoAtivo() { return '' },
  },
  {
    campo: 'yoga_adhyayana',
    nome:  'Yoga Adhyayana',
    subtitulo: 'Estudo Teórico',
    icone: '📖',
    descricao: `Adhyayana significa "estudo profundo" — e o Yoga é muito mais do que o que se pratica com o corpo.
      Este benefício dá acesso a materiais de apoio enviados periodicamente: filosofia, história do Yoga, conceitos do Ayurveda e fundamentos das tradições que embasam nossa prática no Espaço Autonomia.
      Porque entender o porquê de cada postura, respiração e intenção transforma a aula em uma experiência completa de autoconhecimento.`,
    acaoAtivo() { return '' },
  },
  {
    campo: 'jnana_marga',
    nome:  'Jñāna Mārga',
    subtitulo: 'Estudo Literário',
    icone: '📜',
    descricao: `Jñāna Mārga — "o caminho do conhecimento" — é para quem quer ir fundo.
      Textos clássicos como o Hatha Yoga Pradīpikā, os Yoga Sūtras de Patañjali e a Bhagavad Gītā carregam séculos de sabedoria destilada.
      Com este benefício você recebe indicações de leitura, trechos comentados e reflexões que conectam o antigo ao contemporâneo.
      A leitura contemplativa é, ela mesma, uma forma de meditação.`,
    acaoAtivo() { return '' },
  },
  {
    campo: 'sadhana_purna',
    nome:  'Sādhanā Pūrṇā',
    subtitulo: 'Avaliação de Progresso',
    icone: '🌿',
    descricao: `Sādhanā Pūrṇā — "prática plena" — é o olhar atento sobre a sua jornada.
      Periodicamente você terá uma conversa com o professor para mapear sua evolução: o que o corpo comunica, como a mente responde, onde a prática está transformando e onde ainda pede atenção.
      Não é uma avaliação de desempenho — é um rito de reconhecimento.
      O progresso no Yoga não se mede em meses, mas em camadas de consciência.`,
    acaoAtivo() { return '' },
  },
  {
    campo: 'atma_vijnana',
    nome:  'Ātma Vijñāna',
    subtitulo: 'Anamnese Personalizada',
    icone: '🔍',
    descricao: `Ātma Vijñāna — "conhecimento do ser" — começa antes da primeira āsana.
      Este benefício garante uma conversa inicial aprofundada com o professor: histórico de saúde, objetivos, limitações físicas e emocionais, e o que você busca nessa prática.
      A partir daí, as aulas não são mais genéricas — elas são pensadas também para você.
      Porque a prática mais poderosa é aquela que parte de onde você realmente está.`,
    acaoAtivo() { return '' },
  },
  {
    campo: 'shruti',
    nome:  'Śruti',
    subtitulo: 'Áudio Diário',
    icone: '🎵',
    descricao: `Śruti significa "o que foi ouvido" — e nas tradições do Yoga, o som é transmissão de sabedoria.
      Diariamente você recebe um áudio curto com mantras, prāṇāyāmas guiados ou reflexões para integrar a prática ao cotidiano — mesmo nos dias sem aula.
      Menos de 5 minutos que podem mudar o tom do seu dia.
      O som que você carrega dentro de você é o primeiro instrumento.`,
    acaoAtivo() { return '' },
  },
  {
    campo: 'naada_mandir',
    nome:  'Nāda Mandir',
    subtitulo: 'Biblioteca de Mantras',
    icone: '🕌',
    descricao: `Nāda Mandir — "o templo do som" — é a nossa biblioteca de mantras sagrados.
      Do Oṃ ao Gāyatrī, do Mrityuñjaya ao Śānti Pāṭha: áudios com pronúncia correta, significado e contexto de uso para cada mantra.
      Os mantras são ferramentas de transformação que atuam nas camadas mais sutis da consciência.
      Com este benefício você leva o templo com você — para a prática, o estudo e o silêncio.`,
    acaoAtivo() { return '' },
  },
]

// ── Render ────────────────────────────────────────────────────
export async function renderAlunosBeneficios(container) {
  const sb     = window._sb
  const perfil = window._perfil

  container.innerHTML = `
    <div class="topbar"><div class="topbar-t">Dharma Phala</div></div>
    <div class="content">
      <div class="loading-page"><div class="spin-big"></div></div>
    </div>`

  // Busca matrícula ativa (sem FK para planos, query separada)
  const { data: mat, error } = await sb
    .from('matriculas')
    .select('plano_tipo, opcao_aulas')
    .eq('aluno_id', perfil.id)
    .eq('ativa', true)
    .maybeSingle()

  if (error) {
    container.querySelector('.content').innerHTML =
      `<p style="color:#c0392b;font-size:12px">Erro ao carregar benefícios: ${error.message}</p>`
    return
  }

  const planoTipo = mat?.plano_tipo || null

  const { data: plano } = planoTipo
    ? await sb.from('planos').select('*').eq('tipo', planoTipo).maybeSingle()
    : { data: null }

  // ── Monta os cards ───────────────────────────────────────────
  const cardsHtml = BENEFICIOS.map((b, idx) => {
    const temAcesso = !!(plano && plano[b.campo])
    return temAcesso
      ? _cardAtivo(b, planoTipo, idx)
      : _cardBloqueado(b, planoTipo, idx)
  }).join('')

  container.querySelector('.content').innerHTML = `

    <!-- Cabeçalho -->
    <div style="margin-bottom:20px">
      <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde);line-height:1.2">
        Seus Benefícios
      </div>
      ${plano
        ? `<div style="font-size:12px;color:var(--txt2);margin-top:4px">
             Plano <strong>${plano.nome || planoTipo}</strong> · clique em um benefício para explorar
           </div>`
        : `<div style="font-size:12px;color:#c0392b;margin-top:4px">
             Nenhuma matrícula ativa encontrada.
           </div>`
      }
    </div>

    <!-- Cards -->
    ${cardsHtml}
  `

  // Handlers de toggle (acordeão)
  window._toggleBeneficioCard = function(idx) {
    const body = document.getElementById(`bc-body-${idx}`)
    const chev = document.getElementById(`bc-chev-${idx}`)
    if (!body) return
    const aberto = body.style.display !== 'none'
    body.style.display = aberto ? 'none' : 'block'
    if (chev) chev.style.transform = aberto ? '' : 'rotate(180deg)'
  }
}

// ── Card: aluno TEM o benefício ───────────────────────────────
function _cardAtivo(b, planoTipo, idx) {
  const acaoBotao = b.acaoAtivo(planoTipo)
  return `
    <div style="border:1px solid rgba(31,56,31,.2);border-radius:10px;margin-bottom:10px;overflow:hidden;background:#fff">

      <!-- Cabeçalho do card -->
      <button onclick="window._toggleBeneficioCard(${idx})"
        style="width:100%;display:flex;align-items:center;gap:12px;padding:14px 16px;
               background:none;border:none;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif">
        <span style="font-size:22px;flex-shrink:0;line-height:1">${b.icone}</span>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde)">${b.nome}</span>
            <span style="font-size:10px;background:rgba(31,56,31,.08);color:var(--verde);padding:2px 7px;border-radius:20px;font-weight:500">Incluso</span>
          </div>
          <div style="font-size:11px;color:var(--txt2);margin-top:2px">${b.subtitulo}</div>
        </div>
        <span id="bc-chev-${idx}" style="font-size:11px;color:var(--txt2);flex-shrink:0;transition:transform .2s">▼</span>
      </button>

      <!-- Corpo expansível -->
      <div id="bc-body-${idx}" style="display:none;padding:0 16px 16px;border-top:1px solid rgba(212,200,158,.4)">
        <p style="font-size:13px;color:var(--txt);line-height:1.7;margin:14px 0 0;white-space:pre-line">${b.descricao.trim()}</p>
        ${acaoBotao}
      </div>
    </div>`
}

// ── Card: aluno NÃO tem o benefício ──────────────────────────
function _cardBloqueado(b, planoTipoAtual, idx) {
  const planosComAcesso = PLANOS_COM_BENEFICIO[b.campo] || []

  // Filtra planos superiores ao atual (para não sugerir downgrade)
  // Ordem de "hierarquia" dos planos
  const ORDEM = ['brahma','shiva_1x','shiva_2x','vishnu_2x','vishnu_livre']
  const idxAtual = ORDEM.indexOf(planoTipoAtual)
  const planosUpgrade = planosComAcesso.filter(p => ORDEM.indexOf(p) > idxAtual)

  const botoesUpgrade = planosUpgrade.map(p => {
    const label  = PLANO_LABELS[p] || p
    const msg    = encodeURIComponent(
      `Olá! Sou aluno(a) do Espaço Autonomia e gostaria de mudar para o plano ${label}.`
    )
    const waLink = `https://wa.me/${ESTUDIO_WA}?text=${msg}`
    return `<a href="${waLink}" target="_blank" rel="noopener"
      style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;
             background:var(--verde);color:var(--bege);border-radius:7px;
             text-decoration:none;font-size:12px;font-weight:500;
             font-family:'DM Sans',sans-serif;white-space:nowrap">
      📲 Mudar para ${label}
    </a>`
  }).join('')

  const listaPlanos = planosComAcesso.map(p =>
    `<span style="font-size:11px;background:rgba(232,188,79,.15);color:#7a6010;
      padding:2px 8px;border-radius:20px;white-space:nowrap">${PLANO_LABELS[p]||p}</span>`
  ).join(' ')

  return `
    <div style="border:1px solid var(--borda);border-radius:10px;margin-bottom:10px;overflow:hidden;background:#fafafa;opacity:.85">

      <!-- Cabeçalho do card -->
      <button onclick="window._toggleBeneficioCard(${idx})"
        style="width:100%;display:flex;align-items:center;gap:12px;padding:14px 16px;
               background:none;border:none;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif">
        <span style="font-size:22px;flex-shrink:0;line-height:1;filter:grayscale(1);opacity:.5">${b.icone}</span>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--txt2)">${b.nome}</span>
            <span style="font-size:10px;background:rgba(0,0,0,.06);color:var(--txt2);padding:2px 7px;border-radius:20px">Não incluso</span>
          </div>
          <div style="font-size:11px;color:var(--txt2);margin-top:2px">${b.subtitulo}</div>
        </div>
        <span id="bc-chev-${idx}" style="font-size:11px;color:var(--txt2);flex-shrink:0;transition:transform .2s">▼</span>
      </button>

      <!-- Corpo expansível -->
      <div id="bc-body-${idx}" style="display:none;padding:0 16px 16px;border-top:1px solid var(--borda)">
        <p style="font-size:13px;color:var(--txt2);line-height:1.7;margin:14px 0 12px;white-space:pre-line">${b.descricao.trim()}</p>

        <!-- Quais planos têm este benefício -->
        <div style="margin-bottom:14px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);margin-bottom:6px">Disponível nos planos</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${listaPlanos}</div>
        </div>

        <!-- Botões de upgrade -->
        ${planosUpgrade.length > 0
          ? `<div>
               <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);margin-bottom:8px">Quero fazer upgrade</div>
               <div style="display:flex;flex-wrap:wrap;gap:8px">${botoesUpgrade}</div>
             </div>`
          : ''
        }
      </div>
    </div>`
}       
