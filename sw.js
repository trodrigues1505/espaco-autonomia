// ── Espaço Autonomia — Service Worker v4 ─────────────────────
const CACHE = 'ea-v4'
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/styles/main.css',
  './src/lib/supabase.js',
  './src/modules/utils.js',
  './src/modules/navigation.js',
  './src/modules/auth.js',
  './src/modules/contrato.js',
  './src/modules/gamificacao.js',
  './src/modules/lgpd.js',
  './src/modules/professor-cancel.js',
  './src/modules/pwa.js',
  './src/pages/index.js',
  './src/pages/institucional.js',
  './src/pages/timeline.js',
  './src/pages/admin/dashboard.js',
  './src/pages/admin/config.js',
  './src/pages/admin/criar_aulas.js',
  './src/pages/admin/alunos.js',
  './src/pages/admin/presencas.js',
  './src/pages/admin/professores.js',
  './src/pages/admin/planos.js',
  './src/pages/admin/pagamentos.js',
  './src/pages/admin/grade.js',
  './src/pages/admin/previsao-professor.js',
  './src/pages/admin/jnana.js',
  './src/pages/professor/home.js',
  './src/pages/professor/aulas.js',
  './src/pages/professor/repasse.js',
  './src/pages/aluno/home.js',
  './src/pages/aluno/grade.js',
  './src/pages/aluno/minhas.js',
  './src/pages/aluno/plano.js',
  './src/pages/aluno/conquistas.js',
  './src/pages/aluno/beneficios.js',
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
