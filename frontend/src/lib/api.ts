import axios from 'axios'

const runtimeBaseUrl =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:4000` : 'http://localhost:4000')

const api = axios.create({
  baseURL: `${runtimeBaseUrl}/api`,
  timeout: 10000
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Ops! Algo inesperado aconteceu.'
    return Promise.reject(new Error(message))
  }
)

export default api
