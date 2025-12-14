import { Request, Response } from 'express'
import authService from '../services/authService'

const TOKEN_COOKIE_NAME = 'token'
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const setAuthCookie = (res: Response, token: string) => {
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/'
  })
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body
    const authPayload = await authService.register({ name, email, password })
    setAuthCookie(res, authPayload.token)
    return res.status(201).json(authPayload)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    const authPayload = await authService.login({ email, password })
    setAuthCookie(res, authPayload.token)
    return res.json(authPayload)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}
