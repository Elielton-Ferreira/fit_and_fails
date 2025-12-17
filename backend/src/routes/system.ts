import { Router, Request, Response } from 'express'
import authMiddleware from '../middleware/auth'
import * as systemController from '../controllers/systemController'

const router = Router()

router.use(authMiddleware)

router.get('/versions', (req: Request, res: Response) => systemController.versions(req, res))

export default router

