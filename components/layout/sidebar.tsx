'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useStoreContext } from '@/lib/store-context'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Monitor,
  MapPin,
  Settings,
  Users,
  FileSpreadsheet,
  LogOut,
  Plane,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { currentUser, logout } = useStoreContext()
  const [collapsed, setCollapsed] = useState(false)

  const isAdmin = currentUser?.role === 'admin'

  const navItems = [
    {
      title: '仪表盘',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: '设备管理',
      href: '/devices',
      icon: Monitor,
    },
    {
      title: '站点管理',
      href: '/stations',
      icon: MapPin,
    },
    {
      title: '换纸记录',
      href: '/paper-records',
      icon: FileText,
    },
    {
      title: '更换记录',
      href: '/change-records',
      icon: FileSpreadsheet,
    },
  ]

  const adminItems = [
    {
      title: '用户管理',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: '设备类型',
      href: '/admin/device-types',
      icon: Settings,
    },
  ]

  return (
    <div
      className={cn(
        'relative flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            <span className="font-semibold">设备管理系统</span>
          </div>
        )}
        {collapsed && <Plane className="h-6 w-6 text-primary mx-auto" />}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className={cn('h-4 w-4', !collapsed && 'mr-2')} />
                {!collapsed && item.title}
              </Button>
            </Link>
          ))}

          {isAdmin && (
            <>
              <Separator className="my-2" />
              {!collapsed && (
                <span className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  管理员
                </span>
              )}
              {adminItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4', !collapsed && 'mr-2')} />
                    {!collapsed && item.title}
                  </Button>
                </Link>
              ))}
            </>
          )}
        </nav>
      </ScrollArea>

      <div className="border-t p-2">
        {currentUser && (
          <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser.role === 'admin' ? '管理员' : '操作员'}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
