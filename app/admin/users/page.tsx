'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStoreContext } from '@/lib/store-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { User, UserRole } from '@/lib/types'
import { exportUsersCSV, downloadUserTemplate, parseUsersCSV } from '@/lib/export'
import { Plus, MoreHorizontal, Pencil, Trash2, Shield, UserIcon, Loader2, Download, Upload, FileDown } from 'lucide-react'
import { toast } from 'sonner'

export default function UsersPage() {
  const router = useRouter()
  const {
    currentUser,
    isInitialized,
    users,
    addUser,
    updateUser,
    deleteUser,
  } = useStoreContext()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'user' as UserRole,
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

  const handleImportUsers = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const { users: parsedUsers, errors } = parseUsersCSV(content)
      
      if (errors.length > 0) {
        toast.warning('导入警告', {
          description: errors.join('\n'),
        })
      }
      
      if (parsedUsers.length > 0) {
        let successCount = 0
        for (const user of parsedUsers) {
          // 检查用户名是否已存在
          if (users.some(u => u.username === user.username)) {
            continue
          }
          addUser(user)
          successCount++
        }
        toast.success(`成功导入 ${successCount} 个用户`)
      } else if (errors.length === 0) {
        toast.info('没有可导入的数据')
      }
    }
    reader.readAsText(file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [users, addUser])

  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push('/')
    }
    if (isInitialized && currentUser?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [isInitialized, currentUser, router])

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        password: '',
        name: user.name,
        role: user.role,
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'user',
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    // 表单验证
    if (!formData.username.trim()) {
      toast.error('请输入用户名')
      return
    }
    if (!editingUser && !formData.password.trim()) {
      toast.error('请输入密码')
      return
    }
    if (!formData.name.trim()) {
      toast.error('请输入姓名')
      return
    }
    
    if (editingUser) {
      const updates: Partial<User> = {
        username: formData.username,
        name: formData.name,
        role: formData.role,
      }
      if (formData.password) {
        updates.password = formData.password
      }
      updateUser(editingUser.id, updates)
      toast.success('用户信息已更新')
    } else {
      addUser(formData)
      toast.success('用户已添加')
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) {
      toast.error('不能删除当前登录用户')
      return
    }
    setConfirmDialog({
      open: true,
      title: '确认删除用户',
      description: '确定要删除这个用户吗？此操作无法撤销。',
      onConfirm: () => {
        deleteUser(id)
        toast.success('用户已删除')
      },
    })
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="用户管理"
          description="管理系统用户账号和权限"
          actions={
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleImportUsers}
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={downloadUserTemplate}>
                <FileDown className="h-4 w-4 mr-2" />
                模板
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportUsersCSV(users)}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加用户
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? '编辑用户' : '添加新用户'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser ? '修改用户信息' : '创建新的系统用户'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>用户名</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="登录用户名"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>
                      密码
                      {editingUser && (
                        <span className="text-muted-foreground ml-2">（留空保持不变）</span>
                      )}
                    </Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={editingUser ? '留空保持原密码' : '设置密码'}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>姓名</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="用户真实姓名"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>角色</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">管理员</SelectItem>
                        <SelectItem value="user">普通用户</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingUser ? '保存' : '添加'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          }
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium font-mono">
                      {user.username}
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? (
                          <><Shield className="h-3 w-3 mr-1" />管理员</>
                        ) : (
                          <><UserIcon className="h-3 w-3 mr-1" />普通用户</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(user.id)}
                            disabled={user.id === currentUser.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
        confirmText="确认删除"
        variant="destructive"
      />
    </div>
  )
}
