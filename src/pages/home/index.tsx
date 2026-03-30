import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, House, DollarSign, Bell, Phone, Calendar, ChevronRight, TrendingUp
} from 'lucide-react-taro'

interface Stats {
  totalCustomers: number
  totalProperties: number
  rentedProperties: number
  pendingBills: number
}

interface Reminder {
  id: string
  type: 'contract' | 'birthday' | 'bill'
  title: string
  content: string
  date: string
}

const HomePage: FC = () => {
  const user = useUserStore((state) => state.user)
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalProperties: 0,
    rentedProperties: 0,
    pendingBills: 0,
  })
  const [reminders, setReminders] = useState<Reminder[]>([])

  useDidShow(() => {
    loadData()
  })

  const loadData = async () => {
    try {
      // 并行加载数据
      const [statsRes, remindersRes] = await Promise.all([
        Network.request<{ data: Stats }>({
          url: '/api/users/stats',
        }),
        Network.request<{ data: Reminder[] }>({
          url: '/api/reminders/today',
        }).catch(() => ({ data: [] })),
      ])
      
      setStats(statsRes.data || stats)
      setReminders(remindersRes.data || [])
    } catch (error) {
      console.error('加载首页数据失败', error)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 17) return '下午好'
    if (hour < 19) return '傍晚好'
    if (hour < 22) return '晚上好'
    return '夜深了'
  }

  const quickActions = [
    { icon: Users, label: '新增客户', path: '/pages/customers/form/index', color: '#3b82f6' },
    { icon: House, label: '新增房源', path: '/pages/properties/form/index', color: '#10b981' },
    { icon: DollarSign, label: '应收账单', path: '/pages/rent-bills/form/index', color: '#f59e0b' },
    { icon: Phone, label: '生活服务', path: '/pages/services/index', color: '#8b5cf6' },
  ]

  const statItems = [
    { label: '客户总数', value: stats.totalCustomers, icon: Users, color: '#3b82f6' },
    { label: '房源总数', value: stats.totalProperties, icon: House, color: '#10b981' },
    { label: '在租房源', value: stats.rentedProperties, icon: TrendingUp, color: '#f59e0b' },
    { label: '待收账单', value: stats.pendingBills, icon: DollarSign, color: '#ef4444' },
  ]

  return (
    <ScrollView className="min-h-screen bg-gray-50" scrollY>
      {/* 头部欢迎区域 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 pt-12 pb-8 px-4">
        <View className="flex items-center">
          <View className="w-14 h-14 rounded-full overflow-hidden border-2 border-white border-opacity-30">
            <View 
              className="w-full h-full bg-white bg-opacity-20 flex items-center justify-center"
            >
              <Text className="text-2xl">🐙</Text>
            </View>
          </View>
          <View className="ml-3 flex-1">
            <Text className="block text-white text-lg font-semibold">
              {getGreeting()}，{user?.nickname || '经纪人'}
            </Text>
            <Text className="block text-blue-100 text-sm mt-1">
              今日有 {reminders.length} 条待办事项
            </Text>
          </View>
          <View 
            className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center"
            onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}
          >
            <Bell size={20} color="#fff" />
          </View>
        </View>
      </View>

      {/* 数据统计 */}
      <View className="px-4 -mt-4">
        <Card>
          <CardContent className="py-4">
            <View className="grid grid-cols-4 gap-2">
              {statItems.map((item) => (
                <View key={item.label} className="text-center">
                  <View 
                    className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon size={20} color={item.color} />
                  </View>
                  <Text className="block text-xl font-bold text-gray-900">{item.value}</Text>
                  <Text className="block text-xs text-gray-500">{item.label}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 快捷入口 */}
      <View className="px-4 mt-4">
        <Card>
          <CardContent className="py-3">
            <View className="grid grid-cols-4 gap-2">
              {quickActions.map((item) => (
                <View 
                  key={item.label} 
                  className="text-center py-2"
                  onClick={() => Taro.navigateTo({ url: item.path })}
                >
                  <View 
                    className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon size={24} color={item.color} />
                  </View>
                  <Text className="block text-xs text-gray-700">{item.label}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 今日待办 */}
      <View className="px-4 mt-4">
        <Card>
          <CardContent className="py-0">
            <View className="flex items-center justify-between py-3 border-b border-gray-100">
              <View className="flex items-center">
                <Calendar size={18} color="#3b82f6" />
                <Text className="ml-2 font-semibold text-gray-900">今日待办</Text>
              </View>
              {reminders.length > 0 && (
                <View className="px-2 py-1 rounded-full bg-red-100">
                  <Text className="text-xs text-red-500">{reminders.length}</Text>
                </View>
              )}
            </View>
            
            {reminders.length === 0 ? (
              <View className="py-8 text-center">
                <Text className="text-gray-400">今日暂无待办事项</Text>
              </View>
            ) : (
              <View>
                {reminders.slice(0, 5).map((reminder) => (
                  <View 
                    key={reminder.id} 
                    className="flex items-center py-3 border-b border-gray-50 last:border-0"
                  >
                    <View 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: reminder.type === 'birthday' ? '#fef3c7' :
                          reminder.type === 'contract' ? '#dbeafe' : '#fee2e2'
                      }}
                    >
                      <Text className="text-sm">
                        {reminder.type === 'birthday' ? '🎂' : 
                          reminder.type === 'contract' ? '📄' : '💰'}
                      </Text>
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="block text-sm text-gray-900">{reminder.title}</Text>
                      <Text className="block text-xs text-gray-500 mt-1">{reminder.content}</Text>
                    </View>
                    <ChevronRight size={16} color="#9ca3af" />
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 底部间距 */}
      <View className="h-4" />
    </ScrollView>
  )
}

export default HomePage
