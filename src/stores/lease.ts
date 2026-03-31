import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'

// 付款方式
export type PaymentMethod = 'monthly' | 'quarterly' | 'semiannual' | 'annual'

// 付款方式配置
export const paymentMethodConfig: Record<PaymentMethod, { label: string; months: number }> = {
  monthly: { label: '月付', months: 1 },
  quarterly: { label: '季付', months: 3 },
  semiannual: { label: '半年付', months: 6 },
  annual: { label: '年付', months: 12 },
}

// 租约数据类型
export interface Lease {
  id: string
  property_id: string // 关联房源ID
  
  // 业主信息
  landlord_name: string
  landlord_phone: string
  
  // 租客信息
  tenant_name: string
  tenant_phone: string
  
  // 租约规则
  monthly_rent: number // 月租金
  payment_method: PaymentMethod // 付款方式
  start_date: string // 租约开始时间（即首期付款日期）
  end_date: string // 租约结束时间
  
  // 提醒设置
  reminder_days: number // 提前提醒天数（1-15，默认3）
  
  // 状态
  status: 'active' | 'ended' // 有效/已结束
  
  // 时间戳
  created_at: string
  updated_at: string | null
}

interface LeaseState {
  leases: Lease[]
  
  // 增删改查
  addLease: (lease: Omit<Lease, 'id' | 'created_at' | 'updated_at' | 'status'>) => Lease
  updateLease: (id: string, data: Partial<Lease>) => Lease | null
  deleteLease: (id: string) => boolean
  getLease: (id: string) => Lease | undefined
  getLeaseByProperty: (propertyId: string) => Lease | undefined
  
  // 状态管理
  endLease: (id: string) => Lease | null
  reactivateLease: (id: string) => Lease | null
  
  // 查询
  getActiveLeases: () => Lease[]
  getEndedLeases: () => Lease[]
  
  // 统计
  getTotalActiveLeases: () => number
  getTotalMonthlyRent: () => number
  
  // 清空
  clearAll: () => void
}

// 生成唯一 ID
const generateId = () => {
  return `lease_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 获取当前时间字符串
const getCurrentTime = () => {
  return new Date().toISOString()
}

// 判断租约是否有效
const isLeaseActive = (lease: Lease): boolean => {
  const today = new Date().toISOString().split('T')[0]
  return lease.end_date >= today
}

// 计算租约总期数
export const calculateTotalPeriods = (startDate: string, endDate: string, paymentMethod: PaymentMethod): number => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const months = paymentMethodConfig[paymentMethod].months
  
  // 计算总月数
  const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
  
  // 计算期数（向上取整）
  return Math.ceil(totalMonths / months)
}

// 计算每期金额
export const calculatePeriodAmount = (monthlyRent: number, paymentMethod: PaymentMethod): number => {
  const months = paymentMethodConfig[paymentMethod].months
  return monthlyRent * months
}

export const useLeaseStore = create<LeaseState>()(
  persist(
    (set, get) => ({
      leases: [],

      // 添加租约
      addLease: (leaseData) => {
        const now = getCurrentTime()
        const newLease: Lease = {
          ...leaseData,
          status: 'active',
          id: generateId(),
          created_at: now,
          updated_at: now,
        }
        
        set((state) => ({
          leases: [...state.leases, newLease]
        }))
        
        return newLease
      },

      // 更新租约
      updateLease: (id, data) => {
        let updatedLease: Lease | null = null
        
        set((state) => ({
          leases: state.leases.map(l => {
            if (l.id === id) {
              updatedLease = { 
                ...l, 
                ...data, 
                status: isLeaseActive({ ...l, ...data }) ? 'active' : 'ended',
                updated_at: getCurrentTime() 
              }
              return updatedLease
            }
            return l
          })
        }))
        
        return updatedLease
      },

      // 删除租约
      deleteLease: (id) => {
        const prevLength = get().leases.length
        
        set((state) => ({
          leases: state.leases.filter(l => l.id !== id)
        }))
        
        return get().leases.length < prevLength
      },

      // 获取单个租约
      getLease: (id) => {
        return get().leases.find(l => l.id === id)
      },

      // 根据房源获取租约
      getLeaseByProperty: (propertyId) => {
        return get().leases.find(l => l.property_id === propertyId && l.status === 'active')
      },

      // 结束租约
      endLease: (id) => {
        let updatedLease: Lease | null = null
        
        set((state) => ({
          leases: state.leases.map(l => {
            if (l.id === id) {
              updatedLease = { 
                ...l, 
                status: 'ended' as const,
                updated_at: getCurrentTime() 
              }
              return updatedLease
            }
            return l
          })
        }))
        
        return updatedLease
      },

      // 重新激活租约
      reactivateLease: (id) => {
        let updatedLease: Lease | null = null
        
        set((state) => ({
          leases: state.leases.map(l => {
            if (l.id === id) {
              updatedLease = { 
                ...l, 
                status: 'active' as const,
                updated_at: getCurrentTime() 
              }
              return updatedLease
            }
            return l
          })
        }))
        
        return updatedLease
      },

      // 获取有效租约
      getActiveLeases: () => {
        return get().leases.filter(l => l.status === 'active')
      },

      // 获取已结束租约
      getEndedLeases: () => {
        return get().leases.filter(l => l.status === 'ended')
      },

      // 获取有效租约数量
      getTotalActiveLeases: () => {
        return get().leases.filter(l => l.status === 'active').length
      },

      // 获取月租金总额
      getTotalMonthlyRent: () => {
        return get().leases
          .filter(l => l.status === 'active')
          .reduce((sum, l) => sum + l.monthly_rent, 0)
      },

      // 清空所有
      clearAll: () => {
        set({ leases: [] })
      },
    }),
    {
      name: 'lease-storage',
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
            console.error('租约存储失败', e)
          }
        },
        removeItem: (name) => {
          try {
            Taro.removeStorageSync(name)
          } catch (e) {
            console.error('删除租约存储失败', e)
          }
        },
      })),
    }
  )
)

// 导出便捷方法
export const leaseService = {
  add: (data: Omit<Lease, 'id' | 'created_at' | 'updated_at' | 'status'>) => 
    useLeaseStore.getState().addLease(data),
  
  update: (id: string, data: Partial<Lease>) => 
    useLeaseStore.getState().updateLease(id, data),
  
  delete: (id: string) => 
    useLeaseStore.getState().deleteLease(id),
  
  get: (id: string) => 
    useLeaseStore.getState().getLease(id),
  
  getByProperty: (propertyId: string) => 
    useLeaseStore.getState().getLeaseByProperty(propertyId),
}
