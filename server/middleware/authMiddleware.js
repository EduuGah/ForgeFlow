import jwt from 'jsonwebtoken'
import { getTokenFromRequest } from '../utils/authCookie.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export default function authMiddleware(req, res, next) {
  const token = getTokenFromRequest(req)

  if (!token) {
    return res.status(401).json({ message: 'Você precisa estar logado.' })
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET)

    if (req.user?.id && !req.user.userId) {
      req.user.userId = req.user.id
    }

    return next()
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' })
  }
}
