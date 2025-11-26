import prisma from '../prisma'

type ExercisePayload = {
  userId: string
  type: string
  startTime: Date
  endTime: Date
  notes?: string
  durationMinutes?: number | null
  mediaUrls?: string[]
}

const create = (payload: ExercisePayload) => {
  return prisma.exerciseSession.create({ data: { ...payload, mediaUrls: payload.mediaUrls ?? [] } })
}

const findRecentByUser = (userId: string, limit = 10) => {
  return prisma.exerciseSession.findMany({
    where: { userId },
    orderBy: { startTime: 'desc' },
    take: limit
  })
}

const findByUserSince = (userId: string, from: Date, limit = 100) => {
  return prisma.exerciseSession.findMany({
    where: { userId, startTime: { gte: from } },
    orderBy: { startTime: 'desc' },
    take: limit
  })
}

export default { create, findRecentByUser, findByUserSince }
