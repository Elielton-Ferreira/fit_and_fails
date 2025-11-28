import { PostType } from '@prisma/client'
import prisma from '../prisma'

type FindAllFilters = {
  type?: PostType
  start?: Date
  end?: Date
  limit?: number
  commentLimit?: number
}

const findAll = async (filters?: FindAllFilters) => {
  const where = {
    ...(filters?.type ? { type: filters.type } : {}),
    ...(filters?.start || filters?.end
      ? {
          createdAt: {
            ...(filters?.start ? { gte: filters.start } : {}),
            ...(filters?.end ? { lt: filters.end } : {})
          }
        }
      : {})
  }

  return prisma.post.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      likes: {
        select: {
          userId: true,
          user: { select: { id: true, name: true, avatarUrl: true } }
        }
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: filters?.commentLimit ?? 5,
        include: { user: { select: { id: true, name: true, avatarUrl: true } } }
      },
      _count: { select: { likes: true, comments: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit
  })
}

const create = async (data: { userId: string; type: PostType; text?: string; imageUrl?: string; videoUrl?: string; badgeType?: string }) => {
  return prisma.post.create({ data })
}

const findById = async (id: string, commentLimit = 5) => {
  return prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      likes: {
        select: {
          userId: true,
          user: { select: { id: true, name: true, avatarUrl: true } }
        }
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: commentLimit,
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

const findPreviousDayWithPosts = async (before: Date, type?: PostType) => {
  const previous = await prisma.post.findFirst({
    where: {
      ...(type ? { type } : {}),
      createdAt: { lt: before }
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  })
  return previous?.createdAt ?? null
}

const findNextDayWithPosts = async (after: Date, type?: PostType) => {
  const next = await prisma.post.findFirst({
    where: {
      ...(type ? { type } : {}),
      createdAt: { gt: after }
    },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true }
  })
  return next?.createdAt ?? null
}

const findByUserTypeAndBadgeBetween = async (userId: string, type: PostType, badgeType: string, start: Date, end: Date) => {
  return prisma.post.findFirst({
    where: {
      userId,
      type,
      badgeType,
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

export default {
  findAll,
  create,
  findById,
  findByUserAndTypeBetween,
  findByUserTypeAndBadgeBetween,
  findPreviousDayWithPosts,
  findNextDayWithPosts,
  remove
}
