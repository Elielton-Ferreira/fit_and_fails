import { Router, Request, Response } from 'express'
import * as postController from '../controllers/postController'
import authMiddleware from '../middleware/auth'

const router = Router()

router.get('/', (req: Request, res: Response) => postController.getAll(req, res))
router.post('/', authMiddleware, (req: Request, res: Response) => postController.create(req, res))
router.post('/:postId/like', authMiddleware, (req: Request, res: Response) => postController.like(req, res))
router.delete('/:postId/like', authMiddleware, (req: Request, res: Response) => postController.unlike(req, res))
router.post('/:postId/comments', authMiddleware, (req: Request, res: Response) => postController.comment(req, res))
router.delete('/:postId', authMiddleware, (req: Request, res: Response) => postController.remove(req, res))

export default router
