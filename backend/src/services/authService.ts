import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import userRepository from '../repositories/userRepository'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_change_me'

const buildTokenPayload = (userId: string) => ({ userId })

const buildResponse = (user: { id: string; name: string; email: string; avatarUrl?: string | null }) => {
  const token = jwt.sign(buildTokenPayload(user.id), JWT_SECRET, { expiresIn: '7d' })
  return { token, user }
}

const register = async ({ name, email, password }: { name: string; email: string; password: string }) => {
  const existing = await userRepository.findByEmail(email)
  if (existing) throw new Error('Email já está em uso')
  const hash = await bcrypt.hash(password, 10)
  const user = await userRepository.create({ name, email, passwordHash: hash })
  return buildResponse({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl })
}

const login = async ({ email, password }: { email: string; password: string }) => {
  const user = await userRepository.findByEmail(email)
  if (!user) throw new Error('Credenciais inválidas')
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) throw new Error('Credenciais inválidas')
  return buildResponse({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl })
}

export default { register, login }
