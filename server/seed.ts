import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcryptjs'
import prisma from './prisma'

async function main() {
  console.log('开始初始化数据库...')

  await prisma.paperChangeRecord.deleteMany({})
  await prisma.consumableRecord.deleteMany({})
  await prisma.deviceChangeRecord.deleteMany({})
  await prisma.device.deleteMany({})
  await prisma.counter.deleteMany({})
  await prisma.station.deleteMany({})
  await prisma.deviceType.deleteMany({})
  await prisma.user.deleteMany({})

  console.log('已清空现有数据')

  const hashedAdminPassword = await bcrypt.hash('admin123', 10)
  const hashedOperatorPassword = await bcrypt.hash('operator123', 10)

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedAdminPassword,
      name: '系统管理员',
      role: 'admin',
      isActive: true,
    },
  })
  console.log('创建管理员账号: admin / admin123')

  const operator = await prisma.user.create({
    data: {
      username: 'operator',
      password: hashedOperatorPassword,
      name: '值机员小王',
      role: 'user',
      isActive: true,
    },
  })
  console.log('创建普通用户账号: operator / operator123')

  const stationA = await prisma.station.create({
    data: { name: 'A值机岛', code: 'A', type: 'checkin', description: '国内航班值机区，共12个柜台', positionX: 0, positionY: 0 },
  })

  const stationB = await prisma.station.create({
    data: { name: 'B值机岛', code: 'B', type: 'checkin', description: '国际航班值机区，共10个柜台', positionX: 1, positionY: 0 },
  })

  const stationC = await prisma.station.create({
    data: { name: 'C自助服务区', code: 'C', type: 'selfservice', description: '自助值机区域，共8台自助设备', positionX: 2, positionY: 0 },
  })

  const stationGA = await prisma.station.create({
    data: { name: 'A指廊登机口', code: 'GA', type: 'gate', description: 'A指廊登机口区域，共6个登机口', positionX: 0, positionY: 1 },
  })

  const stationGB = await prisma.station.create({
    data: { name: 'B指廊登机口', code: 'GB', type: 'gate', description: 'B指廊登机口区域，共6个登机口', positionX: 1, positionY: 1 },
  })

  const stationGC = await prisma.station.create({
    data: { name: 'C指廊登机口', code: 'GC', type: 'gate', description: 'C指廊登机口区域，共4个登机口', positionX: 2, positionY: 1 },
  })

  const stationGD = await prisma.station.create({
    data: { name: 'D指廊登机口', code: 'GD', type: 'gate', description: 'D指廊登机口区域，共4个登机口', positionX: 3, positionY: 1 },
  })

  const stationStore = await prisma.station.create({
    data: { name: '设备库房', code: 'STORE', type: 'warehouse', description: '备用设备存放区，备机库', positionX: 3, positionY: 0 },
  })
  console.log('创建8个站点')

  await prisma.counter.createMany({
    data: [
      { stationId: stationA.id, name: 'A01柜台', position: 1 },
      { stationId: stationA.id, name: 'A02柜台', position: 2 },
      { stationId: stationA.id, name: 'A03柜台', position: 3 },
      { stationId: stationA.id, name: 'A04柜台', position: 4 },
      { stationId: stationA.id, name: 'A05柜台', position: 5 },
      { stationId: stationA.id, name: 'A06柜台', position: 6 },
      { stationId: stationB.id, name: 'B01柜台', position: 1 },
      { stationId: stationB.id, name: 'B02柜台', position: 2 },
      { stationId: stationB.id, name: 'B03柜台', position: 3 },
      { stationId: stationB.id, name: 'B04柜台', position: 4 },
      { stationId: stationGA.id, name: 'A101登机口', position: 1 },
      { stationId: stationGA.id, name: 'A102登机口', position: 2 },
      { stationId: stationGA.id, name: 'A103登机口', position: 3 },
      { stationId: stationGA.id, name: 'A104登机口', position: 4 },
      { stationId: stationGA.id, name: 'A105登机口', position: 5 },
      { stationId: stationGA.id, name: 'A106登机口', position: 6 },
      { stationId: stationGB.id, name: 'B201登机口', position: 1 },
      { stationId: stationGB.id, name: 'B202登机口', position: 2 },
      { stationId: stationGB.id, name: 'B203登机口', position: 3 },
      { stationId: stationGB.id, name: 'B204登机口', position: 4 },
      { stationId: stationGC.id, name: 'C301登机口', position: 1 },
      { stationId: stationGC.id, name: 'C302登机口', position: 2 },
      { stationId: stationGD.id, name: 'D401登机口', position: 1 },
      { stationId: stationGD.id, name: 'D402登机口', position: 2 },
      { stationId: stationGD.id, name: 'D403登机口', position: 3 },
    ],
  })
  console.log('创建25个柜台/登机口')

  const dt1 = await prisma.deviceType.create({
    data: { name: 'CUSS 自助值机机', category: '自助设备', description: '自助打印登机牌设备', icon: 'Monitor', attributes: JSON.stringify([{ id: 'attr-1', name: '纸卷类型', type: 'select', options: ['热敏纸', '普通纸'], required: true }]) },
  })

  const dt2 = await prisma.deviceType.create({
    data: { name: '值机柜台电脑', category: '电脑', description: '柜台工作站电脑', icon: 'Laptop', attributes: JSON.stringify([{ id: 'attr-pc', name: 'CPU型号', type: 'text', required: false }, { id: 'attr-ram', name: '内存大小', type: 'text', required: false }]) },
  })

  const dt3 = await prisma.deviceType.create({
    data: { name: '行李秤', category: '称重设备', description: '行李称重设备', icon: 'Scale', attributes: JSON.stringify([{ id: 'attr-3', name: '最大承重(kg)', type: 'number', required: true }]) },
  })

  const dt4 = await prisma.deviceType.create({
    data: { name: '登机牌打印机', category: '打印机', description: '柜台登机牌打印设备', icon: 'Printer', attributes: JSON.stringify([{ id: 'attr-4', name: '纸张规格', type: 'text', required: true }]) },
  })

  const dt5 = await prisma.deviceType.create({
    data: { name: '行李条打印机', category: '打印机', description: '行李条打印设备', icon: 'Printer', attributes: JSON.stringify([{ id: 'attr-5', name: '打印速度', type: 'text', required: false }]) },
  })

  const dt6 = await prisma.deviceType.create({
    data: { name: '扫描枪', category: '扫描设备', description: '证件/登机牌扫描设备', icon: 'Scan', attributes: JSON.stringify([{ id: 'attr-6', name: '扫描类型', type: 'select', options: ['一维码', '二维码', '全部支持'], required: true }]) },
  })

  const dt7 = await prisma.deviceType.create({
    data: { name: '身份证阅读器', category: '证件设备', description: '第二代身份证阅读器', icon: 'CreditCard', attributes: '[]' },
  })

  const dt8 = await prisma.deviceType.create({
    data: { name: '护照阅读器', category: '证件设备', description: '护照OCR识别设备', icon: 'BookOpen', attributes: '[]' },
  })
  console.log('创建8种设备类型')

  const counters = await prisma.counter.findMany()
  const counterA01 = counters.find(c => c.name === 'A01柜台')!
  const counterA02 = counters.find(c => c.name === 'A02柜台')!
  const counterA03 = counters.find(c => c.name === 'A03柜台')!
  const counterA04 = counters.find(c => c.name === 'A04柜台')!
  const counterA05 = counters.find(c => c.name === 'A05柜台')!
  const counterB01 = counters.find(c => c.name === 'B01柜台')!
  const counterB02 = counters.find(c => c.name === 'B02柜台')!
  const counterA101 = counters.find(c => c.name === 'A101登机口')!
  const counterA102 = counters.find(c => c.name === 'A102登机口')!
  const counterA103 = counters.find(c => c.name === 'A103登机口')!
  const counterB201 = counters.find(c => c.name === 'B201登机口')!
  const counterB202 = counters.find(c => c.name === 'B202登机口')!
  const counterC301 = counters.find(c => c.name === 'C301登机口')!
  const counterD401 = counters.find(c => c.name === 'D401登机口')!

  await prisma.device.createMany({
    data: [
      { name: 'CUSS-C01', typeId: dt1.id, status: 'active', stationId: stationC.id, position: 1, serialNumber: 'CUSS2024001', customData: JSON.stringify({ '纸卷类型': '热敏纸' }) },
      { name: 'CUSS-C02', typeId: dt1.id, status: 'active', stationId: stationC.id, position: 2, serialNumber: 'CUSS2024002', customData: JSON.stringify({ '纸卷类型': '热敏纸' }) },
      { name: 'CUSS-C03', typeId: dt1.id, status: 'active', stationId: stationC.id, position: 3, serialNumber: 'CUSS2024003', customData: JSON.stringify({ '纸卷类型': '热敏纸' }) },
      { name: 'CUSS-C04', typeId: dt1.id, status: 'active', stationId: stationC.id, position: 4, serialNumber: 'CUSS2024004', customData: JSON.stringify({ '纸卷类型': '热敏纸' }) },
      { name: 'CUSS-C05', typeId: dt1.id, status: 'active', stationId: stationC.id, position: 5, serialNumber: 'CUSS2024005', customData: JSON.stringify({ '纸卷类型': '热敏纸' }) },
      { name: 'CUSS-C06', typeId: dt1.id, status: 'standby', stationId: stationStore.id, position: 1, serialNumber: 'CUSS2024006', customData: JSON.stringify({ '纸卷类型': '热敏纸' }) },
      { name: 'CUSS-C07', typeId: dt1.id, status: 'standby', stationId: stationStore.id, position: 2, serialNumber: 'CUSS2024007', customData: JSON.stringify({ '纸卷类型': '热敏纸' }) },
      { name: 'CUSS-C08', typeId: dt1.id, status: 'repair', stationId: stationStore.id, position: 3, serialNumber: 'CUSS2024008', customData: JSON.stringify({ '纸卷类型': '热敏纸' }) },

      { name: 'PC-A01', typeId: dt2.id, status: 'active', stationId: stationA.id, counterId: counterA01.id, position: 1, serialNumber: 'PC2024001', customData: JSON.stringify({ 'CPU型号': 'Intel i5-12400', '内存大小': '16GB' }) },
      { name: 'PC-A02', typeId: dt2.id, status: 'active', stationId: stationA.id, counterId: counterA02.id, position: 1, serialNumber: 'PC2024002', customData: JSON.stringify({ 'CPU型号': 'Intel i5-12400', '内存大小': '16GB' }) },
      { name: 'PC-A03', typeId: dt2.id, status: 'active', stationId: stationA.id, counterId: counterA03.id, position: 1, serialNumber: 'PC2024003', customData: JSON.stringify({ 'CPU型号': 'Intel i5-12400', '内存大小': '16GB' }) },
      { name: 'PC-A04', typeId: dt2.id, status: 'active', stationId: stationA.id, counterId: counterA04.id, position: 1, serialNumber: 'PC2024004', customData: JSON.stringify({ 'CPU型号': 'Intel i5-12400', '内存大小': '16GB' }) },
      { name: 'PC-A05', typeId: dt2.id, status: 'active', stationId: stationA.id, counterId: counterA05.id, position: 1, serialNumber: 'PC2024005', customData: JSON.stringify({ 'CPU型号': 'Intel i5-12400', '内存大小': '16GB' }) },
      { name: 'PC-B01', typeId: dt2.id, status: 'active', stationId: stationB.id, counterId: counterB01.id, position: 1, serialNumber: 'PC2024006', customData: JSON.stringify({ 'CPU型号': 'Intel i5-12400', '内存大小': '16GB' }) },
      { name: 'PC-B02', typeId: dt2.id, status: 'active', stationId: stationB.id, counterId: counterB02.id, position: 1, serialNumber: 'PC2024007', customData: JSON.stringify({ 'CPU型号': 'Intel i5-12400', '内存大小': '16GB' }) },
      { name: 'PC-备机01', typeId: dt2.id, status: 'standby', stationId: stationStore.id, position: 4, serialNumber: 'PC2024008', customData: JSON.stringify({ 'CPU型号': 'Intel i5-12400', '内存大小': '16GB' }) },
      { name: 'PC-备机02', typeId: dt2.id, status: 'standby', stationId: stationStore.id, position: 5, serialNumber: 'PC2024009', customData: JSON.stringify({ 'CPU型号': 'Intel i5-12400', '内存大小': '16GB' }) },
      { name: 'PC-损坏01', typeId: dt2.id, status: 'damaged', stationId: stationStore.id, position: 6, serialNumber: 'PC2024010', customData: JSON.stringify({ 'CPU型号': 'Intel i5-10400', '内存大小': '8GB' }) },

      { name: '行李秤-A01', typeId: dt3.id, status: 'active', stationId: stationA.id, counterId: counterA01.id, position: 2, serialNumber: 'SC2024001', customData: JSON.stringify({ '最大承重(kg)': 50 }) },
      { name: '行李秤-A02', typeId: dt3.id, status: 'active', stationId: stationA.id, counterId: counterA02.id, position: 2, serialNumber: 'SC2024002', customData: JSON.stringify({ '最大承重(kg)': 50 }) },
      { name: '行李秤-A03', typeId: dt3.id, status: 'active', stationId: stationA.id, counterId: counterA03.id, position: 2, serialNumber: 'SC2024003', customData: JSON.stringify({ '最大承重(kg)': 50 }) },
      { name: '行李秤-A04', typeId: dt3.id, status: 'active', stationId: stationA.id, counterId: counterA04.id, position: 2, serialNumber: 'SC2024004', customData: JSON.stringify({ '最大承重(kg)': 50 }) },
      { name: '行李秤-B01', typeId: dt3.id, status: 'active', stationId: stationB.id, counterId: counterB01.id, position: 2, serialNumber: 'SC2024005', customData: JSON.stringify({ '最大承重(kg)': 50 }) },
      { name: '行李秤-备机01', typeId: dt3.id, status: 'standby', stationId: stationStore.id, position: 7, serialNumber: 'SC2024006', customData: JSON.stringify({ '最大承重(kg)': 50 }) },
      { name: '行李秤-送修01', typeId: dt3.id, status: 'repair', stationId: stationStore.id, position: 8, serialNumber: 'SC2024007', customData: JSON.stringify({ '最大承重(kg)': 50 }) },

      { name: '登机牌打印机-A01', typeId: dt4.id, status: 'active', stationId: stationA.id, counterId: counterA01.id, position: 3, serialNumber: 'BP2024001', customData: JSON.stringify({ '纸张规格': '80mm热敏' }) },
      { name: '登机牌打印机-A02', typeId: dt4.id, status: 'active', stationId: stationA.id, counterId: counterA02.id, position: 3, serialNumber: 'BP2024002', customData: JSON.stringify({ '纸张规格': '80mm热敏' }) },
      { name: '登机牌打印机-A03', typeId: dt4.id, status: 'active', stationId: stationA.id, counterId: counterA03.id, position: 3, serialNumber: 'BP2024003', customData: JSON.stringify({ '纸张规格': '80mm热敏' }) },
      { name: '登机牌打印机-备机01', typeId: dt4.id, status: 'standby', stationId: stationStore.id, position: 9, serialNumber: 'BP2024004', customData: JSON.stringify({ '纸张规格': '80mm热敏' }) },

      { name: '行李条打印机-A01', typeId: dt5.id, status: 'active', stationId: stationA.id, counterId: counterA01.id, position: 4, serialNumber: 'BT2024001', customData: JSON.stringify({ '打印速度': '200mm/s' }) },
      { name: '行李条打印机-A02', typeId: dt5.id, status: 'active', stationId: stationA.id, counterId: counterA02.id, position: 4, serialNumber: 'BT2024002', customData: JSON.stringify({ '打印速度': '200mm/s' }) },
      { name: '行李条打印机-备机01', typeId: dt5.id, status: 'standby', stationId: stationStore.id, position: 10, serialNumber: 'BT2024003', customData: JSON.stringify({ '打印速度': '200mm/s' }) },
      { name: '行李条打印机-送修01', typeId: dt5.id, status: 'repair', stationId: stationStore.id, position: 11, serialNumber: 'BT2024004', customData: JSON.stringify({ '打印速度': '200mm/s' }) },

      { name: '扫描枪-A101', typeId: dt6.id, status: 'active', stationId: stationGA.id, counterId: counterA101.id, position: 1, serialNumber: 'SN2024001', customData: JSON.stringify({ '扫描类型': '全部支持' }) },
      { name: '扫描枪-A102', typeId: dt6.id, status: 'active', stationId: stationGA.id, counterId: counterA102.id, position: 1, serialNumber: 'SN2024002', customData: JSON.stringify({ '扫描类型': '全部支持' }) },
      { name: '扫描枪-A103', typeId: dt6.id, status: 'active', stationId: stationGA.id, counterId: counterA103.id, position: 1, serialNumber: 'SN2024003', customData: JSON.stringify({ '扫描类型': '全部支持' }) },
      { name: '扫描枪-B201', typeId: dt6.id, status: 'active', stationId: stationGB.id, counterId: counterB201.id, position: 1, serialNumber: 'SN2024004', customData: JSON.stringify({ '扫描类型': '全部支持' }) },
      { name: '扫描枪-B202', typeId: dt6.id, status: 'active', stationId: stationGB.id, counterId: counterB202.id, position: 1, serialNumber: 'SN2024005', customData: JSON.stringify({ '扫描类型': '全部支持' }) },
      { name: '扫描枪-C301', typeId: dt6.id, status: 'active', stationId: stationGC.id, counterId: counterC301.id, position: 1, serialNumber: 'SN2024006', customData: JSON.stringify({ '扫描类型': '全部支持' }) },
      { name: '扫描枪-D401', typeId: dt6.id, status: 'active', stationId: stationGD.id, counterId: counterD401.id, position: 1, serialNumber: 'SN2024007', customData: JSON.stringify({ '扫描类型': '全部支持' }) },
      { name: '扫描枪-备机01', typeId: dt6.id, status: 'standby', stationId: stationStore.id, position: 12, serialNumber: 'SN2024008', customData: JSON.stringify({ '扫描类型': '全部支持' }) },
      { name: '扫描枪-备机02', typeId: dt6.id, status: 'standby', stationId: stationStore.id, position: 13, serialNumber: 'SN2024009', customData: JSON.stringify({ '扫描类型': '全部支持' }) },

      { name: '身份证阅读器-A01', typeId: dt7.id, status: 'active', stationId: stationA.id, counterId: counterA01.id, position: 5, serialNumber: 'ID2024001', customData: '{}' },
      { name: '身份证阅读器-A02', typeId: dt7.id, status: 'active', stationId: stationA.id, counterId: counterA02.id, position: 5, serialNumber: 'ID2024002', customData: '{}' },
      { name: '身份证阅读器-备机01', typeId: dt7.id, status: 'standby', stationId: stationStore.id, position: 14, serialNumber: 'ID2024003', customData: '{}' },

      { name: '护照阅读器-B01', typeId: dt8.id, status: 'active', stationId: stationB.id, counterId: counterB01.id, position: 5, serialNumber: 'PP2024001', customData: '{}' },
      { name: '护照阅读器-B02', typeId: dt8.id, status: 'active', stationId: stationB.id, counterId: counterB02.id, position: 5, serialNumber: 'PP2024002', customData: '{}' },
      { name: '护照阅读器-备机01', typeId: dt8.id, status: 'standby', stationId: stationStore.id, position: 15, serialNumber: 'PP2024003', customData: '{}' },
    ],
  })
  console.log('创建48台设备')

  const devices = await prisma.device.findMany()
  const cuss001 = devices.find(d => d.serialNumber === 'CUSS2024001')!
  const cuss002 = devices.find(d => d.serialNumber === 'CUSS2024002')!
  const cuss003 = devices.find(d => d.serialNumber === 'CUSS2024003')!
  const pc001 = devices.find(d => d.serialNumber === 'PC2024001')!
  const pc002 = devices.find(d => d.serialNumber === 'PC2024002')!
  const bp001 = devices.find(d => d.serialNumber === 'BP2024001')!
  const bp002 = devices.find(d => d.serialNumber === 'BP2024002')!
  const bt001 = devices.find(d => d.serialNumber === 'BT2024001')!

  await prisma.paperChangeRecord.createMany({
    data: [
      { deviceId: cuss001.id, operatorId: operator.id, operatorName: operator.name, paperType: '热敏纸', quantity: 2, notes: '正常更换，纸卷用尽' },
      { deviceId: cuss002.id, operatorId: operator.id, operatorName: operator.name, paperType: '热敏纸', quantity: 1, notes: '预防性更换' },
      { deviceId: cuss003.id, operatorId: admin.id, operatorName: admin.name, paperType: '热敏纸', quantity: 3, notes: '早班批量更换' },
      { deviceId: bp001.id, operatorId: operator.id, operatorName: operator.name, paperType: '登机牌纸', quantity: 1, notes: '纸卷用尽' },
      { deviceId: bp002.id, operatorId: operator.id, operatorName: operator.name, paperType: '登机牌纸', quantity: 2, notes: '早高峰前更换' },
    ],
  })
  console.log('创建5条换纸记录')

  await prisma.consumableRecord.createMany({
    data: [
      { deviceId: bt001.id, operatorId: operator.id, operatorName: operator.name, consumableType: '行李条碳带', quantity: 1, notes: '碳带更换' },
      { deviceId: pc001.id, operatorId: admin.id, operatorName: admin.name, consumableType: '清洁套装', quantity: 1, notes: '月度清洁维护' },
      { deviceId: pc002.id, operatorId: admin.id, operatorName: admin.name, consumableType: '清洁套装', quantity: 1, notes: '月度清洁维护' },
    ],
  })
  console.log('创建3条耗材记录')

  await prisma.deviceChangeRecord.createMany({
    data: [
      { deviceId: cuss001.id, operatorId: admin.id, operatorName: admin.name, fromStatus: 'standby', toStatus: 'active', fromStationId: stationStore.id, toStationId: stationC.id, reason: 'C区早高峰设备调配' },
      { deviceId: pc001.id, operatorId: admin.id, operatorName: admin.name, fromStatus: 'standby', toStatus: 'active', fromStationId: stationStore.id, toStationId: stationA.id, toCounterId: counterA01.id, reason: 'A01柜台正式启用' },
      { deviceId: pc002.id, operatorId: admin.id, operatorName: admin.name, fromStatus: 'standby', toStatus: 'active', fromStationId: stationStore.id, toStationId: stationA.id, toCounterId: counterA02.id, reason: 'A02柜台正式启用' },
    ],
  })
  console.log('创建3条设备变更记录')

  console.log('')
  console.log('========================================')
  console.log('  数据库初始化完成！')
  console.log('========================================')
  console.log('')
  console.log('  站点: 8 个')
  console.log('  柜台/登机口: 25 个')
  console.log('  设备类型: 8 种')
  console.log('  设备总数: 48 台')
  console.log('  用户: 2 个')
  console.log('  换纸记录: 5 条')
  console.log('  耗材记录: 3 条')
  console.log('  变更记录: 3 条')
  console.log('')
  console.log('  默认登录账号:')
  console.log('    admin / admin123  (管理员)')
  console.log('    operator / operator123  (普通用户)')
  console.log('')
  console.log('========================================')
}

main()
  .catch(e => {
    console.error('数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
