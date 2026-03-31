import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'

// 收款历史记录
export interface PaymentRecord {
  id: string
  bill_id: string
  amount: number
  paid_at: string
  period_start: string // 本次收款周期起始
  period_end: string // 本次收款周期结束
  remark: string | null
  created_at: string
}

// 应收账单数据类型
export interface RentBill {
  id: string
  property_id: string
  tenant_name: string | null
  tenant_phone: string | null
  amount: number
  payment_cycle: 'monthly' | 'quarterly' | 'custom'
  custom_days: number | null
  start_date: string // 账单开始日期（租约起始日期）
  bill_date: number // 每月几号出账单
  next_due_date: string // 下次收款日期
  last_paid_date: string | null // 上次收款日期
  status: 'pending' | 'paid' | 'overdue'
  remark: string | null
  created_at: string
  updated_at: string | null
}

interface RentBillState {
  bills: RentBill[]
  paymentHistory: PaymentRecord[]
  
  // 增删改查
  addBill: (bill: Omit<RentBill, 'id' | 'created_at' | 'updated_at' | 'next_due_date' | 'last_paid_date'>) => RentBill
  updateBill: (id: string, data: Partial<RentBill>) => RentBill | null
  deleteBill: (id: string) => boolean
  getBill: (id: string) => RentBill | undefined
  
  // 查询方法（不在 selector 中调用，仅用于外部调用）
  getBillsByProperty: (propertyId: string) => RentBill[]
  getPendingBills: () => RentBill[]
  getOverdueBills: () => RentBill[]
  getUpcomingBills: (days: number) => RentBill[]
  
  // 操作
  markAsPaid: (id: string, remark?: string) => { bill: RentBill; payment: PaymentRecord } | null
  
  // 统计
  getTotalPendingAmount: () => number
  getTotalOverdueAmount: () => number
  getMonthlyIncome: () => number
  
  // 收款历史
  getPaymentHistory: (billId: string) => PaymentRecord[]
  
  // 清空
  clearAll: () => void
}

