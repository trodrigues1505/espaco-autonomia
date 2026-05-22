// ── Espaço Autonomia — Service Worker ──────────────────────
const CACHE = 'ea-v1'
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/Logo Vertical (3).png',
  './assets/Logo horizontal (2).png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css',
]

// Instala e faz cache dos assets principais
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Estratégia: Network first, cache como fallback
self.addEventListener('fetch', e => {
  // Ignora chamadas ao Supabase (sempre precisam de rede)
  if (e.request.url.includes('supabase.co') ||
      e.request.url.includes('esm.sh') ||
      e.request.url.includes('accounts.google.com')) {
    return
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Salva no cache se for GET bem-sucedido
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request).then(cached => {
        if (cached) return cached
        // Offline fallback: mostra index.html
        return caches.match('./index.html')
      }))
  )
})

// Recebe push notification (para lembretes futuros)
self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Espaço Autonomia', {
      body: data.body || 'Você tem uma aula em breve!',
      icon: './assets/Logo Vertical (3).png',
      badge: './assets/Logo Vertical (3).png',
      vibrate: [200, 100, 200],
      data: { url: data.url || './' }
    })
  )
})

// Clique na notificação abre o app
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || './'))
})
