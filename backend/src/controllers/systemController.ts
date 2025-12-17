import { Request, Response } from 'express'
import http from 'http'
import prisma from '../prisma'

type ImageMap = Partial<Record<'frontend' | 'backend' | 'notification' | 'postgres', string>>

const DOCKER_SOCKET_PATH = process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock'

const dockerRequest = async <T>(path: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath: DOCKER_SOCKET_PATH,
        path,
        method: 'GET'
      },
      (res) => {
        let raw = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          raw += chunk
        })
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`Docker API ${res.statusCode}: ${raw || 'erro desconhecido'}`))
          }
          try {
            resolve(JSON.parse(raw || 'null') as T)
          } catch (err) {
            reject(err)
          }
        })
      }
    )

    req.on('error', reject)
    req.end()
  })
}

const getComposeProjectName = async () => {
  const selfId = process.env.HOSTNAME
  if (!selfId) return null

  try {
    const inspect = await dockerRequest<{ Config?: { Labels?: Record<string, string> } }>(`/containers/${selfId}/json`)
    return inspect?.Config?.Labels?.['com.docker.compose.project'] || null
  } catch {
    return null
  }
}

const getImagesFromDocker = async (): Promise<ImageMap | null> => {
  try {
    const project = await getComposeProjectName()
    const containers = await dockerRequest<
      Array<{ Image: string; Labels?: Record<string, string> }>
    >('/containers/json')

    const images: ImageMap = {}

    for (const container of containers) {
      const labels = container.Labels || {}
      if (project && labels['com.docker.compose.project'] && labels['com.docker.compose.project'] !== project) {
        continue
      }

      const service = labels['com.docker.compose.service']
      if (service === 'frontend') images.frontend = container.Image
      if (service === 'backend') images.backend = container.Image
      if (service === 'notification') images.notification = container.Image
      if (service === 'db') images.postgres = container.Image
    }

    return Object.keys(images).length ? images : null
  } catch {
    return null
  }
}

const getPostgresServerVersion = async () => {
  try {
    const rows = (await prisma.$queryRawUnsafe<any[]>('select version() as version')) as Array<{ version?: string }>
    const version = rows?.[0]?.version
    if (typeof version !== 'string') return null
    return version
  } catch {
    return null
  }
}

export async function versions(_req: Request, res: Response) {
  const dockerImages = await getImagesFromDocker()

  const images: ImageMap = dockerImages ?? {
    frontend: process.env.FRONTEND_IMAGE,
    backend: process.env.BACKEND_IMAGE || process.env.APP_IMAGE,
    notification: process.env.NOTIFICATION_IMAGE,
    postgres: process.env.POSTGRES_IMAGE
  }

  const serverVersion = await getPostgresServerVersion()

  return res.json({
    images,
    source: dockerImages ? 'docker' : 'env',
    postgresServerVersion: serverVersion
  })
}

