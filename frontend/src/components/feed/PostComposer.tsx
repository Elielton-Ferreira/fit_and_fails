import type { ChangeEvent, FormEvent } from 'react'
import { useRef, useState, useEffect, useMemo } from 'react'
import { useTheme } from '../../modules/theme/ThemeProvider'
import { useAuth } from '../../modules/auth/AuthContext'
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
        <path d="M6 6v12" />
        <path d="M18 6v12" />
        <path d="M9 4v16" />
        <path d="M15 4v16" />
        <path d="M3 10v4" />
        <path d="M21 10v4" />
        <path d="M3 12h18" />
      </svg>
    )
  },
  {
    value: 'screen_time',
    label: 'Livros',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20" />
        <path d="M6.5 2A2.5 2.5 0 0 0 4 4.5v15a2.5 2.5 0 0 1 2.5 2.5H20V2Z" />
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
    width="48"
    height="48"
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

const IconGallery = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-sky-200">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8" cy="9" r="2" />
    <path d="M3 16l4-3a2 2 0 0 1 2.7.2l3.6 3.6a2 2 0 0 0 2.8 0L21 13" />
  </svg>
)

const PostComposer = ({ onCreated, onPublished }: { onCreated: (post: Post) => void; onPublished?: () => void }) => {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [type, setType] = useState<PostType>('healthy_food')
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageScale, setImageScale] = useState(1)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null)
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mediaInfo, setMediaInfo] = useState('')
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const previewRef = useRef<HTMLDivElement | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!text.trim()) {
      setError('Conte algo para o feed 💬')
      return
    }
    try {
      setLoading(true)
      setError('')
      let finalImage = imageUrl
      if (imageUrl && imageMeta && previewSize) {
        try {
          finalImage = await cropImage(imageUrl, imageMeta, previewSize, imageScale, baseScale, imageOffset)
        } catch {
          finalImage = imageUrl
        }
      }

      const { data } = await api.post('/posts', { type, text, imageUrl: finalImage || undefined })
      onCreated(data)
      setText('')
      setImageUrl('')
      setImageScale(1)
      setImageOffset({ x: 0, y: 0 })
      setImageMeta(null)
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
    if (file.size > 15 * 1024 * 1024) {
      setError('Arquivo maior que 15MB. Escolha outro.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setImageUrl(String(reader.result))
      setMediaInfo(`Mídia anexada: ${file.name}`)
      setError('')
      const img = new Image()
      img.onload = () => setImageMeta({ width: img.naturalWidth, height: img.naturalHeight })
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const centerImage = () => {
    setImageScale(1)
    setImageOffset({ x: 0, y: 0 })
  }

  const clearMedia = () => {
    setImageScale(1)
    setImageOffset({ x: 0, y: 0 })
    setImageUrl('')
    setImageMeta(null)
    setMediaInfo('')
  }

  useEffect(() => {
    const updateSize = () => {
      if (!previewRef.current) return
      const rect = previewRef.current.getBoundingClientRect()
      setPreviewSize({ width: rect.width, height: rect.height })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [imageUrl])

  const baseScale = useMemo(() => {
    if (!imageMeta || !previewSize) return 1
    return Math.max(previewSize.width / imageMeta.width, previewSize.height / imageMeta.height)
  }, [imageMeta, previewSize])

const cropImage = async (
    dataUrl: string,
    meta: { width: number; height: number },
    viewport: { width: number; height: number },
    scale: number,
    base: number,
    offset: { x: number; y: number }
  ) => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = dataUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl

    const scaledWidth = meta.width * base * scale
    const scaledHeight = meta.height * base * scale
    const dx = viewport.width / 2 - scaledWidth / 2 + offset.x
    const dy = viewport.height / 2 - scaledHeight / 2 + offset.y

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, viewport.width, viewport.height)
    ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight)

    return canvas.toDataURL('image/png')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-3xl border border-white/10 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-start gap-3">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-bold uppercase text-white">
            {user?.name?.slice(0, 1)}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <p className={`text-sm uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Compartilhe</p>
          <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>O que rolou no seu dia?</h3>
          <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            {user?.name ? `${user.name}, ` : ''}escolha o tipo do post, suba mídia opcional e publique direto no feed.
          </p>
        </div>
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
                  ? 'border-sky-200/80 bg-white/10 text-white shadow-[0_12px_34px_rgba(63,124,255,0.28)]'
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
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Escreva algo digno do feed..."
          className={[
            'min-h-[70px] w-full rounded-2xl border px-4 py-3 text-sm placeholder:text-slate-500 focus:border-primary focus:outline-none',
            theme === 'light' ? 'border-slate-200 bg-white text-slate-900' : 'border-white/12 bg-white/5 text-white'
          ].join(' ')}
        />

        <div className="rounded-3xl border border-white/12 bg-white/5 p-3">
          <div className="flex justify-center">
            <div className="flex w-full max-w-md flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-center">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex h-20 w-20 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white transition hover:border-sky-200/60 hover:bg-white/10"
                  aria-label="Escolher da galeria"
                >
                  <IconGallery />
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex h-20 w-20 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white transition hover:border-sky-200/60 hover:bg-white/10"
                  aria-label="Abrir câmera"
                >
                  <IconCamera />
                </button>
              </div>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Galeria ou câmera (mobile mostra chooser nativo)</p>
              {mediaInfo && <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-sky-200'}`}>{mediaInfo}</p>}
            </div>
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          {imageUrl && (
            <div className="mt-4 space-y-3">
              <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30" ref={previewRef} role="presentation">
                <img
                  src={imageUrl}
                  alt="Pré-visualização"
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: imageMeta ? imageMeta.width * baseScale : '100%',
                    height: imageMeta ? imageMeta.height * baseScale : '100%',
                    transform: `translate(-50%, -50%) scale(${imageScale})`,
                    objectFit: 'cover'
                  }}
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/30" />
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <span>Zoom</span>
                  <span className="text-xs text-slate-400">{Math.round(imageScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={2}
                  step={0.05}
                  value={imageScale}
                  onChange={(event) => setImageScale(Number(event.target.value))}
                  className="w-full accent-sky-300"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" className="px-3 py-2 text-xs" onClick={centerImage}>
                    Centralizar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-3 py-2 text-xs"
                    onClick={() => setImageScale((prev) => Math.max(0.8, prev - 0.1))}
                  >
                    -
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-3 py-2 text-xs"
                    onClick={() => setImageScale((prev) => Math.min(2, prev + 0.1))}
                  >
                    +
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-3 py-2 text-xs text-rose-200 hover:text-rose-100"
                    onClick={clearMedia}
                  >
                    Cancelar mídia
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
