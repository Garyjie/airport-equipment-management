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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ChevronsUpDown } from 'lucide-react'
import type { DeviceType, CustomAttribute } from '@/lib/types'
import { generateId } from '@/lib/types'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Monitor, 
  Laptop, 
  Printer, 
  Scale, 
  Scan,
  X,
  Loader2,
  Smartphone,
  Tablet,
  Camera,
  Tv,
  Keyboard,
  Mouse,
  Speaker,
  Headphones,
  Mic,
  Wifi,
  Cpu,
  HardDrive,
  Server,
  Box,
  Package,
  Tag,
  BarChart3,
  Calculator,
  CreditCard,
  Receipt,
  FileText,
  Mail,
  Phone,
  Plane,
  Ticket,
  MapPin,
  Compass,
  Navigation,
  Search,
  QrCode,
  ScanLine,
  Bluetooth,
  Usb,
  Cable,
  Battery,
  Zap,
  Power,
  Sun,
  Moon,
  Globe,
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Settings,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

const iconOptions = [
  // 电脑/办公设备
  { value: 'Monitor', label: '显示器', Icon: Monitor },
  { value: 'Laptop', label: '笔记本', Icon: Laptop },
  { value: 'Tablet', label: '平板电脑', Icon: Tablet },
  { value: 'Smartphone', label: '手机', Icon: Smartphone },
  { value: 'Tv', label: '电视', Icon: Tv },
  { value: 'Keyboard', label: '键盘', Icon: Keyboard },
  { value: 'Mouse', label: '鼠标', Icon: Mouse },
  { value: 'Server', label: '服务器', Icon: Server },
  { value: 'Cpu', label: '处理器', Icon: Cpu },
  { value: 'HardDrive', label: '硬盘', Icon: HardDrive },
  { value: 'Box', label: '设备', Icon: Box },
  { value: 'Package', label: '机柜', Icon: Package },
  // 打印/扫描设备
  { value: 'Printer', label: '打印机', Icon: Printer },
  { value: 'Scan', label: '扫描器', Icon: Scan },
  { value: 'Camera', label: '摄像头', Icon: Camera },
  { value: 'QrCode', label: '二维码', Icon: QrCode },
  { value: 'ScanLine', label: '条形码', Icon: ScanLine },
  { value: 'Tag', label: '标签', Icon: Tag },
  { value: 'Receipt', label: '小票', Icon: Receipt },
  // 称重/票据
  { value: 'Scale', label: '秤', Icon: Scale },
  { value: 'BarChart3', label: '数据', Icon: BarChart3 },
  { value: 'Calculator', label: '计算器', Icon: Calculator },
  { value: 'CreditCard', label: '读卡器', Icon: CreditCard },
  { value: 'FileText', label: '文件', Icon: FileText },
  { value: 'Ticket', label: '登机牌', Icon: Ticket },
  // 机场设备
  { value: 'Plane', label: '飞机', Icon: Plane },
  { value: 'MapPin', label: '位置', Icon: MapPin },
  { value: 'Compass', label: '指南针', Icon: Compass },
  { value: 'Navigation', label: '导航', Icon: Navigation },
  { value: 'Search', label: '搜索', Icon: Search },
  // 网络/连接
  { value: 'Wifi', label: '无线网络', Icon: Wifi },
  { value: 'Bluetooth', label: '蓝牙', Icon: Bluetooth },
  { value: 'Usb', label: 'USB', Icon: Usb },
  { value: 'Cable', label: '线缆', Icon: Cable },
  { value: 'Globe', label: '网络', Icon: Globe },
  // 电源
  { value: 'Battery', label: '电池', Icon: Battery },
  { value: 'Zap', label: '电源', Icon: Zap },
  { value: 'Power', label: '开关', Icon: Power },
  // 音频
  { value: 'Speaker', label: '音响', Icon: Speaker },
  { value: 'Headphones', label: '耳机', Icon: Headphones },
  { value: 'Mic', label: '麦克风', Icon: Mic },
  // 通讯
  { value: 'Phone', label: '电话', Icon: Phone },
  { value: 'Mail', label: '邮件', Icon: Mail },
  // 安全/系统
  { value: 'Shield', label: '安全', Icon: Shield },
  { value: 'Lock', label: '锁定', Icon: Lock },
  { value: 'Key', label: '钥匙', Icon: Key },
  { value: 'AlertTriangle', label: '警告', Icon: AlertTriangle },
  { value: 'CheckCircle', label: '正常', Icon: CheckCircle },
  // 其他
  { value: 'Clock', label: '时钟', Icon: Clock },
  { value: 'Calendar', label: '日历', Icon: Calendar },
  { value: 'Settings', label: '设置', Icon: Settings },
  { value: 'Sun', label: '白天', Icon: Sun },
  { value: 'Moon', label: '夜间', Icon: Moon },
]

