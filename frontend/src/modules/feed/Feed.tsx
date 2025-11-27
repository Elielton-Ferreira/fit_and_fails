import { useCallback, useEffect, useMemo, useState } from 'react'
import PostCard from '../../components/feed/PostCard'
import PostComposer from '../../components/feed/PostComposer'
import api from '../../lib/api'
import { Post, PostsByDayResponse } from '../../types'
import { useAuth } from '../auth/AuthContext'

const Feed = () => {
  const { user } = useAuth()
  const [sections, setSections] = useState<Array<{ day: string; posts: Post[] }>>([])
  const [previousDayCursor, setPreviousDayCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const dayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format,
    []
  )

  const mergeSection = (day: string, posts: Post[], mode: 'prepend' | 'append') => {
    setSections((prev) => {
      const exists = prev.find((section) => section.day === day)
      const rest = prev.filter((section) => section.day !== day)
      const mergedPosts = exists ? posts.concat(exists.posts.filter((p) => !posts.find((n) => n.id === p.id))) : posts
      const nextSection = { day, posts: mergedPosts }
      return mode === 'prepend' ? [nextSection, ...rest] : [...rest, nextSection]
    })
  }

  const fetchPosts = useCallback(async (day?: string, mode: 'replace' | 'append' = 'replace') => {
    try {
      if (mode === 'append') setLoadingMore(true)
      const { data } = await api.get<PostsByDayResponse>('/posts', { params: day ? { day } : undefined })
      if (mode === 'replace') {
        setSections([{ day: data.day, posts: data.posts }])
      } else {
        mergeSection(data.day, data.posts, 'append')
      }
      setPreviousDayCursor(data.previousDay)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleNewPost = (post: Post) => {
    const day = post.createdAt.substring(0, 10)
    mergeSection(day, [post], 'prepend')
  }

  const handleToggleLike = async (postId: string, liked: boolean) => {
    try {
      const response = liked ? await api.delete(`/posts/${postId}/like`) : await api.post(`/posts/${postId}/like`)
      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          posts: section.posts.map((post) => (post.id === postId ? response.data : post))
        }))
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAddComment = async (postId: string, text: string) => {
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { text })
      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          posts: section.posts.map((post) => (post.id === postId ? data : post))
        }))
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (postId: string) => {
    try {
      await api.delete(`/posts/${postId}`)
      setSections((prev) =>
        prev
          .map((section) => ({ ...section, posts: section.posts.filter((post) => post.id !== postId) }))
          .filter((section) => section.posts.length > 0)
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const { data } = await api.delete(`/posts/${postId}/comments/${commentId}`)
      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          posts: section.posts.map((post) => (post.id === postId ? data : post))
        }))
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <section id="feed" className="mx-auto max-w-3xl space-y-6">
      <PostComposer onCreated={handleNewPost} />
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Carregando histórias...</p>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.day} className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-white">
                  {dayLabel(new Date(section.day))}
                </span>
                <span className="text-xs text-slate-500">{section.posts.length} posts</span>
              </div>
              <div className="space-y-4">
                {section.posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onToggleLike={handleToggleLike}
                    onComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                    onDelete={handleDelete}
                    isOwner={user?.id === post.user.id}
                    currentUserId={user?.id}
                  />
                ))}
                {section.posts.length === 0 && <p className="text-sm text-slate-500">Sem publicações neste dia.</p>}
              </div>
            </div>
          ))}
          {previousDayCursor && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => fetchPosts(previousDayCursor, 'append')}
                disabled={loadingMore}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-200/50 hover:bg-white/10 disabled:opacity-60"
              >
                {loadingMore ? 'Carregando...' : 'Carregar dia anterior'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default Feed
