import EventEmitter from 'events'

type NotificationPayload = {
  userId: string
  message: string
  meta?: Record<string, unknown>
}

const emitter = new EventEmitter()

const send = (event: string, payload: NotificationPayload) => {
  emitter.emit(event, payload)
  // eslint-disable-next-line no-console
  console.log(`[notification:${event}]`, payload.message)
}

const notifyWaterGoalReminder = (userId: string, progress: number) => {
  send('water.goal.reminder', {
    userId,
    message: `Faltam poucos ml para ${Math.round(progress)}% da meta de hoje`,
    meta: { progress }
  })
}

const notifyWaterGoalAchieved = (userId: string, totalMl: number, goalMl: number) => {
  send('water.goal.achieved', {
    userId,
    message: `Meta de ${goalMl}ml batida com ${totalMl}ml! Hora de postar no feed.`,
    meta: { totalMl, goalMl }
  })
}

const notifyScreenTimeImprovement = (userId: string, deltaMinutes: number) => {
  send('screen-time.reduced', {
    userId,
    message: `Redução de ${deltaMinutes} minutos no tempo de tela semanal`,
    meta: { deltaMinutes }
  })
}

export default {
  notifyWaterGoalReminder,
  notifyWaterGoalAchieved,
  notifyScreenTimeImprovement,
  on: emitter.on.bind(emitter)
}
