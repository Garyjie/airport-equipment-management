'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStoreContext } from '@/lib/store-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { exportChangeRecordsCSV } from '@/lib/export'
import { statusColors } from '@/lib/types'
import { Download, Search, ArrowRight, History, Loader2 } from 'lucide-react'

export default function ChangeRecordsPage() {
  const router = useRouter()
  const {
    currentUser,
    isInitialized,
    devices,
    stations,
    counters,
    changeRecords,
  } = useStoreContext()

  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push('/')
    }
  }, [isInitialized, currentUser, router])

  const filteredRecords = changeRecords.filter(record => {
    const device = devices.find(d => d.id === record.deviceId)
    return (
      device?.name.toLowerCase().includes(search.toLowerCase()) ||
      device?.serialNumber?.toLowerCase().includes(search.toLowerCase()) ||
      record.operatorName.toLowerCase().includes(search.toLowerCase()) ||
      record.reason.toLowerCase().includes(search.toLowerCase())
    )
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleExport = () => {
    exportChangeRecordsCSV(changeRecords, devices, stations, counters)
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
          title="更换记录"
          description="设备状态变更和位置移动记录"
          actions={
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          }
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索设备、操作员或原因..."
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
                    <TableHead>位置变更</TableHead>
                    <TableHead>状态变更</TableHead>
                    <TableHead>变更原因</TableHead>
                    <TableHead>操作员</TableHead>
                    <TableHead>操作时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        暂无更换记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map(record => {
                      const device = devices.find(d => d.id === record.deviceId)
                      const fromStation = stations.find(s => s.id === record.fromStationId)
                      const toStation = stations.find(s => s.id === record.toStationId)
                      const fromCounter = counters.find(c => c.id === record.fromCounterId)
                      const toCounter = counters.find(c => c.id === record.toCounterId)
                      const fromStatus = record.fromStatus ? statusColors[record.fromStatus] : null
                      const toStatus = record.toStatus ? statusColors[record.toStatus] : null

                      const locationChanged = record.fromStationId !== record.toStationId || 
                                             record.fromCounterId !== record.toCounterId
                      const statusChanged = record.fromStatus !== record.toStatus

                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {device?.name || '已删除'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {device?.serialNumber || '-'}
                          </TableCell>
                          <TableCell>
                            {locationChanged ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  {fromStation?.name || '库房（备机区）'}
                                  {fromCounter && ` / ${fromCounter.name}`}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {toStation?.name || '库房（备机区）'}
                                  {toCounter && ` / ${toCounter.name}`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.fromStatus === undefined && record.toStatus ? (
                              <Badge className={`${toStatus!.bg} text-white`}>
                                新增 → {toStatus!.label}
                              </Badge>
                            ) : record.fromStatus && record.toStatus === undefined ? (
                              <Badge className={`${fromStatus!.bg} text-white`}>
                                {fromStatus!.label} → 删除
                              </Badge>
                            ) : statusChanged && fromStatus && toStatus ? (
                              <div className="flex items-center gap-2">
                                <Badge className={`${fromStatus.bg} text-white`}>
                                  {fromStatus.label}
                                </Badge>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <Badge className={`${toStatus.bg} text-white`}>
                                  {toStatus.label}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {record.reason}
                          </TableCell>
                          <TableCell>{record.operatorName}</TableCell>
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
