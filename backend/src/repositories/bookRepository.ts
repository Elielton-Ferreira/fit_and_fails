import prisma from '../prisma'

const createBook = async (userId: string, title: string, totalPages?: number | null) => {
  return prisma.book.create({
    data: {
      userId,
      title,
      totalPages: totalPages ?? null
    }
  })
}

const listBooks = async (userId: string) => {
  return prisma.book.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })
}

const updateBook = async (bookId: string, userId: string, data: { title?: string; totalPages?: number | null }) => {
  return prisma.book.update({
    where: { id: bookId, userId },
    data
  })
}

const deleteBook = async (bookId: string, userId: string) => {
  await prisma.book.delete({
    where: { id: bookId, userId }
  })
}

const findBook = async (bookId: string, userId: string) => {
  return prisma.book.findFirst({ where: { id: bookId, userId } })
}

const createLog = async (userId: string, bookId: string, date: Date, pages: number) => {
  return prisma.bookLog.create({
    data: {
      userId,
      bookId,
      date,
      pages
    },
    include: {
      book: true
    }
  })
}

const listLogs = async (userId: string, limit = 30) => {
  return prisma.bookLog.findMany({
    where: { userId },
    include: { book: true },
    orderBy: { date: 'desc' },
    take: limit
  })
}

export default { createBook, listBooks, updateBook, deleteBook, findBook, createLog, listLogs }
