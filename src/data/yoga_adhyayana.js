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
  numero:    155,
  data:      '22/06/2026',
  categoria: 'Estudo de Āsanas',
  tema:      'Śalabhāsana — Postura do Gafanhoto',
  nivel:     'Intermediário',
  imagem:    'https://i.imgur.com/EZxD4lE.jpeg',

  citacao: 'Śalabhāsana ensina a elevar sem romper a base. Esforço sem integração vira compressão; potência sem consciência vira desgaste.',

  nivel_descricao: 'Exige força na cadeia posterior, consciência lombopélvica e capacidade de sustentar a elevação sem colapsar a coluna.',

  secoes: [
    {
      id:     'koshas',
      titulo: 'Koshas estimulados',
      icone:  'ti-circle-dotted',
      cor:    '#1D9E75',
      itens: [
        { termo: 'Annamaya',     desc: 'fortalecimento de lombar, glúteos, posteriores de coxa e musculatura paravertebral' },
        { termo: 'Prāṇamaya',   desc: 'ativação do eixo posterior e intensificação da circulação energética no tronco' },
        { termo: 'Manomaya',    desc: 'desenvolvimento de foco, persistência e presença sob esforço' },
        { termo: 'Vijñānamaya', desc: 'refinamento da percepção entre sustentação, compressão e expansão' },
      ],
    },
    {
      id:     'vayus',
      titulo: 'Vāyus ativados',
      icone:  'ti-wind',
      cor:    '#378ADD',
      itens: [
        { termo: 'Udāna Vāyu',  desc: 'elevação e sustentação do corpo contra a gravidade' },
        { termo: 'Samāna Vāyu', desc: 'integração do centro abdominal para estabilizar a postura' },
        { termo: 'Vyāna Vāyu',  desc: 'distribuição da força ao longo do eixo corporal' },
      ],
    },
    {
      id:     'chakras',
      titulo: 'Chakras envolvidos',
      icone:  'ti-rotate-clockwise',
      cor:    '#7F77DD',
      itens: [
        { termo: 'Maṇipūra',      desc: 'ativação do centro de força e sustentação' },
        { termo: 'Svādhiṣṭhāna', desc: 'mobilização da energia pélvica' },
        { termo: 'Anāhata',       desc: 'expansão indireta da região torácica pela ação posterior' },
      ],
    },
    {
      id:     'doshas',
      titulo: 'Doshas favorecidos',
      icone:  'ti-scale',
      cor:    '#BA7517',
      itens: [
        { termo: 'Kapha', desc: 'reduzido pela ativação muscular e aumento de calor' },
        { termo: 'Vāta',  desc: 'estabilizado quando a postura é sustentada com base abdominal' },
        { termo: 'Pitta', desc: 'pode aumentar se houver excesso de intensidade ou tensão respiratória' },
      ],
    },
    {
      id:     'elementos',
      titulo: 'Elementos (Tattvas)',
      icone:  'ti-leaf',
      cor:    '#639922',
      itens: [
        { termo: 'Fogo',  desc: 'potência, transformação e ativação metabólica' },
        { termo: 'Terra', desc: 'sustentação estrutural e firmeza' },
        { termo: 'Ar',    desc: 'expansão do tórax e circulação energética' },
      ],
    },
  ],

  reflexao: 'Como você sustenta o esforço sem perder a base? Onde na sua prática — e na sua vida — você tende a elevar sem antes enraizar?',
}    
