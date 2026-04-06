import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'

// 提醒类型
export type ReminderType = 'birthday' | 'contract' | 'rent'

// 推送时间选项
export const PUSH_TIME_OPTIONS = [
  { label: '早上 9:00', value: 9 },
  { label: '中午 12:00', value: 12 },
  { label: '下午 6:00', value: 18 },
] as const

// 提前天数选项
export const ADVANCE_DAYS_OPTIONS = [
  { label: '1天', value: 1 },
  { label: '3天', value: 3 },
  { label: '5天', value: 5 },
  { label: '7天', value: 7 },
] as const

// 单个提醒类型设置
export interface ReminderTypeSettings {
  enabled: boolean
  advance_days: number
}

// 全局提醒设置
export interface ReminderSettings {
  // 各类型提醒开关和提前天数
  birthday: ReminderTypeSettings
  contract: ReminderTypeSettings
  rent: ReminderTypeSettings
  
  // 推送时间（小时，0-23）
  push_hour: number
  
  // 免打扰时段
  quiet_hours_enabled: boolean
  quiet_hours_start: number // 开始小时（默认22）
  quiet_hours_end: number   // 结束小时（默认8）
  
  // 全局开关
  global_enabled: boolean
  
  // 最后同步时间
  last_sync_at: string | null
}

// 默认设置
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  birthday: { enabled: true, advance_days: 3 },
  contract: { enabled: true, advance_days: 7 },
  rent: { enabled: true, advance_days: 3 },
  push_hour: 9,
  quiet_hours_enabled: true,
  quiet_hours_start: 22,
  quiet_hours_end: 8,
  global_enabled: true,
  last_sync_at: null,
}

interface ReminderSettingsState {
  settings: ReminderSettings
  
  // 获取设置
  getSettings: () => ReminderSettings
  
  // 更新单个提醒类型设置
  updateTypeSettings: (type: ReminderType, data: Partial<ReminderTypeSettings>) => void
  
  // 更新推送时间
  updatePushTime: (hour: number) => void
  
  // 更新免打扰设置
  updateQuietHours: (enabled: boolean, start?: number, end?: number) => void
  
  // 切换全局开关
  toggleGlobal: (enabled: boolean) => void
  
  // 重置为默认设置
  resetToDefault: () => void
  
  // 检查是否在免打扰时段
  isInQuietHours: () => boolean
  
  // 获取应该推送的提醒类型
  getEnabledTypes: () => ReminderType[]
  
  // 获取某个类型是否启用
  isTypeEnabled: (type: ReminderType) => boolean
  
  // 获取某个类型的提前天数
  getAdvanceDays: (type: ReminderType) => number
}

export const useReminderSettingsStore = create<ReminderSettingsState>()(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_REMINDER_SETTINGS },

      // 获取设置
      getSettings: () => get().settings,

      // 更新单个提醒类型设置
      updateTypeSettings: (type, data) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [type]: {
              ...state.settings[type],
              ...data,
            },
          },
        }))
      },

      // 更新推送时间
      updatePushTime: (hour) => {
        set((state) => ({
          settings: {
            ...state.settings,
            push_hour: hour,
          },
        }))
      },

      // 更新免打扰设置
      updateQuietHours: (enabled, start, end) => {
        set((state) => ({
          settings: {
            ...state.settings,
            quiet_hours_enabled: enabled,
            ...(start !== undefined && { quiet_hours_start: start }),
            ...(end !== undefined && { quiet_hours_end: end }),
          },
        }))
      },

      // 切换全局开关
      toggleGlobal: (enabled) => {
        set((state) => ({
          settings: {
            ...state.settings,
            global_enabled: enabled,
          },
        }))
      },

      // 重置为默认设置
      resetToDefault: () => {
        set({ settings: { ...DEFAULT_REMINDER_SETTINGS } })
      },

      // 检查是否在免打扰时段
      isInQuietHours: () => {
        const { quiet_hours_enabled, quiet_hours_start, quiet_hours_end } = get().settings
        if (!quiet_hours_enabled) return false

        const now = new Date()
        const currentHour = now.getHours()

        // 处理跨天情况（如22:00-08:00）
        if (quiet_hours_start > quiet_hours_end) {
          return currentHour >= quiet_hours_start || currentHour < quiet_hours_end
        }
        // 同天内（如13:00-14:00）
        return currentHour >= quiet_hours_start && currentHour < quiet_hours_end
      },

      // 获取应该推送的提醒类型
      getEnabledTypes: () => {
        const { global_enabled, birthday, contract, rent } = get().settings
        if (!global_enabled) return []
        
        const enabled: ReminderType[] = []
        if (birthday.enabled) enabled.push('birthday')
        if (contract.enabled) enabled.push('contract')
        if (rent.enabled) enabled.push('rent')
        return enabled
      },

      // 获取某个类型是否启用
      isTypeEnabled: (type) => {
        const { global_enabled, [type]: typeSettings } = get().settings
        return global_enabled && typeSettings.enabled
      },

      // 获取某个类型的提前天数
      getAdvanceDays: (type) => {
        return get().settings[type].advance_days
      },
    }),
    {
      name: 'octopus-broker-reminder-settings',
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
            console.error('存储提醒设置失败:', e)
          }
        },
        removeItem: (name) => {
          try {
            Taro.removeStorageSync(name)
          } catch (e) {
            console.error('删除提醒设置失败:', e)
          }
        },
      })),
    }
  )
)
