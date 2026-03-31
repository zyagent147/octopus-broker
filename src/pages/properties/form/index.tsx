import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Camera, X } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePropertyStore } from '@/stores/property'

interface PropertyForm {
  community: string
  building: string
  address: string
  layout: string
  area: string
  price: string
  status: 'available' | 'rented' | 'sold'
  images: string[]
  remark: string
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
  remark: '',
}

export default function PropertyFormPage() {
  const router = useRouter()
  const { id } = router.params
  const isEdit = Boolean(id)
  
  const [form, setForm] = useState<PropertyForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)

  // 从本地存储获取房源
  const getProperty = usePropertyStore(state => state.getProperty)
  const addProperty = usePropertyStore(state => state.addProperty)
  const updateProperty = usePropertyStore(state => state.updateProperty)

  useEffect(() => {
    if (id) {
      loadProperty()
    }
  }, [id])

  const loadProperty = () => {
    const property = getProperty(id!)
    if (property) {
      setForm({
        community: property.community || '',
        building: property.building || '',
        address: property.address || '',
        layout: property.layout || '',
        area: property.area?.toString() || '',
        price: property.price?.toString() || '',
        status: property.status || 'available',
        images: Array.isArray(property.images) ? property.images : [],
        remark: property.remark || '',
      })
    } else {
      Taro.showToast({ title: '房源不存在', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1500)
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

      Taro.showToast({ title: '处理中...', icon: 'loading' })

      // 图片转存到本地存储（Base64）
      for (const tempFilePath of res.tempFilePaths) {
        try {
          // 读取图片为 Base64
          const fs = Taro.getFileSystemManager()
          const base64 = fs.readFileSync(tempFilePath, 'base64')
          
          // 存储为本地路径（使用临时路径或转为 base64 data URL）
          const localPath = `data:image/jpeg;base64,${base64}`
          
          setForm(prev => ({
            ...prev,
            images: [...prev.images, localPath],
          }))
        } catch (e) {
          console.error('处理图片失败:', e)
          // 如果转存失败，直接使用临时路径
          setForm(prev => ({
            ...prev,
            images: [...prev.images, tempFilePath],
          }))
        }
      }

      Taro.hideToast()
      Taro.showToast({ title: '已添加', icon: 'success', duration: 1000 })
    } catch (error) {
      console.error('选择图片失败:', error)
      Taro.showToast({ title: '取消选择', icon: 'none', duration: 1000 })
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
      
      const propertyData = {
        community: form.community.trim(),
        address: form.address.trim(),
        building: form.building.trim() || null,
        layout: form.layout.trim() || null,
        area: form.area ? parseFloat(form.area) : null,
        price: form.price ? parseFloat(form.price) : null,
        status: form.status,
        images: form.images,
        remark: form.remark.trim() || null,
      }

      if (isEdit) {
        updateProperty(id!, propertyData)
        Taro.showToast({ title: '更新成功', icon: 'success' })
      } else {
        addProperty(propertyData)
        Taro.showToast({ title: '创建成功', icon: 'success' })
      }
      
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
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

              <View>
                <Text className="block text-sm text-gray-600 mb-2">备注</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="房源备注信息"
                    value={form.remark}
                    onInput={(e) => handleInputChange('remark', e.detail.value)}
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
              <Text className="block text-xs text-gray-400 mt-2">
                图片保存在本地，最多9张
              </Text>
            </CardContent>
          </Card>
          
          {/* 提示信息 */}
          <View className="p-3 bg-blue-50 rounded-lg">
            <Text className="text-xs text-blue-600">
              💡 房源数据保存在您的手机本地，不会上传到服务器。卸载应用后数据将丢失，请及时备份重要数据。
            </Text>
          </View>
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
          <Text className="text-white">{submitting ? '保存中...' : (isEdit ? '保存修改' : '创建房源')}</Text>
        </Button>
      </View>
    </View>
  )
}
