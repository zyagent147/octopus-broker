import { useState, useMemo } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Search, Plus, MapPin, Building, House, Pencil } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { usePropertyStore } from '@/stores/property'
import { useLeaseStore } from '@/stores/lease'
import { useMonthlyBillStore, isBillOverdue } from '@/stores/monthlyBill'

const statusConfig = {
  available: { label: '空置', variant: 'default' as const, color: '#10b981' },
  rented: { label: '已租', variant: 'secondary' as const, color: '#3b82f6' },
  sold: { label: '已售', variant: 'outline' as const, color: '#9ca3af' },
}

export default function PropertiesPage() {
  const [searchKeyword, setSearchKeyword] = useState('')
  
  // 从本地存储获取原始数组
  const properties = usePropertyStore(state => state.properties)
  const leases = useLeaseStore(state => state.leases)
  const bills = useMonthlyBillStore(state => state.bills)

  // 使用 useMemo 缓存所有计算结果
  const filteredProperties = useMemo(() => {
    if (!searchKeyword) return properties
    const keyword = searchKeyword.toLowerCase()
    return properties.filter(p => 
      p.community.toLowerCase().includes(keyword) ||
      p.address.toLowerCase().includes(keyword)
    )
  }, [properties, searchKeyword])

  // 预计算每个房源的租约和账单信息
  const propertyInfo = useMemo(() => {
    const info: Record<string, { hasLease: boolean; pendingBills: number; pendingAmount: number }> = {}
    
    properties.forEach(p => {
      info[p.id] = { hasLease: false, pendingBills: 0, pendingAmount: 0 }
    })
    
    leases.forEach(l => {
      if (l.status === 'active' && info[l.property_id]) {
        info[l.property_id].hasLease = true
      }
    })
    
    bills.forEach(b => {
      if (b.status === 'pending' && info[b.property_id]) {
        info[b.property_id].pendingBills++
        info[b.property_id].pendingAmount += b.amount
      }
    })
    
    return info
  }, [properties, leases, bills])

  // 统计数据
  const stats = useMemo(() => {
    const totalPendingBills = bills.filter(b => b.status === 'pending').length
    const totalOverdueBills = bills.filter(b => isBillOverdue(b)).length
    const totalPendingAmount = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0)
    
    return {
      total: properties.length,
      available: properties.filter(p => p.status === 'available').length,
      rented: properties.filter(p => p.status === 'rented').length,
      totalPendingBills,
      totalOverdueBills,
      totalPendingAmount,
    }
  }, [properties, bills])

  const handleAdd = () => {
    Taro.navigateTo({ url: '/pages/properties/form/index' })
  }

  const handleDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/properties/detail/index?id=${id}` })
  }

  const handleEdit = (id: string, e: any) => {
    e.stopPropagation()
    Taro.navigateTo({ url: `/pages/properties/form/index?id=${id}` })
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* 搜索栏 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex items-center gap-2">
          <Search size={18} color="#999" className="shrink-0" />
          <View className="flex-1">
            <Input
              className="h-9 border-0 bg-gray-50 rounded-xl"
              placeholder="搜索房源名称或地址..."
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.detail.value)}
            />
          </View>
          <View
            className="h-9 px-4 rounded-xl bg-sky-500 flex items-center justify-center shrink-0"
            onClick={handleAdd}
          >
            <Plus size={20} color="#fff" />
          </View>
        </View>
      </View>

      {/* 统计栏 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex justify-around">
          <View className="text-center">
            <Text className="block text-xl font-bold text-sky-500">{stats.total}</Text>
            <Text className="block text-xs text-gray-500">全部房源</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="text-center">
            <Text className="block text-xl font-bold text-green-500">{stats.available}</Text>
            <Text className="block text-xs text-gray-500">待租</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="text-center">
            <Text className="block text-xl font-bold text-blue-500">{stats.rented}</Text>
            <Text className="block text-xs text-gray-500">已租</Text>
          </View>
          {stats.totalPendingAmount > 0 && (
            <>
              <View className="w-px bg-gray-200" />
              <View className="text-center">
                <Text className="block text-xl font-bold text-red-500">
                  ¥{stats.totalPendingAmount.toLocaleString()}
                </Text>
                <Text className="block text-xs text-gray-500">待收款</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* 房源列表 */}
      <ScrollView scrollY className="flex-1 px-4 py-3 pb-28">
        {filteredProperties.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Building size={48} color="#d1d5db" />
            <Text className="block mt-4 text-gray-400">
              {searchKeyword ? '未找到匹配的房源' : '暂无房源，点击右上角添加'}
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredProperties.map((property) => {
              const info = propertyInfo[property.id] || { hasLease: false, pendingBills: 0, pendingAmount: 0 }
              
              return (
                <Card 
                  key={property.id}
                  onClick={() => handleDetail(property.id)}
                >
                  <CardContent className="py-3">
                    <View className="flex gap-3">
                      {/* 图片 */}
                      <View className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {property.images && property.images.length > 0 ? (
                          <Image 
                            src={property.images[0]} 
                            className="w-full h-full"
                            mode="aspectFill"
                          />
                        ) : (
                          <View className="flex items-center justify-center h-full">
                            <House size={32} color="#d1d5db" />
                          </View>
                        )}
                      </View>

                      {/* 信息 */}
                      <View className="flex-1 min-w-0">
                        <View className="flex items-center justify-between mb-1">
                          <Text className="text-base font-semibold text-gray-900 truncate flex-1">
                            {property.community}
                          </Text>
                          <Badge 
                            className="px-2 py-1 rounded text-xs"
                            style={{ backgroundColor: statusConfig[property.status].color, color: '#fff' }}
                          >
                            {statusConfig[property.status].label}
                          </Badge>
                        </View>

                        {property.building && (
                          <Text className="text-sm text-gray-600 mb-1">{property.building}</Text>
                        )}

                        <View className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                          <MapPin size={12} color="#8c8c8c" />
                          <Text className="truncate">{property.address}</Text>
                        </View>

                        <View className="flex items-center gap-2 mb-2">
                          <Text className="text-lg font-bold text-sky-500">
                            ¥{property.price?.toLocaleString() || '面议'}
                          </Text>
                          <Text className="text-xs text-gray-400">/月</Text>
                          {property.area && (
                            <Text className="text-xs text-gray-400">| {property.area}㎡</Text>
                          )}
                        </View>

                        {/* 租约和账单信息 */}
                        {property.status === 'rented' && (
                          <View className="flex items-center gap-2">
                            {info.hasLease ? (
                              <Badge className="bg-green-100 text-green-600 text-xs">
                                已签租约
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-600 text-xs">
                                未签租约
                              </Badge>
                            )}
                            {info.pendingBills > 0 && (
                              <Badge className="bg-red-100 text-red-600 text-xs">
                                待收 ¥{info.pendingAmount.toLocaleString()}
                              </Badge>
                            )}
                          </View>
                        )}
                      </View>

                      {/* 编辑按钮 */}
                      <View 
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 self-center"
                        onClick={(e) => handleEdit(property.id, e)}
                      >
                        <Pencil size={14} color="#666" />
                      </View>
                    </View>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
