import { PostType } from '@prisma/client'
import prisma from '../prisma'

const findAll = async (filters?: { type?: PostType }) => {
  const where = filters?.type ? { type: filters.type } : undefined
  return prisma.post.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      likes: { select: { userId: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } }
      },
      _count: { select: { likes: true, comments: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

const create = async (data: { userId: string; type: PostType; text?: string; imageUrl?: string; videoUrl?: string; badgeType?: string }) => {
  return prisma.post.create({ data })
}

const findById = async (id: string) => {
  return prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      likes: { select: { userId: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } }
      },
      _count: { select: { likes: true, comments: true } }
    }
  })
}

const findByUserAndTypeBetween = async (userId: string, type: PostType, start: Date, end: Date) => {
  return prisma.post.findFirst({
    where: {
      userId,
      type,
      createdAt: { gte: start, lt: end }
    }
  })
}

const remove = async (id: string) => {
  return prisma.$transaction([
    prisma.comment.deleteMany({ where: { postId: id } }),
    prisma.like.deleteMany({ where: { postId: id } }),
    prisma.post.delete({ where: { id } })
  ])
}

export default { findAll, create, findById, findByUserAndTypeBetween, remove }
