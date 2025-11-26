import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { WaterSnapshot } from '../../types'

const segments = [0.25, 0.5, 0.75, 1]

const WaterWidget = () => {
  const [snapshot, setSnapshot] = useState<WaterSnapshot | null>(null)
  const [logAmount, setLogAmount] = useState(250)
  const [goal, setGoal] = useState(2000)
  const [feedback, setFeedback] = useState('')
  const [history, setHistory] = useState<WaterSnapshot['logs']>([])

  const fetchSnapshot = useCallback(async () => {
    const { data } = await api.get('/water')
    setSnapshot(data)
    setGoal(data.goalMl)
    setHistory(data.logs)
  }, [])

  useEffect(() => {
    fetchSnapshot()
  }, [fetchSnapshot])

  const addLog = async () => {
    if (!logAmount) return
    const { data } = await api.post('/water', { amountMl: logAmount })
    setSnapshot(data)
    setHistory(data.logs)
    setFeedback('Log registrado! 💧')
    setTimeout(() => setFeedback(''), 2000)
  }

  const updateGoal = async () => {
    const { data } = await api.patch('/water/goal', { dailyGoalMl: goal })
    setSnapshot(data)
    setFeedback('Meta atualizada ✅')
    setTimeout(() => setFeedback(''), 2000)
  }

  const nextSegment = useMemo(() => {
    if (!snapshot) return null
    const next = segments.find((segment) => snapshot.progress / 100 < segment)
    if (!next) return null
    return Math.round(snapshot.goalMl * next)
  }, [snapshot])

  if (!snapshot) {
    return (
      <section id="water" className="glass-panel rounded-3xl p-6">
        <p className="text-sm text-slate-400">Monitorando hidratação...</p>
      </section>
    )
  }

  return (
    <section id="water" className="glass-panel rounded-3xl p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Meta diária</p>
          <h3 className="text-2xl font-semibold text-white">{snapshot.goalMl} ml</h3>
        </div>
        {snapshot.canCelebrate && <Badge label="Meta batida!" variant="success" />}
      </header>

      <div className="mt-6">
        <div className="flex items-end justify-between">
          <p className="text-4xl font-bold text-primary">{snapshot.progress}%</p>
          <p className="text-sm text-slate-400">
            {snapshot.totalMl} ml ingeridos • faltam {snapshot.pendingMl} ml
          </p>
        </div>
        <div className="mt-3 h-3 rounded-full bg-white/10">
          <div className="h-3 rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${snapshot.progress}%` }} />
        </div>
        {nextSegment && <p className="mt-2 text-xs text-slate-500">Próximo lembrete em {nextSegment} ml</p>}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/5 p-4">
          <p className="text-sm text-slate-300">Adicionar ingestão</p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={50}
              value={logAmount}
              onChange={(event) => setLogAmount(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
            <Button type="button" onClick={addLog} className="whitespace-nowrap">
              + ml
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 p-4">
          <p className="text-sm text-slate-300">Configurar meta</p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={1000}
              max={6000}
              value={goal}
              onChange={(event) => setGoal(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
            <Button type="button" variant="secondary" onClick={updateGoal}>
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {feedback && <p className="mt-4 text-sm text-emerald-300">{feedback}</p>}

      <div className="mt-6 rounded-2xl border border-white/5 p-4">
        <p className="text-sm font-semibold text-white">Histórico de ingestão</p>
        <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
          {history.length === 0 && <p className="text-sm text-slate-500">Nenhum log hoje.</p>}
          {history
            .slice()
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((log) => {
              const date = new Date(log.date)
              const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
              return (
                <div key={log.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-200">
                  <span>{day}</span>
                  <span className="font-semibold text-white">{log.amountMl} ml</span>
                </div>
              )
            })}
        </div>
      </div>
    </section>
  )
}

export default WaterWidget
