import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'login',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    })

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: '登录失败' })
  }
})

router.post('/logout', async (req, res) => {
  try {
    res.json({ message: '登出成功' })
  } catch (error) {
    res.status(500).json({ error: '登出失败' })
  }
})

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: '未登录' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; username: string; role: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: '用户不存在或已禁用' })
    }

    res.json(user)
  } catch (error) {
    res.status(401).json({ error: 'token无效' })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role = 'user' } = req.body

    if (!username || !password || !name) {
      return res.status(400).json({ error: '用户名、密码和姓名不能为空' })
    }

    const existingUser = await prisma.user.findUnique({ where: { username } })

    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'create',
        resourceType: 'user',
        resourceId: user.id,
        details: JSON.stringify({ username, name, role }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    })

    res.status(201).json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    })
  } catch (error) {
    res.status(500).json({ error: '注册失败' })
  }
})

export default router