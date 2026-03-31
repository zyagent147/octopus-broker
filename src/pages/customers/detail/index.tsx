import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Phone,
  Calendar,
  Pencil,
  Trash2,
  MessageCircle,
  Gift,
  FileText,
  User,
} from 'lucide-react-taro'
import { useCustomerStore } from '@/stores/customer'

const statusMap = {
  pending: { label: '待跟进', color: 'bg-orange-100 text-orange-600' },
  following: { label: '跟进中', color: 'bg-blue-100 text-blue-600' },
  completed: { label: '已成交', color: 'bg-green-100 text-green-600' },
  abandoned: { label: '已放弃', color: 'bg-gray-100 text-gray-600' },
}

const contractTypeMap = {
  rent: '租房',
  buy: '购房',
}

export default function CustomerDetailPage() {
  const [loading, setLoading] = useState(true)

  const router = Taro.useRouter()
  const customerId = router.params.id

  // 从本地存储获取客户数据
  const getCustomer = useCustomerStore(state => state.getCustomer)
  const deleteCustomer = useCustomerStore(state => state.deleteCustomer)
  
  const customer = customerId ? getCustomer(customerId) : null

  useDidShow(() => {
    setLoading(false)
  })

  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/customers/form/index?id=${customerId}` })
  }

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个客户吗？',
      success: (res) => {
        if (res.confirm) {
          deleteCustomer(customerId!)
          Taro.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => {
            Taro.navigateBack()
          }, 1000)
        }
      },
    })
  }

  const handleAddFollowUp = () => {
    Taro.navigateTo({
      url: `/pages/customers/follow-up/index?customerId=${customerId}`,
    })
  }

  const handleCall = () => {
    if (customer?.phone) {
      Taro.makePhoneCall({ phoneNumber: customer.phone })
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  if (!customer) {
    return (
      <View className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <User size={48} color="#d1d5db" />
        <Text className="mt-4 text-gray-400">客户不存在</Text>
      </View>
    )
  }

  return (
    <ScrollView className="min-h-screen bg-gray-50" scrollY>
      {/* 基本信息 */}
      <View className="bg-white px-4 py-5">
        <View className="flex justify-between items-start mb-3">
          <View>
            <View className="flex items-center gap-2 mb-1">
              <Text className="text-xl font-bold text-gray-800">
                {customer.name}
              </Text>
              {customer.contract_type && (
                <Badge className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
                  {contractTypeMap[customer.contract_type]}
                </Badge>
              )}
            </View>
            <Badge className={`${statusMap[customer.status].color} px-2 py-1 rounded-full text-xs`}>
              {statusMap[customer.status].label}
            </Badge>
          </View>
          <View className="flex gap-2">
            <Button size="sm" className="h-8 px-3 bg-sky-500 rounded-lg" onClick={handleEdit}>
              <Pencil size={16} color="#fff" />
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 bg-white border border-red-300 rounded-lg"
              onClick={handleDelete}
            >
              <Trash2 size={16} color="#ff4d4f" />
            </Button>
          </View>
        </View>

        {/* 快捷操作 */}
        <View className="flex gap-3 mt-4">
          {customer.phone && (
            <Button
              size="sm"
              className="flex-1 h-10 bg-green-500 rounded-xl"
              onClick={handleCall}
            >
              <Phone size={16} color="#fff" />
              <Text className="text-white ml-2">拨打电话</Text>
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 h-10 bg-sky-500 rounded-xl"
            onClick={handleAddFollowUp}
          >
            <MessageCircle size={16} color="#fff" />
            <Text className="text-white ml-2">添加跟进</Text>
          </Button>
        </View>
      </View>

      {/* 详细信息 */}
      <View className="px-4 mt-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">客户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.phone && (
              <View className="flex items-center gap-2">
                <Phone size={16} color="#8c8c8c" />
                <Text className="text-sm text-gray-500">电话：</Text>
                <Text className="text-sm text-gray-800">{customer.phone}</Text>
              </View>
            )}
            {customer.budget && (
              <View className="flex items-center gap-2">
                <Text className="text-sm text-gray-500">预算：</Text>
                <Text className="text-sm text-gray-800">{customer.budget}</Text>
              </View>
            )}
            {customer.contract_end_date && (
              <View className="flex items-center gap-2">
                <Calendar size={16} color="#8c8c8c" />
                <Text className="text-sm text-gray-500">合约到期：</Text>
                <Text className="text-sm text-gray-800">
                  {customer.contract_end_date}
                </Text>
              </View>
            )}
            {customer.birthday && (
              <View className="flex items-center gap-2">
                <Gift size={16} color="#8c8c8c" />
                <Text className="text-sm text-gray-500">生日：</Text>
                <Text className="text-sm text-gray-800">{customer.birthday}</Text>
              </View>
            )}
            {customer.requirements && (
              <View className="flex gap-2">
                <FileText size={16} color="#8c8c8c" className="shrink-0 mt-1" />
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">需求：</Text>
                  <Text className="text-sm text-gray-800 mt-1">
                    {customer.requirements}
                  </Text>
                </View>
              </View>
            )}
            {customer.remark && (
              <View className="flex gap-2">
                <FileText size={16} color="#8c8c8c" className="shrink-0 mt-1" />
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">备注：</Text>
                  <Text className="text-sm text-gray-800 mt-1">
                    {customer.remark}
                  </Text>
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 提醒设置 */}
      {(customer.reminder_days_contract || customer.reminder_days_birthday) && (
        <View className="px-4 mt-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">提醒设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.reminder_days_contract && (
                <Text className="text-sm text-gray-600">
                  合约到期提前 {customer.reminder_days_contract} 天提醒
                </Text>
              )}
              {customer.reminder_days_birthday && (
                <Text className="text-sm text-gray-600">
                  生日提前 {customer.reminder_days_birthday} 天提醒
                </Text>
              )}
            </CardContent>
          </Card>
        </View>
      )}

      {/* 最后跟进时间 */}
      {customer.last_follow_time && (
        <View className="px-4 mt-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">跟进记录</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="border-l-2 border-sky-500 pl-3 py-1">
                <Text className="text-xs text-gray-400">
                  {new Date(customer.last_follow_time).toLocaleString('zh-CN')}
                </Text>
                <Text className="text-sm text-gray-700 mt-1">
                  最后跟进时间
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>
      )}
    </ScrollView>
  )
}
