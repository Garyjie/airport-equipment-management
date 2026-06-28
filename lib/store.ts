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
import {
  authApi,
  userApi,
  deviceTypeApi,
  stationApi,
  counterApi,
  deviceApi,
  changeRecordApi,
  paperRecordApi,
  consumableRecordApi,
} from './api'

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
  isLoading: boolean
  error: string | null
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
    isLoading: true,
    error: null,
  })

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
    if (error) {
      setTimeout(() => setState(prev => ({ ...prev, error: null })), 5000)
    }
  }, [])

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      let currentUser: User | null = null
      try {
        currentUser = await authApi.getMe()
      } catch {
        currentUser = null
      }

      if (!currentUser) {
        setState(prev => ({
          ...prev,
          currentUser: null,
          isInitialized: true,
          isLoading: false,
          error: null,
        }))
        return
      }

      const deviceTypes = await deviceTypeApi.getAll()
      const devices = await deviceApi.getAll()
      const stations = await stationApi.getAll()
      const counters = await counterApi.getAll()
      const changeRecords = await changeRecordApi.getAll()
      const paperRecords = await paperRecordApi.getAll()
      const consumableRecords = await consumableRecordApi.getAll()
      const users = currentUser.role === 'admin' ? await userApi.getAll() : []

      setState(prev => ({
        ...prev,
        users,
        deviceTypes,
        devices,
        stations,
        counters,
        changeRecords,
        paperRecords,
        consumableRecords,
        currentUser,
        isInitialized: true,
        isLoading: false,
        error: null,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败')
      setState(prev => ({ ...prev, isLoading: false, isInitialized: true }))
    }
  }, [setError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    try {
      const result = await authApi.login(username, password)
      setState(prev => ({ ...prev, currentUser: result.user }))
      await loadData()
      return result.user
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
      return null
    }
  }, [loadData, setError])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
      setState(prev => ({ ...prev, currentUser: null }))
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登出失败')
    }
  }, [loadData, setError])

  const addUser = useCallback(async (user: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const newUser = await userApi.create(user)
      setState(prev => ({ ...prev, users: [...prev.users, newUser] }))
      return newUser
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加用户失败')
      throw err
    }
  }, [setError])

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      const updatedUser = await userApi.update(id, updates)
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === id ? updatedUser : u),
        currentUser: prev.currentUser?.id === id ? updatedUser : prev.currentUser,
      }))
      return updatedUser
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新用户失败')
      throw err
    }
  }, [setError])

  const deleteUser = useCallback(async (id: string) => {
    try {
      await userApi.delete(id)
      setState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== id),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除用户失败')
      throw err
    }
  }, [setError])

  const addDeviceType = useCallback(async (type: Omit<DeviceType, 'id' | 'createdAt'>) => {
    try {
      const newType = await deviceTypeApi.create(type)
      setState(prev => ({ ...prev, deviceTypes: [...prev.deviceTypes, newType] }))
      return newType
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加设备类型失败')
      throw err
    }
  }, [setError])

  const updateDeviceType = useCallback(async (id: string, updates: Partial<DeviceType>) => {
    try {
      const updatedType = await deviceTypeApi.update(id, updates)
      setState(prev => ({
        ...prev,
        deviceTypes: prev.deviceTypes.map(t => t.id === id ? updatedType : t),
      }))
      return updatedType
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新设备类型失败')
      throw err
    }
  }, [setError])

  const deleteDeviceType = useCallback(async (id: string) => {
    try {
      await deviceTypeApi.delete(id)
      setState(prev => ({
        ...prev,
        deviceTypes: prev.deviceTypes.filter(t => t.id !== id),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除设备类型失败')
      throw err
    }
  }, [setError])

  const addDevice = useCallback(async (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDevice = await deviceApi.create(device)
      setState(prev => ({ ...prev, devices: [...prev.devices, newDevice] }))
      await loadData()
      return newDevice
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加设备失败')
      throw err
    }
  }, [loadData, setError])

  const updateDevice = useCallback(async (id: string, updates: Partial<Device>) => {
    try {
      const updatedDevice = await deviceApi.update(id, updates)
      setState(prev => ({
        ...prev,
        devices: prev.devices.map(d => d.id === id ? updatedDevice : d),
      }))
      return updatedDevice
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新设备失败')
      throw err
    }
  }, [setError])

  const deleteDevice = useCallback(async (id: string) => {
    try {
      await deviceApi.delete(id)
      setState(prev => ({
        ...prev,
        devices: prev.devices.filter(d => d.id !== id),
      }))
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除设备失败')
      throw err
    }
  }, [loadData, setError])

  const moveDevice = useCallback(async (deviceId: string, toStationId: string, toCounterId?: string, reason?: string) => {
    try {
      await deviceApi.move(deviceId, toStationId, toCounterId, reason)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '移动设备失败')
      throw err
    }
  }, [loadData, setError])

  const changeDeviceStatus = useCallback(async (deviceId: string, newStatus: Device['status'], reason?: string) => {
    try {
      await deviceApi.changeStatus(deviceId, newStatus, reason)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '变更设备状态失败')
      throw err
    }
  }, [loadData, setError])

  const addStation = useCallback(async (station: Omit<Station, 'id' | 'createdAt'>) => {
    try {
      const newStation = await stationApi.create(station)
      setState(prev => ({ ...prev, stations: [...prev.stations, newStation] }))
      return newStation
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加站点失败')
      throw err
    }
  }, [setError])

  const updateStation = useCallback(async (id: string, updates: Partial<Station>) => {
    try {
      const updatedStation = await stationApi.update(id, updates)
      setState(prev => ({
        ...prev,
        stations: prev.stations.map(s => s.id === id ? updatedStation : s),
      }))
      return updatedStation
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新站点失败')
      throw err
    }
  }, [setError])

  const deleteStation = useCallback(async (id: string) => {
    try {
      await stationApi.delete(id)
      setState(prev => ({
        ...prev,
        stations: prev.stations.filter(s => s.id !== id),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除站点失败')
      throw err
    }
  }, [setError])

  const addCounter = useCallback(async (counter: Omit<Counter, 'id' | 'createdAt'>) => {
    try {
      const newCounter = await counterApi.create(counter)
      setState(prev => ({ ...prev, counters: [...prev.counters, newCounter] }))
      return newCounter
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加柜台失败')
      throw err
    }
  }, [setError])

  const updateCounter = useCallback(async (id: string, updates: Partial<Counter>) => {
    try {
      const updatedCounter = await counterApi.update(id, updates)
      setState(prev => ({
        ...prev,
        counters: prev.counters.map(c => c.id === id ? updatedCounter : c),
      }))
      return updatedCounter
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新柜台失败')
      throw err
    }
  }, [setError])

  const deleteCounter = useCallback(async (id: string) => {
    try {
      await counterApi.delete(id)
      setState(prev => ({
        ...prev,
        counters: prev.counters.filter(c => c.id !== id),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除柜台失败')
      throw err
    }
  }, [setError])

  const addPaperRecord = useCallback(async (record: Omit<PaperChangeRecord, 'id' | 'createdAt'>) => {
    try {
      const newRecord = await paperRecordApi.create(record)
      setState(prev => ({ ...prev, paperRecords: [...prev.paperRecords, newRecord] }))
      return newRecord
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加换纸记录失败')
      throw err
    }
  }, [setError])

  const addConsumableRecord = useCallback(async (record: Omit<ConsumableRecord, 'id' | 'createdAt'>) => {
    try {
      const newRecord = await consumableRecordApi.create(record)
      setState(prev => ({ ...prev, consumableRecords: [...prev.consumableRecords, newRecord] }))
      return newRecord
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加耗材记录失败')
      throw err
    }
  }, [setError])

  return {
    ...state,
    login,
    logout,
    refreshData,
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
    addConsumableRecord,
  }
}

export type Store = ReturnType<typeof useStore>