import { Request, Response } from 'express'
import prisma from '../prisma'

const parseDayParam = (day?: string) => {
  if (!day) return new Date()
  const [year, month, dayNumber] = day.split('-').map(Number)
  if ([year, month, dayNumber].some((value) => Number.isNaN(value))) return new Date()
  return new Date(year, month - 1, dayNumber)
}

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

const formatLocalDate = (date: Date) => {
  const local = new Date(date)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().substring(0, 10)
}

export async function list(req: Request, res: Response) {
  try {
    const dayParam = req.query.day as string | undefined
    const ref = parseDayParam(dayParam)
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
    const readingLogs = await prisma.bookLog.findMany({
      where: { date: { gte: start, lte: end } },
      select: { userId: true }
    })
    const readingSet = new Set(readingLogs.map((r) => r.userId))

    const entries = users.map((u) => {
      const waterTotal = waterLogs.find((w) => w.userId === u.id)?._sum.amountMl ?? 0
      const waterMet = waterTotal >= u.waterGoalMl
      const exerciseDone = exerciseSet.has(u.id)
      const readingDone = readingSet.has(u.id)
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        date: formatLocalDate(start),
        waterTotal,
        waterGoal: u.waterGoalMl,
        waterMet,
        exerciseDone,
        readingDone
      }
    })

    return res.json(entries)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function weekly(req: Request, res: Response) {
  try {
    const ref = parseDayParam(req.query.day ? String(req.query.day) : undefined)
    const start = startOfDay(ref)
    start.setDate(start.getDate() - start.getDay()) // Domingo
    const end = new Date(start)
    end.setDate(start.getDate() + 7)

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, waterGoalMl: true }
    })

    // Água por dia
    const waterLogs = await prisma.waterLog.findMany({
      where: { date: { gte: start, lt: end } },
      select: { userId: true, amountMl: true, date: true }
    })
    // Exercícios por dia
    const exerciseLogs = await prisma.exerciseSession.findMany({
      where: { startTime: { gte: start, lt: end } },
      select: { userId: true, startTime: true }
    })
    // Leitura por dia
    const readingLogs = await prisma.bookLog.findMany({
      where: { date: { gte: start, lt: end } },
      select: { userId: true, date: true }
    })

    const days = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(start)
      d.setDate(start.getDate() + idx)
      return formatLocalDate(d)
    })

    const waterByUserDay: Record<string, Record<string, number>> = {}
    waterLogs.forEach((log) => {
      const day = formatLocalDate(log.date)
      waterByUserDay[log.userId] = waterByUserDay[log.userId] || {}
      waterByUserDay[log.userId][day] = (waterByUserDay[log.userId][day] || 0) + log.amountMl
    })

    const exerciseByUserDay: Record<string, Set<string>> = {}
    exerciseLogs.forEach((log) => {
      const day = formatLocalDate(log.startTime)
      if (!exerciseByUserDay[log.userId]) exerciseByUserDay[log.userId] = new Set()
      exerciseByUserDay[log.userId].add(day)
    })

    const readingByUserDay: Record<string, Set<string>> = {}
    readingLogs.forEach((log) => {
      const day = formatLocalDate(log.date)
      if (!readingByUserDay[log.userId]) readingByUserDay[log.userId] = new Set()
      readingByUserDay[log.userId].add(day)
    })

    const entries = users.map((u) => {
      const week = days.map((day) => ({
        day,
        waterMet: (waterByUserDay[u.id]?.[day] ?? 0) >= u.waterGoalMl,
        exerciseDone: exerciseByUserDay[u.id]?.has(day) ?? false,
        readingDone: readingByUserDay[u.id]?.has(day) ?? false
      }))
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        days: week
      }
    })

    return res.json({ start: start.toISOString().substring(0, 10), days, entries })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}
