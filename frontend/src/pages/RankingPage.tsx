import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../modules/auth/AuthContext'
import api from '../lib/api'
import { RankingEntry } from '../types'

const RankingPage = () => {
  const { user } = useAuth()
  const [rows, setRows] = useState<RankingEntry[]>([])
  const [error, setError] = useState('')
  const [day, setDay] = useState(() => new Date().toISOString().substring(0, 10))

  useEffect(() => {
    const load = async () => {
      try {
        setError('')
        const { data } = await api.get<RankingEntry[]>('/ranking', { params: { day } })
        setRows(data)
      } catch (err: any) {
        setError(err.message)
      }
    }
    load()
  }, [day])

  const renderBadge = (met: boolean, label: string) => (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold ${
        met ? 'bg-sky-500 text-white' : 'bg-rose-500 text-white'
      }`}
      title={label}
    >
      {met ? '✓' : '✕'}
    </span>
  )

  return (
    <AppLayout>
      <div className="space-y-4">
        <header className="glass-panel rounded-3xl p-6">
          <p className="text-sm text-slate-400">Ranking</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Desempenho da galera</h1>
          <p className="mt-1 text-sm text-slate-400">Água, exercícios e leitura.</p>
        </header>

        <div className="glass-panel rounded-3xl p-6">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span>Data:</span>
              <input
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            {error && <span className="text-sm text-rose-300">{error}</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-slate-200">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">Água</th>
                  <th className="px-3 py-2">Exercícios</th>
                  <th className="px-3 py-2">Leitura</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.userId} className="border-t border-white/10">
                    <td className="px-3 py-2 font-semibold text-white">{row.name}</td>
                    <td className="px-3 py-2">{renderBadge(row.waterMet, `Meta ${row.waterTotal}/${row.waterGoal}ml`)}</td>
                    <td className="px-3 py-2">{renderBadge(row.exerciseDone, 'Treino registrado')}</td>
                    <td className="px-3 py-2">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default RankingPage
