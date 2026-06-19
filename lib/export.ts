import type { Device, DeviceType, Station, Counter, DeviceChangeRecord, PaperChangeRecord, User, UserRole, StationType, DeviceStatus } from './types'
import { statusColors, stationTypeLabels } from './types'

// 生成唯一ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function downloadFile(content: string, filename: string, type: string) {
  const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportDevicesCSV(
  devices: Device[],
  deviceTypes: DeviceType[],
  stations: Station[],
  counters: Counter[]
) {
  const headers = ['设备名称', '设备类型', '序列号', '状态', '所属站点', '所属柜台', '创建时间', '更新时间']
  
  // 先按站点排序，然后同一站点内按柜台排序，备机放在最后
  const sortedDevices = [...devices].sort((a, b) => {
    // 首先区分有站点和无站点（备机区）
    const aHasStation = !!a.stationId && a.status !== 'standby'
    const bHasStation = !!b.stationId && b.status !== 'standby'
    
    // 有站点的在前，无站点（备机）的在后
    if (aHasStation && !bHasStation) return -1
    if (!aHasStation && bHasStation) return 1
    
    // 如果都是有站点的，按站点名称排序
    if (aHasStation && bHasStation) {
      const aStation = stations.find(s => s.id === a.stationId)
      const bStation = stations.find(s => s.id === b.stationId)
      const stationCompare = (aStation?.name || '').localeCompare(bStation?.name || '', 'zh-CN')
      if (stationCompare !== 0) return stationCompare
      
      // 同一站点内按柜台名称排序
      const aCounter = counters.find(c => c.id === a.counterId)
      const bCounter = counters.find(c => c.id === b.counterId)
      return (aCounter?.name || '').localeCompare(bCounter?.name || '', 'zh-CN')
    }
    
    // 如果都是备机，按设备名称排序
    return a.name.localeCompare(b.name, 'zh-CN')
  })
  
  const rows = sortedDevices.map(device => {
    const type = deviceTypes.find(t => t.id === device.typeId)
    const station = stations.find(s => s.id === device.stationId)
    const counter = counters.find(c => c.id === device.counterId)
    
    return [
      escapeCSV(device.name),
      escapeCSV(type?.name),
      escapeCSV(device.serialNumber),
      escapeCSV(statusColors[device.status].label),
      escapeCSV(device.status === 'standby' ? '库房（备机区）' : (station?.name || '')),
      escapeCSV(counter?.name),
      escapeCSV(new Date(device.createdAt).toLocaleString('zh-CN')),
      escapeCSV(new Date(device.updatedAt).toLocaleString('zh-CN')),
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  downloadFile(csv, `设备列表_${new Date().toLocaleDateString('zh-CN')}.csv`, 'text/csv')
}

export function exportStationsCSV(stations: Station[], counters: Counter[], devices: Device[]) {
  const headers = ['站点名称', '站点代码', '站点类型', '描述', '柜台数量', '设备数量', '创建时间']
  
  const rows = stations.map(station => {
    const stationCounters = counters.filter(c => c.stationId === station.id)
    const stationDevices = devices.filter(d => d.stationId === station.id)
    
    return [
      escapeCSV(station.name),
      escapeCSV(station.code),
      escapeCSV(stationTypeLabels[station.type]),
      escapeCSV(station.description),
      escapeCSV(stationCounters.length),
      escapeCSV(stationDevices.length),
      escapeCSV(new Date(station.createdAt).toLocaleString('zh-CN')),
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  downloadFile(csv, `站点列表_${new Date().toLocaleDateString('zh-CN')}.csv`, 'text/csv')
}

export function exportChangeRecordsCSV(
  records: DeviceChangeRecord[],
  devices: Device[],
  stations: Station[],
  counters: Counter[]
) {
  const headers = ['设备名称', '序列号', '原站点', '新站点', '原柜台', '新柜台', '原状态', '新状态', '变更原因', '操作员', '操作时间']
  
  const rows = records.map(record => {
    const device = devices.find(d => d.id === record.deviceId)
    const fromStation = stations.find(s => s.id === record.fromStationId)
    const toStation = stations.find(s => s.id === record.toStationId)
    const fromCounter = counters.find(c => c.id === record.fromCounterId)
    const toCounter = counters.find(c => c.id === record.toCounterId)
    
    return [
      escapeCSV(device?.name),
      escapeCSV(device?.serialNumber),
      escapeCSV(fromStation?.name),
      escapeCSV(toStation?.name),
      escapeCSV(fromCounter?.name),
      escapeCSV(toCounter?.name),
      escapeCSV(statusColors[record.fromStatus].label),
      escapeCSV(statusColors[record.toStatus].label),
      escapeCSV(record.reason),
      escapeCSV(record.operatorName),
      escapeCSV(new Date(record.createdAt).toLocaleString('zh-CN')),
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  downloadFile(csv, `更换记录_${new Date().toLocaleDateString('zh-CN')}.csv`, 'text/csv')
}

export function exportPaperRecordsCSV(records: PaperChangeRecord[], devices: Device[]) {
  const headers = ['设备名称', '纸张类型', '数量', '操作员', '备注', '操作时间']
  
  const rows = records.map(record => {
    const device = devices.find(d => d.id === record.deviceId)
    
    return [
      escapeCSV(device?.name),
      escapeCSV(record.paperType),
      escapeCSV(record.quantity),
      escapeCSV(record.operatorName),
      escapeCSV(record.notes),
      escapeCSV(new Date(record.createdAt).toLocaleString('zh-CN')),
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  downloadFile(csv, `换纸记录_${new Date().toLocaleDateString('zh-CN')}.csv`, 'text/csv')
}

// ==================== 导入功能 ====================

function parseCSV(content: string): string[][] {
  const lines = content.split('\n').filter(line => line.trim())
  return lines.map(line => {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  })
}

// 导入设备模板
export function downloadDeviceTemplate() {
  const headers = ['设备名称', '设备类型', '序列号', '状态', '所属站点', '所属柜台']
  const example = ['CUSS-B01', 'CUSS 自助值机机', 'CUSS2024010', '备机', 'A值机岛', '']
  const csv = [headers.join(','), example.join(',')].join('\n')
  downloadFile(csv, `设备导入模板.csv`, 'text/csv')
}

export function parseDevicesCSV(
  content: string,
  deviceTypes: DeviceType[],
  stations: Station[],
  counters: Counter[]
): { devices: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>[]; errors: string[] } {
  const rows = parseCSV(content)
  if (rows.length < 2) {
    return { devices: [], errors: ['文件为空或格式不正确'] }
  }

  const statusMap: Record<string, DeviceStatus> = {
    '使用中': 'active',
    '备机': 'standby',
    '损坏': 'damaged',
    '送修': 'repair'
  }

  const devices: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>[] = []
  const errors: string[] = []

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 4) {
      errors.push(`第 ${i + 1} 行: 数据列数不足`)
      continue
    }

    const [name, typeName, serialNumber, statusStr, stationName, counterName] = row
    
    if (!name || !typeName || !serialNumber) {
      errors.push(`第 ${i + 1} 行: 设备名称、类型和序列号不能为空`)
      continue
    }

    const type = deviceTypes.find(t => t.name === typeName)
    if (!type) {
      errors.push(`第 ${i + 1} 行: 未找到设备类型 "${typeName}"`)
      continue
    }

    const status = statusMap[statusStr] || 'standby'
    
    let stationId = stations[0]?.id || ''
    if (stationName) {
      const station = stations.find(s => s.name === stationName)
      if (station) {
        stationId = station.id
      } else {
        errors.push(`第 ${i + 1} 行: 未找到站点 "${stationName}"，已使用默认站点`)
      }
    }

    let counterId: string | undefined
    if (counterName && status === 'active') {
      const counter = counters.find(c => c.name === counterName && c.stationId === stationId)
      if (counter) {
        counterId = counter.id
      }
    }

    devices.push({
      name,
      typeId: type.id,
      serialNumber,
      status,
      stationId,
      counterId,
      position: devices.length + 1,
      customData: {},
    })
  }

  return { devices, errors }
}

// 导入站点模板
export function downloadStationTemplate() {
  const headers = ['站点名称', '站点代码', '站点类型', '描述']
  const example = ['D值机岛', 'D', '值机岛', '国际航班值机区']
  const csv = [headers.join(','), example.join(',')].join('\n')
  downloadFile(csv, `站点导入模板.csv`, 'text/csv')
}

export function parseStationsCSV(content: string): { 
  stations: Omit<Station, 'id' | 'createdAt'>[]; 
  errors: string[] 
} {
  const rows = parseCSV(content)
  if (rows.length < 2) {
    return { stations: [], errors: ['文件为空或格式不正确'] }
  }

  const typeMap: Record<string, StationType> = {
    '值机岛': 'checkin',
    '登机口': 'gate',
    '自助服务区': 'selfservice'
  }

  const stations: Omit<Station, 'id' | 'createdAt'>[] = []
  const errors: string[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 3) {
      errors.push(`第 ${i + 1} 行: 数据列数不足`)
      continue
    }

    const [name, code, typeStr, description] = row
    
    if (!name || !code) {
      errors.push(`第 ${i + 1} 行: 站点名称和代码不能为空`)
      continue
    }

    const type = typeMap[typeStr] || 'checkin'

    stations.push({
      name,
      code,
      type,
      description: description || '',
      position: { x: stations.length % 3, y: Math.floor(stations.length / 3) },
    })
  }

  return { stations, errors }
}

// 导入用户模板
export function downloadUserTemplate() {
  const headers = ['用户名', '密码', '姓名', '角色']
  const example = ['zhangsan', '123456', '张三', '普通用户']
  const csv = [headers.join(','), example.join(',')].join('\n')
  downloadFile(csv, `用户导入模板.csv`, 'text/csv')
}

export function parseUsersCSV(content: string): { 
  users: Omit<User, 'id' | 'createdAt'>[]; 
  errors: string[] 
} {
  const rows = parseCSV(content)
  if (rows.length < 2) {
    return { users: [], errors: ['文件为空或格式不正确'] }
  }

  const roleMap: Record<string, UserRole> = {
    '管理员': 'admin',
    '普通用户': 'user'
  }

  const users: Omit<User, 'id' | 'createdAt'>[] = []
  const errors: string[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 4) {
      errors.push(`第 ${i + 1} 行: 数据列数不足`)
      continue
    }

    const [username, password, name, roleStr] = row
    
    if (!username || !password || !name) {
      errors.push(`第 ${i + 1} 行: 用户名、密码和姓名不能为空`)
      continue
    }

    const role = roleMap[roleStr] || 'user'

    users.push({
      username,
      password,
      name,
      role,
    })
  }

  return { users, errors }
}

// 导出用户
export function exportUsersCSV(users: User[]) {
  const headers = ['用户名', '姓名', '角色', '创建时间']
  
  const rows = users.map(user => {
    return [
      escapeCSV(user.username),
      escapeCSV(user.name),
      escapeCSV(user.role === 'admin' ? '管理员' : '普通用户'),
      escapeCSV(new Date(user.createdAt).toLocaleString('zh-CN')),
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  downloadFile(csv, `用户列表_${new Date().toLocaleDateString('zh-CN')}.csv`, 'text/csv')
}
