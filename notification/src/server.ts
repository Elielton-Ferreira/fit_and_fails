import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { initPush, sendPush } from './push.js'
import {
  deleteTokens,
  ensureSchema,
  fetchLikeSummary,
  fetchPostSummary,
  getHydrationReminderCandidates,
  getTokensForBroadcast,
  getTokensForUser,
  saveHydrationState,
  startDbListeners,
  upsertDevice
} from './repository.js'
import { logError, logInfo } from './logger.js'

type NotificationType = 'post_created' | 'like_created'

type DeviceRequest = {
  userId: string
  token: string
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

const hydrationMessages: Record<
  1 | 2 | 3,
  string[]
> = {
  1: [
    'Ei… já faz 1 hora desde o último gole. Seu corpo está olhando pra garrafa 👀',
    'Alô, hidratação! Já passou 1 hora… bora dar um golinho?'
  ],
  2: [
    'Já faz um tempinho sem água… sua pele pediu pra avisar 😬',
    '2ª chamada da hidratação! O copo tá te esperando'
  ],
  3: [
    'ALERTA DE SEDE 🚨 Seu corpo entrou no modo economia de água!',
    'Parabéns! Você desbloqueou o nível Deserto do Saara 🏜️'
  ]
}

const pickMessage = (level: 1 | 2 | 3) => {
  const options = hydrationMessages[level]
  return options[Math.floor(Math.random() * options.length)]
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', pushEnabled: config.pushEnabled })
})

app.post('/devices', async (req, res) => {
  const { userId, token, platform, appVersion } = req.body as DeviceRequest

  if (!userId || !token || !platform) {
    return res.status(400).json({ error: 'userId, token e platform são obrigatórios' })
  }

  if (!['android', 'ios', 'web'].includes(platform)) {
    return res.status(400).json({ error: 'platform deve ser android, ios ou web' })
  }

  await upsertDevice({ userId, token, platform, appVersion })
  res.json({ ok: true })
})

app.post('/test', async (req, res) => {
  const { userId } = req.body as { userId?: string }
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' })

  const tokens = await getTokensForUser(userId)
  if (!tokens.length) return res.status(404).json({ error: 'Nenhum dispositivo para este usuário' })

  const result = await sendPush({
    tokens,
    notification: { title: 'Teste de notificação', body: 'Push enviado pelo serviço de notificações' },
    data: { type: 'test' }
  })

  if (result.invalidTokens.length) await deleteTokens(result.invalidTokens)

  res.json({ ok: true, sent: result.success, invalidTokens: result.invalidTokens })
})

const handlePostCreated = async (postId: string) => {
  const summary = await fetchPostSummary(postId)
  if (!summary) return

  const tokens = await getTokensForBroadcast(summary.authorId)
  if (!tokens.length) return

  if (!config.pushEnabled || !config.firebase) {
    logInfo('Push não configurado; evento post_created recebido')
    return
  }

  const body = `${summary.authorName} ${postTypeLabels[summary.type] ?? 'compartilhou uma nova postagem'}`
  const url = `/dashboard#post-${summary.postId}`
  const icon = `/api/users/${summary.authorId}/avatar`

  const result = await sendPush({
    tokens,
    notification: { title: 'Nova postagem no Fit & Fails', body },
    data: {
      type: 'post_created',
      postId: summary.postId,
      authorId: summary.authorId,
      url,
      icon,
      title: 'Nova postagem no Fit & Fails',
      body
    },
    webpush: {
      notification: {
        title: 'Nova postagem no Fit & Fails',
        body,
        icon
      }
    }
  })

  if (result.invalidTokens.length) await deleteTokens(result.invalidTokens)
  logInfo(`post_created => sent ${result.success} pushes, ${result.failure} falhas`)
}

const handleLikeCreated = async (likeId: string) => {
  const summary = await fetchLikeSummary(likeId)
  if (!summary) return
  if (summary.postOwnerId === summary.likerId) return

  const tokens = await getTokensForUser(summary.postOwnerId)
  if (!tokens.length) return

  if (!config.pushEnabled || !config.firebase) {
    logInfo('Push não configurado; evento like_created recebido')
    return
  }

  const body = `${summary.likerName} curtiu seu post`
  const url = `/dashboard#post-${summary.postId}`
  const icon = `/api/users/${summary.likerId}/avatar`

  const result = await sendPush({
    tokens,
    notification: { title: 'Novo like no seu post', body },
    data: {
      type: 'like_created',
      postId: summary.postId,
      likerId: summary.likerId,
      postOwnerId: summary.postOwnerId,
      postType: summary.postType,
      url,
      icon,
      title: 'Novo like no seu post',
      body
    },
    webpush: {
      notification: {
        title: 'Novo like no seu post',
        body,
        icon
      }
    }
  })

  if (result.invalidTokens.length) await deleteTokens(result.invalidTokens)
  logInfo(`like_created => sent ${result.success} pushes, ${result.failure} falhas`)
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
    const tokens = await getTokensForUser(candidate.userId)
    if (!tokens.length) continue

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
    if (minutesWithoutWater >= 100) {
      targetLevel = 3
    } else if (minutesWithoutWater >= 80) {
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

    const body = pickMessage(targetLevel)
    const icon = '/notification-water.svg'
    const url = '/water'

    const result = await sendPush({
      tokens,
      notification: { title: 'Bora beber água?', body },
      data: { type: 'water_reminder', level: String(targetLevel), icon, url, title: 'Bora beber água?', body },
      webpush: {
        notification: {
          title: 'Bora beber água?',
          body,
          icon
        }
      }
    })

    if (result.invalidTokens.length) await deleteTokens(result.invalidTokens)
    await saveHydrationState({
      userId: candidate.userId,
      lastDrinkAt: candidate.lastDrinkAt,
      lastReminderLevel: targetLevel
    })
    logInfo(`hydration => sent ${result.success} pushes (level ${targetLevel}) for user ${candidate.userId}`)
  }
}

const bootstrap = async () => {
  await ensureSchema()
  initPush()

  await startDbListeners({
    onPostCreated: async (payload) => handlePostCreated(payload.post_id),
    onLikeCreated: async (payload) => handleLikeCreated(payload.like_id)
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
