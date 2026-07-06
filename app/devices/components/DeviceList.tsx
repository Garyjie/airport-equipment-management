'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Device, DeviceType, Counter, DeviceStatus } from '@/lib/types'
import { DeviceGroup } from './DeviceGroup'

interface DeviceListProps {
  groupedDevices: Record<string, Device[]>
  sortedGroupKeys: string[]
  deviceTypes: DeviceType[]
  counters: Counter[]
  onEdit: (device: Device) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: DeviceStatus, name: string) => void
}

export function DeviceList({
  groupedDevices,
  sortedGroupKeys,
  deviceTypes,
  counters,
  onEdit,
  onDelete,
  onStatusChange,
}: DeviceListProps) {
  const totalDevices = Object.values(groupedDevices).reduce((sum, devices) => sum + devices.length, 0)

  if (totalDevices === 0) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>设备名称</TableHead>
              <TableHead>设备类型</TableHead>
              <TableHead>序列号</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>所属柜台</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                暂无设备数据
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>设备名称</TableHead>
            <TableHead>设备类型</TableHead>
            <TableHead>序列号</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>所属柜台</TableHead>
            <TableHead>更新时间</TableHead>
            <TableHead className="w-[80px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedGroupKeys.map(groupKey => (
            <DeviceGroup
              key={groupKey}
              groupKey={groupKey}
              devices={groupedDevices[groupKey]}
              deviceTypes={deviceTypes}
              counters={counters}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}