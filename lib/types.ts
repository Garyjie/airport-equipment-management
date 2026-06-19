// 设备状态枚举
export type DeviceStatus = 'active' | 'standby' | 'damaged' | 'repair'

// 用户角色
export type UserRole = 'admin' | 'user'

// 用户
export interface User {
  id: string
  username: string
  password: string
  role: UserRole
  name: string
  createdAt: string
}

// 设备类型自定义属性
export interface CustomAttribute {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select'
  options?: string[] // 用于 select 类型
  required: boolean
}

// 设备类型
export interface DeviceType {
  id: string
  name: string
  icon: string
  description: string
  customAttributes: CustomAttribute[]
  createdAt: string
}

// 设备
export interface Device {
  id: string
  name: string
  typeId: string
  status: DeviceStatus
  stationId: string
  counterId?: string
  position: number
  serialNumber: string
  customData: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// 柜台
export interface Counter {
  id: string
  name: string
  stationId: string
  position: number
  createdAt: string
}

// 站点类型
export type StationType = 'checkin' | 'gate' | 'selfservice'

// 站点
export interface Station {
  id: string
  name: string
  type: StationType
  code: string
  description: string
  position: { x: number; y: number }
  createdAt: string
}

// 设备更换记录
export interface DeviceChangeRecord {
  id: string
  deviceId: string
  fromStationId?: string
  toStationId?: string
  fromCounterId?: string
  toCounterId?: string
  fromStatus: DeviceStatus
  toStatus: DeviceStatus
  reason: string
  operatorId: string
  operatorName: string
  createdAt: string
}

// CUSS 换纸记录
export interface PaperChangeRecord {
  id: string
  deviceId: string
  operatorId: string
  operatorName: string
  paperType: string
  quantity: number
  notes: string
  createdAt: string
}

// 耗材记录（通用）
export interface ConsumableRecord {
  id: string
  deviceId: string
  consumableType: string
  operatorId: string
  operatorName: string
  quantity: number
  notes: string
  createdAt: string
}

// 状态颜色映射
export const statusColors: Record<DeviceStatus, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-emerald-500', text: 'text-emerald-500', label: '使用中' },
  standby: { bg: 'bg-sky-500', text: 'text-sky-500', label: '备机' },
  damaged: { bg: 'bg-amber-500', text: 'text-amber-500', label: '损坏' },
  repair: { bg: 'bg-rose-500', text: 'text-rose-500', label: '送修' },
}

// 站点类型映射
export const stationTypeLabels: Record<StationType, string> = {
  checkin: '值机岛',
  gate: '登机口',
  selfservice: '自助服务区',
}

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
