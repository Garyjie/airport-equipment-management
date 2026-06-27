import express from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../prisma'
import { authenticateToken, requireAdmin } from '../middleware/auth'

const router = express.Router()

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, name, role } = req.body

    if (!username || !password || !name) {
      return res.status(400).json({ error: '用户名、密码和姓名不能为空' })
    }

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' })
    }

    const user = await prisma.user.create({
      data: {
        username,
        password: await bcrypt.hash(password, 10),
        name,
        role: role || 'user',
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'create',
        resourceType: 'user',
        resourceId: user.id,
        details: JSON.stringify({ username, name, role }),
      },
    })

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: '创建用户失败' })
  }
})

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, role, isActive, password } = req.body

    const data: Record<string, unknown> = {
      ...(name && { name }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(password && { password: await bcrypt.hash(password, 10) }),
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'update',
        resourceType: 'user',
        resourceId: user.id,
        details: JSON.stringify(data),
      },
    })

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: '更新用户信息失败' })
  }
})

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.user!.id === req.params.id) {
      return res.status(400).json({ error: '不能删除自己' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } })

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    await prisma.user.delete({ where: { id: req.params.id } })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'delete',
        resourceType: 'user',
        resourceId: req.params.id,
      },
    })

    res.json({ message: '用户已删除' })
  } catch (error) {
    res.status(500).json({ error: '删除用户失败' })
  }
})

export default router