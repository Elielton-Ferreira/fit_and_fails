import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { Post } from '../../types'
import { useTheme } from '../../modules/theme/ThemeProvider'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const typeLabels: Record<Post['type'], { label: string; variant: 'success' | 'warn' | 'info'; emoji: string }> = {
  water: { label: 'Hidratação', variant: 'info', emoji: '💧' },
  screen_time: { label: 'Leitura', variant: 'warn', emoji: '🤓' },
  exercise: { label: 'Exercício', variant: 'success', emoji: '💪' },
  shame: { label: 'Post da vergonha', variant: 'warn', emoji: '🙈' },
  healthy_food: { label: 'Refeição Fit', variant: 'success', emoji: '🥗' }
}

const PostCard = ({
  post,
  onToggleLike,
  onComment,
  onDelete,
  onDeleteComment,
  isOwner = false,
  currentUserId
}: {
  post: Post
  onToggleLike: (postId: string, liked: boolean) => void
  onComment: (postId: string, text: string) => Promise<void>
  onDelete: (postId: string) => Promise<void>
  onDeleteComment: (postId: string, commentId: string) => Promise<void>
  isOwner?: boolean
  currentUserId?: string
}) => {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const meta = typeLabels[post.type]
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const visibleComments = post.comments.items.slice(0, 2)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    if (!previewOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [previewOpen])

  const handleCommentKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      submitComment()
    }
  }

  const submitComment = async () => {
    if (!comment.trim()) {
      setCommentError('Escreva um comentário')
      return
    }
    try {
      setSendingComment(true)
      setCommentError('')
      await onComment(post.id, comment.trim())
      setComment('')
    } catch (err: any) {
      setCommentError(err.message || 'Não foi possível comentar agora.')
    } finally {
      setSendingComment(false)
    }
  }

  return (
    <>
      <article
      className={[
        'glass-panel rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.4)]',
        isLight ? 'border border-slate-200 bg-white text-slate-900' : 'border border-white/10 bg-white/5 text-slate-100'
      ].join(' ')}
    >
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          {post.user.avatarUrl ? (
            <img src={post.user.avatarUrl} alt={post.user.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div
              className={[
                'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold',
                isLight
                  ? 'bg-gradient-to-br from-sky-200 to-blue-200 text-slate-900'
                  : 'bg-gradient-to-br from-sky-400 to-blue-300 text-slate-900'
              ].join(' ')}
            >
              {post.user.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{post.user.name}</p>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{dayjs(post.createdAt).fromNow()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={`${meta.emoji} ${meta.label}`} variant={meta.variant} />
          {isOwner && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className={[
                'rounded-full px-3 py-1 text-xs font-semibold transition',
                isLight
                  ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                  : 'border border-rose-400/40 text-rose-200 hover:bg-rose-500/10'
              ].join(' ')}
            >
              Excluir
            </button>
          )}
        </div>
      </header>

        {post.imageUrl && (
          <button
            type="button"
            className="relative h-72 w-full overflow-hidden rounded-b-3xl bg-black/30 focus:outline-none"
            onClick={() => setPreviewOpen(true)}
          >
            <img src={post.imageUrl} alt="Prévia da publicação" className="h-full w-full object-cover" loading="lazy" />
          </button>
        )}

      <div className="px-5 py-4">
        {post.badgeType && (
          <p
            className={[
              'mb-2 text-xs font-semibold uppercase tracking-wide',
              isLight ? 'text-sky-700' : 'text-sky-200 drop-shadow-[0_2px_8px_rgba(63,124,255,0.55)]'
            ].join(' ')}
          >
            🏅 {post.badgeType.replace(/_/g, ' ')}
          </p>
        )}
        {post.text && <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>{post.text}</p>}
      </div>

      <div className={['px-5 py-3', isLight ? 'border-t border-slate-200' : 'border-t border-white/5'].join(' ')}>
        <div className={`flex flex-wrap items-center gap-3 text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          <button
            type="button"
            onClick={() => onToggleLike(post.id, post.likes.likedByViewer)}
            className="text-lg transition hover:scale-105"
            aria-label={post.likes.likedByViewer ? 'Remover curtida' : 'Curtir'}
          >
            {post.likes.likedByViewer ? '❤️' : '🤍'}
          </button>
          <span>{post.likes.total} curtidas</span>
          {post.likes.people && post.likes.people.length > 0 && (
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Curtido por {post.likes.people.map((p) => p.name).join(', ')}
            </span>
          )}
          <span>{post.comments.total} comentários</span>
        </div>
      </div>

      <div className="px-5 py-4">
        {post.comments.items.map((item) => (
          <div key={item.id} className="mb-3 flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.user.name}</span>{' '}
              <span className={`text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item.text}</span>
              <span className={`ml-2 text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{dayjs(item.createdAt).fromNow()}</span>
            </div>
            {currentUserId === item.user.id && (
              <button
                type="button"
                onClick={() => onDeleteComment(post.id, item.id)}
                className={`text-xs font-semibold hover:underline ${isLight ? 'text-rose-600' : 'text-rose-200'}`}
              >
                Excluir
              </button>
            )}
          </div>
        ))}
        {post.comments.total > visibleComments.length && (
          <p className="text-sm font-medium text-slate-400">Ver todos os {post.comments.total} comentários</p>
        )}
        <div
          className={[
            'mt-4 flex flex-col items-stretch gap-3 pt-3 sm:flex-row',
            isLight ? 'border-t border-slate-200' : 'border-t border-white/5'
          ].join(' ')}
        >
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Adicione um comentário..."
            onKeyDown={handleCommentKey}
            className={[
              'flex-1 rounded-full px-4 py-2 text-sm placeholder:text-slate-500 focus:border-sky-200/80 focus:outline-none focus:ring focus:ring-sky-200/10',
              isLight ? 'border border-slate-200 bg-white text-slate-900' : 'border border-white/12 bg-white/5 text-white'
            ].join(' ')}
          />
          <Button
            type="button"
            variant={comment.trim() ? 'primary' : 'secondary'}
            onClick={submitComment}
            disabled={sendingComment}
            className="whitespace-nowrap px-5"
          >
            {sendingComment ? 'Enviando...' : 'Comentar'}
          </Button>
        </div>
        {commentError && <p className="mt-2 text-xs text-rose-300">{commentError}</p>}
      </div>
      </article>
      {previewOpen && post.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="max-h-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={post.imageUrl} alt="Visualização ampliada" className="h-full w-full object-contain" />
            <div className="flex justify-end border-t border-white/10 bg-black/50 p-3">
              <Button type="button" onClick={() => setPreviewOpen(false)} className="px-6">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PostCard
