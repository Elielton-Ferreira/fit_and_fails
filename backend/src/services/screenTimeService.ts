import postService from './postService'
import screenTimeRepository from '../repositories/screenTimeRepository'
import notificationService from './notificationService'

const startOfDay = (date: Date) => {
  const clone = new Date(date)
  clone.setHours(0, 0, 0, 0)
  return clone
}

const weekRangeFromDate = (reference: Date) => {
  const day = reference.getDay()
  const diffToMonday = (day === 0 ? -6 : 1) - day
  const start = new Date(reference)
  start.setDate(reference.getDate() + diffToMonday)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return { start, end }
}

const addDays = (date: Date, days: number) => {
  const clone = new Date(date)
  clone.setDate(clone.getDate() + days)
  return clone
}

const recordLog = async ({
  userId,
  date,
  minutes,
  bookTitle,
  bookPages
}: {
  userId: string
  date: Date
  minutes: number
  bookTitle?: string
  bookPages?: number
}) => {
  const normalizedDate = startOfDay(date)
  return screenTimeRepository.upsertLog(userId, normalizedDate, minutes, bookTitle, bookPages)
}

const buildWeekSummary = async (userId: string, start: Date, end: Date) => {
  const logs = await screenTimeRepository.findBetween(userId, start, end)
  const totalMinutes = logs.reduce((acc, log) => acc + log.minutes, 0)
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000))
  const averageMinutes = Math.round(totalMinutes / days)
  return { logs, totalMinutes, averageMinutes }
}

const getWeeklySummary = async (userId: string) => {
  const currentRange = weekRangeFromDate(new Date())
  const previousRange = { start: addDays(currentRange.start, -7), end: currentRange.start }

  const current = await buildWeekSummary(userId, currentRange.start, currentRange.end)
  const previous = await buildWeekSummary(userId, previousRange.start, previousRange.end)
  const improvementMinutes = previous.averageMinutes - current.averageMinutes
  let trend: 'down' | 'up' | 'flat' = 'flat'
  if (improvementMinutes > 0) trend = 'down'
  if (improvementMinutes < 0) trend = 'up'

  return { current, previous, improvementMinutes, trend, range: currentRange }
}

const shareReduction = async (userId: string) => {
  const summary = await getWeeklySummary(userId)
  if (summary.improvementMinutes <= 0) throw new Error('Ainda não houve redução no tempo de tela')
  notificationService.notifyScreenTimeImprovement(userId, summary.improvementMinutes)

  const hours = Number((summary.improvementMinutes / 60).toFixed(1))
  return postService.create({
    userId,
    type: 'screen_time',
    text: `Reduzi ${hours} horas de tempo de tela nesta semana!`,
    badgeType: 'screen_time_hero'
  })
}

export default { recordLog, getWeeklySummary, shareReduction }
