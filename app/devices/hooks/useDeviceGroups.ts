import { useMemo } from 'react'
import type { Device, Station } from '@/lib/types'

export function useDeviceGroups(devices: Device[], stations: Station[]) {
  const groupedDevices = useMemo(() => {
    return devices.reduce((acc, device) => {
      const station = stations.find(s => s.id === device.stationId)
      let key: string
      if (device.status === 'damaged') {
        key = '库房（损坏区）'
      } else if (device.status === 'repair') {
        key = '库房（送修区）'
      } else if (device.status === 'standby' || !device.stationId) {
        key = '库房（备机区）'
      } else {
        key = station?.name || '未分配'
      }
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(device)
      return acc
    }, {} as Record<string, Device[]>)
  }, [devices, stations])

  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedDevices).sort((a, b) => {
      const aIsStorage = a.startsWith('库房')
      const bIsStorage = b.startsWith('库房')
      if (aIsStorage && !bIsStorage) return 1
      if (!aIsStorage && bIsStorage) return -1
      if (aIsStorage && bIsStorage) {
        const order = ['库房（备机区）', '库房（损坏区）', '库房（送修区）']
        return order.indexOf(a) - order.indexOf(b)
      }
      return a.localeCompare(b, 'zh-CN')
    })
  }, [groupedDevices])

  return { groupedDevices, sortedGroupKeys }
}