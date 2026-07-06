'use client'

import React from 'react'
import {
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Device, DeviceType, Counter, DeviceStatus } from '@/lib/types'
import { statusColors } from '@/lib/types'

interface DeviceGroupProps {
  groupKey: string
  devices: Device[]
  deviceTypes: DeviceType[]
  counters: Counter[]
  onEdit: (device: Device) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: DeviceStatus, name: string) => void
}

export function DeviceGroup({
  groupKey,
  devices,
  deviceTypes,
  counters,
  onEdit,
  onDelete,
  onStatusChange,
}: DeviceGroupProps) {
  const isStorage = groupKey.startsWith('库房')
  const typeStats = isStorage
    ? devices.reduce((acc, device) => {
        const type = deviceTypes.find(t => t.id === device.typeId)
        const typeName = type?.name || '未知类型'
        if (!acc[typeName]) {
          acc[typeName] = 0
        }
        acc[typeName]++
        return acc
      }, {} as Record<string, number>)
    : {}

  return (
    <React.Fragment key={groupKey}>
      <TableRow className="bg-muted/50">
        <TableCell colSpan={7} className="font-semibold text-primary">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span>{groupKey}</span>
              <Badge variant="secondary" className="text-xs">
                {devices.length} 台
              </Badge>
            </div>
            {isStorage && Object.keys(typeStats).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(typeStats)
                  .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
                  .map(([typeName, count]) => (
                    <Badge
                      key={typeName}
                      variant="outline"
                      className="text-xs font-normal"
                    >
                      {typeName}: <span className="font-semibold text-rose-500 ml-1">{count}</span>
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        </TableCell>
      </TableRow>
      {devices.map(device => {
        const type = deviceTypes.find(t => t.id === device.typeId)
        const counter = counters.find(c => c.id === device.counterId)
        const status = statusColors[device.status]

        return (
          <TableRow key={device.id}>
            <TableCell className="font-medium">{device.name}</TableCell>
            <TableCell>{type?.name}</TableCell>
            <TableCell className="font-mono text-sm">{device.serialNumber}</TableCell>
            <TableCell>
              <Badge className={`${status.bg} text-white`}>
                {status.label}
              </Badge>
            </TableCell>
            <TableCell>
              {counter ? counter.name : <span className="text-muted-foreground">-</span>}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(device.updatedAt).toLocaleString('zh-CN')}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(device)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(device.id, 'active', device.name)}>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                    设为使用中
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(device.id, 'standby', device.name)}>
                    <div className="w-2 h-2 rounded-full bg-sky-500 mr-2" />
                    设为备机
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(device.id, 'damaged', device.name)}>
                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                    标记损坏
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(device.id, 'repair', device.name)}>
                    <div className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
                    送修
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(device.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )
      })}
    </React.Fragment>
  )
}