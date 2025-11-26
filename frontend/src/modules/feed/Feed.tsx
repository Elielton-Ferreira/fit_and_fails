import { useCallback, useEffect, useState } from 'react'
import PostCard from '../../components/feed/PostCard'
import PostComposer from '../../components/feed/PostComposer'
import api from '../../lib/api'
import { Post } from '../../types'
import { useAuth } from '../auth/AuthContext'

const Feed = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPosts = useCallback(async () => {
    try {
      const { data } = await api.get('/posts')
      setPosts(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleNewPost = (post: Post) => {
    setPosts((prev) => [post, ...prev])
  }

  const handleToggleLike = async (postId: string, liked: boolean) => {
    try {
      const response = liked ? await api.delete(`/posts/${postId}/like`) : await api.post(`/posts/${postId}/like`)
      setPosts((prev) => prev.map((post) => (post.id === postId ? response.data : post)))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAddComment = async (postId: string, text: string) => {
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { text })
      setPosts((prev) => prev.map((post) => (post.id === postId ? data : post)))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (postId: string) => {
    try {
      await api.delete(`/posts/${postId}`)
      setPosts((prev) => prev.filter((post) => post.id !== postId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <section id="feed" className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-slate-400">Compartilhe o que rolou</p>
        <h3 className="text-2xl font-semibold text-white">Feed Fit &amp; Fails</h3>
      </div>
      <PostComposer onCreated={handleNewPost} />
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Carregando histórias...</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={handleToggleLike}
              onComment={handleAddComment}
              onDelete={handleDelete}
              isOwner={user?.id === post.user.id}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default Feed
