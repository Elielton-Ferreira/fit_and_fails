import { Request, Response } from 'express'
import bookService from '../services/bookService'

export async function create(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const { title, totalPages } = req.body
    const book = await bookService.createBook(userId, title, totalPages ? Number(totalPages) : null)
    return res.status(201).json(book)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function list(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const books = await bookService.listBooks(userId)
    return res.json(books)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function update(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const { bookId } = req.params
    const { title, totalPages } = req.body
    const book = await bookService.updateBook(userId, bookId, {
      title,
      totalPages: totalPages !== undefined ? Number(totalPages) : undefined
    })
    return res.json(book)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const { bookId } = req.params
    await bookService.deleteBook(userId, bookId)
    return res.json({ success: true })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function logPages(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const { bookId } = req.params
    const { pages, date } = req.body
    const log = await bookService.logPages({
      userId,
      bookId,
      pages: Number(pages),
      date: date ? new Date(date) : undefined
    })
    return res.status(201).json(log)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}

export async function listLogs(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const logs = await bookService.listLogs(userId)
    return res.json(logs)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
}
