import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { 
  MapPin, House, Pencil, Trash2, Plus, DollarSign, Phone, Calendar, Check
} from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePropertyStore } from '@/stores/property'
import { useRentBillStore } from '@/stores/rentBill'

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
  
  // 本地存储
  const property = usePropertyStore(state => state.getProperty(id!))
  const updateProperty = usePropertyStore(state => state.updateProperty)
  const deleteProperty = usePropertyStore(state => state.deleteProperty)
  const bills = useRentBillStore(state => state.getBillsByProperty(id!))
  const markBillPaid = useRentBillStore(state => state.markAsPaid)
  const deleteBill = useRentBillStore(state => state.deleteBill)

  const handleEdit = () => {
    console.log('点击编辑按钮')
    Taro.navigateTo({ url: `/pages/properties/form/index?id=${id}` })
  }

  const handleDelete = async () => {
    console.log('点击删除按钮')
    const res = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
    })
    
    if (res.confirm) {
      // 删除关联的账单
      bills.forEach(bill => deleteBill(bill.id))
      // 删除房源
      deleteProperty(id!)
      Taro.showToast({ title: '删除成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    }
  }

  const handleAddBill = () => {
    console.log('点击添加账单按钮')
    // 如果房源不是已租状态，先提示用户
    if (property && property.status !== 'rented') {
      Taro.showModal({
        title: '提示',
        content: '添加账单将自动把房源状态改为「已租」，是否继续？',
        success: (res) => {
          if (res.confirm) {
            // 更新房源状态为已租
            updateProperty(id!, { status: 'rented' })
            // 跳转到账单添加页面
            Taro.navigateTo({ url: `/pages/rent-bills/form/index?propertyId=${id}` })
          }
        }
      })
    } else {
      Taro.navigateTo({ url: `/pages/rent-bills/form/index?propertyId=${id}` })
    }
  }

  const handleEditBill = (billId: string) => {
    console.log('点击编辑账单:', billId)
    Taro.navigateTo({ url: `/pages/rent-bills/form/index?propertyId=${id}&id=${billId}` })
  }

  const handleMarkPaid = (billId: string) => {
    console.log('标记已收款:', billId)
    markBillPaid(billId)
    Taro.showToast({ title: '已标记收款', icon: 'success' })
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

  // 计算待收款总额
  const pendingAmount = bills
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0)

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
              
              {property.remark && (
                <View className="mt-3 p-2 bg-gray-50 rounded">
                  <Text className="text-sm text-gray-600">{property.remark}</Text>
                </View>
              )}
            </CardContent>
          </Card>

          {/* 应收账单 - 所有房源都显示 */}
          <Card>
            <CardHeader>
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <CardTitle>应收账单</CardTitle>
                  {pendingAmount > 0 && (
                    <Badge className="bg-red-500 text-white">
                      待收 ¥{pendingAmount.toLocaleString()}
                    </Badge>
                  )}
                </View>
                <View 
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-sky-500"
                  onClick={handleAddBill}
                >
                  <Plus size={16} color="#fff" />
                  <Text className="text-white text-sm">添加</Text>
                </View>
              </View>
            </CardHeader>
            <CardContent>
              {bills.length === 0 ? (
                <View className="py-6 text-center">
                  <DollarSign size={40} color="#d1d5db" />
                  <Text className="text-gray-400 block mb-2">暂无账单记录</Text>
                  <Text className="text-xs text-gray-300">点击右上角「添加」创建收租账单</Text>
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
                          {bill.status === 'paid' ? (
                            <Badge className="bg-green-500 text-white text-xs">已收款</Badge>
                          ) : (
                            <>
                              {isOverdue && (
                                <Badge className="bg-red-500 text-white text-xs">已逾期</Badge>
                              )}
                              {isUpcoming && (
                                <Badge className="bg-orange-500 text-white text-xs">{daysUntil}天后</Badge>
                              )}
                            </>
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

                        {bill.status !== 'paid' && (
                          <View className="flex gap-2">
                            <View 
                              className="flex-1 py-2 rounded-lg bg-green-500 flex items-center justify-center"
                              onClick={() => handleMarkPaid(bill.id)}
                            >
                              <Check size={14} color="#fff" />
                              <Text className="text-white text-sm ml-1">确认收款</Text>
                            </View>
                            <View 
                              className="px-3 py-2 rounded-lg bg-gray-200 flex items-center justify-center"
                              onClick={() => handleEditBill(bill.id)}
                            >
                              <Pencil size={14} color="#666" />
                            </View>
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </CardContent>
          </Card>

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
          
          {/* 使用提示 */}
          <View className="p-3 bg-amber-50 rounded-lg">
            <Text className="text-xs text-amber-700">
              💡 使用提示：{'\n'}
              • 点击「添加」按钮创建收租账单{'\n'}
              • 添加账单后房源会自动标记为「已租」{'\n'}
              • 系统会在账单日前提醒您收租
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 底部操作栏 - 使用原生 View 确保事件触发 */}
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
        <View 
          className="flex-1 h-11 rounded-lg flex items-center justify-center border border-red-200"
          onClick={handleDelete}
        >
          <Trash2 size={18} color="#ef4444" />
          <Text className="text-red-500 ml-2">删除</Text>
        </View>
        <View 
          className="flex-1 h-11 rounded-lg flex items-center justify-center bg-sky-500"
          onClick={handleEdit}
        >
          <Pencil size={18} color="#fff" />
          <Text className="text-white ml-2">编辑</Text>
        </View>
      </View>
    </View>
  )
}
