import prisma from '../prisma'

const findByPostAndUser = (postId: string, userId: string) => {
  return prisma.like.findUnique({ where: { post_like_unique: { postId, userId } } })
}

const create = (postId: string, userId: string) => {
  return prisma.like.create({ data: { postId, userId } })
}

const remove = (id: string) => {
  return prisma.like.delete({ where: { id } })
}

const countByPost = (postId: string) => prisma.like.count({ where: { postId } })

export default { findByPostAndUser, create, remove, countByPost }
