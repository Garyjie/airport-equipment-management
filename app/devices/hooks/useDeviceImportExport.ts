import { useState, useCallback, useRef } from 'react'
import type { Device, DeviceType, Station, Counter, DeviceChangeRecord } from '@/lib/types'
import { exportDevicesCSV, parseDevicesCSV } from '@/lib/export'
import { toast } from 'sonner'

export interface ImportResult {
  successCount: number
  skipCount: number
  errorCount: number
  errors: string[]
}

export function useDeviceImportExport() {
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const readFileWithEncoding = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          let content = ''
          const encodings = ['GBK', 'GB2312', 'UTF-8']
          for (const encoding of encodings) {
            try {
              const decoder = new TextDecoder(encoding)
              content = decoder.decode(arrayBuffer)
              if (content.includes('设备名称') || content.includes('站点名称')) {
                break
              }
            } catch {
              continue
            }
          }
          resolve(content)
        } catch {
          reject(new Error('文件解码失败'))
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }, [])

  const importDevices = useCallback(async (
    file: File,
    deviceTypes: DeviceType[],
    stations: Station[],
    counters: Counter[],
    existingDevices: Device[],
    onAddDevice: (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Device & { changeRecord: DeviceChangeRecord | null }>
  ): Promise<ImportResult> => {
    setIsImporting(true)
    try {
      if (!file.name.endsWith('.csv')) {
        toast.error('请选择 CSV 格式的文件')
        return { successCount: 0, skipCount: 0, errorCount: 0, errors: [] }
      }

      const content = await readFileWithEncoding(file)
      
      if (!content || content.trim().length === 0) {
        toast.error('文件内容为空')
        return { successCount: 0, skipCount: 0, errorCount: 0, errors: [] }
      }

      const { devices: parsedDevices, errors } = parseDevicesCSV(content, deviceTypes, stations, counters)

      if (errors.length > 0) {
        toast.warning('导入警告', {
          description: errors.join('\n'),
        })
      }

      if (parsedDevices.length > 0) {
        toast.info('正在导入设备，请稍候...')
        let successCount = 0
        let skipCount = 0
        let errorCount = 0

        for (const device of parsedDevices) {
          if (existingDevices.some(d => d.serialNumber === device.serialNumber)) {
            skipCount++
            continue
          }

          try {
            await onAddDevice({
              ...device,
              position: existingDevices.length + successCount + 1,
            })
            successCount++
          } catch (err) {
            if (err instanceof Error && err.message.includes('序列号已存在')) {
              skipCount++
            } else {
              errorCount++
            }
          }
        }

        let message = ''
        if (successCount > 0) message += `成功导入 ${successCount} 台设备`
        if (skipCount > 0) message += message ? `，${skipCount} 台已存在跳过` : `${skipCount} 台设备已存在`
        if (errorCount > 0) message += message ? `，${errorCount} 台导入失败` : `${errorCount} 台设备导入失败`

        if (successCount > 0) {
          toast.success(message || '导入完成')
        } else if (skipCount > 0) {
          toast.info(message)
        } else if (errorCount > 0) {
          toast.error(message)
        } else {
          toast.info('没有可导入的数据')
        }

        return { successCount, skipCount, errorCount, errors }
      } else if (errors.length === 0) {
        toast.info('CSV 文件中没有有效的设备数据')
      }

      return { successCount: 0, skipCount: 0, errorCount: 0, errors }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '导入处理失败')
      return { successCount: 0, skipCount: 0, errorCount: 0, errors: err instanceof Error ? [err.message] : [] }
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [readFileWithEncoding])

  const exportDevices = useCallback((
    devices: Device[],
    deviceTypes: DeviceType[],
    stations: Station[],
    counters: Counter[]
  ): boolean => {
    const success = exportDevicesCSV(devices, deviceTypes, stations, counters)
    if (success) {
      toast.success('设备列表已导出')
    } else {
      toast.error('导出失败，请重试')
    }
    return success
  }, [])

  return {
    importDevices,
    exportDevices,
    isImporting,
    fileInputRef,
  }
}