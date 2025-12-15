import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import type { WebpushConfig } from 'firebase-admin/messaging'
import { config } from './config.js'
import { logError, logInfo } from './logger.js'

type PushPayload = {
  tokens: string[]
  notification: { title: string; body: string }
  data?: Record<string, string>
  webpush?: WebpushConfig
}

type PushResult = {
  success: number
  failure: number
  invalidTokens: string[]
}

let pushReady = false

export const initPush = () => {
  if (!config.pushEnabled) {
    logInfo('Push disabled (PUSH_ENABLED=false)')
    return false
  }

  if (!config.firebase) {
    logInfo('Firebase credentials missing, push will be skipped')
    return false
  }

  const alreadyInit = getApps().length > 0
  if (!alreadyInit) {
    initializeApp({
      credential: cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey
      })
    })
  }

  pushReady = true
  logInfo('Firebase messaging ready')
  return true
}

const chunk = <T>(items: T[], size: number): T[][] => {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

export const sendPush = async ({ tokens, notification, data, webpush }: PushPayload): Promise<PushResult> => {
  if (!pushReady) return { success: 0, failure: tokens.length, invalidTokens: [] }
  if (tokens.length === 0) return { success: 0, failure: 0, invalidTokens: [] }

  const messaging = getMessaging()
  let success = 0
  let failure = 0
  const invalidTokens: string[] = []

  for (const batch of chunk(tokens, 500)) {
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification,
        data,
        webpush
      })

      success += response.successCount
      failure += response.failureCount

      response.responses.forEach((r, index) => {
        if (r.error && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(r.error.code)) {
          invalidTokens.push(batch[index])
        }
      })
    } catch (err) {
      failure += batch.length
      logError('Failed to send push batch', err)
    }
  }

  return { success, failure, invalidTokens }
}
