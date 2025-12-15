import { Router, Request, Response } from 'express'
import authMiddleware from '../middleware/auth'
import * as profileController from '../controllers/profileController'

const router = Router()

router.get('/me', authMiddleware, (req: Request, res: Response) => profileController.me(req, res))
router.patch('/me', authMiddleware, (req: Request, res: Response) => profileController.update(req, res))
router.get('/users/:userId/avatar', (req: Request, res: Response) => profileController.avatar(req, res))

export default router
