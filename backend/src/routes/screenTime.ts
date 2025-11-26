import { Router, Request, Response } from 'express'
import authMiddleware from '../middleware/auth'
import * as screenTimeController from '../controllers/screenTimeController'

const router = Router()

router.post('/logs', authMiddleware, (req: Request, res: Response) => screenTimeController.record(req, res))
router.get('/summary', authMiddleware, (req: Request, res: Response) => screenTimeController.summary(req, res))
router.post('/share', authMiddleware, (req: Request, res: Response) => screenTimeController.share(req, res))

export default router
