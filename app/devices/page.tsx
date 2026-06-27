'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStoreContext } from '@/lib/store-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
    variant?: 'default' | 'destructive' | 'warning'
  }>({
    open: false,
    title: '',
    onConfirm: () => {},
  })
  const [statusChangeDialog, setStatusChangeDialog] = useState({
    open: false,
    deviceId: '',
    deviceName: '',
    targetStatus: '' as DeviceStatus,
    reason: '',
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

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入设备名称')
      return
    }
    if (!formData.serialNumber.trim()) {
      toast.error('请输入设备序列号')
      return
    }
    
    try {
      if (editingDevice) {
        await updateDevice(editingDevice.id, {
          ...formData,
          stationId: formData.stationId === 'none' ? '' : formData.stationId,
        })
        toast.success('设备信息已更新')
      } else {
        await addDevice({
          ...formData,
          stationId: formData.stationId === 'none' ? '' : formData.stationId,
          position: devices.filter(d => d.stationId === (formData.stationId === 'none' ? '' : formData.stationId)).length + 1,
        })
        toast.success('设备已添加')
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: '确认删除',
      description: '确定要删除这个设备吗？此操作无法撤销。',
      onConfirm: async () => {
        try {
          await deleteDevice(id)
          toast.success('设备已删除')
          setConfirmDialog(prev => ({ ...prev, open: false }))
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '删除失败')
        }
      },
    })
  }

  const handleStatusChange = (deviceId: string, status: DeviceStatus, deviceName: string) => {
    const statusLabels: Record<DeviceStatus, string> = {
      active: '使用中',
      standby: '备机',
      damaged: '损坏',
      repair: '送修',
    }
    const needReason = status === 'damaged' || status === 'repair'
    
    if (needReason) {
      setStatusChangeDialog({
        open: true,
        deviceId,
        deviceName,
        targetStatus: status,
        reason: '',
      })
    } else {
      setConfirmDialog({
        open: true,
        title: `确认将设备设为${statusLabels[status]}`,
        description: `确定要将「${deviceName}」的状态设置为${statusLabels[status]}吗？`,
        variant: status === 'active' ? 'default' : 'warning',
        onConfirm: async () => {
          try {
            await changeDeviceStatus(deviceId, status, '手动状态变更')
            toast.success(`设备状态已更新为${statusLabels[status]}`)
            setConfirmDialog(prev => ({ ...prev, open: false }))
          } catch (err) {
            toast.error(err instanceof Error ? err.message : '操作失败')
          }
        },
      })
    }
  }

  const handleStatusChangeConfirm = async () => {
    const statusLabels: Record<DeviceStatus, string> = {
      active: '使用中',
      standby: '备机',
      damaged: '损坏',
      repair: '送修',
    }
    const { deviceId, targetStatus, reason } = statusChangeDialog
    if (targetStatus === 'damaged' || targetStatus === 'repair') {
      if (!reason.trim()) {
        toast.error('请填写变更原因')
        return
      }
    }
    try {
      await changeDeviceStatus(deviceId, targetStatus, reason || '手动状态变更')
      toast.success(`设备状态已更新为'${statusLabels[targetStatus]}`)
      setStatusChangeDialog(prev => ({ ...prev, open: false }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const selectedType = deviceTypes.find(t => t.id === formData.typeId)
  const stationCounters = counters.filter(c => c.stationId === formData.stationId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportDevices = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('========== handleImportDevices 开始 ==========')
    console.log('event:', event)
    console.log('event.target:', event.target)
    console.log('event.target.files:', event.target.files)
    
    const file = event.target.files?.[0]
    if (!file) {
      console.log('没有选择文件')
      console.log('========== handleImportDevices 结束 ==========')
      return
    }

    console.log('选择的文件:', file.name, file.type, file.size)
    
    if (!file.name.endsWith('.csv')) {
      toast.error('请选择 CSV 格式的文件')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      console.log('========== handleImportDevices 结束 ==========')
      return
    }

    console.log('开始读取文件...')
    const reader = new FileReader()
    
    reader.onerror = () => {
      console.error('文件读取失败')
      toast.error('文件读取失败，请重试')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    
    reader.onload = async (e) => {
      try {
        console.log('文件读取成功')
        const arrayBuffer = e.target?.result as ArrayBuffer
        
        let content = ''
        const encodings = ['GBK', 'GB2312', 'UTF-8']
        for (const encoding of encodings) {
          try {
            const decoder = new TextDecoder(encoding)
            content = decoder.decode(arrayBuffer)
            console.log(`尝试编码 ${encoding}:`, content.substring(0, 50))
            if (content.includes('设备名称') || content.includes('站点名称')) {
              console.log(`使用编码 ${encoding} 成功解码`)
              break
            }
          } catch {
            continue
          }
        }
        
        console.log('文件内容长度:', content?.length)
        console.log('文件内容预览:', content?.substring(0, 300))
        
        if (!content || content.trim().length === 0) {
          toast.error('文件内容为空')
          return
        }
        
        const { devices: parsedDevices, errors } = parseDevicesCSV(content, deviceTypes, stations, counters)
        console.log('解析结果:', parsedDevices.length, '设备', errors.length, '错误')
        console.log('解析的设备:', parsedDevices)
        
        if (errors.length > 0) {
          console.log('解析错误:', errors)
          toast.warning('导入警告', {
            description: errors.join('\n'),
          })
        }
        
        if (parsedDevices.length > 0) {
          console.log('准备导入设备...')
          toast.info('正在导入设备，请稍候...')
          let successCount = 0
          let skipCount = 0
          let errorCount = 0
          for (const device of parsedDevices) {
            if (devices.some(d => d.serialNumber === device.serialNumber)) {
              console.log(`设备 ${device.name} 序列号已存在，跳过`)
              skipCount++
              continue
            }
            try {
              console.log('添加设备:', device.name)
              await addDevice({
                ...device,
                position: devices.length + successCount + 1,
              })
              successCount++
              console.log('设备添加成功:', device.name)
            } catch (err) {
              console.error('添加设备失败:', err)
              if (err instanceof Error && err.message.includes('序列号已存在')) {
                skipCount++
              } else {
                errorCount++
              }
            }
          }
          
          let message = ''
          if (successCount > 0) message += `成功导入 ${successCount} 台设备`
          if (skipCount > 0) message += message ? `，${skipCount} 台已存在跳过` : `${skipCount} 台设备已存在`
          if (errorCount > 0) message += message ? `，${errorCount} 台导入失败` : `${errorCount} 台设备导入失败`
          
          if (successCount > 0) {
            toast.success(message || '导入完成')
          } else if (skipCount > 0) {
            toast.info(message)
          } else if (errorCount > 0) {
            toast.error(message)
          } else {
            toast.info('没有可导入的数据')
          }
        } else if (errors.length === 0) {
          toast.info('CSV 文件中没有有效的设备数据')
        }
      } catch (err) {
        console.error('导入处理失败:', err)
        toast.error(err instanceof Error ? err.message : '导入处理失败')
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        console.log('========== handleImportDevices 结束 ==========')
      }
    }
    
    reader.readAsArrayBuffer(file)
    console.log('已调用 readAsArrayBuffer')
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

  const handleImportClick = () => {
    console.log('导入按钮点击了')
    console.log('fileInputRef.current:', fileInputRef.current)
    // 使用延时确保 ref 已经正确关联
    setTimeout(() => {
      console.log('setTimeout 回调执行')
      if (fileInputRef.current) {
        console.log('触发文件选择对话框')
        fileInputRef.current.click()
      } else {
        console.error('fileInputRef.current 为空，无法触发文件选择')
      }
    }, 50)
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  console.log('导入 Button onClick 触发')
                  e.preventDefault()
                  e.stopPropagation()
                  handleImportClick()
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const success = exportDevicesCSV(devices, deviceTypes, stations, counters)
                if (success) {
                  toast.success('设备列表已导出')
                } else {
                  toast.error('导出失败，请重试')
                }
              }}>
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
                    {Array.isArray(selectedType?.customAttributes) && selectedType.customAttributes.map(attr => (
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
                                    <DropdownMenuItem onClick={() => handleStatusChange(device.id, 'active', device.name)}>
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                                      设为使用中
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(device.id, 'standby', device.name)}>
                                      <div className="w-2 h-2 rounded-full bg-sky-500 mr-2" />
                                      设为备机
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(device.id, 'damaged', device.name)}>
                                      <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                                      标记损坏
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(device.id, 'repair', device.name)}>
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
        confirmText="确认"
        variant={confirmDialog.variant || 'destructive'}
      />

      {/* 状态变更对话框（需填写原因） */}
      <Dialog open={statusChangeDialog.open} onOpenChange={(open) => setStatusChangeDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusChangeDialog.targetStatus === 'damaged' ? '标记设备损坏' : '设备送修'}
            </DialogTitle>
            <DialogDescription>
              请填写「{statusChangeDialog.deviceName}」状态变更的原因
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>变更原因 <span className="text-destructive">*</span></Label>
              <Textarea
                value={statusChangeDialog.reason}
                onChange={(e) => setStatusChangeDialog(prev => ({ ...prev, reason: e.target.value }))}
                placeholder={statusChangeDialog.targetStatus === 'damaged' ? '请描述设备损坏情况...' : '请描述送修原因...'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeDialog(prev => ({ ...prev, open: false }))}>
              取消
            </Button>
            <Button
              variant={statusChangeDialog.targetStatus === 'damaged' ? 'default' : 'destructive'}
              onClick={handleStatusChangeConfirm}
              disabled={!statusChangeDialog.reason.trim()}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
