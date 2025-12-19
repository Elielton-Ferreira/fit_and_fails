import { Request, Response } from 'express'
import userRepository from '../repositories/userRepository'

const makeInitialsSvg = (name?: string) => {
  const initial = (name || 'F').trim().slice(0, 1).toUpperCase() || 'F'
  const bg = '#0ea5e9'
  const fg = '#ffffff'
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="Avatar">
  <rect width="128" height="128" rx="64" fill="${bg}"/>
  <text x="64" y="78" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="64" font-weight="700" fill="${fg}">${initial}</text>
</svg>`
  return svg
}

const tryParseDataUrl = (value: string) => {
  const match = value.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return { mime: match[1], base64: match[2] }
}

const escapeXmlAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const makeCircleAvatarSvg = (imageHref: string) => {
  const safeHref = escapeXmlAttribute(imageHref)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="Avatar">
  <defs>
    <clipPath id="clip">
      <circle cx="64" cy="64" r="64" />
    </clipPath>
  </defs>
  <rect width="128" height="128" rx="64" fill="transparent"/>
  <image href="${safeHref}" width="128" height="128" clip-path="url(#clip)" preserveAspectRatio="xMidYMid slice" />
</svg>`
}

export async function me(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const user = await userRepository.findById(userId)
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    return res.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export async function update(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const { name, avatarUrl } = req.body
    const payload: { name?: string; avatarUrl?: string | null } = {}
    if (name) payload.name = name
    if (avatarUrl !== undefined) payload.avatarUrl = avatarUrl || null
    const user = await userRepository.updateProfile(userId, payload)
    return res.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function avatar(req: Request, res: Response) {
  try {
    const { userId } = req.params as { userId?: string }
    if (!userId) return res.status(400).json({ error: 'userId é obrigatório' })

    const user = await userRepository.findById(userId)
    const avatarUrl = user?.avatarUrl

    res.setHeader('Cache-Control', 'public, max-age=3600')

    if (!avatarUrl) {
      res.setHeader('Content-Type', 'image/svg+xml')
      return res.send(makeInitialsSvg(user?.name))
    }

    // Data URL (base64)
    if (avatarUrl.startsWith('data:')) {
      const parsed = tryParseDataUrl(avatarUrl)
      if (!parsed) return res.status(400).json({ error: 'avatarUrl inválido' })
      const buffer = Buffer.from(parsed.base64, 'base64')
      res.setHeader('Content-Type', parsed.mime)
      return res.send(buffer)
    }

    // URL externa
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return res.redirect(302, avatarUrl)
    }

    // Qualquer outra string: tenta usar como path/URL
    return res.redirect(302, avatarUrl)
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export async function avatarCircle(req: Request, res: Response) {
  try {
    const { userId } = req.params as { userId?: string }
    if (!userId) return res.status(400).json({ error: 'userId é obrigatório' })

    const user = await userRepository.findById(userId)
    const avatarUrl = user?.avatarUrl

    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Content-Type', 'image/svg+xml')

    if (!avatarUrl) {
      return res.send(makeInitialsSvg(user?.name))
    }

    return res.send(makeCircleAvatarSvg(avatarUrl))
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
