import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'

// 应收账单数据类型
export interface RentBill {
  id: string
  property_id: string
  tenant_name: string | null
  tenant_phone: string | null
  amount: number
  payment_cycle: 'monthly' | 'quarterly' | 'custom'
  custom_days: number | null
  bill_date: number // 每月几号出账单
  next_due_date: string // 下次收款日期
  status: 'pending' | 'paid' | 'overdue'
  paid_at: string | null
  remark: string | null
  created_at: string
  updated_at: string | null
}

interface RentBillState {
  bills: RentBill[]
  
  // 增删改查
  addBill: (bill: Omit<RentBill, 'id' | 'created_at' | 'updated_at' | 'next_due_date'>) => RentBill
  updateBill: (id: string, data: Partial<RentBill>) => RentBill | null
  deleteBill: (id: string) => boolean
  getBill: (id: string) => RentBill | undefined
  
  // 查询方法
  getBillsByProperty: (propertyId: string) => RentBill[]
  getPendingBills: () => RentBill[]
  getOverdueBills: () => RentBill[]
  getUpcomingBills: (days: number) => RentBill[]
  
  // 操作
  markAsPaid: (id: string) => RentBill | null
  
  // 统计
  getTotalPendingAmount: () => number
  getTotalOverdueAmount: () => number
  
  // 清空
  clearAll: () => void
}

// 生成唯一 ID
const generateId = () => {
  return `bill_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 获取当前时间字符串
const getCurrentTime = () => {
  return new Date().toISOString()
}

// 计算下次收款日期
export const calculateNextDueDate = (billDate: number, cycle: 'monthly' | 'quarterly' | 'custom', customDays?: number | null): string => {
  const now = new Date()
  let nextDate = new Date()
  
  // 设置为本月的账单日
  nextDate.setDate(billDate)
  nextDate.setHours(0, 0, 0, 0)
  
  // 如果本月的账单日已过，则计算下个月
  if (nextDate <= now) {
    if (cycle === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1)
    } else if (cycle === 'quarterly') {
      nextDate.setMonth(nextDate.getMonth() + 3)
    } else if (cycle === 'custom' && customDays) {
      nextDate.setDate(nextDate.getDate() + customDays)
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1)
    }
  }
  
  return nextDate.toISOString().split('T')[0]
}

export const useRentBillStore = create<RentBillState>()(
  persist(
    (set, get) => ({
      bills: [],

      // 添加账单
      addBill: (billData) => {
        const now = getCurrentTime()
        const nextDueDate = calculateNextDueDate(
          billData.bill_date, 
          billData.payment_cycle, 
          billData.custom_days
        )
        
        const newBill: RentBill = {
          ...billData,
          next_due_date: nextDueDate,
          id: generateId(),
          created_at: now,
          updated_at: now,
        }
        
        set((state) => ({
          bills: [...state.bills, newBill]
        }))
        
        return newBill
      },

      // 更新账单
      updateBill: (id, data) => {
        let updatedBill: RentBill | null = null
        
        set((state) => ({
          bills: state.bills.map(b => {
            if (b.id === id) {
              // 如果更新了账单日或付款周期，重新计算下次收款日期
              const billDate = data.bill_date ?? b.bill_date
              const cycle = data.payment_cycle ?? b.payment_cycle
              const customDays = data.custom_days ?? b.custom_days
              
              updatedBill = { 
                ...b, 
                ...data, 
                next_due_date: calculateNextDueDate(billDate, cycle, customDays),
                updated_at: getCurrentTime() 
              }
              return updatedBill
            }
            return b
          })
        }))
        
        return updatedBill
      },

      // 删除账单
      deleteBill: (id) => {
        const prevLength = get().bills.length
        
        set((state) => ({
          bills: state.bills.filter(b => b.id !== id)
        }))
        
        return get().bills.length < prevLength
      },

      // 获取单个账单
      getBill: (id) => {
        return get().bills.find(b => b.id === id)
      },

      // 按房源查询
      getBillsByProperty: (propertyId) => {
        return get().bills.filter(b => b.property_id === propertyId)
      },

      // 获取待收款账单
      getPendingBills: () => {
        return get().bills.filter(b => b.status === 'pending')
      },

      // 获取逾期账单
      getOverdueBills: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().bills.filter(b => b.status === 'pending' && b.next_due_date < today)
      },

      // 获取即将到期的账单
      getUpcomingBills: (days) => {
        const today = new Date()
        const futureDate = new Date(today)
        futureDate.setDate(futureDate.getDate() + days)
        
        const todayStr = today.toISOString().split('T')[0]
        const futureStr = futureDate.toISOString().split('T')[0]
        
        return get().bills.filter(b => 
          b.status === 'pending' && 
          b.next_due_date >= todayStr && 
          b.next_due_date <= futureStr
        )
      },

      // 标记为已收款
      markAsPaid: (id) => {
        let updatedBill: RentBill | null = null
        const now = getCurrentTime()
        
        set((state) => ({
          bills: state.bills.map(b => {
            if (b.id === id) {
              updatedBill = { 
                ...b, 
                status: 'paid' as const,
                paid_at: now,
                updated_at: now,
                // 计算下次收款日期
                next_due_date: calculateNextDueDate(b.bill_date, b.payment_cycle, b.custom_days),
              }
              return updatedBill
            }
            return b
          })
        }))
        
        return updatedBill
      },

      // 获取待收款总额
      getTotalPendingAmount: () => {
        return get().bills
          .filter(b => b.status === 'pending')
          .reduce((sum, b) => sum + b.amount, 0)
      },

      // 获取逾期总额
      getTotalOverdueAmount: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().bills
          .filter(b => b.status === 'pending' && b.next_due_date < today)
          .reduce((sum, b) => sum + b.amount, 0)
      },

      // 清空所有
      clearAll: () => {
        set({ bills: [] })
      },
    }),
    {
      name: 'rent-bill-storage',
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
            console.error('账单存储失败', e)
          }
        },
        removeItem: (name) => {
          try {
            Taro.removeStorageSync(name)
          } catch (e) {
            console.error('删除账单存储失败', e)
          }
        },
      })),
    }
  )
)

// 导出便捷方法
export const rentBillService = {
  add: (data: Omit<RentBill, 'id' | 'created_at' | 'updated_at' | 'next_due_date'>) => 
    useRentBillStore.getState().addBill(data),
  
  update: (id: string, data: Partial<RentBill>) => 
    useRentBillStore.getState().updateBill(id, data),
  
  delete: (id: string) => 
    useRentBillStore.getState().deleteBill(id),
  
  get: (id: string) => 
    useRentBillStore.getState().getBill(id),
  
  getByProperty: (propertyId: string) => 
    useRentBillStore.getState().getBillsByProperty(propertyId),
  
  markPaid: (id: string) => 
    useRentBillStore.getState().markAsPaid(id),
}
