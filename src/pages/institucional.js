/**
 * src/pages/institucional.js
 * "O Espaço" e "Nossa Prática" — páginas institucionais estáticas.
 */

import { uiAnimar } from '../modules/ui.js'

// ── O Espaço ────────────────────────────────────────────────────
export async function renderEspaco(container, page) {
  container.innerHTML = `
    <div class="topbar"><div class="topbar-t">O Espaço</div></div>
    <div class="content">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
        <span style="font-size:26px">🏛</span>
        <div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--verde)">Espaço Autonomia</div>
          <div style="font-size:12px;color:var(--txt2)">Sobre nós</div>
        </div>
      </div>

      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:20px;margin-bottom:16px">
        <p style="font-size:14px;color:var(--txt);line-height:1.85;margin:0 0 14px">O Espaço Autonomia nasceu em 2013, fundado e dirigido por Regiane Rocha com um propósito definido: oferecer um método para que pessoas alcancem autonomia — não no sentido de independência, mas de autogovernabilidade. A capacidade de se conduzir com consciência, de ser quem se é de forma legítima e de contribuir com o mundo a partir disso.</p>
        <p style="font-size:14px;color:var(--txt);line-height:1.85;margin:0">Yoga foi escolhido como esse método porque oferece exatamente isso: um sistema estruturado de autoconhecimento que não para no corpo nem na respiração, mas vai até a raiz do que governa o comportamento humano — a mente.</p>
      </div>

      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:20px;margin-bottom:16px">
        <p style="font-size:14px;color:var(--txt);line-height:1.85;margin:0 0 14px">Thiago Rodrigues atua no Espaço desde o início, como gerente administrativo. Alguns anos depois, tornou-se também professor. Mais recentemente, assumiu a gestão do espaço, coordenando as atividades e aprofundando o trabalho na direção do que o Espaço sempre foi: um lugar para o estudo e a difusão da tradição do yoga, ensinado como darshana — como visão de mundo — e não como atividade física ou tendência de bem-estar.</p>
        <p style="font-size:14px;color:var(--txt);line-height:1.85;margin:0">Hoje as aulas presenciais de Hatha Yoga, Raja Yoga e AcroYoga são conduzidas por Thiago Rodrigues e Carol Gimenes, no centro de Franco da Rocha.</p>
      </div>

      <div style="background:var(--verde);border-radius:12px;padding:20px 22px;margin-bottom:16px">
        <p style="font-family:'Cormorant Garamond',serif;font-size:16px;font-style:italic;color:var(--bege);line-height:1.7;margin:0">O yoga que ensinamos aqui é o yoga como ele foi concebido — um sistema filosófico completo, com método, literatura e tradição. Se isso é o que você está procurando, você está no lugar certo.</p>
      </div>

      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--txt2)">
        <i class="ti ti-map-pin" style="color:var(--verde)"></i>
        Av. Liberdade, 179 — Centro, Franco da Rocha, SP
      </div>
    </div>
  `
  uiAnimar(container)
}

