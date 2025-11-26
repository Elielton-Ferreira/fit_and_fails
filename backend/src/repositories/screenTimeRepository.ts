import prisma from '../prisma'

const upsertLog = (userId: string, date: Date, minutes: number) => {
  return prisma.screenTimeLog.upsert({
    where: { user_date_day: { userId, date } },
    update: { minutes },
    create: { userId, date, minutes }
  })
}

const findBetween = (userId: string, start: Date, end: Date) => {
  return prisma.screenTimeLog.findMany({
    where: { userId, date: { gte: start, lt: end } },
    orderBy: { date: 'asc' }
  })
}

export default { upsertLog, findBetween }
