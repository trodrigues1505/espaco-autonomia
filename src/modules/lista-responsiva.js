/**
 * src/modules/lista-responsiva.js
 * No celular, listas em "tabela" (cabeçalho + linhas com colunas de largura fixa) viram CARTÕES de 2 colunas,
 * cada célula com o rótulo da sua coluna, em vez de rolar para o lado e cortar ações.
 *
 * Como funciona (sem editar as ~16 telas): detecta um cabeçalho (grade com colunas em px, texto em caixa-alta) e as
 * linhas seguintes com as MESMAS colunas; marca o cabeçalho com .lista-cab e cada linha com .lista-linha, e copia o
 * texto de cada coluna do cabeçalho para data-label da célula correspondente. O CSS (componentes.css, só em telas
 * <= 768px) esconde o cabeçalho e mostra o rótulo antes de cada célula. No desktop nada muda.
 */
const rotulo = el => el.textContent.replace(/[\u2191\u2193]/g, '').replace(/\s+/g, ' ').trim()

function colunasPx(el) {
  const c = el.style.gridTemplateColumns
  return c && /\d+px/.test(c) ? c : ''
}

export function aprimorarListas(raiz = document) {
  for (const cab of raiz.querySelectorAll('[style*="grid-template-columns"]')) {
    if (cab.style.textTransform !== 'uppercase') continue          // cabeçalhos são sempre caixa-alta
    const colunas = colunasPx(cab)
    if (!colunas) continue

    let linhas = []
    for (let s = cab.nextElementSibling; s && s.style.gridTemplateColumns === colunas; s = s.nextElementSibling) linhas.push(s)
    if (!linhas.length && cab.nextElementSibling)                    // linhas dentro de um contêiner logo após o cabeçalho
      linhas = [...cab.nextElementSibling.children].filter(x => x.style.gridTemplateColumns === colunas)
    if (!linhas.length) continue

    cab.classList.add('lista-cab')
    const rotulos = [...cab.children].map(rotulo)
    for (const linha of linhas) {
      linha.classList.add('lista-linha')
      ;[...linha.children].forEach((cel, i) => { if (rotulos[i]) cel.dataset.label = rotulos[i] })
    }
    // contêineres com min-width fixo (ex.: 520px) forçariam rolagem lateral
    for (let p = cab.parentElement, n = 0; p && n < 3; p = p.parentElement, n++)
      if (/min-width:\s*\d{3}px/.test(p.getAttribute('style') || '')) p.classList.add('lista-pai')
  }
}

let quadro = 0
new MutationObserver(() => { cancelAnimationFrame(quadro); quadro = requestAnimationFrame(() => aprimorarListas()) })
  .observe(document.body, { childList: true, subtree: true })
aprimorarListas()
