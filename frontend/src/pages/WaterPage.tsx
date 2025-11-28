import AppLayout from '../components/layout/AppLayout'
import WaterWidget from '../modules/water/WaterWidget'
import { useTheme } from '../modules/theme/ThemeProvider'

const WaterPage = () => {
  const { theme } = useTheme()
  const heading = theme === 'light' ? 'text-slate-900' : 'text-white'
  const muted = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6">
          <p className={`text-sm ${muted}`}>Hidratação</p>
          <h1 className={`mt-2 text-3xl font-semibold ${heading}`}>Acompanhe sua água</h1>
          <p className={`mt-1 text-sm ${muted}`}>Defina meta diária e registre cada ingestão.</p>
        </header>
        <WaterWidget />
      </div>
    </AppLayout>
  )
}

export default WaterPage
