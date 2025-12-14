import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_change_me'

const getCookie = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) return null
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=')
    if (!key || rest.length === 0) continue
    if (key !== name) continue
    const value = rest.join('=')
    if (!value) return null
    const decoded = decodeURIComponent(value)
    return decoded.startsWith('"') && decoded.endsWith('"') ? decoded.slice(1, -1) : decoded
  }
  return null
}

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  let token: string | null = null

  if (authHeader) {
    const parts = authHeader.split(' ')
    if (parts.length !== 2) return res.status(401).json({ error: 'Token error' })
    const [scheme, parsedToken] = parts
    if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: 'Token malformatted' })
    token = parsedToken
  } else {
    token = getCookie(req.headers.cookie, 'token')
    if (!token) return res.status(401).json({ error: 'No token' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    ;(req as any).userId = decoded.userId
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid' })
  }
}
