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
  isOwner = false
}: {
  post: Post
  onToggleLike: (postId: string, liked: boolean) => void
  onComment: (postId: string, text: string) => Promise<void>
  onDelete: (postId: string) => Promise<void>
  isOwner?: boolean
}) => {
  const meta = typeLabels[post.type]
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const visibleComments = post.comments.items.slice(0, 2)

  const submitComment = async () => {
    if (!comment.trim()) {
      setCommentError('Escreva um comentário')
      return
    }
    setCommentError('')
    await onComment(post.id, comment.trim())
    setComment('')
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          {post.user.avatarUrl ? (
            <img src={post.user.avatarUrl} alt={post.user.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              {post.user.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900">{post.user.name}</p>
            <p className="text-xs text-slate-500">{dayjs(post.createdAt).fromNow()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={`${meta.emoji} ${meta.label}`} variant={meta.variant} />
          {isOwner && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="rounded-full px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              Excluir
            </button>
          )}
        </div>
      </header>

      {post.imageUrl && (
        <div className="relative h-72 w-full overflow-hidden bg-slate-100">
          <img src={post.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="px-4 py-3">
        {post.badgeType && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
            🏅 {post.badgeType.replace(/_/g, ' ')}
          </p>
        )}
        {post.text && <p className="text-sm leading-relaxed text-slate-900">{post.text}</p>}
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onToggleLike(post.id, post.likes.likedByViewer)}
            className="text-lg text-slate-800 transition hover:opacity-70"
            aria-label={post.likes.likedByViewer ? 'Remover curtida' : 'Curtir'}
          >
            {post.likes.likedByViewer ? '💙' : '🤍'}
          </button>
          <span className="text-sm text-slate-600">{post.likes.total} curtidas</span>
          <span className="text-sm text-slate-600">{post.comments.total} comentários</span>
        </div>
      </div>

      <div className="px-4 py-3">
        {visibleComments.map((item) => (
          <div key={item.id} className="mb-2">
            <span className="text-sm font-semibold text-slate-900">{item.user.name}</span>{' '}
            <span className="text-sm text-slate-700">{item.text}</span>
            <span className="ml-2 text-xs text-slate-400">{dayjs(item.createdAt).fromNow()}</span>
          </div>
        ))}
        {post.comments.total > visibleComments.length && (
          <p className="text-sm font-medium text-slate-500">Ver todos os {post.comments.total} comentários</p>
        )}
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Adicione um comentário..."
            className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={submitComment}
            className="border-none bg-transparent px-3 py-1 text-sm font-semibold text-blue-600 hover:opacity-70"
          >
            Publicar
          </Button>
        </div>
        {commentError && <p className="mt-1 text-xs text-rose-500">{commentError}</p>}
      </div>
    </article>
  )
}

export default PostCard
