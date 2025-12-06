import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { RankingEntry, WaterSnapshot } from '../../types'
import { useAuth } from '../auth/AuthContext'

const segments = [0.25, 0.5, 0.75, 1]

const WaterWidget = () => {
  const [snapshot, setSnapshot] = useState<WaterSnapshot | null>(null)
  const [logAmount, setLogAmount] = useState(250)
  const [shareOnFeed, setShareOnFeed] = useState(false)
  const [goal, setGoal] = useState(2000)
  const [feedback, setFeedback] = useState('')
  const [history, setHistory] = useState<WaterSnapshot['logs']>([])
  const [friendsHydration, setFriendsHydration] = useState<RankingEntry[]>([])
  const [friendsError, setFriendsError] = useState('')
  const [friendsLoading, setFriendsLoading] = useState(true)
  const { token } = useAuth()

  const fetchSnapshot = useCallback(async () => {
    const { data } = await api.get('/water')
    setSnapshot(data)
    setGoal(data.goalMl)
    setHistory(data.logs)
  }, [])

  useEffect(() => {
    fetchSnapshot()
  }, [fetchSnapshot])

  const fetchFriendsHydration = useCallback(async () => {
    try {
      if (!token) return
      setFriendsError('')
      setFriendsLoading(true)
      const { data } = await api.get<RankingEntry[]>('/ranking', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFriendsHydration(data)
    } catch (err: any) {
      setFriendsError(err.message)
    } finally {
      setFriendsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    fetchFriendsHydration()
  }, [fetchFriendsHydration, token])

  const addLog = async () => {
    if (!logAmount) return
    const { data } = await api.post('/water', { amountMl: logAmount, shareOnFeed })
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

  const friendsWithProgress = useMemo(() => {
    return friendsHydration
      .map((friend) => {
        const percent = friend.waterGoal > 0 ? Math.min(100, Math.round((friend.waterTotal / friend.waterGoal) * 100)) : 0
        return { ...friend, percent }
      })
      .sort((a, b) => {
        if (b.percent !== a.percent) return b.percent - a.percent
        return b.waterTotal - a.waterTotal
      })
  }, [friendsHydration])

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

      <WaterProgressCircle snapshot={snapshot} nextSegment={nextSegment} />

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
          <label className="mt-3 flex items-start gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={shareOnFeed}
              onChange={(event) => setShareOnFeed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
            />
            <span>
              Compartilhar no feed
              <span className="mt-0.5 block text-[11px] text-slate-500">
                Posta este registro; ao bater a meta o post é automático.
              </span>
            </span>
          </label>
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

      {feedback && <p className="mt-4 text-sm text-sky-200">{feedback}</p>}

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

      <div className="mt-6 rounded-2xl border border-white/5 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Hidratação Amigos</p>
            <p className="text-xs text-slate-400">Veja como a galera está hidratando hoje.</p>
          </div>
          {friendsLoading && <p className="text-xs text-slate-400">Carregando...</p>}
          {friendsError && <p className="text-xs text-rose-300">{friendsError}</p>}
        </div>

        {!friendsLoading && !friendsError && (
          <>
            {friendsWithProgress.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Convide amigos para acompanhar a hidratação em tempo real.</p>
            ) : (
              <ul className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
                {friendsWithProgress.map((friend) => (
                  <li key={friend.userId} className="rounded-2xl border border-white/5 bg-white/5 px-3 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-white">{friend.name}</p>
                        <p className="text-xs text-slate-400">
                          {friend.waterTotal} / {friend.waterGoal} ml
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${friend.waterMet ? 'text-emerald-300' : 'text-sky-300'}`}>{friend.percent}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full ${friend.waterMet ? 'bg-emerald-400' : 'bg-primary'}`}
                        style={{ width: `${friend.percent}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default WaterWidget

const WaterProgressCircle = ({
  snapshot,
  nextSegment
}: {
  snapshot: WaterSnapshot
  nextSegment: number | null
}) => {
  const size = 220
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clampedProgress = Math.min(100, Math.max(0, snapshot.progress))
  const offset = circumference - (clampedProgress / 100) * circumference
  const totalLiters = (snapshot.totalMl / 1000).toFixed(1)
  const goalLiters = (snapshot.goalMl / 1000).toFixed(1)

  return (
    <div className="mt-6 flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1f2937"
            strokeWidth={stroke}
            fill="transparent"
            strokeLinecap="round"
            className="opacity-40"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#water-gradient)"
            strokeWidth={stroke}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <defs>
            <linearGradient id="water-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00b4d8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute text-center">
          <p className="text-4xl font-bold text-white">{clampedProgress}%</p>
          <p className="text-sm text-slate-400 mt-1">{totalLiters} L</p>
          <p className="text-xs text-slate-500">de {goalLiters} L</p>
        </div>
      </div>
      <div className="text-sm text-slate-400 text-center lg:text-left">
        <p>
          {snapshot.totalMl} ml ingeridos • faltam <span className="text-white">{snapshot.pendingMl} ml</span>
        </p>
        {nextSegment && <p className="mt-2 text-xs text-slate-500">Próximo lembrete em {nextSegment} ml</p>}
      </div>
    </div>
  )
}
