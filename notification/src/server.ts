import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { initPush, sendPush } from './push.js'
import {
  deleteTokens,
  ensureSchema,
  fetchCommentSummary,
  fetchLikeSummary,
  fetchPostSummary,
  getHydrationReminderCandidates,
  getDevicesForBroadcast,
  getDevicesForUser,
  saveHydrationState,
  startDbListeners,
  upsertDevice
} from './repository.js'
import { logError, logInfo } from './logger.js'

type NotificationType = 'post_created' | 'like_created' | 'comment_created'

type DeviceRequest = {
  userId: string
  token: string
  deviceId?: string
  platform: 'android' | 'ios' | 'web'
  appVersion?: string
}

const app = express()
app.use(cors({ origin: '*'}))
app.use(express.json())

const postTypeLabels: Record<string, string> = {
  water: 'compartilhou uma boa hidratação',
  screen_time: 'compartilhou leitura',
  exercise: 'compartilhou exercícios',
  shame: 'fez um post da vergonha',
  healthy_food: 'compartilhou uma boa refeição',
  books: 'compartilhou leitura diária'
}

const ANDROID_VIBRATE = [0, 200, 100, 200]

const splitTokens = (devices: Array<{ token: string; platform: 'android' | 'ios' | 'web' }>) => {
  const webTokens: string[] = []
  const otherTokens: string[] = []
  for (const device of devices) {
    if (device.platform === 'web') webTokens.push(device.token)
    else otherTokens.push(device.token)
  }
  return { webTokens, otherTokens }
}

const buildWebpushConfig = () => ({
  headers: {
    Urgency: 'high'
  }
})

const hydrationReminderBody = (userName: string, level: 1 | 2 | 3) => {
  const name = userName?.trim() || 'Ei'
  if (level === 1) return `${name}, 60 min desde sua última hidratação💧\nQue tal um hidratar agora?`
  if (level === 2) return `${name}, 1h30 sem água, vc não é um Cactus🌵\nBora hidratar!`
  return `${name}, 2h sem água, a próxima é o rim reclamando 😅\nVamos hidratar!!!`
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', pushEnabled: config.pushEnabled })
})

app.post('/devices', async (req, res) => {
  const { userId, token, deviceId, platform, appVersion } = req.body as DeviceRequest

  if (!userId || !token || !platform) {
    return res.status(400).json({ error: 'userId, token e platform são obrigatórios' })
  }

  if (!['android', 'ios', 'web'].includes(platform)) {
    return res.status(400).json({ error: 'platform deve ser android, ios ou web' })
  }

  await upsertDevice({ userId, token, deviceId, platform, appVersion })
  res.json({ ok: true })
})

app.post('/test', async (req, res) => {
  const { userId } = req.body as { userId?: string }
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' })

  const devices = await getDevicesForUser(userId)
  const { webTokens, otherTokens } = splitTokens(devices)
  if (!webTokens.length && !otherTokens.length) return res.status(404).json({ error: 'Nenhum dispositivo para este usuário' })

  const data = { type: 'test', title: 'Teste de notificação', body: 'Push enviado pelo serviço de notificações' }

  const results = await Promise.all([
    webTokens.length
      ? sendPush({
          tokens: webTokens,
          data,
          webpush: buildWebpushConfig()
        })
      : Promise.resolve({ success: 0, failure: 0, invalidTokens: [] }),
    otherTokens.length
      ? sendPush({
          tokens: otherTokens,
          notification: { title: 'Teste de notificação', body: 'Push enviado pelo serviço de notificações' },
          data,
          android: {
            priority: 'high',
            notification: {
              vibrateTimingsMillis: ANDROID_VIBRATE
            }
          }
        })
      : Promise.resolve({ success: 0, failure: 0, invalidTokens: [] })
  ])

  const invalidTokens = results.flatMap((r) => r.invalidTokens)
  const sent = results.reduce((acc, r) => acc + r.success, 0)
  if (invalidTokens.length) await deleteTokens(invalidTokens)

  res.json({ ok: true, sent, invalidTokens })
})

