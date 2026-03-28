import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { 
  MapPin, House, Pencil, Trash2, FileText, Star, Plus, DollarSign, Phone, Calendar, Check
} from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Property {
  id: string
  community: string
  building: string | null
  address: string
  layout: string | null
  area: number | null
  price: number | null
  status: 'available' | 'rented' | 'sold'
  images: string[]
  created_at: string
  updated_at: string | null
}

interface RentBill {
  id: string
  tenant_name: string | null
  tenant_phone: string | null
  amount: number
  payment_cycle: 'monthly' | 'quarterly' | 'custom'
  custom_days: number | null
  bill_date: number
  next_due_date: string
  status: 'pending' | 'paid' | 'overdue'
  created_at: string
}

const statusConfig = {
  available: { label: '空置', variant: 'default' as const, color: '#10b981' },
  rented: { label: '已租', variant: 'secondary' as const, color: '#3b82f6' },
  sold: { label: '已售', variant: 'outline' as const, color: '#9ca3af' },
}

const paymentCycleConfig = {
  monthly: '月付',
  quarterly: '季付',
  custom: '自定义',
}

export default function PropertyDetailPage() {
  const router = useRouter()
  const { id } = router.params
  const [property, setProperty] = useState<Property | null>(null)
  const [bills, setBills] = useState<RentBill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProperty()
      fetchBills()
    }
  }, [id])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/properties/${id}`,
        method: 'GET',
      })
      
      setProperty(res.data.data)
    } catch (error) {
      console.error('获取房源详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const fetchBills = async () => {
    try {
      const res = await Network.request({
        url: `/api/rent-bills/property/${id}`,
        method: 'GET',
      })
      
      setBills(res.data.data || [])
    } catch (error) {
      console.error('获取账单列表失败:', error)
    }
  }

  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/properties/form/index?id=${id}` })
  }

  const handleDelete = async () => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
    })
    
    if (res.confirm) {
      try {
        await Network.request({
          url: `/api/properties/${id}`,
          method: 'DELETE',
        })
        Taro.showToast({ title: '删除成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } catch {
        Taro.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }

  const handleGenerateCopy = () => {
    Taro.navigateTo({ url: `/pages/properties/ai-copy/index?id=${id}` })
  }

  const handleAddBill = () => {
    Taro.navigateTo({ url: `/pages/rent-bills/form/index?propertyId=${id}` })
  }

  const handleEditBill = (billId: string) => {
    Taro.navigateTo({ url: `/pages/rent-bills/form/index?propertyId=${id}&id=${billId}` })
  }

  const handleMarkPaid = async (billId: string) => {
    try {
      const res = await Network.request({
        url: `/api/rent-bills/${billId}/mark-paid`,
        method: 'POST',
      })
      
      if (res.data.code === 200) {
        Taro.showToast({ title: '已标记收款', icon: 'success' })
        fetchBills()
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

  if (loading) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  if (!property) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="text-gray-400">房源不存在</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      <ScrollView scrollY className="flex-1">
        {/* 房源图片 */}
        <View className="relative">
          {property.images && property.images.length > 0 ? (
            <Image 
              src={property.images[0]} 
              className="w-full h-64"
              mode="aspectFill"
            />
          ) : (
            <View className="flex items-center justify-center h-64 bg-gray-100">
              <House size={64} color="#d1d5db" />
            </View>
          )}
          
          {/* 状态标签 */}
          <View 
            className="absolute top-3 right-3 px-3 py-1 rounded-full"
            style={{ backgroundColor: statusConfig[property.status].color }}
          >
            <Text className="text-white text-sm">{statusConfig[property.status].label}</Text>
          </View>
        </View>

        <View className="p-4 space-y-3">
          {/* 基本信息 */}
          <Card>
            <CardContent className="p-4">
              <Text className="block text-xl font-bold text-gray-900 mb-2">
                {property.community}{property.building ? ` ${property.building}` : ''}
              </Text>
              
              <View className="flex items-center gap-1 mb-3">
                <MapPin size={16} color="#666" />
                <Text className="text-sm text-gray-600 flex-1">{property.address}</Text>
              </View>

              <View className="flex items-center gap-2 mb-3">
                <Text className="text-2xl font-bold text-sky-500">
                  ¥{property.price?.toLocaleString() || '面议'}
                </Text>
                <Text className="text-sm text-gray-500">/月</Text>
              </View>

              <View className="flex flex-wrap gap-2">
                {property.area && <Badge variant="outline">{property.area}㎡</Badge>}
                {property.layout && <Badge variant="outline">{property.layout}</Badge>}
              </View>
            </CardContent>
          </Card>

          {/* 应收账单 - 仅已租房源显示 */}
          {property.status === 'rented' && (
            <Card>
              <CardHeader>
                <View className="flex items-center justify-between">
                  <CardTitle>应收账单</CardTitle>
                  <Button size="sm" className="bg-sky-500 text-white" onClick={handleAddBill}>
                    <Plus size={16} color="#fff" />
                    <Text className="text-white ml-1">添加</Text>
                  </Button>
                </View>
              </CardHeader>
              <CardContent>
                {bills.length === 0 ? (
                  <View className="py-4 text-center">
                    <Text className="text-gray-400">暂无账单记录</Text>
                  </View>
                ) : (
                  <View className="space-y-3">
                    {bills.map(bill => {
                      const daysUntil = getDaysUntilDue(bill.next_due_date)
                      const isOverdue = daysUntil < 0
                      const isUpcoming = daysUntil >= 0 && daysUntil <= 3

                      return (
                        <View 
                          key={bill.id} 
                          className={`p-3 rounded-xl border ${isOverdue ? 'border-red-200 bg-red-50' : isUpcoming ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}
                        >
                          <View className="flex items-center justify-between mb-2">
                            <View className="flex items-center gap-2">
                              <DollarSign size={16} color={isOverdue ? '#ef4444' : isUpcoming ? '#f97316' : '#3b82f6'} />
                              <Text className="font-semibold text-gray-900">
                                ¥{bill.amount.toLocaleString()}
                              </Text>
                              <Badge variant="outline" className="text-xs">
                                {paymentCycleConfig[bill.payment_cycle]}
                              </Badge>
                            </View>
                            {isOverdue && (
                              <Badge className="bg-red-500 text-white text-xs">已逾期</Badge>
                            )}
                            {isUpcoming && (
                              <Badge className="bg-orange-500 text-white text-xs">{daysUntil}天后</Badge>
                            )}
                          </View>

                          {bill.tenant_name && (
                            <View className="flex items-center gap-2 mb-1">
                              <Text className="text-sm text-gray-500">租客：</Text>
                              <Text className="text-sm text-gray-900">{bill.tenant_name}</Text>
                              {bill.tenant_phone && (
                                <View 
                                  className="p-1 rounded-full bg-green-100"
                                  onClick={() => handleCall(bill.tenant_phone!)}
                                >
                                  <Phone size={14} color="#22c55e" />
                                </View>
                              )}
                            </View>
                          )}

                          <View className="flex items-center gap-2 mb-2">
                            <Calendar size={14} color="#999" />
                            <Text className="text-sm text-gray-500">
                              账单日：每月{bill.bill_date}号
                            </Text>
                            <Text className="text-sm text-gray-500">|</Text>
                            <Text className="text-sm text-gray-500">
                              下次：{formatDate(bill.next_due_date)}
                            </Text>
                          </View>

                          <View className="flex gap-2">
                            <View 
                              className="flex-1 py-2 rounded-lg bg-green-500 flex items-center justify-center"
                              onClick={() => handleMarkPaid(bill.id)}
                            >
                              <Check size={14} color="#fff" />
                              <Text className="text-white text-sm ml-1">确认收款</Text>
                            </View>
                            <View 
                              className="px-3 py-2 rounded-lg bg-gray-200"
                              onClick={() => handleEditBill(bill.id)}
                            >
                              <Pencil size={14} color="#666" />
                            </View>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                )}
              </CardContent>
            </Card>
          )}

          {/* 详细信息 */}
          <Card>
            <CardHeader>
              <CardTitle>房源信息</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="space-y-2">
                <View className="flex items-center justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-500">小区名称</Text>
                  <Text className="text-gray-900">{property.community}</Text>
                </View>
                {property.building && (
                  <View className="flex items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-gray-500">楼栋信息</Text>
                    <Text className="text-gray-900">{property.building}</Text>
                  </View>
                )}
                <View className="flex items-center justify-between py-2">
                  <Text className="text-gray-500">录入时间</Text>
                  <Text className="text-gray-900">
                    {new Date(property.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* AI文案生成 */}
          <Card onClick={handleGenerateCopy}>
            <CardContent className="p-4">
              <View className="flex items-center gap-3">
                <View className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                  <Star size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="block font-semibold text-gray-900">AI智能文案</Text>
                  <Text className="block text-sm text-gray-500">一键生成小红书推广文案</Text>
                </View>
                <FileText size={20} color="#999" />
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#fff',
          borderTop: '1px solid #e5e7eb',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        <Button variant="outline" className="flex-1" onClick={handleDelete}>
          <Trash2 size={18} color="#ef4444" />
          <Text className="text-red-500 ml-2">删除</Text>
        </Button>
        <Button className="flex-1 bg-sky-500 text-white" onClick={handleEdit}>
          <Pencil size={18} color="#fff" />
          <Text className="text-white ml-2">编辑</Text>
        </Button>
      </View>
    </View>
  )
}
