import { Request, Response } from 'express'
import authService from '../services/authService'

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body
    const authPayload = await authService.register({ name, email, password })
    return res.status(201).json(authPayload)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    const authPayload = await authService.login({ email, password })
    return res.json(authPayload)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}
