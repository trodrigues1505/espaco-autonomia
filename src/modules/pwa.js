/**
 * src/modules/pwa.js
 * Responsabilidade: registro do Service Worker e banner de instalação PWA.
 */

export function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW registrado:', reg.scope))
        .catch(err => console.log('SW erro:', err))
    })
  }

  window._deferredPrompt = null

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    window._deferredPrompt = e
    if (!localStorage.getItem('pwa-dispensado')) {
      setTimeout(() => document.getElementById('pwa-banner')?.classList.add('show'), 3000)
    }
  })

  window.addEventListener('appinstalled', () => {
    document.getElementById('pwa-banner')?.classList.remove('show')
    window._deferredPrompt = null
  })
}

window.instalarPWA = async function () {
  if (!window._deferredPrompt) return
  document.getElementById('pwa-banner')?.classList.remove('show')
  window._deferredPrompt.prompt()
  await window._deferredPrompt.userChoice
  window._deferredPrompt = null
}

window.dispensarPWA = function () {
  document.getElementById('pwa-banner')?.classList.remove('show')
  localStorage.setItem('pwa-dispensado', '1')
}
