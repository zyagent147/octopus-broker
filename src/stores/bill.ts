import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import { Lease, paymentMethodConfig, PaymentMethod } from './lease'

// 账单数据类型
export interface Bill {
  id: string
  lease_id: string // 关联租约ID
  property_id: string // 关联房源ID
  
  // 账单信息
  period_index: number // 第几期（从1开始）
  period_start: string // 本期开始日期
  period_end: string // 本期结束日期
  due_date: string // 应收日期
  amount: number // 本期金额
  
  // 状态
  status: 'pending' | 'paid' // 待收租/已收租
  
  // 收款记录
  paid_at: string | null // 实际收款时间
  paid_amount: number | null // 实际收款金额
  remark: string | null // 备注
  
  // 时间戳
  created_at: string
  updated_at: string | null
}

interface BillState {
  bills: Bill[]
  
  // 增删改查
  addBill: (bill: Omit<Bill, 'id' | 'created_at' | 'updated_at'>) => Bill
  updateBill: (id: string, data: Partial<Bill>) => Bill | null
  deleteBill: (id: string) => boolean
  getBill: (id: string) => Bill | undefined
  
  // 批量生成
  generateBillsForLease: (lease: Lease) => Bill[]
  
  // 查询
  getBillsByLease: (leaseId: string) => Bill[]
  getBillsByProperty: (propertyId: string) => Bill[]
  getPendingBills: () => Bill[]
  getOverdueBills: () => Bill[]
  getUpcomingBills: (days: number) => Bill[]
  
  // 操作
  markAsPaid: (id: string, paidAmount?: number, remark?: string) => Bill | null
  markAsUnpaid: (id: string) => Bill | null
  
  // 统计
  getTotalPendingAmount: () => number
  getTotalOverdueAmount: () => number
  getMonthlyIncome: () => number
  
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

// 计算某日期N个月后的日期
const addMonths = (dateStr: string, months: number): string => {
  const date = new Date(dateStr)
  date.setMonth(date.getMonth() + months)
  // 如果目标月份没有对应的日期（如1月31日+1个月），会自动调整到下个月最后一天
  return date.toISOString().split('T')[0]
}

// 计算某日期N个月后的前一天（用于计算周期结束日期）
const addMonthsMinusOneDay = (dateStr: string, months: number): string => {
  const date = new Date(dateStr)
  date.setMonth(date.getMonth() + months)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}

// 判断账单是否逾期
export const isBillOverdue = (bill: Bill): boolean => {
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

// 根据租约生成账单
const generateBillsFromLease = (lease: Lease): Omit<Bill, 'id' | 'created_at' | 'updated_at'>[] => {
  const bills: Omit<Bill, 'id' | 'created_at' | 'updated_at'>[] = []
  const months = paymentMethodConfig[lease.payment_method].months
  const amount = lease.monthly_rent * months
  
  let currentDate = lease.start_date
  let periodIndex = 1
  
  while (true) {
    const periodStart = currentDate
    const periodEnd = addMonthsMinusOneDay(currentDate, months)
    const dueDate = currentDate // 应收日期就是周期开始日期
    
    // 如果周期结束日期超过租约结束日期，则调整
    const actualPeriodEnd = periodEnd > lease.end_date ? lease.end_date : periodEnd
    
    // 如果周期开始日期已经超过租约结束日期，停止生成
    if (periodStart > lease.end_date) break
    
    bills.push({
      lease_id: lease.id,
      property_id: lease.property_id,
      period_index: periodIndex,
      period_start: periodStart,
      period_end: actualPeriodEnd,
      due_date: dueDate,
      amount: amount,
      status: 'pending',
      paid_at: null,
      paid_amount: null,
      remark: null,
    })
    
    // 计算下一个周期开始日期
    currentDate = addMonths(currentDate, months)
    periodIndex++
  }
  
  return bills
}

// 格式化账单周期显示文本
export const formatBillPeriod = (periodStart: string, periodEnd: string, paymentMethod: PaymentMethod): string => {
  const start = new Date(periodStart)
  const end = new Date(periodEnd)
  
  const formatDate = (date: Date) => `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
  
  if (paymentMethod === 'monthly') {
    return `${formatDate(start)}月租`
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`
}

export const useBillStore = create<BillState>()(
  persist(
    (set, get) => ({
      bills: [],

      // 添加账单
      addBill: (billData) => {
        const now = getCurrentTime()
        const newBill: Bill = {
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
        let updatedBill: Bill | null = null
        
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
        const billDataList = generateBillsFromLease(lease)
        const generatedBills: Bill[] = []
        
        for (const billData of billDataList) {
          // 检查是否已存在该期的账单
          const exists = get().bills.some(
            b => b.lease_id === lease.id && b.period_index === billData.period_index
          )
          
          if (!exists) {
            const bill = get().addBill(billData)
            generatedBills.push(bill)
          }
        }
        
        return generatedBills
      },

      // 根据租约查询账单
      getBillsByLease: (leaseId) => {
        return get().bills.filter(b => b.lease_id === leaseId).sort((a, b) => a.period_index - b.period_index)
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
        let updatedBill: Bill | null = null
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
        let updatedBill: Bill | null = null
        
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

      // 获取本月预期收入（本月应收的账单）
      getMonthlyIncome: () => {
        const currentMonth = new Date().toISOString().slice(0, 7)
        return get().bills
          .filter(b => b.due_date.startsWith(currentMonth))
          .reduce((sum, b) => sum + b.amount, 0)
      },

      // 清空所有
      clearAll: () => {
        set({ bills: [] })
      },
    }),
    {
      name: 'bill-storage',
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
export const billService = {
  add: (data: Omit<Bill, 'id' | 'created_at' | 'updated_at'>) => 
    useBillStore.getState().addBill(data),
  
  update: (id: string, data: Partial<Bill>) => 
    useBillStore.getState().updateBill(id, data),
  
  delete: (id: string) => 
    useBillStore.getState().deleteBill(id),
  
  get: (id: string) => 
    useBillStore.getState().getBill(id),
  
  getByLease: (leaseId: string) => 
    useBillStore.getState().getBillsByLease(leaseId),
  
  getByProperty: (propertyId: string) => 
    useBillStore.getState().getBillsByProperty(propertyId),
  
  markPaid: (id: string, paidAmount?: number, remark?: string) => 
    useBillStore.getState().markAsPaid(id, paidAmount, remark),
  
  generateForLease: (lease: Lease) =>
    useBillStore.getState().generateBillsForLease(lease),
}
