import prisma from '../prisma'

const create = async ({ postId, userId, text }: { postId: string; userId: string; text: string }) => {
  return prisma.comment.create({
    data: { postId, userId, text }
  })
}

export default { create }