// ── Nossa Prática ───────────────────────────────────────────────
const SUBPAGINAS = [
  {
    id: 'darshana',
    titulo: 'O que é Yoga',
    icone: '🕉',
    intro: [
      'Yoga não é alongamento. Não é respiração consciente. Não é um conjunto de posturas com nome em sânscrito.',
      'Yoga é uma das seis grandes visões de mundo sistematizadas pela filosofia indiana clássica. Um darshana — palavra sânscrita que significa literalmente "modo de ver". Não uma técnica, mas uma forma de enxergar a realidade, a mente e a consciência.',
      'O que chamamos de postura, respiração e meditação são ferramentas dentro desse sistema — não o sistema em si. Usá-las sem entender para que servem é como tomar um remédio sem saber o que ele trata.',
      'No Espaço Autonomia ensinamos yoga a partir dessa tradição. Cada elemento da aula tem uma função precisa dentro de um caminho estruturado. A postura trabalha o corpo para que o corpo não perturbe a mente. O prāṇāyāma equilibra a energia vital para que ela flua sem obstrução. A meditação trabalha a mente para que ela possa, eventualmente, conhecer a si mesma.',
      'Esse caminho foi descrito há mais de dois mil anos por Patañjali em oito etapas progressivas — do comportamento ético até os estados mais profundos de consciência. Não ensinamos essas oito etapas como teoria. Ensinamos como prática viva, aula a aula.',
      'Se você veio procurando uma aula de alongamento com música relaxante, este provavelmente não é o lugar certo. Se você veio procurando entender o que a mente é, como ela funciona, e o que é possível quando ela para de ditar as regras — você está no lugar certo.',
    ],
    secoes: [],
  },
  {
    id: 'jornada',
    titulo: 'Sua Jornada',
    icone: '🌱',
    intro: [
      'Yoga não produz resultados imediatos. Isso não é uma limitação — é uma característica do sistema. O que muda com a prática consistente é estrutural, não superficial. E estrutura leva tempo.',
    ],
    secoes: [
      { titulo: 'Primeiro mês', texto: 'Você aprende a lógica da aula — por que ela começa do jeito que começa, por que termina do jeito que termina, o que cada parte está fazendo. O corpo começa a reconhecer o padrão e a responder a ele. Você ainda não sabe o que é yoga, mas começa a sentir que existe um sistema por trás do que está fazendo.' },
      { titulo: 'Três meses', texto: 'Você começa a perceber a mente durante a prática — não só o corpo. Percebe quando está distraído, quando está resistindo, quando está presente. Essa percepção é o início do trabalho real. As posturas deixam de ser o objetivo e passam a ser o instrumento.' },
      { titulo: 'Seis meses', texto: 'A prática começa a aparecer fora da aula. Você nota padrões de comportamento que antes passavam despercebidos. A relação com o desconforto muda — não porque você se tornou mais tolerante, mas porque passou a observar em vez de reagir. Você começa a entender na prática o que Patañjali descreve como o controle das modificações da mente.' },
      { titulo: 'Um ano ou mais', texto: 'Yoga deixa de ser algo que você faz e começa a ser algo que você tem. Um vocabulário interno. Uma forma de se relacionar com a experiência. Os oito passos do sistema de Patañjali — que pareciam teoria no início — passam a fazer sentido como mapa de algo que você está vivendo.' },
    ],
    outro: 'Esse percurso não é linear e não tem prazo fixo. Depende da frequência, da atenção e do comprometimento com o estudo — não só com a prática física. É por isso que o Dharma Phala existe: para que o que acontece na aula continue acontecendo fora dela.',
  },
  {
    id: 'estrutura',
    titulo: 'Estrutura da Aula',
    icone: '🧘',
    intro: [
      'Cada aula no Espaço Autonomia segue uma estrutura fixa. Não por hábito — por lógica. Cada etapa prepara o terreno para a próxima. Retirar qualquer uma é como pular um degrau: você avança mais rápido, mas com menos estabilidade.',
    ],
    secoes: [
      { titulo: 'Dharana', texto: 'A aula começa com Dharana — a retenção da atenção sobre um único ponto. Não é apenas preparação: Dharana é a primeira etapa do Samyama, o processo meditativo descrito por Patañjali, e já é em si uma forma primitiva de meditação. O que ela faz na prática: interrompe o fluxo automático de pensamentos e direciona a mente para o que está acontecendo aqui.' },
      { titulo: 'Sankalpa', texto: 'Com a atenção retida, você define uma intenção para a prática. Não um desejo vago — um propósito específico, alinhado com onde você está na jornada. O Sankalpa transforma a aula de um exercício em um ato consciente.' },
      { titulo: 'Mantra a Patañjali', texto: 'O mantra entoado antes da prática é dedicado a Patañjali, o sistematizador do yoga. Não é decoração nem ritual vazio — é um instrumento de concentração que a tradição usa para calibrar o estado interno antes do trabalho começar. Cantado com atenção, ele aprofunda o estado iniciado pelo Dharana.' },
      { titulo: 'Satkarma — Kriyā', texto: 'As kriyās são técnicas de limpeza do corpo e do prāṇa. Elas removem o que obstrui antes de começar a construir. Sem essa etapa, o trabalho posterior acontece sobre um terreno não preparado.' },
      { titulo: 'Sūrya Namaskār', texto: 'A saudação ao sol é uma sequência de aquecimento sistematizada no início do século XX por Bhawanrao Pratinidhi e posteriormente incorporada ao yoga. Prepara o corpo para as posturas — articulações, musculatura e respiração. É eficaz como preparação, sem precisar ser mais do que isso.' },
      { titulo: 'Āsana', texto: 'As posturas trabalham o corpo para que o corpo não seja um obstáculo para a mente. Flexibilidade, força e equilíbrio são consequências — não objetivos. O objetivo é que você consiga permanecer estável e atento sem que o corpo exija mais atenção do que a prática.' },
      { titulo: 'Prāṇāyāma', texto: 'O prāṇāyāma trabalha o prāṇa śakti — a energia vital que sustenta os processos do corpo. Não é respiração profunda nem técnica de relaxamento. É um trabalho preciso sobre o fluxo energético que, quando equilibrado, cria as condições para que a manas śakti — a energia que governa a mente — também se estabilize.' },
      { titulo: 'Meditação — Yoga Nidrā e transmissão de conceitos', texto: 'A etapa final é onde o trabalho do yoga começa de verdade — depois que corpo e mente foram equilibrados pelo que veio antes. Às vezes é Yoga Nidrā, estado de consciência entre o sono e a vigília onde a absorção é profunda. Às vezes é a transmissão de conceitos da tradição. Em ambos os casos, o que acontece aqui só é possível porque tudo o que veio antes criou as condições para isso.' },
      { titulo: 'Mantras finais', texto: 'A aula encerra com mantras da tradição: Asato Mā, Pūrṇam, Hari Om, Śrī Gurubhyo Namaḥ, Āditya Hṛdayam, Om Gaṃ Gaṇapataye Namaḥ, Om Klīm Kālikāyai Namaḥ e Om Namaḥ Śivāya. Cada um tem significado e contexto específicos — você os encontra com pronúncia correta e explicação completa no Nāda Mandir.' },
    ],
    outro: null,
  },
]

