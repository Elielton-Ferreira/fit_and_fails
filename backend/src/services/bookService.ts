import bookRepository from '../repositories/bookRepository'
import postService from './postService'

const createBook = async (userId: string, title: string, totalPages?: number | null) => {
  if (!title.trim()) throw new Error('Título obrigatório')
  return bookRepository.createBook(userId, title.trim(), totalPages ?? null)
}

const listBooks = async (userId: string) => {
  return bookRepository.listBooks(userId)
}

const updateBook = async (userId: string, bookId: string, data: { title?: string; totalPages?: number | null }) => {
  const existing = await bookRepository.findBook(bookId, userId)
  if (!existing) throw new Error('Livro não encontrado')
  return bookRepository.updateBook(bookId, userId, {
    title: data.title?.trim() || existing.title,
    totalPages: data.totalPages ?? existing.totalPages
  })
}

const deleteBook = async (userId: string, bookId: string) => {
  const existing = await bookRepository.findBook(bookId, userId)
  if (!existing) throw new Error('Livro não encontrado')
  await bookRepository.deleteBook(bookId, userId)
}

const logPages = async ({ userId, bookId, pages, date }: { userId: string; bookId: string; pages: number; date?: Date }) => {
  if (!pages || pages <= 0) throw new Error('Páginas deve ser maior que zero')
  const existing = await bookRepository.findBook(bookId, userId)
  if (!existing) throw new Error('Livro não encontrado')
  const log = await bookRepository.createLog(userId, bookId, date || new Date(), pages)
  // Cria um post no feed automaticamente
  await postService.create({
    userId,
    type: 'screen_time',
    text: `Hoje li ${pages} páginas do livro "${existing.title}" 📚`
  })
  return log
}

const listLogs = async (userId: string) => {
  return bookRepository.listLogs(userId, 50)
}

export default { createBook, listBooks, updateBook, deleteBook, logPages, listLogs }
