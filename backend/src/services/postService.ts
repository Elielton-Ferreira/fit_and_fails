import { Post, PostType } from '@prisma/client'
import postRepository from '../repositories/postRepository'
import likeRepository from '../repositories/likeRepository'
import commentRepository from '../repositories/commentRepository'

const allowedTypes: PostType[] = ['water', 'screen_time', 'exercise', 'shame', 'healthy_food']

type PostWithRelations = Post & {
  user: { id: string; name: string; avatarUrl?: string | null }
  _count: { likes: number; comments: number }
  likes: { userId: string }[]
  comments: { id: string; text: string; createdAt: Date; user: { id: string; name: string; avatarUrl?: string | null } }[]
}

const normalizeType = (type: string): PostType => {
  if (allowedTypes.includes(type as PostType)) return type as PostType
  throw new Error('Tipo de postagem inválido')
}

const mapPost = (post: PostWithRelations, viewerId?: string) => ({
  id: post.id,
  type: post.type,
  text: post.text,
  imageUrl: post.imageUrl,
  videoUrl: post.videoUrl,
  badgeType: post.badgeType,
  createdAt: post.createdAt,
  user: post.user,
  likes: {
    total: post._count.likes,
    likedByViewer: viewerId ? post.likes.some((like) => like.userId === viewerId) : false
  },
  comments: {
    total: post._count.comments,
    items: post.comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      user: comment.user
    }))
  }
})

const getAll = async ({ type, viewerId }: { type?: string; viewerId?: string } = {}) => {
  const normalizedType = type ? normalizeType(type) : undefined
  const posts = await postRepository.findAll(normalizedType ? { type: normalizedType } : undefined)
  return posts.map((post) => mapPost(post, viewerId))
}

const create = async ({
  userId,
  type,
  text,
  imageUrl,
  videoUrl,
  badgeType
}: {
  userId: string
  type: PostType | string
  text?: string
  imageUrl?: string
  videoUrl?: string
  badgeType?: string
}) => {
  const normalizedType = normalizeType(type)
  const post = await postRepository.create({ userId, type: normalizedType, text, imageUrl, videoUrl, badgeType })
  const fresh = (await postRepository.findById(post.id)) as PostWithRelations | null
  if (!fresh) throw new Error('Não foi possível carregar a postagem criada')
  return mapPost(fresh)
}

const likePost = async (postId: string, userId: string) => {
  const existing = await likeRepository.findByPostAndUser(postId, userId)
  if (existing) return getById(postId, userId)
  await likeRepository.create(postId, userId)
  return getById(postId, userId)
}

const unlikePost = async (postId: string, userId: string) => {
  const existing = await likeRepository.findByPostAndUser(postId, userId)
  if (existing) {
    await likeRepository.remove(existing.id)
  }
  return getById(postId, userId)
}

const addComment = async ({ postId, userId, text }: { postId: string; userId: string; text: string }) => {
  if (!text || !text.trim()) throw new Error('Comentário vazio')
  await commentRepository.create({ postId, userId, text: text.trim() })
  return getById(postId, userId)
}

const deleteComment = async ({ commentId, postId, userId }: { commentId: string; postId: string; userId: string }) => {
  const post = (await postRepository.findById(postId)) as PostWithRelations | null
  if (!post) throw new Error('Post não encontrado')
  const comment = post.comments.find((c) => c.id === commentId)
  if (!comment) throw new Error('Comentário não encontrado')
  if (comment.user.id !== userId) throw new Error('Você não pode excluir este comentário')
  await commentRepository.remove(commentId)
  return getById(postId, userId)
}

const remove = async ({ postId, userId }: { postId: string; userId: string }) => {
  const post = (await postRepository.findById(postId)) as PostWithRelations | null
  if (!post) throw new Error('Post não encontrado')
  if (post.userId !== userId) throw new Error('Você não pode excluir esta publicação')
  await postRepository.remove(postId)
  return { success: true }
}

const getById = async (id: string, viewerId?: string) => {
  const post = (await postRepository.findById(id)) as PostWithRelations | null
  if (!post) throw new Error('Post não encontrado')
  return mapPost(post, viewerId)
}

const hasPostForDay = async (userId: string, type: PostType, day: Date) => {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  const existing = await postRepository.findByUserAndTypeBetween(userId, type, start, end)
  return Boolean(existing)
}

export default { getAll, create, likePost, unlikePost, getById, hasPostForDay, addComment, deleteComment, remove }
