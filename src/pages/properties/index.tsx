import { useState, useCallback } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Network } from '@/network'
import { Search, Plus, MapPin, Building, House, Pencil } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Property {
  id: string
  community: string
  building: string | null
  address: string
  layout: string | null
  area?: number
  price?: number
  status: 'available' | 'rented' | 'sold'
  images: string[]
  created_at: string
}

const statusConfig = {
  available: { label: '空置', variant: 'default' as const },
  rented: { label: '已租', variant: 'secondary' as const },
  sold: { label: '已售', variant: 'outline' as const },
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/properties',
        method: 'GET',
      })
      
      console.log('房源列表响应:', res.data)
      setProperties(res.data.data || [])
    } catch (error) {
      console.error('获取房源列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    fetchProperties()
  })

  usePullDownRefresh(() => {
    fetchProperties().finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const filteredProperties = properties.filter(p => 
    p.community.includes(searchKeyword) || 
    p.address.includes(searchKeyword)
  )

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
          <Text>添加房源</Text>
        </Button>
      </View>

      {/* 房源列表 */}
      <ScrollView scrollY className="flex-1 px-4 py-3">
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : filteredProperties.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Building size={48} color="#d1d5db" />
            <Text className="block mt-4 text-gray-400">暂无房源</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredProperties.map(property => (
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
                        <Badge variant={statusConfig[property.status].variant}>
                          {statusConfig[property.status].label}
                        </Badge>
                      </View>

                      <View className="flex items-center gap-1 mb-2">
                        <MapPin size={14} color="#999" />
                        <Text className="text-sm text-gray-500 truncate flex-1">
                          {property.address}
                        </Text>
                      </View>

                      <View className="flex items-center gap-3 text-sm text-gray-600">
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
                    </View>

                    {/* 编辑按钮 */}
                    <View className="flex items-center">
                      <View 
                        className="p-2 rounded-lg bg-gray-50"
                        onClick={(e) => handleEdit(property.id, e)}
                      >
                        <Pencil size={18} color="#666" />
                      </View>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
