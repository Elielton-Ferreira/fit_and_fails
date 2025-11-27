import type { ChangeEvent, FormEvent } from 'react'
import { useMemo, useRef, useState } from 'react'
import api from '../../lib/api'
import Button from '../ui/Button'
import { Post, PostType } from '../../types'

const postTypes: { value: PostType; label: string; icon: JSX.Element }[] = [
  {
    value: 'healthy_food',
    label: 'Boa refeição',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4" />
        <path d="M7 6h10" />
        <path d="M5 11c0-3 2.5-5 7-5s7 2 7 5-2 7-7 7-7-4-7-7Z" />
        <path d="M9 13c.3 1.3 1.5 2 3 2s2.7-.7 3-2" />
      </svg>
    )
  },
  {
    value: 'exercise',
    label: 'Exercício',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6h2l1 7 4-10h2" />
        <path d="m5 20 2-3 4-1 2-5" />
        <path d="M3 3l2 2" />
        <path d="M18 5h3" />
        <path d="M12 21h1" />
      </svg>
    )
  },
  {
    value: 'water',
    label: 'Hidratação',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2s-5 6-5 10a5 5 0 1 0 10 0c0-4-5-10-5-10Z" />
      </svg>
    )
  },
  {
    value: 'screen_time',
    label: 'Tempo de tela',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="14" rx="2" ry="2" />
        <path d="M12 18v2" />
        <path d="M8 22h8" />
      </svg>
    )
  },
  {
    value: 'shame',
    label: 'Vergonha',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c-4 0-7 3-7 7 0 6 7 11 7 11s7-5 7-11c0-4-3-7-7-7Z" />
        <circle cx="12" cy="11" r="2.5" />
        <path d="M9 11s-.5-1.5-2-1.5" />
        <path d="M15 11s.5-1.5 2-1.5" />
      </svg>
    )
  }
]

const IconCamera = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-sky-200"
  >
    <rect x="3" y="7" width="18" height="12" rx="2" />
    <path d="M9 7l1-2h4l1 2" />
    <circle cx="12" cy="13" r="4" />
    <path d="M17.5 9.5v.01" />
  </svg>
)

const PostComposer = ({ onCreated, onPublished }: { onCreated: (post: Post) => void; onPublished?: () => void }) => {
  const [type, setType] = useState<PostType>('healthy_food')
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mediaInfo, setMediaInfo] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!text.trim()) {
      setError('Conte algo para o feed 💬')
      return
    }
    try {
      setLoading(true)
      setError('')
      const { data } = await api.post('/posts', { type, text, imageUrl: imageUrl || undefined })
      onCreated(data)
      setText('')
      setImageUrl('')
      setMediaInfo('')
      document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' })
      onPublished?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo maior que 5MB. Escolha outro.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setImageUrl(String(reader.result))
      setMediaInfo(`Mídia anexada: ${file.name}`)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-3xl border border-white/10 p-6 text-white shadow-[0_16px_50px_rgba(0,0,0,0.4)]"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Compartilhe</p>
        <h3 className="text-xl font-semibold">O que rolou no seu dia?</h3>
        <p className="text-sm text-slate-400">Escolha o tipo do post, suba mídia opcional e publique direto no feed.</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {postTypes.map((option) => {
          const active = type === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
            className={[
              'flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition backdrop-blur-sm',
              active
                  ? 'border-sky-200/80 bg-white/10 text-white shadow-[0_10px_30px_rgba(91,141,255,0.22)]'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:text-white'
            ].join(' ')}
          >
              {option.icon}
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4">
          <p className="text-sm text-slate-300">Foto ou vídeo opcional</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center gap-3 px-5 py-4 sm:w-auto"
              onClick={() => fileInputRef.current?.click()}
            >
              <IconCamera />
              <span className="font-semibold text-white">Enviar foto/vídeo</span>
            </Button>
            {mediaInfo && <p className="text-xs text-sky-200">{mediaInfo}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Escreva algo digno do feed..."
        className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-200/80 focus:outline-none focus:ring focus:ring-sky-200/10"
      />
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={loading} className="w-full lg:w-auto">
          {loading ? 'Publicando...' : 'Publicar'}
        </Button>
      </div>
    </form>
  )
}

export default PostComposer
