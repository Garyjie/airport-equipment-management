import { useMemo } from 'react'
import type { Device, DeviceStatus } from '@/lib/types'

export interface DeviceFilters {
  search: string
  statusFilter: string
  typeFilter: string
}

export function useDeviceFilters(devices: Device[], filters: DeviceFilters) {
  return useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = 
        device.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        device.serialNumber.toLowerCase().includes(filters.search.toLowerCase())
      const matchesStatus = filters.statusFilter === 'all' || device.status === filters.statusFilter
      const matchesType = filters.typeFilter === 'all' || device.typeId === filters.typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [devices, filters])
}

export function useStorageStats(devices: Device[], deviceTypes: { id: string; name: string }[]) {
  return useMemo(() => {
    return devices
      .filter(d => d.status === 'standby' || d.status === 'damaged' || d.status === 'repair' || !d.stationId)
      .reduce((acc, device) => {
        const type = deviceTypes.find(t => t.id === device.typeId)
        const typeName = type?.name || '未知类型'
        const key = `${device.status}_${typeName}`
        if (!acc[key]) {
          acc[key] = { typeName, status: device.status, count: 0 }
        }
        acc[key].count++
        return acc
      }, {} as Record<string, { typeName: string; status: DeviceStatus; count: number }>)
  }, [devices, deviceTypes])
}