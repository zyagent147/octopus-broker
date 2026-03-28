import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Bell, X, DollarSign, Phone, MapPin } from 'lucide-react-taro'

interface UpcomingBill {
  id: string
  tenant_name: string | null
  tenant_phone: string | null
  amount: number
  payment_cycle: 'monthly' | 'quarterly' | 'custom'
  next_due_date: string
  properties: {
    id: string
    community: string
    building: string | null
    address: string
  }
}

interface RentBillReminderProps {
  onClose?: () => void
}

export function RentBillReminder({ onClose }: RentBillReminderProps) {
  const [bills, setBills] = useState<UpcomingBill[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    fetchUpcomingBills()
  }, [])

  const fetchUpcomingBills = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/rent-bills/upcoming?days=7',
        method: 'GET',
      })
      
      setBills(res.data.data || [])
    } catch (error) {
      console.error('获取账单提醒失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setVisible(false)
    onClose?.()
  }

  const handleMarkPaid = async (billId: string) => {
    try {
      const res = await Network.request({
        url: `/api/rent-bills/${billId}/mark-paid`,
        method: 'POST',
      })
      
      if (res.data.code === 200) {
        Taro.showToast({ title: '已标记收款', icon: 'success' })
        fetchUpcomingBills()
      } else {
        Taro.showToast({ title: res.data.msg || '操作失败', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleCall = (phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone })
  }

  const handleViewProperty = (propertyId: string) => {
    Taro.navigateTo({ url: `/pages/properties/detail/index?id=${propertyId}` })
    handleClose()
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (!visible || loading || bills.length === 0) {
    return null
  }

  return (
    <View className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
      <View className="p-4">
        <View className="flex items-center justify-between mb-3">
          <View className="flex items-center gap-2">
            <Bell size={18} color="#f97316" />
            <Text className="font-semibold text-gray-900">应收账单提醒</Text>
            <View className="px-2 py-1 bg-red-500 rounded-full">
              <Text className="text-white text-xs">{bills.length}</Text>
            </View>
          </View>
          <View onClick={handleClose}>
            <X size={18} color="#8c8c8c" />
          </View>
        </View>

        <ScrollView scrollX className="whitespace-nowrap">
          {bills.map(bill => {
            const daysUntil = getDaysUntilDue(bill.next_due_date)
            const isOverdue = daysUntil < 0

            return (
              <View 
                key={bill.id} 
                className={`inline-block mr-3 p-3 rounded-xl min-w-64 ${isOverdue ? 'bg-red-50' : 'bg-orange-50'}`}
              >
                <View className="flex items-center justify-between mb-2">
                  <View className="flex items-center gap-1">
                    <DollarSign size={14} color={isOverdue ? '#ef4444' : '#f97316'} />
                    <Text className="font-semibold text-gray-900">¥{bill.amount.toLocaleString()}</Text>
                  </View>
                  {isOverdue ? (
                    <Text className="text-xs text-red-500">已逾期{Math.abs(daysUntil)}天</Text>
                  ) : (
                    <Text className="text-xs text-orange-500">{daysUntil}天后到期</Text>
                  )}
                </View>

                <View className="flex items-center gap-1 mb-1" onClick={() => handleViewProperty(bill.properties.id)}>
                  <MapPin size={12} color="#999" />
                  <Text className="text-xs text-gray-600 truncate">
                    {bill.properties.community}{bill.properties.building ? ` ${bill.properties.building}` : ''}
                  </Text>
                </View>

                {bill.tenant_name && (
                  <View className="flex items-center gap-2 mb-2">
                    <Text className="text-xs text-gray-500">{bill.tenant_name}</Text>
                    {bill.tenant_phone && (
                      <View onClick={() => handleCall(bill.tenant_phone!)}>
                        <Phone size={12} color="#22c55e" />
                      </View>
                    )}
                  </View>
                )}

                <View 
                  className="py-2 rounded-lg bg-green-500 flex items-center justify-center"
                  onClick={() => handleMarkPaid(bill.id)}
                >
                  <Text className="text-white text-xs">确认收款</Text>
                </View>
              </View>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

export default RentBillReminder
