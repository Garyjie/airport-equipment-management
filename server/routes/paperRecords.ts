import express from 'express'
import prisma from '../prisma'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { deviceId, operatorId } = req.query

    const where: Record<string, unknown> = {}

    if (deviceId) where.deviceId = deviceId
    if (operatorId) where.operatorId = operatorId

    const records = await prisma.paperChangeRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    res.json(records)
  } catch (error) {
    res.status(500).json({ error: '获取换纸记录失败' })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { deviceId, paperType, quantity, notes } = req.body

    if (!deviceId || !paperType) {
      return res.status(400).json({ error: '设备ID和纸张类型不能为空' })
    }

    const device = await prisma.device.findUnique({ where: { id: deviceId } })
    const operator = await prisma.user.findUnique({ where: { id: req.user!.id } })

    if (!device) {
      return res.status(404).json({ error: '设备不存在' })
    }

    if (!operator) {
      return res.status(404).json({ error: '操作员不存在' })
    }

    const record = await prisma.paperChangeRecord.create({
      data: {
        deviceId,
        paperType,
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
        resourceType: 'paperRecord',
        resourceId: record.id,
        details: JSON.stringify({ deviceId, paperType, quantity }),
      },
    })

    res.status(201).json(record)
  } catch (error) {
    res.status(500).json({ error: '创建换纸记录失败' })
  }
})

export default router