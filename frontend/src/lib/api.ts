import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  withCredentials: true
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Ops! Algo inesperado aconteceu.'
    return Promise.reject(new Error(message))
  }
)

export default api
