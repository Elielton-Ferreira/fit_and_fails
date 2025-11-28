import prisma from '../prisma'

const findByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } })
}

const findById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } })
}

const create = async ({ name, email, passwordHash }: { name: string; email: string; passwordHash: string }) => {
  return prisma.user.create({ data: { name, email, passwordHash } })
}

const updateWaterGoal = async (userId: string, waterGoalMl: number) => {
  return prisma.user.update({ where: { id: userId }, data: { waterGoalMl } })
}

const updateProfile = async (userId: string, data: { name?: string; avatarUrl?: string | null }) => {
  return prisma.user.update({ where: { id: userId }, data })
}

const listAll = async () => {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  })
}

const updatePasswordHash = async (userId: string, passwordHash: string) => {
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}

const removeWithRelations = async (userId: string) => {
  return prisma.$transaction(async (tx) => {
    const posts = await tx.post.findMany({ where: { userId }, select: { id: true } })
    const postIds = posts.map((p) => p.id)

    if (postIds.length > 0) {
      await tx.comment.deleteMany({ where: { postId: { in: postIds } } })
      await tx.like.deleteMany({ where: { postId: { in: postIds } } })
    }

    await tx.comment.deleteMany({ where: { userId } })
    await tx.like.deleteMany({ where: { userId } })
    await tx.post.deleteMany({ where: { userId } })
    await tx.user.delete({ where: { id: userId } })

    return { success: true }
  })
}

export default { findByEmail, findById, create, updateWaterGoal, updateProfile, listAll, updatePasswordHash, removeWithRelations }
