import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Gift, 
  FileText, 
  Banknote, 
  Clock, 
  Moon, 
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react-taro'
import { 
  useReminderSettingsStore, 
  PUSH_TIME_OPTIONS, 
  ADVANCE_DAYS_OPTIONS,
  ReminderType 
} from '@/stores/reminder-settings'

// 提醒类型配置
const REMINDER_TYPE_CONFIG = {
  birthday: {
    icon: Gift,
    label: '生日提醒',
    description: '客户生日当天提醒',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
  },
  contract: {
    icon: FileText,
    label: '合同到期提醒',
    description: '租约到期前提醒续约',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  rent: {
    icon: Banknote,
    label: '收租提醒',
    description: '租约账单到期提醒',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
} as const

const ReminderSettingsPage: FC = () => {
  const {
    settings,
    updateTypeSettings,
    updatePushTime,
    updateQuietHours,
    toggleGlobal,
    resetToDefault,
  } = useReminderSettingsStore()

  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showAdvancePicker, setShowAdvancePicker] = useState<ReminderType | null>(null)

  // 处理类型开关切换
  const handleTypeToggle = (type: ReminderType, enabled: boolean) => {
    updateTypeSettings(type, { enabled })
    Taro.showToast({
      title: enabled ? '已开启' : '已关闭',
      icon: 'none',
      duration: 1000,
    })
  }

  // 处理提前天数选择
  const handleAdvanceDaysSelect = (type: ReminderType, days: number) => {
    updateTypeSettings(type, { advance_days: days })
    setShowAdvancePicker(null)
    Taro.showToast({
      title: `已设为提前${days}天`,
      icon: 'none',
      duration: 1000,
    })
  }

  // 处理推送时间选择
  const handleTimeSelect = (hour: number) => {
    updatePushTime(hour)
    setShowTimePicker(false)
    Taro.showToast({
      title: `已设为${PUSH_TIME_OPTIONS.find(t => t.value === hour)?.label}`,
      icon: 'none',
      duration: 1000,
    })
  }

  // 重置设置
  const handleReset = () => {
    Taro.showModal({
      title: '重置设置',
      content: '确定要重置所有提醒设置为默认值吗？',
      success: (res) => {
        if (res.confirm) {
          resetToDefault()
          Taro.showToast({
            title: '已重置为默认值',
            icon: 'success',
            duration: 1500,
          })
        }
      },
    })
  }

  // 获取当前提前天数标签
  const getAdvanceDaysLabel = (type: ReminderType) => {
    const days = settings[type].advance_days
    return ADVANCE_DAYS_OPTIONS.find(o => o.value === days)?.label || `${days}天`
  }

  // 获取当前推送时间标签
  const getPushTimeLabel = () => {
    return PUSH_TIME_OPTIONS.find(o => o.value === settings.push_hour)?.label || `${settings.push_hour}:00`
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-6">
      {/* 全局开关 */}
      <View className="px-4 pt-4">
        <Card>
          <CardContent className="py-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center">
                {settings.global_enabled ? (
                  <Volume2 size={24} color="#1890ff" />
                ) : (
                  <VolumeX size={24} color="#8c8c8c" />
                )}
                <View className="ml-3">
                  <Text className="block text-base font-medium text-gray-800">
                    全局提醒开关
                  </Text>
                  <Text className="block text-xs text-gray-500 mt-1">
                    关闭后将暂停所有提醒推送
                  </Text>
                </View>
              </View>
              <Switch
                checked={settings.global_enabled}
                onCheckedChange={(checked) => toggleGlobal(checked)}
              />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 提醒类型设置 */}
      <View className="px-4 mt-4">
        <Text className="block text-sm text-gray-500 mb-3 ml-1">提醒类型</Text>
        <View className="space-y-3">
          {(Object.keys(REMINDER_TYPE_CONFIG) as ReminderType[]).map((type) => {
            const config = REMINDER_TYPE_CONFIG[type]
            const Icon = config.icon
            const isEnabled = settings.global_enabled && settings[type].enabled

            return (
              <Card key={type}>
                <CardContent className="py-4">
                  <View className="flex items-start">
                    <View className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                      <Icon size={20} color={isEnabled ? config.color : '#8c8c8c'} />
                    </View>
                    <View className="flex-1 ml-3">
                      <View className="flex items-center justify-between">
                        <Text className="block text-base font-medium text-gray-800">
                          {config.label}
                        </Text>
                        <Switch
                          checked={settings[type].enabled}
                          disabled={!settings.global_enabled}
                          onCheckedChange={(checked) => handleTypeToggle(type, checked)}
                        />
                      </View>
                      <Text className="block text-xs text-gray-500 mt-1">
                        {config.description}
                      </Text>
                      
                      {/* 提前天数设置 */}
                      <View className="mt-3 flex items-center justify-between">
                        <Text className="block text-xs text-gray-400">提前提醒</Text>
                        <View 
                          className={`flex items-center ${isEnabled ? '' : 'opacity-40'}`}
                          onClick={() => isEnabled && setShowAdvancePicker(type)}
                        >
                          <Badge variant="outline" className="text-xs">
                            {getAdvanceDaysLabel(type)}
                          </Badge>
                        </View>
                      </View>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )
          })}
        </View>
      </View>

      {/* 推送时间设置 */}
      <View className="px-4 mt-4">
        <Card>
          <CardContent className="py-4">
            <View 
              className="flex items-center justify-between"
              onClick={() => settings.global_enabled && setShowTimePicker(true)}
            >
              <View className="flex items-center">
                <Clock size={20} color={settings.global_enabled ? '#1890ff' : '#8c8c8c'} />
                <View className="ml-3">
                  <Text className={`block text-sm ${settings.global_enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                    每日推送时间
                  </Text>
                  <Text className="block text-xs text-gray-500 mt-1">
                    提醒将在设定时间统一推送
                  </Text>
                </View>
              </View>
              <Badge variant="outline" className={settings.global_enabled ? '' : 'opacity-40'}>
                {getPushTimeLabel()}
              </Badge>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 免打扰时段设置 */}
      <View className="px-4 mt-4">
        <Card>
          <CardContent className="py-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center">
                <Moon size={20} color={settings.global_enabled ? '#6366f1' : '#8c8c8c'} />
                <View className="ml-3">
                  <Text className={`block text-sm ${settings.global_enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                    免打扰时段
                  </Text>
                  <Text className="block text-xs text-gray-500 mt-1">
                    {settings.quiet_hours_start}:00 - {settings.quiet_hours_end}:00
                  </Text>
                </View>
              </View>
              <Switch
                checked={settings.quiet_hours_enabled}
                disabled={!settings.global_enabled}
                onCheckedChange={(checked) => updateQuietHours(checked)}
              />
            </View>
            {settings.global_enabled && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="block text-xs text-gray-400">
                  免打扰时段内不会收到任何提醒推送
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 重置按钮 */}
      <View className="px-4 mt-6">
        <View
          className="flex items-center justify-center py-3 bg-gray-100 rounded-xl"
          onClick={handleReset}
        >
          <RotateCcw size={16} color="#8c8c8c" />
          <Text className="block text-sm text-gray-500 ml-2">重置为默认设置</Text>
        </View>
      </View>

      {/* 推送时间选择弹窗 */}
      {showTimePicker && (
        <View 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowTimePicker(false)}
        >
          <View 
            className="w-full bg-white rounded-t-2xl p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <View className="flex items-center justify-between mb-4">
              <Text className="block text-sm text-gray-500" onClick={() => setShowTimePicker(false)}>取消</Text>
              <Text className="block text-base font-medium text-gray-800">选择推送时间</Text>
              <View className="w-12" />
            </View>
            <View className="flex justify-around">
              {PUSH_TIME_OPTIONS.map((option) => (
                <View
                  key={option.value}
                  className={`px-6 py-3 rounded-xl ${
                    settings.push_hour === option.value 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => handleTimeSelect(option.value)}
                >
                  <Text className="block text-sm">{option.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 提前天数选择弹窗 */}
      {showAdvancePicker && (
        <View 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowAdvancePicker(null)}
        >
          <View 
            className="w-full bg-white rounded-t-2xl p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <View className="flex items-center justify-between mb-4">
              <Text className="block text-sm text-gray-500" onClick={() => setShowAdvancePicker(null)}>取消</Text>
              <Text className="block text-base font-medium text-gray-800">
                {REMINDER_TYPE_CONFIG[showAdvancePicker].label} - 提前天数
              </Text>
              <View className="w-12" />
            </View>
            <View className="flex justify-around">
              {ADVANCE_DAYS_OPTIONS.map((option) => (
                <View
                  key={option.value}
                  className={`px-6 py-3 rounded-xl ${
                    settings[showAdvancePicker].advance_days === option.value 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => handleAdvanceDaysSelect(showAdvancePicker, option.value)}
                >
                  <Text className="block text-sm">{option.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 底部提示 */}
      <View className="px-4 mt-6">
        <View className="bg-blue-50 rounded-xl p-4">
          <Text className="block text-sm text-blue-700">
            💡 提示：提醒功能需要在小程序中开启订阅消息权限才能正常接收推送。请在「发现」→「小程序」→「章鱼经纪人」中设置。
          </Text>
        </View>
      </View>
    </View>
  )
}

export default ReminderSettingsPage
