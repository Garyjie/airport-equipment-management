'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStoreContext } from '@/lib/store-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { statusColors, type Device, type DeviceStatus } from '@/lib/types'
import { exportDevicesCSV, downloadDeviceTemplate, parseDevicesCSV } from '@/lib/export'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, Download, Upload, FileDown } from 'lucide-react'
import { useRef, useCallback } from 'react'
import { toast } from 'sonner'

export default function DevicesPage() {
  const router = useRouter()
  const {
    currentUser,
    isInitialized,
    devices,
    deviceTypes,
    stations,
    counters,
    addDevice,
    updateDevice,
    deleteDevice,
    changeDeviceStatus,
  } = useStoreContext()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    typeId: deviceTypes[0]?.id || 'defaultTypeId',
    serialNumber: '',
    stationId: '', // 默认为空，表示设备在库房
    counterId: '',
    status: 'standby' as DeviceStatus,
    customData: {} as Record<string, unknown>,
  })
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description?: string
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    onConfirm: () => {},
  })

  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push('/')
    }
  }, [isInitialized, currentUser, router])

  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.name.toLowerCase().includes(search.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter
    const matchesType = typeFilter === 'all' || device.typeId === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // 按站点分组设备，库房按状态分子分组
  const groupedDevices = filteredDevices.reduce((acc, device) => {
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

  // 排序分组：站点在前，库房各区在后
  const sortedGroupKeys = Object.keys(groupedDevices).sort((a, b) => {
    const aIsStorage = a.startsWith('库房')
    const bIsStorage = b.startsWith('库房')
    if (aIsStorage && !bIsStorage) return 1
    if (!aIsStorage && bIsStorage) return -1
    // 库房内部排序：备机区 -> 损坏区 -> 送修区
    if (aIsStorage && bIsStorage) {
      const order = ['库房（备机区）', '库房（损坏区）', '库房（送修区）']
      return order.indexOf(a) - order.indexOf(b)
    }
    return a.localeCompare(b, 'zh-CN')
  })

  // 统计各库房区域的设备类型
  const storageStats = filteredDevices
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
    }, {} as Record<string, { typeName: string; status: Device['status']; count: number }>)

  const handleOpenDialog = (device?: Device) => {
    if (device) {
      setEditingDevice(device)
      setFormData({
        name: device.name,
        typeId: device.typeId,
        serialNumber: device.serialNumber,
        stationId: device.stationId || 'none', // 空站点显示为"库房"
        counterId: device.counterId || '',
        status: device.status,
        customData: device.customData,
      })
    } else {
      setEditingDevice(null)
      setFormData({
        name: '',
        typeId: deviceTypes[0]?.id || 'defaultTypeId',
        serialNumber: '',
        stationId: 'none', // 默认为空，表示设备在库房
        counterId: '',
        status: 'standby',
        customData: {},
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    // 表单验证
    if (!formData.name.trim()) {
      toast.error('请输入设备名称')
      return
    }
    if (!formData.serialNumber.trim()) {
      toast.error('请输入设备序列号')
      return
    }
    
    if (editingDevice) {
      updateDevice(editingDevice.id, {
        ...formData,
        stationId: formData.stationId === 'none' ? '' : formData.stationId,
      })
      toast.success('设备信息已更新')
    } else {
      addDevice({
        ...formData,
        stationId: formData.stationId === 'none' ? '' : formData.stationId,
        position: devices.filter(d => d.stationId === (formData.stationId === 'none' ? '' : formData.stationId)).length + 1,
      })
      toast.success('设备已添加')
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: '确认删除',
      description: '确定要删除这个设备吗？此操作无法撤销。',
      onConfirm: () => {
        deleteDevice(id)
        toast.success('设备已删除')
      },
    })
  }

  const handleStatusChange = (deviceId: string, status: DeviceStatus) => {
    changeDeviceStatus(deviceId, status, '手动状态变更')
  }

  const selectedType = deviceTypes.find(t => t.id === formData.typeId)
  const stationCounters = counters.filter(c => c.stationId === formData.stationId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportDevices = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const { devices: parsedDevices, errors } = parseDevicesCSV(content, deviceTypes, stations, counters)
      
      if (errors.length > 0) {
        toast.warning(`导入警告`, {
          description: errors.join('\n'),
        })
      }
      
      if (parsedDevices.length > 0) {
        let successCount = 0
        for (const device of parsedDevices) {
          addDevice({
            ...device,
            position: devices.length + successCount + 1,
          })
          successCount++
        }
        toast.success(`成功导入 ${successCount} 台设备`)
      } else if (errors.length === 0) {
        toast.info('没有可导入的数据')
      }
    }
    reader.readAsText(file)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [deviceTypes, stations, counters, devices, addDevice])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="设备管理"
          description="管理所有机场设备的状态和信息"
          actions={
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleImportDevices}
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={downloadDeviceTemplate}>
                <FileDown className="h-4 w-4 mr-2" />
                模板
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportDevicesCSV(devices, deviceTypes, stations, counters)}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加设备
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingDevice ? '编辑设备' : '添加新设备'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingDevice ? '修改设备信息' : '填写设备基本信息'}
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
                            // 非使用中状态自动清除柜台绑定
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
                    {selectedType?.customAttributes.map(attr => (
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
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingDevice ? '保存' : '添加'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索设备名称或序列号..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">使用中</SelectItem>
                  <SelectItem value="standby">备机</SelectItem>
                  <SelectItem value="damaged">损坏</SelectItem>
                  <SelectItem value="repair">送修</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="类型筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {deviceTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
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
                  {filteredDevices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        暂无设备数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedGroupKeys.map(groupKey => {
                      const isStorage = groupKey.startsWith('库房')
                      // 库房分组下按设备类型统计
                      const typeStats = isStorage
                        ? groupedDevices[groupKey].reduce((acc, device) => {
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
                        {/* 分组标题行 */}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={7} className="font-semibold text-primary">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span>{groupKey}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {groupedDevices[groupKey].length} 台
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
                        {/* 该分组下的设备 */}
                        {groupedDevices[groupKey].map(device => {
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
                                    <DropdownMenuItem onClick={() => handleOpenDialog(device)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      编辑
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(device.id, 'active')}>
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                                      设为使用中
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(device.id, 'standby')}>
                                      <div className="w-2 h-2 rounded-full bg-sky-500 mr-2" />
                                      设为备机
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(device.id, 'damaged')}>
                                      <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                                      标记损坏
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(device.id, 'repair')}>
                                      <div className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
                                      送修
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleDelete(device.id)}
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
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
      
      {/* 确认对话框 */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText="确认删除"
        variant="destructive"
      />
    </div>
  )
}
