import { Router, Request, Response } from 'express'
import * as waterController from '../controllers/waterController'
import authMiddleware from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response) => waterController.getToday(req, res))
router.post('/', authMiddleware, (req: Request, res: Response) => waterController.addLog(req, res))
router.patch('/goal', authMiddleware, (req: Request, res: Response) => waterController.updateGoal(req, res))

export default router
