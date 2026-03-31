import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'

// 客户数据类型
export interface Customer {
  id: string
  name: string
  phone: string | null
  budget: string | null
  status: 'pending' | 'following' | 'completed' | 'abandoned'
  contract_type: 'rent' | 'buy' | null
  contract_end_date: string | null
  birthday: string | null
  requirements: string | null
  last_follow_time: string | null
  reminder_days_contract: number
  reminder_days_birthday: number
  remark: string | null
  created_at: string
  updated_at: string | null
}

interface CustomerState {
  customers: Customer[]
  
  // 增删改查
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'last_follow_time'>) => Customer
  updateCustomer: (id: string, data: Partial<Customer>) => Customer | null
  deleteCustomer: (id: string) => boolean
  getCustomer: (id: string) => Customer | undefined
  
  // 查询方法
  getCustomersByStatus: (status: Customer['status']) => Customer[]
  getPendingCustomers: () => Customer[]
  getFollowingCustomers: () => Customer[]
  getCompletedCustomers: () => Customer[]
  searchCustomers: (keyword: string) => Customer[]
  
  // 跟进相关
  updateLastFollowTime: (id: string) => void
  
  // 统计
  getTotalCount: () => number
  getStatusCount: (status: Customer['status']) => number
  
  // 清空
  clearAll: () => void
}

// 生成唯一 ID
const generateId = () => {
  return `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 获取当前时间字符串
const getCurrentTime = () => {
  return new Date().toISOString()
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],

      // 添加客户
      addCustomer: (customerData) => {
        const now = getCurrentTime()
        const newCustomer: Customer = {
          ...customerData,
          id: generateId(),
          last_follow_time: null,
          created_at: now,
          updated_at: null,
        }
        
        set((state) => ({
          customers: [newCustomer, ...state.customers],
        }))
        
        return newCustomer
      },

      // 更新客户
      updateCustomer: (id, data) => {
        let updatedCustomer: Customer | null = null
        
        set((state) => ({
          customers: state.customers.map((customer) => {
            if (customer.id === id) {
              updatedCustomer = {
                ...customer,
                ...data,
                updated_at: getCurrentTime(),
              }
              return updatedCustomer
            }
            return customer
          }),
        }))
        
        return updatedCustomer
      },

      // 删除客户
      deleteCustomer: (id) => {
        const prevLength = get().customers.length
        set((state) => ({
          customers: state.customers.filter((customer) => customer.id !== id),
        }))
        return get().customers.length < prevLength
      },

      // 获取单个客户
      getCustomer: (id) => {
        return get().customers.find((customer) => customer.id === id)
      },

      // 按状态查询
      getCustomersByStatus: (status) => {
        return get().customers.filter((customer) => customer.status === status)
      },

      getPendingCustomers: () => get().getCustomersByStatus('pending'),
      getFollowingCustomers: () => get().getCustomersByStatus('following'),
      getCompletedCustomers: () => get().getCustomersByStatus('completed'),

      // 搜索客户
      searchCustomers: (keyword) => {
        const lowerKeyword = keyword.toLowerCase()
        return get().customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(lowerKeyword) ||
            (customer.phone && customer.phone.includes(keyword)) ||
            (customer.requirements && customer.requirements.toLowerCase().includes(lowerKeyword))
        )
      },

      // 更新最后跟进时间
      updateLastFollowTime: (id) => {
        set((state) => ({
          customers: state.customers.map((customer) => {
            if (customer.id === id) {
              return {
                ...customer,
                last_follow_time: getCurrentTime(),
                updated_at: getCurrentTime(),
              }
            }
            return customer
          }),
        }))
      },

      // 统计
      getTotalCount: () => get().customers.length,
      getStatusCount: (status) => get().getCustomersByStatus(status).length,

      // 清空
      clearAll: () => set({ customers: [] }),
    }),
    {
      name: 'octopus-broker-customers',
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
            console.error('存储客户数据失败:', e)
          }
        },
        removeItem: (name) => {
          try {
            Taro.removeStorageSync(name)
          } catch (e) {
            console.error('删除客户数据失败:', e)
          }
        },
      })),
    }
  )
)
