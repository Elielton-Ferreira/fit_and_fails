import express from 'express'
import { config } from './config.js'
import { initPush, sendPush } from './push.js'
import {
  deleteTokens,
  ensureSchema,
  fetchLikeSummary,
  fetchPostSummary,
  getTokensForBroadcast,
  getTokensForUser,
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
app.use(express.json())

const postTypeLabels: Record<string, string> = {
  water: 'hidratação',
  screen_time: 'tempo de tela',
  exercise: 'exercício',
  shame: 'post da vergonha',
  healthy_food: 'alimentação saudável'
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

  const body = `${summary.authorName} compartilhou algo sobre ${
    postTypeLabels[summary.type] ?? 'um novo hábito'
  }`

  const result = await sendPush({
    tokens,
    notification: { title: 'Nova história no Fit & Fails', body },
    data: { type: 'post_created', postId: summary.postId, authorId: summary.authorId }
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

  const result = await sendPush({
    tokens,
    notification: { title: 'Novo like no seu post', body: `${summary.likerName} curtiu seu post` },
    data: {
      type: 'like_created',
      postId: summary.postId,
      likerId: summary.likerId,
      postOwnerId: summary.postOwnerId,
      postType: summary.postType
    }
  })

  if (result.invalidTokens.length) await deleteTokens(result.invalidTokens)
  logInfo(`like_created => sent ${result.success} pushes, ${result.failure} falhas`)
}

const bootstrap = async () => {
  await ensureSchema()
  initPush()

  await startDbListeners({
    onPostCreated: async (payload) => handlePostCreated(payload.post_id),
    onLikeCreated: async (payload) => handleLikeCreated(payload.like_id)
  })

  app.listen(config.port, () => {
    logInfo(`Notification service listening on :${config.port}`)
  })
}

bootstrap().catch((err) => {
  logError('Failed to start notification service', err)
  process.exit(1)
})
