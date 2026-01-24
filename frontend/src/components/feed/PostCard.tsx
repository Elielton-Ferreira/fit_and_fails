import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Post } from '../../types'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const typeLabels: Record<Post['type'], string> = {
  water: 'Hidratação',
  screen_time: 'Leitura',
  exercise: 'Exercício',
  shame: 'Post da vergonha',
  healthy_food: 'Refeição Fit'
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
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [showCommentBox, setShowCommentBox] = useState(false)

  const subtitle = useMemo(() => {
    if (post.badgeType) return post.badgeType.replace(/_/g, ' ')
    return typeLabels[post.type]
  }, [post.badgeType, post.type])

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

  const renderCaption = () => {
    if (!post.text) return null
    return post.text.split(' ').map((word, idx) => {
      const isHash = word.startsWith('#')
      return (
        <span key={`${word}-${idx}`} className={isHash ? 'text-pink-400 font-semibold' : ''}>
          {word}
          {idx < post.text.split(' ').length - 1 ? ' ' : ''}
        </span>
      )
    })
  }

  const LikeIcon = ({ filled }: { filled: boolean }) =>
    filled ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21s-6.716-3.74-9.424-8.254C.454 9.7 1.398 5.708 4.514 4.25c1.939-.888 4.14-.24 5.486 1.152C11.346 4.01 13.547 3.362 15.486 4.25c3.116 1.458 4.06 5.45 1.938 8.496C18.716 17.26 12 21 12 21z" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.76 4.012c1.6-1.54 4.2-1.54 5.8 0 1.6 1.54 1.6 4.04 0 5.58L12 16.2l-6.56-6.61c-1.6-1.54-1.6-4.04 0-5.58 1.6-1.54 4.2-1.54 5.8 0L12 5.5l.76-.744z" />
      </svg>
    )

  return (
    <>
      <article
        id={`post-${post.id}`}
        className="overflow-hidden rounded-none border border-black/0 bg-black text-white sm:rounded-3xl sm:border-white/10 sm:shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            {post.user.avatarUrl ? (
              <img src={post.user.avatarUrl} alt={post.user.name} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-sm font-bold text-slate-900">
                {post.user.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="leading-tight">
              <p className="text-sm font-semibold">{post.user.name}</p>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-white/10"
            >
              Excluir
            </button>
          )}
        </header>

        {post.imageUrl && (
          <button
            type="button"
            className="relative block aspect-[4/5] w-full overflow-hidden bg-black focus:outline-none"
            onClick={() => setPreviewOpen(true)}
          >
            <img src={post.imageUrl} alt="Prévia da publicação" className="h-full w-full object-cover" loading="lazy" />
          </button>
        )}

        <div className="px-4 py-3">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => onToggleLike(post.id, post.likes.likedByViewer)} aria-label="Curtir">
              <LikeIcon filled={post.likes.likedByViewer} />
            </button>
            <button type="button" onClick={() => setShowCommentBox(true)} aria-label="Comentar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-8 8l4.586-4.586a2 2 0 011.414-.586H19a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12z" />
              </svg>
            </button>
            <button type="button" aria-label="Enviar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5L19.5 12 4.5 4.5v6l10 1.5-10 1.5v6z" />
              </svg>
            </button>
            <div className="ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h12v16l-6-4-6 4V4z" />
              </svg>
            </div>
          </div>

          <p className="mt-3 text-sm font-semibold">{post.likes.total.toLocaleString('pt-BR')} curtidas</p>

          <div className="mt-2 text-sm leading-relaxed text-white">
            <span className="font-semibold">{post.user.name}</span>{' '}
            <span className="text-slate-100">{renderCaption()}</span>
          </div>
          {post.comments.total > 0 && (
            <button
              type="button"
              onClick={() => setShowCommentBox(true)}
              className="mt-2 text-xs font-semibold text-slate-300 hover:underline"
            >
              Ver todos os {post.comments.total} comentários
            </button>
          )}
          <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{dayjs(post.createdAt).fromNow()}</p>

          {showCommentBox && (
            <div className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Adicione um comentário..."
                onKeyDown={handleCommentKey}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={sendingComment}
                className="text-xs font-semibold text-sky-300 disabled:opacity-50"
              >
                {sendingComment ? 'Enviando...' : 'Publicar'}
              </button>
            </div>
          )}
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
