import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useCallback } from 'react'
import { Network } from '@/network'
import { Search, Plus, Phone, Calendar } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Customer {
  id: string
  name: string
  phone: string | null
  budget: string | null
  status: 'pending' | 'following' | 'completed' | 'abandoned'
  contract_type: 'rent' | 'buy' | null
  contract_end_date: string | null
  last_follow_time: string | null
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

const CustomersPage: FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useDidShow(() => {
    loadCustomers()
  })

  usePullDownRefresh(() => {
    loadCustomers().finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const result = await Network.request<{ data: Customer[] }>({
        url: '/api/customers',
        method: 'GET',
      })
      setCustomers(result.data || [])
    } catch (error) {
      console.error('加载客户列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback(() => {
    // 搜索功能在后端实现，这里暂时前端过滤
    if (!searchKeyword.trim()) {
      loadCustomers()
      return
    }
    const filtered = customers.filter(
      (c) =>
        c.name.includes(searchKeyword) ||
        (c.phone && c.phone.includes(searchKeyword))
    )
    setCustomers(filtered)
  }, [searchKeyword, customers])

  const handleAddCustomer = () => {
    Taro.navigateTo({ url: '/pages/customers/form/index' })
  }

  const handleCustomerClick = (customerId: string) => {
    Taro.navigateTo({ url: `/pages/customers/detail/index?id=${customerId}` })
  }

  const getFilteredCustomers = () => {
    if (statusFilter === 'all') return customers
    return customers.filter((c) => c.status === statusFilter)
  }

  const filteredCustomers = getFilteredCustomers()

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 搜索栏 */}
      <View className="bg-white px-4 py-3 sticky top-0 z-10">
        <View className="flex items-center gap-2">
          <View className="flex-1 relative">
            <Input
              className="pl-10 h-10 bg-gray-50 border-0"
              placeholder="搜索客户姓名或电话"
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.detail.value)}
              onConfirm={handleSearch}
            />
            <View className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search size={18} color="#8c8c8c" />
            </View>
          </View>
          <Button
            className="h-10 px-4 bg-blue-500"
            size="sm"
            onClick={handleAddCustomer}
          >
            <Plus size={18} color="#fff" />
          </Button>
        </View>
      </View>

      {/* 状态筛选 */}
      <View className="bg-white px-4 py-2 border-t border-gray-100">
        <View className="flex gap-2 overflow-x-auto">
          <Badge
            className={`shrink-0 ${statusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setStatusFilter('all')}
          >
            全部
          </Badge>
          {Object.entries(statusMap).map(([key, value]) => (
            <Badge
              key={key}
              className={`shrink-0 ${statusFilter === key ? 'bg-blue-500 text-white' : value.color}`}
              onClick={() => setStatusFilter(key)}
            >
              {value.label}
            </Badge>
          ))}
        </View>
      </View>

      {/* 客户列表 */}
      <View className="px-4 py-3">
        {loading ? (
          <View className="text-center py-8">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View className="text-center py-8">
            <Text className="text-gray-400">暂无客户数据</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                className="active:bg-gray-50"
                onClick={() => handleCustomerClick(customer.id)}
              >
                <CardContent className="py-3">
                  <View className="flex justify-between items-start mb-2">
                    <View className="flex items-center gap-2">
                      <Text className="text-base font-semibold text-gray-800">
                        {customer.name}
                      </Text>
                      {customer.contract_type && (
                        <Badge className="bg-purple-100 text-purple-600 text-xs">
                          {contractTypeMap[customer.contract_type]}
                        </Badge>
                      )}
                    </View>
                    <Badge className={statusMap[customer.status].color}>
                      {statusMap[customer.status].label}
                    </Badge>
                  </View>

                  <View className="space-y-1">
                    {customer.phone && (
                      <View className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone size={14} color="#8c8c8c" />
                        <Text>{customer.phone}</Text>
                      </View>
                    )}
                    {customer.budget && (
                      <View className="flex items-center gap-2 text-sm text-gray-500">
                        <Text className="text-blue-500">预算：</Text>
                        <Text>{customer.budget}</Text>
                      </View>
                    )}
                    {customer.contract_end_date && (
                      <View className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} color="#8c8c8c" />
                        <Text>合约到期：{customer.contract_end_date}</Text>
                      </View>
                    )}
                  </View>

                  {customer.last_follow_time && (
                    <View className="mt-2 pt-2 border-t border-gray-100">
                      <Text className="text-xs text-gray-400">
                        最后跟进：{new Date(customer.last_follow_time).toLocaleString('zh-CN')}
                      </Text>
                    </View>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* 底部统计 */}
      <View className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <View className="flex justify-around">
          <View className="text-center">
            <Text className="block text-lg font-bold text-blue-500">
              {customers.length}
            </Text>
            <Text className="block text-xs text-gray-500">总客户</Text>
          </View>
          <View className="text-center">
            <Text className="block text-lg font-bold text-orange-500">
              {customers.filter((c) => c.status === 'pending').length}
            </Text>
            <Text className="block text-xs text-gray-500">待跟进</Text>
          </View>
          <View className="text-center">
            <Text className="block text-lg font-bold text-green-500">
              {customers.filter((c) => c.status === 'completed').length}
            </Text>
            <Text className="block text-xs text-gray-500">已成交</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default CustomersPage
