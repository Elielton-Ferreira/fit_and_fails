import AppLayout from '../components/layout/AppLayout'
import ScreenTimeWidget from '../modules/screen-time/ScreenTimeWidget'
import { useTheme } from '../modules/theme/ThemeProvider'

const ScreenTimePage = () => {
  const { theme } = useTheme()
  const heading = theme === 'light' ? 'text-slate-900' : 'text-white'
  const muted = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6">
          <p className={`text-sm ${muted}`}>Leitura</p>
          <h1 className={`mt-2 text-3xl font-semibold ${heading}`}>Acompanhe suas páginas lidas</h1>
          <p className={`mt-1 text-sm ${muted}`}>Registre páginas por dia e compartilhe seu ritmo.</p>
        </header>
        <ScreenTimeWidget />
      </div>
    </AppLayout>
  )
}

export default ScreenTimePage
