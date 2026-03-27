import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, Check } from 'lucide-react-taro'

interface Provider {
  id: string
  name: string
  phone: string
  service_type: string
  price_range?: string
}

interface ServiceForm {
  service_type: 'move' | 'clean' | 'repair' | 'other'
  title: string
  provider_name: string
  provider_phone: string
  provider_id?: string
  price: string
  status: 'pending' | 'processing' | 'completed'
  scheduled_date: string
  address: string
  notes: string
}

const initialForm: ServiceForm = {
  service_type: 'other',
  title: '',
  provider_name: '',
  provider_phone: '',
  provider_id: undefined,
  price: '',
  status: 'pending',
  scheduled_date: '',
  address: '',
  notes: '',
}

export default function ServiceFormPage() {
  const router = useRouter()
  const { id } = router.params
  const isEdit = Boolean(id)
  const [form, setForm] = useState<ServiceForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [showProviderPicker, setShowProviderPicker] = useState(false)

  useEffect(() => {
    // 加载服务商列表
    fetchProviders()
    
    if (id) {
      fetchService()
    }
  }, [id])

  const fetchProviders = async () => {
    try {
      const res = await Network.request({
        url: '/api/providers',
        method: 'GET',
      })
      setProviders(res.data.data || [])
    } catch (error) {
      console.error('获取服务商列表失败:', error)
    }
  }

  const fetchService = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/services/${id}`,
        method: 'GET',
      })
      
      const data = res.data.data
      setForm({
        service_type: data.service_type || 'other',
        title: data.title || '',
        provider_name: data.provider_name || '',
        provider_phone: data.provider_phone || '',
        price: data.price?.toString() || '',
        status: data.status || 'pending',
        scheduled_date: data.scheduled_date?.split('T')[0] || '',
        address: data.address || '',
        notes: data.notes || '',
      })
    } catch (error) {
      console.error('获取服务详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ServiceForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Taro.showToast({ title: '请输入服务标题', icon: 'none' })
      return
    }

    if (!form.provider_name.trim()) {
      Taro.showToast({ title: '请输入服务商名称', icon: 'none' })
      return
    }

    if (!form.provider_phone.trim()) {
      Taro.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      
      const data: any = {
        service_type: form.service_type,
        title: form.title,
        provider_name: form.provider_name,
        provider_phone: form.provider_phone,
        status: form.status,
      }

      if (form.price) data.price = parseFloat(form.price)
      if (form.scheduled_date) data.scheduled_date = form.scheduled_date
      if (form.address) data.address = form.address
      if (form.notes) data.notes = form.notes

      const url = isEdit ? `/api/services/${id}` : '/api/services'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await Network.request({ url, method, data })
      
      if (res.data.code === 200) {
        Taro.showToast({ title: isEdit ? '更新成功' : '创建成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.data.msg || '操作失败', icon: 'none' })
      }
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
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
              <CardTitle>服务信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="block text-sm text-gray-600 mb-2">服务类型</Text>
                <View className="flex flex-wrap gap-2">
                  {[
                    { value: 'move', label: '搬家服务' },
                    { value: 'clean', label: '保洁服务' },
                    { value: 'repair', label: '维修服务' },
                    { value: 'other', label: '其他服务' },
                  ].map(item => (
                    <View
                      key={item.value}
                      className={`px-4 py-2 rounded-lg ${
                        form.service_type === item.value
                          ? 'bg-sky-500 text-white'
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
                <Text className="block text-sm text-gray-600 mb-2">服务标题 *</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="例如：张师傅搬家公司"
                    value={form.title}
                    onInput={(e) => handleInputChange('title', (e as any).detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">服务商 *</Text>
                
                {/* 服务商选择器 */}
                {providers.length > 0 && (
                  <View 
                    className="bg-gray-50 rounded-xl px-4 py-3 mb-2"
                    onClick={() => setShowProviderPicker(!showProviderPicker)}
                  >
                    <View className="flex items-center justify-between">
                      <Text className={`text-sm ${form.provider_name ? 'text-gray-900' : 'text-gray-400'}`}>
                        {form.provider_name || '从服务商库选择'}
                      </Text>
                      <ChevronDown size={18} color="#999" />
                    </View>
                  </View>
                )}

                {/* 服务商下拉列表 */}
                {showProviderPicker && providers.length > 0 && (
                  <View className="bg-white border border-gray-200 rounded-xl mb-2 max-h-48 overflow-y-auto">
                    {providers
                      .filter(p => p.service_type === form.service_type || form.service_type === 'other')
                      .map(provider => (
                        <View
                          key={provider.id}
                          className={`px-4 py-3 border-b border-gray-100 last:border-0 flex items-center justify-between ${
                            form.provider_id === provider.id ? 'bg-sky-50' : ''
                          }`}
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              provider_id: provider.id,
                              provider_name: provider.name,
                              provider_phone: provider.phone,
                            }))
                            setShowProviderPicker(false)
                          }}
                        >
                          <View className="flex-1">
                            <Text className="block text-gray-900">{provider.name}</Text>
                            <Text className="block text-xs text-gray-500 mt-1">{provider.phone}</Text>
                          </View>
                          {form.provider_id === provider.id && (
                            <Check size={18} color="#0ea5e9" />
                          )}
                        </View>
                      ))}
                  </View>
                )}

                {/* 手动输入 */}
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent text-sm"
                    placeholder="或手动输入服务商名称"
                    value={form.provider_name}
                    onInput={(e) => {
                      handleInputChange('provider_name', (e as any).detail.value)
                      setForm(prev => ({ ...prev, provider_id: undefined }))
                    }}
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
                    value={form.provider_phone}
                    onInput={(e) => handleInputChange('provider_phone', (e as any).detail.value)}
                  />
                </View>
              </View>

              <View className="flex gap-4">
                <View className="flex-1">
                  <Text className="block text-sm text-gray-600 mb-2">价格(元)</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      type="number"
                      className="w-full bg-transparent"
                      placeholder="300"
                      value={form.price}
                      onInput={(e) => handleInputChange('price', (e as any).detail.value)}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="block text-sm text-gray-600 mb-2">预约日期</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <input
                      type="date"
                      className="w-full bg-transparent text-sm"
                      value={form.scheduled_date}
                      onInput={(e) => handleInputChange('scheduled_date', (e as any).detail.value)}
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">服务地址</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="服务地址"
                    value={form.address}
                    onInput={(e) => handleInputChange('address', (e as any).detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">服务状态</Text>
                <View className="flex flex-wrap gap-2">
                  {[
                    { value: 'pending', label: '待处理' },
                    { value: 'processing', label: '进行中' },
                    { value: 'completed', label: '已完成' },
                  ].map(item => (
                    <View
                      key={item.value}
                      className={`px-4 py-2 rounded-lg ${
                        form.status === item.value
                          ? 'bg-sky-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => handleInputChange('status', item.value)}
                    >
                      <Text className={form.status === item.value ? 'text-white' : ''}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">备注</Text>
                <View className="bg-gray-50 rounded-xl p-4">
                  <Textarea
                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                    placeholder="备注信息..."
                    value={form.notes}
                    onInput={(e) => handleInputChange('notes', (e as any).detail.value)}
                    maxlength={500}
                  />
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
          className="w-full bg-sky-500 text-white rounded-xl" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Text className="text-white">{submitting ? '提交中...' : (isEdit ? '保存修改' : '创建服务')}</Text>
        </Button>
      </View>
    </View>
  )
}
