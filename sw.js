// ── Espaço Autonomia — Service Worker v2 ──────────────────
const CACHE = 'ea-v2'
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Network first — sempre busca versão mais nova
self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co') ||
      e.request.url.includes('esm.sh') ||
      e.request.url.includes('accounts.google.com') ||
      e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('cdn.jsdelivr.net')) {
    return
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Espaço Autonomia', {
      body: data.body || 'Você tem uma aula em breve!',
      icon: './assets/Logo Vertical (3).png',
      data: { url: data.url || './' }
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || './'))
})
