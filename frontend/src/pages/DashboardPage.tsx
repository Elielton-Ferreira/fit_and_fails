import AppLayout from '../components/layout/AppLayout'
import Feed from '../modules/feed/Feed'
import { useAuth } from '../modules/auth/AuthContext'
import { useTheme } from '../modules/theme/ThemeProvider'

const DashboardPage = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const greeting = new Date().getHours() < 12 ? 'Bom dia' : 'Boa tarde'

  const headerStyles =
    theme === 'light'
      ? 'border-slate-200 bg-white text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
      : 'border-slate-800/60 bg-[rgba(6,8,12,0.96)] text-white'

  const mutedText = theme === 'light' ? 'text-slate-500' : 'text-slate-300'
  const subText = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <AppLayout>
      <div className="space-y-4 lg:pt-2">
        {/* Título sticky com logo */}
        <header
          className={`sticky top-0 z-30 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-3xl border p-6 backdrop-blur cursor-pointer ${headerStyles}`}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div>
            <p className={`text-sm ${mutedText}`}>Compartilhe o que rolou</p>
            <h1 className="mt-1 text-3xl font-semibold">Feed Fit &amp; Fails</h1>
            <p className={`mt-1 text-sm ${subText}`}>Compartilhe e acompanhe os posts da comunidade.</p>
          </div>
        </header>

        <Feed />
      </div>
    </AppLayout>
  )
}

export default DashboardPage
