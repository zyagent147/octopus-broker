import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useMemo, useState } from 'react'
import { 
  MapPin, House, Pencil, Trash2, Plus, Phone, 
  ChevronRight, Clock, CircleAlert, FileText, Users
} from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePropertyStore } from '@/stores/property'
import { useLeaseStore, paymentMethodConfig } from '@/stores/lease'
import { useBillStore, isBillOverdue, getDaysUntilDue, formatBillPeriod } from '@/stores/bill'

const statusConfig = {
  available: { label: '待租', variant: 'default' as const, color: '#10b981' },
  rented: { label: '已租', variant: 'secondary' as const, color: '#3b82f6' },
  sold: { label: '已售', variant: 'outline' as const, color: '#9ca3af' },
}

export default function PropertyDetailPage() {
  const router = useRouter()
  const { id } = router.params
  const [showBills, setShowBills] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // 从 store 获取原始数据和方法
  const properties = usePropertyStore(state => state.properties)
  const updateProperty = usePropertyStore(state => state.updateProperty)
  const deleteProperty = usePropertyStore(state => state.deleteProperty)
  const leases = useLeaseStore(state => state.leases)
  const deleteLease = useLeaseStore(state => state.deleteLease)
  const bills = useBillStore(state => state.bills)
  const markBillPaid = useBillStore(state => state.markAsPaid)
  const deleteBill = useBillStore(state => state.deleteBill)

  // 使用 useMemo 缓存计算结果
  const property = useMemo(() => {
    return properties.find(p => p.id === id)
  }, [properties, id])

  // 获取关联的租约（仅当房源已租时）
  const lease = useMemo(() => {
    if (!property || property.status !== 'rented') return null
    return leases.find(l => l.property_id === id && l.status === 'active')
  }, [leases, id, property])

  // 获取关联的账单
  const propertyBills = useMemo(() => {
    if (!lease) return []
    return bills.filter(b => b.lease_id === lease.id).sort((a, b) => b.period_index - a.period_index)
  }, [bills, lease])

  // 待收款账单
  const pendingBills = useMemo(() => {
    return propertyBills.filter(b => b.status === 'pending')
  }, [propertyBills])

  // 待收款金额
  const pendingAmount = useMemo(() => {
    return pendingBills.reduce((sum, b) => sum + b.amount, 0)
  }, [pendingBills])

  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/properties/form/index?id=${id}` })
  }

  const handleDelete = async () => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
    })
    
    if (res.confirm) {
      // 删除关联的租约和账单
      if (lease) {
        deleteLease(lease.id)
        propertyBills.forEach(bill => deleteBill(bill.id))
      }
      // 删除房源
      deleteProperty(id!)
      Taro.showToast({ title: '删除成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    }
  }

  const handleAddLease = () => {
    if (property && property.status !== 'rented') {
      Taro.showModal({
        title: '提示',
        content: '添加租约将自动把房源状态改为「已租」，是否继续？',
        success: (res) => {
          if (res.confirm) {
            updateProperty(id!, { status: 'rented' })
            Taro.navigateTo({ url: `/pages/lease/form/index?propertyId=${id}` })
          }
        }
      })
    } else {
      Taro.navigateTo({ url: `/pages/lease/form/index?propertyId=${id}` })
    }
  }

  const handleEditLease = () => {
    if (lease) {
      Taro.navigateTo({ url: `/pages/lease/form/index?propertyId=${id}&id=${lease.id}` })
    }
  }

  const handleMarkPaid = async (billId: string) => {
    const res = await Taro.showModal({
      title: '确认收款',
      content: '确认已收到本期租金？',
    })
    
    if (res.confirm) {
      markBillPaid(billId)
      Taro.showToast({ title: '已标记收款', icon: 'success' })
    }
  }

  const handleCall = (phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
          {property.images && property.images.length > 0 && !imageError ? (
            <Image 
              src={property.images[0]} 
              className="w-full h-64"
              mode="aspectFill"
              onError={() => {
                console.log('房源图片加载失败:', property.images[0])
                setImageError(true)
              }}
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

          {/* 租约与账单管理 - 仅当房源已租时显示 */}
          {property.status === 'rented' && (
            <>
              {/* 租约信息 */}
              <Card>
                <CardHeader>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <FileText size={18} color="#3b82f6" />
                      <CardTitle>租约信息</CardTitle>
                    </View>
                    {lease ? (
                      <View 
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100"
                        onClick={handleEditLease}
                      >
                        <Pencil size={14} color="#666" />
                        <Text className="text-gray-600 text-sm">编辑</Text>
                      </View>
                    ) : (
                      <View 
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-sky-500"
                        onClick={handleAddLease}
                      >
                        <Plus size={16} color="#fff" />
                        <Text className="text-white text-sm">添加租约</Text>
                      </View>
                    )}
                  </View>
                </CardHeader>
                <CardContent>
                  {!lease ? (
                    <View className="py-6 text-center">
                      <FileText size={40} color="#d1d5db" />
                      <Text className="text-gray-400 block mb-2">暂无租约信息</Text>
                      <Text className="text-xs text-gray-300">点击右上角「添加租约」创建</Text>
                    </View>
                  ) : (
                    <View className="space-y-3">
                      {/* 业主信息 */}
                      <View className="p-3 bg-blue-50 rounded-lg">
                        <View className="flex items-center gap-2 mb-2">
                          <Users size={14} color="#3b82f6" />
                          <Text className="text-sm font-medium text-blue-700">业主</Text>
                        </View>
                        <View className="flex items-center justify-between">
                          <Text className="text-sm text-gray-900">{lease.landlord_name}</Text>
                          <View 
                            className="p-1 rounded-full bg-green-100"
                            onClick={() => handleCall(lease.landlord_phone)}
                          >
                            <Phone size={14} color="#22c55e" />
                          </View>
                        </View>
                      </View>

                      {/* 租客信息 */}
                      <View className="p-3 bg-green-50 rounded-lg">
                        <View className="flex items-center gap-2 mb-2">
                          <Users size={14} color="#22c55e" />
                          <Text className="text-sm font-medium text-green-700">租客</Text>
                        </View>
                        <View className="flex items-center justify-between">
                          <Text className="text-sm text-gray-900">{lease.tenant_name}</Text>
                          <View 
                            className="p-1 rounded-full bg-green-100"
                            onClick={() => handleCall(lease.tenant_phone)}
                          >
                            <Phone size={14} color="#22c55e" />
                          </View>
                        </View>
                      </View>

                      {/* 租约详情 */}
                      <View className="space-y-2 text-sm">
                        <View className="flex items-center justify-between py-1">
                          <Text className="text-gray-500">月租金</Text>
                          <Text className="font-semibold text-sky-500">¥{lease.monthly_rent.toLocaleString()}</Text>
                        </View>
                        <View className="flex items-center justify-between py-1">
                          <Text className="text-gray-500">付款方式</Text>
                          <Text className="text-gray-900">{paymentMethodConfig[lease.payment_method].label}</Text>
                        </View>
                        <View className="flex items-center justify-between py-1">
                          <Text className="text-gray-500">租期</Text>
                          <Text className="text-gray-900">
                            {formatDate(lease.start_date)} 至 {formatDate(lease.end_date)}
                          </Text>
                        </View>
                        <View className="flex items-center justify-between py-1">
                          <Text className="text-gray-500">提前提醒</Text>
                          <Text className="text-gray-900">{lease.reminder_days} 天</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </CardContent>
              </Card>

              {/* 账单记录 */}
              {lease && (
                <Card>
                  <CardHeader>
                    <View className="flex items-center justify-between">
                      <View className="flex items-center gap-2">
                        <CardTitle>账单记录</CardTitle>
                        {pendingAmount > 0 && (
                          <Badge className="bg-red-500 text-white">
                            待收 ¥{pendingAmount.toLocaleString()}
                          </Badge>
                        )}
                      </View>
                      <View 
                        className="flex items-center gap-1"
                        onClick={() => setShowBills(!showBills)}
                      >
                        <Text className="text-sm text-sky-500">
                          {showBills ? '收起' : `查看全部 (${propertyBills.length})`}
                        </Text>
                        <ChevronRight 
                          size={14} 
                          color="#3b82f6"
                          style={{ transform: showBills ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        />
                      </View>
                    </View>
                  </CardHeader>
                  <CardContent>
                    {propertyBills.length === 0 ? (
                      <View className="py-4 text-center">
                        <Clock size={32} color="#d1d5db" />
                        <Text className="text-gray-400 block mt-2">暂无账单记录</Text>
                      </View>
                    ) : (
                      <View className="space-y-2">
                        {/* 显示前3条或全部 */}
                        {(showBills ? propertyBills : propertyBills.slice(0, 3)).map(bill => {
                          const isOverdue = isBillOverdue(bill)
                          const daysUntil = getDaysUntilDue(bill.due_date)
                          const isUpcoming = daysUntil >= 0 && daysUntil <= lease.reminder_days

                          return (
                            <View 
                              key={bill.id} 
                              className={`p-3 rounded-lg border ${isOverdue ? 'border-red-200 bg-red-50' : isUpcoming ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}
                            >
                              <View className="flex items-center justify-between mb-2">
                                <Text className="font-medium text-gray-900">
                                  第{bill.period_index}期 · {formatBillPeriod(bill.period_start, bill.period_end, lease.payment_method)}
                                </Text>
                                {bill.status === 'paid' ? (
                                  <Badge className="bg-green-500 text-white text-xs">已收款</Badge>
                                ) : isOverdue ? (
                                  <Badge className="bg-red-500 text-white text-xs">
                                    <CircleAlert size={10} color="#fff" />
                                    <Text className="ml-1">逾期{Math.abs(daysUntil)}天</Text>
                                  </Badge>
                                ) : isUpcoming ? (
                                  <Badge className="bg-orange-500 text-white text-xs">{daysUntil}天后</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">待收租</Badge>
                                )}
                              </View>

                              <View className="flex items-center justify-between">
                                <Text className="text-lg font-bold text-gray-900">
                                  ¥{bill.amount.toLocaleString()}
                                </Text>
                                {bill.status === 'pending' && (
                                  <View 
                                    className="px-3 py-1 rounded bg-green-500"
                                    onClick={() => handleMarkPaid(bill.id)}
                                  >
                                    <Text className="text-white text-xs">确认收款</Text>
                                  </View>
                                )}
                              </View>

                              <Text className="text-xs text-gray-400 mt-1">
                                应收日期：{formatDate(bill.due_date)}
                              </Text>

                              {bill.status === 'paid' && bill.paid_at && (
                                <Text className="text-xs text-gray-400">
                                  收款时间：{formatDate(bill.paid_at)}
                                </Text>
                              )}
                            </View>
                          )
                        })}
                      </View>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
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
          
          {/* 使用提示 */}
          <View className="p-3 bg-amber-50 rounded-lg">
            <Text className="text-xs text-amber-700">
              💡 使用提示：{'\n'}
              • 房源状态改为「已租」后可添加租约信息{'\n'}
              • 根据付款方式自动生成账单（月付/季付/半年付/年付）{'\n'}
              • 到每期付款日前会自动提醒您收租
            </Text>
          </View>
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
