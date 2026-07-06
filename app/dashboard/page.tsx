'use client'

import { useAuthRedirect } from '@/hooks/use-auth-redirect'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { StationView } from '@/components/dashboard/station-view'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { isInitialized, currentUser } = useAuthRedirect(true)

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
          title="运营监控仪表盘" 
          description="实时监控机场设备状态"
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <StatsCards />
            <div>
              <h2 className="text-lg font-semibold mb-4">站点设备分布</h2>
              <StationView />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
