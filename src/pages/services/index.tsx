import { useState, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Network } from '@/network'
import { Search, Plus, Phone, Calendar, MapPin, Wrench, Car, Package } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Service {
  id: string
  service_type: 'move' | 'clean' | 'repair' | 'other'
  title: string
  provider_name: string
  provider_phone: string
  price?: number
  status: 'pending' | 'processing' | 'completed'
  scheduled_date?: string
  address?: string
  notes?: string
  created_at: string
}

const serviceTypeConfig = {
  move: { label: '搬家服务', icon: Car, color: '#3b82f6' },
  clean: { label: '保洁服务', icon: Package, color: '#10b981' },
  repair: { label: '维修服务', icon: Wrench, color: '#f59e0b' },
  other: { label: '其他服务', icon: Package, color: '#6b7280' },
}

const statusConfig = {
  pending: { label: '待处理', variant: 'default' as const },
  processing: { label: '进行中', variant: 'secondary' as const },
  completed: { label: '已完成', variant: 'outline' as const },
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/services',
        method: 'GET',
      })
      
      console.log('服务列表响应:', res.data)
      setServices(res.data.data || [])
    } catch (error) {
      console.error('获取服务列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    fetchServices()
  })

  usePullDownRefresh(() => {
    fetchServices().finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const filteredServices = services.filter(s => 
    s.title.includes(searchKeyword) || 
    s.provider_name.includes(searchKeyword)
  )

  const handleAdd = () => {
    Taro.navigateTo({ url: '/pages/services/form/index' })
  }

  const handleCall = (phone: string, e: any) => {
    e.stopPropagation()
    Taro.makePhoneCall({ phoneNumber: phone })
  }

  const handleDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/services/form/index?id=${id}` })
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* 搜索栏 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
          <Search size={18} color="#999" />
          <input
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent"
            placeholder="搜索服务..."
            value={searchKeyword}
            onInput={(e) => setSearchKeyword((e as any).detail.value)}
          />
        </View>
      </View>

      {/* 添加按钮 */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <Button onClick={handleAdd} className="w-full bg-sky-500 text-white rounded-xl">
          <Plus size={18} color="#fff" className="mr-2" />
          <Text>添加服务</Text>
        </Button>
      </View>

      {/* 服务列表 */}
      <ScrollView scrollY className="flex-1 px-4 py-3">
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : filteredServices.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Package size={48} color="#d1d5db" />
            <Text className="block mt-4 text-gray-400">暂无服务记录</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredServices.map(service => {
              const ServiceIcon = serviceTypeConfig[service.service_type].icon
              const serviceColor = serviceTypeConfig[service.service_type].color
              
              return (
                <Card key={service.id} onClick={() => handleDetail(service.id)}>
                  <CardContent className="p-4">
                    <View className="flex gap-3">
                      {/* 服务图标 */}
                      <View 
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${serviceColor}15` }}
                      >
                        <ServiceIcon size={24} color={serviceColor} />
                      </View>

                      {/* 服务信息 */}
                      <View className="flex-1 min-w-0">
                        <View className="flex items-center justify-between mb-2">
                          <Text className="block font-semibold text-gray-900 truncate flex-1">
                            {service.title}
                          </Text>
                          <Badge variant={statusConfig[service.status].variant}>
                            {statusConfig[service.status].label}
                          </Badge>
                        </View>

                        <View className="flex items-center gap-2 mb-2">
                          <Text className="text-sm text-gray-600">{service.provider_name}</Text>
                          {service.price && (
                            <Text className="text-sm text-sky-500 font-semibold">
                              ¥{service.price}
                            </Text>
                          )}
                        </View>

                        {service.scheduled_date && (
                          <View className="flex items-center gap-1 mb-2">
                            <Calendar size={14} color="#999" />
                            <Text className="text-sm text-gray-500">
                              {new Date(service.scheduled_date).toLocaleDateString()}
                            </Text>
                          </View>
                        )}

                        {service.address && (
                          <View className="flex items-center gap-1">
                            <MapPin size={14} color="#999" />
                            <Text className="text-sm text-gray-500 truncate flex-1">
                              {service.address}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 拨打电话按钮 */}
                      <View className="flex items-center">
                        <View 
                          className="p-2 rounded-lg bg-sky-50"
                          onClick={(e) => handleCall(service.provider_phone, e)}
                        >
                          <Phone size={18} color="#0ea5e9" />
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
    </View>
  )
}
