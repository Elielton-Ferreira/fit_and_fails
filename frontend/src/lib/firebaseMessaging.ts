import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, isSupported, Messaging, onMessage } from 'firebase/messaging'
import notificationApi from './notificationApi'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

let messagingInstance: Messaging | null = null
let foregroundListenerAttached = false

const resolveTargetUrl = (data?: Record<string, unknown>) => {
  if (!data) return '/dashboard#feed'

  const maybeUrl = data.url
  if (typeof maybeUrl === 'string' && maybeUrl) return maybeUrl

  const maybePostId = data.postId
  if (typeof maybePostId === 'string' && maybePostId) return `/dashboard#post-${maybePostId}`

  if (data.type === 'water_reminder') return '/water'
  return '/dashboard#feed'
}

const ensureFirebase = () => {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) throw new Error('Firebase config faltando no frontend')
  if (!getApps().length) {
    initializeApp(firebaseConfig)
  }
}

const ensureMessaging = async () => {
  if (messagingInstance) return messagingInstance
  const supported = await isSupported()
  if (!supported) throw new Error('Navegador não suporta Web Push')
  ensureFirebase()
  messagingInstance = getMessaging()
  return messagingInstance
}

export const registerPushDevice = async (userId: string) => {
  if (!('Notification' in window)) throw new Error('Browser não suporta notificações')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permissão de notificação negada')

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) throw new Error('VAPID key não configurada (VITE_FIREBASE_VAPID_KEY)')

  const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  const messaging = await ensureMessaging()
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration })

  if (!token) throw new Error('Não foi possível obter token de push')

  await notificationApi.post('/devices', {
    userId,
    token,
    platform: 'web',
    appVersion: 'web'
  })

  return token
}

export const setupForegroundNotifications = async () => {
  const messaging = await ensureMessaging()
  if (foregroundListenerAttached) return
  foregroundListenerAttached = true

  onMessage(messaging, (payload) => {
    const data = payload.data || {}
    const notification = payload.notification || {}
    const title = notification.title || data.title || 'Fit & Fails'
    const body = notification.body || data.body || 'Nova atualização'
    if (Notification.permission === 'granted') {
      // Mostra uma notificação simples quando a aba está em foco
      const target = resolveTargetUrl(data)
      const notif = new Notification(title, {
        body,
        data,
        tag: data.postId ? `post-${data.postId}` : undefined,
        renotify: false
      })

      notif.onclick = () => {
        notif.close()
        window.focus()
        window.location.assign(target)
      }
    }
  })
}
