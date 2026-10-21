// ── Espaço Autonomia — Service Worker v8 ─────────────────────
const CACHE = 'ea-v8'
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/styles/main.css',
  './src/styles/componentes.css',
  './src/acoes/index-html.js',
  './src/acoes/modules-auth.js',
  './src/acoes/modules-contrato.js',
  './src/acoes/modules-navigation.js',
  './src/acoes/modules-notificacoes.js',
  './src/acoes/modules-utils.js',
  './src/acoes/modules-vocabulario.js',
  './src/acoes/notificacoes-acao.js',
  './src/acoes/pages-admin-adhyayana.js',
  './src/acoes/pages-admin-alunos.js',
  './src/acoes/pages-admin-asana.js',
  './src/acoes/pages-admin-config.js',
  './src/acoes/pages-admin-criar_aulas.js',
  './src/acoes/pages-admin-engajamento.js',
  './src/acoes/pages-admin-grade.js',
  './src/acoes/pages-admin-grantha.js',
  './src/acoes/pages-admin-jnana.js',
  './src/acoes/pages-admin-pagamentos.js',
  './src/acoes/pages-admin-planos.js',
  './src/acoes/pages-admin-presencas.js',
  './src/acoes/pages-admin-previsao-professor.js',
  './src/acoes/pages-admin-professores.js',
  './src/acoes/pages-admin-repasse-pago.js',
  './src/acoes/pages-admin-vinculos.js',
  './src/acoes/pages-admin-vocabulario.js',
  './src/acoes/pages-aluno-beneficios.js',
  './src/acoes/pages-aluno-grade.js',
  './src/acoes/pages-aluno-grantha.js',
  './src/acoes/pages-aluno-home.js',
  './src/acoes/pages-aluno-minhas.js',
  './src/acoes/pages-aluno-plano.js',
  './src/acoes/pages-institucional.js',
  './src/acoes/pages-professor-aulas.js',
  './src/acoes/pages-professor-home.js',
  './src/acoes/pages-professor-repasse.js',
  './src/acoes/pages-timeline.js',
  './src/antiframe.js',
  './src/data/asana_marga.js',
  './src/data/yoga_adhyayana.js',
  './src/lib/supabase.js',
  './src/main.js',
  './src/modules/acoes.js',
  './src/modules/agenda.js',
  './src/modules/auth.js',
  './src/modules/contrato.js',
  './src/modules/dialogs.js',
  './src/modules/gamificacao.js',
  './src/modules/lgpd.js',
  './src/modules/lista-responsiva.js',
  './src/modules/navigation.js',
  './src/modules/notificacoes.js',
  './src/modules/privacidade.js',
  './src/modules/professor-cancel.js',
  './src/modules/pwa.js',
  './src/modules/tour.js',
  './src/modules/ui.js',
  './src/modules/utils.js',
  './src/modules/vocabulario.js',
  './src/pages/admin/adhyayana.js',
  './src/pages/admin/alunos.js',
  './src/pages/admin/asana.js',
  './src/pages/admin/config.js',
  './src/pages/admin/criar_aulas.js',
  './src/pages/admin/dashboard.js',
  './src/pages/admin/engajamento.js',
  './src/pages/admin/grade.js',
  './src/pages/admin/grantha.js',
  './src/pages/admin/jnana.js',
  './src/pages/admin/pagamentos.js',
  './src/pages/admin/planos.js',
  './src/pages/admin/presencas.js',
  './src/pages/admin/previsao-professor.js',
  './src/pages/admin/professores.js',
  './src/pages/admin/repasse-pago.js',
  './src/pages/admin/vinculos.js',
  './src/pages/admin/vocabulario.js',
  './src/pages/aluno/beneficios.js',
  './src/pages/aluno/conquistas.js',
  './src/pages/aluno/grade.js',
  './src/pages/aluno/grantha.js',
  './src/pages/aluno/home.js',
  './src/pages/aluno/minhas.js',
  './src/pages/aluno/plano.js',
  './src/pages/aluno/vocabulario.js',
  './src/pages/index.js',
  './src/pages/institucional.js',
  './src/pages/professor/aulas.js',
  './src/pages/professor/cancel.js',
  './src/pages/professor/home.js',
  './src/pages/professor/repasse.js',
  './src/pages/timeline.js',
  './vendor/supabase-js.js',
  './vendor/fonts/fonts.css',
  './vendor/tabler/tabler-icons.min.css',
  './vendor/tabler/fonts/tabler-icons.woff2',
  './vendor/fonts/cormorant-garamond-latin-400-italic.woff2',
  './vendor/fonts/cormorant-garamond-latin-400-normal.woff2',
  './vendor/fonts/cormorant-garamond-latin-500-normal.woff2',
  './vendor/fonts/cormorant-garamond-latin-600-normal.woff2',
  './vendor/fonts/cormorant-garamond-latin-ext-400-italic.woff2',
  './vendor/fonts/cormorant-garamond-latin-ext-400-normal.woff2',
  './vendor/fonts/cormorant-garamond-latin-ext-500-normal.woff2',
  './vendor/fonts/cormorant-garamond-latin-ext-600-normal.woff2',
  './vendor/fonts/dm-sans-latin-300-normal.woff2',
  './vendor/fonts/dm-sans-latin-400-normal.woff2',
  './vendor/fonts/dm-sans-latin-500-normal.woff2',
  './vendor/fonts/dm-sans-latin-ext-300-normal.woff2',
  './vendor/fonts/dm-sans-latin-ext-400-normal.woff2',
  './vendor/fonts/dm-sans-latin-ext-500-normal.woff2',
]

// Precache resiliente: um asset com 404/erro não derruba a instalação inteira.
// Sem isso, cache.addAll() falha tudo-ou-nada e o SW novo nunca ativa,
// deixando um SW antigo (com outra lógica de cache) no controle da aba.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      const resultados = await Promise.allSettled(ASSETS.map(url => cache.add(url)))
      resultados.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.warn('[SW] Falha ao pré-cachear:', ASSETS[i], r.reason)
        }
      })
      return self.skipWaiting()
    })
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Network first — sempre busca versão mais nova
self.addEventListener('fetch', e => {
  // Não intercepta chamadas externas
  if (
    e.request.url.includes('supabase.co') ||
    e.request.url.includes('esm.sh') ||
    e.request.url.includes('accounts.google.com') ||
    e.request.url.includes('fonts.googleapis.com') ||
    e.request.url.includes('cdn.jsdelivr.net')
  ) return
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return res
      })
      .catch(() =>
        caches.match(e.request).then(cached => cached || caches.match('./index.html'))
      )
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Espaço Autonomia', {
      body: data.body || 'Você tem uma aula em breve!',
      icon: './assets/logo.png',
      data: { url: data.url || './' },
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || './'))
})      
