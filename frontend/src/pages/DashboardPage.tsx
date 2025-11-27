import AppLayout from '../components/layout/AppLayout'
import Feed from '../modules/feed/Feed'
import { useAuth } from '../modules/auth/AuthContext'

const DashboardPage = () => {
  const { user } = useAuth()
  const greeting = new Date().getHours() < 12 ? 'Bom dia' : 'Boa tarde'

  return (
    <AppLayout>
      <div className="space-y-4 lg:pt-2">
        {/* Título sticky com logo */}
        <header
          className="sticky top-0 z-30 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-3xl border border-slate-800/60 bg-[rgba(6,8,12,0.96)] p-6 text-white shadow-lg backdrop-blur cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div>
            <p className="text-sm text-slate-300">Compartilhe o que rolou</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Feed Fit &amp; Fails</h1>
            <p className="mt-1 text-sm text-slate-400">Compartilhe e acompanhe os posts da comunidade.</p>
          </div>
        </header>

        <Feed />
      </div>
    </AppLayout>
  )
}

export default DashboardPage
