import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_change_me'

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token' })
  const parts = authHeader.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'Token error' })
  const [scheme, token] = parts
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: 'Token malformatted' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    ;(req as any).userId = decoded.userId
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid' })
  }
}
