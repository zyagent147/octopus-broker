import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'

const ServicesPage: FC = () => {
  useLoad(() => {
    console.log('生活服务页面加载')
  })

  return (
    <View className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Text className="block text-lg font-semibold text-gray-800">生活服务</Text>
      <Text className="block text-sm text-gray-500 mt-2">功能开发中...</Text>
    </View>
  )
}

export default ServicesPage
