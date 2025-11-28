import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import userRepository from '../repositories/userRepository'

export async function list(req: Request, res: Response) {
  try {
    const users = await userRepository.listAll()
    return res.json(users)
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export async function updatePassword(req: Request, res: Response) {
  try {
    const { userId } = req.params
    const { password } = req.body
    if (!password || password.length < 6) return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' })
    const hash = await bcrypt.hash(password, 10)
    await userRepository.updatePasswordHash(userId, hash)
    return res.json({ success: true })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { userId } = req.params
    await userRepository.removeWithRelations(userId)
    return res.json({ success: true })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}
