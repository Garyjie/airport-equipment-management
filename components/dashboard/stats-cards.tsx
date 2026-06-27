'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStoreContext } from '@/lib/store-context'
import { statusColors, stationTypeLabels } from '@/lib/types'
import { Monitor, MapPin, AlertTriangle, Wrench, ChevronRight } from 'lucide-react'

type DrillDownType = 'total' | 'stations' | 'abnormal' | 'standby' | null

export function StatsCards() {
  const { devices, stations, counters, deviceTypes } = useStoreContext()
  const [drillDown, setDrillDown] = useState<DrillDownType>(null)

  const stats = {
    total: devices.length,
    active: devices.filter(d => d.status === 'active').length,
    standby: devices.filter(d => d.status === 'standby').length,
    damaged: devices.filter(d => d.status === 'damaged').length,
    repair: devices.filter(d => d.status === 'repair').length,
    stations: stations.length,
  }

  const cards = [
    {
      id: 'total' as const,
      title: '设备总数',
      value: stats.total,
      subValue: `${stats.active} 台使用中`,
      icon: Monitor,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
    },
    {
      id: 'stations' as const,
      title: '站点数量',
      value: stats.stations,
      subValue: `${counters.length} 个柜台`,
      icon: MapPin,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      id: 'abnormal' as const,
      title: '异常设备',
      value: stats.damaged + stats.repair,
      subValue: `${stats.damaged} 损坏 / ${stats.repair} 送修`,
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 'standby' as const,
      title: '备用设备',
      value: stats.standby,
      subValue: '台待命中',
      icon: Wrench,
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
    },
  ]

  const getDeviceTypeName = (typeId: string) => {
    return deviceTypes.find(t => t.id === typeId)?.name || '未知类型'
  }

  const getStationName = (stationId?: string) => {
    if (!stationId) return '库房（备机区）'
    return stations.find(s => s.id === stationId)?.name || '库房（备机区）'
  }

  const getCounterName = (counterId?: string) => {
    if (!counterId) return '-'
    return counters.find(c => c.id === counterId)?.name || '-'
  }

  const renderDrillDownContent = () => {
    switch (drillDown) {
      case 'total':
        const groupedByStation = devices.reduce((acc, device) => {
          const key = device.status === 'standby' || !device.stationId ? '库房（备机区）' : getStationName(device.stationId)
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(device)
          return acc
        }, {} as Record<string, typeof devices>)

        const sortedStationKeys = Object.keys(groupedByStation).sort((a, b) => {
          const aIsStandby = a === '库房（备机区）'
          const bIsStandby = b === '库房（备机区）'
          if (aIsStandby && !bIsStandby) return 1
          if (!aIsStandby && bIsStandby) return -1
          return a.localeCompare(b, 'zh-CN')
        })

        return (
          <>
            <DialogHeader>
              <DialogTitle>全部设备 ({devices.length})</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] w-full overflow-x-auto">
              <div className="space-y-6 min-w-max">
                {sortedStationKeys.map(stationName => {
                  const stationDevices = groupedByStation[stationName]
                  const groupedByCounter = stationDevices.reduce((acc, device) => {
                    const counterName = getCounterName(device.counterId)
                    const key = counterName === '-' ? '独立设备' : counterName
                    if (!acc[key]) {
                      acc[key] = []
                    }
                    acc[key].push(device)
                    return acc
                  }, {} as Record<string, typeof devices>)
                  
                  const sortedCounterKeys = Object.keys(groupedByCounter).sort((a, b) => {
                    if (a === '独立设备') return 1
                    if (b === '独立设备') return -1
                    return a.localeCompare(b, 'zh-CN')
                  })

                  return (
                    <div key={stationName} className="border-b border-border/50 pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="font-semibold text-base">{stationName}</span>
                        <span className="text-xs text-muted-foreground">({stationDevices.length}台)</span>
                      </div>
                      <div className="space-y-4 pl-4">
                        {sortedCounterKeys.map(counterName => (
                          <div key={counterName}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></div>
                              <span className="text-sm font-medium text-muted-foreground">{counterName}</span>
                              <span className="text-xs text-muted-foreground">({groupedByCounter[counterName].length}台)</span>
                            </div>
                            <div className="space-y-1">
                                {groupedByCounter[counterName].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')).map(device => {
                                  const status = statusColors[device.status]
                                  return (
                                    <div key={device.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/50 text-sm">
                                      <span className="font-medium truncate w-[130px]">{device.name}</span>
                                      <span className="text-muted-foreground truncate w-[110px]">{getDeviceTypeName(device.typeId)}</span>
                                      <Badge className={`${status.bg} text-white text-xs shrink-0`}>
                                        {status.label}
                                      </Badge>
                                      <span className="font-mono text-xs text-muted-foreground truncate w-[110px]">{device.serialNumber}</span>
                                    </div>
                                  )
                                })}
                              </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </>
        )
      case 'stations':
        return (
          <>
            <DialogHeader>
              <DialogTitle>站点详情 ({stations.length} 个站点)</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>站点名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>柜台数</TableHead>
                    <TableHead>设备数</TableHead>
                    <TableHead>在线率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map(station => {
                    const stationCounters = counters.filter(c => c.stationId === station.id)
                    const stationDevices = devices.filter(d => d.stationId === station.id)
                    const activeDevices = stationDevices.filter(d => d.status === 'active')
                    const rate = stationDevices.length > 0 
                      ? Math.round((activeDevices.length / stationDevices.length) * 100) 
                      : 0
                    return (
                      <TableRow key={station.id}>
                        <TableCell className="font-medium">{station.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{stationTypeLabels[station.type]}</Badge>
                        </TableCell>
                        <TableCell>{stationCounters.length}</TableCell>
                        <TableCell>{stationDevices.length}</TableCell>
                        <TableCell>
                          <span className={rate >= 80 ? 'text-emerald-500' : rate >= 50 ? 'text-amber-500' : 'text-rose-500'}>
                            {rate}%
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )
      case 'abnormal':
        const abnormalDevices = devices.filter(d => d.status === 'damaged' || d.status === 'repair')
        return (
          <>
            <DialogHeader>
              <DialogTitle>异常设备 ({abnormalDevices.length})</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>设备名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>序列号</TableHead>
                    <TableHead>原站点</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abnormalDevices.map(device => {
                    const status = statusColors[device.status]
                    return (
                      <TableRow key={device.id}>
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell>{getDeviceTypeName(device.typeId)}</TableCell>
                        <TableCell>
                          <Badge className={`${status.bg} text-white`}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{device.serialNumber}</TableCell>
                        <TableCell>{getStationName(device.stationId)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )
      case 'standby':
        const standbyDevices = devices.filter(d => d.status === 'standby')
        return (
          <>
            <DialogHeader>
              <DialogTitle>备用设备 ({standbyDevices.length})</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>设备名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>序列号</TableHead>
                    <TableHead>存放位置</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standbyDevices.map(device => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.name}</TableCell>
                      <TableCell>{getDeviceTypeName(device.typeId)}</TableCell>
                      <TableCell className="font-mono text-xs">{device.serialNumber}</TableCell>
                      <TableCell>{getStationName(device.stationId) || '备机库'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card 
            key={card.id} 
            className="border-border/50 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
            onClick={() => setDrillDown(card.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.subValue}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={drillDown !== null} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-5xl max-h-[70vh] overflow-hidden">
          {renderDrillDownContent()}
        </DialogContent>
      </Dialog>
    </>
  )
}
