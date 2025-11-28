import AppLayout from '../components/layout/AppLayout'
import ExerciseWidget from '../modules/exercise/ExerciseWidget'
import { useTheme } from '../modules/theme/ThemeProvider'

const ExercisePage = () => {
  const { theme } = useTheme()
  const heading = theme === 'light' ? 'text-slate-900' : 'text-white'
  const muted = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6">
          <p className={`text-sm ${muted}`}>Treinos</p>
          <h1 className={`mt-2 text-3xl font-semibold ${heading}`}>Registre seus exercícios</h1>
          <p className={`mt-1 text-sm ${muted}`}>Capture foto/vídeo, duração e compartilhe no feed.</p>
        </header>
        <ExerciseWidget />
      </div>
    </AppLayout>
  )
}

export default ExercisePage
