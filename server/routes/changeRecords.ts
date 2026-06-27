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

    const records = await prisma.deviceChangeRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    res.json(records)
  } catch (error) {
    res.status(500).json({ error: '获取变更记录失败' })
  }
})

router.get('/device/:deviceId', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.deviceChangeRecord.findMany({
      where: { deviceId: req.params.deviceId },
      include: {
        operator: true,
        fromStation: true,
        toStation: true,
        fromCounter: true,
        toCounter: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(records)
  } catch (error) {
    res.status(500).json({ error: '获取设备变更记录失败' })
  }
})

export default router