function _renderSubpagina(idx) {
  const s = SUBPAGINAS[idx]
  const introHtml = s.intro.map(p =>
    `<p style="font-size:14px;color:var(--txt);line-height:1.85;margin:0 0 14px">${p}</p>`
  ).join('')

  const secoesHtml = s.secoes.map(sec => `
    <div style="margin-bottom:16px">
      <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:500;color:var(--verde);margin-bottom:6px">${sec.titulo}</div>
      <p style="font-size:14px;color:var(--txt);line-height:1.85;margin:0">${sec.texto}</p>
    </div>
  `).join('')

  const outroHtml = s.outro
    ? `<div style="background:var(--verde);border-radius:12px;padding:18px 20px;margin-top:4px">
         <p style="font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;color:var(--bege);line-height:1.7;margin:0">${s.outro}</p>
       </div>`
    : ''

  return `
    <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:20px;margin-bottom:16px">
      ${introHtml}
      ${s.secoes.length ? `<div style="border-top:1px solid var(--borda);margin-top:4px;padding-top:16px">${secoesHtml}</div>` : ''}
    </div>
    ${outroHtml}
  `
}

export async function renderNossaPratica(container, page) {
  let abaAtiva = window._nossaPraticaAba ?? 0

  function render() {
    const tabsHtml = SUBPAGINAS.map((s, idx) => `
      <button onclick="window._npMudarAba(${idx})"
        style="padding:8px 16px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;
               font-family:'DM Sans',sans-serif;white-space:nowrap;border:1px solid ${idx===abaAtiva?'var(--verde)':'var(--borda)'};
               background:${idx===abaAtiva?'var(--verde)':'#fff'};color:${idx===abaAtiva?'var(--bege)':'var(--txt)'}">
        ${s.icone} ${s.titulo}
      </button>
    `).join('')

    container.innerHTML = `
      <div class="topbar"><div class="topbar-t">Nossa Prática</div></div>
      <div class="content">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">${tabsHtml}</div>
        <div id="np-conteudo">${_renderSubpagina(abaAtiva)}</div>
      </div>
    `
    uiAnimar(container)
  }

  window._npMudarAba = function(idx) {
    abaAtiva = idx
    window._nossaPraticaAba = idx
    render()
  }

  render()
}
