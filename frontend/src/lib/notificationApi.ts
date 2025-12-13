import axios from 'axios'

const NOTIFICATION_BASE = import.meta.env.VITE_NOTIFICATION_URL ?? 'http://localhost:4100'

const notificationApi = axios.create({
  baseURL: NOTIFICATION_BASE,
  timeout: 10000
})

notificationApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Erro ao comunicar com notificações'
    return Promise.reject(new Error(message))
  }
)

export default notificationApi
