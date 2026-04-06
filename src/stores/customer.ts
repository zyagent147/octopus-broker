import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

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
  isLoading: boolean
  isSyncing: boolean
  lastSyncTime: string | null
  syncError: string | null
  
  // 云端同步
  fetchFromCloud: () => Promise<void>
  syncToCloud: () => Promise<void>
  
  // 增删改查（同时操作本地和云端）
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'last_follow_time'>) => Promise<Customer>
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<Customer | null>
  deleteCustomer: (id: string) => Promise<boolean>
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

// 获取当前时间字符串
const getCurrentTime = () => {
  return new Date().toISOString()
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      isLoading: false,
      isSyncing: false,
      lastSyncTime: null,
      syncError: null,

      // 从云端获取数据
      fetchFromCloud: async () => {
        set({ isLoading: true, syncError: null })
        try {
          const res = await Network.request<{ data: Customer[] }>({
            url: '/api/customers',
            method: 'GET',
            showLoading: false,
          })
          
          // 解包响应数据
          const cloudCustomers = res?.data || []
          
          // 合并数据：云端数据优先，但保留本地新增且云端不存在的记录
          const localCustomers = get().customers
          
          // 找出本地有但云端没有的记录（可能是离线时创建的）
          const localOnlyCustomers = localCustomers.filter(c => 
            !cloudCustomers.some(cc => cc.id === c.id)
          )
          
          // 合并：云端数据 + 本地独有的离线数据
          const mergedCustomers = [...cloudCustomers, ...localOnlyCustomers]
          
          // 按创建时间倒序排列
          mergedCustomers.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          
          set({
            customers: mergedCustomers,
            isLoading: false,
            lastSyncTime: getCurrentTime(),
          })
          
          console.log(`[客户Store] 从云端同步 ${cloudCustomers.length} 条客户数据`)
        } catch (error: any) {
          console.error('[客户Store] 云端同步失败:', error)
          set({ 
            isLoading: false, 
            syncError: error.message 
          })
          // 失败时使用本地缓存
          Taro.showToast({ 
            title: '云端同步失败，使用本地数据', 
            icon: 'none' 
          })
        }
      },

      // 同步到云端
      syncToCloud: async () => {
        set({ isSyncing: true })
        try {
          // 重新从云端拉取最新数据
          await get().fetchFromCloud()
          set({ isSyncing: false })
        } catch (error) {
          set({ isSyncing: false })
        }
      },

      // 添加客户（同时操作本地和云端）
      addCustomer: async (customerData) => {
        const now = getCurrentTime()
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        
        // 先创建本地临时记录（乐观更新）
        const tempCustomer: Customer = {
          ...customerData,
          id: tempId,
          last_follow_time: null,
          created_at: now,
          updated_at: null,
        }
        
        set((state) => ({
          customers: [tempCustomer, ...state.customers],
        }))
        
        try {
          // 调用云端 API
          const res = await Network.request<{ data: Customer }>({
            url: '/api/customers',
            method: 'POST',
            data: customerData,
            showLoading: false,
          })
          
          const cloudCustomer = res?.data
          if (cloudCustomer) {
            // 用云端数据替换本地临时记录
            set((state) => ({
              customers: state.customers.map(c => 
                c.id === tempId ? cloudCustomer : c
              ),
            }))
            return cloudCustomer
          }
        } catch (error) {
          console.error('[客户Store] 添加客户到云端失败:', error)
          // 保留本地记录，标记为待同步
          Taro.showToast({ 
            title: '已保存到本地，网络恢复后自动同步', 
            icon: 'none' 
          })
        }
        
        return tempCustomer
      },

      // 更新客户
      updateCustomer: async (id, data) => {
        const now = getCurrentTime()
        let updatedCustomer: Customer | null = null
        
        // 先更新本地
        set((state) => ({
          customers: state.customers.map((customer) => {
            if (customer.id === id) {
              updatedCustomer = {
                ...customer,
                ...data,
                updated_at: now,
              }
              return updatedCustomer
            }
            return customer
          }),
        }))
        
        try {
          // 调用云端 API
          const res = await Network.request<{ data: Customer }>({
            url: `/api/customers/${id}`,
            method: 'PUT',
            data,
            showLoading: false,
          })
          
          const cloudCustomer = res?.data
          if (cloudCustomer) {
            // 用云端数据更新本地
            set((state) => ({
              customers: state.customers.map(c => 
                c.id === id ? cloudCustomer : c
              ),
            }))
            return cloudCustomer
          }
        } catch (error) {
          console.error('[客户Store] 更新客户到云端失败:', error)
        }
        
        return updatedCustomer
      },

      // 删除客户
      deleteCustomer: async (id) => {
        const prevLength = get().customers.length
        
        // 先删除本地
        set((state) => ({
          customers: state.customers.filter((customer) => customer.id !== id),
        }))
        
        try {
          // 调用云端 API
          await Network.request({
            url: `/api/customers/${id}`,
            method: 'DELETE',
            showLoading: false,
          })
        } catch (error) {
          console.error('[客户Store] 删除客户云端失败:', error)
        }
        
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
      clearAll: () => set({ customers: [], lastSyncTime: null }),
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
