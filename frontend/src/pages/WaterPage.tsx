import AppLayout from '../components/layout/AppLayout'
import WaterWidget from '../modules/water/WaterWidget'

const WaterPage = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6 text-white">
          <p className="text-sm text-slate-400">Hidratação</p>
          <h1 className="mt-2 text-3xl font-semibold">Acompanhe sua água</h1>
          <p className="mt-1 text-sm text-slate-400">Defina meta diária e registre cada ingestão.</p>
        </header>
        <WaterWidget />
      </div>
    </AppLayout>
  )
}

export default WaterPage
