import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'

interface UserPayload {
  id: string
  username: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: '未授权访问' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: '用户不存在或已禁用' })
    }

    req.user = { id: user.id, username: user.username, role: user.role }
    next()
  } catch {
    return res.status(401).json({ error: '无效的令牌' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限访问' })
  }
  next()
}