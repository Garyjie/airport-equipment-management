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

  const handleImportUsers = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('选择的文件:', file.name, file.type, file.size)
    
    if (!file.name.endsWith('.csv')) {
      toast.error('请选择 CSV 格式的文件')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    const reader = new FileReader()
    
    reader.onerror = () => {
      console.error('文件读取失败')
      toast.error('文件读取失败，请重试')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    
    reader.onload = async (e) => {
      try {
        console.log('文件读取成功')
        const arrayBuffer = e.target?.result as ArrayBuffer
        
        let content = ''
        const encodings = ['GBK', 'GB2312', 'UTF-8']
        for (const encoding of encodings) {
          try {
            const decoder = new TextDecoder(encoding)
            content = decoder.decode(arrayBuffer)
            console.log(`尝试编码 ${encoding}:`, content.substring(0, 50))
            if (content.includes('用户名')) {
              console.log(`使用编码 ${encoding} 成功解码`)
              break
            }
          } catch {
            continue
          }
        }
        
        console.log('文件内容长度:', content?.length)
        
        if (!content || content.trim().length === 0) {
          toast.error('文件内容为空')
          return
        }
        
        const { users: parsedUsers, errors } = parseUsersCSV(content)
        console.log('解析结果:', parsedUsers.length, '用户', errors.length, '错误')
        
        if (errors.length > 0) {
          toast.warning('导入警告', {
            description: errors.join('\n'),
          })
        }
        
        if (parsedUsers.length > 0) {
          toast.info('正在导入用户，请稍候...')
          let successCount = 0
          let skipCount = 0
          let errorCount = 0
          for (const user of parsedUsers) {
            if (users.some(u => u.username === user.username)) {
              skipCount++
              continue
            }
            try {
              await addUser(user)
              successCount++
            } catch (err) {
              console.error('添加用户失败:', err)
              errorCount++
            }
          }
          
          let message = ''
          if (successCount > 0) message += `成功导入 ${successCount} 个用户`
          if (skipCount > 0) message += message ? `，${skipCount} 个已存在跳过` : `${skipCount} 个用户已存在`
          if (errorCount > 0) message += message ? `，${errorCount} 个导入失败` : `${errorCount} 个用户导入失败`
          
          if (successCount > 0) {
            toast.success(message || '导入完成')
          } else if (skipCount > 0) {
            toast.info(message)
          } else if (errorCount > 0) {
            toast.error(message)
          } else {
            toast.info('没有可导入的数据')
          }
        } else if (errors.length === 0) {
          toast.info('CSV 文件中没有有效的用户数据')
        }
      } catch (err) {
        console.error('导入处理失败:', err)
        toast.error(err instanceof Error ? err.message : '导入处理失败')
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
    
    reader.readAsArrayBuffer(file)
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

  const handleSubmit = async () => {
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
    
    try {
      if (editingUser) {
        const updates: Partial<User> = {
          username: formData.username,
          name: formData.name,
          role: formData.role,
        }
        if (formData.password) {
          updates.password = formData.password
        }
        await updateUser(editingUser.id, updates)
        toast.success('用户信息已更新')
      } else {
        await addUser(formData)
        toast.success('用户已添加')
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
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
      onConfirm: async () => {
        try {
          await deleteUser(id)
          toast.success('用户已删除')
          setConfirmDialog(prev => ({ ...prev, open: false }))
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '删除失败')
        }
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

  const handleImportClick = () => {
    console.log('导入按钮点击了')
    console.log('fileInputRef.current:', fileInputRef.current)
    // 使用延时确保 ref 已经正确关联
    setTimeout(() => {
      console.log('setTimeout 回调执行')
      if (fileInputRef.current) {
        console.log('触发文件选择对话框')
        fileInputRef.current.click()
      } else {
        console.error('fileInputRef.current 为空，无法触发文件选择')
      }
    }, 0)
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  console.log('导入 Button onClick 触发')
                  e.preventDefault()
                  e.stopPropagation()
                  handleImportClick()
                }}
              >
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
