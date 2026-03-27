import { useState, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Network } from '@/network'
import { Plus, Pencil, Trash2, Phone, Star } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Provider {
  id: string
  service_type: string
  name: string
  contact_person?: string
  phone: string
  wechat?: string
  address?: string
  description?: string
  price_range?: string
  rating: number
  is_active: boolean
  sort_order: number
  created_at: string
}

const serviceTypeConfig: Record<string, { label: string; color: string }> = {
  move: { label: '搬家服务', color: '#3b82f6' },
  clean: { label: '保洁服务', color: '#10b981' },
  repair: { label: '维修服务', color: '#f59e0b' },
  decoration: { label: '装修服务', color: '#8b5cf6' },
  housekeeping: { label: '家政服务', color: '#ec4899' },
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    fetchProviders()
  })

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/providers/admin/all',
        method: 'GET',
      })
      
      console.log('服务商列表响应:', res.data)
      setProviders(res.data.data || [])
    } catch (error: any) {
      console.error('获取服务商列表失败:', error)
      if (error.status === 403) {
        Taro.showToast({ title: '仅管理员可访问', icon: 'none' })
        setTimeout(() => Taro.navigateBack(), 1500)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAdd = () => {
    Taro.navigateTo({ url: '/pages/admin/providers/form/index' })
  }

  const handleEdit = (id: string) => {
    Taro.navigateTo({ url: `/pages/admin/providers/form/index?id=${id}` })
  }

  const handleDelete = async (id: string, name: string) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除服务商"${name}"吗？`,
    })
    
    if (res.confirm) {
      try {
        await Network.request({
          url: `/api/providers/${id}`,
          method: 'DELETE',
        })
        Taro.showToast({ title: '删除成功', icon: 'success' })
        fetchProviders()
      } catch (error: any) {
        Taro.showToast({ 
          title: error.message || '删除失败', 
          icon: 'none' 
        })
      }
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await Network.request({
        url: `/api/providers/${id}`,
        method: 'PUT',
        data: { is_active: !currentStatus },
      })
      Taro.showToast({ title: '更新成功', icon: 'success' })
      fetchProviders()
    } catch (error: any) {
      Taro.showToast({ 
        title: error.message || '更新失败', 
        icon: 'none' 
      })
    }
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* 顶部操作栏 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Button onClick={handleAdd} className="w-full bg-blue-500 text-white rounded-xl">
          <Plus size={18} color="#fff" className="mr-2" />
          <Text>添加服务商</Text>
        </Button>
      </View>

      {/* 服务商列表 */}
      <ScrollView scrollY className="flex-1 p-4">
        {providers.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="block text-gray-400">暂无服务商</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {providers.map(provider => (
              <Card key={provider.id}>
                <CardContent className="p-4">
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-1">
                        <Text className="text-lg font-semibold text-gray-900">{provider.name}</Text>
                        {!provider.is_active && (
                          <Badge variant="secondary">已禁用</Badge>
                        )}
                      </View>
                      <Badge 
                        style={{ 
                          backgroundColor: `${serviceTypeConfig[provider.service_type]?.color || '#6b7280'}15`,
                          color: serviceTypeConfig[provider.service_type]?.color || '#6b7280'
                        }}
                      >
                        {serviceTypeConfig[provider.service_type]?.label || provider.service_type}
                      </Badge>
                    </View>
                    <View className="flex items-center gap-1">
                      <Star size={16} color="#f59e0b" />
                      <Text className="text-sm font-medium">{provider.rating}</Text>
                    </View>
                  </View>

                  <View className="space-y-2 mb-3">
                    <View className="flex items-center gap-2">
                      <Phone size={14} color="#666" />
                      <Text className="text-sm text-gray-600">{provider.phone}</Text>
                    </View>
                    {provider.contact_person && (
                      <Text className="text-sm text-gray-600">联系人：{provider.contact_person}</Text>
                    )}
                    {provider.price_range && (
                      <Text className="text-sm text-gray-600">价格：{provider.price_range}</Text>
                    )}
                  </View>

                  {provider.description && (
                    <Text className="text-sm text-gray-500 mb-3">{provider.description}</Text>
                  )}

                  <View className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleToggleStatus(provider.id, provider.is_active)}
                    >
                      <Text className={provider.is_active ? 'text-orange-500' : 'text-green-500'}>
                        {provider.is_active ? '禁用' : '启用'}
                      </Text>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEdit(provider.id)}
                    >
                      <Pencil size={14} color="#666" className="mr-1" />
                      <Text>编辑</Text>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleDelete(provider.id, provider.name)}
                    >
                      <Trash2 size={14} color="#ef4444" className="mr-1" />
                      <Text className="text-red-500">删除</Text>
                    </Button>
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
