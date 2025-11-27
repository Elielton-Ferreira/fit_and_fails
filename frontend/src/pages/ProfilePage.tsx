import { useState, useRef, ChangeEvent } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import api from '../lib/api'
import { useAuth } from '../modules/auth/AuthContext'

const ProfilePage = () => {
  const { user, setUser, logout } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl ?? null)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      setError('Use uma imagem de até 3MB.')
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6 text-white">
          <p className="text-sm text-slate-400">Perfil</p>
          <h1 className="mt-2 text-3xl font-semibold">Atualize seus dados</h1>
          <p className="mt-1 text-sm text-slate-400">Foto de perfil e nome.</p>
        </header>
        <div className="glass-panel rounded-3xl p-6 text-white">
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
                <Button type="button" variant="secondary" className="px-3 py-2 text-xs" onClick={() => fileRef.current?.click()}>
                  Enviar foto / usar câmera
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <label className="block text-sm text-slate-200">
              Nome
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
              />
            </label>
            <p className="text-sm text-slate-400">E-mail: {user?.email}</p>
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
      </div>
    </AppLayout>
  )
}

export default ProfilePage