// 生成唯一 ID
const generateId = () => {
  return `bill_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

const generatePaymentId = () => {
  return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 获取当前时间字符串
const getCurrentTime = () => {
  return new Date().toISOString()
}

// 获取今天的日期字符串 (YYYY-MM-DD)
const getTodayStr = () => {
  return new Date().toISOString().split('T')[0]
}

// 计算下次收款日期
export const calculateNextDueDate = (
  startDate: string,
  billDate: number,
  cycle: 'monthly' | 'quarterly' | 'custom',
  customDays?: number | null,
  lastPaidDate?: string | null
): string => {
  const today = getTodayStr()
  const start = new Date(startDate)
  
  // 如果有上次收款日期，基于上次收款日期计算
  const baseDate = lastPaidDate ? new Date(lastPaidDate) : start
  
  // 计算第一个收款日期
  let nextDate = new Date(baseDate)
  
  // 设置为本月的账单日
  nextDate.setDate(billDate)
  nextDate.setHours(0, 0, 0, 0)
  
  // 如果账单日小于起始日的日，或者基于起始日计算时已过本月账单日，则从下个月开始
  if (nextDate <= start || nextDate < new Date(today)) {
    // 如果已过本月账单日，计算下一个周期
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
  
  // 确保下次收款日期在未来
  while (nextDate < new Date(today)) {
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

// 计算账单状态
export const calculateBillStatus = (bill: RentBill): 'pending' | 'paid' | 'overdue' => {
  const today = getTodayStr()
  if (bill.next_due_date < today) {
    return 'overdue'
  }
  return 'pending'
}

// 计算收款周期
export const calculatePaymentPeriod = (
  dueDate: string,
  cycle: 'monthly' | 'quarterly' | 'custom',
  customDays?: number | null
): { start: string; end: string } => {
  const end = new Date(dueDate)
  const start = new Date(end)
  
  if (cycle === 'monthly') {
    start.setMonth(start.getMonth() - 1)
  } else if (cycle === 'quarterly') {
    start.setMonth(start.getMonth() - 3)
  } else if (cycle === 'custom' && customDays) {
    start.setDate(start.getDate() - customDays)
  } else {
    start.setMonth(start.getMonth() - 1)
  }
  
  // 调整起始日为周期开始日的下一天
  start.setDate(start.getDate() + 1)
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

// 获取付款周期显示文本
export const getPaymentCycleText = (cycle: 'monthly' | 'quarterly' | 'custom', customDays?: number | null): string => {
  switch (cycle) {
    case 'monthly':
      return '月付'
    case 'quarterly':
      return '季付'
    case 'custom':
      return customDays ? `每${customDays}天` : '自定义'
    default:
      return '月付'
  }
}

export const useRentBillStore = create<RentBillState>()(
  persist(
    (set, get) => ({
      bills: [],
      paymentHistory: [],

      // 添加账单
      addBill: (billData) => {
        const now = getCurrentTime()
        const nextDueDate = calculateNextDueDate(
          billData.start_date,
          billData.bill_date, 
          billData.payment_cycle, 
          billData.custom_days
        )
        
        const newBill: RentBill = {
          ...billData,
          next_due_date: nextDueDate,
          last_paid_date: null,
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
              // 如果更新了关键信息，重新计算下次收款日期
              const startDate = data.start_date ?? b.start_date
              const billDate = data.bill_date ?? b.bill_date
              const cycle = data.payment_cycle ?? b.payment_cycle
              const customDays = data.custom_days ?? b.custom_days
              
              updatedBill = { 
                ...b, 
                ...data, 
                next_due_date: calculateNextDueDate(startDate, billDate, cycle, customDays, b.last_paid_date),
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
          bills: state.bills.filter(b => b.id !== id),
          paymentHistory: state.paymentHistory.filter(p => p.bill_id !== id)
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
        return get().bills.filter(b => b.status === 'pending' || b.status === 'overdue')
      },

      // 获取逾期账单
      getOverdueBills: () => {
        const today = getTodayStr()
        return get().bills.filter(b => b.next_due_date < today && b.status !== 'paid')
      },

      // 获取即将到期的账单
      getUpcomingBills: (days) => {
        const today = new Date()
        const futureDate = new Date(today)
        futureDate.setDate(futureDate.getDate() + days)
        
        const todayStr = today.toISOString().split('T')[0]
        const futureStr = futureDate.toISOString().split('T')[0]
        
        return get().bills.filter(b => 
          b.next_due_date >= todayStr && 
          b.next_due_date <= futureStr
        )
      },

      // 标记为已收款
      markAsPaid: (id, remark) => {
        const bill = get().getBill(id)
        if (!bill) return null
        
        const now = getCurrentTime()
        const today = getTodayStr()
        
        // 计算本次收款周期
        const period = calculatePaymentPeriod(
          bill.next_due_date,
          bill.payment_cycle,
          bill.custom_days
        )
        
        // 创建收款记录
        const payment: PaymentRecord = {
          id: generatePaymentId(),
          bill_id: id,
          amount: bill.amount,
          paid_at: now,
          period_start: period.start,
          period_end: period.end,
          remark: remark || null,
          created_at: now,
        }
        
        // 计算下次收款日期
        const nextDueDate = calculateNextDueDate(
          bill.start_date,
          bill.bill_date,
          bill.payment_cycle,
          bill.custom_days,
          today
        )
        
        let updatedBill: RentBill | null = null
        
        set((state) => ({
          bills: state.bills.map(b => {
            if (b.id === id) {
              updatedBill = { 
                ...b, 
                status: 'paid' as const,
                last_paid_date: today,
                next_due_date: nextDueDate,
                updated_at: now,
              }
              return updatedBill
            }
            return b
          }),
          paymentHistory: [payment, ...state.paymentHistory]
        }))
        
        return updatedBill ? { bill: updatedBill, payment } : null
      },

      // 获取待收款总额
      getTotalPendingAmount: () => {
        const today = getTodayStr()
        return get().bills
          .filter(b => b.next_due_date >= today || b.status === 'pending')
          .reduce((sum, b) => sum + b.amount, 0)
      },

      // 获取逾期总额
      getTotalOverdueAmount: () => {
        const today = getTodayStr()
        return get().bills
          .filter(b => b.next_due_date < today && b.status !== 'paid')
          .reduce((sum, b) => sum + b.amount, 0)
      },

      // 获取本月预期收入（仅统计当月应收）
      getMonthlyIncome: () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = today.getMonth()
        const monthStart = new Date(year, month, 1).toISOString().split('T')[0]
        const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0]
        
        return get().bills
          .filter(b => b.next_due_date >= monthStart && b.next_due_date <= monthEnd)
          .reduce((sum, b) => sum + b.amount, 0)
      },

      // 获取收款历史
      getPaymentHistory: (billId) => {
        return get().paymentHistory.filter(p => p.bill_id === billId)
      },

      // 清空所有
      clearAll: () => {
        set({ bills: [], paymentHistory: [] })
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
  add: (data: Omit<RentBill, 'id' | 'created_at' | 'updated_at' | 'next_due_date' | 'last_paid_date'>) => 
    useRentBillStore.getState().addBill(data),
  
  update: (id: string, data: Partial<RentBill>) => 
    useRentBillStore.getState().updateBill(id, data),
  
  delete: (id: string) => 
    useRentBillStore.getState().deleteBill(id),
  
  get: (id: string) => 
    useRentBillStore.getState().getBill(id),
  
  getByProperty: (propertyId: string) => 
    useRentBillStore.getState().getBillsByProperty(propertyId),
  
  markPaid: (id: string, remark?: string) => 
    useRentBillStore.getState().markAsPaid(id, remark),
  
  getPaymentHistory: (billId: string) =>
    useRentBillStore.getState().getPaymentHistory(billId),
}
