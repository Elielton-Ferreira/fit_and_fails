import { Request, Response } from 'express'
import screenTimeService from '../services/screenTimeService'

export async function record(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const { date, minutes, bookTitle, bookPages } = req.body
    const parsedMinutes = Number(minutes)
    if (Number.isNaN(parsedMinutes)) throw new Error('minutes inválido')
    const log = await screenTimeService.recordLog({
      userId,
      date: date ? new Date(date) : new Date(),
      minutes: parsedMinutes,
      bookTitle,
      bookPages: bookPages ? Number(bookPages) : undefined
    })
    return res.status(201).json(log)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function summary(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const summary = await screenTimeService.getWeeklySummary(userId)
    return res.json(summary)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function share(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const post = await screenTimeService.shareReduction(userId)
    return res.status(201).json(post)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}
