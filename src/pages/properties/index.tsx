import { useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Search, Plus, MapPin, Building, House, Pencil, DollarSign } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePropertyStore } from '@/stores/property'
import { useRentBillStore } from '@/stores/rentBill'

const statusConfig = {
  available: { label: '空置', variant: 'default' as const, color: '#10b981' },
  rented: { label: '已租', variant: 'secondary' as const, color: '#3b82f6' },
  sold: { label: '已售', variant: 'outline' as const, color: '#9ca3af' },
}

export default function PropertiesPage() {
  const [searchKeyword, setSearchKeyword] = useState('')
  
  // 从本地存储获取房源列表
  const properties = usePropertyStore(state => state.properties)
  const searchProperties = usePropertyStore(state => state.searchProperties)
  const bills = useRentBillStore(state => state.bills)

  // 搜索过滤
  const filteredProperties = searchKeyword 
    ? searchProperties(searchKeyword)
    : properties

  // 获取房源的待收款账单数
  const getPendingBillCount = (propertyId: string) => {
    return bills.filter(b => b.property_id === propertyId && b.status === 'pending').length
  }

  // 获取房源的待收款金额
  const getPendingAmount = (propertyId: string) => {
    return bills
      .filter(b => b.property_id === propertyId && b.status === 'pending')
      .reduce((sum, b) => sum + b.amount, 0)
  }

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

  const handleAddBill = (id: string, e: any) => {
    e.stopPropagation()
    Taro.navigateTo({ url: `/pages/rent-bills/form/index?propertyId=${id}` })
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* 搜索栏 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
          <Search size={18} color="#999" />
          <input
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent"
            placeholder="搜索房源名称或地址..."
            value={searchKeyword}
            onInput={(e) => setSearchKeyword((e as any).detail.value)}
          />
        </View>
      </View>

      {/* 添加按钮 */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <Button onClick={handleAdd} className="w-full bg-sky-500 text-white rounded-xl">
          <Plus size={18} color="#fff" className="mr-2" />
          <Text className="text-white">添加房源</Text>
        </Button>
      </View>

      {/* 房源列表 */}
      <ScrollView scrollY className="flex-1 px-4 py-3">
        {filteredProperties.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Building size={48} color="#d1d5db" />
            <Text className="block mt-4 text-gray-400">
              {searchKeyword ? '未找到匹配的房源' : '暂无房源，点击上方按钮添加'}
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredProperties.map(property => {
              const pendingBillCount = getPendingBillCount(property.id)
              const pendingAmount = getPendingAmount(property.id)
              
              return (
                <Card key={property.id} onClick={() => handleDetail(property.id)}>
                  <CardContent className="p-4">
                    <View className="flex gap-3">
                      {/* 房源图片 */}
                      <View className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {property.images && property.images.length > 0 ? (
                          <Image 
                            src={property.images[0]} 
                            className="w-full h-full object-cover"
                            mode="aspectFill"
                          />
                        ) : (
                          <View className="flex items-center justify-center h-full">
                            <House size={32} color="#d1d5db" />
                          </View>
                        )}
                      </View>

                      {/* 房源信息 */}
                      <View className="flex-1 min-w-0">
                        <View className="flex items-center justify-between mb-2">
                          <Text className="block text-base font-semibold text-gray-900 truncate flex-1">
                            {property.community}{property.building ? ` ${property.building}` : ''}
                          </Text>
                          <Badge 
                            style={{ backgroundColor: statusConfig[property.status].color }}
                            className="text-white"
                          >
                            {statusConfig[property.status].label}
                          </Badge>
                        </View>

                        <View className="flex items-center gap-1 mb-2">
                          <MapPin size={14} color="#999" />
                          <Text className="text-sm text-gray-500 truncate flex-1">
                            {property.address}
                          </Text>
                        </View>

                        <View className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          <Text className="text-sky-500 font-semibold">
                            ¥{property.price?.toLocaleString() || '面议'}/月
                          </Text>
                          {property.area && (
                            <Text>{property.area}㎡</Text>
                          )}
                          {property.layout && (
                            <Text>{property.layout}</Text>
                          )}
                        </View>

                        {/* 待收款提示 */}
                        {pendingBillCount > 0 && (
                          <View className="flex items-center gap-1 bg-red-50 rounded-lg px-2 py-1">
                            <DollarSign size={14} color="#ef4444" />
                            <Text className="text-xs text-red-500">
                              待收 ¥{pendingAmount.toLocaleString()} ({pendingBillCount}笔)
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 操作按钮 */}
                      <View className="flex flex-col gap-2 justify-center">
                        {property.status !== 'sold' && (
                          <View 
                            className="p-2 rounded-lg bg-sky-50"
                            onClick={(e) => handleAddBill(property.id, e)}
                          >
                            <DollarSign size={16} color="#0ea5e9" />
                          </View>
                        )}
                        <View 
                          className="p-2 rounded-lg bg-gray-50"
                          onClick={(e) => handleEdit(property.id, e)}
                        >
                          <Pencil size={16} color="#666" />
                        </View>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </ScrollView>
      
      {/* 本地存储提示 */}
      <View className="px-4 py-2 bg-blue-50 border-t border-blue-100">
        <Text className="text-xs text-blue-600 text-center">
          💡 共 {properties.length} 套房源 · 点击 💵 图标快速添加账单
        </Text>
      </View>
    </View>
  )
}
