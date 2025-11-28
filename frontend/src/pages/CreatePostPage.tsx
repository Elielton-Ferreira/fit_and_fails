import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PostComposer from '../components/feed/PostComposer'
import { useTheme } from '../modules/theme/ThemeProvider'

const CreatePostPage = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const heading = theme === 'light' ? 'text-slate-900' : 'text-white'
  const muted = theme === 'light' ? 'text-slate-600' : 'text-slate-400'

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6">
          <p className={`text-sm ${muted}`}>Criar publicação</p>
          <h1 className={`mt-2 text-3xl font-semibold ${heading}`}>Compartilhe um momento</h1>
          <p className={`mt-1 text-sm ${muted}`}>Publique direto no feed.</p>
        </header>
        <PostComposer
          onCreated={() => undefined}
          onPublished={() => {
            navigate('/dashboard#feed')
          }}
        />
      </div>
    </AppLayout>
  )
}

export default CreatePostPage
