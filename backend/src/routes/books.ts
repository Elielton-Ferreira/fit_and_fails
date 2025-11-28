import { Router, Request, Response } from 'express'
import authMiddleware from '../middleware/auth'
import * as bookController from '../controllers/bookController'

const router = Router()

router.use(authMiddleware)

router.get('/', (req: Request, res: Response) => bookController.list(req, res))
router.post('/', (req: Request, res: Response) => bookController.create(req, res))
router.patch('/:bookId', (req: Request, res: Response) => bookController.update(req, res))
router.delete('/:bookId', (req: Request, res: Response) => bookController.remove(req, res))
router.get('/logs/all', (req: Request, res: Response) => bookController.listLogs(req, res))
router.post('/:bookId/logs', (req: Request, res: Response) => bookController.logPages(req, res))

export default router
