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
  brahma:       'Brahma',
  shiva_1x:     'Shiva 1×',
  shiva_2x:     'Shiva 2×',
  vishnu_2x:    'Vishnu 2×',
  vishnu_livre: 'Vishnu Livre',
}

const SLUG_PARA_CAMPO = {
  'sangha':         'sangha',
  'kala-sadhya':    'kala_sadhya',
  'asana-marga':    'asana_marga',
  'yoga-adhyayana': 'yoga_adhyayana',
  'jnana-marga':    'jnana_marga',
  'sadhana-purna':  'sadhana_purna',
  'atma-vijnana':   'atma_vijnana',
  'shruti':         'shruti',
  'naada-mandir':   'naada_mandir',
}

const BENEFICIOS = {
  sangha: {
    nome: 'Sangha', subtitulo: 'Comunidade WhatsApp', icone: '🌸',
    descricao: `O Sangha é mais do que um grupo — é o coração pulsante da nossa comunidade.
Aqui você encontra avisos importantes do estúdio, trocas entre praticantes, reflexões sobre a prática e o suporte de quem caminha junto.
No Yoga, a Sangha (comunidade) é um dos três pilares fundamentais ao lado do Dharma e do Buddha.
Fazer parte deste grupo é dar um passo além da aula: é pertencer.`,
    acaoAtivo(planoTipo) {
      const link = SANGHA_LINKS[planoTipo]
      if (!link) return ''
      return `<a href="${link}" target="_blank" rel="noopener"
        style="display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:11px 22px;
               background:#25d366;color:#fff;border-radius:8px;text-decoration:none;
               font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif">
        📱 Entrar no grupo Sangha
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
        📅 Ver grade de aulas
      </button>`
    },
  },
  asana_marga: {
    nome: 'Āsana Mārga', subtitulo: 'App de Prática', icone: '🧘',
    descricao: `Āsana Mārga — "o caminho das posturas" — leva a sua prática para onde você estiver.
Com este benefício você acessa um aplicativo completo de prática guiada: sequências de āsanas, exercícios de prāṇāyāma e meditações conduzidas.
O tapete pode ser em qualquer lugar — e o caminho também.`,
    acaoAtivo() { return '' },
  },
  yoga_adhyayana: {
    nome: 'Yoga Adhyayana', subtitulo: 'Estudo Teórico', icone: '📖',
    descricao: null, // conteúdo dinâmico — carregado do arquivo de dados
    acaoAtivo() { return '' },
  },
  jnana_marga: {
    nome: 'Jñāna Mārga', subtitulo: 'Estudo Literário', icone: '📜',
    descricao: `Jñāna Mārga — "o caminho do conhecimento" — é para quem quer ir fundo.
Textos clássicos como o Hatha Yoga Pradīpikā, os Yoga Sūtras de Patañjali e a Bhagavad Gītā carregam séculos de sabedoria destilada.
A leitura contemplativa é, ela mesma, uma forma de meditação.`,
    acaoAtivo() { return '' },
  },
  sadhana_purna: {
    nome: 'Sādhanā Pūrṇā', subtitulo: 'Avaliação de Progresso', icone: '🌿',
    descricao: `Sādhanā Pūrṇā — "prática plena" — é o olhar atento sobre a sua jornada.
Periodicamente você terá uma conversa com o professor para mapear sua evolução.
O progresso no Yoga não se mede em meses, mas em camadas de consciência.`,
    acaoAtivo() { return '' },
  },
  atma_vijnana: {
    nome: 'Ātma Vijñāna', subtitulo: 'Anamnese Personalizada', icone: '🔍',
    descricao: `Ātma Vijñāna — "conhecimento do ser" — começa antes da primeira āsana.
Este benefício garante uma conversa inicial aprofundada com o professor sobre histórico, objetivos e limitações.
Porque a prática mais poderosa é aquela que parte de onde você realmente está.`,
    acaoAtivo() { return '' },
  },
  shruti: {
    nome: 'Śruti', subtitulo: 'Áudio Diário', icone: '🎵',
    descricao: `Śruti significa "o que foi ouvido" — e nas tradições do Yoga, o som é transmissão de sabedoria.
Diariamente você recebe um áudio curto com mantras, prāṇāyāmas guiados ou reflexões.
O som que você carrega dentro de você é o primeiro instrumento.`,
    acaoAtivo() { return '' },
  },
  naada_mandir: {
    nome: 'Nāda Mandir', subtitulo: 'Biblioteca de Mantras', icone: '🕌',
    descricao: `Nāda Mandir — "o templo do som" — é a nossa biblioteca de mantras sagrados.
Do Oṃ ao Gāyatrī, do Mrityuñjaya ao Śānti Pāṭha: áudios com pronúncia correta, significado e contexto de uso.
Com este benefício você leva o templo com você — para a prática, o estudo e o silêncio.`,
    acaoAtivo() { return '' },
  },
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

  // Acesso ao plano em cache
  let planoData = window._planoData
  const planoTipo = window._plano || null
  if (planoData === undefined) {
    if (planoTipo) {
      const { data } = await window._sb
        .from('planos')
        .select('sangha,kala_sadhya,asana_marga,yoga_adhyayana,jnana_marga,sadhana_purna,atma_vijnana,shruti,naada_mandir')
        .eq('tipo', planoTipo)
        .maybeSingle()
      planoData = data || null
      window._planoData = planoData
    } else { planoData = null }
  }

  const temAcesso = !!(planoData && planoData[campo])

  // Yoga Adhyayana tem conteúdo dinâmico
  if (campo === 'yoga_adhyayana' && temAcesso) {
    await _renderYogaAdhyayana(container)
    return
  }

  // Todos os outros benefícios
  _renderBeneficioGenerico(container, b, campo, temAcesso, planoTipo)
}

