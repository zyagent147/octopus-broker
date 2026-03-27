import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Phone,
  Calendar,
  Pencil,
  Trash2,
  Plus,
  MessageCircle,
  Gift,
  FileText,
} from 'lucide-react-taro'

interface Customer {
  id: string
  name: string
  phone: string | null
  budget: string | null
  status: 'pending' | 'following' | 'completed' | 'abandoned'
  contract_type: 'rent' | 'buy' | null
  contract_end_date: string | null
  birthday: string | null
  requirements: string | null
  reminder_days_contract: number | null
  reminder_days_birthday: number | null
  last_follow_time: string | null
  created_at: string
}

interface FollowUp {
  id: string
  content: string
  follow_time: string
  created_at: string
}

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

const CustomerDetailPage: FC = () => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)

  const router = Taro.useRouter()
  const customerId = router.params.id

  useDidShow(() => {
    if (customerId) {
      loadCustomerDetail()
      loadFollowUps()
    }
  })

  const loadCustomerDetail = async () => {
    try {
      const result = await Network.request<{ data: Customer }>({
        url: `/api/customers/${customerId}`,
        method: 'GET',
      })
      setCustomer(result.data)
    } catch (error) {
      console.error('加载客户详情失败', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const loadFollowUps = async () => {
    try {
      const result = await Network.request<{ data: FollowUp[] }>({
        url: `/api/customers/${customerId}/follow-ups`,
        method: 'GET',
      })
      setFollowUps(result.data || [])
    } catch (error) {
      console.error('加载跟进记录失败', error)
    }
  }

  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/customers/form/index?id=${customerId}` })
  }

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个客户吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/customers/${customerId}`,
              method: 'DELETE',
            })
            Taro.showToast({ title: '删除成功', icon: 'success' })
            setTimeout(() => {
              Taro.navigateBack()
            }, 1000)
          } catch (error) {
            console.error('删除失败', error)
          }
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
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">客户不存在</Text>
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
                <Badge className="bg-purple-100 text-purple-600">
                  {contractTypeMap[customer.contract_type]}
                </Badge>
              )}
            </View>
            <Badge className={statusMap[customer.status].color}>
              {statusMap[customer.status].label}
            </Badge>
          </View>
          <View className="flex gap-2">
            <Button size="sm" className="h-8 px-3 bg-blue-500" onClick={handleEdit}>
              <Pencil size={16} color="#fff" />
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 bg-white border border-red-300"
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
              className="flex-1 h-10 bg-green-500"
              onClick={handleCall}
            >
              <Phone size={16} color="#fff" />
              <Text className="text-white ml-2">拨打电话</Text>
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 h-10 bg-blue-500"
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

      {/* 跟进记录 */}
      <View className="px-4 mt-3 mb-6">
        <Card>
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle className="text-base">跟进记录</CardTitle>
              <Button
                size="sm"
                className="h-7 px-3 bg-blue-500"
                onClick={handleAddFollowUp}
              >
                <Plus size={14} color="#fff" />
                <Text className="text-white text-xs ml-1">添加</Text>
              </Button>
            </View>
          </CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <View className="text-center py-4">
                <Text className="text-sm text-gray-400">暂无跟进记录</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {followUps.map((followUp) => (
                  <View
                    key={followUp.id}
                    className="border-l-2 border-blue-500 pl-3 py-1"
                  >
                    <Text className="text-xs text-gray-400">
                      {new Date(followUp.follow_time).toLocaleString('zh-CN')}
                    </Text>
                    <Text className="text-sm text-gray-700 mt-1">
                      {followUp.content}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  )
}

export default CustomerDetailPage
