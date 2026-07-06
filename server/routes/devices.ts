import express from 'express'
import prisma from '../prisma'
import { authenticateToken } from '../middleware/auth'

console.log('[DEVICES ROUTE] Loaded at', new Date().toISOString())

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, typeId, stationId, search } = req.query

    const where: Record<string, unknown> = { isActive: true }

    if (status) where.status = status
    if (typeId) where.typeId = typeId
    if (stationId) where.stationId = stationId === 'none' ? null : stationId

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { serialNumber: { contains: search as string } },
      ]
    }

    const devices = await prisma.device.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    const result = devices.map(d => {
      let data = d.customData ? JSON.parse(d.customData) : {}
      if (typeof data === 'string') {
        try { data = JSON.parse(data) } catch { data = {} }
      }
      return {
        ...d,
        customData: typeof data === 'object' && data !== null ? data : {},
      }
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取设备列表失败' })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const device = await prisma.device.findUnique({
      where: { id: req.params.id },
      include: {
        type: true,
        station: true,
        counter: true,
        changeRecords: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!device) {
      return res.status(404).json({ error: '设备不存在' })
    }

    res.json(device)
  } catch (error) {
    res.status(500).json({ error: '获取设备信息失败' })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, typeId, serialNumber, status, stationId, counterId, position, customData, notes } = req.body

    if (!name || !typeId || !serialNumber) {
      return res.status(400).json({ error: '名称、类型和序列号不能为空' })
    }

    const operator = await prisma.user.findUnique({ where: { id: req.user!.id } })

    const device = await prisma.device.create({
      data: {
        name,
        typeId,
        serialNumber,
        status: status || 'standby',
        stationId: stationId && stationId !== 'none' ? stationId : null,
        counterId: counterId && counterId !== 'none' ? counterId : null,
        position: position || 0,
        customData: JSON.stringify(customData || {}),
        notes,
      },
    })

    let changeRecord = null
    if (operator) {
      changeRecord = await prisma.deviceChangeRecord.create({
        data: {
          deviceId: device.id,
          fromStationId: undefined,
          toStationId: stationId && stationId !== 'none' ? stationId : null,
          fromCounterId: undefined,
          toCounterId: counterId && counterId !== 'none' ? counterId : null,
          fromStatus: undefined,
          toStatus: device.status,
          reason: '新增设备',
          operatorId: operator.id,
          operatorName: operator.name,
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'create',
        resourceType: 'device',
        resourceId: device.id,
        details: JSON.stringify({ name, typeId, serialNumber, status }),
      },
    })

    const result = {
      ...device,
      customData: device.customData ? JSON.parse(device.customData) : {},
      changeRecord,
    }
    res.status(201).json(result)
  } catch (error) {
    console.error('创建设备错误:', error)
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      res.status(409).json({ error: '序列号已存在', code: 'DUPLICATE_SERIAL' })
    } else {
      res.status(500).json({ error: '创建设备失败' })
    }
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, typeId, serialNumber, status, stationId, counterId, position, customData, notes } = req.body

    const existingDevice = await prisma.device.findUnique({ where: { id: req.params.id } })

    if (!existingDevice) {
      return res.status(404).json({ error: '设备不存在' })
    }

    const operator = await prisma.user.findUnique({ where: { id: req.user!.id } })

    const newStationId = stationId && stationId !== 'none' ? stationId : null
    const newCounterId = counterId && counterId !== 'none' ? counterId : null
    const newStatus = status || existingDevice.status

    const shouldCreateRecord = 
      existingDevice.stationId !== newStationId ||
      existingDevice.counterId !== newCounterId ||
      existingDevice.status !== newStatus

    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(typeId && { typeId }),
        ...(serialNumber && { serialNumber }),
        ...(status && { status }),
        ...(stationId !== undefined && { stationId: newStationId }),
        ...(counterId !== undefined && { counterId: newCounterId }),
        ...(position !== undefined && { position }),
        ...(customData !== undefined && { customData: JSON.stringify(customData) }),
        ...(notes && { notes }),
      },
    })

    let changeRecord = null
    if (shouldCreateRecord && operator) {
      changeRecord = await prisma.deviceChangeRecord.create({
        data: {
          deviceId: device.id,
          fromStationId: existingDevice.stationId,
          toStationId: newStationId,
          fromCounterId: existingDevice.counterId,
          toCounterId: newCounterId,
          fromStatus: existingDevice.status,
          toStatus: newStatus,
          reason: '设备更新',
          operatorId: operator.id,
          operatorName: operator.name,
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'update',
        resourceType: 'device',
        resourceId: device.id,
      },
    })

    let customDataParsed = device.customData ? JSON.parse(device.customData) : {}
    if (typeof customDataParsed === 'string') {
      try { customDataParsed = JSON.parse(customDataParsed) } catch { customDataParsed = {} }
    }
    const result = {
      ...device,
      customData: typeof customDataParsed === 'object' && customDataParsed !== null ? customDataParsed : {},
      changeRecord,
    }
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '更新设备失败' })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const device = await prisma.device.findUnique({ where: { id: req.params.id } })

    if (!device) {
      return res.status(404).json({ error: '设备不存在' })
    }

    const operator = await prisma.user.findUnique({ where: { id: req.user!.id } })

    await prisma.device.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })

    let changeRecord = null
    if (operator) {
      changeRecord = await prisma.deviceChangeRecord.create({
        data: {
          deviceId: device.id,
          fromStationId: device.stationId,
          toStationId: undefined,
          fromCounterId: device.counterId,
          toCounterId: undefined,
          fromStatus: device.status,
          toStatus: undefined,
          reason: '设备删除',
          operatorId: operator.id,
          operatorName: operator.name,
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'delete',
        resourceType: 'device',
        resourceId: req.params.id,
      },
    })

    res.json({ message: '设备已删除', changeRecord })
  } catch (error) {
    res.status(500).json({ error: '删除设备失败' })
  }
})

