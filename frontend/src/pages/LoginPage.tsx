import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useAuth } from '../modules/auth/AuthContext'

const LoginPage = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setLoading(true)
      setError('')
      await login({ email, password })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-night px-4 py-10 text-white">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 text-left">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Fit &amp; Fails</p>
        <h1 className="mt-2 text-4xl font-semibold">Bem-vindo de volta</h1>
        <p className="mt-2 text-sm text-slate-400">Entre para acompanhar seus Fit &amp; Fails do dia.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-mail"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
          />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Ainda não tem conta?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
