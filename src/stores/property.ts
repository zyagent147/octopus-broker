import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'

// 房源数据类型
export interface Property {
  id: string
  community: string
  building: string | null
  address: string
  layout: string | null
  area: number | null
  price: number | null
  status: 'available' | 'rented' | 'sold'
  images: string[]
  remark: string | null
  created_at: string
  updated_at: string | null
}

interface PropertyState {
  properties: Property[]
  
  // 增删改查
  addProperty: (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => Property
  updateProperty: (id: string, data: Partial<Property>) => Property | null
  deleteProperty: (id: string) => boolean
  getProperty: (id: string) => Property | undefined
  
  // 查询方法
  getPropertiesByStatus: (status: Property['status']) => Property[]
  getAvailableProperties: () => Property[]
  getRentedProperties: () => Property[]
  searchProperties: (keyword: string) => Property[]
  
  // 统计
  getTotalCount: () => number
  getStatusCount: (status: Property['status']) => number
  
  // 清空
  clearAll: () => void
}

// 生成唯一 ID
const generateId = () => {
  return `prop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 获取当前时间字符串
const getCurrentTime = () => {
  return new Date().toISOString()
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      properties: [],

      // 添加房源
      addProperty: (propertyData) => {
        const now = getCurrentTime()
        const newProperty: Property = {
          ...propertyData,
          id: generateId(),
          created_at: now,
          updated_at: now,
        }
        
        set((state) => ({
          properties: [...state.properties, newProperty]
        }))
        
        return newProperty
      },

      // 更新房源
      updateProperty: (id, data) => {
        let updatedProperty: Property | null = null
        
        set((state) => ({
          properties: state.properties.map(p => {
            if (p.id === id) {
              updatedProperty = { 
                ...p, 
                ...data, 
                updated_at: getCurrentTime() 
              }
              return updatedProperty
            }
            return p
          })
        }))
        
        return updatedProperty
      },

      // 删除房源
      deleteProperty: (id) => {
        const prevLength = get().properties.length
        
        set((state) => ({
          properties: state.properties.filter(p => p.id !== id)
        }))
        
        return get().properties.length < prevLength
      },

      // 获取单个房源
      getProperty: (id) => {
        return get().properties.find(p => p.id === id)
      },

      // 按状态查询
      getPropertiesByStatus: (status) => {
        return get().properties.filter(p => p.status === status)
      },

      // 获取空置房源
      getAvailableProperties: () => {
        return get().properties.filter(p => p.status === 'available')
      },

      // 获取已租房源
      getRentedProperties: () => {
        return get().properties.filter(p => p.status === 'rented')
      },

      // 搜索房源
      searchProperties: (keyword) => {
        const lowerKeyword = keyword.toLowerCase()
        return get().properties.filter(p => 
          p.community.toLowerCase().includes(lowerKeyword) ||
          p.address.toLowerCase().includes(lowerKeyword) ||
          (p.building && p.building.toLowerCase().includes(lowerKeyword))
        )
      },

      // 获取总数
      getTotalCount: () => {
        return get().properties.length
      },

      // 获取状态统计
      getStatusCount: (status) => {
        return get().properties.filter(p => p.status === status).length
      },

      // 清空所有
      clearAll: () => {
        set({ properties: [] })
      },
    }),
    {
      name: 'property-storage',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return Taro.getStorageSync(name)
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          try {
            Taro.setStorageSync(name, value)
          } catch (e) {
            console.error('房源存储失败', e)
          }
        },
        removeItem: (name) => {
          try {
            Taro.removeStorageSync(name)
          } catch (e) {
            console.error('删除房源存储失败', e)
          }
        },
      })),
    }
  )
)

// 导出便捷方法
export const propertyService = {
  add: (data: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => 
    usePropertyStore.getState().addProperty(data),
  
  update: (id: string, data: Partial<Property>) => 
    usePropertyStore.getState().updateProperty(id, data),
  
  delete: (id: string) => 
    usePropertyStore.getState().deleteProperty(id),
  
  get: (id: string) => 
    usePropertyStore.getState().getProperty(id),
  
  getAll: () => 
    usePropertyStore.getState().properties,
  
  getByStatus: (status: Property['status']) => 
    usePropertyStore.getState().getPropertiesByStatus(status),
  
  search: (keyword: string) => 
    usePropertyStore.getState().searchProperties(keyword),
}
