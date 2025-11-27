import { Request, Response } from 'express'
import postService from '../services/postService'

export async function getAll(req: Request, res: Response) {
  try {
    const viewerId = (req as any).userId
    const posts = await postService.getAll({ type: req.query.type as string, day: req.query.day as string, viewerId })
    return res.json(posts)
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export async function create(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const { type, text, imageUrl, videoUrl, badgeType } = req.body
    const post = await postService.create({ userId, type, text, imageUrl, videoUrl, badgeType })
    return res.status(201).json(post)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function like(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const postId = req.params.postId
    const updated = await postService.likePost(postId, userId)
    return res.json(updated)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function unlike(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const postId = req.params.postId
    const updated = await postService.unlikePost(postId, userId)
    return res.json(updated)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function comment(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const postId = req.params.postId
    const { text } = req.body
    const updated = await postService.addComment({ postId, userId, text })
    return res.status(201).json(updated)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const postId = req.params.postId
    const result = await postService.remove({ postId, userId })
    return res.json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function deleteComment(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const postId = req.params.postId
    const commentId = req.params.commentId
    const updated = await postService.deleteComment({ commentId, postId, userId })
    return res.json(updated)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}
