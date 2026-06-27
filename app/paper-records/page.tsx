'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStoreContext } from '@/lib/store-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { exportPaperRecordsCSV } from '@/lib/export'
import { Download, Search, Loader2, Plus, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function PaperRecordsPage() {
  const router = useRouter()
  const {
    currentUser,
    isInitialized,
    devices,
    deviceTypes,
    paperRecords,
    addPaperRecord,
  } = useStoreContext()

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    deviceId: '',
    paperType: '热敏纸',
    quantity: 1,
    notes: '',
  })

  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push('/')
    }
  }, [isInitialized, currentUser, router])

  // Get CUSS devices only
  const cussType = deviceTypes.find(t => t.name.includes('CUSS'))
  const cussDevices = devices.filter(d => d.typeId === cussType?.id)

  const filteredRecords = paperRecords.filter(record => {
    const device = devices.find(d => d.id === record.deviceId)
    return (
      device?.name.toLowerCase().includes(search.toLowerCase()) ||
      record.operatorName.toLowerCase().includes(search.toLowerCase())
    )
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleSubmit = async () => {
    if (!currentUser) return
    try {
      await addPaperRecord({
        ...formData,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
      })
      toast.success('换纸记录已添加')
      setDialogOpen(false)
      setFormData({
        deviceId: cussDevices[0]?.id || '',
        paperType: '热敏纸',
        quantity: 1,
        notes: '',
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleExport = () => {
    exportPaperRecordsCSV(paperRecords, devices)
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
          title="换纸记录"
          description="CUSS 自助机换纸操作记录"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setFormData(prev => ({ ...prev, deviceId: cussDevices[0]?.id || '' }))}>
                    <Plus className="h-4 w-4 mr-2" />
                    记录换纸
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>记录换纸操作</DialogTitle>
                    <DialogDescription>
                      为 CUSS 自助机记录换纸信息
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>选择设备</Label>
                      <Select
                        value={formData.deviceId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, deviceId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择 CUSS 设备" />
                        </SelectTrigger>
                        <SelectContent>
                          {cussDevices.map(device => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.name} ({device.serialNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>纸张类型</Label>
                      <Select
                        value={formData.paperType}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, paperType: value }))}
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
                      <Label>数量（卷）</Label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>备注</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="输入备注信息..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={!formData.deviceId}>
                      确认
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索设备或操作员..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>设备名称</TableHead>
                    <TableHead>序列号</TableHead>
                    <TableHead>纸张类型</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>操作员</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead>操作时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        暂无换纸记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map(record => {
                      const device = devices.find(d => d.id === record.deviceId)
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{device?.name || '已删除'}</TableCell>
                          <TableCell className="font-mono text-sm">{device?.serialNumber}</TableCell>
                          <TableCell>{record.paperType}</TableCell>
                          <TableCell>{record.quantity} 卷</TableCell>
                          <TableCell>{record.operatorName}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {record.notes || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(record.createdAt).toLocaleString('zh-CN')}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
