import exerciseRepository from '../repositories/exerciseRepository'
import postService from './postService'
import postRepository from '../repositories/postRepository'

const createSession = async ({
  userId,
  type,
  startTime,
  endTime,
  notes,
  mediaUrls,
  shareToFeed
}: {
  userId: string
  type: string
  startTime: Date
  endTime: Date
  notes?: string
  mediaUrls?: string[]
  shareToFeed?: boolean
}) => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
  const session = await exerciseRepository.create({
    userId,
    type,
    startTime: start,
    endTime: end,
    notes,
    durationMinutes,
    mediaUrls
  })

  if (shareToFeed || durationMinutes >= 45) {
    await postService.create({
      userId,
      type: 'exercise',
      text: `Treino de ${type} por ${durationMinutes} minutos${notes ? ` - ${notes}` : ''}`,
      badgeType: durationMinutes >= 60 ? 'beast_mode' : 'active_day',
      imageUrl: mediaUrls?.[0]
    })
  }

  await maybePostStreak({ userId })

  return session
}

const listRecent = async (userId: string, limit = 5) => {
  return exerciseRepository.findRecentByUser(userId, limit)
}

const listSince = async (userId: string, days: number, limit = 100) => {
  const from = new Date()
  from.setDate(from.getDate() - days)
  return exerciseRepository.findByUserSince(userId, from, limit)
}

const getConsecutiveDays = (dates: Date[]) => {
  const daysSet = new Set(dates.map((d) => d.toISOString().substring(0, 10)))
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (true) {
    const key = cursor.toISOString().substring(0, 10)
    if (daysSet.has(key)) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

const maybePostStreak = async ({ userId }: { userId: string }) => {
  const from = new Date()
  from.setDate(from.getDate() - 14)
  const sessions = await exerciseRepository.findByUserSince(userId, from, 200)
  const streak = getConsecutiveDays(sessions.map((s) => s.startTime))
  if (streak > 0 && streak % 7 === 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const existing = await postRepository.findByUserTypeAndBadgeBetween(userId, 'exercise', `streak_week_${streak / 7}`, today, tomorrow)
    if (!existing) {
      await postService.create({
        userId,
        type: 'exercise',
        text: `Completei ${streak} dias consecutivos de treino! 🏅`,
        badgeType: `streak_week_${streak / 7}`
      })
    }
  }
}

export default { createSession, listRecent, listSince, maybePostStreak }
