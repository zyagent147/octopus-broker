import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { 
  Wifi, 
  Sparkles, 
  Truck, 
  Building2, 
  Wrench, 
  Copy, 
  X,
  MessageCircle
} from 'lucide-react-taro'
import { Button } from '@/components/ui/button'

// 服务类型配置
const serviceTypes = [
  {
    id: 'broadband',
    name: '宽带服务',
    icon: Wifi,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    description: '专业宽带安装、移机、提速服务',
  },
  {
    id: 'cleaning',
    name: '保洁服务',
    icon: Sparkles,
    color: '#10b981',
    bgColor: '#ecfdf5',
    description: '专业保洁、深度清洁、家电清洗',
  },
  {
    id: 'moving',
    name: '搬家服务',
    icon: Truck,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    description: '专业搬家、打包、搬运一条龙',
  },
  {
    id: 'management',
    name: '毛坯托管',
    icon: Building2,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    description: '房屋托管、装修出租一体化',
  },
  {
    id: 'repair',
    name: '维修服务',
    icon: Wrench,
    color: '#ef4444',
    bgColor: '#fef2f2',
    description: '水电维修、家电维修、管道疏通',
  },
]

// 客户经理微信
const MANAGER_WECHAT = '18986182147'

export default function ServicesPage() {
  const [showContact, setShowContact] = useState(false)
  const [selectedService, setSelectedService] = useState<string>('')

  // 点击服务模块
  const handleServiceClick = (serviceId: string) => {
    setSelectedService(serviceId)
    setShowContact(true)
  }

  // 复制微信号
  const handleCopyWechat = () => {
    Taro.setClipboardData({
      data: MANAGER_WECHAT,
      success: () => {
        Taro.showToast({ 
          title: '微信号已复制', 
          icon: 'success' 
        })
      }
    })
  }

  // 关闭弹窗
  const handleCloseModal = () => {
    setShowContact(false)
    setSelectedService('')
  }

  const selectedServiceInfo = serviceTypes.find(s => s.id === selectedService)

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* 头部 */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="block text-xl font-bold text-gray-800">服务市场</Text>
        <Text className="block text-sm text-gray-500 mt-1">为您提供一站式生活服务</Text>
      </View>

      {/* 服务列表 */}
      <ScrollView scrollY className="flex-1 px-4 py-4">
        <View className="space-y-4">
          {serviceTypes.map((service) => {
            const IconComponent = service.icon
            return (
              <View
                key={service.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
                onClick={() => handleServiceClick(service.id)}
              >
                <View className="flex items-center p-5">
                  {/* 图标区域 */}
                  <View 
                    className="w-16 h-16 rounded-xl flex items-center justify-center mr-4"
                    style={{ backgroundColor: service.bgColor }}
                  >
                    <IconComponent size={32} color={service.color} />
                  </View>
                  
                  {/* 文字区域 */}
                  <View className="flex-1">
                    <Text className="block text-lg font-bold text-gray-800">
                      {service.name}
                    </Text>
                    <Text className="block text-sm text-gray-500 mt-1">
                      {service.description}
                    </Text>
                  </View>
                  
                  {/* 箭头 */}
                  <View className="ml-2">
                    <Text className="text-gray-300 text-xl">›</Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>

        {/* 底部提示 */}
        <View className="mt-6 mb-4">
          <View className="bg-blue-50 rounded-xl p-4">
            <View className="flex items-center gap-2">
              <MessageCircle size={20} color="#3b82f6" />
              <Text className="text-sm text-blue-600">
                点击服务板块，添加客户经理微信获取详细报价
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 联系弹窗 */}
      {showContact && (
        <View 
          className="fixed inset-0 z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCloseModal}
        >
          <View 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <View className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-800">
                {selectedServiceInfo?.name || '联系客服'}
              </Text>
              <View 
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                onClick={handleCloseModal}
              >
                <X size={18} color="#666" />
              </View>
            </View>

            {/* 弹窗内容 */}
            <View className="px-5 py-6">
              {/* 服务图标 */}
              {selectedServiceInfo && (
                <View className="flex flex-col items-center mb-6">
                  <View 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: selectedServiceInfo.bgColor }}
                  >
                    <selectedServiceInfo.icon size={40} color={selectedServiceInfo.color} />
                  </View>
                  <Text className="text-base text-gray-600">
                    {selectedServiceInfo.description}
                  </Text>
                </View>
              )}

              {/* 微信号展示 */}
              <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                <Text className="block text-sm text-gray-500 mb-2 text-center">
                  添加客户经理微信
                </Text>
                <View className="flex items-center justify-center gap-3">
                  <Text className="text-2xl font-bold text-gray-800">
                    {MANAGER_WECHAT}
                  </Text>
                </View>
              </View>

              {/* 复制按钮 */}
              <Button
                className="w-full h-12 bg-sky-500 rounded-xl"
                onClick={handleCopyWechat}
              >
                <Copy size={20} color="#fff" />
                <Text className="text-white font-medium ml-2">一键复制微信号</Text>
              </Button>

              {/* 提示 */}
              <Text className="block text-xs text-gray-400 text-center mt-4">
                复制微信号后，在微信中搜索添加即可
              </Text>
            </View>

            {/* 安全区域底部 */}
            <View className="h-8" />
          </View>
        </View>
      )}
    </View>
  )
}
