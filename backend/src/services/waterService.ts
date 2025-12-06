import postService from './postService'
import waterRepository from '../repositories/waterRepository'
import userRepository from '../repositories/userRepository'
import notificationService from './notificationService'

const defaultGoal = Number(process.env.WATER_DEFAULT_GOAL || 2000)

const startOfToday = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

const endOfToday = () => {
  const end = startOfToday()
  end.setDate(end.getDate() + 1)
  return end
}

const getGoalForUser = async (userId: string) => {
  const user = await userRepository.findById(userId)
  return user?.waterGoalMl || defaultGoal
}

const getTodaySnapshot = async (userId: string) => {
  const [goalMl, logs] = await Promise.all([
    getGoalForUser(userId),
    waterRepository.findByUserAndDateRange(userId, startOfToday(), endOfToday())
  ])
  const totalMl = logs.reduce((acc, log) => acc + log.amountMl, 0)
  const progress = goalMl ? Math.min(100, Math.round((totalMl / goalMl) * 100)) : 0
  const pendingMl = Math.max(goalMl - totalMl, 0)
  return {
    goalMl,
    totalMl,
    progress,
    pendingMl,
    canCelebrate: totalMl >= goalMl,
    logs
  }
}

const addLog = async ({
  userId,
  amountMl,
  dailyGoalMl,
  shareOnFeed
}: {
  userId: string
  amountMl: number
  dailyGoalMl?: number
  shareOnFeed?: boolean
}) => {
  const goal = dailyGoalMl || (await getGoalForUser(userId))
  await waterRepository.create({ userId, date: new Date(), amountMl, dailyGoalMl: goal })
  const snapshot = await getTodaySnapshot(userId)

  // Compartilha no feed apenas quando solicitado pelo usuário
  if (shareOnFeed) {
    await postService.create({
      userId,
      type: 'water',
      text: `Bebi ${amountMl}ml de água agora. Total do dia: ${snapshot.totalMl}ml.`
    })
  }

  if (snapshot.canCelebrate) {
    notificationService.notifyWaterGoalAchieved(userId, snapshot.totalMl, snapshot.goalMl)
    const justReachedGoal = snapshot.totalMl - amountMl < snapshot.goalMl
    if (justReachedGoal) {
      await postService.create({
        userId,
        type: 'water',
        text: `Bati a meta diária com ${snapshot.totalMl}ml de água!`,
        badgeType: 'hydration_master'
      })
    }
  } else if (snapshot.progress >= 75) {
    notificationService.notifyWaterGoalReminder(userId, snapshot.progress)
  }

  return snapshot
}

const updateGoal = async (userId: string, goalMl: number) => {
  const sanitized = Math.max(1000, Math.min(goalMl, 6000))
  await userRepository.updateWaterGoal(userId, sanitized)
  return getTodaySnapshot(userId)
}

export default { getTodaySnapshot, addLog, updateGoal }
