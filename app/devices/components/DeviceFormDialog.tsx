'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Device, DeviceType, DeviceStatus, Station, Counter, CustomAttribute } from '@/lib/types'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

export interface DeviceFormData {
  name: string
  typeId: string
  serialNumber: string
  stationId: string
  counterId: string
  status: DeviceStatus
  customData: Record<string, unknown>
}

interface DeviceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device | null
  deviceTypes: DeviceType[]
  stations: Station[]
  counters: Counter[]
  onSubmit: (data: DeviceFormData) => Promise<void>
}

export function DeviceFormDialog({
  open,
  onOpenChange,
  device,
  deviceTypes,
  stations,
  counters,
  onSubmit,
}: DeviceFormDialogProps) {
  const [formData, setFormData] = useState<DeviceFormData>({
    name: device?.name || '',
    typeId: device?.typeId || deviceTypes[0]?.id || '',
    serialNumber: device?.serialNumber || '',
    stationId: device?.stationId || 'none',
    counterId: device?.counterId || '',
    status: device?.status || 'standby',
    customData: device?.customData || {},
  })

  const selectedType = deviceTypes.find(t => t.id === formData.typeId)
  const customAttributes = useMemo<CustomAttribute[]>(() => {
    if (!selectedType?.customAttributes) return []
    if (Array.isArray(selectedType.customAttributes)) return selectedType.customAttributes
    try {
      return JSON.parse(selectedType.customAttributes as string)
    } catch {
      return []
    }
  }, [selectedType])
  const stationCounters = counters.filter(c => c.stationId === formData.stationId)

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入设备名称')
      return
    }
    if (!formData.serialNumber.trim()) {
      toast.error('请输入设备序列号')
      return
    }

    await onSubmit(formData)
    onOpenChange(false)
  }

  const handleReset = () => {
    setFormData({
      name: device?.name || '',
      typeId: device?.typeId || deviceTypes[0]?.id || '',
      serialNumber: device?.serialNumber || '',
      stationId: device?.stationId || 'none',
      counterId: device?.counterId || '',
      status: device?.status || 'standby',
      customData: device?.customData || {},
    })
  }

  React.useEffect(() => {
    if (open) {
      handleReset()
    }
  }, [open, device, deviceTypes])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={handleReset}>
          <Plus className="h-4 w-4 mr-2" />
          添加设备
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {device ? '编辑设备' : '添加新设备'}
          </DialogTitle>
          <DialogDescription>
            {device ? '修改设备信息' : '填写设备基本信息'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid gap-2">
            <Label>设备名称</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如: CUSS-A01"
            />
          </div>
          <div className="grid gap-2">
            <Label>设备类型</Label>
            <Select
              value={formData.typeId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, typeId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择设备类型" />
              </SelectTrigger>
              <SelectContent>
                {deviceTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>序列号</Label>
            <Input
              value={formData.serialNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
              placeholder="设备序列号"
            />
          </div>
          <div className="grid gap-2">
            <Label>所属站点</Label>
            <Select
              value={formData.stationId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, stationId: value, counterId: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择站点" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">库房（备机区）</SelectItem>
                {stations.map(station => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              选择"库房"表示设备在备机区，未部署到任何站点
            </p>
          </div>
          {stationCounters.length > 0 && formData.status === 'active' && (
            <div className="grid gap-2">
              <Label>所属柜台（仅使用中设备可绑定）</Label>
              <Select
                value={formData.counterId}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  counterId: value === 'none' ? '' : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择柜台" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不绑定柜台（存放站点）</SelectItem>
                  {stationCounters.map(counter => (
                    <SelectItem key={counter.id} value={counter.id}>
                      {counter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-2">
            <Label>状态</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => {
                const newStatus = value as DeviceStatus
                setFormData(prev => ({ 
                  ...prev, 
                  status: newStatus,
                  counterId: newStatus !== 'active' ? '' : prev.counterId
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">使用中</SelectItem>
                <SelectItem value="standby">备机</SelectItem>
                <SelectItem value="damaged">损坏</SelectItem>
                <SelectItem value="repair">送修</SelectItem>
              </SelectContent>
            </Select>
            {formData.status !== 'active' && (
              <p className="text-xs text-muted-foreground">
                非使用中状态的设备不能绑定柜台
              </p>
            )}
          </div>
          {customAttributes.length > 0 && customAttributes.map(attr => (
            <div key={attr.id} className="grid gap-2">
              <Label>
                {attr.name}
                {attr.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {attr.type === 'select' ? (
                <Select
                  value={String(formData.customData[attr.name] || 'none')}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    customData: { ...prev.customData, [attr.name]: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`选择${attr.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {attr.options?.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={attr.type === 'number' ? 'number' : attr.type === 'date' ? 'date' : 'text'}
                  value={String(formData.customData[attr.name] || '')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customData: { ...prev.customData, [attr.name]: e.target.value }
                  }))}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            {device ? '保存' : '添加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}