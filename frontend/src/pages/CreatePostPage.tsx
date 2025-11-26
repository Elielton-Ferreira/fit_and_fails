import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PostComposer from '../components/feed/PostComposer'

const CreatePostPage = () => {
  const navigate = useNavigate()

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6 text-white">
          <p className="text-sm text-slate-400">Criar publicação</p>
          <h1 className="mt-2 text-3xl font-semibold">Compartilhe um momento</h1>
          <p className="mt-1 text-sm text-slate-400">Publique direto no feed.</p>
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