const handlePostCreated = async (postId: string) => {
  const summary = await fetchPostSummary(postId)
  if (!summary) return

  const devices = await getDevicesForBroadcast(summary.authorId)
  const { webTokens, otherTokens } = splitTokens(devices)
  if (!webTokens.length && !otherTokens.length) return

  if (!config.pushEnabled || !config.firebase) {
    logInfo('Push não configurado; evento post_created recebido')
    return
  }

  const body = `${summary.authorName} ${postTypeLabels[summary.type] ?? 'compartilhou uma nova postagem'}`
  const url = `/dashboard#post-${summary.postId}`
  const icon = `/api/users/${summary.authorId}/avatar-circle`
  const title = 'Nova postagem no Fit & Fails'
  const data = {
    type: 'post_created',
    postId: summary.postId,
    authorId: summary.authorId,
    url,
    icon,
    title,
    body
  }

  const results = await Promise.all([
    webTokens.length
      ? sendPush({
          tokens: webTokens,
          data,
          webpush: buildWebpushConfig()
        })
      : Promise.resolve({ success: 0, failure: 0, invalidTokens: [] }),
    otherTokens.length
      ? sendPush({
          tokens: otherTokens,
          notification: { title, body },
          data,
          android: {
            priority: 'high',
            notification: {
              vibrateTimingsMillis: ANDROID_VIBRATE
            }
          }
        })
      : Promise.resolve({ success: 0, failure: 0, invalidTokens: [] })
  ])

  const invalidTokens = results.flatMap((r) => r.invalidTokens)
  const sent = results.reduce((acc, r) => acc + r.success, 0)
  const failures = results.reduce((acc, r) => acc + r.failure, 0)
  if (invalidTokens.length) await deleteTokens(invalidTokens)
  logInfo(`post_created => sent ${sent} pushes, ${failures} falhas`)
}

const handleLikeCreated = async (likeId: string) => {
  const summary = await fetchLikeSummary(likeId)
  if (!summary) return
  if (summary.postOwnerId === summary.likerId) return

  const devices = await getDevicesForUser(summary.postOwnerId)
  const { webTokens, otherTokens } = splitTokens(devices)
  if (!webTokens.length && !otherTokens.length) return

  if (!config.pushEnabled || !config.firebase) {
    logInfo('Push não configurado; evento like_created recebido')
    return
  }

  const body = `${summary.likerName} curtiu seu post`
  const url = `/dashboard#post-${summary.postId}`
  const icon = `/api/users/${summary.likerId}/avatar-circle`
  const title = 'Novo like no seu post'
  const data = {
    type: 'like_created',
    postId: summary.postId,
    likerId: summary.likerId,
    postOwnerId: summary.postOwnerId,
    postType: summary.postType,
    url,
    icon,
    title,
    body
  }

  const results = await Promise.all([
    webTokens.length
      ? sendPush({
          tokens: webTokens,
          data,
          webpush: buildWebpushConfig()
        })
      : Promise.resolve({ success: 0, failure: 0, invalidTokens: [] }),
    otherTokens.length
      ? sendPush({
          tokens: otherTokens,
          notification: { title, body },
          data,
          android: {
            priority: 'high',
            notification: {
              vibrateTimingsMillis: ANDROID_VIBRATE
            }
          }
        })
      : Promise.resolve({ success: 0, failure: 0, invalidTokens: [] })
  ])

  const invalidTokens = results.flatMap((r) => r.invalidTokens)
  const sent = results.reduce((acc, r) => acc + r.success, 0)
  const failures = results.reduce((acc, r) => acc + r.failure, 0)
  if (invalidTokens.length) await deleteTokens(invalidTokens)
  logInfo(`like_created => sent ${sent} pushes, ${failures} falhas`)
}

