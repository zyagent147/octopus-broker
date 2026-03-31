import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Search, Plus, Phone, Calendar, Users } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

export default function CustomersPage() {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 从本地存储获取客户列表
  const customers = useCustomerStore(state => state.customers)
  const searchCustomers = useCustomerStore(state => state.searchCustomers)

  // 搜索过滤
  const searchedCustomers = searchKeyword 
    ? searchCustomers(searchKeyword)
    : customers

  // 状态过滤
  const filteredCustomers = statusFilter === 'all' 
    ? searchedCustomers 
    : searchedCustomers.filter(c => c.status === statusFilter)

  const handleAddCustomer = () => {
    Taro.navigateTo({ url: '/pages/customers/form/index' })
  }

  const handleCustomerClick = (customerId: string) => {
    Taro.navigateTo({ url: `/pages/customers/detail/index?id=${customerId}` })
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* 搜索栏 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex items-center gap-2">
          <View className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-2">
            <Search size={18} color="#999" />
            <input
              className="flex-1 ml-2 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent"
              placeholder="搜索客户姓名或电话"
              value={searchKeyword}
              onInput={(e) => setSearchKeyword((e as any).detail.value)}
            />
          </View>
          <Button
            className="bg-sky-500 rounded-xl"
            size="sm"
            onClick={handleAddCustomer}
          >
            <Plus size={20} color="#fff" />
          </Button>
        </View>
      </View>

      {/* 状态筛选 */}
      <View className="bg-white px-4 py-2 border-b border-gray-100">
        <View className="flex gap-2">
          <Badge
            className={`shrink-0 px-3 py-1 rounded-full ${statusFilter === 'all' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setStatusFilter('all')}
          >
            全部
          </Badge>
          {Object.entries(statusMap).map(([key, value]) => (
            <Badge
              key={key}
              className={`shrink-0 px-3 py-1 rounded-full ${statusFilter === key ? 'bg-sky-500 text-white' : value.color}`}
              onClick={() => setStatusFilter(key)}
            >
              {value.label}
            </Badge>
          ))}
        </View>
      </View>

      {/* 客户列表 */}
      <ScrollView scrollY className="flex-1 px-4 py-3 pb-28">
        {filteredCustomers.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Users size={48} color="#d1d5db" />
            <Text className="block mt-4 text-gray-400">
              {searchKeyword ? '未找到匹配的客户' : '暂无客户，点击右上角添加'}
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                onClick={() => handleCustomerClick(customer.id)}
              >
                <CardContent className="py-3">
                  <View className="flex justify-between items-start mb-2">
                    <View className="flex items-center gap-2">
                      <Text className="text-base font-semibold text-gray-800">
                        {customer.name}
                      </Text>
                      {customer.contract_type && (
                        <Badge className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                          {contractTypeMap[customer.contract_type]}
                        </Badge>
                      )}
                    </View>
                    <Badge className={`${statusMap[customer.status].color} px-2 py-1 rounded-full text-xs`}>
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
                        <Text className="text-sky-500">预算：</Text>
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
      </ScrollView>

      {/* 底部统计 */}
      <View 
        style={{
          position: 'fixed',
          bottom: 50,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderTop: '1px solid #e5e7eb',
          padding: '12px 16px',
          zIndex: 50,
        }}
      >
        <View className="flex justify-around">
          <View className="text-center">
            <Text className="block text-xl font-bold text-sky-500">
              {customers.length}
            </Text>
            <Text className="block text-xs text-gray-500">总客户</Text>
          </View>
          <View className="text-center">
            <Text className="block text-xl font-bold text-orange-500">
              {customers.filter((c) => c.status === 'pending').length}
            </Text>
            <Text className="block text-xs text-gray-500">待跟进</Text>
          </View>
          <View className="text-center">
            <Text className="block text-xl font-bold text-green-500">
              {customers.filter((c) => c.status === 'completed').length}
            </Text>
            <Text className="block text-xs text-gray-500">已成交</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
