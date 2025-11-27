import prisma from '../prisma'

const upsertLog = (userId: string, date: Date, minutes: number, bookTitle?: string, bookPages?: number) => {
  return prisma.screenTimeLog.upsert({
    where: { user_date_day: { userId, date } },
    update: { minutes, bookTitle, bookPages },
    create: { userId, date, minutes, bookTitle, bookPages }
  })
}

const findBetween = (userId: string, start: Date, end: Date) => {
  return prisma.screenTimeLog.findMany({
    where: { userId, date: { gte: start, lt: end } },
    orderBy: { date: 'asc' }
  })
}

export default { upsertLog, findBetween }
