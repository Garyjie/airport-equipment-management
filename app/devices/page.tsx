'use client'

import { useState } from 'react'
import { useStoreContext } from '@/lib/store-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Download, Upload, FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthRedirect } from '@/hooks/use-auth-redirect'
import type { Device, DeviceStatus } from '@/lib/types'
import { DeviceFormDialog } from './components/DeviceFormDialog'
import { DeviceList } from './components/DeviceList'
import { DeviceFilters } from './components/DeviceFilters'
import { useDeviceFilters } from './hooks/useDeviceFilters'
import { useDeviceGroups } from './hooks/useDeviceGroups'
import { useDeviceImportExport } from './hooks/useDeviceImportExport'
import { downloadDeviceTemplate } from '@/lib/export'

export default function DevicesPage() {
  const {
    devices,
    deviceTypes,
    stations,
    counters,
    addDevice,
    updateDevice,
    deleteDevice,
    changeDeviceStatus,
  } = useStoreContext()
  const { isInitialized, currentUser } = useAuthRedirect(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description?: string
    onConfirm: () => void
    variant?: 'default' | 'destructive'
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

  const { importDevices, exportDevices, isImporting, fileInputRef } = useDeviceImportExport()

  const filteredDevices = useDeviceFilters(devices, { search, statusFilter, typeFilter })
  const { groupedDevices, sortedGroupKeys } = useDeviceGroups(filteredDevices, stations)

  const handleOpenDialog = (device?: Device) => {
    setEditingDevice(device || null)
    setDialogOpen(true)
  }

  const handleSubmit = async (formData: {
    name: string
    typeId: string
    serialNumber: string
    stationId: string
    counterId: string
    status: DeviceStatus
    customData: Record<string, unknown>
  }) => {
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
        variant: status === 'active' ? 'default' : 'destructive',
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
      toast.success(`设备状态已更新为${statusLabels[targetStatus]}`)
      setStatusChangeDialog(prev => ({ ...prev, open: false }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleImportClick = () => {
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    }, 50)
  }

  const handleImportDevices = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await importDevices(file, deviceTypes, stations, counters, devices, addDevice)
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
                onClick={handleImportClick}
                disabled={isImporting}
              >
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                exportDevices(devices, deviceTypes, stations, counters)
              }}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DeviceFormDialog
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  device={editingDevice}
                  deviceTypes={deviceTypes}
                  stations={stations}
                  counters={counters}
                  onSubmit={handleSubmit}
                />
              </Dialog>
            </div>
          }
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            <DeviceFilters
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              deviceTypes={deviceTypes}
            />
            <DeviceList
              groupedDevices={groupedDevices}
              sortedGroupKeys={sortedGroupKeys}
              deviceTypes={deviceTypes}
              counters={counters}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText="确认"
        variant={confirmDialog.variant || 'destructive'}
      />

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