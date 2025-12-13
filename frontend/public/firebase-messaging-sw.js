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
  const notification = payload.notification || {}
  const title = notification.title || 'Notificação'
  const options = {
    body: notification.body,
    data: payload.data || {}
  }
  self.registration.showNotification(title, options)
})
