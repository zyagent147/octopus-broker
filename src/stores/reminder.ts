import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'

// 提醒类型
export type ReminderType = 'birthday' | 'contract' | 'bill'

// 提醒状态
export type ReminderStatus = 'pending' | 'dismissed' | 'completed'

// 提醒数据类型
export interface Reminder {
  id: string
  type: ReminderType
  title: string
  description: string
  related_id: string // 关联的客户ID或房源ID或账单ID
  related_name: string // 关联的名称
  due_date: string // 到期日期
  advance_days: number // 提前提醒天数
  status: ReminderStatus
  created_at: string
  updated_at: string | null
}

interface ReminderState {
  reminders: Reminder[]
  
  // 增删改查
  addReminder: (reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>) => Reminder
  updateReminder: (id: string, data: Partial<Reminder>) => Reminder | null
  deleteReminder: (id: string) => boolean
  getReminder: (id: string) => Reminder | undefined
  
  // 查询方法
  getPendingReminders: () => Reminder[]
  getRemindersByType: (type: ReminderType) => Reminder[]
  getUpcomingReminders: (days: number) => Reminder[]
  
  // 操作
  dismissReminder: (id: string) => void
  completeReminder: (id: string) => void
  
  // 批量操作
  addBirthdayReminder: (customerId: string, customerName: string, birthday: string, advanceDays: number) => Reminder
  addContractReminder: (customerId: string, customerName: string, contractEndDate: string, advanceDays: number) => Reminder
  addBillReminder: (billId: string, propertyName: string, dueDate: string, advanceDays: number) => Reminder
  
  // 清理过期提醒
  cleanExpiredReminders: () => void
  
  // 清空
  clearAll: () => void
}

// 生成唯一 ID
const generateId = () => {
  return `rem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 获取当前时间字符串
const getCurrentTime = () => {
  return new Date().toISOString()
}

// 计算距离到期还有多少天
export const getDaysUntilDue = (dueDate: string): number => {
  const now = new Date()
  const due = new Date(dueDate)
  const diff = due.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// 判断是否需要提醒
export const shouldRemind = (reminder: Reminder): boolean => {
  if (reminder.status !== 'pending') return false
  const daysUntilDue = getDaysUntilDue(reminder.due_date)
  return daysUntilDue <= reminder.advance_days && daysUntilDue >= 0
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      reminders: [],

      // 添加提醒
      addReminder: (reminderData) => {
        const now = getCurrentTime()
        const newReminder: Reminder = {
          ...reminderData,
          id: generateId(),
          created_at: now,
          updated_at: null,
        }
        
        set((state) => ({
          reminders: [newReminder, ...state.reminders],
        }))
        
        return newReminder
      },

      // 更新提醒
      updateReminder: (id, data) => {
        let updatedReminder: Reminder | null = null
        
        set((state) => ({
          reminders: state.reminders.map((reminder) => {
            if (reminder.id === id) {
              updatedReminder = {
                ...reminder,
                ...data,
                updated_at: getCurrentTime(),
              }
              return updatedReminder
            }
            return reminder
          }),
        }))
        
        return updatedReminder
      },

      // 删除提醒
      deleteReminder: (id) => {
        const prevLength = get().reminders.length
        set((state) => ({
          reminders: state.reminders.filter((reminder) => reminder.id !== id),
        }))
        return get().reminders.length < prevLength
      },

      // 获取单个提醒
      getReminder: (id) => {
        return get().reminders.find((reminder) => reminder.id === id)
      },

      // 获取待处理提醒
      getPendingReminders: () => {
        return get().reminders.filter((reminder) => reminder.status === 'pending')
      },

      // 按类型查询
      getRemindersByType: (type) => {
        return get().reminders.filter((reminder) => reminder.type === type)
      },

      // 获取即将到期的提醒
      getUpcomingReminders: (days) => {
        return get().reminders.filter((reminder) => {
          if (reminder.status !== 'pending') return false
          const daysUntilDue = getDaysUntilDue(reminder.due_date)
          return daysUntilDue <= days && daysUntilDue >= 0
        })
      },

      // 关闭提醒
      dismissReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.map((reminder) => {
            if (reminder.id === id) {
              return {
                ...reminder,
                status: 'dismissed' as ReminderStatus,
                updated_at: getCurrentTime(),
              }
            }
            return reminder
          }),
        }))
      },

      // 完成提醒
      completeReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.map((reminder) => {
            if (reminder.id === id) {
              return {
                ...reminder,
                status: 'completed' as ReminderStatus,
                updated_at: getCurrentTime(),
              }
            }
            return reminder
          }),
        }))
      },

      // 添加生日提醒
      addBirthdayReminder: (customerId, customerName, birthday, advanceDays) => {
        return get().addReminder({
          type: 'birthday',
          title: '生日提醒',
          description: `${customerName} 的生日即将到来`,
          related_id: customerId,
          related_name: customerName,
          due_date: birthday,
          advance_days: advanceDays,
          status: 'pending',
        })
      },

      // 添加合同到期提醒
      addContractReminder: (customerId, customerName, contractEndDate, advanceDays) => {
        return get().addReminder({
          type: 'contract',
          title: '合同到期提醒',
          description: `${customerName} 的合同即将到期`,
          related_id: customerId,
          related_name: customerName,
          due_date: contractEndDate,
          advance_days: advanceDays,
          status: 'pending',
        })
      },

      // 添加账单提醒
      addBillReminder: (billId, propertyName, dueDate, advanceDays) => {
        return get().addReminder({
          type: 'bill',
          title: '账单日提醒',
          description: `${propertyName} 的房租即将到期`,
          related_id: billId,
          related_name: propertyName,
          due_date: dueDate,
          advance_days: advanceDays,
          status: 'pending',
        })
      },

      // 清理过期提醒
      cleanExpiredReminders: () => {
        set((state) => ({
          reminders: state.reminders.filter((reminder) => {
            const daysUntilDue = getDaysUntilDue(reminder.due_date)
            // 保留未来30天内的提醒
            return daysUntilDue >= -30
          }),
        }))
      },

      // 清空
      clearAll: () => set({ reminders: [] }),
    }),
    {
      name: 'octopus-broker-reminders',
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
            console.error('存储提醒数据失败:', e)
          }
        },
        removeItem: (name) => {
          try {
            Taro.removeStorageSync(name)
          } catch (e) {
            console.error('删除提醒数据失败:', e)
          }
        },
      })),
    }
  )
)
