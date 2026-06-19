'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useStoreContext } from '@/lib/store-context'
import { statusColors, type Device, type DeviceStatus, type DeviceChangeRecord, generateId } from '@/lib/types'
import { DeviceCard } from './device-card'
import { MapPin, Monitor, Plane, AlertTriangle, Wrench, Package, Plus, Search, Check } from 'lucide-react'

export function StationView() {
  const router = useRouter()
  const {
    stations,
    counters,
    devices,
    deviceTypes,
    currentUser,
    moveDevice,
    changeDeviceStatus,
    addPaperRecord,
    updateDevice,
    addChangeRecord,
  } = useStoreContext()

  const [paperDialogOpen, setPaperDialogOpen] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [paperForm, setPaperForm] = useState({
    paperType: '热敏纸',
    quantity: 1,
    notes: '',
  })

  // 设备选择对话框状态
  const [selectDeviceDialog, setSelectDeviceDialog] = useState<{
    open: boolean
    stationId: string
    counterId?: string
    searchQuery: string
    selectedDeviceId: string | null
  }>({
    open: false,
    stationId: '',
    counterId: undefined,
    searchQuery: '',
    selectedDeviceId: null,
  })

  // 站点详情弹窗状态
  const [stationDetailOpen, setStationDetailOpen] = useState(false)
  const [viewingStationId, setViewingStationId] = useState<string>('')

  // 替换确认对话框状态
  const [replaceDialog, setReplaceDialog] = useState<{
    open: boolean
    standbyDeviceId: string
    targetStationId: string
    targetCounterId?: string
    existingDeviceId?: string
  }>({
    open: false,
    standbyDeviceId: '',
    targetStationId: '',
    targetCounterId: undefined,
    existingDeviceId: undefined,
  })

  const checkinStations = stations.filter(s => s.type === 'checkin')
  const gateStations = stations.filter(s => s.type === 'gate')
  const selfserviceStations = stations.filter(s => s.type === 'selfservice')

  // 获取不同状态的设备
  const standbyDevices = devices.filter(d => d.status === 'standby')
  const damagedDevices = devices.filter(d => d.status === 'damaged')
  const repairDevices = devices.filter(d => d.status === 'repair')

  // 过滤后的备机列表（根据搜索）
  const filteredStandbyDevices = useMemo(() => {
    if (!selectDeviceDialog.searchQuery.trim()) {
      return standbyDevices
    }
    const query = selectDeviceDialog.searchQuery.toLowerCase()
    return standbyDevices.filter(device => {
      const type = deviceTypes.find(t => t.id === device.typeId)
      return (
        device.name.toLowerCase().includes(query) ||
        device.serialNumber?.toLowerCase().includes(query) ||
        type?.name.toLowerCase().includes(query)
      )
    })
  }, [standbyDevices, selectDeviceDialog.searchQuery, deviceTypes])

  // 打开设备选择对话框
  const openSelectDeviceDialog = (stationId: string, counterId?: string) => {
    setSelectDeviceDialog({
      open: true,
      stationId,
      counterId,
      searchQuery: '',
      selectedDeviceId: null,
    })
  }

  // 确认选择设备
  const handleConfirmSelectDevice = () => {
    const { stationId, counterId, selectedDeviceId: deviceId } = selectDeviceDialog
    if (!deviceId || !currentUser) return

    const device = devices.find(d => d.id === deviceId)
    if (!device || device.status !== 'standby') return

    // 检查目标位置是否已有同类型设备
    const existingDevice = devices.find(d => 
      d.stationId === stationId && 
      d.counterId === counterId && 
      d.typeId === device.typeId &&
      d.status === 'active'
    )

    if (existingDevice) {
      // 关闭选择对话框，显示替换确认对话框
      setSelectDeviceDialog(prev => ({ ...prev, open: false }))
      setReplaceDialog({
        open: true,
        standbyDeviceId: deviceId,
        targetStationId: stationId,
        targetCounterId: counterId,
        existingDeviceId: existingDevice.id,
      })
    } else {
      // 直接安装到柜台
      installDeviceToCounter(deviceId, stationId, counterId)
      setSelectDeviceDialog(prev => ({ ...prev, open: false }))
    }
  }

  // 安装设备到柜台
  const installDeviceToCounter = (deviceId: string, stationId: string, counterId?: string) => {
    if (!currentUser) return
    
    // 先更新设备位置和状态（使用 updateDevice 确保一次性完成）
    updateDevice(deviceId, {
      stationId,
      counterId,
      status: 'active',
    })
    
    // 创建变更记录
    const device = devices.find(d => d.id === deviceId)
    if (device) {
      const record: DeviceChangeRecord = {
        id: generateId(),
        deviceId,
        fromStationId: device.stationId || undefined,
        toStationId: stationId,
        fromCounterId: device.counterId || undefined,
        toCounterId: counterId,
        fromStatus: device.status,
        toStatus: 'active',
        reason: '安装到柜台',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        createdAt: new Date().toISOString(),
      }
      addChangeRecord(record)
    }
  }

  // 执行替换操作
  const handleConfirmReplace = () => {
    if (!currentUser) return

    const { standbyDeviceId, targetStationId, targetCounterId, existingDeviceId } = replaceDialog

    if (existingDeviceId) {
      // 将现有设备下架到备机区，创建变更记录
      changeDeviceStatus(existingDeviceId, 'standby', '被替换下架')
    }

    // 安装新设备
    installDeviceToCounter(standbyDeviceId, targetStationId, targetCounterId)

    setReplaceDialog({ open: false, standbyDeviceId: '', targetStationId: '', targetCounterId: undefined, existingDeviceId: undefined })
  }

  // 设备状态变更处理
  const handleStatusChange = (deviceId: string, status: DeviceStatus, reason?: string) => {
    if (!currentUser) return
    
    // 使用 changeDeviceStatus 函数，它会记录变更记录并处理状态变更逻辑
    changeDeviceStatus(deviceId, status, reason)
  }

  // 换纸记录
  const handlePaperChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    setPaperDialogOpen(true)
  }

  const handlePaperSubmit = () => {
    if (!selectedDeviceId || !currentUser) return
    addPaperRecord({
      deviceId: selectedDeviceId,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      ...paperForm,
    })
    setPaperDialogOpen(false)
    setPaperForm({ paperType: '热敏纸', quantity: 1, notes: '' })
  }

  // 只获取使用中的设备（在柜台里的）
  const getActiveCounterDevices = (stationId: string, counterId?: string) => {
    return devices.filter(d => {
      if (counterId) {
        return d.stationId === stationId && d.counterId === counterId && d.status === 'active'
      }
      return d.stationId === stationId && !d.counterId && d.status === 'active'
    })
  }

  const renderStation = (station: typeof stations[0]) => {
    const stationCounters = counters.filter(c => c.stationId === station.id)
    const stationActiveDevices = devices.filter(d => d.stationId === station.id && d.status === 'active')
    const totalStationDevices = devices.filter(d => d.stationId === station.id)

    return (
      <Card key={station.id} className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {station.type === 'gate' ? (
                <Plane className="h-5 w-5 text-sky-500" />
              ) : station.type === 'selfservice' ? (
                <Monitor className="h-5 w-5 text-emerald-500" />
              ) : (
                <MapPin className="h-5 w-5 text-amber-500" />
              )}
              <CardTitle className="text-base">{station.name}</CardTitle>
            </div>
            <Badge variant="outline">
              {stationActiveDevices.length}/{totalStationDevices.length} 在线
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{station.description}</p>
        </CardHeader>
        <CardContent>
          {stationCounters.length > 0 ? (
            <div className="space-y-4">
              {/* 只显示第一个柜台 */}
              {(() => {
                const firstCounter = stationCounters[0]
                const counterDevices = getActiveCounterDevices(station.id, firstCounter.id)
                return (
                  <div key={firstCounter.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">{firstCounter.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {counterDevices.length} 台设备
                        </Badge>
                        {standbyDevices.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => openSelectDeviceDialog(station.id, firstCounter.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            添加设备
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      {counterDevices.length > 0 ? (
                        counterDevices.map(device => (
                          <DeviceCard
                            key={device.id}
                            device={device}
                            onStatusChange={handleStatusChange}
                            onPaperChange={handlePaperChange}
                            isDraggable={false}
                          />
                        ))
                      ) : (
                        <div 
                          className="text-center py-6 border-2 border-dashed border-muted-foreground/20 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                          onClick={() => openSelectDeviceDialog(station.id, firstCounter.id)}
                        >
                          <Plus className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            点击从备机区添加设备
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
              
              {/* 如果有更多柜台，显示"更多"按钮 */}
              {stationCounters.length > 1 && (
                <div className="text-center py-3 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setViewingStationId(station.id)
                      setStationDetailOpen(true)
                    }}
                  >
                    <Search className="h-4 w-4 mr-1" />
                    更多 {stationCounters.length - 1} 个柜台
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                {standbyDevices.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => openSelectDeviceDialog(station.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    添加设备
                  </Button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {getActiveCounterDevices(station.id).length > 0 ? (
                  getActiveCounterDevices(station.id).map(device => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      onStatusChange={handleStatusChange}
                      onPaperChange={handlePaperChange}
                      isDraggable={false}
                    />
                  ))
                ) : (
                  <div 
                    className="text-center py-6 border-2 border-dashed border-muted-foreground/20 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors col-span-2"
                    onClick={() => openSelectDeviceDialog(station.id)}
                  >
                    <Plus className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      点击从备机区添加设备
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const selectedDevice = devices.find(d => d.id === selectedDeviceId)
  const replaceStandbyDevice = devices.find(d => d.id === replaceDialog.standbyDeviceId)
  const replaceExistingDevice = devices.find(d => d.id === replaceDialog.existingDeviceId)

  return (
    <div className="space-y-6">
      {/* 站点设备分布 - 只显示使用中的设备 */}
      <Tabs defaultValue="checkin" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="checkin">
            值机岛 ({checkinStations.length})
          </TabsTrigger>
          <TabsTrigger value="gate">
            登机口 ({gateStations.length})
          </TabsTrigger>
          <TabsTrigger value="selfservice">
            自助服务 ({selfserviceStations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2">
            {checkinStations.map(renderStation)}
          </div>
        </TabsContent>

        <TabsContent value="gate" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2">
            {gateStations.map(renderStation)}
          </div>
        </TabsContent>

        <TabsContent value="selfservice" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2">
            {selfserviceStations.map(renderStation)}
          </div>
        </TabsContent>
      </Tabs>

      {/* 设备库区域 - 备机/损坏/送修 */}
      <div className="border-t border-border/50 pt-6">
        <h3 className="text-lg font-semibold mb-4">设备库</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {/* 备机区 */}
          <Card className="border-sky-500/30 bg-sky-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-sky-500" />
                <CardTitle className="text-base">备机区</CardTitle>
                <Badge variant="secondary">{standbyDevices.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">待命设备，可安装到柜台使用</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {standbyDevices.length > 0 ? (
                  standbyDevices.map(device => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      onStatusChange={handleStatusChange}
                      onPaperChange={handlePaperChange}
                      isDraggable={false}
                      compact
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暂无备机
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 损坏区 */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">损坏区</CardTitle>
                <Badge variant="secondary">{damagedDevices.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">设备损坏待维修</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {damagedDevices.length > 0 ? (
                  damagedDevices.map(device => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      onStatusChange={handleStatusChange}
                      onPaperChange={handlePaperChange}
                      isDraggable={false}
                      compact
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暂无损坏设备
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 送修区 */}
          <Card className="border-rose-500/30 bg-rose-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-rose-500" />
                <CardTitle className="text-base">送修区</CardTitle>
                <Badge variant="secondary">{repairDevices.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">设备已送外部维修</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {repairDevices.length > 0 ? (
                  repairDevices.map(device => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      onStatusChange={handleStatusChange}
                      onPaperChange={handlePaperChange}
                      isDraggable={false}
                      compact
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暂无送修设备
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 选择备机设备对话框 */}
      <Dialog 
        open={selectDeviceDialog.open} 
        onOpenChange={(open) => setSelectDeviceDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>选择备机设备</DialogTitle>
            <DialogDescription>
              从备机区选择设备安装到柜台
            </DialogDescription>
          </DialogHeader>
          
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索设备名称、序列号或类型..."
              value={selectDeviceDialog.searchQuery}
              onChange={(e) => setSelectDeviceDialog(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-9"
            />
          </div>

          {/* 设备列表 */}
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredStandbyDevices.length > 0 ? (
                filteredStandbyDevices.map(device => {
                  const type = deviceTypes.find(t => t.id === device.typeId)
                  const isSelected = selectDeviceDialog.selectedDeviceId === device.id
                  return (
                    <div
                      key={device.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectDeviceDialog(prev => ({ ...prev, selectedDeviceId: device.id }))}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {isSelected ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Monitor className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{device.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {type?.name} / {device.serialNumber}
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${statusColors.standby}20`,
                          color: statusColors.standby 
                        }}
                      >
                        备机
                      </Badge>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectDeviceDialog.searchQuery ? '没有找到匹配的设备' : '暂无可用备机'}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectDeviceDialog(prev => ({ ...prev, open: false }))}
            >
              取消
            </Button>
            <Button 
              onClick={handleConfirmSelectDevice}
              disabled={!selectDeviceDialog.selectedDeviceId}
            >
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 换纸记录对话框 */}
      <Dialog open={paperDialogOpen} onOpenChange={setPaperDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>记录换纸</DialogTitle>
            <DialogDescription>
              为 {selectedDevice?.name} 记录换纸操作
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="paperType">纸张类型</Label>
              <Select
                value={paperForm.paperType}
                onValueChange={(value) => setPaperForm(prev => ({ ...prev, paperType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="热敏纸">热敏纸</SelectItem>
                  <SelectItem value="普通纸">普通纸</SelectItem>
                  <SelectItem value="标签纸">标签纸</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">数量(卷)</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={paperForm.quantity}
                onChange={(e) => setPaperForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={paperForm.notes}
                onChange={(e) => setPaperForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="输入备注信息..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaperDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handlePaperSubmit}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 替换确认对话框 */}
      <AlertDialog open={replaceDialog.open} onOpenChange={(open) => !open && setReplaceDialog(prev => ({ ...prev, open: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认替换设备</AlertDialogTitle>
            <AlertDialogDescription>
              该位置已有同类型设备 <strong>{replaceExistingDevice?.name}</strong>，
              是否用备机 <strong>{replaceStandbyDevice?.name}</strong> 替换？
              <br /><br />
              替换后，原设备将被下架到备机区。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>
              确认替换
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 站点详情弹窗 */}
      <Dialog open={stationDetailOpen} onOpenChange={setStationDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {stations.find(s => s.id === viewingStationId)?.name || '站点详情'} - 柜台列表
            </DialogTitle>
            <DialogDescription>
              查看该站点所有柜台及设备状态
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 mt-4">
              {(() => {
                const station = stations.find(s => s.id === viewingStationId)
                if (!station) return <p className="text-center text-muted-foreground">未找到站点</p>
                
                const stationCounters = counters.filter(c => c.stationId === viewingStationId)
                
                return stationCounters.map(counter => {
                  const counterDevices = getActiveCounterDevices(station.id, counter.id)
                  return (
                    <div key={counter.id} className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-base font-medium">{counter.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {counterDevices.length} 台设备
                          </Badge>
                          {standbyDevices.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                openSelectDeviceDialog(station.id, counter.id)
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              添加设备
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        {counterDevices.length > 0 ? (
                          counterDevices.map(device => (
                            <DeviceCard
                              key={device.id}
                              device={device}
                              onStatusChange={handleStatusChange}
                              onPaperChange={handlePaperChange}
                              isDraggable={false}
                            />
                          ))
                        ) : (
                          <div 
                            className="text-center py-6 border-2 border-dashed border-muted-foreground/20 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                            onClick={() => {
                              if (standbyDevices.length > 0) {
                                openSelectDeviceDialog(station.id, counter.id)
                              }
                            }}
                          >
                            {standbyDevices.length > 0 ? (
                              <>
                                <Plus className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  点击从备机区添加设备
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">暂无设备</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setStationDetailOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
