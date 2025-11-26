import { Request, Response } from 'express'
import userRepository from '../repositories/userRepository'

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
