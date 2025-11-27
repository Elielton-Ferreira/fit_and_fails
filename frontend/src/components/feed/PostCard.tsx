import { useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { Post } from '../../types'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const typeLabels: Record<Post['type'], { label: string; variant: 'success' | 'warn' | 'info'; emoji: string }> = {
  water: { label: 'Hidratação', variant: 'info', emoji: '💧' },
  screen_time: { label: 'Tempo de tela', variant: 'warn', emoji: '⌛' },
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
  const meta = typeLabels[post.type]
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const visibleComments = post.comments.items.slice(0, 2)

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
    <article className="glass-panel rounded-3xl border border-white/10 bg-white/5 text-slate-100 shadow-[0_16px_50px_rgba(0,0,0,0.4)]">
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          {post.user.avatarUrl ? (
            <img src={post.user.avatarUrl} alt={post.user.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-300 text-sm font-bold text-slate-900">
              {post.user.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{post.user.name}</p>
            <p className="text-xs text-slate-400">{dayjs(post.createdAt).fromNow()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={`${meta.emoji} ${meta.label}`} variant={meta.variant} />
          {isOwner && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="rounded-full border border-rose-400/40 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10"
            >
              Excluir
            </button>
          )}
        </div>
      </header>

      {post.imageUrl && (
        <div className="relative h-72 w-full overflow-hidden rounded-b-3xl bg-black/30">
          <img src={post.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="px-5 py-4">
        {post.badgeType && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-200 drop-shadow-[0_2px_8px_rgba(63,124,255,0.55)]">
            🏅 {post.badgeType.replace(/_/g, ' ')}
          </p>
        )}
        {post.text && <p className="text-sm leading-relaxed text-slate-100">{post.text}</p>}
      </div>

      <div className="border-t border-white/5 px-5 py-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
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
            <span className="text-xs text-slate-400">
              Curtido por {post.likes.people[0].name}
              {post.likes.people.length > 1 && ` e +${post.likes.people.length - 1}`}
            </span>
          )}
          <span>{post.comments.total} comentários</span>
        </div>
      </div>

      <div className="px-5 py-4">
        {visibleComments.map((item) => (
          <div key={item.id} className="mb-3 flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className="text-sm font-semibold text-white">{item.user.name}</span>{' '}
              <span className="text-sm text-slate-200">{item.text}</span>
              <span className="ml-2 text-xs text-slate-500">{dayjs(item.createdAt).fromNow()}</span>
            </div>
            {currentUserId === item.user.id && (
              <button
                type="button"
                onClick={() => onDeleteComment(post.id, item.id)}
                className="text-xs font-semibold text-rose-200 hover:underline"
              >
                Excluir
              </button>
            )}
          </div>
        ))}
        {post.comments.total > visibleComments.length && (
          <p className="text-sm font-medium text-slate-400">Ver todos os {post.comments.total} comentários</p>
        )}
        <div className="mt-4 flex flex-col items-stretch gap-3 border-t border-white/5 pt-3 sm:flex-row">
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Adicione um comentário..."
            onKeyDown={handleCommentKey}
            className="flex-1 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-200/80 focus:outline-none focus:ring focus:ring-sky-200/10"
          />
          <Button type="button" variant="secondary" onClick={submitComment} disabled={sendingComment} className="whitespace-nowrap px-5">
            {sendingComment ? 'Enviando...' : 'Comentar'}
          </Button>
        </div>
        {commentError && <p className="mt-2 text-xs text-rose-300">{commentError}</p>}
      </div>
    </article>
  )
}

export default PostCard
