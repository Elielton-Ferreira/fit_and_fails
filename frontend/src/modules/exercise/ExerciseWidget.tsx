import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import { ExerciseSession } from '../../types'
import { useTheme } from '../theme/ThemeProvider'
import { prepareImageForUpload } from '../../lib/media'

const ExerciseWidget = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [type, setType] = useState('Caminhada')
  const [duration, setDuration] = useState(30)
  const [notes, setNotes] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('')
  const [share, setShare] = useState(true)
  const [sessions, setSessions] = useState<ExerciseSession[]>([])
  const [history, setHistory] = useState<ExerciseSession[]>([])
  const [customType, setCustomType] = useState('')
  const [types, setTypes] = useState<string[]>(['Caminhada', 'Bike', 'Musculação', 'Luta', 'Alongamento', 'Ar Livre'])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [mediaError, setMediaError] = useState('')
  const [mediaLabel, setMediaLabel] = useState('')
  const [error, setError] = useState('')
  const durationPresets = [15, 30, 45, 60]
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchSessions = useCallback(async () => {
    try {
      setError('')
      const { data } = await api.get('/exercises', { params: { limit: 6, days: 60 } })
      setSessions(data.slice(0, 4))
      setHistory(data)
      const typesFromHistory = Array.from(new Set(data.map((s) => s.type)))
      setTypes((prev) => Array.from(new Set([...prev, ...typesFromHistory, loadCustomTypes()].flat())))
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar seus treinos.')
    }
  }, [])

  useEffect(() => {
    const saved = loadCustomTypes()
    if (saved.length) {
      setTypes((prev) => Array.from(new Set([...prev, ...saved])))
    }
    fetchSessions()
  }, [fetchSessions])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + duration * 60000)
    try {
      setLoading(true)
      setError('')
      setMediaError('')
      let imageUrl: string | undefined
      if (mediaFile) {
        const prepared = await prepareImageForUpload(mediaFile)
        imageUrl = prepared.dataUrl
      }
      const payload = {
        type,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes,
        mediaUrls: imageUrl ? [imageUrl] : undefined,
        shareToFeed: share
      }
      const { data } = await api.post('/exercises', payload)
      setSessions((prev) => [data, ...prev].slice(0, 4))
      setHistory((prev) => [data, ...prev])
      setNotes('')
      clearMedia()
      // direciona ao feed como na tela de livros
      navigate('/dashboard#feed')
    } catch (err: any) {
      setError(err?.message || 'Não foi possível registrar seu treino.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMediaError('Selecione uma imagem válida.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setMediaError('Arquivo maior que 15MB. Selecione algo menor.')
      setMediaFile(null)
      setMediaLabel('')
      return
    }
    setMediaError('')
    setMediaFile(file)
    setMediaLabel(file.name)
    setMediaPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const clearMedia = () => {
    setMediaFile(null)
    setMediaLabel('')
    setMediaError('')
    setMediaPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })
  }

  const addCustomType = () => {
    if (!customType.trim()) return
    const next = customType.trim()
    if (!types.includes(next)) {
      setTypes((prev) => {
        const updated = [...prev, next]
        persistCustomTypes(updated)
        return updated
      })
    } else {
      persistCustomTypes(types)
    }
    setType(next)
    setCustomType('')
    setShowTypeForm(false)
  }

  const loadCustomTypes = (): string[] => {
    try {
      const raw = localStorage.getItem('fit-fails-custom-types')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const persistCustomTypes = (list: string[]) => {
    try {
      const defaults = ['Caminhada', 'Bike', 'Musculação', 'Luta', 'Alongamento', 'Ar Livre']
      const customOnly = list.filter((item) => !defaults.includes(item))
      localStorage.setItem('fit-fails-custom-types', JSON.stringify(customOnly))
    } catch {
      // ignore
    }
  }

  const buildMonthDays = () => {
    const base = new Date()
    base.setDate(1)
    base.setMonth(base.getMonth() + monthOffset)
    const startWeek = base.getDay()
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
    const days: (Date | null)[] = []
    for (let i = 0; i < startWeek; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(base.getFullYear(), base.getMonth(), d))
    }
    return days
  }

  const calendarDays = buildMonthDays()

  const toLocalKey = (date: string | Date) => {
    const d = new Date(date)
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - offset * 60000)
    return local.toISOString().substring(0, 10)
  }

  const historyByDay = history.reduce<Record<string, ExerciseSession[]>>((acc, session) => {
    const key = toLocalKey(session.startTime)
    acc[key] = acc[key] ? [...acc[key], session] : [session]
    return acc
  }, {})

  const todayKey = toLocalKey(new Date())

  return (
    <section id="exercise" className="glass-panel rounded-3xl p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Movimente o corpo</p>
          <h3 className="text-2xl font-semibold text-white">Registre seu treino</h3>
        </div>
      </header>

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-3">
            <label className="text-sm text-slate-300">Tipo de treino</label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white focus:border-primary focus:outline-none dark-select"
            >
              {types.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="flex flex-col gap-2">
              {showTypeForm && (
                <input
                  value={customType}
                  onChange={(event) => setCustomType(event.target.value)}
                  placeholder="Novo tipo (ex.: Yoga, Cross, Corrida)"
                  className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                />
              )}
              <Button
                type="button"
                variant="secondary"
                className="w-full px-3 py-2 text-xs whitespace-nowrap"
                onClick={() => (showTypeForm ? addCustomType() : setShowTypeForm(true))}
              >
                {showTypeForm ? 'Salvar tipo' : '+ Tipo'}
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-sm text-slate-300">Duração (min)</label>
            <div className="flex flex-wrap gap-2">
              {durationPresets.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                className={[
                  'rounded-xl border px-3 py-2 text-sm transition',
                  duration === d ? 'border-primary bg-white/15 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:border-primary'
                ].join(' ')}
              >
                  {d} min
                </button>
              ))}
            </div>
            <input
              type="number"
              min={5}
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-white focus:border-primary focus:outline-none"
              placeholder="Outro tempo (min)"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white">
            <p className="text-xs text-slate-400">Foto do treino</p>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white transition hover:border-sky-200/60 hover:bg-white/10"
              >
                <IconCamera />
              </button>
            </div>
            {mediaPreviewUrl && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <img src={mediaPreviewUrl} alt="Prévia do treino" className="h-40 w-40 object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearMedia()
                  }}
                  className="text-xs text-slate-300 underline"
                >
                  remover
                </button>
              </div>
            )}
            {mediaLabel && <p className="mt-2 text-xs text-sky-200 text-center">{mediaLabel}</p>}
            {mediaError && <p className="mt-2 text-xs text-rose-300">{mediaError}</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <label className="mt-6 flex items-center gap-3 text-sm text-slate-200 lg:mt-10">
            <input type="checkbox" checked={share} onChange={(event) => setShare(event.target.checked)} className="h-5 w-5 rounded border-white/10 bg-white/10" />
            Compartilhar no feed
          </label>
        </div>

        <div className="grid gap-3 lg:grid-cols-[2fr,1fr] items-start">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notas rápidas"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
          />
          <Button type="submit" className="w-full lg:w-auto" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar treino'}
          </Button>
        </div>
      </form>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Calendário de treinos</p>
          <div className="flex gap-2 text-xs">
            <Button type="button" variant="ghost" className="px-3 py-1" onClick={() => setMonthOffset((m) => m - 1)}>
              ◀ Mês anterior
            </Button>
            <Button type="button" variant="ghost" className="px-3 py-1" onClick={() => setMonthOffset((m) => m + 1)}>
              Próximo mês ▶
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400 mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />
            const keyLocal = toLocalKey(day)
            const hasWorkout = Boolean(historyByDay[keyLocal])
            const count = historyByDay[keyLocal]?.length ?? 0
            const isToday = todayKey === keyLocal
            const light = theme === 'light'
            return (
              <div
                key={keyLocal}
                className={[
                  'flex h-10 flex-col items-center justify-center rounded-lg border text-xs transition',
                  hasWorkout
                    ? light
                      ? 'border-sky-600 bg-sky-100 text-sky-800'
                      : 'border-sky-300/60 bg-sky-400/20 text-sky-100'
                    : light
                      ? 'border-slate-200 bg-white text-slate-700'
                      : 'border-white/10 bg-white/5 text-slate-400',
                  isToday
                    ? light
                      ? 'ring-2 ring-sky-500/70'
                      : 'ring-2 ring-sky-300/80'
                    : ''
                ].join(' ')}
                title={hasWorkout ? `${count} treino(s)` : 'Sem treino'}
              >
                <span>{day.getDate()}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {history.map((session) => {
          const dateStr = new Date(session.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          return (
            <div key={session.id} className="flex items-center justify-between rounded-2xl border border-white/5 px-4 py-3 text-sm text-slate-200">
              <span>
                <strong className="text-white">{session.type}</strong> • {session.durationMinutes ?? 0} min
                <span className="ml-2 text-xs text-slate-400">{dateStr}</span>
              </span>
              {session.notes && <span className="text-slate-500">{session.notes}</span>}
            </div>
          )
        })}
        {!sessions.length && <p className="text-sm text-slate-500">Nenhum treino registrado ainda hoje.</p>}
      </div>
    </section>
  )
}

export default ExerciseWidget
const IconCamera = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white"
  >
    <rect x="3" y="7" width="18" height="12" rx="2" />
    <path d="M9 7l1-2h4l1 2" />
    <circle cx="12" cy="13" r="4" />
    <path d="M17.5 9.5v.01" />
  </svg>
)
