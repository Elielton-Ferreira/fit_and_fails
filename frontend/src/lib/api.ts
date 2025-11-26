import axios from 'axios'

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: `${baseUrl}/api`,
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
