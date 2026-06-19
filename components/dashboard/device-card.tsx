'use client'

import React, { useState } from "react"
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStoreContext } from '@/lib/store-context'
import type { Device, DeviceStatus } from '@/lib/types'
import { statusColors } from '@/lib/types'
import * as LucideIcons from 'lucide-react'
import { 
  Monitor, 
  Laptop, 
  Printer, 
  Scale, 
  Scan, 
  MoreVertical,
  FileText,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

// 从 lucide-react 中获取所有图标组件
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = LucideIcons as any

interface DeviceCardProps {
  device: Device
  onStatusChange: (deviceId: string, status: DeviceStatus, reason?: string) => void
  onPaperChange?: (deviceId: string) => void
  isDraggable?: boolean
  compact?: boolean
}

export function DeviceCard({ device, onStatusChange, onPaperChange, compact = false }: DeviceCardProps) {
  const { deviceTypes } = useStoreContext()
  const deviceType = deviceTypes.find(t => t.id === device.typeId)
  const iconName = deviceType?.icon || 'Monitor'
  // 判断是否是自定义图标（base64 图片）
  const isCustomImage = iconName.startsWith('data:image/')
  // 从 lucide-react 中获取图标组件
  const LucideIcon = !isCustomImage ? (LucideIcons as any)[iconName] || Monitor : null
  const status = statusColors[device.status]

  // 自定义图标的渲染组件
  const IconDisplay = () => {
    if (isCustomImage) {
      return <img src={iconName} alt={deviceType?.name} className={`object-contain ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
    }
    const Icon = LucideIcon
    return <Icon className={`${status.text} ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
  }

  // 损坏原因对话框状态
  const [damageDialogOpen, setDamageDialogOpen] = useState(false)
  const [damageReason, setDamageReason] = useState('')

  const isCUSS = deviceType?.name.includes('CUSS')

  const handleMarkDamaged = () => {
    setDamageDialogOpen(true)
  }

  const handleConfirmDamage = () => {
    const reason = damageReason || '未说明原因'
    onStatusChange(device.id, 'damaged', reason)
    setDamageDialogOpen(false)
    setDamageReason('')
  }

  if (compact) {
    return (
      <>
        <div className="flex items-center justify-between rounded-lg bg-background/50 p-2 border border-border/50">
          <div className="flex items-center gap-2">
            <div className={`rounded p-1.5 ${status.bg}/20`}>
              <IconDisplay />
            </div>
            <div>
              <p className="text-sm font-medium">{device.name}</p>
              <p className="text-xs text-muted-foreground">{device.serialNumber}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {device.status === 'active' && (
                <DropdownMenuItem onClick={() => onStatusChange(device.id, 'standby')}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  恢复为备机
                </DropdownMenuItem>
              )}
              {(device.status === 'active' || device.status === 'standby') && (
                <DropdownMenuItem onClick={handleMarkDamaged}>
                  <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                  标记损坏
                </DropdownMenuItem>
              )}
              {device.status === 'damaged' && (
                <DropdownMenuItem onClick={() => onStatusChange(device.id, 'repair')}>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  送修
                </DropdownMenuItem>
              )}
              {device.status === 'repair' && (
                <DropdownMenuItem onClick={() => onStatusChange(device.id, 'standby')}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  修复完成
                </DropdownMenuItem>
              )}
              {isCUSS && onPaperChange && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onPaperChange(device.id)}>
                    <FileText className="h-4 w-4 mr-2" />
                    记录换纸
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* 损坏原因输入对话框 */}
        <Dialog open={damageDialogOpen} onOpenChange={setDamageDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>标记损坏</DialogTitle>
              <DialogDescription>
                请输入设备损坏的原因
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="damage-reason">损坏原因</Label>
                <Input
                  id="damage-reason"
                  value={damageReason}
                  onChange={(e) => setDamageReason(e.target.value)}
                  placeholder="例如：屏幕碎裂、无法开机、卡纸..."
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDamageDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleConfirmDamage}>
                确认标记
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Card className="group relative border-border/50 transition-all hover:shadow-md bg-background">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className={`rounded-lg p-2 ${status.bg}/20`}>
            <IconDisplay />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{device.name}</span>
              <Badge 
                variant="secondary" 
                className={`text-xs ${status.bg} text-white`}
              >
                {status.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {deviceType?.name} / {device.serialNumber}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {device.status === 'active' && (
                <>
                  <DropdownMenuItem onClick={() => onStatusChange(device.id, 'standby')}>
                    <div className="w-2 h-2 rounded-full bg-sky-500 mr-2" />
                    下架到备机区
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMarkDamaged}>
                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                    标记损坏
                  </DropdownMenuItem>
                </>
              )}
              {device.status === 'damaged' && (
                <DropdownMenuItem onClick={() => onStatusChange(device.id, 'repair')}>
                  <div className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
                  送修
                </DropdownMenuItem>
              )}
              {device.status === 'repair' && (
                <DropdownMenuItem onClick={() => onStatusChange(device.id, 'standby')}>
                  <div className="w-2 h-2 rounded-full bg-sky-500 mr-2" />
                  修复完成，移到备机区
                </DropdownMenuItem>
              )}
              {device.status === 'standby' && (
                <DropdownMenuItem onClick={handleMarkDamaged}>
                  <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                  标记损坏
                </DropdownMenuItem>
              )}
              {isCUSS && onPaperChange && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onPaperChange(device.id)}>
                    <FileText className="h-4 w-4 mr-2" />
                    记录换纸
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      {/* 损坏原因输入对话框 */}
      <Dialog open={damageDialogOpen} onOpenChange={setDamageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>标记损坏</DialogTitle>
            <DialogDescription>
              请输入设备损坏的原因
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>损坏原因</Label>
              <Input
                value={damageReason}
                onChange={(e) => setDamageReason(e.target.value)}
                placeholder="例如：屏幕碎裂、无法开机、卡纸..."
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                不填写则默认为"未说明原因"
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDamageDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmDamage}>
              确认标记
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
