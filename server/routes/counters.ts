import express from 'express'
import prisma from '../prisma'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const counters = await prisma.counter.findMany({
      where: { isActive: true },
      include: { station: true },
      orderBy: { position: 'asc' },
    })
    res.json(counters)
  } catch (error) {
    res.status(500).json({ error: '获取柜台列表失败' })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const counter = await prisma.counter.findUnique({
      where: { id: req.params.id },
      include: { station: true, devices: { where: { isActive: true } } },
    })
    if (!counter) {
      return res.status(404).json({ error: '柜台不存在' })
    }
    res.json(counter)
  } catch (error) {
    res.status(500).json({ error: '获取柜台信息失败' })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { stationId, name, position } = req.body

    if (!stationId || !name || position === undefined) {
      return res.status(400).json({ error: '站点ID、名称和位置不能为空' })
    }

    const counter = await prisma.counter.create({
      data: {
        stationId,
        name,
        position,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'create',
        resourceType: 'counter',
        resourceId: counter.id,
        details: JSON.stringify({ stationId, name, position }),
      },
    })

    res.status(201).json(counter)
  } catch (error) {
    res.status(500).json({ error: '创建柜台失败' })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { stationId, name, position } = req.body

    const counter = await prisma.counter.update({
      where: { id: req.params.id },
      data: {
        ...(stationId && { stationId }),
        ...(name && { name }),
        ...(position !== undefined && { position }),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'update',
        resourceType: 'counter',
        resourceId: counter.id,
      },
    })

    res.json(counter)
  } catch (error) {
    res.status(500).json({ error: '更新柜台失败' })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const counter = await prisma.counter.findUnique({ where: { id: req.params.id } })

    if (!counter) {
      return res.status(404).json({ error: '柜台不存在' })
    }

    await prisma.counter.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'delete',
        resourceType: 'counter',
        resourceId: req.params.id,
      },
    })

    res.json({ message: '柜台已删除' })
  } catch (error) {
    res.status(500).json({ error: '删除柜台失败' })
  }
})

export default router