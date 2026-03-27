import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProviderForm {
  service_type: 'move' | 'clean' | 'repair' | 'decoration' | 'housekeeping'
  name: string
  contact_person: string
  phone: string
  wechat: string
  address: string
  description: string
  price_range: string
  rating: number
  is_active: boolean
  sort_order: string
}

const initialForm: ProviderForm = {
  service_type: 'move',
  name: '',
  contact_person: '',
  phone: '',
  wechat: '',
  address: '',
  description: '',
  price_range: '',
  rating: 5,
  is_active: true,
  sort_order: '0',
}

const serviceTypes = [
  { value: 'move', label: '搬家服务' },
  { value: 'clean', label: '保洁服务' },
  { value: 'repair', label: '维修服务' },
  { value: 'decoration', label: '装修服务' },
  { value: 'housekeeping', label: '家政服务' },
]

export default function ProviderFormPage() {
  const router = useRouter()
  const { id } = router.params
  const isEdit = Boolean(id)
  const [form, setForm] = useState<ProviderForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProvider()
    }
  }, [id])

  const fetchProvider = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/providers/${id}`,
        method: 'GET',
      })
      
      const data = res.data.data
      setForm({
        service_type: data.service_type || 'move',
        name: data.name || '',
        contact_person: data.contact_person || '',
        phone: data.phone || '',
        wechat: data.wechat || '',
        address: data.address || '',
        description: data.description || '',
        price_range: data.price_range || '',
        rating: data.rating || 5,
        is_active: data.is_active !== undefined ? data.is_active : true,
        sort_order: data.sort_order?.toString() || '0',
      })
    } catch (error) {
      console.error('获取服务商详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProviderForm, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Taro.showToast({ title: '请输入服务商名称', icon: 'none' })
      return
    }

    if (!form.phone.trim()) {
      Taro.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      
      const data: any = {
        service_type: form.service_type,
        name: form.name,
        phone: form.phone,
        rating: form.rating,
        is_active: form.is_active,
      }

      if (form.contact_person) data.contact_person = form.contact_person
      if (form.wechat) data.wechat = form.wechat
      if (form.address) data.address = form.address
      if (form.description) data.description = form.description
      if (form.price_range) data.price_range = form.price_range
      if (form.sort_order) data.sort_order = parseInt(form.sort_order)

      const url = isEdit ? `/api/providers/${id}` : '/api/providers'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await Network.request({ url, method, data })
      
      if (res.data.code === 200) {
        Taro.showToast({ title: isEdit ? '更新成功' : '创建成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.data.msg || '操作失败', icon: 'none' })
      }
    } catch (error: any) {
      console.error('提交失败:', error)
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    } finally {
      setSubmitting(false)
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
      <ScrollView scrollY className="flex-1 p-4">
        <View className="space-y-4">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="block text-sm text-gray-600 mb-2">服务类型 *</Text>
                <View className="flex flex-wrap gap-2">
                  {serviceTypes.map(item => (
                    <View
                      key={item.value}
                      className={`px-4 py-2 rounded-lg ${
                        form.service_type === item.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => handleInputChange('service_type', item.value)}
                    >
                      <Text className={form.service_type === item.value ? 'text-white' : ''}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">服务商名称 *</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="例如：张师傅搬家公司"
                    value={form.name}
                    onInput={(e) => handleInputChange('name', (e as any).detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">联系人</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="联系人姓名"
                    value={form.contact_person}
                    onInput={(e) => handleInputChange('contact_person', (e as any).detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">联系电话 *</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    type="number"
                    className="w-full bg-transparent"
                    placeholder="联系电话"
                    value={form.phone}
                    onInput={(e) => handleInputChange('phone', (e as any).detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">微信号</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="微信号"
                    value={form.wechat}
                    onInput={(e) => handleInputChange('wechat', (e as any).detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">地址</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="服务商地址"
                    value={form.address}
                    onInput={(e) => handleInputChange('address', (e as any).detail.value)}
                  />
                </View>
              </View>

              <View className="flex gap-4">
                <View className="flex-1">
                  <Text className="block text-sm text-gray-600 mb-2">价格范围</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="如：200-500元"
                      value={form.price_range}
                      onInput={(e) => handleInputChange('price_range', (e as any).detail.value)}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="block text-sm text-gray-600 mb-2">排序</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      type="number"
                      className="w-full bg-transparent"
                      placeholder="0"
                      value={form.sort_order}
                      onInput={(e) => handleInputChange('sort_order', (e as any).detail.value)}
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">评分（1-5星）</Text>
                <View className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <View
                      key={star}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        form.rating >= star ? 'bg-yellow-400' : 'bg-gray-200'
                      }`}
                      onClick={() => handleInputChange('rating', star)}
                    >
                      <Text className={form.rating >= star ? 'text-white' : 'text-gray-500'}>
                        ★
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">服务描述</Text>
                <View className="bg-gray-50 rounded-xl p-4">
                  <Textarea
                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                    placeholder="服务商介绍..."
                    value={form.description}
                    onInput={(e) => handleInputChange('description', (e as any).detail.value)}
                    maxlength={500}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">状态</Text>
                <View className="flex gap-4">
                  <View
                    className={`flex-1 py-2 rounded-lg text-center ${
                      form.is_active ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => handleInputChange('is_active', true)}
                  >
                    <Text className={form.is_active ? 'text-white' : ''}>启用</Text>
                  </View>
                  <View
                    className={`flex-1 py-2 rounded-lg text-center ${
                      !form.is_active ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => handleInputChange('is_active', false)}
                  >
                    <Text className={!form.is_active ? 'text-white' : ''}>禁用</Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      {/* 底部提交按钮 */}
      <View 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          backgroundColor: '#fff',
          borderTop: '1px solid #e5e7eb',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        <Button 
          className="w-full bg-blue-500 text-white rounded-xl" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Text className="text-white">{submitting ? '提交中...' : (isEdit ? '保存修改' : '创建服务商')}</Text>
        </Button>
      </View>
    </View>
  )
}
