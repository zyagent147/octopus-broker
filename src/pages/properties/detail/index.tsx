import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { 
  MapPin, House, Phone, 
  Pencil, Trash2, FileText, Star
} from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Property {
  id: string
  name: string
  address: string
  property_type: 'apartment' | 'house' | 'villa' | 'shop'
  area?: number
  price?: number
  layout?: string
  floor?: string
  orientation?: string
  decoration?: string
  status: 'available' | 'rented' | 'sold'
  cover_image?: string
  images?: string[]
  tags?: string[]
  description?: string
  contact_name?: string
  contact_phone?: string
  created_at: string
}

const statusConfig = {
  available: { label: '空置', variant: 'default' as const, color: '#10b981' },
  rented: { label: '已租', variant: 'secondary' as const, color: '#6b7280' },
  sold: { label: '已售', variant: 'outline' as const, color: '#9ca3af' },
}

const propertyTypeConfig = {
  apartment: '公寓',
  house: '住宅',
  villa: '别墅',
  shop: '商铺',
}

export default function PropertyDetailPage() {
  const router = useRouter()
  const { id } = router.params
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProperty()
    }
  }, [id])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/properties/${id}`,
        method: 'GET',
      })
      
      console.log('房源详情响应:', res.data)
      setProperty(res.data.data)
    } catch (error) {
      console.error('获取房源详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
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
      } catch (error) {
        Taro.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }

  const handleCall = () => {
    if (property?.contact_phone) {
      Taro.makePhoneCall({ phoneNumber: property.contact_phone })
    }
  }

  const handleGenerateCopy = () => {
    Taro.navigateTo({ url: `/pages/properties/ai-copy/index?id=${id}` })
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
        {/* 房源图片轮播 */}
        <View className="relative">
          {property.cover_image ? (
            <Image 
              src={property.cover_image} 
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
                {property.name}
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
                <Badge variant="outline">{propertyTypeConfig[property.property_type]}</Badge>
                {property.area && <Badge variant="outline">{property.area}㎡</Badge>}
                {property.layout && <Badge variant="outline">{property.layout}</Badge>}
                {property.floor && <Badge variant="outline">{property.floor}</Badge>}
                {property.orientation && <Badge variant="outline">{property.orientation}</Badge>}
              </View>

              {property.tags && property.tags.length > 0 && (
                <View className="flex flex-wrap gap-2 mt-3">
                  {property.tags.map((tag, index) => (
                    <View key={index} className="px-2 py-1 bg-sky-50 rounded text-xs text-sky-600">
                      {tag}
                    </View>
                  ))}
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
                {property.decoration && (
                  <View className="flex items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-gray-500">装修情况</Text>
                    <Text className="text-gray-900">{property.decoration}</Text>
                  </View>
                )}
                <View className="flex items-center justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-500">房源类型</Text>
                  <Text className="text-gray-900">{propertyTypeConfig[property.property_type]}</Text>
                </View>
                <View className="flex items-center justify-between py-2">
                  <Text className="text-gray-500">录入时间</Text>
                  <Text className="text-gray-900">
                    {new Date(property.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 房源描述 */}
          {property.description && (
            <Card>
              <CardHeader>
                <CardTitle>房源描述</CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="text-sm text-gray-600 leading-relaxed">
                  {property.description}
                </Text>
              </CardContent>
            </Card>
          )}

          {/* 联系信息 */}
          {property.contact_name && (
            <Card>
              <CardHeader>
                <CardTitle>联系信息</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="flex items-center justify-between">
                  <View>
                    <Text className="text-gray-900">{property.contact_name}</Text>
                    {property.contact_phone && (
                      <Text className="text-sm text-gray-500 mt-1">{property.contact_phone}</Text>
                    )}
                  </View>
                  {property.contact_phone && (
                    <Button size="sm" onClick={handleCall} className="bg-sky-500 text-white">
                      <Phone size={16} color="#fff" className="mr-1" />
                      <Text>拨打电话</Text>
                    </Button>
                  )}
                </View>
              </CardContent>
            </Card>
          )}

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
          <Trash2 size={18} color="#ef4444" className="mr-2" />
          <Text className="text-red-500">删除</Text>
        </Button>
        <Button className="flex-1 bg-sky-500 text-white" onClick={handleEdit}>
          <Pencil size={18} color="#fff" className="mr-2" />
          <Text>编辑</Text>
        </Button>
      </View>
    </View>
  )
}
