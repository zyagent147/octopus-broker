import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Search, Plus, Phone, Calendar, Users, Bell, X, Check, Gift, FileText, DollarSign } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCustomerStore } from '@/stores/customer'
import { useReminderStore, shouldRemind, getDaysUntilDue, type Reminder } from '@/stores/reminder'

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

const reminderTypeConfig = {
  birthday: { label: '生日', icon: Gift, color: '#ec4899', bgColor: '#fdf2f8' },
  contract: { label: '合同到期', icon: FileText, color: '#f59e0b', bgColor: '#fffbeb' },
  bill: { label: '账单日', icon: DollarSign, color: '#10b981', bgColor: '#ecfdf5' },
}

export default function CustomersPage() {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 从本地存储获取客户列表
  const customers = useCustomerStore(state => state.customers)
  const searchCustomers = useCustomerStore(state => state.searchCustomers)
  
  // 提醒相关
  const reminders = useReminderStore(state => state.reminders)
  const dismissReminder = useReminderStore(state => state.dismissReminder)
  const completeReminder = useReminderStore(state => state.completeReminder)

  // 获取需要显示的提醒
  const activeReminders = reminders.filter(shouldRemind)

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

  const handleReminderClick = (reminder: Reminder) => {
    // 跳转到相关详情页
    if (reminder.type === 'bill') {
      Taro.navigateTo({ url: `/pages/properties/detail/index?id=${reminder.related_id}` })
    } else {
      Taro.navigateTo({ url: `/pages/customers/detail/index?id=${reminder.related_id}` })
    }
  }

  const handleDismiss = (reminderId: string, e: any) => {
    e.stopPropagation()
    dismissReminder(reminderId)
    Taro.showToast({ title: '已关闭提醒', icon: 'success' })
  }

  const handleComplete = (reminderId: string, e: any) => {
    e.stopPropagation()
    completeReminder(reminderId)
    Taro.showToast({ title: '已标记完成', icon: 'success' })
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* 提醒横幅 */}
      {activeReminders.length > 0 && (
        <View className="bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-3">
          <View className="flex items-center justify-between mb-2">
            <View className="flex items-center gap-2">
              <Bell size={18} color="#fff" />
              <Text className="text-white font-medium">即将到期提醒 ({activeReminders.length})</Text>
            </View>
          </View>
          <ScrollView scrollX className="whitespace-nowrap">
            <View className="flex gap-2 pb-1">
              {activeReminders.map((reminder) => {
                const config = reminderTypeConfig[reminder.type]
                const IconComponent = config.icon
                const daysLeft = getDaysUntilDue(reminder.due_date)
                
                return (
                  <View
                    key={reminder.id}
                    className="inline-flex bg-white rounded-xl p-3 mr-2"
                    style={{ minWidth: '200px' }}
                    onClick={() => handleReminderClick(reminder)}
                  >
                    <View className="flex items-start gap-2">
                      <View 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: config.bgColor }}
                      >
                        <IconComponent size={20} color={config.color} />
                      </View>
                      <View className="flex-1 min-w-0">
                        <View className="flex items-center gap-1">
                          <Text className="text-xs text-gray-500">{config.label}</Text>
                          <Badge 
                            className={`text-xs px-1 py-0 rounded ${daysLeft <= 1 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}
                          >
                            {daysLeft === 0 ? '今天' : `${daysLeft}天后`}
                          </Badge>
                        </View>
                        <Text className="text-sm font-medium text-gray-800 truncate">
                          {reminder.related_name}
                        </Text>
                      </View>
                    </View>
                    <View className="flex gap-1 ml-2">
                      <View 
                        className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
                        onClick={(e) => handleDismiss(reminder.id, e)}
                      >
                        <X size={14} color="#666" />
                      </View>
                      <View 
                        className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center"
                        onClick={(e) => handleComplete(reminder.id, e)}
                      >
                        <Check size={14} color="#10b981" />
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          </ScrollView>
        </View>
      )}

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
