'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStoreContext } from '@/lib/store-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { statusColors, stationTypeLabels, type Station, type StationType, type Counter, type Device, type DeviceStatus } from '@/lib/types'
import { exportStationsCSV, downloadStationTemplate, parseStationsCSV } from '@/lib/export'
import { Plus, MapPin, Monitor, Plane, Trash2, Edit2, Loader2, Download, Upload, FileDown, ChevronRight, ArrowLeft, Settings } from 'lucide-react'
import { toast } from 'sonner'

export default function StationsPage() {
  const router = useRouter()
  const {
    currentUser,
    isInitialized,
    stations,
    counters,
    devices,
    deviceTypes,
    addStation,
    updateStation,
    deleteStation,
    addCounter,
    deleteCounter,
    updateDevice,
    changeDeviceStatus,
  } = useStoreContext()

  const [stationDialogOpen, setStationDialogOpen] = useState(false)
  const [counterDialogOpen, setCounterDialogOpen] = useState(false)
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)
  const [editingStation, setEditingStation] = useState<Station | null>(null)
  const [selectedStationId, setSelectedStationId] = useState<string>('')
  const [selectedCounterId, setSelectedCounterId] = useState<string>('')
  
  // 下钻状态
  const [drillDownStation, setDrillDownStation] = useState<Station | null>(null)
  const [drillDownCounter, setDrillDownCounter] = useState<Counter | null>(null)

  // 处理 URL 参数，自动展开对应站点
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const stationId = urlParams.get('station')
    if (stationId && stations.length > 0) {
      const station = stations.find(s => s.id === stationId)
      if (station) {
        setDrillDownStation(station)
      }
    }
  }, [stations])
  
  const [stationForm, setStationForm] = useState({
    name: '',
    code: '',
    type: 'checkin' as StationType,
    description: '',
  })

  const [counterForm, setCounterForm] = useState({
    name: '',
    batchCount: 1, // 批量添加数量
    startNumber: 1, // 起始编号
    useBatch: false, // 是否使用批量添加
  })

  const [deviceForm, setDeviceForm] = useState({
    deviceId: '',
    status: 'active' as DeviceStatus,
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

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportStations = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const { stations: parsedStations, errors } = parseStationsCSV(content)
      
      if (errors.length > 0) {
        toast.warning('导入警告', {
          description: errors.join('\n'),
        })
      }
      
      if (parsedStations.length > 0) {
        let successCount = 0
        for (const station of parsedStations) {
          // 检查站点名称是否已存在
          if (stations.some(s => s.name === station.name || s.code === station.code)) {
            continue
          }
          addStation(station)
          successCount++
        }
        toast.success(`成功导入 ${successCount} 个站点`)
      } else if (errors.length === 0) {
        toast.info('没有可导入的数据')
      }
    }
    reader.readAsText(file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [stations, addStation])

  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push('/')
    }
  }, [isInitialized, currentUser, router])

  const handleOpenStationDialog = (station?: Station) => {
    if (station) {
      setEditingStation(station)
      setStationForm({
        name: station.name,
        code: station.code,
        type: station.type,
        description: station.description,
      })
    } else {
      setEditingStation(null)
      setStationForm({
        name: '',
        code: '',
        type: 'checkin',
        description: '',
      })
    }
    setStationDialogOpen(true)
  }

  const handleSubmitStation = () => {
    // 表单验证
    if (!stationForm.name.trim()) {
      toast.error('请输入站点名称')
      return
    }
    if (!stationForm.code.trim()) {
      toast.error('请输入站点代码')
      return
    }
    
    if (editingStation) {
      updateStation(editingStation.id, stationForm)
      toast.success('站点信息已更新')
    } else {
      addStation({
        ...stationForm,
        position: { x: stations.length % 3, y: Math.floor(stations.length / 3) },
      })
      toast.success('站点已添加')
    }
    setStationDialogOpen(false)
  }

  const handleDeleteStation = (id: string) => {
    const stationDevices = devices.filter(d => d.stationId === id)
    if (stationDevices.length > 0) {
      toast.error('请先移除该站点下的所有设备')
      return
    }
    setConfirmDialog({
      open: true,
      title: '确认删除站点',
      description: '确定要删除这个站点吗？此操作无法撤销。',
      onConfirm: () => {
        deleteStation(id)
        toast.success('站点已删除')
        if (drillDownStation?.id === id) {
          setDrillDownStation(null)
        }
      },
    })
  }

  const handleOpenCounterDialog = (stationId: string) => {
    setSelectedStationId(stationId)
    setCounterForm({ name: '', batchCount: 1, startNumber: 1, useBatch: false })
    setCounterDialogOpen(true)
  }

  const handleSubmitCounter = () => {
    // 表单验证
    if (!counterForm.name.trim()) {
      toast.error('请输入柜台名称')
      return
    }
    
    const stationCounters = counters.filter(c => c.stationId === selectedStationId)
    
    if (counterForm.useBatch) {
      // 批量添加柜台
      const count = parseInt(counterForm.batchCount.toString()) || 1
      const startNum = parseInt(counterForm.startNumber.toString()) || 1
      
      for (let i = 0; i < count; i++) {
        const currentNum = startNum + i
        addCounter({
          name: `${counterForm.name}${currentNum.toString().padStart(2, '0')}`,
          stationId: selectedStationId,
          position: stationCounters.length + 1 + i,
        })
      }
      toast.success(`成功添加 ${count} 个柜台`)
    } else {
      // 单个添加柜台
      addCounter({
        name: counterForm.name,
        stationId: selectedStationId,
        position: stationCounters.length + 1,
      })
      toast.success('柜台已添加')
    }
    
    setCounterDialogOpen(false)
  }

  const handleDeleteCounter = (counterId: string) => {
    const counterDevices = devices.filter(d => d.counterId === counterId)
    if (counterDevices.length > 0) {
      toast.error('请先移除该柜台下的所有设备')
      return
    }
    setConfirmDialog({
      open: true,
      title: '确认删除柜台',
      description: '确定要删除这个柜台吗？此操作无法撤销。',
      onConfirm: () => {
        deleteCounter(counterId)
        toast.success('柜台已删除')
        if (drillDownCounter?.id === counterId) {
          setDrillDownCounter(null)
        }
      },
    })
  }

  // 设备管理
  const handleOpenDeviceDialog = (counterId: string) => {
    setSelectedCounterId(counterId)
    setDeviceForm({ deviceId: '', status: 'active' })
    setDeviceDialogOpen(true)
  }

  const handleAddDeviceToCounter = () => {
    if (!deviceForm.deviceId || !selectedCounterId || !currentUser) return
    
    const counter = counters.find(c => c.id === selectedCounterId)
    if (!counter) return

    updateDevice(deviceForm.deviceId, {
      stationId: counter.stationId,
      counterId: selectedCounterId,
      status: 'active',
    })
    changeDeviceStatus(deviceForm.deviceId, 'active', '添加到柜台')
    toast.success('设备已添加到柜台')
    setDeviceDialogOpen(false)
  }

  const handleRemoveDeviceFromCounter = (deviceId: string) => {
    setConfirmDialog({
      open: true,
      title: '确认移除设备',
      description: '确定要将此设备从柜台移除吗？设备将被移到备机区。',
      onConfirm: () => {
        updateDevice(deviceId, { counterId: undefined })
        changeDeviceStatus(deviceId, 'standby', '从柜台移除到备机区')
        toast.success('设备已移到备机区')
      },
    })
  }

  const handleDeviceStatusChange = (deviceId: string, status: DeviceStatus) => {
    if (status !== 'active') {
      updateDevice(deviceId, { counterId: undefined })
    }
    changeDeviceStatus(deviceId, status, '手动状态变更')
  }

  const getStationIcon = (type: StationType) => {
    switch (type) {
      case 'gate':
        return <Plane className="h-5 w-5 text-sky-500" />
      case 'selfservice':
        return <Monitor className="h-5 w-5 text-emerald-500" />
      default:
        return <MapPin className="h-5 w-5 text-amber-500" />
    }
  }

  // 获取可分配到柜台的设备（备机状态的设备）
  const getAvailableDevices = () => {
    return devices.filter(d => d.status === 'standby')
  }

  const getDeviceTypeName = (typeId: string) => {
    return deviceTypes.find(t => t.id === typeId)?.name || '未知类型'
  }

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

  const isAdmin = currentUser.role === 'admin'

  // 渲染柜台详情（设备列表）
  const renderCounterDetail = () => {
    if (!drillDownCounter) return null
    
    const counterDevices = devices.filter(d => d.counterId === drillDownCounter.id)
    const station = stations.find(s => s.id === drillDownCounter.stationId)

    return (
      <Sheet open={!!drillDownCounter} onOpenChange={(open) => !open && setDrillDownCounter(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setDrillDownCounter(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <SheetTitle>{drillDownCounter.name}</SheetTitle>
                <SheetDescription>
                  {station?.name} - 设备管理
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">柜台设备 ({counterDevices.length})</h3>
              {isAdmin && (
                <Button size="sm" onClick={() => handleOpenDeviceDialog(drillDownCounter.id)}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加设备
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[calc(100vh-200px)]">
              {counterDevices.length > 0 ? (
                <div className="space-y-3">
                  {counterDevices.map(device => {
                    const status = statusColors[device.status]
                    return (
                      <Card key={device.id} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{device.name}</span>
                                <Badge className={`${status.bg} text-white text-xs`}>
                                  {status.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {getDeviceTypeName(device.typeId)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                序列号: {device.serialNumber}
                              </p>
                            </div>
                            {isAdmin && (
                              <div className="flex gap-1">
                                <Select
                                  value={device.status}
                                  onValueChange={(value) => handleDeviceStatusChange(device.id, value as DeviceStatus)}
                                >
                                  <SelectTrigger className="w-24 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">使用中</SelectItem>
                                    <SelectItem value="standby">备机</SelectItem>
                                    <SelectItem value="damaged">损坏</SelectItem>
                                    <SelectItem value="repair">送修</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleRemoveDeviceFromCounter(device.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>暂无设备</p>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleOpenDeviceDialog(drillDownCounter.id)}
                    >
                      添加设备
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // 渲染站点详情（柜台列表）
  const renderStationDetail = () => {
    if (!drillDownStation) return null
    
    const stationCounters = counters.filter(c => c.stationId === drillDownStation.id)
    const stationDevices = devices.filter(d => d.stationId === drillDownStation.id)

    return (
      <Sheet open={!!drillDownStation} onOpenChange={(open) => !open && setDrillDownStation(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setDrillDownStation(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <SheetTitle>{drillDownStation.name}</SheetTitle>
                <SheetDescription>
                  {stationTypeLabels[drillDownStation.type]} - {drillDownStation.description}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="mt-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{stationCounters.length}</div>
                  <div className="text-sm text-muted-foreground">柜台数</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{stationDevices.length}</div>
                  <div className="text-sm text-muted-foreground">设备数</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">柜台列表</h3>
              {isAdmin && (drillDownStation.type === 'checkin' || drillDownStation.type === 'gate') && (
                <Button size="sm" onClick={() => handleOpenCounterDialog(drillDownStation.id)}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加柜台
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[calc(100vh-320px)]">
              {stationCounters.length > 0 ? (
                <div className="space-y-2">
                  {stationCounters.map(counter => {
                    const counterDevices = devices.filter(d => d.counterId === counter.id)
                    const activeDevices = counterDevices.filter(d => d.status === 'active')
                    return (
                      <Card 
                        key={counter.id} 
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setDrillDownCounter(counter)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{counter.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {activeDevices.length}/{counterDevices.length} 台设备在线
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteCounter(counter.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>暂无柜台</p>
                  {isAdmin && (drillDownStation.type === 'checkin' || drillDownStation.type === 'gate') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleOpenCounterDialog(drillDownStation.id)}
                    >
                      添加柜台
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="站点管理"
          description="管理值机岛、登机口和自助服务区，点击站点或柜台可查看详情"
          actions={
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleImportStations}
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={downloadStationTemplate}>
                <FileDown className="h-4 w-4 mr-2" />
                模板
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportStationsCSV(stations, counters, devices)}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              {isAdmin && (
                <Dialog open={stationDialogOpen} onOpenChange={setStationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenStationDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加站点
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingStation ? '编辑站点' : '添加新站点'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingStation ? '修改站点信息' : '创建新的服务站点'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>站点名称</Label>
                        <Input
                          value={stationForm.name}
                          onChange={(e) => setStationForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="例如: A值机岛"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>站点代码</Label>
                        <Input
                          value={stationForm.code}
                          onChange={(e) => setStationForm(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="例如: A"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>站点类型</Label>
                        <Select
                          value={stationForm.type}
                          onValueChange={(value) => setStationForm(prev => ({ ...prev, type: value as StationType }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checkin">值机岛</SelectItem>
                            <SelectItem value="gate">登机口</SelectItem>
                            <SelectItem value="selfservice">自助服务区</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>描述</Label>
                        <Textarea
                          value={stationForm.description}
                          onChange={(e) => setStationForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="站点描述信息..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setStationDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSubmitStation}>
                        {editingStation ? '保存' : '添加'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          }
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stations.map(station => {
              const stationCounters = counters.filter(c => c.stationId === station.id)
              const stationDevices = devices.filter(d => d.stationId === station.id)
              const activeDevices = stationDevices.filter(d => d.status === 'active')

              return (
                <Card 
                  key={station.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setDrillDownStation(station)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStationIcon(station.type)}
                        <div>
                          <CardTitle className="text-base">{station.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{station.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">
                          {stationTypeLabels[station.type]}
                        </Badge>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenStationDialog(station)
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteStation(station.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{station.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">柜台: </span>
                          <span className="font-medium">{stationCounters.length}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">设备: </span>
                          <span className="font-medium">{activeDevices.length}/{stationDevices.length}</span>
                          <span className="text-muted-foreground"> 在线</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </main>
      </div>

      {/* 站点详情侧边栏 */}
      {renderStationDetail()}

      {/* 柜台详情侧边栏 */}
      {renderCounterDetail()}

      {/* 添加柜台对话框 */}
      <Dialog open={counterDialogOpen} onOpenChange={setCounterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{counterForm.useBatch ? '批量添加柜台' : '添加柜台'}</DialogTitle>
            <DialogDescription>
              {counterForm.useBatch ? '为站点批量添加多个柜台' : '为站点添加新的柜台'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="flex items-center justify-between">
                <span>柜台名称</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={counterForm.useBatch}
                    onChange={(e) => setCounterForm(prev => ({ ...prev, useBatch: e.target.checked }))}
                    className="rounded border border-primary/20 bg-background text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">批量添加</span>
                </label>
              </Label>
              <Input
                value={counterForm.name}
                onChange={(e) => setCounterForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={counterForm.useBatch ? '例如: A柜台' : '例如: A01柜台'}
              />
              {counterForm.useBatch && (
                <p className="text-xs text-muted-foreground">
                  批量模式下，柜台名称会自动添加数字后缀（如 A柜台01, A柜台02）
                </p>
              )}
            </div>
            
            {counterForm.useBatch && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>数量</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={counterForm.batchCount}
                      onChange={(e) => setCounterForm(prev => ({ ...prev, batchCount: parseInt(e.target.value) || 1 }))}
                      placeholder="添加数量"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>起始编号</Label>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={counterForm.startNumber}
                      onChange={(e) => setCounterForm(prev => ({ ...prev, startNumber: parseInt(e.target.value) || 1 }))}
                      placeholder="起始编号"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitCounter}>
              {counterForm.useBatch ? `批量添加 ${counterForm.batchCount} 个` : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加设备到柜台对话框 */}
      <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加设备到柜台</DialogTitle>
            <DialogDescription>
              从备机库中选择设备添加到柜台
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>选择设备</Label>
              <Select
                value={deviceForm.deviceId}
                onValueChange={(value) => setDeviceForm(prev => ({ ...prev, deviceId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择备机..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableDevices().length > 0 ? (
                    getAvailableDevices().map(device => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name} - {getDeviceTypeName(device.typeId)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      暂无可用备机
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeviceDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleAddDeviceToCounter}
              disabled={!deviceForm.deviceId || deviceForm.deviceId === 'none'}
            >
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 确认对话框 */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText="确认"
        variant="destructive"
      />
    </div>
  )
}
