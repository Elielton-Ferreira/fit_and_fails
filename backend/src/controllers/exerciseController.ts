import { Request, Response } from 'express'
import exerciseService from '../services/exerciseService'

export async function create(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const { type, startTime, endTime, notes, mediaUrls, shareToFeed } = req.body
    const session = await exerciseService.createSession({
      userId,
      type,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes,
      mediaUrls,
      shareToFeed
    })
    return res.status(201).json(session)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function recent(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const limit = req.query.limit ? Number(req.query.limit) : 20
    const days = req.query.days ? Number(req.query.days) : undefined
    const sessions = days ? await exerciseService.listSince(userId, days, limit) : await exerciseService.listRecent(userId, limit)
    return res.json(sessions)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}
