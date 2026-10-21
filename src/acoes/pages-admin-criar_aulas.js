// GERADO por refatora-handlers.mjs a partir de pages/admin/criar_aulas.js — funções dos antigos atributos on*="…" (original em comentário).
// Roda no escopo do módulo SEM variáveis locais: identificadores resolvem para globais (window), como num handler inline.
import { registrar } from '../modules/acoes.js'

registrar('pages-admin-criar_aulas', {
  // onclick="gerarOcorrenciasAula('${…}')"
  1: function (event, a) {
    gerarOcorrenciasAula(a[0])
  },

  // onclick="editarAula('${…}')"
  2: function (event, a) {
    editarAula(a[0])
  },

  // onclick="excluirAula('${…}')"
  3: function (event, a) {
    excluirAula(a[0])
  },

  // onchange="toggleTipoAula()"
  4: function (event, a) {
    toggleTipoAula()
  },

  // onclick="document.getElementById('modal-criar-aula').style.display='none'"
  5: function (event, a) {
    document.getElementById('modal-criar-aula').style.display='none'
  },

  // onclick="salvarNovaAula()"
  6: function (event, a) {
    salvarNovaAula()
  },

  // onclick="document.getElementById('modal-gerar').style.display='none'"
  7: function (event, a) {
    document.getElementById('modal-gerar').style.display='none'
  },

  // onclick="executarGerarOcorrencias()"
  8: function (event, a) {
    executarGerarOcorrencias()
  },

  // onclick="gerarTodasPendentes()"
  9: function (event, a) {
    gerarTodasPendentes()
  },

  // onclick="abrirModalRedundancias()"
  10: function (event, a) {
    abrirModalRedundancias()
  },

  // onclick="window._criarFiltroMod='';window._criarFiltroProf='';window._criarFiltroStat='';window._criarFiltroDia='';wind"
  11: function (event, a) {
    window._criarFiltroMod='';window._criarFiltroProf='';window._criarFiltroStat='';window._criarFiltroDia='';window._criarFiltroHora='';navigate('criar-aulas')
  },

  // onclick="document.getElementById('modal-criar-aula').style.display='flex'"
  12: function (event, a) {
    document.getElementById('modal-criar-aula').style.display='flex'
  },

  // onchange="window._criarFiltroMod=this.value;navigate('criar-aulas')"
  13: function (event, a) {
    window._criarFiltroMod=this.value;navigate('criar-aulas')
  },

  // onchange="window._criarFiltroProf=this.value;navigate('criar-aulas')"
  14: function (event, a) {
    window._criarFiltroProf=this.value;navigate('criar-aulas')
  },

  // onchange="window._criarFiltroDia=this.value;navigate('criar-aulas')"
  15: function (event, a) {
    window._criarFiltroDia=this.value;navigate('criar-aulas')
  },

  // onchange="window._criarFiltroHora=this.value;navigate('criar-aulas')"
  16: function (event, a) {
    window._criarFiltroHora=this.value;navigate('criar-aulas')
  },

  // onchange="window._criarFiltroStat=this.value;navigate('criar-aulas')"
  17: function (event, a) {
    window._criarFiltroStat=this.value;navigate('criar-aulas')
  },

  // onclick="excluirAulaRedundante('${…}')"
  18: function (event, a) {
    excluirAulaRedundante(a[0])
  },
})
