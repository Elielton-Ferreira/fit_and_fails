import exerciseRepository from '../repositories/exerciseRepository'
import postService from './postService'

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

  return session
}

const listRecent = async (userId: string, limit = 5) => {
  return exerciseRepository.findRecentByUser(userId, limit)
}

export default { createSession, listRecent }
