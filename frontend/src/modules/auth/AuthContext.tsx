import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import { registerPushDevice, setupForegroundNotifications } from '../../lib/firebaseMessaging'

type User = {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
}

type AuthContextState = {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (payload: { email: string; password: string }) => Promise<void>
  register: (payload: { name: string; email: string; password: string }) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
}

const STORAGE_KEY = 'fit-and-fails-auth'

const AuthContext = createContext<AuthContextState | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const persisted = localStorage.getItem(STORAGE_KEY)
      if (persisted) {
        const parsed = JSON.parse(persisted)
        if (parsed?.user && parsed?.token) {
          setUser(parsed.user)
          setToken(parsed.token)
          api.defaults.headers.common.Authorization = `Bearer ${parsed.token}`
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (token && user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
      api.defaults.headers.common.Authorization = `Bearer ${token}`
      registerPushDevice(user.id).catch((err) => {
        console.warn('Falha ao registrar push', err)
      })
      setupForegroundNotifications().catch((err) => {
        console.warn('Falha ao ativar notificações em foco', err)
      })
    } else {
      localStorage.removeItem(STORAGE_KEY)
      delete api.defaults.headers.common.Authorization
    }
  }, [token, user])

  const login = async ({ email, password }: { email: string; password: string }) => {
    const { data } = await api.post('/auth/login', { email, password })
    api.defaults.headers.common.Authorization = `Bearer ${data.token}`
    setUser(data.user)
    setToken(data.token)
  }

  const register = async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    api.defaults.headers.common.Authorization = `Bearer ${data.token}`
    setUser(data.user)
    setToken(data.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
  }

  const value = useMemo<AuthContextState>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      setUser
    }),
    [user, token, loading]
  )

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
