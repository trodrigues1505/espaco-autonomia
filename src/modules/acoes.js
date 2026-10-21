/**
 * src/modules/acoes.js
 * Despacho de eventos por DELEGAÇÃO. Substitui os atributos onclick="…", onchange="…" etc.
 *
 * Como funciona: onde havia  <button onclick="excluir('${id}')">  agora há
 *   <button data-h-click="pages-admin-alunos.7" data-a-click='["<id>"]'>
 * A função correspondente fica em src/acoes/<arquivo>.js (registrada com registrar()) e é chamada aqui,
 * com this = elemento que tem o atributo, o evento como 1º argumento e os valores interpolados (JSON) como 2º.
 * Preserva: this, event, event.stopPropagation() (sobe pelos ancestrais respeitando cancelBubble) e
 * "return false" (= preventDefault). Isso permite uma CSP sem 'unsafe-inline' em script-src: um atributo
 * on*= injetado (<img onerror=…>) deixa de executar, pois só existem os handlers registrados aqui.
 */
const registro = new Map()

// Handler embutido: chama uma função GLOBAL pelo nome — data-h-click="@global" data-a-click='["nome", arg1, …]'.
// Usado onde o nome da função é montado em tempo de execução (ex.: _step_<prefixo>), como antes: window[nome](…args).
registro.set('@global', function (event, a) {
  const [nome, ...resto] = a
  const f = window[nome]
  if (typeof f === 'function') return f.apply(window, resto)
  console.warn('Função global não encontrada:', nome)
})

export function registrar(prefixo, mapa) {
  for (const [k, f] of Object.entries(mapa)) registro.set(`${prefixo}.${k}`, f)
}

// true = fase de captura (eventos que não borbulham)
const TIPOS = { click: false, change: false, input: false, keydown: false, keyup: false,
                mouseover: false, mouseout: false, focus: true, blur: true, error: true, load: true }

function despachar(tipo, e) {
  let el = e.target instanceof Element ? e.target : e.target?.parentElement
  const attr = 'data-h-' + tipo
  while (el) {
    const chave = el.getAttribute?.(attr)
    if (chave) {
      const fn = registro.get(chave)
      if (!fn) {
        console.warn('Handler não registrado:', chave)
      } else {
        let args = []
        const bruto = el.getAttribute('data-a-' + tipo)
        if (bruto) { try { args = JSON.parse(bruto) } catch { args = [] } }
        try {
          if (fn.call(el, e, args) === false) e.preventDefault()
        } catch (erro) {
          queueMicrotask(() => { throw erro })      // mantém o erro visível (como num handler inline)
        }
      }
      if (e.cancelBubble) break                      // event.stopPropagation() dentro do handler
    }
    el = el.parentElement
  }
}

if (!window.__acoesPronto) {                         // idempotente: um único conjunto de ouvintes
  window.__acoesPronto = true
  for (const [tipo, captura] of Object.entries(TIPOS)) document.addEventListener(tipo, e => despachar(tipo, e), captura)
}
