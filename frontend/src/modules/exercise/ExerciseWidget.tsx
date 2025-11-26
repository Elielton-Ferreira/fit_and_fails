import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import { ExerciseSession } from '../../types'

const ExerciseWidget = () => {
  const [type, setType] = useState('Caminhada')
  const [duration, setDuration] = useState(30)
  const [notes, setNotes] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [share, setShare] = useState(true)
  const [sessions, setSessions] = useState<ExerciseSession[]>([])
  const [customType, setCustomType] = useState('')
  const [types, setTypes] = useState<string[]>(['Caminhada', 'Bike', 'Musculação', 'Luta', 'Alongamento', 'Ar Livre'])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [mediaError, setMediaError] = useState('')
  const [mediaLabel, setMediaLabel] = useState('')
  const durationPresets = [15, 30, 45, 60]

  const fetchSessions = useCallback(async () => {
    const { data } = await api.get('/exercises?limit=4')
    setSessions(data)
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + duration * 60000)
    const payload = {
      type,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes,
      mediaUrls: mediaUrl ? [mediaUrl] : undefined,
      shareToFeed: share
    }
    const { data } = await api.post('/exercises', payload)
    setSessions((prev) => [data, ...prev].slice(0, 4))
    setNotes('')
    setMediaUrl('')
    setMediaLabel('')
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setMediaError('Arquivo maior que 5MB. Selecione algo menor.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setMediaUrl(String(reader.result))
      setMediaError('')
      setMediaLabel(file.name)
    }
    reader.readAsDataURL(file)
  }

  const addCustomType = () => {
    if (!customType.trim()) return
    const next = customType.trim()
    if (!types.includes(next)) {
      setTypes((prev) => [...prev, next])
    }
    setType(next)
    setCustomType('')
  }

  return (
    <section id="exercise" className="glass-panel rounded-3xl p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Movimente o corpo</p>
          <h3 className="text-2xl font-semibold text-white">Registre seu treino</h3>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-3">
            <label className="text-sm text-slate-300">Tipo de treino</label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white focus:border-primary focus:outline-none"
            >
              {types.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                value={customType}
                onChange={(event) => setCustomType(event.target.value)}
                placeholder="Novo tipo (ex.: Yoga, Cross, Corrida)"
                className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
              />
              <Button type="button" variant="secondary" className="px-3 py-2 text-xs whitespace-nowrap" onClick={addCustomType}>
                + Tipo
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
            <p className="text-xs text-slate-400">Foto / vídeo do treino</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="px-4 py-2 text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Abrir câmera / enviar arquivo
              </Button>
              {mediaLabel && <span className="text-xs text-emerald-200">{mediaLabel}</span>}
            </div>
            {mediaError && <p className="mt-2 text-xs text-rose-300">{mediaError}</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
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

        <div className="grid gap-3 lg:grid-cols-[2fr,1fr]">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notas rápidas"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
          />
          <Button type="submit" className="w-full lg:w-auto">
            Registrar treino
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between rounded-2xl border border-white/5 px-4 py-3 text-sm text-slate-200">
            <span>
              <strong className="text-white">{session.type}</strong> • {session.durationMinutes ?? 0} min
            </span>
            {session.notes && <span className="text-slate-500">{session.notes}</span>}
          </div>
        ))}
        {!sessions.length && <p className="text-sm text-slate-500">Nenhum treino registrado ainda hoje.</p>}
      </div>
    </section>
  )
}

export default ExerciseWidget
