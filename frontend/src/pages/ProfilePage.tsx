import { useState, useRef, ChangeEvent, useEffect } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import api from '../lib/api'
import { useAuth } from '../modules/auth/AuthContext'
import { useTheme } from '../modules/theme/ThemeProvider'

const IconGallery = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-sky-200">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8" cy="9" r="2" />
    <path d="M3 16l4-3a2 2 0 0 1 2.7.2l3.6 3.6a2 2 0 0 0 2.8 0L21 13" />
  </svg>
)

const ProfilePage = () => {
  const { user, setUser, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const [name, setName] = useState(user?.name ?? '')
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl ?? null)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const galleryRef = useRef<HTMLInputElement | null>(null)
  const [versions, setVersions] = useState<{
    images?: Partial<Record<'frontend' | 'backend' | 'notification' | 'postgres', string>>
    source?: string
    postgresServerVersion?: string | null
  } | null>(null)
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionsError, setVersionsError] = useState('')
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({})
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' })

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      setError('Use uma imagem de até 15MB.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatar(String(reader.result))
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const save = async () => {
    try {
      setError('')
      setInfo('Salvando...')
      const { data } = await api.patch('/me', { name, avatarUrl: avatar })
      setUser(data)
      setInfo('Perfil atualizado ✅')
      setTimeout(() => setInfo(''), 2000)
    } catch (err: any) {
      setError(err.message)
      setInfo('')
    }
  }

  const adminEmails = ['elielton.gomes.ferreira@gmail.com', 'admin@example.com']
  const isAdmin = user?.email ? adminEmails.includes(user.email) : false

  const loadVersions = async () => {
    try {
      setVersionsLoading(true)
      setVersionsError('')
      const { data } = await api.get('/system/versions')
      setVersions(data)
    } catch (err: any) {
      setVersionsError(err.response?.data?.error || err.message)
    } finally {
      setVersionsLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.id) return
    loadVersions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadUsers = async () => {
    try {
      setAdminLoading(true)
      setAdminError('')
      const { data } = await api.get('/admin/users')
      setAdminUsers(data)
    } catch (err: any) {
      setAdminError(err.message)
    } finally {
      setAdminLoading(false)
    }
  }

  const updatePassword = async (userId: string) => {
    const password = passwordDrafts[userId]
    if (!password || password.length < 6) {
      setAdminError('Senha deve ter pelo menos 6 caracteres.')
      return
    }
    try {
      setAdminError('')
      await api.patch(`/admin/users/${userId}/password`, { password })
      setPasswordDrafts((prev) => ({ ...prev, [userId]: '' }))
      setInfo('Senha atualizada')
      setTimeout(() => setInfo(''), 2000)
    } catch (err: any) {
      setAdminError(err.message)
    }
  }

  const removeUser = async (userId: string) => {
    if (!window.confirm('Excluir este usuário e dados relacionados?')) return
    try {
      setAdminError('')
      await api.delete(`/admin/users/${userId}`)
      setAdminUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err: any) {
      setAdminError(err.message)
    }
  }

  const createUser = async () => {
    const { name: newName, email: newEmail, password: newPassword } = newUser
    if (!newName || !newEmail || !newPassword) {
      setAdminError('Preencha nome, email e senha.')
      return
    }
    if (newPassword.length < 6) {
      setAdminError('Senha deve ter pelo menos 6 caracteres.')
      return
    }
    try {
      setAdminError('')
      const { data } = await api.post('/admin/users', { name: newName, email: newEmail, password: newPassword })
      setAdminUsers((prev) => [data, ...prev])
      setNewUser({ name: '', email: '', password: '' })
      setInfo('Usuário criado')
      setTimeout(() => setInfo(''), 2000)
    } catch (err: any) {
      setAdminError(err.response?.data?.error || err.message)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Perfil</p>
              <h1 className={`mt-2 text-3xl font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Atualize seus dados</h1>
              <p className={`mt-1 text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Foto de perfil e nome.</p>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-200/60 hover:bg-white/10"
            >
              {theme === 'dark' ? '🌙 Modo escuro' : '☀️ Modo claro'}
            </button>
          </div>
        </header>
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-lg font-bold uppercase">
                  {user?.name?.slice(0, 1)}
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Foto do perfil</p>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-sky-200/60 hover:bg-white/10"
                >
                  <IconGallery />
                  <span>Adicionar foto</span>
                </button>
                <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <label className={`block text-sm ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
              Nome
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={`mt-1 w-full rounded-2xl border px-3 py-3 text-sm placeholder:text-slate-500 focus:border-primary focus:outline-none ${
                  theme === 'light' ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white/5 text-white'
                }`}
              />
            </label>
            <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>E-mail: {user?.email}</p>
          </div>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          {info && <p className="mt-3 text-sm text-sky-200">{info}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={save}>
              Salvar perfil
            </Button>
            <Button type="button" variant="ghost" onClick={logout} className="border border-rose-300/40 text-rose-200 hover:bg-rose-500/10">
              Sair
            </Button>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Versão do sistema</h2>
              <p className={`mt-1 text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                {versions?.source ? `Fonte: ${versions.source}` : 'Fonte: —'}
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={loadVersions} disabled={versionsLoading}>
              {versionsLoading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>

          {versionsError && <p className="mt-3 text-sm text-rose-300">{versionsError}</p>}

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Frontend</span>
                <span className="max-w-[70%] break-words text-right font-mono text-white">{versions?.images?.frontend || '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Backend</span>
                <span className="max-w-[70%] break-words text-right font-mono text-white">{versions?.images?.backend || '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Notification</span>
                <span className="max-w-[70%] break-words text-right font-mono text-white">{versions?.images?.notification || '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Postgres</span>
                <span className="max-w-[70%] break-words text-right font-mono text-white">{versions?.images?.postgres || '—'}</span>
              </div>
              {versions?.postgresServerVersion && (
                <p className="pt-2 text-xs text-slate-400">
                  {versions.postgresServerVersion}
                </p>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Administração</h2>
              <Button type="button" variant="secondary" onClick={loadUsers} disabled={adminLoading}>
                {adminLoading ? 'Carregando...' : 'Listar usuários'}
              </Button>
            </div>
            {adminError && <p className="mt-3 text-sm text-rose-300">{adminError}</p>}
            <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-4 sm:items-end">
              <div>
                <p className="text-xs text-slate-400">Nome</p>
                <input
                  value={newUser.name}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                  placeholder="Nome"
                />
              </div>
              <div>
                <p className="text-xs text-slate-400">E-mail</p>
                <input
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                  placeholder="email@dominio.com"
                  type="email"
                />
              </div>
              <div>
                <p className="text-xs text-slate-400">Senha</p>
                <input
                  value={newUser.password}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                  placeholder="Mínimo 6 caracteres"
                  type="password"
                />
              </div>
              <div className="sm:pt-5">
                <Button type="button" variant="secondary" className="w-full" onClick={createUser}>
                  Criar usuário
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {adminUsers.map((u) => (
                <div key={u.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-semibold text-white">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="password"
                      value={passwordDrafts[u.id] ?? ''}
                      onChange={(e) => setPasswordDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      placeholder="Nova senha"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" className="px-3 py-2 text-xs" onClick={() => updatePassword(u.id)}>
                        Trocar senha
                      </Button>
                      <Button type="button" variant="ghost" className="px-3 py-2 text-xs text-rose-200 hover:text-rose-100" onClick={() => removeUser(u.id)}>
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!adminLoading && adminUsers.length === 0 && <p className="text-sm text-slate-400">Nenhum usuário listado.</p>}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default ProfilePage
