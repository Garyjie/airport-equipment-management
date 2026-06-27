import express from 'express'
import prisma from '../prisma'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const stations = await prisma.station.findMany({
      where: { isActive: true },
      orderBy: { positionX: 'asc' },
    })
    const result = stations.map(s => ({
      ...s,
      position: { x: s.positionX, y: s.positionY },
    }))
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取站点列表失败' })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const station = await prisma.station.findUnique({
      where: { id: req.params.id },
      include: {
        counters: { orderBy: { position: 'asc' } },
      },
    })
    if (!station) {
      return res.status(404).json({ error: '站点不存在' })
    }
    const result = {
      ...station,
      position: { x: station.positionX, y: station.positionY },
    }
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取站点信息失败' })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, code, type, description, positionX, positionY, position } = req.body

    if (!name || !code || !type) {
      return res.status(400).json({ error: '名称、代码和类型不能为空' })
    }

    const x = positionX !== undefined ? positionX : (position?.x ?? 0)
    const y = positionY !== undefined ? positionY : (position?.y ?? 0)

    const station = await prisma.station.create({
      data: {
        name,
        code,
        type,
        description,
        positionX: x,
        positionY: y,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'create',
        resourceType: 'station',
        resourceId: station.id,
        details: JSON.stringify({ name, code, type }),
      },
    })

    res.status(201).json(station)
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      return res.status(400).json({ error: '站点代码已存在' })
    }
    res.status(500).json({ error: '创建站点失败' })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, code, type, description, positionX, positionY, position } = req.body

    const updateData: any = {}
    if (name) updateData.name = name
    if (code) updateData.code = code
    if (type) updateData.type = type
    if (description !== undefined) updateData.description = description
    if (positionX !== undefined) updateData.positionX = positionX
    if (positionY !== undefined) updateData.positionY = positionY
    if (position !== undefined) {
      updateData.positionX = position.x
      updateData.positionY = position.y
    }

    const station = await prisma.station.update({
      where: { id: req.params.id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'update',
        resourceType: 'station',
        resourceId: station.id,
      },
    })

    res.json(station)
  } catch (error) {
    res.status(500).json({ error: '更新站点失败' })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const station = await prisma.station.findUnique({ where: { id: req.params.id } })

    if (!station) {
      return res.status(404).json({ error: '站点不存在' })
    }

    await prisma.station.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'delete',
        resourceType: 'station',
        resourceId: req.params.id,
      },
    })

    res.json({ message: '站点已删除' })
  } catch (error) {
    res.status(500).json({ error: '删除站点失败' })
  }
})

export default router