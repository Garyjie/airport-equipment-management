import type { User, DeviceType, Device, Station, Counter, DeviceChangeRecord, PaperChangeRecord, ConsumableRecord } from './types'

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'

export class ApiError extends Error {
  status: number
  code?: string
  
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

function setToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

function getErrorMessage(status: number, errorData: any): string {
  switch (status) {
    case 400:
      return errorData.message || '请求参数错误'
    case 401:
      return errorData.message || '登录已过期，请重新登录'
    case 403:
      return errorData.message || '没有权限执行此操作'
    case 404:
      return errorData.message || '请求的资源不存在'
    case 409:
      return errorData.message || '数据冲突，请刷新后重试'
    case 422:
      return errorData.message || '数据验证失败'
    case 500:
      return errorData.message || '服务器内部错误，请稍后重试'
    case 502:
    case 503:
    case 504:
      return '服务器暂时不可用，请稍后重试'
    default:
      return errorData.message || errorData.error || '请求失败'
  }
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...restOptions } = options
  const token = skipAuth ? null : getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...restOptions.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...restOptions,
      headers,
    })

    if (!response.ok) {
      let errorData: any = {}
      try {
        errorData = await response.json()
      } catch {
        // 忽略 JSON 解析错误
      }
      
      const message = getErrorMessage(response.status, errorData)
      throw new ApiError(message, response.status, errorData.code)
    }

    return response.json()
  } catch (err) {
    if (err instanceof ApiError) {
      throw err
    }
    // 网络错误
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new ApiError('网络连接失败，请检查网络设置', 0, 'NETWORK_ERROR')
    }
    throw new ApiError(err instanceof Error ? err.message : '请求失败', 0)
  }
}

export const authApi = {
  login: async (username: string, password: string) => {
    const result = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    })
    setToken(result.token)
    return result
  },
  logout: async () => {
    await request('/auth/logout', { method: 'POST' })
    setToken(null)
  },
  getMe: async () => {
    return request<User>('/auth/me')
  },
}

export const userApi = {
  getAll: async () => request<User[]>('/users'),
  getById: async (id: string) => request<User>(`/users/${id}`),
  create: async (data: Omit<User, 'id' | 'createdAt'>) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id: string, data: Partial<User>) =>
    request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (id: string) =>
    request<void>(`/users/${id}`, { method: 'DELETE' }),
}

export const deviceTypeApi = {
  getAll: async () => {
    const types = await request<DeviceType[]>('/device-types')
    return types.map(t => ({
      ...t,
      customAttributes: typeof t.customAttributes === 'string' ? JSON.parse(t.customAttributes) : t.customAttributes,
    }))
  },
  getById: async (id: string) => {
    const type = await request<DeviceType>(`/device-types/${id}`)
    return {
      ...type,
      customAttributes: typeof type.customAttributes === 'string' ? JSON.parse(type.customAttributes) : type.customAttributes,
    }
  },
  create: async (data: Omit<DeviceType, 'id' | 'createdAt'>) =>
    request<DeviceType>('/device-types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: async (id: string, data: Partial<DeviceType>) => {
    return request<DeviceType>(`/device-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  delete: async (id: string) =>
    request<void>(`/device-types/${id}`, { method: 'DELETE' }),
}

export const stationApi = {
  getAll: async () => {
    const stations = await request<Station[]>('/stations')
    return stations.map(s => ({
      ...s,
      position: { x: s.positionX, y: s.positionY },
    }))
  },
  getById: async (id: string) => {
    const station = await request<Station>(`/stations/${id}`)
    return {
      ...station,
      position: { x: station.positionX, y: station.positionY },
    }
  },
  create: async (data: Omit<Station, 'id' | 'createdAt'>) =>
    request<Station>('/stations', {
      method: 'POST',
      body: JSON.stringify({ ...data, positionX: data.position.x, positionY: data.position.y }),
    }),
  update: async (id: string, data: Partial<Station>) => {
    const payload = { ...data }
    if ('position' in payload && payload.position) {
      payload.positionX = payload.position.x
      payload.positionY = payload.position.y
      delete payload.position
    }
    return request<Station>(`/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  delete: async (id: string) =>
    request<void>(`/stations/${id}`, { method: 'DELETE' }),
}

export const counterApi = {
  getAll: async () => request<Counter[]>('/counters'),
  getById: async (id: string) => request<Counter>(`/counters/${id}`),
  create: async (data: Omit<Counter, 'id' | 'createdAt'>) =>
    request<Counter>('/counters', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id: string, data: Partial<Counter>) =>
    request<Counter>(`/counters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (id: string) =>
    request<void>(`/counters/${id}`, { method: 'DELETE' }),
}

export const deviceApi = {
  getAll: async () => {
    const devices = await request<Device[]>('/devices')
    return devices.map(d => ({
      ...d,
      customData: typeof d.customData === 'string' ? JSON.parse(d.customData) : d.customData,
    }))
  },
  getById: async (id: string) => {
    const device = await request<Device>(`/devices/${id}`)
    return {
      ...device,
      customData: typeof device.customData === 'string' ? JSON.parse(device.customData) : device.customData,
    }
  },
  create: async (data: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: async (id: string, data: Partial<Device>) => {
    return request<Device>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  delete: async (id: string) =>
    request<void>(`/devices/${id}`, { method: 'DELETE' }),
  move: async (id: string, toStationId: string, toCounterId?: string, reason?: string) =>
    request<Device>(`/devices/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ toStationId, toCounterId, reason }),
    }),
  changeStatus: async (id: string, status: Device['status'], reason?: string) =>
    request<Device>(`/devices/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    }),
}

export const changeRecordApi = {
  getAll: async () => request<DeviceChangeRecord[]>('/change-records'),
}

export const paperRecordApi = {
  getAll: async () => request<PaperChangeRecord[]>('/paper-records'),
  create: async (data: Omit<PaperChangeRecord, 'id' | 'createdAt'>) =>
    request<PaperChangeRecord>('/paper-records', { method: 'POST', body: JSON.stringify(data) }),
}

export const consumableRecordApi = {
  getAll: async () => request<ConsumableRecord[]>('/consumable-records'),
  create: async (data: Omit<ConsumableRecord, 'id' | 'createdAt'>) =>
    request<ConsumableRecord>('/consumable-records', { method: 'POST', body: JSON.stringify(data) }),
}