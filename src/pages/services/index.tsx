import { useState, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Network } from '@/network'
import { Search, Phone, MapPin, Star, MessageCircle } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'

interface Provider {
  id: string
  service_type: 'move' | 'clean' | 'repair' | 'decoration' | 'housekeeping'
  name: string
  contact_person?: string
  phone: string
  wechat?: string
  address?: string
  description?: string
  price_range?: string
  rating?: number
  sort_order?: number
}

const serviceTypeConfig = {
  move: { label: '搬家服务', icon: '🚚', color: '#3b82f6' },
  clean: { label: '保洁服务', icon: '🧹', color: '#10b981' },
  repair: { label: '维修服务', icon: '🔧', color: '#f59e0b' },
  decoration: { label: '装修服务', icon: '🏠', color: '#8b5cf6' },
  housekeeping: { label: '家政服务', icon: '👨‍🍳', color: '#ec4899' },
}

export default function ServicesPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/providers',
        method: 'GET',
      })
      
      console.log('服务商列表响应:', res.data)
      setProviders(res.data.data || [])
    } catch (error) {
      console.error('获取服务商列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    fetchProviders()
  })

  usePullDownRefresh(() => {
    fetchProviders().finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  // 筛选服务商
  const filteredProviders = providers.filter(p => {
    const matchType = activeType === 'all' || p.service_type === activeType
    const matchSearch = !searchKeyword || 
      p.name.includes(searchKeyword) || 
      (p.contact_person && p.contact_person.includes(searchKeyword))
    return matchType && matchSearch
  })

  // 按类型分组
  const groupedProviders = filteredProviders.reduce((acc, provider) => {
    const type = provider.service_type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(provider)
    return acc
  }, {} as Record<string, Provider[]>)

  const handleCall = (phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone })
  }

  const handleCopyWechat = (wechat: string) => {
    Taro.setClipboardData({
      data: wechat,
      success: () => {
        Taro.showToast({ title: '微信号已复制', icon: 'success' })
      }
    })
  }

  const renderStars = (rating: number = 5) => {
    return (
      <View className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={12} 
            color={star <= rating ? '#fbbf24' : '#d1d5db'} 
          />
        ))}
      </View>
    )
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* 搜索栏 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
          <Search size={18} color="#999" />
          <input
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent"
            placeholder="搜索服务商..."
            value={searchKeyword}
            onInput={(e) => setSearchKeyword((e as any).detail.value)}
          />
        </View>
      </View>

      {/* 服务类型筛选 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <ScrollView scrollX className="flex flex-row gap-2 whitespace-nowrap">
          <View
            className={`px-4 py-2 rounded-full flex-shrink-0 ${
              activeType === 'all' ? 'bg-sky-500' : 'bg-gray-100'
            }`}
            onClick={() => setActiveType('all')}
          >
            <Text className={activeType === 'all' ? 'text-white' : 'text-gray-700'}>全部</Text>
          </View>
          {Object.entries(serviceTypeConfig).map(([key, config]) => (
            <View
              key={key}
              className={`px-4 py-2 rounded-full flex-shrink-0 ${
                activeType === key ? 'bg-sky-500' : 'bg-gray-100'
              }`}
              onClick={() => setActiveType(key)}
            >
              <Text className={activeType === key ? 'text-white' : 'text-gray-700'}>
                {config.icon} {config.label}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 服务商列表 */}
      <ScrollView scrollY className="flex-1 px-4 py-3">
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : filteredProviders.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="text-4xl">🔍</Text>
            <Text className="block mt-4 text-gray-400">暂无服务商</Text>
            <Text className="block mt-2 text-gray-300 text-sm">请联系管理员添加</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {activeType === 'all' ? (
              // 按类型分组显示
              Object.entries(groupedProviders).map(([type, typeProviders]) => (
                <View key={type} className="mb-4">
                  <View className="flex items-center gap-2 mb-2">
                    <Text className="text-lg">
                      {serviceTypeConfig[type as keyof typeof serviceTypeConfig]?.icon}
                    </Text>
                    <Text className="font-semibold text-gray-800">
                      {serviceTypeConfig[type as keyof typeof serviceTypeConfig]?.label}
                    </Text>
                    <Text className="text-sm text-gray-400">({typeProviders.length})</Text>
                  </View>
                  {typeProviders.map(provider => renderProviderCard(provider))}
                </View>
              ))
            ) : (
              // 单类型显示
              filteredProviders.map(provider => renderProviderCard(provider))
            )}
          </View>
        )}
      </ScrollView>

      {/* 底部提示 */}
      <View className="px-4 py-3 bg-white border-t border-gray-100">
        <Text className="block text-center text-xs text-gray-400">
          如需新增服务商，请联系管理员
        </Text>
      </View>
    </View>
  )

  function renderProviderCard(provider: Provider) {
    const config = serviceTypeConfig[provider.service_type]
    
    return (
      <Card key={provider.id} className="mb-2">
        <CardContent className="p-4">
          <View className="flex gap-3">
            {/* 服务图标 */}
            <View 
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${config.color}15` }}
            >
              <Text className="text-2xl">{config.icon}</Text>
            </View>

            {/* 服务商信息 */}
            <View className="flex-1 min-w-0">
              <View className="flex items-center justify-between mb-1">
                <Text className="block font-semibold text-gray-900 truncate flex-1">
                  {provider.name}
                </Text>
                {renderStars(provider.rating)}
              </View>

              {provider.contact_person && (
                <Text className="text-sm text-gray-600 mb-1">
                  联系人：{provider.contact_person}
                </Text>
              )}

              {provider.price_range && (
                <Text className="text-sm text-sky-500 mb-1">
                  价格：{provider.price_range}
                </Text>
              )}

              {provider.address && (
                <View className="flex items-center gap-1 mb-1">
                  <MapPin size={12} color="#999" />
                  <Text className="text-sm text-gray-500 truncate flex-1">
                    {provider.address}
                  </Text>
                </View>
              )}

              {provider.description && (
                <Text className="text-xs text-gray-400 mt-2 line-clamp-2">
                  {provider.description}
                </Text>
              )}
            </View>
          </View>

          {/* 联系方式按钮 */}
          <View className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            <View 
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-sky-50"
              onClick={() => handleCall(provider.phone)}
            >
              <Phone size={16} color="#0ea5e9" />
              <Text className="text-sky-500 text-sm">拨打电话</Text>
            </View>
            {provider.wechat && (
              <View 
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-green-50"
                onClick={() => handleCopyWechat(provider.wechat!)}
              >
                <MessageCircle size={16} color="#10b981" />
                <Text className="text-green-500 text-sm">复制微信</Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    )
  }
}
