import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Camera, X } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PropertyForm {
  community: string
  building: string
  address: string
  layout: string
  area: string
  price: string
  status: 'available' | 'rented' | 'sold'
  images: string[]
}

const initialForm: PropertyForm = {
  community: '',
  building: '',
  address: '',
  layout: '',
  area: '',
  price: '',
  status: 'available',
  images: [],
}

export default function PropertyFormPage() {
  const router = useRouter()
  const { id } = router.params
  const isEdit = Boolean(id)
  const [form, setForm] = useState<PropertyForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

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
      
      const data = res.data
      setForm({
        community: data.community || '',
        building: data.building || '',
        address: data.address || '',
        layout: data.layout || '',
        area: data.area?.toString() || '',
        price: data.price?.toString() || '',
        status: data.status || 'available',
        images: Array.isArray(data.images) ? data.images : [],
      })
    } catch (error) {
      console.error('获取房源详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof PropertyForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - form.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      Taro.showToast({ title: '上传中...', icon: 'loading' })

      for (const tempFilePath of res.tempFilePaths) {
        const uploadRes = await Network.uploadFile({
          url: '/api/upload',
          filePath: tempFilePath,
          name: 'file',
        })

        console.log('上传响应:', uploadRes)

        // Network.uploadFile 返回的是解析后的 JSON 对象
        // 后端返回格式: { code: 200, msg: '上传成功', data: { key, url } }
        if (uploadRes.code === 200 && uploadRes.data?.url) {
          setForm(prev => ({
            ...prev,
            images: [...prev.images, uploadRes.data.url],
          }))
        }
      }

      Taro.hideToast()
      Taro.showToast({ title: '上传成功', icon: 'success' })
    } catch (error) {
      console.error('上传图片失败:', error)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
  }

  const handleRemoveImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    if (!form.community.trim()) {
      Taro.showToast({ title: '请输入小区名称', icon: 'none' })
      return
    }

    if (!form.address.trim()) {
      Taro.showToast({ title: '请输入房源地址', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      
      const data: Record<string, unknown> = {
        community: form.community,
        address: form.address,
        status: form.status,
      }

      if (form.building) data.building = form.building
      if (form.area) data.area = parseFloat(form.area)
      if (form.price) data.price = parseFloat(form.price)
      if (form.layout) data.layout = form.layout
      if (form.images.length > 0) data.images = form.images

      const url = isEdit ? `/api/properties/${id}` : '/api/properties'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await Network.request({ url, method, data })
      
      if (res.code === 200) {
        Taro.showToast({ title: isEdit ? '更新成功' : '创建成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.msg || '操作失败', icon: 'none' })
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
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="block text-sm text-gray-600 mb-2">小区名称 *</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="例如：阳光花园"
                    value={form.community}
                    onInput={(e) => handleInputChange('community', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">楼栋信息</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="例如：3栋1单元"
                    value={form.building}
                    onInput={(e) => handleInputChange('building', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">详细地址 *</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="详细地址"
                    value={form.address}
                    onInput={(e) => handleInputChange('address', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">房源状态</Text>
                <View className="flex flex-wrap gap-2">
                  {[
                    { value: 'available', label: '空置' },
                    { value: 'rented', label: '已租' },
                    { value: 'sold', label: '已售' },
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
            </CardContent>
          </Card>

          {/* 房源参数 */}
          <Card>
            <CardHeader>
              <CardTitle>房源参数</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View className="flex gap-4">
                <View className="flex-1">
                  <Text className="block text-sm text-gray-600 mb-2">面积(㎡)</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      type="number"
                      className="w-full bg-transparent"
                      placeholder="100"
                      value={form.area}
                      onInput={(e) => handleInputChange('area', e.detail.value)}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="block text-sm text-gray-600 mb-2">租金(元/月)</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      type="number"
                      className="w-full bg-transparent"
                      placeholder="3000"
                      value={form.price}
                      onInput={(e) => handleInputChange('price', e.detail.value)}
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">户型</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="2室1厅1卫"
                    value={form.layout}
                    onInput={(e) => handleInputChange('layout', e.detail.value)}
                  />
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 房源图片 */}
          <Card>
            <CardHeader>
              <CardTitle>房源图片</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex flex-wrap gap-2">
                {form.images.map((img, index) => (
                  <View key={index} className="relative">
                    <Image 
                      src={img} 
                      className="w-20 h-20 rounded-lg"
                      mode="aspectFill"
                    />
                    <View 
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X size={12} color="#fff" />
                    </View>
                  </View>
                ))}
                {form.images.length < 9 && (
                  <View 
                    className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center"
                    onClick={handleChooseImage}
                  >
                    <Camera size={24} color="#999" />
                  </View>
                )}
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
          <Text className="text-white">{submitting ? '提交中...' : (isEdit ? '保存修改' : '创建房源')}</Text>
        </Button>
      </View>
    </View>
  )
}
