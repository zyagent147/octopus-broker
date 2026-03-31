import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Camera, X } from 'lucide-react-taro'
import { usePropertyStore } from '@/stores/property'
import { Input } from '@/components/ui/input'

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
    console.log('=== 房源表单页面加载 ===')
    console.log('id:', id)
    console.log('isEdit:', isEdit)
    
    if (id) {
      loadProperty()
    }
  }, [id])

  const loadProperty = () => {
    console.log('加载房源数据:', id)
    const property = getProperty(id!)
    console.log('房源数据:', property)
    
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
    console.log(`输入 ${field}:`, value)
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

      for (const tempFilePath of res.tempFilePaths) {
        try {
          const fs = Taro.getFileSystemManager()
          const base64 = fs.readFileSync(tempFilePath, 'base64')
          const localPath = `data:image/jpeg;base64,${base64}`
          
          setForm(prev => ({
            ...prev,
            images: [...prev.images, localPath],
          }))
        } catch (e) {
          console.error('处理图片失败:', e)
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

  const handleSubmit = () => {
    console.log('=== 提交房源 ===')
    console.log('表单数据:', form)
    
    if (!form.community.trim()) {
      Taro.showToast({ title: '请输入小区名称', icon: 'none' })
      return
    }

    if (!form.address.trim()) {
      Taro.showToast({ title: '请输入房源地址', icon: 'none' })
      return
    }

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

    console.log('准备保存:', propertyData)

    if (isEdit) {
      const result = updateProperty(id!, propertyData)
      console.log('更新结果:', result)
      Taro.showToast({ title: '更新成功', icon: 'success' })
    } else {
      const result = addProperty(propertyData)
      console.log('添加结果:', result)
      Taro.showToast({ title: '创建成功', icon: 'success' })
    }
    
    setSubmitting(false)
    setTimeout(() => Taro.navigateBack(), 1500)
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      <ScrollView scrollY className="flex-1 p-4">
        <View className="space-y-4">
          {/* 基本信息 */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-base font-bold text-gray-800 mb-4">基本信息</Text>
            
            {/* 小区名称 */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">小区名称 *</Text>
              <Input
                placeholder="例如：阳光花园"
                value={form.community}
                onInput={(e) => handleInputChange('community', e.detail.value)}
              />
            </View>

            {/* 楼栋信息 */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">楼栋信息</Text>
              <Input
                placeholder="例如：3栋1单元"
                value={form.building}
                onInput={(e) => handleInputChange('building', e.detail.value)}
              />
            </View>

            {/* 详细地址 */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">详细地址 *</Text>
              <Input
                placeholder="详细地址"
                value={form.address}
                onInput={(e) => handleInputChange('address', e.detail.value)}
              />
            </View>

            {/* 房源状态 */}
            <View>
              <Text className="text-sm text-gray-600 mb-2">房源状态</Text>
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
                        ? 'bg-sky-500'
                        : 'bg-gray-100'
                    }`}
                    onClick={() => handleInputChange('status', item.value as any)}
                  >
                    <Text className={form.status === item.value ? 'text-white' : 'text-gray-700'}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 房源参数 */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-base font-bold text-gray-800 mb-4">房源参数</Text>
            
            <View className="flex gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-2">面积(㎡)</Text>
                <Input
                  type="number"
                  placeholder="100"
                  value={form.area}
                  onInput={(e) => handleInputChange('area', e.detail.value)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-2">租金(元/月)</Text>
                <Input
                  type="number"
                  placeholder="3000"
                  value={form.price}
                  onInput={(e) => handleInputChange('price', e.detail.value)}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">户型</Text>
              <Input
                placeholder="2室1厅1卫"
                value={form.layout}
                onInput={(e) => handleInputChange('layout', e.detail.value)}
              />
            </View>

            <View>
              <Text className="text-sm text-gray-600 mb-2">备注</Text>
              <Input
                placeholder="房源备注信息"
                value={form.remark}
                onInput={(e) => handleInputChange('remark', e.detail.value)}
              />
            </View>
          </View>

          {/* 房源图片 */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-base font-bold text-gray-800 mb-4">房源图片</Text>
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
            <Text className="text-xs text-gray-400 mt-2">图片保存在本地，最多9张</Text>
          </View>
          
          {/* 提示信息 */}
          <View className="bg-blue-50 rounded-lg p-3">
            <Text className="text-xs text-blue-600">
              💡 房源数据保存在您的手机本地，不会上传到服务器。
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
        }}
      >
        <View 
          className={`h-11 rounded-lg flex items-center justify-center ${submitting ? 'bg-gray-300' : 'bg-sky-500'}`}
          onClick={submitting ? undefined : handleSubmit}
        >
          <Text className="text-white text-base font-medium">
            {submitting ? '保存中...' : (isEdit ? '保存修改' : '创建房源')}
          </Text>
        </View>
      </View>
    </View>
  )
}
