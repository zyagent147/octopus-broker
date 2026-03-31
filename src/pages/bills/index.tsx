import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo, useState } from 'react'
import { 
  DollarSign, Phone, Calendar, Check, CircleAlert, Clock, 
  ChevronRight
} from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRentBillStore, getPaymentCycleText, calculateBillStatus } from '@/stores/rentBill'
import { usePropertyStore } from '@/stores/property'

type FilterType = 'all' | 'pending' | 'overdue' | 'paid'

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待收款' },
  { value: 'overdue', label: '已逾期' },
  { value: 'paid', label: '已收款' },
]

export default function BillsListPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  
  // 从 store 获取原始数据
  const bills = useRentBillStore(state => state.bills)
  const properties = usePropertyStore(state => state.properties)
  const markBillPaid = useRentBillStore(state => state.markAsPaid)

  // 缓存计算结果
  const filteredBills = useMemo(() => {
    let result = bills
    
    if (filter === 'pending') {
      result = bills.filter(b => calculateBillStatus(b) === 'pending')
    } else if (filter === 'overdue') {
      result = bills.filter(b => calculateBillStatus(b) === 'overdue')
    } else if (filter === 'paid') {
      result = bills.filter(b => calculateBillStatus(b) === 'paid')
    }
    
    // 按下次收款日期排序
    return [...result].sort((a, b) => {
      if (calculateBillStatus(a) === 'overdue' && calculateBillStatus(b) !== 'overdue') return -1
      if (calculateBillStatus(a) !== 'overdue' && calculateBillStatus(b) === 'overdue') return 1
      return a.next_due_date.localeCompare(b.next_due_date)
    })
  }, [bills, filter])

  // 统计数据
  const stats = useMemo(() => {
    const pending = bills.filter(b => calculateBillStatus(b) === 'pending')
    const overdue = bills.filter(b => calculateBillStatus(b) === 'overdue')
    
    return {
      total: bills.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
      pendingAmount: pending.reduce((sum, b) => sum + b.amount, 0),
      overdueAmount: overdue.reduce((sum, b) => sum + b.amount, 0),
    }
  }, [bills])

  const getPropertyById = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const handleBillClick = (_billId: string, propertyId: string) => {
    Taro.navigateTo({ url: `/pages/properties/detail/index?id=${propertyId}` })
  }

  const handleMarkPaid = async (billId: string, e: any) => {
    e.stopPropagation()
    
    const res = await Taro.showModal({
      title: '确认收款',
      content: '确认已收到本期租金？',
    })
    
    if (res.confirm) {
      const result = markBillPaid(billId)
      if (result) {
        Taro.showToast({ title: '已标记收款', icon: 'success' })
      }
    }
  }

  const handleCall = (phone: string, e: any) => {
    e.stopPropagation()
    Taro.makePhoneCall({ phoneNumber: phone })
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* 统计卡片 */}
      <View className="bg-sky-500 p-4 pb-6">
        <View className="flex items-center justify-between mb-4">
          <Text className="text-white text-lg font-bold">应收账单</Text>
          <Badge className="bg-white bg-opacity-20 text-white">{stats.total} 条</Badge>
        </View>
        
        <View className="flex gap-3">
          <View className="flex-1 bg-white bg-opacity-10 rounded-lg p-3">
            <Text className="text-white text-opacity-80 text-xs mb-1">待收款</Text>
            <Text className="text-white text-xl font-bold">¥{stats.pendingAmount.toLocaleString()}</Text>
            <Text className="text-white text-opacity-60 text-xs mt-1">{stats.pendingCount} 笔</Text>
          </View>
          <View className="flex-1 bg-white bg-opacity-10 rounded-lg p-3">
            <Text className="text-white text-opacity-80 text-xs mb-1">已逾期</Text>
            <Text className="text-white text-xl font-bold">¥{stats.overdueAmount.toLocaleString()}</Text>
            <Text className="text-white text-opacity-60 text-xs mt-1">{stats.overdueCount} 笔</Text>
          </View>
        </View>
      </View>

      {/* 筛选栏 */}
      <View className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100">
        {filterOptions.map(option => (
          <View
            key={option.value}
            className={`px-3 py-2 rounded-full ${filter === option.value ? 'bg-sky-500' : 'bg-gray-100'}`}
            onClick={() => setFilter(option.value)}
          >
            <Text className={`text-sm ${filter === option.value ? 'text-white' : 'text-gray-600'}`}>
              {option.label}
            </Text>
          </View>
        ))}
      </View>

      {/* 账单列表 */}
      <ScrollView scrollY className="flex-1 p-4">
        {filteredBills.length === 0 ? (
          <View className="py-12 text-center">
            <DollarSign size={48} color="#d1d5db" />
            <Text className="text-gray-400 block mt-2">暂无账单记录</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredBills.map(bill => {
              const billStatus = calculateBillStatus(bill)
              const daysUntil = getDaysUntilDue(bill.next_due_date)
              const isOverdue = billStatus === 'overdue'
              const isPaid = billStatus === 'paid'
              const isUpcoming = daysUntil >= 0 && daysUntil <= 3
              const property = getPropertyById(bill.property_id)

              return (
                <Card 
                  key={bill.id}
                  className={`${isOverdue ? 'border-red-200' : isUpcoming ? 'border-orange-200' : ''}`}
                  onClick={() => handleBillClick(bill.id, bill.property_id)}
                >
                  <CardContent className="p-4">
                    <View className="flex items-center justify-between mb-2">
                      <View className="flex items-center gap-2">
                        <DollarSign size={18} color={isOverdue ? '#ef4444' : isPaid ? '#22c55e' : '#3b82f6'} />
                        <Text className="text-lg font-bold text-gray-900">
                          ¥{bill.amount.toLocaleString()}
                        </Text>
                        <Badge variant="outline" className="text-xs">
                          {getPaymentCycleText(bill.payment_cycle, bill.custom_days)}
                        </Badge>
                      </View>
                      {isPaid ? (
                        <Badge className="bg-green-500 text-white">已收款</Badge>
                      ) : isOverdue ? (
                        <Badge className="bg-red-500 text-white">
                          <CircleAlert size={12} color="#fff" />
                          <Text className="ml-1">逾期{Math.abs(daysUntil)}天</Text>
                        </Badge>
                      ) : isUpcoming ? (
                        <Badge className="bg-orange-500 text-white">{daysUntil}天后</Badge>
                      ) : (
                        <ChevronRight size={16} color="#999" />
                      )}
                    </View>

                    {/* 房源信息 */}
                    {property && (
                      <View className="mb-2">
                        <Text className="text-sm text-gray-900">
                          {property.community}{property.building ? ` ${property.building}` : ''}
                        </Text>
                      </View>
                    )}

                    {/* 租客信息 */}
                    {bill.tenant_name && (
                      <View className="flex items-center gap-2 mb-2">
                        <Text className="text-sm text-gray-500">租客：{bill.tenant_name}</Text>
                        {bill.tenant_phone && (
                          <View 
                            className="p-1 rounded-full bg-green-100"
                            onClick={(e) => handleCall(bill.tenant_phone!, e)}
                          >
                            <Phone size={14} color="#22c55e" />
                          </View>
                        )}
                      </View>
                    )}

                    {/* 日期信息 */}
                    <View className="flex items-center gap-4 text-xs text-gray-500">
                      <View className="flex items-center gap-1">
                        <Calendar size={12} color="#999" />
                        <Text>账单日：{bill.bill_date}号</Text>
                      </View>
                      <View className="flex items-center gap-1">
                        <Clock size={12} color="#999" />
                        <Text>{isPaid ? '收款日' : '应收日'}：{formatDate(bill.next_due_date)}</Text>
                      </View>
                    </View>

                    {/* 收款按钮 */}
                    {!isPaid && (
                      <View 
                        className="mt-3 py-2 rounded-lg bg-green-500 flex items-center justify-center"
                        onClick={(e) => handleMarkPaid(bill.id, e)}
                      >
                        <Check size={16} color="#fff" />
                        <Text className="text-white text-sm ml-1">确认收款</Text>
                      </View>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
        
        {/* 底部安全区 */}
        <View className="h-4" />
      </ScrollView>
    </View>
  )
}
