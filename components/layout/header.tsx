'use client'

import React from "react"

import { useStoreContext } from '@/lib/store-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, RefreshCw, User, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from '@/hooks/use-theme'

interface HeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function Header({ title, description, actions }: HeaderProps) {
  const { devices, currentUser, logout } = useStoreContext()
  const { theme, toggleTheme, mounted } = useTheme()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const alertCount = devices.filter(d => d.status === 'damaged' || d.status === 'repair').length

  const handleRefresh = () => {
    setIsRefreshing(true)
    setLastRefresh(new Date())
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}

        <div className="text-xs text-muted-foreground mr-2">
          更新于 {lastRefresh.toLocaleTimeString('zh-CN')}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>

        {mounted && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative bg-transparent">
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground"
                >
                  {alertCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="p-2">
              <p className="text-sm font-medium">设备告警</p>
              <p className="text-xs text-muted-foreground">
                {alertCount > 0 ? `${alertCount} 台设备需要关注` : '暂无告警'}
              </p>
            </div>
            {alertCount > 0 && (
              <>
                <DropdownMenuSeparator />
                {devices
                  .filter(d => d.status === 'damaged' || d.status === 'repair')
                  .slice(0, 5)
                  .map(device => (
                    <DropdownMenuItem key={device.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            device.status === 'damaged' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="truncate">{device.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {device.status === 'damaged' ? '损坏' : '送修'}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="p-2">
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.role === 'admin' ? '管理员' : '操作员'}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
