import AppLayout from '../components/layout/AppLayout'
import Feed from '../modules/feed/Feed'
import { useAuth } from '../modules/auth/AuthContext'

const DashboardPage = () => {
  const { user } = useAuth()
  const greeting = new Date().getHours() < 12 ? 'Bom dia' : 'Boa tarde'

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6 text-white">
          <p className="text-sm text-slate-400">
            {greeting}, {user?.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Feed Fit &amp; Fails</h1>
          <p className="mt-1 text-sm text-slate-400">Compartilhe e acompanhe os posts da comunidade.</p>
        </header>
        <Feed />
      </div>
    </AppLayout>
  )
}

export default DashboardPage