// ── Yoga Adhyayana — conteúdo semanal interativo ─────────────
async function _renderYogaAdhyayana(container) {
  // Import com cache bust via timestamp — atualiza automaticamente a cada deploy
  const { AULA_SEMANA: aula } = await import(`../../data/yoga_adhyayana.js?t=${Date.now()}`)

  const nivelCor = {
    'Iniciante':      '#2d7a2d',
    'Intermediário':  '#c8a020',
    'Avançado':       '#8a1a1a',
  }[aula.nivel] || 'var(--verde)'

  const nivelBg = {
    'Iniciante':      'rgba(45,122,45,.1)',
    'Intermediário':  'rgba(200,160,32,.1)',
    'Avançado':       'rgba(138,26,26,.1)',
  }[aula.nivel] || 'rgba(31,56,31,.08)'

  const secoesHtml = aula.secoes.map(s => `
    <div class="ya-secao" style="background:#fff;border:1px solid var(--borda);border-radius:10px;overflow:hidden;margin-bottom:10px">
      <button onclick="_yaToggle('${s.id}')"
        style="width:100%;display:flex;align-items:center;gap:10px;padding:13px 16px;
               background:none;border:none;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif">
        <span style="font-size:20px;flex-shrink:0;line-height:1">${s.icone}</span>
        <span style="flex:1;font-size:13px;font-weight:500;color:var(--verde)">${s.titulo}</span>
        <span id="ya-chev-${s.id}" style="font-size:11px;color:var(--txt2);transition:transform .25s ease">▼</span>
      </button>
      <div id="ya-body-${s.id}" style="display:none;border-top:1px solid rgba(212,200,158,.35);padding:12px 16px 14px">
        ${s.itens.map(item => `
          <div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid rgba(212,200,158,.2);font-size:13px">
            <span style="color:var(--verde);font-weight:600;flex-shrink:0;min-width:8px">·</span>
            <div>
              <span style="font-weight:500;color:var(--txt)">${item.termo}</span>
              <span style="color:var(--txt2)">: ${item.desc}</span>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('')

  container.querySelector('.content').innerHTML = `

    <!-- Cabeçalho da aula -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
      <span style="font-size:28px">📖</span>
      <div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde)">Yoga Adhyayana</div>
        <div style="font-size:12px;color:var(--txt2)">Conteúdo da semana</div>
      </div>
    </div>

    <!-- Meta da aula -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;margin-top:8px">
      <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">Aula ${aula.numero}</span>
      <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${aula.data}</span>
      <span style="font-size:11px;background:rgba(31,56,31,.07);color:var(--verde);padding:3px 10px;border-radius:20px">${aula.categoria}</span>
      <span style="font-size:11px;background:${nivelBg};color:${nivelCor};padding:3px 10px;border-radius:20px;font-weight:500">${aula.nivel}</span>
    </div>

    <!-- Imagem + tema -->
    <div style="position:relative;border-radius:12px;overflow:hidden;margin-bottom:16px;background:var(--verde)">
      <img src="${aula.imagem}" alt="${aula.tema}"
        style="width:100%;max-height:260px;object-fit:cover;object-position:center top;display:block;opacity:.9">
      <div style="position:absolute;bottom:0;left:0;right:0;padding:20px 18px;
                  background:linear-gradient(to top, rgba(31,56,31,.92) 0%, transparent 100%)">
        <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--bege);line-height:1.2">${aula.tema}</div>
        <div style="font-size:11px;color:rgba(242,236,206,.7);margin-top:4px">${aula.nivel_descricao}</div>
      </div>
    </div>

    <!-- Citação -->
    <div style="background:rgba(232,188,79,.08);border-left:3px solid var(--dourado);border-radius:0 8px 8px 0;
                padding:14px 16px;margin-bottom:18px">
      <p style="font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;
                color:var(--verde);line-height:1.6;margin:0">"${aula.citacao}"</p>
    </div>

    <!-- Seções expansíveis -->
    <div style="margin-bottom:4px;font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);font-weight:500;margin-bottom:10px">
      Toque em cada seção para explorar
    </div>
    ${secoesHtml}

    <!-- Reflexão da semana -->
    <div style="background:var(--verde);border-radius:12px;padding:20px;margin-top:6px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:rgba(242,236,206,.6);margin-bottom:8px;font-weight:500">
        Reflexão da semana
      </div>
      <p style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--bege);
                line-height:1.7;margin:0;font-style:italic">${aula.reflexao}</p>
    </div>
  `

  // Toggle de seções
  window._yaToggle = function(id) {
    const body = document.getElementById('ya-body-' + id)
    const chev = document.getElementById('ya-chev-' + id)
    if (!body) return
    const aberto = body.style.display !== 'none'
    // Fecha todas as outras
    document.querySelectorAll('[id^="ya-body-"]').forEach(el => {
      if (el.id !== 'ya-body-' + id) {
        el.style.display = 'none'
        const c = document.getElementById(el.id.replace('ya-body-', 'ya-chev-'))
        if (c) c.style.transform = ''
      }
    })
    body.style.display = aberto ? 'none' : 'block'
    if (chev) chev.style.transform = aberto ? '' : 'rotate(180deg)'
  }

  // Abre a primeira seção por padrão
  if (aula.secoes.length > 0) {
    window._yaToggle(aula.secoes[0].id)
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
             background:var(--verde);color:var(--bege);border-radius:7px;
             text-decoration:none;font-size:13px;font-weight:500;
             font-family:'DM Sans',sans-serif;white-space:nowrap">
      📲 Mudar para ${label}
    </a>`
  }).join('')

  const listaPlanos = planosComAcesso.map(p =>
    `<span style="font-size:11px;background:rgba(232,188,79,.15);color:#7a6010;
      padding:2px 8px;border-radius:20px;white-space:nowrap">${PLANO_LABELS[p]||p}</span>`
  ).join(' ')

  container.querySelector('.content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <span style="font-size:36px;line-height:1;${temAcesso ? '' : 'filter:grayscale(1);opacity:.4'}">${b.icone}</span>
      <div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:${temAcesso ? 'var(--verde)' : 'var(--txt2)'};line-height:1.2">${b.nome}</div>
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
