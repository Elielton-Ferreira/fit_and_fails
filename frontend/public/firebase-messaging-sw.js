importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCs7ZOvyKs60ok9oOnhzSZpobHrDZcEhRA',
  authDomain: 'fitfails.firebaseapp.com',
  projectId: 'fitfails',
  storageBucket: 'fitfails.firebasestorage.app',
  messagingSenderId: '606322726116',
  appId: '1:606322726116:web:900434093a9b1556c5c8f1',
  measurementId: 'G-45V6Q2DSWZ'
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  // Se o payload já vem com `notification`, o FCM pode exibir automaticamente no browser.
  // Mostrar manualmente aqui pode gerar duplicidade.
  if (payload.notification) return

  const data = payload.data || {}
  const title = data.title || 'Fit & Fails'
  const body = data.body || 'Nova atualização'
  const icon = data.icon || (data.type === 'water_reminder' ? '/notification-water.svg' : undefined)
  const options = {
    body,
    data,
    icon,
    tag: data.postId ? `post-${data.postId}` : undefined,
    renotify: false
  }
  self.registration.showNotification(title, options)
})

const resolveNotificationData = (raw) => {
  if (!raw) return {}
  // Para notificações geradas automaticamente pelo FCM, o payload pode vir aninhado.
  if (raw.FCM_MSG && raw.FCM_MSG.data) return raw.FCM_MSG.data
  if (raw.data && typeof raw.data === 'object') return raw.data
  return raw
}

const resolveTargetUrl = (data) => {
  if (!data) return '/dashboard#feed'
  if (data.url) return data.url
  if (data.postId) return `/dashboard#post-${data.postId}`
  if (data.type === 'water_reminder') return '/water'
  return '/dashboard#feed'
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = resolveNotificationData(event.notification.data)
  const target = resolveTargetUrl(data)
  const url = new URL(target, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            return client.navigate(url).then(() => client.focus())
          }
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
