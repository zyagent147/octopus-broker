import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import { Lease } from './lease'

// 月度账单数据类型
export interface MonthlyBill {
  id: string
  lease_id: string // 关联租约ID
  property_id: string // 关联房源ID
  
  // 账单信息
  bill_month: string // 账单月份 (YYYY-MM)
  due_date: string // 应收日期 (YYYY-MM-DD)
  amount: number // 应收金额
  
  // 状态
  status: 'pending' | 'paid' // 待收租/已收租
  
  // 收款记录
  paid_at: string | null // 实际收款时间
  paid_amount: number | null // 实际收款金额（可能与应收费不同）
  remark: string | null // 备注
  
  // 时间戳
  created_at: string
  updated_at: string | null
}

interface MonthlyBillState {
  bills: MonthlyBill[]
  
  // 增删改查
  addBill: (bill: Omit<MonthlyBill, 'id' | 'created_at' | 'updated_at'>) => MonthlyBill
  updateBill: (id: string, data: Partial<MonthlyBill>) => MonthlyBill | null
  deleteBill: (id: string) => boolean
  getBill: (id: string) => MonthlyBill | undefined
  
  // 批量生成
  generateBillsForLease: (lease: Lease) => MonthlyBill[]
  
  // 查询
  getBillsByLease: (leaseId: string) => MonthlyBill[]
  getBillsByProperty: (propertyId: string) => MonthlyBill[]
  getPendingBills: () => MonthlyBill[]
  getOverdueBills: () => MonthlyBill[]
  getUpcomingBills: (days: number) => MonthlyBill[]
  
  // 操作
  markAsPaid: (id: string, paidAmount?: number, remark?: string) => MonthlyBill | null
  markAsUnpaid: (id: string) => MonthlyBill | null
  
  // 统计
  getTotalPendingAmount: () => number
  getTotalOverdueAmount: () => number
  getMonthlyIncome: () => number
  
  // 清空
  clearAll: () => void
}

// 生成唯一 ID
const generateId = () => {
  return `mbill_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 获取当前时间字符串
const getCurrentTime = () => {
  return new Date().toISOString()
}

// 根据租约生成账单月份列表
const generateBillMonths = (startDate: string, endDate: string): string[] => {
  const months: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  let current = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
  
  while (current <= endMonth) {
    months.push(current.toISOString().slice(0, 7))
    current.setMonth(current.getMonth() + 1)
  }
  
  return months
}

// 根据账单月份和交租日生成应收日期
const generateDueDate = (billMonth: string, paymentDay: number): string => {
  const [year, month] = billMonth.split('-').map(Number)
  const day = Math.min(paymentDay, 28) // 确保日期有效
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// 判断账单是否逾期
export const isBillOverdue = (bill: MonthlyBill): boolean => {
  if (bill.status === 'paid') return false
  const today = new Date().toISOString().split('T')[0]
  return bill.due_date < today
}

// 获取距离收款日的天数
export const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export const useMonthlyBillStore = create<MonthlyBillState>()(
  persist(
    (set, get) => ({
      bills: [],

      // 添加账单
      addBill: (billData) => {
        const now = getCurrentTime()
        const newBill: MonthlyBill = {
          ...billData,
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
        let updatedBill: MonthlyBill | null = null
        
        set((state) => ({
          bills: state.bills.map(b => {
            if (b.id === id) {
              updatedBill = { 
                ...b, 
                ...data, 
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

      // 根据租约生成账单
      generateBillsForLease: (lease) => {
        const months = generateBillMonths(lease.start_date, lease.end_date)
        const generatedBills: MonthlyBill[] = []
        
        for (const month of months) {
          // 检查是否已存在该月份的账单
          const exists = get().bills.some(
            b => b.lease_id === lease.id && b.bill_month === month
          )
          
          if (!exists) {
            const bill = get().addBill({
              lease_id: lease.id,
              property_id: lease.property_id,
              bill_month: month,
              due_date: generateDueDate(month, lease.payment_day),
              amount: lease.monthly_rent,
              status: 'pending',
              paid_at: null,
              paid_amount: null,
              remark: null,
            })
            generatedBills.push(bill)
          }
        }
        
        return generatedBills
      },

      // 根据租约查询账单
      getBillsByLease: (leaseId) => {
        return get().bills.filter(b => b.lease_id === leaseId)
      },

      // 根据房源查询账单
      getBillsByProperty: (propertyId) => {
        return get().bills.filter(b => b.property_id === propertyId)
      },

      // 获取待收租账单
      getPendingBills: () => {
        return get().bills.filter(b => b.status === 'pending')
      },

      // 获取逾期账单
      getOverdueBills: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().bills.filter(b => b.status === 'pending' && b.due_date < today)
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
          b.due_date >= todayStr && 
          b.due_date <= futureStr
        )
      },

      // 标记为已收款
      markAsPaid: (id, paidAmount, remark) => {
        let updatedBill: MonthlyBill | null = null
        const now = getCurrentTime()
        
        set((state) => ({
          bills: state.bills.map(b => {
            if (b.id === id) {
              updatedBill = { 
                ...b, 
                status: 'paid' as const,
                paid_at: now,
                paid_amount: paidAmount ?? b.amount,
                remark: remark ?? null,
                updated_at: now,
              }
              return updatedBill
            }
            return b
          })
        }))
        
        return updatedBill
      },

      // 标记为未收款
      markAsUnpaid: (id) => {
        let updatedBill: MonthlyBill | null = null
        
        set((state) => ({
          bills: state.bills.map(b => {
            if (b.id === id) {
              updatedBill = { 
                ...b, 
                status: 'pending' as const,
                paid_at: null,
                paid_amount: null,
                remark: null,
                updated_at: getCurrentTime(),
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
          .filter(b => b.status === 'pending' && b.due_date < today)
          .reduce((sum, b) => sum + b.amount, 0)
      },

      // 获取本月预期收入
      getMonthlyIncome: () => {
        const currentMonth = new Date().toISOString().slice(0, 7)
        return get().bills
          .filter(b => b.bill_month === currentMonth)
          .reduce((sum, b) => sum + b.amount, 0)
      },

      // 清空所有
      clearAll: () => {
        set({ bills: [] })
      },
    }),
    {
      name: 'monthly-bill-storage',
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
            console.error('月度账单存储失败', e)
          }
        },
        removeItem: (name) => {
          try {
            Taro.removeStorageSync(name)
          } catch (e) {
            console.error('删除月度账单存储失败', e)
          }
        },
      })),
    }
  )
)

// 导出便捷方法
export const monthlyBillService = {
  add: (data: Omit<MonthlyBill, 'id' | 'created_at' | 'updated_at'>) => 
    useMonthlyBillStore.getState().addBill(data),
  
  update: (id: string, data: Partial<MonthlyBill>) => 
    useMonthlyBillStore.getState().updateBill(id, data),
  
  delete: (id: string) => 
    useMonthlyBillStore.getState().deleteBill(id),
  
  get: (id: string) => 
    useMonthlyBillStore.getState().getBill(id),
  
  getByLease: (leaseId: string) => 
    useMonthlyBillStore.getState().getBillsByLease(leaseId),
  
  getByProperty: (propertyId: string) => 
    useMonthlyBillStore.getState().getBillsByProperty(propertyId),
  
  markPaid: (id: string, paidAmount?: number, remark?: string) => 
    useMonthlyBillStore.getState().markAsPaid(id, paidAmount, remark),
  
  generateForLease: (lease: Lease) =>
    useMonthlyBillStore.getState().generateBillsForLease(lease),
}