const truncate = (value: string, max: number) => {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

const handleCommentCreated = async (commentId: string) => {
  const summary = await fetchCommentSummary(commentId)
  if (!summary) return
  if (summary.postOwnerId === summary.commenterId) return

  const devices = await getDevicesForUser(summary.postOwnerId)
  const { webTokens, otherTokens } = splitTokens(devices)
  if (!webTokens.length && !otherTokens.length) return

  if (!config.pushEnabled || !config.firebase) {
    logInfo('Push não configurado; evento comment_created recebido')
    return
  }

  const commentSnippet = truncate(summary.commentText, 90)
  const body = `${summary.commenterName}: ${commentSnippet}`
  const url = `/dashboard#comment-${summary.commentId}`
  const icon = `/api/users/${summary.commenterId}/avatar-circle`
  const title = 'Novo comentário no seu post'
  const data = {
    type: 'comment_created',
    postId: summary.postId,
    commentId: summary.commentId,
    commenterId: summary.commenterId,
    postOwnerId: summary.postOwnerId,
    postType: summary.postType,
    url,
    icon,
    title,
    body
  }

  const results = await Promise.all([
    webTokens.length
      ? sendPush({
          tokens: webTokens,
          data,
          webpush: buildWebpushConfig()
        })
      : Promise.resolve({ success: 0, failure: 0, invalidTokens: [] }),
    otherTokens.length
      ? sendPush({
          tokens: otherTokens,
          notification: { title, body },
          data,
          android: {
            priority: 'high',
            notification: {
              vibrateTimingsMillis: ANDROID_VIBRATE
            }
          }
        })
      : Promise.resolve({ success: 0, failure: 0, invalidTokens: [] })
  ])

  const invalidTokens = results.flatMap((r) => r.invalidTokens)
  const sent = results.reduce((acc, r) => acc + r.success, 0)
  const failures = results.reduce((acc, r) => acc + r.failure, 0)
  if (invalidTokens.length) await deleteTokens(invalidTokens)
  logInfo(`comment_created => sent ${sent} pushes, ${failures} falhas`)
}

const processHydrationReminders = async () => {
  if (!config.pushEnabled || !config.firebase) return

  const now = new Date()
  const hour = now.getHours()

  // Apenas entre 07:00 e 00:00
  if (hour < 7 || hour >= 24) return

  const windowStart = new Date(now)
  windowStart.setHours(7, 0, 0, 0)

  const candidates = await getHydrationReminderCandidates()

  for (const candidate of candidates) {
    const devices = await getDevicesForUser(candidate.userId)
    const { webTokens, otherTokens } = splitTokens(devices)
    if (!webTokens.length && !otherTokens.length) continue

    const hasNewDrink =
      candidate.lastDrinkAt &&
      (!candidate.stateLastDrinkAt || candidate.lastDrinkAt > candidate.stateLastDrinkAt)

    const reminderLevel = hasNewDrink || (!candidate.lastDrinkAt && candidate.stateLastDrinkAt)
      ? 0
      : candidate.lastReminderLevel ?? 0

    const lastDrinkReference =
      candidate.lastDrinkAt && candidate.lastDrinkAt > windowStart
        ? candidate.lastDrinkAt
        : windowStart
    const minutesWithoutWater = (now.getTime() - lastDrinkReference.getTime()) / 60000

    let targetLevel: 0 | 1 | 2 | 3 = 0
    if (minutesWithoutWater >= 120) {
      targetLevel = 3
    } else if (minutesWithoutWater >= 90) {
      targetLevel = 2
    } else if (minutesWithoutWater >= 60) {
      targetLevel = 1
    }

    if (targetLevel === 0 || targetLevel <= reminderLevel) {
      if (hasNewDrink || (!candidate.lastDrinkAt && candidate.stateLastDrinkAt)) {
        await saveHydrationState({
          userId: candidate.userId,
          lastDrinkAt: candidate.lastDrinkAt,
          lastReminderLevel: reminderLevel
        })
      }
      continue
    }

    const body = hydrationReminderBody(candidate.userName, targetLevel)
    const icon = '/notification-water.svg'
    const url = '/water'
    const title = 'Bora beber água?'
    const data = { type: 'water_reminder', level: String(targetLevel), icon, url, title, body }

    const results = await Promise.all([
      webTokens.length
        ? sendPush({
            tokens: webTokens,
            data,
            webpush: buildWebpushConfig()
          })
        : Promise.resolve({ success: 0, failure: 0, invalidTokens: [] }),
      otherTokens.length
        ? sendPush({
            tokens: otherTokens,
            notification: { title, body },
            data,
            android: {
              priority: 'high',
              notification: {
                vibrateTimingsMillis: ANDROID_VIBRATE
              }
            }
          })
        : Promise.resolve({ success: 0, failure: 0, invalidTokens: [] })
    ])

    const invalidTokens = results.flatMap((r) => r.invalidTokens)
    const sent = results.reduce((acc, r) => acc + r.success, 0)
    const failures = results.reduce((acc, r) => acc + r.failure, 0)

    if (invalidTokens.length) await deleteTokens(invalidTokens)
    await saveHydrationState({
      userId: candidate.userId,
      lastDrinkAt: candidate.lastDrinkAt,
      lastReminderLevel: targetLevel
    })
    logInfo(`hydration => sent ${sent} pushes (level ${targetLevel}) for user ${candidate.userId} (${failures} falhas)`)
  }
}

const bootstrap = async () => {
  await ensureSchema()
  initPush()

  await startDbListeners({
    onPostCreated: async (payload) => handlePostCreated(payload.post_id),
    onLikeCreated: async (payload) => handleLikeCreated(payload.like_id),
    onCommentCreated: async (payload) => handleCommentCreated(payload.comment_id)
  })

  // Checa lembretes de água periodicamente
  const runHydration = () =>
    processHydrationReminders().catch((err) =>
      logError('Failed to process hydration reminders', err)
    )
  runHydration()
  setInterval(runHydration, 5 * 60 * 1000)

  app.listen(config.port, () => {
    logInfo(`Notification service listening on :${config.port}`)
  })
}

bootstrap().catch((err) => {
  logError('Failed to start notification service', err)
  process.exit(1)
})