router.post('/:id/move', authenticateToken, async (req, res) => {
  try {
    const { stationId, counterId, reason } = req.body
    const device = await prisma.device.findUnique({ where: { id: req.params.id } })

    if (!device) {
      return res.status(404).json({ error: '设备不存在' })
    }

    const operator = await prisma.user.findUnique({ where: { id: req.user!.id } })

    const newStationId = stationId === 'none' ? null : stationId
    const newCounterId = counterId || null

    await prisma.device.update({
      where: { id: req.params.id },
      data: {
        stationId: newStationId,
        counterId: newCounterId,
      },
    })

    let changeRecord = null
    if (operator) {
      changeRecord = await prisma.deviceChangeRecord.create({
        data: {
          deviceId: device.id,
          fromStationId: device.stationId,
          toStationId: newStationId,
          fromCounterId: device.counterId,
          toCounterId: newCounterId,
          fromStatus: device.status,
          toStatus: device.status,
          reason: reason || '设备移动',
          operatorId: operator.id,
          operatorName: operator.name,
        },
      })
    }

    res.json({ message: '设备已移动', changeRecord })
  } catch (error) {
    res.status(500).json({ error: '移动设备失败' })
  }
})

router.post('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, reason } = req.body
    const device = await prisma.device.findUnique({ where: { id: req.params.id } })

    if (!device) {
      return res.status(404).json({ error: '设备不存在' })
    }

    const operator = await prisma.user.findUnique({ where: { id: req.user!.id } })

    const isActiveStatus = status === 'active'
    const newCounterId = isActiveStatus ? device.counterId : null
    const newStationId = isActiveStatus ? device.stationId : null

    await prisma.device.update({
      where: { id: req.params.id },
      data: {
        status,
        stationId: newStationId,
        counterId: newCounterId,
      },
    })

    let changeRecord = null
    if (operator) {
      changeRecord = await prisma.deviceChangeRecord.create({
        data: {
          deviceId: device.id,
          fromStationId: device.stationId,
          toStationId: newStationId,
          fromCounterId: device.counterId,
          toCounterId: newCounterId,
          fromStatus: device.status,
          toStatus: status,
          reason: reason || '状态变更',
          operatorId: operator.id,
          operatorName: operator.name,
        },
      })
    }

    res.json({ message: '设备状态已更新', changeRecord })
  } catch (error) {
    res.status(500).json({ error: '更新设备状态失败' })
  }
})

router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { devices: devicesData } = req.body

    if (!devicesData || !Array.isArray(devicesData) || devicesData.length === 0) {
      return res.status(400).json({ error: '设备数据不能为空' })
    }

    const operator = await prisma.user.findUnique({ where: { id: req.user!.id } })

    const existingDevices = await prisma.device.findMany({
      where: {
        serialNumber: {
          in: devicesData.map(d => d.serialNumber),
        },
      },
      select: { serialNumber: true },
    })

    const existingSerialNumbers = new Set(existingDevices.map(d => d.serialNumber))
    const newDevicesData = devicesData.filter(d => !existingSerialNumbers.has(d.serialNumber))

    if (newDevicesData.length === 0) {
      return res.status(200).json({ createdCount: 0, devices: [] })
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdDevices = await tx.device.createMany({
        data: newDevicesData.map(d => ({
          name: d.name,
          typeId: d.typeId,
          serialNumber: d.serialNumber,
          status: d.status || 'standby',
          stationId: d.stationId && d.stationId !== 'none' ? d.stationId : null,
          counterId: d.counterId && d.counterId !== 'none' ? d.counterId : null,
          position: d.position || 0,
          customData: JSON.stringify(d.customData || {}),
          notes: d.notes,
        })),
      })

      const insertedDevices = await tx.device.findMany({
        where: {
          serialNumber: {
            in: newDevicesData.map(d => d.serialNumber),
          },
        },
      })

      let changeRecords: typeof result.changeRecords = []
      if (operator && insertedDevices.length > 0) {
        changeRecords = await Promise.all(
          insertedDevices.map(device =>
            tx.deviceChangeRecord.create({
              data: {
                deviceId: device.id,
                fromStationId: undefined,
                toStationId: device.stationId,
                fromCounterId: undefined,
                toCounterId: device.counterId,
                fromStatus: undefined,
                toStatus: device.status,
                reason: '批量导入设备',
                operatorId: operator.id,
                operatorName: operator.name,
              },
            })
          )
        )
      }

      if (insertedDevices.length > 0) {
        await tx.auditLog.createMany({
          data: insertedDevices.map(device => ({
            userId: req.user!.id,
            action: 'create',
            resourceType: 'device',
            resourceId: device.id,
            details: JSON.stringify({ name: device.name, typeId: device.typeId, serialNumber: device.serialNumber }),
          })),
        })
      }

      return {
        createdCount: createdDevices.count,
        devices: insertedDevices.map(d => ({
          ...d,
          customData: d.customData ? JSON.parse(d.customData) : {},
        })),
        changeRecords,
      }
    })

    res.status(201).json(result)
  } catch (error) {
    console.error('批量导入设备错误:', error)
    res.status(500).json({ error: '批量导入设备失败' })
  }
})

export default router