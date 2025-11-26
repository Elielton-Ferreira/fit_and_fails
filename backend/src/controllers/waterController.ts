import { Request, Response } from 'express'
import waterService from '../services/waterService'

export async function getToday(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const snapshot = await waterService.getTodaySnapshot(userId)
    return res.json(snapshot)
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export async function addLog(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const amountMl = Number(req.body.amountMl)
    const dailyGoalMl = req.body.dailyGoalMl ? Number(req.body.dailyGoalMl) : undefined
    if (Number.isNaN(amountMl)) throw new Error('amountMl inválido')
    const snapshot = await waterService.addLog({ userId, amountMl, dailyGoalMl })
    return res.status(201).json(snapshot)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function updateGoal(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const dailyGoalMl = Number(req.body.dailyGoalMl)
    if (Number.isNaN(dailyGoalMl)) throw new Error('dailyGoalMl inválido')
    const snapshot = await waterService.updateGoal(userId, dailyGoalMl)
    return res.json(snapshot)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}
