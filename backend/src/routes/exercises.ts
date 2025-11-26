import { Router, Request, Response } from 'express'
import authMiddleware from '../middleware/auth'
import * as exerciseController from '../controllers/exerciseController'

const router = Router()

router.post('/', authMiddleware, (req: Request, res: Response) => exerciseController.create(req, res))
router.get('/', authMiddleware, (req: Request, res: Response) => exerciseController.recent(req, res))

export default router
