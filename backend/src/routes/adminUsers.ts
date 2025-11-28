import { Router, Request, Response } from 'express'
import authMiddleware from '../middleware/auth'
import * as adminUserController from '../controllers/adminUserController'

const router = Router()

router.use(authMiddleware)
router.get('/', (req: Request, res: Response) => adminUserController.list(req, res))
router.patch('/:userId/password', (req: Request, res: Response) => adminUserController.updatePassword(req, res))
router.delete('/:userId', (req: Request, res: Response) => adminUserController.remove(req, res))

export default router
