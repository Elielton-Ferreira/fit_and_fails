import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { ScreenTimeSummary } from '../../types'

const ScreenTimeWidget = () => {
  const [summary, setSummary] = useState<ScreenTimeSummary | null>(null)
  const [minutes, setMinutes] = useState(90)
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10))
  const [message, setMessage] = useState('')

  const fetchSummary = useCallback(async () => {
    const { data } = await api.get('/screen-time/summary')
    setSummary(data)
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const recordLog = async () => {
    await api.post('/screen-time/logs', { date, minutes })
    setMessage('Dia registrado 🧘')
    fetchSummary()
    setTimeout(() => setMessage(''), 2000)
  }

  const share = async () => {
    await api.post('/screen-time/share')
    setMessage('Conquista publicada! 🚀')
    setTimeout(() => setMessage(''), 2000)
  }

  if (!summary) {
    return (
      <section id="screen" className="glass-panel rounded-3xl p-6">
        <p className="text-sm text-slate-400">Calculando seu detox digital...</p>
      </section>
    )
  }

  const trendLabel =
    summary.trend === 'down' ? 'Diminuindo 👏' : summary.trend === 'up' ? 'Subiu, atenção!' : 'Estável — continue!'

  return (
    <section id="screen" className="glass-panel rounded-3xl p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Detox semanal</p>
          <h3 className="text-2xl font-semibold text-white">{summary.current.averageMinutes} min/dia</h3>
        </div>
        <Badge
          label={trendLabel}
          variant={summary.trend === 'down' ? 'success' : summary.trend === 'up' ? 'warn' : 'info'}
        />
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="text-sm text-slate-400">Semana atual</p>
          <p className="text-3xl font-bold text-white">{summary.current.totalMinutes} min</p>
          <p className="text-xs text-slate-500">Média diária {summary.current.averageMinutes} min</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="text-sm text-slate-400">Semana anterior</p>
          <p className="text-3xl font-bold text-white">{summary.previous.totalMinutes} min</p>
          <p className="text-xs text-slate-500">Média {summary.previous.averageMinutes} min</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="text-sm text-slate-300">Quanto tempo você passou no dia?</p>
          <div className="mt-3 flex flex-col gap-2">
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
            <input
              type="number"
              min={0}
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
            <Button type="button" onClick={recordLog}>
              Registrar
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="text-sm text-slate-300">Compartilhe a redução</p>
          <p className="mt-2 text-lg font-semibold text-white">
            Você economizou {Math.max(summary.improvementMinutes, 0)} minutos nesta semana.
          </p>
          <Button type="button" variant="secondary" onClick={share} disabled={summary.improvementMinutes <= 0} className="mt-4">
            Publicar conquista
          </Button>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
    </section>
  )
}

export default ScreenTimeWidget
