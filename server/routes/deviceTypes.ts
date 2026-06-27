import express from 'express'
import prisma from '../prisma'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const deviceTypes = await prisma.deviceType.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    })
    const result = deviceTypes.map(dt => {
      let attrs = dt.attributes ? JSON.parse(dt.attributes) : []
      if (typeof attrs === 'string') {
        try { attrs = JSON.parse(attrs) } catch { attrs = [] }
      }
      return {
        ...dt,
        customAttributes: Array.isArray(attrs) ? attrs : [],
      }
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取设备类型失败' })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const deviceType = await prisma.deviceType.findUnique({
      where: { id: req.params.id },
    })
    if (!deviceType) {
      return res.status(404).json({ error: '设备类型不存在' })
    }
    let attrs = deviceType.attributes ? JSON.parse(deviceType.attributes) : []
    if (typeof attrs === 'string') {
      try { attrs = JSON.parse(attrs) } catch { attrs = [] }
    }
    const result = {
      ...deviceType,
      customAttributes: Array.isArray(attrs) ? attrs : [],
    }
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取设备类型失败' })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category, description, icon, customAttributes } = req.body

    if (!name || !category) {
      return res.status(400).json({ error: '名称和分类不能为空' })
    }

    const deviceType = await prisma.deviceType.create({
      data: {
        name,
        category,
        description,
        icon,
        attributes: JSON.stringify(customAttributes || []),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'create',
        resourceType: 'deviceType',
        resourceId: deviceType.id,
        details: JSON.stringify({ name, category }),
      },
    })

    const result = {
      ...deviceType,
      customAttributes: deviceType.attributes ? JSON.parse(deviceType.attributes) : [],
    }
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({ error: '创建设备类型失败' })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, category, description, icon, customAttributes } = req.body

    const deviceType = await prisma.deviceType.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description && { description }),
        ...(icon && { icon }),
        ...(customAttributes !== undefined && { attributes: JSON.stringify(customAttributes) }),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'update',
        resourceType: 'deviceType',
        resourceId: deviceType.id,
      },
    })

    let attrs = deviceType.attributes ? JSON.parse(deviceType.attributes) : []
    if (typeof attrs === 'string') {
      try { attrs = JSON.parse(attrs) } catch { attrs = [] }
    }
    const result = {
      ...deviceType,
      customAttributes: Array.isArray(attrs) ? attrs : [],
    }
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '更新设备类型失败' })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deviceType = await prisma.deviceType.findUnique({ where: { id: req.params.id } })

    if (!deviceType) {
      return res.status(404).json({ error: '设备类型不存在' })
    }

    const deviceCount = await prisma.device.count({ where: { typeId: req.params.id } })

    if (deviceCount > 0) {
      return res.status(400).json({ error: '该类型下有设备，无法删除' })
    }

    await prisma.deviceType.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'delete',
        resourceType: 'deviceType',
        resourceId: req.params.id,
      },
    })

    res.json({ message: '设备类型已删除' })
  } catch (error) {
    res.status(500).json({ error: '删除设备类型失败' })
  }
})

export default router