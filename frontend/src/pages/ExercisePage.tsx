import AppLayout from '../components/layout/AppLayout'
import ExerciseWidget from '../modules/exercise/ExerciseWidget'

const ExercisePage = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6 text-white">
          <p className="text-sm text-slate-400">Treinos</p>
          <h1 className="mt-2 text-3xl font-semibold">Registre seus exercícios</h1>
          <p className="mt-1 text-sm text-slate-400">Capture foto/vídeo, duração e compartilhe no feed.</p>
        </header>
        <ExerciseWidget />
      </div>
    </AppLayout>
  )
}

export default ExercisePage
