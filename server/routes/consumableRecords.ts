import express from 'express'
import prisma from '../prisma'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { deviceId, operatorId, consumableType } = req.query

    const where: Record<string, unknown> = {}

    if (deviceId) where.deviceId = deviceId
    if (operatorId) where.operatorId = operatorId
    if (consumableType) where.consumableType = consumableType

    const records = await prisma.consumableRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    res.json(records)
  } catch (error) {
    res.status(500).json({ error: '获取耗材记录失败' })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { deviceId, consumableType, quantity, notes } = req.body

    if (!deviceId || !consumableType) {
      return res.status(400).json({ error: '设备ID和耗材类型不能为空' })
    }

    const device = await prisma.device.findUnique({ where: { id: deviceId } })
    const operator = await prisma.user.findUnique({ where: { id: req.user!.id } })

    if (!device) {
      return res.status(404).json({ error: '设备不存在' })
    }

    if (!operator) {
      return res.status(404).json({ error: '操作员不存在' })
    }

    const record = await prisma.consumableRecord.create({
      data: {
        deviceId,
        consumableType,
        quantity: quantity || 1,
        notes,
        operatorId: operator.id,
        operatorName: operator.name,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'create',
        resourceType: 'consumableRecord',
        resourceId: record.id,
        details: JSON.stringify({ deviceId, consumableType, quantity }),
      },
    })

    res.status(201).json(record)
  } catch (error) {
    res.status(500).json({ error: '创建耗材记录失败' })
  }
})

export default router