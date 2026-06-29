/**
 * src/data/yoga_adhyayana.js
 * Conteúdo semanal do Yoga Adhyayana.
 *
 * COMO ATUALIZAR SEMANALMENTE:
 * 1. Edite os campos abaixo com o conteúdo da nova aula
 * 2. Faça commit e push no GitHub
 * 3. O conteúdo atualiza automaticamente para todos os alunos
 */
export const AULA_SEMANA = {
  numero:    156,
  data:      '29/06/2026',
  categoria: 'Estudo de Āsanas',
  tema:      'Makarāsana — Postura do Crocodilo',
  nivel:     'Novato',
  imagem:    'https://i.imgur.com/UOiQnEv.png',
  citacao: 'Makarāsana ensina que o verdadeiro descanso nasce da presença consciente. Relaxamento sem atenção vira sonolência; atenção sem relaxamento vira tensão.',
  nivel_descricao: 'Postura simples na execução, porém profunda em seus efeitos sobre a respiração, a coluna e o sistema nervoso. Frequentemente utilizada como postura restaurativa e de integração.',
  secoes: [
    {
      id:     'koshas',
      titulo: 'Koshas estimulados',
      icone:  'ti-circle-dotted',
      cor:    '#1D9E75',
      itens: [
        { termo: 'Annamaya',     desc: 'relaxamento da musculatura paravertebral, ombros e região lombar' },
        { termo: 'Prāṇamaya',   desc: 'harmonização da respiração e do fluxo de prāṇa' },
        { termo: 'Manomaya',    desc: 'redução da atividade mental e das tensões emocionais' },
        { termo: 'Vijñānamaya', desc: 'desenvolvimento da atenção plena e da observação interior' },
        { termo: 'Ānandamaya',  desc: 'favorece estados de profundo repouso e serenidade' },
      ],
    },
    {
      id:     'vayus',
      titulo: 'Vāyus ativados',
      icone:  'ti-wind',
      cor:    '#378ADD',
      itens: [
        { termo: 'Prāṇa Vāyu',  desc: 'respiração mais ampla e consciente' },
        { termo: 'Samāna Vāyu', desc: 'equilíbrio do centro energético' },
        { termo: 'Vyāna Vāyu',  desc: 'distribuição harmoniosa da energia por todo o corpo' },
      ],
    },
    {
      id:     'chakras',
      titulo: 'Chakras envolvidos',
      icone:  'ti-rotate-clockwise',
      cor:    '#7F77DD',
      itens: [
        { termo: 'Maṇipūra', desc: 'relaxamento e reorganização do centro energético' },
        { termo: 'Anāhata',  desc: 'expansão suave da respiração' },
        { termo: 'Ājñā',     desc: 'favorece concentração e observação interior' },
      ],
    },
    {
      id:     'doshas',
      titulo: 'Doshas favorecidos',
      icone:  'ti-scale',
      cor:    '#BA7517',
      itens: [
        { termo: 'Vāta',  desc: 'fortemente equilibrado pelo relaxamento e estabilidade' },
        { termo: 'Pitta', desc: 'reduzido pela diminuição da tensão física e mental' },
        { termo: 'Kapha', desc: 'equilibrado quando associado à respiração consciente' },
      ],
    },
    {
      id:     'elementos',
      titulo: 'Elementos (Tattvas)',
      icone:  'ti-leaf',
      cor:    '#639922',
      itens: [
        { termo: 'Água',  desc: 'calma, adaptação e fluidez' },
        { termo: 'Terra', desc: 'sustentação e estabilidade' },
        { termo: 'Éter',  desc: 'silêncio e expansão da consciência' },
      ],
    },
    {
      id:     'origem',
      titulo: 'Origem',
      icone:  'ti-book',
      cor:    '#8B5E3C',
      itens: [
        { termo: 'Fonte clássica', desc: 'Descrita na Gheraṇḍa Saṁhitā (2.40) como uma das posturas do repertório clássico do Haṭha Yoga medieval.' },
        { termo: 'Simbolismo',     desc: 'O makara é uma criatura mítica da tradição indiana, frequentemente representada como um crocodilo ou ser aquático híbrido, simbolizando força serena, adaptação e domínio das águas profundas.' },
        { termo: 'Essência',       desc: 'Tradicionalmente, a postura representa a capacidade de permanecer completamente relaxado sem perder o estado de alerta.' },
      ],
    },
    {
      id:     'beneficios',
      titulo: 'Benefícios',
      icone:  'ti-heart-filled',
      cor:    '#c0392b',
      itens: [
        { termo: 'Coluna',       desc: 'Alivia tensões na coluna, especialmente na região lombar.' },
        { termo: 'Musculatura',  desc: 'Favorece o relaxamento da musculatura posterior.' },
        { termo: 'Respiração',   desc: 'Melhora o padrão respiratório diafragmático.' },
        { termo: 'Recuperação',  desc: 'Auxilia na recuperação após posturas intensas.' },
        { termo: 'Energia',      desc: 'Dissolve tensões energéticas acumuladas.' },
        { termo: 'Pratyāhāra',  desc: 'Favorece o recolhimento da atenção (pratyāhāra).' },
        { termo: 'Estabilidade', desc: 'Desenvolve estabilidade emocional e serenidade.' },
        { termo: 'Integração',   desc: 'Integra os efeitos das práticas anteriores.' },
      ],
    },
    {
      id:     'terapeutico',
      titulo: 'Observações terapêuticas',
      icone:  'ti-stethoscope',
      cor:    '#5a7a5a',
      itens: [
        { termo: 'Indicação', desc: 'Uma das posturas mais indicadas para praticantes com tensão lombar, fadiga muscular ou excesso de estresse, desde que não haja dor aguda ou lesões recentes na coluna.' },
        { termo: 'Adaptação', desc: 'Pode ser adaptada com apoio sob o peito ou a testa para maior conforto.' },
        { termo: 'Sequência', desc: 'Excelente como postura de descanso entre retroflexões, permitindo que a musculatura posterior relaxe sem perder o alinhamento respiratório.' },
      ],
    },
  ],
  reflexao: 'Como você descansa sem perder a presença? Onde na sua prática — e na sua vida — você confunde relaxamento com ausência?',
}