export default function DeviceTypesPage() {
  const router = useRouter()
  const {
    currentUser,
    isInitialized,
    deviceTypes,
    devices,
    addDeviceType,
    updateDeviceType,
    deleteDeviceType,
  } = useStoreContext()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<DeviceType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Monitor',
    description: '',
    customAttributes: [] as CustomAttribute[],
  })
  const [newAttr, setNewAttr] = useState({
    name: '',
    type: 'text' as CustomAttribute['type'],
    required: false,
    options: '',
  })
  const [iconPopoverOpen, setIconPopoverOpen] = useState(false)
  const [iconSearch, setIconSearch] = useState('')
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

  // 处理自定义图标上传
  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 限制文件大小为 500KB
    if (file.size > 500 * 1024) {
      toast.error('图片大小不能超过 500KB')
      return
    }

    // 限制文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      // 创建图片以调整大小
      const img = new Image()
      img.onload = () => {
        // 创建 canvas 缩放图片
        const canvas = document.createElement('canvas')
        const size = 128 // 缩放到 128x128
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // 透明背景
          ctx.clearRect(0, 0, size, size)
          // 居中绘制
          ctx.drawImage(img, 0, 0, size, size)
          const resizedBase64 = canvas.toDataURL('image/png')
          setFormData(prev => ({ ...prev, icon: resizedBase64 }))
          setIconPopoverOpen(false)
        }
      }
      img.src = result
    }
    reader.readAsDataURL(file)
    // 重置 input value 以便上传同名文件
    e.target.value = ''
  }

  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push('/')
    }
    if (isInitialized && currentUser?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [isInitialized, currentUser, router])

  const handleOpenDialog = (type?: DeviceType) => {
    if (type) {
      setEditingType(type)
      setFormData({
        name: type.name,
        icon: type.icon,
        description: type.description,
        customAttributes: type.customAttributes,
      })
    } else {
      setEditingType(null)
      setFormData({
        name: '',
        icon: 'Monitor',
        description: '',
        customAttributes: [],
      })
    }
    setNewAttr({ name: '', type: 'text', required: false, options: '' })
    setDialogOpen(true)
  }

  const handleAddAttribute = () => {
    if (!newAttr.name) return
    const attr: CustomAttribute = {
      id: generateId(),
      name: newAttr.name,
      type: newAttr.type,
      required: newAttr.required,
      options: newAttr.type === 'select' ? newAttr.options.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    }
    setFormData(prev => ({
      ...prev,
      customAttributes: [...prev.customAttributes, attr],
    }))
    setNewAttr({ name: '', type: 'text', required: false, options: '' })
  }

  const handleRemoveAttribute = (id: string) => {
    setFormData(prev => ({
      ...prev,
      customAttributes: prev.customAttributes.filter(a => a.id !== id),
    }))
  }

  const handleSubmit = () => {
    // 表单验证
    if (!formData.name.trim()) {
      toast.error('请输入设备类型名称')
      return
    }
    
    if (editingType) {
      updateDeviceType(editingType.id, formData)
      toast.success('设备类型已更新')
    } else {
      addDeviceType(formData)
      toast.success('设备类型已添加')
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    const typeDevices = devices.filter(d => d.typeId === id)
    if (typeDevices.length > 0) {
      toast.error('该类型下还有设备，无法删除')
      return
    }
    setConfirmDialog({
      open: true,
      title: '确认删除设备类型',
      description: '确定要删除这个设备类型吗？此操作无法撤销。',
      onConfirm: () => {
        deleteDeviceType(id)
        toast.success('设备类型已删除')
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
          title="设备类型管理"
          description="自定义设备类型及其属性"
          actions={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加类型
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingType ? '编辑设备类型' : '添加新设备类型'}
                  </DialogTitle>
                  <DialogDescription>
                    定义设备类型的基本信息和自定义属性
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>类型名称</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="例如: CUSS 自助机"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>图标</Label>
                      <Popover open={iconPopoverOpen} onOpenChange={setIconPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={iconPopoverOpen}
                            className="w-full justify-between"
                          >
                            {(() => {
                              const selected = iconOptions.find(opt => opt.value === formData.icon)
                              if (selected) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <selected.Icon className="h-5 w-5" />
                                    <span>{selected.label}</span>
                                  </div>
                                )
                              }
                              // 检查是否是自定义图标（base64 图片或 emoji）
                              if (formData.icon.startsWith('data:image/') || formData.icon.length <= 4) {
                                return (
                                  <div className="flex items-center gap-2">
                                    {formData.icon.startsWith('data:image/') ? (
                                      <img src={formData.icon} alt="自定义图标" className="h-5 w-5 object-contain" />
                                    ) : (
                                      <span className="text-lg">{formData.icon}</span>
                                    )}
                                    <span>自定义</span>
                                  </div>
                                )
                              }
                              return <span className="text-muted-foreground">选择图标</span>
                            })()}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <div className="p-2">
                            <Input
                              placeholder="搜索图标..."
                              value={iconSearch}
                              onChange={(e) => setIconSearch(e.target.value)}
                              className="h-8 mb-2"
                            />
                            {/* 上传自定义图标 */}
                            <div className="mb-2 p-2 border border-dashed border-border rounded-md">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCustomIconUpload}
                                  className="hidden"
                                  id="custom-icon-upload"
                                />
                                <Label
                                  htmlFor="custom-icon-upload"
                                  className="flex-1 cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>点击上传图片图标</span>
                                </Label>
                              </div>
                            </div>
                            <ScrollArea className="h-[300px]">
                              <div className="grid grid-cols-6 gap-1">
                                {iconOptions
                                  .filter(opt => opt.label.includes(iconSearch) || opt.value.toLowerCase().includes(iconSearch.toLowerCase()))
                                  .map(opt => {
                                    const Icon = opt.Icon
                                    const isSelected = formData.icon === opt.value
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({ ...prev, icon: opt.value }))
                                          setIconPopoverOpen(false)
                                          setIconSearch('')
                                        }}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-md hover:bg-accent transition-colors ${
                                          isSelected ? 'bg-primary/10 border border-primary' : 'border border-transparent'
                                        }`}
                                        title={opt.label}
                                      >
                                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-foreground'}`} />
                                        <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                                          {opt.label}
                                        </span>
                                      </button>
                                    )
                                  })}
                              </div>
                            </ScrollArea>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>描述</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="设备类型描述..."
                    />
                  </div>

                  {/* Custom Attributes */}
                  <div className="space-y-3">
                    <Label>自定义属性</Label>
                    
                    {formData.customAttributes.length > 0 && (
                      <div className="space-y-2">
                        {formData.customAttributes.map(attr => (
                          <div
                            key={attr.id}
                            className="flex items-center gap-2 rounded-lg border p-2"
                          >
                            <div className="flex-1">
                              <span className="font-medium">{attr.name}</span>
                              <span className="text-muted-foreground text-sm ml-2">
                                ({attr.type === 'text' ? '文本' : attr.type === 'number' ? '数字' : attr.type === 'date' ? '日期' : '下拉选择'})
                              </span>
                              {attr.required && (
                                <Badge variant="outline" className="ml-2 text-xs">必填</Badge>
                              )}
                              {attr.options && (
                                <span className="text-muted-foreground text-xs ml-2">
                                  选项: {attr.options.join(', ')}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRemoveAttribute(attr.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new attribute */}
                    <div className="rounded-lg border p-3 space-y-3">
                      <p className="text-sm text-muted-foreground">添加新属性</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={newAttr.name}
                          onChange={(e) => setNewAttr(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="属性名称"
                        />
                        <Select
                          value={newAttr.type}
                          onValueChange={(value) => setNewAttr(prev => ({ ...prev, type: value as CustomAttribute['type'] }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">文本</SelectItem>
                            <SelectItem value="number">数字</SelectItem>
                            <SelectItem value="date">日期</SelectItem>
                            <SelectItem value="select">下拉选择</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newAttr.type === 'select' && (
                        <Input
                          value={newAttr.options}
                          onChange={(e) => setNewAttr(prev => ({ ...prev, options: e.target.value }))}
                          placeholder="选项，用逗号分隔（如: 选项1, 选项2, 选项3）"
                        />
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="required"
                            checked={newAttr.required}
                            onCheckedChange={(checked) => setNewAttr(prev => ({ ...prev, required: !!checked }))}
                          />
                          <Label htmlFor="required" className="text-sm">必填</Label>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddAttribute}
                          disabled={!newAttr.name}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          添加属性
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSubmit} disabled={!formData.name}>
                    {editingType ? '保存' : '添加'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deviceTypes.map(type => {
              const typeDevices = devices.filter(d => d.typeId === type.id)
              const isCustomImage = type.icon.startsWith('data:image/')
              const IconComponent = !isCustomImage 
                ? iconOptions.find(o => o.value === type.icon)?.Icon || Monitor
                : null

              return (
                <Card key={type.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          {isCustomImage ? (
                            <img src={type.icon} alt={type.name} className="h-5 w-5 object-contain" />
                          ) : (
                            IconComponent && <IconComponent className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{type.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {typeDevices.length} 台设备
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(type)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {type.description || '暂无描述'}
                    </p>
                    {type.customAttributes.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">自定义属性:</p>
                        <div className="flex flex-wrap gap-1">
                          {type.customAttributes.map(attr => (
                            <Badge key={attr.id} variant="outline" className="text-xs">
                              {attr.name}
                              {attr.required && <span className="text-destructive ml-1">*</span>}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
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
