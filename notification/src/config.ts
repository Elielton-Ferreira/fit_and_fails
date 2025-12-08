import dotenv from 'dotenv'
import { logError } from './logger.js'

dotenv.config()

const parsePort = (value?: string) => {
  const fallback = 4100
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const requiredEnv = ['DATABASE_URL'] as const

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    logError(`Env var ${key} is required for notification service`)
  }
})

const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined

export const config = {
  port: parsePort(process.env.NOTIFICATION_PORT || process.env.PORT),
  databaseUrl: process.env.DATABASE_URL ?? '',
  pushEnabled: process.env.PUSH_ENABLED !== 'false',
  firebase: process.env.FIREBASE_PROJECT_ID
    && process.env.FIREBASE_CLIENT_EMAIL
    && firebasePrivateKey
    ? {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: firebasePrivateKey
      }
    : null
}

export type FirebaseCredentials = NonNullable<typeof config.firebase>

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL é obrigatório para o serviço de notificações')
}
