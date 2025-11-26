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

export default { findByEmail, findById, create, updateWaterGoal, updateProfile }
