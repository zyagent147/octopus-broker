import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Camera, X } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PropertyForm {
  name: string
  address: string
  property_type: 'apartment' | 'house' | 'villa' | 'shop'
  area: string
  price: string
  layout: string
  floor: string
  orientation: string
  decoration: string
  status: 'available' | 'rented' | 'sold'
  cover_image: string
  images: string[]
  tags: string[]
  description: string
  contact_name: string
  contact_phone: string
}

const initialForm: PropertyForm = {
  name: '',
  address: '',
  property_type: 'apartment',
  area: '',
  price: '',
  layout: '',
  floor: '',
  orientation: '',
  decoration: '',
  status: 'available',
  cover_image: '',
  images: [],
  tags: [],
  description: '',
  contact_name: '',
  contact_phone: '',
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
      
      const data = res.data.data
      setForm({
        name: data.name || '',
        address: data.address || '',
        property_type: data.property_type || 'apartment',
        area: data.area?.toString() || '',
        price: data.price?.toString() || '',
        layout: data.layout || '',
        floor: data.floor || '',
        orientation: data.orientation || '',
        decoration: data.decoration || '',
        status: data.status || 'available',
        cover_image: data.cover_image || '',
        images: data.images || [],
        tags: data.tags || [],
        description: data.description || '',
        contact_name: data.contact_name || '',
        contact_phone: data.contact_phone || '',
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

  const handleChooseImage = async (isCover: boolean) => {
    try {
      const res = await Taro.chooseImage({
        count: isCover ? 1 : 9,
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

        const data = uploadRes.data
        if (data.code === 200 && data.data?.url) {
          if (isCover) {
            handleInputChange('cover_image', data.data.url)
          } else {
            setForm(prev => ({
              ...prev,
              images: [...prev.images, data.data.url],
            }))
          }
        }
      }

      Taro.hideToast()
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
    if (!form.name.trim()) {
      Taro.showToast({ title: '请输入房源名称', icon: 'none' })
      return
    }

    if (!form.address.trim()) {
      Taro.showToast({ title: '请输入房源地址', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      
      const data: any = {
        name: form.name,
        address: form.address,
        property_type: form.property_type,
        status: form.status,
      }

      if (form.area) data.area = parseFloat(form.area)
      if (form.price) data.price = parseFloat(form.price)
      if (form.layout) data.layout = form.layout
      if (form.floor) data.floor = form.floor
      if (form.orientation) data.orientation = form.orientation
      if (form.decoration) data.decoration = form.decoration
      if (form.cover_image) data.cover_image = form.cover_image
      if (form.images.length > 0) data.images = form.images
      if (form.tags.length > 0) data.tags = form.tags
      if (form.description) data.description = form.description
      if (form.contact_name) data.contact_name = form.contact_name
      if (form.contact_phone) data.contact_phone = form.contact_phone

      const url = isEdit ? `/api/properties/${id}` : '/api/properties'
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
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="block text-sm text-gray-600 mb-2">房源名称 *</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="例如：阳光花园3栋1单元201室"
                    value={form.name}
                    onInput={(e) => handleInputChange('name', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">房源地址 *</Text>
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
                <Text className="block text-sm text-gray-600 mb-2">房源类型</Text>
                <View className="flex flex-wrap gap-2">
                  {[
                    { value: 'apartment', label: '公寓' },
                    { value: 'house', label: '住宅' },
                    { value: 'villa', label: '别墅' },
                    { value: 'shop', label: '商铺' },
                  ].map(item => (
                    <View
                      key={item.value}
                      className={`px-4 py-2 rounded-lg ${
                        form.property_type === item.value
                          ? 'bg-sky-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => handleInputChange('property_type', item.value)}
                    >
                      <Text className={form.property_type === item.value ? 'text-white' : ''}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
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

              <View className="flex gap-4">
                <View className="flex-1">
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
                <View className="flex-1">
                  <Text className="block text-sm text-gray-600 mb-2">楼层</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="中层/共18层"
                      value={form.floor}
                      onInput={(e) => handleInputChange('floor', e.detail.value)}
                    />
                  </View>
                </View>
              </View>

              <View className="flex gap-4">
                <View className="flex-1">
                  <Text className="block text-sm text-gray-600 mb-2">朝向</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="南北通透"
                      value={form.orientation}
                      onInput={(e) => handleInputChange('orientation', e.detail.value)}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="block text-sm text-gray-600 mb-2">装修</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="精装修"
                      value={form.decoration}
                      onInput={(e) => handleInputChange('decoration', e.detail.value)}
                    />
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 房源图片 */}
          <Card>
            <CardHeader>
              <CardTitle>房源图片</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="block text-sm text-gray-600 mb-2">封面图片</Text>
                {form.cover_image ? (
                  <View className="relative inline-block">
                    <Image 
                      src={form.cover_image} 
                      className="w-24 h-24 rounded-lg"
                      mode="aspectFill"
                    />
                    <View 
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                      onClick={() => handleInputChange('cover_image', '')}
                    >
                      <X size={14} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <View 
                    className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center"
                    onClick={() => handleChooseImage(true)}
                  >
                    <Camera size={24} color="#999" />
                  </View>
                )}
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">房源照片</Text>
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
                      onClick={() => handleChooseImage(false)}
                    >
                      <Camera size={24} color="#999" />
                    </View>
                  )}
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 其他信息 */}
          <Card>
            <CardHeader>
              <CardTitle>其他信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="block text-sm text-gray-600 mb-2">房源描述</Text>
                <View className="bg-gray-50 rounded-xl p-4">
                  <Textarea
                    style={{ width: '100%', minHeight: '100px', backgroundColor: 'transparent' }}
                    placeholder="详细描述房源特点、配套设施等..."
                    value={form.description}
                    onInput={(e) => handleInputChange('description', e.detail.value)}
                    maxlength={1000}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">联系人</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="房东/中介姓名"
                    value={form.contact_name}
                    onInput={(e) => handleInputChange('contact_name', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">联系电话</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    type="number"
                    className="w-full bg-transparent"
                    placeholder="联系电话"
                    value={form.contact_phone}
                    onInput={(e) => handleInputChange('contact_phone', e.detail.value)}
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
          <Text className="text-white">{submitting ? '提交中...' : (isEdit ? '保存修改' : '创建房源')}</Text>
        </Button>
      </View>
    </View>
  )
}
