import { Request, Response } from 'express'
import prisma from '../prisma'

const startOfDay = (date: Date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const endOfDay = (date: Date) => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export async function list(req: Request, res: Response) {
  try {
    const dayParam = req.query.day as string | undefined
    const ref = dayParam ? new Date(dayParam) : new Date()
    const start = startOfDay(ref)
    const end = endOfDay(ref)

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, waterGoalMl: true }
    })

    const waterLogs = await prisma.waterLog.groupBy({
      by: ['userId'],
      where: { date: { gte: start, lte: end } },
      _sum: { amountMl: true }
    })
    const exercises = await prisma.exerciseSession.findMany({
      where: { startTime: { gte: start, lte: end } },
      select: { userId: true }
    })
    const exerciseSet = new Set(exercises.map((e) => e.userId))

    const entries = users.map((u) => {
      const waterTotal = waterLogs.find((w) => w.userId === u.id)?._sum.amountMl ?? 0
      const waterMet = waterTotal >= u.waterGoalMl
      const exerciseDone = exerciseSet.has(u.id)
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        date: start.toISOString().substring(0, 10),
        waterTotal,
        waterGoal: u.waterGoalMl,
        waterMet,
        exerciseDone
      }
    })

    return res.json(entries)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}
