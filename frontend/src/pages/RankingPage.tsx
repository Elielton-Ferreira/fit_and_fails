import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../modules/auth/AuthContext'

const RankingPage = () => {
  const { user } = useAuth()
  const rows = [
    { name: user?.name || 'Você', agua: '-', exercicios: '-', leitura: '-' }
  ]

  return (
    <AppLayout>
      <div className="space-y-4">
        <header className="glass-panel rounded-3xl p-6">
          <p className="text-sm text-slate-400">Ranking</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Desempenho da galera</h1>
          <p className="mt-1 text-sm text-slate-400">Água, exercícios e leitura.</p>
        </header>

        <div className="glass-panel rounded-3xl p-6">
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
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-t border-white/10">
                    <td className="px-3 py-2 font-semibold text-white">{row.name}</td>
                    <td className="px-3 py-2">{row.agua}</td>
                    <td className="px-3 py-2">{row.exercicios}</td>
                    <td className="px-3 py-2">{row.leitura}</td>
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
