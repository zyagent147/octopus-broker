import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Settings, FileText, LogOut, ChevronRight } from 'lucide-react-taro'

const ProfilePage: FC = () => {
  const user = useUserStore((state) => state.user)
  const logout = useUserStore((state) => state.logout)
  const [stats, setStats] = useState({
    monthNewCustomers: 0,
    monthCompleted: 0,
    monthNewProperties: 0,
  })

  useDidShow(() => {
    loadStats()
  })

  const loadStats = async () => {
    try {
      const result = await Network.request<{ data: any }>({
        url: '/api/users/stats',
      })
      setStats(result.data)
    } catch (error) {
      console.error('加载统计失败', error)
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      },
    })
  }

  const menuItems = [
    { icon: FileText, label: '隐私协议', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: Settings, label: '全局提醒设置', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
  ]

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 用户信息卡片 */}
      <View className="bg-blue-500 pt-12 pb-8 px-4">
        <View className="flex items-center">
          <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <Image src={user.avatar} className="w-full h-full" mode="aspectFill" />
            ) : (
              <User size={32} color="#1890ff" />
            )}
          </View>
          <View className="ml-4 flex-1">
            <Text className="block text-white text-lg font-semibold">
              {user?.nickname || '章鱼经纪人'}
            </Text>
            <Text className="block text-blue-100 text-sm mt-1">
              {user?.phone || '点击编辑资料'}
            </Text>
          </View>
          <ChevronRight size={20} color="#ffffff" />
        </View>
      </View>

      {/* 数据统计 */}
      <View className="px-4 -mt-4">
        <Card>
          <CardContent className="py-4">
            <Text className="block text-sm text-gray-500 mb-3">本月数据</Text>
            <View className="flex justify-around">
              <View className="text-center">
                <Text className="block text-2xl font-bold text-blue-500">
                  {stats.monthNewCustomers}
                </Text>
                <Text className="block text-xs text-gray-500 mt-1">新增客户</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="text-center">
                <Text className="block text-2xl font-bold text-green-500">
                  {stats.monthCompleted}
                </Text>
                <Text className="block text-xs text-gray-500 mt-1">成交客户</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="text-center">
                <Text className="block text-2xl font-bold text-orange-500">
                  {stats.monthNewProperties}
                </Text>
                <Text className="block text-xs text-gray-500 mt-1">新增房源</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 功能菜单 */}
      <View className="px-4 mt-4">
        <Card>
          <CardContent className="py-2">
            {menuItems.map((item, index) => (
              <View
                key={item.label}
                className={`flex items-center py-3 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                onClick={item.action}
              >
                <item.icon size={20} color="#595959" />
                <Text className="flex-1 ml-3 text-sm text-gray-700">{item.label}</Text>
                <ChevronRight size={16} color="#8c8c8c" />
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      {/* 退出登录按钮 */}
      <View className="px-4 mt-6">
        <Button
          className="w-full h-11 bg-white border border-gray-200 rounded-xl"
          onClick={handleLogout}
        >
          <View className="flex items-center justify-center">
            <LogOut size={18} color="#ff4d4f" />
            <Text className="text-red-500 text-sm ml-2">退出登录</Text>
          </View>
        </Button>
      </View>

      {/* 版本信息 */}
      <View className="text-center mt-8 mb-4">
        <Text className="block text-xs text-gray-400">章鱼经纪人 v1.0.0</Text>
      </View>
    </View>
  )
}

export default ProfilePage
