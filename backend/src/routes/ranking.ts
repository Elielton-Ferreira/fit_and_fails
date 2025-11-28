import { Router, Request, Response } from 'express'
import authMiddleware from '../middleware/auth'
import * as rankingController from '../controllers/rankingController'

const router = Router()

router.use(authMiddleware)
router.get('/', (req: Request, res: Response) => rankingController.list(req, res))

export default router
