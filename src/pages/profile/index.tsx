import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useUserStore } from '@/stores/user'
import { useCustomerStore } from '@/stores/customer'
import { usePropertyStore } from '@/stores/property'
import { useLeaseStore } from '@/stores/lease'
import { useMonthlyBillStore, isBillOverdue } from '@/stores/monthlyBill'
import { Card, CardContent } from '@/components/ui/card'
import { Settings, FileText, LogOut, ChevronRight, Shield } from 'lucide-react-taro'

// 默认头像 - 使用 import 导入
// @ts-ignore
import defaultAvatar from '@/assets/章鱼经纪人.jpeg'

const ProfilePage: FC = () => {
  const user = useUserStore((state) => state.user)
  const logout = useUserStore((state) => state.logout)
  
  // 从本地存储获取原始数组
  const customers = useCustomerStore((state) => state.customers)
  const properties = usePropertyStore((state) => state.properties)
  const leases = useLeaseStore((state) => state.leases)
  const bills = useMonthlyBillStore((state) => state.bills)
  
  // 使用 useMemo 缓存所有统计数据
  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // 本月新增客户
    const monthNewCustomers = customers.filter(c => {
      const createdDate = new Date(c.created_at)
      return createdDate.getMonth() === currentMonth && 
             createdDate.getFullYear() === currentYear
    }).length

    // 已租房源数量
    const rentedProperties = properties.filter(p => p.status === 'rented').length

    // 本月新增房源
    const monthNewProperties = properties.filter(p => {
      const createdDate = new Date(p.created_at)
      return createdDate.getMonth() === currentMonth && 
             createdDate.getFullYear() === currentYear
    }).length

    // 有效租约数量
    const activeLeases = leases.filter(l => l.status === 'active').length

    // 待收款账单
    const pendingBills = bills.filter(b => b.status === 'pending')
    const overdueBills = bills.filter(b => isBillOverdue(b))
    const totalPendingAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0)

    return {
      totalCustomers: customers.length,
      totalProperties: properties.length,
      rentedProperties,
      activeLeases,
      pendingBills: pendingBills.length,
      overdueBills: overdueBills.length,
      pendingAmount: totalPendingAmount,
      monthNewCustomers,
      monthNewProperties,
    }
  }, [customers, properties, leases, bills])

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

  // 管理员菜单项
  const adminMenuItems = [
    { 
      icon: Shield, 
      label: '服务商管理', 
      action: () => Taro.navigateTo({ url: '/pages/admin/providers/index' }) 
    },
  ]

  const isAdmin = user?.role === 'admin'

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 用户信息卡片 */}
      <View className="bg-blue-500 pt-12 pb-8 px-4">
        <View className="flex items-center">
          <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden">
            <Image 
              src={user?.avatar || defaultAvatar} 
              className="w-full h-full" 
              mode="aspectFill" 
            />
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

      {/* 数据统计 - 本月数据 */}
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
                  {stats.rentedProperties}
                </Text>
                <Text className="block text-xs text-gray-500 mt-1">在租房源</Text>
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

      {/* 总体统计 */}
      <View className="px-4 mt-4">
        <Card>
          <CardContent className="py-4">
            <Text className="block text-sm text-gray-500 mb-3">数据概览</Text>
            <View className="flex justify-around">
              <View className="text-center">
                <Text className="block text-2xl font-bold text-sky-500">
                  {stats.totalCustomers}
                </Text>
                <Text className="block text-xs text-gray-500 mt-1">总客户</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="text-center">
                <Text className="block text-2xl font-bold text-purple-500">
                  {stats.totalProperties}
                </Text>
                <Text className="block text-xs text-gray-500 mt-1">总房源</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="text-center">
                <Text className="block text-2xl font-bold text-green-500">
                  {stats.activeLeases}
                </Text>
                <Text className="block text-xs text-gray-500 mt-1">有效租约</Text>
              </View>
            </View>
            {stats.pendingAmount > 0 && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <View className="flex items-center justify-center gap-2">
                  <Text className="text-sm text-gray-500">待收款总额：</Text>
                  <Text className="text-lg font-bold text-red-500">
                    ¥{stats.pendingAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 功能菜单 */}
      <View className="px-4 mt-4 space-y-4">
        {/* 管理员菜单 */}
        {isAdmin && (
          <Card>
            <CardContent className="py-2">
              {adminMenuItems.map((item) => (
                <View
                  key={item.label}
                  className="flex items-center py-3"
                  onClick={item.action}
                >
                  <item.icon size={20} color="#3b82f6" />
                  <Text className="flex-1 ml-3 text-sm text-gray-700">{item.label}</Text>
                  <ChevronRight size={16} color="#8c8c8c" />
                </View>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 普通菜单 */}
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

      {/* 使用提示 */}
      <View className="px-4 mt-4">
        <View className="bg-amber-50 rounded-xl p-4">
          <Text className="text-sm text-amber-700">
            💡 租约管理功能使用说明：{'\n'}
            1. 将房源状态改为「已租」{'\n'}
            2. 在房源详情页添加租约信息{'\n'}
            3. 系统自动生成每月账单{'\n'}
            4. 交租日前自动推送提醒
          </Text>
        </View>
      </View>

      {/* 退出登录按钮 */}
      <View className="px-4 mt-6">
        <View
          className="w-full h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center"
          onClick={handleLogout}
        >
          <LogOut size={18} color="#ff4d4f" />
          <Text className="text-red-500 text-sm ml-2">退出登录</Text>
        </View>
      </View>

      {/* 版本信息 */}
      <View className="text-center mt-8 mb-4">
        <Text className="block text-xs text-gray-400">章鱼经纪人 v1.0.0</Text>
        <Text className="block text-xs text-gray-300 mt-1">数据存储在您的手机本地</Text>
      </View>
    </View>
  )
}

export default ProfilePage
