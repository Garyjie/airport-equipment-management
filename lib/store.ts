'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  User,
  DeviceType,
  Device,
  Station,
  Counter,
  DeviceChangeRecord,
  PaperChangeRecord,
  ConsumableRecord,
} from './types'
import { generateId } from './types'

// 初始设备类型数据
const initialDeviceTypes: DeviceType[] = [
  {
    id: 'dt-1',
    name: 'CUSS 自助值机机',
    icon: 'Monitor',
    description: '自助打印登机牌设备',
    customAttributes: [
      { id: 'attr-1', name: '纸卷类型', type: 'select', options: ['热敏纸', '普通纸'], required: true },
      { id: 'attr-2', name: '最后换纸时间', type: 'date', required: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dt-2',
    name: '值机柜台电脑',
    icon: 'Laptop',
    description: '柜台工作站电脑',
    customAttributes: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dt-3',
    name: '行李秤',
    icon: 'Scale',
    description: '行李称重设备',
    customAttributes: [
      { id: 'attr-3', name: '最大承重(kg)', type: 'number', required: true },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dt-4',
    name: '登机牌打印机',
    icon: 'Printer',
    description: '柜台登机牌打印设备',
    customAttributes: [
      { id: 'attr-4', name: '纸张规格', type: 'text', required: true },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dt-5',
    name: '行李条打印机',
    icon: 'Printer',
    description: '行李条打印设备',
    customAttributes: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dt-6',
    name: '扫描枪',
    icon: 'Scan',
    description: '证件扫描设备',
    customAttributes: [],
    createdAt: new Date().toISOString(),
  },
]

// 初始站点数据
const initialStations: Station[] = [
  { id: 'st-1', name: 'A值机岛', type: 'checkin', code: 'A', description: '国内航班值机区', position: { x: 0, y: 0 }, createdAt: new Date().toISOString() },
  { id: 'st-2', name: 'B值机岛', type: 'checkin', code: 'B', description: '国际航班值机区', position: { x: 1, y: 0 }, createdAt: new Date().toISOString() },
  { id: 'st-3', name: 'C自助服务区', type: 'selfservice', code: 'C', description: '自助值机区域', position: { x: 2, y: 0 }, createdAt: new Date().toISOString() },
  // 指廊登机口
  { id: 'st-4', name: 'A指廊登机口', type: 'gate', code: 'GA', description: 'A指廊登机口区域', position: { x: 0, y: 1 }, createdAt: new Date().toISOString() },
  { id: 'st-5', name: 'B指廊登机口', type: 'gate', code: 'GB', description: 'B指廊登机口区域', position: { x: 1, y: 1 }, createdAt: new Date().toISOString() },
  { id: 'st-6', name: 'C指廊登机口', type: 'gate', code: 'GC', description: 'C指廊登机口区域', position: { x: 2, y: 1 }, createdAt: new Date().toISOString() },
  { id: 'st-7', name: 'D指廊登机口', type: 'gate', code: 'GD', description: 'D指廊登机口区域', position: { x: 3, y: 1 }, createdAt: new Date().toISOString() },
  { id: 'st-8', name: 'E指廊登机口', type: 'gate', code: 'GE', description: 'E指廊登机口区域', position: { x: 0, y: 2 }, createdAt: new Date().toISOString() },
]

// 初始柜台数据
const initialCounters: Counter[] = [
  // 值机岛柜台
  { id: 'ct-1', name: 'A01柜台', stationId: 'st-1', position: 1, createdAt: new Date().toISOString() },
  { id: 'ct-2', name: 'A02柜台', stationId: 'st-1', position: 2, createdAt: new Date().toISOString() },
  { id: 'ct-3', name: 'A03柜台', stationId: 'st-1', position: 3, createdAt: new Date().toISOString() },
  { id: 'ct-4', name: 'A04柜台', stationId: 'st-1', position: 4, createdAt: new Date().toISOString() },
  { id: 'ct-5', name: 'B01柜台', stationId: 'st-2', position: 1, createdAt: new Date().toISOString() },
  { id: 'ct-6', name: 'B02柜台', stationId: 'st-2', position: 2, createdAt: new Date().toISOString() },
  // A指廊登机口
  { id: 'ct-7', name: 'A101登机口', stationId: 'st-4', position: 1, createdAt: new Date().toISOString() },
  { id: 'ct-8', name: 'A102登机口', stationId: 'st-4', position: 2, createdAt: new Date().toISOString() },
  { id: 'ct-9', name: 'A103登机口', stationId: 'st-4', position: 3, createdAt: new Date().toISOString() },
  { id: 'ct-10', name: 'A104登机口', stationId: 'st-4', position: 4, createdAt: new Date().toISOString() },
  // B指廊登机口
  { id: 'ct-11', name: 'B201登机口', stationId: 'st-5', position: 1, createdAt: new Date().toISOString() },
  { id: 'ct-12', name: 'B202登机口', stationId: 'st-5', position: 2, createdAt: new Date().toISOString() },
  { id: 'ct-13', name: 'B203登机口', stationId: 'st-5', position: 3, createdAt: new Date().toISOString() },
  // C指廊登机口
  { id: 'ct-14', name: 'C301登机口', stationId: 'st-6', position: 1, createdAt: new Date().toISOString() },
  { id: 'ct-15', name: 'C302登机口', stationId: 'st-6', position: 2, createdAt: new Date().toISOString() },
  // D指廊登机口
  { id: 'ct-16', name: 'D401登机口', stationId: 'st-7', position: 1, createdAt: new Date().toISOString() },
  { id: 'ct-17', name: 'D402登机口', stationId: 'st-7', position: 2, createdAt: new Date().toISOString() },
  { id: 'ct-18', name: 'D403登机口', stationId: 'st-7', position: 3, createdAt: new Date().toISOString() },
  { id: 'ct-19', name: 'D404登机口', stationId: 'st-7', position: 4, createdAt: new Date().toISOString() },
  // E指廊登机口
  { id: 'ct-20', name: 'E501登机口', stationId: 'st-8', position: 1, createdAt: new Date().toISOString() },
  { id: 'ct-21', name: 'E502登机口', stationId: 'st-8', position: 2, createdAt: new Date().toISOString() },
  { id: 'ct-22', name: 'E503登机口', stationId: 'st-8', position: 3, createdAt: new Date().toISOString() },
]

// 初始设备数据 - 注意：只有 active 状态的设备才绑定到柜台
const initialDevices: Device[] = [
  // 自助服务区设备
  { id: 'dev-1', name: 'CUSS-C01', typeId: 'dt-1', status: 'active', stationId: 'st-3', position: 1, serialNumber: 'CUSS2024001', customData: { '纸卷类型': '热敏纸' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'dev-2', name: 'CUSS-C02', typeId: 'dt-1', status: 'active', stationId: 'st-3', position: 2, serialNumber: 'CUSS2024002', customData: { '纸卷类型': '热敏纸' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // A值机岛柜台设备
  { id: 'dev-4', name: 'PC-A01', typeId: 'dt-2', status: 'active', stationId: 'st-1', counterId: 'ct-1', position: 1, serialNumber: 'PC2024001', customData: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'dev-5', name: 'PC-A02', typeId: 'dt-2', status: 'active', stationId: 'st-1', counterId: 'ct-2', position: 1, serialNumber: 'PC2024002', customData: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'dev-7', name: '行李秤-A01', typeId: 'dt-3', status: 'active', stationId: 'st-1', counterId: 'ct-1', position: 2, serialNumber: 'SC2024001', customData: { '最大承重(kg)': 50 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'dev-8', name: '打印机-A01', typeId: 'dt-4', status: 'active', stationId: 'st-1', counterId: 'ct-1', position: 3, serialNumber: 'PR2024001', customData: { '纸张规格': 'A4' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // 登机口设备
  { id: 'dev-10', name: '扫描枪-A101', typeId: 'dt-6', status: 'active', stationId: 'st-4', counterId: 'ct-7', position: 1, serialNumber: 'SN2024001', customData: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'dev-13', name: '扫描枪-A102', typeId: 'dt-6', status: 'active', stationId: 'st-4', counterId: 'ct-8', position: 1, serialNumber: 'SN2024002', customData: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'dev-14', name: '打印机-A101', typeId: 'dt-4', status: 'active', stationId: 'st-4', counterId: 'ct-7', position: 2, serialNumber: 'PR2024002', customData: { '纸张规格': 'A4' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'dev-15', name: '扫描枪-B201', typeId: 'dt-6', status: 'active', stationId: 'st-5', counterId: 'ct-11', position: 1, serialNumber: 'SN2024003', customData: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'dev-16', name: '扫描枪-C301', typeId: 'dt-6', status: 'active', stationId: 'st-6', counterId: 'ct-14', position: 1, serialNumber: 'SN2024004', customData: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // 备机区设备（不绑定柜台）
  { id: 'dev-3', name: 'CUSS-备机01', typeId: 'dt-1', status: 'standby', stationId: 'st-3', position: 3, serialNumber: 'CUSS2024003', customData: { '纸卷类型': '热敏纸' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'dev-11', name: 'PC-备机01', typeId: 'dt-2', status: 'standby', stationId: 'st-1', position: 1, serialNumber: 'PC2024004', customData: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'dev-12', name: '行李秤-备机01', typeId: 'dt-3', status: 'standby', stationId: 'st-1', position: 1, serialNumber: 'SC2024002', customData: { '最大承重(kg)': 50 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'dev-17', name: '扫描枪-备机01', typeId: 'dt-6', status: 'standby', serialNumber: 'SN2024005', customData: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // 损坏设备（不绑定柜台）
  { id: 'dev-6', name: 'PC-A03', typeId: 'dt-2', status: 'damaged', stationId: 'st-1', position: 1, serialNumber: 'PC2024003', customData: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // 送修设备（不绑定柜台）
  { id: 'dev-9', name: '行李条打印机-A01', typeId: 'dt-5', status: 'repair', stationId: 'st-1', position: 2, serialNumber: 'BT2024001', customData: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

// 初始用户数据
const initialUsers: User[] = [
  { id: 'user-1', username: 'admin', password: 'admin123', role: 'admin', name: '系统管理员', createdAt: new Date().toISOString() },
  { id: 'user-2', username: 'operator', password: 'operator123', role: 'user', name: '值机员小王', createdAt: new Date().toISOString() },
]

// 初始换纸记录
const initialPaperRecords: PaperChangeRecord[] = [
  { id: 'pr-1', deviceId: 'dev-1', operatorId: 'user-2', operatorName: '值机员小王', paperType: '热敏纸', quantity: 2, notes: '正常更换', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'pr-2', deviceId: 'dev-2', operatorId: 'user-2', operatorName: '值机员小王', paperType: '热敏纸', quantity: 1, notes: '纸卷用尽', createdAt: new Date(Date.now() - 43200000).toISOString() },
]

interface StoreState {
  users: User[]
  deviceTypes: DeviceType[]
  devices: Device[]
  stations: Station[]
  counters: Counter[]
  changeRecords: DeviceChangeRecord[]
  paperRecords: PaperChangeRecord[]
  consumableRecords: ConsumableRecord[]
  currentUser: User | null
  isInitialized: boolean
}

const STORAGE_KEY = 'airport-equipment-store'

function loadFromStorage(): Partial<StoreState> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return {}
}

function saveToStorage(state: Partial<StoreState>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

export function useStore() {
  const [state, setState] = useState<StoreState>({
    users: [],
    deviceTypes: [],
    devices: [],
    stations: [],
    counters: [],
    changeRecords: [],
    paperRecords: [],
    consumableRecords: [],
    currentUser: null,
    isInitialized: false,
  })

  // 初始化数据
  useEffect(() => {
    const stored = loadFromStorage()
    setState({
      users: stored.users || initialUsers,
      deviceTypes: stored.deviceTypes || initialDeviceTypes,
      devices: stored.devices || initialDevices,
      stations: stored.stations || initialStations,
      counters: stored.counters || initialCounters,
      changeRecords: stored.changeRecords || [],
      paperRecords: stored.paperRecords || initialPaperRecords,
      consumableRecords: stored.consumableRecords || [],
      currentUser: stored.currentUser || null,
      isInitialized: true,
    })
  }, [])

  // 保存数据
  useEffect(() => {
    if (state.isInitialized) {
      saveToStorage(state)
    }
  }, [state])

  // 用户相关操作
  const login = useCallback((username: string, password: string): User | null => {
    const user = state.users.find(u => u.username === username && u.password === password)
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }))
      return user
    }
    return null
  }, [state.users])

  const logout = useCallback(() => {
    setState(prev => ({ ...prev, currentUser: null }))
  }, [])

  const addUser = useCallback((user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = { ...user, id: generateId(), createdAt: new Date().toISOString() }
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }))
    return newUser
  }, [])

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...updates } : u),
    }))
  }, [])

  const deleteUser = useCallback((id: string) => {
    setState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }))
  }, [])

  // 设备类型操作
  const addDeviceType = useCallback((type: Omit<DeviceType, 'id' | 'createdAt'>) => {
    const newType: DeviceType = { ...type, id: generateId(), createdAt: new Date().toISOString() }
    setState(prev => ({ ...prev, deviceTypes: [...prev.deviceTypes, newType] }))
    return newType
  }, [])

  const updateDeviceType = useCallback((id: string, updates: Partial<DeviceType>) => {
    setState(prev => ({
      ...prev,
      deviceTypes: prev.deviceTypes.map(t => t.id === id ? { ...t, ...updates } : t),
    }))
  }, [])

  const deleteDeviceType = useCallback((id: string) => {
    setState(prev => ({ ...prev, deviceTypes: prev.deviceTypes.filter(t => t.id !== id) }))
  }, [])

  // 设备操作
  const addDevice = useCallback((device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newDevice: Device = { ...device, id: generateId(), createdAt: now, updatedAt: now }
    setState(prev => {
      const record: DeviceChangeRecord = {
        id: generateId(),
        deviceId: newDevice.id,
        fromStationId: undefined,
        toStationId: newDevice.stationId || undefined,
        fromCounterId: undefined,
        toCounterId: newDevice.counterId || undefined,
        fromStatus: undefined,
        toStatus: newDevice.status || 'standby',
        reason: '新增设备',
        operatorId: prev.currentUser?.id || 'system',
        operatorName: prev.currentUser?.name || '系统',
        createdAt: now,
      }
      return { 
        ...prev, 
        devices: [...prev.devices, newDevice],
        changeRecords: [...prev.changeRecords, record],
      }
    })
    return newDevice
  }, [])

  const updateDevice = useCallback((id: string, updates: Partial<Device>) => {
    setState(prev => ({
      ...prev,
      devices: prev.devices.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d),
    }))
  }, [])

  const deleteDevice = useCallback((id: string) => {
    setState(prev => {
      const device = prev.devices.find(d => d.id === id)
      if (device) {
        const now = new Date().toISOString()
        const record: DeviceChangeRecord = {
          id: generateId(),
          deviceId: device.id,
          fromStationId: device.stationId || undefined,
          toStationId: undefined,
          fromCounterId: device.counterId || undefined,
          toCounterId: undefined,
          fromStatus: device.status,
          toStatus: undefined,
          reason: '设备删除',
          operatorId: prev.currentUser?.id || 'system',
          operatorName: prev.currentUser?.name || '系统',
          createdAt: now,
        }
        return { 
          ...prev, 
          devices: prev.devices.filter(d => d.id !== id),
          changeRecords: [...prev.changeRecords, record],
        }
      }
      return { ...prev, devices: prev.devices.filter(d => d.id !== id) }
    })
  }, [])

  const moveDevice = useCallback((deviceId: string, toStationId: string, toCounterId?: string, reason?: string) => {
    const device = state.devices.find(d => d.id === deviceId)
    if (!device || !state.currentUser) return

    const record: DeviceChangeRecord = {
      id: generateId(),
      deviceId,
      fromStationId: device.stationId,
      toStationId,
      fromCounterId: device.counterId,
      toCounterId,
      fromStatus: device.status,
      toStatus: device.status,
      reason: reason || '设备移动',
      operatorId: state.currentUser.id,
      operatorName: state.currentUser.name,
      createdAt: new Date().toISOString(),
    }

    setState(prev => ({
      ...prev,
      devices: prev.devices.map(d => 
        d.id === deviceId 
          ? { ...d, stationId: toStationId, counterId: toCounterId, updatedAt: new Date().toISOString() }
          : d
      ),
      changeRecords: [...prev.changeRecords, record],
    }))
  }, [state.devices, state.currentUser])

  const changeDeviceStatus = useCallback((deviceId: string, newStatus: Device['status'], reason?: string) => {
    const device = state.devices.find(d => d.id === deviceId)
    if (!device || !state.currentUser) return

    // 如果从使用中变为其他状态，设备自动离开柜台并进入备机区
    const shouldClearCounter = device.status === 'active' && newStatus !== 'active'
    const newCounterId = shouldClearCounter ? undefined : device.counterId
    const newStationId = shouldClearCounter ? undefined : device.stationId

    const record: DeviceChangeRecord = {
      id: generateId(),
      deviceId,
      fromStationId: device.stationId,
      toStationId: newStationId,
      fromCounterId: device.counterId,
      toCounterId: newCounterId,
      fromStatus: device.status,
      toStatus: newStatus,
      reason: reason || '状态变更',
      operatorId: state.currentUser.id,
      operatorName: state.currentUser.name,
      createdAt: new Date().toISOString(),
    }

    setState(prev => ({
      ...prev,
      devices: prev.devices.map(d => 
        d.id === deviceId 
          ? { ...d, status: newStatus, stationId: newStationId, counterId: newCounterId, updatedAt: new Date().toISOString() }
          : d
      ),
      changeRecords: [...prev.changeRecords, record],
    }))
  }, [state.devices, state.currentUser])

  // 站点操作
  const addStation = useCallback((station: Omit<Station, 'id' | 'createdAt'>) => {
    const newStation: Station = { ...station, id: generateId(), createdAt: new Date().toISOString() }
    setState(prev => ({ ...prev, stations: [...prev.stations, newStation] }))
    return newStation
  }, [])

  const updateStation = useCallback((id: string, updates: Partial<Station>) => {
    setState(prev => ({
      ...prev,
      stations: prev.stations.map(s => s.id === id ? { ...s, ...updates } : s),
    }))
  }, [])

  const deleteStation = useCallback((id: string) => {
    setState(prev => ({ ...prev, stations: prev.stations.filter(s => s.id !== id) }))
  }, [])

  // 柜台操作
  const addCounter = useCallback((counter: Omit<Counter, 'id' | 'createdAt'>) => {
    const newCounter: Counter = { ...counter, id: generateId(), createdAt: new Date().toISOString() }
    setState(prev => ({ ...prev, counters: [...prev.counters, newCounter] }))
    return newCounter
  }, [])

  const updateCounter = useCallback((id: string, updates: Partial<Counter>) => {
    setState(prev => ({
      ...prev,
      counters: prev.counters.map(c => c.id === id ? { ...c, ...updates } : c),
    }))
  }, [])

  const deleteCounter = useCallback((id: string) => {
    setState(prev => ({ ...prev, counters: prev.counters.filter(c => c.id !== id) }))
  }, [])

  // 换纸记录
  const addPaperRecord = useCallback((record: Omit<PaperChangeRecord, 'id' | 'createdAt'>) => {
    const newRecord: PaperChangeRecord = { ...record, id: generateId(), createdAt: new Date().toISOString() }
    setState(prev => ({ ...prev, paperRecords: [...prev.paperRecords, newRecord] }))
    return newRecord
  }, [])

  // 添加变更记录
  const addChangeRecord = useCallback((record: DeviceChangeRecord) => {
    setState(prev => ({ ...prev, changeRecords: [...prev.changeRecords, record] }))
  }, [])

  // 耗材记录
  const addConsumableRecord = useCallback((record: Omit<ConsumableRecord, 'id' | 'createdAt'>) => {
    const newRecord: ConsumableRecord = { ...record, id: generateId(), createdAt: new Date().toISOString() }
    setState(prev => ({ ...prev, consumableRecords: [...prev.consumableRecords, newRecord] }))
    return newRecord
  }, [])

  // 重置数据到初始状态
  const resetData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    setState({
      users: initialUsers,
      deviceTypes: initialDeviceTypes,
      devices: initialDevices,
      stations: initialStations,
      counters: initialCounters,
      changeRecords: [],
      paperRecords: initialPaperRecords,
      consumableRecords: [],
      currentUser: null,
      isInitialized: true,
    })
  }, [])

  return {
    ...state,
    login,
    logout,
    resetData,
    addUser,
    updateUser,
    deleteUser,
    addDeviceType,
    updateDeviceType,
    deleteDeviceType,
    addDevice,
    updateDevice,
    deleteDevice,
    moveDevice,
    changeDeviceStatus,
    addStation,
    updateStation,
    deleteStation,
    addCounter,
    updateCounter,
    deleteCounter,
    addPaperRecord,
    addChangeRecord,
    addConsumableRecord,
  }
}

export type Store = ReturnType<typeof useStore>
