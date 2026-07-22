/**
 * src/pages/aluno/vocabulario.js
 * Śabda Kośa — visão de leitura do aluno (só consulta, sem CRUD).
 * O cadastro/edição continua em src/pages/admin/vocabulario.js.
 */

import { uiAnimar } from '../../modules/ui.js'

export async function renderVocabularioAluno(container, page) {
  const sb = window._sb

  const { data: termos, error } = await sb
    .from('vocabulario')
    .select('termo,definicao')
    .order('termo', { ascending: true })

  if (error) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Śabda Kośa</div></div>
      <div class="content"><p style="color:#c0392b;font-size:13px">Erro: ${error.message}</p></div>`
    return
  }

  function renderLista(lista) {
    if (!lista.length) {
      return `<div style="text-align:center;padding:40px 20px;color:var(--txt2)">
        <div style="font-size:32px;margin-bottom:10px">📖</div>
        <div style="font-size:13px">Nenhum termo encontrado.</div>
      </div>`
    }
    return lista.map(t => `
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:14px 16px;margin-bottom:10px">
        <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:500;color:var(--verde);margin-bottom:4px">${_esc(t.termo)}</div>
        <div style="font-size:13px;color:var(--txt);line-height:1.6;white-space:pre-line">${_esc(t.definicao)}</div>
      </div>`).join('')
  }

  function _esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Śabda Kośa</div>
    </div>
    <div class="content">
      <div style="background:rgba(31,56,31,.04);border:1px solid rgba(31,56,31,.12);border-radius:6px;padding:9px 13px;font-size:12px;color:var(--verde);margin-bottom:14px;display:flex;align-items:center;gap:8px">
        <i class="ti ti-info-circle"></i>
        <span>Glossário de termos usados no Dharma Phala. Esses mesmos termos também ficam clicáveis automaticamente onde aparecem nos textos do app.</span>
      </div>
      <input id="voc-busca" type="text" placeholder="Buscar termo..."
        style="width:100%;border:1px solid var(--borda);border-radius:6px;padding:9px 12px;font-size:13px;
               font-family:'DM Sans',sans-serif;outline:none;margin-bottom:14px;box-sizing:border-box">
      <div id="voc-lista-container">${renderLista(termos || [])}</div>
    </div>
  `

  uiAnimar(container)

  document.getElementById('voc-busca')?.addEventListener('input', function() {
    const busca = this.value.trim().toLowerCase()
    const filtrados = !busca ? (termos || []) : (termos || []).filter(t =>
      t.termo.toLowerCase().includes(busca) || t.definicao.toLowerCase().includes(busca)
    )
    document.getElementById('voc-lista-container').innerHTML = renderLista(filtrados)
  })
}
