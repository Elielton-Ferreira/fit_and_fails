import AppLayout from '../components/layout/AppLayout'
import ScreenTimeWidget from '../modules/screen-time/ScreenTimeWidget'

const ScreenTimePage = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6 text-white">
          <p className="text-sm text-slate-400">Detox digital</p>
          <h1 className="mt-2 text-3xl font-semibold">Controle seu tempo de tela</h1>
          <p className="mt-1 text-sm text-slate-400">Registre minutos diários e compartilhe conquistas.</p>
        </header>
        <ScreenTimeWidget />
      </div>
    </AppLayout>
  )
}

export default ScreenTimePage
