import type { ChangeEvent, FormEvent } from 'react'
import { useRef, useState } from 'react'
import api from '../../lib/api'
import Button from '../ui/Button'
import { Post, PostType } from '../../types'

const postTypes: { value: PostType; label: string }[] = [
  { value: 'healthy_food', label: 'Boa refeição' },
  { value: 'shame', label: 'Vergonha' },
  { value: 'exercise', label: 'Exercício' },
  { value: 'water', label: 'Hidratação' },
  { value: 'screen_time', label: 'Tempo de tela' }
]

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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-700">Compartilhe um momento</p>
      <div className="flex flex-col gap-3 lg:flex-row">
        <select
          value={type}
          onChange={(event) => setType(event.target.value as PostType)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
        >
          {postTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex w-full flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full px-3 py-2 text-xs sm:w-auto"
            onClick={() => fileInputRef.current?.click()}
          >
            Abrir câmera / upload
          </Button>
          {mediaInfo && <p className="text-xs text-emerald-600">{mediaInfo}</p>}
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
        className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
      />
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={loading} className="w-full bg-blue-500 text-white lg:w-auto">
          {loading ? 'Publicando...' : 'Publicar'}
        </Button>
      </div>
    </form>
  )
}

export default PostComposer
