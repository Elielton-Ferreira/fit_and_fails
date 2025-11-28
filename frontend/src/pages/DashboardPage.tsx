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
        <Feed />
      </div>
    </AppLayout>
  )
}

export default DashboardPage
