import prisma from '../prisma'

const findByUserAndDateRange = async (userId: string, start: Date, end: Date) => {
  return prisma.waterLog.findMany({
    where: { userId, date: { gte: start, lt: end } },
    orderBy: { date: 'asc' }
  })
}

const create = async ({ userId, date, amountMl, dailyGoalMl }: { userId: string; date: Date; amountMl: number; dailyGoalMl?: number }) => {
  return prisma.waterLog.create({ data: { userId, date, amountMl, dailyGoalMl } })
}

export default { findByUserAndDateRange, create }
