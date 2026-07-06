/**
 * src/data/asana_marga.js
 * Conteúdo semanal do Asana Marga — Aula Prática.
 *
 * COMO ATUALIZAR SEMANALMENTE:
 * 1. Edite AULA_PRATICA (aula 1, livre para todos) com o conteúdo da semana
 * 2. Edite AULA_PRATICA_2 (aula 2, restrita a shiva_1x/shiva_2x/vishnu_2x/vishnu_livre)
 * 3. Faça commit e push no GitHub
 *
 * MIGRAÇÃO FUTURA:
 * Quando o banco de dados estiver pronto, este arquivo será substituído
 * por uma query em `aulas_praticas` com a mesma estrutura de campos.
 */
export const AULA_PRATICA = {
  numero:      156,
  data:        '29/06/2026',
  modalidade:  'Hatha Yoga',
  duracao:     '60 minutos',
  nivel:       'Novatos',
  link_tummee: 'https://www.tummee.com/yoga-sequence/1Nxwv?lyid=JW5JB',
  descricao: 'Aula de posturas predominantemente relaxantes e energizantes, destinada a novatos, com foco principal em alongamento e flexão para frente com ênfase em trabalho de quadríceps, inferior de costas, glúteo, músculos isquiotibiais e quadris.',
  introducao: [
    { termo: 'Dharana',          desc: 'Retenha os sentidos. Concentre-se na respiração, emoções e pensamentos.' },
    { termo: 'Sankalpa',         desc: 'Defina seu propósito. Planeje com Shiva. Fortaleça-se com Shakti.' },
    { termo: 'Mantra',           desc: 'Entoe o mantra à Patanjali · 1 vez' },
    { termo: 'Satkarma (Kriya)', desc: 'Kapalrandha · 1 ciclo' },
    { termo: 'Aquecimento',      desc: 'Surya Namaskar · Saudação ao Sol · 3 repetições' },
  ],
  pranayama: [
    { termo: 'Antar Trataka', desc: 'Sentado, feche os olhos, projete uma tela preta à sua frente, no centro dessa tela projete uma imagem de sua escolha e mantenha essa imagem nítida durante 2 a 5 minutos.' },
  ],
  mantra: [
    { termo: 'Hari Om', desc: '1 vez' },
  ],
  leitura_energetica: {
    koshas:  ['Annamaya', 'Pranamaya', 'Manomaya', 'Vijnana', 'Anandamaya'],
    cakras:  ['Muladhara', 'Svadisthana', 'Manipura', 'Anahata', 'Vishuddha', 'Ajna', 'Sahasrara'],
    gunas:   ['Rajas', 'Sattva', 'Tamas'],
  },
}

// ── Aula 2 — restrita a shiva_1x, shiva_2x, vishnu_2x, vishnu_livre ──
// PREENCHA com o conteúdo real da segunda aula. Estrutura idêntica à AULA_PRATICA.
export const AULA_PRATICA_2 = {
  numero:      156,
  data:        '29/06/2026',
  modalidade:  'Hatha Yoga',
  duracao:     '60 minutos',
  nivel:       'Intermediário',
  link_tummee: 'https://www.tummee.com/yoga-sequence/SUBSTITUA',
  descricao: 'PREENCHA — descrição da segunda aula.',
  introducao: [
    { termo: 'Dharana', desc: 'PREENCHA' },
  ],
  pranayama: [
    { termo: 'PREENCHA', desc: 'PREENCHA' },
  ],
  mantra: [
    { termo: 'PREENCHA', desc: 'PREENCHA' },
  ],
  leitura_energetica: {
    koshas:  ['Annamaya', 'Pranamaya', 'Manomaya', 'Vijnana', 'Anandamaya'],
    cakras:  ['Muladhara', 'Svadisthana', 'Manipura', 'Anahata', 'Vishuddha', 'Ajna', 'Sahasrara'],
    gunas:   ['Rajas', 'Sattva', 'Tamas'],
  },
}
